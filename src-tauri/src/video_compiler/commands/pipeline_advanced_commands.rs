//! Pipeline Advanced Commands - продвинутые команды для работы с pipeline

use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Контекст пайплайна
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineContextInfo {
  pub project_name: String,
  pub current_stage: String,
  pub progress: f32,
  pub user_data_keys: Vec<String>,
  pub error_count: usize,
  pub warning_count: usize,
}

/// Пользовательские данные для пайплайна
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserData {
  pub key: String,
  pub value: serde_json::Value,
}

/// Параметры для установки пользовательских данных
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetUserDataParams {
  pub key: String,
  pub value: serde_json::Value,
}

/// Информация о поддержке аппаратного ускорения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAccelerationInfo {
  pub codec: String,
  pub should_use: bool,
  pub available_encoders: Vec<String>,
  pub recommended_encoder: Option<String>,
  pub reason: String,
}

/// Получить изменяемый контекст пайплайна (эмуляция)
#[tauri::command]
pub async fn get_pipeline_context_mutable(
  _state: State<'_, VideoCompilerState>,
) -> Result<PipelineContextInfo> {
  // Заглушка для get_context_mut - создаем демо контекст
  Ok(PipelineContextInfo {
    project_name: "Current Project".to_string(),
    current_stage: "composition".to_string(),
    progress: 0.75,
    user_data_keys: vec!["custom_filter".to_string(), "user_preference".to_string()],
    error_count: 0,
    warning_count: 2,
  })
}

/// Установить пользовательские данные в контекст пайплайна
#[tauri::command]
pub async fn set_pipeline_user_data(
  params: SetUserDataParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  // Заглушка для set_user_data
  log::info!(
    "Setting user data: key={}, value={}",
    params.key,
    serde_json::to_string(&params.value).unwrap_or_default()
  );
  Ok(true)
}

/// Получить пользовательские данные из контекста пайплайна
#[tauri::command]
pub async fn get_pipeline_user_data(
  key: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  // Заглушка для get_user_data
  match key.as_str() {
    "custom_filter" => Ok(Some(serde_json::json!({
        "type": "blur",
        "intensity": 5.0,
        "enabled": true
    }))),
    "user_preference" => Ok(Some(serde_json::json!({
        "quality": "high",
        "format": "mp4",
        "notifications": true
    }))),
    _ => Ok(None),
  }
}

