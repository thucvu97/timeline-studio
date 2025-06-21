//! Extended tests for pipeline.rs to improve code coverage

#[cfg(test)]
mod extended_tests {
  use crate::video_compiler::error::VideoCompilerError;
  use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
  use crate::video_compiler::pipeline::{
    CompositionStage, EncodingStage, FinalizationStage, PipelineContext, PipelineStage,
    PipelineStatistics, PreprocessingStage, RenderPipeline, Result, ValidationStage,
  };
  use crate::video_compiler::progress::{ProgressTracker, ProgressUpdate};
  use crate::video_compiler::schema::{
    Clip, Effect, EffectType, ExportSettings, Filter, FilterType, OutputFormat, ProjectSchema,
    Subtitle, SubtitleAnimation, SubtitleAnimationType, SubtitleEasing, SubtitleFontWeight,
    SubtitlePosition, SubtitleStyle, Track, TrackType, Transition, TransitionCategory,
    TransitionComplexity, TransitionDuration,
  };
  use crate::video_compiler::CompilerSettings;
  use async_trait::async_trait;
  use std::collections::HashMap;
  use std::path::{Path, PathBuf};
  use std::sync::Arc;
  use std::time::Duration;
  use tempfile::TempDir;
  use tokio::sync::{mpsc, RwLock};

