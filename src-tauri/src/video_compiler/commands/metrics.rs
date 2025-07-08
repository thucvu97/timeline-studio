//! Команды для работы с метриками сервисов

use tauri::State;

use crate::video_compiler::error::Result;
use crate::video_compiler::services::{monitoring::MetricsSummary, METRICS};

use super::state::VideoCompilerState;

// ============ Бизнес-логика (тестируемая) ============

/// Подсчитать активные операции из сводок
pub fn count_active_operations(
  summaries: &[MetricsSummary],
) -> (u64, serde_json::Map<String, serde_json::Value>) {
  let mut active_operations = serde_json::Map::new();
  let mut total_active: u64 = 0;

  for summary in summaries {
    active_operations.insert(
      summary.service_name.clone(),
      serde_json::Value::Number(summary.active_operations.into()),
    );
    total_active += summary.active_operations as u64;
  }

  (total_active, active_operations)
}

/// Подсчитать статистику ошибок
pub fn calculate_error_statistics(summaries: &[MetricsSummary]) -> serde_json::Value {
  let mut error_stats = serde_json::Map::new();
  let mut total_errors = 0;
  let mut total_operations = 0;

  for summary in summaries {
    let service_stats = serde_json::json!({
      "total_errors": summary.total_errors,
      "total_operations": summary.total_operations,
      "error_rate": summary.error_rate,
      "operations_with_errors": summary.operation_metrics.iter()
        .filter(|(_, m)| m.errors > 0)
        .map(|(name, m)| serde_json::json!({
          "operation": name,
          "errors": m.errors,
          "total": m.count,
          "last_error": m.last_error,
        }))
        .collect::<Vec<_>>(),
    });

    error_stats.insert(summary.service_name.clone(), service_stats);
    total_errors += summary.total_errors;
    total_operations += summary.total_operations;
  }

  let overall_error_rate = if total_operations > 0 {
    total_errors as f64 / total_operations as f64
  } else {
    0.0
  };

  serde_json::json!({
    "total_errors": total_errors,
    "total_operations": total_operations,
    "overall_error_rate": overall_error_rate,
    "by_service": error_stats,
  })
}

/// Найти медленные операции
pub fn find_slow_operations(summaries: &[MetricsSummary], limit: usize) -> Vec<serde_json::Value> {
  let mut all_operations = Vec::new();

  for summary in summaries {
    for (op_name, metrics) in &summary.operation_metrics {
      all_operations.push(serde_json::json!({
        "service": summary.service_name.clone(),
        "operation": op_name,
        "avg_duration_ms": metrics.avg_duration_ms,
        "max_duration_ms": metrics.max_duration_ms,
        "count": metrics.count,
      }));
    }
  }

  // Сортируем по средней длительности
  all_operations.sort_by(|a, b| {
    let a_duration = a["avg_duration_ms"].as_f64().unwrap_or(0.0);
    let b_duration = b["avg_duration_ms"].as_f64().unwrap_or(0.0);
    b_duration.partial_cmp(&a_duration).unwrap()
  });

  all_operations.truncate(limit);
  all_operations
}

/// Собрать метрики сервисного контейнера
pub fn collect_service_container_metrics(
  summaries: &[(&str, MetricsSummary)],
) -> serde_json::Value {
  let mut result = serde_json::Map::new();

  for (name, summary) in summaries {
    result.insert(
      name.to_string(),
      serde_json::json!({
        "total_operations": summary.total_operations,
        "active_operations": summary.active_operations,
        "total_errors": summary.total_errors,
        "error_rate": summary.error_rate,
      }),
    );
  }

  result.insert(
    "message".to_string(),
    serde_json::Value::String(
      "All service metrics containers are accessible and functioning".to_string(),
    ),
  );

  serde_json::Value::Object(result)
}

// ============ Tauri команды (тонкие обёртки) ============

/// Получить сводку метрик для всех сервисов
#[tauri::command]
pub async fn get_all_metrics_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<MetricsSummary>> {
  log::debug!("Получение метрик всех сервисов");
  let summaries = METRICS.get_all_summaries().await;
  Ok(summaries)
}

