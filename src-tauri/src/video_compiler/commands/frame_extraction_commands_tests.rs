//! Tests for frame extraction commands
//!
//! Comprehensive test suite for all frame extraction functionality

#[cfg(test)]
mod tests {
    use super::*;
    use crate::video_compiler::schema::{
        Subtitle, SubtitleAnimation, SubtitlePosition, SubtitleStyle
    };

    #[test]
    fn test_timeline_frame_structure() {
        let frame = TimelineFrame {
            timestamp: 5.5,
            frame_data: vec![255, 0, 0, 255], // Single red pixel RGBA
            width: 1,
            height: 1,
        };

        assert_eq!(frame.timestamp, 5.5);
        assert_eq!(frame.frame_data.len(), 4);
        assert_eq!(frame.width, 1);
        assert_eq!(frame.height, 1);
    }

    #[test]
    fn test_subtitle_frame_result() {
        let result = SubtitleFrameResult {
            subtitle_id: "sub_123".to_string(),
            timestamp: 10.5,
            frame_path: "/tmp/subtitle_frame.png".to_string(),
            width: 1920,
            height: 1080,
        };

        assert_eq!(result.subtitle_id, "sub_123");
        assert_eq!(result.timestamp, 10.5);
        assert!(result.frame_path.ends_with(".png"));
    }

    #[test]
    fn test_preview_request_validation() {
        let request = PreviewRequest {
            video_path: "/path/to/video.mp4".to_string(),
            timestamp: 30.0,
            resolution: Some((1280, 720)),
            quality: Some(90),
        };

        assert!(!request.video_path.is_empty());
        assert!(request.timestamp >= 0.0);
        
        if let Some((w, h)) = request.resolution {
            assert!(w > 0 && h > 0);
        }
        
        if let Some(q) = request.quality {
            assert!((1..=100).contains(&q));
        }
    }

    #[test]
    fn test_frame_extraction_intervals() {
        let duration = 100.0;
        let interval = 10.0;
        let mut timestamps = Vec::new();
        let mut current = 0.0;

        while current <= duration {
            timestamps.push(current);
            current += interval;
        }

        assert_eq!(timestamps.len(), 11); // 0, 10, 20, ..., 100
        assert_eq!(*timestamps.first().unwrap(), 0.0);
        assert_eq!(*timestamps.last().unwrap(), 100.0);
    }

    #[test]
    fn test_thumbnail_distribution() {
        let video_duration = 60.0;
        let thumbnail_count = 5;
        let interval = video_duration / (thumbnail_count as f64 + 1.0);
        
        let timestamps: Vec<f64> = (1..=thumbnail_count)
            .map(|i| interval * i as f64)
            .collect();

        assert_eq!(timestamps.len(), thumbnail_count);
        // Check that thumbnails are evenly distributed
        for i in 1..timestamps.len() {
            let diff = timestamps[i] - timestamps[i-1];
            assert!((diff - interval).abs() < 0.001);
        }
    }

    #[test]
    fn test_output_path_formatting() {
        let base_dir = "/output";
        let timestamps = vec![0.0, 1.5, 10.333, 59.999];
        
        let paths: Vec<String> = timestamps.iter()
            .map(|ts| format!("{}/frame_{:.2}.png", base_dir, ts))
            .collect();

        assert_eq!(paths[0], "/output/frame_0.00.png");
        assert_eq!(paths[1], "/output/frame_1.50.png");
        assert_eq!(paths[2], "/output/frame_10.33.png");
        assert_eq!(paths[3], "/output/frame_60.00.png");
    }

    #[test]
    fn test_batch_frame_paths() {
        let timestamps = vec![5.0, 10.0, 15.0];
        let output_dir = "/frames";
        
        let paths: Vec<String> = timestamps.iter()
            .enumerate()
            .map(|(idx, _)| format!("{}/frame_{:04}.png", output_dir, idx))
            .collect();

        assert_eq!(paths.len(), 3);
        assert_eq!(paths[0], "/frames/frame_0000.png");
        assert_eq!(paths[1], "/frames/frame_0001.png");
        assert_eq!(paths[2], "/frames/frame_0002.png");
    }

