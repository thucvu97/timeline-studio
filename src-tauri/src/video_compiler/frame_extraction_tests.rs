//! Тесты для модуля frame_extraction
//!
//! Проверяем функциональность извлечения кадров

#[cfg(test)]
mod tests {
  use crate::video_compiler::frame_extraction::{
    ExtractionPurpose, ExtractionSettings, ExtractionStrategy,
  };
  use crate::video_compiler::schema::PreviewFormat;

  #[test]
  fn test_extraction_purpose_types() {
    let timeline_preview = ExtractionPurpose::TimelinePreview;
    let object_detection = ExtractionPurpose::ObjectDetection;
    let scene_recognition = ExtractionPurpose::SceneRecognition;
    let text_recognition = ExtractionPurpose::TextRecognition;
    let subtitle_analysis = ExtractionPurpose::SubtitleAnalysis;
    let key_frame = ExtractionPurpose::KeyFrame;
    let user_screenshot = ExtractionPurpose::UserScreenshot;

    // Проверяем что типы отличаются
    assert_ne!(timeline_preview, object_detection);
    assert_ne!(scene_recognition, text_recognition);
    assert_ne!(subtitle_analysis, key_frame);
    assert_ne!(key_frame, user_screenshot);
  }

  #[test]
  fn test_extraction_purpose_serialization() {
    let purpose = ExtractionPurpose::TimelinePreview;

    // Проверяем сериализацию
    let json = serde_json::to_string(&purpose).unwrap();
    assert!(json.contains("TimelinePreview"));

    // Проверяем десериализацию
    let deserialized: ExtractionPurpose = serde_json::from_str(&json).unwrap();
    assert_eq!(purpose, deserialized);
  }

  #[test]
  fn test_extraction_strategy_interval() {
    let interval_strategy = ExtractionStrategy::Interval { seconds: 5.0 };

    match interval_strategy {
      ExtractionStrategy::Interval { seconds } => {
        assert_eq!(seconds, 5.0);
      }
      _ => panic!("Expected Interval strategy"),
    }

    // Проверяем сериализацию
    let json = serde_json::to_string(&interval_strategy).unwrap();
    assert!(json.contains("Interval"));
    assert!(json.contains("5"));
  }

  #[test]
  fn test_extraction_strategy_scene_change() {
    let scene_change_strategy = ExtractionStrategy::SceneChange { threshold: 0.3 };

    match scene_change_strategy {
      ExtractionStrategy::SceneChange { threshold } => {
        assert_eq!(threshold, 0.3);
      }
      _ => panic!("Expected SceneChange strategy"),
    }

    // Проверяем сериализацию
    let json = serde_json::to_string(&scene_change_strategy).unwrap();
    assert!(json.contains("SceneChange"));
    assert!(json.contains("0.3"));
  }

  #[test]
  fn test_extraction_strategy_keyframes() {
    let keyframes_strategy = ExtractionStrategy::KeyFrames;

    // Проверяем сериализацию
    let json = serde_json::to_string(&keyframes_strategy).unwrap();
    assert!(json.contains("KeyFrames"));
  }

  #[test]
  fn test_extraction_strategy_combined() {
    let combined_strategy = ExtractionStrategy::Combined {
      min_interval: 2.0,
      include_scene_changes: true,
      include_keyframes: false,
    };

    match combined_strategy {
      ExtractionStrategy::Combined {
        min_interval,
        include_scene_changes,
        include_keyframes,
      } => {
        assert_eq!(min_interval, 2.0);
        assert!(include_scene_changes);
        assert!(!include_keyframes);
      }
      _ => panic!("Expected Combined strategy"),
    }
  }

  #[test]
  fn test_extraction_settings_creation() {
    let settings = ExtractionSettings {
      strategy: ExtractionStrategy::Interval { seconds: 5.0 },
      _purpose: ExtractionPurpose::TimelinePreview,
      resolution: (1280, 720),
      quality: 85,
      _format: PreviewFormat::Jpeg,
      max_frames: Some(100),
      _gpu_decode: true,
      parallel_extraction: true,
      _thread_count: Some(4),
    };

    // Проверяем что настройки созданы правильно
    assert_eq!(settings.resolution, (1280, 720));
    assert_eq!(settings.quality, 85);
    assert_eq!(settings.max_frames, Some(100));
    assert!(settings.parallel_extraction);
  }

