//! Тесты для модуля commands
//!
//! Проверяем функциональность Tauri команд и состояния Video Compiler

#[cfg(test)]
mod tests {
  use crate::video_compiler::commands::{RenderJob, RenderJobMetadata, VideoCompilerState};
  use crate::video_compiler::error::VideoCompilerError;
  use crate::video_compiler::progress::RenderStatus;
  use crate::video_compiler::schema::{AspectRatio, ProjectMetadata, ProjectSchema, Timeline};
  use std::time::SystemTime;
  use uuid::Uuid;

  #[test]
  fn test_video_compiler_state_creation() {
    let state = VideoCompilerState::new();

    // Проверяем что состояние создано правильно
    assert_eq!(state.ffmpeg_path, "ffmpeg");
    assert!(!state.ffmpeg_path.is_empty());
  }

  #[test]
  fn test_video_compiler_state_default() {
    let state = VideoCompilerState::default();

    // Проверяем что default создает то же что и new()
    assert_eq!(state.ffmpeg_path, "ffmpeg");
  }

  #[tokio::test]
  async fn test_video_compiler_state_concurrent_access() {
    let state = VideoCompilerState::new();

    // Тестируем параллельный доступ к активным задачам
    let jobs_lock1 = state.active_jobs.clone();
    let jobs_lock2 = state.active_jobs.clone();

    let handle1 = tokio::spawn(async move {
      let jobs = jobs_lock1.read().await;
      jobs.len()
    });

    let handle2 = tokio::spawn(async move {
      let jobs = jobs_lock2.read().await;
      jobs.len()
    });

    let (result1, result2) = tokio::join!(handle1, handle2);
    assert_eq!(result1.unwrap(), 0);
    assert_eq!(result2.unwrap(), 0);
  }

  #[test]
  fn test_render_job_metadata_creation() {
    let metadata = RenderJobMetadata {
      project_name: "Test Project".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      created_at: "2023-12-25T12:00:00Z".to_string(),
    };

    assert_eq!(metadata.project_name, "Test Project");
    assert_eq!(metadata.output_path, "/tmp/output.mp4");
    assert_eq!(metadata.created_at, "2023-12-25T12:00:00Z");
  }

