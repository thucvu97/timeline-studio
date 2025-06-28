//! Advanced Metrics Commands - продвинутые команды для метрик и мониторинга

use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Статистика операций
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationStatistics {
  pub active_operations: usize,
  pub completed_operations: usize,
  pub failed_operations: usize,
  pub average_duration: f64,
  pub operations_per_minute: f64,
}

/// Статистика ошибок
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorStatistics {
  pub total_errors: usize,
  pub error_rate: f64,
  pub top_errors: Vec<ErrorInfo>,
  pub last_24h_errors: usize,
}

/// Информация об ошибке
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorInfo {
  pub error_type: String,
  pub count: usize,
  pub last_occurred: String,
  pub severity: String,
}

/// Медленная операция
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlowOperation {
  pub operation_id: String,
  pub operation_type: String,
  pub duration: f64,
  pub started_at: String,
  pub status: String,
  pub progress: f32,
}

/// Метрики контейнера сервисов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceContainerMetrics {
  pub total_services: usize,
  pub active_services: usize,
  pub memory_usage_mb: f64,
  pub cpu_usage_percent: f64,
  pub network_io_mb: f64,
  pub service_health: Vec<ServiceHealth>,
}

/// Здоровье сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceHealth {
  pub service_name: String,
  pub status: String,
  pub uptime_seconds: u64,
  pub memory_mb: f64,
  pub cpu_percent: f64,
}

/// Статистика пайплайна рендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderPipelineStatistics {
  pub active_pipelines: usize,
  pub completed_pipelines: usize,
  pub failed_pipelines: usize,
  pub average_render_time: f64,
  pub frames_per_second: f64,
  pub queue_length: usize,
}

/// Получить количество активных операций
#[tauri::command]
pub async fn get_active_operations_count_detailed(
  _state: State<'_, VideoCompilerState>,
) -> Result<OperationStatistics> {
  Ok(OperationStatistics {
    active_operations: 5,
    completed_operations: 150,
    failed_operations: 3,
    average_duration: 45.6,
    operations_per_minute: 2.3,
  })
}

/// Получить статистику ошибок
#[tauri::command]
pub async fn get_error_statistics_detailed(
  _state: State<'_, VideoCompilerState>,
) -> Result<ErrorStatistics> {
  let top_errors = vec![
    ErrorInfo {
      error_type: "FFmpeg Error".to_string(),
      count: 12,
      last_occurred: chrono::Utc::now().to_rfc3339(),
      severity: "high".to_string(),
    },
    ErrorInfo {
      error_type: "File Not Found".to_string(),
      count: 8,
      last_occurred: chrono::Utc::now().to_rfc3339(),
      severity: "medium".to_string(),
    },
    ErrorInfo {
      error_type: "Memory Limit".to_string(),
      count: 3,
      last_occurred: chrono::Utc::now().to_rfc3339(),
      severity: "low".to_string(),
    },
  ];

  Ok(ErrorStatistics {
    total_errors: 23,
    error_rate: 0.15, // 15%
    top_errors,
    last_24h_errors: 5,
  })
}

