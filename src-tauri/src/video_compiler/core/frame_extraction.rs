//! Frame Extraction - Модуль извлечения кадров для различных целей
//!
//! Этот модуль обеспечивает извлечение кадров из видео для:
//! - Превью на timeline
//! - Распознавания объектов и сцен
//! - Анализа субтитров
//! - Кэширования для быстрого доступа

use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::error::Result;
use crate::video_compiler::preview::{PreviewGenerator, VideoInfo};
use crate::video_compiler::schema::{Clip, ClipSource, PreviewFormat, Subtitle};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Тип извлечения кадра
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ExtractionPurpose {
  /// Для превью на timeline
  TimelinePreview,
  /// Для распознавания объектов (YOLO)
  ObjectDetection,
  /// Для распознавания сцен
  SceneRecognition,
  /// Для распознавания текста (OCR)
  TextRecognition,
  /// Для анализа субтитров
  SubtitleAnalysis,
  /// Ключевой кадр (I-frame)
  KeyFrame,
  /// Пользовательский скриншот
  UserScreenshot,
}

/// Стратегия извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExtractionStrategy {
  /// Равномерное извлечение через интервалы
  Interval {
    /// Интервал в секундах
    seconds: f64,
  },
  /// Извлечение по изменению сцены
  SceneChange {
    /// Чувствительность (0.0-1.0)
    threshold: f32,
  },
  /// Извлечение по временным меткам субтитров
  SubtitleSync {
    /// Смещение от начала субтитра
    offset_seconds: f64,
  },
  /// Извлечение ключевых кадров (I-frames)
  KeyFrames,
  /// Комбинированная стратегия
  Combined {
    /// Минимальный интервал между кадрами
    min_interval: f64,
    /// Включить изменения сцен
    include_scene_changes: bool,
    /// Включить ключевые кадры
    include_keyframes: bool,
  },
}

/// Настройки извлечения кадров
#[derive(Debug, Clone)]
pub struct ExtractionSettings {
  /// Стратегия извлечения
  pub strategy: ExtractionStrategy,
  /// Цель извлечения
  pub _purpose: ExtractionPurpose,
  /// Разрешение кадров
  pub resolution: (u32, u32),
  /// Качество (0-100)
  pub quality: u8,
  /// Формат изображения
  pub _format: PreviewFormat,
  /// Максимальное количество кадров
  pub max_frames: Option<usize>,
  /// Использовать GPU для декодирования
  pub _gpu_decode: bool,
  /// Параллельная обработка
  pub parallel_extraction: bool,
  /// Количество потоков
  pub _thread_count: Option<usize>,
}

impl Default for ExtractionSettings {
  fn default() -> Self {
    Self {
      strategy: ExtractionStrategy::Interval { seconds: 1.0 },
      _purpose: ExtractionPurpose::TimelinePreview,
      resolution: (640, 360),
      quality: 75,
      _format: PreviewFormat::Jpeg,
      max_frames: None,
      _gpu_decode: false,
      parallel_extraction: true,
      _thread_count: None,
    }
  }
}

/// Менеджер извлечения кадров
pub struct FrameExtractionManager {
  /// Генератор превью
  pub preview_generator: Arc<PreviewGenerator>,
  /// Кэш
  cache: Arc<RwLock<RenderCache>>,
  /// Настройки по умолчанию для разных целей
  purpose_settings: HashMap<ExtractionPurpose, ExtractionSettings>,
  /// Путь к FFmpeg
  _ffmpeg_path: String,
}

impl FrameExtractionManager {
  /// Создать новый менеджер
  pub fn new(cache: Arc<RwLock<RenderCache>>) -> Self {
    Self::with_ffmpeg_path(cache, "ffmpeg".to_string())
  }

  /// Получить доступ к кэшу для демонстрации использования поля cache
  pub fn get_cache(&self) -> Arc<RwLock<RenderCache>> {
    self.cache.clone()
  }

