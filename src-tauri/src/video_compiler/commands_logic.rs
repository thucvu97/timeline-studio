//! Логика команд Video Compiler для улучшения тестируемости
//!
//! Этот модуль содержит основную бизнес-логику команд,
//! отделенную от Tauri-специфичных зависимостей.

#![allow(dead_code)]

use crate::video_compiler::{
  commands::{ActiveRenderJob, RenderJob, RenderJobMetadata, VideoCompilerState},
  error::{Result, VideoCompilerError},
  gpu::{GpuCapabilities, GpuDetector},
  progress::{RenderProgress, RenderStatus},
  renderer::VideoRenderer,
  schema::{ProjectSchema, Subtitle},
  CompilerSettings,
};
use tokio::sync::mpsc;
use uuid::Uuid;

/// Логика компиляции видео
pub async fn compile_video_logic(
  project_schema: ProjectSchema,
  output_path: String,
  state: &VideoCompilerState,
) -> Result<String> {
  // Валидация проекта
  project_schema
    .validate()
    .map_err(VideoCompilerError::validation)?;

  if project_schema.tracks.is_empty() {
    return Err(VideoCompilerError::validation(
      "Проект не содержит треков для рендеринга",
    ));
  }

  // Проверка настроек
  let settings = state.settings.read().await;
  let max_jobs = settings.max_concurrent_jobs;

  // Проверка лимита активных задач
  {
    let jobs = state.active_jobs.read().await;
    if jobs.len() >= max_jobs {
      return Err(VideoCompilerError::validation(format!(
        "Достигнут лимит активных задач ({}). Дождитесь завершения текущих задач.",
        max_jobs
      )));
    }
  }

  // Генерация ID задачи
  let job_id = Uuid::new_v4().to_string();

  // Создание метаданных задачи
  let metadata = RenderJobMetadata {
    project_name: project_schema.metadata.name.clone(),
    output_path: output_path.clone(),
    created_at: chrono::Utc::now().to_rfc3339(),
  };

  // Создание рендерера
  let (progress_sender, _progress_receiver) = mpsc::unbounded_channel();
  let renderer = VideoRenderer::new(
    project_schema,
    state.settings.clone(),
    state.cache_manager.clone(),
    progress_sender,
  )
  .await?;

  // Сохранение в активных задачах
  {
    let mut jobs = state.active_jobs.write().await;
    jobs.insert(job_id.clone(), ActiveRenderJob { renderer, metadata });
  }

  Ok(job_id)
}

/// Получить прогресс рендеринга
pub async fn get_render_progress_logic(
  job_id: &str,
  state: &VideoCompilerState,
) -> Result<Option<RenderProgress>> {
  let jobs = state.active_jobs.read().await;

  if let Some(job) = jobs.get(job_id) {
    let progress = job.renderer.get_progress().await;
    Ok(progress)
  } else {
    Ok(None)
  }
}

/// Отменить рендеринг
pub async fn cancel_render_logic(job_id: &str, state: &VideoCompilerState) -> Result<bool> {
  let mut jobs = state.active_jobs.write().await;

  if let Some(mut job) = jobs.remove(job_id) {
    // Отменяем рендеринг
    job.renderer.cancel().await?;
    Ok(true)
  } else {
    Ok(false)
  }
}

/// Получить список активных задач
pub async fn get_active_jobs_logic(state: &VideoCompilerState) -> Vec<RenderJob> {
  let jobs = state.active_jobs.read().await;

  jobs
    .iter()
    .map(|(id, job)| RenderJob {
      id: id.clone(),
      project_name: job.metadata.project_name.clone(),
      output_path: job.metadata.output_path.clone(),
      status: RenderStatus::Processing,
      created_at: job.metadata.created_at.clone(),
      progress: None,
      error_message: None,
    })
    .collect()
}

/// Получить информацию о конкретной задаче
pub async fn get_render_job_logic(
  job_id: &str,
  state: &VideoCompilerState,
) -> Result<Option<RenderJob>> {
  let jobs = state.active_jobs.read().await;

  if let Some(job) = jobs.get(job_id) {
    let progress = job.renderer.get_progress().await;

    Ok(Some(RenderJob {
      id: job_id.to_string(),
      project_name: job.metadata.project_name.clone(),
      output_path: job.metadata.output_path.clone(),
      status: progress
        .as_ref()
        .map(|p| p.status.clone())
        .unwrap_or(RenderStatus::Processing),
      created_at: job.metadata.created_at.clone(),
      progress,
      error_message: None,
    }))
  } else {
    Ok(None)
  }
}

/// Проверить таймауты задач
pub async fn check_render_job_timeouts_logic(
  state: &VideoCompilerState,
  timeout_seconds: u64,
) -> Vec<String> {
  let mut timed_out_jobs = Vec::new();
  let jobs = state.active_jobs.read().await;

  for (id, job) in jobs.iter() {
    if let Ok(created_at) = chrono::DateTime::parse_from_rfc3339(&job.metadata.created_at) {
      let elapsed = chrono::Utc::now() - created_at.with_timezone(&chrono::Utc);
      if elapsed.num_seconds() as u64 > timeout_seconds {
        timed_out_jobs.push(id.clone());
      }
    }
  }

  timed_out_jobs
}

/// Получить возможности GPU
pub async fn get_gpu_capabilities_logic(state: &VideoCompilerState) -> Result<GpuCapabilities> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());
  detector.get_gpu_capabilities().await
}

/// Получить статистику кэша
pub async fn get_cache_stats_logic(
  state: &VideoCompilerState,
) -> crate::video_compiler::cache::CacheStats {
  let cache = state.cache_manager.read().await;
  cache.get_stats().clone()
}

/// Очистить весь кэш
pub async fn clear_all_cache_logic(state: &VideoCompilerState) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Получить использование памяти кэшем
pub async fn get_cache_memory_usage_logic(
  state: &VideoCompilerState,
) -> crate::video_compiler::cache::CacheMemoryUsage {
  let cache = state.cache_manager.read().await;
  cache.get_memory_usage()
}

/// Получить настройки компилятора
pub async fn get_compiler_settings_logic(state: &VideoCompilerState) -> CompilerSettings {
  let settings = state.settings.read().await;
  settings.clone()
}

/// Обновить настройки компилятора
pub async fn update_compiler_settings_logic(
  new_settings: CompilerSettings,
  state: &VideoCompilerState,
) -> Result<()> {
  let mut settings = state.settings.write().await;
  *settings = new_settings;
  Ok(())
}

/// Создать новый проект
pub async fn create_new_project_logic(name: String) -> ProjectSchema {
  ProjectSchema::new(name)
}

/// Проверить доступность FFmpeg
pub async fn check_ffmpeg_availability_logic(ffmpeg_path: &str) -> Result<bool> {
  use tokio::process::Command;

  match Command::new(ffmpeg_path).arg("-version").output().await {
    Ok(output) => Ok(output.status.success()),
    Err(_) => Ok(false),
  }
}

