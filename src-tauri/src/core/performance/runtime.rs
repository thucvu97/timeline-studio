//! Управление async runtime и worker pool для оптимизации производительности

use crate::video_compiler::error::{Result, VideoCompilerError};
use std::sync::Arc;
use tokio::sync::{Semaphore, RwLock};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use serde::{Serialize, Deserialize};

/// Конфигурация runtime
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeConfig {
    /// Количество worker потоков
    pub worker_threads: Option<usize>,
    
    /// Максимальное количество blocking потоков
    pub max_blocking_threads: Option<usize>,
    
    /// Интервал проверки состояния потоков
    pub thread_keep_alive: Duration,
    
    /// Размер стека для потоков
    pub thread_stack_size: Option<usize>,
    
    /// Имя prefix для потоков
    pub thread_name_prefix: String,
    
    /// Конфигурация task pools
    pub task_pools: HashMap<String, TaskPoolConfig>,
}

impl Default for RuntimeConfig {
    fn default() -> Self {
        let cpu_count = num_cpus::get();
        let mut task_pools = HashMap::new();
        
        // CPU-intensive tasks (для видео обработки)
        task_pools.insert("cpu_intensive".to_string(), TaskPoolConfig {
            max_concurrent_tasks: cpu_count,
            queue_size: Some(cpu_count * 4),
            priority: TaskPriority::High,
            timeout: Some(Duration::from_secs(300)), // 5 минут
        });
        
        // IO-bound tasks (для файловых операций)
        task_pools.insert("io_bound".to_string(), TaskPoolConfig {
            max_concurrent_tasks: cpu_count * 4,
            queue_size: Some(1000),
            priority: TaskPriority::Medium,
            timeout: Some(Duration::from_secs(60)),
        });
        
        // Background tasks (для фоновых операций)
        task_pools.insert("background".to_string(), TaskPoolConfig {
            max_concurrent_tasks: 2,
            queue_size: Some(100),
            priority: TaskPriority::Low,
            timeout: Some(Duration::from_secs(600)), // 10 минут
        });
        
        Self {
            worker_threads: Some(cpu_count),
            max_blocking_threads: Some(512),
            thread_keep_alive: Duration::from_secs(60),
            thread_stack_size: Some(2 * 1024 * 1024), // 2MB
            thread_name_prefix: "timeline-studio".to_string(),
            task_pools,
        }
    }
}

/// Конфигурация task pool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskPoolConfig {
    /// Максимальное количество одновременных задач
    pub max_concurrent_tasks: usize,
    
    /// Размер очереди (None = неограниченная)
    pub queue_size: Option<usize>,
    
    /// Приоритет задач
    pub priority: TaskPriority,
    
    /// Timeout для задач
    pub timeout: Option<Duration>,
}

/// Приоритет задач
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum TaskPriority {
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3,
}

/// Результат выполнения задачи
#[derive(Debug)]
pub struct TaskResult<T> {
    pub result: Result<T>,
    pub duration: Duration,
    pub pool_name: String,
}

/// Worker pool для управления задачами
pub struct WorkerPool {
    name: String,
    semaphore: Arc<Semaphore>,
    config: TaskPoolConfig,
    stats: Arc<RwLock<PoolStats>>,
}

/// Статистика pool
#[derive(Debug, Default)]
pub struct PoolStats {
    pub total_tasks: u64,
    pub completed_tasks: u64,
    pub failed_tasks: u64,
    pub active_tasks: u64,
    pub queue_length: u64,
    pub avg_execution_time: Duration,
    pub last_activity: Option<Instant>,
}

impl WorkerPool {
    /// Создать новый worker pool
    pub fn new(name: String, config: TaskPoolConfig) -> Self {
        let semaphore = Arc::new(Semaphore::new(config.max_concurrent_tasks));
        
        Self {
            name,
            semaphore,
            config,
            stats: Arc::new(RwLock::new(PoolStats::default())),
        }
    }
    
