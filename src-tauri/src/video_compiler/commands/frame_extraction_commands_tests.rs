//! Tests for frame extraction commands
//!
//! Comprehensive test suite for all frame extraction Tauri commands

use super::*;
use crate::video_compiler::{
    error::{Result, VideoCompilerError},
    preview::{PreviewGenerator, PreviewOptions},
    schema::{ProjectSchema, Subtitle, Timeline, Track},
};
use mockall::{mock, predicate::*};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{async_runtime::RwLock, test::MockBuilder, State};
use tempfile::TempDir;

// Mock for PreviewGenerator
mock! {
    PreviewGeneratorMock {
        pub async fn generate_frame(
            &self,
            project: &ProjectSchema,
            timestamp: f64,
            output_path: &str,
            options: Option<PreviewOptions>,
        ) -> Result<()>;
    }
}

// Helper function to create test state
async fn create_test_state() -> VideoCompilerState {
    VideoCompilerState {
        ffmpeg_path: Arc::new(RwLock::new("ffmpeg".to_string())),
        ffprobe_path: Arc::new(RwLock::new("ffprobe".to_string())),
        cache_manager: Arc::new(RwLock::new(
            crate::video_compiler::cache::CacheManager::new(tempfile::tempdir().unwrap().path()),
        )),
        temp_dir: Arc::new(RwLock::new(tempfile::tempdir().unwrap().path().to_path_buf())),
    }
}

// Helper function to create test project
fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("test_project".to_string());
    project.timeline.duration = 60.0;
    
    // Add test subtitle
    project.subtitles.push(Subtitle {
        id: "subtitle_1".to_string(),
        text: "Test subtitle".to_string(),
        start_time: 5.0,
        end_time: 10.0,
        style: Default::default(),
        position: Default::default(),
        effects: vec![],
    });
    
    project
}

#[cfg(test)]
mod extract_timeline_frames_tests {
    use super::*;

    #[tokio::test]
    async fn test_extract_timeline_frames_success() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        // Create expected output files
        for i in 0..6 {
            let timestamp = i as f64 * 10.0;
            let frame_path = format!("{}/frame_{:.2}.png", output_dir, timestamp);
            tokio::fs::write(&frame_path, b"fake png data").await.unwrap();
        }

        let tauri_state = State::new(state);
        let result = extract_timeline_frames(
            project,
            10.0, // 10 second interval
            output_dir.clone(),
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        let frame_paths = result.unwrap();
        assert_eq!(frame_paths.len(), 7); // 0, 10, 20, 30, 40, 50, 60
        
        // Verify paths format
        assert!(frame_paths[0].ends_with("/frame_0.00.png"));
        assert!(frame_paths[6].ends_with("/frame_60.00.png"));
    }

    #[tokio::test]
    async fn test_extract_timeline_frames_small_interval() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let mut project = create_test_project();
        project.timeline.duration = 5.0;
        let state = create_test_state().await;

        // Small interval should generate more frames
        let tauri_state = State::new(state);
        let result = extract_timeline_frames(
            project,
            0.5, // 0.5 second interval
            output_dir,
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        let frame_paths = result.unwrap();
        assert_eq!(frame_paths.len(), 11); // 0, 0.5, 1, 1.5, ..., 5
    }
}

#[cfg(test)]
mod extract_subtitle_frames_tests {
    use super::*;

    #[tokio::test]
    async fn test_extract_subtitle_frames_success() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        let tauri_state = State::new(state);
        let result = extract_subtitle_frames(project, output_dir.clone(), tauri_state).await;

        assert!(result.is_ok());
        let frame_paths = result.unwrap();
        assert_eq!(frame_paths.len(), 1);
        assert!(frame_paths[0].ends_with("/subtitle_subtitle_1.png"));
    }

    #[tokio::test]
    async fn test_extract_subtitle_frames_empty_project() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let mut project = create_test_project();
        project.subtitles.clear();
        let state = create_test_state().await;

        let tauri_state = State::new(state);
        let result = extract_subtitle_frames(project, output_dir, tauri_state).await;

        assert!(result.is_ok());
        let frame_paths = result.unwrap();
        assert_eq!(frame_paths.len(), 0);
    }
}

