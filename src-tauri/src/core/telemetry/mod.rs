//! OpenTelemetry интеграция для мониторинга и трассировки

pub mod config;
pub mod health;
pub mod metrics;
pub mod middleware;
pub mod tracer;

pub use config::{ExporterConfig, TelemetryConfig};
pub use health::{
  HealthCheck, HealthCheckManager, HealthCheckResult, HealthCheckSummary, HealthStatus,
};
pub use metrics::{Counter, Gauge, Histogram, MetricsCollector};
pub use middleware::{MetricsMiddleware, TracingMiddleware};
pub use tracer::{SpanBuilder, TraceContext, Tracer};

use crate::video_compiler::error::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Менеджер телеметрии
pub struct TelemetryManager {
  tracer: Arc<Tracer>,
  metrics: Arc<MetricsCollector>,
  health: Arc<HealthCheckManager>,
  config: Arc<RwLock<TelemetryConfig>>,
}

impl TelemetryManager {
  /// Создать новый менеджер телеметрии
  pub async fn new(config: TelemetryConfig) -> Result<Self> {
    let tracer = Arc::new(Tracer::new(&config).await?);
    let metrics = Arc::new(MetricsCollector::new(&config).await?);
    let health = Arc::new(HealthCheckManager::new());

    // Добавляем базовые health checks
    health
      .add_check(Box::new(health::DatabaseHealthCheck::new()))
      .await;
    health
      .add_check(Box::new(health::MemoryHealthCheck::new()))
      .await;

    Ok(Self {
      tracer,
      metrics,
      health,
      config: Arc::new(RwLock::new(config)),
    })
  }

  /// Получить tracer
  pub fn tracer(&self) -> Arc<Tracer> {
    self.tracer.clone()
  }

  /// Получить metrics collector
  pub fn metrics(&self) -> Arc<MetricsCollector> {
    self.metrics.clone()
  }

  /// Получить health check manager
  pub fn health(&self) -> Arc<HealthCheckManager> {
    self.health.clone()
  }

  /// Обновить конфигурацию
  pub async fn update_config(&self, config: TelemetryConfig) -> Result<()> {
    let mut current = self.config.write().await;
    *current = config;

    // TODO: Реконфигурировать tracer и metrics

    Ok(())
  }

  /// Добавить health checks для компонентов системы
  pub async fn setup_system_health_checks(
    &self,
    event_bus: Option<Arc<crate::core::EventBus>>,
    plugin_manager: Option<Arc<crate::core::PluginManager>>,
  ) -> Result<()> {
    if let Some(event_bus) = event_bus {
      self
        .health
        .add_check(Box::new(health::EventBusHealthCheck::new(event_bus)))
        .await;
    }

    if let Some(plugin_manager) = plugin_manager {
      self
        .health
        .add_check(Box::new(health::PluginHealthCheck::new(plugin_manager)))
        .await;
    }

    Ok(())
  }

  /// Завершить работу телеметрии
  pub async fn shutdown(&self) -> Result<()> {
    self.tracer.shutdown().await?;
    self.metrics.shutdown().await?;
    Ok(())
  }
}
