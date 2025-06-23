//! Пример использования DI Container в Timeline Studio
//! 
//! Демонстрирует как использовать ServiceContainer для управления зависимостями

use timeline_studio_lib::core::{ServiceContainer, Service, EventBus};
use timeline_studio_lib::security::api_validator_service::ApiValidatorService;
use timeline_studio_lib::video_compiler::error::Result;
use std::sync::Arc;
use async_trait::async_trait;

/// Пример кастомного сервиса - менеджер кэша
struct CacheManagerService {
    cache_dir: String,
    max_size_mb: u64,
    initialized: bool,
}

impl CacheManagerService {
    fn new(cache_dir: String, max_size_mb: u64) -> Self {
        Self {
            cache_dir,
            max_size_mb,
            initialized: false,
        }
    }
    
    async fn clear_cache(&self) -> Result<()> {
        log::info!("Clearing cache in: {}", self.cache_dir);
        // Логика очистки кэша
        Ok(())
    }
    
    async fn get_cache_size(&self) -> Result<u64> {
        // Логика подсчета размера кэша
        Ok(1024) // Возвращаем тестовое значение
    }
}

#[async_trait]
impl Service for CacheManagerService {
    async fn initialize(&mut self) -> Result<()> {
        log::info!("Initializing Cache Manager: {} (max {}MB)", 
                   self.cache_dir, self.max_size_mb);
        
        // Создаем директорию кэша если не существует
        tokio::fs::create_dir_all(&self.cache_dir).await
            .map_err(|e| timeline_studio_lib::video_compiler::error::VideoCompilerError::IoError(e.to_string()))?;
        
        self.initialized = true;
        Ok(())
    }
    
    async fn shutdown(&mut self) -> Result<()> {
        log::info!("Shutting down Cache Manager");
        self.initialized = false;
        Ok(())
    }
    
    fn name(&self) -> &'static str {
        "CacheManagerService"
    }
}

/// Пример сервиса мониторинга производительности
struct PerformanceMonitorService {
    event_bus: Arc<EventBus>,
    check_interval_secs: u64,
}

impl PerformanceMonitorService {
    fn new(event_bus: Arc<EventBus>, check_interval_secs: u64) -> Self {
        Self {
            event_bus,
            check_interval_secs,
        }
    }
    
    async fn start_monitoring(&self) {
        log::info!("Starting performance monitoring every {} seconds", self.check_interval_secs);
        
        // В реальном приложении здесь был бы цикл мониторинга
        let memory_usage = 75.5; // Симулируем использование памяти
        
        if memory_usage > 80.0 {
            let _ = self.event_bus.publish_app_event(
                timeline_studio_lib::core::AppEvent::MemoryWarning {
                    usage_percent: memory_usage as f32,
                }
            ).await;
        }
    }
}

#[async_trait]
impl Service for PerformanceMonitorService {
    async fn initialize(&mut self) -> Result<()> {
        log::info!("Initializing Performance Monitor");
        self.start_monitoring().await;
        Ok(())
    }
    
    fn name(&self) -> &'static str {
        "PerformanceMonitorService"
    }
}

/// Главный пример приложения с DI
struct Application {
    container: ServiceContainer,
    event_bus: Arc<EventBus>,
}

impl Application {
    async fn new() -> Result<Self> {
        // Создаем основные компоненты
        let container = ServiceContainer::new();
        let event_bus = Arc::new(EventBus::new());
        
        Ok(Self {
            container,
            event_bus,
        })
    }
    
