//! Модуль мониторинга для сервисного слоя
//!
//! Предоставляет метрики и инструменты для отслеживания производительности сервисов

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Метрики операции
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OperationMetrics {
  pub count: u64,
  pub total_duration_ms: u64,
  pub min_duration_ms: u64,
  pub max_duration_ms: u64,
  pub avg_duration_ms: f64,
  pub errors: u64,
  pub last_error: Option<String>,
  pub last_operation_time: Option<std::time::SystemTime>,
}

impl Default for OperationMetrics {
  fn default() -> Self {
    Self {
      count: 0,
      total_duration_ms: 0,
      min_duration_ms: u64::MAX,
      max_duration_ms: 0,
      avg_duration_ms: 0.0,
      errors: 0,
      last_error: None,
      last_operation_time: None,
    }
  }
}

/// Метрики сервиса
#[derive(Debug)]
pub struct ServiceMetrics {
  pub name: String,
  pub operations: Arc<RwLock<HashMap<String, OperationMetrics>>>,
  pub total_operations: AtomicU64,
  pub total_errors: AtomicU64,
  pub active_operations: AtomicUsize,
  pub start_time: Instant,
}

impl ServiceMetrics {
  pub fn new(name: String) -> Self {
    Self {
      name,
      operations: Arc::new(RwLock::new(HashMap::new())),
      total_operations: AtomicU64::new(0),
      total_errors: AtomicU64::new(0),
      active_operations: AtomicUsize::new(0),
      start_time: Instant::now(),
    }
  }

  /// Начать отслеживание операции
  pub fn start_operation(&self, operation_name: &str) -> OperationTracker {
    self.active_operations.fetch_add(1, Ordering::Relaxed);
    OperationTracker {
      metrics: self,
      operation_name: operation_name.to_string(),
      start_time: Instant::now(),
      completed: false,
    }
  }

  /// Записать результат операции
  pub async fn record_operation(
    &self,
    operation_name: &str,
    duration: Duration,
    success: bool,
    error_message: Option<String>,
  ) {
    self.total_operations.fetch_add(1, Ordering::Relaxed);
    if !success {
      self.total_errors.fetch_add(1, Ordering::Relaxed);
    }

    let duration_ms = duration.as_millis() as u64;
    let mut operations = self.operations.write().await;
    let metrics = operations.entry(operation_name.to_string()).or_default();

    metrics.count += 1;
    metrics.total_duration_ms += duration_ms;
    metrics.min_duration_ms = metrics.min_duration_ms.min(duration_ms);
    metrics.max_duration_ms = metrics.max_duration_ms.max(duration_ms);
    metrics.avg_duration_ms = metrics.total_duration_ms as f64 / metrics.count as f64;
    metrics.last_operation_time = Some(std::time::SystemTime::now());

    if !success {
      metrics.errors += 1;
      metrics.last_error = error_message;
    }
  }

  /// Получить сводку метрик
  pub async fn get_summary(&self) -> MetricsSummary {
    let operations = self.operations.read().await;
    let uptime = self.start_time.elapsed();

    MetricsSummary {
      service_name: self.name.clone(),
      uptime_seconds: uptime.as_secs(),
      total_operations: self.total_operations.load(Ordering::Relaxed),
      total_errors: self.total_errors.load(Ordering::Relaxed),
      active_operations: self.active_operations.load(Ordering::Relaxed),
      operations_per_second: self.total_operations.load(Ordering::Relaxed) as f64
        / uptime.as_secs_f64().max(1.0),
      error_rate: if self.total_operations.load(Ordering::Relaxed) > 0 {
        self.total_errors.load(Ordering::Relaxed) as f64
          / self.total_operations.load(Ordering::Relaxed) as f64
      } else {
        0.0
      },
      operation_metrics: operations.clone(),
    }
  }

  /// Сбросить метрики
  pub async fn reset(&self) {
    self.operations.write().await.clear();
    self.total_operations.store(0, Ordering::Relaxed);
    self.total_errors.store(0, Ordering::Relaxed);
    self.active_operations.store(0, Ordering::Relaxed);
  }
}

/// Трекер операции для автоматического учета времени
pub struct OperationTracker<'a> {
  metrics: &'a ServiceMetrics,
  operation_name: String,
  start_time: Instant,
  completed: bool,
}

impl<'a> OperationTracker<'a> {
  /// Завершить операцию успешно
  pub async fn complete(mut self) {
    self.completed = true;
    let duration = self.start_time.elapsed();
    self
      .metrics
      .active_operations
      .fetch_sub(1, Ordering::Relaxed);
    self
      .metrics
      .record_operation(&self.operation_name, duration, true, None)
      .await;
    log::trace!(
      "[{}] Операция '{}' завершена за {:?}",
      self.metrics.name,
      self.operation_name,
      duration
    );
  }

  /// Завершить операцию с ошибкой
  pub async fn fail(mut self, error: String) {
    self.completed = true;
    let duration = self.start_time.elapsed();
    self
      .metrics
      .active_operations
      .fetch_sub(1, Ordering::Relaxed);
    self
      .metrics
      .record_operation(&self.operation_name, duration, false, Some(error.clone()))
      .await;
    log::warn!(
      "[{}] Операция '{}' завершена с ошибкой за {:?}: {}",
      self.metrics.name,
      self.operation_name,
      duration,
      error
    );
  }
}

impl<'a> Drop for OperationTracker<'a> {
  fn drop(&mut self) {
    if !self.completed {
      self
        .metrics
        .active_operations
        .fetch_sub(1, Ordering::Relaxed);
      log::warn!(
        "[{}] Операция '{}' не была завершена корректно",
        self.metrics.name,
        self.operation_name
      );
    }
  }
}

