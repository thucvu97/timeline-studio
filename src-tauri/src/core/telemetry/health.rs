//! Health checks для мониторинга состояния системы

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::core::{ServiceContainer, EventBus, PluginManager};
use std::sync::Arc;
use std::time::{Duration, Instant};
use serde::{Serialize, Deserialize};
use tokio::sync::RwLock;
use std::collections::HashMap;

/// Статус health check
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HealthStatus {
    /// Система работает нормально
    Healthy,
    /// Система работает, но есть предупреждения
    Warning,
    /// Система не работает или работает с критическими ошибками
    Unhealthy,
    /// Неизвестное состояние
    Unknown,
}

impl HealthStatus {
    /// Получить HTTP статус код для health check
    pub fn http_status_code(&self) -> u16 {
        match self {
            HealthStatus::Healthy => 200,
            HealthStatus::Warning => 200,
            HealthStatus::Unhealthy => 503,
            HealthStatus::Unknown => 503,
        }
    }
    
    /// Комбинировать статусы (берем худший)
    pub fn combine(&self, other: HealthStatus) -> HealthStatus {
        match (self, other) {
            (HealthStatus::Unhealthy, _) | (_, HealthStatus::Unhealthy) => HealthStatus::Unhealthy,
            (HealthStatus::Unknown, _) | (_, HealthStatus::Unknown) => HealthStatus::Unknown,
            (HealthStatus::Warning, _) | (_, HealthStatus::Warning) => HealthStatus::Warning,
            (HealthStatus::Healthy, HealthStatus::Healthy) => HealthStatus::Healthy,
        }
    }
}

/// Результат health check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    /// Статус
    pub status: HealthStatus,
    
    /// Человекочитаемое сообщение
    pub message: String,
    
    /// Время выполнения проверки
    pub duration: Duration,
    
    /// Дополнительные данные
    pub data: HashMap<String, serde_json::Value>,
    
    /// Время проверки
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl HealthCheckResult {
    /// Создать успешный результат
    pub fn healthy(message: impl Into<String>, duration: Duration) -> Self {
        Self {
            status: HealthStatus::Healthy,
            message: message.into(),
            duration,
            data: HashMap::new(),
            timestamp: chrono::Utc::now(),
        }
    }
    
    /// Создать результат с предупреждением
    pub fn warning(message: impl Into<String>, duration: Duration) -> Self {
        Self {
            status: HealthStatus::Warning,
            message: message.into(),
            duration,
            data: HashMap::new(),
            timestamp: chrono::Utc::now(),
        }
    }
    
    /// Создать неуспешный результат
    pub fn unhealthy(message: impl Into<String>, duration: Duration) -> Self {
        Self {
            status: HealthStatus::Unhealthy,
            message: message.into(),
            duration,
            data: HashMap::new(),
            timestamp: chrono::Utc::now(),
        }
    }
    
    /// Добавить данные
    pub fn with_data(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
        self.data.insert(key.into(), value);
        self
    }
}

/// Trait для health check провайдеров
#[async_trait::async_trait]
pub trait HealthCheck: Send + Sync {
    /// Имя проверки
    fn name(&self) -> &'static str;
    
    /// Выполнить проверку
    async fn check(&self) -> HealthCheckResult;
    
    /// Timeout для проверки (по умолчанию 30 секунд)
    fn timeout(&self) -> Duration {
        Duration::from_secs(30)
    }
    
    /// Критичность проверки (если true, то неуспех делает всю систему unhealthy)
    fn is_critical(&self) -> bool {
        true
    }
}

/// Health check для базы данных/файловой системы
pub struct DatabaseHealthCheck {
    // TODO: Добавить подключение к базе данных когда будет
}

