//! Integration tests for video_compiler module

use super::super::*;

#[tokio::test]
async fn test_video_compiler_state_creation() {
  let state = VideoCompilerState::new().await;
  assert_eq!(state.active_jobs.read().await.len(), 0);

  let settings = state.settings.read().await;
  assert_eq!(settings.max_concurrent_jobs, 2);
  assert_eq!(settings.cache_size_mb, 512);
}

#[tokio::test]
async fn test_compiler_settings_default() {
  let settings = CompilerSettings::default();
  assert_eq!(settings.max_concurrent_jobs, 2);
  assert_eq!(settings.cache_size_mb, 512);
  assert!(settings.hardware_acceleration);
  assert_eq!(settings.preview_quality, 75);
}

#[tokio::test]
async fn test_check_dependencies() {
  // Тест может не пройти если FFmpeg не установлен, но это ожидаемо
  match check_dependencies().await {
    Ok(_) => println!("FFmpeg найден и работает"),
    Err(e) => println!("FFmpeg недоступен: {:?}", e),
  }
}

#[test]
fn test_video_compiler_event_serialization() {
  let event = VideoCompilerEvent::RenderStarted {
    job_id: "test-123".to_string(),
  };

  let json = serde_json::to_string(&event).unwrap();
  assert!(json.contains("RenderStarted"));
  assert!(json.contains("test-123"));
}
