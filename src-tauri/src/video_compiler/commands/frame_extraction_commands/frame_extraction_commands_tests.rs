//! Тесты для Frame Extraction Commands

#[cfg(test)]
mod tests {
  use super::super::*;
  use crate::video_compiler::schema::common::AspectRatio;
  use crate::video_compiler::schema::export::ProjectSettings;
  use crate::video_compiler::schema::project::ProjectSchema;
  use crate::video_compiler::schema::timeline::Timeline;
  use crate::video_compiler::schema::Subtitle;

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0".to_string(),
      metadata: crate::video_compiler::schema::project::ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test description".to_string()),
        author: Some("Test Author".to_string()),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
      },
      timeline: Timeline {
        duration: 10.0,
        fps: 30,
        resolution: (1920, 1080),
        sample_rate: 48000,
        aspect_ratio: AspectRatio::Ratio16x9,
      },
      tracks: vec![],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: ProjectSettings::default(),
    }
  }

  #[test]
  fn test_timeline_frame_creation() {
    let frame = TimelineFrame {
      timestamp: 5.5,
      frame_data: vec![255, 0, 0, 255, 0, 255, 0, 255], // 2 пикселя RGBA
      width: 2,
      height: 1,
    };

    assert_eq!(frame.timestamp, 5.5);
    assert_eq!(frame.frame_data.len(), 8);
    assert_eq!(frame.width, 2);
    assert_eq!(frame.height, 1);
  }

  #[test]
  fn test_timeline_frame_serialization() {
    let frame = TimelineFrame {
      timestamp: 10.25,
      frame_data: vec![128; 100], // 100 байт данных
      width: 10,
      height: 10,
    };

    let json = serde_json::to_string(&frame).unwrap();
    let deserialized: TimelineFrame = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.timestamp, frame.timestamp);
    assert_eq!(deserialized.frame_data, frame.frame_data);
    assert_eq!(deserialized.width, frame.width);
    assert_eq!(deserialized.height, frame.height);
  }

  #[test]
  fn test_subtitle_frame_result_creation() {
    let result = SubtitleFrameResult {
      subtitle_id: "sub-123".to_string(),
      timestamp: 15.75,
      frame_path: "/tmp/subtitle_frame_15.75.png".to_string(),
      width: 1280,
      height: 720,
    };

    assert_eq!(result.subtitle_id, "sub-123");
    assert_eq!(result.timestamp, 15.75);
    assert_eq!(result.frame_path, "/tmp/subtitle_frame_15.75.png");
    assert_eq!(result.width, 1280);
    assert_eq!(result.height, 720);
  }

  #[test]
  fn test_subtitle_frame_result_serialization() {
    let result = SubtitleFrameResult {
      subtitle_id: "subtitle-001".to_string(),
      timestamp: 30.0,
      frame_path: "/path/to/frame.jpg".to_string(),
      width: 1920,
      height: 1080,
    };

    let json = serde_json::to_string(&result).unwrap();
    let deserialized: SubtitleFrameResult = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.subtitle_id, result.subtitle_id);
    assert_eq!(deserialized.timestamp, result.timestamp);
    assert_eq!(deserialized.frame_path, result.frame_path);
    assert_eq!(deserialized.width, result.width);
    assert_eq!(deserialized.height, result.height);
  }

  #[test]
  fn test_preview_request_creation() {
    let request = PreviewRequest {
      video_path: "/path/to/video.mp4".to_string(),
      timestamp: 25.5,
      resolution: Some((1920, 1080)),
      quality: Some(85),
    };

    assert_eq!(request.video_path, "/path/to/video.mp4");
    assert_eq!(request.timestamp, 25.5);
    assert_eq!(request.resolution, Some((1920, 1080)));
    assert_eq!(request.quality, Some(85));
  }

  #[test]
  fn test_preview_request_optional_fields() {
    let request = PreviewRequest {
      video_path: "/path/to/video.mp4".to_string(),
      timestamp: 12.0,
      resolution: None,
      quality: None,
    };

    assert_eq!(request.video_path, "/path/to/video.mp4");
    assert_eq!(request.timestamp, 12.0);
    assert!(request.resolution.is_none());
    assert!(request.quality.is_none());
  }

  #[test]
  fn test_preview_request_serialization() {
    let request = PreviewRequest {
      video_path: "/media/test.mov".to_string(),
      timestamp: 7.25,
      resolution: Some((640, 480)),
      quality: Some(70),
    };

    let json = serde_json::to_string(&request).unwrap();
    let deserialized: PreviewRequest = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.video_path, request.video_path);
    assert_eq!(deserialized.timestamp, request.timestamp);
    assert_eq!(deserialized.resolution, request.resolution);
    assert_eq!(deserialized.quality, request.quality);
  }

  #[test]
  fn test_frame_path_generation() {
    let output_dir = "/tmp/frames";
    let timestamp = 5.75;
    let expected_path = format!("{output_dir}/frame_{timestamp:.2}.png");

    assert_eq!(expected_path, "/tmp/frames/frame_5.75.png");
  }

  #[test]
  fn test_frame_filename_formatting() {
    let test_cases = vec![
      (0.0, "frame_0.00.png"),
      (1.5, "frame_1.50.png"),
      (10.25, "frame_10.25.png"),
      (123.456, "frame_123.46.png"), // Округление до 2 знаков
    ];

    for (timestamp, expected) in test_cases {
      let filename = format!("frame_{timestamp:.2}.png");
      assert_eq!(filename, expected);
    }
  }

  #[test]
  fn test_timeline_frame_data_size_calculation() {
    // RGBA формат: 4 байта на пиксель
    let width = 100;
    let height = 50;
    let expected_size = width * height * 4; // RGBA

    let frame = TimelineFrame {
      timestamp: 0.0,
      frame_data: vec![0; expected_size as usize],
      width,
      height,
    };

    assert_eq!(frame.frame_data.len(), expected_size as usize);
    assert_eq!(
      frame.frame_data.len(),
      (frame.width * frame.height * 4) as usize
    );
  }

  #[test]
  fn test_subtitle_frame_path_validation() {
    let valid_paths = vec![
      "/tmp/subtitle_1.png",
      "/home/user/frames/subtitle_10.jpg",
      "C:\\temp\\subtitle_5.bmp",
      "./relative/path/frame.png",
    ];

    for path in valid_paths {
      let result = SubtitleFrameResult {
        subtitle_id: "test".to_string(),
        timestamp: 0.0,
        frame_path: path.to_string(),
        width: 100,
        height: 100,
      };

      assert!(!result.frame_path.is_empty());
      assert!(result.frame_path.contains('.'));
    }
  }

  #[test]
  fn test_preview_request_timestamp_bounds() {
    // Тест различных значений timestamp
    let test_cases = vec![
      0.0,    // Начало видео
      1.5,    // Дробное значение
      60.0,   // 1 минута
      3600.0, // 1 час
      7200.5, // 2 часа с дробью
    ];

    for timestamp in test_cases {
      let request = PreviewRequest {
        video_path: "/test.mp4".to_string(),
        timestamp,
        resolution: None,
        quality: None,
      };

      assert!(request.timestamp >= 0.0);
    }
  }

  #[test]
  fn test_preview_request_resolution_validation() {
    let valid_resolutions = vec![
      (320, 240),   // QVGA
      (640, 480),   // VGA
      (1280, 720),  // HD
      (1920, 1080), // Full HD
      (3840, 2160), // 4K
    ];

    for (width, height) in valid_resolutions {
      let request = PreviewRequest {
        video_path: "/test.mp4".to_string(),
        timestamp: 0.0,
        resolution: Some((width, height)),
        quality: Some(80),
      };

      if let Some((w, h)) = request.resolution {
        assert!(w > 0);
        assert!(h > 0);
        assert!(w <= 7680); // 8K max width
        assert!(h <= 4320); // 8K max height
      }
    }
  }

  #[test]
  fn test_preview_request_quality_validation() {
    let valid_qualities = vec![1, 25, 50, 75, 85, 95, 100];

    for quality in valid_qualities {
      let request = PreviewRequest {
        video_path: "/test.mp4".to_string(),
        timestamp: 0.0,
        resolution: Some((1920, 1080)),
        quality: Some(quality),
      };

      if let Some(q) = request.quality {
        assert!((1..=100).contains(&q));
      }
    }
  }

  #[test]
  fn test_frame_data_endianness() {
    // Тест для проверки правильности порядка байтов в frame_data
    let red_pixel_rgba = vec![255, 0, 0, 255]; // Красный пиксель
    let green_pixel_rgba = vec![0, 255, 0, 255]; // Зеленый пиксель
    let blue_pixel_rgba = vec![0, 0, 255, 255]; // Синий пиксель

    let mut frame_data = Vec::new();
    frame_data.extend(&red_pixel_rgba);
    frame_data.extend(&green_pixel_rgba);
    frame_data.extend(&blue_pixel_rgba);

    let frame = TimelineFrame {
      timestamp: 0.0,
      frame_data,
      width: 3,
      height: 1,
    };

    // Проверяем, что первый пиксель красный
    assert_eq!(frame.frame_data[0], 255); // R
    assert_eq!(frame.frame_data[1], 0); // G
    assert_eq!(frame.frame_data[2], 0); // B
    assert_eq!(frame.frame_data[3], 255); // A

    // Проверяем, что второй пиксель зеленый
    assert_eq!(frame.frame_data[4], 0); // R
    assert_eq!(frame.frame_data[5], 255); // G
    assert_eq!(frame.frame_data[6], 0); // B
    assert_eq!(frame.frame_data[7], 255); // A
  }

  #[test]
  fn test_extract_timeline_interval_calculation() {
    let project = create_test_project();
    let duration = project.timeline.duration; // 10.0 секунд
    let interval = 2.0; // Кадр каждые 2 секунды

    let mut timestamps = Vec::new();
    let mut timestamp = 0.0;

    while timestamp <= duration {
      timestamps.push(timestamp);
      timestamp += interval;
    }

    // Должно быть кадры на 0, 2, 4, 6, 8, 10 секундах
    let expected = vec![0.0, 2.0, 4.0, 6.0, 8.0, 10.0];
    assert_eq!(timestamps, expected);
  }

  #[test]
  fn test_subtitle_frame_result_path_validation() {
    let result = SubtitleFrameResult {
      subtitle_id: "test-subtitle".to_string(),
      timestamp: 5.0,
      frame_path: "/tmp/test_frame.png".to_string(),
      width: 1920,
      height: 1080,
    };

    // Test that all required fields are present
    assert!(!result.subtitle_id.is_empty());
    assert!(result.timestamp >= 0.0);
    assert!(!result.frame_path.is_empty());
    assert!(result.width > 0);
    assert!(result.height > 0);

    // Test path format
    assert!(result.frame_path.contains('.'));
    assert!(result.frame_path.starts_with('/'));
  }

  #[test]
  fn test_preview_request_validation() {
    let request = PreviewRequest {
      video_path: "/path/to/video.mp4".to_string(),
      timestamp: 10.5,
      resolution: Some((1920, 1080)),
      quality: Some(85),
    };

    // Validate required fields
    assert!(!request.video_path.is_empty());
    assert!(request.timestamp >= 0.0);

    // Validate optional fields
    if let Some((width, height)) = request.resolution {
      assert!(width > 0 && height > 0);
    }

    if let Some(quality) = request.quality {
      assert!((1..=100).contains(&quality));
    }
  }

  #[test]
  fn test_frame_intervals_calculation() {
    // Тестируем расчёт интервалов для извлечения кадров
    let duration = 60.0; // 60 секунд
    let interval = 10.0; // каждые 10 секунд

    let mut timestamps = Vec::new();
    let mut timestamp = 0.0;

    while timestamp <= duration {
      timestamps.push(timestamp);
      timestamp += interval;
    }

    assert_eq!(timestamps.len(), 7); // 0, 10, 20, 30, 40, 50, 60
    assert_eq!(timestamps[0], 0.0);
    assert_eq!(timestamps[6], 60.0);
  }

  #[test]
  fn test_thumbnail_count_calculation() {
    // Тестируем расчёт количества миниатюр
    let video_duration = 120.0; // 2 минуты
    let thumbnail_count = 6;

    let interval = video_duration / (thumbnail_count as f64 + 1.0);
    let mut timestamps = Vec::new();

    for i in 1..=thumbnail_count {
      timestamps.push(interval * i as f64);
    }

    assert_eq!(timestamps.len(), thumbnail_count);
    assert!(timestamps[0] > 0.0); // Не с самого начала
    assert!(timestamps.last().unwrap() < &video_duration); // Не в самом конце
  }

  #[test]
  fn test_output_path_generation() {
    let output_dir = "/tmp/frames";
    let timestamps = [0.0, 5.5, 10.0, 15.25];

    let frame_paths: Vec<String> = timestamps
      .iter()
      .map(|ts| format!("{}/frame_{:.2}.png", output_dir, ts))
      .collect();

    assert_eq!(frame_paths.len(), 4);
    assert_eq!(frame_paths[0], "/tmp/frames/frame_0.00.png");
    assert_eq!(frame_paths[1], "/tmp/frames/frame_5.50.png");
    assert_eq!(frame_paths[2], "/tmp/frames/frame_10.00.png");
    assert_eq!(frame_paths[3], "/tmp/frames/frame_15.25.png");
  }

  #[test]
  fn test_subtitle_frame_path_generation() {
    let mut subtitle1 = Subtitle::new("First subtitle".to_string(), 1.0, 3.0);
    subtitle1.id = "sub_001".to_string();
    let mut subtitle2 = Subtitle::new("Second subtitle".to_string(), 5.0, 7.0);
    subtitle2.id = "sub_002".to_string();

    let subtitles = vec![subtitle1, subtitle2];

    let output_dir = "/tmp/subtitles";
    let frame_paths: Vec<String> = subtitles
      .iter()
      .map(|sub| generate_subtitle_frame_path(output_dir, &sub.id))
      .collect();

    assert_eq!(frame_paths.len(), 2);
    assert_eq!(frame_paths[0], "/tmp/subtitles/subtitle_sub_001.png");
    assert_eq!(frame_paths[1], "/tmp/subtitles/subtitle_sub_002.png");
  }

  #[test]
  fn test_preview_options_defaults() {
    let request = PreviewRequest {
      video_path: "/test.mp4".to_string(),
      timestamp: 10.0,
      resolution: None,
      quality: None,
    };

    // Симулируем логику применения дефолтов
    let width = request.resolution.map(|(w, _)| w).unwrap_or(1920);
    let height = request.resolution.map(|(_, h)| h).unwrap_or(1080);
    let quality = request.quality.unwrap_or(80);

    assert_eq!(width, 1920);
    assert_eq!(height, 1080);
    assert_eq!(quality, 80);
  }

  #[test]
  fn test_cache_info_structure() {
    let project_id = "project_123";
    let cache_info = generate_cache_info(project_id, 42, 1048576);

    assert_eq!(cache_info["project_id"], project_id);
    assert_eq!(cache_info["frame_count"], 42);
    assert_eq!(cache_info["total_size"], 1048576);
    assert!(cache_info["last_accessed"].is_string());
  }

  #[test]
  fn test_calculate_frame_timestamps() {
    let duration = 10.0;
    let interval = 2.5;
    let timestamps = calculate_frame_timestamps(duration, interval);

    assert_eq!(timestamps, vec![0.0, 2.5, 5.0, 7.5, 10.0]);
  }

  #[test]
  fn test_generate_frame_paths() {
    let output_dir = "/tmp/frames";
    let timestamps = vec![0.0, 1.5, 3.0];
    let paths = generate_frame_paths(output_dir, &timestamps);

    assert_eq!(paths.len(), 3);
    assert_eq!(paths[0], "/tmp/frames/frame_0.00.png");
    assert_eq!(paths[1], "/tmp/frames/frame_1.50.png");
    assert_eq!(paths[2], "/tmp/frames/frame_3.00.png");
  }

  #[test]
  fn test_generate_subtitle_frame_path() {
    let output_dir = "/tmp/subtitles";
    let subtitle_id = "sub_001";
    let path = generate_subtitle_frame_path(output_dir, subtitle_id);

    assert_eq!(path, "/tmp/subtitles/subtitle_sub_001.png");
  }

  #[test]
  fn test_extract_preview_options() {
    let settings = serde_json::json!({
      "width": 1280,
      "height": 720,
      "quality": 85,
      "format": "jpg"
    });

    let options = extract_preview_options(&settings);

    assert_eq!(options.width, Some(1280));
    assert_eq!(options.height, Some(720));
    assert_eq!(options.quality, 85);
    assert_eq!(options.format, "jpg");
  }

  #[test]
  fn test_extract_preview_options_defaults() {
    let settings = serde_json::json!({});

    let options = extract_preview_options(&settings);

    assert_eq!(options.width, Some(1920));
    assert_eq!(options.height, Some(1080));
    assert_eq!(options.quality, 80);
    assert_eq!(options.format, "png");
  }

  #[test]
  fn test_calculate_thumbnail_timestamps() {
    let duration = 60.0;
    let count = 5;
    let result = calculate_thumbnail_timestamps(duration, count);

    assert!(result.is_ok());
    let timestamps = result.unwrap();

    assert_eq!(timestamps.len(), 5);
    assert_eq!(timestamps[0], 10.0);
    assert_eq!(timestamps[1], 20.0);
    assert_eq!(timestamps[2], 30.0);
    assert_eq!(timestamps[3], 40.0);
    assert_eq!(timestamps[4], 50.0);
  }

  #[test]
  fn test_calculate_thumbnail_timestamps_zero_duration() {
    let duration = 0.0;
    let count = 5;
    let result = calculate_thumbnail_timestamps(duration, count);

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("video duration is 0"));
  }

  #[test]
  fn test_extract_video_duration() {
    let video_info = serde_json::json!({
      "format": {
        "duration": "120.5"
      }
    });

    let duration = extract_video_duration(&video_info);
    assert_eq!(duration, 120.5);
  }

  #[test]
  fn test_extract_video_duration_missing() {
    let video_info = serde_json::json!({});

    let duration = extract_video_duration(&video_info);
    assert_eq!(duration, 0.0);
  }

  #[test]
  fn test_ffmpeg_command_args() {
    // Тестируем аргументы для FFmpeg команды извлечения кадра
    let video_path = "/path/to/video.mp4";
    let timestamp = 5.5;
    let output_path = "/tmp/frame.png";

    let timestamp_str = timestamp.to_string();
    let args = [
      "-ss",
      &timestamp_str,
      "-i",
      video_path,
      "-frames:v",
      "1",
      "-y",
      output_path,
    ];

    assert_eq!(args.len(), 8);
    assert_eq!(args[0], "-ss");
    assert_eq!(args[1], "5.5");
    assert_eq!(args[2], "-i");
    assert_eq!(args[3], video_path);
  }

  #[test]
  fn test_batch_frame_extraction_indices() {
    let timestamps = [1.0, 2.5, 5.0, 7.5, 10.0];
    let output_dir = "/tmp";

    let paths: Vec<String> = timestamps
      .iter()
      .enumerate()
      .map(|(index, _ts)| format!("{}/frame_{:04}.png", output_dir, index))
      .collect();

    assert_eq!(paths.len(), 5);
    assert_eq!(paths[0], "/tmp/frame_0000.png");
    assert_eq!(paths[4], "/tmp/frame_0004.png");
  }
}
