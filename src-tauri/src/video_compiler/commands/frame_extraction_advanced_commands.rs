//! Frame Extraction Advanced Commands - расширенные команды для извлечения кадров

use crate::video_compiler::commands::frame_extraction_commands::{
  extract_subtitle_frames, extract_timeline_frames, extract_video_frame,
  extract_video_frames_batch, generate_preview, generate_preview_batch,
  generate_preview_with_settings, get_frame_extraction_cache_info, get_video_thumbnails,
};
use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

/// Параметры для извлечения кадров таймлайна
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineFramesParams {
  pub timeline_id: String,
  pub start_time: f64,
  pub end_time: f64,
  pub frame_rate: f64,
  pub output_dir: String,
  pub format: Option<String>,
}

/// Результат извлечения кадров таймлайна
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineFramesResult {
  pub success: bool,
  pub extracted_frames: Vec<String>,
  pub total_frames: usize,
  pub duration: f64,
  pub error: Option<String>,
}

/// Извлечь кадры таймлайна
#[tauri::command]
pub async fn extract_timeline_frames_advanced(
  params: TimelineFramesParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<TimelineFramesResult> {
  let output_dir = PathBuf::from(&params.output_dir);
  let format = params.format.unwrap_or_else(|| "jpg".to_string());

  match extract_timeline_frames(
    params.timeline_id.clone(),
    params.start_time,
    params.end_time,
    params.frame_rate,
    output_dir,
    format,
  )
  .await
  {
    Ok(frame_paths) => {
      let frame_strings: Vec<String> = frame_paths
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

      Ok(TimelineFramesResult {
        success: true,
        total_frames: frame_strings.len(),
        extracted_frames: frame_strings,
        duration: params.end_time - params.start_time,
        error: None,
      })
    }
    Err(e) => Ok(TimelineFramesResult {
      success: false,
      extracted_frames: vec![],
      total_frames: 0,
      duration: 0.0,
      error: Some(e.to_string()),
    }),
  }
}

/// Параметры для извлечения кадров субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleFramesParams {
  pub subtitle_text: String,
  pub start_time: f64,
  pub end_time: f64,
  pub style: Option<String>,
  pub output_dir: String,
  pub frame_count: Option<u32>,
}

/// Результат извлечения кадров субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleFramesResult {
  pub success: bool,
  pub generated_frames: Vec<String>,
  pub frame_count: usize,
  pub subtitle_duration: f64,
  pub error: Option<String>,
}

/// Извлечь кадры субтитров
#[tauri::command]
pub async fn extract_subtitle_frames_advanced(
  params: SubtitleFramesParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<SubtitleFramesResult> {
  let output_dir = PathBuf::from(&params.output_dir);
  let frame_count = params.frame_count.unwrap_or(10);

  match extract_subtitle_frames(
    params.subtitle_text.clone(),
    params.start_time,
    params.end_time,
    params.style.unwrap_or_else(|| "default".to_string()),
    output_dir,
    frame_count,
  )
  .await
  {
    Ok(frame_paths) => {
      let frame_strings: Vec<String> = frame_paths
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

      Ok(SubtitleFramesResult {
        success: true,
        generated_frames: frame_strings,
        frame_count: frame_strings.len(),
        subtitle_duration: params.end_time - params.start_time,
        error: None,
      })
    }
    Err(e) => Ok(SubtitleFramesResult {
      success: false,
      generated_frames: vec![],
      frame_count: 0,
      subtitle_duration: 0.0,
      error: Some(e.to_string()),
    }),
  }
}

/// Параметры для извлечения одного кадра видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFrameParams {
  pub video_path: String,
  pub timestamp: f64,
  pub output_path: String,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub quality: Option<u8>,
}

/// Извлечь один кадр из видео
#[tauri::command]
pub async fn extract_video_frame_advanced(
  params: VideoFrameParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let video_path = PathBuf::from(&params.video_path);
  let output_path = PathBuf::from(&params.output_path);

  extract_video_frame(
    video_path,
    params.timestamp,
    output_path,
    params.width,
    params.height,
    params.quality.unwrap_or(90),
  )
  .await
  .map(|path| path.to_string_lossy().to_string())
}

/// Параметры для пакетного извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFramesBatchParams {
  pub video_path: String,
  pub timestamps: Vec<f64>,
  pub output_dir: String,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub quality: Option<u8>,
  pub name_template: Option<String>,
}

/// Результат пакетного извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFramesBatchResult {
  pub success: bool,
  pub extracted_frames: Vec<String>,
  pub failed_frames: Vec<f64>,
  pub total_requested: usize,
  pub total_extracted: usize,
  pub error: Option<String>,
}

