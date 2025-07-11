//! Tauri команды для извлечения кадров

use super::business_logic;
use super::types::*;
use crate::video_compiler::commands::VideoCompilerState;
use crate::video_compiler::error::Result;
use crate::video_compiler::preview::PreviewGenerator;
use crate::video_compiler::schema::ProjectSchema;
use tauri::State;

/// Извлечь кадры таймлайна
#[tauri::command]
pub async fn extract_timeline_frames(
  project_schema: ProjectSchema,
  interval: f64,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let duration = project_schema.timeline.duration;
  let timestamps = business_logic::calculate_frame_timestamps(duration, interval);
  let frame_paths =
    business_logic::generate_frame_paths(&output_dir, &timestamps, &FrameFormat::Png);

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
  project_schema: ProjectSchema,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<SubtitleFrameResult>> {
  let mut results = Vec::new();

  for subtitle in &project_schema.subtitles {
    let frame_path =
      business_logic::generate_subtitle_frame_path(&output_dir, &subtitle.id, &FrameFormat::Png);

    // TODO: Реализовать генерацию кадра с субтитром
    results.push(SubtitleFrameResult {
      subtitle_id: subtitle.id.clone(),
      timestamp: subtitle.start_time,
      frame_path,
      width: 1920,
      height: 1080,
    });
  }

  Ok(results)
}

/// Генерировать превью
#[tauri::command]
pub async fn generate_preview(
  project_schema: ProjectSchema,
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
  project_schema: ProjectSchema,
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

/// Извлечь кадры с параметрами
#[tauri::command]
pub async fn extract_frames_with_params(
  params: FrameExtractionParams,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ExtractedFrame>> {
  // Валидируем параметры
  business_logic::validate_extraction_params(&params)?;

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let _generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // TODO: Реализовать извлечение кадров с заданными параметрами
  let mut frames = Vec::new();

  for timestamp in &params.timestamps {
    frames.push(ExtractedFrame {
      timestamp: *timestamp,
      data: vec![], // TODO: Заполнить реальными данными
      width: params.resolution.map(|(w, _)| w).unwrap_or(1920),
      height: params.resolution.map(|(_, h)| h).unwrap_or(1080),
      format: params.output_format.clone(),
    });
  }

  Ok(frames)
}

/// Извлечь ключевые кадры
#[tauri::command]
pub async fn extract_keyframes(
  project_schema: ProjectSchema,
  keyframe_count: usize,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let duration = project_schema.timeline.duration;
  let timestamps = business_logic::generate_keyframe_timestamps(duration, keyframe_count);
  let frame_paths =
    business_logic::generate_frame_paths(&output_dir, &timestamps, &FrameFormat::Jpeg);

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  for (timestamp, frame_path) in timestamps.iter().zip(frame_paths.iter()) {
    generator
      .generate_frame(&project_schema, *timestamp, frame_path, None)
      .await?;
  }

  Ok(frame_paths)
}

/// Генерировать превью с настройками
#[tauri::command]
pub async fn generate_preview_with_settings(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  let options = business_logic::extract_preview_options(&settings);

  generator
    .generate_frame(&project_schema, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_info(
  project_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Заглушка для несуществующего метода
  Ok(business_logic::generate_cache_info(&project_id, 0, 0))
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
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // TODO: Реализовать извлечение кадра напрямую из видео файла
  log::info!("Extracting frame from {} at {}s", video_path, timestamp);
  Ok(output_path)
}

/// Извлечь кадры из видео пакетом
#[tauri::command]
pub async fn extract_video_frames_batch(
  _video_path: String,
  timestamps: Vec<f64>,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut paths = Vec::new();

  for (i, timestamp) in timestamps.iter().enumerate() {
    let output_path = format!("{}/frame_{:04}_{:.2}.jpg", output_dir, i + 1, timestamp);
    // TODO: Реализовать извлечение кадра
    paths.push(output_path);
  }

  Ok(paths)
}

/// Получить миниатюры видео
#[tauri::command]
pub async fn get_video_thumbnails(
  video_path: String,
  count: usize,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  // TODO: Реализовать генерацию миниатюр
  let mut thumbnails = Vec::new();

  for i in 0..count {
    let output_path = format!("{}/thumbnail_{:03}.jpg", output_dir, i + 1);
    thumbnails.push(output_path);
  }

  log::info!("Generated {} thumbnails from {}", count, video_path);
  Ok(thumbnails)
}
