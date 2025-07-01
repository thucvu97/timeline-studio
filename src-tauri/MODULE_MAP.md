# 🗺️ Карта модулей Timeline Studio Backend

Быстрая навигация по всем модулям бэкенда с кратким описанием и ссылками на документацию.

## 📦 Основные модули

### [🎯 Core](./src/core/README.md)
**Ядро системы** - 115 тестов, 100% покрытие
- `di.rs` - Dependency Injection контейнер
- `events.rs` - Event Bus для асинхронной коммуникации
- [`performance/`](./src/core/performance/README.md) - Кэширование и оптимизация
- [`plugins/`](./src/core/plugins/README.md) - WASM система плагинов
- [`telemetry/`](./src/core/telemetry/README.md) - Метрики и мониторинг

### [🎬 Video Compiler](./src/video_compiler/README.md)
**Движок рендеринга** - 400+ команд
- Pipeline архитектура обработки
- GPU ускорение (NVENC, QuickSync, VideoToolbox)
- LRU кэш для промежуточных результатов
- Восстановление битых ссылок на медиа

### [🎵 Media](./src/media/README.md)
**Обработка медиафайлов**
- Извлечение метаданных через FFprobe
- Генерация превью и миниатюр
- Параллельная обработка файлов
- Кэширование метаданных

### [🔐 Security](./src/security/README.md)
**Безопасность и API ключи**
- Шифрование AES-256-GCM
- Интеграция с OS keychains
- OAuth 2.0 авторизация
- Валидация API ключей

### [🔍 Recognition](./src/recognition/README.md)
**Распознавание объектов и сцен**
- YOLO модели через ONNX Runtime
- Батч обработка видео
- Агрегация результатов по сценам
- GPU ускорение

### [📡 Video Server](./src/video_server/README.md)
**HTTP сервер для стриминга**
- Порт 4567
- Range запросы для видео
- CORS конфигурация
- Высокая производительность (10Gbps+)

### [🗂️ File System](./src/filesystem.rs)
**Файловые операции**
- Безопасная работа с путями
- Проверка существования файлов
- Поиск по имени
- Статистика файлов

### [🌍 Language](./src/language_tauri.rs)
**Локализация**
- 10 языков поддержки
- Синхронизация с фронтендом
- Fallback на английский

### [🎨 Plugins](./src/plugins/)
**Примеры плагинов**
- `blur_effect/` - Эффект размытия
- `youtube_uploader/` - Загрузка на YouTube
- `analytics_tracker/` - Отслеживание аналитики

### [📝 Subtitles](./src/subtitles/)
**Работа с субтитрами**
- Поддержка SRT, VTT, ASS
- Парсинг и генерация
- Синхронизация с видео

### [📂 App Dirs](./src/app_dirs.rs)
**Управление директориями**
- Пути к данным приложения
- Кэш директории
- Проекты и медиафайлы

## 🏗️ Архитектурные компоненты

### Сервисный слой
- **VideoCompilerService** - основной сервис рендеринга
- **MediaProcessorService** - обработка медиа
- **SecurityService** - управление ключами
- **RecognitionService** - ML обработка

### Command Registry
- **280+ Tauri команд** организованных по модулям
- Автоматическая регистрация в `app_builder.rs`
- Type-safe биндинги для фронтенда

### Утилиты
- **FFmpeg Builder** - генерация команд FFmpeg
- **FFmpeg Executor** - выполнение с прогрессом
- **Cache Manager** - централизованное кэширование
- **Error Handler** - унифицированная обработка ошибок

## 📊 Статистика

| Модуль | Команд | Тестов | Покрытие |
|--------|--------|--------|----------|
| Core | - | 115 | 100% |
| Video Compiler | 400+ | 50+ | 85% |
| Media | 20+ | 30+ | 90% |
| Security | 15+ | 25+ | 95% |
| Recognition | 10+ | 20+ | 88% |
| **Всего** | **450+** | **240+** | **91%** |

## 🚀 Быстрый старт для разработчиков

### Добавление новой команды
1. Создайте функцию в соответствующем модуле `commands/`
2. Добавьте `#[tauri::command]` аннотацию
3. Зарегистрируйте в `app_builder.rs`
4. Напишите тесты
5. Обновите документацию

### Создание нового сервиса
1. Реализуйте `Service` trait из `core::di`
2. Добавьте в DI контейнер
3. Создайте команды для API
4. Покройте тестами

### Разработка плагина
1. Используйте примеры из `src/plugins/examples/`
2. Реализуйте Plugin API
3. Компилируйте в WASM
4. Настройте permissions
5. Тестируйте в sandbox

## 📚 Дополнительные ресурсы

- [Архитектура](./ARCHITECTURE.md) - Общая архитектура системы
- [Best Practices](./DEVELOPMENT_BEST_PRACTICES.md) - Руководство по разработке
- [Dependency Updates](./DEPENDENCY_UPDATE_PLAN.md) - План обновления зависимостей
- [Testing Guide](./docs/testing-guide.md) - Стратегия тестирования
- [FFmpeg Integration](./docs/ffmpeg-integration.md) - Работа с FFmpeg
- [Plugin Development](./docs/plugin-system-design.md) - Создание плагинов

## 🔧 Полезные команды

```bash
# Запуск всех тестов
cargo test --all-features

# Проверка покрытия
cargo tarpaulin --out Html

# Проверка производительности
cargo bench

# Генерация документации
cargo doc --open

# Проверка безопасности
cargo audit
```

---
*Последнее обновление: Январь 2025*