  /// Создать новый менеджер с путем к FFmpeg
  pub fn with_ffmpeg_path(cache: Arc<RwLock<RenderCache>>, ffmpeg_path: String) -> Self {
    let preview_generator = Arc::new(PreviewGenerator::new(cache.clone()));
    let mut purpose_settings = HashMap::new();

    // Настройки для timeline превью
    purpose_settings.insert(
      ExtractionPurpose::TimelinePreview,
      ExtractionSettings {
        strategy: ExtractionStrategy::Combined {
          min_interval: 0.5,
          include_scene_changes: true,
          include_keyframes: true,
        },
        _purpose: ExtractionPurpose::TimelinePreview,
        resolution: (160, 90),
        quality: 60,
        _format: PreviewFormat::Jpeg,
        max_frames: Some(200),
        _gpu_decode: true,
        parallel_extraction: true,
        _thread_count: None,
      },
    );

    // Настройки для распознавания объектов
    purpose_settings.insert(
      ExtractionPurpose::ObjectDetection,
      ExtractionSettings {
        strategy: ExtractionStrategy::Interval { seconds: 1.0 },
        _purpose: ExtractionPurpose::ObjectDetection,
        resolution: (1280, 720), // Выше разрешение для лучшего распознавания
        quality: 85,
        _format: PreviewFormat::Png, // PNG для лучшего качества
        max_frames: None,
        _gpu_decode: true,
        parallel_extraction: true,
        _thread_count: None,
      },
    );

    // Настройки для распознавания сцен
    purpose_settings.insert(
      ExtractionPurpose::SceneRecognition,
      ExtractionSettings {
        strategy: ExtractionStrategy::SceneChange { threshold: 0.3 },
        _purpose: ExtractionPurpose::SceneRecognition,
        resolution: (960, 540),
        quality: 80,
        _format: PreviewFormat::Jpeg,
        max_frames: Some(500),
        _gpu_decode: true,
        parallel_extraction: true,
        _thread_count: None,
      },
    );

    // Настройки для анализа субтитров
    purpose_settings.insert(
      ExtractionPurpose::SubtitleAnalysis,
      ExtractionSettings {
        strategy: ExtractionStrategy::SubtitleSync {
          offset_seconds: 0.5,
        },
        _purpose: ExtractionPurpose::SubtitleAnalysis,
        resolution: (1920, 1080), // Полное разрешение для OCR
        quality: 90,
        _format: PreviewFormat::Png,
        max_frames: None,
        _gpu_decode: true,
        parallel_extraction: false, // Последовательно для синхронизации
        _thread_count: Some(1),
      },
    );

    Self {
      preview_generator,
      cache,
      purpose_settings,
      _ffmpeg_path: ffmpeg_path,
    }
  }

  /// Извлечь кадры для клипа
  pub async fn extract_frames_for_clip(
    &self,
    clip: &Clip,
    settings: Option<ExtractionSettings>,
  ) -> Result<Vec<ExtractedFrame>> {
    let settings =
      settings.unwrap_or_else(|| self.get_default_settings(ExtractionPurpose::TimelinePreview));

    let video_path = match &clip.source {
      ClipSource::File(path) => std::path::Path::new(path),
      _ => {
        return Err(
          crate::video_compiler::error::VideoCompilerError::InvalidParameter(
            "Only file sources are supported for frame extraction".to_string(),
          ),
        )
      }
    };
    let video_info = self.preview_generator.get_video_info(video_path).await?;

    // Вычисляем временные метки для извлечения
    let timestamps = self.calculate_timestamps(
      &settings.strategy,
      clip.source_start,
      clip.source_end,
      &video_info,
      None,
    )?;

    // Извлекаем кадры
    self
      .extract_frames_batch(video_path, timestamps, &settings)
      .await
  }

  /// Извлечь кадры для субтитров
  pub async fn extract_frames_for_subtitles(
    &self,
    video_path: &Path,
    subtitles: &[Subtitle],
    settings: Option<ExtractionSettings>,
  ) -> Result<Vec<SubtitleFrame>> {
    let settings =
      settings.unwrap_or_else(|| self.get_default_settings(ExtractionPurpose::SubtitleAnalysis));

    let mut frames = Vec::new();

    for subtitle in subtitles {
      if !subtitle.enabled {
        continue;
      }

      // Вычисляем время кадра для субтитра
      let timestamp = match &settings.strategy {
        ExtractionStrategy::SubtitleSync { offset_seconds } => subtitle.start_time + offset_seconds,
        _ => subtitle.start_time + 0.5, // По умолчанию 0.5 сек от начала
      };

      // Извлекаем кадр
      let frame_data = self
        .preview_generator
        .generate_preview(
          video_path,
          timestamp,
          Some(settings.resolution),
          Some(settings.quality),
        )
        .await?;

      frames.push(SubtitleFrame {
        subtitle_id: subtitle.id.clone(),
        subtitle_text: subtitle.text.clone(),
        timestamp,
        frame_data,
        start_time: subtitle.start_time,
        end_time: subtitle.end_time,
      });
    }

    Ok(frames)
  }

