# Тестирование и улучшение архитектуры Backend

## 📋 Обзор

Комплексная задача по улучшению тестового покрытия и исправлению архитектурных проблем в Rust backend Timeline Studio после завершения Phase 2 рефакторинга.

### Текущее состояние
- ✅ Phase 2 рефакторинга завершена (DI, Events, Plugins, Telemetry, Performance)
- ⚠️ Выявлены критические проблемы в реализации DI
- 📉 Низкое покрытие тестами core модулей
- 🏗️ Необходима стандартизация тестовой инфраструктуры

### Цели
1. **Исправить критические проблемы** - убрать unsafe код, завершить реализацию
2. **Увеличить покрытие тестами** - минимум 80% для core модулей
3. **Создать тестовую инфраструктуру** - переиспользуемые моки и утилиты
4. **Документировать best practices** - единый подход к тестированию

## 🔍 Анализ выявленных проблем

### 1. Проблемы в DI контейнере (`src/core/di.rs`)

#### Критические issue:
```rust
// Строка 101 - UNSAFE код!
return Ok(Arc::new(unsafe { std::ptr::read(service as *const T) }));
```

**Проблема:** Использование unsafe для создания Arc приводит к undefined behavior
**Решение:** Изменить архитектуру на хранение Arc<dyn Service> изначально

#### Незавершенная реализация:
```rust
// Строка 119-121
return Err(VideoCompilerError::InternalError(
    "Provider resolution not fully implemented".to_string(),
));
```

**Проблема:** ServiceProvider паттерн не реализован
**Решение:** Полная реализация с type-safe downcast

### 2. Отсутствие интеграции

```rust
// src/core/mod.rs - все импорты помечены как unused
#[allow(unused_imports)]
pub use di::{Service, ServiceContainer, ServiceProvider};
```

**Проблема:** Core модули не интегрированы в основное приложение
**Решение:** Подключить DI контейнер в main.rs и использовать для сервисов

### 3. Недостаточное тестовое покрытие

**Текущее состояние:**
- `di.rs` - только 1 базовый тест
- `events.rs` - тесты отсутствуют
- `plugins/*` - тесты отсутствуют
- `telemetry/*` - тесты отсутствуют
- `performance/*` - тесты отсутствуют

## 📐 План тестирования

### Фаза 1: Исправление критических проблем DI (Приоритет: Критический)
**Срок:** 1 неделя

#### 1.1 Рефакторинг DI контейнера
```rust
// Новая архитектура
pub struct ServiceContainer {
    services: Arc<RwLock<HashMap<TypeId, Arc<dyn Any + Send + Sync>>>>,
    providers: Arc<RwLock<HashMap<TypeId, Box<dyn ServiceFactory>>>>,
}

trait ServiceFactory: Send + Sync {
    fn create(&self, container: &ServiceContainer) -> Box<dyn Any + Send + Sync>;
}
```

#### 1.2 Реализация безопасного resolve
- Type-safe downcast через Any trait
- Proper error handling
- Lifecycle management (init/shutdown)

#### 1.3 Тесты для DI
- [ ] test_service_registration_and_resolution
- [ ] test_provider_pattern
- [ ] test_service_lifecycle
- [ ] test_circular_dependencies
- [ ] test_concurrent_access
- [ ] test_error_cases

### Фаза 2: Создание тестовой инфраструктуры (Приоритет: Высокий)
**Срок:** 1 неделя

#### 2.1 Создание `src-tauri/src/core/test_utils.rs`
```rust
pub mod test_utils {
    // Mock implementations
    pub struct MockService { ... }
    pub struct MockEventBus { ... }
    pub struct MockPluginManager { ... }
    
    // Test fixtures
    pub fn create_test_container() -> ServiceContainer { ... }
    pub fn create_test_event_bus() -> EventBus { ... }
    
    // Assertions
    pub fn assert_service_initialized<T: Service>(service: &T) { ... }
}
```

#### 2.2 Интеграционные тесты
- [ ] DI + Events integration
- [ ] DI + Plugins integration
- [ ] Full system initialization test
- [ ] Graceful shutdown test

### Фаза 3: Unit тесты для core модулей (Приоритет: Высокий)
**Срок:** 2 недели