/// Сводка метрик сервиса
#[derive(Debug, Clone, serde::Serialize)]
pub struct MetricsSummary {
  pub service_name: String,
  pub uptime_seconds: u64,
  pub total_operations: u64,
  pub total_errors: u64,
  pub active_operations: usize,
  pub operations_per_second: f64,
  pub error_rate: f64,
  pub operation_metrics: HashMap<String, OperationMetrics>,
}

/// Глобальный реестр метрик
#[derive(Debug)]
pub struct MetricsRegistry {
  services: Arc<RwLock<HashMap<String, Arc<ServiceMetrics>>>>,
}

impl Default for MetricsRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl MetricsRegistry {
  pub fn new() -> Self {
    Self {
      services: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  /// Зарегистрировать сервис
  pub async fn register_service(&self, name: String) -> Arc<ServiceMetrics> {
    let metrics = Arc::new(ServiceMetrics::new(name.clone()));
    self.services.write().await.insert(name, metrics.clone());
    metrics
  }

  /// Получить метрики сервиса
  pub async fn get_service_metrics(&self, name: &str) -> Option<Arc<ServiceMetrics>> {
    self.services.read().await.get(name).cloned()
  }

  /// Получить сводку всех метрик
  pub async fn get_all_summaries(&self) -> Vec<MetricsSummary> {
    let services = self.services.read().await;
    let mut summaries = Vec::new();

    for service in services.values() {
      summaries.push(service.get_summary().await);
    }

    summaries
  }

  /// Экспортировать метрики в формате Prometheus
  pub async fn export_prometheus(&self) -> String {
    let mut output = String::new();
    let services = self.services.read().await;

    for service in services.values() {
      let summary = service.get_summary().await;
      let service_name = summary.service_name.replace('-', "_");

      // Основные метрики
      output.push_str(&format!(
        "# HELP {}_operations_total Total number of operations\n",
        service_name
      ));
      output.push_str(&format!(
        "# TYPE {}_operations_total counter\n",
        service_name
      ));
      output.push_str(&format!(
        "{}_operations_total {}\n",
        service_name, summary.total_operations
      ));

      output.push_str(&format!(
        "# HELP {}_errors_total Total number of errors\n",
        service_name
      ));
      output.push_str(&format!("# TYPE {}_errors_total counter\n", service_name));
      output.push_str(&format!(
        "{}_errors_total {}\n",
        service_name, summary.total_errors
      ));

      output.push_str(&format!(
        "# HELP {}_active_operations Current active operations\n",
        service_name
      ));
      output.push_str(&format!(
        "# TYPE {}_active_operations gauge\n",
        service_name
      ));
      output.push_str(&format!(
        "{}_active_operations {}\n",
        service_name, summary.active_operations
      ));

      // Метрики по операциям
      for (op_name, metrics) in summary.operation_metrics {
        let op_name = op_name.replace(['-', ' '], "_");

        output.push_str(&format!(
          "{}_operation_duration_ms{{operation=\"{}\",quantile=\"0.0\"}} {}\n",
          service_name, op_name, metrics.min_duration_ms
        ));
        output.push_str(&format!(
          "{}_operation_duration_ms{{operation=\"{}\",quantile=\"0.5\"}} {}\n",
          service_name, op_name, metrics.avg_duration_ms as u64
        ));
        output.push_str(&format!(
          "{}_operation_duration_ms{{operation=\"{}\",quantile=\"1.0\"}} {}\n",
          service_name, op_name, metrics.max_duration_ms
        ));
        output.push_str(&format!(
          "{}_operation_count{{operation=\"{}\"}} {}\n",
          service_name, op_name, metrics.count
        ));
        output.push_str(&format!(
          "{}_operation_errors{{operation=\"{}\"}} {}\n",
          service_name, op_name, metrics.errors
        ));
      }
    }

    output
  }
}

/// Глобальный экземпляр реестра метрик
use once_cell::sync::Lazy;
pub static METRICS: Lazy<MetricsRegistry> = Lazy::new(MetricsRegistry::new);

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_service_metrics() {
    let metrics = ServiceMetrics::new("test-service".to_string());

    // Тест успешной операции
    {
      let tracker = metrics.start_operation("test-op");
      tokio::time::sleep(Duration::from_millis(10)).await;
      tracker.complete().await;
    }

    // Тест операции с ошибкой
    {
      let tracker = metrics.start_operation("test-op");
      tracker.fail("Test error".to_string()).await;
    }

    let summary = metrics.get_summary().await;
    assert_eq!(summary.total_operations, 2);
    assert_eq!(summary.total_errors, 1);
    assert_eq!(summary.active_operations, 0);
    assert!(summary.error_rate > 0.0);

    let op_metrics = summary.operation_metrics.get("test-op").unwrap();
    assert_eq!(op_metrics.count, 2);
    assert_eq!(op_metrics.errors, 1);
    assert!(op_metrics.min_duration_ms <= op_metrics.max_duration_ms);
  }

  #[tokio::test]
  async fn test_metrics_registry() {
    let registry = MetricsRegistry::new();
    let metrics = registry.register_service("test-service".to_string()).await;

    // Выполняем операцию
    let tracker = metrics.start_operation("test-op");
    tracker.complete().await;

    let summaries = registry.get_all_summaries().await;
    assert_eq!(summaries.len(), 1);
    assert_eq!(summaries[0].service_name, "test-service");
    assert_eq!(summaries[0].total_operations, 1);

    // Тест экспорта Prometheus
    let prometheus = registry.export_prometheus().await;
    assert!(prometheus.contains("test_service_operations_total 1"));
  }
}
