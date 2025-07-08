//! Monitoring commands - команды для работы с метриками и мониторингом

use crate::video_compiler::services::monitoring::MetricsSummary;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

// ============ Бизнес-логика (тестируемая) ============

/// Валидация имени сервиса
pub fn validate_service_name(service_name: &str) -> Result<(), String> {
  match service_name {
    "render" | "cache" | "gpu" | "preview" | "project" | "ffmpeg" => Ok(()),
    _ => Err(format!("Unknown service: {service_name}")),
  }
}

/// Получить список всех доступных сервисов
pub fn get_available_services() -> Vec<&'static str> {
  vec!["render", "cache", "gpu", "preview", "project", "ffmpeg"]
}

// ============ Tauri команды (тонкие обёртки) ============

/// Получить сводку метрик для конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_summary(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<MetricsSummary, String> {
  validate_service_name(&service_name)?;

  // Получаем метрики нужного сервиса
  let metrics = match service_name.as_str() {
    "render" => &state.services.metrics.render,
    "cache" => &state.services.metrics.cache,
    "gpu" => &state.services.metrics.gpu,
    "preview" => &state.services.metrics.preview,
    "project" => &state.services.metrics.project,
    "ffmpeg" => &state.services.metrics.ffmpeg,
    _ => unreachable!(), // validate_service_name уже проверил
  };

  Ok(metrics.get_summary().await)
}

