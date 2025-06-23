//! Service Container Commands - команды для работы с ServiceContainer и MetricsRegistry

use crate::video_compiler::error::Result;
use crate::video_compiler::services::monitoring::MetricsRegistry;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Информация о проектном сервисе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectServiceInfo {
  pub available: bool,
  pub service_type: String,
  pub status: String,
  pub error: Option<String>,
}

/// Получить информацию о проектном сервисе
#[tauri::command]
pub async fn get_project_service_info_command(
  _state: State<'_, VideoCompilerState>,
) -> Result<ProjectServiceInfo> {
  // Создаем заглушку для ServiceContainer с демо параметрами
  let cache_dir = std::env::temp_dir();
  match crate::video_compiler::services::ServiceContainer::new("ffmpeg".to_string(), cache_dir, 4)
    .await
  {
    Ok(container) => match container.get_project_service() {
      Some(_service) => Ok(ProjectServiceInfo {
        available: true,
        service_type: "ProjectService".to_string(),
        status: "active".to_string(),
        error: None,
      }),
      None => Ok(ProjectServiceInfo {
        available: false,
        service_type: "ProjectService".to_string(),
        status: "unavailable".to_string(),
        error: Some("Project service not initialized".to_string()),
      }),
    },
    Err(e) => Ok(ProjectServiceInfo {
      available: false,
      service_type: "ProjectService".to_string(),
      status: "error".to_string(),
      error: Some(e.to_string()),
    }),
  }
}

/// Параметры для получения метрик сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetServiceMetricsParams {
  pub service_name: String,
}

/// Метрики сервиса
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceMetricsInfo {
  pub service_name: String,
  pub metrics_available: bool,
  pub request_count: u64,
  pub error_count: u64,
  pub average_response_time: f64,
  pub status: String,
}

/// Получить метрики конкретного сервиса
#[tauri::command]
pub async fn get_service_metrics_detailed(
  params: GetServiceMetricsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ServiceMetricsInfo> {
  // Создаем заглушку для MetricsRegistry
  let registry = MetricsRegistry::new();

  match registry.get_service_metrics(&params.service_name).await {
    Some(_metrics) => Ok(ServiceMetricsInfo {
      service_name: params.service_name.clone(),
      metrics_available: true,
      request_count: 150,
      error_count: 3,
      average_response_time: 45.6,
      status: "active".to_string(),
    }),
    None => Ok(ServiceMetricsInfo {
      service_name: params.service_name.clone(),
      metrics_available: false,
      request_count: 0,
      error_count: 0,
      average_response_time: 0.0,
      status: "no_metrics".to_string(),
    }),
  }
}

/// Сводка всех метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllMetricsSummary {
  pub total_services: usize,
  pub active_services: usize,
  pub total_requests: u64,
  pub total_errors: u64,
  pub average_response_time: f64,
  pub summaries: Vec<MetricsSummaryInfo>,
}

/// Информация о сводке метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsSummaryInfo {
  pub service_name: String,
  pub request_count: u64,
  pub error_count: u64,
  pub response_time: f64,
  pub status: String,
}

/// Получить все сводки метрик
#[tauri::command]
pub async fn get_all_metrics_summaries_command(
  _state: State<'_, VideoCompilerState>,
) -> Result<AllMetricsSummary> {
  // Создаем заглушку для MetricsRegistry
  let registry = MetricsRegistry::new();

  let _summaries = registry.get_all_summaries().await;

  // Возвращаем демо данные
  let demo_summaries = vec![
    MetricsSummaryInfo {
      service_name: "render_service".to_string(),
      request_count: 450,
      error_count: 12,
      response_time: 2300.5,
      status: "active".to_string(),
    },
    MetricsSummaryInfo {
      service_name: "preview_service".to_string(),
      request_count: 890,
      error_count: 5,
      response_time: 156.7,
      status: "active".to_string(),
    },
    MetricsSummaryInfo {
      service_name: "cache_service".to_string(),
      request_count: 1250,
      error_count: 2,
      response_time: 45.3,
      status: "active".to_string(),
    },
  ];

  Ok(AllMetricsSummary {
    total_services: 3,
    active_services: 3,
    total_requests: 2590,
    total_errors: 19,
    average_response_time: 834.2,
    summaries: demo_summaries,
  })
}

/// Экспорт метрик в формате Prometheus
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrometheusExport {
  pub format: String,
  pub content: String,
  pub timestamp: String,
  pub metrics_count: usize,
}

/// Экспортировать метрики в формате Prometheus
#[tauri::command]
pub async fn export_prometheus_detailed(
  _state: State<'_, VideoCompilerState>,
) -> Result<PrometheusExport> {
  // Создаем заглушку для MetricsRegistry
  let registry = MetricsRegistry::new();

  let prometheus_content = registry.export_prometheus().await;

  Ok(PrometheusExport {
    format: "prometheus".to_string(),
    content: prometheus_content,
    timestamp: chrono::Utc::now().to_rfc3339(),
    metrics_count: 15, // Количество метрик
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_service_metrics_params_serialization() {
    let params = GetServiceMetricsParams {
      service_name: "test_service".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("test_service"));
  }

  #[test]
  fn test_project_service_info_serialization() {
    let info = ProjectServiceInfo {
      available: true,
      service_type: "ProjectService".to_string(),
      status: "active".to_string(),
      error: None,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("ProjectService"));
    assert!(json.contains("active"));
  }

  #[test]
  fn test_metrics_summary_serialization() {
    let summary = AllMetricsSummary {
      total_services: 3,
      active_services: 2,
      total_requests: 1000,
      total_errors: 5,
      average_response_time: 150.5,
      summaries: vec![],
    };

    let json = serde_json::to_string(&summary).unwrap();
    assert!(json.contains("1000"));
    assert!(json.contains("150.5"));
  }
}
