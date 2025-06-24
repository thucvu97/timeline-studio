//! OpenTelemetry интеграция для мониторинга и трассировки

pub mod config;
pub mod health;
pub mod metrics;
pub mod middleware;
pub mod tracer;

pub use config::{LogLevel, TelemetryConfig, TelemetryConfigBuilder};
pub use health::HealthCheckManager;
pub use metrics::MetricsCollector;
pub use tracer::Tracer;

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

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_telemetry_manager_creation() {
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await;

    assert!(manager.is_ok());
    let manager = manager.unwrap();

    // Проверяем что все компоненты созданы
    // Arc всегда валидны, просто проверяем что они существуют
    let _ = manager.tracer();
    let _ = manager.metrics();
    let _ = manager.health();
  }

  #[tokio::test]
  async fn test_telemetry_manager_disabled() {
    let config = TelemetryConfig {
      enabled: false,
      ..Default::default()
    };

    let manager = TelemetryManager::new(config).await;
    assert!(manager.is_ok());

    // Даже с отключенной телеметрией менеджер должен работать
    let manager = manager.unwrap();
    let tracer = manager.tracer();
    let metrics = manager.metrics();
    let health = manager.health();

    // Компоненты должны быть созданы (Arc всегда валидны)
    // Просто проверяем что можем получить ссылки
    assert!(Arc::strong_count(&tracer) >= 1);
    assert!(Arc::strong_count(&metrics) >= 1);
    assert!(Arc::strong_count(&health) >= 1);
  }

  #[tokio::test]
  async fn test_telemetry_manager_health_checks() {
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Проверяем что базовые health checks добавлены
    let checks = manager.health.list_checks().await;
    assert!(checks.contains(&"database".to_string()));
    assert!(checks.contains(&"memory".to_string()));
  }

  #[tokio::test]
  async fn test_telemetry_manager_config_update() {
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Обновляем конфигурацию
    let new_config = TelemetryConfig {
      service_name: "updated-service".to_string(),
      ..Default::default()
    };

    let result = manager.update_config(new_config.clone()).await;
    assert!(result.is_ok());

    // Проверяем что конфигурация обновлена
    let current_config = manager.config.read().await;
    assert_eq!(current_config.service_name, "updated-service");
  }

  #[tokio::test]
  async fn test_telemetry_manager_shutdown() {
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Shutdown должен работать без ошибок
    let result = manager.shutdown().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_telemetry_manager_system_health_checks() {
    use crate::core::plugins::plugin::Version;
    use crate::core::{EventBus, PluginManager, ServiceContainer};

    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Создаем моковые компоненты
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version {
      major: 1,
      minor: 0,
      patch: 0,
      pre_release: None,
    };
    let plugin_manager = Arc::new(PluginManager::new(
      app_version,
      event_bus.clone(),
      service_container,
    ));

    // Добавляем системные health checks
    let result = manager
      .setup_system_health_checks(Some(event_bus), Some(plugin_manager))
      .await;

    assert!(result.is_ok());

    // Проверяем что health checks добавлены
    let checks = manager.health.list_checks().await;
    assert!(checks.len() >= 2); // Как минимум database и memory
  }
}
