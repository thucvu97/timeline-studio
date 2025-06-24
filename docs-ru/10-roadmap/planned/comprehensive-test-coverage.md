# Комплексное тестовое покрытие Backend

## 📋 Обзор

Задача по созданию недостающих тестов для достижения полного покрытия core модулей Timeline Studio согласно плану backend-testing-architecture.

### Текущее состояние
- ✅ Backend-testing-architecture завершена на 100%
- ✅ 335 тестов в core модулях успешно проходят
- ⚠️ Некоторые запланированные тесты еще не реализованы
- 🎯 Необходимо добавить специфические тесты для edge cases

## 📊 Анализ существующих тестов

### 1. DI Container (`src/core/di.rs`) - 8 тестов ✅
**Реализованы:**
- ✅ `test_service_registration_and_resolution` - базовая регистрация и разрешение
- ✅ `test_arc_service_registration` - регистрация Arc сервисов  
- ✅ `test_provider_registration_and_resolution` - ServiceProvider паттерн
- ✅ `test_service_not_found` - обработка ошибок
- ✅ `test_list_services` - список зарегистрированных сервисов
- ✅ `test_concurrent_access` - многопоточный доступ
- ✅ `test_circular_dependency_prevention` - предотвращение циклических зависимостей
- ✅ `test_provider_error_handling` - ошибки в провайдерах

**Требуют доработки:**
- ⚠️ `test_service_lifecycle` - полный жизненный цикл с init/shutdown
- ⚠️ `test_error_cases` - больше сценариев ошибок

### 2. Event System (`src/core/events.rs`) - 9 тестов ✅
**Реализованы:**
- ✅ `test_event_subscription` - подписка на события
- ✅ `test_multiple_handlers_for_same_event` - множественные обработчики
- ✅ `test_app_event_publishing` - публикация событий приложения
- ✅ `test_event_processor` - обработка событий
- ✅ `test_event_handler_macro` - макрос для обработчиков
- ✅ `test_memory_warning_event` - события памяти
- ✅ `test_plugin_events` - события плагинов
- ✅ `test_concurrent_event_publishing` - конкурентная публикация
- ✅ `test_event_handler_state` - состояние обработчиков

**Отсутствуют по плану:**
- ❌ `test_event_registration` - явная регистрация типов событий
- ❌ `test_event_dispatch` - диспетчеризация по типам
- ❌ `test_async_handlers` - асинхронные обработчики (частично покрыто)
- ❌ `test_event_priority` - приоритет обработки событий
- ❌ `test_event_cancellation` - отмена событий

### 3. Plugin System (`src/core/plugins/*`) - 47 тестов ✅
**Хорошо покрыто, но отсутствуют:**
- ❌ `test_plugin_loading` - динамическая загрузка плагинов
- ❌ `test_wasm_execution` - выполнение WebAssembly плагинов
- ❌ `test_sandbox_resource_limits` - лимиты ресурсов в sandbox

### 4. Telemetry (`src/core/telemetry/*`) - 54 теста ✅  
**Хорошо покрыто, но можно добавить:**
- ❌ `test_trace_generation` - генерация trace с вложенными span
- ❌ `test_export_pipeline` - полный pipeline экспорта метрик
- ❌ `test_sampling_logic` - логика семплирования трейсов

### 5. Performance (`src/core/performance/*`) - 29 тестов ✅
**Отсутствуют:**
- ❌ `test_memory_pools` - пулы памяти для аллокаций
- ❌ `test_zero_copy_operations` - операции без копирования
- ❌ `test_resource_limits` - ограничения ресурсов

### 6. GPU (`src/core/gpu/*`) - 18 тестов ✅
**Можно добавить:**
- ❌ Performance benchmarks для сравнения CPU vs GPU
- ❌ Интеграционные тесты с реальными encoder

## 🎯 План добавления тестов

### Приоритет 1: Критические тесты (1 неделя)

