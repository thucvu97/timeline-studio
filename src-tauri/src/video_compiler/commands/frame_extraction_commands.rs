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

// ============ Бизнес-логика (тестируемая) ============

/// Рассчитать временные метки для извлечения кадров
pub fn calculate_frame_timestamps(duration: f64, interval: f64) -> Vec<f64> {
  let mut timestamps = Vec::new();
  let mut timestamp = 0.0;

  while timestamp <= duration {
    timestamps.push(timestamp);
    timestamp += interval;
  }

  timestamps
}

/// Генерировать пути для кадров
pub fn generate_frame_paths(output_dir: &str, timestamps: &[f64]) -> Vec<String> {
  timestamps
    .iter()
    .map(|ts| format!("{}/frame_{:.2}.png", output_dir, ts))
    .collect()
}

/// Генерировать путь для кадра субтитра
pub fn generate_subtitle_frame_path(output_dir: &str, subtitle_id: &str) -> String {
  format!("{}/subtitle_{}.png", output_dir, subtitle_id)
}

// ============ Tauri команды (тонкие обёртки) ============

/// Извлечь кадры таймлайна
#[tauri::command]
pub async fn extract_timeline_frames(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  interval: f64,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let duration = project_schema.timeline.duration;
  let timestamps = calculate_frame_timestamps(duration, interval);
  let frame_paths = generate_frame_paths(&output_dir, &timestamps);

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  for (timestamp, frame_path) in timestamps.iter().zip(frame_paths.iter()) {
    generator
      .generate_frame(&project_schema, *timestamp, frame_path, None)
      .await?;
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
  let frame_paths: Vec<String> = project_schema
    .subtitles
    .iter()
    .map(|subtitle| generate_subtitle_frame_path(&output_dir, &subtitle.id))
    .collect();

  // Здесь должна быть логика генерации кадра с субтитром

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

/// Извлечь настройки превью из JSON
pub fn extract_preview_options(
  settings: &serde_json::Value,
) -> crate::video_compiler::preview::PreviewOptions {
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
  let format = settings
    .get("format")
    .and_then(|v| v.as_str())
    .unwrap_or("png")
    .to_string();

  crate::video_compiler::preview::PreviewOptions {
    width: Some(width),
    height: Some(height),
    quality,
    format,
  }
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
  let options = extract_preview_options(&settings);

  generator
    .generate_frame(&project_schema, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать информацию о кэше кадров
pub fn generate_cache_info(
  project_id: &str,
  frame_count: u64,
  total_size: u64,
) -> serde_json::Value {
  serde_json::json!({
      "project_id": project_id,
      "frame_count": frame_count,
      "total_size": total_size,
      "last_accessed": chrono::Utc::now().to_rfc3339(),
  })
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_info(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let _cache = state.cache_manager.read().await;
  // Заглушка для несуществующего метода
  Ok(generate_cache_info(&project_id, 0, 0))
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

/// Рассчитать временные метки для миниатюр
pub fn calculate_thumbnail_timestamps(duration: f64, count: usize) -> Result<Vec<f64>> {
  if duration <= 0.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Cannot extract thumbnails: video duration is 0".to_string(),
    ));
  }

  let mut timestamps = Vec::new();
  let interval = duration / (count as f64 + 1.0);

  for i in 1..=count {
    timestamps.push(interval * i as f64);
  }

  Ok(timestamps)
}

/// Извлечь длительность видео из информации
pub fn extract_video_duration(video_info: &serde_json::Value) -> f64 {
  video_info
    .get("format")
    .and_then(|f| f.get("duration"))
    .and_then(|d| d.as_str())
    .and_then(|d| d.parse::<f64>().ok())
    .unwrap_or(0.0)
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

  let duration = extract_video_duration(&video_info);
  let timestamps = calculate_thumbnail_timestamps(duration, count)?;

  // Извлекаем кадры
  extract_video_frames_batch(video_path, timestamps, output_dir, state).await
}

#[cfg(test)]
pub mod frame_extraction_commands_tests;
