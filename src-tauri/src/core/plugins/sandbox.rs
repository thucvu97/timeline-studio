//! Система sandboxing для изоляции плагинов

use crate::video_compiler::error::{Result, VideoCompilerError};
use super::permissions::{PluginPermissions, SecurityLevel};
use std::sync::Arc;
use std::time::{Duration, Instant};
use std::sync::atomic::{AtomicU64, AtomicBool, Ordering};
use tokio::sync::{Semaphore, RwLock};
use std::collections::HashMap;

/// Лимиты ресурсов для плагина
#[derive(Debug, Clone)]
pub struct ResourceLimits {
    /// Максимальная память (в байтах)
    pub max_memory: u64,
    
    /// Максимальное время выполнения команды
    pub max_execution_time: Duration,
    
    /// Максимальное количество одновременных операций
    pub max_concurrent_operations: usize,
    
    /// Максимальное количество файловых дескрипторов
    pub max_file_descriptors: usize,
    
    /// Максимальная частота вызовов API (запросов в секунду)
    pub max_api_calls_per_second: u32,
    
    /// Максимальное количество сетевых соединений
    pub max_network_connections: usize,
}

impl ResourceLimits {
    /// Создать лимиты по умолчанию для уровня безопасности
    pub fn for_security_level(level: SecurityLevel) -> Self {
        match level {
            SecurityLevel::Unrestricted => Self {
                max_memory: 1024 * 1024 * 1024, // 1GB
                max_execution_time: Duration::from_secs(300), // 5 минут
                max_concurrent_operations: 100,
                max_file_descriptors: 1000,
                max_api_calls_per_second: 1000,
                max_network_connections: 100,
            },
            SecurityLevel::Trusted => Self {
                max_memory: 256 * 1024 * 1024, // 256MB
                max_execution_time: Duration::from_secs(60), // 1 минута
                max_concurrent_operations: 50,
                max_file_descriptors: 100,
                max_api_calls_per_second: 100,
                max_network_connections: 10,
            },
            SecurityLevel::Sandboxed => Self {
                max_memory: 64 * 1024 * 1024, // 64MB
                max_execution_time: Duration::from_secs(30), // 30 секунд
                max_concurrent_operations: 10,
                max_file_descriptors: 20,
                max_api_calls_per_second: 50,
                max_network_connections: 5,
            },
            SecurityLevel::Restricted => Self {
                max_memory: 16 * 1024 * 1024, // 16MB
                max_execution_time: Duration::from_secs(10), // 10 секунд
                max_concurrent_operations: 5,
                max_file_descriptors: 10,
                max_api_calls_per_second: 10,
                max_network_connections: 1,
            },
        }
    }
}

/// Статистика использования ресурсов
#[derive(Debug, Default)]
pub struct ResourceUsage {
    /// Текущее использование памяти
    pub memory_used: AtomicU64,
    
    /// Пиковое использование памяти
    pub memory_peak: AtomicU64,
    
    /// Количество активных операций
    pub active_operations: AtomicU64,
    
    /// Общее количество API вызовов
    pub total_api_calls: AtomicU64,
    
    /// API вызовы в текущую секунду
    pub api_calls_current_second: AtomicU64,
    
    /// Время последнего сброса счетчика API
    pub last_api_reset: RwLock<Instant>,
    
    /// Количество активных сетевых соединений
    pub active_network_connections: AtomicU64,
    
    /// Флаг нарушения лимитов
    pub limits_violated: AtomicBool,
}

impl ResourceUsage {
    pub fn new() -> Self {
        Self {
            memory_used: AtomicU64::new(0),
            memory_peak: AtomicU64::new(0),
            active_operations: AtomicU64::new(0),
            total_api_calls: AtomicU64::new(0),
            api_calls_current_second: AtomicU64::new(0),
            last_api_reset: RwLock::new(Instant::now()),
            active_network_connections: AtomicU64::new(0),
            limits_violated: AtomicBool::new(false),
        }
    }
    
    /// Сбросить счетчики API если прошла секунда
    pub async fn reset_api_counters_if_needed(&self) {
        let mut last_reset = self.last_api_reset.write().await;
        if last_reset.elapsed() >= Duration::from_secs(1) {
            self.api_calls_current_second.store(0, Ordering::Relaxed);
            *last_reset = Instant::now();
        }
    }
}

/// Sandbox для изоляции плагина
pub struct PluginSandbox {
    plugin_id: String,
    limits: ResourceLimits,
    usage: Arc<ResourceUsage>,
    operation_semaphore: Arc<Semaphore>,
    network_semaphore: Arc<Semaphore>,
    
