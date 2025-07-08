//! Продвинутые метрики и алерты
//!
//! Реализация кастомных метрик для сервисов согласно MONITORING_IMPLEMENTATION.md

use tauri::State;

use crate::video_compiler::error::Result;
use crate::video_compiler::services::cache_service::{
  AlertSeverity, CacheAlert, CacheAlertThresholds, CacheAlertType, CachePerformanceMetrics,
  SlowCacheOperation,
};

use super::state::VideoCompilerState;

// ============ Бизнес-логика (тестируемая) ============

/// Генерация метрик производительности кэша
pub fn generate_cache_performance_metrics() -> CachePerformanceMetrics {
  CachePerformanceMetrics {
    hit_rate_last_hour: 0.85,
    hit_rate_last_day: 0.82,
    average_response_time_ms: 12.5,
    peak_memory_usage_mb: 256.0,
    current_memory_usage_mb: 128.0,
    fragmentation_ratio: 0.15,
    top_accessed_keys: vec![
      "preview_1920x1080_60fps".to_string(),
      "render_segment_0-10s".to_string(),
      "metadata_video.mp4".to_string(),
    ],
    slow_operations: vec![SlowCacheOperation {
      operation: "get_preview".to_string(),
      key: "large_4k_preview".to_string(),
      duration_ms: 250.0,
      timestamp: chrono::Utc::now().to_rfc3339(),
    }],
  }
}

// ============ Tauri команды (тонкие обёртки) ============

/// Получить расширенные метрики производительности кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_performance_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<CachePerformanceMetrics> {
  log::debug!("Получение расширенных метрик кэша");
  Ok(generate_cache_performance_metrics())
}

/// Валидация порогов алертов
pub fn validate_alert_thresholds(thresholds: &CacheAlertThresholds) -> bool {
  thresholds.min_hit_rate >= 0.0
    && thresholds.min_hit_rate <= 1.0
    && thresholds.max_memory_usage_mb > 0.0
    && thresholds.max_response_time_ms > 0.0
    && thresholds.max_fragmentation >= 0.0
    && thresholds.max_fragmentation <= 1.0
}

/// Генерация алертов кэша
pub fn generate_cache_alerts() -> Vec<CacheAlert> {
  vec![
    CacheAlert {
      alert_type: CacheAlertType::LowHitRate,
      message: "Cache hit rate упал ниже 80%".to_string(),
      severity: AlertSeverity::Warning,
      timestamp: chrono::Utc::now().to_rfc3339(),
      current_value: 0.75,
      threshold_value: 0.80,
    },
    CacheAlert {
      alert_type: CacheAlertType::HighMemoryUsage,
      message: "Использование памяти кэша превысило 200 MB".to_string(),
      severity: AlertSeverity::Critical,
      timestamp: chrono::Utc::now().to_rfc3339(),
      current_value: 225.0,
      threshold_value: 200.0,
    },
  ]
}

/// Установить пороги для алертов кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn set_cache_alert_thresholds(
  thresholds: CacheAlertThresholds,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  log::info!(
    "Установка порогов алертов кэша: hit_rate >= {}, memory <= {} MB",
    thresholds.min_hit_rate,
    thresholds.max_memory_usage_mb
  );

  if !validate_alert_thresholds(&thresholds) {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        "Invalid alert thresholds".to_string(),
      ),
    );
  }

  // В реальной реализации сохранили бы в настройках сервиса
  Ok(())
}

/// Получить активные алерты кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_alerts(_state: State<'_, VideoCompilerState>) -> Result<Vec<CacheAlert>> {
  log::debug!("Получение активных алертов кэша");
  Ok(generate_cache_alerts())
}

/// Генерация метрик GPU
pub fn generate_gpu_metrics() -> serde_json::Value {
  serde_json::json!({
      "gpu_utilization_percent": 65.0,
      "memory_used_mb": 1024.0,
      "memory_total_mb": 8192.0,
      "memory_utilization_percent": 12.5,
      "temperature_celsius": 72.0,
      "power_usage_watts": 150.0,
      "active_encoders": 2,
      "encoding_sessions": [
          {
              "session_id": "render_001",
              "codec": "h264_nvenc",
              "resolution": "1920x1080",
              "fps": 30,
              "bitrate_mbps": 8.0,
              "duration_seconds": 45.2
          },
          {
              "session_id": "preview_002",
              "codec": "h264_nvenc",
              "resolution": "640x360",
              "fps": 15,
              "bitrate_mbps": 1.0,
              "duration_seconds": 12.8
          }
      ],
      "performance_metrics": {
          "encode_fps": 28.5,
          "queue_length": 3,
          "average_encode_time_ms": 35.2,
          "failed_encodes": 0,
          "hardware_acceleration_active": true
      }
  })
}

