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
