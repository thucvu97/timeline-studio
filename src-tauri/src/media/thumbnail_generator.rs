//! Thumbnail Generator - Генерация миниатюр для медиафайлов

use crate::media::ffmpeg::extract_frame;
use base64::Engine;
use image::{DynamicImage, GenericImageView, ImageFormat};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};

/// Параметры для генерации превью
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ThumbnailOptions {
  #[allow(dead_code)]
  pub width: u32,
  #[allow(dead_code)]
  pub height: u32,
  #[allow(dead_code)]
  pub format: ImageFormat,
  #[allow(dead_code)]
  pub quality: u8,
  #[allow(dead_code)]
  pub time_offset: f64, // Для видео - время в секундах
}

impl Default for ThumbnailOptions {
  fn default() -> Self {
    Self {
      width: 320,
      height: 180,
      format: ImageFormat::Jpeg,
      quality: 85,
      time_offset: 1.0, // 1 секунда от начала
    }
  }
}

/// События генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ThumbnailEvent {
  /// Превью готово
  ThumbnailReady {
    file_id: String,
    file_path: String,
    thumbnail_path: String,
    thumbnail_data: Option<String>, // Base64
  },
  /// Ошибка генерации превью
  ThumbnailError {
    file_id: String,
    file_path: String,
    error: String,
  },
}

/// Генератор миниатюр
#[allow(dead_code)]
pub struct ThumbnailGenerator {
  app_handle: AppHandle,
  thumbnail_dir: PathBuf,
}

impl ThumbnailGenerator {
  /// Создает новый генератор
  #[allow(dead_code)]
  pub fn new(app_handle: AppHandle, thumbnail_dir: PathBuf) -> Self {
    Self {
      app_handle,
      thumbnail_dir,
    }
  }

  /// Генерирует превью для файла
  #[allow(dead_code)]
  pub async fn generate_thumbnail(
    &self,
    file_id: String,
    file_path: String,
    is_video: bool,
    options: &ThumbnailOptions,
  ) -> Result<(PathBuf, Option<String>), String> {
    let thumbnail_filename = format!("{file_id}.jpg");
    let thumbnail_path = self.thumbnail_dir.join(&thumbnail_filename);
    let file_path = Path::new(&file_path);

    let image = if is_video {
      // Извлекаем кадр из видео
      extract_frame(
        file_path.to_str().unwrap(),
        thumbnail_path.to_str().unwrap(),
        options.time_offset,
      )
      .map_err(|e| format!("Failed to extract frame: {e}"))?;

      // Загружаем извлеченный кадр
      image::open(&thumbnail_path).map_err(|e| format!("Failed to open extracted frame: {e}"))?
    } else {
      // Загружаем изображение
      image::open(file_path).map_err(|e| format!("Failed to open image: {e}"))?
    };

    // Изменяем размер с сохранением пропорций
    let resized = Self::resize_image(image, options.width, options.height);

    // Сохраняем превью
    resized
      .save_with_format(&thumbnail_path, options.format)
      .map_err(|e| format!("Failed to save thumbnail: {e}"))?;

    // Опционально конвертируем в base64
    let thumbnail_data = self.create_base64_data(&resized, options)?;

    // Отправляем событие о готовом превью
    let _ = self.app_handle.emit(
      "media-processor",
      ThumbnailEvent::ThumbnailReady {
        file_id: file_id.clone(),
        file_path: file_path.to_string_lossy().to_string(),
        thumbnail_path: thumbnail_path.to_string_lossy().to_string(),
        thumbnail_data: thumbnail_data.clone(),
      },
    );

    Ok((thumbnail_path, thumbnail_data))
  }

  /// Создает base64 представление изображения
  #[allow(dead_code)]
  fn create_base64_data(
    &self,
    image: &DynamicImage,
    options: &ThumbnailOptions,
  ) -> Result<Option<String>, String> {
    if options.format == ImageFormat::Jpeg {
      let mut buffer = Vec::new();
      image
        .write_to(&mut std::io::Cursor::new(&mut buffer), options.format)
        .map_err(|e| format!("Failed to encode image: {e}"))?;
      Ok(Some(
        base64::engine::general_purpose::STANDARD.encode(&buffer),
      ))
    } else {
      Ok(None)
    }
  }

  /// Изменяет размер изображения с сохранением пропорций
  #[allow(dead_code)]
  fn resize_image(img: DynamicImage, max_width: u32, max_height: u32) -> DynamicImage {
    let (width, height) = img.dimensions();

    let width_ratio = max_width as f32 / width as f32;
    let height_ratio = max_height as f32 / height as f32;
    let ratio = width_ratio.min(height_ratio);

    if ratio < 1.0 {
      let new_width = (width as f32 * ratio) as u32;
      let new_height = (height as f32 * ratio) as u32;
      img.resize(new_width, new_height, image::imageops::FilterType::Lanczos3)
    } else {
      img
    }
  }

  /// Обрабатывает ошибку генерации
  #[allow(dead_code)]
  pub fn emit_error(&self, file_id: String, file_path: String, error: String) {
    let _ = self.app_handle.emit(
      "media-processor",
      ThumbnailEvent::ThumbnailError {
        file_id,
        file_path,
        error,
      },
    );
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use image::{ImageBuffer, Rgb};

  #[test]
  fn test_thumbnail_options_default() {
    let options = ThumbnailOptions::default();
    assert_eq!(options.width, 320);
    assert_eq!(options.height, 180);
    assert_eq!(options.quality, 85);
    assert_eq!(options.time_offset, 1.0);
  }

  #[test]
  fn test_resize_image_smaller() {
    // Создаем тестовое изображение 1000x1000
    let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(1000, 1000, |_, _| Rgb([255u8, 0, 0])));

    let resized = ThumbnailGenerator::resize_image(img, 100, 100);
    let (width, height) = resized.dimensions();

    assert_eq!(width, 100);
    assert_eq!(height, 100);
  }

  #[test]
  fn test_resize_image_aspect_ratio() {
    // Создаем изображение 1000x500
    let img = DynamicImage::ImageRgb8(ImageBuffer::from_fn(1000, 500, |_, _| Rgb([0u8, 255, 0])));

    let resized = ThumbnailGenerator::resize_image(img, 200, 200);
    let (width, height) = resized.dimensions();

    // Должно сохранить пропорции
    assert_eq!(width, 200);
    assert_eq!(height, 100);
  }
}