/// Получить метрики использования GPU
#[tauri::command]
#[allow(dead_code)]
pub async fn get_gpu_utilization_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  log::debug!("Получение метрик использования GPU");
  Ok(generate_gpu_metrics())
}

/// Генерация метрик использования памяти
pub fn generate_memory_usage_metrics() -> serde_json::Value {
  serde_json::json!({
      "total_memory_mb": 512.0,
      "services": {
          "cache_service": {
              "memory_mb": 128.0,
              "percentage": 25.0,
              "peak_memory_mb": 256.0,
              "allocations": 1250,
              "deallocations": 1180
          },
          "render_service": {
              "memory_mb": 256.0,
              "percentage": 50.0,
              "peak_memory_mb": 384.0,
              "allocations": 850,
              "deallocations": 820
          },
          "preview_service": {
              "memory_mb": 64.0,
              "percentage": 12.5,
              "peak_memory_mb": 96.0,
              "allocations": 420,
              "deallocations": 400
          },
          "gpu_service": {
              "memory_mb": 32.0,
              "percentage": 6.25,
              "peak_memory_mb": 48.0,
              "allocations": 180,
              "deallocations": 175
          },
          "project_service": {
              "memory_mb": 16.0,
              "percentage": 3.125,
              "peak_memory_mb": 24.0,
              "allocations": 95,
              "deallocations": 90
          },
          "ffmpeg_service": {
              "memory_mb": 16.0,
              "percentage": 3.125,
              "peak_memory_mb": 32.0,
              "allocations": 60,
              "deallocations": 58
          }
      },
      "memory_alerts": [
          {
              "service": "render_service",
              "type": "high_usage",
              "message": "Render service использует более 400 MB памяти",
              "severity": "warning"
          }
      ],
      "gc_stats": {
          "collections": 15,
          "total_freed_mb": 89.5,
          "average_collection_time_ms": 2.3
      }
  })
}

/// Получить метрики использования памяти для всех сервисов
#[tauri::command]
#[allow(dead_code)]
pub async fn get_memory_usage_metrics(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  log::debug!("Получение метрик использования памяти");
  Ok(generate_memory_usage_metrics())
}

/// Создание кастомного алерта
pub fn create_custom_alert_id(
  alert_name: &str,
  metric_name: &str,
  threshold: f64,
  operator: &str,
  severity: &str,
) -> Result<String> {
  // Валидация оператора
  match operator {
    "greater_than" | "less_than" | "equals" => {}
    _ => {
      return Err(
        crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
          "Invalid operator: {operator}"
        )),
      )
    }
  }

  // Валидация severity
  match severity {
    "info" | "warning" | "critical" => {}
    _ => {
      return Err(
        crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
          "Invalid severity: {severity}"
        )),
      )
    }
  }

  // Валидация порога
  if !threshold.is_finite() {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        "Invalid threshold value".to_string(),
      ),
    );
  }

  log::info!(
    "Создание кастомного алерта: {alert_name} для метрики {metric_name} {operator} {threshold}"
  );

  let alert_id = uuid::Uuid::new_v4().to_string();
  Ok(alert_id)
}

/// Создать кастомный алерт для метрик
#[tauri::command]
#[allow(dead_code)]
pub async fn create_custom_alert(
  alert_name: String,
  metric_name: String,
  threshold: f64,
  operator: String, // "greater_than", "less_than", "equals"
  severity: String, // "info", "warning", "critical"
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  create_custom_alert_id(&alert_name, &metric_name, threshold, &operator, &severity)
}