/// Сбросить метрики для конкретного сервиса (детальная версия)
#[tauri::command]
pub async fn reset_service_metrics_detailed(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<(), String> {
  validate_service_name(&service_name)?;

  // Получаем метрики нужного сервиса
  let metrics = match service_name.as_str() {
    "render" => &state.services.metrics.render,
    "cache" => &state.services.metrics.cache,
    "gpu" => &state.services.metrics.gpu,
    "preview" => &state.services.metrics.preview,
    "project" => &state.services.metrics.project,
    "ffmpeg" => &state.services.metrics.ffmpeg,
    _ => unreachable!(), // validate_service_name уже проверил
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

/// Форматировать метрики сервиса в формате Prometheus
pub fn format_service_metrics_prometheus(name: &str, summary: &MetricsSummary) -> String {
  let mut output = String::new();

  // Формат Prometheus
  output.push_str(&format!(
    "# HELP timeline_studio_{name}_operations_total Total number of operations\n"
  ));
  output.push_str(&format!(
    "# TYPE timeline_studio_{name}_operations_total counter\n"
  ));
  output.push_str(&format!(
    "timeline_studio_{}_operations_total {}\n",
    name, summary.total_operations
  ));

  output.push_str(&format!(
    "# HELP timeline_studio_{name}_errors_total Total number of errors\n"
  ));
  output.push_str(&format!(
    "# TYPE timeline_studio_{name}_errors_total counter\n"
  ));
  output.push_str(&format!(
    "timeline_studio_{}_errors_total {}\n",
    name, summary.total_errors
  ));

  output.push_str(&format!(
    "# HELP timeline_studio_{name}_active_operations Number of active operations\n"
  ));
  output.push_str(&format!(
    "# TYPE timeline_studio_{name}_active_operations gauge\n"
  ));
  output.push_str(&format!(
    "timeline_studio_{}_active_operations {}\n",
    name, summary.active_operations
  ));

  output.push_str(&format!(
    "# HELP timeline_studio_{name}_operations_per_second Operations per second\n"
  ));
  output.push_str(&format!(
    "# TYPE timeline_studio_{name}_operations_per_second gauge\n"
  ));
  output.push_str(&format!(
    "timeline_studio_{}_operations_per_second {:.2}\n",
    name, summary.operations_per_second
  ));

  output.push_str(&format!(
    "# HELP timeline_studio_{name}_error_rate Error rate\n"
  ));
  output.push_str(&format!("# TYPE timeline_studio_{name}_error_rate gauge\n"));
  output.push_str(&format!(
    "timeline_studio_{}_error_rate {:.4}\n",
    name, summary.error_rate
  ));

  output.push('\n');
  output
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
    output.push_str(&format_service_metrics_prometheus(name, &summary));
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

/// Оценить здоровье сервиса на основе метрик
pub fn evaluate_service_health(name: &str, summary: &MetricsSummary) -> ServiceHealth {
  // Считаем сервис здоровым если:
  // - Процент ошибок < 5%
  // - Нет активных операций, которые выполняются слишком долго
  let error_rate = summary.error_rate * 100.0;
  let is_healthy = error_rate < 5.0 && summary.active_operations < 100;

  ServiceHealth {
    service_name: name.to_string(),
    is_healthy,
    error_rate,
    avg_response_time: summary.operations_per_second,
    last_error: None, // В реальной реализации можно добавить отслеживание последней ошибки
  }
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
    health_checks.push(evaluate_service_health(name, &summary));
  }

  Ok(health_checks)
}

/// Форматировать данные производительности сервиса
pub fn format_service_performance_data(summary: &MetricsSummary) -> serde_json::Value {
  serde_json::json!({
      "total_operations": summary.total_operations,
      "total_errors": summary.total_errors,
      "active_operations": summary.active_operations,
      "operations_per_second": summary.operations_per_second,
      "error_rate": summary.error_rate * 100.0,
      "uptime_seconds": summary.uptime_seconds,
      "operation_details": summary.operation_metrics,
  })
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
    perf_data.insert(name.to_string(), format_service_performance_data(&summary));
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

/// Получить метрики конкретного сервиса из реестра
#[tauri::command]
pub async fn get_registry_service_metrics(
  service_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<MetricsSummary>, String> {
  // В реальной реализации здесь бы использовался глобальный MetricsRegistry
  // Пока используем прямой доступ к метрикам из состояния
  match service_name.as_str() {
    "render" => Ok(Some(state.services.metrics.render.get_summary().await)),
    "cache" => Ok(Some(state.services.metrics.cache.get_summary().await)),
    "gpu" => Ok(Some(state.services.metrics.gpu.get_summary().await)),
    "preview" => Ok(Some(state.services.metrics.preview.get_summary().await)),
    "project" => Ok(Some(state.services.metrics.project.get_summary().await)),
    "ffmpeg" => Ok(Some(state.services.metrics.ffmpeg.get_summary().await)),
    _ => Ok(None),
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::services::monitoring::OperationMetrics;
  use std::collections::HashMap;

  fn create_test_metrics_summary(service_name: &str) -> MetricsSummary {
    MetricsSummary {
      service_name: service_name.to_string(),
      uptime_seconds: 3600,
      total_operations: 100,
      total_errors: 3,
      active_operations: 5,
      operations_per_second: 10.5,
      error_rate: 0.03,
      operation_metrics: HashMap::new(),
    }
  }

  #[test]
  fn test_validate_service_name_valid() {
    let valid_services = vec!["render", "cache", "gpu", "preview", "project", "ffmpeg"];

    for service in valid_services {
      assert!(validate_service_name(service).is_ok());
    }
  }

  #[test]
  fn test_validate_service_name_invalid() {
    let invalid_services = vec!["unknown", "invalid", "test", ""];

    for service in invalid_services {
      assert!(validate_service_name(service).is_err());
      assert!(validate_service_name(service)
        .unwrap_err()
        .contains("Unknown service"));
    }
  }

  #[test]
  fn test_get_available_services() {
    let services = get_available_services();

    assert_eq!(services.len(), 6);
    assert!(services.contains(&"render"));
    assert!(services.contains(&"cache"));
    assert!(services.contains(&"gpu"));
    assert!(services.contains(&"preview"));
    assert!(services.contains(&"project"));
    assert!(services.contains(&"ffmpeg"));
  }

  #[test]
  fn test_format_service_metrics_prometheus() {
    let summary = create_test_metrics_summary("test_service");
    let output = format_service_metrics_prometheus("test", &summary);

    // Check that all expected metric types are present
    assert!(output.contains("timeline_studio_test_operations_total"));
    assert!(output.contains("timeline_studio_test_errors_total"));
    assert!(output.contains("timeline_studio_test_active_operations"));
    assert!(output.contains("timeline_studio_test_operations_per_second"));
    assert!(output.contains("timeline_studio_test_error_rate"));

    // Check values
    assert!(output.contains("100\n")); // total_operations
    assert!(output.contains("3\n")); // total_errors
    assert!(output.contains("5\n")); // active_operations
    assert!(output.contains("10.50\n")); // operations_per_second
    assert!(output.contains("0.0300\n")); // error_rate

    // Check format headers
    assert!(output.contains("# HELP"));
    assert!(output.contains("# TYPE"));
    assert!(output.contains("counter"));
    assert!(output.contains("gauge"));
  }

  #[test]
  fn test_evaluate_service_health_healthy() {
    let summary = MetricsSummary {
      service_name: "test_service".to_string(),
      uptime_seconds: 7200,
      total_operations: 1000,
      total_errors: 20,
      active_operations: 10, // < 100
      operations_per_second: 25.5,
      error_rate: 0.02, // 2% < 5%
      operation_metrics: HashMap::new(),
    };

    let health = evaluate_service_health("test", &summary);

    assert_eq!(health.service_name, "test");
    assert!(health.is_healthy);
    assert_eq!(health.error_rate, 2.0); // Converted to percentage
    assert_eq!(health.avg_response_time, 25.5);
    assert!(health.last_error.is_none());
  }

  #[test]
  fn test_evaluate_service_health_unhealthy_high_error_rate() {
    let summary = MetricsSummary {
      service_name: "test_service".to_string(),
      uptime_seconds: 3600,
      total_operations: 1000,
      total_errors: 60,
      active_operations: 5,
      operations_per_second: 15.0,
      error_rate: 0.06, // 6% > 5%
      operation_metrics: HashMap::new(),
    };

    let health = evaluate_service_health("test", &summary);

    assert_eq!(health.service_name, "test");
    assert!(!health.is_healthy); // Unhealthy due to high error rate
    assert_eq!(health.error_rate, 6.0);
  }

  #[test]
  fn test_evaluate_service_health_unhealthy_too_many_active_ops() {
    let summary = MetricsSummary {
      service_name: "test_service".to_string(),
      uptime_seconds: 1800,
      total_operations: 2000,
      total_errors: 10,
      active_operations: 150, // > 100
      operations_per_second: 30.0,
      error_rate: 0.005, // 0.5% < 5%
      operation_metrics: HashMap::new(),
    };

    let health = evaluate_service_health("test", &summary);

    assert_eq!(health.service_name, "test");
    assert!(!health.is_healthy); // Unhealthy due to too many active operations
    assert_eq!(health.error_rate, 0.5);
  }

  #[test]
  fn test_format_service_performance_data() {
    let mut operation_metrics = HashMap::new();
    operation_metrics.insert(
      "test_operation".to_string(),
      OperationMetrics {
        count: 50,
        errors: 2,
        total_duration_ms: 1000,
        avg_duration_ms: 20.0,
        max_duration_ms: 50,
        min_duration_ms: 10,
        last_operation_time: Some(std::time::SystemTime::now()),
        last_error: Some("Test error".to_string()),
      },
    );

    let summary = MetricsSummary {
      service_name: "test_service".to_string(),
      uptime_seconds: 14400,
      total_operations: 500,
      total_errors: 25,
      active_operations: 15,
      operations_per_second: 12.3,
      error_rate: 0.05,
      operation_metrics,
    };

    let performance_data = format_service_performance_data(&summary);

    assert_eq!(performance_data["total_operations"], 500);
    assert_eq!(performance_data["total_errors"], 25);
    assert_eq!(performance_data["active_operations"], 15);
    assert_eq!(performance_data["operations_per_second"], 12.3);
    assert_eq!(performance_data["error_rate"], 5.0); // Converted to percentage
    assert_eq!(performance_data["uptime_seconds"], 14400);

    // Check operation details
    assert!(performance_data["operation_details"].is_object());
    let operation_details = performance_data["operation_details"].as_object().unwrap();
    assert!(operation_details.contains_key("test_operation"));
  }

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

    // Test deserialization
    let deserialized: ServiceHealth = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.service_name, health.service_name);
    assert_eq!(deserialized.is_healthy, health.is_healthy);
    assert_eq!(deserialized.error_rate, health.error_rate);
    assert_eq!(deserialized.avg_response_time, health.avg_response_time);
  }

  #[test]
  fn test_prometheus_format_structure() {
    let summary = create_test_metrics_summary("cache");
    let output = format_service_metrics_prometheus("cache", &summary);

    let lines: Vec<&str> = output.lines().collect();

    // Should have HELP and TYPE lines for each metric, plus value lines
    // 5 metrics * 3 lines each (HELP, TYPE, value) + empty line = 16 lines
    assert!(lines.len() >= 15);

    // Count HELP lines
    let help_lines: Vec<&&str> = lines
      .iter()
      .filter(|line| line.starts_with("# HELP"))
      .collect();
    assert_eq!(help_lines.len(), 5);

    // Count TYPE lines
    let type_lines: Vec<&&str> = lines
      .iter()
      .filter(|line| line.starts_with("# TYPE"))
      .collect();
    assert_eq!(type_lines.len(), 5);

    // Check metric name format
    assert!(output.contains("timeline_studio_cache_"));
  }

  #[test]
  fn test_service_name_edge_cases() {
    // Test empty string
    assert!(validate_service_name("").is_err());

    // Test case sensitivity
    assert!(validate_service_name("RENDER").is_err());
    assert!(validate_service_name("Render").is_err());

    // Test whitespace
    assert!(validate_service_name(" render").is_err());
    assert!(validate_service_name("render ").is_err());

    // Test similar but wrong names
    assert!(validate_service_name("renders").is_err());
    assert!(validate_service_name("cached").is_err());
  }

  #[test]
  fn test_health_evaluation_edge_cases() {
    // Test zero operations
    let summary = MetricsSummary {
      service_name: "test".to_string(),
      uptime_seconds: 60,
      total_operations: 0,
      total_errors: 0,
      active_operations: 0,
      operations_per_second: 0.0,
      error_rate: 0.0,
      operation_metrics: HashMap::new(),
    };

    let health = evaluate_service_health("test", &summary);
    assert!(health.is_healthy); // Should be healthy with no operations

    // Test exactly at threshold
    let summary_at_threshold = MetricsSummary {
      service_name: "test".to_string(),
      uptime_seconds: 3600,
      total_operations: 100,
      total_errors: 5,
      active_operations: 100, // Exactly at 100
      operations_per_second: 10.0,
      error_rate: 0.05, // Exactly 5%
      operation_metrics: HashMap::new(),
    };

    let health_at_threshold = evaluate_service_health("test", &summary_at_threshold);
    assert!(!health_at_threshold.is_healthy); // Should be unhealthy at thresholds
  }

  #[test]
  fn test_performance_data_structure() {
    let summary = create_test_metrics_summary("test");
    let perf_data = format_service_performance_data(&summary);

    // Check that all expected fields are present
    let expected_fields = [
      "total_operations",
      "total_errors",
      "active_operations",
      "operations_per_second",
      "error_rate",
      "uptime_seconds",
      "operation_details",
    ];

    for field in expected_fields {
      assert!(perf_data.get(field).is_some(), "Missing field: {}", field);
    }

    // Verify error_rate is converted to percentage
    assert_eq!(perf_data["error_rate"], 3.0); // 0.03 * 100
  }
}
