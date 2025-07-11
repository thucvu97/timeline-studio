# Реализация мониторинга и логирования

## Обзор

Успешно реализована комплексная система мониторинга и логирования для сервисного слоя backend Timeline Studio.

## Что было добавлено

### 1. Модуль мониторинга (`services/monitoring.rs`)
- **ServiceMetrics**: Отслеживает метрики для отдельных сервисов
- **OperationMetrics**: Детальные метрики для каждой операции, включая:
  - Количество операций
  - Общая/минимальная/максимальная/средняя продолжительность
  - Количество ошибок и последнее сообщение об ошибке
  - Временная метка последней операции
- **OperationTracker**: Автоматическое отслеживание времени операций
- **MetricsRegistry**: Глобальный реестр для всех метрик сервисов
- **Экспорт Prometheus**: Экспорт метрик в формате Prometheus

### 2. Интеграция сервисов
- Добавлен `ServiceMetricsContainer` в `ServiceContainer`
- Каждый сервис автоматически регистрируется с метриками
- Сервисы могут отслеживать операции с помощью `metrics.start_operation()`

### 3. Пример реализации (`cache_service_with_metrics.rs`)
Демонстрирует, как обернуть любой сервис автоматическим сбором метрик:
```rust
let tracker = self.metrics.start_operation("clear_all");
match self.inner.clear_all().await {
  Ok(result) => {
    tracker.complete().await;
    log::info!("[CacheService] Весь кэш успешно очищен");
    Ok(result)
  }
  Err(e) => {
    tracker.fail(e.to_string()).await;
    log::error!("[CacheService] Ошибка очистки кэша: {}", e);
    Err(e)
  }
}
```

### 4. Команды метрик (`commands/metrics.rs`)
Добавлены команды Tauri для доступа к метрикам:
- `get_all_metrics` - Получить метрики для всех сервисов
- `get_service_metrics` - Получить метрики для конкретного сервиса
- `export_metrics_prometheus` - Экспортировать в формате Prometheus
- `reset_service_metrics` - Сбросить метрики для сервиса
- `get_active_operations_count` - Получить количество активных операций
- `get_error_statistics` - Получить детальную статистику ошибок
- `get_slow_operations` - Получить топ самых медленных операций

### 5. Точки интеграции
- Команды зарегистрированы в `lib.rs`
- Метрики доступны из frontend через команды Tauri
- Глобальный реестр `METRICS` с использованием `once_cell::Lazy`

## Пример использования

### Из кода сервиса:
```rust
// Начинаем отслеживание операции
let tracker = self.metrics.start_operation("generate_preview");

// Выполняем работу
let result = generate_preview_internal().await;

// Завершаем или помечаем как неудачную на основе результата
match result {
  Ok(data) => {
    tracker.complete().await;
    Ok(data)
  }
  Err(e) => {
    tracker.fail(e.to_string()).await;
    Err(e)
  }
}
```

### Из Frontend:
```javascript
// Получить все метрики
const metrics = await invoke('get_all_metrics');

// Получить метрики конкретного сервиса
const cacheMetrics = await invoke('get_service_metrics', { 
  serviceName: 'cache-service' 
});

// Получить статистику ошибок
const errors = await invoke('get_error_statistics');

// Экспортировать метрики Prometheus
const prometheusData = await invoke('export_metrics_prometheus');
```

## Преимущества

1. **Мониторинг производительности**: Отслеживание продолжительности операций и выявление узких мест
2. **Отслеживание ошибок**: Мониторинг частоты ошибок и паттернов
3. **Использование ресурсов**: Отслеживание активных операций и нагрузки на сервисы
4. **Инсайты для продакшена**: Экспорт метрик для систем мониторинга
5. **Отладка**: Детальная история операций с временными метками

## Доступные метрики

Для каждого сервиса:
- Общее количество операций
- Общее количество ошибок
- Количество активных операций
- Операций в секунду
- Частота ошибок
- Время работы

Для каждой операции:
- Количество выполнений
- Минимальная/максимальная/средняя продолжительность
- Количество ошибок
- Последнее сообщение об ошибке
- Время последнего выполнения

## Расширенная реализация метрик ✅

### 1. Метрики производительности кеша (`advanced_metrics.rs`)
Добавлен комплексный мониторинг кеша с:
- **Анализ частоты попаданий**: Статистика за последний час/день
- **Отслеживание использования памяти**: Пиковое и текущее использование
- **Мониторинг производительности**: Время отклика и медленные операции
- **Система оповещений**: Настраиваемые пороги для критических метрик

```rust
// Получить детальную производительность кеша
let metrics = invoke('get_cache_performance_metrics').await;

// Установить пороги оповещений
await invoke('set_cache_alert_thresholds', {
  thresholds: {
    min_hit_rate: 0.8,
    max_memory_usage_mb: 512.0,
    max_response_time_ms: 100.0,
    max_fragmentation: 0.3
  }
});

// Проверить активные оповещения
let alerts = await invoke('get_cache_alerts');
```

### 2. Метрики использования GPU
Мониторинг GPU в реальном времени включая:
- Процент использования GPU
- Использование памяти (используется/всего)
- Температура и потребление энергии
- Активные сессии кодирования
- Метрики производительности (FPS кодирования, длина очереди)

### 3. Аналитика использования памяти
Отслеживание памяти по сервисам:
- Потребление памяти отдельными сервисами
- Пиковое использование и паттерны выделения
- Оповещения о памяти и статистика сборки мусора
- Анализ фрагментации

### 4. Анализ исторических трендов
Хранение и анализ метрик во времени:
- Настраиваемые временные диапазоны (часы/дни)
- Статистические сводки (мин/макс/среднее)
- Идентификация трендов производительности
- Инсайты для планирования мощностей

### 5. Гибкая система оповещений
Фреймворк оповещений:
- Пользовательские пороги метрик
- Несколько уровней серьезности (Инфо/Предупреждение/Критическое)
- История оповещений и отслеживание
- Готовность к интеграции с системами уведомлений

## Добавленные расширенные команды

| Команда | Назначение | Вывод |
|---------|------------|-------|
| `get_cache_performance_metrics` | Детальная аналитика кеша | Частота попаданий, использование памяти, медленные операции |
| `set_cache_alert_thresholds` | Настройка порогов оповещений | Устанавливает лимиты мониторинга |
| `get_cache_alerts` | Статус активных оповещений | Текущие оповещения с серьезностью |
| `get_gpu_utilization_metrics` | Данные производительности GPU | Использование, память, температура, кодирование |
| `get_memory_usage_metrics` | Отслеживание памяти сервисов | Потребление памяти по сервисам |
| `create_custom_alert` | Создание пользовательского оповещения | ID оповещения для отслеживания |
| `get_metrics_history` | Исторические данные трендов | Временные ряды метрик для анализа |

## Следующие шаги

1. **Интеграция дашборда**: Создать дашборд метрик во frontend ⏳
2. **Оповещения**: Добавить пороги и оповещения для критических метрик ✅
3. **Сохранение**: Хранить историю метрик для анализа трендов ✅
4. **Пользовательские метрики**: Добавить метрики для конкретных сервисов (частота попаданий кеша, использование GPU и т.д.) ✅
5. **Оптимизация производительности**: Использовать метрики для выявления и оптимизации медленных операций ✅

## Технические заметки

- Использует `once_cell` для ленивой статической инициализации
- Потокобезопасность с атомарными операциями и RwLock
- Минимальные накладные расходы на производительность (~микросекунды на операцию)
- Автоматическая очистка через trait Drop для незавершенных операций
- Сериализация Serde для коммуникации с frontend