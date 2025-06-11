/*!
 * Tauri команды для Video Compiler
 *
 * Этот модуль определяет все Tauri команды для работы с video compiler
 * из фронтенда, включая компиляцию видео, управление GPU и мониторинг.
 */

use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tauri::State;
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;

use crate::video_compiler::cache::{CacheStats, RenderCache};
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::frame_extraction::{
  ExtractionPurpose, ExtractionSettings, ExtractionStrategy, FrameExtractionManager,
};
use crate::video_compiler::gpu::{GpuCapabilities, GpuDetector, GpuInfo};
use crate::video_compiler::progress::{RenderProgress, RenderStatus};
use crate::video_compiler::renderer::VideoRenderer;
use crate::video_compiler::schema::{Clip, ProjectSchema, Subtitle};
use crate::video_compiler::CompilerSettings;

/// Состояние Video Compiler для Tauri
#[derive(Debug)]
pub struct VideoCompilerState {
  /// Активные задачи рендеринга
  pub active_jobs: Arc<RwLock<HashMap<String, VideoRenderer>>>,

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
  project_schema: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let job_id = uuid::Uuid::new_v4().to_string();

  // Создаем канал для прогресса
  let (progress_sender, _progress_receiver) = mpsc::unbounded_channel();

  // Создаем рендерер
  let renderer = VideoRenderer::new(
    project_schema,
    state.settings.clone(),
    state.cache_manager.clone(),
    progress_sender,
  )
  .await
  .map_err(|e| VideoCompilerError::InternalError(format!("Failed to create renderer: {}", e)))?;

  // Сохраняем в активных задачах
  {
    let mut jobs = state.active_jobs.write().await;
    jobs.insert(job_id.clone(), renderer);
  }

  // Запускаем рендеринг в фоне
  let active_jobs = state.active_jobs.clone();
  let job_id_clone = job_id.clone();
  let output_path_clone = output_path.clone();

