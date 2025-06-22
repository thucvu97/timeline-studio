//! Info - Команды получения информации о системе и компиляторе
//!
//! Команды для получения версии FFmpeg, информации о системе,
//! поддерживаемых форматах и кодеках.

use std::process::Command;
use sysinfo::System;
use tauri::State;

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::services::FileInfo;
use std::path::Path;

/// Информация о системе
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SystemInfo {
  pub os: OsInfo,
  pub cpu: CpuInfo,
  pub memory: MemoryInfo,
  pub runtime: RuntimeInfo,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OsInfo {
  pub os_type: String,
  pub version: String,
  pub architecture: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CpuInfo {
  pub cores: usize,
  pub arch: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MemoryInfo {
  pub total_bytes: u64,
  pub total_mb: u64,
  pub total_gb: u64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RuntimeInfo {
  pub rust_version: String,
  pub tauri_version: String,
}

use super::state::VideoCompilerState;

/// Получить версию FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_version(state: State<'_, VideoCompilerState>) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .arg("-version")
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  if output.status.success() {
    let version_output = String::from_utf8_lossy(&output.stdout);
    Ok(
      version_output
        .lines()
        .next()
        .unwrap_or("Unknown version")
        .to_string(),
    )
  } else {
    Err(VideoCompilerError::DependencyMissing(
      "Failed to get FFmpeg version".to_string(),
    ))
  }
}

/// Проверить доступность FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_available(state: State<'_, VideoCompilerState>) -> Result<bool> {
  Ok(
    Command::new(&*state.ffmpeg_path.read().await)
      .arg("-version")
      .output()
      .map(|output| output.status.success())
      .unwrap_or(false),
  )
}

/// Получить список поддерживаемых форматов
#[tauri::command]
pub async fn get_supported_formats(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-formats", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  if output.status.success() {
    let formats_output = String::from_utf8_lossy(&output.stdout);
    let formats: Vec<String> = formats_output
      .lines()
      .skip(4) // Пропускаем заголовок
      .filter_map(|line| {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 && parts[0].contains('E') {
          // E означает, что формат поддерживает кодирование
          Some(parts[1].to_string())
        } else {
          None
        }
      })
      .collect();

    Ok(formats)
  } else {
    Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      command: "ffmpeg -formats".to_string(),
    })
  }
}

/// Получить список поддерживаемых видео кодеков
#[tauri::command]
pub async fn get_supported_video_codecs(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-codecs", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  if output.status.success() {
    let codecs_output = String::from_utf8_lossy(&output.stdout);
    let codecs: Vec<String> = codecs_output
      .lines()
      .skip(10) // Пропускаем заголовок
      .filter_map(|line| {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
          let flags = parts[0];
          // Проверяем, что это видео кодек (V) и поддерживает кодирование (E)
          if flags.contains('V') && flags.contains('E') {
            Some(parts[1].to_string())
          } else {
            None
          }
        } else {
          None
        }
      })
      .collect();

    Ok(codecs)
  } else {
    Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      command: "ffmpeg -codecs".to_string(),
    })
  }
}

/// Получить список поддерживаемых аудио кодеков
#[tauri::command]
pub async fn get_supported_audio_codecs(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-codecs", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  if output.status.success() {
    let codecs_output = String::from_utf8_lossy(&output.stdout);
    let codecs: Vec<String> = codecs_output
      .lines()
      .skip(10) // Пропускаем заголовок
      .filter_map(|line| {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
          let flags = parts[0];
          // Проверяем, что это аудио кодек (A) и поддерживает кодирование (E)
          if flags.contains('A') && flags.contains('E') {
            Some(parts[1].to_string())
          } else {
            None
          }
        } else {
          None
        }
      })
      .collect();

    Ok(codecs)
  } else {
    Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      command: "ffmpeg -codecs".to_string(),
    })
  }
}