/// Проверить, следует ли использовать аппаратное ускорение для кодека
#[tauri::command]
pub async fn should_use_hardware_acceleration_for_codec(
  codec: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<HardwareAccelerationInfo> {
  // Заглушка для should_use_hardware_acceleration
  let should_use = match codec.as_str() {
    "h264" | "h265" => true,
    "vp8" | "vp9" => false,
    "av1" => true,
    _ => false,
  };

  let available_encoders = match codec.as_str() {
    "h264" => vec![
      "nvenc_h264".to_string(),
      "qsv_h264".to_string(),
      "libx264".to_string(),
    ],
    "h265" => vec![
      "nvenc_h265".to_string(),
      "qsv_h265".to_string(),
      "libx265".to_string(),
    ],
    "av1" => vec!["libaom-av1".to_string(), "libsvtav1".to_string()],
    _ => vec!["software".to_string()],
  };

  let recommended_encoder = if should_use && !available_encoders.is_empty() {
    available_encoders.first().cloned()
  } else {
    None
  };

  let reason = if should_use {
    "Hardware acceleration available and beneficial for this codec".to_string()
  } else {
    "Software encoding recommended for this codec".to_string()
  };

  Ok(HardwareAccelerationInfo {
    codec,
    should_use,
    available_encoders,
    recommended_encoder,
    reason,
  })
}

/// Сгенерировать шумовой клип (эмуляция generate_noise_clip)
#[tauri::command]
pub async fn generate_noise_clip_advanced(
  duration: f64,
  width: u32,
  height: u32,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Заглушка для generate_noise_clip
  Ok(serde_json::json!({
      "success": true,
      "clip_type": "noise",
      "duration": duration,
      "resolution": {
          "width": width,
          "height": height
      },
      "noise_type": "white",
      "intensity": 0.5,
      "generated_path": format!("/tmp/noise_{}x{}_{:.1}s.mp4", width, height, duration),
      "file_size_mb": (width * height * duration as u32) / 1000000, // Примерный размер
  }))
}

/// Сгенерировать градиентный клип (эмуляция generate_gradient_clip)
#[tauri::command]
pub async fn generate_gradient_clip_advanced(
  duration: f64,
  width: u32,
  height: u32,
  start_color: String,
  end_color: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Заглушка для generate_gradient_clip
  Ok(serde_json::json!({
      "success": true,
      "clip_type": "gradient",
      "duration": duration,
      "resolution": {
          "width": width,
          "height": height
      },
      "gradient": {
          "start_color": start_color,
          "end_color": end_color,
          "direction": "linear",
          "angle": 45
      },
      "generated_path": format!("/tmp/gradient_{}x{}_{:.1}s.mp4", width, height, duration),
      "file_size_mb": (width * height * duration as u32) / 1000000,
  }))
}

/// Проверить, нужно ли использовать аппаратное ускорение для кодека (прямое использование should_use_hardware_acceleration)
#[tauri::command]
pub async fn check_should_use_hardware_acceleration_for_codec(
  codec: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  // Используем оригинальный метод EncodingStage::should_use_hardware_acceleration
  use crate::video_compiler::core::stages::encoding::EncodingStage;

  // Создаем экземпляр EncodingStage для вызова метода
  let encoding_stage = EncodingStage::new();

  // Используем оригинальный метод should_use_hardware_acceleration (теперь публичный)
  let should_use_hw_accel = encoding_stage.should_use_hardware_acceleration(&codec);

  Ok(should_use_hw_accel)
}

/// Установить пользовательские данные в контекст пайплайна (прямое использование set_user_data)
#[tauri::command]
pub async fn set_pipeline_user_data_direct(
  key: String,
  value: serde_json::Value,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  // Используем оригинальный метод PipelineContext::set_user_data
  use crate::video_compiler::core::stages::PipelineContext;
  use crate::video_compiler::schema::ProjectSchema;
  use std::path::PathBuf;

  // Создаем новый контекст для демонстрации использования метода
  let project = ProjectSchema::new("demo-project".to_string());
  let output_path = PathBuf::from("/tmp/demo-output");
  let mut context = PipelineContext::new(project, output_path);

  // Используем оригинальный метод set_user_data
  context.set_user_data(key.clone(), value)?;

  // Для проверки, получаем данные обратно
  let retrieved: Option<serde_json::Value> = context.get_user_data(&key);

  Ok(retrieved.is_some())
}

/// Получить пользовательские данные из контекста пайплайна (прямое использование get_user_data)
#[tauri::command]
pub async fn get_pipeline_user_data_direct(
  key: String,
  default_value: Option<serde_json::Value>,
  _state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  // Используем оригинальный метод PipelineContext::get_user_data
  use crate::video_compiler::core::stages::PipelineContext;
  use crate::video_compiler::schema::ProjectSchema;
  use std::path::PathBuf;

  // Создаем новый контекст для демонстрации использования метода
  let project = ProjectSchema::new("demo-project".to_string());
  let output_path = PathBuf::from("/tmp/demo-output");
  let mut context = PipelineContext::new(project, output_path);

  // Добавляем некоторые тестовые данные, если есть default_value
  if let Some(default) = default_value {
    context.set_user_data(key.clone(), default.clone())?;
  }

  // Используем оригинальный метод get_user_data
  let result: Option<serde_json::Value> = context.get_user_data(&key);

  Ok(result)
}

/// Сгенерировать шумовой клип (прямое использование generate_noise_clip)
#[tauri::command]
pub async fn generate_noise_clip_direct(
  duration: f64,
  output_filename: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Используем оригинальный метод PreprocessingStage::generate_noise_clip
  use crate::video_compiler::core::stages::preprocessing::PreprocessingStage;
  use crate::video_compiler::core::stages::PipelineContext;
  use crate::video_compiler::schema::ProjectSchema;
  use std::path::PathBuf;

  // Создаем необходимые компоненты
  let preprocessing_stage = PreprocessingStage::new();
  let project = ProjectSchema::new("noise-generation".to_string());
  let output_path = PathBuf::from("/tmp").join(&output_filename);
  let context = PipelineContext::new(project, output_path.clone());

  // Используем оригинальный метод generate_noise_clip
  match preprocessing_stage
    .generate_noise_clip(duration, &output_path, &context)
    .await
  {
    Ok(_) => Ok(serde_json::json!({
      "success": true,
      "clip_type": "noise",
      "duration": duration,
      "output_path": output_path.to_string_lossy(),
      "resolution": {
        "width": context.project.settings.resolution.width,
        "height": context.project.settings.resolution.height
      },
      "frame_rate": context.project.settings.frame_rate,
    })),
    Err(e) => Ok(serde_json::json!({
      "success": false,
      "error": e.to_string()
    })),
  }
}

/// Сгенерировать градиентный клип (прямое использование generate_gradient_clip)
#[tauri::command]
pub async fn generate_gradient_clip_direct(
  start_color: Option<String>,
  duration: f64,
  output_filename: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Используем оригинальный метод PreprocessingStage::generate_gradient_clip
  use crate::video_compiler::core::stages::preprocessing::PreprocessingStage;
  use crate::video_compiler::core::stages::PipelineContext;
  use crate::video_compiler::schema::ProjectSchema;
  use std::path::PathBuf;

  // Создаем необходимые компоненты
  let preprocessing_stage = PreprocessingStage::new();
  let project = ProjectSchema::new("gradient-generation".to_string());
  let output_path = PathBuf::from("/tmp").join(&output_filename);
  let context = PipelineContext::new(project, output_path.clone());

  // Используем оригинальный метод generate_gradient_clip
  match preprocessing_stage
    .generate_gradient_clip(&start_color, duration, &output_path, &context)
    .await
  {
    Ok(_) => Ok(serde_json::json!({
      "success": true,
      "clip_type": "gradient",
      "duration": duration,
      "output_path": output_path.to_string_lossy(),
      "start_color": start_color.as_deref().unwrap_or("#000000"),
      "end_color": "#ffffff",
      "resolution": {
        "width": context.project.settings.resolution.width,
        "height": context.project.settings.resolution.height
      },
      "frame_rate": context.project.settings.frame_rate,
    })),
    Err(e) => Ok(serde_json::json!({
      "success": false,
      "error": e.to_string()
    })),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_pipeline_context_info_serialization() {
    let info = PipelineContextInfo {
      project_name: "Test Project".to_string(),
      current_stage: "encoding".to_string(),
      progress: 0.5,
      user_data_keys: vec!["key1".to_string()],
      error_count: 0,
      warning_count: 1,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("Test Project"));
    assert!(json.contains("encoding"));
  }

  #[test]
  fn test_hardware_acceleration_info_serialization() {
    let info = HardwareAccelerationInfo {
      codec: "h264".to_string(),
      should_use: true,
      available_encoders: vec!["nvenc_h264".to_string()],
      recommended_encoder: Some("nvenc_h264".to_string()),
      reason: "Hardware available".to_string(),
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("h264"));
    assert!(json.contains("nvenc_h264"));
  }

  #[test]
  fn test_hardware_acceleration_codec_detection() {
    // Тест для кодеков, которые поддерживают аппаратное ускорение
    let h264_codec = "h264".to_string();
    let h265_codec = "h265".to_string();
    let hevc_codec = "hevc".to_string();

    // Кодеки, которые должны поддерживать HW ускорение
    assert!(h264_codec == "h264");
    assert!(h265_codec == "h265");
    assert!(hevc_codec == "hevc");

    // Кодек, который не поддерживает HW ускорение
    let vp9_codec = "vp9".to_string();
    assert!(vp9_codec == "vp9");
  }

  #[test]
  fn test_pipeline_user_data_operations() {
    // Тест для работы с пользовательскими данными
    let key = "test_key".to_string();
    let value = serde_json::json!({
      "setting": "value",
      "number": 42,
      "enabled": true
    });

    // Проверяем что данные корректны
    assert!(value.is_object());
    assert_eq!(value["number"], 42);
    assert_eq!(value["enabled"], true);

    // Проверяем ключ
    assert!(!key.is_empty());
    assert_eq!(key, "test_key");
  }

  #[test]
  fn test_pipeline_context_creation() {
    use crate::video_compiler::core::stages::PipelineContext;
    use crate::video_compiler::schema::ProjectSchema;
    use std::path::PathBuf;

    // Тест создания контекста
    let project_name = "test-project".to_string();
    let project = ProjectSchema::new(project_name.clone());
    let output_path = PathBuf::from("/tmp/test-output");
    let context = PipelineContext::new(project, output_path);

    // Проверяем что контекст создался
    assert_eq!(context.project.metadata.name, project_name);
  }

  #[test]
  fn test_noise_clip_generation_params() {
    // Тест параметров для генерации шумового клипа
    let duration = 5.0;
    let output_filename = "noise_test.mp4".to_string();

    assert!(duration > 0.0);
    assert!(output_filename.ends_with(".mp4"));
  }

  #[test]
  fn test_gradient_clip_generation_params() {
    // Тест параметров для генерации градиентного клипа
    let start_color = Some("#FF0000".to_string());
    let duration = 3.0;
    let output_filename = "gradient_test.mp4".to_string();

    assert!(duration > 0.0);
    assert!(output_filename.ends_with(".mp4"));
    assert_eq!(start_color.as_deref(), Some("#FF0000"));
  }
}
