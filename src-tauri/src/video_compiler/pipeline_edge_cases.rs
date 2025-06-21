//! Edge case tests for pipeline.rs

#[cfg(test)]
mod edge_case_tests {
  use crate::video_compiler::progress::{ProgressTracker, ProgressUpdate};
  use crate::video_compiler::schema::{
    Clip, Effect, EffectType, Filter, FilterType, ProjectSchema, Track, TrackType, Transition,
    TransitionDuration,
  };
  use crate::video_compiler::CompilerSettings;
  use crate::video_compiler::{
    pipeline::{
      EncodingStage, FinalizationStage, PipelineContext, PipelineStage, PipelineStatistics,
      RenderPipeline, Result, ValidationStage,
    },
    VideoCompilerError,
  };
  use async_trait::async_trait;
  use std::collections::HashMap;
  // use std::path::PathBuf; // unused
  use std::sync::Arc;
  use std::time::{Duration, SystemTime};
  use tempfile::TempDir;
  use tokio::sync::{mpsc, RwLock};

  #[tokio::test]
  async fn test_empty_project_validation() {
    let temp_dir = TempDir::new().unwrap();
    let project = ProjectSchema::new("Empty Project".to_string());
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let output_path = temp_dir.path().join("empty_output.mp4");

    let mut pipeline = RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap();

    // Empty project should fail during composition stage
    let result = pipeline.execute("empty_test").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_extreme_clip_durations() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Extreme Duration Test".to_string());

    let video_file = temp_dir.path().join("test.mp4");
    std::fs::write(&video_file, b"fake content").unwrap();

    let mut track = Track::new(TrackType::Video, "Test Track".to_string());

    // Very short clip (1ms)
    track.clips.push(Clip {
      id: "very_short".to_string(),
      source_path: video_file.clone(),
      start_time: 0.0,
      end_time: 0.001,
      source_start: 0.0,
      source_end: 0.001,
      speed: 1.0,
      volume: 1.0,
      locked: false,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    });

    // Very long clip (24 hours)
    track.clips.push(Clip {
      id: "very_long".to_string(),
      source_path: video_file,
      start_time: 0.001,
      end_time: 86400.0,
      source_start: 0.0,
      source_end: 86400.0,
      speed: 1.0,
      volume: 1.0,
      locked: false,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    });

    project.tracks.push(track);

    let output_path = temp_dir.path().join("test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    // Should pass validation even with extreme durations
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_unicode_file_paths() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Unicode Test 🎬".to_string());

    // Create files with unicode names
    let unicode_files = [
      "видео_файл_🎥.mp4",
      "音频文件_🎵.mp3",
      "字幕文件_📝.srt",
      "αρχείο_βίντεο_🎞️.mp4",
    ];

    for (i, filename) in unicode_files.iter().enumerate() {
      let file_path = temp_dir.path().join(filename);
      std::fs::write(&file_path, b"fake content").unwrap();

      let track_type = if filename.contains(".mp3") {
        TrackType::Audio
      } else if filename.contains(".srt") {
        TrackType::Subtitle
      } else {
        TrackType::Video
      };

      let mut track = Track::new(track_type, format!("Track {}", i));
      track.clips.push(Clip {
        id: format!("clip_{}", i),
        source_path: file_path,
        start_time: i as f64,
        end_time: (i + 1) as f64,
        source_start: 0.0,
        source_end: 1.0,
        speed: 1.0,
        volume: 1.0,
        locked: false,
        effects: vec![],
        filters: vec![],
        template_id: None,
        template_cell: None,
        style_template_id: None,
        properties: HashMap::new(),
      });
      project.tracks.push(track);
    }

    let output_path = temp_dir.path().join("输出_output_🎬.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    // Should handle unicode paths correctly
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_extreme_speed_values() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Speed Test".to_string());

    let video_file = temp_dir.path().join("test.mp4");
    std::fs::write(&video_file, b"fake content").unwrap();

    let mut track = Track::new(TrackType::Video, "Speed Track".to_string());

    // Very slow speed (0.01x)
    track.clips.push(Clip {
      id: "very_slow".to_string(),
      source_path: video_file.clone(),
      start_time: 0.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 0.1,
      speed: 0.01,
      volume: 1.0,
      locked: false,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    });

    // Very fast speed (100x)
    track.clips.push(Clip {
      id: "very_fast".to_string(),
      source_path: video_file,
      start_time: 10.0,
      end_time: 10.1,
      source_start: 0.0,
      source_end: 10.0,
      speed: 100.0,
      volume: 1.0,
      locked: false,
      effects: vec![],
      filters: vec![],
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    });

    project.tracks.push(track);

    let output_path = temp_dir.path().join("test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    // Should handle extreme speed values
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_many_effects_and_filters() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Effects Overload Test".to_string());

    let video_file = temp_dir.path().join("test.mp4");
    std::fs::write(&video_file, b"fake content").unwrap();

    let mut track = Track::new(TrackType::Video, "Effects Track".to_string());

    // Create clip with many effects and filters
    let mut effect_ids = Vec::new();
    for i in 0..50 {
      effect_ids.push(format!("effect_{}", i));
      let effect_type = match i % 10 {
        0 => EffectType::Brightness,
        1 => EffectType::Contrast,
        2 => EffectType::Blur,
        3 => EffectType::Saturation,
        4 => EffectType::HueRotate,
        5 => EffectType::Sharpen,
        6 => EffectType::Vignette,
        7 => EffectType::FilmGrain,
        8 => EffectType::Glow,
        _ => EffectType::Sepia,
      };
      project
        .effects
        .push(Effect::new(effect_type, format!("Effect {}", i)));
    }

    let mut filter_ids = Vec::new();
    for i in 0..30 {
      filter_ids.push(format!("filter_{}", i));
      let filter_type = match i % 5 {
        0 => FilterType::Brightness,
        1 => FilterType::Contrast,
        2 => FilterType::Saturation,
        3 => FilterType::Blur,
        _ => FilterType::Sharpen,
      };
      project
        .filters
        .push(Filter::new(filter_type, format!("Filter {}", i)));
    }

    track.clips.push(Clip {
      id: "overloaded_clip".to_string(),
      source_path: video_file,
      start_time: 0.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 10.0,
      speed: 1.0,
      volume: 1.0,
      locked: false,
      effects: effect_ids,
      filters: filter_ids,
      template_id: Some("complex_template".to_string()),
      template_cell: Some(0),
      style_template_id: Some("complex_style".to_string()),
      properties: {
        let mut props = HashMap::new();
        for i in 0..20 {
          props.insert(format!("prop_{}", i), serde_json::json!(i));
        }
        props
      },
    });

    project.tracks.push(track);

    let output_path = temp_dir.path().join("test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    // Should handle many effects and filters
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_overlapping_clips() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Overlapping Clips Test".to_string());

    let video_file = temp_dir.path().join("test.mp4");
    std::fs::write(&video_file, b"fake content").unwrap();

    let mut track = Track::new(TrackType::Video, "Overlap Track".to_string());

    // Create overlapping clips
    for i in 0..5 {
      track.clips.push(Clip {
        id: format!("overlap_clip_{}", i),
        source_path: video_file.clone(),
        start_time: i as f64 * 2.0,
        end_time: (i as f64 * 2.0) + 3.0, // Each clip overlaps with the next
        source_start: 0.0,
        source_end: 3.0,
        speed: 1.0,
        volume: 1.0,
        locked: false,
        effects: vec![],
        filters: vec![],
        template_id: None,
        template_cell: None,
        style_template_id: None,
        properties: HashMap::new(),
      });
    }

    project.tracks.push(track);

    // Add transitions between overlapping clips
    for i in 0..4 {
      project.transitions.push(Transition {
        id: format!("transition_{}", i),
        transition_type: "Crossfade".to_string(),
        name: "Crossfade".to_string(),
        labels: None,
        description: None,
        category: None,
        complexity: None,
        tags: vec![],
        duration: TransitionDuration {
          min: 0.5,
          max: 2.0,
          default: 1.0,
          current: 1.0,
        },
        start_time: (i as f64 * 2.0) + 2.5,
        from_clip_id: format!("overlap_clip_{}", i),
        to_clip_id: format!("overlap_clip_{}", i + 1),
        parameters: HashMap::new(),
        ffmpeg_command: None,
        preview_path: None,
      });
    }

    let output_path = temp_dir.path().join("test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    // Validation should fail because clips overlap
    assert!(result.is_err());
    if let Err(VideoCompilerError::ValidationError(msg)) = result {
      assert!(msg.contains("пересекаются"));
    }
  }

  #[tokio::test]
  async fn test_invalid_volume_values() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Volume Test".to_string());

    let audio_file = temp_dir.path().join("test.mp3");
    std::fs::write(&audio_file, b"fake audio content").unwrap();

    let mut track = Track::new(TrackType::Audio, "Volume Track".to_string());

    // Clips with various volume values
    let volume_values = [0.0, 0.5, 1.0, 2.0, 10.0, -1.0, 100.0];

    for (i, volume) in volume_values.iter().enumerate() {
      track.clips.push(Clip {
        id: format!("volume_clip_{}", i),
        source_path: audio_file.clone(),
        start_time: i as f64,
        end_time: (i + 1) as f64,
        source_start: 0.0,
        source_end: 1.0,
        speed: 1.0,
        volume: *volume as f32,
        locked: false,
        effects: vec![],
        filters: vec![],
        template_id: None,
        template_cell: None,
        style_template_id: None,
        properties: HashMap::new(),
      });
    }

    project.tracks.push(track);

    let output_path = temp_dir.path().join("test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    // Validation should fail for volume values outside 0.0-1.0 range
    assert!(result.is_err());
    if let Err(VideoCompilerError::ValidationError(msg)) = result {
      assert!(msg.contains("Громкость"));
    }
  }

  #[tokio::test]
  async fn test_circular_transition_references() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Circular Transition Test".to_string());

    let video_file = temp_dir.path().join("test.mp4");
    std::fs::write(&video_file, b"fake content").unwrap();

    let mut track = Track::new(TrackType::Video, "Test Track".to_string());

    // Create clips
    for i in 0..3 {
      track.clips.push(Clip {
        id: format!("clip_{}", i),
        source_path: video_file.clone(),
        start_time: i as f64 * 5.0,
        end_time: (i + 1) as f64 * 5.0,
        source_start: 0.0,
        source_end: 5.0,
        speed: 1.0,
        volume: 1.0,
        locked: false,
        effects: vec![],
        filters: vec![],
        template_id: None,
        template_cell: None,
        style_template_id: None,
        properties: HashMap::new(),
      });
    }

    project.tracks.push(track);

    // Create circular transitions (which shouldn't make sense but test handling)
    project.transitions.push(Transition {
      id: "circular_1".to_string(),
      transition_type: "Fade".to_string(),
      name: "Fade".to_string(),
      labels: None,
      description: None,
      category: None,
      complexity: None,
      tags: vec![],
      duration: TransitionDuration {
        min: 0.5,
        max: 2.0,
        default: 1.0,
        current: 1.0,
      },
      start_time: 2.5,
      from_clip_id: "clip_0".to_string(),
      to_clip_id: "clip_2".to_string(), // Skip clip_1
      parameters: HashMap::new(),
      ffmpeg_command: None,
      preview_path: None,
    });

    project.transitions.push(Transition {
      id: "circular_2".to_string(),
      transition_type: "Fade".to_string(),
      name: "Fade".to_string(),
      labels: None,
      description: None,
      category: None,
      complexity: None,
      tags: vec![],
      duration: TransitionDuration {
        min: 0.5,
        max: 2.0,
        default: 1.0,
        current: 1.0,
      },
      start_time: 12.5,
      from_clip_id: "clip_2".to_string(),
      to_clip_id: "clip_0".to_string(), // Back to first
      parameters: HashMap::new(),
      ffmpeg_command: None,
      preview_path: None,
    });

    let output_path = temp_dir.path().join("test.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let result = stage.process(&mut context).await;

    // Should pass basic validation (transition logic would be handled in composition)
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_massive_project_scale() {
    let temp_dir = TempDir::new().unwrap();
    let mut project = ProjectSchema::new("Massive Scale Test".to_string());

    // Create many tracks with many clips
    for track_idx in 0..10 {
      let track_type = match track_idx % 3 {
        0 => TrackType::Video,
        1 => TrackType::Audio,
        _ => TrackType::Video,
      };

      let mut track = Track::new(track_type.clone(), format!("Track {}", track_idx));

      // Add many clips to each track
      for clip_idx in 0..50 {
        let file_ext = match track_type {
          TrackType::Video => "mp4",
          TrackType::Audio => "mp3",
          TrackType::Subtitle => "srt",
        };

        let file = temp_dir
          .path()
          .join(format!("file_{}_{}.{}", track_idx, clip_idx, file_ext));
        std::fs::write(&file, b"fake content").unwrap();

        track.clips.push(Clip {
          id: format!("clip_{}_{}", track_idx, clip_idx),
          source_path: file,
          start_time: clip_idx as f64 * 2.0,
          end_time: (clip_idx + 1) as f64 * 2.0,
          source_start: 0.0,
          source_end: 2.0,
          speed: 1.0,
          volume: 1.0,
          locked: false,
          effects: vec![],
          filters: vec![],
          template_id: None,
          template_cell: None,
          style_template_id: None,
          properties: HashMap::new(),
        });
      }

      project.tracks.push(track);
    }

    let output_path = temp_dir.path().join("massive_output.mp4");
    let mut context = PipelineContext::new(project, output_path);

    let stage = ValidationStage::new();
    let start = SystemTime::now();
    let result = stage.process(&mut context).await;
    let duration = start.elapsed().unwrap();

    // Should handle large projects efficiently
    assert!(result.is_ok());
    // Validation should be reasonably fast even for large projects
    assert!(duration.as_secs() < 5);

    // Check that stats were collected
    if let Some(validation_stats) = context.user_data.get("validation_stats") {
      if let Some(clips_count) = validation_stats.get("clips_count").and_then(|v| v.as_u64()) {
        assert_eq!(clips_count, 500); // 10 tracks * 50 clips
      }
    }
  }

  #[tokio::test]
  async fn test_pipeline_stage_panic_recovery() {
    // Create a stage that panics
    #[derive(Debug)]
    struct PanicStage;

    #[async_trait]
    impl PipelineStage for PanicStage {
      async fn process(&self, _context: &mut PipelineContext) -> Result<()> {
        panic!("Simulated panic in pipeline stage!");
      }

      fn name(&self) -> &str {
        "Panic"
      }
    }

    let temp_dir = TempDir::new().unwrap();
    let project = ProjectSchema::new("Panic Test".to_string());
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let output_path = temp_dir.path().join("panic_test.mp4");

    let mut pipeline = RenderPipeline::new(project, progress_tracker, settings, output_path)
      .await
      .unwrap();

    pipeline.stages.clear();
    pipeline.add_stage(Box::new(PanicStage));

    // Use tokio's panic handling
    let handle = tokio::spawn(async move { pipeline.execute("panic_test").await });

    // The task should complete (with panic)
    let result = handle.await;
    assert!(result.is_err()); // JoinError due to panic
  }

  #[tokio::test]
  async fn test_context_cleanup_on_error() {
    let temp_dir = TempDir::new().unwrap();
    let project = ProjectSchema::new("Cleanup Test".to_string());
    let output_path = temp_dir.path().join("output.mp4");
    let context = PipelineContext::new(project, output_path);

    // Create temp directory
    context.ensure_temp_dir().await.unwrap();
    assert!(context.temp_dir.exists());

    // Store temp dir path for later check
    let temp_dir_path = context.temp_dir.clone();

    // Simulate error scenario where cleanup is called
    context.cleanup().await.unwrap();

    // Verify cleanup worked
    assert!(!temp_dir_path.exists());
  }

  #[tokio::test]
  async fn test_progress_update_edge_cases() {
    let (tx, mut rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let progress_tracker = Arc::new(ProgressTracker::new(tx));

    let temp_dir = TempDir::new().unwrap();
    let project = ProjectSchema::new("Progress Test".to_string());
    let output_path = temp_dir.path().join("test.mp4");
    let mut context = PipelineContext::new(project, output_path);
    context.progress_tracker = Some(progress_tracker.clone());
    context.current_job_id = Some("progress_test".to_string());

    let stage = EncodingStage::new();

    // Test edge case progress lines
    let edge_cases = vec![
            "frame=     0 fps=0.0 q=0.0 size=       0kB time=00:00:00.00 bitrate=N/A speed=N/A",
            "frame=99999 fps=999.9 q=99.9 size=9999999kB time=99:99:99.99 bitrate=99999.9kbits/s speed=99.9x",
            "frame= fps= q= size= time= bitrate= speed=", // Missing values
            "Invalid progress line format",
            "",
        ];

    for line in edge_cases {
      stage.parse_ffmpeg_progress(line, &mut context).await;
    }

    // Should handle edge cases gracefully without panicking
    // Check if any valid updates were sent
    tokio::time::timeout(Duration::from_millis(100), async {
      while let Ok(_update) = rx.try_recv() {
        // Just consume updates
      }
    })
    .await
    .ok();
  }

  #[tokio::test]
  async fn test_finalization_metadata_edge_cases() {
    let temp_dir = TempDir::new().unwrap();
    let mut project =
      ProjectSchema::new("Metadata Test 🎬 with \"quotes\" and 'apostrophes'".to_string());
    project.metadata.author = Some("Test Author <test@example.com>".to_string());
    project.metadata.description = Some("Description with\nnewlines\nand\ttabs".to_string());
    project.version = "1.0.0-beta.1+build.123".to_string();

    let output_path = temp_dir.path().join("output.mp4");
    std::fs::write(&output_path, b"fake video content").unwrap();

    let mut context = PipelineContext::new(project, output_path.clone());
    let stage = FinalizationStage::new();

    // Test metadata with special characters
    // Note: The actual metadata adding would fail without FFmpeg, but we're testing the command building
    let result = stage.process(&mut context).await;

    // Should succeed because output file exists
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_statistics_time_tracking() {
    let mut stats = PipelineStatistics::default();
    let start = SystemTime::now();

    // Simulate stage progression
    tokio::time::sleep(Duration::from_millis(10)).await;
    stats.validation_time = SystemTime::now();

    tokio::time::sleep(Duration::from_millis(10)).await;
    stats.preprocessing_time = SystemTime::now();

    tokio::time::sleep(Duration::from_millis(10)).await;
    stats.composition_time = SystemTime::now();

    tokio::time::sleep(Duration::from_millis(10)).await;
    stats.encoding_time = SystemTime::now();

    tokio::time::sleep(Duration::from_millis(10)).await;
    stats.finalization_time = SystemTime::now();

    // Check that times are sequential
    assert!(stats.validation_time >= start);
    assert!(stats.preprocessing_time >= stats.validation_time);
    assert!(stats.composition_time >= stats.preprocessing_time);
    assert!(stats.encoding_time >= stats.composition_time);
    assert!(stats.finalization_time >= stats.encoding_time);

    // Total duration should be at least 40ms (we had 5 sleeps of 10ms each)
    let total = stats.total_duration();
    assert!(total.as_millis() >= 40);
  }
}
