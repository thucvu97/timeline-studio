//! Monitoring commands - команды для работы с метриками и мониторингом

use crate::video_compiler::services::monitoring::MetricsSummary;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

/// Получить сводку метрик для конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_summary(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<MetricsSummary, String> {
  // Получаем метрики нужного сервиса
  let metrics = match service_name.as_str() {
    "render" => &state.services.metrics.render,
    "cache" => &state.services.metrics.cache,
    "gpu" => &state.services.metrics.gpu,
    "preview" => &state.services.metrics.preview,
    "project" => &state.services.metrics.project,
    "ffmpeg" => &state.services.metrics.ffmpeg,
    _ => return Err(format!("Unknown service: {}", service_name)),
  };

  Ok(metrics.get_summary().await)
}

/// Сбросить метрики для конкретного сервиса (детальная версия)
#[tauri::command]
pub async fn reset_service_metrics_detailed(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<(), String> {
  // Получаем метрики нужного сервиса
  let metrics = match service_name.as_str() {
    "render" => &state.services.metrics.render,
    "cache" => &state.services.metrics.cache,
    "gpu" => &state.services.metrics.gpu,
    "preview" => &state.services.metrics.preview,
    "project" => &state.services.metrics.project,
    "ffmpeg" => &state.services.metrics.ffmpeg,
    _ => return Err(format!("Unknown service: {}", service_name)),
  };

  metrics.reset().await;
  Ok(())
}

/// Получить сводку метрик для всех сервисов
#[tauri::command]
pub async fn get_all_metrics_summaries(
  state: State<'_, VideoCompilerState>,
) -> Result<HashMap<String, MetricsSummary>, String> {
  let mut summaries = HashMap::new();

  summaries.insert(
    "render".to_string(),
    state.services.metrics.render.get_summary().await,
  );
  summaries.insert(
    "cache".to_string(),
    state.services.metrics.cache.get_summary().await,
  );
  summaries.insert(
    "gpu".to_string(),
    state.services.metrics.gpu.get_summary().await,
  );
  summaries.insert(
    "preview".to_string(),
    state.services.metrics.preview.get_summary().await,
  );
  summaries.insert(
    "project".to_string(),
    state.services.metrics.project.get_summary().await,
  );
  summaries.insert(
    "ffmpeg".to_string(),
    state.services.metrics.ffmpeg.get_summary().await,
  );

  Ok(summaries)
}

/// Экспортировать метрики в формате Prometheus (детальная версия)
#[tauri::command]
pub async fn export_metrics_prometheus_detailed(
  state: State<'_, VideoCompilerState>,
) -> Result<String, String> {
  let mut output = String::new();

  // Экспортируем метрики для каждого сервиса
  let services = vec![
    ("render", &state.services.metrics.render),
    ("cache", &state.services.metrics.cache),
    ("gpu", &state.services.metrics.gpu),
    ("preview", &state.services.metrics.preview),
    ("project", &state.services.metrics.project),
    ("ffmpeg", &state.services.metrics.ffmpeg),
  ];

  for (name, metrics) in services {
    let summary = metrics.get_summary().await;

    // Формат Prometheus
    output.push_str(&format!(
      "# HELP timeline_studio_{}_operations_total Total number of operations\n",
      name
    ));
    output.push_str(&format!(
      "# TYPE timeline_studio_{}_operations_total counter\n",
      name
    ));
    output.push_str(&format!(
      "timeline_studio_{}_operations_total {}\n",
      name, summary.total_operations
    ));

    output.push_str(&format!(
      "# HELP timeline_studio_{}_errors_total Total number of errors\n",
      name
    ));
    output.push_str(&format!(
      "# TYPE timeline_studio_{}_errors_total counter\n",
      name
    ));
    output.push_str(&format!(
      "timeline_studio_{}_errors_total {}\n",
      name, summary.total_errors
    ));

    output.push_str(&format!(
      "# HELP timeline_studio_{}_active_operations Number of active operations\n",
      name
    ));
    output.push_str(&format!(
      "# TYPE timeline_studio_{}_active_operations gauge\n",
      name
    ));
    output.push_str(&format!(
      "timeline_studio_{}_active_operations {}\n",
      name, summary.active_operations
    ));

    output.push_str(&format!(
      "# HELP timeline_studio_{}_operations_per_second Operations per second\n",
      name
    ));
    output.push_str(&format!(
      "# TYPE timeline_studio_{}_operations_per_second gauge\n",
      name
    ));
    output.push_str(&format!(
      "timeline_studio_{}_operations_per_second {:.2}\n",
      name, summary.operations_per_second
    ));

    output.push_str(&format!(
      "# HELP timeline_studio_{}_error_rate Error rate\n",
      name
    ));
    output.push_str(&format!(
      "# TYPE timeline_studio_{}_error_rate gauge\n",
      name
    ));
    output.push_str(&format!(
      "timeline_studio_{}_error_rate {:.4}\n",
      name, summary.error_rate
    ));

    output.push_str("\n");
  }

  Ok(output)
}

/// Информация о здоровье сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceHealth {
  pub service_name: String,
  pub is_healthy: bool,
  pub error_rate: f64,
  pub avg_response_time: f64,
  pub last_error: Option<String>,
}

