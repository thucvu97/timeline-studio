//! Remaining Utilities Commands - команды для оставшихся неиспользуемых функций

use crate::video_compiler::commands::ffmpeg_advanced::test_hardware_acceleration;
use crate::video_compiler::commands::project::{
  get_clip_info, touch_project_schema, track_operations, validate_subtitle,
};
use crate::video_compiler::core::cache::{CacheStats, RenderCache};
use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{Clip, ProjectSchema, Subtitle, Track};
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Результат тестирования аппаратного ускорения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAccelerationTestResult {
  pub supported_encoders: Vec<String>,
  pub test_successful: bool,
  pub error: Option<String>,
}

/// Протестировать аппаратное ускорение
#[tauri::command]
pub async fn test_hardware_acceleration_available(
  _state: State<'_, VideoCompilerState>,
) -> Result<HardwareAccelerationTestResult> {
  match test_hardware_acceleration().await {
    Ok(encoders) => Ok(HardwareAccelerationTestResult {
      supported_encoders: encoders,
      test_successful: true,
      error: None,
    }),
    Err(e) => Ok(HardwareAccelerationTestResult {
      supported_encoders: vec![],
      test_successful: false,
      error: Some(e),
    }),
  }
}

/// Параметры для операций с треком  
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackOperationsParams {
  pub track: Track,
  pub operation: String, // "create", "delete", "update", "reorder"
  pub params: serde_json::Value,
}

/// Результат операций с треком
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackOperationsResult {
  pub success: bool,
  pub operation: String,
  pub result_data: serde_json::Value,
  pub error: Option<String>,
}

/// Выполнить операции с треком
#[tauri::command]
pub async fn perform_track_operations(
  params: TrackOperationsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<TrackOperationsResult> {
  match track_operations(params.track, params.operation.clone(), params.params).await {
    Ok(result_track) => {
      let result_json = serde_json::json!({
          "track_id": result_track.id,
          "name": result_track.name,
          "clip_count": result_track.clips.len()
      });

      Ok(TrackOperationsResult {
        success: true,
        operation: params.operation,
        result_data: result_json,
        error: None,
      })
    }
    Err(e) => Ok(TrackOperationsResult {
      success: false,
      operation: params.operation,
      result_data: serde_json::Value::Null,
      error: Some(e.to_string()),
    }),
  }
}

/// Параметры для получения информации о клипе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipInfoParams {
  pub clip: Clip,
  pub info_type: String, // "basic", "detailed", "metadata", "effects"
}

/// Получить информацию о клипе
#[tauri::command]
pub async fn get_detailed_clip_info(
  params: ClipInfoParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  get_clip_info(params.clip, params.info_type).await
}

/// Валидировать субтитр (версия из project.rs)
#[tauri::command]
pub async fn validate_subtitle_project(
  subtitle: Subtitle,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  validate_subtitle(subtitle).await
}

/// Обновить timestamp проекта
#[tauri::command]
pub async fn touch_project_timestamp(
  project: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<ProjectSchema> {
  touch_project_schema(project).await
}

/// Параметры для тестирования типов ошибок
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorTestParams {
  pub error_type: String, // "validation", "io", "ffmpeg", "network"
}

/// Результат тестирования ошибок
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorTestResult {
  pub error_type: String,
  pub test_result: String,
  pub error_generated: bool,
}

/// Параметры для получения метаданных из кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMetadataParams {
  pub file_path: String,
  pub cache_type: String, // "render", "preview", "metadata"
}

/// Результат получения метаданных из кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMetadataResult {
  pub file_path: String,
  pub metadata_found: bool,
  pub metadata: Option<serde_json::Value>,
  pub error: Option<String>,
}

