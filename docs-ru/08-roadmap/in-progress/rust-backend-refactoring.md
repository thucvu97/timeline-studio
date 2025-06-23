# Рефакторинг Rust Backend 🔧

**Статус:** В активной разработке  
**Приоритет:** 🔴 Высокий  
**Прогресс:** 15%  
**Ответственный:** Backend Team  
**Дедлайн:** Q1 2025

## Описание проблемы

Текущая структура Rust backend имеет ряд архитектурных проблем:
- **lib.rs содержит 1948 строк** с 735 зарегистрированными Tauri командами
- Огромные файлы затрудняют навигацию (misc.rs - 1199 строк, pipeline.rs - 1966 строк)
- Отсутствует модульность в регистрации команд
- Смешение ответственностей в модулях
- Длительное время компиляции из-за монолитной структуры

## План рефакторинга

### Фаза 1: Реформа регистрации команд (2-3 дня)

#### 1.1 Создание CommandRegistry trait
```rust
pub trait CommandRegistry {
    fn register_commands<R: Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R>;
}
```

#### 1.2 Модульная регистрация команд
Каждый модуль будет регистрировать свои команды:
- `media::register_commands()`
- `video_compiler::register_commands()`
- `recognition::register_commands()`
- `security::register_commands()`
- `filesystem::register_commands()`
- `app_dirs::register_commands()`

#### 1.3 Упрощение lib.rs
Сократить lib.rs с 1948 до ~200 строк, оставив только инициализацию и композицию модулей.

### Фаза 2: Разделение больших файлов (3-4 дня)

#### 2.1 Декомпозиция video_compiler/commands/misc.rs (1199 строк)
Разбить на специализированные модули:
- `schema_commands.rs` - операции со схемой (create_clip, create_track, create_effect)
- `prerender_commands.rs` - операции пререндеринга
- `frame_extraction_commands.rs` - работа с кадрами таймлайна
- `subtitle_commands.rs` - операции с субтитрами
- `test_helper_commands.rs` - тестовые утилиты

#### 2.2 Разделение media/processor.rs (1103 строки)
По ответственностям:
- `metadata_extractor.rs` - извлечение метаданных
- `thumbnail_generator.rs` - генерация миниатюр
- `preview_generator.rs` - генерация превью
- `media_analyzer.rs` - анализ медиафайлов

#### 2.3 Рефакторинг recognition/yolo_processor.rs (1030 строк)
- `model_manager.rs` - загрузка и управление YOLO моделями
- `frame_processor.rs` - логика обработки кадров
- `result_aggregator.rs` - сбор и форматирование результатов

#### 2.4 Оптимизация video_compiler/core/pipeline.rs (1966 строк)
- `pipeline_builder.rs` - построение пайплайнов
- `pipeline_executor.rs` - выполнение пайплайнов
- `pipeline_optimizer.rs` - оптимизация команд FFmpeg

### Фаза 3: Централизация сквозных функций (2-3 дня)

#### 3.1 Унифицированное управление кэшем
```rust
pub trait CacheManager {
    async fn get<T>(&self, key: &str) -> Option<T>;
    async fn set<T>(&self, key: &str, value: T, ttl: Option<Duration>);
    async fn invalidate(&self, pattern: &str);
    async fn clear_all(&self);
}
```

Реализации:
- `MediaCacheManager`
- `RenderCacheManager`
- `RecognitionCacheManager`

#### 3.2 Консистентная обработка ошибок
```rust
#[derive(Error, Debug)]
pub enum TimelineError {
    #[error("Media processing error: {0}")]
    MediaError(#[from] MediaError),
    
    #[error("Rendering error: {0}")]
    RenderError(#[from] RenderError),
    
    #[error("Recognition error: {0}")]
    RecognitionError(#[from] RecognitionError),
    
    // ...
}
```

#### 3.3 Middleware для метрик
Декораторный паттерн для добавления метрик:
```rust
#[derive(Clone)]
pub struct MetricsMiddleware<T> {
    inner: T,
    metrics: Arc<Metrics>,
}
```

### Фаза 4: Улучшение типобезопасности (2-3 дня)