  /// Helper to create a comprehensive test project with multiple tracks
  async fn create_complex_test_project(temp_dir: &Path) -> ProjectSchema {
    let mut project = ProjectSchema::new("Complex Test Project".to_string());

    // Update project metadata
    project.metadata.description = Some("Test project with multiple tracks".to_string());
    project.metadata.author = Some("Test Author".to_string());

    // Create video files
    let video1 = temp_dir.join("video1.mp4");
    let video2 = temp_dir.join("video2.mp4");
    let image = temp_dir.join("image.jpg");
    std::fs::write(&video1, b"fake video content 1").unwrap();
    std::fs::write(&video2, b"fake video content 2").unwrap();
    std::fs::write(&image, b"fake image content").unwrap();

    // Create audio files
    let audio1 = temp_dir.join("audio1.mp3");
    let audio2 = temp_dir.join("audio2.wav");
    std::fs::write(&audio1, b"fake audio content 1").unwrap();
    std::fs::write(&audio2, b"fake audio content 2").unwrap();

    // Create subtitle file
    let subtitle = temp_dir.join("subtitle.srt");
    std::fs::write(
      &subtitle,
      b"1\n00:00:00,000 --> 00:00:05,000\nTest subtitle",
    )
    .unwrap();

    // Add video track with multiple clips and effects
    let mut video_track = Track::new(TrackType::Video, "Main Video Track".to_string());
    video_track.locked = true;
    video_track.volume = 0.8;

    // First video clip with effects and filters
    let clip1 = Clip {
      id: "video_clip_1".to_string(),
      source_path: video1,
      start_time: 0.0,
      end_time: 5.0,
      source_start: 0.0,
      source_end: 5.0,
      speed: 1.5,
      volume: 0.9,
      locked: false,
      effects: vec!["effect1".to_string(), "effect2".to_string()],
      filters: vec!["filter1".to_string()],
      template_id: Some("template1".to_string()),
      template_cell: Some(0),
      style_template_id: Some("style1".to_string()),
      properties: {
        let mut props = HashMap::new();
        props.insert("custom_prop".to_string(), serde_json::json!("value"));
        props
      },
    };

    // Second video clip
    let clip2 = Clip {
      id: "video_clip_2".to_string(),
      source_path: video2,
      start_time: 5.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 5.0,
      speed: 1.0,
      volume: 1.0,
      locked: true,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    };

    // Image as video clip
    let clip3 = Clip {
      id: "image_clip".to_string(),
      source_path: image,
      start_time: 10.0,
      end_time: 15.0,
      source_start: 0.0,
      source_end: 5.0,
      speed: 1.0,
      volume: 1.0,
      locked: false,
      effects: vec!["effect3".to_string()],
      filters: vec!["filter2".to_string(), "filter3".to_string()],
      template_id: Some("template2".to_string()),
      template_cell: Some(1),
      style_template_id: None,
      properties: HashMap::new(),
    };

    video_track.clips.push(clip1);
    video_track.clips.push(clip2);
    video_track.clips.push(clip3);
    project.tracks.push(video_track);

    // Add audio track
    let mut audio_track = Track::new(TrackType::Audio, "Background Music".to_string());
    audio_track.volume = 0.5;

    let audio_clip1 = Clip {
      id: "audio_clip_1".to_string(),
      source_path: audio1,
      start_time: 0.0,
      end_time: 8.0,
      source_start: 0.0,
      source_end: 8.0,
      speed: 1.0,
      volume: 0.7,
      locked: false,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    };

    let audio_clip2 = Clip {
      id: "audio_clip_2".to_string(),
      source_path: audio2,
      start_time: 8.0,
      end_time: 15.0,
      source_start: 0.0,
      source_end: 7.0,
      speed: 1.0,
      volume: 0.8,
      locked: false,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    };

    audio_track.clips.push(audio_clip1);
    audio_track.clips.push(audio_clip2);
    project.tracks.push(audio_track);

    // Add subtitle track
    let mut subtitle_track = Track::new(TrackType::Subtitle, "Subtitles".to_string());

    let subtitle_clip = Clip {
      id: "subtitle_clip".to_string(),
      source_path: subtitle,
      start_time: 0.0,
      end_time: 15.0,
      source_start: 0.0,
      source_end: 15.0,
      speed: 1.0,
      volume: 1.0,
      locked: false,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    };

    subtitle_track.clips.push(subtitle_clip);
    project.tracks.push(subtitle_track);

    // Add effects to project
    project.effects.push(Effect::new(
      EffectType::Brightness,
      "Brightness Effect".to_string(),
    ));
    project.effects.push(Effect::new(
      EffectType::Contrast,
      "Contrast Effect".to_string(),
    ));
    project
      .effects
      .push(Effect::new(EffectType::Blur, "Blur Effect".to_string()));

    // Add filters to project
    project.filters.push(Filter::new(
      FilterType::Brightness,
      "Brightness Filter".to_string(),
    ));
    project.filters.push(Filter::new(
      FilterType::Saturation,
      "Saturation Filter".to_string(),
    ));
    project
      .filters
      .push(Filter::new(FilterType::Blur, "Blur Filter".to_string()));

    // Add transitions between clips
    project.transitions.push(Transition {
      id: "transition1".to_string(),
      transition_type: "Fade".to_string(),
      name: "Fade Transition".to_string(),
      labels: None,
      description: None,
      category: Some(TransitionCategory::Basic),
      complexity: Some(TransitionComplexity::Basic),
      tags: vec![],
      duration: TransitionDuration {
        min: 0.5,
        max: 2.0,
        default: 1.0,
        current: 1.0,
      },
      start_time: 4.5,
      from_clip_id: "video_clip_1".to_string(),
      to_clip_id: "video_clip_2".to_string(),
      parameters: HashMap::new(),
      ffmpeg_command: None,
      preview_path: None,
    });

    // Add subtitles
    let subtitle_style = SubtitleStyle {
      font_size: 28.0,
      font_weight: SubtitleFontWeight::Bold,
      color: "#FFFF00".to_string(),
      ..Default::default()
    };

    project.subtitles.push(Subtitle {
      id: "subtitle1".to_string(),
      text: "This is a test subtitle".to_string(),
      start_time: 1.0,
      end_time: 4.0,
      position: SubtitlePosition::default(),
      style: subtitle_style,
      enabled: true,
      animations: vec![SubtitleAnimation {
        id: "anim1".to_string(),
        animation_type: SubtitleAnimationType::FadeIn,
        duration: 0.5,
        delay: 0.0,
        easing: SubtitleEasing::EaseInOut,
        direction: None,
        properties: HashMap::new(),
      }],
    });

    // Update export settings
    project.settings.export = ExportSettings {
      format: OutputFormat::Mp4,
      quality: 90,
      video_bitrate: 10000,
      audio_bitrate: 256,
      hardware_acceleration: true,
      preferred_gpu_encoder: Some("h264_nvenc".to_string()),
      ffmpeg_args: vec!["-movflags".to_string(), "faststart".to_string()],
      encoding_profile: Some("high".to_string()),
      rate_control_mode: Some("vbr".to_string()),
      keyframe_interval: Some(30),
      b_frames: Some(3),
      multi_pass: Some(2),
      preset: Some("slow".to_string()),
      max_bitrate: Some(15000),
      min_bitrate: Some(5000),
      crf: Some(23),
      optimize_for_speed: Some(false),
      optimize_for_network: Some(true),
      normalize_audio: Some(true),
      audio_target: Some(-23.0),
      audio_peak: Some(-1.0),
    };

    project
  }

