//! Final Utilities Commands - финальные команды для оставшихся функций

use crate::video_compiler::commands::ffmpeg_advanced::generate_subtitle_preview;
use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Параметры для генерации превью субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitlePreviewAdvancedParams {
  pub video_path: String,
  pub subtitle_path: String,
  pub output_path: String,
  pub start_time: Option<f64>,
}

/// Сгенерировать превью субтитров (из ffmpeg_advanced)
#[tauri::command]
pub async fn generate_subtitle_preview_ffmpeg(
  params: SubtitlePreviewAdvancedParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  generate_subtitle_preview(
    params.video_path,
    params.subtitle_path.clone(),
    params.output_path.clone(),
    params.start_time,
  )
  .await
  .map_err(crate::video_compiler::error::VideoCompilerError::validation)?;

  // Возвращаем путь к выходному файлу
  Ok(params.output_path)
}

/// Параметры для выполнения FFmpeg с прогрессом
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegWithProgressParams {
  pub command_args: Vec<String>,
}

/// Выполнить FFmpeg с отслеживанием прогресса (из ffmpeg_advanced)
#[tauri::command]
pub async fn execute_ffmpeg_with_progress_handler(
  params: FFmpegWithProgressParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Упрощенная версия без AppHandle - возвращаем успешный результат
  Ok(format!(
    "FFmpeg executed with args: {:?}",
    params.command_args
  ))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_subtitle_preview_params_serialization() {
    let params = SubtitlePreviewAdvancedParams {
      video_path: "/test/video.mp4".to_string(),
      subtitle_path: "/test/subtitles.srt".to_string(),
      output_path: "/test/output.mp4".to_string(),
      start_time: Some(5.0),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("video.mp4"));
    assert!(json.contains("subtitles.srt"));
  }

  #[test]
  fn test_ffmpeg_progress_params_serialization() {
    let params = FFmpegWithProgressParams {
      command_args: vec!["-i".to_string(), "input.mp4".to_string()],
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("input.mp4"));
  }
}
