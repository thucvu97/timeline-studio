// Модуль для асинхронной обработки медиафайлов

use crate::media::ffmpeg::extract_frame;
use crate::media::metadata::get_media_metadata;
use crate::media::types::{MediaFile, SUPPORTED_EXTENSIONS};
use base64::Engine;
use image::{DynamicImage, GenericImageView, ImageFormat};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::fs;
use tokio::sync::{mpsc, Semaphore};
use tokio::task::JoinSet;
use uuid::Uuid;

/// События для отправки через Tauri
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ProcessorEvent {
  /// Обнаружены файлы
  FilesDiscovered {
    files: Vec<DiscoveredFile>,
    total: usize,
  },
  /// Метаданные готовы
  MetadataReady {
    file_id: String,
    file_path: String,
    metadata: MediaFile,
  },
  /// Превью готово
  ThumbnailReady {
    file_id: String,
    file_path: String,
    thumbnail_path: String,
    thumbnail_data: Option<String>, // Base64
  },
  /// Ошибка обработки
  ProcessingError {
    file_id: String,
    file_path: String,
    error: String,
  },
  /// Прогресс сканирования
  ScanProgress { current: usize, total: usize },
}

/// Обнаруженный файл
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredFile {
  pub id: String,
  pub path: String,
  pub name: String,
  pub extension: String,
  pub size: u64,
}

/// Параметры для генерации превью
#[derive(Debug, Clone)]
pub struct ThumbnailOptions {
  pub width: u32,
  pub height: u32,
  pub format: ImageFormat,
  pub _quality: u8,
  pub time_offset: f64, // Для видео - время в секундах
}

impl Default for ThumbnailOptions {
  fn default() -> Self {
    Self {
      width: 320,
      height: 180,
      format: ImageFormat::Jpeg,
      _quality: 85,
      time_offset: 1.0, // 1 секунда от начала
    }
  }
}

/// Процессор медиафайлов
pub struct MediaProcessor {
  app_handle: AppHandle,
  thumbnail_dir: PathBuf,
  max_concurrent_tasks: usize,
}

impl MediaProcessor {
  /// Создает новый процессор
  pub fn new(app_handle: AppHandle, thumbnail_dir: PathBuf) -> Self {
    Self {
      app_handle,
      thumbnail_dir,
      max_concurrent_tasks: 4, // Ограничиваем количество параллельных задач
    }
  }

  /// Асинхронно сканирует папку и обрабатывает файлы
  pub async fn scan_and_process(
    &self,
    folder_path: &Path,
    thumbnail_options: Option<ThumbnailOptions>,
  ) -> Result<Vec<MediaFile>, String> {
    // Создаем директорию для превью, если не существует
    fs::create_dir_all(&self.thumbnail_dir)
      .await
      .map_err(|e| format!("Failed to create thumbnail directory: {}", e))?;

    // Сканируем папку
    let discovered_files = self.scan_folder(folder_path).await?;
    let total_files = discovered_files.len();

    // Отправляем событие о найденных файлах
    self.emit_event(ProcessorEvent::FilesDiscovered {
      files: discovered_files.clone(),
      total: total_files,
    })?;

    // Обрабатываем файлы параллельно
    let semaphore = Arc::new(Semaphore::new(self.max_concurrent_tasks));
    let mut join_set = JoinSet::new();
    let mut processed_files = Vec::new();
    let thumbnail_opts = thumbnail_options.unwrap_or_default();

    let (tx, mut rx) = mpsc::channel::<Result<MediaFile, String>>(100);

    // Запускаем задачи обработки
    for (index, file) in discovered_files.into_iter().enumerate() {
      let app_handle = self.app_handle.clone();
      let thumbnail_dir = self.thumbnail_dir.clone();
      let thumbnail_opts = thumbnail_opts.clone();
      let semaphore = semaphore.clone();
      let tx = tx.clone();

      join_set.spawn(async move {
        let _permit = semaphore.acquire().await.unwrap();

        // Отправляем прогресс
        let _ = app_handle.emit(
          "media-processor",
          ProcessorEvent::ScanProgress {
            current: index + 1,
            total: total_files,
          },
        );

        // Обрабатываем файл
        let result = process_single_file(&app_handle, file, &thumbnail_dir, &thumbnail_opts).await;

        let _ = tx.send(result).await;
      });
    }

    // Закрываем отправитель
    drop(tx);

    // Собираем результаты
    while let Some(result) = rx.recv().await {
      match result {
        Ok(media_file) => processed_files.push(media_file),
        Err(e) => eprintln!("Error processing file: {}", e),
      }
    }

    // Ждем завершения всех задач
    while join_set.join_next().await.is_some() {}

    Ok(processed_files)
  }

  /// Сканирует папку и возвращает список медиафайлов
  async fn scan_folder(&self, folder_path: &Path) -> Result<Vec<DiscoveredFile>, String> {
    let mut discovered_files = Vec::new();
    let mut dirs_to_scan = vec![folder_path.to_path_buf()];

    while let Some(dir) = dirs_to_scan.pop() {
      let mut entries = fs::read_dir(&dir)
        .await
        .map_err(|e| format!("Failed to read directory {:?}: {}", dir, e))?;

      while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {}", e))?
      {
        let path = entry.path();
        let metadata = entry
          .metadata()
          .await
          .map_err(|e| format!("Failed to read metadata: {}", e))?;

        if metadata.is_dir() {
          dirs_to_scan.push(path);
        } else if metadata.is_file() {
          if let Some(extension) = path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            if SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
              let file_name = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

              discovered_files.push(DiscoveredFile {
                id: Uuid::new_v4().to_string(),
                path: path.to_string_lossy().to_string(),
                name: file_name,
                extension: ext,
                size: metadata.len(),
              });
            }
          }
        }
      }
    }

    Ok(discovered_files)
  }

  /// Отправляет событие через Tauri
  fn emit_event(&self, event: ProcessorEvent) -> Result<(), String> {
    self
      .app_handle
      .emit("media-processor", event)
      .map_err(|e| format!("Failed to emit event: {}", e))
  }
}