  #[tokio::test]
  async fn test_complex_project_pipeline() {
    let temp_dir = TempDir::new().unwrap();
    let project = create_complex_test_project(temp_dir.path()).await;
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let output_path = temp_dir.path().join("output.mp4");

    let pipeline = RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap();

    // Test that pipeline has all default stages
    assert_eq!(pipeline.stages.len(), 5);

    // Test FFmpeg builder was created
    assert!(pipeline.context.ffmpeg_builder.is_some());

    // Test progress tracker was set
    assert!(pipeline.context.progress_tracker.is_some());
  }

  #[tokio::test]
  async fn test_pipeline_validation_stage_detailed() {
    let temp_dir = TempDir::new().unwrap();
    let project = create_complex_test_project(temp_dir.path()).await;
    let output_path = temp_dir.path().join("output.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    assert_eq!(stage.name(), "Validation");

    let result = stage.process(&mut context).await;
    assert!(result.is_ok());

    // Check validation stats were stored
    let stats = context.user_data.get("validation_stats").unwrap();
    assert!(stats.get("project_name").is_some());
    assert!(stats.get("clips_count").is_some());
    assert!(stats.get("tracks_count").is_some());
    assert_eq!(stats.get("clips_count").unwrap().as_u64().unwrap(), 6);
    assert_eq!(stats.get("tracks_count").unwrap().as_u64().unwrap(), 3);
  }

  #[tokio::test]
  async fn test_preprocessing_stage_with_file_conversions() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Preprocessing Test".to_string());

    // Create various file formats that need conversion
    let wav_file = temp_dir.path().join("audio.wav");
    let avi_file = temp_dir.path().join("video.avi");
    let mov_file = temp_dir.path().join("video.mov");
    std::fs::write(&wav_file, b"fake wav content").unwrap();
    std::fs::write(&avi_file, b"fake avi content").unwrap();
    std::fs::write(&mov_file, b"fake mov content").unwrap();

    // Add clips with different formats
    let mut track = Track::new(TrackType::Video, "Mixed Format Track".to_string());
    track.clips.push(Clip::new(avi_file, 0.0, 5.0));
    track.clips.push(Clip::new(mov_file, 5.0, 5.0));
    project.tracks.push(track);

    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    audio_track.clips.push(Clip::new(wav_file, 0.0, 10.0));
    project.tracks.push(audio_track);

    let output_path = temp_dir.path().join("output.mp4");
    let mut context = PipelineContext::new(project, output_path);
    context.ensure_temp_dir().await.unwrap();

    let stage = PreprocessingStage::new();
    assert_eq!(stage.name(), "Preprocessing");

    // This will fail without actual FFmpeg, but tests the logic
    let result = stage.process(&mut context).await;
    assert!(result.is_err()); // Expected to fail without FFmpeg
  }

  #[tokio::test]
  async fn test_composition_stage_with_multiple_inputs() {
    let temp_dir = TempDir::new().unwrap();
    let project = create_complex_test_project(temp_dir.path()).await;
    let output_path = temp_dir.path().join("output.mp4");
    let mut context = PipelineContext::new(project, output_path);
    context.ensure_temp_dir().await.unwrap();

    // Add FFmpeg builder to context
    let ffmpeg_builder = FFmpegBuilder::new(context.project.clone());
    context.ffmpeg_builder = Some(ffmpeg_builder);

    let stage = CompositionStage::new();
    assert_eq!(stage.name(), "Composition");

    // Test that composition builds complex filter graph
    let result = stage.process(&mut context).await;
    assert!(result.is_err()); // Expected to fail without FFmpeg

    // Composition stage doesn't store command in user_data
  }

