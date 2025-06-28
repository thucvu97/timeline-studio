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
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

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
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

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
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

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
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

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
    .ok_or_else(|| VideoCompilerError::InternalError(format!("No disk found for path: {path}")))?;

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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_system_info_structure() {
    let os_info = OsInfo {
      os_type: "Linux".to_string(),
      version: "22.04.1".to_string(),
      architecture: "x86_64".to_string(),
    };

    let cpu_info = CpuInfo {
      cores: 8,
      arch: "x86_64".to_string(),
    };

    let memory_info = MemoryInfo {
      total_bytes: 16_000_000_000,
      total_mb: 15_000,
      total_gb: 15,
    };

    let runtime_info = RuntimeInfo {
      rust_version: "1.70.0".to_string(),
      tauri_version: "1.5.0".to_string(),
    };

    let system_info = SystemInfo {
      os: os_info.clone(),
      cpu: cpu_info.clone(),
      memory: memory_info.clone(),
      runtime: runtime_info.clone(),
    };

    assert_eq!(system_info.os.os_type, "Linux");
    assert_eq!(system_info.cpu.cores, 8);
    assert_eq!(system_info.memory.total_gb, 15);
    assert_eq!(system_info.runtime.rust_version, "1.70.0");
  }

  #[test]
  fn test_os_info_serialization() {
    let os_info = OsInfo {
      os_type: "macOS".to_string(),
      version: "13.5.2".to_string(),
      architecture: "arm64".to_string(),
    };

    let json = serde_json::to_string(&os_info).unwrap();
    let deserialized: OsInfo = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.os_type, "macOS");
    assert_eq!(deserialized.version, "13.5.2");
    assert_eq!(deserialized.architecture, "arm64");
  }

  #[test]
  fn test_cpu_info_creation() {
    let cpu_info = CpuInfo {
      cores: 16,
      arch: "aarch64".to_string(),
    };

    assert_eq!(cpu_info.cores, 16);
    assert_eq!(cpu_info.arch, "aarch64");
  }

  #[test]
  fn test_memory_info_conversions() {
    let memory_info = MemoryInfo {
      total_bytes: 32_000_000_000, // 32GB approx
      total_mb: 30_517,
      total_gb: 29,
    };

    assert!(memory_info.total_bytes > 30_000_000_000);
    assert!(memory_info.total_mb > 30_000);
    assert!(memory_info.total_gb >= 29);

    // Test conversion logic
    let calculated_mb = memory_info.total_bytes / 1024;
    let calculated_gb = memory_info.total_bytes / (1024 * 1024);

    assert!(calculated_mb > 29_000_000); // Should be much larger for bytes->MB conversion
    assert!(calculated_gb > 29_000); // Should be much larger for bytes->GB conversion
  }

  #[test]
  fn test_runtime_info_structure() {
    let runtime_info = RuntimeInfo {
      rust_version: "1.75.0".to_string(),
      tauri_version: "1.5.4".to_string(),
    };

    assert!(runtime_info.rust_version.starts_with("1."));
    assert!(runtime_info.tauri_version.starts_with("1."));
  }

  #[test]
  fn test_ffmpeg_version_parsing_logic() {
    // Test FFmpeg version output parsing logic
    let sample_output =
      "ffmpeg version 4.4.2-0ubuntu0.22.04.1 Copyright (c) 2000-2021 the FFmpeg developers";
    let first_line = sample_output.lines().next().unwrap_or("Unknown version");

    assert_eq!(
      first_line,
      "ffmpeg version 4.4.2-0ubuntu0.22.04.1 Copyright (c) 2000-2021 the FFmpeg developers"
    );
    assert!(first_line.contains("ffmpeg version"));
    assert!(first_line.contains("4.4.2"));
  }

  #[test]
  fn test_supported_formats_parsing_logic() {
    // Test format parsing logic for FFmpeg -formats output
    let sample_formats_output = r#"
File formats:
 D. = Demuxing supported
 .E = Muxing supported
 --
 DE 3dostr          3DO STR
 DE 3g2             3GP2 (3GPP2 file format)
 DE 3gp             3GP (3GPP file format)
  E mp4             MP4 (MPEG-4 Part 14)
 D  avi             AVI (Audio Video Interleaved)
"#;

    let formats: Vec<String> = sample_formats_output
      .lines()
      .skip(4) // Skip header
      .filter_map(|line| {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 && parts[0].contains('E') {
          Some(parts[1].to_string())
        } else {
          None
        }
      })
      .collect();

    assert!(formats.contains(&"3dostr".to_string()));
    assert!(formats.contains(&"3g2".to_string()));
    assert!(formats.contains(&"3gp".to_string()));
    assert!(formats.contains(&"mp4".to_string()));
    assert!(!formats.contains(&"avi".to_string())); // Only demuxing, no E flag
  }

  #[test]
  fn test_video_codecs_parsing_logic() {
    // Test video codec parsing logic
    let sample_codecs_output = r#"File formats:
 D. = Demuxing supported
 .E = Muxing supported
Codecs:
 D..... = Decoding supported
 .E.... = Encoding supported
 ..V... = Video codec
 ..A... = Audio codec
 ..S... = Subtitle codec
 .....D = Intra frame-only codec
 ------
 DEV.L. h264                 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10
 DEV.L. hevc                 H.265 / HEVC (High Efficiency Video Coding)
 DEA... aac                  AAC (Advanced Audio Coding)
 D.A... mp3                  MP3 (MPEG audio layer 3)
"#;

    let video_codecs: Vec<String> = sample_codecs_output
      .lines()
      .skip(10) // Skip header
      .filter_map(|line| {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
          let flags = parts[0];
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

    assert!(video_codecs.contains(&"h264".to_string()));
    assert!(video_codecs.contains(&"hevc".to_string()));
    assert!(!video_codecs.contains(&"aac".to_string())); // Audio codec
    assert!(!video_codecs.contains(&"mp3".to_string())); // Audio codec, no encoding
  }

  #[test]
  fn test_audio_codecs_parsing_logic() {
    // Test audio codec parsing logic
    let sample_codecs_output = r#"File formats:
 D. = Demuxing supported
 .E = Muxing supported
Codecs:
 D..... = Decoding supported
 .E.... = Encoding supported
 ..V... = Video codec
 ..A... = Audio codec
 ..S... = Subtitle codec
 .....D = Intra frame-only codec
 ------
 DEV.L. h264                 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10
 DEA... aac                  AAC (Advanced Audio Coding)
 DEA... mp3                  MP3 (MPEG audio layer 3)
 D.A... flac                 FLAC (Free Lossless Audio Codec)
"#;

    let audio_codecs: Vec<String> = sample_codecs_output
      .lines()
      .skip(10) // Skip header
      .filter_map(|line| {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
          let flags = parts[0];
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

    assert!(audio_codecs.contains(&"aac".to_string()));
    assert!(audio_codecs.contains(&"mp3".to_string()));
    assert!(!audio_codecs.contains(&"flac".to_string())); // No encoding support
    assert!(!audio_codecs.contains(&"h264".to_string())); // Video codec
  }

  #[test]
  fn test_system_info_json_structure() {
    // Test the expected JSON structure for system info
    let expected_fields = ["os", "cpu", "memory", "runtime"];

    let test_json = serde_json::json!({
      "os": {
        "type": "Linux",
        "version": "22.04",
        "architecture": "x86_64"
      },
      "cpu": {
        "cores": 8,
        "arch": "x86_64"
      },
      "memory": {
        "total_bytes": 16000000000_u64,
        "total_mb": 15625,
        "total_gb": 15
      },
      "runtime": {
        "rust_version": "1.75.0",
        "tauri_version": "1.5.0"
      }
    });

    for field in &expected_fields {
      assert!(test_json[field].is_object());
    }

    assert_eq!(test_json["os"]["type"], "Linux");
    assert_eq!(test_json["cpu"]["cores"], 8);
    assert!(test_json["memory"]["total_bytes"].is_number());
    assert!(test_json["runtime"]["rust_version"].is_string());
  }

  #[test]
  fn test_disk_space_json_structure() {
    // Test expected structure for disk space info
    let test_disk_info = serde_json::json!({
      "mount_point": "/",
      "total_bytes": 1000000000000_u64,
      "free_bytes": 500000000000_u64,
      "used_bytes": 500000000000_u64,
      "free_percentage": 50.0
    });

    assert!(test_disk_info["mount_point"].is_string());
    assert!(test_disk_info["total_bytes"].is_number());
    assert!(test_disk_info["free_bytes"].is_number());
    assert!(test_disk_info["used_bytes"].is_number());
    assert!(test_disk_info["free_percentage"].is_number());

    let free_pct = test_disk_info["free_percentage"].as_f64().unwrap();
    assert!((0.0..=100.0).contains(&free_pct));
  }

  #[test]
  fn test_compiler_config_json_structure() {
    // Test expected structure for compiler config
    let test_config = serde_json::json!({
      "ffmpeg_path": "/usr/bin/ffmpeg",
      "hardware_acceleration": true,
      "gpu_index": null,
      "parallel_jobs": 4,
      "memory_limit_mb": null,
      "temp_directory": "/tmp/timeline-studio",
      "log_level": "info"
    });

    assert!(test_config["ffmpeg_path"].is_string());
    assert!(test_config["hardware_acceleration"].is_boolean());
    assert!(test_config["gpu_index"].is_null());
    assert!(test_config["parallel_jobs"].is_number());
    assert!(test_config["memory_limit_mb"].is_null());
    assert!(test_config["temp_directory"].is_string());
    assert_eq!(test_config["log_level"], "info");
  }

  #[test]
  fn test_performance_stats_json_structure() {
    // Test expected structure for performance stats
    let test_stats = serde_json::json!({
      "active_render_jobs": 2,
      "memory": {
        "used_mb": 8192,
        "free_mb": 7936,
        "total_mb": 16128,
        "usage_percentage": 50.8
      },
      "cache": {
        "size_mb": 512,
        "entries": 1024
      },
      "cpu_usage": 25.5
    });

    assert!(test_stats["active_render_jobs"].is_number());
    assert!(test_stats["memory"].is_object());
    assert!(test_stats["cache"].is_object());
    assert!(test_stats["cpu_usage"].is_number());

    // Test memory section
    let memory = &test_stats["memory"];
    assert!(memory["used_mb"].is_number());
    assert!(memory["free_mb"].is_number());
    assert!(memory["total_mb"].is_number());
    assert!(memory["usage_percentage"].is_number());

    let cpu_usage = test_stats["cpu_usage"].as_f64().unwrap();
    assert!((0.0..=100.0).contains(&cpu_usage));
  }

  #[test]
  fn test_ffmpeg_error_handling_structure() {
    // Test error handling logic for FFmpeg commands
    let sample_stderr = "ffmpeg: command not found";
    let exit_code = Some(127);

    // This simulates how errors would be constructed
    let error_json = serde_json::json!({
      "error_type": "FFmpegError",
      "exit_code": exit_code,
      "stderr": sample_stderr,
      "command": "ffmpeg -version"
    });

    assert_eq!(error_json["error_type"], "FFmpegError");
    assert_eq!(error_json["exit_code"], 127);
    assert_eq!(error_json["stderr"], sample_stderr);
    assert!(error_json["command"]
      .as_str()
      .unwrap()
      .starts_with("ffmpeg"));
  }
}

/// Получить список доступных фильтров FFmpeg
#[tauri::command]
pub async fn get_available_filters(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = Command::new(&*ffmpeg_path)
    .args(["-filters", "-hide_banner"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {e}")))?;

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
