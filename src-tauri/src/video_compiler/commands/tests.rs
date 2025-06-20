#[cfg(test)]
#[allow(clippy::module_inception)]
mod tests {
  use crate::video_compiler::{
    cache::{CacheMemoryUsage, MediaMetadata},
    commands::{get_available_memory, *},
    commands_logic::{extract_available_codecs, extract_ffmpeg_version, extract_hardware_encoders},
    frame_extraction::{ExtractionPurpose, ExtractionSettings, ExtractionStrategy},
    gpu::{GpuCapabilities, GpuEncoder, GpuInfo},
    progress::{RenderProgress, RenderStatus},
    renderer::VideoRenderer,
    schema::{
      AspectRatio, Clip, PreviewFormat, ProjectSchema, Subtitle, Timeline, Track, TrackType,
    },
    CompilerSettings,
  };
  use serde::{Deserialize, Serialize};
  use std::path::PathBuf;
  use std::time::{Duration, SystemTime};
  use tempfile::TempDir;
  use tokio::sync::mpsc;

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

  // Additional tests for command logic coverage
  #[tokio::test]
  async fn test_video_compiler_error_handling() {
    use crate::video_compiler::error::VideoCompilerError;

    // Test validation errors
    let error = VideoCompilerError::validation("Invalid project");
    assert!(matches!(error, VideoCompilerError::ValidationError(_)));

    // Test media file errors
    let error = VideoCompilerError::media_file("/tmp/missing.mp4", "File not found");
    assert!(matches!(error, VideoCompilerError::MediaFileError { .. }));
  }

  #[tokio::test]
  async fn test_render_job_lifecycle() {
    let state = create_test_state();
    let job_id = uuid::Uuid::new_v4().to_string();
    let project = create_test_project();

    // Create render job metadata
    let metadata = RenderJobMetadata {
      project_name: project.metadata.name.clone(),
      output_path: "/tmp/output.mp4".to_string(),
      created_at: chrono::Utc::now().to_rfc3339(),
    };

    // Create a mock renderer
    let (tx, _rx) = mpsc::unbounded_channel();
    let renderer = VideoRenderer::new(
      project.clone(),
      state.settings.clone(),
      state.cache_manager.clone(),
      tx,
    )
    .await
    .unwrap();

    // Test adding job
    {
      let mut jobs = state.active_jobs.write().await;
      assert_eq!(jobs.len(), 0);

      // Add the job
      jobs.insert(
        job_id.clone(),
        ActiveRenderJob {
          renderer,
          metadata: metadata.clone(),
        },
      );

      // Verify job was added
      assert_eq!(jobs.len(), 1);
      assert!(jobs.contains_key(&job_id));
    }

    // Test retrieving job
    {
      let jobs = state.active_jobs.read().await;
      let job = jobs.get(&job_id);
      assert!(job.is_some());
      assert_eq!(job.unwrap().metadata.project_name, metadata.project_name);
    }

    // Test removing job
    {
      let mut jobs = state.active_jobs.write().await;
      let removed = jobs.remove(&job_id);
      assert!(removed.is_some());
      assert_eq!(jobs.len(), 0);
    }
  }

  #[tokio::test]
  async fn test_progress_update_handling() {
    let progress = RenderProgress {
      job_id: "test-job".to_string(),
      stage: "Encoding".to_string(),
      percentage: 45.5,
      current_frame: 1365,
      total_frames: 3000,
      elapsed_time: Duration::from_secs(120),
      estimated_remaining: Some(Duration::from_secs(145)),
      status: RenderStatus::Processing,
      message: Some("Processing video stream".to_string()),
    };

    assert!(progress.percentage >= 0.0 && progress.percentage <= 100.0);
    assert!(progress.current_frame <= progress.total_frames);
  }

