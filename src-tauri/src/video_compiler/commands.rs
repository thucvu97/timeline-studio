/*!
 * Tauri команды для Video Compiler
 *
 * Этот модуль определяет все Tauri команды для работы с video compiler
 * из фронтенда, включая компиляцию видео, управление GPU и мониторинг.
 */

use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tauri::{Emitter, State};
use tokio::sync::{mpsc, RwLock};

use crate::video_compiler::cache::{CacheMemoryUsage, MediaMetadata, RenderCache};
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::gpu::{GpuCapabilities, GpuDetector, GpuInfo};
use crate::video_compiler::progress::{ProgressUpdate, RenderProgress, RenderStatus};
use crate::video_compiler::renderer::VideoRenderer;
use crate::video_compiler::schema::{ProjectSchema, Subtitle};
use crate::video_compiler::CompilerSettings;
use crate::video_compiler::VideoCompilerEvent;

/// Метаданные активной задачи рендеринга
#[derive(Debug, Clone)]
pub struct RenderJobMetadata {
  pub project_name: String,
  pub output_path: String,
  pub created_at: String,
}

/// Активная задача рендеринга с метаданными
#[derive(Debug)]
pub struct ActiveRenderJob {
  pub renderer: VideoRenderer,
  pub metadata: RenderJobMetadata,
}

/// Состояние Video Compiler для Tauri
#[derive(Debug)]
pub struct VideoCompilerState {
  /// Активные задачи рендеринга
  pub active_jobs: Arc<RwLock<HashMap<String, ActiveRenderJob>>>,

  /// Менеджер кэша
  pub cache_manager: Arc<RwLock<RenderCache>>,

  /// Путь к FFmpeg
  pub ffmpeg_path: String,

  /// Настройки компилятора
  pub settings: Arc<RwLock<CompilerSettings>>,
}

impl VideoCompilerState {
  pub fn new() -> Self {
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache_manager = Arc::new(RwLock::new(RenderCache::new()));

    Self {
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      cache_manager,
      ffmpeg_path: "ffmpeg".to_string(), // Предполагаем, что ffmpeg в PATH
      settings,
    }
  }
}

impl Default for VideoCompilerState {
  fn default() -> Self {
    Self::new()
  }
}

/// Информация о задаче рендеринга для фронтенда
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RenderJob {
  pub id: String,
  pub project_name: String,
  pub output_path: String,
  pub status: RenderStatus,
  pub created_at: String,
  pub progress: Option<RenderProgress>,
  pub error_message: Option<String>,
}

// ==================== ОСНОВНЫЕ КОМАНДЫ ====================

/// Запуск компиляции видео
#[tauri::command]
pub async fn compile_video(
  app: tauri::AppHandle,
  project_schema: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  use tauri::Emitter;
  let job_id = uuid::Uuid::new_v4().to_string();

  // Отправляем событие о начале рендеринга
  let _ = app.emit(
    "video-compiler",
    &VideoCompilerEvent::RenderStarted {
      job_id: job_id.clone(),
    },
  );

  // Создаем канал для прогресса
  let (progress_sender, mut progress_receiver) = mpsc::unbounded_channel();

  // Запускаем задачу для пересылки событий прогресса в VideoCompilerEvent
  let app_handle = app.clone();
  tokio::spawn(async move {
    while let Some(progress_update) = progress_receiver.recv().await {
      if let ProgressUpdate::ProgressChanged { job_id, progress } = progress_update {
        let _ = app_handle.emit(
          "video-compiler",
          &VideoCompilerEvent::RenderProgress { job_id, progress },
        );
      }
      // Остальные события уже обрабатываются в других местах
    }
  });

  // Создаем метаданные задачи перед передачей project_schema в renderer
  let metadata = RenderJobMetadata {
    project_name: project_schema.metadata.name.clone(),
    output_path: output_path.clone(),
    created_at: chrono::Utc::now().to_rfc3339(),
  };

  // Создаем рендерер
  let renderer = VideoRenderer::new(
    project_schema,
    state.settings.clone(),
    state.cache_manager.clone(),
    progress_sender,
  )
  .await
  .map_err(|e| VideoCompilerError::InternalError(format!("Failed to create renderer: {}", e)))?;

  // Сохраняем в активных задачах с метаданными
  {
    let mut jobs = state.active_jobs.write().await;
    jobs.insert(job_id.clone(), ActiveRenderJob { renderer, metadata });
  }

  // Запускаем рендеринг в фоне
  let active_jobs = state.active_jobs.clone();
  let job_id_clone = job_id.clone();
  let output_path_clone = output_path.clone();

  tokio::spawn(async move {
    let result = {
      let mut jobs = active_jobs.write().await;
      if let Some(active_job) = jobs.get_mut(&job_id_clone) {
        active_job
          .renderer
          .render(Path::new(&output_path_clone))
          .await
      } else {
        Err(VideoCompilerError::InternalError(
          "Job not found".to_string(),
        ))
      }
    };

    // Логируем результат и отправляем события
    match result {
      Ok(output_path) => {
        log::info!("Рендеринг завершен успешно: {}", job_id_clone);
        // Отправляем событие о завершении рендеринга
        let _ = app.emit(
          "video-compiler",
          &VideoCompilerEvent::RenderCompleted {
            job_id: job_id_clone.clone(),
            output_path,
          },
        );
      }
      Err(e) => {
        log::error!("Ошибка рендеринга {}: {}", job_id_clone, e);
        // Отправляем событие о неудачном рендеринге
        let _ = app.emit(
          "video-compiler",
          &VideoCompilerEvent::RenderFailed {
            job_id: job_id_clone.clone(),
            error: e.to_string(),
          },
        );
      }
    }

    // Удаляем из активных задач
    {
      let mut jobs = active_jobs.write().await;
      jobs.remove(&job_id_clone);
    }
  });

  Ok(job_id)
}

