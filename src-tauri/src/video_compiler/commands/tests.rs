//! Тесты для модуля commands
//!
//! Современные тесты для новой сервисной архитектуры

#[cfg(test)]
mod basic_tests {
  use crate::video_compiler::tests::mocks::*;

  #[test]
  fn test_mock_render_progress() {
    let progress = create_mock_render_progress();
    assert_eq!(progress.job_id, "test-job-123");
    assert_eq!(progress.percentage, 50.0);
  }

  #[test]
  fn test_mock_preview_result() {
    let result = create_mock_preview_result();
    assert_eq!(result._timestamp, 5.0);
    assert!(result.result.is_ok());
  }

  #[test]
  fn test_mock_gpu_detector() {
    let detector = MockGpuDetector::new();
    assert_eq!(detector.mock_capabilities.available_encoders.len(), 2);
    assert!(detector.mock_capabilities.hardware_acceleration_supported);
  }
}

#[cfg(test)]
mod new_commands;

#[cfg(test)]
mod segment_filters_test;
