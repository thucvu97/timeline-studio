# Расширение EventBus API для поддержки приоритетов событий и отмены

## 📋 Описание задачи

**Статус:** Запланировано  
**Приоритет:** Средний  
**Дедлайн:** 15.07.2025  
**Ответственный:** Backend Team  

## 🎯 Цель

Расширить текущий EventBus API для поддержки:
1. Приоритетов событий (high, normal, low)
2. Механизма отмены событий (cancellation)
3. Условной обработки событий
4. Пакетной обработки событий

## 📝 Контекст

В процессе разработки Plugin API выявилась необходимость более гибкого управления событиями:
- Плагины должны иметь возможность отменять свои операции
- Критические системные события должны обрабатываться с приоритетом
- Необходим механизм отката для батч-операций

## 🔧 Техническое решение

### Расширение структуры Event

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub event_type: String,
    pub data: Value,
    pub timestamp: u64,
    // Новые поля
    pub priority: EventPriority,
    pub cancellation_token: Option<CancellationToken>,
    pub source: EventSource,
    pub metadata: EventMetadata,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum EventPriority {
    Critical = 0,
    High = 1,
    Normal = 2,
    Low = 3,
}

#[derive(Debug, Clone)]
pub struct CancellationToken {
    pub token_id: String,
    pub is_cancelled: Arc<AtomicBool>,
}

#[derive(Debug, Clone)]
pub enum EventSource {
    System,
    Plugin(String),
    User,
    External,
}
```

### Приоритетная очередь событий

```rust
use std::collections::BinaryHeap;

pub struct PriorityEventBus {
    event_queue: Arc<Mutex<BinaryHeap<PrioritizedEvent>>>,
    handlers: Arc<RwLock<HashMap<String, Vec<EventHandler>>>>,
    worker_handles: Vec<JoinHandle<()>>,
    shutdown_signal: Arc<AtomicBool>,
}

#[derive(Debug)]
struct PrioritizedEvent {
    event: Event,
    enqueue_time: Instant,
}

impl Ord for PrioritizedEvent {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Сначала по приоритету, потом по времени
        self.event.priority
            .cmp(&other.event.priority)
            .then_with(|| self.enqueue_time.cmp(&other.enqueue_time))
    }
}
```

### API для отмены событий

```rust
impl EventBus {
    pub async fn publish_cancellable(
        &self,
        event_type: String,
        data: Value,
        priority: EventPriority,
    ) -> Result<CancellationToken> {
        let token = CancellationToken::new();
        let event = Event::new_with_cancellation(event_type, data, priority, token.clone());
        self.publish_event(event).await?;
        Ok(token)
    }

    pub async fn cancel_event(&self, token: &CancellationToken) -> Result<bool> {
        token.cancel();
        // Уведомляем активные обработчики о отмене
        self.notify_cancellation(token).await
    }

