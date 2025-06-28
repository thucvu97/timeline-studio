//! Video Compiler Module - Центральный модуль компиляции видео
//!
//! Этот модуль отвечает за компиляцию проектов Timeline Studio в финальное видео
//! с использованием FFmpeg. Включает в себя:
//! - Схему данных проекта (ProjectSchema)
//! - Рендерер видео (VideoRenderer)
//! - Генератор превью (PreviewGenerator)
//! - Отслеживание прогресса (ProgressTracker)

// Новая модульная структура
pub mod commands;
pub mod core;
pub mod ffmpeg_builder;
pub mod ffmpeg_executor;
pub mod registry;
pub mod schema;
pub mod services;

#[cfg(test)]
pub mod tests;

// Re-export основных типов для удобства использования
pub use commands::VideoCompilerState;
pub use core::error::{Result, VideoCompilerError};
pub use core::progress::RenderProgress;

// Re-export core modules that are used by other parts of the application
pub use core::{cache, error, frame_extraction, gpu, pipeline, preview, progress, renderer};

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::services::ServiceContainer;

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
    log::debug!("Проверка FFmpeg по пути: {path}");

    let output = tokio::process::Command::new(path)
      .arg("-version")
      .output()
      .await;

    if let Ok(output) = output {
      if output.status.success() {
        log::info!("FFmpeg найден по пути: {path}");

        // Извлекаем версию FFmpeg
        if let Ok(version_str) = String::from_utf8(output.stdout) {
          if let Some(version_line) = version_str.lines().next() {
            log::info!("Версия FFmpeg: {version_line}");
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
        log::info!("FFmpeg найден через {which_cmd}: {path}");
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
  log::info!("FFmpeg найден по пути: {ffmpeg_path}");

  // Создаем временную директорию если не существует
  let temp_dir = std::env::temp_dir().join("timeline-studio");
  if !temp_dir.exists() {
    tokio::fs::create_dir_all(&temp_dir)
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
  }

  // Создаем контейнер сервисов с правильным путем к FFmpeg
  let services = match ServiceContainer::new(
    ffmpeg_path.clone(),
    temp_dir.clone(),
    2, // max_concurrent_jobs
  )
  .await
  {
    Ok(container) => container,
    Err(e) => {
      log::error!("Ошибка создания контейнера сервисов: {e:?}");
      return Err(e);
    }
  };

  // Инициализируем сервисы
  if let Err(e) = services.initialize_all().await {
    log::error!("Ошибка инициализации сервисов: {e:?}");
  }

  let services = Arc::new(services);

  // Создаем состояние
  let state = VideoCompilerState {
    services,
    active_jobs: Arc::new(RwLock::new(HashMap::new())),
    active_pipelines: Arc::new(RwLock::new(HashMap::new())),
    cache_manager: Arc::new(RwLock::new(RenderCache::new())),
    ffmpeg_path: Arc::new(RwLock::new(ffmpeg_path.clone())),
    settings: Arc::new(RwLock::new(CompilerSettings {
      temp_directory: temp_dir,
      ..CompilerSettings::default()
    })),
  };

  log::info!("Video Compiler модуль успешно инициализирован с FFmpeg: {ffmpeg_path}");
  Ok(state)
}
