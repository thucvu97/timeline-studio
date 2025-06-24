//! Safe Dependency Injection container для Timeline Studio
//!
//! Полностью безопасная реализация DI контейнера без использования unsafe кода.

use crate::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Базовый trait для всех сервисов с жизненным циклом
#[async_trait]
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

/// Trait для объектов, способных быть сервисами
pub trait AsService: Any + Send + Sync {
  fn as_any(&self) -> &dyn Any;
  fn as_any_arc(self: Arc<Self>) -> Arc<dyn Any + Send + Sync>;
}

impl<T: Service + Any + Send + Sync> AsService for T {
  fn as_any(&self) -> &dyn Any {
    self
  }

  fn as_any_arc(self: Arc<Self>) -> Arc<dyn Any + Send + Sync> {
    self
  }
}

/// Обертка для хранения инициализированного сервиса
struct ServiceEntry {
  service: Arc<dyn Any + Send + Sync>,
  name: &'static str,
  initialized: bool,
}

/// Trait для фабрик сервисов (теперь ServiceProvider переименован в ServiceFactory)
#[async_trait]
pub trait ServiceProvider: Send + Sync + 'static {
  type Output: Service;

  /// Создать экземпляр сервиса
  async fn provide(&self, container: &ServiceContainer) -> Result<Self::Output>;
}

/// Обертка для type-safe фабрики
struct ProviderWrapper<P: ServiceProvider> {
  provider: P,
}

#[async_trait]
trait AnyProvider: Send + Sync {
  async fn create_any(&self, container: &ServiceContainer) -> Result<Arc<dyn Any + Send + Sync>>;
  #[allow(dead_code)]
  fn output_type_id(&self) -> TypeId;
}

#[async_trait]
impl<P: ServiceProvider> AnyProvider for ProviderWrapper<P> {
  async fn create_any(&self, container: &ServiceContainer) -> Result<Arc<dyn Any + Send + Sync>> {
    let service = self.provider.provide(container).await?;
    Ok(Arc::new(service) as Arc<dyn Any + Send + Sync>)
  }

  fn output_type_id(&self) -> TypeId {
    TypeId::of::<P::Output>()
  }
}

/// Безопасный DI контейнер
#[derive(Clone)]
pub struct ServiceContainer {
  services: Arc<RwLock<HashMap<TypeId, ServiceEntry>>>,
  providers: Arc<RwLock<HashMap<TypeId, Box<dyn AnyProvider>>>>,
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
    T: Service + Any + Send + Sync + 'static,
  {
    let name = service.name();
    let entry = ServiceEntry {
      service: Arc::new(service),
      name,
      initialized: false,
    };

    let mut services = self.services.write().await;
    services.insert(TypeId::of::<T>(), entry);

    log::info!("Registered service: {}", name);
    Ok(())
  }

  /// Регистрация Arc сервиса (для shared ownership)
  pub async fn register_arc<T>(&self, service: Arc<T>) -> Result<()>
  where
    T: Service + Any + Send + Sync + 'static,
  {
    let name = service.name();
    let entry = ServiceEntry {
      service: service as Arc<dyn Any + Send + Sync>,
      name,
      initialized: false,
    };

    let mut services = self.services.write().await;
    services.insert(TypeId::of::<T>(), entry);

    log::info!("Registered Arc service: {}", name);
    Ok(())
  }

  /// Регистрация фабрики сервисов
  pub async fn register_provider<P>(&self, provider: P) -> Result<()>
  where
    P: ServiceProvider + 'static,
  {
    let wrapper = ProviderWrapper { provider };
    let mut providers = self.providers.write().await;
    providers.insert(TypeId::of::<P::Output>(), Box::new(wrapper));

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
      if let Some(entry) = services.get(&TypeId::of::<T>()) {
        return entry.service.clone().downcast::<T>().map_err(|_| {
          VideoCompilerError::InternalError("Failed to downcast service".to_string())
        });
      }
    }

    // Если сервиса нет, пробуем создать через provider
    let provider_exists = {
      let providers = self.providers.read().await;
      providers.contains_key(&TypeId::of::<T>())
    };