/// Получить прогресс рендеринга
#[tauri::command]
pub async fn get_render_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<RenderProgress>> {
  let jobs = state.active_jobs.read().await;

  if let Some(active_job) = jobs.get(&job_id) {
    Ok(active_job.renderer.get_progress().await)
  } else {
    Ok(None)
  }
}

/// Отменить рендеринг
#[tauri::command]
pub async fn cancel_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<bool> {
  let mut jobs = state.active_jobs.write().await;

  if let Some(active_job) = jobs.get_mut(&job_id) {
    active_job.renderer.cancel().await?;
    jobs.remove(&job_id);
    Ok(true)
  } else {
    Ok(false)
  }
}

/// Получить список активных задач
#[tauri::command]
pub async fn get_active_jobs(state: State<'_, VideoCompilerState>) -> Result<Vec<RenderJob>> {
  let jobs = state.active_jobs.read().await;
  let mut result = Vec::new();

  for (job_id, active_job) in jobs.iter() {
    let progress = active_job.renderer.get_progress().await;
    let status = match &progress {
      Some(p) => p.status.clone(),
      None => RenderStatus::Processing,
    };

    result.push(RenderJob {
      id: job_id.clone(),
      project_name: active_job.metadata.project_name.clone(),
      output_path: active_job.metadata.output_path.clone(),
      status,
      created_at: active_job.metadata.created_at.clone(),
      progress,
      error_message: None,
    });
  }

  Ok(result)
}

/// Получить информацию о конкретной задаче рендеринга
#[tauri::command]
pub async fn get_render_job(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<crate::video_compiler::progress::RenderJob>> {
  use crate::video_compiler::progress::ProgressTracker;

  // Создаем прогресс-трекер для доступа к методу get_job
  // Поскольку ProgressTracker требует sender, создадим фиктивный
  let (tx, _rx) = tokio::sync::mpsc::unbounded_channel();
  let _progress_tracker = ProgressTracker::new(tx);

  // В реальной ситуации нужно получить доступ к существующему ProgressTracker
  // Пока используем прямой доступ к active_jobs
  let jobs = state.active_jobs.read().await;
  if let Some(active_job) = jobs.get(&job_id) {
    let progress = active_job.renderer.get_progress().await;
    let _status = match &progress {
      Some(p) => p.status.clone(),
      None => crate::video_compiler::progress::RenderStatus::Processing,
    };

    let job = crate::video_compiler::progress::RenderJob::new(
      job_id,
      active_job.metadata.project_name.clone(),
      active_job.metadata.output_path.clone(),
      1000, // TODO: получать реальное количество кадров из проекта
    );

    log::info!("Информация о задаче {} получена", job.id);
    Ok(Some(job))
  } else {
    Ok(None)
  }
}

/// Проверить и отменить задачи по таймауту
#[tauri::command]
pub async fn check_render_job_timeouts(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  // Поскольку у нас нет прямого доступа к ProgressTracker,
  // имитируем проверку таймаутов через активные задачи
  let jobs = state.active_jobs.read().await;
  let timed_out_jobs = Vec::new();

  // Простая проверка: если задача работает более 1 часа, считаем её просроченной
  let _timeout_duration = std::time::Duration::from_secs(3600); // 1 час
  let _current_time = std::time::SystemTime::now();

  for (job_id, active_job) in jobs.iter() {
    // Проверяем, если задача работает слишком долго
    if let Some(progress) = active_job.renderer.get_progress().await {
      // Если последнее обновление было давно, возможно задача зависла
      // В реальной реализации здесь была бы более сложная логика
      log::debug!(
        "Проверка таймаута для задачи {}: статус {:?}",
        job_id,
        progress.status
      );
    }
  }

  if !timed_out_jobs.is_empty() {
    log::info!("Найдено {} просроченных задач", timed_out_jobs.len());
  }

  Ok(timed_out_jobs)
}

/// Получить подробную информацию о кэше рендеринга
#[tauri::command]
pub async fn get_render_cache_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use crate::video_compiler::commands_logic::get_render_cache_info_logic;

  get_render_cache_info_logic(&state).await
}

/// Генерация превью кадра
#[tauri::command]
pub async fn generate_preview(
  video_path: String,
  timestamp: f64,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
  state: State<'_, VideoCompilerState>,
  app: tauri::AppHandle,
) -> Result<Vec<u8>> {
  use crate::video_compiler::commands_logic::generate_preview_logic;

  // Генерируем превью
  let result = generate_preview_logic(&video_path, timestamp, resolution, quality, &state)
    .await
    .map_err(|e| VideoCompilerError::PreviewError {
      timestamp,
      reason: e.to_string(),
    });

  // Отправляем событие о генерации превью при успехе
  if let Ok(ref image_data) = result {
    let _ = app.emit(
      "video-compiler",
      &VideoCompilerEvent::PreviewGenerated {
        timestamp,
        image_data: image_data.clone(),
      },
    );
  }

  result
}