/// Обрабатывает один файл
async fn process_single_file(
  app_handle: &AppHandle,
  file: DiscoveredFile,
  thumbnail_dir: &Path,
  thumbnail_options: &ThumbnailOptions,
) -> Result<MediaFile, String> {
  let file_path = Path::new(&file.path);

  // Получаем метаданные
  let media_file = match get_media_metadata(file.path.clone()) {
    Ok(meta) => {
      // Отправляем событие о готовых метаданных
      let _ = app_handle.emit(
        "media-processor",
        ProcessorEvent::MetadataReady {
          file_id: file.id.clone(),
          file_path: file.path.clone(),
          metadata: meta.clone(),
        },
      );
      meta
    }
    Err(e) => {
      let error_msg = format!("Failed to get metadata: {}", e);
      let _ = app_handle.emit(
        "media-processor",
        ProcessorEvent::ProcessingError {
          file_id: file.id.clone(),
          file_path: file.path.clone(),
          error: error_msg.clone(),
        },
      );
      return Err(error_msg);
    }
  };

  // Генерируем превью для поддерживаемых типов
  let is_video = media_file.is_video;
  let is_image = media_file.is_image;

  if is_video || is_image {
    let thumbnail_result =
      generate_thumbnail(&file, file_path, thumbnail_dir, thumbnail_options, is_video).await;

    if let Ok((thumbnail_path, thumbnail_data)) = thumbnail_result {
      // Отправляем событие о готовом превью
      let _ = app_handle.emit(
        "media-processor",
        ProcessorEvent::ThumbnailReady {
          file_id: file.id.clone(),
          file_path: file.path.clone(),
          thumbnail_path: thumbnail_path.to_string_lossy().to_string(),
          thumbnail_data,
        },
      );
    }
  }

  Ok(media_file)
}

/// Генерирует превью для файла
async fn generate_thumbnail(
  file: &DiscoveredFile,
  file_path: &Path,
  thumbnail_dir: &Path,
  options: &ThumbnailOptions,
  is_video: bool,
) -> Result<(PathBuf, Option<String>), String> {
  let thumbnail_filename = format!("{}.jpg", file.id);
  let thumbnail_path = thumbnail_dir.join(&thumbnail_filename);

  let image = if is_video {
    // Извлекаем кадр из видео
    extract_frame(
      file_path.to_str().unwrap(),
      thumbnail_path.to_str().unwrap(),
      options.time_offset,
    )
    .map_err(|e| format!("Failed to extract frame: {}", e))?;

    // Загружаем и изменяем размер
    image::open(&thumbnail_path).map_err(|e| format!("Failed to open extracted frame: {}", e))?
  } else {
    // Загружаем изображение
    image::open(file_path).map_err(|e| format!("Failed to open image: {}", e))?
  };

  // Изменяем размер с сохранением пропорций
  let resized = resize_image(image, options.width, options.height);

  // Сохраняем превью
  resized
    .save_with_format(&thumbnail_path, options.format)
    .map_err(|e| format!("Failed to save thumbnail: {}", e))?;

  // Опционально конвертируем в base64
  let thumbnail_data = if options.format == ImageFormat::Jpeg {
    let mut buffer = Vec::new();
    resized
      .write_to(&mut std::io::Cursor::new(&mut buffer), options.format)
      .ok();
    Some(base64::engine::general_purpose::STANDARD.encode(&buffer))
  } else {
    None
  };

  Ok((thumbnail_path, thumbnail_data))
}

/// Изменяет размер изображения с сохранением пропорций
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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_thumbnail_options_default() {
    let opts = ThumbnailOptions::default();
    assert_eq!(opts.width, 320);
    assert_eq!(opts.height, 180);
    assert_eq!(opts._quality, 85);
    assert_eq!(opts.time_offset, 1.0);
  }

  #[test]
  fn test_processor_event_serialization() {
    let event = ProcessorEvent::FilesDiscovered {
      files: vec![DiscoveredFile {
        id: "test-id".to_string(),
        path: "/path/to/file.mp4".to_string(),
        name: "file.mp4".to_string(),
        extension: "mp4".to_string(),
        size: 1024,
      }],
      total: 1,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("FilesDiscovered"));
    assert!(json.contains("test-id"));
  }

  #[test]
  fn test_metadata_ready_event() {
    use crate::media::types::{FfprobeFormat, MediaFile, ProbeData};

    let media_file = MediaFile {
      id: "test-id".to_string(),
      name: "test.mp4".to_string(),
      path: "/path/to/test.mp4".to_string(),
      is_video: true,
      is_audio: false,
      is_image: false,
      size: 1024000,
      duration: Some(120.5),
      start_time: 0,
      creation_time: "2023-01-01T00:00:00Z".to_string(),
      probe_data: ProbeData {
        streams: vec![],
        format: FfprobeFormat {
          duration: Some(120.5),
          size: Some(1024000),
          bit_rate: None,
          format_name: None,
        },
      },
    };

    let event = ProcessorEvent::MetadataReady {
      file_id: "test-id".to_string(),
      file_path: "/path/to/test.mp4".to_string(),
      metadata: media_file,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("MetadataReady"));
    assert!(json.contains("test.mp4"));
  }
}