/// Получить метрики конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_original(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Option<MetricsSummary>> {
  log::debug!("Получение метрик сервиса: {service_name}");

  if let Some(metrics) = METRICS.get_service_metrics(&service_name).await {
    Ok(Some(metrics.get_summary().await))
  } else {
    Ok(None)
  }
}

/// Экспортировать метрики в формате Prometheus
#[tauri::command]
pub async fn export_metrics_prometheus_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  log::debug!("Экспорт метрик в формате Prometheus");
  let prometheus_data = METRICS.export_prometheus().await;
  Ok(prometheus_data)
}

/// Сбросить метрики для сервиса
#[tauri::command]
pub async fn reset_service_metrics_original(
  service_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  log::info!("Сброс метрик для сервиса: {service_name}");

  if let Some(metrics) = METRICS.get_service_metrics(&service_name).await {
    metrics.reset().await;
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Сервис '{service_name}' не найден"
      )),
    )
  }
}

/// Получить текущее количество активных операций
#[tauri::command]
pub async fn get_active_operations_count_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let summaries = METRICS.get_all_summaries().await;
  let (total_active, active_operations) = count_active_operations(&summaries);

  Ok(serde_json::json!({
    "total": total_active,
    "by_service": active_operations,
  }))
}

/// Получить статистику ошибок
#[tauri::command]
pub async fn get_error_statistics_original(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let summaries = METRICS.get_all_summaries().await;
  Ok(calculate_error_statistics(&summaries))
}

