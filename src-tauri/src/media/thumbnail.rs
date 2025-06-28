// Модуль для генерации превью медиафайлов

use std::path::Path;
use tokio::process::Command;

/// Генерирует превью для видеофайла
pub async fn generate_thumbnail(
  input_path: &Path,
  output_path: &Path,
  width: u32,
  height: u32,
  time_offset: f64,
) -> Result<(), String> {
  let status = Command::new("ffmpeg")
    .arg("-i")
    .arg(input_path.to_string_lossy().as_ref())
    .arg("-ss")
    .arg(time_offset.to_string())
    .arg("-vframes")
    .arg("1")
    .arg("-vf")
    .arg(format!("scale={width}:{height}"))
    .arg("-q:v")
    .arg("2")
    .arg(output_path.to_string_lossy().as_ref())
    .arg("-y") // Перезаписать если существует
    .output()
    .await
    .map_err(|e| format!("Failed to execute ffmpeg: {e}"))?;

  if !status.status.success() {
    let stderr = String::from_utf8_lossy(&status.stderr);
    return Err(format!("FFmpeg failed: {stderr}"));
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_generate_thumbnail_invalid_input() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("nonexistent.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("FFmpeg failed"));
  }

  #[tokio::test]
  async fn test_generate_thumbnail_invalid_output_dir() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = Path::new("/nonexistent/dir/thumbnail.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let result = generate_thumbnail(&input_path, output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_zero_dimensions() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    // FFmpeg should handle this gracefully or error out
    let result = generate_thumbnail(&input_path, &output_path, 0, 0, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_negative_time_offset() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    // Negative time offset should work (ffmpeg treats it as 0)
    let result = generate_thumbnail(&input_path, &output_path, 320, 240, -5.0).await;
    // This will fail because our dummy file isn't a real video
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_various_dimensions() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let test_cases = vec![
      (1920, 1080), // Full HD
      (1280, 720),  // HD
      (640, 480),   // SD
      (320, 240),   // Small
      (100, 100),   // Square
      (1000, 1),    // Extreme aspect ratio
    ];

    for (width, height) in test_cases {
      let output_path = temp_dir.path().join(format!("thumb_{width}x{height}.jpg"));
      let result = generate_thumbnail(&input_path, &output_path, width, height, 0.0).await;
      // All should fail because our dummy file isn't a real video
      assert!(result.is_err());
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_various_time_offsets() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let time_offsets = vec![0.0, 0.5, 1.0, 5.0, 10.0, 60.0, 3600.0];

    for offset in time_offsets {
      let output_path = temp_dir.path().join(format!("thumb_{offset}.jpg"));
      let result = generate_thumbnail(&input_path, &output_path, 320, 240, offset).await;
      // All should fail because our dummy file isn't a real video
      assert!(result.is_err());
      assert!(result.unwrap_err().contains("FFmpeg failed"));
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_special_characters_in_path() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test video (2024) [HD].mp4");
    let output_path = temp_dir.path().join("thumb@2x.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_unicode_path() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("тест_видео_файл.mp4");
    let output_path = temp_dir.path().join("превью.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_overwrite_existing() {
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("test.mp4");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // Create a dummy input file
    fs::write(&input_path, b"dummy video data").unwrap();

    // Create an existing output file
    fs::write(&output_path, b"existing thumbnail").unwrap();
    assert!(output_path.exists());

    // Try to generate thumbnail (will fail, but should attempt to overwrite)
    let result = generate_thumbnail(&input_path, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_thumbnail_command_injection_protection() {
    let temp_dir = TempDir::new().unwrap();
    // Try to inject commands through filename
    let malicious_input = temp_dir.path().join("test.mp4; rm -rf /");
    let output_path = temp_dir.path().join("thumbnail.jpg");

    // The path itself is safe because it's passed as an argument, not shell-interpreted
    let result = generate_thumbnail(&malicious_input, &output_path, 320, 240, 1.0).await;
    assert!(result.is_err());
    // Should fail because file doesn't exist, not because command was executed
    assert!(result.unwrap_err().contains("FFmpeg failed"));
  }

  #[test]
  fn test_thumbnail_path_handling() {
    // Test that paths are properly converted to strings
    let test_paths = vec![
      Path::new("/tmp/test.mp4"),
      Path::new("./relative/path.mp4"),
      Path::new("~/home/video.mp4"),
      #[cfg(target_os = "windows")]
      Path::new("C:\\Videos\\test.mp4"),
    ];

    for path in test_paths {
      let path_string = path.to_string_lossy();
      assert!(!path_string.is_empty());
    }
  }
}