  /// Извлечь кадры для распознавания
  pub async fn extract_frames_for_recognition(
    &self,
    video_path: &Path,
    duration: f64,
    purpose: ExtractionPurpose,
  ) -> Result<Vec<RecognitionFrame>> {
    let settings = self.get_default_settings(purpose);
    let video_info = self.preview_generator.get_video_info(video_path).await?;

    // Вычисляем временные метки
    let timestamps = self.calculate_timestamps(
      &settings.strategy,
      0.0,
      duration,
      &video_info,
      settings.max_frames,
    )?;

    // Извлекаем кадры
    let extracted_frames = self
      .extract_frames_batch(video_path, timestamps, &settings)
      .await?;

    // Преобразуем в формат для распознавания
    Ok(
      extracted_frames
        .into_iter()
        .map(|frame| RecognitionFrame {
          timestamp: frame.timestamp,
          frame_data: frame.data,
          resolution: frame.resolution,
          scene_change_score: frame.scene_change_score,
          is_keyframe: frame.is_keyframe,
        })
        .collect(),
    )
  }

  /// Получить настройки по умолчанию для цели
  fn get_default_settings(&self, purpose: ExtractionPurpose) -> ExtractionSettings {
    self
      .purpose_settings
      .get(&purpose)
      .cloned()
      .unwrap_or_default()
  }

  /// Вычислить временные метки для извлечения
  fn calculate_timestamps(
    &self,
    strategy: &ExtractionStrategy,
    start_time: f64,
    end_time: f64,
    _video_info: &VideoInfo,
    max_frames: Option<usize>,
  ) -> Result<Vec<f64>> {
    let _duration = end_time - start_time;

    let timestamps = match strategy {
      ExtractionStrategy::Interval { seconds } => {
        let mut timestamps = Vec::new();
        let mut current = start_time;

        while current <= end_time {
          timestamps.push(current);
          current += seconds;
        }

        timestamps
      }

      ExtractionStrategy::SceneChange { threshold: _ } => {
        // Здесь нужно использовать FFmpeg scene detection
        // Пока используем простые интервалы
        vec![] // TODO: Implement scene detection
      }

      ExtractionStrategy::KeyFrames => {
        // Извлечение I-frames через FFmpeg
        vec![] // TODO: Implement keyframe extraction
      }

      ExtractionStrategy::Combined {
        min_interval,
        include_scene_changes,
        include_keyframes,
      } => {
        let mut timestamps = Vec::new();

        // Добавляем равномерные интервалы
        let mut current = start_time;
        while current <= end_time {
          timestamps.push(current);
          current += min_interval;
        }

        // Добавляем изменения сцен
        if *include_scene_changes {
          // TODO: Implement scene detection
          // let scene_changes = self.detect_scene_changes(start_time, end_time, 0.3)?;
          // timestamps.extend(scene_changes);
        }

        // Добавляем ключевые кадры
        if *include_keyframes {
          // TODO: Implement keyframe extraction
          // let keyframes = self.extract_keyframe_timestamps(start_time, end_time)?;
          // timestamps.extend(keyframes);
        }

        // Удаляем дубликаты и сортируем
        timestamps.sort_by(|a, b| a.partial_cmp(b).unwrap());
        timestamps.dedup();

        // Фильтруем по минимальному интервалу
        let mut filtered = vec![timestamps[0]];
        for &ts in &timestamps[1..] {
          if ts - filtered.last().unwrap() >= *min_interval {
            filtered.push(ts);
          }
        }

        filtered
      }

      ExtractionStrategy::SubtitleSync { .. } => {
        // Обрабатывается отдельно в extract_frames_for_subtitles
        vec![]
      }
    };

    // Ограничиваем количество кадров если необходимо
    Ok(if let Some(max) = max_frames {
      timestamps.into_iter().take(max).collect()
    } else {
      timestamps
    })
  }

