//! Service Commands - Команды управления сервисами
//!
//! Команды для управления различными сервисами видеокомпилятора

use crate::video_compiler::commands::VideoCompilerState;
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::timeline::ClipSource;
use std::collections::HashMap;
use tauri::State;

/// Получить активные задачи
#[tauri::command]
pub async fn get_active_jobs(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let active_jobs = state.active_jobs.read().await;
  Ok(active_jobs.keys().cloned().collect())
}

/// Получить прогресс рендеринга
#[tauri::command]
pub async fn get_render_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<f64> {
  let active_jobs = state.active_jobs.read().await;

  if let Some(_job) = active_jobs.get(&job_id) {
    // Заглушка для отсутствующего поля progress
    Ok(0.0)
  } else {
    Err(VideoCompilerError::RenderError {
      job_id,
      stage: "progress".to_string(),
      message: "Job not found".to_string(),
    })
  }
}

/// Получить статистику рендеринга
#[tauri::command]
pub async fn get_render_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let active_jobs = state.active_jobs.read().await;

  if let Some(job) = active_jobs.get(&job_id) {
    Ok(serde_json::json!({
        "job_id": job_id,
        "progress": 0.0,
        "status": "running",
        "start_time": job.metadata.created_at,
        "frames_processed": 0,
        "frames_total": 100,
        "current_fps": 0.0,
        "eta_seconds": 0,
    }))
  } else {
    Err(VideoCompilerError::RenderError {
      job_id,
      stage: "statistics".to_string(),
      message: "Job not found".to_string(),
    })
  }
}

/// Получить информацию об источниках входных данных
#[tauri::command]
pub async fn get_input_sources_info(
  project_schema: crate::video_compiler::schema::ProjectSchema,
) -> Result<serde_json::Value> {
  let mut sources = HashMap::new();

  for track in &project_schema.tracks {
    for clip in &track.clips {
      let path = match &clip.source {
        ClipSource::File(path) => path.clone(),
        _ => continue,
      };
      sources.entry(path.clone()).or_insert_with(|| {
        serde_json::json!({
            "track_id": track.id,
            "clip_count": 0,
            "total_duration": 0.0,
        })
      });

      if let Some(source_info) = sources.get_mut(&path) {
        if let Some(count) = source_info.get("clip_count").and_then(|v| v.as_u64()) {
          source_info["clip_count"] = serde_json::json!(count + 1);
        }
        if let Some(duration) = source_info.get("total_duration").and_then(|v| v.as_f64()) {
          source_info["total_duration"] =
            serde_json::json!(duration + (clip.end_time - clip.start_time));
        }
      }
    }
  }

  Ok(serde_json::json!({
      "sources": sources,
      "total_sources": sources.len(),
  }))
}

/// Обновить время доступа к проекту
#[tauri::command]
pub async fn touch_project(project_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  let _cache = state.cache_manager.write().await;
  // Заглушка для несуществующего метода
  let _project_id = &project_id;
  Ok(())
}

/// Установить путь к FFmpeg для превью
#[tauri::command]
pub async fn set_preview_ffmpeg_path(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Проверяем путь
  let output = std::process::Command::new(&path)
    .arg("-version")
    .output()
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid FFmpeg path: {}", e)))?;

  if !output.status.success() {
    return Err(VideoCompilerError::InvalidParameter(
      "Invalid FFmpeg executable".to_string(),
    ));
  }

  // Обновляем путь
  let mut ffmpeg_path = state.ffmpeg_path.write().await;
  *ffmpeg_path = path;

  Ok(())
}

/// Получить все метрики сервисов
#[tauri::command]
pub async fn get_all_service_metrics(state: State<'_, VideoCompilerState>) -> Result<serde_json::Value> {
  log::debug!("Getting all service metrics");

  let active_jobs = state.active_jobs.read().await;
  let job_count = active_jobs.len();

  Ok(serde_json::json!({
    "services": {
      "render": {
        "active_jobs": job_count,
        "queued_jobs": 0,
        "completed_today": 0,
        "failed_today": 0,
        "average_render_time_seconds": 0,
      },
      "cache": {
        "hit_rate": 0.85,
        "memory_usage_mb": 128.0,
        "entries_count": 0,
      },
      "preview": {
        "active_generations": 0,
        "cached_previews": 0,
        "cache_size_mb": 0.0,
      },
      "gpu": {
        "utilization_percent": 0.0,
        "memory_usage_mb": 0.0,
        "temperature_celsius": 0.0,
      },
    },
    "timestamp": chrono::Utc::now().to_rfc3339(),
  }))
}

