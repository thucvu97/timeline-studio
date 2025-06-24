# Реализация Plugin API

## 📋 Обзор

Критическая задача по реализации API для системы плагинов Timeline Studio. В настоящий момент все методы в `src/core/plugins/api.rs` содержат `todo!()` макросы, что делает систему плагинов нефункциональной.

### Текущее состояние
- ❌ Все методы PluginApi trait не реализованы
- ⚠️ Блокирует разработку и использование плагинов
- 🏗️ Архитектура и интерфейсы уже определены
- ✅ Система разрешений и sandbox готовы

### Цели
1. **Реализовать core функциональность** - базовые операции с медиа и timeline
2. **Обеспечить безопасность** - все операции через систему разрешений
3. **Добавить тесты** - минимум 90% покрытие для API
4. **Создать примеры** - демо плагины для разработчиков

## 🔍 Анализ текущего состояния

### Нереализованные методы в `PluginApiImpl`:

#### Медиа операции
```rust
async fn get_media_info(&self, media_id: &str) -> Result<MediaInfo> {
    todo!("Implement get_media_info")
}

async fn apply_effect(&self, media_id: &str, effect: &str, params: Value) -> Result<()> {
    todo!("Implement apply_effect")
}

async fn generate_thumbnail(&self, media_id: &str, timestamp: f64) -> Result<Vec<u8>> {
    todo!("Implement generate_thumbnail")
}
```

#### Timeline операции
```rust
async fn get_timeline_state(&self) -> Result<Value> {
    todo!("Implement get_timeline_state")
}

async fn add_clip(&self, track_id: &str, clip: Value) -> Result<String> {
    todo!("Implement add_clip")
}

async fn remove_clip(&self, clip_id: &str) -> Result<()> {
    todo!("Implement remove_clip")
}

async fn update_clip(&self, clip_id: &str, updates: Value) -> Result<()> {
    todo!("Implement update_clip")
}
```

#### UI операции
```rust
async fn show_dialog(&self, dialog_type: &str, options: Value) -> Result<Value> {
    todo!("Implement show_dialog")
}

async fn add_menu_item(&self, menu_path: &str, item: Value) -> Result<()> {
    todo!("Implement add_menu_item")
}

async fn remove_menu_item(&self, menu_id: &str) -> Result<()> {
    todo!("Implement remove_menu_item")
}
```

#### Файловая система
```rust
async fn read_file(&self, path: &Path) -> Result<Vec<u8>> {
    todo!("Implement read_file")
}

async fn write_file(&self, path: &Path, data: &[u8]) -> Result<()> {
    todo!("Implement write_file")
}
```

## 📐 План реализации

### Фаза 1: Базовая инфраструктура (1 неделя)

#### 1.1 Создание сервисов-мостов
```rust
// src/core/plugins/services/
pub struct MediaBridge {
    media_service: Arc<MediaService>,
    permissions: Arc<PluginPermissions>,
}

pub struct TimelineBridge {
    timeline_service: Arc<TimelineService>,
    permissions: Arc<PluginPermissions>,
}

pub struct UIBridge {
    app_handle: AppHandle,
    permissions: Arc<PluginPermissions>,
}
```

#### 1.2 Интеграция с существующими сервисами
- [ ] Подключить VideoCompilerService для медиа операций
- [ ] Интегрировать с Timeline state management
- [ ] Создать безопасные обертки для Tauri команд

### Фаза 2: Реализация медиа операций (1 неделя)

#### 2.1 get_media_info
```rust
async fn get_media_info(&self, media_id: &str) -> Result<MediaInfo> {
    // Проверка разрешений
    self.check_permission(PluginPermission::MediaRead)?;
    
    // Получение информации через сервис
    let media_service = self.container.resolve::<MediaService>().await?;
    let info = media_service.get_media_info(media_id).await?;
    
    // Фильтрация по разрешениям
    Ok(self.filter_media_info(info))
}
```

#### 2.2 apply_effect
- [ ] Валидация параметров эффекта
- [ ] Проверка поддерживаемых эффектов
- [ ] Применение через FFmpeg pipeline
- [ ] Обновление preview

