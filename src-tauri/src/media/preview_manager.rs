use anyhow::Result;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::preview_data::{MediaPreviewData, ThumbnailData};
use super::thumbnail::generate_thumbnail;
// Временно закомментируем пока не интегрируем
// use crate::video_compiler::preview::PreviewGenerator;
// use crate::video_compiler::frame_extraction::{FrameExtractionManager, ExtractionPurpose};

/// Единый менеджер для всех данных превью
pub struct PreviewDataManager {
  /// Кэш всех данных превью по file_id
  data: Arc<RwLock<HashMap<String, MediaPreviewData>>>,

  // /// Генератор превью для браузера
  // thumbnail_generator: Arc<RwLock<()>>, // Использует функцию generate_thumbnail

  // /// Генератор превью для таймлайна
  // timeline_generator: Arc<RwLock<PreviewGenerator>>,

  // /// Менеджер извлечения кадров
  // frame_extractor: Arc<RwLock<FrameExtractionManager>>,
  /// Базовая директория для хранения
  base_dir: PathBuf,
}

impl PreviewDataManager {
  pub fn new(base_dir: PathBuf) -> Self {
    // let preview_generator = PreviewGenerator::new(base_dir.join("Caches/preview"));
    // let frame_extractor = FrameExtractionManager::new(
    //     base_dir.join("Caches/frame"),
    //     base_dir.join("Recognition"),
    // );

    Self {
      data: Arc::new(RwLock::new(HashMap::new())),
      // thumbnail_generator: Arc::new(RwLock::new(())),
      // timeline_generator: Arc::new(RwLock::new(preview_generator)),
      // frame_extractor: Arc::new(RwLock::new(frame_extractor)),
      base_dir,
    }
  }

  /// Получить все данные превью для файла
  pub async fn get_preview_data(&self, file_id: &str) -> Option<MediaPreviewData> {
    let data = self.data.read().await;
    data.get(file_id).cloned()
  }

  /// Генерировать превью для браузера
  pub async fn generate_browser_thumbnail(
    &self,
    file_id: String,
    file_path: PathBuf,
    width: u32,
    height: u32,
    timestamp: f64,
  ) -> Result<ThumbnailData> {
    // Генерируем превью
    let output_path = self
      .base_dir
      .join("Caches/preview/browser")
      .join(format!("{}_{}x{}.jpg", file_id, width, height));

    // Создаем директорию если не существует
    if let Some(parent) = output_path.parent() {
      tokio::fs::create_dir_all(parent).await?;
    }

    // Генерируем превью
    generate_thumbnail(&file_path, &output_path, width, height, timestamp)
      .await
      .map_err(|e| anyhow::anyhow!(e))?;

    // Читаем файл для base64
    let image_data = tokio::fs::read(&output_path).await?;
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let base64_data = STANDARD.encode(&image_data);

    let thumbnail = ThumbnailData {
      path: output_path,
      base64_data: Some(base64_data),
      timestamp,
      width,
      height,
    };

    // Обновляем данные
    let mut data = self.data.write().await;
    let preview_data = data
      .entry(file_id.clone())
      .or_insert_with(|| MediaPreviewData::new(file_id, file_path));
    preview_data.set_browser_thumbnail(thumbnail.clone());

    Ok(thumbnail)
  }

  // Временно отключено - требует интеграции с video_compiler
  /*
  /// Генерировать превью для таймлайна
  pub async fn generate_timeline_previews(
      &self,
      file_id: String,
      file_path: PathBuf,
      duration: f64,
      interval: f64,
  ) -> Result<Vec<TimelinePreview>> {
      // TODO: интегрировать с video_compiler::preview::PreviewGenerator
      unimplemented!("Timeline preview generation not yet integrated")
  }
  */

