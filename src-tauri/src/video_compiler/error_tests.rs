//! Тесты для модуля error
//!
//! Проверяем основную функциональность обработки ошибок

#[cfg(test)]
mod tests {
  use crate::video_compiler::error::{Result, VideoCompilerError};

  #[test]
  fn test_error_creation() {
    let error = VideoCompilerError::DependencyMissing("FFmpeg not found".to_string());
    assert!(error.to_string().contains("FFmpeg not found"));
  }

  #[test]
  fn test_error_types() {
    let io_error = VideoCompilerError::IoError("File not found".to_string());
    let validation_error = VideoCompilerError::ValidationError("Invalid project".to_string());

    assert!(io_error.to_string().contains("File not found"));
    assert!(validation_error.to_string().contains("Invalid project"));
  }

  #[test]
  fn test_result_type() {
    let success: Result<String> = Ok("Success".to_string());
    let error: Result<String> = Err(VideoCompilerError::IoError("Error".to_string()));

    assert!(success.is_ok());
    assert!(error.is_err());
  }

  #[test]
  fn test_error_serialization() {
    let error = VideoCompilerError::ValidationError("Test error".to_string());

    // Проверяем что ошибка может быть сериализована
    let json = serde_json::to_string(&error);
    assert!(json.is_ok());
  }

  #[test]
  fn test_error_equality() {
    let error1 = VideoCompilerError::IoError("Same error".to_string());
    let error2 = VideoCompilerError::IoError("Same error".to_string());
    let error3 = VideoCompilerError::IoError("Different error".to_string());

    // Проверяем строковое представление вместо прямого сравнения
    assert_eq!(error1.to_string(), error2.to_string());
    assert_ne!(error1.to_string(), error3.to_string());
  }

  #[test]
  fn test_error_debug() {
    let error = VideoCompilerError::DependencyMissing("Debug test".to_string());
    let debug_str = format!("{:?}", error);
    assert!(debug_str.contains("DependencyMissing"));
    assert!(debug_str.contains("Debug test"));
  }

  #[test]
  fn test_error_clone() {
    let error = VideoCompilerError::ValidationError("Clone test".to_string());
    let cloned_error = error.clone();
    assert_eq!(error.to_string(), cloned_error.to_string());
  }

  #[test]
  fn test_render_error_creation() {
    let render_error = VideoCompilerError::RenderError {
      job_id: "test-job-123".to_string(),
      stage: "encoding".to_string(),
      message: "Encoding failed".to_string(),
    };

    let error_str = render_error.to_string();
    assert!(error_str.contains("encoding"));
    assert!(error_str.contains("Encoding failed"));
  }

  #[test]
  fn test_ffmpeg_error_creation() {
    let ffmpeg_error = VideoCompilerError::FFmpegError {
      exit_code: Some(1),
      stderr: "FFmpeg error output".to_string(),
      command: "ffmpeg -i input.mp4 output.mp4".to_string(),
    };

    let error_str = ffmpeg_error.to_string();
    assert!(error_str.contains("FFmpeg"));
    assert!(error_str.contains("FFmpeg error output"));
  }
}