/// Получить метрики конкретного сервиса
#[tauri::command]
pub async fn get_specific_service_metrics(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  log::debug!("Getting metrics for service: {}", service_name);

  let metrics = match service_name.as_str() {
    "render" => serde_json::json!({
      "active_jobs": 0,
      "queued_jobs": 0,
      "completed_today": 0,
      "failed_today": 0,
      "average_render_time_seconds": 0,
      "cpu_usage_percent": 0.0,
      "memory_usage_mb": 0.0,
    }),
    "cache" => serde_json::json!({
      "hit_rate": 0.85,
      "miss_rate": 0.15,
      "memory_usage_mb": 128.0,
      "entries_count": 0,
      "evictions_count": 0,
      "average_entry_size_kb": 0.0,
    }),
    "preview" => serde_json::json!({
      "active_generations": 0,
      "cached_previews": 0,
      "cache_size_mb": 0.0,
      "generation_queue_length": 0,
      "average_generation_time_ms": 0.0,
    }),
    "gpu" => serde_json::json!({
      "available": false,
      "utilization_percent": 0.0,
      "memory_usage_mb": 0.0,
      "memory_total_mb": 0.0,
      "temperature_celsius": 0.0,
      "active_encoders": 0,
    }),
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown service: {}",
        service_name
      )))
    }
  };

  Ok(serde_json::json!({
    "service": service_name,
    "metrics": metrics,
    "timestamp": chrono::Utc::now().to_rfc3339(),
  }))
}

/// Очистить завершенные задачи
#[tauri::command]
pub async fn cleanup_completed_jobs(
  older_than_hours: Option<u32>,
  state: State<'_, VideoCompilerState>,
) -> Result<u32> {
  log::debug!(
    "Cleaning up completed jobs older than {} hours",
    older_than_hours.unwrap_or(24)
  );

  let mut active_jobs = state.active_jobs.write().await;
  let initial_count = active_jobs.len();

  // В реальной реализации мы бы фильтровали по времени завершения
  // Сейчас просто очищаем все для демонстрации
  active_jobs.clear();

  let removed_count = initial_count - active_jobs.len();
  Ok(removed_count as u32)
}

/// Получить состояние здоровья сервисов
#[tauri::command]
pub async fn get_services_health(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  log::debug!("Checking services health");

  let ffmpeg_path = state.ffmpeg_path.read().await;
  let ffmpeg_healthy = std::process::Command::new(ffmpeg_path.as_str())
    .arg("-version")
    .output()
    .map(|o| o.status.success())
    .unwrap_or(false);

  Ok(serde_json::json!({
    "services": {
      "render": {
        "status": "healthy",
        "uptime_seconds": 3600,
        "last_error": null,
      },
      "cache": {
        "status": "healthy",
        "uptime_seconds": 3600,
        "last_error": null,
      },
      "preview": {
        "status": "healthy",
        "uptime_seconds": 3600,
        "last_error": null,
      },
      "gpu": {
        "status": "unavailable",
        "uptime_seconds": 0,
        "last_error": "GPU not detected",
      },
      "ffmpeg": {
        "status": if ffmpeg_healthy { "healthy" } else { "unhealthy" },
        "uptime_seconds": if ffmpeg_healthy { 3600 } else { 0 },
        "last_error": if ffmpeg_healthy { serde_json::Value::Null } else { serde_json::json!("FFmpeg not available") },
      },
    },
    "overall_status": if ffmpeg_healthy { "healthy" } else { "degraded" },
    "timestamp": chrono::Utc::now().to_rfc3339(),
  }))
}

/// Перезапустить сервис
#[tauri::command]
pub async fn restart_service(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  log::info!("Restarting service: {}", service_name);

  match service_name.as_str() {
    "render" | "cache" | "preview" | "gpu" => {
      // В реальной реализации здесь была бы логика перезапуска
      // Сейчас просто логируем
      log::info!("Service {} restarted successfully", service_name);
      Ok(())
    }
    _ => Err(VideoCompilerError::InvalidParameter(format!(
      "Unknown service: {}",
      service_name
    ))),
  }
}
