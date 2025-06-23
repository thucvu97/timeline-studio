//! FFmpeg Utilities Commands - команды для утилит FFmpeg

use crate::video_compiler::commands::ffmpeg_advanced::{
  execute_ffmpeg_simple, execute_ffmpeg_with_progress, generate_subtitle_preview,
  get_ffmpeg_codecs, get_ffmpeg_execution_info, get_ffmpeg_formats,
};
use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Параметры для выполнения FFmpeg команды
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegExecuteParams {
  pub command_args: Vec<String>,
  pub timeout_seconds: Option<u64>,
  pub working_directory: Option<String>,
}

/// Результат выполнения FFmpeg команды
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegExecuteResult {
  pub success: bool,
  pub exit_code: i32,
  pub stdout: String,
  pub stderr: String,
  pub duration_ms: u64,
  pub error: Option<String>,
}

/// Выполнить простую FFmpeg команду
#[tauri::command]
pub async fn execute_ffmpeg_simple_command(
  params: FFmpegExecuteParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegExecuteResult> {
  let start_time = std::time::Instant::now();

  match execute_ffmpeg_simple(params.command_args, params.timeout_seconds).await {
    Ok(output) => Ok(FFmpegExecuteResult {
      success: true,
      exit_code: 0,
      stdout: String::from_utf8_lossy(&output.stdout).to_string(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      duration_ms: start_time.elapsed().as_millis() as u64,
      error: None,
    }),
    Err(e) => Ok(FFmpegExecuteResult {
      success: false,
      exit_code: -1,
      stdout: String::new(),
      stderr: String::new(),
      duration_ms: start_time.elapsed().as_millis() as u64,
      error: Some(e.to_string()),
    }),
  }
}

/// Параметры для выполнения FFmpeg команды с прогрессом
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegProgressParams {
  pub command_args: Vec<String>,
  pub progress_callback: Option<String>, // ID callback для фронтенда
  pub timeout_seconds: Option<u64>,
}

/// Результат выполнения FFmpeg с прогрессом
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegProgressResult {
  pub success: bool,
  pub exit_code: i32,
  pub stdout: String,
  pub stderr: String,
  pub final_progress: Option<f64>,
  pub duration_ms: u64,
  pub error: Option<String>,
}

/// Выполнить FFmpeg команду с отслеживанием прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress_advanced(
  params: FFmpegProgressParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegProgressResult> {
  let start_time = std::time::Instant::now();

  // Создаем канал для прогресса
  let (progress_sender, mut progress_receiver) = tokio::sync::mpsc::channel(100);

  // Запускаем выполнение в отдельной задаче
  let execution_task = tokio::spawn({
    let command_args = params.command_args.clone();
    let timeout = params.timeout_seconds;
    async move { execute_ffmpeg_with_progress(command_args, progress_sender, timeout).await }
  });

  // Отслеживаем прогресс (можно передавать на фронтенд)
  let _progress_task = tokio::spawn(async move {
    let mut _last_progress = 0.0;
    while let Some(progress) = progress_receiver.recv().await {
      _last_progress = progress;
      // Здесь можно отправлять прогресс на фронтенд через callback
    }
  });

  // Ждем завершения
  match execution_task.await {
    Ok(result) => match result {
      Ok(output) => Ok(FFmpegProgressResult {
        success: true,
        exit_code: 0,
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        final_progress: Some(100.0),
        duration_ms: start_time.elapsed().as_millis() as u64,
        error: None,
      }),
      Err(e) => Ok(FFmpegProgressResult {
        success: false,
        exit_code: -1,
        stdout: String::new(),
        stderr: String::new(),
        final_progress: None,
        duration_ms: start_time.elapsed().as_millis() as u64,
        error: Some(e.to_string()),
      }),
    },
    Err(e) => Ok(FFmpegProgressResult {
      success: false,
      exit_code: -1,
      stdout: String::new(),
      stderr: String::new(),
      final_progress: None,
      duration_ms: start_time.elapsed().as_millis() as u64,
      error: Some(format!("Task join error: {}", e)),
    }),
  }
}

/// Получить список доступных кодеков FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_available_codecs(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  match get_ffmpeg_codecs().await {
    Ok(codecs) => Ok(codecs),
    Err(e) => Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Failed to get FFmpeg codecs: {}",
        e
      )),
    ),
  }
}

/// Получить список доступных форматов FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_available_formats(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  match get_ffmpeg_formats().await {
    Ok(formats) => Ok(formats),
    Err(e) => Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Failed to get FFmpeg formats: {}",
        e
      )),
    ),
  }
}

/// Параметры для генерации превью субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitlePreviewParams {
  pub subtitle_text: String,
  pub duration: f64,
  pub font_size: Option<u32>,
  pub font_color: Option<String>,
  pub background_color: Option<String>,
  pub output_format: Option<String>,
}

/// Результат генерации превью субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitlePreviewResult {
  pub success: bool,
  pub preview_data: Option<Vec<u8>>,
  pub format: String,
  pub width: u32,
  pub height: u32,
  pub error: Option<String>,
}

/// Сгенерировать превью субтитров
#[tauri::command]
pub async fn generate_subtitle_preview_advanced(
  params: SubtitlePreviewParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<SubtitlePreviewResult> {
  match generate_subtitle_preview(
    params.subtitle_text,
    params.duration,
    params.font_size.unwrap_or(24),
    params.font_color.as_deref().unwrap_or("white"),
    params.background_color.as_deref().unwrap_or("black"),
  )
  .await
  {
    Ok(preview_data) => Ok(SubtitlePreviewResult {
      success: true,
      preview_data: Some(preview_data),
      format: params.output_format.unwrap_or_else(|| "png".to_string()),
      width: 1920,
      height: 1080,
      error: None,
    }),
    Err(e) => Ok(SubtitlePreviewResult {
      success: false,
      preview_data: None,
      format: "png".to_string(),
      width: 0,
      height: 0,
      error: Some(e.to_string()),
    }),
  }
}

/// Информация об исполнении FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegExecutionInfo {
  pub ffmpeg_version: String,
  pub available_encoders: Vec<String>,
  pub available_decoders: Vec<String>,
  pub hardware_acceleration: Vec<String>,
  pub build_configuration: Vec<String>,
}

/// Получить информацию об исполнении FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_execution_information(
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegExecutionInfo> {
  match get_ffmpeg_execution_info().await {
    Ok(info) => Ok(FFmpegExecutionInfo {
      ffmpeg_version: info.version,
      available_encoders: info.encoders,
      available_decoders: info.decoders,
      hardware_acceleration: info.hwaccels,
      build_configuration: info.configuration,
    }),
    Err(e) => Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Failed to get FFmpeg execution info: {}",
        e
      )),
    ),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_ffmpeg_execute_params_serialization() {
    let params = FFmpegExecuteParams {
      command_args: vec!["-version".to_string()],
      timeout_seconds: Some(30),
      working_directory: Some("/tmp".to_string()),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("command_args"));
    assert!(json.contains("version"));
  }

  #[test]
  fn test_subtitle_preview_params_serialization() {
    let params = SubtitlePreviewParams {
      subtitle_text: "Test subtitle".to_string(),
      duration: 5.0,
      font_size: Some(24),
      font_color: Some("white".to_string()),
      background_color: Some("black".to_string()),
      output_format: Some("png".to_string()),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("subtitle_text"));
    assert!(json.contains("Test subtitle"));
  }
}
