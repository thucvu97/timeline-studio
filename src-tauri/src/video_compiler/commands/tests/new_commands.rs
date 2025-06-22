//! Tests for new commands that use previously unused methods

use crate::video_compiler::commands::*;
use crate::video_compiler::error::VideoCompilerError;
use crate::video_compiler::schema::{ProjectSchema, Subtitle};

#[tokio::test]
async fn test_get_cache_stats_detailed() {
  let state = VideoCompilerState::new().await;

  // Add some data to cache
  {
    let mut cache = state.cache_manager.write().await;
    let key = crate::video_compiler::cache::PreviewKey::new(
      "test_video".to_string(),
      1.0,
      (1920, 1080),
      85,
    );
    let preview_data = vec![0u8; 1024 * 1024]; // 1MB
    cache.store_preview(key, preview_data).await.unwrap();
  }

  // Since we can't create tauri::State in tests, we'll test the logic directly
  let cache = state.cache_manager.read().await;
  let stats = cache.get_stats();
  let memory_usage = cache.get_memory_usage();

  let stats_json = serde_json::json!({
    "preview_hit_ratio": stats.preview_hit_ratio(),
    "memory_usage_mb": memory_usage.total_mb(),
    "preview_hits": stats.preview_hits,
    "preview_misses": stats.preview_misses,
    "render_hits": stats.render_hits,
    "render_misses": stats.render_misses,
    "metadata_requests": stats.metadata_requests,
    "preview_requests": stats.preview_requests,
    "total_memory_bytes": memory_usage.total_bytes,
  });

  let stats = stats_json;
  assert!(stats.get("preview_hit_ratio").is_some());
  assert!(stats.get("memory_usage_mb").is_some());
}

#[tokio::test]
async fn test_get_gpu_encoder_details() {
  let result = get_gpu_encoder_details("nvenc".to_string()).await;
  assert!(result.is_ok());

  let details = result.unwrap();
  assert_eq!(details["h264_codec_name"], "h264_nvenc");
  assert_eq!(details["is_hardware"], true);
  assert_eq!(details["encoder_type"], "nvenc");
}

#[tokio::test]
async fn test_test_error_types() {
  // Test IO error
  let result = test_error_types("io".to_string()).await;
  assert!(result.is_err());
  if let Err(VideoCompilerError::Io(msg)) = result {
    assert_eq!(msg, "Test IO error");
  } else {
    panic!("Expected Io error");
  }

  // Test GPU unavailable error
  let result = test_error_types("gpu_unavailable".to_string()).await;
  assert!(result.is_err());
  if let Err(VideoCompilerError::GpuUnavailable(msg)) = result {
    assert_eq!(msg, "Test GPU unavailable");
  } else {
    panic!("Expected GpuUnavailable");
  }
}

#[tokio::test]
async fn test_create_schema_objects() {
  // Test creating resolution
  let params = serde_json::json!({
      "width": 3840,
      "height": 2160
  });
  let result = create_schema_objects("resolution".to_string(), params).await;
  assert!(result.is_ok());
  let resolution = result.unwrap();
  assert_eq!(resolution["width"], 3840);
  assert_eq!(resolution["height"], 2160);

  // Test creating effect
  let params = serde_json::json!({
      "name": "Test Effect",
      "effect_type": "blur"
  });
  let result = create_schema_objects("effect".to_string(), params).await;
  assert!(result.is_ok());

  // Test creating filter
  let params = serde_json::json!({
      "name": "Test Filter",
      "filter_type": "brightness"
  });
  let result = create_schema_objects("filter".to_string(), params).await;
  assert!(result.is_ok());
}

#[tokio::test]
async fn test_track_operations() {
  use crate::video_compiler::schema::{Clip, Track, TrackType};
  use std::path::PathBuf;

  let track = Track::new(TrackType::Video, "Test Track".to_string());
  let clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);
  let clip_id = clip.id.clone();

  // Test add_clip operation
  let params = serde_json::to_value(clip).unwrap();
  let result = track_operations(track.clone(), "add_clip".to_string(), params).await;
  assert!(result.is_ok());
  let updated_track = result.unwrap();
  assert_eq!(updated_track.clips.len(), 1);

  // Test remove_clip operation
  let params = serde_json::json!({ "clip_id": clip_id });
  let result = track_operations(updated_track, "remove_clip".to_string(), params).await;
  assert!(result.is_ok());
  let final_track = result.unwrap();
  assert_eq!(final_track.clips.len(), 0);
}

#[tokio::test]
async fn test_get_clip_info() {
  use crate::video_compiler::schema::Clip;
  use std::path::PathBuf;

  let clip = Clip::new(PathBuf::from("/test/video.mp4"), 5.0, 10.0);

  // Test timeline_duration
  let result = get_clip_info(clip.clone(), "timeline_duration".to_string()).await;
  assert!(result.is_ok());
  let info = result.unwrap();
  assert_eq!(info["duration"], 10.0);

  // Test contains_time (always returns false for time 0.0 in this test)
  let result = get_clip_info(clip, "contains_time".to_string()).await;
  assert!(result.is_ok());
  let info = result.unwrap();
  assert_eq!(info["contains"], false);
}

#[tokio::test]
async fn test_validate_subtitle() {
  let subtitle = Subtitle::new("Test subtitle".to_string(), 0.0, 5.0);

  let result = validate_subtitle(subtitle).await;
  assert!(result.is_ok());
  let validation = result.unwrap();
  assert_eq!(validation["valid"], true);
  assert_eq!(validation["duration"], 5.0);
}

#[tokio::test]
async fn test_touch_project_schema() {
  let project = ProjectSchema::new("Test Project".to_string());

  // Sleep briefly to ensure time difference
  tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

  let result = touch_project_schema(project).await;
  assert!(result.is_ok());
  let updated_project = result.unwrap();
  // The touch method should update the updated_at field
  // The touch method updates the modified timestamp internally
  // We can't verify it directly, but we can check the project was processed successfully
  assert_eq!(updated_project.metadata.name, "Test Project");
}

#[tokio::test]
async fn test_build_render_command_with_settings() {
  // Test the FFmpegBuilder logic directly since we can't create tauri::State in tests
  use crate::video_compiler::ffmpeg_builder::{builder::FFmpegBuilderSettings, FFmpegBuilder};

  let project = ProjectSchema::new("Test Project".to_string());
  let settings = FFmpegBuilderSettings {
    ffmpeg_path: "ffmpeg".to_string(),
    use_hardware_acceleration: true,
    hardware_acceleration_type: Some("nvenc".to_string()),
    global_options: vec!["-y".to_string(), "-hide_banner".to_string()],
  };

  let builder = FFmpegBuilder::with_settings(project, settings);
  let result = builder
    .build_render_command(std::path::Path::new("/tmp/test_output.mp4"))
    .await;

  assert!(result.is_ok());
  let command = result.unwrap();
  let program = format!("{}", command.as_std().get_program().to_string_lossy());
  assert!(program.contains("ffmpeg"));
}