#### DI Container - Service Lifecycle
```rust
#[tokio::test]
async fn test_service_lifecycle() {
    let container = ServiceContainer::new();
    
    // Сервис с полным lifecycle
    struct LifecycleService {
        initialized: Arc<AtomicBool>,
        shutdown: Arc<AtomicBool>,
    }
    
    #[async_trait]
    impl Service for LifecycleService {
        async fn initialize(&mut self) -> Result<()> {
            self.initialized.store(true, Ordering::SeqCst);
            Ok(())
        }
        
        async fn shutdown(&mut self) -> Result<()> {
            self.shutdown.store(true, Ordering::SeqCst);
            Ok(())
        }
        
        fn name(&self) -> &'static str {
            "LifecycleService"
        }
    }
    
    let service = LifecycleService {
        initialized: Arc::new(AtomicBool::new(false)),
        shutdown: Arc::new(AtomicBool::new(false)),
    };
    
    let init_flag = service.initialized.clone();
    let shutdown_flag = service.shutdown.clone();
    
    // Register and initialize
    container.register(service).await.unwrap();
    container.initialize_all().await.unwrap();
    
    assert!(init_flag.load(Ordering::SeqCst));
    assert!(!shutdown_flag.load(Ordering::SeqCst));
    
    // Shutdown
    container.shutdown_all().await.unwrap();
    assert!(shutdown_flag.load(Ordering::SeqCst));
}
```

#### Event System - Priority & Cancellation
```rust
#[tokio::test]
async fn test_event_priority() {
    let event_bus = EventBus::new();
    let order = Arc::new(Mutex::new(Vec::new()));
    
    // High priority handler
    let order1 = order.clone();
    event_bus.subscribe_with_priority(Priority::High, move |_: &AppEvent| {
        order1.lock().unwrap().push(1);
    }).await;
    
    // Low priority handler
    let order2 = order.clone();
    event_bus.subscribe_with_priority(Priority::Low, move |_: &AppEvent| {
        order2.lock().unwrap().push(2);
    }).await;
    
    event_bus.publish(AppEvent::SystemStartup).await.unwrap();
    
    let final_order = order.lock().unwrap();
    assert_eq!(*final_order, vec![1, 2]); // High priority first
}

#[tokio::test]
async fn test_event_cancellation() {
    let event_bus = EventBus::new();
    let processed = Arc::new(AtomicBool::new(false));
    
    // Handler that cancels the event
    event_bus.subscribe(move |event: &mut CancellableEvent<AppEvent>| {
        event.cancel();
    }).await;
    
    // Handler that shouldn't be called
    let processed_clone = processed.clone();
    event_bus.subscribe(move |_: &AppEvent| {
        processed_clone.store(true, Ordering::SeqCst);
    }).await;
    
    event_bus.publish_cancellable(AppEvent::SystemStartup).await.unwrap();
    
    assert!(!processed.load(Ordering::SeqCst));
}
```

### Приоритет 2: Функциональные тесты (1 неделя)

#### Plugin System - Dynamic Loading
```rust
#[tokio::test]
async fn test_plugin_dynamic_loading() {
    let plugin_manager = PluginManager::new();
    
    // Create test plugin file
    let plugin_path = create_test_plugin_file();
    
    // Load plugin
    let result = plugin_manager.load_from_path(&plugin_path).await;
    assert!(result.is_ok());
    
    let plugin_id = result.unwrap();
    
    // Verify plugin is loaded
    let info = plugin_manager.get_plugin_info(&plugin_id).await;
    assert!(info.is_some());
    
    // Unload plugin
    assert!(plugin_manager.unload(&plugin_id).await.is_ok());
}
```

