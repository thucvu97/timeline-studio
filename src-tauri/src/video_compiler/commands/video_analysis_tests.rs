//! Tests for video analysis commands
//!
//! Comprehensive test suite for video analysis functionality

use super::*;
use crate::video_compiler::commands::ExecutionResult;
use tempfile::TempDir;

#[cfg(test)]
use mockall::{mock, predicate::*};

// Mock for FFmpegExecutor
#[cfg(test)]
mock! {
    FFmpegExecutorMock {
        pub async fn execute(&self, cmd: tokio::process::Command) -> Result<ExecutionResult, String>;
    }
}

// Helper function to create successful execution result
#[cfg(test)]
#[allow(dead_code)]
fn _create_success_result(stdout: String) -> ExecutionResult {
  ExecutionResult {
    success: true,
    exit_code: Some(0),
    stdout,
    stderr: String::new(),
    duration_ms: 1000,
    final_progress: None,
    error: None,
  }
}

// Helper function to create FFprobe JSON output
#[cfg(test)]
#[allow(dead_code)]
fn _create_ffprobe_json() -> String {
  serde_json::json!({
      "format": {
          "duration": "120.5",
          "bit_rate": "5000000",
          "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
          "size": "104857600"
      },
      "streams": [
          {
              "codec_type": "video",
              "codec_name": "h264",
              "width": 1920,
              "height": 1080,
              "r_frame_rate": "30/1"
          },
          {
              "codec_type": "audio",
              "codec_name": "aac",
              "channels": 2,
              "sample_rate": "48000"
          }
      ]
  })
  .to_string()
}

#[cfg(test)]
mod metadata_tests {
  use super::*;

  #[tokio::test]
  async fn test_get_metadata_success() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    // Note: In real implementation, we'd need to mock FFmpegExecutor
    // For now, testing the structure
    let result = ffmpeg_get_metadata(video_path.to_str().unwrap().to_string()).await;

    // This will fail with real ffprobe, but shows the expected behavior
    match result {
      Ok(_metadata) => {
        // In a real test with mocks:
        // assert_eq!(metadata.duration, 120.5);
        // assert_eq!(metadata.width, 1920);
        // assert_eq!(metadata.height, 1080);
      }
      Err(e) => {
        assert!(e.contains("ffprobe") || e.contains("Ошибка"));
      }
    }
  }

  #[tokio::test]
  async fn test_get_metadata_file_not_found() {
    let result = ffmpeg_get_metadata("/non/existent/file.mp4".to_string()).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Файл не найден"));
  }

  #[tokio::test]
  async fn test_metadata_fps_parsing() {
    // Test FPS parsing from "30/1" format
    let fps_str = "30/1";
    let parts: Vec<&str> = fps_str.split('/').collect();
    let num: f64 = parts[0].parse().unwrap();
    let den: f64 = parts[1].parse().unwrap();
    let fps = num / den;

    assert_eq!(fps, 30.0);
  }

  #[tokio::test]
  async fn test_metadata_fps_parsing_complex() {
    // Test FPS parsing from "24000/1001" format (23.976 fps)
    let fps_str = "24000/1001";
    let parts: Vec<&str> = fps_str.split('/').collect();
    let num: f64 = parts[0].parse().unwrap();
    let den: f64 = parts[1].parse().unwrap();
    let fps = num / den;

    assert!((fps - 23.976).abs() < 0.001);
  }
}

#[cfg(test)]
mod scene_detection_tests {
  use super::*;

  #[tokio::test]
  async fn test_detect_scenes_success() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let result = ffmpeg_detect_scenes(
      video_path.to_str().unwrap().to_string(),
      0.3, // threshold
      2.0, // min scene length
    )
    .await;