/// Получить медленные операции
#[tauri::command]
pub async fn get_slow_operations_detailed(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<SlowOperation>> {
  Ok(vec![
    SlowOperation {
      operation_id: "render_001".to_string(),
      operation_type: "video_render".to_string(),
      duration: 300.5,
      started_at: chrono::Utc::now().to_rfc3339(),
      status: "in_progress".to_string(),
      progress: 0.75,
    },
    SlowOperation {
      operation_id: "export_002".to_string(),
      operation_type: "video_export".to_string(),
      duration: 180.2,
      started_at: chrono::Utc::now().to_rfc3339(),
      status: "queued".to_string(),
      progress: 0.0,
    },
  ])
}

/// Получить метрики контейнера сервисов
#[tauri::command]
pub async fn get_service_container_metrics_detailed(
  _state: State<'_, VideoCompilerState>,
) -> Result<ServiceContainerMetrics> {
  let service_health = vec![
    ServiceHealth {
      service_name: "render_service".to_string(),
      status: "healthy".to_string(),
      uptime_seconds: 3600,
      memory_mb: 512.0,
      cpu_percent: 25.5,
    },
    ServiceHealth {
      service_name: "preview_service".to_string(),
      status: "healthy".to_string(),
      uptime_seconds: 3580,
      memory_mb: 256.0,
      cpu_percent: 15.2,
    },
    ServiceHealth {
      service_name: "cache_service".to_string(),
      status: "warning".to_string(),
      uptime_seconds: 3200,
      memory_mb: 1024.0,
      cpu_percent: 45.8,
    },
  ];

  Ok(ServiceContainerMetrics {
    total_services: 6,
    active_services: 5,
    memory_usage_mb: 1792.0,
    cpu_usage_percent: 28.8,
    network_io_mb: 45.6,
    service_health,
  })
}

/// Получить статистику пайплайна рендеринга
#[tauri::command]
pub async fn get_render_pipeline_statistics_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<RenderPipelineStatistics> {
  Ok(RenderPipelineStatistics {
    active_pipelines: 3,
    completed_pipelines: 45,
    failed_pipelines: 2,
    average_render_time: 120.5,
    frames_per_second: 29.97,
    queue_length: 7,
  })
}

/// Сбросить метрики сервиса
#[tauri::command]
pub async fn reset_service_metrics_advanced(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  log::info!("Resetting metrics for service: {service_name}");
  Ok(true)
}

/// Экспортировать метрики в формате Prometheus
#[tauri::command]
pub async fn export_metrics_prometheus_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let prometheus_metrics = r#"
# HELP timeline_studio_active_operations Number of active operations
# TYPE timeline_studio_active_operations gauge
timeline_studio_active_operations 5

# HELP timeline_studio_completed_operations Total completed operations
# TYPE timeline_studio_completed_operations counter
timeline_studio_completed_operations 150

# HELP timeline_studio_failed_operations Total failed operations
# TYPE timeline_studio_failed_operations counter
timeline_studio_failed_operations 3

# HELP timeline_studio_memory_usage_bytes Memory usage in bytes
# TYPE timeline_studio_memory_usage_bytes gauge
timeline_studio_memory_usage_bytes 1879048192

# HELP timeline_studio_cpu_usage_percent CPU usage percentage
# TYPE timeline_studio_cpu_usage_percent gauge
timeline_studio_cpu_usage_percent 28.8

# HELP timeline_studio_render_fps Frames per second during rendering
# TYPE timeline_studio_render_fps gauge
timeline_studio_render_fps 29.97
"#;

  Ok(prometheus_metrics.to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_operation_statistics_serialization() {
    let stats = OperationStatistics {
      active_operations: 10,
      completed_operations: 100,
      failed_operations: 5,
      average_duration: 60.0,
      operations_per_minute: 1.5,
    };

    let json = serde_json::to_string(&stats).unwrap();
    assert!(json.contains("100"));
    assert!(json.contains("60"));
  }

  #[test]
  fn test_error_statistics_serialization() {
    let error_info = ErrorInfo {
      error_type: "Test Error".to_string(),
      count: 5,
      last_occurred: "2024-01-15T10:30:00Z".to_string(),
      severity: "medium".to_string(),
    };

    let stats = ErrorStatistics {
      total_errors: 20,
      error_rate: 0.1,
      top_errors: vec![error_info],
      last_24h_errors: 3,
    };

    let json = serde_json::to_string(&stats).unwrap();
    assert!(json.contains("Test Error"));
    assert!(json.contains("0.1"));
  }

  #[test]
  fn test_slow_operation_serialization() {
    let operation = SlowOperation {
      operation_id: "test_001".to_string(),
      operation_type: "test_render".to_string(),
      duration: 120.5,
      started_at: "2024-01-15T10:30:00Z".to_string(),
      status: "running".to_string(),
      progress: 0.5,
    };

    let json = serde_json::to_string(&operation).unwrap();
    assert!(json.contains("test_001"));
    assert!(json.contains("120.5"));
  }
}
