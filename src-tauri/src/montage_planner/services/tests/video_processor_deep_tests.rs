#[cfg(test)]
mod tests {
  use crate::montage_planner::services::video_processor::{
    ExtractedFrame, VideoMetadata, VideoProcessor,
  };
  use crate::montage_planner::types::*;
  use crate::recognition::commands::yolo_commands::YoloProcessorState;
  // use crate::recognition::frame_processor::Detection as YoloDetection;
  use crate::recognition::yolo_processor_refactored::YoloProcessor;
  use std::collections::HashMap;
  use std::fs;
  use std::path::PathBuf;
  use std::sync::Arc;
  use tempfile::TempDir;
  use tokio::sync::RwLock;

  fn create_mock_video_file() -> (TempDir, PathBuf) {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test_video.mp4");

    // Create a minimal mock video file
    fs::write(&file_path, b"mock video content").unwrap();

    (temp_dir, file_path)
  }

  fn create_mock_yolo_state() -> Arc<RwLock<YoloProcessorState>> {
    let processors: HashMap<String, Arc<RwLock<YoloProcessor>>> = HashMap::new();
    let state = YoloProcessorState {
      processors: Arc::new(RwLock::new(processors)),
    };
    Arc::new(RwLock::new(state))
  }

  fn create_processor() -> VideoProcessor {
    let yolo_state = create_mock_yolo_state();
    VideoProcessor::new(yolo_state)
  }

  fn create_test_frame(timestamp: f64, frame_number: u64) -> ExtractedFrame {
    ExtractedFrame {
      timestamp,
      frame_number,
      image_path: format!("/tmp/frame_{timestamp:.3}.jpg"),
      width: 1920,
      height: 1080,
    }
  }

  fn create_test_metadata() -> VideoMetadata {
    VideoMetadata {
      duration: 120.0,
      width: 1920,
      height: 1080,
      fps: 30.0,
      total_frames: 3600,
    }
  }

  fn create_analysis_options() -> AnalysisOptions {
    AnalysisOptions {
      enable_object_detection: true,
      enable_face_detection: true,
      enable_emotion_analysis: true,
      enable_composition_analysis: true,
      enable_audio_analysis: false,
      frame_sample_rate: 1.0,
      quality_threshold: 0.5,
      max_moments: Some(10),
      frame_sampling_rate: 1.0,
    }
  }

  #[test]
  fn test_processor_creation() {
    let _processor = create_processor();
    // Should create successfully with mock YOLO state
  }