    /// Whitelist доменов для сетевых запросов
    allowed_domains: Vec<String>,
    
    /// Whitelist путей для файловых операций
    allowed_paths: Vec<std::path::PathBuf>,
}

impl PluginSandbox {
    /// Создать новый sandbox
    pub fn new(plugin_id: String, permissions: &PluginPermissions) -> Self {
        let limits = ResourceLimits::for_security_level(permissions.get_security_level());
        
        let operation_semaphore = Arc::new(Semaphore::new(limits.max_concurrent_operations));
        let network_semaphore = Arc::new(Semaphore::new(limits.max_network_connections));
        
        // Извлекаем разрешенные домены и пути из permissions
        let allowed_domains = permissions.network.allowed_domains.clone();
        let allowed_paths = permissions.file_system.allowed_paths.clone();
        
        Self {
            plugin_id,
            limits,
            usage: Arc::new(ResourceUsage::new()),
            operation_semaphore,
            network_semaphore,
            allowed_domains,
            allowed_paths,
        }
    }
    
    /// Проверить и зарезервировать ресурсы для операции
    pub async fn acquire_operation_permit(&self) -> Result<OperationGuard> {
        // Проверяем не нарушены ли уже лимиты
        if self.usage.limits_violated.load(Ordering::Relaxed) {
            return Err(VideoCompilerError::SecurityError(
                format!("Plugin '{}' has violated resource limits", self.plugin_id)
            ));
        }
        
        // Получаем разрешение на операцию
        let permit = self.operation_semaphore.acquire().await
            .map_err(|_| VideoCompilerError::InternalError("Failed to acquire operation permit".to_string()))?;
        
        // Увеличиваем счетчик активных операций
        self.usage.active_operations.fetch_add(1, Ordering::Relaxed);
        
        Ok(OperationGuard {
            sandbox: self,
            _permit: permit,
            start_time: Instant::now(),
        })
    }
    
    /// Проверить лимит API вызовов
    pub async fn check_api_rate_limit(&self) -> Result<()> {
        self.usage.reset_api_counters_if_needed().await;
        
        let current_calls = self.usage.api_calls_current_second.fetch_add(1, Ordering::Relaxed);
        
        if current_calls >= self.limits.max_api_calls_per_second as u64 {
            self.usage.limits_violated.store(true, Ordering::Relaxed);
            return Err(VideoCompilerError::SecurityError(
                format!("Plugin '{}' exceeded API rate limit", self.plugin_id)
            ));
        }
        
        self.usage.total_api_calls.fetch_add(1, Ordering::Relaxed);
        Ok(())
    }
    
    /// Проверить разрешение на доступ к файлу
    pub fn check_file_access(&self, path: &std::path::Path) -> Result<()> {
        // Если нет ограничений на файлы, разрешаем все
        if self.allowed_paths.is_empty() {
            return Ok(());
        }
        
        // Проверяем что путь находится в whitelist
        for allowed_path in &self.allowed_paths {
            if path.starts_with(allowed_path) {
                return Ok(());
            }
        }
        
        Err(VideoCompilerError::SecurityError(
            format!("Plugin '{}' attempted to access unauthorized path: {:?}", 
                   self.plugin_id, path)
        ))
    }
    
    /// Проверить разрешение на сетевой запрос
    pub async fn check_network_access(&self, domain: &str) -> Result<NetworkGuard> {
        // Проверяем домен в whitelist
        if !self.allowed_domains.is_empty() {
            let domain_allowed = self.allowed_domains.iter()
                .any(|allowed| domain.ends_with(allowed) || allowed == "*");
            
            if !domain_allowed {
                return Err(VideoCompilerError::SecurityError(
                    format!("Plugin '{}' attempted to access unauthorized domain: {}", 
                           self.plugin_id, domain)
                ));
            }
        }
        
        // Получаем разрешение на сетевое соединение
        let permit = self.network_semaphore.acquire().await
            .map_err(|_| VideoCompilerError::InternalError("Failed to acquire network permit".to_string()))?;
        
        self.usage.active_network_connections.fetch_add(1, Ordering::Relaxed);
        
        Ok(NetworkGuard {
            sandbox: self,
            _permit: permit,
        })
    }
    