    #[test]
    fn test_ffmpeg_command_construction() {
        let video_path = "/video.mp4";
        let timestamp = 15.5;
        let output_path = "/output.png";
        
        // Simulate FFmpeg command args
        let timestamp_str = timestamp.to_string();
        let args = vec![
            "-ss", &timestamp_str,
            "-i", video_path,
            "-frames:v", "1",
            "-y", output_path
        ];

        assert_eq!(args.len(), 8);
        assert_eq!(args[1], "15.5");
        assert!(args.contains(&"-frames:v"));
    }

    #[test]
    fn test_cache_info_json() {
        let project_id = "proj_123";
        let frame_count = 42;
        let total_size = 1048576; // 1MB
        
        let cache_info = serde_json::json!({
            "project_id": project_id,
            "frame_count": frame_count,
            "total_size": total_size,
            "last_accessed": chrono::Utc::now().to_rfc3339(),
        });

        assert_eq!(cache_info["project_id"], project_id);
        assert_eq!(cache_info["frame_count"], frame_count);
        assert_eq!(cache_info["total_size"], total_size);
    }

    #[test]
    fn test_preview_options_extraction() {
        let settings = serde_json::json!({
            "width": 1280,
            "height": 720,
            "quality": 85,
            "format": "jpeg"
        });

        let width = settings["width"].as_u64().unwrap_or(1920) as u32;
        let height = settings["height"].as_u64().unwrap_or(1080) as u32;
        let quality = settings["quality"].as_u64().unwrap_or(80) as u8;
        let format = settings["format"].as_str().unwrap_or("png");

        assert_eq!(width, 1280);
        assert_eq!(height, 720);
        assert_eq!(quality, 85);
        assert_eq!(format, "jpeg");
    }

    #[test]
    fn test_video_duration_validation() {
        let test_cases = vec![
            (0.0, false),    // Zero duration invalid
            (-1.0, false),   // Negative invalid
            (0.1, true),     // Small positive valid
            (3600.0, true),  // 1 hour valid
            (86400.0, true), // 24 hours valid
        ];

        for (duration, expected_valid) in test_cases {
            let is_valid = duration > 0.0;
            assert_eq!(is_valid, expected_valid, "Duration {} validation failed", duration);
        }
    }

    #[test]
    fn test_subtitle_timing_validation() {
        let subtitles = vec![
            Subtitle::new("First".to_string(), 1.0, 3.0),
            Subtitle::new("Second".to_string(), 5.0, 7.0),
        ];

        for subtitle in &subtitles {
            assert!(subtitle.start_time < subtitle.end_time);
            assert!(subtitle.start_time >= 0.0);
            assert!(!subtitle.text.is_empty());
        }
    }

    #[test]
    fn test_resolution_validation() {
        let valid_resolutions = vec![
            (640, 480),   // SD
            (1280, 720),  // HD
            (1920, 1080), // Full HD
            (3840, 2160), // 4K
        ];

        for (width, height) in valid_resolutions {
            assert!(width > 0 && height > 0);
            assert!(width % 2 == 0 && height % 2 == 0); // Even dimensions for video
        }
    }

    #[test]
    fn test_quality_bounds() {
        let quality_values = vec![0, 1, 50, 80, 100, 101];
        
        for quality in quality_values {
            let is_valid = quality >= 1 && quality <= 100;
            if quality == 0 || quality == 101 {
                assert!(!is_valid);
            } else {
                assert!(is_valid);
            }
        }
    }

    #[test]
    fn test_path_sanitization() {
        let test_paths = vec![
            ("/tmp/file.png", true),
            ("../../../etc/passwd", false),
            ("C:\\Windows\\System32", false),
            ("./relative/path.jpg", true),
            ("/home/user/videos/output.mp4", true),
        ];

        for (path, expected_safe) in test_paths {
            let is_safe = !path.contains("..") && !path.contains("System32");
            assert_eq!(is_safe, expected_safe, "Path {} safety check failed", path);
        }
    }

    // ============ Дополнительные тесты для покрытия новых функций ============

    #[test]
    fn test_calculate_frame_timestamps() {
        use super::super::calculate_frame_timestamps;
        
        // Тест базовой функциональности
        let timestamps = calculate_frame_timestamps(10.0, 2.0);
        assert_eq!(timestamps, vec![0.0, 2.0, 4.0, 6.0, 8.0, 10.0]);
        
        // Тест с дробными значениями
        let timestamps = calculate_frame_timestamps(5.5, 1.5);
        assert_eq!(timestamps, vec![0.0, 1.5, 3.0, 4.5]);
        
        // Тест с очень маленьким интервалом
        let timestamps = calculate_frame_timestamps(1.0, 0.5);
        assert_eq!(timestamps, vec![0.0, 0.5, 1.0]);
        
        // Тест когда интервал больше длительности
        let timestamps = calculate_frame_timestamps(5.0, 10.0);
        assert_eq!(timestamps, vec![0.0]);
    }

