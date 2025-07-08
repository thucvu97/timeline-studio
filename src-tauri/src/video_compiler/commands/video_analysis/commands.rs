//! Tauri команды для анализа видео

use super::{business_logic::*, types::*};
use crate::video_compiler::commands::state::VideoCompilerState;
use crate::video_compiler::core::error::{Result, VideoCompilerError};
use crate::video_compiler::ffmpeg_executor::FFmpegExecutor;
use std::path::Path;
use tauri::State;

/// Получить метаданные видеофайла
#[tauri::command]
pub async fn ffmpeg_get_metadata(file_path: String) -> Result<VideoMetadata> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  let executor = FFmpegExecutor::new();

  // Создаем команду ffprobe для получения метаданных
  let mut cmd = tokio::process::Command::new("ffprobe");
  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    &file_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| VideoCompilerError::FFmpegError {
      exit_code: None,
      stderr: format!("Ошибка выполнения ffprobe: {e}"),
      command: "ffprobe".to_string(),
    })?;

  if result.exit_code != 0 {
    return Err(VideoCompilerError::FFmpegError {
      exit_code: Some(result.exit_code),
      stderr: result.stderr,
      command: "ffprobe".to_string(),
    });
  }

  // Используем бизнес-логику для парсинга
  parse_ffprobe_metadata(&result.stdout)
    .map_err(|e| VideoCompilerError::SerializationError(format!("Metadata parse error: {e}")))
}

/// Получить метаданные видеофайла (обновленная команда)
#[tauri::command]
pub async fn ffmpeg_get_metadata_enhanced(
  file_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<VideoMetadata> {
  if !Path::new(&file_path).exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffprobe");
  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    &file_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| VideoCompilerError::FFmpegError {
      exit_code: None,
      stderr: format!("Ошибка выполнения ffprobe: {e}"),
      command: "ffprobe".to_string(),
    })?;

  if result.exit_code != 0 {
    return Err(VideoCompilerError::FFmpegError {
      exit_code: Some(result.exit_code),
      stderr: result.stderr,
      command: "ffprobe".to_string(),
    });
  }

  parse_ffprobe_metadata(&result.stdout)
    .map_err(|e| VideoCompilerError::SerializationError(format!("Metadata parse error: {e}")))
}

/// Детекция сцен в видео
#[tauri::command]
pub async fn ffmpeg_detect_scenes(
  file_path: String,
  threshold: f64,
  min_scene_length: f64,
) -> Result<SceneDetectionResult> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  let _executor = FFmpegExecutor::new();

  // В реальной реализации здесь был бы анализ через FFmpeg
  let video_duration = 30.0; // Заглушка

  Ok(generate_scene_detection_result(
    threshold,
    min_scene_length,
    video_duration,
  ))
}

/// Анализ качества видео
#[tauri::command]
pub async fn ffmpeg_analyze_quality(
  file_path: String,
  _sample_rate: f64,
  enable_noise_detection: bool,
  enable_stability_check: bool,
) -> Result<QualityAnalysisResult> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  // Используем бизнес-логику для расчета метрик
  Ok(calculate_quality_metrics(
    enable_noise_detection,
    enable_stability_check,
    None,
  ))
}

/// Анализ качества видео (обновленная команда)
#[tauri::command]
pub async fn ffmpeg_analyze_quality_enhanced(
  file_path: String,
  sample_rate: f64,
  enable_noise_detection: bool,
  enable_stability_check: bool,
  _state: State<'_, VideoCompilerState>,
) -> Result<QualityAnalysisResult> {
  if !Path::new(&file_path).exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  if sample_rate <= 0.0 || sample_rate > 10.0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Sample rate должен быть между 0.1 и 10.0".to_string(),
    ));
  }

  log::debug!(
    "Анализ качества видео: {file_path}, sample_rate: {sample_rate}, noise: {enable_noise_detection}, stability: {enable_stability_check}"
  );

  Ok(calculate_quality_metrics(
    enable_noise_detection,
    enable_stability_check,
    None,
  ))
}

/// Детекция тишины в аудио
#[tauri::command]
pub async fn ffmpeg_detect_silence(
  file_path: String,
  threshold: f64,
  min_duration: f64,
) -> Result<SilenceDetectionResult> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  // В реальной реализации здесь был бы анализ через FFmpeg
  let total_duration = 60.0; // Заглушка

  Ok(analyze_silence_patterns(
    threshold,
    min_duration,
    total_duration,
  ))
}

/// Анализ движения в видео
#[tauri::command]
pub async fn ffmpeg_analyze_motion(
  file_path: String,
  sensitivity: f64,
) -> Result<MotionAnalysisResult> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  Ok(generate_motion_analysis_result(sensitivity))
}

/// Извлечение ключевых кадров
#[tauri::command]
pub async fn ffmpeg_extract_keyframes(
  file_path: String,
  interval: f64,
  max_frames: u32,
) -> Result<KeyFrameExtractionResult> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  Ok(generate_keyframe_extraction_result(interval, max_frames))
}

/// Анализ аудио
#[tauri::command]
pub async fn ffmpeg_analyze_audio(
  file_path: String,
  sample_rate: f64,
) -> Result<AudioAnalysisResult> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  Ok(generate_audio_analysis_result(sample_rate))
}

/// Быстрый анализ видео
#[tauri::command]
pub async fn ffmpeg_quick_analysis(file_path: String) -> Result<serde_json::Value> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: file_path,
      reason: "File not found".to_string(),
    });
  }

  Ok(generate_quick_analysis_result())
}
