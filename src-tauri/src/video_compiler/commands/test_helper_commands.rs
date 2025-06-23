//! Test Helper Commands - Команды для тестирования и диагностики
//!
//! Команды для тестирования различных компонентов системы

use crate::video_compiler::commands::VideoCompilerState;
use crate::video_compiler::error::{Result, VideoCompilerError};
use tauri::State;

/// Тестовая команда для проверки различных типов ошибок
#[tauri::command]
pub async fn test_error_types(error_type: String) -> Result<String> {
  match error_type.as_str() {
    "io" => Err(VideoCompilerError::io("Test IO error")),
    "gpu_unavailable" => Err(VideoCompilerError::gpu_unavailable("Test GPU unavailable")),
    "validation" => Err(VideoCompilerError::ValidationError(
      "Test validation error".to_string(),
    )),
    _ => Ok(format!("No error handler for type: {}", error_type)),
  }
}

/// Эмитировать события Video Compiler для тестирования
#[tauri::command]
pub async fn emit_video_compiler_event<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  event_type: String,
  params: serde_json::Value,
) -> Result<()> {
  use crate::video_compiler::{progress::RenderProgress, VideoCompilerEvent};
  use tauri::Emitter;

  let event = match event_type.as_str() {
    "render_progress" => {
      let job_id = params
        .get("job_id")
        .and_then(|v| v.as_str())
        .unwrap_or("test-job")
        .to_string();
      let progress = RenderProgress {
        job_id: job_id.clone(),
        stage: params
          .get("stage")
          .and_then(|v| v.as_str())
          .unwrap_or("processing")
          .to_string(),
        percentage: params
          .get("percentage")
          .and_then(|v| v.as_f64())
          .unwrap_or(50.0) as f32,
        current_frame: params
          .get("current_frame")
          .and_then(|v| v.as_u64())
          .unwrap_or(100),
        total_frames: params
          .get("total_frames")
          .and_then(|v| v.as_u64())
          .unwrap_or(200),
        elapsed_time: std::time::Duration::from_secs(
          params
            .get("elapsed_seconds")
            .and_then(|v| v.as_u64())
            .unwrap_or(0),
        ),
        estimated_remaining: params
          .get("eta_seconds")
          .and_then(|v| v.as_u64())
          .map(std::time::Duration::from_secs),
        status: crate::video_compiler::progress::RenderStatus::Processing,
        message: params
          .get("message")
          .and_then(|v| v.as_str())
          .map(String::from),
      };
      VideoCompilerEvent::RenderProgress { job_id, progress }
    }
    "render_completed" => {
      let job_id = params
        .get("job_id")
        .and_then(|v| v.as_str())
        .unwrap_or("test-job")
        .to_string();
      let output_path = params
        .get("output_path")
        .and_then(|v| v.as_str())
        .unwrap_or("/tmp/output.mp4")
        .to_string();
      VideoCompilerEvent::RenderCompleted {
        job_id,
        output_path,
      }
    }
    "render_failed" => {
      let job_id = params
        .get("job_id")
        .and_then(|v| v.as_str())
        .unwrap_or("test-job")
        .to_string();
      let error = params
        .get("error")
        .and_then(|v| v.as_str())
        .unwrap_or("Test error")
        .to_string();
      VideoCompilerEvent::RenderFailed { job_id, error }
    }
    "preview_generated" => {
      let timestamp = params
        .get("timestamp")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
      let image_data = vec![0u8; 1024]; // Test data
      VideoCompilerEvent::PreviewGenerated {
        timestamp,
        image_data,
      }
    }
    "cache_updated" => {
      let cache_size_mb = params
        .get("cache_size_mb")
        .and_then(|v| v.as_f64())
        .unwrap_or(100.0);
      VideoCompilerEvent::CacheUpdated { cache_size_mb }
    }
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown event type: {}",
        event_type
      )));
    }
  };

  app
    .emit("video-compiler", &event)
    .map_err(|e| VideoCompilerError::InternalError(format!("Failed to emit event: {}", e)))?;

  Ok(())
}

/// Проверить здоровье всех сервисов
#[tauri::command]
pub async fn health_check_all_services(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  state.services.health_check_all().await?;

  Ok(serde_json::json!({
      "status": "healthy",
      "services": {
          "render": "ok",
          "cache": "ok",
          "gpu": "ok",
          "preview": "ok",
          "ffmpeg": "ok",
      }
  }))
}

/// Выключить все сервисы
#[tauri::command]
pub async fn shutdown_all_services(state: State<'_, VideoCompilerState>) -> Result<()> {
  state.services.shutdown_all().await
}

/// Получить информацию о сервисах проекта
#[tauri::command]
pub async fn get_project_service_info(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let _services = &state.services;

  Ok(serde_json::json!({
      "project_id": project_id,
      "services": {
          "render": {
              "status": "idle",
              "last_activity": chrono::Utc::now().to_rfc3339(),
          },
          "cache": {
              "status": "active",
              "size_mb": 0,
          },
          "preview": {
              "status": "idle",
              "queue_size": 0,
          }
      }
  }))
}

/// Тестировать таймауты задач рендеринга
#[tauri::command]
pub async fn check_render_job_timeouts(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut timed_out_jobs = Vec::new();
  let active_jobs = state.active_jobs.read().await;

  for (job_id, job) in active_jobs.iter() {
    // Проверяем метаданные задачи
    let elapsed = job
      .metadata
      .created_at
      .parse::<chrono::DateTime<chrono::Utc>>()
      .map(|created| {
        chrono::Utc::now()
          .signed_duration_since(created)
          .num_seconds()
      })
      .unwrap_or(0);
    // Считаем, что задача зависла, если она выполняется более 6 часов
    if elapsed > 21600 {
      timed_out_jobs.push(job_id.clone());
    }
  }

  Ok(timed_out_jobs)
}