    #[test]
    fn test_generate_frame_paths() {
        use super::super::generate_frame_paths;
        
        let timestamps = vec![0.0, 1.5, 3.33];
        let paths = generate_frame_paths("/output", &timestamps);
        
        assert_eq!(paths.len(), 3);
        assert_eq!(paths[0], "/output/frame_0.00.png");
        assert_eq!(paths[1], "/output/frame_1.50.png");
        assert_eq!(paths[2], "/output/frame_3.33.png");
        
        // Тест с пустым массивом
        let empty_paths = generate_frame_paths("/output", &[]);
        assert!(empty_paths.is_empty());
    }

    #[test]
    fn test_generate_subtitle_frame_path() {
        use super::super::generate_subtitle_frame_path;
        
        let path = generate_subtitle_frame_path("/subs", "subtitle_001");
        assert_eq!(path, "/subs/subtitle_subtitle_001.png");
        
        // Тест с особыми символами в ID
        let path = generate_subtitle_frame_path("/subs", "sub-2023_v1");
        assert_eq!(path, "/subs/subtitle_sub-2023_v1.png");
    }

    #[test]
    fn test_extract_preview_options() {
        use super::super::extract_preview_options;
        
        // Тест с полными настройками
        let settings = serde_json::json!({
            "width": 1280,
            "height": 720,
            "quality": 90,
            "format": "jpeg"
        });
        
        let options = extract_preview_options(&settings);
        assert_eq!(options.width, Some(1280));
        assert_eq!(options.height, Some(720));
        assert_eq!(options.quality, 90);
        assert_eq!(options.format, "jpeg");
        
        // Тест с частичными настройками (значения по умолчанию)
        let partial_settings = serde_json::json!({
            "quality": 50
        });
        
        let options = extract_preview_options(&partial_settings);
        assert_eq!(options.width, Some(1920)); // default
        assert_eq!(options.height, Some(1080)); // default
        assert_eq!(options.quality, 50);
        assert_eq!(options.format, "png"); // default
        
        // Тест с пустыми настройками
        let empty_settings = serde_json::json!({});
        let options = extract_preview_options(&empty_settings);
        assert_eq!(options.width, Some(1920));
        assert_eq!(options.height, Some(1080));
        assert_eq!(options.quality, 80);
        assert_eq!(options.format, "png");
    }

    #[test]
    fn test_generate_cache_info() {
        use super::super::generate_cache_info;
        
        let cache_info = generate_cache_info("test_project", 42, 1048576);
        
        assert_eq!(cache_info["project_id"], "test_project");
        assert_eq!(cache_info["frame_count"], 42);
        assert_eq!(cache_info["total_size"], 1048576);
        assert!(cache_info["last_accessed"].is_string());
        
        // Проверяем, что timestamp не пустой
        let timestamp = cache_info["last_accessed"].as_str().unwrap();
        assert!(!timestamp.is_empty());
        assert!(timestamp.contains("T")); // ISO format should contain T
    }

    #[test]
    fn test_calculate_thumbnail_timestamps() {
        use super::super::calculate_thumbnail_timestamps;
        
        // Тест нормального случая
        let result = calculate_thumbnail_timestamps(60.0, 5);
        assert!(result.is_ok());
        let timestamps = result.unwrap();
        assert_eq!(timestamps.len(), 5);
        
        // Проверяем, что временные метки распределены равномерно
        let expected_interval = 60.0 / 6.0; // 60 / (5 + 1)
        for (i, &timestamp) in timestamps.iter().enumerate() {
            let expected = expected_interval * (i + 1) as f64;
            assert!((timestamp - expected).abs() < 0.001);
        }
        
        // Тест с нулевой длительностью
        let result = calculate_thumbnail_timestamps(0.0, 5);
        assert!(result.is_err());
        
        // Тест с отрицательной длительностью
        let result = calculate_thumbnail_timestamps(-10.0, 5);
        assert!(result.is_err());
        
        // Тест с одним кадром
        let result = calculate_thumbnail_timestamps(10.0, 1);
        assert!(result.is_ok());
        let timestamps = result.unwrap();
        assert_eq!(timestamps.len(), 1);
        assert_eq!(timestamps[0], 5.0); // 10.0 / 2
    }