/// Получить информацию о системе
pub fn get_system_info_logic() -> crate::video_compiler::commands::SystemInfo {
  crate::video_compiler::commands::SystemInfo {
    os: std::env::consts::OS.to_string(),
    arch: std::env::consts::ARCH.to_string(),
    ffmpeg_path: "ffmpeg".to_string(), // Default path
    temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
    gpu_capabilities: None,
    available_memory: Some(0), // Would need system-specific implementation
    cpu_cores: std::thread::available_parallelism()
      .map(|n| n.get())
      .unwrap_or(1),
  }
}

/// Очистить кэш превью
pub async fn clear_preview_cache_logic(state: &VideoCompilerState) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Структура статистики рендеринга
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RenderStatistics {
  pub total_renders: usize,
  pub successful_renders: usize,
  pub failed_renders: usize,
  pub active_renders: usize,
  pub average_render_time: f64,
  pub total_output_size: u64,
  pub cache_hit_rate: f32,
}

/// Получить статистику рендеринга
pub async fn get_render_statistics_logic(state: &VideoCompilerState) -> RenderStatistics {
  let jobs = state.active_jobs.read().await;
  let cache = state.cache_manager.read().await;
  let cache_stats = cache.get_stats();
  let hit_ratio = cache_stats.hit_ratio();

  RenderStatistics {
    total_renders: 0, // Would need persistent storage
    successful_renders: 0,
    failed_renders: 0,
    active_renders: jobs.len(),
    average_render_time: 0.0,
    total_output_size: 0,
    cache_hit_rate: hit_ratio,
  }
}

/// Валидация медиа файла
pub async fn validate_media_file_logic(file_path: &str) -> Result<bool> {
  use std::path::Path;

  let path = Path::new(file_path);
  if !path.exists() {
    return Ok(false);
  }

  // Check if it's a supported media file
  let valid_extensions = [
    "mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "aac", "flac",
  ];
  if let Some(ext) = path.extension() {
    if let Some(ext_str) = ext.to_str() {
      return Ok(valid_extensions.contains(&ext_str.to_lowercase().as_str()));
    }
  }

  Ok(false)
}

/// Генерация превью
pub async fn generate_preview_logic(
  video_path: &str,
  timestamp: f64,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
  state: &VideoCompilerState,
) -> Result<Vec<u8>> {
  use crate::video_compiler::preview::PreviewGenerator;
  use std::path::Path;

  let preview_gen = PreviewGenerator::new(state.cache_manager.clone());

  preview_gen
    .generate_preview(Path::new(video_path), timestamp, resolution, quality)
    .await
}

/// Получить информацию о видео
pub async fn get_video_info_logic(
  video_path: &str,
  state: &VideoCompilerState,
) -> Result<crate::video_compiler::preview::VideoInfo> {
  use crate::video_compiler::preview::PreviewGenerator;
  use std::path::Path;

  let preview_gen = PreviewGenerator::new(state.cache_manager.clone());
  preview_gen.get_video_info(Path::new(video_path)).await
}

/// Установить путь к FFmpeg
pub async fn set_ffmpeg_path_logic(path: &str) -> Result<bool> {
  use tokio::process::Command;

  match Command::new(path).arg("-version").output().await {
    Ok(output) => Ok(output.status.success()),
    Err(_) => Ok(false),
  }
}

/// Обновить timestamp проекта
pub fn touch_project_logic(mut project: ProjectSchema) -> ProjectSchema {
  project.touch();
  project
}

/// Создать трек
pub fn create_track_logic(
  track_type: crate::video_compiler::schema::TrackType,
  name: String,
) -> crate::video_compiler::schema::Track {
  crate::video_compiler::schema::Track::new(track_type, name)
}

/// Создать клип
pub fn create_clip_logic(
  source_path: String,
  start_time: f64,
  duration: f64,
) -> Result<crate::video_compiler::schema::Clip> {
  use std::path::PathBuf;

  let path = PathBuf::from(&source_path);

  if !path.exists() {
    return Err(VideoCompilerError::media_file(
      source_path,
      "Файл не найден",
    ));
  }

  Ok(crate::video_compiler::schema::Clip::new(
    path, start_time, duration,
  ))
}

/// Создать эффект
pub fn create_effect_logic(
  effect_type: crate::video_compiler::schema::EffectType,
  name: String,
) -> crate::video_compiler::schema::Effect {
  crate::video_compiler::schema::Effect::new(effect_type, name)
}

/// Создать фильтр
pub fn create_filter_logic(
  filter_type: crate::video_compiler::schema::FilterType,
  name: String,
) -> crate::video_compiler::schema::Filter {
  crate::video_compiler::schema::Filter::new(filter_type, name)
}

/// Создать субтитр
pub fn create_subtitle_logic(
  text: String,
  start_time: f64,
  end_time: f64,
) -> Result<crate::video_compiler::schema::Subtitle> {
  let subtitle = crate::video_compiler::schema::Subtitle::new(text, start_time, end_time);
  subtitle
    .validate()
    .map_err(VideoCompilerError::validation)?;
  Ok(subtitle)
}

/// Очистить кэш кадров
pub async fn clear_frame_cache_logic(state: &VideoCompilerState) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Настроить кэш
pub async fn configure_cache_logic(
  max_memory_mb: Option<usize>,
  max_entries: Option<usize>,
  state: &VideoCompilerState,
) -> Result<()> {
  use crate::video_compiler::cache::{CacheSettings, RenderCache};

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

  let mut cache = state.cache_manager.write().await;
  *cache = RenderCache::with_settings(new_settings);
  Ok(())
}

/// Получить размер кэша
pub async fn get_cache_size_logic(state: &VideoCompilerState) -> f32 {
  let cache = state.cache_manager.read().await;
  cache.get_memory_usage().total_mb()
}

/// Добавить клип к треку
pub fn add_clip_to_track_logic(
  mut track: crate::video_compiler::schema::Track,
  clip: crate::video_compiler::schema::Clip,
) -> Result<crate::video_compiler::schema::Track> {
  track
    .add_clip(clip)
    .map_err(VideoCompilerError::validation)?;
  Ok(track)
}

/// Создать шаблон
pub fn create_template_logic(
  template_type: crate::video_compiler::schema::TemplateType,
  name: String,
  screens: usize,
) -> crate::video_compiler::schema::Template {
  crate::video_compiler::schema::Template::new(template_type, name, screens)
}

/// Создать стильный шаблон
pub fn create_style_template_logic(
  name: String,
  category: crate::video_compiler::schema::StyleTemplateCategory,
  style: crate::video_compiler::schema::StyleTemplateStyle,
  duration: f64,
) -> crate::video_compiler::schema::StyleTemplate {
  crate::video_compiler::schema::StyleTemplate::new(name, category, style, duration)
}

/// Создать анимацию субтитра
pub fn create_subtitle_animation_logic(
  animation_type: crate::video_compiler::schema::SubtitleAnimationType,
  duration: f64,
) -> crate::video_compiler::schema::SubtitleAnimation {
  crate::video_compiler::schema::SubtitleAnimation::new(animation_type, duration)
}