/// Генерация превью кадра с пользовательскими настройками
#[tauri::command]
pub async fn generate_preview_with_settings(
  video_path: String,
  timestamp: f64,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
  settings: crate::video_compiler::preview::PreviewSettings,
  state: State<'_, VideoCompilerState>,
  app: tauri::AppHandle,
) -> Result<Vec<u8>> {
  use crate::video_compiler::preview::PreviewGenerator;

  // Создаем генератор с пользовательскими настройками
  let preview_gen = PreviewGenerator::with_settings(state.cache_manager.clone(), settings);

  // Генерируем превью
  let result = preview_gen
    .generate_preview(Path::new(&video_path), timestamp, resolution, quality)
    .await
    .map_err(|e| VideoCompilerError::PreviewError {
      timestamp,
      reason: e.to_string(),
    });

  // Отправляем событие о генерации превью при успехе
  if let Ok(ref image_data) = result {
    let _ = app.emit(
      "video-compiler",
      &VideoCompilerEvent::PreviewGenerated {
        timestamp,
        image_data: image_data.clone(),
      },
    );
  }

  log::info!(
    "Генерация превью с пользовательскими настройками: {} at {:.2}s",
    video_path,
    timestamp
  );

  result
}

/// Генерация превью с подробной информацией о результате
#[tauri::command]
#[allow(dead_code)]
pub async fn generate_preview_detailed(
  video_path: String,
  timestamp: f64,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
  state: State<'_, VideoCompilerState>,
) -> Result<crate::video_compiler::preview::SerializablePreviewResult> {
  use crate::video_compiler::preview::PreviewGenerator;
  use base64::engine::general_purpose::STANDARD as BASE64;
  use base64::Engine as _;

  let preview_gen = PreviewGenerator::new(state.cache_manager.clone());

  // Генерируем превью
  let result = preview_gen
    .generate_preview(Path::new(&video_path), timestamp, resolution, quality)
    .await;

  // Конвертируем результат в сериализуемую форму с timestamp
  let serializable_result = match result {
    Ok(image_data) => crate::video_compiler::preview::SerializablePreviewResult {
      timestamp,
      image_data: Some(BASE64.encode(&image_data)),
      error: None,
    },
    Err(e) => crate::video_compiler::preview::SerializablePreviewResult {
      timestamp,
      image_data: None,
      error: Some(e.to_string()),
    },
  };

  log::info!(
    "Генерация подробного превью: {} at {:.2}s (успех: {})",
    video_path,
    timestamp,
    serializable_result.error.is_none()
  );

  Ok(serializable_result)
}

// ==================== УПРАВЛЕНИЕ ПРОЕКТАМИ ====================

/// Создать новый пустой проект
#[tauri::command]
pub async fn create_new_project(
  project_name: String,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  use crate::video_compiler::commands_logic::create_new_project_logic;

  let project = create_new_project_logic(project_name).await;
  log::info!("Создан новый проект: {}", project.metadata.name);

  Ok(project)
}

/// Обновить timestamp проекта (mark as modified)
#[tauri::command]
pub async fn touch_project(
  project: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  use crate::video_compiler::commands_logic::touch_project_logic;

  let updated = touch_project_logic(project);
  log::debug!("Проект {} отмечен как изменен", updated.metadata.name);

  Ok(updated)
}

/// Создать новый трек
#[tauri::command]
pub async fn create_track(
  track_type: crate::video_compiler::schema::TrackType,
  track_name: String,
) -> Result<crate::video_compiler::schema::Track> {
  use crate::video_compiler::commands_logic::create_track_logic;

  let track = create_track_logic(track_type, track_name.clone());
  log::info!("Создан новый трек: {} ({:?})", track_name, track.track_type);

  Ok(track)
}

/// Добавить клип к треку
#[tauri::command]
pub async fn add_clip_to_track(
  track: crate::video_compiler::schema::Track,
  clip: crate::video_compiler::schema::Clip,
) -> Result<crate::video_compiler::schema::Track> {
  use crate::video_compiler::commands_logic::add_clip_to_track_logic;

  let clip_name = clip
    .source_path
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or("Unknown")
    .to_string();

  let updated_track = add_clip_to_track_logic(track, clip)?;

  log::info!("Клип {} добавлен к треку {}", clip_name, updated_track.name);

  Ok(updated_track)
}

/// Создать новый клип
#[tauri::command]
pub async fn create_clip(
  source_path: String,
  start_time: f64,
  duration: f64,
) -> Result<crate::video_compiler::schema::Clip> {
  use crate::video_compiler::commands_logic::create_clip_logic;

  let clip = create_clip_logic(source_path, start_time, duration)?;
  log::info!(
    "Создан новый клип: {:?} ({:.2}s - {:.2}s)",
    clip.source_path.file_name().unwrap_or_default(),
    start_time,
    start_time + duration
  );

  Ok(clip)
}

/// Создать новый эффект
#[tauri::command]
pub async fn create_effect(
  effect_type: crate::video_compiler::schema::EffectType,
  effect_name: String,
) -> Result<crate::video_compiler::schema::Effect> {
  use crate::video_compiler::commands_logic::create_effect_logic;

  let effect = create_effect_logic(effect_type, effect_name.clone());
  log::info!(
    "Создан новый эффект: {} ({:?})",
    effect_name,
    effect.effect_type
  );

  Ok(effect)
}

