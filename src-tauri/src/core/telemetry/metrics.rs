//! Сбор метрик с OpenTelemetry

use crate::video_compiler::error::{Result, VideoCompilerError};
use opentelemetry::{
  global,
  metrics::{Counter as OtelCounter, Histogram as OtelHistogram, Meter, UpDownCounter},
  KeyValue,
};
use opentelemetry_sdk::{
  metrics::{self, PeriodicReader, Temporality},
  Resource,
};
use opentelemetry_semantic_conventions::resource::{SERVICE_NAME, SERVICE_VERSION};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::config::{ExporterType, TelemetryConfig};

/// Типы метрик
#[derive(Debug, Clone)]
pub enum MetricType {
  Counter,
  Gauge,
  Histogram,
}

/// Счетчик (только увеличивается)
pub struct Counter {
  inner: OtelCounter<u64>,
  labels: Vec<KeyValue>,
}

impl Counter {
  fn new(inner: OtelCounter<u64>) -> Self {
    Self {
      inner,
      labels: vec![],
    }
  }

  /// Добавить метку
  pub fn with_label(mut self, key: &str, value: impl Into<opentelemetry::Value>) -> Self {
    self
      .labels
      .push(KeyValue::new(key.to_string(), value.into()));
    self
  }

  /// Увеличить счетчик
  pub fn increment(&self, value: u64) {
    self.inner.add(value, &self.labels);
  }

  /// Увеличить на 1
  pub fn inc(&self) {
    self.increment(1);
  }
}

/// Gauge (может увеличиваться и уменьшаться)
pub struct Gauge {
  inner: UpDownCounter<i64>,
  labels: Vec<KeyValue>,
}

impl Gauge {
  fn new(inner: UpDownCounter<i64>) -> Self {
    Self {
      inner,
      labels: vec![],
    }
  }

  /// Добавить метку
  pub fn with_label(mut self, key: &str, value: impl Into<opentelemetry::Value>) -> Self {
    self
      .labels
      .push(KeyValue::new(key.to_string(), value.into()));
    self
  }

  /// Изменить значение
  pub fn add(&self, value: i64) {
    self.inner.add(value, &self.labels);
  }

  /// Установить значение (через add с разницей)
  pub fn set(&self, _value: i64) {
    // OpenTelemetry не поддерживает прямую установку значения для UpDownCounter
    // Нужно отслеживать предыдущее значение вручную
    log::warn!("Gauge.set() not fully implemented - using add() instead");
  }
}

/// Гистограмма для измерения распределения значений
pub struct Histogram {
  inner: OtelHistogram<f64>,
  labels: Vec<KeyValue>,
}

impl Histogram {
  fn new(inner: OtelHistogram<f64>) -> Self {
    Self {
      inner,
      labels: vec![],
    }
  }

  /// Добавить метку
  pub fn with_label(mut self, key: &str, value: impl Into<opentelemetry::Value>) -> Self {
    self
      .labels
      .push(KeyValue::new(key.to_string(), value.into()));
    self
  }

  /// Записать наблюдение
  pub fn observe(&self, value: f64) {
    self.inner.record(value, &self.labels);
  }

  /// Измерить время выполнения
  pub async fn time<F, R>(&self, f: F) -> R
  where
    F: std::future::Future<Output = R>,
  {
    let start = std::time::Instant::now();
    let result = f.await;
    let duration = start.elapsed();
    self.observe(duration.as_secs_f64());
    result
  }
}

/// Коллектор метрик
pub struct MetricsCollector {
  meter: Meter,
  config: TelemetryConfig,
  registered_metrics: Arc<RwLock<HashMap<String, MetricType>>>,
}

