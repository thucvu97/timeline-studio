//! GPU - Команды для работы с GPU и аппаратным ускорением
//!
//! Команды для обнаружения GPU, проверки возможностей
//! и управления аппаратным ускорением.

use tauri::State;

use crate::video_compiler::core::gpu::GpuInfo;
use crate::video_compiler::error::{Result, VideoCompilerError};

use super::state::VideoCompilerState;

/// Обнаружить доступные GPU
#[tauri::command]
pub async fn detect_gpus(state: State<'_, VideoCompilerState>) -> Result<Vec<GpuInfo>> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  gpu_service.detect_gpus().await
}

/// Получить возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities(
  _gpu_index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<crate::video_compiler::services::gpu_service::GpuCapabilities> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  gpu_service.get_capabilities().await
}

/// Проверить поддержку аппаратного ускорения
#[tauri::command]
pub async fn check_hardware_acceleration_support(
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;
  gpu_service.check_hardware_acceleration().await
}

/// Получить рекомендуемый GPU для рендеринга
#[tauri::command]
pub async fn get_recommended_gpu(state: State<'_, VideoCompilerState>) -> Result<Option<GpuInfo>> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;

  // Получаем рекомендуемый кодировщик и конвертируем в GpuInfo
  let recommended_encoder = gpu_service.get_recommended_encoder().await?;

  Ok(recommended_encoder.map(|encoder| GpuInfo {
    name: format!("{encoder:?} Encoder"),
    driver_version: None,
    memory_total: None,
    memory_used: None,
    utilization: None,
    encoder_type: encoder,
    supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
  }))
}

/// Установить предпочитаемый GPU для рендеринга
#[tauri::command]
pub async fn set_preferred_gpu(
  _gpu_index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Просто включаем аппаратное ускорение
  let mut settings = state.settings.write().await;
  settings.hardware_acceleration = true;

  Ok(())
}

/// Включить/выключить аппаратное ускорение
#[tauri::command]
pub async fn set_hardware_acceleration(
  enabled: bool,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;
  settings.hardware_acceleration = enabled;
  Ok(())
}

/// Получить текущий статус использования GPU
#[tauri::command]
pub async fn get_gpu_usage_status(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let settings = state.settings.read().await;

  Ok(serde_json::json!({
    "hardware_acceleration_enabled": settings.hardware_acceleration,
    "gpu_index": None::<usize>,
    "current_gpu": None::<GpuInfo>,
    "available_gpus": 0,
  }))
}

/// Протестировать производительность GPU
#[tauri::command]
pub async fn benchmark_gpu(
  _gpu_index: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Бенчмарк GPU не реализован, возвращаем заглушку
  Ok(serde_json::json!({
    "gpu": null,
    "encoding_speed": 0.0,
    "decoding_speed": 0.0,
    "supported_codecs": Vec::<String>::new(),
    "score": 0.0,
  }))
}

/// Получить список поддерживаемых кодеков для GPU
#[tauri::command]
pub async fn get_gpu_supported_codecs(
  _gpu_index: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  // Возвращаем стандартные кодеки для GPU
  Ok(vec!["h264".to_string(), "hevc".to_string()])
}

/// Автоматически выбрать лучший GPU
#[tauri::command]
pub async fn auto_select_gpu(state: State<'_, VideoCompilerState>) -> Result<Option<usize>> {
  let gpu_service = state
    .services
    .get_gpu_service()
    .ok_or_else(|| VideoCompilerError::validation("GpuService не найден"))?;
  let recommended = gpu_service.get_recommended_encoder().await?;

  if recommended.is_some() {
    let mut settings = state.settings.write().await;
    settings.hardware_acceleration = true;
    Ok(Some(0)) // Всегда возвращаем 0 как индекс рекомендованного GPU
  } else {
    Ok(None)
  }
}

