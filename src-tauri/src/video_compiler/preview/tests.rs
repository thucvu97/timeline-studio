//! Тесты для модуля генерации превью

use super::*;
use crate::video_compiler::cache::RenderCache;
use std::sync::Arc;
use std::time::SystemTime;
use tempfile::TempDir;
use tokio::sync::RwLock;

// Создаем mock FFmpeg команду для тестов
fn create_test_preview_generator() -> PreviewGenerator {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    PreviewGenerator::new(cache)
}

#[test]
fn test_preview_settings_default() {
    let settings = PreviewSettings::default();
    assert_eq!(settings.default_resolution, (640, 360));
    assert_eq!(settings.default_quality, 75);
    assert_eq!(settings.timeline_resolution, (160, 90));
    assert_eq!(settings.timeline_quality, 60);
    assert!(matches!(settings.format, PreviewFormat::Jpeg));
    assert!(!settings.hardware_acceleration);
    assert_eq!(settings.timeout_seconds, 30);
    assert!(settings.supported_formats.contains(&"mp4".to_string()));
    assert!(settings.supported_formats.contains(&"mkv".to_string()));
}

#[test]
fn test_preview_settings_clone() {
    let settings = PreviewSettings {
        default_resolution: (1920, 1080),
        default_quality: 90,
        timeline_resolution: (320, 180),
        timeline_quality: 70,
        format: PreviewFormat::Png,
        hardware_acceleration: true,
        timeout_seconds: 60,
        supported_formats: vec!["mp4".to_string(), "avi".to_string()],
    };
    
    let cloned = settings.clone();
    assert_eq!(cloned.default_resolution, settings.default_resolution);
    assert_eq!(cloned.default_quality, settings.default_quality);
    assert_eq!(cloned.hardware_acceleration, settings.hardware_acceleration);
}

#[test]
fn test_preview_format_serialization() {
    let formats = vec![
        PreviewFormat::Jpeg,
        PreviewFormat::Png,
        PreviewFormat::WebP,
    ];
    
    for format in formats {
        let json = serde_json::to_string(&format).unwrap();
        let deserialized: PreviewFormat = serde_json::from_str(&json).unwrap();
        assert!(matches!(
            (&format, &deserialized),
            (PreviewFormat::Jpeg, PreviewFormat::Jpeg) |
            (PreviewFormat::Png, PreviewFormat::Png) |
            (PreviewFormat::WebP, PreviewFormat::WebP)
        ));
    }
}

#[test]
fn test_video_info_serialization() {
    let info = VideoInfo {
        duration: 120.5,
        resolution: Some((1920, 1080)),
        fps: Some(30.0),
        bitrate: Some(8000000),
        video_codec: Some("h264".to_string()),
        audio_codec: Some("aac".to_string()),
    };
    
    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("120.5"));
    assert!(json.contains("1920"));
    assert!(json.contains("h264"));
    
    let deserialized: VideoInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.duration, info.duration);
    assert_eq!(deserialized.resolution, info.resolution);
}

#[test]
fn test_preview_request_serialization() {
    let request = PreviewRequest {
        video_path: "/test/video.mp4".to_string(),
        timestamp: 10.5,
        resolution: Some((640, 360)),
        quality: Some(80),
    };
    
    let json = serde_json::to_string(&request).unwrap();
    assert!(json.contains("/test/video.mp4"));
    assert!(json.contains("10.5"));
    
    let deserialized: PreviewRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.video_path, request.video_path);
    assert_eq!(deserialized.timestamp, request.timestamp);
}

#[test]
fn test_preview_result_creation() {
    let result = PreviewResult {
        timestamp: 5.0,
        result: Ok(vec![1, 2, 3, 4, 5]),
    };
    
    assert_eq!(result.timestamp, 5.0);
    assert!(result.result.is_ok());
    assert_eq!(result.result.unwrap().len(), 5);
}