/// Получить топ медленных операций
#[tauri::command]
pub async fn get_slow_operations_original(
  limit: Option<usize>,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<serde_json::Value>> {
  let limit = limit.unwrap_or(10);
  let summaries = METRICS.get_all_summaries().await;
  Ok(find_slow_operations(&summaries, limit))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::services::{monitoring::OperationMetrics, METRICS};
  use std::collections::HashMap;

  fn create_test_summaries() -> Vec<MetricsSummary> {
    vec![
      MetricsSummary {
        service_name: "test-service-1".to_string(),
        uptime_seconds: 3600,
        total_operations: 100,
        active_operations: 5,
        total_errors: 10,
        operations_per_second: 0.027,
        error_rate: 0.1,
        operation_metrics: {
          let mut map = HashMap::new();
          map.insert(
            "slow-op".to_string(),
            OperationMetrics {
              count: 50,
              errors: 5,
              total_duration_ms: 5000,
              min_duration_ms: 50,
              avg_duration_ms: 100.0,
              max_duration_ms: 200,
              last_error: None,
              last_operation_time: None,
            },
          );
          map.insert(
            "fast-op".to_string(),
            OperationMetrics {
              count: 50,
              errors: 5,
              total_duration_ms: 500,
              min_duration_ms: 5,
              avg_duration_ms: 10.0,
              max_duration_ms: 20,
              last_error: Some("Test error".to_string()),
              last_operation_time: None,
            },
          );
          map
        },
      },
      MetricsSummary {
        service_name: "test-service-2".to_string(),
        uptime_seconds: 3600,
        total_operations: 200,
        active_operations: 10,
        total_errors: 5,
        operations_per_second: 0.056,
        error_rate: 0.025,
        operation_metrics: {
          let mut map = HashMap::new();
          map.insert(
            "medium-op".to_string(),
            OperationMetrics {
              count: 200,
              errors: 5,
              total_duration_ms: 10000,
              min_duration_ms: 25,
              avg_duration_ms: 50.0,
              max_duration_ms: 100,
              last_error: None,
              last_operation_time: None,
            },
          );
          map
        },
      },
    ]
  }

  #[test]
  fn test_count_active_operations() {
    let summaries = create_test_summaries();
    let (total, by_service) = count_active_operations(&summaries);

    assert_eq!(total, 15); // 5 + 10
    assert_eq!(by_service.len(), 2);
    assert_eq!(by_service["test-service-1"], 5);
    assert_eq!(by_service["test-service-2"], 10);
  }

  #[test]
  fn test_calculate_error_statistics() {
    let summaries = create_test_summaries();
    let stats = calculate_error_statistics(&summaries);

    assert_eq!(stats["total_errors"], 15); // 10 + 5
    assert_eq!(stats["total_operations"], 300); // 100 + 200
    assert!(stats["overall_error_rate"].as_f64().unwrap() > 0.04);
    assert!(stats["overall_error_rate"].as_f64().unwrap() < 0.06);

    let by_service = stats["by_service"].as_object().unwrap();
    assert_eq!(by_service.len(), 2);

    let service1_stats = &by_service["test-service-1"];
    assert_eq!(service1_stats["total_errors"], 10);
    assert_eq!(service1_stats["error_rate"], 0.1);

    let ops_with_errors = service1_stats["operations_with_errors"].as_array().unwrap();
    assert_eq!(ops_with_errors.len(), 2);
  }

  #[test]
  fn test_find_slow_operations() {
    let summaries = create_test_summaries();
    let slow_ops = find_slow_operations(&summaries, 2);

    assert_eq!(slow_ops.len(), 2);

    // Первая операция должна быть самой медленной (slow-op с avg 100ms)
    assert_eq!(slow_ops[0]["operation"], "slow-op");
    assert_eq!(slow_ops[0]["avg_duration_ms"], 100.0);

    // Вторая операция - medium-op с avg 50ms
    assert_eq!(slow_ops[1]["operation"], "medium-op");
    assert_eq!(slow_ops[1]["avg_duration_ms"], 50.0);
  }

  #[test]
  fn test_find_slow_operations_limit() {
    let summaries = create_test_summaries();
    let slow_ops = find_slow_operations(&summaries, 1);

    assert_eq!(slow_ops.len(), 1);
    assert_eq!(slow_ops[0]["operation"], "slow-op");
  }

  #[test]
  fn test_collect_service_container_metrics() {
    let summaries = vec![
      (
        "render_service",
        MetricsSummary {
          service_name: "render".to_string(),
          uptime_seconds: 3600,
          total_operations: 100,
          active_operations: 2,
          total_errors: 5,
          operations_per_second: 0.028,
          error_rate: 0.05,
          operation_metrics: HashMap::new(),
        },
      ),
      (
        "cache_service",
        MetricsSummary {
          service_name: "cache".to_string(),
          uptime_seconds: 3600,
          total_operations: 200,
          active_operations: 0,
          total_errors: 2,
          operations_per_second: 0.056,
          error_rate: 0.01,
          operation_metrics: HashMap::new(),
        },
      ),
    ];

    let result = collect_service_container_metrics(&summaries);
    let obj = result.as_object().unwrap();

    assert!(obj.contains_key("render_service"));
    assert!(obj.contains_key("cache_service"));
    assert!(obj.contains_key("message"));

    let render = &obj["render_service"];
    assert_eq!(render["total_operations"], 100);
    assert_eq!(render["active_operations"], 2);
    assert_eq!(render["total_errors"], 5);
    assert_eq!(render["error_rate"], 0.05);
  }

  #[tokio::test]
  async fn test_metrics_commands() {
    // Регистрируем тестовый сервис
    let test_metrics = METRICS.register_service("test-service".to_string()).await;

    // Выполняем операцию
    let tracker = test_metrics.start_operation("test-op");
    tracker.complete().await;

    // Тестируем получение всех метрик
    let summaries = METRICS.get_all_summaries().await;
    assert!(!summaries.is_empty());

    // Тестируем экспорт Prometheus
    let prometheus = METRICS.export_prometheus().await;
    assert!(prometheus.contains("test_service"));
  }
}

/// Получить прямой доступ к метрикам контейнера сервисов
#[tauri::command]
pub async fn get_service_container_metrics_original(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Используем поля ServiceMetricsContainer для доступа к метрикам сервисов
  let metrics_container = &state.services.metrics;

  // Получаем сводки от каждого сервиса
  let summaries = vec![
    (
      "render_service",
      metrics_container.render.get_summary().await,
    ),
    ("cache_service", metrics_container.cache.get_summary().await),
    ("gpu_service", metrics_container.gpu.get_summary().await),
    (
      "preview_service",
      metrics_container.preview.get_summary().await,
    ),
    (
      "project_service",
      metrics_container.project.get_summary().await,
    ),
    (
      "ffmpeg_service",
      metrics_container.ffmpeg.get_summary().await,
    ),
  ];

  Ok(collect_service_container_metrics(&summaries))
}
