//! Metadata Extractor - Извлечение метаданных из медиафайлов

use crate::media::metadata::get_media_metadata;
use crate::media::types::MediaFile;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{AppHandle, Emitter};

/// События метаданных
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum MetadataEvent {
  /// Метаданные готовы
  MetadataReady {
    file_id: String,
    file_path: String,
    metadata: Box<MediaFile>,
  },
  /// Ошибка извлечения метаданных
  MetadataError {
    file_id: String,
    file_path: String,
    error: String,
  },
}

/// Экстрактор метаданных
#[allow(dead_code)]
pub struct MetadataExtractor {
  app_handle: AppHandle,
}

impl MetadataExtractor {
  /// Создает новый экстрактор
  #[allow(dead_code)]
  pub fn new(app_handle: AppHandle) -> Self {
    Self { app_handle }
  }

  /// Извлекает метаданные из файла
  #[allow(dead_code)]
  pub async fn extract_metadata(
    &self,
    file_id: String,
    file_path: String,
  ) -> Result<MediaFile, String> {
    match get_media_metadata(file_path.clone()) {
      Ok(metadata) => {
        // Отправляем событие о готовых метаданных
        let _ = self.app_handle.emit(
          "media-processor",
          MetadataEvent::MetadataReady {
            file_id: file_id.clone(),
            file_path: file_path.clone(),
            metadata: Box::new(metadata.clone()),
          },
        );
        Ok(metadata)
      }
      Err(e) => {
        let error_msg = format!("Failed to get metadata: {e}");
        let _ = self.app_handle.emit(
          "media-processor",
          MetadataEvent::MetadataError {
            file_id,
            file_path,
            error: error_msg.clone(),
          },
        );
        Err(error_msg)
      }
    }
  }

  /// Пакетная обработка файлов
  #[allow(dead_code)]
  pub async fn extract_batch(
    &self,
    files: Vec<(String, String)>, // (file_id, file_path)
  ) -> Vec<Result<MediaFile, String>> {
    let mut results = Vec::new();

    for (file_id, file_path) in files {
      let result = self.extract_metadata(file_id, file_path).await;
      results.push(result);
    }

    results
  }

  /// Проверяет, поддерживается ли файл
  #[allow(dead_code)]
  pub fn is_supported(file_path: &Path) -> bool {
    file_path
      .extension()
      .and_then(|ext| ext.to_str())
      .map(|ext| {
        let ext_lower = ext.to_lowercase();
        crate::media::types::SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str())
      })
      .unwrap_or(false)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::path::PathBuf;

  #[test]
  fn test_is_supported() {
    assert!(MetadataExtractor::is_supported(&PathBuf::from("video.mp4")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("image.jpg")));
    assert!(MetadataExtractor::is_supported(&PathBuf::from("audio.mp3")));
    assert!(!MetadataExtractor::is_supported(&PathBuf::from(
      "document.pdf"
    )));
    assert!(!MetadataExtractor::is_supported(&PathBuf::from(
      "no_extension"
    )));
  }
}