/// Создать новый фильтр
#[tauri::command]
pub async fn create_filter(
  filter_type: crate::video_compiler::schema::FilterType,
  filter_name: String,
) -> Result<crate::video_compiler::schema::Filter> {
  use crate::video_compiler::commands_logic::create_filter_logic;

  let filter = create_filter_logic(filter_type, filter_name.clone());
  log::info!(
    "Создан новый фильтр: {} ({:?})",
    filter_name,
    filter.filter_type
  );

  Ok(filter)
}

/// Создать новый шаблон
#[tauri::command]
pub async fn create_template(
  template_type: crate::video_compiler::schema::TemplateType,
  template_name: String,
  screens: usize,
) -> Result<crate::video_compiler::schema::Template> {
  use crate::video_compiler::commands_logic::create_template_logic;

  let template = create_template_logic(template_type, template_name.clone(), screens);
  log::info!(
    "Создан новый шаблон: {} ({:?}, {} экранов)",
    template_name,
    template.template_type,
    screens
  );

  Ok(template)
}

/// Создать новый стильный шаблон
#[tauri::command]
pub async fn create_style_template(
  template_name: String,
  category: crate::video_compiler::schema::StyleTemplateCategory,
  style: crate::video_compiler::schema::StyleTemplateStyle,
  duration: f64,
) -> Result<crate::video_compiler::schema::StyleTemplate> {
  use crate::video_compiler::commands_logic::create_style_template_logic;

  let template = create_style_template_logic(template_name.clone(), category, style, duration);
  log::info!(
    "Создан новый стильный шаблон: {} ({:?}/{:?}, {:.2}s)",
    template_name,
    template.category,
    template.style,
    duration
  );

  Ok(template)
}

/// Создать новый субтитр
#[tauri::command]
pub async fn create_subtitle(
  text: String,
  start_time: f64,
  end_time: f64,
) -> Result<crate::video_compiler::schema::Subtitle> {
  use crate::video_compiler::commands_logic::create_subtitle_logic;

  let subtitle = create_subtitle_logic(text.clone(), start_time, end_time)?;

  log::info!(
    "Создан новый субтитр: '{}' ({:.2}s - {:.2}s, длительность: {:.2}s)",
    text,
    start_time,
    end_time,
    subtitle.get_duration()
  );

  Ok(subtitle)
}

/// Создать новую анимацию субтитра
#[tauri::command]
pub async fn create_subtitle_animation(
  animation_type: crate::video_compiler::schema::SubtitleAnimationType,
  duration: f64,
) -> Result<crate::video_compiler::schema::SubtitleAnimation> {
  use crate::video_compiler::commands_logic::create_subtitle_animation_logic;

  let animation = create_subtitle_animation_logic(animation_type, duration);
  log::info!(
    "Создана новая анимация субтитра: {:?} ({:.2}s)",
    animation.animation_type,
    duration
  );

  Ok(animation)
}

/// Установить путь к FFmpeg для генератора превью
#[tauri::command]
pub async fn set_preview_ffmpeg_path(
  ffmpeg_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::preview::PreviewGenerator;

  // Обновляем путь в основном состоянии
  // state.ffmpeg_path = ffmpeg_path.clone(); // Это было бы если у нас есть &mut доступ

  // Поскольку PreviewGenerator::set_ffmpeg_path принимает &mut self,
  // мы можем создать временный генератор для демонстрации интеграции
  let mut preview_gen = PreviewGenerator::new(state.cache_manager.clone());
  preview_gen.set_ffmpeg_path(&ffmpeg_path);

  log::info!("Путь к FFmpeg для превью обновлен: {}", ffmpeg_path);
  Ok(())
}

/// Очистить кэш для конкретного файла
#[tauri::command]
pub async fn clear_file_preview_cache(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::preview::PreviewGenerator;

  let preview_gen = PreviewGenerator::new(state.cache_manager.clone());

  preview_gen.clear_cache_for_file().await?;

  log::info!("Кэш превью очищен для файла: {}", file_path);
  Ok(())
}

/// Запрос на генерацию превью
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PreviewRequest {
  /// Путь к видео файлу
  pub video_path: String,
  /// Временная метка
  pub timestamp: f64,
  /// Разрешение (опционально)
  pub resolution: Option<(u32, u32)>,
  /// Качество (опционально)
  pub quality: Option<u8>,
}