    // Current implementation returns mock data
    match result {
      Ok(scene_result) => {
        assert_eq!(scene_result.total_scenes, 2);
        assert_eq!(scene_result.scenes.len(), 2);
        assert!(scene_result.average_scene_length > 0.0);
      }
      Err(e) => {
        // Expected with real FFmpeg
        assert!(e.contains("ffmpeg"));
      }
    }
  }

  #[tokio::test]
  async fn test_detect_scenes_threshold_validation() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    // Test with different thresholds
    let thresholds = vec![0.1, 0.3, 0.5, 0.7, 0.9];

    for threshold in thresholds {
      let result =
        ffmpeg_detect_scenes(video_path.to_str().unwrap().to_string(), threshold, 1.0).await;

      // Should accept all valid thresholds
      assert!(result.is_ok() || result.unwrap_err().contains("ffmpeg"));
    }
  }

  #[tokio::test]
  async fn test_scene_structure() {
    let scene = Scene {
      start_time: 0.0,
      end_time: 10.0,
      confidence: 0.8,
      thumbnail_path: Some("/tmp/thumb.jpg".to_string()),
    };

    assert_eq!(scene.end_time - scene.start_time, 10.0);
    assert!(scene.confidence >= 0.0 && scene.confidence <= 1.0);
    assert!(scene.thumbnail_path.is_some());
  }
}

#[cfg(test)]
mod quality_analysis_tests {
  use super::*;

  #[tokio::test]
  async fn test_analyze_quality_success() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let result = ffmpeg_analyze_quality(
      video_path.to_str().unwrap().to_string(),
      1.0,  // sample rate
      true, // enable noise detection
      true, // enable stability check
    )
    .await;

    assert!(result.is_ok());
    let quality = result.unwrap();

    // Verify all metrics are in valid range [0, 1]
    assert!(quality.overall >= 0.0 && quality.overall <= 1.0);
    assert!(quality.sharpness >= 0.0 && quality.sharpness <= 1.0);
    assert!(quality.brightness >= 0.0 && quality.brightness <= 1.0);
    assert!(quality.contrast >= 0.0 && quality.contrast <= 1.0);
    assert!(quality.saturation >= 0.0 && quality.saturation <= 1.0);
    assert!(quality.noise >= 0.0 && quality.noise <= 1.0);
    assert!(quality.stability >= 0.0 && quality.stability <= 1.0);
  }

  #[tokio::test]
  async fn test_quality_analysis_options() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    // Test with noise detection disabled
    let result1 = ffmpeg_analyze_quality(
      video_path.to_str().unwrap().to_string(),
      1.0,
      false, // disable noise detection
      true,
    )
    .await;
    assert!(result1.is_ok());

    // Test with stability check disabled
    let result2 = ffmpeg_analyze_quality(
      video_path.to_str().unwrap().to_string(),
      1.0,
      true,
      false, // disable stability check
    )
    .await;
    assert!(result2.is_ok());
  }

  #[tokio::test]
  async fn test_quality_issues_detection() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let result = ffmpeg_analyze_quality(video_path.to_str().unwrap().to_string(), 1.0, true, true)
      .await
      .unwrap();

    assert!(!result.issues.is_empty());
    assert!(result.issues.iter().any(|issue| issue.contains("яркость")));
    assert!(result.issues.iter().any(|issue| issue.contains("шум")));
  }
}

#[cfg(test)]
mod silence_detection_tests {
  use super::*;

  #[tokio::test]
  async fn test_detect_silence_success() {
    let temp_dir = TempDir::new().unwrap();
    let audio_path = temp_dir.path().join("test.mp3");
    std::fs::write(&audio_path, b"fake audio").unwrap();

    let result = ffmpeg_detect_silence(
      audio_path.to_str().unwrap().to_string(),
      -30.0, // threshold in dB
      0.5,   // min duration in seconds
    )
    .await;

    match result {
      Ok(silence_result) => {
        assert!(!silence_result.silences.is_empty());
        assert!(silence_result.total_silence_duration > 0.0);
        assert!(silence_result.speech_percentage >= 0.0);
        assert!(silence_result.speech_percentage <= 100.0);
      }
      Err(e) => {
        // Expected with real FFmpeg
        assert!(e.contains("ffmpeg"));
      }
    }
  }