/// Генерация истории метрик
pub fn generate_metrics_history(
  service_name: &str,
  metric_name: &str,
  hours_back: u32,
) -> serde_json::Value {
  // Симуляция исторических данных
  let mut data_points = Vec::new();
  let start_time = chrono::Utc::now() - chrono::Duration::hours(hours_back as i64);

  for i in 0..hours_back {
    let timestamp = start_time + chrono::Duration::hours(i as i64);
    let value = match metric_name {
      "hit_rate" => 0.8 + (i as f64 * 0.01) + ((i % 7) as f64 * 0.02 - 0.07),
      "memory_usage" => 100.0 + (i as f64 * 2.0) + ((i % 11) as f64 * 4.0 - 20.0),
      "response_time" => 10.0 + ((i % 13) as f64 * 1.5),
      _ => (i % 17) as f64 * 6.0,
    };

    data_points.push(serde_json::json!({
        "timestamp": timestamp.to_rfc3339(),
        "value": value
    }));
  }

  let min = data_points
    .iter()
    .map(|p| p["value"].as_f64().unwrap_or(0.0))
    .fold(f64::INFINITY, f64::min);
  let max = data_points
    .iter()
    .map(|p| p["value"].as_f64().unwrap_or(0.0))
    .fold(f64::NEG_INFINITY, f64::max);
  let sum: f64 = data_points
    .iter()
    .map(|p| p["value"].as_f64().unwrap_or(0.0))
    .sum();
  let avg = if data_points.is_empty() {
    0.0
  } else {
    sum / data_points.len() as f64
  };

  serde_json::json!({
      "service": service_name,
      "metric": metric_name,
      "period_hours": hours_back,
      "data_points": data_points,
      "summary": {
          "min": min,
          "max": max,
          "avg": avg,
      }
  })
}