#### 3.1 Event System (`events.rs`)
- [ ] test_event_registration
- [ ] test_event_dispatch
- [ ] test_async_handlers
- [ ] test_event_priority
- [ ] test_event_cancellation

#### 3.2 Plugin System (`plugins/*`)
- [ ] test_plugin_loading
- [ ] test_plugin_lifecycle
- [ ] test_permission_system
- [ ] test_sandbox_isolation
- [ ] test_wasm_execution

#### 3.3 Telemetry (`telemetry/*`)
- [ ] test_metrics_collection
- [ ] test_trace_generation
- [ ] test_export_pipeline
- [ ] test_sampling_logic

#### 3.4 Performance (`performance/*`)
- [ ] test_memory_pools
- [ ] test_cache_eviction
- [ ] test_zero_copy_operations
- [ ] test_resource_limits

### Фаза 4: GPU тестирование (Приоритет: Средний)
**Срок:** 1 неделя

#### 4.1 GPU Detection тесты
```rust
#[cfg(test)]
mod gpu_tests {
    use super::*;
    use crate::video_compiler::tests::mocks::MockFFmpeg;
    
    #[test]
    fn test_nvenc_detection() {
        let mock_ffmpeg = MockFFmpeg::with_encoders(vec!["h264_nvenc"]);
        let detector = GpuDetector::new(mock_ffmpeg);
        assert_eq!(detector.detect(), GpuEncoder::Nvenc);
    }
}
```

#### 4.2 Performance benchmarks
- [ ] CPU vs GPU encoding speed
- [ ] Memory usage comparison
- [ ] Multi-GPU load balancing

### Фаза 5: Документация и стандарты (Приоритет: Средний)
**Срок:** 1 неделя

#### 5.1 Testing Guidelines (`docs-ru/testing-guidelines.md`)
- Структура тестов
- Naming conventions
- Mock strategies
- Coverage requirements

#### 5.2 Architecture Documentation
- DI patterns и примеры
- Service lifecycle диаграммы
- Integration guidelines

## 🎯 Метрики успеха

### Покрытие тестами
- **Core модули:** ≥ 80%
- **Video compiler:** ≥ 70%
- **Критические пути:** 100%

### Производительность
- **DI container resolve:** < 1μs
- **Event dispatch:** < 10μs
- **Memory overhead:** < 5%

### Качество кода
- **Unsafe blocks:** 0 в core модулях
- **Clippy warnings:** 0
- **Documentation coverage:** 100% для public API

## 🔧 Технические детали реализации

### Исправленный DI контейнер

```rust
use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct ServiceContainer {
    services: Arc<RwLock<HashMap<TypeId, ServiceEntry>>>,
}

struct ServiceEntry {
    service: Arc<dyn Any + Send + Sync>,
    metadata: ServiceMetadata,
}

struct ServiceMetadata {
    name: &'static str,
    initialized: bool,
}

impl ServiceContainer {
    pub async fn register<T>(&self, service: T) -> Result<()>
    where
        T: Service + Any + Send + Sync + 'static,
    {
        let entry = ServiceEntry {
            service: Arc::new(service),
            metadata: ServiceMetadata {
                name: T::NAME,
                initialized: false,
            },
        };
        
        let mut services = self.services.write().await;
        services.insert(TypeId::of::<T>(), entry);
        Ok(())
    }
    
    pub async fn resolve<T>(&self) -> Result<Arc<T>>
    where
        T: Service + Any + Send + Sync + 'static,
    {
        let services = self.services.read().await;
        
        services
            .get(&TypeId::of::<T>())
            .and_then(|entry| entry.service.clone().downcast::<T>().ok())
            .ok_or_else(|| VideoCompilerError::ServiceNotFound(
                std::any::type_name::<T>().to_string()
            ))
    }
}
```

### Mock фреймворк для тестов

```rust
pub mod mocks {
    use super::*;
    use mockall::automock;
    
    #[automock]
    pub trait TestService: Service {
        fn do_work(&self) -> String;
    }
    
    pub fn create_mock_container() -> ServiceContainer {
        let container = ServiceContainer::new();
        
        // Pre-register common mocks
        container.register(MockEventBus::new()).await.unwrap();
        container.register(MockTelemetry::new()).await.unwrap();
        
        container
    }
}
```

## 🔗 Интеграция с другими модулями

