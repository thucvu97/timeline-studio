# Интеграция Specta-rs для типобезопасного API

## 📋 Описание задачи

**Статус:** Готово (базовая интеграция)  
**Приоритет:** Высокий  
**Дедлайн:** 10.07.2025  
**Ответственный:** Backend Team  

## 🎯 Цель

Интегрировать библиотеку Specta-rs для автоматической генерации TypeScript типов из Rust структур, обеспечивая типобезопасность между backend и frontend слоями приложения.

## 📝 Контекст

В процессе разработки EventBus API и Plugin System выявилась необходимость поддержания синхронизации типов между Rust и TypeScript. Ручное дублирование типов приводит к:
- Ошибкам при рефакторинге
- Несоответствию типов между слоями
- Дополнительной работе при изменениях API

Specta-rs позволит автоматически генерировать TypeScript определения из Rust типов, что особенно важно для:
- EventBus событий и структур данных
- Plugin API интерфейсов
- Tauri команд и их параметров

## 🔧 Техническое решение

### Минимальная интеграция (без больших изменений)

1. **Добавление зависимостей в Cargo.toml**:
```toml
[dependencies]
specta = { version = "2.0", features = ["serde"] }

[build-dependencies]
specta-typescript = "0.3"
```

2. **Создание build.rs для генерации типов**:
```rust
use specta::{Type, TypeCollection};
use specta_typescript::Typescript;

fn main() {
    // Собираем типы, которые нужно экспортировать
    let types = TypeCollection::default()
        .register::<AppEvent>()
        .register::<EventPriority>()
        .register::<CancellationToken>()
        .register::<PluginCommand>()
        .register::<PluginResponse>();
    
    // Генерируем TypeScript файл
    Typescript::default()
        .export_to("./src/types/generated-backend.ts", &types)
        .unwrap();
}
```

3. **Добавление derive макроса к существующим структурам**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Event {
    pub id: String,
    pub event_type: String,
    pub data: Value,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum AppEvent {
    ProjectCreated { project_id: String },
    RenderingStarted { task_id: String },
    MediaImported { file_path: String },
    // ...
}
```

### Области применения

1. **EventBus типы** (src-tauri/src/core/events.rs):
   - Event, AppEvent, EventHandler traits
   - Будущие EventPriority, CancellationToken

2. **Plugin API типы** (src-tauri/src/core/plugins/):
   - PluginCommand, PluginResponse
   - PluginInfo, PluginCapability

3. **Tauri команды** (src-tauri/src/commands/):
   - Параметры и возвращаемые значения команд
   - Структуры для сложных операций

4. **Модели данных** (src-tauri/src/models/):
   - Project, Timeline, Clip структуры
   - Конфигурационные типы

## 🏗️ План реализации

### Этап 1: Базовая настройка (1 день)
- [x] Добавить зависимости specta и specta-typescript
- [x] Создать build.rs с базовой конфигурацией
- [x] Настроить путь для генерации TypeScript файлов
- [x] Добавить generated файлы в .gitignore

### Этап 2: Интеграция с EventBus (2 дня)
- [x] Добавить `#[derive(Type)]` к Event структурам
- [x] Экспортировать AppEvent enum и связанные типы
- [x] Создать модуль specta_export.rs для генерации типов
- [ ] Обновить фронтенд для использования сгенерированных типов

### Этап 3: Plugin API типы (1 день)
- [x] Аннотировать Plugin API структуры
- [x] Добавить Type derive к PluginCommand, PluginResponse, PluginState и др.
- [ ] Обновить документацию для разработчиков плагинов

### Этап 4: Tauri команды (2 дня)
- [ ] Использовать tauri-specta для команд (опционально)
- [ ] Или вручную аннотировать параметры команд
- [ ] Обновить фронтенд хуки для новых типов

### Этап 5: Автоматизация и CI (1 день)
- [ ] Добавить проверку генерации типов в CI
- [ ] Создать pre-commit hook для обновления типов
- [ ] Документировать процесс для команды

## 🧪 Критерии готовности

- [x] TypeScript типы автоматически генерируются при сборке
- [x] Нет ручного дублирования типов между Rust и TS
- [x] Добавлены feature flags для поддержки chrono, uuid, serde_json
- [x] Существующий код работает без изменений (компиляция проходит)
- [x] Создан тестовый пример для проверки генерации
- [ ] CI проверяет актуальность сгенерированных типов
- [ ] Документация обновлена

## 💡 Преимущества подхода

1. **Минимальные изменения**: Только добавление derive макросов
2. **Автоматическая синхронизация**: Типы всегда актуальны
3. **Лучше, чем полный рефакторинг**: Не требует переписывания
4. **Постепенная миграция**: Можно добавлять типы по мере необходимости

## 🚨 Риски

- **Зависимость от внешней библиотеки**: Mitigation - Specta активно развивается и используется в Tauri экосистеме
- **Изменение процесса сборки**: Mitigation - Минимальные изменения в build.rs
- **Обучение команды**: Mitigation - Простой API, похож на serde

## 📚 Альтернативы

1. **ts-rs**: Похожая библиотека, но Specta лучше интегрируется с Tauri
2. **Ручное поддержание типов**: Текущий подход, error-prone
3. **JSON Schema**: Более сложный подход, требует runtime валидации

## 🔗 Связанные задачи

- EventBus API Extensions - основной потребитель типов
- Plugin System Development - нуждается в типобезопасном API
- Frontend Type Safety Improvements - использует сгенерированные типы

---

*Создано: 29 июня 2025*  
*Последнее обновление: 29 июня 2025*  
*Версия: 1.0.0*