#### 4.1 NewType паттерны для идентификаторов
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectId(String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipId(String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackId(String);
```

#### 4.2 Value Objects для домена
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Duration(f64);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilePath(PathBuf);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Timestamp(f64);
```

#### 4.3 Builder паттерны для сложных команд
```rust
pub struct RenderCommandBuilder {
    project_id: Option<ProjectId>,
    output_path: Option<FilePath>,
    resolution: Option<Resolution>,
    // ...
}
```

### Фаза 5: Усиление сервисного слоя (2-3 дня)

#### 5.1 Извлечение бизнес-логики из команд
Команды должны только:
- Валидировать параметры
- Делегировать выполнение сервисам
- Возвращать результат

#### 5.2 Repository паттерн для доступа к данным
```rust
#[async_trait]
pub trait ProjectRepository {
    async fn find_by_id(&self, id: &ProjectId) -> Result<Project>;
    async fn save(&self, project: &Project) -> Result<()>;
    async fn delete(&self, id: &ProjectId) -> Result<()>;
}
```

#### 5.3 Доменные события
```rust
pub enum DomainEvent {
    ProjectCreated { id: ProjectId },
    RenderStarted { id: ProjectId, job_id: JobId },
    RenderCompleted { id: ProjectId, job_id: JobId },
    // ...
}
```

## Стратегия внедрения

### Порядок выполнения
1. Начать с наименее рискованных изменений (разделение файлов)
2. Поддерживать обратную совместимость на всех этапах
3. Добавить интеграционные тесты перед каждым крупным изменением
4. Использовать feature flags для постепенного внедрения
5. Проводить бенчмарки критичных по производительности путей

### Тестирование
- Unit тесты для каждого нового модуля
- Интеграционные тесты для проверки совместимости
- Performance тесты для измерения улучшений
- E2E тесты для проверки функциональности

## Ожидаемые результаты

### Производительность
- **Сокращение времени компиляции на 30-40%**
- Быстрая инкрементальная компиляция
- Улучшенное кэширование компиляции

### Поддерживаемость
- **Лучшая навигация по коду** - файлы не более 500 строк
- **Четкое разделение ответственностей**
- **Упрощенное тестирование** - маленькие, сфокусированные модули

### Масштабируемость
- **Легкое добавление новых функций**
- **Параллельная разработка** разными командами
- **Упрощенный онбординг** новых разработчиков

## Риски и митигация

### Риск: Нарушение обратной совместимости
**Митигация:** 
- Сохранение всех сигнатур команд неизменными
- Обширное покрытие тестами перед рефакторингом
- Использование паттерна Strangler Fig для постепенной миграции

### Риск: Регрессии производительности
**Митигация:**
- Регулярные performance benchmarks
- Профилирование критических путей
- A/B тестирование новой архитектуры

### Риск: Сложность миграции
**Митигация:**
- Пошаговый план с четкими milestone
- Code review для каждой фазы
- Rollback план для каждого этапа

## Метрики успеха

### Количественные
- Время компиляции: < 30 секунд (сейчас ~90 секунд)
- Размер файлов: < 500 строк (сейчас до 1966 строк)
- Покрытие тестами: > 85% (сейчас ~80%)
- Cyclomatic complexity: < 10 на функцию

### Качественные
- Положительный фидбек от команды разработки
- Снижение времени на исправление багов
- Ускорение добавления новых функций

## Зависимости

- Требуется freeze feature development на время критических фаз
- Координация с фронтенд командой для тестирования
- Обновление CI/CD пайплайнов

## Ресурсы

### Команда
- 2 Senior Rust разработчика (full-time)
- 1 QA инженер (50%)
- Tech Lead для архитектурных решений

### Инструменты
- cargo-flamegraph для профилирования
- cargo-bloat для анализа размера бинарников
- cargo-udeps для поиска неиспользуемых зависимостей

## Связанные задачи

- [✅ Тестирование модуля безопасности](../completed/security-module-tests.md)
- [🔄 Оптимизация генерации превью](preview-generation-optimization.md)
- [📋 Миграция на Tauri v2](../planned/tauri-v2-migration.md)

---

*Последнее обновление: 2025-06-23* | *Версия: 1.0.0*