    pub async fn publish_batch(
        &self,
        events: Vec<Event>,
        rollback_on_error: bool,
    ) -> Result<BatchResult> {
        let batch_id = uuid::Uuid::new_v4().to_string();
        let mut results = Vec::new();
        
        for event in events {
            match self.publish_event(event).await {
                Ok(result) => results.push(result),
                Err(e) if rollback_on_error => {
                    // Откатываем уже обработанные события
                    self.rollback_batch(&batch_id).await?;
                    return Err(e);
                }
                Err(e) => return Err(e),
            }
        }
        
        Ok(BatchResult { batch_id, results })
    }
}
```

## 🏗️ План реализации

### Этап 1: Базовая инфраструктура (3 дня)
- ✅ Расширение структуры Event с новыми полями
- ✅ Реализация EventPriority и CancellationToken
- ✅ Создание PriorityEventBus с приоритетной очередью
- ✅ Базовые тесты для новых структур

### Этап 2: Обработка приоритетов (2 дня)
- ✅ Реализация приоритетной очереди событий
- ✅ Механизм автоматической сортировки по приоритетам
- ✅ Worker threads для обработки событий разных приоритетов
- ✅ Метрики производительности для приоритетных событий

### Этап 3: Система отмены (3 дня)
- ✅ Реализация CancellationToken и механизма отмены
- ✅ Интеграция с существующими обработчиками событий
- ✅ Graceful shutdown для отмененных операций
- ✅ Rollback механизмы для составных операций

### Этап 4: Пакетная обработка (2 дня)
- ✅ API для пакетной отправки событий
- ✅ Atomic rollback для failed batches
- ✅ Оптимизация для больших батчей
- ✅ Мониторинг производительности батч-операций

### Этап 5: Интеграция с Plugin API (2 дня)
- ✅ Обновление PluginApi для поддержки новых возможностей
- ✅ Документация для разработчиков плагинов
- ✅ Примеры использования приоритетов и отмены в плагинах
- ✅ Backwards compatibility с существующими плагинами

### Этап 6: Тестирование и оптимизация (2 дня)
- ✅ Комплексные интеграционные тесты
- ✅ Нагрузочное тестирование с большим количеством событий
- ✅ Бенчмарки производительности
- ✅ Профилирование и оптимизация узких мест

## 🧪 Критерии готовности

### Функциональные требования
- ✅ События обрабатываются в порядке приоритета
- ✅ Возможность отмены событий через CancellationToken
- ✅ Пакетная отправка с rollback при ошибках
- ✅ Backwards compatibility с существующим EventBus API
- ✅ Thread-safe операции с приоритетными очередями

### Производительность
- ✅ Overhead от приоритетов < 5% для обычных событий
- ✅ Время отмены события < 10ms
- ✅ Пропускная способность > 10,000 событий/сек
- ✅ Memory usage оптимизирован для больших очередей

### Качество кода
- ✅ Покрытие тестами > 95%
- ✅ Документация всех публичных API
- ✅ Примеры использования для разработчиков
- ✅ Интеграция с существующей телеметрией

## 🔗 Связанные задачи

- **Plugin API Integration** - Использует расширенный EventBus
- **Performance Monitoring** - Метрики для приоритетных событий
- **Error Handling** - Rollback механизмы интегрируются с системой ошибок

## 📚 Документация

### API Reference
Будет создана полная документация для:
- EventPriority enum и его использование
- CancellationToken API и lifecycle
- Batch operations и rollback стратегии
- Примеры интеграции с плагинами

### Migration Guide
Руководство по миграции для:
- Обновления существующих плагинов
- Оптимальное использование приоритетов
- Best practices для batch operations

## 🚨 Риски и митигация

### Технические риски
- **Производительность**: Приоритетные очереди могут замедлить обработку
  - *Митигация*: Бенчмарки и профилирование на каждом этапе
- **Memory leaks**: CancellationTokens могут накапливаться
  - *Митигация*: Автоматическая очистка и timeout механизмы
- **Race conditions**: Отмена событий во время обработки
  - *Митигация*: Тщательное тестирование concurrent scenarios

### Интеграционные риски
- **Breaking changes**: Изменения могут сломать существующие плагины
  - *Митигация*: Строгий backwards compatibility и версионирование API
- **Complexity**: Дополнительная сложность может затруднить разработку
  - *Митигация*: Хорошая документация и простые default values

## 📈 Ожидаемые результаты

### Для разработчиков плагинов
- Возможность создавать отзывчивые плагины с отменой операций
- Контроль приоритета для критических операций плагинов
- Упрощение работы с batch operations

### Для системы
- Улучшенная отзывчивость UI через приоритетные события
- Более надежная обработка ошибок с rollback
- Лучшая производительность при высокой нагрузке

### Метрики успеха
- Снижение времени отклика UI на 20%
- Уменьшение количества "зависших" операций на 90%
- Увеличение пропускной способности событий на 30%

---

*Создано: 25 июня 2025*  
*Последнее обновление: 25 июня 2025*  
*Версия: 1.0.0*