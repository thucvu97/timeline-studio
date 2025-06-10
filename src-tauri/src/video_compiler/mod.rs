//! Video Compiler Module - Центральный модуль компиляции видео
//!
//! Этот модуль отвечает за компиляцию проектов Timeline Studio в финальное видео
//! с использованием FFmpeg. Включает в себя:
//! - Схему данных проекта (ProjectSchema)
//! - Рендерер видео (VideoRenderer)
//! - Генератор превью (PreviewGenerator)
//! - Отслеживание прогресса (ProgressTracker)

pub mod cache;
pub mod commands;
pub mod error;
pub mod ffmpeg_builder;
pub mod gpu;
pub mod pipeline;
pub mod preview;
pub mod progress;
pub mod renderer;
pub mod schema;

#[cfg(test)]
mod test_integration;

// Re-export основных типов для удобства использования
pub use commands::VideoCompilerState;
pub use error::{Result, VideoCompilerError};
pub use preview::PreviewGenerator;
pub use progress::RenderProgress;

use serde::{Deserialize, Serialize};

/// Настройки компилятора видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilerSettings {
  /// Максимальное количество одновременных задач рендеринга
  pub max_concurrent_jobs: usize,
  /// Размер кэша в мегабайтах
  pub cache_size_mb: usize,
  /// Временная директория для промежуточных файлов
  pub temp_directory: std::path::PathBuf,
  /// Путь к FFmpeg (если не в системном PATH)
  pub ffmpeg_path: Option<std::path::PathBuf>,
  /// Использование аппаратного ускорения
  pub hardware_acceleration: bool,
  /// Качество превью (от 1 до 100)
  pub preview_quality: u8,
}

impl Default for CompilerSettings {
  fn default() -> Self {
    Self {
      max_concurrent_jobs: 2,
      cache_size_mb: 512,
      temp_directory: std::env::temp_dir().join("timeline-studio"),
      ffmpeg_path: None,
      hardware_acceleration: true,
      preview_quality: 75,
    }
  }
}

/// События Video Compiler для WebSocket
#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum VideoCompilerEvent {
  /// Рендеринг начат
  RenderStarted { job_id: String },
  /// Прогресс рендеринга обновлен
  RenderProgress {
    job_id: String,
    progress: RenderProgress,
  },
  /// Рендеринг завершен успешно
  RenderCompleted { job_id: String, output_path: String },
  /// Рендеринг завершился с ошибкой
  RenderFailed { job_id: String, error: String },
  /// Превью сгенерировано
  PreviewGenerated { timestamp: f64, image_data: Vec<u8> },
  /// Кэш обновлен
  CacheUpdated { cache_size_mb: f64 },
}

/// Проверка зависимостей Video Compiler и возврат пути к FFmpeg
pub async fn check_dependencies() -> Result<String> {
  // Список возможных путей к FFmpeg в разных системах
  let ffmpeg_paths = vec![
    "ffmpeg",                                     // По умолчанию в PATH
    "/usr/bin/ffmpeg",                            // Linux стандартный путь
    "/usr/local/bin/ffmpeg",                      // macOS через brew (Intel)
    "/opt/homebrew/bin/ffmpeg",                   // macOS через brew (Apple Silicon)
    "/snap/bin/ffmpeg",                           // Linux через snap
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe", // Windows стандартный путь
    "C:\\ffmpeg\\bin\\ffmpeg.exe",                // Windows альтернативный путь
  ];

  // Пробуем найти FFmpeg
  for path in &ffmpeg_paths {
    log::debug!("Проверка FFmpeg по пути: {}", path);

    let output = tokio::process::Command::new(path)
      .arg("-version")
      .output()
      .await;

    if let Ok(output) = output {
      if output.status.success() {
        log::info!("FFmpeg найден по пути: {}", path);

        // Извлекаем версию FFmpeg
        if let Ok(version_str) = String::from_utf8(output.stdout) {
          if let Some(version_line) = version_str.lines().next() {
            log::info!("Версия FFmpeg: {}", version_line);
          }
        }

        return Ok(path.to_string());
      }
    }
  }

  // Если не нашли FFmpeg, пробуем which/where команду
  let which_cmd = if cfg!(target_os = "windows") {
    "where"
  } else {
    "which"
  };

  if let Ok(output) = tokio::process::Command::new(which_cmd)
    .arg("ffmpeg")
    .output()
    .await
  {
    if output.status.success() {
      if let Ok(path_str) = String::from_utf8(output.stdout) {
        let path = path_str.trim().to_string();
        log::info!("FFmpeg найден через {}: {}", which_cmd, path);
        return Ok(path);
      }
    }
  }

  Err(VideoCompilerError::DependencyMissing(
    "FFmpeg не найден в системе. Установите FFmpeg для работы Video Compiler.\n\
     Инструкции по установке:\n\
     - macOS: brew install ffmpeg\n\
     - Ubuntu/Debian: sudo apt install ffmpeg\n\
     - Windows: скачайте с https://ffmpeg.org/download.html"
      .to_string(),
  ))
}

/// Инициализация Video Compiler модуля
pub async fn initialize() -> Result<VideoCompilerState> {
  log::info!("Инициализация Video Compiler модуля");

  // Проверяем зависимости и получаем путь к FFmpeg
  let ffmpeg_path = check_dependencies().await?;

  // Создаем состояние с найденным путем FFmpeg
  let mut state = VideoCompilerState::new();
  state.ffmpeg_path = ffmpeg_path;

  // Обновляем настройки
  {
    let settings = state.settings.write().await;

    // Создаем временную директорию если не существует
    if !settings.temp_directory.exists() {
      tokio::fs::create_dir_all(&settings.temp_directory.clone())
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
    }
  }

  log::info!(
    "Video Compiler модуль успешно инициализирован с FFmpeg: {}",
    &state.ffmpeg_path
  );
  Ok(state)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_video_compiler_state_creation() {
    let state = VideoCompilerState::new();
    assert_eq!(state.active_jobs.read().await.len(), 0);

    let settings = state.settings.read().await;
    assert_eq!(settings.max_concurrent_jobs, 2);
    assert_eq!(settings.cache_size_mb, 512);
  }

  #[tokio::test]
  async fn test_compiler_settings_default() {
    let settings = CompilerSettings::default();
    assert_eq!(settings.max_concurrent_jobs, 2);
    assert_eq!(settings.cache_size_mb, 512);
    assert!(settings.hardware_acceleration);
    assert_eq!(settings.preview_quality, 75);
  }

  #[tokio::test]
  async fn test_check_dependencies() {
    // Тест может не пройти если FFmpeg не установлен, но это ожидаемо
    match check_dependencies().await {
      Ok(_) => println!("FFmpeg найден и работает"),
      Err(e) => println!("FFmpeg недоступен: {:?}", e),
    }
  }

  #[test]
  fn test_video_compiler_event_serialization() {
    let event = VideoCompilerEvent::RenderStarted {
      job_id: "test-123".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("RenderStarted"));
    assert!(json.contains("test-123"));
  }
}