    async fn configure_services(&self) -> Result<()> {
        log::info!("Configuring application services...");
        
        // 1. Регистрируем API Validator Service
        let api_validator = ApiValidatorService::new()
            .with_event_bus(self.event_bus.clone());
        self.container.register(api_validator).await?;
        
        // 2. Регистрируем Cache Manager
        let cache_manager = CacheManagerService::new(
            "/tmp/timeline-studio-cache".to_string(),
            1024, // 1GB max
        );
        self.container.register(cache_manager).await?;
        
        // 3. Регистрируем Performance Monitor
        let perf_monitor = PerformanceMonitorService::new(
            self.event_bus.clone(),
            60, // Проверка каждые 60 секунд
        );
        self.container.register(perf_monitor).await?;
        
        log::info!("All services registered successfully");
        Ok(())
    }
    
    async fn initialize(&self) -> Result<()> {
        log::info!("Initializing application...");
        
        // Запускаем обработчик событий
        self.event_bus.start_app_event_processor().await;
        
        // Инициализируем все сервисы
        self.container.initialize_all().await?;
        
        log::info!("Application initialized successfully");
        Ok(())
    }
    
    async fn run(&self) -> Result<()> {
        log::info!("Application is running...");
        
        // Пример использования сервисов
        
        // Проверяем наличие сервисов
        if self.container.has::<ApiValidatorService>().await {
            log::info!("✅ API Validator Service is available");
        }
        
        if self.container.has::<CacheManagerService>().await {
            log::info!("✅ Cache Manager Service is available");
        }
        
        if self.container.has::<PerformanceMonitorService>().await {
            log::info!("✅ Performance Monitor Service is available");
        }
        
        // Симулируем работу приложения
        log::info!("Simulating application work...");
        
        // Публикуем тестовые события
        self.event_bus.publish_app_event(
            timeline_studio_lib::core::AppEvent::SystemStartup
        ).await?;
        
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        
        self.event_bus.publish_app_event(
            timeline_studio_lib::core::AppEvent::ProjectCreated {
                project_id: "demo-project".to_string(),
            }
        ).await?;
        
        Ok(())
    }
    
    async fn shutdown(&self) -> Result<()> {
        log::info!("Shutting down application...");
        
        // Останавливаем все сервисы
        self.container.shutdown_all().await?;
        
        log::info!("Application shut down successfully");
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Инициализация логирования
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .init();
    
    println!("🚀 DI Container Example\n");
    
    // Создаем и запускаем приложение
    let app = Application::new().await?;
    
    // Конфигурируем сервисы
    app.configure_services().await?;
    
    // Инициализируем приложение
    app.initialize().await?;
    
    // Запускаем основную логику
    app.run().await?;
    
    // Ждем немного для демонстрации
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    
    // Корректно завершаем работу
    app.shutdown().await?;
    
    println!("\n✨ DI Container Example Completed");
    
    Ok(())
}

/// Пример более сложного сценария с зависимостями между сервисами
mod advanced {
    use super::*;
    
    /// Сервис базы данных
    struct DatabaseService {
        connection_string: String,
    }
    
    #[async_trait]
    impl Service for DatabaseService {
        async fn initialize(&mut self) -> Result<()> {
            log::info!("Connecting to database: {}", self.connection_string);
            Ok(())
        }
        
        fn name(&self) -> &'static str {
            "DatabaseService"
        }
    }
    
    /// Сервис который зависит от DatabaseService
    struct UserService {
        // В реальном приложении здесь был бы Arc<DatabaseService>
        db_available: bool,
    }
    
    impl UserService {
        async fn create_with_dependencies(container: &ServiceContainer) -> Result<Self> {
            // Проверяем наличие зависимости
            let db_available = container.has::<DatabaseService>().await;
            
            if !db_available {
                return Err(timeline_studio_lib::video_compiler::error::VideoCompilerError::ServiceNotFound(
                    "DatabaseService required for UserService".to_string()
                ));
            }
            
            Ok(Self { db_available })
        }
    }
    
    #[async_trait]
    impl Service for UserService {
        async fn initialize(&mut self) -> Result<()> {
            log::info!("Initializing User Service (DB available: {})", self.db_available);
            Ok(())
        }
        
        fn name(&self) -> &'static str {
            "UserService"
        }
    }
}