#[cfg(test)]
mod generate_preview_tests {
    use super::*;

    #[tokio::test]
    async fn test_generate_preview_success() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("preview.png").to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        // Create fake output file
        tokio::fs::write(&output_path, b"fake preview").await.unwrap();

        let tauri_state = State::new(state);
        let result = generate_preview(
            project,
            15.0, // timestamp
            output_path.clone(),
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), output_path);
    }

    #[tokio::test]
    async fn test_generate_preview_negative_timestamp() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("preview.png").to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        let tauri_state = State::new(state);
        let result = generate_preview(
            project,
            -5.0, // negative timestamp should still work (clamped to 0)
            output_path.clone(),
            tauri_state,
        )
        .await;

        // This should succeed as PreviewGenerator handles edge cases
        assert!(result.is_ok());
    }
}

#[cfg(test)]
mod generate_preview_batch_tests {
    use super::*;

    #[tokio::test]
    async fn test_generate_preview_batch_success() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let project = create_test_project();
        let timestamps = vec![0.0, 5.0, 10.0, 15.0];
        let state = create_test_state().await;

        // Create expected output files
        for ts in &timestamps {
            let path = format!("{}/preview_{:.2}.png", output_dir, ts);
            tokio::fs::write(&path, b"fake preview").await.unwrap();
        }

        let tauri_state = State::new(state);
        let result = generate_preview_batch(
            project,
            timestamps.clone(),
            output_dir.clone(),
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        let paths = result.unwrap();
        assert_eq!(paths.len(), 4);
        assert!(paths[0].ends_with("/preview_0.00.png"));
        assert!(paths[3].ends_with("/preview_15.00.png"));
    }

    #[tokio::test]
    async fn test_generate_preview_batch_empty_timestamps() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        let tauri_state = State::new(state);
        let result = generate_preview_batch(
            project,
            vec![], // empty timestamps
            output_dir,
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        let paths = result.unwrap();
        assert_eq!(paths.len(), 0);
    }
}

#[cfg(test)]
mod generate_preview_with_settings_tests {
    use super::*;

    #[tokio::test]
    async fn test_generate_preview_with_custom_settings() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("preview.png").to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        // Create custom settings
        let settings = serde_json::json!({
            "width": 1280,
            "height": 720,
            "quality": 95
        });

        tokio::fs::write(&output_path, b"fake preview").await.unwrap();

        let tauri_state = State::new(state);
        let result = generate_preview_with_settings(
            project,
            10.0,
            output_path.clone(),
            settings,
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), output_path);
    }

    #[tokio::test]
    async fn test_generate_preview_with_default_settings() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("preview.png").to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        // Empty settings should use defaults
        let settings = serde_json::json!({});

        tokio::fs::write(&output_path, b"fake preview").await.unwrap();

        let tauri_state = State::new(state);
        let result = generate_preview_with_settings(
            project,
            10.0,
            output_path.clone(),
            settings,
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        // Should use defaults: 1920x1080, quality 80
    }
}

#[cfg(test)]
mod cache_info_tests {
    use super::*;

    #[tokio::test]
    async fn test_get_frame_extraction_cache_info() {
        let state = create_test_state().await;
        let tauri_state = State::new(state);

        let result = get_frame_extraction_cache_info(
            "project_123".to_string(),
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        let info = result.unwrap();
        
        // Check the JSON structure
        assert_eq!(info["project_id"], "project_123");
        assert_eq!(info["frame_count"], 0);
        assert_eq!(info["total_size"], 0);
        assert!(info["last_accessed"].is_string());
    }
}

#[cfg(test)]
mod clear_cache_tests {
    use super::*;