/// Получить информацию о кэше рендеринга
pub async fn get_render_cache_info_logic(state: &VideoCompilerState) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let memory_usage = cache.get_memory_usage();
  let stats = cache.get_stats();

  Ok(serde_json::json!({
    "memory_usage": {
      "total_mb": memory_usage.total_mb(),
      "preview_mb": memory_usage.preview_bytes as f64 / 1_048_576.0,
      "metadata_mb": memory_usage.metadata_bytes as f64 / 1_048_576.0,
      "render_mb": memory_usage.render_bytes as f64 / 1_048_576.0,
    },
    "stats": {
      "hit_ratio": stats.hit_ratio(),
      "preview_hit_ratio": stats.preview_hit_ratio(),
    }
  }))
}

/// Сохранить метаданные в кэш
pub async fn cache_media_metadata_logic(
  file_path: String,
  duration: f64,
  resolution: Option<(u32, u32)>,
  state: &VideoCompilerState,
) -> Result<()> {
  use crate::video_compiler::cache::MediaMetadata;
  use std::time::SystemTime;

  let metadata = MediaMetadata {
    file_path: file_path.clone(),
    file_size: 0,
    modified_time: SystemTime::now(),
    duration,
    resolution,
    fps: Some(30.0),
    bitrate: Some(5000),
    video_codec: Some("h264".to_string()),
    audio_codec: Some("aac".to_string()),
    cached_at: SystemTime::now(),
  };

  let mut cache = state.cache_manager.write().await;
  let _ = cache.store_metadata(file_path, metadata).await;
  Ok(())
}

/// Получить кэшированные метаданные
pub async fn get_cached_metadata_logic(
  file_path: &str,
  state: &VideoCompilerState,
) -> Option<crate::video_compiler::cache::MediaMetadata> {
  let mut cache = state.cache_manager.write().await;
  cache.get_metadata(file_path).await
}

/// Сохранить данные рендеринга в кэш
pub async fn store_render_data_logic(
  cache_key: String,
  output_path: String,
  render_hash: String,
  file_size: u64,
  state: &VideoCompilerState,
) -> Result<()> {
  use crate::video_compiler::cache::RenderCacheData;
  use std::path::PathBuf;
  use std::time::SystemTime;

  let render_data = RenderCacheData {
    cache_key: cache_key.clone(),
    output_path: PathBuf::from(output_path),
    render_hash,
    created_at: SystemTime::now(),
    file_size,
  };

  let mut cache = state.cache_manager.write().await;
  let _ = cache
    .store_render_data(cache_key.clone(), render_data)
    .await;
  Ok(())
}

/// Получить данные рендеринга из кэша
pub async fn get_render_data_logic(
  cache_key: &str,
  state: &VideoCompilerState,
) -> Result<Option<crate::video_compiler::cache::RenderCacheData>> {
  let mut cache = state.cache_manager.write().await;
  Ok(cache.get_render_data(cache_key).await)
}

/// Логика пререндера сегмента видео
pub async fn prerender_segment_logic(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  apply_effects: bool,
  quality: Option<u8>,
  state: &VideoCompilerState,
) -> Result<crate::video_compiler::commands::PrerenderResult> {
  use crate::video_compiler::ffmpeg_builder::{FFmpegBuilder, FFmpegBuilderSettings};
  use std::collections::hash_map::DefaultHasher;
  use std::hash::{Hash, Hasher};
  use std::time::Instant;
  use tokio::fs;

  let start_instant = Instant::now();

  // Валидация параметров
  if start_time >= end_time {
    return Err(VideoCompilerError::validation(
      "Start time must be before end time",
    ));
  }

  let duration = end_time - start_time;
  if duration > 60.0 {
    return Err(VideoCompilerError::validation(
      "Prerender segment cannot be longer than 60 seconds",
    ));
  }

  // Создаем временный файл для пререндера с уникальным именем
  let temp_dir = std::env::temp_dir();

  // Создаем хеш из параметров проекта для уникальности
  let mut hasher = DefaultHasher::new();
  project_schema.tracks.len().hash(&mut hasher);
  project_schema.effects.len().hash(&mut hasher);
  apply_effects.hash(&mut hasher);
  quality.hash(&mut hasher);
  let hash = hasher.finish();

  let file_name = format!(
    "prerender_{}_{}_{:x}.mp4",
    start_time.round() as i64,
    end_time.round() as i64,
    hash & 0xFFFFFF // Используем только последние 6 цифр хеша
  );
  let output_path = temp_dir.join(file_name);

  // Настройки FFmpeg
  let ffmpeg_settings = FFmpegBuilderSettings {
    ffmpeg_path: state.ffmpeg_path.clone(),
    ..Default::default()
  };

  // Создаем билдер
  let builder = FFmpegBuilder::with_settings(project_schema, ffmpeg_settings);

  // Строим команду пререндера
  let mut cmd = builder
    .build_prerender_segment_command(start_time, end_time, &output_path, apply_effects)
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

  Ok(crate::video_compiler::commands::PrerenderResult {
    file_path: output_path.to_string_lossy().to_string(),
    duration,
    file_size: metadata.len(),
    render_time_ms,
  })
}

/// Логика получения информации о кэше пререндеров
pub async fn get_prerender_cache_info_logic(
) -> Result<crate::video_compiler::commands::PrerenderCacheInfo> {
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

        files.push(crate::video_compiler::commands::PrerenderCacheFile {
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

  Ok(crate::video_compiler::commands::PrerenderCacheInfo {
    file_count: files.len(),
    total_size,
    files,
  })
}

/// Логика очистки кэша пререндеров
pub async fn clear_prerender_cache_logic() -> Result<u64> {
  use tokio::fs;

  let temp_dir = std::env::temp_dir();
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
        let _ = fs::remove_file(&path).await;
      }
    }
  }

  Ok(deleted_size)
}

/// Логика очистки старых записей кэша
pub async fn cleanup_cache_logic(state: &VideoCompilerState) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.cleanup_old_entries().await?;
  Ok(())
}

/// Логика получения текущей информации о GPU
pub async fn get_current_gpu_info_logic(
  state: &VideoCompilerState,
) -> Result<Option<crate::video_compiler::gpu::GpuInfo>> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());
  match detector.get_gpu_capabilities().await {
    Ok(capabilities) => Ok(capabilities.current_gpu),
    Err(_) => Ok(None),
  }
}

/// Логика проверки доступности аппаратного ускорения
pub async fn check_hardware_acceleration_logic(state: &VideoCompilerState) -> Result<bool> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());
  match detector.detect_available_encoders().await {
    Ok(encoders) => Ok(!encoders.is_empty()),
    Err(_) => Ok(false),
  }
}

