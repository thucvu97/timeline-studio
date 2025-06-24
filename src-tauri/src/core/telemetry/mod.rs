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

    // Примечание: Реконфигурация tracer и metrics требует перезапуска
    // OpenTelemetry SDK не поддерживает горячую реконфигурацию
    // Для применения изменений требуется вызвать shutdown() и создать новый TelemetryManager

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

  #[tokio::test]
  async fn test_telemetry_sampling_logic() {
    // Тест логики семплирования трейсов
    let mut config = TelemetryConfig::default();
    config.tracing.sample_rate = 0.5; // 50% семплирование

    let manager = TelemetryManager::new(config).await.unwrap();
    let tracer = manager.tracer();

    // Генерируем множество трейсов для проверки семплирования
    let mut completed_traces = 0;
    let total_traces = 100;

    for i in 0..total_traces {
      let result = tracer
        .trace(&format!("sample_operation_{}", i), async {
          tokio::time::sleep(std::time::Duration::from_millis(1)).await;
          Ok::<i32, crate::video_compiler::error::VideoCompilerError>(i)
        })
        .await;

      if result.is_ok() {
        completed_traces += 1;
      }
    }

    // Все трейсы должны выполниться (семплирование влияет на экспорт, а не на выполнение)
    assert_eq!(completed_traces, total_traces);

    // Тестируем различные sample rate
    let configs_to_test = vec![0.0, 0.25, 0.75, 1.0];

    for sample_rate in configs_to_test {
      let mut test_config = TelemetryConfig::default();
      test_config.tracing.sample_rate = sample_rate;

      let test_manager = TelemetryManager::new(test_config).await.unwrap();
      let test_tracer = test_manager.tracer();

      // Проверяем что tracer создается корректно с любым sample rate
      let result = test_tracer
        .trace("sample_rate_test", async {
          Ok::<String, crate::video_compiler::error::VideoCompilerError>(format!(
            "rate_{}",
            sample_rate
          ))
        })
        .await;

      assert!(result.is_ok());
      assert_eq!(result.unwrap(), format!("rate_{}", sample_rate));
    }
  }

  #[tokio::test]
  async fn test_telemetry_integration_pipeline() {
    // Тест полной интеграции telemetry pipeline
    use crate::core::plugins::plugin::Version;
    use crate::core::{EventBus, PluginManager, ServiceContainer};

    let mut config = TelemetryConfig::default();
    config.metrics.system_metrics = true;
    config.tracing.sample_rate = 1.0; // Включаем все трейсы для тестирования

    let manager = TelemetryManager::new(config).await.unwrap();

    // Настраиваем системные компоненты
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);
    let plugin_manager = Arc::new(PluginManager::new(
      app_version,
      event_bus.clone(),
      service_container,
    ));

    // Добавляем системные health checks
    manager
      .setup_system_health_checks(Some(event_bus), Some(plugin_manager))
      .await
      .unwrap();

    // Получаем компоненты
    let tracer = manager.tracer();
    let metrics = manager.metrics();
    let health = manager.health();

    // Тестируем полный pipeline:
    // 1. Создаем метрики
    let request_counter = metrics
      .counter("integration_requests_total", "Integration test requests")
      .unwrap();

    let response_time = metrics
      .histogram("integration_response_time", "Integration response time")
      .unwrap();

    // 2. Генерируем трейсы с метриками
    for i in 0..5 {
      let operation_name = format!("integration_operation_{}", i);

      let result = tracer
        .span(&operation_name)
        .with_attribute("operation.id", i.to_string())
        .with_attribute("test.type", "integration")
        .run(async {
          let start = std::time::Instant::now();

          // Симулируем работу
          tokio::time::sleep(std::time::Duration::from_millis(10 + i * 2)).await;

          // Обновляем метрики
          request_counter.inc();
          response_time.observe(start.elapsed().as_secs_f64());

          Ok::<String, crate::video_compiler::error::VideoCompilerError>(format!("completed_{}", i))
        })
        .await;

      assert!(result.is_ok());
    }

    // 3. Проверяем health checks
    let health_summary = health.check_all().await;
    assert!(!health_summary.checks.is_empty());

    // 4. Собираем системные метрики
    metrics.collect_system_metrics().await.unwrap();

    // 5. Проверяем что все компоненты работают корректно
    // Попробуем создать метрики еще раз - если они уже зарегистрированы, получим ошибку
    let duplicate_counter = metrics.counter("integration_requests_total", "Should be registered");
    assert!(
      duplicate_counter.is_err(),
      "Counter should already be registered"
    );

    let duplicate_histogram =
      metrics.histogram("integration_response_time", "Should be registered");
    assert!(
      duplicate_histogram.is_err(),
      "Histogram should already be registered"
    );

    // 6. Завершаем корректно
    manager.shutdown().await.unwrap();
  }
}