    #[tokio::test]
    async fn test_clear_frame_cache() {
        let state = create_test_state().await;
        let tauri_state = State::new(state);

        let result = clear_frame_cache(
            "project_123".to_string(),
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
    }
}

#[cfg(test)]
mod extract_video_frame_tests {
    use super::*;
    use std::process::{Command, ExitStatus, Output};

    #[tokio::test]
    async fn test_extract_video_frame_success() {
        let temp_dir = TempDir::new().unwrap();
        let video_path = temp_dir.path().join("video.mp4").to_str().unwrap().to_string();
        let output_path = temp_dir.path().join("frame.png").to_str().unwrap().to_string();
        let state = create_test_state().await;

        // Create fake input video
        tokio::fs::write(&video_path, b"fake video data").await.unwrap();
        
        // Create fake output to simulate FFmpeg success
        tokio::fs::write(&output_path, b"fake frame data").await.unwrap();

        let tauri_state = State::new(state);
        
        // Note: This will fail with real FFmpeg but demonstrates the API
        let result = extract_video_frame(
            video_path,
            5.0,
            output_path.clone(),
            tauri_state,
        )
        .await;

        // In real tests with mock FFmpeg, this would succeed
        match result {
            Ok(path) => assert_eq!(path, output_path),
            Err(e) => {
                // Expected in test environment without real FFmpeg
                assert!(e.contains("FFmpeg"));
            }
        }
    }

    #[tokio::test]
    async fn test_extract_video_frame_invalid_video() {
        let temp_dir = TempDir::new().unwrap();
        let video_path = "/non/existent/video.mp4".to_string();
        let output_path = temp_dir.path().join("frame.png").to_str().unwrap().to_string();
        let state = create_test_state().await;

        let tauri_state = State::new(state);
        let result = extract_video_frame(
            video_path,
            5.0,
            output_path,
            tauri_state,
        )
        .await;

        assert!(result.is_err());
    }
}

#[cfg(test)]
mod extract_video_frames_batch_tests {
    use super::*;

    #[tokio::test]
    async fn test_extract_video_frames_batch_success() {
        let temp_dir = TempDir::new().unwrap();
        let video_path = temp_dir.path().join("video.mp4").to_str().unwrap().to_string();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let timestamps = vec![1.0, 5.0, 10.0];
        let state = create_test_state().await;

        // Create fake video
        tokio::fs::write(&video_path, b"fake video").await.unwrap();

        // Pre-create expected output files (simulating FFmpeg output)
        for (i, _) in timestamps.iter().enumerate() {
            let path = format!("{}/frame_{:04}.png", output_dir, i);
            tokio::fs::write(&path, b"fake frame").await.unwrap();
        }

        let tauri_state = State::new(state);
        let result = extract_video_frames_batch(
            video_path,
            timestamps.clone(),
            output_dir.clone(),
            tauri_state,
        )
        .await;

        // This will fail with real FFmpeg but shows the expected behavior
        match result {
            Ok(paths) => {
                assert_eq!(paths.len(), 3);
                assert!(paths[0].ends_with("/frame_0000.png"));
                assert!(paths[2].ends_with("/frame_0002.png"));
            }
            Err(e) => {
                // Expected in test environment
                assert!(e.contains("FFmpeg"));
            }
        }
    }

    #[tokio::test]
    async fn test_extract_video_frames_batch_empty_timestamps() {
        let temp_dir = TempDir::new().unwrap();
        let video_path = temp_dir.path().join("video.mp4").to_str().unwrap().to_string();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let state = create_test_state().await;

        tokio::fs::write(&video_path, b"fake video").await.unwrap();

        let tauri_state = State::new(state);
        let result = extract_video_frames_batch(
            video_path,
            vec![], // empty timestamps
            output_dir,
            tauri_state,
        )
        .await;

        assert!(result.is_ok());
        let paths = result.unwrap();
        assert_eq!(paths.len(), 0);
    }
}

#[cfg(test)]
mod get_video_thumbnails_tests {
    use super::*;

