//! Timeline Schema Commands - команды для работы со схемой таймлайна

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{Clip, Subtitle, Track, TrackType};
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Параметры для создания нового субтитра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSubtitleParams {
  pub text: String,
  pub start_time: f64,
  pub end_time: f64,
}

/// Создать новый субтитр
#[tauri::command]
pub async fn create_new_subtitle(
  params: CreateSubtitleParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<Subtitle> {
  let subtitle = Subtitle::new(params.text, params.start_time, params.end_time);
  Ok(subtitle)
}

/// Валидировать субтитр
#[tauri::command]
pub async fn validate_subtitle_schema(
  subtitle: Subtitle,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  match subtitle.validate() {
    Ok(()) => Ok(true),
    Err(_) => Ok(false),
  }
}

/// Получить длительность субтитра
#[tauri::command]
pub async fn get_subtitle_duration_schema(
  subtitle: Subtitle,
  _state: State<'_, VideoCompilerState>,
) -> Result<f64> {
  Ok(subtitle.get_duration())
}

/// Параметры для создания нового трека
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTrackParams {
  pub track_type: String, // "video", "audio", "subtitle"
  pub name: String,
}

/// Результат создания трека
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTrackResult {
  pub track_id: String,
  pub track_type: String,
  pub name: String,
  pub clip_count: usize,
}

/// Создать новый трек
#[tauri::command]
pub async fn create_new_track(
  params: CreateTrackParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<CreateTrackResult> {
  // Конвертируем строку в TrackType
  let track_type = match params.track_type.as_str() {
    "video" => TrackType::Video,
    "audio" => TrackType::Audio,
    "subtitle" => TrackType::Subtitle,
    _ => TrackType::Video, // default
  };

  let track = Track::new(track_type, params.name.clone());

  Ok(CreateTrackResult {
    track_id: track.id,
    track_type: params.track_type,
    name: params.name,
    clip_count: track.clips.len(),
  })
}

/// Параметры для добавления клипа к треку
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddClipToTrackParams {
  pub track_id: String,
  pub clip: Clip,
}

/// Результат добавления клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddClipResult {
  pub success: bool,
  pub track_id: String,
  pub clip_id: String,
  pub total_clips: usize,
  pub error: Option<String>,
}

/// Добавить клип к треку
#[tauri::command]
pub async fn add_clip_to_track_schema(
  params: AddClipToTrackParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<AddClipResult> {
  // Создаем новый трек для демонстрации
  let mut track = Track::new(TrackType::Video, "Demo Track".to_string());
  track.id = params.track_id.clone();

  let clip_id = params.clip.id.clone();
  track.add_clip(params.clip);

  Ok(AddClipResult {
    success: true,
    track_id: params.track_id,
    clip_id,
    total_clips: track.clips.len(),
    error: None,
  })
}

/// Параметры для удаления клипа из трека
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoveClipFromTrackParams {
  pub track_id: String,
  pub clip_id: String,
}

/// Результат удаления клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoveClipResult {
  pub success: bool,
  pub track_id: String,
  pub removed_clip_id: String,
  pub remaining_clips: usize,
  pub error: Option<String>,
}

/// Удалить клип из трека
#[tauri::command]
pub async fn remove_clip_from_track_schema(
  params: RemoveClipFromTrackParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<RemoveClipResult> {
  // Создаем новый трек для демонстрации
  let mut track = Track::new(TrackType::Video, "Demo Track".to_string());
  track.id = params.track_id.clone();

  // Удаляем клип
  track.remove_clip(&params.clip_id);

  Ok(RemoveClipResult {
    success: true,
    track_id: params.track_id,
    removed_clip_id: params.clip_id,
    remaining_clips: track.clips.len(),
    error: None,
  })
}

/// Информация о треке
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackInfo {
  pub track_id: String,
  pub track_type: String,
  pub name: String,
  pub clip_count: usize,
  pub duration: f64,
  pub is_muted: bool,
  pub is_visible: bool,
}

/// Получить информацию о треке
#[tauri::command]
pub async fn get_track_info(
  track_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<TrackInfo> {
  // Создаем demo трек
  let track = Track::new(TrackType::Video, "Demo Track".to_string());

  Ok(TrackInfo {
    track_id,
    track_type: "video".to_string(),
    name: track.name,
    clip_count: track.clips.len(),
    duration: 0.0,            // Calculated from clips
    is_muted: !track.enabled, // enabled is opposite of muted
    is_visible: track.enabled,
  })
}

/// Статистика субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleStats {
  pub total_subtitles: usize,
  pub total_duration: f64,
  pub average_duration: f64,
  pub longest_subtitle: f64,
  pub shortest_subtitle: f64,
  pub validation_errors: usize,
}

/// Получить статистику субтитров
#[tauri::command]
pub async fn get_subtitle_statistics(
  subtitles: Vec<Subtitle>,
  _state: State<'_, VideoCompilerState>,
) -> Result<SubtitleStats> {
  let total_subtitles = subtitles.len();

  if total_subtitles == 0 {
    return Ok(SubtitleStats {
      total_subtitles: 0,
      total_duration: 0.0,
      average_duration: 0.0,
      longest_subtitle: 0.0,
      shortest_subtitle: 0.0,
      validation_errors: 0,
    });
  }

  let durations: Vec<f64> = subtitles.iter().map(|s| s.get_duration()).collect();
  let total_duration: f64 = durations.iter().sum();
  let average_duration = total_duration / total_subtitles as f64;
  let longest_subtitle = durations.iter().fold(0.0f64, |a, &b| a.max(b));
  let shortest_subtitle = durations.iter().fold(f64::MAX, |a, &b| a.min(b));

  let validation_errors = subtitles.iter().filter(|s| s.validate().is_err()).count();

  Ok(SubtitleStats {
    total_subtitles,
    total_duration,
    average_duration,
    longest_subtitle,
    shortest_subtitle,
    validation_errors,
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_create_subtitle_params_serialization() {
    let params = CreateSubtitleParams {
      text: "Test subtitle".to_string(),
      start_time: 0.0,
      end_time: 5.0,
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("Test subtitle"));
    assert!(json.contains("5.0"));
  }

  #[test]
  fn test_create_track_params_serialization() {
    let params = CreateTrackParams {
      track_type: "video".to_string(),
      name: "Main Video Track".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("video"));
    assert!(json.contains("Main Video Track"));
  }

  #[test]
  fn test_track_info_serialization() {
    let info = TrackInfo {
      track_id: "track_123".to_string(),
      track_type: "video".to_string(),
      name: "Main Track".to_string(),
      clip_count: 5,
      duration: 120.0,
      is_muted: false,
      is_visible: true,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("track_123"));
    assert!(json.contains("120.0"));
  }
}