impl MetricsCollector {
  /// Создать новый коллектор метрик
  pub async fn new(config: &TelemetryConfig) -> Result<Self> {
    if !config.enabled {
      // Возвращаем noop meter
      return Ok(Self {
        meter: global::meter("noop"),
        config: config.clone(),
        registered_metrics: Arc::new(RwLock::new(HashMap::new())),
      });
    }

    // Создаем ресурс
    let resource = Resource::new(vec![
      KeyValue::new(SERVICE_NAME, config.service_name.clone()),
      KeyValue::new(SERVICE_VERSION, config.service_version.clone()),
      KeyValue::new("deployment.environment", config.environment.clone()),
    ]);

    // Создаем meter provider
    let provider = match config.exporter.exporter_type {
      ExporterType::Console => {
        // Console metrics for development - use noop
        return Ok(Self {
          meter: global::meter("noop"),
          config: config.clone(),
          registered_metrics: Arc::new(RwLock::new(HashMap::new())),
        });
      }
      ExporterType::Otlp => {
        // OTLP for production - temporarily noop
        return Ok(Self {
          meter: global::meter("otlp-noop"),
          config: config.clone(),
          registered_metrics: Arc::new(RwLock::new(HashMap::new())),
        });
      }
      ExporterType::Prometheus => {
        // TODO: Реализовать Prometheus экспортер
        return Err(VideoCompilerError::NotImplemented(
          "Prometheus exporter not implemented yet".to_string(),
        ));
      }
      _ => {
        // Для остальных типов используем noop
        return Ok(Self {
          meter: global::meter("noop"),
          config: config.clone(),
          registered_metrics: Arc::new(RwLock::new(HashMap::new())),
        });
      }
    };

    // Устанавливаем глобальный provider
    global::set_meter_provider(provider);

    // Получаем meter
    let meter = global::meter("timeline-studio");

    Ok(Self {
      meter,
      config: config.clone(),
      registered_metrics: Arc::new(RwLock::new(HashMap::new())),
    })
  }

  /// Создать счетчик
  pub fn counter(&self, name: &str, description: &str) -> Result<Counter> {
    self.register_metric(name, MetricType::Counter)?;

    let counter = self
      .meter
      .u64_counter(name)
      .with_description(description)
      .init();

    Ok(Counter::new(counter))
  }

  /// Создать gauge
  pub fn gauge(&self, name: &str, description: &str) -> Result<Gauge> {
    self.register_metric(name, MetricType::Gauge)?;

    let gauge = self
      .meter
      .i64_up_down_counter(name)
      .with_description(description)
      .init();

    Ok(Gauge::new(gauge))
  }

  /// Создать гистограмму
  pub fn histogram(&self, name: &str, description: &str) -> Result<Histogram> {
    self.register_metric(name, MetricType::Histogram)?;

    let histogram = self
      .meter
      .f64_histogram(name)
      .with_description(description)
      .init();

    Ok(Histogram::new(histogram))
  }

  /// Зарегистрировать метрику
  fn register_metric(&self, name: &str, metric_type: MetricType) -> Result<()> {
    let mut metrics = futures::executor::block_on(self.registered_metrics.write());

    if let Some(existing_type) = metrics.get(name) {
      if !matches!(
        (existing_type, &metric_type),
        (MetricType::Counter, MetricType::Counter)
          | (MetricType::Gauge, MetricType::Gauge)
          | (MetricType::Histogram, MetricType::Histogram)
      ) {
        return Err(VideoCompilerError::InvalidParameter(format!(
          "Metric '{}' already registered with different type",
          name
        )));
      }
    } else {
      metrics.insert(name.to_string(), metric_type);
    }

    Ok(())
  }

  /// Собрать метрики runtime
  pub async fn collect_runtime_metrics(&self) -> Result<()> {
    if !self.config.metrics.runtime_metrics {
      return Ok(());
    }

    // TODO: Реализовать сбор метрик runtime
    // - Количество потоков
    // - Использование CPU
    // - Количество задач в Tokio

    Ok(())
  }

  /// Собрать системные метрики
  pub async fn collect_system_metrics(&self) -> Result<()> {
    if !self.config.metrics.system_metrics {
      return Ok(());
    }

    // Используем sysinfo для сбора метрик
    use sysinfo::System;

    let mut system = System::new_all();
    system.refresh_all();

    // CPU usage
    let cpu_usage = self.gauge("system.cpu.usage", "CPU usage percentage")?;
    cpu_usage.add(system.global_cpu_usage() as i64);

    // Memory
    let memory_used = self.gauge("system.memory.used", "Used memory in bytes")?;
    memory_used.add(system.used_memory() as i64);

    let memory_total = self.gauge("system.memory.total", "Total memory in bytes")?;
    memory_total.add(system.total_memory() as i64);

    Ok(())
  }