/// Извлечь кадры из видео пакетом
#[tauri::command]
pub async fn extract_video_frames_batch_advanced(
  params: VideoFramesBatchParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<VideoFramesBatchResult> {
  let video_path = PathBuf::from(&params.video_path);
  let output_dir = PathBuf::from(&params.output_dir);
  let name_template = params
    .name_template
    .unwrap_or_else(|| "frame_%d.jpg".to_string());

  match extract_video_frames_batch(
    video_path,
    params.timestamps.clone(),
    output_dir,
    params.width,
    params.height,
    params.quality.unwrap_or(90),
    name_template,
  )
  .await
  {
    Ok(frame_paths) => {
      let frame_strings: Vec<String> = frame_paths
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

      Ok(VideoFramesBatchResult {
        success: true,
        extracted_frames: frame_strings,
        failed_frames: vec![],
        total_requested: params.timestamps.len(),
        total_extracted: frame_strings.len(),
        error: None,
      })
    }
    Err(e) => Ok(VideoFramesBatchResult {
      success: false,
      extracted_frames: vec![],
      failed_frames: params.timestamps,
      total_requested: params.timestamps.len(),
      total_extracted: 0,
      error: Some(e.to_string()),
    }),
  }
}

/// Параметры для получения миниатюр видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoThumbnailsParams {
  pub video_path: String,
  pub thumbnail_count: u32,
  pub output_dir: String,
  pub size: Option<(u32, u32)>,
  pub quality: Option<u8>,
}

/// Получить миниатюры видео
#[tauri::command]
pub async fn get_video_thumbnails_advanced(
  params: VideoThumbnailsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let video_path = PathBuf::from(&params.video_path);
  let output_dir = PathBuf::from(&params.output_dir);
  let size = params.size.unwrap_or((320, 180));

  let thumbnail_paths = get_video_thumbnails(
    video_path,
    params.thumbnail_count,
    output_dir,
    size,
    params.quality.unwrap_or(85),
  )
  .await?;

  Ok(
    thumbnail_paths
      .iter()
      .map(|p| p.to_string_lossy().to_string())
      .collect(),
  )
}

/// Информация о кэше извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionCacheInfo {
  pub cache_size_mb: f64,
  pub cached_files_count: usize,
  pub hit_rate: f64,
  pub last_cleanup: Option<String>,
  pub max_cache_size_mb: f64,
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_information(
  _state: State<'_, VideoCompilerState>,
) -> Result<FrameExtractionCacheInfo> {
  match get_frame_extraction_cache_info().await {
    Ok(cache_info) => Ok(FrameExtractionCacheInfo {
      cache_size_mb: cache_info.size_mb,
      cached_files_count: cache_info.files_count,
      hit_rate: cache_info.hit_rate,
      last_cleanup: cache_info.last_cleanup.map(|dt| dt.to_rfc3339()),
      max_cache_size_mb: cache_info.max_size_mb,
    }),
    Err(e) => Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Failed to get cache info: {}",
        e
      )),
    ),
  }
}

/// Параметры для генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratePreviewParams {
  pub input_path: String,
  pub output_path: String,
  pub timestamp: f64,
  pub width: Option<u32>,
  pub height: Option<u32>,
}

/// Сгенерировать превью кадра
#[tauri::command]
pub async fn generate_preview_frame(
  params: GeneratePreviewParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let input_path = PathBuf::from(&params.input_path);
  let output_path = PathBuf::from(&params.output_path);

  generate_preview(
    input_path,
    output_path,
    params.timestamp,
    params.width,
    params.height,
  )
  .await
  .map(|path| path.to_string_lossy().to_string())
}

/// Параметры для пакетной генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratePreviewBatchParams {
  pub input_paths: Vec<String>,
  pub output_dir: String,
  pub timestamps: Vec<f64>,
  pub width: Option<u32>,
  pub height: Option<u32>,
}

/// Сгенерировать превью пакетом
#[tauri::command]
pub async fn generate_preview_batch_frames(
  params: GeneratePreviewBatchParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let input_paths: Vec<PathBuf> = params.input_paths.iter().map(PathBuf::from).collect();
  let output_dir = PathBuf::from(&params.output_dir);

  let preview_paths = generate_preview_batch(
    input_paths,
    output_dir,
    params.timestamps,
    params.width,
    params.height,
  )
  .await?;

  Ok(
    preview_paths
      .iter()
      .map(|p| p.to_string_lossy().to_string())
      .collect(),
  )
}

/// Параметры для генерации превью с настройками
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratePreviewSettingsParams {
  pub input_path: String,
  pub output_path: String,
  pub timestamp: f64,
  pub width: u32,
  pub height: u32,
  pub quality: u8,
  pub format: String,
}

/// Сгенерировать превью с настройками
#[tauri::command]
pub async fn generate_preview_with_custom_settings(
  params: GeneratePreviewSettingsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let input_path = PathBuf::from(&params.input_path);
  let output_path = PathBuf::from(&params.output_path);

  generate_preview_with_settings(
    input_path,
    output_path,
    params.timestamp,
    params.width,
    params.height,
    params.quality,
    params.format,
  )
  .await
  .map(|path| path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_timeline_frames_params_serialization() {
    let params = TimelineFramesParams {
      timeline_id: "timeline_123".to_string(),
      start_time: 0.0,
      end_time: 10.0,
      frame_rate: 30.0,
      output_dir: "/tmp/frames".to_string(),
      format: Some("jpg".to_string()),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("timeline_123"));
    assert!(json.contains("frame_rate"));
  }

  #[test]
  fn test_video_frame_params_serialization() {
    let params = VideoFrameParams {
      video_path: "/test/video.mp4".to_string(),
      timestamp: 5.0,
      output_path: "/test/frame.jpg".to_string(),
      width: Some(1920),
      height: Some(1080),
      quality: Some(90),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("video_path"));
    assert!(json.contains("1920"));
  }
}