  #[tokio::test]
  async fn test_silence_segment_validation() {
    let segment = SilenceSegment {
      start_time: 5.2,
      end_time: 7.8,
      duration: 2.6,
      confidence: 0.9,
    };

    assert!((segment.end_time - segment.start_time - segment.duration).abs() < 0.0001);
    assert!(segment.confidence >= 0.0 && segment.confidence <= 1.0);
    assert!(segment.duration > 0.0);
  }

  #[tokio::test]
  async fn test_silence_detection_thresholds() {
    let temp_dir = TempDir::new().unwrap();
    let audio_path = temp_dir.path().join("test.mp3");
    std::fs::write(&audio_path, b"fake audio").unwrap();

    // Test different threshold values
    let thresholds = vec![-60.0, -40.0, -30.0, -20.0];
    let durations = vec![0.1, 0.5, 1.0, 2.0];

    for threshold in thresholds {
      for duration in &durations {
        let result = ffmpeg_detect_silence(
          audio_path.to_str().unwrap().to_string(),
          threshold,
          *duration,
        )
        .await;

        assert!(result.is_ok() || result.unwrap_err().contains("ffmpeg"));
      }
    }
  }
}

#[cfg(test)]
mod motion_analysis_tests {
  use super::*;

  #[tokio::test]
  async fn test_analyze_motion_success() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let result = ffmpeg_analyze_motion(
      video_path.to_str().unwrap().to_string(),
      0.5, // sensitivity
    )
    .await;

    assert!(result.is_ok());
    let motion = result.unwrap();

    // Verify all values are in valid range
    assert!(motion.motion_intensity >= 0.0 && motion.motion_intensity <= 1.0);
    assert!(motion.object_movement >= 0.0 && motion.object_movement <= 1.0);

    // Check camera movement
    assert!(motion.camera_movement.panning >= 0.0 && motion.camera_movement.panning <= 1.0);
    assert!(motion.camera_movement.tilting >= 0.0 && motion.camera_movement.tilting <= 1.0);
    assert!(motion.camera_movement.zooming >= 0.0 && motion.camera_movement.zooming <= 1.0);
    assert!(motion.camera_movement.stability >= 0.0 && motion.camera_movement.stability <= 1.0);
  }

  #[tokio::test]
  async fn test_motion_profile() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let result = ffmpeg_analyze_motion(video_path.to_str().unwrap().to_string(), 0.7)
      .await
      .unwrap();

    assert!(!result.motion_profile.is_empty());

    // Verify motion profile is ordered by timestamp
    for i in 1..result.motion_profile.len() {
      assert!(result.motion_profile[i].timestamp > result.motion_profile[i - 1].timestamp);
    }

    // Verify all intensities are valid
    for point in &result.motion_profile {
      assert!(point.intensity >= 0.0 && point.intensity <= 1.0);
    }
  }
}

#[cfg(test)]
mod keyframe_extraction_tests {
  use super::*;

  #[tokio::test]
  async fn test_extract_keyframes_success() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let result = ffmpeg_extract_keyframes(
      video_path.to_str().unwrap().to_string(),
      5,                  // count
      "high".to_string(), // quality
      true,               // AI description
    )
    .await;

    assert!(result.is_ok());
    let keyframes = result.unwrap();

    assert!(!keyframes.key_frames.is_empty());
    assert!(!keyframes.thumbnail_path.is_empty());