    /// Выполнить задачу в pool
    pub async fn execute<F, R>(&self, task: F) -> TaskResult<R>
    where
        F: std::future::Future<Output = Result<R>> + Send + 'static,
        R: Send + 'static,
    {
        let start = Instant::now();
        
        // Обновляем статистику - добавляем задачу
        {
            let mut stats = self.stats.write().await;
            stats.total_tasks += 1;
            stats.active_tasks += 1;
            stats.last_activity = Some(start);
        }
        
        // Получаем permit
        let _permit = self.semaphore.acquire().await
            .map_err(|_| VideoCompilerError::InternalError("Failed to acquire semaphore permit".to_string()))?;
        
        // Выполняем задачу с timeout если настроен
        let result = if let Some(timeout) = self.config.timeout {
            match tokio::time::timeout(timeout, task).await {
                Ok(result) => result,
                Err(_) => Err(VideoCompilerError::TimeoutError(
                    format!("Task in pool '{}' timed out after {:?}", self.name, timeout)
                )),
            }
        } else {
            task.await
        };
        
        let duration = start.elapsed();
        
        // Обновляем статистику - завершаем задачу
        {
            let mut stats = self.stats.write().await;
            stats.active_tasks -= 1;
            
            match &result {
                Ok(_) => stats.completed_tasks += 1,
                Err(_) => stats.failed_tasks += 1,
            }
            
            // Обновляем среднее время выполнения
            let total_completed = stats.completed_tasks + stats.failed_tasks;
            if total_completed > 0 {
                let total_time = stats.avg_execution_time.as_nanos() * (total_completed - 1) as u128 + duration.as_nanos();
                stats.avg_execution_time = Duration::from_nanos((total_time / total_completed as u128) as u64);
            }
        }
        
        TaskResult {
            result,
            duration,
            pool_name: self.name.clone(),
        }
    }
    
    /// Получить статистику pool
    pub async fn get_stats(&self) -> PoolStats {
        let stats = self.stats.read().await;
        PoolStats {
            total_tasks: stats.total_tasks,
            completed_tasks: stats.completed_tasks,
            failed_tasks: stats.failed_tasks,
            active_tasks: stats.active_tasks,
            queue_length: self.semaphore.available_permits() as u64,
            avg_execution_time: stats.avg_execution_time,
            last_activity: stats.last_activity,
        }
    }
    
    /// Получить имя pool
    pub fn name(&self) -> &str {
        &self.name
    }
    
    /// Получить конфигурацию
    pub fn config(&self) -> &TaskPoolConfig {
        &self.config
    }
}

/// Менеджер runtime и worker pools
pub struct RuntimeManager {
    pools: Arc<RwLock<HashMap<String, Arc<WorkerPool>>>>,
    config: RuntimeConfig,
}

impl RuntimeManager {
    /// Создать новый runtime manager
    pub fn new(config: RuntimeConfig) -> Self {
        let pools = Arc::new(RwLock::new(HashMap::new()));
        
        Self {
            pools,
            config,
        }
    }
    
    /// Инициализировать pools из конфигурации
    pub async fn initialize(&self) -> Result<()> {
        let mut pools = self.pools.write().await;
        
        for (name, pool_config) in &self.config.task_pools {
            let pool = Arc::new(WorkerPool::new(name.clone(), pool_config.clone()));
            pools.insert(name.clone(), pool);
            log::info!("Initialized worker pool '{}' with {} max concurrent tasks", 
                      name, pool_config.max_concurrent_tasks);
        }
        
        Ok(())
    }
    
    /// Получить pool по имени
    pub async fn get_pool(&self, name: &str) -> Option<Arc<WorkerPool>> {
        let pools = self.pools.read().await;
        pools.get(name).cloned()
    }
    
    /// Выполнить CPU-intensive задачу
    pub async fn execute_cpu_intensive<F, R>(&self, task: F) -> Result<TaskResult<R>>
    where
        F: std::future::Future<Output = Result<R>> + Send + 'static,
        R: Send + 'static,
    {
        let pool = self.get_pool("cpu_intensive").await
            .ok_or_else(|| VideoCompilerError::InternalError("CPU intensive pool not found".to_string()))?;
        
        Ok(pool.execute(task).await)
    }
    