impl DatabaseHealthCheck {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait::async_trait]
impl HealthCheck for DatabaseHealthCheck {
    fn name(&self) -> &'static str {
        "database"
    }
    
    async fn check(&self) -> HealthCheckResult {
        let start = Instant::now();
        
        // TODO: Проверить подключение к базе данных
        // Пока что проверяем файловую систему
        match std::fs::metadata("./") {
            Ok(metadata) => {
                if metadata.is_dir() {
                    HealthCheckResult::healthy(
                        "Filesystem accessible",
                        start.elapsed()
                    ).with_data("writable", serde_json::Value::Bool(true))
                } else {
                    HealthCheckResult::unhealthy(
                        "Current directory is not accessible",
                        start.elapsed()
                    )
                }
            },
            Err(e) => {
                HealthCheckResult::unhealthy(
                    format!("Filesystem error: {}", e),
                    start.elapsed()
                )
            }
        }
    }
}

/// Health check для памяти
pub struct MemoryHealthCheck {
    warning_threshold: f64, // Процент использования памяти для warning
    critical_threshold: f64, // Процент использования памяти для critical
}

impl MemoryHealthCheck {
    pub fn new() -> Self {
        Self {
            warning_threshold: 80.0,
            critical_threshold: 95.0,
        }
    }
    
    pub fn with_thresholds(warning: f64, critical: f64) -> Self {
        Self {
            warning_threshold: warning,
            critical_threshold: critical,
        }
    }
}

#[async_trait::async_trait]
impl HealthCheck for MemoryHealthCheck {
    fn name(&self) -> &'static str {
        "memory"
    }
    
    async fn check(&self) -> HealthCheckResult {
        let start = Instant::now();
        
        let mut system = sysinfo::System::new();
        system.refresh_memory();
        
        let total_memory = system.total_memory() as f64;
        let used_memory = system.used_memory() as f64;
        let usage_percent = (used_memory / total_memory) * 100.0;
        
        let result = if usage_percent > self.critical_threshold {
            HealthCheckResult::unhealthy(
                format!("Critical memory usage: {:.1}%", usage_percent),
                start.elapsed()
            )
        } else if usage_percent > self.warning_threshold {
            HealthCheckResult::warning(
                format!("High memory usage: {:.1}%", usage_percent),
                start.elapsed()
            )
        } else {
            HealthCheckResult::healthy(
                format!("Memory usage: {:.1}%", usage_percent),
                start.elapsed()
            )
        };
        
        result
            .with_data("total_bytes", serde_json::Value::Number(serde_json::Number::from(total_memory as u64)))
            .with_data("used_bytes", serde_json::Value::Number(serde_json::Number::from(used_memory as u64)))
            .with_data("usage_percent", serde_json::Value::Number(serde_json::Number::from_f64(usage_percent).unwrap_or_default()))
    }
}

/// Health check для плагинов
pub struct PluginHealthCheck {
    plugin_manager: Arc<PluginManager>,
}

impl PluginHealthCheck {
    pub fn new(plugin_manager: Arc<PluginManager>) -> Self {
        Self { plugin_manager }
    }
}

#[async_trait::async_trait]
impl HealthCheck for PluginHealthCheck {
    fn name(&self) -> &'static str {
        "plugins"
    }
    
    fn is_critical(&self) -> bool {
        false // Плагины не критичны для работы системы
    }
    
    async fn check(&self) -> HealthCheckResult {
        let start = Instant::now();
        
        let plugins = self.plugin_manager.list_loaded_plugins().await;
        let total_count = plugins.len();
        let active_count = plugins.iter()
            .filter(|p| matches!(p.1, crate::core::plugins::plugin::PluginState::Active))
            .count();
        
        let message = format!("Plugins: {}/{} active", active_count, total_count);
        
        let result = if active_count == total_count {
            HealthCheckResult::healthy(message, start.elapsed())
        } else if active_count > 0 {
            HealthCheckResult::warning(message, start.elapsed())
        } else {
            HealthCheckResult::warning("No active plugins".to_string(), start.elapsed())
        };
        
        result
            .with_data("total_plugins", serde_json::Value::Number(serde_json::Number::from(total_count)))
            .with_data("active_plugins", serde_json::Value::Number(serde_json::Number::from(active_count)))
    }
}