#### 2.3 generate_thumbnail
- [ ] Использовать PreviewService
- [ ] Кэширование результатов
- [ ] Поддержка разных форматов вывода

### Фаза 3: Timeline операции (1 неделя)

#### 3.1 Интеграция с timeline state
- [ ] Создать TimelineAccessor для плагинов
- [ ] Реализовать транзакции для изменений
- [ ] Поддержка undo/redo

#### 3.2 Операции с клипами
- [ ] add_clip с валидацией
- [ ] remove_clip с проверкой зависимостей
- [ ] update_clip с partial updates

### Фаза 4: UI и файловая система (1 неделя)

#### 4.1 UI операции через Tauri
- [ ] Диалоги через tauri-plugin-dialog
- [ ] Меню через динамическую регистрацию
- [ ] Уведомления и прогресс

#### 4.2 Безопасная работа с файлами
- [ ] Sandbox для путей
- [ ] Квоты на размер
- [ ] Проверка MIME типов

### Фаза 5: Тестирование и документация (1 неделя)

#### 5.1 Unit тесты
- [ ] Тесты для каждого API метода
- [ ] Mock сервисы
- [ ] Проверка разрешений

#### 5.2 Интеграционные тесты
- [ ] Полный workflow плагина
- [ ] Тестовые плагины
- [ ] Performance benchmarks

## 🎯 Критерии успеха

### Функциональность
- ✅ Все методы PluginApi реализованы
- ✅ Интеграция с существующими сервисами
- ✅ Система разрешений работает корректно

### Безопасность
- ✅ Sandbox изоляция для файловых операций
- ✅ Валидация всех входных данных
- ✅ Аудит всех операций

### Производительность
- ✅ API вызовы < 10ms (без IO)
- ✅ Эффективное кэширование
- ✅ Асинхронные операции

### Качество
- ✅ Покрытие тестами > 90%
- ✅ Документация для разработчиков
- ✅ Примеры плагинов

## 📊 Прогресс выполнения

### Текущий статус: 🟡 15% выполнено

- [x] Инфраструктура: Архитектура плагинов определена
- [x] Sandbox: Система разрешений и изоляции работает  
- [x] Тестирование: 62 теста покрывают основные сценарии (98% покрытие)
- [ ] Фаза 1: Базовая инфраструктура и сервисы-мосты
- [ ] Фаза 2: Медиа операции (get_media_info, apply_effect, generate_thumbnail)
- [ ] Фаза 3: Timeline операции (get_timeline_state, add/remove/update_clip)
- [ ] Фаза 4: UI и файловая система (show_dialog, menu items, file operations)
- [ ] Фаза 5: Интеграционное тестирование API методов

### ⚠️ Архитектурные ограничения (отложены с TODO):
- ⚠️ `test_event_priority` - приоритет событий (требует изменения EventBus API)
- ⚠️ `test_event_cancellation` - отмена событий (требует изменения EventBus API)
- ⚠️ `test_event_handler_error_propagation` - требует доработки publish логики
- ⚠️ `test_event_handler_async_execution` - требует полную реализацию publish

**Примечание**: Эти тесты нельзя реализовать без изменения архитектуры EventBus. Требуется отдельная задача по расширению EventBus API для поддержки приоритетов, отмены событий и улучшенной обработки ошибок.

## 🔗 Связанные задачи

- [Backend Testing Architecture](../completed/backend-testing-architecture.md) ✅ Завершено
- [Plugin API Integration](./plugin-api-integration.md) 🚧 В процессе  
- [Plugin System Documentation](../../06-plugins/README.md)
- [Video Compiler Integration](../../05-video-compiler/README.md)

## 📚 Референсы

- [Tauri Plugin Development](https://tauri.app/v1/guides/features/plugin)
- [FFmpeg Filter API](https://ffmpeg.org/ffmpeg-filters.html)
- [Timeline State Management](../../04-architecture/state-management.md)

---

*Создано: 24 июня 2025* | *Статус: Запланировано* | *Приоритет: Критический*