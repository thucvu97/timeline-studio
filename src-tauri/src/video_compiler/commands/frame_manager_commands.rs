//! Frame Manager Commands - команды для работы с FrameExtractionManager

use crate::video_compiler::core::cache::RenderCache;
use crate::video_compiler::core::frame_extraction::FrameExtractionManager;
use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{Clip, Subtitle};
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// Параметры для извлечения кадров клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractFramesForClipParams {
  pub clip: Clip,
  pub use_default_settings: bool,
}

/// Извлеченный кадр
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedFrameInfo {
  pub timestamp: f64,
  pub file_path: String,
  pub frame_index: usize,
}

/// Результат извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractFramesResult {
  pub frames: Vec<ExtractedFrameInfo>,
  pub total_frames: usize,
  pub success: bool,
  pub error: Option<String>,
}

/// Извлечь кадры для клипа
#[tauri::command]
pub async fn extract_frames_for_clip_command(
  params: ExtractFramesForClipParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ExtractFramesResult> {
  // Создаем менеджер с кэшем
  let cache = Arc::new(RwLock::new(RenderCache::new()));
  let manager = FrameExtractionManager::new(cache);

  match manager.extract_frames_for_clip(&params.clip, None).await {
    Ok(frames) => {
      let frame_infos: Vec<ExtractedFrameInfo> = frames
        .into_iter()
        .enumerate()
        .map(|(idx, frame)| ExtractedFrameInfo {
          timestamp: frame.timestamp,
          file_path: format!("frame_{idx}.jpg"), // Создаем имя файла
          frame_index: idx,
        })
        .collect();
      let total_frames = frame_infos.len();
      Ok(ExtractFramesResult {
        frames: frame_infos,
        total_frames,
        success: true,
        error: None,
      })
    }
    Err(e) => Ok(ExtractFramesResult {
      frames: vec![],
      total_frames: 0,
      success: false,
      error: Some(e.to_string()),
    }),
  }
}

/// Параметры для извлечения кадров субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractFramesForSubtitlesParams {
  pub video_path: String,
  pub subtitles: Vec<Subtitle>,
  pub use_default_settings: bool,
}

/// Кадр субтитра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleFrameInfo {
  pub subtitle_id: String,
  pub subtitle_text: String,
  pub timestamp: f64,
  pub file_path: String,
}

/// Результат извлечения кадров субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractSubtitleFramesResult {
  pub frames: Vec<SubtitleFrameInfo>,
  pub total_frames: usize,
  pub success: bool,
  pub error: Option<String>,
}

/// Извлечь кадры для субтитров
#[tauri::command]
pub async fn extract_frames_for_subtitles_command(
  params: ExtractFramesForSubtitlesParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ExtractSubtitleFramesResult> {
  let video_path = PathBuf::from(&params.video_path);

  // Создаем менеджер с кэшем
  let cache = Arc::new(RwLock::new(RenderCache::new()));
  let manager = FrameExtractionManager::new(cache);

  match manager
    .extract_frames_for_subtitles(&video_path, &params.subtitles, None)
    .await
  {
    Ok(frames) => {
      let frame_infos: Vec<SubtitleFrameInfo> = frames
        .into_iter()
        .map(|frame| SubtitleFrameInfo {
          subtitle_id: frame.subtitle_id.clone(),
          subtitle_text: frame.subtitle_text.clone(),
          timestamp: frame.timestamp,
          file_path: format!("subtitle_frame_{}.jpg", frame.timestamp),
        })
        .collect();
      let total_frames = frame_infos.len();
      Ok(ExtractSubtitleFramesResult {
        frames: frame_infos,
        total_frames,
        success: true,
        error: None,
      })
    }
    Err(e) => Ok(ExtractSubtitleFramesResult {
      frames: vec![],
      total_frames: 0,
      success: false,
      error: Some(e.to_string()),
    }),
  }
}

/// Информация о кэше извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionCacheInfo {
  pub cache_size_mb: f64,
  pub cached_items: usize,
  pub hit_ratio: f32,
  pub cache_type: String,
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_info_command(
  _state: State<'_, VideoCompilerState>,
) -> Result<FrameExtractionCacheInfo> {
  // Создаем менеджер с кэшем
  let cache = Arc::new(RwLock::new(RenderCache::new()));
  let manager = FrameExtractionManager::new(cache.clone());

  // Получаем кэш через метод get_cache
  let cache_arc = manager.get_cache();
  let cache_guard = cache_arc.read().await;
  let stats = cache_guard.get_stats();

  Ok(FrameExtractionCacheInfo {
    cache_size_mb: 50.0, // Примерное значение
    cached_items: stats.preview_requests as usize,
    hit_ratio: stats.hit_ratio(),
    cache_type: "FrameExtractionCache".to_string(),
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::ClipSource;

  #[test]
  fn test_extract_frames_params_serialization() {
    let clip = Clip {
      id: "test-clip".to_string(),
      source: ClipSource::File("/test/video.mp4".to_string()),
      start_time: 0.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 10.0,
      speed: 1.0,
      opacity: 1.0,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      transform: None,
      audio_track_index: None,
      properties: crate::video_compiler::schema::timeline::ClipProperties::default(),
    };

    let params = ExtractFramesForClipParams {
      clip,
      use_default_settings: true,
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("test-clip"));
    assert!(json.contains("/test/video.mp4"));
  }

  #[test]
  fn test_subtitle_frames_params_serialization() {
    let subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);

    let params = ExtractFramesForSubtitlesParams {
      video_path: "/test/video.mp4".to_string(),
      subtitles: vec![subtitle],
      use_default_settings: true,
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("Test subtitle"));
    assert!(json.contains("/test/video.mp4"));
  }
}
