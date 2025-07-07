//! Frame Extraction Commands - Команды для извлечения кадров
//!
//! Команды для работы с извлечением кадров из видео и таймлайна

use crate::video_compiler::commands::VideoCompilerState;
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::preview::PreviewGenerator;
use tauri::State;

/// Кадр таймлайна
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TimelineFrame {
  pub timestamp: f64,
  pub frame_data: Vec<u8>,
  pub width: u32,
  pub height: u32,
}

/// Результат кадра субтитров
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SubtitleFrameResult {
  pub subtitle_id: String,
  pub timestamp: f64,
  pub frame_path: String,
  pub width: u32,
  pub height: u32,
}

/// Запрос на превью
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PreviewRequest {
  pub video_path: String,
  pub timestamp: f64,
  pub resolution: Option<(u32, u32)>,
  pub quality: Option<u8>,
}

/// Извлечь кадры таймлайна
#[tauri::command]
pub async fn extract_timeline_frames(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  interval: f64,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut frame_paths = Vec::new();
  let duration = project_schema.timeline.duration;
  let mut timestamp = 0.0;

  while timestamp <= duration {
    let frame_path = format!("{output_dir}/frame_{timestamp:.2}.png");

    // Генерируем кадр
    let ffmpeg_path = state.ffmpeg_path.read().await.clone();
    let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
    generator
      .generate_frame(&project_schema, timestamp, &frame_path, None)
      .await?;

    frame_paths.push(frame_path);
    timestamp += interval;
  }

  Ok(frame_paths)
}

/// Извлечь кадры субтитров
#[tauri::command]
pub async fn extract_subtitle_frames(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut frame_paths = Vec::new();

  for subtitle in &project_schema.subtitles {
    let frame_path = format!("{}/subtitle_{}.png", output_dir, subtitle.id);
    // Здесь должна быть логика генерации кадра с субтитром
    frame_paths.push(frame_path);
  }

  Ok(frame_paths)
}

/// Генерировать превью
#[tauri::command]
pub async fn generate_preview(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  generator
    .generate_frame(&project_schema, timestamp, &output_path, None)
    .await?;

  Ok(output_path)
}

/// Генерировать пакет превью
#[tauri::command]
pub async fn generate_preview_batch(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  timestamps: Vec<f64>,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  let mut paths = Vec::new();

  for timestamp in timestamps {
    let output_path = format!("{output_dir}/preview_{timestamp:.2}.png");
    generator
      .generate_frame(&project_schema, timestamp, &output_path, None)
      .await?;
    paths.push(output_path);
  }

  Ok(paths)
}

/// Генерировать превью с настройками
#[tauri::command]
pub async fn generate_preview_with_settings(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  timestamp: f64,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Извлекаем настройки
  let width = settings
    .get("width")
    .and_then(|v| v.as_u64())
    .unwrap_or(1920) as u32;
  let height = settings
    .get("height")
    .and_then(|v| v.as_u64())
    .unwrap_or(1080) as u32;
  let quality = settings
    .get("quality")
    .and_then(|v| v.as_u64())
    .unwrap_or(80) as u8;

  let options = crate::video_compiler::preview::PreviewOptions {
    width: Some(width),
    height: Some(height),
    quality,
    format: "png".to_string(),
  };

  generator
    .generate_frame(&project_schema, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_info(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let _cache = state.cache_manager.read().await;
  // Заглушка для несуществующего метода
  let _info = &project_id;

  Ok(serde_json::json!({
      "project_id": project_id,
      "frame_count": 0,
      "total_size": 0,
      "last_accessed": chrono::Utc::now().to_rfc3339(),
  }))
}

/// Очистить кэш кадров
#[tauri::command]
pub async fn clear_frame_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Извлечь кадр из видео
#[tauri::command]
pub async fn extract_video_frame(
  video_path: String,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  // Используем FFmpeg напрямую для извлечения кадра
  let output = std::process::Command::new(&ffmpeg_path)
    .args([
      "-ss",
      &timestamp.to_string(),
      "-i",
      &video_path,
      "-frames:v",
      "1",
      "-y",
      &output_path,
    ])
    .output()
    .map_err(|e| VideoCompilerError::FFmpegError {
      command: "ffmpeg".to_string(),
      exit_code: None,
      stderr: e.to_string(),
    })?;

  if !output.status.success() {
    return Err(VideoCompilerError::FFmpegError {
      command: "ffmpeg".to_string(),
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    });
  }

  Ok(output_path)
}

/// Извлечь несколько кадров из видео
#[tauri::command]
pub async fn extract_video_frames_batch(
  video_path: String,
  timestamps: Vec<f64>,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut frame_paths = Vec::new();

  for (index, timestamp) in timestamps.iter().enumerate() {
    let output_path = format!("{output_dir}/frame_{index:04}.png");

    extract_video_frame(
      video_path.clone(),
      *timestamp,
      output_path.clone(),
      state.clone(),
    )
    .await?;

    frame_paths.push(output_path);
  }

  Ok(frame_paths)
}

/// Получить миниатюры видео
#[tauri::command]
pub async fn get_video_thumbnails(
  video_path: String,
  count: usize,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  // Сначала получаем длительность видео
  let video_info =
    crate::video_compiler::commands::misc::get_video_info(video_path.clone(), state.clone())
      .await?;

  let duration = video_info
    .get("format")
    .and_then(|f| f.get("duration"))
    .and_then(|d| d.as_str())
    .and_then(|d| d.parse::<f64>().ok())
    .unwrap_or(0.0);

  if duration <= 0.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Cannot extract thumbnails: video duration is 0".to_string(),
    ));
  }

  // Генерируем timestamps равномерно распределенные по видео
  let mut timestamps = Vec::new();
  let interval = duration / (count as f64 + 1.0);

  for i in 1..=count {
    timestamps.push(interval * i as f64);
  }

  // Извлекаем кадры
  extract_video_frames_batch(video_path, timestamps, output_dir, state).await
}

#[cfg(test)]
pub mod frame_extraction_commands_tests;