/// Health check для Event Bus
pub struct EventBusHealthCheck {
    event_bus: Arc<EventBus>,
}

impl EventBusHealthCheck {
    pub fn new(event_bus: Arc<EventBus>) -> Self {
        Self { event_bus }
    }
}

#[async_trait::async_trait]
impl HealthCheck for EventBusHealthCheck {
    fn name(&self) -> &'static str {
        "event_bus"
    }
    
    async fn check(&self) -> HealthCheckResult {
        let start = Instant::now();
        
        // Проверяем что event bus работает, отправив тестовое событие
        match self.event_bus.publish_app_event(crate::core::AppEvent::SystemHealthCheck {
            timestamp: chrono::Utc::now(),
        }).await {
            Ok(_) => {
                HealthCheckResult::healthy(
                    "Event bus is responding",
                    start.elapsed()
                )
            },
            Err(e) => {
                HealthCheckResult::unhealthy(
                    format!("Event bus error: {}", e),
                    start.elapsed()
                )
            }
        }
    }
}

/// Менеджер health checks
pub struct HealthCheckManager {
    checks: Arc<RwLock<HashMap<String, Box<dyn HealthCheck>>>>,
    cache: Arc<RwLock<HashMap<String, (HealthCheckResult, Instant)>>>,
    cache_duration: Duration,
}

impl HealthCheckManager {
    /// Создать новый менеджер
    pub fn new() -> Self {
        Self {
            checks: Arc::new(RwLock::new(HashMap::new())),
            cache: Arc::new(RwLock::new(HashMap::new())),
            cache_duration: Duration::from_secs(30), // Кэшируем на 30 секунд
        }
    }
    
    /// Добавить health check
    pub async fn add_check(&self, check: Box<dyn HealthCheck>) {
        let name = check.name().to_string();
        let mut checks = self.checks.write().await;
        checks.insert(name, check);
    }
    
    /// Удалить health check
    pub async fn remove_check(&self, name: &str) {
        let mut checks = self.checks.write().await;
        checks.remove(name);
        
        let mut cache = self.cache.write().await;
        cache.remove(name);
    }
    
    /// Выполнить все проверки
    pub async fn check_all(&self) -> HealthCheckSummary {
        let checks = self.checks.read().await;
        let mut results = HashMap::new();
        let mut overall_status = HealthStatus::Healthy;
        
        for (name, check) in checks.iter() {
            let result = self.check_single(name, check.as_ref()).await;
            
            // Обновляем общий статус
            if check.is_critical() {
                overall_status = overall_status.combine(result.status);
            } else if result.status == HealthStatus::Unhealthy {
                // Для некритичных проверок unhealthy становится warning
                overall_status = overall_status.combine(HealthStatus::Warning);
            } else {
                overall_status = overall_status.combine(result.status);
            }
            
            results.insert(name.clone(), result);
        }
        
        HealthCheckSummary {
            status: overall_status,
            checks: results,
            timestamp: chrono::Utc::now(),
        }
    }
    
    /// Выполнить конкретную проверку
    pub async fn check_one(&self, name: &str) -> Option<HealthCheckResult> {
        let checks = self.checks.read().await;
        if let Some(check) = checks.get(name) {
            Some(self.check_single(name, check.as_ref()).await)
        } else {
            None
        }
    }
    
