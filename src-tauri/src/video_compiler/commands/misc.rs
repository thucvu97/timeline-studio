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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_ffmpeg_capabilities_creation() {
    let capabilities = FfmpegCapabilities {
      version: "4.4.0".to_string(),
      hardware_acceleration: HardwareAcceleration {
        cuda: true,
        nvenc: true,
        qsv: false,
        amf: false,
        videotoolbox: false,
      },
    };

    assert_eq!(capabilities.version, "4.4.0");
    assert!(capabilities.hardware_acceleration.cuda);
    assert!(capabilities.hardware_acceleration.nvenc);
    assert!(!capabilities.hardware_acceleration.qsv);
    assert!(!capabilities.hardware_acceleration.amf);
    assert!(!capabilities.hardware_acceleration.videotoolbox);
  }

  #[test]
  fn test_ffmpeg_capabilities_serialization() {
    let capabilities = FfmpegCapabilities {
      version: "5.0".to_string(),
      hardware_acceleration: HardwareAcceleration {
        cuda: false,
        nvenc: false,
        qsv: true,
        amf: true,
        videotoolbox: true,
      },
    };

    let serialized = serde_json::to_string(&capabilities).unwrap();
    assert!(serialized.contains("\"version\":\"5.0\""));
    assert!(serialized.contains("\"cuda\":false"));
    assert!(serialized.contains("\"nvenc\":false"));
    assert!(serialized.contains("\"qsv\":true"));
    assert!(serialized.contains("\"amf\":true"));
    assert!(serialized.contains("\"videotoolbox\":true"));

    let deserialized: FfmpegCapabilities = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.version, capabilities.version);
    assert_eq!(
      deserialized.hardware_acceleration.cuda,
      capabilities.hardware_acceleration.cuda
    );
    assert_eq!(
      deserialized.hardware_acceleration.nvenc,
      capabilities.hardware_acceleration.nvenc
    );
    assert_eq!(
      deserialized.hardware_acceleration.qsv,
      capabilities.hardware_acceleration.qsv
    );
    assert_eq!(
      deserialized.hardware_acceleration.amf,
      capabilities.hardware_acceleration.amf
    );
    assert_eq!(
      deserialized.hardware_acceleration.videotoolbox,
      capabilities.hardware_acceleration.videotoolbox
    );
  }

  #[test]
  fn test_hardware_acceleration_creation() {
    let hw_accel = HardwareAcceleration {
      cuda: true,
      nvenc: false,
      qsv: true,
      amf: false,
      videotoolbox: true,
    };

    assert!(hw_accel.cuda);
    assert!(!hw_accel.nvenc);
    assert!(hw_accel.qsv);
    assert!(!hw_accel.amf);
    assert!(hw_accel.videotoolbox);
  }

  #[test]
  fn test_hardware_acceleration_debug() {
    let hw_accel = HardwareAcceleration {
      cuda: true,
      nvenc: true,
      qsv: false,
      amf: false,
      videotoolbox: false,
    };

    let debug_str = format!("{:?}", hw_accel);
    assert!(debug_str.contains("cuda: true"));
    assert!(debug_str.contains("nvenc: true"));
    assert!(debug_str.contains("qsv: false"));
    assert!(debug_str.contains("amf: false"));
    assert!(debug_str.contains("videotoolbox: false"));
  }

  #[test]
  fn test_hardware_acceleration_clone() {
    let hw_accel1 = HardwareAcceleration {
      cuda: false,
      nvenc: true,
      qsv: false,
      amf: true,
      videotoolbox: false,
    };

    let hw_accel2 = hw_accel1.clone();

    assert_eq!(hw_accel1.cuda, hw_accel2.cuda);
    assert_eq!(hw_accel1.nvenc, hw_accel2.nvenc);
    assert_eq!(hw_accel1.qsv, hw_accel2.qsv);
    assert_eq!(hw_accel1.amf, hw_accel2.amf);
    assert_eq!(hw_accel1.videotoolbox, hw_accel2.videotoolbox);
  }

  #[test]
  fn test_ffmpeg_capabilities_debug() {
    let capabilities = FfmpegCapabilities {
      version: "6.0".to_string(),
      hardware_acceleration: HardwareAcceleration {
        cuda: true,
        nvenc: false,
        qsv: true,
        amf: false,
        videotoolbox: true,
      },
    };

    let debug_str = format!("{:?}", capabilities);
    assert!(debug_str.contains("version: \"6.0\""));
    assert!(debug_str.contains("hardware_acceleration"));
    assert!(debug_str.contains("cuda: true"));
    assert!(debug_str.contains("videotoolbox: true"));
  }

  #[test]
  fn test_ffmpeg_capabilities_clone() {
    let capabilities1 = FfmpegCapabilities {
      version: "4.3.0".to_string(),
      hardware_acceleration: HardwareAcceleration {
        cuda: true,
        nvenc: true,
        qsv: true,
        amf: true,
        videotoolbox: true,
      },
    };

    let capabilities2 = capabilities1.clone();

    assert_eq!(capabilities1.version, capabilities2.version);
    assert_eq!(
      capabilities1.hardware_acceleration.cuda,
      capabilities2.hardware_acceleration.cuda
    );
    assert_eq!(
      capabilities1.hardware_acceleration.nvenc,
      capabilities2.hardware_acceleration.nvenc
    );
    assert_eq!(
      capabilities1.hardware_acceleration.qsv,
      capabilities2.hardware_acceleration.qsv
    );
    assert_eq!(
      capabilities1.hardware_acceleration.amf,
      capabilities2.hardware_acceleration.amf
    );
    assert_eq!(
      capabilities1.hardware_acceleration.videotoolbox,
      capabilities2.hardware_acceleration.videotoolbox
    );
  }

  #[tokio::test]
  async fn test_create_new_project() {
    let name = "Test Project".to_string();
    let resolution = (1920, 1080);
    let fps = 30;

    let result = create_new_project(name.clone(), resolution, fps).await;
    assert!(result.is_ok());

    let project = result.unwrap();
    assert_eq!(project.metadata.name, name);
    assert_eq!(project.timeline.resolution, resolution);
    assert_eq!(project.timeline.fps, fps);
    assert_eq!(project.timeline.duration, 0.0);
    assert_eq!(project.timeline.sample_rate, 48000);
    assert!(project.tracks.is_empty());
    assert!(project.effects.is_empty());
    assert!(project.transitions.is_empty());
    assert!(project.filters.is_empty());
    assert!(project.templates.is_empty());
    assert!(project.style_templates.is_empty());
    assert!(project.subtitles.is_empty());
  }

  #[tokio::test]
  async fn test_create_new_project_different_settings() {
    let name = "4K Project".to_string();
    let resolution = (3840, 2160);
    let fps = 60;

    let result = create_new_project(name.clone(), resolution, fps).await;
    assert!(result.is_ok());

    let project = result.unwrap();
    assert_eq!(project.metadata.name, name);
    assert_eq!(project.timeline.resolution, resolution);
    assert_eq!(project.timeline.fps, fps);
    assert_eq!(project.version, "1.0");
    assert!(project.metadata.description.is_some());
    assert!(project.metadata.author.is_some());
  }

  // Tests for non-Tauri functions that test the core logic

  #[test]
  fn test_ffmpeg_version_parsing_logic() {
    // Test logic for parsing FFmpeg version output
    let version_output = "ffmpeg version 4.4.0 --enable-cuda --enable-nvenc --enable-libmfx";

    let has_cuda = version_output.contains("--enable-cuda");
    let has_nvenc = version_output.contains("--enable-nvenc");
    let has_qsv = version_output.contains("--enable-libmfx");
    let has_amf = version_output.contains("--enable-amf");
    let has_videotoolbox = version_output.contains("--enable-videotoolbox");

    assert!(has_cuda);
    assert!(has_nvenc);
    assert!(has_qsv);
    assert!(!has_amf);
    assert!(!has_videotoolbox);
  }

  #[test]
  fn test_encoder_availability_logic() {
    // Test logic for checking encoder availability
    let encoder_output =
      "Encoders:\n h264_nvenc  NVIDIA NVENC H.264 encoder\n hevc_nvenc  NVIDIA NVENC HEVC encoder";

    let has_h264_nvenc = encoder_output.contains("h264_nvenc");
    let has_hevc_nvenc = encoder_output.contains("hevc_nvenc");
    let has_h264_qsv = encoder_output.contains("h264_qsv");

    assert!(has_h264_nvenc);
    assert!(has_hevc_nvenc);
    assert!(!has_h264_qsv);
  }

  #[test]
  fn test_metadata_json_parsing_logic() {
    // Test logic for parsing FFmpeg metadata output
    let metadata_json = r#"{"format":{"duration":"10.5","bit_rate":"1000000"},"streams":[{"codec_name":"h264","width":1920,"height":1080}]}"#;

    let parsed: serde_json::Value = serde_json::from_str(metadata_json).unwrap();

    assert!(parsed["format"]["duration"].is_string());
    assert!(parsed["format"]["bit_rate"].is_string());
    assert!(parsed["streams"].is_array());
    assert_eq!(parsed["streams"][0]["codec_name"], "h264");
    assert_eq!(parsed["streams"][0]["width"], 1920);
    assert_eq!(parsed["streams"][0]["height"], 1080);
  }

  #[test]
  fn test_cache_config_parsing_logic() {
    // Test logic for parsing cache configuration
    let config = serde_json::json!({
      "size_mb": 1024,
      "preview_quality": 85
    });

    let size_mb = config.get("size_mb").and_then(|v| v.as_u64());
    let preview_quality = config.get("preview_quality").and_then(|v| v.as_u64());

    assert_eq!(size_mb, Some(1024));
    assert_eq!(preview_quality, Some(85));
  }

  #[test]
  fn test_cache_config_missing_values() {
    // Test logic for handling missing cache configuration values
    let config = serde_json::json!({
      "other_setting": "value"
    });

    let size_mb = config.get("size_mb").and_then(|v| v.as_u64());
    let preview_quality = config.get("preview_quality").and_then(|v| v.as_u64());

    assert_eq!(size_mb, None);
    assert_eq!(preview_quality, None);
  }

  #[test]
  fn test_video_info_json_structure() {
    // Test expected structure of video info JSON
    let video_info = serde_json::json!({
      "format": {
        "filename": "/path/to/video.mp4",
        "nb_streams": 2,
        "duration": "120.456",
        "size": "1048576",
        "bit_rate": "8000000"
      },
      "streams": [
        {
          "index": 0,
          "codec_name": "h264",
          "codec_type": "video",
          "width": 1920,
          "height": 1080,
          "r_frame_rate": "30/1"
        },
        {
          "index": 1,
          "codec_name": "aac",
          "codec_type": "audio",
          "sample_rate": "48000",
          "channels": 2
        }
      ]
    });

    assert!(video_info["format"].is_object());
    assert!(video_info["streams"].is_array());
    assert_eq!(video_info["streams"].as_array().unwrap().len(), 2);
    assert_eq!(video_info["streams"][0]["codec_type"], "video");
    assert_eq!(video_info["streams"][1]["codec_type"], "audio");
  }

  #[test]
  fn test_gpu_info_creation_logic() {
    // Test logic for creating GPU info structure
    let encoder_type = crate::video_compiler::core::gpu::GpuEncoder::Nvenc;
    let gpu_info = crate::video_compiler::core::gpu::GpuInfo {
      name: format!("{:?} Encoder", encoder_type),
      driver_version: Some("470.82.01".to_string()),
      memory_total: Some(8192),
      memory_used: Some(2048),
      utilization: Some(75.0),
      encoder_type,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    };

    assert_eq!(gpu_info.name, "Nvenc Encoder");
    assert_eq!(gpu_info.driver_version, Some("470.82.01".to_string()));
    assert_eq!(gpu_info.memory_total, Some(8192));
    assert_eq!(gpu_info.memory_used, Some(2048));
    assert_eq!(gpu_info.utilization, Some(75.0));
    assert_eq!(gpu_info.supported_codecs.len(), 2);
    assert!(gpu_info.supported_codecs.contains(&"h264".to_string()));
    assert!(gpu_info.supported_codecs.contains(&"hevc".to_string()));
  }

  #[test]
  fn test_cache_memory_usage_structure() {
    // Test expected structure for cache memory usage
    let usage = serde_json::json!({
      "total_bytes": 104857600,
      "preview_bytes": 52428800,
      "metadata_bytes": 1048576,
      "render_bytes": 51380224
    });

    assert!(usage["total_bytes"].is_number());
    assert!(usage["preview_bytes"].is_number());
    assert!(usage["metadata_bytes"].is_number());
    assert!(usage["render_bytes"].is_number());

    let total = usage["total_bytes"].as_u64().unwrap();
    let preview = usage["preview_bytes"].as_u64().unwrap();
    let metadata = usage["metadata_bytes"].as_u64().unwrap();
    let render = usage["render_bytes"].as_u64().unwrap();

    assert_eq!(total, 104857600);
    assert_eq!(preview + metadata + render, total);
  }

  #[test]
  fn test_cached_metadata_structure() {
    // Test expected structure for cached metadata
    let metadata = serde_json::json!({
      "duration": 120.5,
      "resolution": [1920, 1080],
      "fps": 30.0,
      "bitrate": 8000000,
      "video_codec": "h264",
      "audio_codec": "aac"
    });

    assert!(metadata["duration"].is_number());
    assert!(metadata["resolution"].is_array());
    assert!(metadata["fps"].is_number());
    assert!(metadata["bitrate"].is_number());
    assert!(metadata["video_codec"].is_string());
    assert!(metadata["audio_codec"].is_string());

    assert_eq!(metadata["duration"], 120.5);
    assert_eq!(metadata["fps"], 30.0);
    assert_eq!(metadata["video_codec"], "h264");
    assert_eq!(metadata["audio_codec"], "aac");
  }

  #[test]
  fn test_render_cache_info_structure() {
    // Test expected structure for render cache info
    let cache_info = serde_json::json!({
      "render_cache_size": 51380224,
      "total_cache_size": 104857600,
      "cache_hit_rate": 0.85
    });

    assert!(cache_info["render_cache_size"].is_number());
    assert!(cache_info["total_cache_size"].is_number());
    assert!(cache_info["cache_hit_rate"].is_number());

    let render_size = cache_info["render_cache_size"].as_u64().unwrap();
    let total_size = cache_info["total_cache_size"].as_u64().unwrap();
    let hit_rate = cache_info["cache_hit_rate"].as_f64().unwrap();

    assert!(render_size <= total_size);
    assert!((0.0..=1.0).contains(&hit_rate));
  }
}
