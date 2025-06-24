//! FFmpeg Executor - Исполнитель команд FFmpeg с обработкой прогресса
//!
//! Этот модуль отвечает за выполнение команд FFmpeg с отслеживанием прогресса,
//! обработкой ошибок и логированием.

use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::progress::{ProgressUpdate, RenderProgress};

/// Регулярное выражение для парсинга прогресса FFmpeg
const PROGRESS_REGEX: &str = r"frame=\s*(\d+).*fps=\s*([\d.]+).*time=\s*([\d:.]+)";

/// Результат выполнения FFmpeg команды
#[derive(Debug)]
pub struct FFmpegExecutionResult {
  /// Код выхода процесса
  pub exit_code: i32,
  /// Полный вывод stdout
  pub stdout: String,
  /// Полный вывод stderr
  pub stderr: String,
  /// Финальный прогресс
  pub final_progress: Option<RenderProgress>,
}

/// Исполнитель команд FFmpeg
pub struct FFmpegExecutor {
  /// Канал для отправки обновлений прогресса
  progress_sender: Option<mpsc::Sender<ProgressUpdate>>,
}

impl Default for FFmpegExecutor {
    fn default() -> Self {
        Self::new()
    }
}

impl FFmpegExecutor {
  /// Создать новый исполнитель
  pub fn new() -> Self {
    Self {
      progress_sender: None,
    }
  }

  /// Создать исполнитель с каналом прогресса
  pub fn with_progress(progress_sender: mpsc::Sender<ProgressUpdate>) -> Self {
    Self {
      progress_sender: Some(progress_sender),
    }
  }

  /// Выполнить команду FFmpeg
  pub async fn execute(&self, mut command: Command) -> Result<FFmpegExecutionResult> {
    log::debug!("Выполнение FFmpeg команды: {:?}", command.as_std());

    // Настраиваем перенаправление потоков
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    // Запускаем процесс
    let mut child = command
      .spawn()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Не удалось запустить FFmpeg: {}", e),
        command: "ffmpeg".to_string(),
      })?;

    // Получаем потоки
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // Буферы для сохранения вывода
    let mut stdout_lines = Vec::new();
    let mut stderr_lines = Vec::new();

    // Читаем stderr для прогресса
    let mut stderr_reader = BufReader::new(stderr).lines();
    let mut last_progress = None;

    // Парсер прогресса
    let progress_regex = regex::Regex::new(PROGRESS_REGEX).unwrap();

    // Обрабатываем stderr построчно
    while let Ok(Some(line)) = stderr_reader.next_line().await {
      stderr_lines.push(line.clone());

      // Парсим прогресс
      if let Some(progress) = self.parse_progress_line(&line, &progress_regex) {
        last_progress = Some(progress.clone());

        // Отправляем обновление если есть канал
        if let Some(ref sender) = self.progress_sender {
          let update = ProgressUpdate::ProgressChanged {
            job_id: "ffmpeg_exec".to_string(), // TODO: Передавать job_id из контекста
            progress,
          };
          let _ = sender.send(update).await;
        }
      }

      // Логируем важные сообщения
      if line.contains("error") || line.contains("Error") {
        log::error!("FFmpeg error: {}", line);
      } else if line.contains("warning") || line.contains("Warning") {
        log::warn!("FFmpeg warning: {}", line);
      }
    }

    // Читаем stdout
    let mut stdout_reader = BufReader::new(stdout).lines();
    while let Ok(Some(line)) = stdout_reader.next_line().await {
      stdout_lines.push(line);
    }

    // Ждем завершения процесса
    let status = child
      .wait()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка ожидания процесса: {}", e),
        command: "ffmpeg".to_string(),
      })?;

    let exit_code = status.code().unwrap_or(-1);
    let stdout_text = stdout_lines.join("\n");
    let stderr_text = stderr_lines.join("\n");

    // Проверяем успешность выполнения
    if !status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: Some(exit_code),
        stderr: stderr_text.clone(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(FFmpegExecutionResult {
      exit_code,
      stdout: stdout_text,
      stderr: stderr_text,
      final_progress: last_progress,
    })
  }

  /// Выполнить команду FFmpeg без отслеживания прогресса
  pub async fn execute_simple(&self, mut command: Command) -> Result<Vec<u8>> {
    log::debug!("Выполнение простой FFmpeg команды: {:?}", command.as_std());

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Не удалось выполнить FFmpeg: {}", e),
        command: "ffmpeg".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(output.stdout)
  }

  /// Парсить строку прогресса FFmpeg
  fn parse_progress_line(&self, line: &str, regex: &regex::Regex) -> Option<RenderProgress> {
    if let Some(captures) = regex.captures(line) {
      let frame = captures.get(1)?.as_str().parse::<u64>().ok()?;
      let fps = captures.get(2)?.as_str().parse::<f64>().ok()?;
      let time_str = captures.get(3)?.as_str();

      // Парсим время в секунды
      let time_parts: Vec<&str> = time_str.split(':').collect();
      if time_parts.len() == 3 {
        let hours = time_parts[0].parse::<f64>().ok()?;
        let minutes = time_parts[1].parse::<f64>().ok()?;
        let seconds = time_parts[2].parse::<f64>().ok()?;
        let total_seconds = hours * 3600.0 + minutes * 60.0 + seconds;

        // Предполагаем общую длительность (нужно передавать из контекста)
        let total_duration = 100.0; // TODO: Получать из проекта
        let percentage = (total_seconds / total_duration * 100.0).min(100.0);

        return Some(RenderProgress {
          job_id: "ffmpeg_parse".to_string(), // TODO: Передавать job_id из контекста
          stage: "Encoding".to_string(),
          percentage: percentage as f32,
          current_frame: frame,
          total_frames: (total_duration * 30.0) as u64, // Предполагаем 30 fps
          elapsed_time: std::time::Duration::from_secs_f64(total_seconds),
          estimated_remaining: Some(std::time::Duration::from_secs_f64(
            (total_duration - total_seconds) / (total_seconds / frame as f64),
          )),
          status: crate::video_compiler::progress::RenderStatus::Processing,
          message: Some(format!("Обработка: кадр {} @ {:.1} fps", frame, fps)),
        });
      }
    }

    None
  }
}

