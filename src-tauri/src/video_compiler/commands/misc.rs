//! Misc - Дополнительные команды
//!
//! Команды, которые не вошли в основные категории

use tauri::State;

use crate::video_compiler::error::{Result, VideoCompilerError};

use super::state::VideoCompilerState;

// Prerender structures moved to prerender_commands.rs

// Frame extraction structures moved to frame_extraction_commands.rs

/// Возможности FFmpeg
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FfmpegCapabilities {
  pub version: String,
  pub hardware_acceleration: HardwareAcceleration,
}

/// Поддержка аппаратного ускорения
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HardwareAcceleration {
  pub cuda: bool,
  pub nvenc: bool,
  pub qsv: bool,
  pub amf: bool,
  pub videotoolbox: bool,
}

// add_clip_to_track moved to schema_commands.rs

/// Кэшировать метаданные медиафайла
#[tauri::command]
pub async fn cache_media_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Получаем информацию о файле через FFmpeg
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args([
      "-i",
      &file_path,
      "-f",
      "json",
      "-show_format",
      "-show_streams",
    ])
    .output()
    .map_err(|e| VideoCompilerError::MediaFileError {
      path: file_path.clone(),
      reason: e.to_string(),
    })?;

  let metadata = String::from_utf8_lossy(&output.stdout);
  let metadata_json: serde_json::Value =
    serde_json::from_str(&metadata).unwrap_or_else(|_| serde_json::json!({}));

  // Добавляем в кэш
  let mut cache = state.cache_manager.write().await;
  let metadata = crate::video_compiler::cache::MediaMetadata {
    file_path: file_path.clone(),
    file_size: 0,
    modified_time: std::time::SystemTime::now(),
    duration: 0.0,
    resolution: None,
    fps: None,
    bitrate: None,
    video_codec: None,
    audio_codec: None,
    cached_at: std::time::SystemTime::now(),
  };
  cache.store_metadata(file_path, metadata).await?;

  Ok(metadata_json)
}

/// Проверить возможности FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_capabilities(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args(["-version"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  let version = String::from_utf8_lossy(&output.stdout);
  let has_cuda = version.contains("--enable-cuda");
  let has_nvenc = version.contains("--enable-nvenc");
  let has_qsv = version.contains("--enable-libmfx");
  let has_amf = version.contains("--enable-amf");
  let has_videotoolbox = version.contains("--enable-videotoolbox");

  Ok(serde_json::json!({
    "version": version.lines().next().unwrap_or("Unknown"),
    "hardware_acceleration": {
      "cuda": has_cuda,
      "nvenc": has_nvenc,
      "qsv": has_qsv,
      "amf": has_amf,
      "videotoolbox": has_videotoolbox,
    }
  }))
}