    #[test]
    fn test_extract_video_duration() {
        use super::super::extract_video_duration;
        
        // Тест с корректной информацией о видео
        let video_info = serde_json::json!({
            "format": {
                "duration": "123.456"
            }
        });
        let duration = extract_video_duration(&video_info);
        assert_eq!(duration, 123.456);
        
        // Тест с отсутствующим полем duration
        let video_info = serde_json::json!({
            "format": {}
        });
        let duration = extract_video_duration(&video_info);
        assert_eq!(duration, 0.0);
        
        // Тест с отсутствующим полем format
        let video_info = serde_json::json!({});
        let duration = extract_video_duration(&video_info);
        assert_eq!(duration, 0.0);
        
        // Тест с некорректным значением duration
        let video_info = serde_json::json!({
            "format": {
                "duration": "invalid"
            }
        });
        let duration = extract_video_duration(&video_info);
        assert_eq!(duration, 0.0);
        
        // Тест с числовым значением duration (не строка)
        let video_info = serde_json::json!({
            "format": {
                "duration": 456.789
            }
        });
        let duration = extract_video_duration(&video_info);
        assert_eq!(duration, 0.0); // Функция ожидает строку
    }

    #[test]
    fn test_edge_cases_frame_timestamps() {
        use super::super::calculate_frame_timestamps;
        
        // Тест с нулевой длительностью
        let timestamps = calculate_frame_timestamps(0.0, 1.0);
        assert_eq!(timestamps, vec![0.0]);
        
        // Тест с очень большой длительностью
        let timestamps = calculate_frame_timestamps(1000000.0, 100000.0);
        assert_eq!(timestamps.len(), 11); // 0, 100000, 200000, ..., 1000000
        
        // Тест с очень маленьким интервалом
        let timestamps = calculate_frame_timestamps(1.0, 0.1);
        assert_eq!(timestamps.len(), 11); // 0.0, 0.1, 0.2, ..., 1.0
    }

    #[test]
    fn test_preview_options_edge_cases() {
        use super::super::extract_preview_options;
        
        // Тест с отрицательными значениями (должны использоваться defaults)
        let settings = serde_json::json!({
            "width": -100,
            "height": -200,
            "quality": -50
        });
        let options = extract_preview_options(&settings);
        assert_eq!(options.width, Some(1920)); // fallback to default
        assert_eq!(options.height, Some(1080)); // fallback to default
        assert_eq!(options.quality, 80); // fallback to default
        
        // Тест с очень большими значениями
        let settings = serde_json::json!({
            "width": 999999,
            "height": 999999,
            "quality": 200
        });
        let options = extract_preview_options(&settings);
        assert_eq!(options.width, Some(999999));
        assert_eq!(options.height, Some(999999));
        assert_eq!(options.quality, 200); // Валидация качества не в этой функции
        
        // Тест с нестандартными типами данных
        let settings = serde_json::json!({
            "width": "1280",
            "height": true,
            "quality": null,
            "format": 123
        });
        let options = extract_preview_options(&settings);
        assert_eq!(options.width, Some(1920)); // String не парсится as_u64
        assert_eq!(options.height, Some(1080)); // Boolean не парсится as_u64
        assert_eq!(options.quality, 80); // null возвращает default
        assert_eq!(options.format, "png"); // Number не парсится as_str
    }

    #[test]
    fn test_cache_info_consistency() {
        use super::super::generate_cache_info;
        
        // Генерируем два cache_info подряд и проверяем, что timestamps разные
        let info1 = generate_cache_info("test", 10, 1000);
        std::thread::sleep(std::time::Duration::from_millis(10));
        let info2 = generate_cache_info("test", 10, 1000);
        
        assert_ne!(info1["last_accessed"], info2["last_accessed"]);
        assert_eq!(info1["project_id"], info2["project_id"]);
        assert_eq!(info1["frame_count"], info2["frame_count"]);
        assert_eq!(info1["total_size"], info2["total_size"]);
    }
}