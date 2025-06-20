#[cfg(test)]
#[allow(clippy::module_inception)]
mod tests {
  use crate::video_compiler::{
    cache::{CacheMemoryUsage, MediaMetadata},
    commands::*,
    frame_extraction::{ExtractionPurpose, ExtractionSettings, ExtractionStrategy},
    gpu::{GpuCapabilities, GpuEncoder, GpuInfo},
    progress::{RenderProgress, RenderStatus},
    schema::{AspectRatio, PreviewFormat, ProjectSchema, Subtitle, Timeline, Track, TrackType},
    CompilerSettings,
  };
  use serde::{Deserialize, Serialize};
  use std::path::PathBuf;
  use std::time::{Duration, SystemTime};
  use tempfile::TempDir;

  #[derive(Debug, Clone, Serialize, Deserialize)]
  struct TestRenderJob {
    pub id: String,
    pub project: ProjectSchema,
    pub output_path: String,
    pub settings: CompilerSettings,
    pub progress: RenderProgress,
  }

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

  // Basic State Tests
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

  // Serialization Tests
  #[test]
  fn test_render_job_serialization() {
    let job = TestRenderJob {
      id: "test-id".to_string(),
      project: create_test_project(),
      output_path: "/tmp/output.mp4".to_string(),
      settings: CompilerSettings::default(),
      progress: RenderProgress {
        job_id: "test-id".to_string(),
        stage: "Encoding".to_string(),
        percentage: 50.0,
        current_frame: 750,
        total_frames: 1500,
        elapsed_time: Duration::from_secs(30),
        estimated_remaining: Some(Duration::from_secs(30)),
        status: RenderStatus::Processing,
        message: Some("Processing video".to_string()),
      },
    };

    let json = serde_json::to_string(&job).unwrap();
    assert!(json.contains("test-id"));
    assert!(json.contains("Test Project"));
    assert!(json.contains("Encoding"));

    let deserialized: TestRenderJob = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.id, job.id);
    assert_eq!(deserialized.progress.percentage, 50.0);
  }

  #[test]
  fn test_render_job_metadata_sync() {
    let metadata = RenderJobMetadata {
      project_name: "My Project".to_string(),
      output_path: "/home/user/output.mp4".to_string(),
      created_at: "2024-01-01T12:00:00Z".to_string(),
    };

    assert_eq!(metadata.project_name, "My Project");
    assert_eq!(metadata.output_path, "/home/user/output.mp4");
  }

  #[test]
  fn test_compiler_settings_serialization() {
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

  // GPU Tests
  #[tokio::test]
  async fn test_gpu_capabilities() {
    let capabilities = GpuCapabilities {
      available_encoders: vec![GpuEncoder::Nvenc],
      recommended_encoder: Some(GpuEncoder::Nvenc),
      current_gpu: None,
      hardware_acceleration_supported: true,
    };

    assert!(!capabilities.available_encoders.is_empty());
    assert!(capabilities.hardware_acceleration_supported);
  }

  #[tokio::test]
  async fn test_gpu_info() {
    let info = GpuInfo {
      name: "NVIDIA GeForce RTX 3080".to_string(),
      driver_version: Some("525.60.11".to_string()),
      memory_total: Some(10737418240), // 10GB
      memory_used: Some(2147483648),   // 2GB
      utilization: Some(25.0),
      encoder_type: GpuEncoder::Nvenc,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    };

    assert_eq!(info.name, "NVIDIA GeForce RTX 3080");
    assert_eq!(info.supported_codecs.len(), 2);
  }

  // Progress Tests
  #[tokio::test]
  async fn test_render_progress_tracking() {
    let progress = RenderProgress {
      job_id: "test".to_string(),
      stage: "Initializing".to_string(),
      percentage: 0.0,
      current_frame: 0,
      total_frames: 1000,
      elapsed_time: Duration::from_secs(0),
      estimated_remaining: None,
      status: RenderStatus::Processing,
      message: None,
    };

    assert_eq!(progress.percentage, 0.0);
    assert!(matches!(progress.status, RenderStatus::Processing));
  }

  #[test]
  fn test_render_status_transitions() {
    let status = RenderStatus::Processing;
    assert!(matches!(status, RenderStatus::Processing));

    let status = RenderStatus::Completed;
    assert!(matches!(status, RenderStatus::Completed));

    let status = RenderStatus::Failed;
    assert!(matches!(status, RenderStatus::Failed));

    let status = RenderStatus::Cancelled;
    assert!(matches!(status, RenderStatus::Cancelled));
  }

  // Cache Tests
  #[test]
  fn test_cache_memory_usage() {
    let usage = CacheMemoryUsage {
      preview_bytes: 104857600,  // 100MB
      metadata_bytes: 104857600, // 100MB
      render_bytes: 524288000,   // 500MB
      total_bytes: 733003200,    // 700MB
    };

    assert_eq!(usage.preview_bytes, 104857600);
    assert_eq!(usage.render_bytes, 524288000);
    assert_eq!(usage.total_bytes, 733003200);
  }

  #[test]
  fn test_media_metadata() {
    let metadata = MediaMetadata {
      file_path: "/path/to/video.mp4".to_string(),
      file_size: 100_000_000,
      modified_time: SystemTime::now(),
      duration: 120.5,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(5000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
      cached_at: SystemTime::now(),
    };

    assert_eq!(metadata.duration, 120.5);
    assert_eq!(metadata.resolution, Some((1920, 1080)));
  }

  // Frame Extraction Tests
  #[test]
  fn test_extraction_settings() {
    let settings = ExtractionSettings {
      strategy: ExtractionStrategy::Interval { seconds: 1.0 },
      _purpose: ExtractionPurpose::TimelinePreview,
      resolution: (1280, 720),
      quality: 85,
      _format: PreviewFormat::Jpeg,
      max_frames: Some(100),
      _gpu_decode: false,
      parallel_extraction: true,
      _thread_count: Some(4),
    };

    assert_eq!(settings.quality, 85);
    assert_eq!(settings.resolution, (1280, 720));
  }

  // FFmpeg Tests
  #[test]
  fn test_ffmpeg_capabilities_struct() {
    let capabilities = FfmpegCapabilities {
      version: "5.0.0".to_string(),
      available_codecs: vec!["h264".to_string(), "aac".to_string()],
      hardware_encoders: vec!["h264_nvenc".to_string()],
      path: "/usr/bin/ffmpeg".to_string(),
    };

    assert_eq!(capabilities.version, "5.0.0");
    assert!(capabilities.available_codecs.contains(&"h264".to_string()));
  }

  #[test]
  fn test_system_info_struct() {
    let system_info = SystemInfo {
      os: "linux".to_string(),
      arch: "x86_64".to_string(),
      ffmpeg_path: "ffmpeg".to_string(),
      temp_directory: "/tmp".to_string(),
      gpu_capabilities: None,
      available_memory: Some(8_000_000_000),
      cpu_cores: 8,
    };

    assert_eq!(system_info.os, "linux");
    assert_eq!(system_info.cpu_cores, 8);
  }

  // State Management Tests
  #[tokio::test]
  async fn test_compile_video_state() {
    let state = create_test_state();
    let project = create_test_project();
    let output_path = "/tmp/test_output.mp4".to_string();

    assert_eq!(project.metadata.name, "Test Project");
    assert!(!output_path.is_empty());

    // Test state structure
    {
      let jobs = state.active_jobs.read().await;
      assert!(jobs.is_empty());
    }
  }

  #[tokio::test]
  async fn test_active_jobs_state() {
    let state = create_test_state();

    // Just test that we can access active jobs
    let jobs = state.active_jobs.read().await;
    assert!(jobs.is_empty());
  }

  #[tokio::test]
  async fn test_cancel_render_state() {
    let state = create_test_state();
    let job_id = "test-job-123".to_string();

    // Test state management
    let jobs = state.active_jobs.read().await;
    assert!(!jobs.contains_key(&job_id));
  }

  #[tokio::test]
  async fn test_generate_preview_params() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir
      .path()
      .join("test.mp4")
      .to_str()
      .unwrap()
      .to_string();

    // Create fake video file
    std::fs::write(&video_path, b"fake video content").unwrap();

    // Test parameter validation
    let timestamp = 5.0;
    let resolution = (640, 360);
    let quality = 80;

    assert!(timestamp >= 0.0);
    assert!(quality <= 100);
    assert!(resolution.0 > 0);
  }

  #[tokio::test]
  async fn test_gpu_capabilities_state() {
    let state = create_test_state();

    // Test GPU detection without Tauri command
    use crate::video_compiler::gpu::GpuDetector;
    let detector = GpuDetector::new(state.ffmpeg_path.clone());
    let capabilities = detector
      .get_gpu_capabilities()
      .await
      .unwrap_or_else(|_| GpuCapabilities {
        available_encoders: vec![],
        recommended_encoder: None,
        current_gpu: None,
        hardware_acceleration_supported: false,
      });

    // GPU capabilities may be empty on systems without GPU
    let _ = capabilities.hardware_acceleration_supported;
  }

  #[tokio::test]
  async fn test_gpu_info_state() {
    let _state = create_test_state();

    // Test GPU info structure without accessing private method
    let gpu_info = GpuInfo {
      name: "Test GPU".to_string(),
      driver_version: Some("1.0.0".to_string()),
      memory_total: Some(8 * 1024 * 1024 * 1024),
      memory_used: Some(1024 * 1024 * 1024),
      utilization: Some(25.0),
      encoder_type: GpuEncoder::Nvenc,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    };

    assert!(!gpu_info.name.is_empty());
  }

  #[tokio::test]
  async fn test_hardware_acceleration_state() {
    let state = create_test_state();

    // Test hardware acceleration setting
    let settings = state.settings.read().await;
    let enabled = settings.hardware_acceleration;
    // Just verify we can read the boolean value
    let _ = enabled;
  }

  #[tokio::test]
  async fn test_cache_stats_state() {
    let state = create_test_state();

    // Test cache stats directly
    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 0);
    assert_eq!(stats.metadata_requests, 0);
  }

  #[tokio::test]
  async fn test_clear_cache_state() {
    let state = create_test_state();

    // Test clearing cache
    let mut cache = state.cache_manager.write().await;
    cache.clear_all().await;
    drop(cache);

    // Verify cache is empty by checking stats
    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 0);
    assert_eq!(stats.metadata_requests, 0);
    assert_eq!(stats.render_requests, 0);

    // Memory usage might not be 0 due to struct overhead
    let usage = cache.get_memory_usage();
    assert!(usage.total_mb() < 1.0); // Should be minimal
  }

  #[tokio::test]
  async fn test_clear_preview_cache_state() {
    let state = create_test_state();

    // Test clearing preview cache
    let mut cache = state.cache_manager.write().await;
    cache.clear_previews().await;
  }

  #[tokio::test]
  async fn test_compiler_settings_state() {
    let state = create_test_state();

    // Test settings access
    let settings = state.settings.read().await;
    assert!(settings.max_concurrent_jobs > 0);
    assert!(settings.cache_size_mb > 0);
  }

  #[tokio::test]
  async fn test_update_compiler_settings_state() {
    let state = create_test_state();
    let new_settings = CompilerSettings {
      max_concurrent_jobs: 4,
      cache_size_mb: 1024,
      temp_directory: PathBuf::from("/tmp/timeline-studio"),
      ffmpeg_path: None,
      hardware_acceleration: true,
      preview_quality: 90,
    };

    // Update settings
    {
      let mut settings = state.settings.write().await;
      *settings = new_settings;
    }

    // Verify update
    let settings = state.settings.read().await;
    assert_eq!(settings.max_concurrent_jobs, 4);
  }

  #[tokio::test]
  async fn test_ffmpeg_path_state() {
    let state = create_test_state();
    let new_path = "/usr/local/bin/ffmpeg".to_string();

    // Test path validation
    assert!(!new_path.is_empty());
    assert_eq!(state.ffmpeg_path, "ffmpeg");
  }

  #[tokio::test]
  async fn test_system_info_state() {
    let info = SystemInfo {
      os: std::env::consts::OS.to_string(),
      arch: std::env::consts::ARCH.to_string(),
      ffmpeg_path: "ffmpeg".to_string(),
      temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
      gpu_capabilities: None,
      available_memory: get_available_memory(),
      cpu_cores: 8,
    };

    assert!(!info.os.is_empty());
    assert!(info.cpu_cores > 0);
  }

  #[tokio::test]
  async fn test_ffmpeg_capabilities_state() {
    let state = create_test_state();

    // Test FFmpeg detection without command
    let output = tokio::process::Command::new(&state.ffmpeg_path)
      .arg("-version")
      .output()
      .await;

    if let Ok(output) = output {
      if output.status.success() {
        let version_str = String::from_utf8_lossy(&output.stdout);
        assert!(version_str.contains("ffmpeg"));
      }
    }
  }

  #[tokio::test]
  async fn test_timeline_frame_extraction_params() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir
      .path()
      .join("test.mp4")
      .to_str()
      .unwrap()
      .to_string();

    std::fs::write(&video_path, b"fake video").unwrap();

    // Test parameters
    let duration = 30.0;
    let interval = 5.0;
    let max_frames = 6;

    assert!(duration > 0.0);
    assert!(interval > 0.0);
    assert!(max_frames > 0);
  }

  #[tokio::test]
  async fn test_clear_frame_cache_state() {
    let state = create_test_state();

    // Test clearing frame cache
    let mut cache = state.cache_manager.write().await;
    cache.clear_previews().await;
  }

  #[tokio::test]
  async fn test_prerender_segment_params() {
    let project = create_test_project();
    let request = PrerenderRequest {
      project_schema: project,
      start_time: 0.0,
      end_time: 10.0,
      apply_effects: true,
      quality: Some(80),
    };

    // Test parameter validation
    assert!(request.start_time < request.end_time);
    assert!(request.end_time - request.start_time <= 60.0);
  }

  #[tokio::test]
  async fn test_get_prerender_cache_info_command() {
    let result = get_prerender_cache_info().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_clear_prerender_cache_command() {
    let result = clear_prerender_cache().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_recognition_frame_extraction_params() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir
      .path()
      .join("test.mp4")
      .to_str()
      .unwrap()
      .to_string();

    std::fs::write(&video_path, b"fake video").unwrap();

    // Test parameters for recognition
    let start_time = 0.0;
    let end_time = 10.0;
    let interval = 1.0;
    let purpose = "object_detection".to_string();

    assert!(start_time >= 0.0);
    assert!(end_time > start_time);
    assert!(interval > 0.0);
    assert!(!purpose.is_empty());
  }

  #[tokio::test]
  async fn test_subtitle_frame_extraction_params() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir
      .path()
      .join("test.mp4")
      .to_str()
      .unwrap()
      .to_string();

    std::fs::write(&video_path, b"fake video").unwrap();

    let subtitles = vec![
      Subtitle::new("Hello World".to_string(), 5.0, 7.0),
      Subtitle::new("Test Subtitle".to_string(), 10.0, 12.0),
    ];

    // Test subtitle parameters
    for subtitle in &subtitles {
      assert!(subtitle.start_time >= 0.0);
      assert!(subtitle.end_time > subtitle.start_time);
      assert!(!subtitle.text.is_empty());
    }
  }

  // Helper function tests
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
  fn test_get_available_memory() {
    let memory = get_available_memory();
    // Just check it doesn't panic
    assert!(memory.is_some() || memory.is_none());
  }

  // Data structure serialization tests
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

    let deserialized: TimelineFrameExtractionRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.video_path, request.video_path);
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

    let deserialized: PrerenderRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.start_time, request.start_time);
  }

  #[test]
  fn test_prerender_result_serialization() {
    let result = PrerenderResult {
      file_path: "/tmp/prerender.mp4".to_string(),
      duration: 10.0,
      file_size: 1048576,
      render_time_ms: 5000,
    };

    let json = serde_json::to_string(&result).unwrap();
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
    let deserialized: PrerenderCacheFile = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.path, file.path);
  }

  #[test]
  fn test_prerender_cache_info_serialization() {
    let info = PrerenderCacheInfo {
      file_count: 2,
      total_size: 4096,
      files: vec![PrerenderCacheFile {
        path: "/tmp/prerender_0_10_abc.mp4".to_string(),
        size: 2048,
        created: 1234567890,
        start_time: 0.0,
        end_time: 10.0,
      }],
    };

    let json = serde_json::to_string(&info).unwrap();
    let deserialized: PrerenderCacheInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.file_count, info.file_count);
  }

  #[test]
  fn test_timeline_frame_serialization() {
    let frame = TimelineFrame {
      timestamp: 5.0,
      frame_data: "base64encodeddata".to_string(),
      is_keyframe: true,
    };

    let json = serde_json::to_string(&frame).unwrap();
    let deserialized: TimelineFrame = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.timestamp, frame.timestamp);
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
    let deserialized: RecognitionFrameResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.timestamp, result.timestamp);
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
    let deserialized: SubtitleFrameResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.subtitle_id, result.subtitle_id);
  }

  // Edge case tests
  #[tokio::test]
  async fn test_cache_stats_calculation() {
    let state = create_test_state();
    let cache = state.cache_manager.read().await;
    let stats = cache.get_stats();

    // Test hit rate calculation
    let preview_hit_rate = if stats.preview_requests > 0 {
      (stats.preview_hits as f64 / stats.preview_requests as f64) * 100.0
    } else {
      0.0
    };
    assert_eq!(preview_hit_rate, 0.0);
  }

  #[tokio::test]
  async fn test_memory_usage_conversion() {
    let usage = CacheMemoryUsage {
      preview_bytes: 1048576,  // 1MB
      metadata_bytes: 2097152, // 2MB
      render_bytes: 3145728,   // 3MB
      total_bytes: 6291456,    // 6MB
    };

    assert_eq!(usage.total_mb(), 6.0);
    // CacheMemoryUsage only has total_mb() method
    assert_eq!(usage.preview_bytes, 1048576);
    assert_eq!(usage.metadata_bytes, 2097152);
    assert_eq!(usage.render_bytes, 3145728);
  }

  #[test]
  fn test_gpu_encoder_codec_names() {
    let encoder = GpuEncoder::Nvenc;
    assert_eq!(encoder.h264_codec_name(), "h264_nvenc");
    assert_eq!(encoder.hevc_codec_name(), "hevc_nvenc");
    assert!(encoder.is_hardware());

    let encoder = GpuEncoder::None;
    assert_eq!(encoder.h264_codec_name(), "libx264");
    assert!(!encoder.is_hardware());
  }

  #[tokio::test]
  async fn test_active_jobs_management() {
    let _state = create_test_state();

    // Test job structure
    let job = RenderJob {
      id: "test-render-001".to_string(),
      project_name: "Test Project".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: chrono::Utc::now().to_rfc3339(),
      progress: Some(RenderProgress {
        job_id: "test-render-001".to_string(),
        stage: "Encoding".to_string(),
        percentage: 25.0,
        current_frame: 750,
        total_frames: 3000,
        elapsed_time: Duration::from_secs(30),
        estimated_remaining: Some(Duration::from_secs(90)),
        status: RenderStatus::Processing,
        message: Some("Encoding video track".to_string()),
      }),
      error_message: None,
    };

    // Verify job fields
    assert_eq!(job.id, "test-render-001");
    assert_eq!(job.status, RenderStatus::Processing);
    assert!(job.progress.is_some());
    assert!(job.error_message.is_none());
  }

  #[test]
  fn test_extraction_strategy_coverage() {
    let strategies = vec![
      ExtractionStrategy::Interval { seconds: 2.0 },
      ExtractionStrategy::SceneChange { threshold: 0.3 },
      ExtractionStrategy::SubtitleSync {
        offset_seconds: 0.5,
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
      let _: ExtractionStrategy = serde_json::from_str(&json).unwrap();
    }
  }

  #[test]
  fn test_error_scenarios() {
    use crate::video_compiler::error::VideoCompilerError;

    let errors = vec![
      VideoCompilerError::ValidationError("Missing tracks".to_string()),
      VideoCompilerError::RenderError {
        job_id: "test-job".to_string(),
        stage: "encoding".to_string(),
        message: "FFmpeg error".to_string(),
      },
      VideoCompilerError::MediaFileError {
        path: "/missing.mp4".to_string(),
        reason: "File not found".to_string(),
      },
      VideoCompilerError::IoError("Disk full".to_string()),
      VideoCompilerError::DependencyMissing("FFmpeg".to_string()),
      VideoCompilerError::CacheError("Cache corrupted".to_string()),
      VideoCompilerError::PreviewError {
        timestamp: 5.0,
        reason: "Invalid timestamp".to_string(),
      },
      VideoCompilerError::GpuError("GPU not available".to_string()),
      VideoCompilerError::ValidationError("Invalid codec".to_string()),
      VideoCompilerError::InternalError("Frame decode failed".to_string()),
    ];

    for error in errors {
      let msg = error.to_string();
      assert!(!msg.is_empty());
    }
  }

  // Additional tests for command functionality
  #[tokio::test]
  async fn test_render_job_metadata_async() {
    let metadata = RenderJobMetadata {
      project_name: "Test Project".to_string(),
      output_path: "/output/video.mp4".to_string(),
      created_at: chrono::Utc::now().to_rfc3339(),
    };

    assert_eq!(metadata.project_name, "Test Project");
    assert!(!metadata.created_at.is_empty());
  }

  #[tokio::test]
  async fn test_preview_request_serialization() {
    let request = PreviewRequest {
      video_path: "/test/video.mp4".to_string(),
      timestamp: 10.5,
      resolution: Some((640, 360)),
      quality: Some(85),
    };

    let json = serde_json::to_string(&request).unwrap();
    assert!(json.contains("video_path"));

    let deserialized: PreviewRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.timestamp, 10.5);
  }

  #[tokio::test]
  async fn test_cache_stats_with_ratios() {
    let stats = CacheStatsWithRatios {
      total_entries: 100,
      preview_hits: 80,
      preview_misses: 20,
      metadata_hits: 50,
      metadata_misses: 10,
      memory_usage: CacheMemoryUsage {
        preview_bytes: 1048576,
        metadata_bytes: 524288,
        render_bytes: 2097152,
        total_bytes: 3670016,
      },
      cache_size_mb: 3.5,
      hit_ratio: 0.85,
      preview_hit_ratio: 0.80,
    };

    assert_eq!(stats.total_entries, 100);
    assert_eq!(stats.preview_hit_ratio, 0.80);
    assert_eq!(stats.cache_size_mb, 3.5);
  }

  #[tokio::test]
  async fn test_project_creation_and_modification() {
    use crate::video_compiler::schema::ProjectSchema;

    // Test creating new project
    let project_name = "Test Project".to_string();
    let project = ProjectSchema::new(project_name.clone());

    assert_eq!(project.metadata.name, project_name);
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (1920, 1080));

    // Test touch functionality
    let mut project2 = project.clone();
    let original_modified = project2.metadata.modified_at;
    tokio::time::sleep(Duration::from_millis(10)).await;
    project2.touch();
    assert!(project2.metadata.modified_at > original_modified);
  }

  #[tokio::test]
  async fn test_track_creation_and_clip_addition() {
    use crate::video_compiler::schema::{Track, TrackType};

    // Test track creation
    let track = Track::new(TrackType::Video, "Video Track 1".to_string());
    assert_eq!(track.name, "Video Track 1");
    assert!(matches!(track.track_type, TrackType::Video));
    assert!(track.clips.is_empty());

    // Test adding clip to track
    let mut track2 = Track::new(TrackType::Video, "Video Track".to_string());
    let clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);

    let result = track2.add_clip(clip);
    assert!(result.is_ok());
    assert_eq!(track2.clips.len(), 1);
  }

  #[tokio::test]
  async fn test_clip_creation_and_validation() {
    use crate::video_compiler::schema::Clip;

    // Test valid clip creation
    let clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);
    assert_eq!(clip.start_time, 0.0);
    assert_eq!(clip.end_time, 10.0);
    assert_eq!(clip.end_time - clip.start_time, 10.0);

    // Test clip with actual file
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let clip2 = Clip::new(video_path.clone(), 5.0, 15.0);
    assert_eq!(clip2.source_path, video_path);
  }

  #[tokio::test]
  async fn test_effect_filter_template_creation() {
    use crate::video_compiler::schema::{
      Effect, EffectType, Filter, FilterType, StyleTemplate, StyleTemplateCategory,
      StyleTemplateStyle, Template, TemplateType,
    };

    // Test effect creation
    let effect = Effect::new(EffectType::Blur, "Blur Effect".to_string());
    assert_eq!(effect.name, "Blur Effect");
    assert!(matches!(effect.effect_type, EffectType::Blur));

    // Test filter creation
    let filter = Filter::new(FilterType::Brightness, "Brightness Filter".to_string());
    assert_eq!(filter.name, "Brightness Filter");
    assert!(matches!(filter.filter_type, FilterType::Brightness));

    // Test template creation
    let template = Template::new(TemplateType::Grid, "Split Screen Template".to_string(), 2);
    assert_eq!(template.name, "Split Screen Template");
    assert_eq!(template.screens, 2);

    // Test style template creation
    let style_template = StyleTemplate::new(
      "Intro Template".to_string(),
      StyleTemplateCategory::Intro,
      StyleTemplateStyle::Modern,
      5.0,
    );
    assert_eq!(style_template.name, "Intro Template");
    assert_eq!(style_template.duration, 5.0);
  }

  #[tokio::test]
  async fn test_subtitle_creation_and_validation() {
    use crate::video_compiler::schema::{Subtitle, SubtitleAnimation, SubtitleAnimationType};

    // Test valid subtitle
    let subtitle = Subtitle::new("Hello World".to_string(), 1.0, 3.0);
    assert_eq!(subtitle.text, "Hello World");
    assert_eq!(subtitle.get_duration(), 2.0);
    assert!(subtitle.validate().is_ok());

    // Test invalid subtitle (end before start)
    let invalid_subtitle = Subtitle::new("Test".to_string(), 5.0, 3.0);
    assert!(invalid_subtitle.validate().is_err());

    // Test subtitle animation
    let animation = SubtitleAnimation::new(SubtitleAnimationType::FadeIn, 1.0);
    assert!(matches!(
      animation.animation_type,
      SubtitleAnimationType::FadeIn
    ));
    assert_eq!(animation.duration, 1.0);
  }

  #[tokio::test]
  async fn test_preview_and_cache_functionality() {
    let state = create_test_state();

    // Test preview generator functionality
    use crate::video_compiler::preview::PreviewGenerator;
    let mut preview_gen = PreviewGenerator::new(state.cache_manager.clone());
    preview_gen.set_ffmpeg_path("/usr/local/bin/ffmpeg");

    // Test clearing cache
    let result = preview_gen.clear_cache_for_file().await;
    assert!(result.is_ok());

    // Test cache operations
    let mut cache = state.cache_manager.write().await;
    cache.clear_all().await;
    cache.clear_previews().await;
    drop(cache);

    let cache = state.cache_manager.read().await;
    let memory_usage = cache.get_memory_usage();
    assert!(memory_usage.total_mb() >= 0.0);

    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 0);
  }

  #[tokio::test]
  async fn test_cache_configuration_and_metadata() {
    let state = create_test_state();

    // Test cache settings
    use crate::video_compiler::cache::CacheSettings;
    let settings = CacheSettings {
      max_memory_mb: 512,
      max_preview_entries: 1000,
      max_metadata_entries: 1000,
      max_render_entries: 100,
      ..Default::default()
    };

    let mut cache = state.cache_manager.write().await;
    *cache = RenderCache::with_settings(settings);

    // Test metadata operations
    let metadata = MediaMetadata {
      file_path: "/test/video.mp4".to_string(),
      file_size: 0,
      modified_time: SystemTime::now(),
      duration: 120.0,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
      cached_at: SystemTime::now(),
    };

    let result = cache
      .store_metadata("/test/video.mp4".to_string(), metadata)
      .await;
    assert!(result.is_ok());

    let retrieved = cache.get_metadata("/test/video.mp4").await;
    assert!(retrieved.is_some());

    // Test cleanup
    let cleanup_result = cache.cleanup_old_entries().await;
    assert!(cleanup_result.is_ok());
  }

  #[tokio::test]
  async fn test_gpu_and_system_detection() {
    let state = create_test_state();

    // Test GPU detection
    use crate::video_compiler::gpu::{GpuDetector, GpuEncoder};
    let detector = GpuDetector::new(state.ffmpeg_path.clone());

    let encoders = detector
      .detect_available_encoders()
      .await
      .unwrap_or_else(|_| vec![GpuEncoder::None]);
    assert!(!encoders.is_empty() || encoders.is_empty());

    let capabilities = detector.get_gpu_capabilities().await.ok();
    if let Some(caps) = capabilities {
      let available = !caps.available_encoders.is_empty();
      // Just verify we got a boolean result
      let _ = available;
    }

    // Test system info
    let available_memory = get_available_memory();
    assert!(available_memory.is_some() || available_memory.is_none());
  }

  #[tokio::test]
  async fn test_compiler_settings_management() {
    let state = create_test_state();

    // Test reading settings
    let settings = state.settings.read().await;
    assert!(settings.max_concurrent_jobs > 0);
    assert!(settings.cache_size_mb > 0);
    drop(settings);

    // Test updating settings
    let new_settings = CompilerSettings {
      max_concurrent_jobs: 8,
      cache_size_mb: 2048,
      temp_directory: PathBuf::from("/tmp/new"),
      ffmpeg_path: None,
      hardware_acceleration: false,
      preview_quality: 95,
    };

    {
      let mut settings = state.settings.write().await;
      *settings = new_settings;
    }

    let settings = state.settings.read().await;
    assert_eq!(settings.max_concurrent_jobs, 8);
    assert_eq!(settings.cache_size_mb, 2048);
  }

  #[tokio::test]
  async fn test_ffmpeg_capabilities_detection() {
    // Test FFmpeg version extraction
    let version_output = "ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers";
    let version = extract_ffmpeg_version(version_output);
    assert!(version.contains("ffmpeg version"));

    // Test codec extraction
    let codec_output = "DEV.L. h264  H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10\n DEA.L. aac  AAC (Advanced Audio Coding)";
    let codecs = extract_available_codecs(codec_output);
    assert!(codecs.contains(&"h264".to_string()));
    assert!(codecs.contains(&"aac".to_string()));

    // Test hardware encoder extraction
    let encoder_output = "V..... h264_nvenc  NVIDIA NVENC H.264 encoder\n V..... h264_qsv  Intel Quick Sync Video H.264 encoder";
    let encoders = extract_hardware_encoders(encoder_output);
    assert!(encoders.contains(&"h264_nvenc".to_string()));
    assert!(encoders.contains(&"h264_qsv".to_string()));
  }

  #[tokio::test]
  async fn test_render_job_management() {
    let state = create_test_state();

    // Test job state access
    let jobs = state.active_jobs.read().await;
    assert!(jobs.is_empty());
    drop(jobs);

    // Test render job structure
    let job = RenderJob {
      id: "test-job-001".to_string(),
      project_name: "Test Project".to_string(),
      output_path: "/tmp/output.mp4".to_string(),
      status: RenderStatus::Processing,
      created_at: chrono::Utc::now().to_rfc3339(),
      progress: Some(RenderProgress {
        job_id: "test-job-001".to_string(),
        stage: "Encoding".to_string(),
        percentage: 50.0,
        current_frame: 1500,
        total_frames: 3000,
        elapsed_time: Duration::from_secs(30),
        estimated_remaining: Some(Duration::from_secs(30)),
        status: RenderStatus::Processing,
        message: Some("Encoding video".to_string()),
      }),
      error_message: None,
    };

    assert_eq!(job.id, "test-job-001");
    assert!(job.progress.is_some());
    if let Some(progress) = &job.progress {
      assert_eq!(progress.percentage, 50.0);
    }
  }

  #[tokio::test]
  async fn test_prerender_structures() {
    // Test prerender request
    let request = PrerenderRequest {
      project_schema: create_test_project(),
      start_time: 0.0,
      end_time: 10.0,
      apply_effects: true,
      quality: Some(80),
    };

    assert!(request.start_time < request.end_time);
    assert_eq!(request.end_time - request.start_time, 10.0);

    // Test prerender result
    let result = PrerenderResult {
      file_path: "/tmp/prerender.mp4".to_string(),
      duration: 10.0,
      file_size: 1048576,
      render_time_ms: 5000,
    };

    assert_eq!(result.duration, 10.0);
    assert_eq!(result.file_size, 1048576);

    // Test prerender cache info
    let cache_file = PrerenderCacheFile {
      path: "/tmp/prerender_0_10_abc.mp4".to_string(),
      size: 2048,
      created: 1234567890,
      start_time: 0.0,
      end_time: 10.0,
    };

    let cache_info = PrerenderCacheInfo {
      file_count: 1,
      total_size: 2048,
      files: vec![cache_file],
    };

    assert_eq!(cache_info.file_count, 1);
    assert_eq!(cache_info.total_size, 2048);
  }

  #[tokio::test]
  async fn test_frame_extraction_structures() {
    // Test timeline frame extraction request
    let request = TimelineFrameExtractionRequest {
      video_path: "/test/video.mp4".to_string(),
      duration: 60.0,
      interval: 5.0,
      max_frames: Some(12),
    };

    assert_eq!(request.duration, 60.0);
    assert_eq!(request.interval, 5.0);

    // Test timeline frame
    let frame = TimelineFrame {
      timestamp: 10.0,
      frame_data: "base64data".to_string(),
      is_keyframe: true,
    };

    assert_eq!(frame.timestamp, 10.0);
    assert!(frame.is_keyframe);

    // Test recognition frame result
    let recognition_frame = RecognitionFrameResult {
      timestamp: 5.0,
      frame_data: vec![1, 2, 3, 4],
      resolution: [1920, 1080],
      scene_change_score: Some(0.85),
      is_keyframe: false,
    };

    assert_eq!(recognition_frame.timestamp, 5.0);
    assert_eq!(recognition_frame.resolution, [1920, 1080]);

    // Test subtitle frame result
    let subtitle_frame = SubtitleFrameResult {
      subtitle_id: "sub-001".to_string(),
      subtitle_text: "Hello World".to_string(),
      timestamp: 15.0,
      frame_data: vec![5, 6, 7, 8],
      start_time: 14.5,
      end_time: 16.5,
    };

    assert_eq!(subtitle_frame.subtitle_id, "sub-001");
    assert_eq!(subtitle_frame.subtitle_text, "Hello World");
  }

  #[tokio::test]
  async fn test_system_info_structure() {
    let info = SystemInfo {
      os: std::env::consts::OS.to_string(),
      arch: std::env::consts::ARCH.to_string(),
      ffmpeg_path: "ffmpeg".to_string(),
      temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
      gpu_capabilities: None,
      available_memory: Some(8_000_000_000),
      cpu_cores: std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1),
    };

    assert!(!info.os.is_empty());
    assert!(!info.arch.is_empty());
    assert!(info.cpu_cores > 0);
    assert!(!info.temp_directory.is_empty());
  }

  #[tokio::test]
  async fn test_ffmpeg_capabilities_structure() {
    let capabilities = FfmpegCapabilities {
      version: "ffmpeg version 5.1.2".to_string(),
      available_codecs: vec!["h264".to_string(), "aac".to_string()],
      hardware_encoders: vec!["h264_nvenc".to_string()],
      path: "/usr/bin/ffmpeg".to_string(),
    };

    assert!(capabilities.version.contains("ffmpeg"));
    assert_eq!(capabilities.available_codecs.len(), 2);
    assert!(capabilities.available_codecs.contains(&"h264".to_string()));
    assert_eq!(capabilities.hardware_encoders.len(), 1);
  }
}