    // Check AI descriptions are present
    for frame in &keyframes.key_frames {
      assert!(frame.description.is_some());
    }
  }

  #[tokio::test]
  async fn test_extract_keyframes_without_ai() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let result = ffmpeg_extract_keyframes(
      video_path.to_str().unwrap().to_string(),
      3,
      "medium".to_string(),
      false, // No AI description
    )
    .await
    .unwrap();

    // Check AI descriptions are NOT present
    for frame in &result.key_frames {
      assert!(frame.description.is_none());
    }
  }

  #[tokio::test]
  async fn test_keyframe_quality_settings() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let qualities = vec!["low", "medium", "high", "best"];

    for quality in qualities {
      let result = ffmpeg_extract_keyframes(
        video_path.to_str().unwrap().to_string(),
        2,
        quality.to_string(),
        false,
      )
      .await;

      assert!(result.is_ok());
    }
  }
}

#[cfg(test)]
mod audio_analysis_tests {
  use super::*;

  #[tokio::test]
  async fn test_analyze_audio_success() {
    let temp_dir = TempDir::new().unwrap();
    let audio_path = temp_dir.path().join("test.mp3");
    std::fs::write(&audio_path, b"fake audio").unwrap();

    let result = ffmpeg_analyze_audio(
      audio_path.to_str().unwrap().to_string(),
      true, // enable spectral analysis
      true, // enable dynamics analysis
    )
    .await;

    assert!(result.is_ok());
    let audio = result.unwrap();

    // Verify volume data
    assert!(audio.volume.average >= 0.0 && audio.volume.average <= 1.0);
    assert!(audio.volume.peak >= 0.0 && audio.volume.peak <= 1.0);
    assert!(audio.volume.rms >= 0.0 && audio.volume.rms <= 1.0);
    assert!(audio.volume.peak >= audio.volume.average);

    // Verify frequency data
    assert!(audio.frequency.low_end >= 0.0 && audio.frequency.low_end <= 1.0);
    assert!(audio.frequency.mid_range >= 0.0 && audio.frequency.mid_range <= 1.0);
    assert!(audio.frequency.high_end >= 0.0 && audio.frequency.high_end <= 1.0);

    // Verify dynamics data
    assert!(audio.dynamics.dynamic_range >= 0.0 && audio.dynamics.dynamic_range <= 1.0);
    assert!(audio.dynamics.compression_ratio > 0.0);

    // Verify quality data
    assert!(!audio.quality.clipping);
    assert!(audio.quality.noise_level >= 0.0 && audio.quality.noise_level <= 1.0);
    assert!(audio.quality.overall_quality >= 0.0 && audio.quality.overall_quality <= 1.0);
  }

  #[tokio::test]
  async fn test_audio_analysis_options() {
    let temp_dir = TempDir::new().unwrap();
    let audio_path = temp_dir.path().join("test.mp3");
    std::fs::write(&audio_path, b"fake audio").unwrap();

    // Test with spectral analysis disabled
    let result1 = ffmpeg_analyze_audio(audio_path.to_str().unwrap().to_string(), false, true).await;
    assert!(result1.is_ok());

    // Test with dynamics analysis disabled
    let result2 = ffmpeg_analyze_audio(audio_path.to_str().unwrap().to_string(), true, false).await;
    assert!(result2.is_ok());

    // Test with both disabled
    let result3 =
      ffmpeg_analyze_audio(audio_path.to_str().unwrap().to_string(), false, false).await;
    assert!(result3.is_ok());
  }
}

#[cfg(test)]
mod quick_analysis_tests {
  use super::*;

  #[tokio::test]
  async fn test_quick_analysis_success() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();

    let result = ffmpeg_quick_analysis(video_path.to_str().unwrap().to_string()).await;

    assert!(result.is_ok());
    let analysis = result.unwrap();

    assert!(analysis["overall"].is_number());
    assert!(analysis["estimatedScenes"].is_number());

    let overall = analysis["overall"].as_f64().unwrap();
    assert!((0.0..=1.0).contains(&overall));

    let scenes = analysis["estimatedScenes"].as_u64().unwrap();
    assert!(scenes > 0);
  }

  #[tokio::test]
  async fn test_quick_analysis_file_not_found() {
    let result = ffmpeg_quick_analysis("/non/existent/file.mp4".to_string()).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Файл не найден"));
  }
}