    /// Выполнить проверку с кэшированием
    async fn check_single(&self, name: &str, check: &dyn HealthCheck) -> HealthCheckResult {
        // Проверяем кэш
        {
            let cache = self.cache.read().await;
            if let Some((result, timestamp)) = cache.get(name) {
                if timestamp.elapsed() < self.cache_duration {
                    return result.clone();
                }
            }
        }
        
        // Выполняем проверку с timeout
        let timeout = check.timeout();
        let result = match tokio::time::timeout(timeout, check.check()).await {
            Ok(result) => result,
            Err(_) => {
                HealthCheckResult::unhealthy(
                    format!("Health check '{}' timed out after {:?}", name, timeout),
                    timeout
                )
            }
        };
        
        // Сохраняем в кэш
        {
            let mut cache = self.cache.write().await;
            cache.insert(name.to_string(), (result.clone(), Instant::now()));
        }
        
        result
    }
    
    /// Получить список всех проверок
    pub async fn list_checks(&self) -> Vec<String> {
        let checks = self.checks.read().await;
        checks.keys().cloned().collect()
    }
    
    /// Очистить кэш
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
    }
}

/// Сводка health checks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckSummary {
    /// Общий статус
    pub status: HealthStatus,
    
    /// Результаты отдельных проверок
    pub checks: HashMap<String, HealthCheckResult>,
    
    /// Время проверки
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl HealthCheckSummary {
    /// Получить HTTP статус код
    pub fn http_status_code(&self) -> u16 {
        self.status.http_status_code()
    }
    
    /// Проверить готовность системы (для readiness probe)
    pub fn is_ready(&self) -> bool {
        matches!(self.status, HealthStatus::Healthy | HealthStatus::Warning)
    }
    
    /// Проверить жизнеспособность системы (для liveness probe)
    pub fn is_alive(&self) -> bool {
        self.status != HealthStatus::Unhealthy
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    struct TestHealthCheck {
        name: &'static str,
        result: HealthCheckResult,
    }
    
    impl TestHealthCheck {
        fn new(name: &'static str, status: HealthStatus) -> Self {
            Self {
                name,
                result: match status {
                    HealthStatus::Healthy => HealthCheckResult::healthy("Test", Duration::from_millis(1)),
                    HealthStatus::Warning => HealthCheckResult::warning("Test", Duration::from_millis(1)),
                    HealthStatus::Unhealthy => HealthCheckResult::unhealthy("Test", Duration::from_millis(1)),
                    HealthStatus::Unknown => HealthCheckResult {
                        status: HealthStatus::Unknown,
                        message: "Test".to_string(),
                        duration: Duration::from_millis(1),
                        data: HashMap::new(),
                        timestamp: chrono::Utc::now(),
                    },
                },
            }
        }
    }
    
    #[async_trait::async_trait]
    impl HealthCheck for TestHealthCheck {
        fn name(&self) -> &'static str {
            self.name
        }
        
        async fn check(&self) -> HealthCheckResult {
            self.result.clone()
        }
    }
    
    #[test]
    fn test_health_status_combine() {
        assert_eq!(
            HealthStatus::Healthy.combine(HealthStatus::Warning),
            HealthStatus::Warning
        );
        
        assert_eq!(
            HealthStatus::Warning.combine(HealthStatus::Unhealthy),
            HealthStatus::Unhealthy
        );
        
        assert_eq!(
            HealthStatus::Healthy.combine(HealthStatus::Healthy),
            HealthStatus::Healthy
        );
    }
    
    #[tokio::test]
    async fn test_health_check_manager() {
        let manager = HealthCheckManager::new();
        
        // Добавляем тестовые проверки
        manager.add_check(Box::new(
            TestHealthCheck::new("test1", HealthStatus::Healthy)
        )).await;
        
        manager.add_check(Box::new(
            TestHealthCheck::new("test2", HealthStatus::Warning)
        )).await;
        
        // Проверяем все
        let summary = manager.check_all().await;
        assert_eq!(summary.status, HealthStatus::Warning);
        assert_eq!(summary.checks.len(), 2);
        
        // Проверяем конкретную
        let result = manager.check_one("test1").await;
        assert!(result.is_some());
        assert_eq!(result.unwrap().status, HealthStatus::Healthy);
    }
}