  #[test]
  fn test_extraction_settings_default() {
    let settings = ExtractionSettings::default();

    // Проверяем параметры по умолчанию
    match settings.strategy {
      ExtractionStrategy::Interval { seconds } => assert_eq!(seconds, 1.0),
      _ => panic!("Expected Interval strategy as default"),
    }

    assert_eq!(settings.resolution, (640, 360));
    assert_eq!(settings.quality, 75);
    assert!(settings.max_frames.is_none());
  }

  #[test]
  fn test_extraction_strategy_subtitle_sync() {
    let subtitle_strategy = ExtractionStrategy::SubtitleSync {
      offset_seconds: 0.5,
    };

    match subtitle_strategy {
      ExtractionStrategy::SubtitleSync { offset_seconds } => {
        assert_eq!(offset_seconds, 0.5);
      }
      _ => panic!("Expected SubtitleSync strategy"),
    }

    // Проверяем сериализацию
    let json = serde_json::to_string(&subtitle_strategy).unwrap();
    assert!(json.contains("SubtitleSync"));
    assert!(json.contains("0.5"));
  }

  #[test]
  fn test_extraction_purpose_hash() {
    use std::collections::HashMap;

    let mut purpose_map = HashMap::new();
    purpose_map.insert(ExtractionPurpose::TimelinePreview, "timeline");
    purpose_map.insert(ExtractionPurpose::ObjectDetection, "objects");
    purpose_map.insert(ExtractionPurpose::SceneRecognition, "scenes");

    assert_eq!(purpose_map.len(), 3);
    assert_eq!(
      purpose_map.get(&ExtractionPurpose::TimelinePreview),
      Some(&"timeline")
    );
    assert_eq!(
      purpose_map.get(&ExtractionPurpose::ObjectDetection),
      Some(&"objects")
    );
    assert_eq!(
      purpose_map.get(&ExtractionPurpose::SceneRecognition),
      Some(&"scenes")
    );
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

    assert_eq!(purposes.len(), 7);

    // Проверяем что все цели могут быть сериализованы
    for purpose in purposes {
      let json = serde_json::to_string(&purpose).unwrap();
      assert!(!json.is_empty());

      let deserialized: ExtractionPurpose = serde_json::from_str(&json).unwrap();
      assert_eq!(purpose, deserialized);
    }
  }

  #[test]
  fn test_preview_format_serialization() {
    let format_jpeg = PreviewFormat::Jpeg;
    let format_png = PreviewFormat::Png;

    // Проверяем сериализацию форматов
    let jpeg_json = serde_json::to_string(&format_jpeg).unwrap();
    let png_json = serde_json::to_string(&format_png).unwrap();

    assert!(jpeg_json.contains("Jpeg"));
    assert!(png_json.contains("Png"));
    assert_ne!(jpeg_json, png_json);

    // Проверяем десериализацию
    let jpeg_deserialized: PreviewFormat = serde_json::from_str(&jpeg_json).unwrap();
    let png_deserialized: PreviewFormat = serde_json::from_str(&png_json).unwrap();

    // Проверяем что десериализация прошла успешно (не паникуем)
    let _jpeg_test = jpeg_deserialized;
    let _png_test = png_deserialized;
  }

  #[test]
  fn test_extraction_settings_modification() {
    let settings = ExtractionSettings {
      strategy: ExtractionStrategy::KeyFrames,
      resolution: (1920, 1080),
      quality: 95,
      max_frames: Some(200),
      ..Default::default()
    };

    // Проверяем изменения
    match settings.strategy {
      ExtractionStrategy::KeyFrames => {}
      _ => panic!("Expected KeyFrames strategy"),
    }

    assert_eq!(settings.resolution, (1920, 1080));
    assert_eq!(settings.quality, 95);
    assert_eq!(settings.max_frames, Some(200));
  }
}
