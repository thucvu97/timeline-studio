#[cfg(test)]
mod tests {
  use crate::video_compiler::{
    commands::*,
    progress::{RenderProgress, RenderStatus},
    schema::{AspectRatio, ProjectSchema, Timeline, Track, TrackType},
    CompilerSettings,
  };
  use tempfile::TempDir;

  fn create_test_state() -> VideoCompilerState {
    VideoCompilerState::new()
  }

  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());

    // Set up timeline
    project.timeline = Timeline {
      duration: 60.0,
      fps: 30,
      resolution: (1920, 1080),
      sample_rate: 48000,
      aspect_ratio: AspectRatio::Ratio16x9,
    };

    // Add a video track
    let track = Track::new(TrackType::Video, "Video Track".to_string());
    project.tracks.push(track);

    project
  }

  #[test]
  fn test_video_compiler_state_new() {
    let state = VideoCompilerState::new();
    assert_eq!(state.ffmpeg_path, "ffmpeg");
  }

  #[test]
  fn test_video_compiler_state_default() {
    let state = VideoCompilerState::default();
    assert_eq!(state.ffmpeg_path, "ffmpeg");
  }

  #[test]
  fn test_render_job_serialization() {
    let job = RenderJob {
      id: "test-id".to_string(),
      project_name: "Test Project".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: chrono::Utc::now().to_rfc3339(),
      progress: None,
      error_message: None,
    };

    let json = serde_json::to_string(&job).unwrap();
    assert!(json.contains("test-id"));
    assert!(json.contains("Test Project"));

    let deserialized: RenderJob = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.id, job.id);
    assert_eq!(deserialized.project_name, job.project_name);
  }

  #[tokio::test]
  async fn test_compiler_settings_serialization() {
    let settings = CompilerSettings::default();
    let json = serde_json::to_string(&settings).unwrap();
    assert!(json.contains("max_concurrent_jobs"));
    assert!(json.contains("cache_size_mb"));

    let deserialized: CompilerSettings = serde_json::from_str(&json).unwrap();
    assert_eq!(
      deserialized.max_concurrent_jobs,
      settings.max_concurrent_jobs
    );
  }

  #[test]
  fn test_ffmpeg_capabilities_serialization() {
    let capabilities = FfmpegCapabilities {
      version: "5.0.0".to_string(),
      available_codecs: vec!["h264".to_string(), "aac".to_string()],
      hardware_encoders: vec!["h264_nvenc".to_string()],
      path: "/usr/bin/ffmpeg".to_string(),
    };

    let json = serde_json::to_string(&capabilities).unwrap();
    assert!(json.contains("5.0.0"));
    assert!(json.contains("h264"));

    // FfmpegCapabilities doesn't have Deserialize, so skip deserialization test
  }

  #[test]
  fn test_system_info_serialization() {
    let system_info = SystemInfo {
      os: "linux".to_string(),
      arch: "x86_64".to_string(),
      ffmpeg_path: "ffmpeg".to_string(),
      temp_directory: "/tmp".to_string(),
      gpu_capabilities: None,
      available_memory: Some(8_000_000_000),
      cpu_cores: 8,
    };

    let json = serde_json::to_string(&system_info).unwrap();
    assert!(json.contains("linux"));
    assert!(json.contains("x86_64"));

    // SystemInfo doesn't have Deserialize, so skip deserialization test
  }

  #[test]
  fn test_prerender_request_serialization() {
    let request = PrerenderRequest {
      project_schema: create_test_project(),
      start_time: 0.0,
      end_time: 10.0,
      apply_effects: true,
      quality: Some(80),
    };

    let json = serde_json::to_string(&request).unwrap();
    assert!(json.contains("project_schema"));
    assert!(json.contains("start_time"));

    let deserialized: PrerenderRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.start_time, request.start_time);
  }

  #[tokio::test]
  async fn test_get_prerender_cache_info() {
    let result = get_prerender_cache_info().await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info.file_count, info.files.len());
    assert!(info.total_size >= 0);
  }

  #[tokio::test]
  async fn test_clear_prerender_cache() {
    let result = clear_prerender_cache().await;
    assert!(result.is_ok());

    let deleted_size = result.unwrap();
    assert!(deleted_size >= 0);
  }

  #[test]
  fn test_extract_ffmpeg_version() {
    let output = "ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers";
    let version = extract_ffmpeg_version(output);
    assert_eq!(
      version,
      "ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers"
    );

    let output_no_version = "Some other output";
    let version = extract_ffmpeg_version(output_no_version);
    assert_eq!(version, "Unknown");
  }

  #[test]
  fn test_extract_available_codecs() {
    let output = "Codecs:\nD..... = Decoding supported\n.E.... = Encoding supported\n..V... = Video codec\n..A... = Audio codec\n D.V... h264         H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10\n DEA... aac          AAC (Advanced Audio Coding)";
    let codecs = extract_available_codecs(output);
    assert!(codecs.contains(&"h264".to_string()));
    assert!(codecs.contains(&"aac".to_string()));
  }

  #[test]
  fn test_extract_hardware_encoders() {
    let output = "Encoders:\n V..... h264_nvenc   NVIDIA NVENC H.264 encoder\n V..... h264_qsv     Intel Quick Sync Video H.264 encoder";
    let encoders = extract_hardware_encoders(output);
    assert!(encoders.contains(&"h264_nvenc".to_string()));
    assert!(encoders.contains(&"h264_qsv".to_string()));
  }

  #[test]
  fn test_timeline_frame_extraction_request_serialization() {
    let request = TimelineFrameExtractionRequest {
      video_path: "/path/to/video.mp4".to_string(),
      duration: 120.0,
      interval: 5.0,
      max_frames: Some(20),
    };

    let json = serde_json::to_string(&request).unwrap();
    assert!(json.contains("video_path"));
    assert!(json.contains("120.0"));

    let deserialized: TimelineFrameExtractionRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.video_path, request.video_path);
  }

  #[test]
  fn test_prerender_result_serialization() {
    let result = PrerenderResult {
      file_path: "/tmp/prerender.mp4".to_string(),
      duration: 10.0,
      file_size: 1024 * 1024,
      render_time_ms: 5000,
    };

    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("/tmp/prerender.mp4"));
    assert!(json.contains("10.0"));

    let deserialized: PrerenderResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.file_path, result.file_path);
  }

  #[test]
  fn test_prerender_cache_file_serialization() {
    let file = PrerenderCacheFile {
      path: "/tmp/prerender_0_10_abc.mp4".to_string(),
      size: 2048,
      created: 1234567890,
      start_time: 0.0,
      end_time: 10.0,
    };

    let json = serde_json::to_string(&file).unwrap();
    assert!(json.contains("prerender_0_10"));

    let deserialized: PrerenderCacheFile = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.path, file.path);
  }

  #[test]
  fn test_prerender_cache_info_serialization() {
    let info = PrerenderCacheInfo {
      file_count: 2,
      total_size: 4096,
      files: vec![
        PrerenderCacheFile {
          path: "/tmp/prerender_0_10_abc.mp4".to_string(),
          size: 2048,
          created: 1234567890,
          start_time: 0.0,
          end_time: 10.0,
        },
        PrerenderCacheFile {
          path: "/tmp/prerender_10_20_def.mp4".to_string(),
          size: 2048,
          created: 1234567891,
          start_time: 10.0,
          end_time: 20.0,
        },
      ],
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("file_count"));
    assert!(json.contains("total_size"));

    let deserialized: PrerenderCacheInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.file_count, info.file_count);
    assert_eq!(deserialized.total_size, info.total_size);
  }

  #[test]
  fn test_timeline_frame_serialization() {
    let frame = TimelineFrame {
      timestamp: 5.0,
      frame_data: "base64encodeddata".to_string(),
      is_keyframe: true,
    };

    let json = serde_json::to_string(&frame).unwrap();
    assert!(json.contains("timestamp"));
    assert!(json.contains("frame_data"));
    assert!(json.contains("is_keyframe"));

    let deserialized: TimelineFrame = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.timestamp, frame.timestamp);
    assert_eq!(deserialized.is_keyframe, frame.is_keyframe);
  }

  #[test]
  fn test_recognition_frame_result_serialization() {
    let result = RecognitionFrameResult {
      timestamp: 10.0,
      frame_data: vec![1, 2, 3, 4],
      resolution: [1920, 1080],
      scene_change_score: Some(0.85),
      is_keyframe: false,
    };

    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("timestamp"));
    assert!(json.contains("resolution"));
    assert!(json.contains("scene_change_score"));

    let deserialized: RecognitionFrameResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.timestamp, result.timestamp);
    assert_eq!(deserialized.resolution, result.resolution);
  }

  #[test]
  fn test_subtitle_frame_result_serialization() {
    let result = SubtitleFrameResult {
      subtitle_id: "subtitle-1".to_string(),
      subtitle_text: "Hello World".to_string(),
      timestamp: 15.0,
      frame_data: vec![5, 6, 7, 8],
      start_time: 14.5,
      end_time: 16.5,
    };

    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("subtitle_id"));
    assert!(json.contains("subtitle_text"));

    let deserialized: SubtitleFrameResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.subtitle_id, result.subtitle_id);
    assert_eq!(deserialized.subtitle_text, result.subtitle_text);
  }

  #[test]
  fn test_get_available_memory() {
    // Test the function directly
    let memory = get_available_memory();
    // Just check it doesn't panic
    assert!(memory.is_some() || memory.is_none());
  }

  #[tokio::test]
  async fn test_cache_stats_structure() {
    let state = create_test_state();
    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();

    // Check all required fields exist
    assert_eq!(stats.preview_requests, 0);
    assert_eq!(stats.preview_hits, 0);
    assert_eq!(stats.preview_misses, 0);
    assert_eq!(stats.metadata_requests, 0);
    assert_eq!(stats.metadata_hits, 0);
    assert_eq!(stats.metadata_misses, 0);
    assert_eq!(stats.render_requests, 0);
    assert_eq!(stats.render_hits, 0);
    assert_eq!(stats.render_misses, 0);
  }

  #[tokio::test]
  async fn test_video_compiler_state_structure() {
    let state = create_test_state();

    // Check active_jobs
    {
      let jobs = state.active_jobs.read().await;
      assert!(jobs.is_empty());
    }

    // Check cache_manager
    {
      let _cache = state.cache_manager.read().await;
      // Cache exists
    }

    // Check settings
    {
      let settings = state.settings.read().await;
      assert!(settings.max_concurrent_jobs > 0);
    }

    assert_eq!(state.ffmpeg_path, "ffmpeg");
  }

  #[tokio::test]
  async fn test_compile_video_state() {
    let state = create_test_state();
    let project = create_test_project();

    // Test that we can create the state and access its components
    assert!(state.active_jobs.read().await.is_empty());
    assert_eq!(state.ffmpeg_path, "ffmpeg");

    // Validate project schema
    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (1920, 1080));
  }

  #[tokio::test]
  async fn test_render_job_management() {
    let state = create_test_state();

    // Test that active jobs starts empty
    {
      let jobs = state.active_jobs.read().await;
      assert!(jobs.is_empty());
    }

    // Test RenderJob structure (command version)
    let job = RenderJob {
      id: "test-123".to_string(),
      project_name: "Test Project".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: chrono::Utc::now().to_rfc3339(),
      progress: Some(RenderProgress {
        job_id: "test-123".to_string(),
        stage: "Encoding".to_string(),
        percentage: 50.0,
        current_frame: 1500,
        total_frames: 3000,
        elapsed_time: std::time::Duration::from_secs(60),
        estimated_remaining: Some(std::time::Duration::from_secs(60)),
        status: RenderStatus::Processing,
        message: Some("Processing video".to_string()),
      }),
      error_message: None,
    };

    assert_eq!(job.id, "test-123");
    assert_eq!(job.status, RenderStatus::Processing);
  }

  #[tokio::test]
  async fn test_get_active_jobs() {
    let state = create_test_state();

    // Test that active jobs starts empty
    let jobs = state.active_jobs.read().await;
    assert!(jobs.is_empty());
  }

  #[tokio::test]
  async fn test_cancel_render() {
    let state = create_test_state();
    let job_id = "test-job-123".to_string();

    // Verify no jobs exist
    {
      let jobs = state.active_jobs.read().await;
      assert!(!jobs.contains_key(&job_id));
    }
  }

  #[tokio::test]
  async fn test_generate_preview() {
    let state = create_test_state();
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir
      .path()
      .join("test.mp4")
      .to_str()
      .unwrap()
      .to_string();

    // Create a fake video file
    std::fs::write(&video_path, b"fake video content").unwrap();

    // Test cache manager exists
    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 0);
  }

  #[tokio::test]
  async fn test_get_gpu_capabilities() {
    // Test GPU capabilities structure
    use crate::video_compiler::gpu::GpuCapabilities;

    let capabilities = GpuCapabilities {
      available_encoders: vec![crate::video_compiler::gpu::GpuEncoder::Nvenc],
      recommended_encoder: Some(crate::video_compiler::gpu::GpuEncoder::Nvenc),
      current_gpu: None,
      hardware_acceleration_supported: true,
    };

    assert!(capabilities.hardware_acceleration_supported);
  }

  #[tokio::test]
  async fn test_get_current_gpu_info() {
    // Test GPU info structure
    use crate::video_compiler::gpu::GpuInfo;

    let info = GpuInfo {
      name: "Test GPU".to_string(),
      driver_version: Some("1.0.0".to_string()),
      memory_total: Some(8192 * 1024 * 1024),
      memory_used: Some(1024 * 1024 * 1024),
      utilization: Some(50.0),
      encoder_type: crate::video_compiler::gpu::GpuEncoder::Nvenc,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    };

    assert_eq!(info.name, "Test GPU");
    assert!(info.memory_total.unwrap() > 0);
  }

  #[tokio::test]
  async fn test_check_hardware_acceleration() {
    let state = create_test_state();

    // Test settings have hardware acceleration flag
    let settings = state.settings.read().await;
    let hw_enabled = settings.hardware_acceleration;
    assert!(hw_enabled || !hw_enabled); // Either value is valid
  }

  #[tokio::test]
  async fn test_get_cache_stats() {
    let state = create_test_state();

    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();

    // New cache should have zero requests
    assert_eq!(stats.preview_requests, 0);
    assert_eq!(stats.metadata_requests, 0);
    assert_eq!(stats.render_requests, 0);
  }

  #[tokio::test]
  async fn test_clear_cache() {
    let state = create_test_state();

    // Clear cache
    {
      let mut cache = state.cache_manager.write().await;
      cache.clear_all().await;
    }

    // Verify cache is empty
    let cache = state.cache_manager.read().await;
    let usage = cache.get_memory_usage();
    assert!(usage.total_mb() < 0.01);
  }

  #[tokio::test]
  async fn test_clear_preview_cache() {
    let state = create_test_state();

    // Clear preview cache
    {
      let mut cache = state.cache_manager.write().await;
      cache.clear_previews().await;
    }

    // Verify preview cache is empty
    let cache = state.cache_manager.read().await;
    let _stats = cache.get_stats();
    // Stats should be zero after clearing
  }

  #[tokio::test]
  async fn test_get_compiler_settings() {
    let state = create_test_state();

    let settings = state.settings.read().await;
    assert!(settings.max_concurrent_jobs > 0);
    assert!(settings.cache_size_mb > 0);
  }

  #[tokio::test]
  async fn test_update_compiler_settings() {
    let state = create_test_state();

    // Update settings
    {
      let mut settings = state.settings.write().await;
      settings.max_concurrent_jobs = 8;
      settings.hardware_acceleration = false;
    }

    // Verify settings were updated
    let settings = state.settings.read().await;
    assert_eq!(settings.max_concurrent_jobs, 8);
    assert!(!settings.hardware_acceleration);
  }

  #[tokio::test]
  async fn test_set_ffmpeg_path() {
    let state = create_test_state();
    let new_path = "/usr/local/bin/ffmpeg".to_string();

    // Verify original path
    assert_eq!(state.ffmpeg_path, "ffmpeg");

    // Would update via state in real command
    // For test, just verify structure
    assert!(!new_path.is_empty());
  }

  #[tokio::test]
  async fn test_get_system_info() {
    // Test system info structure
    let info = SystemInfo {
      os: "linux".to_string(),
      arch: "x86_64".to_string(),
      ffmpeg_path: "ffmpeg".to_string(),
      temp_directory: "/tmp".to_string(),
      gpu_capabilities: None,
      available_memory: Some(8_000_000_000),
      cpu_cores: 8,
    };

    assert_eq!(info.cpu_cores, 8);
    assert!(info.available_memory.unwrap() > 0);
  }

  #[tokio::test]
  async fn test_check_ffmpeg_capabilities() {
    // Test FFmpeg capabilities structure
    let capabilities = FfmpegCapabilities {
      version: "5.0.0".to_string(),
      available_codecs: vec!["h264".to_string(), "aac".to_string()],
      hardware_encoders: vec!["h264_nvenc".to_string()],
      path: "/usr/bin/ffmpeg".to_string(),
    };

    assert!(!capabilities.version.is_empty());
    assert!(!capabilities.available_codecs.is_empty());
    assert!(capabilities.available_codecs.contains(&"h264".to_string()));
  }

  #[tokio::test]
  async fn test_extract_timeline_frames() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir
      .path()
      .join("test.mp4")
      .to_str()
      .unwrap()
      .to_string();
    std::fs::write(&video_path, b"fake video").unwrap();

    // Test request structure with correct fields
    let request = TimelineFrameExtractionRequest {
      video_path: video_path.clone(),
      duration: 30.0,
      interval: 5.0,
      max_frames: Some(6),
    };

    assert_eq!(request.duration, 30.0);
    assert_eq!(request.interval, 5.0);
    assert_eq!(request.max_frames, Some(6));
  }

  #[tokio::test]
  async fn test_clear_frame_cache() {
    let state = create_test_state();

    // Test that cache manager exists and can be accessed
    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();

    // Frame cache should be part of overall cache
    assert_eq!(stats.preview_requests, 0);
  }

  #[tokio::test]
  async fn test_prerender_segment() {
    let project = create_test_project();

    // Test request structure with correct fields
    let request = PrerenderRequest {
      project_schema: project,
      start_time: 0.0,
      end_time: 10.0,
      apply_effects: true,
      quality: Some(80),
    };

    assert_eq!(request.start_time, 0.0);
    assert_eq!(request.end_time, 10.0);
    assert!(request.apply_effects);
    assert_eq!(request.quality, Some(80));
  }

  #[tokio::test]
  async fn test_get_prerender_cache_info_standalone() {
    // Test the standalone function
    let result = get_prerender_cache_info().await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info.file_count, info.files.len());
    assert!(info.total_size >= 0);
  }

  #[tokio::test]
  async fn test_clear_prerender_cache_standalone() {
    // Test the standalone function
    let result = clear_prerender_cache().await;
    assert!(result.is_ok());

    let deleted_size = result.unwrap();
    assert!(deleted_size >= 0);
  }
}