  /// Извлечь пакет кадров
  async fn extract_frames_batch(
    &self,
    video_path: &Path,
    timestamps: Vec<f64>,
    settings: &ExtractionSettings,
  ) -> Result<Vec<ExtractedFrame>> {
    use crate::video_compiler::cache::PreviewKey;

    let mut frames = Vec::new();
    let video_path_str = video_path.to_string_lossy().to_string();

    // Используем кэш для оптимизации извлечения кадров
    let mut cache = self.cache.write().await;
    let mut uncached_timestamps = Vec::new();
    let mut cached_frames = Vec::new();

    // Проверяем, какие кадры уже есть в кэше
    for timestamp in &timestamps {
      let preview_key = PreviewKey::new(
        video_path_str.clone(),
        *timestamp,
        settings.resolution,
        settings.quality,
      );

      if let Some(cached_data) = cache.get_preview(&preview_key).await {
        cached_frames.push(ExtractedFrame {
          timestamp: *timestamp,
          data: cached_data.image_data,
          resolution: settings.resolution,
          scene_change_score: None,
          is_keyframe: false,
        });
        log::debug!("Кадр на {timestamp:.2}s найден в кэше");
      } else {
        uncached_timestamps.push(*timestamp);
      }
    }

    // Освобождаем мьютекс кэша для генерации новых кадров
    drop(cache);

    log::info!(
      "Извлечение кадров: {} из кэша, {} требуют генерации",
      cached_frames.len(),
      uncached_timestamps.len()
    );

    // Добавляем кешированные кадры к результату
    frames.extend(cached_frames);

    // Генерируем только некешированные кадры
    if !uncached_timestamps.is_empty() {
      if settings.parallel_extraction {
        // Параллельное извлечение
        let results = self
          .preview_generator
          .generate_preview_batch_for_file(
            video_path,
            uncached_timestamps.clone(),
            Some(settings.resolution),
            Some(settings.quality),
          )
          .await?;

        for (i, result) in results.into_iter().enumerate() {
          let timestamp = uncached_timestamps[i];
          match result.result {
            Ok(data) => {
              // Сохраняем в кэш новый кадр
              let preview_key = PreviewKey::new(
                video_path_str.clone(),
                timestamp,
                settings.resolution,
                settings.quality,
              );

              let mut cache = self.cache.write().await;
              if let Err(e) = cache.store_preview(preview_key, data.clone()).await {
                log::warn!("Не удалось сохранить кадр в кэш: {e}");
              }
              drop(cache);

              frames.push(ExtractedFrame {
                timestamp,
                data,
                resolution: settings.resolution,
                scene_change_score: None,
                is_keyframe: false,
              });
            }
            Err(e) => {
              log::warn!("Не удалось извлечь кадр на {timestamp:.2}s: {e}");
            }
          }
        }
      } else {
        // Последовательное извлечение
        for timestamp in uncached_timestamps {
          match self
            .preview_generator
            .generate_preview(
              video_path,
              timestamp,
              Some(settings.resolution),
              Some(settings.quality),
            )
            .await
          {
            Ok(data) => {
              // Сохраняем в кэш новый кадр
              let preview_key = PreviewKey::new(
                video_path_str.clone(),
                timestamp,
                settings.resolution,
                settings.quality,
              );

              let mut cache = self.cache.write().await;
              if let Err(e) = cache.store_preview(preview_key, data.clone()).await {
                log::warn!("Не удалось сохранить кадр в кэш: {e}");
              }
              drop(cache);

              frames.push(ExtractedFrame {
                timestamp,
                data,
                resolution: settings.resolution,
                scene_change_score: None,
                is_keyframe: false,
              });
            }
            Err(e) => {
              log::warn!("Не удалось извлечь кадр на {timestamp:.2}s: {e}");
            }
          }
        }
      }
    }

    // Сортируем кадры по временным меткам для корректного порядка
    frames.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());

    Ok(frames)
  }
}

/// Извлеченный кадр
#[derive(Debug, Clone)]
pub struct ExtractedFrame {
  /// Временная метка
  pub timestamp: f64,
  /// Данные изображения
  pub data: Vec<u8>,
  /// Разрешение
  pub resolution: (u32, u32),
  /// Оценка изменения сцены (если доступно)
  pub scene_change_score: Option<f32>,
  /// Является ли ключевым кадром
  pub is_keyframe: bool,
}

/// Кадр для субтитра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleFrame {
  /// ID субтитра
  pub subtitle_id: String,
  /// Текст субтитра
  pub subtitle_text: String,
  /// Временная метка кадра
  pub timestamp: f64,
  /// Данные кадра
  pub frame_data: Vec<u8>,
  /// Время начала субтитра
  pub start_time: f64,
  /// Время окончания субтитра
  pub end_time: f64,
}

