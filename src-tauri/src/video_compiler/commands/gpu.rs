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
    name: format!("{:?} Encoder", encoder),
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