#### Telemetry - Full Export Pipeline
```rust
#[tokio::test]
async fn test_telemetry_export_pipeline() {
    let config = TelemetryConfig {
        exporter: ExporterConfig {
            exporter_type: ExporterType::InMemory,
            ..Default::default()
        },
        ..Default::default()
    };
    
    let telemetry = TelemetryManager::new(config).await.unwrap();
    
    // Generate traces
    let tracer = telemetry.tracer();
    tracer.trace("test_operation", async {
        // Nested span
        tracer.trace("nested_operation", async {
            Ok(())
        }).await
    }).await.unwrap();
    
    // Generate metrics
    let metrics = telemetry.metrics();
    let counter = metrics.counter("test_counter", "Test").unwrap();
    counter.inc();
    
    // Force export
    telemetry.force_flush().await.unwrap();
    
    // Verify exported data
    let exported = telemetry.get_exported_data().await;
    assert!(exported.traces.len() > 0);
    assert!(exported.metrics.len() > 0);
}
```

### Приоритет 3: Performance тесты (2 недели)

#### Memory Pools
```rust
#[test]
fn test_memory_pool_allocation() {
    let pool = MemoryPool::new(1024, 100); // 1KB blocks, 100 blocks
    
    // Allocate memory
    let block1 = pool.allocate().unwrap();
    assert_eq!(block1.size(), 1024);
    
    // Pool should have 99 free blocks
    assert_eq!(pool.free_blocks(), 99);
    
    // Return block
    drop(block1);
    assert_eq!(pool.free_blocks(), 100);
    
    // Allocate all blocks
    let blocks: Vec<_> = (0..100).map(|_| pool.allocate().unwrap()).collect();
    
    // Pool exhausted
    assert!(pool.allocate().is_none());
    
    // Return all
    drop(blocks);
    assert_eq!(pool.free_blocks(), 100);
}
```

#### Zero-Copy Operations
```rust
#[test]
fn test_zero_copy_buffer() {
    let data = vec![1, 2, 3, 4, 5];
    let buffer = ZeroCopyBuffer::from_vec(data);
    
    // Create view without copying
    let view1 = buffer.view(1..4);
    assert_eq!(&*view1, &[2, 3, 4]);
    
    // Multiple views
    let view2 = buffer.view(0..3);
    assert_eq!(&*view2, &[1, 2, 3]);
    
    // Views don't interfere
    assert_eq!(&*view1, &[2, 3, 4]);
}
```

## 📈 Метрики покрытия

### Текущее покрытие
- **DI**: ~80% (8/10 запланированных тестов)
- **Events**: ~64% (9/14 запланированных)  
- **Plugins**: ~88% (47 тестов, но не все сценарии)
- **Telemetry**: ~85% (54 теста)
- **Performance**: ~70% (29 тестов)
- **GPU**: ~90% (18 тестов)

### Целевое покрытие
- **Все core модули**: ≥ 90%
- **Критические пути**: 100%
- **Edge cases**: ≥ 80%

## 🚀 Реализация

### Шаг 1: Создать ветку
```bash
git checkout -b feature/comprehensive-test-coverage
```

### Шаг 2: Добавить тесты по приоритетам
1. Начать с критических тестов (DI lifecycle, Event priority)
2. Добавить функциональные тесты (Plugin loading, Export pipeline)
3. Завершить performance тестами

### Шаг 3: Измерить покрытие
```bash
cargo tarpaulin --out Html --output-dir coverage
```

### Шаг 4: Документировать
- Обновить README с примерами тестов
- Добавить best practices для тестирования
- Создать шаблоны для новых тестов

## 📅 График выполнения

- **Неделя 1**: Критические тесты (Priority 1)
- **Неделя 2**: Функциональные тесты (Priority 2)
- **Неделя 3-4**: Performance тесты (Priority 3)
- **Неделя 5**: Документация и review

## 🔗 Связанные документы

- [Backend Testing Architecture (завершено)](../completed/backend-testing-architecture.md)
- [Test Utils Documentation](../../../src-tauri/src/core/test_utils.rs)
- [Testing Best Practices](../../testing-guidelines.md)

---

*Создано: 24 июня 2025* | *Статус: Запланировано* | *Приоритет: Высокий*