    /// Обновить использование памяти
    pub fn update_memory_usage(&self, bytes: u64) -> Result<()> {
        let current_memory = self.usage.memory_used.load(Ordering::Relaxed);
        let new_memory = current_memory + bytes;
        
        if new_memory > self.limits.max_memory {
            self.usage.limits_violated.store(true, Ordering::Relaxed);
            return Err(VideoCompilerError::SecurityError(
                format!("Plugin '{}' exceeded memory limit: {} > {}", 
                       self.plugin_id, new_memory, self.limits.max_memory)
            ));
        }
        
        self.usage.memory_used.store(new_memory, Ordering::Relaxed);
        
        // Обновляем пик
        let current_peak = self.usage.memory_peak.load(Ordering::Relaxed);
        if new_memory > current_peak {
            self.usage.memory_peak.store(new_memory, Ordering::Relaxed);
        }
        
        Ok(())
    }
    
    /// Освободить память
    pub fn free_memory(&self, bytes: u64) {
        let current = self.usage.memory_used.load(Ordering::Relaxed);
        let new_value = current.saturating_sub(bytes);
        self.usage.memory_used.store(new_value, Ordering::Relaxed);
    }
    
    /// Получить текущую статистику использования
    pub async fn get_usage_stats(&self) -> SandboxStats {
        self.usage.reset_api_counters_if_needed().await;
        
        SandboxStats {
            plugin_id: self.plugin_id.clone(),
            memory_used: self.usage.memory_used.load(Ordering::Relaxed),
            memory_peak: self.usage.memory_peak.load(Ordering::Relaxed),
            memory_limit: self.limits.max_memory,
            active_operations: self.usage.active_operations.load(Ordering::Relaxed),
            operation_limit: self.limits.max_concurrent_operations as u64,
            total_api_calls: self.usage.total_api_calls.load(Ordering::Relaxed),
            api_calls_current_second: self.usage.api_calls_current_second.load(Ordering::Relaxed),
            api_rate_limit: self.limits.max_api_calls_per_second as u64,
            active_network_connections: self.usage.active_network_connections.load(Ordering::Relaxed),
            network_connection_limit: self.limits.max_network_connections as u64,
            limits_violated: self.usage.limits_violated.load(Ordering::Relaxed),
        }
    }
    
    /// Сбросить нарушения лимитов (для восстановления после устранения проблемы)
    pub fn reset_violation_flag(&self) {
        self.usage.limits_violated.store(false, Ordering::Relaxed);
    }
    
    /// Получить лимиты
    pub fn limits(&self) -> &ResourceLimits {
        &self.limits
    }
}

/// Guard для операций, автоматически освобождает ресурсы
pub struct OperationGuard<'a> {
    sandbox: &'a PluginSandbox,
    _permit: tokio::sync::SemaphorePermit<'a>,
    start_time: Instant,
}

impl<'a> Drop for OperationGuard<'a> {
    fn drop(&mut self) {
        // Уменьшаем счетчик активных операций
        self.sandbox.usage.active_operations.fetch_sub(1, Ordering::Relaxed);
        
        // Проверяем не превышено ли время выполнения
        let duration = self.start_time.elapsed();
        if duration > self.sandbox.limits.max_execution_time {
            log::warn!("Plugin '{}' operation exceeded time limit: {:?} > {:?}", 
                      self.sandbox.plugin_id, duration, self.sandbox.limits.max_execution_time);
            self.sandbox.usage.limits_violated.store(true, Ordering::Relaxed);
        }
    }
}

/// Guard для сетевых операций
pub struct NetworkGuard<'a> {
    sandbox: &'a PluginSandbox,
    _permit: tokio::sync::SemaphorePermit<'a>,
}

impl<'a> Drop for NetworkGuard<'a> {
    fn drop(&mut self) {
        self.sandbox.usage.active_network_connections.fetch_sub(1, Ordering::Relaxed);
    }
}

/// Статистика sandbox
#[derive(Debug, Clone)]
pub struct SandboxStats {
    pub plugin_id: String,
    pub memory_used: u64,
    pub memory_peak: u64,
    pub memory_limit: u64,
    pub active_operations: u64,
    pub operation_limit: u64,
    pub total_api_calls: u64,
    pub api_calls_current_second: u64,
    pub api_rate_limit: u64,
    pub active_network_connections: u64,
    pub network_connection_limit: u64,
    pub limits_violated: bool,
}

impl SandboxStats {
    /// Получить процент использования памяти
    pub fn memory_usage_percent(&self) -> f64 {
        if self.memory_limit == 0 {
            0.0
        } else {
            (self.memory_used as f64 / self.memory_limit as f64) * 100.0
        }
    }
    
    /// Получить процент использования операций
    pub fn operation_usage_percent(&self) -> f64 {
        if self.operation_limit == 0 {
            0.0
        } else {
            (self.active_operations as f64 / self.operation_limit as f64) * 100.0
        }
    }
    