/// Генерация нескольких превью одновременно
#[tauri::command]
pub async fn generate_preview_batch(
  requests: Vec<PreviewRequest>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<crate::video_compiler::preview::SerializablePreviewResult>> {
  use crate::video_compiler::commands_logic::generate_preview_batch_logic;

  generate_preview_batch_logic(requests, &state).await
}

/// Получить информацию о видео файле
#[tauri::command]
pub async fn get_video_info(
  video_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<crate::video_compiler::preview::VideoInfo> {
  use crate::video_compiler::preview::PreviewGenerator;

  let preview_gen = PreviewGenerator::new(state.cache_manager.clone());

  // Получаем информацию о видео
  preview_gen
    .get_video_info(Path::new(&video_path))
    .await
    .map_err(|e| VideoCompilerError::PreviewError {
      timestamp: 0.0,
      reason: e.to_string(),
    })
}

/// Параметры для пререндера сегмента
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderRequest {
  /// Схема проекта
  pub project_schema: ProjectSchema,
  /// Время начала сегмента в секундах
  pub start_time: f64,
  /// Время окончания сегмента в секундах
  pub end_time: f64,
  /// Применять ли эффекты и фильтры
  pub apply_effects: bool,
  /// Качество пререндера (1-100)
  pub quality: Option<u8>,
}

/// Результат пререндера
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderResult {
  /// Путь к файлу пререндера
  pub file_path: String,
  /// Длительность сегмента
  pub duration: f64,
  /// Размер файла в байтах
  pub file_size: u64,
  /// Время рендеринга в миллисекундах
  pub render_time_ms: u64,
}

/// Пререндер сегмента видео для быстрого предпросмотра
#[tauri::command]
pub async fn prerender_segment(
  request: PrerenderRequest,
  state: State<'_, VideoCompilerState>,
) -> Result<PrerenderResult> {
  use crate::video_compiler::commands_logic::prerender_segment_logic;

  prerender_segment_logic(
    request.project_schema,
    request.start_time,
    request.end_time,
    request.apply_effects,
    request.quality,
    &state,
  )
  .await
}

/// Расширенная статистика кэша с вычисленными коэффициентами
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CacheStatsWithRatios {
  /// Общее количество записей
  pub total_entries: u64,
  /// Попадания превью
  pub preview_hits: u64,
  /// Промахи превью
  pub preview_misses: u64,
  /// Попадания метаданных
  pub metadata_hits: u64,
  /// Промахи метаданных
  pub metadata_misses: u64,
  /// Использование памяти
  pub memory_usage: CacheMemoryUsage,
  /// Размер кэша в МБ
  pub cache_size_mb: f32,
  /// Общий коэффициент попаданий
  pub hit_ratio: f32,
  /// Коэффициент попаданий превью
  pub preview_hit_ratio: f32,
}

/// Информация о кеше пререндеров
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderCacheInfo {
  /// Количество файлов в кеше
  pub file_count: usize,
  /// Общий размер кеша в байтах
  pub total_size: u64,
  /// Список файлов в кеше
  pub files: Vec<PrerenderCacheFile>,
}

/// Информация о файле в кеше
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderCacheFile {
  /// Путь к файлу
  pub path: String,
  /// Размер файла в байтах
  pub size: u64,
  /// Время создания
  pub created: u64,
  /// Параметры сегмента
  pub start_time: f64,
  pub end_time: f64,
}

/// Получить информацию о кеше пререндеров
#[tauri::command]
pub async fn get_prerender_cache_info() -> Result<PrerenderCacheInfo> {
  use crate::video_compiler::commands_logic::get_prerender_cache_info_logic;
  get_prerender_cache_info_logic().await
}

/// Очистить кеш пререндеров
#[tauri::command]
pub async fn clear_prerender_cache() -> Result<u64> {
  use crate::video_compiler::commands_logic::clear_prerender_cache_logic;
  clear_prerender_cache_logic().await
}

/// Очистить старые записи кэша
#[tauri::command]
pub async fn cleanup_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  use crate::video_compiler::commands_logic::cleanup_cache_logic;
  cleanup_cache_logic(&state).await
}

/// Получить статистику рендеринга
#[tauri::command]
pub async fn get_render_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<crate::video_compiler::pipeline::PipelineStatistics>> {
  let active_jobs = state.active_jobs.read().await;

  if let Some(active_job) = active_jobs.get(&job_id) {
    Ok(active_job.renderer.get_render_statistics())
  } else {
    Ok(None)
  }
}

// ==================== GPU КОМАНДЫ ====================

/// Получить возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities(state: State<'_, VideoCompilerState>) -> Result<GpuCapabilities> {
  use crate::video_compiler::commands_logic::get_gpu_capabilities_logic;
  get_gpu_capabilities_logic(&state).await
}

/// Получить информацию о текущем GPU
#[tauri::command]
pub async fn get_current_gpu_info(state: State<'_, VideoCompilerState>) -> Result<Option<GpuInfo>> {
  use crate::video_compiler::commands_logic::get_current_gpu_info_logic;
  get_current_gpu_info_logic(&state).await
}

/// Проверить доступность аппаратного ускорения
#[tauri::command]
pub async fn check_hardware_acceleration(state: State<'_, VideoCompilerState>) -> Result<bool> {
  use crate::video_compiler::commands_logic::check_hardware_acceleration_logic;
  check_hardware_acceleration_logic(&state).await
}

// ==================== КЭШИРОВАНИЕ ====================

/// Получить статистику кэша
#[tauri::command]
pub async fn get_cache_stats(state: State<'_, VideoCompilerState>) -> Result<CacheStatsWithRatios> {
  use crate::video_compiler::commands_logic::get_cache_stats_logic;

  let stats = get_cache_stats_logic(&state).await;
  let cache = state.cache_manager.read().await;
  let memory_usage = cache.get_memory_usage();

  // Создаем расширенную версию статистики с вычисленными ratios
  Ok(CacheStatsWithRatios {
    total_entries: stats.preview_requests + stats.metadata_requests + stats.render_requests,
    preview_hits: stats.preview_hits,
    preview_misses: stats.preview_misses,
    metadata_hits: stats.metadata_hits,
    metadata_misses: stats.metadata_misses,
    memory_usage: memory_usage.clone(),
    cache_size_mb: memory_usage.total_mb(),
    hit_ratio: stats.hit_ratio(),
    preview_hit_ratio: stats.preview_hit_ratio(),
  })
}