/// Проверить доступность GPU кодировщика
#[tauri::command]
pub async fn check_gpu_encoder_availability(
  encoder: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args(["-encoders"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  let encoders = String::from_utf8_lossy(&output.stdout);
  Ok(encoders.contains(&encoder))
}

/// Проверить поддержку аппаратного ускорения (альтернативная версия)
#[tauri::command]
pub async fn check_hardware_acceleration(state: State<'_, VideoCompilerState>) -> Result<bool> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let detector = crate::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
  let encoders = detector.detect_available_encoders().await?;
  Ok(!encoders.is_empty())
}

// check_render_job_timeouts moved to test_helper_commands.rs

/// Очистить кэш (общая функция)
#[tauri::command]
pub async fn cleanup_cache(
  _max_age_days: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  let mut cache = state.cache_manager.write().await;
  cache.cleanup_old_entries().await?;
  let bytes_freed = 0u64;
  Ok(bytes_freed)
}

/// Очистить кэш (упрощенная версия)
#[tauri::command]
pub async fn clear_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Очистить кэш превью файлов
#[tauri::command]
pub async fn clear_file_preview_cache(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

// clear_frame_cache moved to frame_extraction_commands.rs

// clear_prerender_cache moved to prerender_commands.rs

/// Настроить кэш
#[tauri::command]
pub async fn configure_cache(
  config: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;

  if let Some(size_mb) = config.get("size_mb").and_then(|v| v.as_u64()) {
    settings.cache_size_mb = size_mb as usize;
  }

  if let Some(preview_quality) = config.get("preview_quality").and_then(|v| v.as_u64()) {
    settings.preview_quality = preview_quality as u8;
  }

  Ok(())
}

// create_clip moved to schema_commands.rs

// create_effect moved to schema_commands.rs

// create_filter moved to schema_commands.rs

/// Создать новый проект
#[tauri::command]
pub async fn create_new_project(
  name: String,
  resolution: (u32, u32),
  fps: u32,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  use crate::video_compiler::schema::*;

  Ok(ProjectSchema {
    version: "1.0".to_string(),
    metadata: ProjectMetadata {
      name,
      description: Some(String::new()),
      author: Some(String::new()),
      created_at: chrono::Utc::now(),
      modified_at: chrono::Utc::now(),
    },
    timeline: Timeline {
      duration: 0.0,
      fps,
      resolution,
      sample_rate: 48000,
      aspect_ratio: AspectRatio::default(),
    },
    tracks: vec![],
    effects: vec![],
    transitions: vec![],
    filters: vec![],
    templates: vec![],
    style_templates: vec![],
    subtitles: vec![],
    settings: ProjectSettings::default(),
  })
}

// create_style_template moved to schema_commands.rs

// create_subtitle moved to schema_commands.rs

// create_subtitle_animation moved to schema_commands.rs

// create_template moved to schema_commands.rs

// create_track moved to schema_commands.rs

// extract_subtitle_frames moved to frame_extraction_commands.rs

// extract_timeline_frames moved to frame_extraction_commands.rs

// generate_preview moved to frame_extraction_commands.rs

// generate_preview_batch moved to frame_extraction_commands.rs

// generate_preview_with_settings moved to frame_extraction_commands.rs

// get_active_jobs moved to service_commands.rs

/// Получить использование памяти кэшем
#[tauri::command]
pub async fn get_cache_memory_usage(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let usage = cache.get_memory_usage();

  Ok(serde_json::json!({
    "total_bytes": usage.total_bytes,
    "preview_bytes": usage.preview_bytes,
    "metadata_bytes": usage.metadata_bytes,
    "render_bytes": usage.render_bytes,
  }))
}

/// Получить кэшированные метаданные
#[tauri::command]
pub async fn get_cached_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  let mut cache = state.cache_manager.write().await;
  Ok(cache.get_metadata(&file_path).await.map(|m| {
    serde_json::json!({
      "duration": m.duration,
      "resolution": m.resolution,
      "fps": m.fps,
      "bitrate": m.bitrate,
      "video_codec": m.video_codec,
      "audio_codec": m.audio_codec,
    })
  }))
}

/// Получить информацию о текущем GPU
#[tauri::command]
pub async fn get_current_gpu_info(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<crate::video_compiler::gpu::GpuInfo>> {
  let settings = state.settings.read().await;
  if settings.hardware_acceleration {
    let ffmpeg_path = state.ffmpeg_path.read().await.clone();
    let detector = crate::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
    let encoder = detector.get_recommended_encoder().await?;

    Ok(encoder.map(|enc| crate::video_compiler::gpu::GpuInfo {
      name: format!("{:?} Encoder", enc),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: enc,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    }))
  } else {
    Ok(None)
  }
}

// get_frame_extraction_cache_info moved to frame_extraction_commands.rs

/// Получить информацию о GPU (альтернативная версия)
#[tauri::command]
pub async fn get_gpu_info(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<crate::video_compiler::gpu::GpuInfo>> {
  super::gpu::detect_gpus(state).await
}

// get_input_sources_info moved to service_commands.rs

// get_prerender_cache_info moved to prerender_commands.rs

/// Получить рекомендуемый GPU кодировщик
#[tauri::command]
pub async fn get_recommended_gpu_encoder(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let detector = crate::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
  let encoder = detector.get_recommended_encoder().await?;
  Ok(encoder.map(|e| format!("{:?}", e)))
}

/// Получить информацию о кэше рендеринга
#[tauri::command]
pub async fn get_render_cache_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let usage = cache.get_memory_usage();

  Ok(serde_json::json!({
    "render_cache_size": usage.render_bytes,
    "total_cache_size": usage.total_bytes,
    "cache_hit_rate": cache.get_stats().hit_ratio(),
  }))
}

// get_render_progress moved to service_commands.rs

// get_render_statistics moved to service_commands.rs

/// Получить информацию о видео
#[tauri::command]
pub async fn get_video_info(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args([
      "-i",
      &file_path,
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
    ])
    .output()
    .map_err(|e| VideoCompilerError::MediaFileError {
      path: file_path.clone(),
      reason: e.to_string(),
    })?;

  let info = String::from_utf8_lossy(&output.stdout);
  let info_json: serde_json::Value = serde_json::from_str(&info)
    .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

  Ok(info_json)
}

// prerender_segment moved to prerender_commands.rs

// set_preview_ffmpeg_path moved to service_commands.rs

// touch_project moved to service_commands.rs

// test_error_types moved to test_helper_commands.rs

// emit_video_compiler_event moved to test_helper_commands.rs

// health_check_all_services moved to test_helper_commands.rs

// shutdown_all_services moved to test_helper_commands.rs

// get_project_service_info moved to test_helper_commands.rs