### Зависимости
- **Video Compiler** - использует DI для сервисов
- **Recognition** - подключается через Plugin API
- **Media Processing** - использует Performance модули

### API изменения
```rust
// Старый подход
let state = VideoCompilerState::new().await;

// Новый подход с DI
let container = ServiceContainer::new();
container.register(FFmpegService::new()).await?;
container.register(CacheService::new()).await?;
container.register(VideoCompilerService::new()).await?;

let video_compiler = container.resolve::<VideoCompilerService>().await?;
```

## 📊 Прогресс выполнения

### Текущий статус: 🚧 75% выполнено

#### Детализация по фазам:
- [x] Фаза 1: Исправление DI (100%)
  - ✅ Удален unsafe код
  - ✅ Реализован безопасный resolve через Arc
  - ✅ Полная поддержка ServiceProvider
  - ✅ 8 unit тестов, все проходят
- [x] Фаза 2: Тестовая инфраструктура (100%)
  - ✅ Создан модуль test_utils
  - ✅ MockService и MockService2
  - ✅ MockEventBus
  - ✅ MockPluginManager
  - ✅ Тестовые фикстуры и хелперы
  - ✅ 6 unit тестов для test_utils
- [x] Фаза 3: Unit тесты (100%)
  - ✅ DI: 8 тестов
  - ✅ Events: 9 тестов
  - ✅ Plugins: 29 тестов (plugin.rs: 12, permissions.rs: 17)
  - ✅ Telemetry: 34 тестов (health.rs: 16, metrics.rs: 15, общий модуль: 3)
  - ✅ Performance: 29 тестов (runtime.rs: 14, cache.rs: 15)
- [ ] Фаза 4: GPU тесты (0%)
- [ ] Фаза 5: Документация (0%)

### Выполненная работа

#### 📅 24 июня 2025
1. **Исправлен DI контейнер**
   - Полностью удален unsafe код (строка 101)
   - Реализован безопасный downcast через Arc
   - Добавлена поддержка Arc сервисов
   - Исправлена реализация ServiceProvider

2. **Создана тестовая инфраструктура**
   - Модуль `core/test_utils.rs` с переиспользуемыми компонентами
   - MockService, MockEventBus, MockPluginManager
   - Хелперы для тестирования: with_timeout, TestEnvironment
   - Макросы: test_service!, assert_timeout!

3. **Написаны тесты**
   - DI: полное покрытие включая concurrent access (8 тестов)
   - Events: тесты подписки, публикации, обработчиков (9 тестов)
   - test_utils: самотестирование инфраструктуры (6 тестов)
   - Plugins: комплексные тесты плагинов и разрешений (29 тестов)
     - plugin.rs: метаданные, команды, состояния, сериализация (12 тестов)
     - permissions.rs: файловая система, сеть, безопасность (17 тестов)
   - Telemetry: всесторонние тесты мониторинга (34 тестов)
     - health.rs: health checks, статусы, кэширование, timeout (16 тестов)
     - metrics.rs: счетчики, gauge, гистограммы, системные метрики (15 тестов)
     - TelemetryManager: интеграционные тесты (3 теста)
   - Performance: тесты производительности и кэширования (29 тестов)
     - runtime.rs: worker pools, async runtime, автонастройка (14 тестов)
     - cache.rs: LRU/LFU/FIFO кэши, TTL, concurrent access (15 тестов)

### Следующие шаги
1. ✅ ~~Создать ветку `feature/backend-testing-architecture`~~ (выполнено)
2. ✅ ~~Начать с исправления unsafe кода в DI~~ (выполнено)
3. ✅ ~~Написать тесты для исправленного DI~~ (выполнено)
4. Продолжить с тестами для Plugins модуля
5. Добавить тесты для Telemetry и Performance
6. Создать интеграционные тесты

## 📚 Связанные документы

- [Phase 2 Рефакторинг (завершен)](../completed/rust-backend-refactoring-phase2.md)
- [GPU Оптимизация](../planned/performance-optimization.md)
- [Известные проблемы с тестами](../../10-known-issues/test-memory-issues.md)
- [Video Compiler документация](../../05-video-compiler/README.md)

---

*Создано: 24 июня 2025* | *Статус: В разработке* | *Приоритет: Критический*