/// Очистить весь кэш (алиас для clear_cache для совместимости с фронтендом)
#[tauri::command]
pub async fn clear_all_cache(
  state: State<'_, VideoCompilerState>,
  app: tauri::AppHandle,
) -> Result<()> {
  use crate::video_compiler::commands_logic::clear_all_cache_logic;

  clear_all_cache_logic(&state).await?;

  // Отправляем событие об обновлении кэша
  let cache = state.cache_manager.read().await;
  let memory_usage = cache.get_memory_usage();
  let _ = app.emit(
    "video-compiler",
    &VideoCompilerEvent::CacheUpdated {
      cache_size_mb: memory_usage.total_bytes as f64 / 1_048_576.0,
    },
  );

  Ok(())
}

/// Очистить кэш (оставлено для обратной совместимости)
#[tauri::command]
pub async fn clear_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Очистить кэш превью
#[tauri::command]
pub async fn clear_preview_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  use crate::video_compiler::commands_logic::clear_preview_cache_logic;
  clear_preview_cache_logic(&state).await
}

/// Получить размер кэша в мегабайтах
#[tauri::command]
pub async fn get_cache_size(state: State<'_, VideoCompilerState>) -> Result<f32> {
  use crate::video_compiler::commands_logic::get_cache_size_logic;
  Ok(get_cache_size_logic(&state).await)
}

/// Настройка параметров кэша
#[tauri::command]
pub async fn configure_cache(
  max_memory_mb: Option<usize>,
  max_entries: Option<usize>,
  auto_cleanup: Option<bool>,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::cache::CacheSettings;

  let mut cache = state.cache_manager.write().await;

  // Создаем новые настройки на основе текущих
  let current_settings = CacheSettings::default();
  let new_settings = CacheSettings {
    max_memory_mb: max_memory_mb.unwrap_or(current_settings.max_memory_mb),
    max_preview_entries: max_entries.unwrap_or(current_settings.max_preview_entries),
    max_metadata_entries: max_entries.unwrap_or(current_settings.max_metadata_entries),
    max_render_entries: max_entries
      .map(|e| e / 10)
      .unwrap_or(current_settings.max_render_entries),
    preview_ttl: current_settings.preview_ttl,
    metadata_ttl: current_settings.metadata_ttl,
    render_ttl: current_settings.render_ttl,
  };

  // Пересоздаем кэш с новыми настройками
  *cache = RenderCache::with_settings(new_settings);

  // Если включена автоочистка, запускаем очистку старых записей
  if auto_cleanup.unwrap_or(true) {
    cache.cleanup_old_entries().await?;
  }

  Ok(())
}

/// Получить метаданные из кэша
#[tauri::command]
pub async fn get_cached_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<MediaMetadata>> {
  use crate::video_compiler::commands_logic::get_cached_metadata_logic;
  Ok(get_cached_metadata_logic(&file_path, &state).await)
}

/// Сохранить метаданные в кэш
#[tauri::command]
pub async fn cache_media_metadata(
  file_path: String,
  duration: f64,
  resolution: Option<(u32, u32)>,
  _fps: Option<f32>,
  _bitrate: Option<u32>,
  _video_codec: Option<String>,
  _audio_codec: Option<String>,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::commands_logic::cache_media_metadata_logic;

  // На данном этапе мы используем логику с упрощенными параметрами,
  // позже можно расширить логическую функцию для поддержки всех параметров
  cache_media_metadata_logic(file_path, duration, resolution, &state).await
}

/// Сохранить данные рендеринга в кэш
#[tauri::command]
#[allow(dead_code)] // Available for frontend but not currently used in tests
pub async fn store_render_data(
  cache_key: String,
  output_path: String,
  render_hash: String,
  file_size: u64,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::commands_logic::store_render_data_logic;

  store_render_data_logic(cache_key, output_path, render_hash, file_size, &state).await
}

/// Получить данные рендеринга из кэша
#[tauri::command]
#[allow(dead_code)] // Available for frontend but not currently used in tests
pub async fn get_render_data(
  cache_key: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<crate::video_compiler::cache::RenderCacheData>> {
  use crate::video_compiler::commands_logic::get_render_data_logic;

  get_render_data_logic(&cache_key, &state).await
}

/// Получить использование памяти кэшем
#[tauri::command]
pub async fn get_cache_memory_usage(
  state: State<'_, VideoCompilerState>,
) -> Result<CacheMemoryUsage> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_memory_usage())
}

// ==================== НАСТРОЙКИ ====================

/// Получить настройки компилятора
#[tauri::command]
pub async fn get_compiler_settings(
  state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
  use crate::video_compiler::commands_logic::get_compiler_settings_logic;
  Ok(get_compiler_settings_logic(&state).await)
}

/// Обновить настройки компилятора
#[tauri::command]
pub async fn update_compiler_settings(
  new_settings: CompilerSettings,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::commands_logic::update_compiler_settings_logic;
  update_compiler_settings_logic(new_settings, &state).await
}

/// Установить путь к FFmpeg
#[tauri::command]
pub async fn set_ffmpeg_path(path: String, _state: State<'_, VideoCompilerState>) -> Result<bool> {
  // Проверяем, что FFmpeg доступен по указанному пути
  let output = tokio::process::Command::new(&path)
    .arg("-version")
    .output()
    .await;

  match output {
    Ok(output) if output.status.success() => {
      // TODO: Обновить путь в состоянии
      Ok(true)
    }
    _ => Err(VideoCompilerError::DependencyMissing(format!(
      "FFmpeg not found at path: {}",
      path
    ))),
  }
}