/// Логика извлечения кадров для timeline
pub async fn extract_timeline_frames_logic(
  video_path: &str,
  duration: f64,
  interval: f64,
  max_frames: Option<usize>,
  state: &VideoCompilerState,
) -> Result<Vec<crate::video_compiler::commands::TimelineFrame>> {
  use crate::video_compiler::frame_extraction::{
    ExtractionPurpose, ExtractionSettings, ExtractionStrategy, FrameExtractionManager,
  };
  use crate::video_compiler::schema::Clip;
  use base64::engine::general_purpose::STANDARD as BASE64;
  use base64::Engine as _;
  use std::collections::HashMap;
  use std::path::Path;

  let manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Настройки для timeline превью
  let settings = ExtractionSettings {
    strategy: ExtractionStrategy::Combined {
      min_interval: interval,
      include_scene_changes: true,
      include_keyframes: true,
    },
    _purpose: ExtractionPurpose::TimelinePreview,
    resolution: (160, 90), // Маленькое разрешение для timeline
    quality: 60,
    _format: crate::video_compiler::schema::PreviewFormat::Jpeg,
    max_frames,
    _gpu_decode: true,
    parallel_extraction: true,
    _thread_count: None,
  };

  let path = Path::new(video_path);
  let _video_info = manager.preview_generator.get_video_info(path).await?;

  // Создаем фейковый клип для использования существующей функции
  let clip = Clip {
    id: Uuid::new_v4().to_string(),
    source_path: path.to_path_buf(),
    start_time: 0.0,
    end_time: duration,
    source_start: 0.0,
    source_end: duration,
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
      .map(|frame| crate::video_compiler::commands::TimelineFrame {
        timestamp: frame.timestamp,
        frame_data: BASE64.encode(&frame.data),
        is_keyframe: frame.is_keyframe,
      })
      .collect(),
  )
}

/// Логика извлечения кадров для субтитров
pub async fn extract_subtitle_frames_logic(
  video_path: &str,
  subtitles: Vec<Subtitle>,
  state: &VideoCompilerState,
) -> Result<Vec<crate::video_compiler::commands::SubtitleFrameResult>> {
  use crate::video_compiler::frame_extraction::FrameExtractionManager;
  use std::path::Path;

  let manager = FrameExtractionManager::new(state.cache_manager.clone());
  let path = Path::new(video_path);

  let frames = manager
    .extract_frames_for_subtitles(path, &subtitles, None)
    .await?;

  // Преобразуем в формат для фронтенда
  Ok(
    frames
      .into_iter()
      .map(
        |frame| crate::video_compiler::commands::SubtitleFrameResult {
          subtitle_id: frame.subtitle_id,
          subtitle_text: frame.subtitle_text,
          timestamp: frame.timestamp,
          frame_data: frame.frame_data,
          start_time: frame.start_time,
          end_time: frame.end_time,
        },
      )
      .collect(),
  )
}

/// Логика генерации пакета превью
pub async fn generate_preview_batch_logic(
  requests: Vec<crate::video_compiler::commands::PreviewRequest>,
  state: &VideoCompilerState,
) -> Result<Vec<crate::video_compiler::preview::SerializablePreviewResult>> {
  use crate::video_compiler::preview::PreviewGenerator;

  let preview_gen = PreviewGenerator::new(state.cache_manager.clone());

  preview_gen
    .generate_preview_batch(
      requests
        .into_iter()
        .map(|req| crate::video_compiler::preview::PreviewRequest {
          video_path: req.video_path,
          timestamp: req.timestamp,
          resolution: req.resolution,
          quality: req.quality,
        })
        .collect(),
    )
    .await
    .map_err(|e| VideoCompilerError::PreviewError {
      timestamp: 0.0,
      reason: e.to_string(),
    })
}

/// Логика получения информации о GPU
pub async fn get_gpu_info_logic(
  state: &VideoCompilerState,
) -> Result<Vec<crate::video_compiler::gpu::GpuInfo>> {
  use crate::video_compiler::gpu::{GpuDetector, GpuEncoder, GpuInfo};

  let detector = GpuDetector::new(state.ffmpeg_path.clone());
  let encoders = detector.detect_available_encoders().await?;

  let gpus: Vec<GpuInfo> = encoders
    .into_iter()
    .map(|encoder| {
      let name = match encoder {
        GpuEncoder::None => "CPU Encoder (libx264)".to_string(),
        GpuEncoder::Nvenc => "NVIDIA GPU Encoder".to_string(),
        GpuEncoder::QuickSync => "Intel QuickSync".to_string(),
        GpuEncoder::Vaapi => "VA-API".to_string(),
        GpuEncoder::VideoToolbox => "Apple VideoToolbox".to_string(),
        GpuEncoder::Amf => "AMD Media Framework".to_string(),
      };

      let supported_codecs = match encoder {
        GpuEncoder::None => vec!["h264".to_string(), "h265".to_string()],
        _ => vec!["h264".to_string(), "h265".to_string()],
      };

      GpuInfo {
        name,
        driver_version: None,
        memory_total: None,
        memory_used: None,
        utilization: None,
        encoder_type: encoder,
        supported_codecs,
      }
    })
    .collect();

  Ok(gpus)
}

/// Логика проверки доступности GPU кодировщика
pub async fn check_gpu_encoder_availability_logic(
  encoder_name: &str,
  state: &VideoCompilerState,
) -> Result<bool> {
  use crate::video_compiler::gpu::{GpuDetector, GpuEncoder};

  let detector = GpuDetector::new(state.ffmpeg_path.clone());

  let encoder = match encoder_name {
    "nvenc" => GpuEncoder::Nvenc,
    "quicksync" => GpuEncoder::QuickSync,
    "vaapi" => GpuEncoder::Vaapi,
    "videotoolbox" => GpuEncoder::VideoToolbox,
    "amf" => GpuEncoder::Amf,
    _ => return Ok(false),
  };

  match detector.detect_available_encoders().await {
    Ok(available_encoders) => Ok(available_encoders.contains(&encoder)),
    Err(e) => {
      log::warn!("Ошибка проверки GPU кодировщика {}: {}", encoder_name, e);
      Ok(false)
    }
  }
}

/// Логика получения рекомендованного GPU кодировщика
pub async fn get_recommended_gpu_encoder_logic(
  state: &VideoCompilerState,
) -> Result<Option<String>> {
  use crate::video_compiler::gpu::GpuDetector;

  let detector = GpuDetector::new(state.ffmpeg_path.clone());

  match detector.get_recommended_encoder().await {
    Ok(Some(encoder)) => Ok(Some(format!("{:?}", encoder).to_lowercase())),
    Ok(None) => Ok(None),
    Err(e) => {
      log::warn!("Ошибка получения рекомендуемого GPU кодировщика: {}", e);
      Ok(None)
    }
  }
}

/// Логика проверки возможностей FFmpeg
pub async fn check_ffmpeg_capabilities_logic(
  state: &VideoCompilerState,
) -> Result<crate::video_compiler::commands::FfmpegCapabilities> {
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

  Ok(crate::video_compiler::commands::FfmpegCapabilities {
    version,
    available_codecs,
    hardware_encoders,
    path: ffmpeg_path.clone(),
  })
}

/// Извлечь версию FFmpeg из вывода
pub fn extract_ffmpeg_version(output: &str) -> String {
  for line in output.lines() {
    if line.starts_with("ffmpeg version") {
      return line.to_string();
    }
  }
  "Unknown".to_string()
}