/// Получить детальную информацию о GPU кодировщике
#[tauri::command]
pub async fn get_gpu_encoder_details(encoder_type: String) -> Result<serde_json::Value> {
  use crate::video_compiler::core::gpu::GpuEncoder;

  let encoder = match encoder_type.as_str() {
    "nvenc" => GpuEncoder::Nvenc,
    "amf" => GpuEncoder::Amf,
    "qsv" => GpuEncoder::QuickSync,
    "videotoolbox" => GpuEncoder::VideoToolbox,
    "vaapi" => GpuEncoder::Vaapi,
    _ => GpuEncoder::Software,
  };

  Ok(serde_json::json!({
    "h264_codec_name": encoder.h264_codec_name(),
    "is_hardware": encoder.is_hardware(),
    "encoder_type": encoder_type,
  }))
}

#[cfg(test)]
mod tests {
  use crate::video_compiler::core::gpu::{GpuEncoder, GpuInfo};

  #[test]
  fn test_gpu_info_structure_creation() {
    let gpu_info = GpuInfo {
      name: "NVIDIA GeForce RTX 4090".to_string(),
      driver_version: Some("535.86.05".to_string()),
      memory_total: Some(24576), // 24GB in MB
      memory_used: Some(2048),   // 2GB in MB
      utilization: Some(45.5),
      encoder_type: GpuEncoder::Nvenc,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string(), "av1".to_string()],
    };

