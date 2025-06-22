//! FFmpeg сервис для работы с видео

use crate::video_compiler::{
  error::{Result, VideoCompilerError},
  services::Service,
};
use async_trait::async_trait;
use std::{
  path::Path,
  process::{Command, Stdio},
};

/// Трейт для работы с FFmpeg
#[async_trait]
#[allow(dead_code)]
pub trait FfmpegService: Service + Send + Sync {
  /// Получение версии FFmpeg
  async fn get_version(&self) -> Result<String>;

  /// Проверка доступности FFmpeg
  async fn is_available(&self) -> Result<bool>;

  /// Получение информации о файле
  async fn get_file_info(&self, path: &Path) -> Result<FileInfo>;

  /// Получение поддерживаемых форматов
  async fn get_supported_formats(&self) -> Result<Vec<String>>;

  /// Получение поддерживаемых кодеков
  async fn get_supported_codecs(&self) -> Result<Vec<String>>;

  /// Получение пути к FFmpeg
  async fn get_ffmpeg_path(&self) -> Result<String>;

  /// Запуск FFmpeg команды
  async fn run_command(&self, args: Vec<String>) -> Result<String>;
}

/// Информация о медиа файле
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[allow(dead_code)]
pub struct FileInfo {
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub fps: f64,
  pub codec: String,
  pub bitrate: u64,
  pub has_audio: bool,
  pub audio_codec: Option<String>,
  pub audio_bitrate: Option<u64>,
}

/// Реализация FFmpeg сервиса
pub struct FfmpegServiceImpl {
  ffmpeg_path: String,
}

impl FfmpegServiceImpl {
  pub fn new(ffmpeg_path: String) -> Self {
    Self { ffmpeg_path }
  }
}

#[async_trait]
impl Service for FfmpegServiceImpl {
  async fn initialize(&self) -> Result<()> {
    // Проверяем доступность FFmpeg
    if !self.is_available().await? {
      return Err(VideoCompilerError::DependencyMissing(
        "FFmpeg не найден".to_string(),
      ));
    }

    log::info!("FFmpeg сервис инициализирован: {}", self.ffmpeg_path);
    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    if !self.is_available().await? {
      return Err(VideoCompilerError::DependencyMissing(
        "FFmpeg не найден".to_string(),
      ));
    }
    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("FFmpeg сервис остановлен");
    Ok(())
  }
}

#[async_trait]
impl FfmpegService for FfmpegServiceImpl {
  async fn get_version(&self) -> Result<String> {
    let output = Command::new(&self.ffmpeg_path)
      .arg("-version")
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Не удалось запустить FFmpeg: {}", e),
        command: "-version".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: Some(output.status.code().unwrap_or(-1)),
        stderr: "Не удалось получить версию FFmpeg".to_string(),
        command: "-version".to_string(),
      });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let version_line = stdout
      .lines()
      .next()
      .ok_or_else(|| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: "Пустой вывод версии".to_string(),
        command: "-version".to_string(),
      })?;

    Ok(version_line.to_string())
  }

  async fn is_available(&self) -> Result<bool> {
    match Command::new(&self.ffmpeg_path)
      .arg("-version")
      .stdout(Stdio::null())
      .stderr(Stdio::null())
      .status()
    {
      Ok(status) => Ok(status.success()),
      Err(_) => Ok(false),
    }
  }

  async fn get_file_info(&self, path: &Path) -> Result<FileInfo> {
    let output = Command::new(&self.ffmpeg_path)
      .args([
        "-i",
        path.to_str().ok_or_else(|| {
          VideoCompilerError::ValidationError("Неверный путь к файлу".to_string())
        })?,
        "-f",
        "null",
        "-",
      ])
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка запуска FFmpeg: {}", e),
        command: "ffprobe".to_string(),
      })?;

    let stderr = String::from_utf8_lossy(&output.stderr);

    // Парсим информацию из вывода FFmpeg
    let duration = parse_duration(&stderr)?;
    let (width, height) = parse_resolution(&stderr)?;
    let fps = parse_fps(&stderr)?;
    let codec = parse_video_codec(&stderr)?;
    let bitrate = parse_bitrate(&stderr)?;
    let has_audio = stderr.contains("Audio:");
    let audio_codec = if has_audio {
      parse_audio_codec(&stderr)
    } else {
      None
    };
    let audio_bitrate = if has_audio {
      parse_audio_bitrate(&stderr)
    } else {
      None
    };

    Ok(FileInfo {
      duration,
      width,
      height,
      fps,
      codec,
      bitrate,
      has_audio,
      audio_codec,
      audio_bitrate,
    })
  }

  async fn get_supported_formats(&self) -> Result<Vec<String>> {
    let output = Command::new(&self.ffmpeg_path)
      .arg("-formats")
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка получения форматов: {}", e),
        command: "-formats".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: Some(output.status.code().unwrap_or(-1)),
        stderr: "Не удалось получить список форматов".to_string(),
        command: "-formats".to_string(),
      });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let formats = stdout
      .lines()
      .filter_map(|line| {
        if line.contains("E ") || line.contains("DE") {
          line.split_whitespace().nth(1).map(|s| s.to_string())
        } else {
          None
        }
      })
      .collect();

    Ok(formats)
  }

  async fn get_supported_codecs(&self) -> Result<Vec<String>> {
    let output = Command::new(&self.ffmpeg_path)
      .arg("-codecs")
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка получения кодеков: {}", e),
        command: "-codecs".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: Some(output.status.code().unwrap_or(-1)),
        stderr: "Не удалось получить список кодеков".to_string(),
        command: "-codecs".to_string(),
      });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let codecs = stdout
      .lines()
      .filter_map(|line| {
        if line.contains("EV") || line.contains("DEV") {
          line.split_whitespace().nth(1).map(|s| s.to_string())
        } else {
          None
        }
      })
      .collect();

    Ok(codecs)
  }

  async fn get_ffmpeg_path(&self) -> Result<String> {
    Ok(self.ffmpeg_path.clone())
  }

  async fn run_command(&self, args: Vec<String>) -> Result<String> {
    let output = Command::new(&self.ffmpeg_path)
      .args(&args)
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: format!("Ошибка выполнения команды: {}", e),
        command: args.join(" "),
      })?;

    if !output.status.success() {
      let stderr = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: stderr.to_string(),
        command: args.join(" "),
      });
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
  }
}