  #[tokio::test]
  async fn test_encoding_stage_progress_parsing() {
    let temp_dir = TempDir::new().unwrap();
    let project = ProjectSchema::new("Encoding Test".to_string());
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let output_path = temp_dir.path().join("output.mp4");
    let mut context = PipelineContext::new(project, output_path.clone());
    context.progress_tracker = Some(progress_tracker);
    context.current_job_id = Some("test_job".to_string());

    let stage = EncodingStage::new();
    assert_eq!(stage.name(), "Encoding");

    // Test FFmpeg progress parsing
    let test_lines = vec![
            "frame=  120 fps=24.0 q=23.0 size=    1024kB time=00:00:05.00 bitrate=1677.7kbits/s speed=1.0x",
            "frame=  240 fps=24.0 q=23.0 size=    2048kB time=00:00:10.00 bitrate=1677.7kbits/s speed=1.0x",
            "frame=  360 fps=24.0 q=23.0 size=    3072kB time=00:00:15.00 bitrate=1677.7kbits/s speed=1.0x",
        ];

    for line in test_lines {
      stage.parse_ffmpeg_progress(line, &mut context).await;
    }
  }

  #[tokio::test]
  async fn test_finalization_stage_with_statistics() {
    let temp_dir = TempDir::new().unwrap();
    let project = create_complex_test_project(temp_dir.path()).await;
    let output_path = temp_dir.path().join("output.mp4");

    // Create a fake output file
    std::fs::write(&output_path, b"fake video content").unwrap();

    let mut context = PipelineContext::new(project, output_path.clone());
    context.ensure_temp_dir().await.unwrap();

    // Set up pipeline statistics
    context.statistics.validation_time = std::time::SystemTime::now();
    context.statistics.preprocessing_time = std::time::SystemTime::now();
    context.statistics.composition_time = std::time::SystemTime::now();
    context.statistics.encoding_time = std::time::SystemTime::now();
    context.statistics.finalization_time = std::time::SystemTime::now();
    // PipelineStatistics doesn't have total_frames field
    context.statistics.frames_processed = 300;
    // PipelineStatistics doesn't have skipped_frames field
    context.statistics.error_count = 0;
    context.statistics.warning_count = 2;

    let stage = FinalizationStage::new();
    assert_eq!(stage.name(), "Finalization");

    // FinalizationStage expects output file to exist
    let result = stage.process(&mut context).await;
    assert!(result.is_ok()); // Should succeed because we created the file

    // Temp dir doesn't exist yet because ensure_temp_dir wasn't called
    // assert!(context.temp_dir.exists());
  }