  // Временно отключено - требует интеграции с frame_extraction
  /*
  /// Извлечь кадры для распознавания
  pub async fn extract_recognition_frames(
      &self,
      file_id: String,
      file_path: PathBuf,
      count: usize,
  ) -> Result<Vec<RecognitionFrame>> {
      // TODO: интегрировать с video_compiler::frame_extraction::FrameExtractionManager
      unimplemented!("Frame extraction not yet integrated")
  }
  */

  /// Получить все файлы с данными превью
  pub async fn get_all_files_with_previews(&self) -> Vec<String> {
    let data = self.data.read().await;
    data.keys().cloned().collect()
  }

  /// Очистить данные для файла
  pub async fn clear_file_data(&self, file_id: &str) -> Result<()> {
    let mut data = self.data.write().await;

    if let Some(preview_data) = data.remove(file_id) {
      // Удаляем файлы превью
      if let Some(thumb) = preview_data.browser_thumbnail {
        let _ = tokio::fs::remove_file(&thumb.path).await;
      }

      for preview in preview_data.timeline_previews {
        let _ = tokio::fs::remove_file(&preview.path).await;
      }

      for frame in preview_data.recognition_frames {
        let _ = tokio::fs::remove_file(&frame.path).await;
      }
    }

    Ok(())
  }

  /// Сохранить все данные в файл
  pub async fn save_to_file(&self, path: &Path) -> Result<()> {
    let data = self.data.read().await;
    let json = serde_json::to_string_pretty(&*data)?;
    tokio::fs::write(path, json).await?;
    Ok(())
  }

  /// Загрузить данные из файла
  pub async fn load_from_file(&self, path: &Path) -> Result<()> {
    if path.exists() {
      let json = tokio::fs::read_to_string(path).await?;
      let loaded_data: HashMap<String, MediaPreviewData> = serde_json::from_str(&json)?;

      let mut data = self.data.write().await;
      *data = loaded_data;
    }

    Ok(())
  }

  /// Сохранить timeline frames для файла
  pub async fn save_timeline_frames(
    &self,
    file_id: String,
    frames: Vec<crate::media::commands::TimelineFrame>,
  ) -> Result<()> {
    use super::preview_data::TimelinePreview;
    use base64::{engine::general_purpose::STANDARD, Engine as _};

    let mut data = self.data.write().await;
    let preview_data = data
      .entry(file_id.clone())
      .or_insert_with(|| MediaPreviewData::new(file_id.clone(), PathBuf::new()));

    // Очищаем старые timeline frames
    preview_data.timeline_previews.clear();

    // Добавляем новые frames
    for (index, frame) in frames.iter().enumerate() {
      // Создаем путь для сохранения
      let frame_path = self
        .base_dir
        .join("Caches/timeline")
        .join(format!("{}_{}.jpg", file_id, index));

      // Создаем директорию если не существует
      if let Some(parent) = frame_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
      }

      // Декодируем base64 и сохраняем файл
      let image_data = STANDARD.decode(&frame.base64_data)?;
      tokio::fs::write(&frame_path, &image_data).await?;

      // Добавляем в структуру данных
      let timeline_preview = TimelinePreview {
        timestamp: frame.timestamp,
        path: frame_path,
        base64_data: Some(frame.base64_data.clone()),
      };

      preview_data.add_timeline_preview(timeline_preview);
    }

    Ok(())
  }

  /// Получить timeline frames для файла
  pub async fn get_timeline_frames(
    &self,
    file_id: &str,
  ) -> Result<Vec<crate::media::commands::TimelineFrame>> {
    let data = self.data.read().await;

    if let Some(preview_data) = data.get(file_id) {
      let mut frames = Vec::new();

      for preview in &preview_data.timeline_previews {
        let frame = crate::media::commands::TimelineFrame {
          timestamp: preview.timestamp,
          base64_data: preview.base64_data.clone().unwrap_or_default(),
          is_keyframe: false, // TODO: определить keyframes
        };
        frames.push(frame);
      }

      Ok(frames)
    } else {
      Ok(Vec::new())
    }
  }
}
