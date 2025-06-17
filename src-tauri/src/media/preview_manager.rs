use anyhow::Result;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::preview_data::{MediaPreviewData, ThumbnailData, TimelinePreview, RecognitionFrame};
use super::thumbnail::generate_thumbnail;
use crate::video_compiler::preview::PreviewGenerator;
use crate::video_compiler::frame_extraction::{FrameExtractionManager, ExtractionPurpose};
use crate::video_compiler::cache::RenderCache;

/// Единый менеджер для всех данных превью
pub struct PreviewDataManager {
  /// Кэш всех данных превью по file_id
  data: Arc<RwLock<HashMap<String, MediaPreviewData>>>,

  /// Генератор превью для таймлайна
  timeline_generator: Arc<RwLock<PreviewGenerator>>,

  /// Менеджер извлечения кадров
  frame_extractor: Arc<RwLock<FrameExtractionManager>>,

  /// Базовая директория для хранения
  base_dir: PathBuf,
}

impl PreviewDataManager {
  pub fn new(base_dir: PathBuf) -> Self {
    // Создаем общий кэш для PreviewGenerator и FrameExtractionManager
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    
    let preview_generator = PreviewGenerator::new(cache.clone());
    let frame_extractor = FrameExtractionManager::new(cache.clone());

    Self {
      data: Arc::new(RwLock::new(HashMap::new())),
      timeline_generator: Arc::new(RwLock::new(preview_generator)),
      frame_extractor: Arc::new(RwLock::new(frame_extractor)),
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

  /// Генерировать превью для таймлайна
  pub async fn generate_timeline_previews(
      &self,
      file_id: String,
      file_path: PathBuf,
      duration: f64,
      interval: f64,
  ) -> Result<Vec<TimelinePreview>> {
      use base64::{engine::general_purpose::STANDARD, Engine as _};
      
      // Используем PreviewGenerator для генерации превью
      let generator = self.timeline_generator.read().await;
      let preview_results = generator
          .generate_timeline_previews(&file_path, duration, interval)
          .await?;
      
      // Преобразуем результаты в наш формат TimelinePreview
      let mut timeline_previews = Vec::new();
      let output_dir = self.base_dir.join("Caches/timeline").join(&file_id);
      
      // Создаем директорию если не существует
      tokio::fs::create_dir_all(&output_dir).await?;
      
      for (i, preview_result) in preview_results.iter().enumerate() {
          let base64_data = if let Some(ref image_data) = preview_result.image_data {
              // image_data уже в формате Vec<u8>
              let base64 = STANDARD.encode(image_data);
              
              // Сохраняем файл на диск для совместимости
              let file_path = output_dir.join(format!("frame_{:04}.jpg", i));
              tokio::fs::write(&file_path, image_data).await?;
              
              let timeline_preview = TimelinePreview {
                  timestamp: preview_result.timestamp,
                  path: file_path,
                  base64_data: Some(base64.clone()),
              };
              
              timeline_previews.push(timeline_preview);
              Some(base64)
          } else {
              None
          };
          
          if base64_data.is_none() {
              // Если нет данных, создаем пустой превью
              let file_path = output_dir.join(format!("frame_{:04}_empty.jpg", i));
              let timeline_preview = TimelinePreview {
                  timestamp: preview_result.timestamp,
                  path: file_path,
                  base64_data: None,
              };
              timeline_previews.push(timeline_preview);
          }
      }
      
      // Сохраняем в кэш
      let mut data = self.data.write().await;
      let preview_data = data
          .entry(file_id.clone())
          .or_insert_with(|| MediaPreviewData::new(file_id, file_path));
      
      // Очищаем старые превью и добавляем новые
      preview_data.timeline_previews.clear();
      for preview in &timeline_previews {
          preview_data.add_timeline_preview(preview.clone());
      }
      
      Ok(timeline_previews)
  }

  /// Извлечь кадры для распознавания
  pub async fn extract_recognition_frames(
      &self,
      file_id: String,
      file_path: PathBuf,
      count: usize,
  ) -> Result<Vec<RecognitionFrame>> {
      // Получаем информацию о видео
      let generator = self.timeline_generator.read().await;
      let video_info = generator.get_video_info(&file_path).await?;
      let duration = video_info.duration;
      drop(generator); // Освобождаем блокировку
      
      // Используем FrameExtractionManager для извлечения кадров
      let extractor = self.frame_extractor.read().await;
      let extracted_frames = extractor
          .extract_frames_for_recognition(
              &file_path,
              duration,
              ExtractionPurpose::ObjectDetection,
          )
          .await?;
      
      // Берем только запрошенное количество кадров
      let frames_to_use: Vec<_> = extracted_frames.into_iter().take(count).collect();
      
      // Преобразуем результаты в наш формат RecognitionFrame
      let mut recognition_frames = Vec::new();
      let output_dir = self.base_dir.join("Recognition").join(&file_id);
      
      // Создаем директорию если не существует
      tokio::fs::create_dir_all(&output_dir).await?;
      
      for (i, frame) in frames_to_use.iter().enumerate() {
          // Сохраняем данные кадра на диск
          let file_path = output_dir.join(format!("recognition_frame_{:04}.jpg", i));
          tokio::fs::write(&file_path, &frame.frame_data).await?;
          
          let recognition_frame = RecognitionFrame {
              timestamp: frame.timestamp,
              path: file_path,
              processed: false,
          };
          
          recognition_frames.push(recognition_frame.clone());
      }
      
      // Сохраняем в кэш
      let mut data = self.data.write().await;
      let preview_data = data
          .entry(file_id.clone())
          .or_insert_with(|| MediaPreviewData::new(file_id, file_path));
      
      // Очищаем старые кадры и добавляем новые
      preview_data.recognition_frames.clear();
      for frame in &recognition_frames {
          preview_data.add_recognition_frame(frame.clone());
      }
      
      Ok(recognition_frames)
  }

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