/// Проверить доступность FFmpeg
pub async fn check_ffmpeg_available(ffmpeg_path: &str) -> Result<String> {
  let mut cmd = Command::new(ffmpeg_path);
  cmd.arg("-version");

  let output = cmd.output().await.map_err(|e| {
    VideoCompilerError::DependencyMissing(format!(
      "FFmpeg не найден по пути '{}': {}",
      ffmpeg_path, e
    ))
  })?;

  if !output.status.success() {
    return Err(VideoCompilerError::DependencyMissing(
      "FFmpeg найден, но не может быть запущен".to_string(),
    ));
  }

  let version_output = String::from_utf8_lossy(&output.stdout);

  // Извлекаем версию
  if let Some(line) = version_output.lines().next() {
    if let Some(version_start) = line.find("version") {
      let version = &line[version_start..];
      return Ok(version.to_string());
    }
  }

  Ok("FFmpeg (версия не определена)".to_string())
}

/// Получить список доступных кодеков
pub async fn get_available_codecs(ffmpeg_path: &str) -> Result<Vec<String>> {
  let mut cmd = Command::new(ffmpeg_path);
  cmd.args(["-codecs", "-hide_banner"]);

  let executor = FFmpegExecutor::new();
  let output = executor.execute_simple(cmd).await?;

  let output_str = String::from_utf8_lossy(&output);
  let mut codecs = Vec::new();

  for line in output_str.lines() {
    if line.contains("DEV") || line.contains("D.V") || line.contains(".EV") {
      if let Some(codec_name) = line.split_whitespace().nth(1) {
        codecs.push(codec_name.to_string());
      }
    }
  }

  Ok(codecs)
}

/// Получить информацию о форматах
pub async fn get_available_formats(ffmpeg_path: &str) -> Result<Vec<String>> {
  let mut cmd = Command::new(ffmpeg_path);
  cmd.args(["-formats", "-hide_banner"]);

  let executor = FFmpegExecutor::new();
  let output = executor.execute_simple(cmd).await?;

  let output_str = String::from_utf8_lossy(&output);
  let mut formats = Vec::new();

  let mut in_formats_section = false;
  for line in output_str.lines() {
    if line.contains("--") {
      in_formats_section = true;
      continue;
    }

    if in_formats_section
      && (line.starts_with(" D") || line.starts_with(" .E") || line.starts_with("DE"))
    {
      if let Some(format_name) = line.split_whitespace().nth(1) {
        formats.push(format_name.to_string());
      }
    }
  }

  Ok(formats)
}

#[cfg(test)]
mod tests;

#[cfg(test)]
mod basic_tests {
  use super::*;

  #[tokio::test]
  async fn test_ffmpeg_available() {
    // Тест пропускается если FFmpeg не установлен
    if let Ok(version) = check_ffmpeg_available("ffmpeg").await {
      assert!(version.contains("version") || version.contains("FFmpeg"));
    }
  }

  #[test]
  fn test_progress_parsing() {
    let executor = FFmpegExecutor::new();
    let regex = regex::Regex::new(PROGRESS_REGEX).unwrap();

    let line = "frame= 1234 fps=25.0 q=28.0 size=    2048kB time=00:00:41.13 bitrate= 407.9kbits/s speed=1.25x";
    let progress = executor.parse_progress_line(line, &regex);

    assert!(progress.is_some());
    let p = progress.unwrap();
    assert_eq!(p.current_frame, 1234);
    // Note: fps is no longer a field in RenderProgress, it's calculated internally
  }
}