#[test]
fn test_serializable_preview_result_serialization() {
    let result = SerializablePreviewResult {
        timestamp: 15.5,
        image_data: Some("base64encodeddata".to_string()),
        error: None,
    };
    
    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("15.5"));
    assert!(json.contains("base64encodeddata"));
    
    let deserialized: SerializablePreviewResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.timestamp, result.timestamp);
    assert_eq!(deserialized.image_data, result.image_data);
}

#[test]
fn test_timeline_preview_creation() {
    let preview = TimelinePreview {
        timestamp: 20.0,
        image_data: Some(vec![10, 20, 30]),
    };
    
    assert_eq!(preview.timestamp, 20.0);
    assert!(preview.image_data.is_some());
    assert_eq!(preview.image_data.unwrap().len(), 3);
}

#[tokio::test]
async fn test_preview_generator_creation() {
    let generator = create_test_preview_generator();
    assert_eq!(generator.ffmpeg_path, "ffmpeg");
}

#[tokio::test]
async fn test_preview_generator_with_settings() {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let settings = PreviewSettings {
        default_resolution: (1280, 720),
        default_quality: 85,
        ..Default::default()
    };
    
    let generator = PreviewGenerator::with_settings(cache, settings.clone());
    assert_eq!(generator.settings.default_resolution, (1280, 720));
    assert_eq!(generator.settings.default_quality, 85);
}

#[tokio::test]
async fn test_set_ffmpeg_path() {
    let mut generator = create_test_preview_generator();
    generator.set_ffmpeg_path("/usr/local/bin/ffmpeg");
    assert_eq!(generator.ffmpeg_path, "/usr/local/bin/ffmpeg");
}

#[tokio::test]
async fn test_quality_to_qscale() {
    let generator = create_test_preview_generator();
    assert_eq!(generator.quality_to_qscale(100), 2);
    assert_eq!(generator.quality_to_qscale(0), 31);
    assert_eq!(generator.quality_to_qscale(50), 16); // (100-50)*29/100 + 2 = 16.45 ≈ 16
    
    // Edge cases
    assert_eq!(generator.quality_to_qscale(150), 2); // Above 100, clamped to 100
}

#[tokio::test]
async fn test_get_extension() {
    let generator = create_test_preview_generator();
    
    match generator.settings.format {
        PreviewFormat::Jpeg => assert_eq!(generator.get_file_extension(), "jpg"),
        PreviewFormat::Png => assert_eq!(generator.get_file_extension(), "png"),
        PreviewFormat::WebP => assert_eq!(generator.get_file_extension(), "webp"),
    }
}

#[tokio::test]
async fn test_create_temp_output_path() {
    let generator = create_test_preview_generator();
    let path = generator.create_temp_output_path().await.unwrap();
    
    // Проверяем что путь оканчивается на правильное расширение
    assert!(path.ends_with(".jpg"));
    
    // Проверяем что файл пока не существует
    assert!(!Path::new(&path).exists());
}

