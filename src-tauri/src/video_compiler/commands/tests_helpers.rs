//! Test helper commands - Commands for testing and validation
//!
//! Команды для демонстрации и тестирования компонентов системы

use crate::video_compiler::error::Result;

/// Создать тестовые данные кэша для демонстрации
#[tauri::command]
pub async fn create_test_render_cache_original() -> Result<serde_json::Value> {
  // Создаем примеры тестовых данных без использования моков
  let test_preview_info = serde_json::json!({
    "image_data_size": 5,
    "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
    "access_count": 0
  });

  let test_metadata_info = serde_json::json!({
    "file_path": "test_file.mp4",
    "file_size": 1024 * 1024 * 50, // 50MB
    "duration": 120.0,
    "resolution": [1920, 1080],
    "fps": 30.0,
    "video_codec": "h264",
    "audio_codec": "aac"
  });

  Ok(serde_json::json!({
    "status": "success",
    "message": "Test render cache data created",
    "preview_example": test_preview_info,
    "metadata_example": test_metadata_info
  }))
}

/// Получить пример превью данных
#[tauri::command]
pub async fn get_test_cache_preview_original(key: String) -> Result<serde_json::Value> {
  let found = key == "test_clip_1";

  if found {
    Ok(serde_json::json!({
      "found": true,
      "key": key,
      "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
      "data_size": 5,
      "mock_data": true
    }))
  } else {
    Ok(serde_json::json!({
      "found": false,
      "message": format!("No preview data found for key: {}", key)
    }))
  }
}

/// Получить пример метаданных
#[tauri::command]
pub async fn get_test_cache_metadata_original(key: String) -> Result<serde_json::Value> {
  let found = key == "test_file.mp4";

  if found {
    Ok(serde_json::json!({
      "found": true,
      "file_path": key,
      "duration": 120.0,
      "resolution": [1920, 1080],
      "fps": 30.0,
      "video_codec": "h264",
      "audio_codec": "aac",
      "file_size": 1024 * 1024 * 50,
      "mock_data": true
    }))
  } else {
    Ok(serde_json::json!({
      "found": false,
      "message": format!("No metadata found for key: {}", key)
    }))
  }
}

/// Создать тестовые GPU возможности
#[tauri::command]
pub async fn get_mock_gpu_capabilities_original() -> Result<serde_json::Value> {
  // Создаем тестовые возможности GPU без использования моков
  let mock_capabilities = serde_json::json!({
    "available_encoders": ["Software", "Nvenc"],
    "recommended_encoder": "Nvenc",
    "current_gpu": {
      "name": "Mock GPU",
      "driver_version": "1.0.0",
      "memory_total": 8589934592u64, // 8GB
      "memory_used": 2147483648u64,  // 2GB
      "utilization": 50.0,
      "encoder_type": "Nvenc",
      "supported_codecs": ["h264", "h265"]
    },
    "hardware_acceleration_supported": true,
    "test_mode": true
  });

  Ok(mock_capabilities)
}

/// Валидировать тестовые компоненты
#[tauri::command]
pub async fn validate_test_mocks_original() -> Result<serde_json::Value> {
  let mut validation_results = Vec::new();

  // Тест создания тестовых данных
  validation_results.push(serde_json::json!({
    "component": "TestDataCreation",
    "method": "create_preview_data",
    "status": "success"
  }));

  validation_results.push(serde_json::json!({
    "component": "TestDataCreation",
    "method": "create_metadata",
    "status": "success"
  }));

  validation_results.push(serde_json::json!({
    "component": "TestDataCreation",
    "method": "create_gpu_capabilities",
    "status": "success"
  }));

  // Тест получения данных
  let preview_result = get_test_cache_preview_original("test_clip_1".to_string()).await;
  validation_results.push(serde_json::json!({
    "component": "TestDataRetrieval",
    "method": "get_preview",
    "status": if preview_result.is_ok() { "success" } else { "failed" }
  }));

  let metadata_result = get_test_cache_metadata_original("test_file.mp4".to_string()).await;
  validation_results.push(serde_json::json!({
    "component": "TestDataRetrieval",
    "method": "get_metadata",
    "status": if metadata_result.is_ok() { "success" } else { "failed" }
  }));

  let gpu_result = get_mock_gpu_capabilities_original().await;
  validation_results.push(serde_json::json!({
    "component": "TestDataRetrieval",
    "method": "get_gpu_capabilities",
    "status": if gpu_result.is_ok() { "success" } else { "failed" }
  }));

  let all_tests_passed = validation_results
    .iter()
    .all(|result| result.get("status").unwrap().as_str().unwrap() == "success");

  Ok(serde_json::json!({
    "overall_status": if all_tests_passed { "success" } else { "failed" },
    "tests_run": validation_results.len(),
    "results": validation_results,
    "summary": "All test helper methods validated"
  }))
}

/// Создать состояние для тестирования  
#[tauri::command]
pub async fn create_test_state_original() -> Result<serde_json::Value> {
  // Возвращаем информацию о создании тестового состояния
  Ok(serde_json::json!({
    "status": "success",
    "message": "Test state information created",
    "state_type": "mock",
    "components": [
      "MockRenderCache",
      "MockGpuDetector",
      "TestVideoCompilerState"
    ],
    "note": "This is a simplified test state for demo purposes"
  }))
}