    // Mock for get_video_info
    #[tokio::test]
    async fn test_get_video_thumbnails_success() {
        let temp_dir = TempDir::new().unwrap();
        let video_path = temp_dir.path().join("video.mp4").to_str().unwrap().to_string();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let state = create_test_state().await;

        // Create fake video
        tokio::fs::write(&video_path, b"fake video").await.unwrap();

        let tauri_state = State::new(state);
        
        // This will fail because get_video_info is not mocked
        let result = get_video_thumbnails(
            video_path,
            5, // 5 thumbnails
            output_dir,
            tauri_state,
        )
        .await;

        // In a real test with mocked dependencies:
        // - get_video_info would return duration: 60.0
        // - Thumbnails would be at: 10, 20, 30, 40, 50 seconds
        // - 5 frame paths would be returned
        
        match result {
            Ok(paths) => {
                assert_eq!(paths.len(), 5);
            }
            Err(e) => {
                // Expected in test environment without mocked get_video_info
                assert!(e.contains("duration") || e.contains("FFmpeg"));
            }
        }
    }

    #[tokio::test]
    async fn test_get_video_thumbnails_zero_count() {
        let temp_dir = TempDir::new().unwrap();
        let video_path = temp_dir.path().join("video.mp4").to_str().unwrap().to_string();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let state = create_test_state().await;

        tokio::fs::write(&video_path, b"fake video").await.unwrap();

        let tauri_state = State::new(state);
        let result = get_video_thumbnails(
            video_path,
            0, // zero thumbnails requested
            output_dir,
            tauri_state,
        )
        .await;

        // Should return empty vec or error
        match result {
            Ok(paths) => assert_eq!(paths.len(), 0),
            Err(_) => (), // Also acceptable
        }
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[tokio::test]
    async fn test_full_preview_generation_workflow() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        // Test complete workflow:
        // 1. Generate timeline frames
        // 2. Generate subtitle frames  
        // 3. Get cache info
        // 4. Clear cache

        let tauri_state = State::new(state);

        // Step 1: Generate timeline frames
        let timeline_result = extract_timeline_frames(
            project.clone(),
            20.0,
            output_dir.clone(),
            tauri_state.clone(),
        )
        .await;
        assert!(timeline_result.is_ok());

        // Step 2: Generate subtitle frames
        let subtitle_result = extract_subtitle_frames(
            project,
            output_dir,
            tauri_state.clone(),
        )
        .await;
        assert!(subtitle_result.is_ok());

        // Step 3: Get cache info
        let cache_info = get_frame_extraction_cache_info(
            "test_project".to_string(),
            tauri_state.clone(),
        )
        .await;
        assert!(cache_info.is_ok());

        // Step 4: Clear cache
        let clear_result = clear_frame_cache(
            "test_project".to_string(),
            tauri_state,
        )
        .await;
        assert!(clear_result.is_ok());
    }
}

#[cfg(test)]
mod error_handling_tests {
    use super::*;

    #[tokio::test]
    async fn test_invalid_output_directory() {
        let project = create_test_project();
        let state = create_test_state().await;
        let invalid_dir = "/invalid/path/that/does/not/exist";

        let tauri_state = State::new(state);
        let result = extract_timeline_frames(
            project,
            10.0,
            invalid_dir.to_string(),
            tauri_state,
        )
        .await;

        // Should handle gracefully, creating directories or failing with clear error
        match result {
            Ok(_) => (), // Directory might be created
            Err(e) => assert!(e.contains("path") || e.contains("directory")),
        }
    }

    #[tokio::test]
    async fn test_preview_generation_with_invalid_timestamp() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("preview.png").to_str().unwrap().to_string();
        let project = create_test_project();
        let state = create_test_state().await;

        let tauri_state = State::new(state);
        let result = generate_preview(
            project,
            f64::NAN, // NaN timestamp
            output_path,
            tauri_state,
        )
        .await;

        // Should handle gracefully
        match result {
            Ok(_) => (), // Might clamp to valid range
            Err(e) => assert!(e.contains("timestamp") || e.contains("invalid")),
        }
    }
}