/// Извлечь доступные кодеки
pub fn extract_available_codecs(output: &str) -> Vec<String> {
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
pub fn extract_hardware_encoders(output: &str) -> Vec<String> {
  let mut encoders = Vec::new();
  let hardware_patterns = [
    "h264_nvenc",
    "hevc_nvenc",
    "h264_amf",
    "hevc_amf",
    "h264_qsv",
    "hevc_qsv",
    "h264_vaapi",
    "hevc_vaapi",
    "h264_videotoolbox",
    "hevc_videotoolbox",
  ];

  for line in output.lines() {
    for pattern in &hardware_patterns {
      if line.contains(pattern) && !encoders.contains(&pattern.to_string()) {
        encoders.push(pattern.to_string());
      }
    }
  }

  encoders
}

#[cfg(test)]
mod tests {
  use super::*;

  fn create_test_state() -> VideoCompilerState {
    VideoCompilerState::new()
  }

  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());
    project.timeline = crate::video_compiler::schema::Timeline {
      duration: 60.0,
      fps: 30,
      resolution: (1920, 1080),
      sample_rate: 48000,
      aspect_ratio: crate::video_compiler::schema::AspectRatio::Ratio16x9,
    };

    let track = crate::video_compiler::schema::Track::new(
      crate::video_compiler::schema::TrackType::Video,
      "Video Track".to_string(),
    );
    project.tracks.push(track);

    project
  }

  #[tokio::test]
  async fn test_compile_video_logic_empty_tracks() {
    let state = create_test_state();
    let mut project = create_test_project();
    project.tracks.clear();

    let result = compile_video_logic(project, "/tmp/output.mp4".to_string(), &state).await;

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("не содержит треков"));
  }

  #[tokio::test]
  async fn test_compile_video_logic_max_jobs() {
    let state = create_test_state();

    // Установим лимит в 1 задачу
    {
      let mut settings = state.settings.write().await;
      settings.max_concurrent_jobs = 1;
    }

    // Добавим одну задачу
    let project = create_test_project();
    let _job_id = compile_video_logic(project.clone(), "/tmp/output1.mp4".to_string(), &state)
      .await
      .unwrap();

    // Попробуем добавить вторую
    let result = compile_video_logic(project, "/tmp/output2.mp4".to_string(), &state).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Достигнут лимит"));

    // Очистим
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_get_render_progress_logic() {
    let state = create_test_state();
    let project = create_test_project();

    // Добавим задачу
    let job_id = compile_video_logic(project, "/tmp/output.mp4".to_string(), &state)
      .await
      .unwrap();

    // Получим прогресс
    let _progress = get_render_progress_logic(&job_id, &state).await.unwrap();
    // Progress может быть None, так как рендерер возвращает Option<RenderProgress>

    // Попробуем получить прогресс несуществующей задачи
    let progress = get_render_progress_logic("non-existent", &state)
      .await
      .unwrap();
    assert!(progress.is_none());

    // Очистим
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_cancel_render_logic() {
    let state = create_test_state();
    let project = create_test_project();

    // Добавим задачу
    let job_id = compile_video_logic(project, "/tmp/output.mp4".to_string(), &state)
      .await
      .unwrap();

    // Отменим
    let cancelled = cancel_render_logic(&job_id, &state).await.unwrap();
    assert!(cancelled);

    // Проверим, что задача удалена
    let jobs = state.active_jobs.read().await;
    assert!(!jobs.contains_key(&job_id));
    drop(jobs);

    // Попробуем отменить несуществующую
    let cancelled = cancel_render_logic(&job_id, &state).await.unwrap();
    assert!(!cancelled);
  }

  #[tokio::test]
  async fn test_get_active_jobs_logic() {
    let state = create_test_state();

    // Изначально пусто
    let jobs = get_active_jobs_logic(&state).await;
    assert_eq!(jobs.len(), 0);

    // Добавим задачи
    let project = create_test_project();
    let _job_id1 = compile_video_logic(project.clone(), "/tmp/output1.mp4".to_string(), &state)
      .await
      .unwrap();

    let _job_id2 = compile_video_logic(project, "/tmp/output2.mp4".to_string(), &state)
      .await
      .unwrap();

    // Проверим
    let jobs = get_active_jobs_logic(&state).await;
    assert_eq!(jobs.len(), 2);

    // Очистим
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_check_timeouts_logic() {
    let state = create_test_state();
    let project = create_test_project();

    // Добавим задачу с фальшивой старой датой
    let old_metadata = RenderJobMetadata {
      project_name: "Old Project".to_string(),
      output_path: "/tmp/old.mp4".to_string(),
      created_at: "2020-01-01T00:00:00Z".to_string(),
    };

    let (tx, _rx) = mpsc::unbounded_channel();
    let renderer = VideoRenderer::new(
      project.clone(),
      state.settings.clone(),
      state.cache_manager.clone(),
      tx,
    )
    .await
    .unwrap();

    let old_job_id = "old-job".to_string();
    {
      let mut jobs = state.active_jobs.write().await;
      jobs.insert(
        old_job_id.clone(),
        ActiveRenderJob {
          renderer,
          metadata: old_metadata,
        },
      );
    }

    // Проверим таймауты
    let timed_out = check_render_job_timeouts_logic(&state, 60).await;
    assert!(timed_out.contains(&old_job_id));

    // Очистим
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_create_new_project_logic() {
    let project = create_new_project_logic("Test Project".to_string()).await;
    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(project.version, "1.0.0");
    assert!(project.tracks.is_empty());
  }

  #[tokio::test]
  async fn test_check_ffmpeg_availability_logic() {
    // Test with invalid path
    let available = check_ffmpeg_availability_logic("/invalid/path/to/ffmpeg")
      .await
      .unwrap();
    assert!(!available);

    // Test with 'false' command (exists on Unix systems)
    #[cfg(unix)]
    {
      let available = check_ffmpeg_availability_logic("false").await.unwrap();
      assert!(!available);
    }
  }

  #[test]
  fn test_get_system_info_logic() {
    let info = get_system_info_logic();
    assert!(!info.os.is_empty());
    assert!(!info.arch.is_empty());
    assert!(info.cpu_cores > 0);
    assert!(!info.temp_directory.is_empty());
  }

  #[tokio::test]
  async fn test_clear_preview_cache_logic() {
    let state = create_test_state();
    let result = clear_preview_cache_logic(&state).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_get_render_statistics_logic() {
    let state = create_test_state();
    let stats = get_render_statistics_logic(&state).await;
    assert_eq!(stats.active_renders, 0);
    assert_eq!(stats.cache_hit_rate, 0.0);
  }

  #[tokio::test]
  async fn test_validate_media_file_logic() {
    // Test non-existent file
    let valid = validate_media_file_logic("/non/existent/file.mp4")
      .await
      .unwrap();
    assert!(!valid);

    // Test invalid extension
    let valid = validate_media_file_logic("test.txt").await.unwrap();
    assert!(!valid);

    // Test path without extension
    let valid = validate_media_file_logic("no_extension").await.unwrap();
    assert!(!valid);
  }

  #[tokio::test]
  async fn test_cache_memory_usage() {
    let state = create_test_state();
    let usage = get_cache_memory_usage_logic(&state).await;
    assert!(usage.total_mb() >= 0.0);
  }

  #[tokio::test]
  async fn test_get_render_job_non_existent() {
    let state = create_test_state();
    let job = get_render_job_logic("non-existent-job", &state)
      .await
      .unwrap();
    assert!(job.is_none());
  }

  #[tokio::test]
  async fn test_generate_preview_logic() {
    let state = create_test_state();

    // Test with non-existent file
    let result = generate_preview_logic(
      "/non/existent/video.mp4",
      10.0,
      Some((320, 240)),
      Some(75),
      &state,
    )
    .await;

    assert!(result.is_err());
  }

  #[tokio::test]
  #[ignore = "Preview module behavior may vary"]
  async fn test_get_video_info_logic() {
    let state = create_test_state();

    // Test with non-existent file
    let result = get_video_info_logic("/non/existent/video.mp4", &state).await;
    // Result depends on preview module implementation
    let _ = result;
  }

  #[tokio::test]
  async fn test_set_ffmpeg_path_logic() {
    // Test with invalid path
    let result = set_ffmpeg_path_logic("/invalid/ffmpeg/path").await.unwrap();
    assert!(!result);

    // Test with false command (always returns non-zero)
    #[cfg(unix)]
    {
      let result = set_ffmpeg_path_logic("false").await.unwrap();
      assert!(!result);
    }
  }

  #[test]
  fn test_touch_project_logic() {
    let project = create_test_project();
    let original_timestamp = project.metadata.modified_at;

    // Small delay to ensure timestamp changes
    std::thread::sleep(std::time::Duration::from_millis(10));

    let updated = touch_project_logic(project);
    assert_ne!(updated.metadata.modified_at, original_timestamp);
  }

  #[test]
  fn test_create_track_logic() {
    let track = create_track_logic(
      crate::video_compiler::schema::TrackType::Video,
      "Test Track".to_string(),
    );

    assert_eq!(track.name, "Test Track");
    assert_eq!(
      track.track_type,
      crate::video_compiler::schema::TrackType::Video
    );
    assert!(track.clips.is_empty());
  }

  #[test]
  fn test_create_clip_logic() {
    // Test with non-existent file
    let result = create_clip_logic("/non/existent/video.mp4".to_string(), 0.0, 10.0);

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Файл не найден"));
  }

  #[test]
  fn test_create_effect_logic() {
    let effect = create_effect_logic(
      crate::video_compiler::schema::EffectType::Blur,
      "Blur Effect".to_string(),
    );

    assert_eq!(effect.name, "Blur Effect");
    assert_eq!(
      effect.effect_type,
      crate::video_compiler::schema::EffectType::Blur
    );
  }

  #[test]
  fn test_create_filter_logic() {
    let filter = create_filter_logic(
      crate::video_compiler::schema::FilterType::Blur,
      "Soft Blur".to_string(),
    );

    assert_eq!(filter.name, "Soft Blur");
    assert_eq!(
      filter.filter_type,
      crate::video_compiler::schema::FilterType::Blur
    );
  }

  #[test]
  fn test_create_subtitle_logic() {
    // Test valid subtitle
    let subtitle = create_subtitle_logic("Test subtitle".to_string(), 0.0, 5.0).unwrap();

    assert_eq!(subtitle.text, "Test subtitle");
    assert_eq!(subtitle.get_duration(), 5.0);

    // Test invalid subtitle (end before start)
    let result = create_subtitle_logic("Invalid".to_string(), 5.0, 2.0);

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_clear_frame_cache_logic() {
    let state = create_test_state();
    let result = clear_frame_cache_logic(&state).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_configure_cache_logic() {
    let state = create_test_state();

    // Test with some values
    let result = configure_cache_logic(Some(1024), Some(500), &state).await;

    assert!(result.is_ok());

    // Test with None values (should use defaults)
    let result = configure_cache_logic(None, None, &state).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_get_cache_size_logic() {
    let state = create_test_state();
    let size = get_cache_size_logic(&state).await;
    assert!(size >= 0.0);
  }

  #[test]
  fn test_add_clip_to_track_logic() {
    use std::path::PathBuf;

    let track = create_track_logic(
      crate::video_compiler::schema::TrackType::Video,
      "Test Track".to_string(),
    );

    let clip = crate::video_compiler::schema::Clip::new(PathBuf::from("/tmp/test.mp4"), 0.0, 10.0);

    let updated_track = add_clip_to_track_logic(track, clip).unwrap();
    assert_eq!(updated_track.clips.len(), 1);
    assert_eq!(
      updated_track.clips[0].end_time - updated_track.clips[0].start_time,
      10.0
    );
  }

  #[tokio::test]
  async fn test_error_paths() {
    let state = create_test_state();

    // Test compile with invalid project
    let mut invalid_project = create_test_project();
    invalid_project.timeline.fps = 0; // Invalid FPS

    let result = compile_video_logic(invalid_project, "/tmp/output.mp4".to_string(), &state).await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_get_cache_stats_with_operations() {
    let state = create_test_state();

    // Clear cache first
    clear_all_cache_logic(&state).await.unwrap();

    // Get initial stats
    let stats1 = get_cache_stats_logic(&state).await;

    // Perform some cache operation
    clear_preview_cache_logic(&state).await.unwrap();

    // Get stats again
    let stats2 = get_cache_stats_logic(&state).await;

    // Stats should be consistent
    assert_eq!(stats1.preview_requests, stats2.preview_requests);
  }

  #[tokio::test]
  async fn test_concurrent_job_operations() {
    let state = create_test_state();
    let project = create_test_project();

    // Add first job
    let job_id1 = compile_video_logic(project.clone(), "/tmp/job1.mp4".to_string(), &state)
      .await
      .unwrap();

    // Get job details while active
    let job_details = get_render_job_logic(&job_id1, &state).await.unwrap();
    assert!(job_details.is_some());

    // Check active jobs count
    let active_jobs = get_active_jobs_logic(&state).await;
    assert_eq!(active_jobs.len(), 1);

    // Cancel job
    cancel_render_logic(&job_id1, &state).await.unwrap();

    // Verify job is gone
    let active_jobs = get_active_jobs_logic(&state).await;
    assert_eq!(active_jobs.len(), 0);
  }

  #[test]
  fn test_create_template_logic() {
    let template = create_template_logic(
      crate::video_compiler::schema::TemplateType::Grid,
      "Test Template".to_string(),
      4,
    );

    assert_eq!(template.name, "Test Template");
    assert_eq!(template.screens, 4);
    assert_eq!(
      template.template_type,
      crate::video_compiler::schema::TemplateType::Grid
    );
  }

  #[test]
  fn test_create_style_template_logic() {
    let style_template = create_style_template_logic(
      "Intro Template".to_string(),
      crate::video_compiler::schema::StyleTemplateCategory::Intro,
      crate::video_compiler::schema::StyleTemplateStyle::Modern,
      5.0,
    );

    assert_eq!(style_template.name, "Intro Template");
    assert_eq!(
      style_template.category,
      crate::video_compiler::schema::StyleTemplateCategory::Intro
    );
    assert_eq!(
      style_template.style,
      crate::video_compiler::schema::StyleTemplateStyle::Modern
    );
    assert_eq!(style_template.duration, 5.0);
  }

  #[test]
  fn test_create_subtitle_animation_logic() {
    let animation = create_subtitle_animation_logic(
      crate::video_compiler::schema::SubtitleAnimationType::FadeIn,
      1.5,
    );

    assert_eq!(
      animation.animation_type,
      crate::video_compiler::schema::SubtitleAnimationType::FadeIn
    );
    assert_eq!(animation.duration, 1.5);
  }

  #[tokio::test]
  async fn test_get_render_cache_info_logic() {
    let state = create_test_state();
    let info = get_render_cache_info_logic(&state).await.unwrap();

    assert!(info.is_object());
    assert!(info["memory_usage"].is_object());
    assert!(info["stats"].is_object());
    assert!(info["memory_usage"]["total_mb"].is_number());
    assert!(info["stats"]["hit_ratio"].is_number());
  }

  #[tokio::test]
  async fn test_cache_media_metadata_logic() {
    let state = create_test_state();

    // Cache metadata
    let result = cache_media_metadata_logic(
      "/tmp/test_video.mp4".to_string(),
      120.0,
      Some((1920, 1080)),
      &state,
    )
    .await;

    assert!(result.is_ok());

    // Retrieve cached metadata
    let metadata = get_cached_metadata_logic("/tmp/test_video.mp4", &state).await;
    assert!(metadata.is_some());

    let meta = metadata.unwrap();
    assert_eq!(meta.duration, 120.0);
    assert_eq!(meta.resolution, Some((1920, 1080)));
  }

  #[tokio::test]
  async fn test_template_creation_with_different_types() {
    // Test different template types
    let vertical_template = create_template_logic(
      crate::video_compiler::schema::TemplateType::Vertical,
      "Vertical Template".to_string(),
      2,
    );
    assert_eq!(
      vertical_template.template_type,
      crate::video_compiler::schema::TemplateType::Vertical
    );

    let horizontal_template = create_template_logic(
      crate::video_compiler::schema::TemplateType::Horizontal,
      "Horizontal Template".to_string(),
      3,
    );
    assert_eq!(horizontal_template.screens, 3);
  }

  #[test]
  fn test_style_template_categories() {
    // Test different style template categories
    let outro_template = create_style_template_logic(
      "Outro".to_string(),
      crate::video_compiler::schema::StyleTemplateCategory::Outro,
      crate::video_compiler::schema::StyleTemplateStyle::Minimal,
      3.0,
    );
    assert_eq!(
      outro_template.category,
      crate::video_compiler::schema::StyleTemplateCategory::Outro
    );

    let title_template = create_style_template_logic(
      "Title".to_string(),
      crate::video_compiler::schema::StyleTemplateCategory::Title,
      crate::video_compiler::schema::StyleTemplateStyle::Corporate,
      2.0,
    );
    assert_eq!(
      title_template.style,
      crate::video_compiler::schema::StyleTemplateStyle::Corporate
    );
  }

  #[test]
  fn test_subtitle_animation_types() {
    // Test different animation types
    let fade_out = create_subtitle_animation_logic(
      crate::video_compiler::schema::SubtitleAnimationType::FadeOut,
      1.0,
    );
    assert_eq!(
      fade_out.animation_type,
      crate::video_compiler::schema::SubtitleAnimationType::FadeOut
    );

    let slide_in = create_subtitle_animation_logic(
      crate::video_compiler::schema::SubtitleAnimationType::SlideIn,
      0.5,
    );
    assert_eq!(slide_in.duration, 0.5);
  }

  #[tokio::test]
  async fn test_prerender_segment_logic() {
    let state = create_test_state();
    let project = create_test_project();

    // Test invalid time range
    let result = prerender_segment_logic(project.clone(), 10.0, 5.0, true, Some(80), &state).await;

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Start time must be before end time"));

    // Test duration too long
    let result = prerender_segment_logic(project.clone(), 0.0, 70.0, true, Some(80), &state).await;

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("cannot be longer than 60 seconds"));
  }

  #[tokio::test]
  async fn test_get_prerender_cache_info_logic() {
    let info = get_prerender_cache_info_logic().await.unwrap();
    // Just verify the structure exists and types are correct
    let _ = info.file_count; // usize is always >= 0
    let _ = info.total_size; // u64 is always >= 0
    assert_eq!(info.files.len(), info.file_count);
  }

  #[tokio::test]
  async fn test_clear_prerender_cache_logic() {
    let deleted_size = clear_prerender_cache_logic().await.unwrap();
    let _ = deleted_size; // u64 is always >= 0
  }

  #[tokio::test]
  async fn test_cleanup_cache_logic() {
    let state = create_test_state();
    let result = cleanup_cache_logic(&state).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_get_current_gpu_info_logic() {
    let state = create_test_state();
    let result = get_current_gpu_info_logic(&state).await.unwrap();
    // Result can be None if no GPU is detected
    let _ = result;
  }

  #[tokio::test]
  async fn test_check_hardware_acceleration_logic() {
    let state = create_test_state();
    let result = check_hardware_acceleration_logic(&state).await.unwrap();
    // Result depends on system capabilities
    let _ = result; // Function completed successfully
  }

  #[tokio::test]
  async fn test_extract_timeline_frames_logic() {
    let state = create_test_state();

    // Test with valid parameters (the actual extraction will fail due to missing ffmpeg/file)
    let result =
      extract_timeline_frames_logic("/test/video.mp4", 60.0, 5.0, Some(12), &state).await;

    // The result might be Ok with empty frames or Err depending on the implementation
    // Since we can't predict the exact behavior without a real video file,
    // we just check that the function completes without panic
    if let Ok(frames) = result {
      let _ = frames; // Function completed successfully
    } // Error is also acceptable for missing file
  }

  #[tokio::test]
  async fn test_extract_subtitle_frames_logic() {
    let state = create_test_state();
    let subtitles = vec![crate::video_compiler::schema::Subtitle::new(
      "Test subtitle".to_string(),
      0.0,
      5.0,
    )];

    // Test with valid parameters (the actual extraction will fail due to missing ffmpeg/file)
    let result = extract_subtitle_frames_logic("/test/video.mp4", subtitles, &state).await;

    // The result might be Ok with empty result or Err depending on the implementation
    if let Ok(frames) = result {
      let _ = frames; // Function completed successfully
    } // Error is also acceptable for missing file
  }

  #[tokio::test]
  async fn test_check_ffmpeg_capabilities_logic() {
    let _state = create_test_state();

    // Set invalid FFmpeg path
    let mut invalid_state = create_test_state();
    invalid_state.ffmpeg_path = "/invalid/path/to/ffmpeg".to_string();

    let result = check_ffmpeg_capabilities_logic(&invalid_state).await;
    assert!(result.is_err());
  }

  #[test]
  fn test_extract_ffmpeg_version() {
    let output = "ffmpeg version 4.4.0-static  https://johnvansickle.com/ffmpeg/";
    let version = extract_ffmpeg_version(output);
    assert!(version.contains("ffmpeg version"));

    let no_version_output = "No version info here";
    let version = extract_ffmpeg_version(no_version_output);
    assert_eq!(version, "Unknown");
  }

  #[test]
  fn test_extract_available_codecs() {
    let output = r#"Codecs:
 D..... = Decoding supported
 .E.... = Encoding supported
 ..V... = Video codec
 ..A... = Audio codec
 DEV.L. h264                 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10
 DEV.L. h265                 H.265 / HEVC
 DEA.L. aac                  AAC (Advanced Audio Coding)
 DEA.L. mp3                  MP3 (MPEG audio layer 3)
"#;

    let codecs = extract_available_codecs(output);
    assert!(codecs.contains(&"h264".to_string()));
    assert!(codecs.contains(&"h265".to_string()));
    assert!(codecs.contains(&"aac".to_string()));
    assert!(codecs.contains(&"mp3".to_string()));
  }

  #[test]
  fn test_extract_hardware_encoders() {
    let output = r#"Encoders:
 V..... = Video encoder
 A..... = Audio encoder
 V..... h264_nvenc           NVIDIA NVENC H.264 encoder
 V..... hevc_nvenc           NVIDIA NVENC hevc encoder
 V..... h264_videotoolbox    VideoToolbox H.264 Encoder
"#;

    let encoders = extract_hardware_encoders(output);
    assert!(encoders.contains(&"h264_nvenc".to_string()));
    assert!(encoders.contains(&"hevc_nvenc".to_string()));
    assert!(encoders.contains(&"h264_videotoolbox".to_string()));
  }

  #[tokio::test]
  async fn test_prerender_with_different_quality() {
    let state = create_test_state();
    let project = create_test_project();

    // Test with low quality
    let result = prerender_segment_logic(project.clone(), 0.0, 10.0, true, Some(30), &state).await;

    // Will fail without valid FFmpeg, but validates parameters
    assert!(result.is_err());

    // Test with high quality
    let result = prerender_segment_logic(project, 0.0, 10.0, false, Some(95), &state).await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_preview_batch_logic() {
    let state = create_test_state();
    let requests = vec![
      crate::video_compiler::commands::PreviewRequest {
        video_path: "/test/video1.mp4".to_string(),
        timestamp: 5.0,
        resolution: Some((640, 360)),
        quality: Some(80),
      },
      crate::video_compiler::commands::PreviewRequest {
        video_path: "/test/video2.mp4".to_string(),
        timestamp: 10.0,
        resolution: Some((640, 360)),
        quality: Some(80),
      },
    ];

    // Result can be Ok or Err depending on implementation
    let result = generate_preview_batch_logic(requests, &state).await;
    if let Ok(previews) = result {
      // If successful, should return results for each request
      assert!(previews.len() <= 2); // May have fewer if some failed
    } // Also acceptable for non-existent files
  }

  #[tokio::test]
  async fn test_get_gpu_info_logic() {
    let state = create_test_state();

    // Test GPU info logic - may fail in test environment
    if let Ok(gpus) = get_gpu_info_logic(&state).await {
      // Verify structure
      for gpu in gpus {
        assert!(!gpu.name.is_empty());
        assert!(!gpu.supported_codecs.is_empty());
      }
    } // Expected in test environment without GPU
  }

  #[tokio::test]
  async fn test_check_gpu_encoder_availability_logic() {
    let state = create_test_state();

    // Test valid encoder names
    let encoders = ["nvenc", "quicksync", "vaapi", "videotoolbox", "amf"];
    for encoder in &encoders {
      let result = check_gpu_encoder_availability_logic(encoder, &state).await;
      assert!(result.is_ok());
      // Result can be true or false depending on system
    }

    // Test invalid encoder name
    let result = check_gpu_encoder_availability_logic("invalid", &state).await;
    assert!(result.is_ok());
    assert!(!result.unwrap());
  }

  #[tokio::test]
  async fn test_get_recommended_gpu_encoder_logic() {
    let state = create_test_state();

    // Test getting recommended encoder
    if let Ok(Some(encoder_name)) = get_recommended_gpu_encoder_logic(&state).await {
      assert!(!encoder_name.is_empty());
    } // Expected in test environment
  }

  #[tokio::test]
  async fn test_store_and_get_render_data_logic() {
    let state = create_test_state();
    let cache_key = "test_render_123".to_string();
    let output_path = "/tmp/test_render.mp4".to_string();
    let render_hash = "abc123def456".to_string();
    let file_size = 1048576u64; // 1MB

    // Store render data
    let result = store_render_data_logic(
      cache_key.clone(),
      output_path.clone(),
      render_hash.clone(),
      file_size,
      &state,
    )
    .await;
    assert!(result.is_ok());

    // Retrieve render data
    let result = get_render_data_logic(&cache_key, &state).await;
    assert!(result.is_ok());

    if let Some(render_data) = result.unwrap() {
      assert_eq!(render_data.cache_key, cache_key);
      assert_eq!(render_data.output_path.to_string_lossy(), output_path);
      assert_eq!(render_data.render_hash, render_hash);
      assert_eq!(render_data.file_size, file_size);
    }
  }

  #[tokio::test]
  async fn test_get_render_data_logic_missing() {
    let state = create_test_state();

    // Try to get non-existent render data
    let result = get_render_data_logic("non_existent_key", &state).await;
    assert!(result.is_ok());
    assert!(result.unwrap().is_none());
  }

  #[tokio::test]
  async fn test_render_cache_data_fields() {
    use crate::video_compiler::cache::RenderCacheData;
    use std::path::PathBuf;
    use std::time::SystemTime;

    // Test that all fields are accessible
    let render_data = RenderCacheData {
      cache_key: "test".to_string(),
      output_path: PathBuf::from("/test/output.mp4"),
      render_hash: "hash123".to_string(),
      created_at: SystemTime::now(),
      file_size: 2048,
    };

    // Verify all fields can be read
    assert_eq!(render_data.cache_key, "test");
    assert_eq!(render_data.output_path, PathBuf::from("/test/output.mp4"));
    assert_eq!(render_data.render_hash, "hash123");
    assert_eq!(render_data.file_size, 2048);

    // Verify created_at is recent (within last second)
    let now = SystemTime::now();
    let duration = now.duration_since(render_data.created_at).unwrap();
    assert!(duration.as_secs() < 2);
  }

  #[tokio::test]
  async fn test_multiple_cache_operations() {
    let state = create_test_state();

    // Clear all cache types
    clear_all_cache_logic(&state).await.unwrap();
    clear_preview_cache_logic(&state).await.unwrap();
    clear_frame_cache_logic(&state).await.unwrap();

    // Get cache size after clearing
    let size = get_cache_size_logic(&state).await;
    assert!(size >= 0.0);

    // Cache some metadata
    cache_media_metadata_logic(
      "/tmp/test1.mp4".to_string(),
      60.0,
      Some((1920, 1080)),
      &state,
    )
    .await
    .unwrap();

    cache_media_metadata_logic(
      "/tmp/test2.mp4".to_string(),
      120.0,
      Some((3840, 2160)),
      &state,
    )
    .await
    .unwrap();

    // Check cached metadata
    let meta1 = get_cached_metadata_logic("/tmp/test1.mp4", &state).await;
    assert!(meta1.is_some());

    let meta2 = get_cached_metadata_logic("/tmp/test2.mp4", &state).await;
    assert!(meta2.is_some());

    // Cleanup old entries
    cleanup_cache_logic(&state).await.unwrap();
  }
}