#[tokio::test]
async fn test_validate_input_success() {
    let generator = create_test_preview_generator();
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test_video.mp4");
    
    // Создаем тестовый файл
    std::fs::write(&video_path, b"dummy video data").unwrap();
    
    // Должно пройти валидацию
    let result = generator.validate_input(&video_path, 10.0);
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_validate_input_file_not_found() {
    let generator = create_test_preview_generator();
    let video_path = Path::new("/nonexistent/video.mp4");
    
    let result = generator.validate_input(video_path, 10.0);
    assert!(result.is_err());
    
    if let Err(e) = result {
        assert!(matches!(e, VideoCompilerError::MediaFileError { .. }));
    }
}

#[tokio::test]
async fn test_validate_input_negative_timestamp() {
    let generator = create_test_preview_generator();
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test_video.mp4");
    std::fs::write(&video_path, b"dummy video data").unwrap();
    
    let result = generator.validate_input(&video_path, -5.0);
    assert!(result.is_err());
    
    if let Err(e) = result {
        assert!(matches!(e, VideoCompilerError::ValidationError(_)));
    }
}

#[tokio::test]
async fn test_validate_input_unsupported_format() {
    let generator = create_test_preview_generator();
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test_file.xyz");
    std::fs::write(&video_path, b"dummy data").unwrap();
    
    let result = generator.validate_input(&video_path, 10.0);
    assert!(result.is_err());
    
    if let Err(e) = result {
        assert!(matches!(e, VideoCompilerError::UnsupportedFormat { .. }));
    }
}

#[tokio::test]
async fn test_parse_video_info_valid() {
    let generator = create_test_preview_generator();
    let ffmpeg_output = r#"
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'test.mp4':
  Duration: 00:02:30.50, start: 0.000000, bitrate: 8000 kb/s
    Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 1920x1080 [SAR 1:1 DAR 16:9], 7500 kb/s, 30 fps, 30 tbr, 15360 tbn, 60 tbc (default)
    Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 192 kb/s (default)
    "#;
    
    let info = generator.parse_video_info(ffmpeg_output).unwrap();
    assert_eq!(info.duration, 150.5);
    assert_eq!(info.resolution, Some((1920, 1080)));
    assert_eq!(info.fps, Some(30.0));
    assert_eq!(info.bitrate, Some(8000));
    assert_eq!(info.video_codec, Some("h264".to_string()));
    assert_eq!(info.audio_codec, Some("aac".to_string()));
}

#[tokio::test]
async fn test_parse_video_info_minimal() {
    let generator = create_test_preview_generator();
    let ffmpeg_output = r#"
Input #0, matroska,webm, from 'test.mkv':
  Duration: 00:01:00.00, start: 0.000000
    "#;
    
    let info = generator.parse_video_info(ffmpeg_output).unwrap();
    assert_eq!(info.duration, 60.0);
    assert_eq!(info.resolution, None);
    assert_eq!(info.fps, None);
    assert_eq!(info.bitrate, None);
    assert_eq!(info.video_codec, None);
    assert_eq!(info.audio_codec, None);
}

#[tokio::test]
async fn test_parse_video_info_no_duration() {
    let generator = create_test_preview_generator();
    let ffmpeg_output = "Some invalid output without duration";
    
    let result = generator.parse_video_info(ffmpeg_output);
    assert!(result.is_err());
}

#[tokio::test]
async fn test_clear_cache_for_file() {
    let generator = create_test_preview_generator();
    
    // Добавляем что-то в кэш
    {
        let mut cache = generator.cache.write().await;
        let key = PreviewKey::new("/test.mp4".to_string(), 5.0, (640, 360), 75);
        cache.store_preview(key.clone(), vec![1, 2, 3]).await.unwrap();
        
        // Проверяем что есть в кэше
        assert!(cache.get_preview(&key).await.is_some());
    }
    
    // Очищаем кэш
    generator.clear_cache_for_file().await.unwrap();
    
    // Проверяем что кэш пуст
    {
        let mut cache = generator.cache.write().await;
        let key = PreviewKey::new("/test.mp4".to_string(), 5.0, (640, 360), 75);
        assert!(cache.get_preview(&key).await.is_none());
    }
}

#[test]
fn test_preview_generator_debug() {
    let generator = create_test_preview_generator();
    let debug_str = format!("{:?}", generator);
    assert!(debug_str.contains("PreviewGenerator"));
}

#[test]
fn test_timeline_preview_serialization() {
    let preview = TimelinePreview {
        timestamp: 25.5,
        image_data: Some(vec![5, 10, 15]),
    };
    
    let json = serde_json::to_string(&preview).unwrap();
    assert!(json.contains("25.5"));
    
    let deserialized: TimelinePreview = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.timestamp, preview.timestamp);
    assert_eq!(deserialized.image_data, preview.image_data);
}

#[tokio::test]
async fn test_preview_batch_result_empty() {
    let generator = create_test_preview_generator();
    let results = generator.generate_preview_batch(vec![]).await.unwrap();
    assert!(results.is_empty());
}

#[test]
fn test_all_supported_formats() {
    let settings = PreviewSettings::default();
    let expected_formats = vec![
        "mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "mpg", "mpeg", 
        "m4v", "3gp", "ogv", "mxf", "ts", "vob"
    ];
    
    for format in expected_formats {
        assert!(settings.supported_formats.contains(&format.to_string()));
    }
}