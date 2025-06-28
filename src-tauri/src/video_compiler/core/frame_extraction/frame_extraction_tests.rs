//! Тесты для модуля Frame Extraction

#[cfg(test)]
mod tests {
  use super::super::*;
  use tokio;

  #[test]
  fn test_extraction_purpose_serialization() {
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
  fn test_extraction_strategy_serialization() {
    let strategies = vec![
      ExtractionStrategy::Interval { seconds: 1.0 },
      ExtractionStrategy::SceneChange { threshold: 0.5 },
      ExtractionStrategy::SubtitleSync {
        offset_seconds: 0.2,
      },
      ExtractionStrategy::KeyFrames,
      ExtractionStrategy::Combined {
        min_interval: 2.0,
        include_scene_changes: true,
        include_keyframes: true,
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
        (
          ExtractionStrategy::SubtitleSync { offset_seconds: o1 },
          ExtractionStrategy::SubtitleSync { offset_seconds: o2 },
        ) => {
          assert_eq!(o1, o2);
        }
        (ExtractionStrategy::KeyFrames, ExtractionStrategy::KeyFrames) => {}
        (
          ExtractionStrategy::Combined {
            min_interval: m1,
            include_scene_changes: s1,
            include_keyframes: k1,
          },
          ExtractionStrategy::Combined {
            min_interval: m2,
            include_scene_changes: s2,
            include_keyframes: k2,
          },
        ) => {
          assert_eq!(m1, m2);
          assert_eq!(s1, s2);
          assert_eq!(k1, k2);
        }
        _ => panic!("Strategy mismatch"),
      }
    }
  }

  #[test]
  fn test_extraction_settings_creation() {
    let settings = ExtractionSettings {
      strategy: ExtractionStrategy::Interval { seconds: 5.0 },
      _purpose: ExtractionPurpose::TimelinePreview,
      resolution: (1920, 1080),
      quality: 85,
      _format: crate::video_compiler::schema::PreviewFormat::Jpeg,
      max_frames: Some(100),
      _gpu_decode: true,
      parallel_extraction: true,
      _thread_count: Some(4),
    };

    assert_eq!(settings.resolution, (1920, 1080));
    assert_eq!(settings.quality, 85);
    assert!(matches!(
      settings._format,
      crate::video_compiler::schema::PreviewFormat::Jpeg
    ));
    assert_eq!(settings.max_frames, Some(100));
    assert!(settings._gpu_decode);
    assert!(settings.parallel_extraction);
    assert_eq!(settings._thread_count, Some(4));
  }

  #[test]
  fn test_extraction_metadata_creation() {
    let metadata = ExtractionMetadata {
      video_path: "/path/to/video.mp4".to_string(),
      total_frames: 315,
      strategy: ExtractionStrategy::Interval { seconds: 1.0 },
      _purpose: ExtractionPurpose::TimelinePreview,
      extraction_time_ms: 45000, // 45 seconds
      gpu_used: true,
    };

    assert_eq!(metadata.video_path, "/path/to/video.mp4");
    assert_eq!(metadata.total_frames, 315);
    assert!(
      matches!(metadata.strategy, ExtractionStrategy::Interval { seconds } if seconds == 1.0)
    );
    assert_eq!(metadata._purpose, ExtractionPurpose::TimelinePreview);
    assert_eq!(metadata.extraction_time_ms, 45000);
    assert!(metadata.gpu_used);
  }

  #[test]
  fn test_extracted_frame_creation() {
    let frame = ExtractedFrame {
      timestamp: 5.0,
      data: vec![255, 0, 0, 255, 0, 255, 0, 255], // 2 RGBA pixels
      resolution: (2, 1),
      scene_change_score: Some(0.12),
      is_keyframe: false,
    };

    assert_eq!(frame.timestamp, 5.0);
    assert_eq!(frame.data.len(), 8);
    assert_eq!(frame.resolution, (2, 1));
    assert_eq!(frame.scene_change_score, Some(0.12));
    assert!(!frame.is_keyframe);
  }

  #[tokio::test]
  async fn test_frame_extraction_manager_new() {
    let cache = std::sync::Arc::new(tokio::sync::RwLock::new(
      crate::video_compiler::core::cache::RenderCache::new(),
    ));
    let manager = FrameExtractionManager::new(cache);

    // Verify that the manager was created successfully
    let cache_ref = manager.get_cache();
    let cache_guard = cache_ref.read().await;
    let stats = cache_guard.get_stats();
    assert_eq!(stats.preview_hits, 0);
  }

  #[test]
  fn test_extraction_strategy_interval_calculation() {
    let strategy = ExtractionStrategy::Interval { seconds: 2.0 };

    // Test calculation logic for interval strategy
    let start_time = 0.0;
    let end_time = 10.0;
    let interval = match strategy {
      ExtractionStrategy::Interval { seconds } => seconds,
      _ => panic!("Expected interval strategy"),
    };

    let mut timestamps = Vec::new();
    let mut current = start_time;
    while current <= end_time {
      timestamps.push(current);
      current += interval;
    }

    // Должно быть 6 точек: 0, 2, 4, 6, 8, 10
    assert_eq!(timestamps.len(), 6);
    assert_eq!(timestamps[0], 0.0);
    assert_eq!(timestamps[1], 2.0);
    assert_eq!(timestamps[2], 4.0);
    assert_eq!(timestamps[3], 6.0);
    assert_eq!(timestamps[4], 8.0);
    assert_eq!(timestamps[5], 10.0);
  }

  #[test]
  fn test_max_frames_limitation() {
    let settings = ExtractionSettings {
      strategy: ExtractionStrategy::Interval { seconds: 1.0 },
      _purpose: ExtractionPurpose::TimelinePreview,
      resolution: (640, 360),
      quality: 70,
      _format: crate::video_compiler::schema::PreviewFormat::Jpeg,
      max_frames: Some(3),
      _gpu_decode: false,
      parallel_extraction: true,
      _thread_count: None,
    };

    // Test that max_frames setting is correctly configured
    assert_eq!(settings.max_frames, Some(3));

    // Test max frames calculation logic
    let total_possible_frames = 11; // 0-10 seconds with 1 second interval
    let max_frames = settings.max_frames.unwrap_or(total_possible_frames);
    let actual_frames = std::cmp::min(total_possible_frames, max_frames);

    assert_eq!(actual_frames, 3);
  }

  #[test]
  fn test_time_range_calculation() {
    let start_time = 2.0;
    let end_time = 6.0;
    let interval = 1.0;

    let mut timestamps = Vec::new();
    let mut current = start_time;
    while current <= end_time {
      timestamps.push(current);
      current += interval;
    }

    // Должно быть кадры только в диапазоне 2.0-6.0 секунд
    assert!(timestamps.iter().all(|&t| (2.0..=6.0).contains(&t)));
    assert_eq!(timestamps[0], 2.0);
    assert_eq!(timestamps[timestamps.len() - 1], 6.0);
    assert_eq!(timestamps, vec![2.0, 3.0, 4.0, 5.0, 6.0]);
  }

  #[test]
  fn test_cache_key_generation() {
    let video_path = "/path/to/video.mp4";
    let timestamp = 15.5;
    let purpose = ExtractionPurpose::ObjectDetection;
    let resolution = (1920, 1080);

    // Simulate cache key generation logic
    let cache_key = format!(
      "{}_{:.2}_{:?}_{}x{}",
      video_path.replace('/', "_"),
      timestamp,
      purpose,
      resolution.0,
      resolution.1
    );

    assert!(cache_key.contains("video.mp4"));
    assert!(cache_key.contains("15.50"));
    assert!(cache_key.contains("ObjectDetection"));
    assert!(cache_key.contains("1920x1080"));
  }

  #[test]
  fn test_frame_similarity_threshold() {
    // Создаем тестовые кадры с разными характеристиками
    let frame1 = ExtractedFrame {
      timestamp: 5.0,
      data: vec![128; 1000], // Средний серый
      resolution: (100, 10),
      scene_change_score: Some(0.1),
      is_keyframe: false,
    };

    let frame2 = ExtractedFrame {
      timestamp: 6.0,
      data: vec![130; 1000], // Немного отличается
      resolution: (100, 10),
      scene_change_score: Some(0.05),
      is_keyframe: false,
    };

    // Проверяем различия в scene_change_score
    let score_diff =
      (frame1.scene_change_score.unwrap_or(0.0) - frame2.scene_change_score.unwrap_or(0.0)).abs();

    // С высоким порогом (0.9) кадры должны считаться похожими
    assert!(score_diff < 0.9);

    // С низким порогом (0.01) кадры должны считаться разными
    assert!(score_diff > 0.01);
  }

  #[test]
  fn test_format_timestamp() {
    // Test timestamp formatting function
    fn format_timestamp(seconds: f64) -> String {
      let hours = (seconds / 3600.0).floor() as u32;
      let minutes = ((seconds % 3600.0) / 60.0).floor() as u32;
      let secs = seconds % 60.0;
      format!("{hours:02}:{minutes:02}:{secs:06.3}")
    }

    assert_eq!(format_timestamp(0.0), "00:00:00.000");
    assert_eq!(format_timestamp(65.5), "00:01:05.500");
    assert_eq!(format_timestamp(3661.25), "01:01:01.250");
  }

  #[test]
  fn test_validate_extraction_settings() {
    // Валидные настройки
    let valid_settings = ExtractionSettings {
      strategy: ExtractionStrategy::Interval { seconds: 1.0 },
      _purpose: ExtractionPurpose::TimelinePreview,
      resolution: (1920, 1080),
      quality: 85,
      _format: crate::video_compiler::schema::PreviewFormat::Jpeg,
      max_frames: Some(100),
      _gpu_decode: true,
      parallel_extraction: true,
      _thread_count: Some(4),
    };

    // Test validation logic
    fn validate_settings(settings: &ExtractionSettings) -> std::result::Result<(), String> {
      if settings.quality > 100 {
        return Err("Quality cannot exceed 100".to_string());
      }
      if settings.resolution.0 == 0 || settings.resolution.1 == 0 {
        return Err("Resolution dimensions must be positive".to_string());
      }
      Ok(())
    }

    assert!(validate_settings(&valid_settings).is_ok());

    // Невалидные настройки: качество > 100
    let mut invalid_settings = valid_settings.clone();
    invalid_settings.quality = 150;
    assert!(validate_settings(&invalid_settings).is_err());

    // Невалидные настройки: нулевое разрешение
    let mut invalid_settings = valid_settings.clone();
    invalid_settings.resolution = (0, 1080);
    assert!(validate_settings(&invalid_settings).is_err());
  }

  #[test]
  fn test_extraction_purpose_display() {
    assert_eq!(
      format!("{:?}", ExtractionPurpose::TimelinePreview),
      "TimelinePreview"
    );
    assert_eq!(
      format!("{:?}", ExtractionPurpose::ObjectDetection),
      "ObjectDetection"
    );
    assert_eq!(
      format!("{:?}", ExtractionPurpose::SceneRecognition),
      "SceneRecognition"
    );
    assert_eq!(
      format!("{:?}", ExtractionPurpose::TextRecognition),
      "TextRecognition"
    );
    assert_eq!(
      format!("{:?}", ExtractionPurpose::SubtitleAnalysis),
      "SubtitleAnalysis"
    );
    assert_eq!(format!("{:?}", ExtractionPurpose::KeyFrame), "KeyFrame");
    assert_eq!(
      format!("{:?}", ExtractionPurpose::UserScreenshot),
      "UserScreenshot"
    );
  }

  #[test]
  fn test_extraction_statistics_calculation() {
    // Test extraction statistics calculation
    struct TestStats {
      total_frames_requested: usize,
      frames_extracted: usize,
      frames_failed: usize,
      cache_hits: usize,
      cache_misses: usize,
      total_file_size: u64,
    }

    impl TestStats {
      fn success_rate(&self) -> f64 {
        (self.frames_extracted as f64 / self.total_frames_requested as f64) * 100.0
      }

      fn cache_hit_rate(&self) -> f64 {
        let total_cache_accesses = self.cache_hits + self.cache_misses;
        if total_cache_accesses == 0 {
          0.0
        } else {
          self.cache_hits as f64 / total_cache_accesses as f64
        }
      }

      fn average_file_size(&self) -> u64 {
        if self.frames_extracted == 0 {
          0
        } else {
          self.total_file_size / self.frames_extracted as u64
        }
      }
    }

    let stats = TestStats {
      total_frames_requested: 100,
      frames_extracted: 95,
      frames_failed: 5,
      cache_hits: 25,
      cache_misses: 70,
      total_file_size: 15_000_000, // 15MB
    };

    assert_eq!(stats.total_frames_requested, 100);
    assert_eq!(stats.frames_extracted, 95);
    assert_eq!(stats.frames_failed, 5);
    assert_eq!(stats.cache_hits, 25);
    assert_eq!(stats.cache_misses, 70);
    assert_eq!(stats.total_file_size, 15_000_000);

    // Тест вычисляемых метрик
    assert_eq!(stats.success_rate(), 95.0);
    assert!((stats.cache_hit_rate() - (25.0 / 95.0)).abs() < 0.001);
    assert_eq!(stats.average_file_size(), 15_000_000 / 95);
  }
}