    /// Получить процент использования API rate limit
    pub fn api_rate_usage_percent(&self) -> f64 {
        if self.api_rate_limit == 0 {
            0.0
        } else {
            (self.api_calls_current_second as f64 / self.api_rate_limit as f64) * 100.0
        }
    }
}

/// Менеджер sandbox для всех плагинов
pub struct SandboxManager {
    sandboxes: Arc<RwLock<HashMap<String, Arc<PluginSandbox>>>>,
}

impl SandboxManager {
    /// Создать новый менеджер sandbox
    pub fn new() -> Self {
        Self {
            sandboxes: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Создать sandbox для плагина
    pub async fn create_sandbox(&self, plugin_id: String, permissions: &PluginPermissions) -> Arc<PluginSandbox> {
        let sandbox = Arc::new(PluginSandbox::new(plugin_id.clone(), permissions));
        
        let mut sandboxes = self.sandboxes.write().await;
        sandboxes.insert(plugin_id.clone(), sandbox.clone());
        
        log::info!("Created sandbox for plugin '{}'", plugin_id);
        sandbox
    }
    
    /// Получить sandbox плагина
    pub async fn get_sandbox(&self, plugin_id: &str) -> Option<Arc<PluginSandbox>> {
        let sandboxes = self.sandboxes.read().await;
        sandboxes.get(plugin_id).cloned()
    }
    
    /// Удалить sandbox плагина
    pub async fn remove_sandbox(&self, plugin_id: &str) -> bool {
        let mut sandboxes = self.sandboxes.write().await;
        if sandboxes.remove(plugin_id).is_some() {
            log::info!("Removed sandbox for plugin '{}'", plugin_id);
            true
        } else {
            false
        }
    }
    
    /// Получить статистику всех sandbox
    pub async fn get_all_stats(&self) -> Vec<SandboxStats> {
        let sandboxes = self.sandboxes.read().await;
        let mut stats = Vec::new();
        
        for sandbox in sandboxes.values() {
            stats.push(sandbox.get_usage_stats().await);
        }
        
        stats
    }
    
    /// Найти плагины, нарушившие лимиты
    pub async fn get_violating_plugins(&self) -> Vec<String> {
        let sandboxes = self.sandboxes.read().await;
        let mut violators = Vec::new();
        
        for (plugin_id, sandbox) in sandboxes.iter() {
            if sandbox.usage.limits_violated.load(Ordering::Relaxed) {
                violators.push(plugin_id.clone());
            }
        }
        
        violators
    }
}

impl Default for SandboxManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::plugins::permissions::{FileSystemPermissions, NetworkPermissions};
    
    #[tokio::test]
    async fn test_sandbox_creation() {
        let permissions = PluginPermissions {
            file_system: FileSystemPermissions::default(),
            network: NetworkPermissions::default(),
            ui_access: false,
            system_info: false,
            process_spawn: false,
        };
        
        let sandbox = PluginSandbox::new("test_plugin".to_string(), &permissions);
        
        assert_eq!(sandbox.plugin_id, "test_plugin");
        assert!(!sandbox.usage.limits_violated.load(Ordering::Relaxed));
    }
    
    #[tokio::test]
    async fn test_operation_permit() {
        let permissions = PluginPermissions::default();
        let sandbox = PluginSandbox::new("test".to_string(), &permissions);
        
        let _guard = sandbox.acquire_operation_permit().await.unwrap();
        assert_eq!(sandbox.usage.active_operations.load(Ordering::Relaxed), 1);
        
        // Guard автоматически освободится при drop
    }
    
    #[tokio::test]
    async fn test_api_rate_limit() {
        let permissions = PluginPermissions::default();
        let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);
        sandbox.limits.max_api_calls_per_second = 2;
        
        // Первые два вызова должны пройти
        sandbox.check_api_rate_limit().await.unwrap();
        sandbox.check_api_rate_limit().await.unwrap();
        
        // Третий должен вызвать ошибку
        let result = sandbox.check_api_rate_limit().await;
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_memory_limits() {
        let permissions = PluginPermissions::default();
        let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);
        sandbox.limits.max_memory = 1000;
        
        // Нормальное использование памяти
        sandbox.update_memory_usage(500).unwrap();
        assert_eq!(sandbox.usage.memory_used.load(Ordering::Relaxed), 500);
        
        // Превышение лимита
        let result = sandbox.update_memory_usage(600);
        assert!(result.is_err());
        assert!(sandbox.usage.limits_violated.load(Ordering::Relaxed));
    }
}