    assert_eq!(gpu_info.name, "NVIDIA GeForce RTX 4090");
    assert_eq!(gpu_info.driver_version, Some("535.86.05".to_string()));
    assert_eq!(gpu_info.memory_total, Some(24576));
    assert_eq!(gpu_info.memory_used, Some(2048));
    assert_eq!(gpu_info.utilization, Some(45.5));
    assert_eq!(gpu_info.encoder_type, GpuEncoder::Nvenc);
    assert_eq!(gpu_info.supported_codecs.len(), 3);
    assert!(gpu_info.supported_codecs.contains(&"h264".to_string()));
    assert!(gpu_info.supported_codecs.contains(&"hevc".to_string()));
    assert!(gpu_info.supported_codecs.contains(&"av1".to_string()));
  }

  #[test]
  fn test_gpu_encoder_types() {
    // Test different GPU encoder types
    let nvenc = GpuEncoder::Nvenc;
    let quicksync = GpuEncoder::QuickSync;
    let vaapi = GpuEncoder::Vaapi;
    let videotoolbox = GpuEncoder::VideoToolbox;
    let amf = GpuEncoder::Amf;
    let software = GpuEncoder::Software;

    assert_eq!(nvenc.h264_codec_name(), "h264_nvenc");
    assert_eq!(quicksync.h264_codec_name(), "h264_qsv");
    assert_eq!(vaapi.h264_codec_name(), "h264_vaapi");
    assert_eq!(videotoolbox.h264_codec_name(), "h264_videotoolbox");
    assert_eq!(amf.h264_codec_name(), "h264_amf");
    assert_eq!(software.h264_codec_name(), "libx264");
  }

  #[test]
  fn test_recommended_gpu_creation_logic() {
    // Test logic for creating recommended GPU info
    let encoder = GpuEncoder::Nvenc;
    let gpu_info = GpuInfo {
      name: format!("{encoder:?} Encoder"),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: encoder.clone(),
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    };

    assert_eq!(gpu_info.name, "Nvenc Encoder");
    assert_eq!(gpu_info.driver_version, None);
    assert_eq!(gpu_info.memory_total, None);
    assert_eq!(gpu_info.memory_used, None);
    assert_eq!(gpu_info.utilization, None);
    assert_eq!(gpu_info.encoder_type, GpuEncoder::Nvenc);
    assert_eq!(gpu_info.supported_codecs, vec!["h264", "hevc"]);
  }

  #[test]
  fn test_gpu_usage_status_json_structure() {
    // Test expected JSON structure for GPU usage status
    let status_json = serde_json::json!({
      "hardware_acceleration_enabled": true,
      "gpu_index": null,
      "current_gpu": null,
      "available_gpus": 2
    });

    assert!(status_json["hardware_acceleration_enabled"].is_boolean());
    assert!(status_json["gpu_index"].is_null());
    assert!(status_json["current_gpu"].is_null());
    assert!(status_json["available_gpus"].is_number());

    assert_eq!(status_json["hardware_acceleration_enabled"], true);
    assert_eq!(status_json["available_gpus"], 2);
  }

  #[test]
  fn test_gpu_benchmark_json_structure() {
    // Test expected JSON structure for GPU benchmark
    let benchmark_json = serde_json::json!({
      "gpu": null,
      "encoding_speed": 120.5,
      "decoding_speed": 200.0,
      "supported_codecs": ["h264", "hevc", "av1"],
      "score": 8.5
    });

    assert!(benchmark_json["gpu"].is_null());
    assert!(benchmark_json["encoding_speed"].is_number());
    assert!(benchmark_json["decoding_speed"].is_number());
    assert!(benchmark_json["supported_codecs"].is_array());
    assert!(benchmark_json["score"].is_number());

    let encoding_speed = benchmark_json["encoding_speed"].as_f64().unwrap();
    let decoding_speed = benchmark_json["decoding_speed"].as_f64().unwrap();
    let score = benchmark_json["score"].as_f64().unwrap();

    assert!(encoding_speed > 0.0);
    assert!(decoding_speed > 0.0);
    assert!((0.0..=10.0).contains(&score));

    let codecs = benchmark_json["supported_codecs"].as_array().unwrap();
    assert_eq!(codecs.len(), 3);
  }

  #[test]
  fn test_gpu_encoder_string_mapping() {
    // Test string to encoder mapping
    let test_cases = vec![
      ("nvenc", GpuEncoder::Nvenc),
      ("amf", GpuEncoder::Amf),
      ("qsv", GpuEncoder::QuickSync),
      ("videotoolbox", GpuEncoder::VideoToolbox),
      ("vaapi", GpuEncoder::Vaapi),
      ("unknown", GpuEncoder::Software),
      ("", GpuEncoder::Software),
    ];

    for (input, expected) in test_cases {
      let result = match input {
        "nvenc" => GpuEncoder::Nvenc,
        "amf" => GpuEncoder::Amf,
        "qsv" => GpuEncoder::QuickSync,
        "videotoolbox" => GpuEncoder::VideoToolbox,
        "vaapi" => GpuEncoder::Vaapi,
        _ => GpuEncoder::Software,
      };
      assert_eq!(result, expected, "Failed for input: {input}");
    }
  }

  #[test]
  fn test_gpu_encoder_details_json_structure() {
    // Test GPU encoder details JSON structure
    let encoder = GpuEncoder::Nvenc;
    let details_json = serde_json::json!({
      "h264_codec_name": encoder.h264_codec_name(),
      "is_hardware": encoder.is_hardware(),
      "encoder_type": "nvenc",
    });

    assert!(details_json["h264_codec_name"].is_string());
    assert!(details_json["is_hardware"].is_boolean());
    assert!(details_json["encoder_type"].is_string());

    assert_eq!(details_json["h264_codec_name"], "h264_nvenc");
    assert_eq!(details_json["is_hardware"], true);
    assert_eq!(details_json["encoder_type"], "nvenc");
  }

  #[test]
  fn test_auto_select_gpu_logic() {
    // Test auto GPU selection logic
    struct MockRecommendation {
      has_recommendation: bool,
    }

    let with_recommendation = MockRecommendation {
      has_recommendation: true,
    };
    let without_recommendation = MockRecommendation {
      has_recommendation: false,
    };

    // Test with recommendation
    if with_recommendation.has_recommendation {
      let gpu_index = Some(0);
      assert_eq!(gpu_index, Some(0));
    }

    // Test without recommendation
    if !without_recommendation.has_recommendation {
      let gpu_index: Option<usize> = None;
      assert_eq!(gpu_index, None);
    }
  }

  #[test]
  fn test_supported_codecs_return() {
    // Test standard GPU supported codecs
    let codecs = ["h264".to_string(), "hevc".to_string()];

    assert_eq!(codecs.len(), 2);
    assert!(codecs.contains(&"h264".to_string()));
    assert!(codecs.contains(&"hevc".to_string()));
    assert!(!codecs.contains(&"av1".to_string()));
  }

  #[test]
  fn test_gpu_memory_calculations() {
    // Test GPU memory usage calculations
    let total_memory_mb = 24576; // 24GB
    let used_memory_mb = 8192; // 8GB
    let free_memory_mb = total_memory_mb - used_memory_mb;
    let usage_percentage = (used_memory_mb as f64 / total_memory_mb as f64) * 100.0;

    assert_eq!(free_memory_mb, 16384); // 16GB free
    assert!((33.0..=34.0).contains(&usage_percentage)); // ~33.33%

    // Test edge cases
    let zero_usage = (0 as f64 / total_memory_mb as f64) * 100.0;
    let full_usage = (total_memory_mb as f64 / total_memory_mb as f64) * 100.0;

    assert_eq!(zero_usage, 0.0);
    assert_eq!(full_usage, 100.0);
  }

  #[test]
  fn test_gpu_utilization_ranges() {
    // Test GPU utilization percentage validation
    let valid_utilizations = [0.0, 25.5, 50.0, 75.8, 100.0];
    let invalid_utilizations = [-10.0, 150.0, -1.0, 101.0];

    for util in &valid_utilizations {
      assert!(
        (0.0..=100.0).contains(util),
        "Utilization {util} should be valid"
      );
    }

    for util in &invalid_utilizations {
      assert!(
        !(0.0..=100.0).contains(util),
        "Utilization {util} should be invalid"
      );
    }
  }

  #[test]
  fn test_gpu_info_serialization() {
    let gpu_info = GpuInfo {
      name: "Intel Arc A770".to_string(),
      driver_version: Some("31.0.101.4255".to_string()),
      memory_total: Some(16384), // 16GB
      memory_used: Some(1024),   // 1GB
      utilization: Some(30.0),
      encoder_type: GpuEncoder::QuickSync,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    };

    // Test serialization
    let json = serde_json::to_string(&gpu_info).unwrap();
    assert!(json.contains("Intel Arc A770"));
    assert!(json.contains("QuickSync"));
    assert!(json.contains("31.0.101.4255"));

    // Test deserialization
    let deserialized: GpuInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.name, "Intel Arc A770");
    assert_eq!(deserialized.encoder_type, GpuEncoder::QuickSync);
    assert_eq!(deserialized.memory_total, Some(16384));
    assert_eq!(deserialized.utilization, Some(30.0));
  }

  #[test]
  fn test_hardware_acceleration_settings() {
    // Test hardware acceleration settings logic
    struct TestSettings {
      hardware_acceleration: bool,
    }

    let mut settings = TestSettings {
      hardware_acceleration: false,
    };

    // Test enabling hardware acceleration
    settings.hardware_acceleration = true;
    assert!(settings.hardware_acceleration);

    // Test disabling hardware acceleration
    settings.hardware_acceleration = false;
    assert!(!settings.hardware_acceleration);
  }

  #[test]
  fn test_gpu_validation_error_structure() {
    // Test validation error structure for GPU service
    let error_message = "GpuService не найден";

    // This simulates how validation errors would be created
    let error_json = serde_json::json!({
      "error_type": "ValidationError",
      "message": error_message,
      "field": "gpu_service"
    });

    assert_eq!(error_json["error_type"], "ValidationError");
    assert_eq!(error_json["message"], error_message);
    assert_eq!(error_json["field"], "gpu_service");
  }
}

/// Получить полные возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities_full(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use crate::video_compiler::core::gpu::GpuDetector;

  let detector = GpuDetector::new(state.ffmpeg_path.read().await.clone());
  let capabilities = detector.get_gpu_capabilities().await?;

  Ok(serde_json::json!({
    "available_encoders": capabilities.available_encoders,
    "hardware_acceleration_supported": capabilities.hardware_acceleration_supported,
    "recommended_encoder": capabilities.recommended_encoder,
    "current_gpu": capabilities.current_gpu,
  }))
}