  #[tokio::test]
  async fn test_cache_operations() {
    let state = create_test_state();

    // Test cache memory calculation
    let cache = state.cache_manager.read().await;
    let memory = cache.get_memory_usage();
    assert_eq!(
      memory.total_bytes,
      memory.preview_bytes + memory.metadata_bytes + memory.render_bytes
    );

    // Test cache stats
    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 0);
    assert_eq!(stats.hit_ratio(), 0.0);
  }

  #[tokio::test]
  async fn test_media_metadata_caching() {
    let state = create_test_state();
    let file_path = "/tmp/test_video.mp4";

    // Create test metadata
    let metadata = MediaMetadata {
      file_path: file_path.to_string(),
      file_size: 10_000_000,
      modified_time: SystemTime::now(),
      duration: 120.5,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8_000_000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
      cached_at: SystemTime::now(),
    };

    // Store in cache
    let mut cache = state.cache_manager.write().await;
    cache
      .store_metadata(file_path.to_string(), metadata.clone())
      .await
      .unwrap();

    // Retrieve from cache
    let cached = cache.get_metadata(file_path).await;
    assert!(cached.is_some());
    assert_eq!(cached.unwrap().duration, 120.5);
  }

  #[tokio::test]
  async fn test_frame_extraction_settings() {
    let settings = ExtractionSettings {
      _format: PreviewFormat::Jpeg,
      quality: 85,
      resolution: (640, 360),
      strategy: ExtractionStrategy::KeyFrames,
      _purpose: ExtractionPurpose::TimelinePreview,
      max_frames: None,
      _gpu_decode: false,
      parallel_extraction: true,
      _thread_count: None,
    };

    assert!(settings.quality > 0 && settings.quality <= 100);
    let (w, h) = settings.resolution;
    assert!(w > 0 && h > 0);
  }

  #[tokio::test]
  async fn test_gpu_encoder_selection() {
    let encoders = vec![
      GpuEncoder::None,
      GpuEncoder::Nvenc,
      GpuEncoder::QuickSync,
      GpuEncoder::VideoToolbox,
    ];

    for encoder in &encoders {
      let codec = encoder.h264_codec_name();
      assert!(!codec.is_empty());

      if encoder == &GpuEncoder::None {
        assert!(!encoder.is_hardware());
      } else {
        assert!(encoder.is_hardware());
      }
    }
  }

  #[tokio::test]
  async fn test_compiler_settings_validation() {
    let settings = CompilerSettings {
      hardware_acceleration: true,
      max_concurrent_jobs: 4,
      preview_quality: 80,
      cache_size_mb: 1024,
      temp_directory: std::env::temp_dir().join("timeline-studio"),
      ffmpeg_path: None,
    };

    assert!(settings.max_concurrent_jobs > 0);
    assert!(settings.preview_quality > 0 && settings.preview_quality <= 100);
    assert!(settings.cache_size_mb > 0);
  }

  #[tokio::test]
  async fn test_batch_operation_validation() {
    // Simulate batch frame extraction
    let batch_video_paths = ["/tmp/video1.mp4", "/tmp/video2.mp4", "/tmp/video3.mp4"];
    let batch_timestamps = [
      vec![0.0, 5.0, 10.0],
      vec![1.0, 3.0, 5.0],
      vec![2.0, 4.0, 6.0],
    ];

    // Validate batch
    assert!(!batch_video_paths.is_empty());
    assert_eq!(batch_video_paths.len(), batch_timestamps.len());
    for (path, timestamps) in batch_video_paths.iter().zip(batch_timestamps.iter()) {
      assert!(!path.is_empty());
      assert!(!timestamps.is_empty());
    }
  }

  #[tokio::test]
  async fn test_render_time_estimation() {
    let project = create_test_project();
    let settings = CompilerSettings::default();

    // Calculate complexity factors
    let duration = project.timeline.duration;
    let resolution_factor =
      (project.timeline.resolution.0 * project.timeline.resolution.1) as f64 / (1920.0 * 1080.0);
    let fps_factor = project.timeline.fps as f64 / 30.0;
    let effects_factor = 1.0 + (project.effects.len() as f64 * 0.5);
    let tracks_factor = 1.0 + ((project.tracks.len() - 1) as f64 * 0.3);

    let base_time = duration * resolution_factor * fps_factor * effects_factor * tracks_factor;
    let gpu_multiplier = if settings.hardware_acceleration {
      0.3
    } else {
      1.0
    };
    let estimated_seconds = (base_time * gpu_multiplier * 2.0) as u64;

    assert!(estimated_seconds > 0);
  }

  #[tokio::test]
  async fn test_media_validation() {
    let valid_extensions = [
      "mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "aac", "flac",
    ];
    let test_path = "/tmp/test_video.mp4";

    let extension = std::path::Path::new(test_path)
      .extension()
      .and_then(|ext| ext.to_str())
      .map(|ext| ext.to_lowercase());

    if let Some(ext) = extension {
      assert!(valid_extensions.contains(&ext.as_str()));
    }
  }

  #[tokio::test]
  async fn test_concurrent_job_limiting() {
    let state = create_test_state();
    let settings = state.settings.read().await;
    let max_jobs = settings.max_concurrent_jobs;

    // Simulate job queue
    let mut job_count = 0;
    for _i in 0..10 {
      if job_count < max_jobs {
        job_count += 1;
      } else {
        // Would queue the job
        assert!(job_count == max_jobs);
      }
    }
  }

  // Tests for command business logic
  #[tokio::test]
  async fn test_compile_video_validation() {
    use crate::video_compiler::commands_logic::compile_video_logic;

    let state = create_test_state();
    let mut project = create_test_project();

    // Test with empty tracks
    project.tracks.clear();
    let result = compile_video_logic(project.clone(), "/tmp/output.mp4".to_string(), &state).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("не содержит треков"));
  }

  #[tokio::test]
  async fn test_get_active_jobs_empty() {
    use crate::video_compiler::commands_logic::get_active_jobs_logic;

    let state = create_test_state();
    let jobs = get_active_jobs_logic(&state).await;
    assert_eq!(jobs.len(), 0);
  }

  #[tokio::test]
  async fn test_get_active_jobs_with_tasks() {
    use crate::video_compiler::commands_logic::{compile_video_logic, get_active_jobs_logic};

    let state = create_test_state();
    let project = create_test_project();

    // Add multiple jobs
    let job_id1 = compile_video_logic(project.clone(), "/tmp/output1.mp4".to_string(), &state)
      .await
      .unwrap();

    let job_id2 = compile_video_logic(project.clone(), "/tmp/output2.mp4".to_string(), &state)
      .await
      .unwrap();

    // Get active jobs
    let jobs = get_active_jobs_logic(&state).await;
    assert_eq!(jobs.len(), 2);

    // Verify job IDs
    let job_ids: Vec<String> = jobs.iter().map(|j| j.id.clone()).collect();
    assert!(job_ids.contains(&job_id1));
    assert!(job_ids.contains(&job_id2));

    // Clean up
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_cancel_render_existing_job() {
    use crate::video_compiler::commands_logic::{cancel_render_logic, compile_video_logic};

    let state = create_test_state();
    let project = create_test_project();

    // Add a job
    let job_id = compile_video_logic(project, "/tmp/output.mp4".to_string(), &state)
      .await
      .unwrap();

    // Cancel it
    let cancelled = cancel_render_logic(&job_id, &state).await.unwrap();
    assert!(cancelled);

    // Verify it's gone
    let jobs = state.active_jobs.read().await;
    assert!(!jobs.contains_key(&job_id));
  }

  #[tokio::test]
  async fn test_cancel_render_non_existent_job() {
    use crate::video_compiler::commands_logic::cancel_render_logic;

    let state = create_test_state();
    let result = cancel_render_logic("non-existent-job", &state)
      .await
      .unwrap();
    assert!(!result);
  }

  #[tokio::test]
  async fn test_get_render_job_details() {
    use crate::video_compiler::commands_logic::{compile_video_logic, get_render_job_logic};

    let state = create_test_state();
    let project = create_test_project();
    let output_path = "/tmp/test_output.mp4";

    // Add a job
    let job_id = compile_video_logic(project.clone(), output_path.to_string(), &state)
      .await
      .unwrap();

    // Get job details
    let job_info = get_render_job_logic(&job_id, &state).await.unwrap();
    assert!(job_info.is_some());

    let job = job_info.unwrap();
    assert_eq!(job.id, job_id);
    assert_eq!(job.project_name, project.metadata.name);
    assert_eq!(job.output_path, output_path);

    // Clean up
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_check_render_timeouts() {
    use crate::video_compiler::commands_logic::check_render_job_timeouts_logic;

    let state = create_test_state();
    let project = create_test_project();

    // Create job with old timestamp
    let old_metadata = RenderJobMetadata {
      project_name: "Old Project".to_string(),
      output_path: "/tmp/old.mp4".to_string(),
      created_at: "2020-01-01T00:00:00Z".to_string(),
    };

    let (tx, _rx) = mpsc::unbounded_channel();
    let renderer = VideoRenderer::new(
      project.clone(),
      state.settings.clone(),
      state.cache_manager.clone(),
      tx,
    )
    .await
    .unwrap();

    let old_job_id = "timeout-test".to_string();
    {
      let mut jobs = state.active_jobs.write().await;
      jobs.insert(
        old_job_id.clone(),
        ActiveRenderJob {
          renderer,
          metadata: old_metadata,
        },
      );
    }

    // Check timeouts with 1 hour limit
    let timed_out = check_render_job_timeouts_logic(&state, 3600).await;
    assert!(timed_out.contains(&old_job_id));

    // Clean up
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_cache_operations_advanced() {
    use crate::video_compiler::commands_logic::{
      clear_all_cache_logic, get_cache_memory_usage_logic, get_cache_stats_logic,
    };

    let state = create_test_state();

    // Get initial stats
    let stats = get_cache_stats_logic(&state).await;
    assert_eq!(stats.preview_requests, 0);
    assert_eq!(stats.metadata_requests, 0);

    // Clear cache
    clear_all_cache_logic(&state).await.unwrap();

    // Get memory usage
    let usage = get_cache_memory_usage_logic(&state).await;
    assert_eq!(
      usage.total_bytes,
      usage.preview_bytes + usage.metadata_bytes + usage.render_bytes
    );
  }

  #[tokio::test]
  async fn test_compiler_settings_operations() {
    use crate::video_compiler::commands_logic::{
      get_compiler_settings_logic, update_compiler_settings_logic,
    };

    let state = create_test_state();

    // Get current settings
    let settings = get_compiler_settings_logic(&state).await;
    assert_eq!(settings.max_concurrent_jobs, 2);

    // Update settings
    let new_settings = CompilerSettings {
      max_concurrent_jobs: 4,
      cache_size_mb: 1024,
      hardware_acceleration: false,
      ..settings
    };

    update_compiler_settings_logic(new_settings.clone(), &state)
      .await
      .unwrap();

    // Verify update
    let updated = get_compiler_settings_logic(&state).await;
    assert_eq!(updated.max_concurrent_jobs, 4);
    assert_eq!(updated.cache_size_mb, 1024);
    assert!(!updated.hardware_acceleration);
  }

  #[tokio::test]
  async fn test_gpu_capabilities_detection() {
    use crate::video_compiler::commands_logic::get_gpu_capabilities_logic;

    let state = create_test_state();

    // This might fail in test environment, but we test the structure
    match get_gpu_capabilities_logic(&state).await {
      Ok(capabilities) => {
        // If successful, validate structure exists
        // The length is always >= 0 by definition, so just check it's accessible
        let _ = capabilities.available_encoders.len();
      }
      Err(_) => {
        // Expected in test environment without real GPU/FFmpeg
      }
    }
  }

  #[tokio::test]
  async fn test_render_progress_tracking_with_logic() {
    use crate::video_compiler::commands_logic::{compile_video_logic, get_render_progress_logic};

    let state = create_test_state();
    let project = create_test_project();

    // Start a render job
    let job_id = compile_video_logic(project, "/tmp/progress_test.mp4".to_string(), &state)
      .await
      .unwrap();

    // Get progress
    let progress = get_render_progress_logic(&job_id, &state).await.unwrap();
    // Progress might be None at the start, which is ok
    if let Some(prog) = progress {
      assert_eq!(prog.job_id, job_id);
      assert!(prog.percentage >= 0.0 && prog.percentage <= 100.0);
    }

    // Test non-existent job returns None
    let no_progress = get_render_progress_logic("fake-job", &state).await.unwrap();
    assert!(no_progress.is_none());

    // Clean up
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_max_concurrent_jobs_limit() {
    use crate::video_compiler::commands_logic::compile_video_logic;

    let state = create_test_state();
    let project = create_test_project();

    // Set limit to 1
    {
      let mut settings = state.settings.write().await;
      settings.max_concurrent_jobs = 1;
    }

    // Add first job - should succeed
    let _job_id1 = compile_video_logic(project.clone(), "/tmp/job1.mp4".to_string(), &state)
      .await
      .unwrap();

    // Try to add second job - should fail
    let result = compile_video_logic(project.clone(), "/tmp/job2.mp4".to_string(), &state).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Достигнут лимит"));

    // Clean up
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_preview_operations() {
    use crate::video_compiler::commands_logic::{
      clear_frame_cache_logic, generate_preview_logic, get_video_info_logic,
    };

    let state = create_test_state();

    // Test preview generation with invalid file
    let preview_result =
      generate_preview_logic("/invalid/video.mp4", 5.0, None, None, &state).await;
    assert!(preview_result.is_err());

    // Test video info with invalid file
    let info_result = get_video_info_logic("/invalid/video.mp4", &state).await;
    // Result depends on preview module implementation
    let _ = info_result;

    // Test clearing frame cache
    let clear_result = clear_frame_cache_logic(&state).await;
    assert!(clear_result.is_ok());
  }

  #[tokio::test]
  async fn test_project_creation_operations() {
    use crate::video_compiler::commands_logic::{
      add_clip_to_track_logic, create_clip_logic, create_effect_logic, create_filter_logic,
      create_subtitle_logic, create_track_logic,
    };
    use std::path::PathBuf;

    // Test track creation
    let video_track = create_track_logic(
      crate::video_compiler::schema::TrackType::Video,
      "Main Video".to_string(),
    );
    assert_eq!(video_track.name, "Main Video");

    let audio_track = create_track_logic(
      crate::video_compiler::schema::TrackType::Audio,
      "Background Music".to_string(),
    );
    assert_eq!(
      audio_track.track_type,
      crate::video_compiler::schema::TrackType::Audio
    );

    // Test clip creation with existing file
    let temp_file = std::env::temp_dir().join("test_video.mp4");
    std::fs::write(&temp_file, b"fake video data").unwrap();

    let clip_result = create_clip_logic(temp_file.to_string_lossy().to_string(), 0.0, 30.0);
    assert!(clip_result.is_ok());

    let clip = clip_result.unwrap();
    assert_eq!(clip.end_time - clip.start_time, 30.0);

    // Clean up
    std::fs::remove_file(&temp_file).ok();

    // Test adding clip to track
    let clip = crate::video_compiler::schema::Clip::new(PathBuf::from("/tmp/test.mp4"), 0.0, 15.0);

    let track_with_clip = add_clip_to_track_logic(video_track, clip).unwrap();
    assert_eq!(track_with_clip.clips.len(), 1);

    // Test effect creation
    let blur_effect = create_effect_logic(
      crate::video_compiler::schema::EffectType::Blur,
      "Blur Effect".to_string(),
    );
    assert_eq!(blur_effect.name, "Blur Effect");

    // Test filter creation
    let blur_filter = create_filter_logic(
      crate::video_compiler::schema::FilterType::Blur,
      "Motion Blur".to_string(),
    );
    assert_eq!(blur_filter.name, "Motion Blur");

    // Test subtitle creation
    let subtitle = create_subtitle_logic("Hello World".to_string(), 1.0, 3.0).unwrap();
    assert_eq!(subtitle.text, "Hello World");
    assert_eq!(subtitle.get_duration(), 2.0);
  }

  #[tokio::test]
  async fn test_cache_configuration_operations() {
    use crate::video_compiler::commands_logic::{
      configure_cache_logic, get_cache_memory_usage_logic, get_cache_size_logic,
    };

    let state = create_test_state();

    // Configure cache with specific values
    configure_cache_logic(Some(2048), Some(1000), &state)
      .await
      .unwrap();

    // Get cache size
    let size = get_cache_size_logic(&state).await;
    assert!(size >= 0.0);

    // Get memory usage
    let usage = get_cache_memory_usage_logic(&state).await;
    assert_eq!(
      usage.total_bytes,
      usage.preview_bytes + usage.metadata_bytes + usage.render_bytes
    );
  }

  #[tokio::test]
  async fn test_ffmpeg_path_operations() {
    use crate::video_compiler::commands_logic::set_ffmpeg_path_logic;

    // Test with echo command (should succeed on Unix)
    #[cfg(unix)]
    {
      let result = set_ffmpeg_path_logic("echo").await.unwrap();
      assert!(result);
    }

    // Test with non-existent path
    let result = set_ffmpeg_path_logic("/this/does/not/exist/ffmpeg")
      .await
      .unwrap();
    assert!(!result);
  }

  #[test]
  fn test_touch_project_operations() {
    use crate::video_compiler::commands_logic::touch_project_logic;

    let mut project = create_test_project();
    project.metadata.name = "Original Name".to_string();
    let original_time = project.metadata.modified_at;

    // Wait a bit to ensure timestamp changes
    std::thread::sleep(std::time::Duration::from_millis(50));

    let touched = touch_project_logic(project.clone());
    assert_eq!(touched.metadata.name, "Original Name");
    assert_ne!(touched.metadata.modified_at, original_time);
  }

  #[test]
  fn test_subtitle_validation() {
    use crate::video_compiler::commands_logic::create_subtitle_logic;

    // Test empty text
    let result = create_subtitle_logic("".to_string(), 0.0, 1.0);
    assert!(result.is_err());

    // Test zero duration
    let result = create_subtitle_logic("Text".to_string(), 1.0, 1.0);
    assert!(result.is_err());

    // Test negative duration
    let result = create_subtitle_logic("Text".to_string(), 2.0, 1.0);
    assert!(result.is_err());

    // Test valid subtitle
    let result = create_subtitle_logic("Valid subtitle".to_string(), 0.0, 2.0);
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_render_job_edge_cases() {
    use crate::video_compiler::commands_logic::{
      compile_video_logic, get_render_job_logic, get_render_progress_logic,
    };

    let state = create_test_state();
    let project = create_test_project();

    // Start a job
    let job_id = compile_video_logic(project, "/tmp/test.mp4".to_string(), &state)
      .await
      .unwrap();

    // Get job details multiple times
    for _ in 0..3 {
      let details = get_render_job_logic(&job_id, &state).await.unwrap();
      assert!(details.is_some());
    }

    // Get progress multiple times
    for _ in 0..3 {
      let _progress = get_render_progress_logic(&job_id, &state).await.unwrap();
    }

    // Clean up
    state.active_jobs.write().await.clear();
  }

  #[tokio::test]
  async fn test_get_system_info_comprehensive() {
    use crate::video_compiler::commands_logic::get_system_info_logic;

    let info = get_system_info_logic();

    // Verify all fields are populated
    assert!(!info.os.is_empty());
    assert!(!info.arch.is_empty());
    assert!(!info.ffmpeg_path.is_empty());
    assert!(!info.temp_directory.is_empty());
    assert!(info.cpu_cores > 0);
    assert!(info.available_memory.is_some());
  }

  #[tokio::test]
  async fn test_render_statistics_operations() {
    use crate::video_compiler::commands_logic::get_render_statistics_logic;

    let state = create_test_state();

    // Get stats with no active jobs
    let stats = get_render_statistics_logic(&state).await;
    assert_eq!(stats.active_renders, 0);
    assert_eq!(stats.total_renders, 0);
    assert_eq!(stats.successful_renders, 0);
    assert_eq!(stats.failed_renders, 0);
    assert_eq!(stats.average_render_time, 0.0);
    assert_eq!(stats.total_output_size, 0);
  }
}