  #[tokio::test]
  async fn test_extract_metadata_nonexistent_file() {
    let processor = create_processor();
    let result = processor.extract_metadata("nonexistent_file.mp4").await;

    assert!(result.is_err());
    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("Video file not found"));
  }

  #[tokio::test]
  async fn test_extract_metadata_existing_file() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let result = processor.extract_metadata(&video_path).await;

    assert!(result.is_ok());
    let metadata = result.unwrap();
    assert_eq!(metadata.duration, 120.0);
    assert_eq!(metadata.width, 1920);
    assert_eq!(metadata.height, 1080);
    assert_eq!(metadata.fps, 30.0);
    assert_eq!(metadata.total_frames, 3600);
  }

  #[tokio::test]
  async fn test_extract_frames_default_time_range() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let sample_rate = 1.0; // 1 frame per second
    let result = processor
      .extract_frames(&video_path, sample_rate, None, None)
      .await;

    assert!(result.is_ok());
    let frames = result.unwrap();

    // Should extract frames for the full duration (120 seconds at 1 fps = 120 frames)
    assert_eq!(frames.len(), 120);

    // Check first frame
    assert_eq!(frames[0].timestamp, 0.0);
    assert_eq!(frames[0].frame_number, 0);
    assert_eq!(frames[0].width, 1920);
    assert_eq!(frames[0].height, 1080);

    // Check last frame
    let last_frame = &frames[frames.len() - 1];
    assert_eq!(last_frame.timestamp, 119.0);
    assert!(last_frame.frame_number > 0);
  }

  #[tokio::test]
  async fn test_extract_frames_custom_time_range() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let sample_rate = 2.0; // 2 frames per second
    let start_time = Some(10.0);
    let end_time = Some(20.0);

    let result = processor
      .extract_frames(&video_path, sample_rate, start_time, end_time)
      .await;

    assert!(result.is_ok());
    let frames = result.unwrap();

    // Should extract frames for 10 seconds at 2 fps = 20 frames
    assert_eq!(frames.len(), 20);

    // Check timing
    assert_eq!(frames[0].timestamp, 10.0);
    assert_eq!(frames[1].timestamp, 10.5);
    assert_eq!(frames[frames.len() - 1].timestamp, 19.5);
  }

  #[tokio::test]
  async fn test_extract_frames_high_sample_rate() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let sample_rate = 10.0; // 10 frames per second
    let start_time = Some(0.0);
    let end_time = Some(1.0); // 1 second

    let result = processor
      .extract_frames(&video_path, sample_rate, start_time, end_time)
      .await;

    assert!(result.is_ok());
    let frames = result.unwrap();

    // Should extract 10 frames for 1 second
    assert_eq!(frames.len(), 10);
    assert_eq!(frames[0].timestamp, 0.0);
    assert_eq!(frames[1].timestamp, 0.1);
    assert_eq!(frames[9].timestamp, 0.9);
  }

  #[tokio::test]
  async fn test_extract_frames_frame_numbering() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let sample_rate = 1.0;
    let start_time = Some(5.0);
    let end_time = Some(8.0);

    let result = processor
      .extract_frames(&video_path, sample_rate, start_time, end_time)
      .await;

    assert!(result.is_ok());
    let frames = result.unwrap();

    // Check frame numbering calculation
    let first_frame = &frames[0];
    assert_eq!(first_frame.timestamp, 5.0);
    // Frame number should be 5.0 * 30 fps = 150
    assert_eq!(first_frame.frame_number, 150);

    let second_frame = &frames[1];
    assert_eq!(second_frame.timestamp, 6.0);
    // Frame number should be 150 + 30 = 180
    assert_eq!(second_frame.frame_number, 180);
  }

  #[tokio::test]
  async fn test_extract_frames_image_paths() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let result = processor
      .extract_frames(&video_path, 1.0, Some(0.0), Some(2.0))
      .await;

    assert!(result.is_ok());
    let frames = result.unwrap();

    // Check image path format
    assert_eq!(frames[0].image_path, "/tmp/frame_0.000.jpg");
    assert_eq!(frames[1].image_path, "/tmp/frame_1.000.jpg");
  }

  #[tokio::test]
  async fn test_process_frames_with_yolo_no_processors() {
    let processor = create_processor();
    let frames = vec![create_test_frame(0.0, 0), create_test_frame(1.0, 30)];

    let result = processor
      .process_frames_with_yolo(&frames, true, true)
      .await;

    assert!(result.is_ok());
    let detections = result.unwrap();

    // Should have results for each frame, but empty detections due to no processors
    assert_eq!(detections.len(), 2);
    assert_eq!(detections[0].0, 0.0);
    assert_eq!(detections[0].1.len(), 0); // No detections
    assert_eq!(detections[1].0, 1.0);
    assert_eq!(detections[1].1.len(), 0); // No detections
  }

  #[tokio::test]
  async fn test_process_frames_with_yolo_objects_only() {
    let processor = create_processor();
    let frames = vec![create_test_frame(0.0, 0)];

    let result = processor
      .process_frames_with_yolo(&frames, true, false)
      .await;

    assert!(result.is_ok());
    let detections = result.unwrap();
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].0, 0.0);
  }

  #[tokio::test]
  async fn test_process_frames_with_yolo_faces_only() {
    let processor = create_processor();
    let frames = vec![create_test_frame(0.0, 0)];

    let result = processor
      .process_frames_with_yolo(&frames, false, true)
      .await;

    assert!(result.is_ok());
    let detections = result.unwrap();
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].0, 0.0);
  }

  #[tokio::test]
  async fn test_process_frames_with_yolo_none_enabled() {
    let processor = create_processor();
    let frames = vec![create_test_frame(0.0, 0)];

    let result = processor
      .process_frames_with_yolo(&frames, false, false)
      .await;

    assert!(result.is_ok());
    let detections = result.unwrap();
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].0, 0.0);
    assert_eq!(detections[0].1.len(), 0); // No detections when neither enabled
  }

  #[tokio::test]
  async fn test_analyze_video_full_pipeline() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();
    let options = create_analysis_options();

    let result = processor.analyze_video(&video_path, &options).await;

    assert!(result.is_ok());
    let detections = result.unwrap();

    // Should process the full video duration (120 seconds at 1 fps = 120 frames)
    assert_eq!(detections.len(), 120);

    // Check first and last timestamps
    assert_eq!(detections[0].0, 0.0);
    assert_eq!(detections[detections.len() - 1].0, 119.0);
  }

  #[tokio::test]
  async fn test_analyze_video_custom_sample_rate() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();
    let mut options = create_analysis_options();
    options.frame_sample_rate = 0.5; // 0.5 frames per second

    let result = processor.analyze_video(&video_path, &options).await;

    assert!(result.is_ok());
    let detections = result.unwrap();

    // Should process at 0.5 fps for 120 seconds = 60 frames
    assert_eq!(detections.len(), 60);
  }

  #[tokio::test]
  async fn test_analyze_video_nonexistent_file() {
    let processor = create_processor();
    let options = create_analysis_options();

    let result = processor
      .analyze_video("nonexistent_file.mp4", &options)
      .await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_extract_frame_at_timestamp() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let timestamp = 45.5;
    let result = processor
      .extract_frame_at_timestamp(&video_path, timestamp)
      .await;

    assert!(result.is_ok());
    let frame = result.unwrap();

    assert_eq!(frame.timestamp, timestamp);
    assert_eq!(frame.frame_number, (45.5 * 30.0) as u64); // 1365
    assert_eq!(frame.width, 1920);
    assert_eq!(frame.height, 1080);
    assert_eq!(frame.image_path, "/tmp/frame_45.500.jpg");
  }

  #[tokio::test]
  async fn test_extract_frame_at_timestamp_start() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let result = processor.extract_frame_at_timestamp(&video_path, 0.0).await;

    assert!(result.is_ok());
    let frame = result.unwrap();
    assert_eq!(frame.timestamp, 0.0);
    assert_eq!(frame.frame_number, 0);
  }

  #[tokio::test]
  async fn test_extract_frame_at_timestamp_end() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    let result = processor
      .extract_frame_at_timestamp(&video_path, 120.0)
      .await;

    assert!(result.is_ok());
    let frame = result.unwrap();
    assert_eq!(frame.timestamp, 120.0);
    assert_eq!(frame.frame_number, 3600); // 120 * 30
  }

  #[tokio::test]
  async fn test_cleanup_frames_no_files() {
    let processor = create_processor();
    let frames = vec![create_test_frame(0.0, 0), create_test_frame(1.0, 30)];

    // Cleanup should not fail even if files don't exist
    let result = processor.cleanup_frames(&frames).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_cleanup_frames_with_existing_files() {
    let processor = create_processor();
    let temp_dir = TempDir::new().unwrap();

    // Create actual frame files
    let frame1_path = temp_dir.path().join("frame_0.000.jpg");
    let frame2_path = temp_dir.path().join("frame_1.000.jpg");
    fs::write(&frame1_path, b"mock frame 1").unwrap();
    fs::write(&frame2_path, b"mock frame 2").unwrap();

    let frames = vec![
      ExtractedFrame {
        timestamp: 0.0,
        frame_number: 0,
        image_path: frame1_path.to_string_lossy().to_string(),
        width: 1920,
        height: 1080,
      },
      ExtractedFrame {
        timestamp: 1.0,
        frame_number: 30,
        image_path: frame2_path.to_string_lossy().to_string(),
        width: 1920,
        height: 1080,
      },
    ];

    // Verify files exist before cleanup
    assert!(frame1_path.exists());
    assert!(frame2_path.exists());

    let result = processor.cleanup_frames(&frames).await;
    assert!(result.is_ok());

    // Files should be removed after cleanup
    assert!(!frame1_path.exists());
    assert!(!frame2_path.exists());
  }

  #[test]
  fn test_video_metadata_structure() {
    let metadata = create_test_metadata();
    assert_eq!(metadata.duration, 120.0);
    assert_eq!(metadata.width, 1920);
    assert_eq!(metadata.height, 1080);
    assert_eq!(metadata.fps, 30.0);
    assert_eq!(metadata.total_frames, 3600);
  }

  #[test]
  fn test_extracted_frame_structure() {
    let frame = create_test_frame(5.5, 165);
    assert_eq!(frame.timestamp, 5.5);
    assert_eq!(frame.frame_number, 165);
    assert_eq!(frame.image_path, "/tmp/frame_5.500.jpg");
    assert_eq!(frame.width, 1920);
    assert_eq!(frame.height, 1080);
  }

  #[test]
  fn test_analysis_options_configuration() {
    let options = create_analysis_options();
    assert_eq!(options.frame_sample_rate, 1.0);
    assert!(options.enable_object_detection);
    assert!(options.enable_face_detection);
    assert!(options.enable_emotion_analysis);
    assert!(options.enable_composition_analysis);
    assert!(!options.enable_audio_analysis);
    assert_eq!(options.quality_threshold, 0.5);
    assert_eq!(options.max_moments, Some(10));
    assert_eq!(options.frame_sampling_rate, 1.0);
  }

  #[tokio::test]
  async fn test_video_processor_with_different_analysis_options() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    // Test with objects only
    let mut options = create_analysis_options();
    options.enable_face_detection = false;
    options.enable_object_detection = true;

    let result = processor.analyze_video(&video_path, &options).await;
    assert!(result.is_ok());

    // Test with faces only
    options.enable_face_detection = true;
    options.enable_object_detection = false;

    let result = processor.analyze_video(&video_path, &options).await;
    assert!(result.is_ok());

    // Test with neither enabled
    options.enable_face_detection = false;
    options.enable_object_detection = false;

    let result = processor.analyze_video(&video_path, &options).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_frame_extraction_edge_cases() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    // Test with very small time range
    let result = processor
      .extract_frames(&video_path, 1.0, Some(0.0), Some(0.1))
      .await;
    assert!(result.is_ok());
    let frames = result.unwrap();
    assert_eq!(frames.len(), 0); // Should be empty for very small range

    // Test with end time before start time (should be handled gracefully)
    let result = processor
      .extract_frames(&video_path, 1.0, Some(10.0), Some(5.0))
      .await;
    assert!(result.is_ok());
    let frames = result.unwrap();
    assert_eq!(frames.len(), 0); // Should be empty

    // Test with very high sample rate
    let result = processor
      .extract_frames(&video_path, 100.0, Some(0.0), Some(0.1))
      .await;
    assert!(result.is_ok());
    let frames = result.unwrap();
    assert_eq!(frames.len(), 10); // 0.1 seconds at 100 fps
  }

  #[tokio::test]
  async fn test_metadata_extraction_consistency() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    // Extract metadata multiple times - should be consistent
    let metadata1 = processor.extract_metadata(&video_path).await.unwrap();
    let metadata2 = processor.extract_metadata(&video_path).await.unwrap();

    assert_eq!(metadata1.duration, metadata2.duration);
    assert_eq!(metadata1.width, metadata2.width);
    assert_eq!(metadata1.height, metadata2.height);
    assert_eq!(metadata1.fps, metadata2.fps);
    assert_eq!(metadata1.total_frames, metadata2.total_frames);
  }

  #[test]
  fn test_frame_calculation_accuracy() {
    let _processor = create_processor();

    // Test frame number calculation
    let fps = 30.0;
    let timestamp = 10.5;
    let expected_frame = (timestamp * fps as f64) as u64;
    assert_eq!(expected_frame, 315);

    // Test with fractional seconds
    let timestamp = 1.333;
    let expected_frame = (timestamp * fps as f64) as u64;
    assert_eq!(expected_frame, 39); // Should truncate
  }

  #[tokio::test]
  async fn test_frame_extraction_interval_calculation() {
    let processor = create_processor();
    let (_temp_dir, video_path) = create_mock_video_file();

    // Test various sample rates
    let sample_rates = vec![0.5, 1.0, 2.0, 5.0, 10.0];

    for sample_rate in sample_rates {
      let result = processor
        .extract_frames(&video_path, sample_rate, Some(0.0), Some(10.0))
        .await;

      assert!(result.is_ok());
      let frames = result.unwrap();

      let expected_count = (10.0 * sample_rate as f64) as usize;
      assert_eq!(frames.len(), expected_count);

      // Check interval consistency
      if frames.len() > 1 {
        let interval = frames[1].timestamp - frames[0].timestamp;
        let expected_interval = 1.0 / sample_rate as f64;
        assert!((interval - expected_interval).abs() < 0.001);
      }
    }
  }
}