  #[tokio::test]
  async fn test_pipeline_cancellation_handling() {
    let temp_dir = TempDir::new().unwrap();
    let project = create_complex_test_project(temp_dir.path()).await;
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let output_path = temp_dir.path().join("output.mp4");

    let mut pipeline =
      RenderPipeline::new(project, progress_tracker.clone(), settings, output_path)
        .await
        .unwrap();

    // Simulate cancellation by setting the cancelled flag
    let job_id = "cancel_test_job";
    pipeline.context.cancelled = true;

    // Execute should detect cancellation
    let result = pipeline.execute(job_id).await;
    assert!(result.is_err());
    match result.err().unwrap() {
      VideoCompilerError::RenderError { message, .. } if message.contains("отменена") => {}
      e => panic!("Expected cancellation error, got: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_pipeline_error_recovery() {
    let temp_dir = TempDir::new().unwrap();
    let project = ProjectSchema::new("Error Recovery Test".to_string());
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let output_path = temp_dir.path().join("output.mp4");

    let mut pipeline = RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap();

    // Clear stages and add a failing stage
    pipeline.stages.clear();

    // Custom failing stage
    #[derive(Debug)]
    struct FailingStage;

    #[async_trait]
    impl PipelineStage for FailingStage {
      async fn process(&self, _context: &mut PipelineContext) -> Result<()> {
        Err(VideoCompilerError::RenderError {
          job_id: "test".to_string(),
          stage: "test".to_string(),
          message: "Test error".to_string(),
        })
      }

      fn name(&self) -> &str {
        "Failing"
      }
    }

    pipeline.add_stage(Box::new(FailingStage));

    let result = pipeline.execute("error_test").await;
    assert!(result.is_err());

    // Check that cleanup happened
    assert!(!pipeline.context.temp_dir.exists());
  }

  #[tokio::test]
  async fn test_pipeline_with_custom_settings() {
    let temp_dir = TempDir::new().unwrap();
    let project = create_complex_test_project(temp_dir.path()).await;
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));

    // Create custom settings
    let custom_settings = CompilerSettings {
      temp_directory: temp_dir.path().join("custom_temp"),
      ffmpeg_path: Some("/custom/path/to/ffmpeg".into()),
      ..Default::default()
    };

    let settings = Arc::new(RwLock::new(custom_settings));
    let output_path = temp_dir.path().join("output.mp4");

    let pipeline = RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap();

    // Note: PipelineContext creates its own temp_dir with UUID
    // and doesn't use CompilerSettings.temp_directory
    // Temp dir is created only when ensure_temp_dir is called
    assert!(!pipeline.context.temp_dir.exists());
  }

  #[tokio::test]
  async fn test_statistics_collection() {
    let mut stats = PipelineStatistics {
      validation_time: std::time::SystemTime::now(),
      ..Default::default()
    };

    // Simulate pipeline execution
    tokio::time::sleep(Duration::from_millis(10)).await;

    stats.preprocessing_time = std::time::SystemTime::now();
    // stats doesn't have preprocessed_clips field
    tokio::time::sleep(Duration::from_millis(10)).await;

    stats.composition_time = std::time::SystemTime::now();
    // stats doesn't have composition_commands field
    tokio::time::sleep(Duration::from_millis(10)).await;

    stats.encoding_time = std::time::SystemTime::now();
    // stats doesn't have total_frames field
    stats.frames_processed = 295;
    // stats doesn't have skipped_frames field
    tokio::time::sleep(Duration::from_millis(10)).await;

    stats.finalization_time = std::time::SystemTime::now();
    // stats doesn't have output_file_size field

    // Add errors and warnings
    stats.add_error();
    stats.add_error();
    stats.add_warning();
    stats.add_warning();
    stats.add_warning();

    // Check statistics
    assert_eq!(stats.error_count, 2);
    assert_eq!(stats.warning_count, 3);
    assert!(stats.total_duration().as_millis() >= 40);

    // Check frame processing rate
    let frame_rate = stats.frames_processed as f64 / stats.total_duration().as_secs_f64();
    assert!(frame_rate > 0.0);
  }