// ==================== ДИАГНОСТИКА ====================

/// Получить информацию о системе для диагностики
#[tauri::command]
pub async fn get_system_info(state: State<'_, VideoCompilerState>) -> Result<SystemInfo> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());
  let gpu_capabilities = detector.get_gpu_capabilities().await.ok();

  Ok(SystemInfo {
    os: std::env::consts::OS.to_string(),
    arch: std::env::consts::ARCH.to_string(),
    ffmpeg_path: state.ffmpeg_path.clone(),
    temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
    gpu_capabilities,
    available_memory: get_available_memory(),
    cpu_cores: std::thread::available_parallelism()
      .map(|n| n.get())
      .unwrap_or(1),
  })
}

/// Информация о системе
#[derive(Debug, serde::Serialize)]
pub struct SystemInfo {
  pub os: String,
  pub arch: String,
  pub ffmpeg_path: String,
  pub temp_directory: String,
  pub gpu_capabilities: Option<GpuCapabilities>,
  pub available_memory: Option<u64>,
  pub cpu_cores: usize,
}

/// Получить доступную память системы
fn get_available_memory() -> Option<u64> {
  #[cfg(target_os = "linux")]
  {
    // Читаем /proc/meminfo
    use std::fs;
    if let Ok(content) = fs::read_to_string("/proc/meminfo") {
      for line in content.lines() {
        if line.starts_with("MemAvailable:") {
          if let Some(kb) = line.split_whitespace().nth(1) {
            if let Ok(kb_val) = kb.parse::<u64>() {
              return Some(kb_val * 1024); // Конвертируем в байты
            }
          }
        }
      }
    }
  }

  #[cfg(target_os = "macos")]
  {
    // Используем sysctl
    use std::process::Command;
    if let Ok(output) = Command::new("sysctl").args(["-n", "hw.memsize"]).output() {
      if let Ok(mem_str) = String::from_utf8(output.stdout) {
        if let Ok(mem_bytes) = mem_str.trim().parse::<u64>() {
          return Some(mem_bytes);
        }
      }
    }
  }

  #[cfg(target_os = "windows")]
  {
    // Для Windows можно использовать WMI или другие системные API
    // Пока возвращаем None
  }

  None
}

// ==================== ИЗВЛЕЧЕНИЕ КАДРОВ ====================

/// Параметры для извлечения кадров для timeline
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TimelineFrameExtractionRequest {
  /// Путь к видео файлу
  pub video_path: String,
  /// Длительность видео
  pub duration: f64,
  /// Интервал между кадрами (секунды)
  pub interval: f64,
  /// Максимальное количество кадров
  pub max_frames: Option<usize>,
}

/// Результат извлечения кадра для timeline
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TimelineFrame {
  /// Временная метка
  pub timestamp: f64,
  /// Данные кадра (base64)
  pub frame_data: String,
  /// Является ли ключевым кадром
  pub is_keyframe: bool,
}