    /// Выполнить IO-bound задачу
    pub async fn execute_io_bound<F, R>(&self, task: F) -> Result<TaskResult<R>>
    where
        F: std::future::Future<Output = Result<R>> + Send + 'static,
        R: Send + 'static,
    {
        let pool = self.get_pool("io_bound").await
            .ok_or_else(|| VideoCompilerError::InternalError("IO bound pool not found".to_string()))?;
        
        Ok(pool.execute(task).await)
    }
    
    /// Выполнить background задачу
    pub async fn execute_background<F, R>(&self, task: F) -> Result<TaskResult<R>>
    where
        F: std::future::Future<Output = Result<R>> + Send + 'static,
        R: Send + 'static,
    {
        let pool = self.get_pool("background").await
            .ok_or_else(|| VideoCompilerError::InternalError("Background pool not found".to_string()))?;
        
        Ok(pool.execute(task).await)
    }
    
    /// Добавить новый pool
    pub async fn add_pool(&self, name: String, config: TaskPoolConfig) -> Result<()> {
        let mut pools = self.pools.write().await;
        
        if pools.contains_key(&name) {
            return Err(VideoCompilerError::InvalidParameter(
                format!("Pool '{}' already exists", name)
            ));
        }
        
        let pool = Arc::new(WorkerPool::new(name.clone(), config));
        pools.insert(name.clone(), pool);
        
        log::info!("Added worker pool '{}'", name);
        Ok(())
    }
    
    /// Удалить pool
    pub async fn remove_pool(&self, name: &str) -> Result<()> {
        let mut pools = self.pools.write().await;
        
        if pools.remove(name).is_some() {
            log::info!("Removed worker pool '{}'", name);
            Ok(())
        } else {
            Err(VideoCompilerError::InvalidParameter(
                format!("Pool '{}' not found", name)
            ))
        }
    }
    
    /// Получить список всех pools
    pub async fn list_pools(&self) -> Vec<String> {
        let pools = self.pools.read().await;
        pools.keys().cloned().collect()
    }
    
    /// Получить сводную статистику всех pools
    pub async fn get_runtime_stats(&self) -> RuntimeStats {
        let pools = self.pools.read().await;
        let mut pool_stats = HashMap::new();
        
        for (name, pool) in pools.iter() {
            pool_stats.insert(name.clone(), pool.get_stats().await);
        }
        
        RuntimeStats {
            pool_stats,
            system_stats: get_system_stats(),
        }
    }
    
    /// Получить конфигурацию
    pub fn config(&self) -> &RuntimeConfig {
        &self.config
    }
}

/// Сводная статистика runtime
#[derive(Debug)]
pub struct RuntimeStats {
    pub pool_stats: HashMap<String, PoolStats>,
    pub system_stats: SystemStats,
}

/// Системная статистика
#[derive(Debug)]
pub struct SystemStats {
    pub cpu_count: usize,
    pub memory_usage: u64,
    pub total_memory: u64,
    pub load_average: f64,
    pub thread_count: usize,
}

/// Получить системную статистику
fn get_system_stats() -> SystemStats {
    let mut system = sysinfo::System::new();
    system.refresh_all();
    
    SystemStats {
        cpu_count: num_cpus::get(),
        memory_usage: system.used_memory(),
        total_memory: system.total_memory(),
        load_average: system.load_average().one,
        thread_count: std::thread::available_parallelism()
            .map(|p| p.get())
            .unwrap_or(1),
    }
}

/// Utilities для runtime оптимизации
pub mod utils {
    use super::*;
    