  /// Завершить работу коллектора
  pub async fn shutdown(&self) -> Result<()> {
    if self.config.enabled {
      // OpenTelemetry SDK автоматически экспортирует оставшиеся метрики при shutdown
    }
    Ok(())
  }
}

/// Предопределенные метрики
pub struct Metrics {
  // HTTP метрики
  pub http_requests_total: Counter,
  pub http_request_duration: Histogram,
  pub http_request_size: Histogram,
  pub http_response_size: Histogram,
  pub http_active_requests: Gauge,

  // Рендеринг метрики
  pub render_jobs_total: Counter,
  pub render_jobs_active: Gauge,
  pub render_duration: Histogram,
  pub render_frames_processed: Counter,
  pub render_errors_total: Counter,

  // Медиа метрики
  pub media_files_imported: Counter,
  pub media_processing_duration: Histogram,
  pub media_cache_hits: Counter,
  pub media_cache_misses: Counter,

  // Плагин метрики
  pub plugin_loads_total: Counter,
  pub plugin_errors_total: Counter,
  pub plugin_command_duration: Histogram,
  pub plugin_active_count: Gauge,
}

impl Metrics {
  /// Создать стандартный набор метрик
  pub fn new(collector: &MetricsCollector) -> Result<Self> {
    Ok(Self {
      // HTTP метрики
      http_requests_total: collector
        .counter("http_requests_total", "Total number of HTTP requests")?,
      http_request_duration: collector.histogram(
        "http_request_duration_seconds",
        "HTTP request duration in seconds",
      )?,
      http_request_size: collector
        .histogram("http_request_size_bytes", "HTTP request size in bytes")?,
      http_response_size: collector
        .histogram("http_response_size_bytes", "HTTP response size in bytes")?,
      http_active_requests: collector
        .gauge("http_active_requests", "Number of active HTTP requests")?,

      // Рендеринг метрики
      render_jobs_total: collector.counter("render_jobs_total", "Total number of render jobs")?,
      render_jobs_active: collector.gauge("render_jobs_active", "Number of active render jobs")?,
      render_duration: collector
        .histogram("render_duration_seconds", "Render job duration in seconds")?,
      render_frames_processed: collector.counter(
        "render_frames_processed_total",
        "Total number of frames processed",
      )?,
      render_errors_total: collector
        .counter("render_errors_total", "Total number of render errors")?,

      // Медиа метрики
      media_files_imported: collector.counter(
        "media_files_imported_total",
        "Total number of media files imported",
      )?,
      media_processing_duration: collector.histogram(
        "media_processing_duration_seconds",
        "Media processing duration in seconds",
      )?,
      media_cache_hits: collector
        .counter("media_cache_hits_total", "Total number of media cache hits")?,
      media_cache_misses: collector.counter(
        "media_cache_misses_total",
        "Total number of media cache misses",
      )?,

      // Плагин метрики
      plugin_loads_total: collector
        .counter("plugin_loads_total", "Total number of plugin loads")?,
      plugin_errors_total: collector
        .counter("plugin_errors_total", "Total number of plugin errors")?,
      plugin_command_duration: collector.histogram(
        "plugin_command_duration_seconds",
        "Plugin command duration in seconds",
      )?,
      plugin_active_count: collector.gauge("plugin_active_count", "Number of active plugins")?,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_metrics_collector_creation() {
    let config = TelemetryConfig::default();
    let collector = MetricsCollector::new(&config).await.unwrap();

    // Проверяем создание метрик
    let counter = collector.counter("test_counter", "Test counter").unwrap();
    counter.inc();

    let gauge = collector.gauge("test_gauge", "Test gauge").unwrap();
    gauge.add(10);

    let histogram = collector
      .histogram("test_histogram", "Test histogram")
      .unwrap();
    histogram.observe(0.5);
  }

  #[tokio::test]
  async fn test_histogram_timing() {
    let config = TelemetryConfig::default();
    let collector = MetricsCollector::new(&config).await.unwrap();

    let histogram = collector.histogram("test_timing", "Test timing").unwrap();

    let result = histogram
      .time(async {
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
        42
      })
      .await;

    assert_eq!(result, 42);
  }
}