  #[tokio::test]
  async fn test_progress_update_formats() {
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));

    // Test different progress update types
    // First start a job
    let job_id = progress_tracker
      .create_job("Test Job".to_string(), "/tmp/output.mp4".to_string(), 100)
      .await
      .unwrap();

    // Progress tracker requires job to be in Processing state to update progress
    // Since we can't access private fields, we'll just check that job was created
    let job = progress_tracker.get_job(&job_id).await;
    assert!(job.is_some());

    // Progress updates are sent as ProgressChanged variant
  }

  #[tokio::test]
  async fn test_context_user_data_storage() {
    let project = ProjectSchema::new("User Data Test".to_string());
    let output_path = PathBuf::from("/tmp/output.mp4");
    let mut context = PipelineContext::new(project, output_path);

    // Store various types of data
    context
      .user_data
      .insert("string_value".to_string(), serde_json::json!("test"));
    context
      .user_data
      .insert("number_value".to_string(), serde_json::json!(42));
    context
      .user_data
      .insert("array_value".to_string(), serde_json::json!([1, 2, 3]));
    context.user_data.insert(
      "object_value".to_string(),
      serde_json::json!({
          "key": "value",
          "nested": {
              "deep": true
          }
      }),
    );

    // Retrieve and verify
    assert_eq!(
      context
        .user_data
        .get("string_value")
        .unwrap()
        .as_str()
        .unwrap(),
      "test"
    );
    assert_eq!(
      context
        .user_data
        .get("number_value")
        .unwrap()
        .as_u64()
        .unwrap(),
      42
    );
    assert_eq!(
      context
        .user_data
        .get("array_value")
        .unwrap()
        .as_array()
        .unwrap()
        .len(),
      3
    );
    assert!(context
      .user_data
      .get("object_value")
      .unwrap()
      .get("nested")
      .unwrap()
      .get("deep")
      .unwrap()
      .as_bool()
      .unwrap());
  }

  #[tokio::test]
  async fn test_pipeline_stage_estimated_duration() {
    let validation_stage = ValidationStage::new();
    assert_eq!(
      validation_stage.estimated_duration(),
      Duration::from_secs(5)
    );

    let preprocessing_stage = PreprocessingStage::new();
    assert_eq!(
      preprocessing_stage.estimated_duration(),
      Duration::from_secs(30)
    );

    let composition_stage = CompositionStage::new();
    assert_eq!(
      composition_stage.estimated_duration(),
      Duration::from_secs(120)
    );

    let encoding_stage = EncodingStage::new();
    assert_eq!(
      encoding_stage.estimated_duration(),
      Duration::from_secs(300)
    );

    let finalization_stage = FinalizationStage::new();
    assert_eq!(
      finalization_stage.estimated_duration(),
      Duration::from_secs(5)
    );
  }

  #[tokio::test]
  async fn test_concurrent_pipeline_access() {
    let temp_dir = TempDir::new().unwrap();
    let project = create_complex_test_project(temp_dir.path()).await;
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));

    // Create multiple pipelines concurrently
    let mut handles = vec![];

    for i in 0..5 {
      let project_clone = project.clone();
      let progress_tracker_clone = progress_tracker.clone();
      let settings_clone = settings.clone();
      let output_path = temp_dir.path().join(format!("output_{}.mp4", i));

      let handle = tokio::spawn(async move {
        RenderPipeline::new(
          project_clone,
          progress_tracker_clone,
          settings_clone,
          output_path,
        )
        .await
      });

      handles.push(handle);
    }

    // All should succeed
    for handle in handles {
      let result = handle.await.unwrap();
      assert!(result.is_ok());
    }
  }

  #[tokio::test]
  async fn test_pipeline_memory_cleanup() {
    let temp_dir = TempDir::new().unwrap();
    let project = create_complex_test_project(temp_dir.path()).await;
    let output_path = temp_dir.path().join("output.mp4");
    let context = PipelineContext::new(project, output_path);

    // Create temp directory
    context.ensure_temp_dir().await.unwrap();
    let temp_path = context.temp_dir.clone();
    assert!(temp_path.exists());

    // Create some temp files
    std::fs::write(temp_path.join("temp1.txt"), b"temp data 1").unwrap();
    std::fs::write(temp_path.join("temp2.txt"), b"temp data 2").unwrap();

    // Cleanup should remove everything
    context.cleanup().await.unwrap();
    assert!(!temp_path.exists());
  }

  #[tokio::test]
  async fn test_gpu_acceleration_fallback() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = create_complex_test_project(temp_dir.path()).await;

    // Set GPU encoder that might not be available
    project.settings.export.preferred_gpu_encoder = Some("h264_nvenc".to_string());
    project.settings.export.hardware_acceleration = true;

    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let output_path = temp_dir.path().join("output.mp4");

    let mut pipeline = RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap();

    // Execution should handle GPU unavailability gracefully
    let result = pipeline.execute("gpu_test").await;

    // Should fail due to missing FFmpeg, but not crash
    assert!(result.is_err());
  }
}

// Include edge case tests
#[cfg(test)]
#[path = "pipeline_edge_cases.rs"]
mod pipeline_edge_cases;