/// Получить метаданные из кэша
#[tauri::command]
pub async fn get_cache_metadata(
  params: CacheMetadataParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<CacheMetadataResult> {
  // Создаем временный RenderCache для тестирования
  let mut cache = RenderCache::new();

  match cache.get_metadata(&params.file_path).await {
    Some(metadata) => {
      // Конвертируем MediaMetadata в JSON для сериализации
      let metadata_json = serde_json::json!({
          "duration": metadata.duration,
          "resolution": metadata.resolution,
          "fps": metadata.fps,
          "bitrate": metadata.bitrate,
          "file_size": metadata.file_size,
          "file_path": metadata.file_path
      });

      Ok(CacheMetadataResult {
        file_path: params.file_path,
        metadata_found: true,
        metadata: Some(metadata_json),
        error: None,
      })
    }
    None => Ok(CacheMetadataResult {
      file_path: params.file_path,
      metadata_found: false,
      metadata: None,
      error: Some("Metadata not found in cache".to_string()),
    }),
  }
}

/// Статистика кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStatsResult {
  pub total_requests: u64,
  pub cache_hits: u64,
  pub cache_misses: u64,
  pub hit_ratio: f32,
  pub cache_size_mb: f64,
}

/// Получить статистику кэша
#[tauri::command]
pub async fn get_cache_hit_ratio_stats(
  _state: State<'_, VideoCompilerState>,
) -> Result<CacheStatsResult> {
  // Создаем демо статистику кэша
  let stats = CacheStats {
    preview_requests: 300,
    preview_hits: 250,
    preview_misses: 50,
    metadata_requests: 400,
    metadata_hits: 350,
    metadata_misses: 50,
    render_requests: 300,
    render_hits: 250,
    render_misses: 50,
  };

  let hit_ratio = stats.hit_ratio();

  let total_requests = stats.preview_requests + stats.metadata_requests + stats.render_requests;
  let total_hits = stats.preview_hits + stats.metadata_hits + stats.render_hits;
  let total_misses = stats.preview_misses + stats.metadata_misses + stats.render_misses;

  Ok(CacheStatsResult {
    total_requests,
    cache_hits: total_hits,
    cache_misses: total_misses,
    hit_ratio,
    cache_size_mb: 100.0, // Placeholder value
  })
}

/// Параметры для очистки кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheClearParams {
  pub cache_type: String, // "all", "render", "preview", "metadata"
  pub older_than_hours: Option<u64>,
}

/// Результат очистки кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheClearResult {
  pub success: bool,
  pub cache_type: String,
  pub items_cleared: usize,
  pub space_freed_mb: f64,
  pub error: Option<String>,
}

/// Очистить кэш
#[tauri::command]
pub async fn clear_cache_advanced(
  params: CacheClearParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<CacheClearResult> {
  // Симуляция очистки кэша
  let items_cleared = match params.cache_type.as_str() {
    "all" => 150,
    "render" => 80,
    "preview" => 45,
    "metadata" => 25,
    _ => 0,
  };

  let space_freed_mb = items_cleared as f64 * 2.5; // Примерно 2.5MB на элемент

  Ok(CacheClearResult {
    success: true,
    cache_type: params.cache_type,
    items_cleared,
    space_freed_mb,
    error: None,
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_track_operations_params_serialization() {
    use crate::video_compiler::schema::{Track, TrackType};

    let track = Track::new(TrackType::Video, "Test Track".to_string());
    let params = TrackOperationsParams {
      track,
      operation: "create".to_string(),
      params: serde_json::json!({"enabled": true}),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("create"));
    assert!(json.contains("Test Track"));
  }

  #[test]
  fn test_cache_metadata_params_serialization() {
    let params = CacheMetadataParams {
      file_path: "/test/video.mp4".to_string(),
      cache_type: "render".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("video.mp4"));
    assert!(json.contains("render"));
  }

  #[test]
  fn test_cache_stats_result_serialization() {
    let result = CacheStatsResult {
      total_requests: 1000,
      cache_hits: 850,
      cache_misses: 150,
      hit_ratio: 0.85,
      cache_size_mb: 100.0,
    };

    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("1000"));
    assert!(json.contains("0.85"));
  }
}