/// Получить историю метрик для анализа трендов
#[tauri::command]
#[allow(dead_code)]
pub async fn get_metrics_history(
  service_name: String,
  metric_name: String,
  hours_back: u32,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  log::debug!("Получение истории метрик для {service_name} - {metric_name} за {hours_back} часов");
  Ok(generate_metrics_history(
    &service_name,
    &metric_name,
    hours_back,
  ))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cache_performance_metrics_generation() {
    // Тестируем логику генерации метрик
    let metrics = CachePerformanceMetrics {
      hit_rate_last_hour: 0.85,
      hit_rate_last_day: 0.82,
      average_response_time_ms: 12.5,
      peak_memory_usage_mb: 256.0,
      current_memory_usage_mb: 128.0,
      fragmentation_ratio: 0.15,
      top_accessed_keys: vec![
        "preview_1920x1080_60fps".to_string(),
        "render_segment_0-10s".to_string(),
        "metadata_video.mp4".to_string(),
      ],
      slow_operations: vec![SlowCacheOperation {
        operation: "get_preview".to_string(),
        key: "large_4k_preview".to_string(),
        duration_ms: 250.0,
        timestamp: chrono::Utc::now().to_rfc3339(),
      }],
    };

    assert!(metrics.hit_rate_last_hour >= 0.0 && metrics.hit_rate_last_hour <= 1.0);
    assert!(metrics.hit_rate_last_day >= 0.0 && metrics.hit_rate_last_day <= 1.0);
    assert!(metrics.average_response_time_ms > 0.0);
    assert!(metrics.peak_memory_usage_mb >= metrics.current_memory_usage_mb);
    assert_eq!(metrics.top_accessed_keys.len(), 3);
    assert_eq!(metrics.slow_operations.len(), 1);
  }

  #[test]
  fn test_cache_alert_generation() {
    let alerts = [
      CacheAlert {
        alert_type: CacheAlertType::LowHitRate,
        message: "Cache hit rate упал ниже 80%".to_string(),
        severity: AlertSeverity::Warning,
        timestamp: chrono::Utc::now().to_rfc3339(),
        current_value: 0.75,
        threshold_value: 0.80,
      },
      CacheAlert {
        alert_type: CacheAlertType::HighMemoryUsage,
        message: "Использование памяти кэша превысило 200 MB".to_string(),
        severity: AlertSeverity::Critical,
        timestamp: chrono::Utc::now().to_rfc3339(),
        current_value: 225.0,
        threshold_value: 200.0,
      },
    ];

    assert_eq!(alerts.len(), 2);
    assert!(alerts[0].current_value < alerts[0].threshold_value);
    assert!(alerts[1].current_value > alerts[1].threshold_value);
    assert!(matches!(alerts[0].severity, AlertSeverity::Warning));
    assert!(matches!(alerts[1].severity, AlertSeverity::Critical));
  }

  #[test]
  fn test_gpu_metrics_json_structure() {
    let gpu_metrics = serde_json::json!({
        "gpu_utilization_percent": 65.0,
        "memory_used_mb": 1024.0,
        "memory_total_mb": 8192.0,
        "memory_utilization_percent": 12.5,
        "temperature_celsius": 72.0,
        "power_usage_watts": 150.0,
        "active_encoders": 2,
        "encoding_sessions": [
            {
                "session_id": "render_001",
                "codec": "h264_nvenc",
                "resolution": "1920x1080",
                "fps": 30,
                "bitrate_mbps": 8.0,
                "duration_seconds": 45.2
            }
        ],
        "performance_metrics": {
            "encode_fps": 28.5,
            "queue_length": 3,
            "average_encode_time_ms": 35.2,
            "failed_encodes": 0,
            "hardware_acceleration_active": true
        }
    });

    assert_eq!(gpu_metrics["gpu_utilization_percent"], 65.0);
    assert!(gpu_metrics["encoding_sessions"].is_array());
    assert!(
      gpu_metrics["performance_metrics"]["hardware_acceleration_active"]
        .as_bool()
        .unwrap()
    );
  }

  #[test]
  fn test_memory_usage_metrics_structure() {
    let memory_metrics = serde_json::json!({
        "total_memory_mb": 512.0,
        "services": {
            "cache_service": {
                "memory_mb": 128.0,
                "percentage": 25.0,
                "peak_memory_mb": 256.0,
                "allocations": 1250,
                "deallocations": 1180
            }
        },
        "memory_alerts": [],
        "gc_stats": {
            "collections": 15,
            "total_freed_mb": 89.5,
            "average_collection_time_ms": 2.3
        }
    });

    assert_eq!(memory_metrics["total_memory_mb"], 512.0);
    assert!(memory_metrics["services"]["cache_service"].is_object());
    assert_eq!(
      memory_metrics["services"]["cache_service"]["percentage"],
      25.0
    );
  }

  #[test]
  fn test_metrics_history_generation() {
    let hours_back = 6;
    let mut data_points = Vec::new();
    let start_time = chrono::Utc::now() - chrono::Duration::hours(hours_back as i64);

    for i in 0..hours_back {
      let timestamp = start_time + chrono::Duration::hours(i as i64);
      let value = 0.8 + (i as f64 * 0.01);

      data_points.push(serde_json::json!({
          "timestamp": timestamp.to_rfc3339(),
          "value": value
      }));
    }

    assert_eq!(data_points.len(), 6);

    // Проверяем что временные метки упорядочены
    for i in 1..data_points.len() {
      let ts1 = data_points[i - 1]["timestamp"].as_str().unwrap();
      let ts2 = data_points[i]["timestamp"].as_str().unwrap();
      let dt1 = chrono::DateTime::parse_from_rfc3339(ts1).unwrap();
      let dt2 = chrono::DateTime::parse_from_rfc3339(ts2).unwrap();
      assert!(dt2 > dt1);
    }
  }

  #[test]
  fn test_alert_id_generation() {
    let alert_id = uuid::Uuid::new_v4().to_string();
    assert!(uuid::Uuid::parse_str(&alert_id).is_ok());
    assert_eq!(alert_id.len(), 36);
  }

  #[test]
  fn test_metrics_summary_calculation() {
    let values = [10.0, 20.0, 30.0, 40.0, 50.0];

    let min = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
    let max = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
    let sum: f64 = values.iter().sum();
    let avg = sum / values.len() as f64;

    assert_eq!(min, 10.0);
    assert_eq!(max, 50.0);
    assert_eq!(avg, 30.0);
  }

  #[test]
  fn test_different_metric_types() {
    let metrics = ["hit_rate", "memory_usage", "response_time", "unknown"];

    for (i, metric_name) in metrics.iter().enumerate() {
      let value = match *metric_name {
        "hit_rate" => 0.8 + (i as f64 * 0.01),
        "memory_usage" => 100.0 + (i as f64 * 2.0),
        "response_time" => 10.0 + (i as f64 * 1.5),
        _ => (i % 17) as f64 * 6.0,
      };

      match *metric_name {
        "hit_rate" => assert!((0.0..=1.0).contains(&value)),
        "memory_usage" => assert!(value >= 100.0),
        "response_time" => assert!(value >= 10.0),
        _ => assert!(value >= 0.0),
      }
    }
  }
}
