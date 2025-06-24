//! Конфигурация телеметрии

use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Конфигурация телеметрии
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
  /// Включена ли телеметрия
  pub enabled: bool,

  /// Название сервиса
  pub service_name: String,

  /// Версия сервиса
  pub service_version: String,

  /// Окружение (development, staging, production)
  pub environment: String,

  /// Конфигурация экспортера
  pub exporter: ExporterConfig,

  /// Конфигурация трассировки
  pub tracing: TracingConfig,

  /// Конфигурация метрик
  pub metrics: MetricsConfig,

  /// Уровень логирования
  pub log_level: LogLevel,
}

impl Default for TelemetryConfig {
  fn default() -> Self {
    Self {
      enabled: true,
      service_name: "timeline-studio".to_string(),
      service_version: env!("CARGO_PKG_VERSION").to_string(),
      environment: "development".to_string(),
      exporter: ExporterConfig::default(),
      tracing: TracingConfig::default(),
      metrics: MetricsConfig::default(),
      log_level: LogLevel::Info,
    }
  }
}

/// Конфигурация экспортера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExporterConfig {
  /// Тип экспортера
  pub exporter_type: ExporterType,

  /// Endpoint для OTLP
  pub otlp_endpoint: Option<String>,

  /// Заголовки для аутентификации
  pub headers: Vec<(String, String)>,

  /// Таймаут экспорта
  pub timeout: Duration,

  /// Размер батча
  pub batch_size: usize,
}

impl Default for ExporterConfig {
  fn default() -> Self {
    Self {
      exporter_type: ExporterType::Console,
      otlp_endpoint: None,
      headers: vec![],
      timeout: Duration::from_secs(10),
      batch_size: 512,
    }
  }
}

/// Тип экспортера
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExporterType {
  /// Вывод в консоль (для разработки)
  Console,
  /// OTLP (OpenTelemetry Protocol)
  Otlp,
  /// Jaeger
  Jaeger,
  /// Prometheus (только для метрик)
  Prometheus,
  /// Не экспортировать
  None,
}

/// Конфигурация трассировки
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracingConfig {
  /// Процент семплирования (0.0 - 1.0)
  pub sample_rate: f64,

  /// Максимальное количество атрибутов в span
  pub max_attributes_per_span: u32,

  /// Максимальное количество событий в span
  pub max_events_per_span: u32,

  /// Максимальное количество ссылок в span
  pub max_links_per_span: u32,

  /// Игнорируемые пути (не трассировать)
  pub ignored_paths: Vec<String>,
}

impl Default for TracingConfig {
  fn default() -> Self {
    Self {
      sample_rate: 1.0,
      max_attributes_per_span: 128,
      max_events_per_span: 128,
      max_links_per_span: 128,
      ignored_paths: vec![
        "/health".to_string(),
        "/metrics".to_string(),
        "/ready".to_string(),
      ],
    }
  }
}

/// Конфигурация метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsConfig {
  /// Интервал сбора метрик
  pub collection_interval: Duration,

  /// Интервал экспорта метрик
  pub export_interval: Duration,

  /// Включить метрики runtime
  pub runtime_metrics: bool,

  /// Включить метрики системы
  pub system_metrics: bool,

  /// Включить метрики процесса
  pub process_metrics: bool,
}

impl Default for MetricsConfig {
  fn default() -> Self {
    Self {
      collection_interval: Duration::from_secs(10),
      export_interval: Duration::from_secs(60),
      runtime_metrics: true,
      system_metrics: true,
      process_metrics: true,
    }
  }
}

/// Уровень логирования
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LogLevel {
  Trace,
  Debug,
  Info,
  Warn,
  Error,
}

impl From<LogLevel> for tracing::Level {
  fn from(level: LogLevel) -> Self {
    match level {
      LogLevel::Trace => tracing::Level::TRACE,
      LogLevel::Debug => tracing::Level::DEBUG,
      LogLevel::Info => tracing::Level::INFO,
      LogLevel::Warn => tracing::Level::WARN,
      LogLevel::Error => tracing::Level::ERROR,
    }
  }
}

/// Builder для TelemetryConfig
pub struct TelemetryConfigBuilder {
  config: TelemetryConfig,
}

impl Default for TelemetryConfigBuilder {
  fn default() -> Self {
    Self::new()
  }
}

impl TelemetryConfigBuilder {
  pub fn new() -> Self {
    Self {
      config: TelemetryConfig::default(),
    }
  }

  pub fn service_name(mut self, name: impl Into<String>) -> Self {
    self.config.service_name = name.into();
    self
  }

  pub fn environment(mut self, env: impl Into<String>) -> Self {
    self.config.environment = env.into();
    self
  }

  pub fn otlp_endpoint(mut self, endpoint: impl Into<String>) -> Self {
    self.config.exporter.exporter_type = ExporterType::Otlp;
    self.config.exporter.otlp_endpoint = Some(endpoint.into());
    self
  }

  pub fn sample_rate(mut self, rate: f64) -> Self {
    self.config.tracing.sample_rate = rate.clamp(0.0, 1.0);
    self
  }

  pub fn log_level(mut self, level: LogLevel) -> Self {
    self.config.log_level = level;
    self
  }

  pub fn build(self) -> TelemetryConfig {
    self.config
  }
}
