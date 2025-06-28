//! FFmpeg Executor Commands - команды для работы с FFmpeg executor

use crate::video_compiler::core::renderer::RenderSettings;
use crate::video_compiler::error::Result;
use crate::video_compiler::ffmpeg_executor::FFmpegExecutor;
use crate::video_compiler::progress::ProgressUpdate;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::process::Command;
use tokio::sync::mpsc;

/// Параметры для выполнения FFmpeg команды
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteFFmpegParams {
  pub command_args: Vec<String>,
  pub track_progress: bool,
  pub timeout_seconds: Option<u64>,
}

/// Результат выполнения FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
  pub success: bool,
  pub exit_code: Option<i32>,
  pub stdout: String,
  pub stderr: String,
  pub duration_ms: u64,
  pub final_progress: Option<f64>,
  pub error: Option<String>,
}

/// Выполнить FFmpeg команду с отслеживанием прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress_tracking(
  params: ExecuteFFmpegParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ExecutionResult> {
  // Создаем канал для прогресса
  let (progress_sender, mut progress_receiver) = mpsc::channel::<ProgressUpdate>(100);

  // Создаем executor с отслеживанием прогресса
  let executor = FFmpegExecutor::with_progress(progress_sender);

  // Создаем команду
  let mut cmd = Command::new("ffmpeg");
  for arg in &params.command_args {
    cmd.arg(arg);
  }

  // Создаем настройки рендеринга (не используется в execute, но может быть полезно в будущем)
  let _render_settings = RenderSettings {
    hardware_acceleration: params.track_progress,
    threads: None,
    extra_args: vec![],
    timeout_seconds: params.timeout_seconds.unwrap_or(300),
  };

  // Запускаем выполнение в отдельной задаче
  let executor_clone = Arc::new(executor);
  let execution_task = {
    let executor = executor_clone.clone();
    tokio::spawn(async move { executor.execute(cmd).await })
  };

  // Отслеживаем прогресс
  let _progress_task = tokio::spawn(async move {
    let mut _last_progress = 0.0;
    while let Some(update) = progress_receiver.recv().await {
      if let ProgressUpdate::ProgressChanged { progress, .. } = update {
        _last_progress = progress.percentage as f64;
      }
    }
  });

  // Ждем завершения
  let result = execution_task.await.map_err(|e| {
    crate::video_compiler::error::VideoCompilerError::FFmpegError {
      exit_code: None,
      stderr: format!("Task join error: {e}"),
      command: "ffmpeg".to_string(),
    }
  })?;

  match result {
    Ok(exec_result) => {
      let start = std::time::Instant::now();
      Ok(ExecutionResult {
        success: exec_result.exit_code == 0,
        exit_code: Some(exec_result.exit_code),
        stdout: exec_result.stdout,
        stderr: exec_result.stderr,
        duration_ms: start.elapsed().as_millis() as u64,
        final_progress: exec_result.final_progress.map(|p| p.percentage as f64),
        error: None,
      })
    }
    Err(e) => Ok(ExecutionResult {
      success: false,
      exit_code: None,
      stdout: String::new(),
      stderr: String::new(),
      duration_ms: 0,
      final_progress: None,
      error: Some(e.to_string()),
    }),
  }
}

/// Выполнить простую FFmpeg команду без отслеживания прогресса
#[tauri::command]
pub async fn execute_ffmpeg_simple_no_progress(
  params: ExecuteFFmpegParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ExecutionResult> {
  // Создаем executor без прогресса
  let executor = FFmpegExecutor::new();

  // Создаем команду
  let mut cmd = Command::new("ffmpeg");
  for arg in &params.command_args {
    cmd.arg(arg);
  }

  // Выполняем команду
  let start_time = std::time::Instant::now();
  let result = executor.execute_simple(cmd).await;
  let duration = start_time.elapsed();

  match result {
    Ok(output) => Ok(ExecutionResult {
      success: true,
      exit_code: Some(0),
      stdout: String::from_utf8_lossy(&output).to_string(),
      stderr: String::new(),
      duration_ms: duration.as_millis() as u64,
      final_progress: None,
      error: None,
    }),
    Err(e) => Ok(ExecutionResult {
      success: false,
      exit_code: None,
      stdout: String::new(),
      stderr: String::new(),
      duration_ms: duration.as_millis() as u64,
      final_progress: None,
      error: Some(e.to_string()),
    }),
  }
}

/// Информация о возможностях FFmpeg executor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutorCapabilities {
  pub supports_progress_tracking: bool,
  pub supports_cancellation: bool,
  pub max_concurrent_executions: usize,
  pub timeout_support: bool,
}

/// Получить информацию о возможностях FFmpeg executor
#[tauri::command]
pub async fn get_ffmpeg_executor_capabilities(
  _state: State<'_, VideoCompilerState>,
) -> Result<ExecutorCapabilities> {
  Ok(ExecutorCapabilities {
    supports_progress_tracking: true,
    supports_cancellation: true,
    max_concurrent_executions: 4,
    timeout_support: true,
  })
}

/// Проверить доступность FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_executor_availability(
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let executor = FFmpegExecutor::new();

  // Проверяем, можем ли выполнить простую команду
  let mut cmd = Command::new("ffmpeg");
  cmd.arg("-version");

  match executor.execute_simple(cmd).await {
    Ok(_) => Ok(true),
    Err(_) => Ok(false),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_execute_ffmpeg_params_serialization() {
    let params = ExecuteFFmpegParams {
      command_args: vec!["-i".to_string(), "input.mp4".to_string()],
      track_progress: true,
      timeout_seconds: Some(300),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("command_args"));
    assert!(json.contains("track_progress"));
  }

  #[test]
  fn test_execution_result_serialization() {
    let result = ExecutionResult {
      success: true,
      exit_code: Some(0),
      stdout: "Output".to_string(),
      stderr: String::new(),
      duration_ms: 1500,
      final_progress: Some(100.0),
      error: None,
    };

    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("success"));
    assert!(json.contains("1500"));
  }
}
