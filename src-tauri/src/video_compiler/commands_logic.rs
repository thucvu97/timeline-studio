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
}