    /// Автоматически подобрать оптимальные настройки runtime
    pub fn auto_tune_runtime() -> RuntimeConfig {
        let cpu_count = num_cpus::get();
        let memory = get_system_stats().total_memory;
        
        // Базовая конфигурация
        let mut config = RuntimeConfig::default();
        
        // Настройка на основе количества CPU
        if cpu_count >= 16 {
            // Мощная система
            config.worker_threads = Some(cpu_count);
            config.max_blocking_threads = Some(1024);
            
            // Увеличиваем пулы для мощных систем
            if let Some(cpu_pool) = config.task_pools.get_mut("cpu_intensive") {
                cpu_pool.max_concurrent_tasks = cpu_count;
                cpu_pool.queue_size = Some(cpu_count * 8);
            }
            
            if let Some(io_pool) = config.task_pools.get_mut("io_bound") {
                io_pool.max_concurrent_tasks = cpu_count * 6;
                io_pool.queue_size = Some(2000);
            }
        } else if cpu_count >= 8 {
            // Средняя система
            config.worker_threads = Some(cpu_count);
            config.max_blocking_threads = Some(512);
        } else {
            // Слабая система - ограничиваем
            config.worker_threads = Some((cpu_count * 2).max(4));
            config.max_blocking_threads = Some(256);
            
            if let Some(cpu_pool) = config.task_pools.get_mut("cpu_intensive") {
                cpu_pool.max_concurrent_tasks = (cpu_count / 2).max(1);
            }
        }
        
        // Настройка на основе памяти
        let memory_gb = memory / (1024 * 1024 * 1024);
        if memory_gb >= 16 {
            // Много памяти - увеличиваем размеры очередей
            for pool in config.task_pools.values_mut() {
                if let Some(queue_size) = &mut pool.queue_size {
                    *queue_size *= 2;
                }
            }
        } else if memory_gb < 8 {
            // Мало памяти - уменьшаем
            for pool in config.task_pools.values_mut() {
                if let Some(queue_size) = &mut pool.queue_size {
                    *queue_size /= 2;
                }
            }
        }
        
        config
    }
    
    /// Создать оптимизированный runtime
    pub fn create_optimized_runtime() -> std::io::Result<tokio::runtime::Runtime> {
        let config = auto_tune_runtime();
        
        let mut builder = tokio::runtime::Builder::new_multi_thread();
        
        if let Some(worker_threads) = config.worker_threads {
            builder.worker_threads(worker_threads);
        }
        
        if let Some(max_blocking_threads) = config.max_blocking_threads {
            builder.max_blocking_threads(max_blocking_threads);
        }
        
        if let Some(stack_size) = config.thread_stack_size {
            builder.thread_stack_size(stack_size);
        }
        
        builder
            .thread_name(&config.thread_name_prefix)
            .thread_keep_alive(config.thread_keep_alive)
            .enable_all()
            .build()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    
    #[tokio::test]
    async fn test_worker_pool() {
        let config = TaskPoolConfig {
            max_concurrent_tasks: 2,
            queue_size: Some(10),
            priority: TaskPriority::Medium,
            timeout: Some(Duration::from_secs(1)),
        };
        
        let pool = WorkerPool::new("test".to_string(), config);
        
        // Выполняем простую задачу
        let result = pool.execute(async {
            tokio::time::sleep(Duration::from_millis(100)).await;
            Ok::<i32, VideoCompilerError>(42)
        }).await;
        
        assert!(result.result.is_ok());
        assert_eq!(result.result.unwrap(), 42);
        assert_eq!(result.pool_name, "test");
        
        // Проверяем статистику
        let stats = pool.get_stats().await;
        assert_eq!(stats.total_tasks, 1);
        assert_eq!(stats.completed_tasks, 1);
        assert_eq!(stats.failed_tasks, 0);
    }
    
    #[tokio::test]
    async fn test_runtime_manager() {
        let config = RuntimeConfig::default();
        let manager = RuntimeManager::new(config);
        
        manager.initialize().await.unwrap();
        
        // Проверяем что pools созданы
        let pools = manager.list_pools().await;
        assert!(pools.contains(&"cpu_intensive".to_string()));
        assert!(pools.contains(&"io_bound".to_string()));
        assert!(pools.contains(&"background".to_string()));
        
        // Выполняем задачу
        let result = manager.execute_cpu_intensive(async {
            Ok::<String, VideoCompilerError>("test".to_string())
        }).await.unwrap();
        
        assert!(result.result.is_ok());
        assert_eq!(result.result.unwrap(), "test");
    }
    
    #[test]
    fn test_auto_tune_runtime() {
        let config = utils::auto_tune_runtime();
        
        // Проверяем что настройки разумные
        assert!(config.worker_threads.unwrap() > 0);
        assert!(config.max_blocking_threads.unwrap() > 0);
        assert!(!config.task_pools.is_empty());
    }
}