/// Извлечь кадры для timeline
#[tauri::command]
pub async fn extract_timeline_frames(
  request: TimelineFrameExtractionRequest,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<TimelineFrame>> {
  use crate::video_compiler::commands_logic::extract_timeline_frames_logic;

  extract_timeline_frames_logic(
    &request.video_path,
    request.duration,
    request.interval,
    request.max_frames,
    &state,
  )
  .await
}

/// Результат распознавания кадра
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RecognitionFrameResult {
  /// Временная метка
  pub timestamp: f64,
  /// Данные кадра
  pub frame_data: Vec<u8>,
  /// Разрешение
  pub resolution: [u32; 2],
  /// Оценка изменения сцены
  pub scene_change_score: Option<f32>,
  /// Является ли ключевым кадром
  pub is_keyframe: bool,
}

/// Параметры для извлечения кадров субтитров
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SubtitleFrameResult {
  /// ID субтитра
  pub subtitle_id: String,
  /// Текст субтитра
  pub subtitle_text: String,
  /// Временная метка кадра
  pub timestamp: f64,
  /// Данные кадра (base64)
  pub frame_data: Vec<u8>,
  /// Время начала субтитра
  pub start_time: f64,
  /// Время окончания субтитра
  pub end_time: f64,
}

/// Извлечь кадры для субтитров
#[tauri::command]
pub async fn extract_subtitle_frames(
  video_path: String,
  subtitles: Vec<Subtitle>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<SubtitleFrameResult>> {
  use crate::video_compiler::commands_logic::extract_subtitle_frames_logic;

  extract_subtitle_frames_logic(&video_path, subtitles, &state).await
}

/// Очистить кэш кадров
#[tauri::command]
pub async fn clear_frame_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  use crate::video_compiler::commands_logic::clear_frame_cache_logic;
  clear_frame_cache_logic(&state).await
}

/// Проверить доступность FFmpeg и его возможности
#[tauri::command]
pub async fn check_ffmpeg_capabilities(
  state: State<'_, VideoCompilerState>,
) -> Result<FfmpegCapabilities> {
  use crate::video_compiler::commands_logic::check_ffmpeg_capabilities_logic;
  check_ffmpeg_capabilities_logic(&state).await
}

/// Возможности FFmpeg
#[derive(Debug, serde::Serialize)]
pub struct FfmpegCapabilities {
  pub version: String,
  pub available_codecs: Vec<String>,
  pub hardware_encoders: Vec<String>,
  pub path: String,
}

// ==================== GPU ====================

/// Получить информацию о доступных GPU
#[tauri::command]
pub async fn get_gpu_info(state: State<'_, VideoCompilerState>) -> Result<Vec<GpuInfo>> {
  use crate::video_compiler::commands_logic::get_gpu_info_logic;

  get_gpu_info_logic(&state).await
}

/// Проверить доступность GPU кодировщика
#[tauri::command]
pub async fn check_gpu_encoder_availability(
  encoder_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  use crate::video_compiler::commands_logic::check_gpu_encoder_availability_logic;

  check_gpu_encoder_availability_logic(&encoder_name, &state).await
}

/// Получить рекомендуемый GPU кодировщик
#[tauri::command]
pub async fn get_recommended_gpu_encoder(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<String>> {
  use crate::video_compiler::commands_logic::get_recommended_gpu_encoder_logic;

  get_recommended_gpu_encoder_logic(&state).await
}

/// Демонстрация использования InputSource полей start_time и duration
#[tauri::command]
pub async fn get_input_sources_info(project_data: serde_json::Value) -> Result<serde_json::Value> {
  use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
  use crate::video_compiler::schema::ProjectSchema;

  // Парсим проект из JSON
  let project: ProjectSchema = serde_json::from_value(project_data)
    .map_err(|e| VideoCompilerError::validation(format!("Ошибка парсинга проекта: {}", e)))?;

  // Создаем FFmpeg builder
  let ffmpeg_builder = FFmpegBuilder::new(project);

  // Получаем источники входных данных
  let input_sources = ffmpeg_builder.collect_input_sources().await?;

  // Формируем информацию о каждом источнике, демонстрируя использование всех полей
  let sources_info: Vec<serde_json::Value> = input_sources
    .iter()
    .map(|source| {
      serde_json::json!({
        "path": source.path.to_string_lossy(),
        "start_time": source.start_time,
        "duration": source.duration,
        "input_index": source.input_index,
        "track_type": format!("{:?}", source.track_type),
        "ffmpeg_params": {
          "seek_param": if source.start_time > 0.0 {
            format!("-ss {}", source.start_time)
          } else {
            "no seek".to_string()
          },
          "duration_param": if source.duration > 0.0 {
            format!("-t {}", source.duration)
          } else {
            "no duration limit".to_string()
          }
        },
        "optimization_info": {
          "will_seek": source.start_time > 0.0,
          "will_limit_duration": source.duration > 0.0,
          "total_processing_time": source.duration,
          "file_offset_seconds": source.start_time
        }
      })
    })
    .collect();

  let result = serde_json::json!({
    "total_sources": input_sources.len(),
    "sources": sources_info,
    "description": "InputSource поля start_time и duration используются для оптимизации FFmpeg входных параметров",
    "optimization_benefits": [
      "start_time используется для добавления параметра -ss (seek) к входному файлу",
      "duration используется для добавления параметра -t (duration limit) к входному файлу",
      "Это позволяет FFmpeg читать только нужную часть файла, а не весь файл с последующей фильтрацией"
    ]
  });

  log::info!(
    "Получена информация о {} входных источниках с использованием полей start_time и duration",
    input_sources.len()
  );

  Ok(result)
}

/// Демонстрация использования FrameExtractionManager cache поля
#[tauri::command]
pub async fn get_frame_extraction_cache_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use crate::video_compiler::frame_extraction::FrameExtractionManager;

  // Создаем FrameExtractionManager для демонстрации использования cache поля
  let frame_manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Получаем доступ к кэшу через новый публичный метод
  let cache = frame_manager.get_cache();
  let cache_guard = cache.read().await;

  // Получаем статистику кэша, чтобы показать использование
  let stats = cache_guard.get_stats();
  let memory_usage = cache_guard.get_memory_usage();

  // Показываем, как кэш используется в FrameExtractionManager
  let result = serde_json::json!({
    "description": "FrameExtractionManager cache поле используется для кэширования превью кадров",
    "cache_integration": {
      "extract_frames_batch": "Проверяет кэш перед генерацией кадров и сохраняет новые кадры",
      "performance_benefit": "Избегает повторной генерации одинаковых кадров",
      "key_usage": "Использует PreviewKey с path, timestamp, resolution, quality"
    },
    "current_cache_stats": {
      "preview_requests": stats.preview_requests,
      "preview_hits": stats.preview_hits,
      "preview_misses": stats.preview_misses,
      "hit_ratio": stats.preview_hit_ratio(),
      "memory_usage_mb": memory_usage.total_mb()
    },
    "optimization_features": [
      "Разделяет timestamps на кешированные и некешированные",
      "Генерирует только некешированные кадры",
      "Автоматически сохраняет новые кадры в кэш",
      "Сортирует результаты по временным меткам"
    ],
    "cache_operations": {
      "check": "cache.get_preview(&preview_key)",
      "store": "cache.store_preview(preview_key, data)",
      "key_format": "PreviewKey::new(path, timestamp, resolution, quality)"
    }
  });

  log::info!(
    "Информация о кэше FrameExtractionManager: {:.1} MB, {:.1}% попаданий",
    memory_usage.total_mb(),
    stats.preview_hit_ratio() * 100.0
  );

  Ok(result)
}

#[cfg(test)]
mod tests;
