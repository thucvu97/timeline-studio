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
  schema::ProjectSchema,
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
}