/// Кадр для распознавания
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecognitionFrame {
  /// Временная метка
  pub timestamp: f64,
  /// Данные кадра
  pub frame_data: Vec<u8>,
  /// Разрешение
  pub resolution: (u32, u32),
  /// Оценка изменения сцены
  pub scene_change_score: Option<f32>,
  /// Является ли ключевым кадром
  pub is_keyframe: bool,
}

/// Метаданные извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionMetadata {
  /// Путь к видео
  pub video_path: String,
  /// Общее количество извлеченных кадров
  pub total_frames: usize,
  /// Использованная стратегия
  pub strategy: ExtractionStrategy,
  /// Цель извлечения
  pub _purpose: ExtractionPurpose,
  /// Время извлечения (мс)
  pub extraction_time_ms: u64,
  /// Использовалось ли GPU ускорение
  pub gpu_used: bool,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::cache::{MediaMetadata, PreviewData, PreviewKey};
  use crate::video_compiler::preview::VideoInfo;
  use std::collections::HashMap;
  use std::time::{Duration, SystemTime};

  #[test]
  fn test_extraction_settings_default() {
    let settings = ExtractionSettings::default();
    assert_eq!(settings.resolution, (640, 360));
    assert_eq!(settings.quality, 75);
    assert!(settings.parallel_extraction);
    assert!(!settings._gpu_decode);
    assert_eq!(settings.max_frames, None);
    assert_eq!(settings._thread_count, None);
    assert!(
      matches!(settings.strategy, ExtractionStrategy::Interval { seconds } if seconds == 1.0)
    );
    assert_eq!(settings._purpose, ExtractionPurpose::TimelinePreview);
    assert!(matches!(settings._format, PreviewFormat::Jpeg));
  }

  #[test]
  fn test_extraction_purpose_equality() {
    assert_eq!(
      ExtractionPurpose::TimelinePreview,
      ExtractionPurpose::TimelinePreview
    );
    assert_ne!(
      ExtractionPurpose::TimelinePreview,
      ExtractionPurpose::ObjectDetection
    );
  }

  #[test]
  fn test_extraction_purpose_serialization() {
    let purpose = ExtractionPurpose::ObjectDetection;
    let json = serde_json::to_string(&purpose).unwrap();
    assert!(json.contains("ObjectDetection"));

    let deserialized: ExtractionPurpose = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized, purpose);
  }

  #[test]
  fn test_extraction_strategy_serialization() {
    let strategies = vec![
      ExtractionStrategy::Interval { seconds: 2.5 },
      ExtractionStrategy::SceneChange { threshold: 0.4 },
      ExtractionStrategy::SubtitleSync {
        offset_seconds: 0.3,
      },
      ExtractionStrategy::KeyFrames,
      ExtractionStrategy::Combined {
        min_interval: 1.0,
        include_scene_changes: true,
        include_keyframes: false,
      },
    ];

    for strategy in strategies {
      let json = serde_json::to_string(&strategy).unwrap();
      let deserialized: ExtractionStrategy = serde_json::from_str(&json).unwrap();

      match (&strategy, &deserialized) {
        (
          ExtractionStrategy::Interval { seconds: s1 },
          ExtractionStrategy::Interval { seconds: s2 },
        ) => {
          assert_eq!(s1, s2);
        }
        (
          ExtractionStrategy::SceneChange { threshold: t1 },
          ExtractionStrategy::SceneChange { threshold: t2 },
        ) => {
          assert_eq!(t1, t2);
        }
        _ => {}
      }
    }
  }

  #[tokio::test]
  async fn test_frame_extraction_manager_new() {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let manager = FrameExtractionManager::new(cache);

    assert_eq!(manager._ffmpeg_path, "ffmpeg");
    assert!(!manager.purpose_settings.is_empty());

    // Check default settings for different purposes
    let timeline_settings = manager.get_default_settings(ExtractionPurpose::TimelinePreview);
    assert_eq!(timeline_settings.resolution, (160, 90));
    assert_eq!(timeline_settings.quality, 60);

    let object_detection_settings =
      manager.get_default_settings(ExtractionPurpose::ObjectDetection);
    assert_eq!(object_detection_settings.resolution, (1280, 720));
    assert_eq!(object_detection_settings.quality, 85);
  }

  #[test]
  fn test_preview_key_new() {
    let key = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (1920, 1080), 85);

    assert_eq!(key.file_path, "/test/video.mp4");
    assert_eq!(key.timestamp, 10500); // 10.5 * 1000
    assert_eq!(key.resolution, (1920, 1080));
    assert_eq!(key.quality, 85);
  }

  #[test]
  fn test_preview_data_is_expired() {
    let data = PreviewData {
      image_data: vec![1, 2, 3],
      timestamp: SystemTime::now() - Duration::from_secs(3600),
      _access_count: 5,
    };

    assert!(data.is_expired(Duration::from_secs(1800))); // Should be expired
    assert!(!data.is_expired(Duration::from_secs(7200))); // Should not be expired
  }

  #[test]
  fn test_media_metadata_serialization() {
    let metadata = MediaMetadata {
      file_path: "/test/video.mp4".to_string(),
      file_size: 1024000,
      modified_time: SystemTime::now(),
      duration: 120.5,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
      cached_at: SystemTime::now(),
    };

    let json = serde_json::to_string(&metadata).unwrap();
    assert!(json.contains("1024000"));
    assert!(json.contains("120.5"));

    let deserialized: MediaMetadata = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.file_path, metadata.file_path);
    assert_eq!(deserialized.duration, metadata.duration);
  }

  #[test]
  fn test_subtitle_frame_serialization() {
    let frame = SubtitleFrame {
      subtitle_id: "sub-001".to_string(),
      subtitle_text: "Hello World".to_string(),
      timestamp: 15.5,
      frame_data: vec![10, 20, 30],
      start_time: 15.0,
      end_time: 17.0,
    };

    let json = serde_json::to_string(&frame).unwrap();
    assert!(json.contains("sub-001"));
    assert!(json.contains("Hello World"));
    assert!(json.contains("15.5"));

    let deserialized: SubtitleFrame = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.subtitle_id, frame.subtitle_id);
    assert_eq!(deserialized.timestamp, frame.timestamp);
  }

  #[test]
  fn test_recognition_frame_serialization() {
    let frame = RecognitionFrame {
      timestamp: 20.0,
      frame_data: vec![5, 10, 15],
      resolution: (1280, 720),
      scene_change_score: Some(0.75),
      is_keyframe: true,
    };

    let json = serde_json::to_string(&frame).unwrap();
    assert!(json.contains("20.0"));
    assert!(json.contains("1280"));
    assert!(json.contains("0.75"));
    assert!(json.contains("true"));

    let deserialized: RecognitionFrame = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.timestamp, frame.timestamp);
    assert_eq!(deserialized.scene_change_score, frame.scene_change_score);
  }

  #[test]
  fn test_extraction_metadata_serialization() {
    let metadata = ExtractionMetadata {
      video_path: "/test/video.mp4".to_string(),
      total_frames: 100,
      strategy: ExtractionStrategy::Interval { seconds: 1.0 },
      _purpose: ExtractionPurpose::TimelinePreview,
      extraction_time_ms: 5000,
      gpu_used: true,
    };

    let json = serde_json::to_string(&metadata).unwrap();
    assert!(json.contains("/test/video.mp4"));
    assert!(json.contains("100"));
    assert!(json.contains("5000"));

    let deserialized: ExtractionMetadata = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.total_frames, metadata.total_frames);
    assert_eq!(deserialized.gpu_used, metadata.gpu_used);
  }

  #[test]
  fn test_extracted_frame_creation() {
    let frame = ExtractedFrame {
      timestamp: 5.0,
      data: vec![1, 2, 3, 4, 5],
      resolution: (640, 360),
      scene_change_score: Some(0.45),
      is_keyframe: false,
    };

    assert_eq!(frame.timestamp, 5.0);
    assert_eq!(frame.data.len(), 5);
    assert_eq!(frame.resolution, (640, 360));
    assert_eq!(frame.scene_change_score, Some(0.45));
  }

  #[tokio::test]
  async fn test_calculate_timestamps_interval_strategy() {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let manager = FrameExtractionManager::new(cache);

    let strategy = ExtractionStrategy::Interval { seconds: 2.0 };
    let video_info = VideoInfo {
      duration: 10.0,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
    };

    let timestamps = manager
      .calculate_timestamps(&strategy, 0.0, 10.0, &video_info, None)
      .unwrap();

    assert_eq!(timestamps.len(), 6); // 0, 2, 4, 6, 8, 10
    assert_eq!(timestamps[0], 0.0);
    assert_eq!(timestamps[1], 2.0);
    assert_eq!(timestamps[5], 10.0);
  }

  #[tokio::test]
  async fn test_calculate_timestamps_with_max_frames() {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let manager = FrameExtractionManager::new(cache);

    let strategy = ExtractionStrategy::Interval { seconds: 1.0 };
    let video_info = VideoInfo {
      duration: 60.0,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
    };

    let timestamps = manager
      .calculate_timestamps(&strategy, 0.0, 60.0, &video_info, Some(5))
      .unwrap();

    assert_eq!(timestamps.len(), 5); // Limited to 5 frames
  }

  #[tokio::test]
  async fn test_calculate_timestamps_combined_strategy() {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let manager = FrameExtractionManager::new(cache);

    let strategy = ExtractionStrategy::Combined {
      min_interval: 2.0,
      include_scene_changes: false,
      include_keyframes: false,
    };
    let video_info = VideoInfo {
      duration: 10.0,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
    };

    let timestamps = manager
      .calculate_timestamps(&strategy, 0.0, 10.0, &video_info, None)
      .unwrap();

    assert!(!timestamps.is_empty());
    assert_eq!(timestamps[0], 0.0);

    // Check minimum interval between timestamps
    for i in 1..timestamps.len() {
      assert!(timestamps[i] - timestamps[i - 1] >= 2.0);
    }
  }

  #[tokio::test]
  async fn test_default_purpose_settings() {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let manager = FrameExtractionManager::new(cache);

    // Test Timeline Preview settings
    let timeline_settings = manager.get_default_settings(ExtractionPurpose::TimelinePreview);
    assert_eq!(
      timeline_settings._purpose,
      ExtractionPurpose::TimelinePreview
    );
    assert_eq!(timeline_settings.resolution, (160, 90));
    assert_eq!(timeline_settings.quality, 60);
    assert_eq!(timeline_settings.max_frames, Some(200));

    // Test Object Detection settings
    let object_settings = manager.get_default_settings(ExtractionPurpose::ObjectDetection);
    assert_eq!(object_settings._purpose, ExtractionPurpose::ObjectDetection);
    assert_eq!(object_settings.resolution, (1280, 720));
    assert_eq!(object_settings.quality, 85);
    assert!(matches!(object_settings._format, PreviewFormat::Png));

    // Test Scene Recognition settings
    let scene_settings = manager.get_default_settings(ExtractionPurpose::SceneRecognition);
    assert_eq!(scene_settings.resolution, (960, 540));
    assert_eq!(scene_settings.quality, 80);
    assert_eq!(scene_settings.max_frames, Some(500));

    // Test Subtitle Analysis settings
    let subtitle_settings = manager.get_default_settings(ExtractionPurpose::SubtitleAnalysis);
    assert_eq!(subtitle_settings.resolution, (1920, 1080));
    assert_eq!(subtitle_settings.quality, 90);
    assert!(!subtitle_settings.parallel_extraction);
  }

  #[test]
  fn test_all_extraction_purposes() {
    let purposes = vec![
      ExtractionPurpose::TimelinePreview,
      ExtractionPurpose::ObjectDetection,
      ExtractionPurpose::SceneRecognition,
      ExtractionPurpose::TextRecognition,
      ExtractionPurpose::SubtitleAnalysis,
      ExtractionPurpose::KeyFrame,
      ExtractionPurpose::UserScreenshot,
    ];

    for purpose in purposes {
      let json = serde_json::to_string(&purpose).unwrap();
      let deserialized: ExtractionPurpose = serde_json::from_str(&json).unwrap();
      assert_eq!(purpose, deserialized);
    }
  }

  #[test]
  fn test_purpose_hash_map() {
    let mut map = HashMap::new();
    map.insert(ExtractionPurpose::TimelinePreview, "preview");
    map.insert(ExtractionPurpose::ObjectDetection, "detection");

    assert_eq!(
      map.get(&ExtractionPurpose::TimelinePreview),
      Some(&"preview")
    );
    assert_eq!(
      map.get(&ExtractionPurpose::ObjectDetection),
      Some(&"detection")
    );
  }
}

#[cfg(test)]
mod frame_extraction_tests;