  tokio::spawn(async move {
    let result = {
      let mut jobs = active_jobs.write().await;
      if let Some(renderer) = jobs.get_mut(&job_id_clone) {
        renderer.render(Path::new(&output_path_clone)).await
      } else {
        Err(VideoCompilerError::InternalError(
          "Job not found".to_string(),
        ))
      }
    };

    // Логируем результат
    match result {
      Ok(_) => log::info!("Рендеринг завершен успешно: {}", job_id_clone),
      Err(e) => log::error!("Ошибка рендеринга {}: {}", job_id_clone, e),
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

  if let Some(renderer) = jobs.get(&job_id) {
    Ok(renderer.get_progress().await)
  } else {
    Ok(None)
  }
}

/// Отменить рендеринг
#[tauri::command]
pub async fn cancel_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<bool> {
  let mut jobs = state.active_jobs.write().await;

  if let Some(renderer) = jobs.get_mut(&job_id) {
    renderer.cancel().await?;
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

  for (job_id, renderer) in jobs.iter() {
    let progress = renderer.get_progress().await;
    let status = match &progress {
      Some(p) => p.status.clone(),
      None => RenderStatus::Processing,
    };

    result.push(RenderJob {
      id: job_id.clone(),
      project_name: "Unknown Project".to_string(), // TODO: получать из ProjectSchema
      output_path: "Unknown Path".to_string(),     // TODO: сохранять путь
      status,
      created_at: chrono::Utc::now().to_rfc3339(),
      progress,
      error_message: None,
    });
  }

  Ok(result)
}

/// Генерация превью кадра
#[tauri::command]
pub async fn generate_preview(
  video_path: String,
  timestamp: f64,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<u8>> {
  use crate::video_compiler::preview::PreviewGenerator;

  let preview_gen = PreviewGenerator::new(state.cache_manager.clone());

  // Генерируем превью
  preview_gen
    .generate_preview(Path::new(&video_path), timestamp, resolution, quality)
    .await
    .map_err(|e| VideoCompilerError::PreviewError {
      timestamp,
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
  use crate::video_compiler::ffmpeg_builder::{FFmpegBuilder, FFmpegBuilderSettings};
  use std::time::Instant;
  use tokio::fs;

  let start_instant = Instant::now();

  // Валидация параметров
  if request.start_time >= request.end_time {
    return Err(VideoCompilerError::validation(
      "Start time must be before end time",
    ));
  }

  let duration = request.end_time - request.start_time;
  if duration > 60.0 {
    return Err(VideoCompilerError::validation(
      "Prerender segment cannot be longer than 60 seconds",
    ));
  }

  // Создаем временный файл для пререндера с уникальным именем
  let temp_dir = std::env::temp_dir();

  // Создаем хеш из параметров проекта для уникальности
  use std::collections::hash_map::DefaultHasher;
  use std::hash::{Hash, Hasher};

  let mut hasher = DefaultHasher::new();
  request.project_schema.tracks.len().hash(&mut hasher);
  request.project_schema.effects.len().hash(&mut hasher);
  request.apply_effects.hash(&mut hasher);
  request.quality.hash(&mut hasher);
  let hash = hasher.finish();

  let file_name = format!(
    "prerender_{}_{}_{:x}.mp4",
    request.start_time.round() as i64,
    request.end_time.round() as i64,
    hash & 0xFFFFFF // Используем только последние 6 цифр хеша
  );
  let output_path = temp_dir.join(file_name);

  // Настройки FFmpeg
  let ffmpeg_settings = FFmpegBuilderSettings {
    ffmpeg_path: state.ffmpeg_path.clone(),
    ..Default::default()
  };

  // Создаем билдер
  let builder = FFmpegBuilder::with_settings(request.project_schema, ffmpeg_settings);

  // Строим команду пререндера
  let mut cmd = builder
    .build_prerender_segment_command(
      request.start_time,
      request.end_time,
      &output_path,
      request.apply_effects,
    )
    .await?;

  // Запускаем FFmpeg
  let output = cmd
    .output()
    .await
    .map_err(|e| VideoCompilerError::io(e.to_string()))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    let exit_code = output.status.code();
    return Err(VideoCompilerError::ffmpeg(
      exit_code,
      stderr.to_string(),
      "prerender_segment",
    ));
  }

  // Получаем размер файла
  let metadata = fs::metadata(&output_path)
    .await
    .map_err(|e| VideoCompilerError::io(e.to_string()))?;

  let render_time_ms = start_instant.elapsed().as_millis() as u64;

  Ok(PrerenderResult {
    file_path: output_path.to_string_lossy().to_string(),
    duration,
    file_size: metadata.len(),
    render_time_ms,
  })
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
  use std::time::SystemTime;
  use tokio::fs;

  let temp_dir = std::env::temp_dir();
  let mut files = Vec::new();
  let mut total_size = 0u64;

  // Читаем содержимое временной директории
  let mut entries = fs::read_dir(&temp_dir)
    .await
    .map_err(|e| VideoCompilerError::io(e.to_string()))?;

  while let Some(entry) = entries
    .next_entry()
    .await
    .map_err(|e| VideoCompilerError::io(e.to_string()))?
  {
    let path = entry.path();
    let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

    // Проверяем, является ли это файлом пререндера
    if file_name.starts_with("prerender_") && file_name.ends_with(".mp4") {
      let metadata = entry
        .metadata()
        .await
        .map_err(|e| VideoCompilerError::io(e.to_string()))?;

      if metadata.is_file() {
        let size = metadata.len();
        total_size += size;

        // Парсим время из имени файла
        let parts: Vec<&str> = file_name
          .trim_start_matches("prerender_")
          .trim_end_matches(".mp4")
          .split('_')
          .collect();

        let (start_time, end_time) = if parts.len() >= 2 {
          (
            parts[0].parse::<f64>().unwrap_or(0.0),
            parts[1].parse::<f64>().unwrap_or(0.0),
          )
        } else {
          (0.0, 0.0)
        };

        let created = metadata
          .created()
          .ok()
          .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
          .map(|d| d.as_secs())
          .unwrap_or(0);

        files.push(PrerenderCacheFile {
          path: path.to_string_lossy().to_string(),
          size,
          created,
          start_time,
          end_time,
        });
      }
    }
  }

  // Сортируем файлы по времени создания (новые первыми)
  files.sort_by(|a, b| b.created.cmp(&a.created));

  Ok(PrerenderCacheInfo {
    file_count: files.len(),
    total_size,
    files,
  })
}

/// Очистить кеш пререндеров
#[tauri::command]
pub async fn clear_prerender_cache() -> Result<u64> {
  use tokio::fs;

  let temp_dir = std::env::temp_dir();
  let mut _deleted_count = 0u64;
  let mut deleted_size = 0u64;

  // Читаем содержимое временной директории
  let mut entries = fs::read_dir(&temp_dir)
    .await
    .map_err(|e| VideoCompilerError::io(e.to_string()))?;

  while let Some(entry) = entries
    .next_entry()
    .await
    .map_err(|e| VideoCompilerError::io(e.to_string()))?
  {
    let path = entry.path();
    let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

    // Проверяем, является ли это файлом пререндера
    if file_name.starts_with("prerender_") && file_name.ends_with(".mp4") {
      let metadata = entry
        .metadata()
        .await
        .map_err(|e| VideoCompilerError::io(e.to_string()))?;

      if metadata.is_file() {
        deleted_size += metadata.len();

        // Удаляем файл
        if let Ok(_) = fs::remove_file(&path).await {
          _deleted_count += 1;
        }
      }
    }
  }

  Ok(deleted_size)
}

// ==================== GPU КОМАНДЫ ====================

/// Получить возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities(state: State<'_, VideoCompilerState>) -> Result<GpuCapabilities> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());

  detector
    .get_gpu_capabilities()
    .await
    .map_err(|e| VideoCompilerError::gpu(format!("Failed to get GPU capabilities: {}", e)))
}

/// Получить информацию о текущем GPU
#[tauri::command]
pub async fn get_current_gpu_info(state: State<'_, VideoCompilerState>) -> Result<Option<GpuInfo>> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());

  match detector.get_gpu_capabilities().await {
    Ok(capabilities) => Ok(capabilities.current_gpu),
    Err(_) => Ok(None),
  }
}

/// Проверить доступность аппаратного ускорения
#[tauri::command]
pub async fn check_hardware_acceleration(state: State<'_, VideoCompilerState>) -> Result<bool> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());

  match detector.detect_available_encoders().await {
    Ok(encoders) => Ok(!encoders.is_empty()),
    Err(_) => Ok(false),
  }
}

// ==================== КЭШИРОВАНИЕ ====================

/// Получить статистику кэша
#[tauri::command]
pub async fn get_cache_stats(state: State<'_, VideoCompilerState>) -> Result<CacheStats> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_stats().clone())
}

/// Очистить кэш
#[tauri::command]
pub async fn clear_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Очистить кэш превью
#[tauri::command]
pub async fn clear_preview_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

// ==================== НАСТРОЙКИ ====================

/// Получить настройки компилятора
#[tauri::command]
pub async fn get_compiler_settings(
  state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
  let settings = state.settings.read().await;
  Ok(settings.clone())
}

/// Обновить настройки компилятора
#[tauri::command]
pub async fn update_compiler_settings(
  new_settings: CompilerSettings,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;
  *settings = new_settings;
  Ok(())
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
  use base64::engine::general_purpose::STANDARD as BASE64;
  use base64::Engine as _;
  use std::path::Path;

  let manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Настройки для timeline превью
  let settings = ExtractionSettings {
    strategy: ExtractionStrategy::Combined {
      min_interval: request.interval,
      include_scene_changes: true,
      include_keyframes: true,
    },
    purpose: ExtractionPurpose::TimelinePreview,
    resolution: (160, 90), // Маленькое разрешение для timeline
    quality: 60,
    format: crate::video_compiler::schema::PreviewFormat::Jpeg,
    max_frames: request.max_frames,
    gpu_decode: true,
    parallel_extraction: true,
    thread_count: None,
  };

  let path = Path::new(&request.video_path);
  let _video_info = manager.preview_generator.get_video_info(path).await?;

  // Создаем фейковый клип для использования существующей функции
  let clip = Clip {
    id: Uuid::new_v4().to_string(),
    source_path: path.to_path_buf(),
    start_time: 0.0,
    end_time: request.duration,
    source_start: 0.0,
    source_end: request.duration,
    speed: 1.0,
    volume: 1.0,
    locked: false,
    effects: Vec::new(),
    filters: Vec::new(),
    template_id: None,
    template_cell: None,
    style_template_id: None,
    properties: HashMap::new(),
  };

  let frames = manager
    .extract_frames_for_clip(&clip, Some(settings))
    .await?;

  // Преобразуем в формат для фронтенда
  Ok(
    frames
      .into_iter()
      .map(|frame| TimelineFrame {
        timestamp: frame.timestamp,
        frame_data: BASE64.encode(&frame.data),
        is_keyframe: frame.is_keyframe,
      })
      .collect(),
  )
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

/// Извлечь кадры для распознавания
#[tauri::command]
pub async fn extract_recognition_frames(
  video_path: String,
  purpose: String,
  _interval: f64,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<RecognitionFrameResult>> {
  use std::path::Path;

  let manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Парсим цель извлечения
  let extraction_purpose = match purpose.as_str() {
    "object_detection" => ExtractionPurpose::ObjectDetection,
    "scene_recognition" => ExtractionPurpose::SceneRecognition,
    "text_recognition" => ExtractionPurpose::TextRecognition,
    _ => ExtractionPurpose::ObjectDetection,
  };

  let path = Path::new(&video_path);
  let video_info = manager.preview_generator.get_video_info(path).await?;

  let frames = manager
    .extract_frames_for_recognition(path, video_info.duration, extraction_purpose)
    .await?;

  // Преобразуем в формат для фронтенда
  Ok(
    frames
      .into_iter()
      .map(|frame| RecognitionFrameResult {
        timestamp: frame.timestamp,
        frame_data: frame.frame_data,
        resolution: [frame.resolution.0, frame.resolution.1],
        scene_change_score: frame.scene_change_score,
        is_keyframe: frame.is_keyframe,
      })
      .collect(),
  )
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
  use std::path::Path;

  let manager = FrameExtractionManager::new(state.cache_manager.clone());
  let path = Path::new(&video_path);

  let frames = manager
    .extract_frames_for_subtitles(path, &subtitles, None)
    .await?;

  // Преобразуем в формат для фронтенда
  Ok(
    frames
      .into_iter()
      .map(|frame| SubtitleFrameResult {
        subtitle_id: frame.subtitle_id,
        subtitle_text: frame.subtitle_text,
        timestamp: frame.timestamp,
        frame_data: frame.frame_data,
        start_time: frame.start_time,
        end_time: frame.end_time,
      })
      .collect(),
  )
}

/// Очистить кэш кадров
#[tauri::command]
pub async fn clear_frame_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Проверить доступность FFmpeg и его возможности
#[tauri::command]
pub async fn check_ffmpeg_capabilities(
  state: State<'_, VideoCompilerState>,
) -> Result<FfmpegCapabilities> {
  let ffmpeg_path = &state.ffmpeg_path;

  // Проверяем версию FFmpeg
  let version_output = tokio::process::Command::new(ffmpeg_path)
    .arg("-version")
    .output()
    .await
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  let version_str = String::from_utf8_lossy(&version_output.stdout);
  let version = extract_ffmpeg_version(&version_str);

  // Проверяем доступные кодеки
  let codecs_output = tokio::process::Command::new(ffmpeg_path)
    .arg("-codecs")
    .output()
    .await
    .map_err(|e| VideoCompilerError::io(format!("Failed to get codecs: {}", e)))?;

  let codecs_str = String::from_utf8_lossy(&codecs_output.stdout);
  let available_codecs = extract_available_codecs(&codecs_str);

  // Проверяем доступные энкодеры
  let encoders_output = tokio::process::Command::new(ffmpeg_path)
    .arg("-encoders")
    .output()
    .await
    .map_err(|e| VideoCompilerError::io(format!("Failed to get encoders: {}", e)))?;

  let encoders_str = String::from_utf8_lossy(&encoders_output.stdout);
  let hardware_encoders = extract_hardware_encoders(&encoders_str);

  Ok(FfmpegCapabilities {
    version,
    available_codecs,
    hardware_encoders,
    path: ffmpeg_path.clone(),
  })
}

/// Возможности FFmpeg
#[derive(Debug, serde::Serialize)]
pub struct FfmpegCapabilities {
  pub version: String,
  pub available_codecs: Vec<String>,
  pub hardware_encoders: Vec<String>,
  pub path: String,
}

/// Извлечь версию FFmpeg из вывода
fn extract_ffmpeg_version(output: &str) -> String {
  for line in output.lines() {
    if line.starts_with("ffmpeg version") {
      return line.to_string();
    }
  }
  "Unknown".to_string()
}

/// Извлечь доступные кодеки
fn extract_available_codecs(output: &str) -> Vec<String> {
  let mut codecs = Vec::new();
  let important_codecs = ["h264", "h265", "vp8", "vp9", "av1", "aac", "mp3", "opus"];

  for line in output.lines() {
    for codec in &important_codecs {
      if line.contains(codec) && !codecs.contains(&codec.to_string()) {
        codecs.push(codec.to_string());
      }
    }
  }

  codecs
}

/// Извлечь аппаратные энкодеры
fn extract_hardware_encoders(output: &str) -> Vec<String> {
  let mut encoders = Vec::new();
  let hw_encoders = [
    "h264_nvenc",
    "hevc_nvenc",
    "h264_qsv",
    "hevc_qsv",
    "h264_vaapi",
    "hevc_vaapi",
    "h264_videotoolbox",
    "hevc_videotoolbox",
    "h264_amf",
    "hevc_amf",
  ];

  for line in output.lines() {
    for encoder in &hw_encoders {
      if line.contains(encoder) && !encoders.contains(&encoder.to_string()) {
        encoders.push(encoder.to_string());
      }
    }
  }

  encoders
}

#[cfg(test)]
mod tests;