/// Получить информацию о системе
#[tauri::command]
pub async fn get_system_info() -> Result<serde_json::Value> {
  let cpu_count = num_cpus::get();
  let total_memory = sysinfo::System::new_all().total_memory();

  let os_info = os_info::get();

  Ok(serde_json::json!({
    "os": {
      "type": os_info.os_type().to_string(),
      "version": os_info.version().to_string(),
      "architecture": std::env::consts::ARCH,
    },
    "cpu": {
      "cores": cpu_count,
      "arch": std::env::consts::ARCH,
    },
    "memory": {
      "total_bytes": total_memory,
      "total_mb": total_memory / 1024,
      "total_gb": total_memory / (1024 * 1024),
    },
    "runtime": {
      "rust_version": env!("CARGO_PKG_VERSION"),
      "tauri_version": tauri::VERSION,
    }
  }))
}

/// Получить информацию о доступном дисковом пространстве
#[tauri::command]
pub async fn get_disk_space(path: String) -> Result<serde_json::Value> {
  use sysinfo::Disks;

  let disks = Disks::new_with_refreshed_list();
  let path_disk = disks
    .list()
    .iter()
    .find(|disk| path.starts_with(disk.mount_point().to_str().unwrap_or("")))
    .ok_or_else(|| {
      VideoCompilerError::InternalError(format!("No disk found for path: {}", path))
    })?;

  Ok(serde_json::json!({
    "mount_point": path_disk.mount_point(),
    "total_bytes": path_disk.total_space(),
    "free_bytes": path_disk.available_space(),
    "used_bytes": path_disk.total_space() - path_disk.available_space(),
    "free_percentage": (path_disk.available_space() as f64 / path_disk.total_space() as f64) * 100.0,
  }))
}

/// Получить конфигурацию компилятора
#[tauri::command]
pub async fn get_compiler_config(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let settings = state.settings.read().await;

  Ok(serde_json::json!({
    "ffmpeg_path": state.ffmpeg_path.read().await.clone(),
    "hardware_acceleration": settings.hardware_acceleration,
    "gpu_index": None::<usize>,
    "parallel_jobs": settings.max_concurrent_jobs,
    "memory_limit_mb": None::<u64>,
    "temp_directory": settings.temp_directory,
    "log_level": "info",
  }))
}

/// Получить статистику производительности
#[tauri::command]
pub async fn get_performance_stats(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let active_jobs = state.active_jobs.read().await;
  let cache_stats = state.cache_manager.read().await.get_memory_usage();

  let mut sys = System::new_all();
  sys.refresh_memory();
  sys.refresh_cpu_usage();

  let total_memory = sys.total_memory();
  let used_memory = sys.used_memory();
  let free_memory = total_memory - used_memory;

  Ok(serde_json::json!({
    "active_render_jobs": active_jobs.len(),
    "memory": {
      "used_mb": used_memory / 1024,
      "free_mb": free_memory / 1024,
      "total_mb": total_memory / 1024,
      "usage_percentage": (used_memory as f64 / total_memory as f64) * 100.0,
    },
    "cache": {
      "size_mb": cache_stats.total_bytes / (1024 * 1024),
      "entries": cache_stats.preview_bytes / 1024, // Приблизительно
    },
    "cpu_usage": sys.global_cpu_usage(),
  }))
}

/// Получить список доступных фильтров FFmpeg
#[tauri::command]
pub async fn get_available_filters(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-filters", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  if output.status.success() {
    let filters_output = String::from_utf8_lossy(&output.stdout);
    let filters: Vec<String> = filters_output
      .lines()
      .skip(8) // Пропускаем заголовок
      .filter_map(|line| {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
          Some(parts[1].to_string())
        } else {
          None
        }
      })
      .collect();

    Ok(filters)
  } else {
    Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: String::from_utf8_lossy(&output.stderr).to_string(),
      command: "ffmpeg -filters".to_string(),
    })
  }
}

/// Получить информацию о медиафайле
#[tauri::command]
pub async fn get_media_file_info(
  state: State<'_, VideoCompilerState>,
  file_path: String,
) -> Result<FileInfo> {
  if let Some(ffmpeg_service) = state.services.get_ffmpeg_service() {
    ffmpeg_service.get_file_info(Path::new(&file_path)).await
  } else {
    Err(VideoCompilerError::InternalError(
      "FFmpeg service not available".to_string(),
    ))
  }
}
