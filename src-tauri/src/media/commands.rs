use anyhow::Result;
use std::path::PathBuf;
use tauri::State;

use super::metadata::get_media_metadata;
use super::preview_data::MediaPreviewData;
use super::preview_manager::PreviewDataManager;
use serde::Serialize;

/// State для менеджера превью
pub struct PreviewManagerState {
  pub manager: PreviewDataManager,
}

/// Получить данные превью для файла
#[tauri::command]
pub async fn get_media_preview_data(
  state: State<'_, PreviewManagerState>,
  file_id: String,
) -> Result<Option<MediaPreviewData>, String> {
  Ok(state.manager.get_preview_data(&file_id).await)
}

/// Сгенерировать миниатюру для браузера
#[tauri::command]
pub async fn generate_media_thumbnail(
  state: State<'_, PreviewManagerState>,
  file_id: String,
  file_path: String,
  width: u32,
  height: u32,
  timestamp: f64,
) -> Result<String, String> {
  let path = PathBuf::from(file_path);
  state
    .manager
    .generate_browser_thumbnail(file_id, path, width, height, timestamp)
    .await
    .map(|thumbnail| thumbnail.base64_data.unwrap_or_default())
    .map_err(|e| e.to_string())
}

/// Очистить данные превью для файла
#[tauri::command]
pub async fn clear_media_preview_data(
  state: State<'_, PreviewManagerState>,
  file_id: String,
) -> Result<(), String> {
  state
    .manager
    .clear_file_data(&file_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить список всех файлов с превью
#[tauri::command]
pub async fn get_files_with_previews(
  state: State<'_, PreviewManagerState>,
) -> Result<Vec<String>, String> {
  Ok(state.manager.get_all_files_with_previews().await)
}

/// Сохранить данные превью в файл
#[tauri::command]
pub async fn save_preview_data(
  state: State<'_, PreviewManagerState>,
  path: String,
) -> Result<(), String> {
  let file_path = PathBuf::from(path);
  state
    .manager
    .save_to_file(&file_path)
    .await
    .map_err(|e| e.to_string())
}

/// Загрузить данные превью из файла
#[tauri::command]
pub async fn load_preview_data(
  state: State<'_, PreviewManagerState>,
  path: String,
) -> Result<(), String> {
  let file_path = PathBuf::from(path);
  state
    .manager
    .load_from_file(&file_path)
    .await
    .map_err(|e| e.to_string())
}

/// Сохранить timeline frames для файла
#[tauri::command]
pub async fn save_timeline_frames(
  state: State<'_, PreviewManagerState>,
  file_id: String,
  frames: Vec<TimelineFrame>,
) -> Result<(), String> {
  state
    .manager
    .save_timeline_frames(file_id, frames)
    .await
    .map_err(|e| e.to_string())
}

/// Получить timeline frames для файла
#[tauri::command]
pub async fn get_timeline_frames(
  state: State<'_, PreviewManagerState>,
  file_id: String,
) -> Result<Vec<TimelineFrame>, String> {
  state
    .manager
    .get_timeline_frames(&file_id)
    .await
    .map_err(|e| e.to_string())
}

/// Структура для timeline frame из frontend
#[derive(serde::Deserialize, serde::Serialize)]
pub struct TimelineFrame {
  pub timestamp: f64,
  pub base64_data: String,
  pub is_keyframe: bool,
}

/// Simplified media metadata structure
#[derive(Serialize)]
pub struct SimpleMediaMetadata {
  pub duration: Option<f64>,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub fps: Option<f64>,
  pub bitrate: Option<u64>,
  pub video_codec: Option<String>,
  pub audio_codec: Option<String>,
  pub has_audio: Option<bool>,
  pub has_video: Option<bool>,
}

/// Processed media file result
#[derive(Serialize)]
pub struct ProcessedMediaFile {
  pub id: String,
  pub path: String,
  pub name: String,
  pub size: u64,
  pub metadata: Option<SimpleMediaMetadata>,
  pub thumbnail_path: Option<String>,
  pub error: Option<String>,
}

/// Process a media file with simplified approach
#[tauri::command]
pub async fn process_media_file_simple(
  file_path: String,
  generate_thumbnail: bool,
) -> Result<ProcessedMediaFile, String> {
  use std::time::{SystemTime, UNIX_EPOCH};

  let path = PathBuf::from(&file_path);

  // Check if file exists
  if !path.exists() {
    return Err("File does not exist".to_string());
  }

  // Get file metadata
  let file_name = path
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("Unknown")
    .to_string();

  let file_size = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);

  // Generate unique ID based on file path and timestamp
  let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_millis();
  let id = format!("file-{}-{}", timestamp, file_name.replace(" ", "-"));

  // Try to get basic media info using existing metadata function
  let metadata = match get_media_metadata(file_path.clone()) {
    Ok(media_file) => {
      // Extract metadata from MediaFile
      let probe_data = &media_file.probe_data;
      let duration = media_file.duration;

      let (width, height, fps, video_codec) = probe_data
        .streams
        .iter()
        .find(|s| s.codec_type == "video")
        .map(|s| {
          (
            s.width,
            s.height,
            s.r_frame_rate.as_ref().and_then(|r| {
              let parts: Vec<&str> = r.split('/').collect();
              if parts.len() == 2 {
                let num = parts[0].parse::<f64>().ok()?;
                let den = parts[1].parse::<f64>().ok()?;
                if den > 0.0 {
                  Some(num / den)
                } else {
                  None
                }
              } else {
                None
              }
            }),
            s.codec_name.clone(),
          )
        })
        .unwrap_or((None, None, None, None));

      let audio_codec = probe_data
        .streams
        .iter()
        .find(|s| s.codec_type == "audio")
        .and_then(|s| s.codec_name.clone());

      let bitrate = probe_data.format.duration.and_then(|_| {
        probe_data
          .format
          .bit_rate
          .as_ref()
          .and_then(|b| b.parse::<u64>().ok())
      });

      Some(SimpleMediaMetadata {
        duration,
        width,
        height,
        fps,
        bitrate,
        video_codec,
        audio_codec,
        has_audio: Some(media_file.is_audio),
        has_video: Some(media_file.is_video),
      })
    }
    Err(e) => {
      log::warn!("Failed to get media info for {}: {}", file_path, e);
      None
    }
  };

  // Generate thumbnail if requested
  let thumbnail_path = if generate_thumbnail
    && metadata
      .as_ref()
      .is_some_and(|m| m.has_video.unwrap_or(false))
  {
    // For simplicity, we'll skip actual thumbnail generation in this basic version
    // In a real implementation, you would generate a thumbnail here
    None
  } else {
    None
  };

  Ok(ProcessedMediaFile {
    id,
    path: file_path,
    name: file_name,
    size: file_size,
    metadata,
    thumbnail_path,
    error: None,
  })
}