/// Проверить здоровье всех сервисов
#[tauri::command]
pub async fn check_services_health(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ServiceHealth>, String> {
  let mut health_checks = Vec::new();

  let services = vec![
    ("render", &state.services.metrics.render),
    ("cache", &state.services.metrics.cache),
    ("gpu", &state.services.metrics.gpu),
    ("preview", &state.services.metrics.preview),
    ("project", &state.services.metrics.project),
    ("ffmpeg", &state.services.metrics.ffmpeg),
  ];

  for (name, metrics) in services {
    let summary = metrics.get_summary().await;

    // Считаем сервис здоровым если:
    // - Процент ошибок < 5%
    // - Нет активных операций, которые выполняются слишком долго
    let error_rate = summary.error_rate * 100.0;

    let is_healthy = error_rate < 5.0 && summary.active_operations < 100;

    health_checks.push(ServiceHealth {
      service_name: name.to_string(),
      is_healthy,
      error_rate,
      avg_response_time: summary.operations_per_second,
      last_error: None, // В реальной реализации можно добавить отслеживание последней ошибки
    });
  }

  Ok(health_checks)
}

/// Получить детальные метрики производительности
#[tauri::command]
pub async fn get_performance_metrics(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value, String> {
  let mut perf_data = serde_json::Map::new();

  // Собираем метрики для каждого сервиса
  let services = vec![
    ("render", &state.services.metrics.render),
    ("cache", &state.services.metrics.cache),
    ("gpu", &state.services.metrics.gpu),
    ("preview", &state.services.metrics.preview),
    ("project", &state.services.metrics.project),
    ("ffmpeg", &state.services.metrics.ffmpeg),
  ];

  for (name, metrics) in services {
    let summary = metrics.get_summary().await;

    let service_data = serde_json::json!({
        "total_operations": summary.total_operations,
        "total_errors": summary.total_errors,
        "active_operations": summary.active_operations,
        "operations_per_second": summary.operations_per_second,
        "error_rate": summary.error_rate * 100.0,
        "uptime_seconds": summary.uptime_seconds,
        "operation_details": summary.operation_metrics,
    });

    perf_data.insert(name.to_string(), service_data);
  }

  Ok(serde_json::Value::Object(perf_data))
}

/// Сбросить все метрики
#[tauri::command]
pub async fn reset_all_metrics(state: State<'_, VideoCompilerState>) -> Result<(), String> {
  state.services.metrics.render.reset().await;
  state.services.metrics.cache.reset().await;
  state.services.metrics.gpu.reset().await;
  state.services.metrics.preview.reset().await;
  state.services.metrics.project.reset().await;
  state.services.metrics.ffmpeg.reset().await;

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_service_health_serialization() {
    let health = ServiceHealth {
      service_name: "test".to_string(),
      is_healthy: true,
      error_rate: 0.5,
      avg_response_time: 0.1,
      last_error: None,
    };

    let json = serde_json::to_string(&health).unwrap();
    assert!(json.contains("test"));
    assert!(json.contains("true"));
  }
}