// Вспомогательные функции для парсинга вывода FFmpeg

fn parse_duration(stderr: &str) -> Result<f64> {
  for line in stderr.lines() {
    if line.contains("Duration:") {
      if let Some(duration_str) = line.split("Duration: ").nth(1) {
        if let Some(time_str) = duration_str.split(',').next() {
          return parse_time_to_seconds(time_str.trim());
        }
      }
    }
  }
  Err(VideoCompilerError::ValidationError(
    "Не удалось найти длительность".to_string(),
  ))
}

fn parse_resolution(stderr: &str) -> Result<(u32, u32)> {
  for line in stderr.lines() {
    if line.contains("Video:") {
      if let Some(res_part) = line.split("Video:").nth(1) {
        for part in res_part.split(',') {
          if let Some(res_str) = part.split_whitespace().find(|s| s.contains('x')) {
            let dimensions: Vec<&str> = res_str.split('x').collect();
            if dimensions.len() == 2 {
              if let (Ok(width), Ok(height)) =
                (dimensions[0].parse::<u32>(), dimensions[1].parse::<u32>())
              {
                return Ok((width, height));
              }
            }
          }
        }
      }
    }
  }
  Err(VideoCompilerError::ValidationError(
    "Не удалось найти разрешение".to_string(),
  ))
}

fn parse_fps(stderr: &str) -> Result<f64> {
  for line in stderr.lines() {
    if line.contains("Video:") && line.contains(" fps") {
      if let Some(fps_part) = line.split(" fps").next() {
        if let Some(fps_str) = fps_part.split(' ').next_back() {
          if let Ok(fps) = fps_str.parse::<f64>() {
            return Ok(fps);
          }
        }
      }
    }
  }
  Ok(30.0) // Значение по умолчанию
}

fn parse_video_codec(stderr: &str) -> Result<String> {
  for line in stderr.lines() {
    if line.contains("Video:") {
      if let Some(codec_part) = line.split("Video: ").nth(1) {
        if let Some(codec) = codec_part.split(',').next() {
          return Ok(codec.trim().to_string());
        }
      }
    }
  }
  Ok("unknown".to_string())
}

fn parse_bitrate(stderr: &str) -> Result<u64> {
  for line in stderr.lines() {
    if line.contains("bitrate:") {
      if let Some(bitrate_part) = line.split("bitrate: ").nth(1) {
        if let Some(bitrate_str) = bitrate_part.split(' ').next() {
          if let Ok(bitrate) = bitrate_str.parse::<u64>() {
            return Ok(bitrate);
          }
        }
      }
    }
  }
  Ok(0)
}

fn parse_audio_codec(stderr: &str) -> Option<String> {
  for line in stderr.lines() {
    if line.contains("Audio:") {
      if let Some(codec_part) = line.split("Audio: ").nth(1) {
        if let Some(codec) = codec_part.split(',').next() {
          return Some(codec.trim().to_string());
        }
      }
    }
  }
  None
}

fn parse_audio_bitrate(stderr: &str) -> Option<u64> {
  for line in stderr.lines() {
    if line.contains("Audio:") && line.contains(" kb/s") {
      if let Some(bitrate_part) = line.split(" kb/s").next() {
        if let Some(bitrate_str) = bitrate_part.split(' ').next_back() {
          if let Ok(bitrate) = bitrate_str.parse::<u64>() {
            return Some(bitrate);
          }
        }
      }
    }
  }
  None
}

fn parse_time_to_seconds(time_str: &str) -> Result<f64> {
  let parts: Vec<&str> = time_str.split(':').collect();
  if parts.len() != 3 {
    return Err(VideoCompilerError::ValidationError(
      "Неверный формат времени".to_string(),
    ));
  }

  let hours: f64 = parts[0]
    .parse()
    .map_err(|_| VideoCompilerError::ValidationError("Неверные часы".to_string()))?;
  let minutes: f64 = parts[1]
    .parse()
    .map_err(|_| VideoCompilerError::ValidationError("Неверные минуты".to_string()))?;
  let seconds: f64 = parts[2]
    .parse()
    .map_err(|_| VideoCompilerError::ValidationError("Неверные секунды".to_string()))?;

  Ok(hours * 3600.0 + minutes * 60.0 + seconds)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_ffmpeg_service_creation() {
    let service = FfmpegServiceImpl::new("ffmpeg".to_string());
    assert_eq!(service.ffmpeg_path, "ffmpeg");
  }

  #[test]
  fn test_parse_time_to_seconds() {
    assert_eq!(parse_time_to_seconds("00:01:30.00").unwrap(), 90.0);
    assert_eq!(parse_time_to_seconds("01:00:00.00").unwrap(), 3600.0);
    assert_eq!(parse_time_to_seconds("00:00:05.50").unwrap(), 5.5);
  }
}