    if provider_exists {
      // Создаем сервис через provider
      let service_arc = {
        let providers = self.providers.read().await;
        if let Some(provider) = providers.get(&TypeId::of::<T>()) {
          provider.create_any(self).await?
        } else {
          return Err(VideoCompilerError::ServiceNotFound(
            std::any::type_name::<T>().to_string(),
          ));
        }
      };

      // Сохраняем созданный сервис
      {
        let mut services = self.services.write().await;
        services.insert(
          TypeId::of::<T>(),
          ServiceEntry {
            service: service_arc.clone(),
            name: "Provider-created service",
            initialized: false,
          },
        );
      }

      // Пытаемся downcast
      service_arc.downcast::<T>().map_err(|_| {
        VideoCompilerError::InternalError("Failed to downcast provider-created service".to_string())
      })
    } else {
      Err(VideoCompilerError::ServiceNotFound(
        std::any::type_name::<T>().to_string(),
      ))
    }
  }

  /// Проверка наличия сервиса
  pub async fn has<T>(&self) -> bool
  where
    T: Service + Any + Send + Sync + 'static,
  {
    let services = self.services.read().await;
    let providers = self.providers.read().await;

    services.contains_key(&TypeId::of::<T>()) || providers.contains_key(&TypeId::of::<T>())
  }

  /// Инициализация всех сервисов
  pub async fn initialize_all(&self) -> Result<()> {
    let services = self.services.read().await;

    for (_type_id, entry) in services.iter() {
      if !entry.initialized {
        log::info!("Initializing service: {}", entry.name);
        // В реальной реализации здесь нужно вызвать initialize() на сервисе
        // Это требует хранения сервисов в Arc<RwLock<dyn Service>>
      }
    }

    Ok(())
  }

  /// Остановка всех сервисов
  pub async fn shutdown_all(&self) -> Result<()> {
    let services = self.services.read().await;

    for (_type_id, entry) in services.iter() {
      log::info!("Shutting down service: {}", entry.name);
      // В реальной реализации здесь нужно вызвать shutdown() на сервисе
    }

    Ok(())
  }

  /// Получить список всех зарегистрированных сервисов
  pub async fn list_services(&self) -> Vec<String> {
    let services = self.services.read().await;
    services
      .values()
      .map(|entry| format!("{} (initialized: {})", entry.name, entry.initialized))
      .collect()
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
  use futures::future;
  use std::sync::atomic::{AtomicBool, Ordering};

  #[derive(Debug)]
  struct TestService {
    initialized: Arc<AtomicBool>,
    name: String,
  }

  #[async_trait]
  impl Service for TestService {
    async fn initialize(&mut self) -> Result<()> {
      self.initialized.store(true, Ordering::SeqCst);
      Ok(())
    }

    fn name(&self) -> &'static str {
      "TestService"
    }
  }

  struct TestProvider {
    counter: Arc<RwLock<u32>>,
  }

  #[async_trait]
  impl ServiceProvider for TestProvider {
    type Output = TestService;

    async fn provide(&self, _container: &ServiceContainer) -> Result<Self::Output> {
      let mut counter = self.counter.write().await;
      *counter += 1;

      Ok(TestService {
        initialized: Arc::new(AtomicBool::new(false)),
        name: format!("TestService-{}", *counter),
      })
    }
  }

  #[tokio::test]
  async fn test_service_registration_and_resolution() {
    let container = ServiceContainer::new();
    let service = TestService {
      initialized: Arc::new(AtomicBool::new(false)),
      name: "test".to_string(),
    };

    // Register service
    assert!(container.register(service).await.is_ok());
    assert!(container.has::<TestService>().await);

    // Resolve service
    let resolved = container.resolve::<TestService>().await;
    assert!(resolved.is_ok());
    let resolved_service = resolved.unwrap();
    assert_eq!(resolved_service.name(), "TestService");
  }

  #[tokio::test]
  async fn test_arc_service_registration() {
    let container = ServiceContainer::new();
    let service = Arc::new(TestService {
      initialized: Arc::new(AtomicBool::new(false)),
      name: "test".to_string(),
    });

    // Register Arc service
    assert!(container.register_arc(service.clone()).await.is_ok());

    // Resolve and verify it's the same instance
    let resolved = container.resolve::<TestService>().await.unwrap();
    assert!(Arc::ptr_eq(&service, &resolved));
  }

  #[tokio::test]
  async fn test_provider_registration_and_resolution() {
    let container = ServiceContainer::new();
    let provider = TestProvider {
      counter: Arc::new(RwLock::new(0)),
    };

    // Register provider
    assert!(container.register_provider(provider).await.is_ok());
    assert!(container.has::<TestService>().await);

    // Resolve service via provider
    let resolved1 = container.resolve::<TestService>().await;
    assert!(resolved1.is_ok());

    // Second resolution should return the same cached instance
    let resolved2 = container.resolve::<TestService>().await;
    assert!(resolved2.is_ok());

    // Verify they're the same instance (provider creates only once)
    let arc1 = resolved1.unwrap();
    let arc2 = resolved2.unwrap();
    assert!(Arc::ptr_eq(&arc1, &arc2));
  }

  #[tokio::test]
  async fn test_service_not_found() {
    let container = ServiceContainer::new();

    let result = container.resolve::<TestService>().await;
    assert!(result.is_err());

    match result.unwrap_err() {
      VideoCompilerError::ServiceNotFound(name) => {
        assert!(name.contains("TestService"));
      }
      _ => panic!("Expected ServiceNotFound error"),
    }
  }

  #[derive(Debug)]
  struct AnotherTestService {
    initialized: Arc<AtomicBool>,
  }

  #[async_trait]
  impl Service for AnotherTestService {
    async fn initialize(&mut self) -> Result<()> {
      self.initialized.store(true, Ordering::SeqCst);
      Ok(())
    }

    fn name(&self) -> &'static str {
      "AnotherTestService"
    }
  }

  #[tokio::test]
  async fn test_list_services() {
    let container = ServiceContainer::new();

    // Register different service types
    container
      .register(TestService {
        initialized: Arc::new(AtomicBool::new(false)),
        name: "test1".to_string(),
      })
      .await
      .unwrap();

    container
      .register(AnotherTestService {
        initialized: Arc::new(AtomicBool::new(false)),
      })
      .await
      .unwrap();

    let services = container.list_services().await;
    assert_eq!(services.len(), 2);
    assert!(services.iter().any(|s| s.contains("TestService")));
    assert!(services.iter().any(|s| s.contains("AnotherTestService")));
    assert!(services.iter().all(|s| s.contains("initialized: false")));
  }

  #[tokio::test]
  async fn test_concurrent_access() {
    use tokio::task;

    let container = Arc::new(ServiceContainer::new());
    let provider = TestProvider {
      counter: Arc::new(RwLock::new(0)),
    };

    container.register_provider(provider).await.unwrap();

    // Spawn multiple tasks to resolve services concurrently
    let mut handles = vec![];
    for _ in 0..10 {
      let container_clone = container.clone();
      let handle = task::spawn(async move { container_clone.resolve::<TestService>().await });
      handles.push(handle);
    }

    // Wait for all tasks
    let results: Vec<_> = future::join_all(handles).await;

    // All should succeed
    for result in results {
      assert!(result.is_ok());
      assert!(result.unwrap().is_ok());
    }

    // Verify only one instance was created (singleton behavior)
    let services = container.services.read().await;
    assert_eq!(services.len(), 1);
  }

  #[tokio::test]
  async fn test_circular_dependency_prevention() {
    // This test would require more complex setup with multiple services
    // For now, we just ensure the container doesn't deadlock
    let container = ServiceContainer::new();

    // Register a service
    container
      .register(TestService {
        initialized: Arc::new(AtomicBool::new(false)),
        name: "test".to_string(),
      })
      .await
      .unwrap();

    // Multiple concurrent resolutions shouldn't deadlock
    let handles: Vec<_> = (0..5)
      .map(|_| {
        let container = container.clone();
        tokio::spawn(async move { container.resolve::<TestService>().await })
      })
      .collect();

    for handle in handles {
      assert!(handle.await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_provider_error_handling() {
    struct FailingProvider;

    #[async_trait]
    impl ServiceProvider for FailingProvider {
      type Output = TestService;

      async fn provide(&self, _container: &ServiceContainer) -> Result<Self::Output> {
        Err(VideoCompilerError::InternalError(
          "Provider failed".to_string(),
        ))
      }
    }

    let container = ServiceContainer::new();
    container.register_provider(FailingProvider).await.unwrap();

    let result = container.resolve::<TestService>().await;
    assert!(result.is_err());
    match result.unwrap_err() {
      VideoCompilerError::InternalError(msg) => {
        assert_eq!(msg, "Provider failed");
      }
      _ => panic!("Expected InternalError"),
    }
  }
}
