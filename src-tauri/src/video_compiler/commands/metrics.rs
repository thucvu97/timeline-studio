//! Команды для работы с метриками сервисов

use tauri::State;

use crate::video_compiler::error::Result;
use crate::video_compiler::services::{monitoring::MetricsSummary, METRICS};

use super::state::VideoCompilerState;

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

  let mut active_operations = serde_json::Map::new();
  let mut total_active = 0;

  for summary in summaries {
    active_operations.insert(
      summary.service_name.clone(),
      serde_json::Value::Number(summary.active_operations.into()),
    );
    total_active += summary.active_operations;
  }

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

  Ok(serde_json::json!({
    "total_errors": total_errors,
    "total_operations": total_operations,
    "overall_error_rate": overall_error_rate,
    "by_service": error_stats,
  }))
}

/// Получить топ медленных операций
#[tauri::command]
pub async fn get_slow_operations_original(
  limit: Option<usize>,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<serde_json::Value>> {
  let limit = limit.unwrap_or(10);
  let summaries = METRICS.get_all_summaries().await;

  let mut all_operations = Vec::new();

  for summary in summaries {
    for (op_name, metrics) in summary.operation_metrics {
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
  Ok(all_operations)
}

#[cfg(test)]
mod tests {
  use crate::video_compiler::services::METRICS;

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
  let render_summary = metrics_container.render.get_summary().await;
  let cache_summary = metrics_container.cache.get_summary().await;
  let gpu_summary = metrics_container.gpu.get_summary().await;
  let preview_summary = metrics_container.preview.get_summary().await;
  let project_summary = metrics_container.project.get_summary().await;
  let ffmpeg_summary = metrics_container.ffmpeg.get_summary().await;

  Ok(serde_json::json!({
    "render_service": {
      "total_operations": render_summary.total_operations,
      "active_operations": render_summary.active_operations,
      "total_errors": render_summary.total_errors,
      "error_rate": render_summary.error_rate,
    },
    "cache_service": {
      "total_operations": cache_summary.total_operations,
      "active_operations": cache_summary.active_operations,
      "total_errors": cache_summary.total_errors,
      "error_rate": cache_summary.error_rate,
    },
    "gpu_service": {
      "total_operations": gpu_summary.total_operations,
      "active_operations": gpu_summary.active_operations,
      "total_errors": gpu_summary.total_errors,
      "error_rate": gpu_summary.error_rate,
    },
    "preview_service": {
      "total_operations": preview_summary.total_operations,
      "active_operations": preview_summary.active_operations,
      "total_errors": preview_summary.total_errors,
      "error_rate": preview_summary.error_rate,
    },
    "project_service": {
      "total_operations": project_summary.total_operations,
      "active_operations": project_summary.active_operations,
      "total_errors": project_summary.total_errors,
      "error_rate": project_summary.error_rate,
    },
    "ffmpeg_service": {
      "total_operations": ffmpeg_summary.total_operations,
      "active_operations": ffmpeg_summary.active_operations,
      "total_errors": ffmpeg_summary.total_errors,
      "error_rate": ffmpeg_summary.error_rate,
    },
    "message": "All service metrics containers are accessible and functioning"
  }))
}