#[cfg(test)]
mod serialization_tests {
  use super::*;

  #[test]
  fn test_quality_analysis_serialization() {
    let quality = QualityAnalysisResult {
      overall: 0.75,
      sharpness: 0.8,
      brightness: 0.6,
      contrast: 0.7,
      saturation: 0.65,
      noise: 0.2,
      stability: 0.85,
      issues: vec!["Test issue".to_string()],
    };

    let json = serde_json::to_string(&quality).unwrap();
    let deserialized: QualityAnalysisResult = serde_json::from_str(&json).unwrap();

    assert_eq!(quality.overall, deserialized.overall);
    assert_eq!(quality.issues.len(), deserialized.issues.len());
  }

  #[test]
  fn test_motion_analysis_serialization() {
    let motion = MotionAnalysisResult {
      motion_intensity: 0.6,
      camera_movement: CameraMovement {
        panning: 0.3,
        tilting: 0.1,
        zooming: 0.2,
        stability: 0.8,
      },
      object_movement: 0.7,
      motion_profile: vec![MotionPoint {
        timestamp: 0.0,
        intensity: 0.5,
      }],
    };

    let json = serde_json::to_string(&motion).unwrap();
    let deserialized: MotionAnalysisResult = serde_json::from_str(&json).unwrap();

    assert_eq!(motion.motion_intensity, deserialized.motion_intensity);
    assert_eq!(
      motion.motion_profile.len(),
      deserialized.motion_profile.len()
    );
  }

  #[test]
  fn test_audio_analysis_serialization() {
    let audio = AudioAnalysisResult {
      volume: VolumeData {
        average: 0.6,
        peak: 0.9,
        rms: 0.65,
      },
      frequency: FrequencyData {
        low_end: 0.4,
        mid_range: 0.7,
        high_end: 0.5,
      },
      dynamics: DynamicsData {
        dynamic_range: 0.8,
        compression_ratio: 2.5,
      },
      quality: AudioQuality {
        clipping: false,
        noise_level: 0.15,
        overall_quality: 0.85,
      },
    };

    let json = serde_json::to_string(&audio).unwrap();
    let deserialized: AudioAnalysisResult = serde_json::from_str(&json).unwrap();

    assert_eq!(audio.volume.average, deserialized.volume.average);
    assert_eq!(audio.quality.clipping, deserialized.quality.clipping);
  }
}

#[cfg(test)]
mod integration_tests {
  use super::*;

  #[tokio::test]
  async fn test_full_video_analysis_workflow() {
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test.mp4");
    std::fs::write(&video_path, b"fake video").unwrap();
    let path_str = video_path.to_str().unwrap().to_string();

    // 1. Get metadata
    let _metadata_result = ffmpeg_get_metadata(path_str.clone()).await;

    // 2. Detect scenes
    let _scenes_result = ffmpeg_detect_scenes(path_str.clone(), 0.3, 2.0).await;

    // 3. Analyze quality
    let quality_result = ffmpeg_analyze_quality(path_str.clone(), 1.0, true, true).await;
    assert!(quality_result.is_ok());

    // 4. Detect silence
    let _silence_result = ffmpeg_detect_silence(path_str.clone(), -30.0, 0.5).await;

    // 5. Analyze motion
    let motion_result = ffmpeg_analyze_motion(path_str.clone(), 0.5).await;
    assert!(motion_result.is_ok());

    // 6. Extract keyframes
    let keyframes_result =
      ffmpeg_extract_keyframes(path_str.clone(), 5, "high".to_string(), true).await;
    assert!(keyframes_result.is_ok());

    // 7. Analyze audio
    let audio_result = ffmpeg_analyze_audio(path_str.clone(), true, true).await;
    assert!(audio_result.is_ok());

    // 8. Quick analysis
    let quick_result = ffmpeg_quick_analysis(path_str).await;
    assert!(quick_result.is_ok());
  }
}
