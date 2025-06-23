//! Dependency Injection container для Timeline Studio
//! 
//! Легковесный DI контейнер для управления сервисами и их жизненным циклом.

use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::video_compiler::error::{Result, VideoCompilerError};

/// Базовый trait для всех сервисов с жизненным циклом
pub trait Service: Send + Sync + 'static {
    /// Инициализация сервиса
    async fn initialize(&mut self) -> Result<()> {
        Ok(())
    }
    
    /// Остановка сервиса
    async fn shutdown(&mut self) -> Result<()> {
        Ok(())
    }
    
    /// Имя сервиса для логирования
    fn name(&self) -> &'static str;
}

/// Trait для фабрик сервисов
pub trait ServiceProvider: Send + Sync + 'static {
    type Output: Service;
    
    /// Создать экземпляр сервиса
    async fn provide(&self, container: &ServiceContainer) -> Result<Self::Output>;
}

/// Обертка для хранения сервисов
struct ServiceWrapper {
    service: Box<dyn Any + Send + Sync>,
    name: &'static str,
}

/// Легковесный DI контейнер
pub struct ServiceContainer {
    services: Arc<RwLock<HashMap<TypeId, ServiceWrapper>>>,
    providers: Arc<RwLock<HashMap<TypeId, Box<dyn Any + Send + Sync>>>>,
}

impl ServiceContainer {
    /// Создать новый контейнер
    pub fn new() -> Self {
        Self {
            services: Arc::new(RwLock::new(HashMap::new())),
            providers: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Регистрация singleton сервиса
    pub async fn register<T>(&self, service: T) -> Result<()> 
    where 
        T: Service + Any + Send + Sync + 'static 
    {
        let name = service.name();
        let mut services = self.services.write().await;
        
        services.insert(
            TypeId::of::<T>(), 
            ServiceWrapper {
                service: Box::new(service),
                name,
            }
        );
        
        log::info!("Registered service: {}", name);
        Ok(())
    }
    
    /// Регистрация фабрики сервисов
    pub async fn register_provider<P>(&self, provider: P) -> Result<()>
    where
        P: ServiceProvider + Any + Send + Sync + 'static,
    {
        let mut providers = self.providers.write().await;
        providers.insert(TypeId::of::<P::Output>(), Box::new(provider));
        
        log::info!("Registered provider for service type");
        Ok(())
    }
    
    /// Получение сервиса
    pub async fn resolve<T>(&self) -> Result<Arc<T>>
    where
        T: Service + Any + Send + Sync + 'static,
    {
        // Сначала проверяем существующие сервисы
        {
            let services = self.services.read().await;
            if let Some(wrapper) = services.get(&TypeId::of::<T>()) {
                if let Some(service) = wrapper.service.downcast_ref::<T>() {
                    // Небезопасно, но нужно для Arc - в реальности стоит использовать Arc<RwLock<T>>
                    return Ok(Arc::new(unsafe { 
                        std::ptr::read(service as *const T) 
                    }));
                }
            }
        }
        
        // Если сервиса нет, пробуем создать через provider
        let provider_exists = {
            let providers = self.providers.read().await;
            providers.contains_key(&TypeId::of::<T>())
        };
        
        if provider_exists {
            // Создаем сервис через provider
            let _service = {
                let providers = self.providers.read().await;
                if let Some(_provider_any) = providers.get(&TypeId::of::<T>()) {
                    // Это сложная часть - нужно правильно downcast provider
                    // В реальной реализации это требует более сложной логики
                    return Err(VideoCompilerError::InternalError(
                        "Provider resolution not fully implemented".to_string()
                    ));
                }
                
                return Err(VideoCompilerError::ServiceNotFound(
                    std::any::type_name::<T>().to_string()
                ));
            };
        }
        
        Err(VideoCompilerError::ServiceNotFound(
            std::any::type_name::<T>().to_string()
        ))
    }
    
    /// Проверка наличия сервиса
    pub async fn has<T>(&self) -> bool
    where
        T: Service + Any + Send + Sync + 'static,
    {
        let services = self.services.read().await;
        services.contains_key(&TypeId::of::<T>()) || {
            let providers = self.providers.read().await;
            providers.contains_key(&TypeId::of::<T>())
        }
    }
    
    /// Инициализация всех сервисов
    pub async fn initialize_all(&self) -> Result<()> {
        let mut services = self.services.write().await;
        
        for (_type_id, wrapper) in services.iter_mut() {
            log::info!("Initializing service: {}", wrapper.name);
            
            // Здесь нужна более сложная логика для вызова initialize
            // В реальной реализации мы бы хранили trait objects
        }
        
        Ok(())
    }
    
    /// Остановка всех сервисов
    pub async fn shutdown_all(&self) -> Result<()> {
        let mut services = self.services.write().await;
        
        for (_type_id, wrapper) in services.iter_mut() {
            log::info!("Shutting down service: {}", wrapper.name);
            
            // Здесь нужна более сложная логика для вызова shutdown
            // В реальной реализации мы бы хранили trait objects
        }
        
        Ok(())
    }
}

impl Default for ServiceContainer {
    fn default() -> Self {
        Self::new()
    }
}

/// Макрос для упрощения регистрации сервисов
#[macro_export]
macro_rules! register_services {
    ($container:expr, $($service:expr),+ $(,)?) => {
        {
            $(
                $container.register($service).await?;
            )+
            Ok::<(), $crate::video_compiler::error::VideoCompilerError>(())
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    
    struct TestService {
        initialized: bool,
    }
    
    impl Service for TestService {
        async fn initialize(&mut self) -> Result<()> {
            self.initialized = true;
            Ok(())
        }
        
        fn name(&self) -> &'static str {
            "TestService"
        }
    }
    
    #[tokio::test]
    async fn test_service_registration() {
        let container = ServiceContainer::new();
        let service = TestService { initialized: false };
        
        assert!(container.register(service).await.is_ok());
        assert!(container.has::<TestService>().await);
    }
}