  #[test]
  fn test_render_job_serialization() {
    let job = RenderJob {
      id: "test-job-123".to_string(),
      project_name: "Test Project".to_string(),
      output_path: "/tmp/test.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: "2023-12-25T12:00:00Z".to_string(),
      progress: None,
      error_message: None,
    };

    // Проверяем сериализацию в JSON
    let json = serde_json::to_string(&job).unwrap();
    assert!(json.contains("test-job-123"));
    assert!(json.contains("Test Project"));
    assert!(json.contains("Processing"));

    // Проверяем десериализацию
    let deserialized: RenderJob = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.id, "test-job-123");
    assert_eq!(deserialized.project_name, "Test Project");
    assert_eq!(deserialized.status, RenderStatus::Processing);
  }

  #[test]
  fn test_render_job_with_error() {
    let job = RenderJob {
      id: "error-job".to_string(),
      project_name: "Failed Project".to_string(),
      output_path: "/tmp/failed.mp4".to_string(),
      status: RenderStatus::Failed,
      created_at: "2023-12-25T12:00:00Z".to_string(),
      progress: None,
      error_message: Some("Rendering failed".to_string()),
    };

    assert_eq!(job.status, RenderStatus::Failed);
    assert_eq!(job.error_message, Some("Rendering failed".to_string()));

    // Проверяем сериализацию задачи с ошибкой
    let json = serde_json::to_string(&job).unwrap();
    assert!(json.contains("Failed"));
    assert!(json.contains("Rendering failed"));
  }

  #[test]
  fn test_render_job_status_types() {
    let statuses = [
      RenderStatus::Queued,
      RenderStatus::Processing,
      RenderStatus::Completed,
      RenderStatus::Failed,
      RenderStatus::Cancelled,
    ];

    // Проверяем что все статусы можно сериализовать
    for status in statuses {
      let job = RenderJob {
        id: "test".to_string(),
        project_name: "test".to_string(),
        output_path: "/tmp/test.mp4".to_string(),
        status: status.clone(),
        created_at: "2023-12-25T12:00:00Z".to_string(),
        progress: None,
        error_message: None,
      };

      let json = serde_json::to_string(&job).unwrap();
      assert!(!json.is_empty());

      let deserialized: RenderJob = serde_json::from_str(&json).unwrap();
      assert_eq!(deserialized.status, status);
    }
  }

  #[tokio::test]
  async fn test_video_compiler_state_settings() {
    let state = VideoCompilerState::new();

    // Тестируем доступ к настройкам
    {
      let settings = state.settings.read().await;
      assert_eq!(settings.max_concurrent_jobs, 2);
      assert_eq!(settings.cache_size_mb, 512);
      assert!(settings.hardware_acceleration);
      assert_eq!(settings.preview_quality, 75);
    }

    // Тестируем изменение настроек
    {
      let mut settings = state.settings.write().await;
      settings.max_concurrent_jobs = 4;
      settings.preview_quality = 85;
    }

    // Проверяем что изменения сохранились
    {
      let settings = state.settings.read().await;
      assert_eq!(settings.max_concurrent_jobs, 4);
      assert_eq!(settings.preview_quality, 85);
    }
  }

  #[tokio::test]
  async fn test_video_compiler_state_cache_manager() {
    let state = VideoCompilerState::new();

    // Тестируем доступ к кэш-менеджеру
    {
      let cache = state.cache_manager.read().await;
      let memory_usage = cache.get_memory_usage();

      // Проверяем что кэш создан и имеет начальные данные
      // Кэш может содержать начальные данные
      assert!(memory_usage.total_mb() >= 0.0);
    }

    // Тестируем статистику кэша
    {
      let cache = state.cache_manager.read().await;
      let stats = cache.get_stats();

      assert_eq!(stats.render_requests, 0);
      assert_eq!(stats.render_hits, 0);
      assert_eq!(stats.render_misses, 0);
    }
  }

  #[tokio::test]
  async fn test_active_jobs_management() {
    let state = VideoCompilerState::new();

    // Создаем фиктивную активную задачу (без настоящего VideoRenderer)
    let _job_id = Uuid::new_v4().to_string();
    let metadata = RenderJobMetadata {
      project_name: "Test Active Job".to_string(),
      output_path: "/tmp/active.mp4".to_string(),
      created_at: chrono::Utc::now().to_rfc3339(),
    };

    // Проверяем начальное состояние
    {
      let jobs = state.active_jobs.read().await;
      assert_eq!(jobs.len(), 0);
    }

    // Примечание: мы не можем создать настоящий ActiveRenderJob
    // без VideoRenderer, поэтому тестируем только структуры данных
    assert_eq!(metadata.project_name, "Test Active Job");
    assert_eq!(metadata.output_path, "/tmp/active.mp4");
    assert!(!metadata.created_at.is_empty());
  }

  #[test]
  fn test_project_schema_creation_for_commands() {
    // Создаем минимальную схему проекта для тестирования команд
    let project_metadata = ProjectMetadata {
      name: "Test Commands Project".to_string(),
      description: Some("Project for testing commands".to_string()),
      created_at: chrono::Utc::now(),
      modified_at: chrono::Utc::now(),
      author: Some("Test Author".to_string()),
    };

    let timeline = Timeline {
      fps: 30,
      duration: 10.0,
      resolution: (1920, 1080),
      aspect_ratio: AspectRatio::Ratio16x9,
      sample_rate: 48000,
    };

    let project = ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: project_metadata,
      timeline,
      tracks: vec![],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: crate::video_compiler::schema::ProjectSettings::default(),
    };

    // Валидируем проект
    assert!(project.validate().is_ok());
    assert_eq!(project.metadata.name, "Test Commands Project");
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (1920, 1080));
  }

  #[test]
  fn test_render_job_metadata_time_format() {
    let now = chrono::Utc::now();
    let time_str = now.to_rfc3339();

    let metadata = RenderJobMetadata {
      project_name: "Time Test".to_string(),
      output_path: "/tmp/time.mp4".to_string(),
      created_at: time_str.clone(),
    };

    // Проверяем что время в правильном формате
    assert!(metadata.created_at.contains("T"));
    assert!(metadata.created_at.contains("Z") || metadata.created_at.contains("+"));
    assert!(!metadata.created_at.is_empty());

    // Проверяем что можем парсить время обратно
    let parsed_time = chrono::DateTime::parse_from_rfc3339(&metadata.created_at);
    assert!(parsed_time.is_ok());
  }

  #[test]
  fn test_video_compiler_error_integration() {
    // Тестируем интеграцию с ошибками VideoCompiler
    let internal_error = VideoCompilerError::InternalError("Test error".to_string());
    let validation_error = VideoCompilerError::ValidationError("Invalid project".to_string());

    assert!(internal_error.to_string().contains("Test error"));
    assert!(validation_error.to_string().contains("Invalid project"));

    // Проверяем сериализацию ошибок
    let internal_json = serde_json::to_string(&internal_error).unwrap();
    let validation_json = serde_json::to_string(&validation_error).unwrap();

    assert!(internal_json.contains("InternalError"));
    assert!(validation_json.contains("ValidationError"));
  }

  #[test]
  fn test_concurrent_job_ids() {
    // Тестируем что генерируются уникальные ID для задач
    let mut job_ids = std::collections::HashSet::new();

    for _ in 0..100 {
      let job_id = Uuid::new_v4().to_string();
      assert!(job_ids.insert(job_id), "Job ID should be unique");
    }

    assert_eq!(job_ids.len(), 100);
  }

  #[test]
  fn test_render_job_clone() {
    let original_job = RenderJob {
      id: "clone-test".to_string(),
      project_name: "Clone Project".to_string(),
      output_path: "/tmp/clone.mp4".to_string(),
      status: RenderStatus::Completed,
      created_at: "2023-12-25T12:00:00Z".to_string(),
      progress: None,
      error_message: None,
    };

    let cloned_job = original_job.clone();

    assert_eq!(original_job.id, cloned_job.id);
    assert_eq!(original_job.project_name, cloned_job.project_name);
    assert_eq!(original_job.status, cloned_job.status);
    assert_eq!(original_job.created_at, cloned_job.created_at);
  }

  #[test]
  fn test_render_job_debug() {
    let job = RenderJob {
      id: "debug-test".to_string(),
      project_name: "Debug Project".to_string(),
      output_path: "/tmp/debug.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: "2023-12-25T12:00:00Z".to_string(),
      progress: None,
      error_message: None,
    };

    let debug_str = format!("{:?}", job);
    assert!(debug_str.contains("debug-test"));
    assert!(debug_str.contains("Debug Project"));
    assert!(debug_str.contains("Processing"));
  }

  #[test]
  fn test_system_time_consistency() {
    // Тестируем консистентность системного времени для метаданных
    let time1 = SystemTime::now();
    let time2 = SystemTime::now();

    // Проверяем что время идет вперед
    assert!(time2 >= time1);

    // Проверяем что можем конвертировать в строку
    let chrono_time = chrono::Utc::now();
    let time_str = chrono_time.to_rfc3339();
    assert!(!time_str.is_empty());
  }
}
