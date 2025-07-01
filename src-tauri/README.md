# Timeline Studio - Backend на Rust

## Обзор

Бэкенд Timeline Studio построен на Tauri v2 и предоставляет нативную функциональность для обработки видео, управления файлами и локальный HTTP-сервер для стриминга видео.

### Ключевые характеристики
- **280+ Tauri команд** для взаимодействия с фронтендом
- **10 основных модулей** с четкой архитектурой
- **100% покрытие тестами** в core модуле
- **Async/await** архитектура для неблокирующих операций
- **Сервис-ориентированная** архитектура с DI контейнером

## Быстрый старт

### Требования

- Rust 1.81.0+
- FFmpeg 7.0+
- Node.js 18+ и Bun
- ONNX Runtime (для функций распознавания)

### Установка зависимостей

```bash
# macOS
brew install ffmpeg onnxruntime
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib

# Ubuntu/Debian  
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev libavutil-dev
# Установка ONNX Runtime отдельно

# Windows
# См. подробные инструкции в CLAUDE.md
```

### Разработка

```bash
# Сборка
cargo build

# Запуск тестов
cargo test

# Запуск с покрытием кода
cargo tarpaulin --out Html --output-dir coverage

# Запуск в режиме разработки
cargo tauri dev
```

## Архитектура

### Основные модули

- **`core`** - Ядро системы (DI, события, плагины, телеметрия, производительность)
  - 115 unit тестов, 100% покрытие
  - Dependency Injection контейнер
  - Event Bus для межкомпонентного взаимодействия
  - WASM-based система плагинов
  - OpenTelemetry интеграция
  - Performance optimization (кэширование, worker pools)
- **`security`** - Безопасное хранение API ключей и OAuth авторизация
  - Шифрование AES-GCM для API ключей
  - Интеграция с системными хранилищами (Keychain, Credential Manager)
  - OAuth поддержка для YouTube, Instagram, TikTok
- **`video_server`** - HTTP-сервер для стриминга видео (порт 4567)
  - Range запросы для видео стриминга
  - CORS конфигурация
- **`video_compiler`** - Движок рендеринга видео на базе FFmpeg (400+ команд)
  - GPU ускорение (NVENC, QuickSync, VideoToolbox, AMF)
  - Pipeline архитектура с этапами обработки
  - LRU кэш для превью и метаданных
  - Восстановление битых ссылок на медиафайлы
- **`media`** - Извлечение метаданных через FFprobe
  - Параллельная обработка файлов
  - Кэширование метаданных
  - Генерация миниатюр
- **`recognition`** - Распознавание объектов и сцен (YOLO)
  - ONNX Runtime интеграция
  - Батч обработка видео
  - Агрегация результатов
- **`filesystem`** - Файловые операции и утилиты
- **`language_tauri`** - Локализация (10 языков)
- **`plugins`** - Примеры плагинов (эффекты, интеграции)
- **`subtitles`** - Работа с субтитрами (SRT, VTT, ASS)

### Ключевые возможности

- ✅ Аппаратное ускорение (NVENC, QuickSync, VideoToolbox, AMF)
- ✅ Стриминг видео с поддержкой Range-запросов
- ✅ Генерация превью и миниатюр
- ✅ Кеширование рендеров
- ✅ Мониторинг производительности и метрики
- ✅ Комплексная обработка ошибок

## Основные API команды

### Обработка видео
- `compile_video` - Рендеринг видеопроекта
- `generate_preview` - Генерация превью
- `extract_frame` - Извлечение кадра
- `get_gpu_capabilities` - Проверка GPU-кодировщиков

### Работа с медиа
- `get_media_metadata` - Метаданные файла
- `register_video` - Регистрация для стриминга
- `get_media_files` - Список медиафайлов

### Безопасность и API ключи
- `store_api_key` - Безопасное сохранение API ключа
- `get_api_key` - Получение сохраненного ключа
- `validate_api_key` - Проверка валидности ключа
- `import_env_keys` - Импорт ключей из .env
- `get_oauth_url` - Генерация OAuth URL
- `exchange_oauth_code` - Обмен OAuth кода на токен

### Файловая система
- `file_exists` - Проверка существования
- `get_file_stats` - Статистика файла
- `search_files_by_name` - Поиск файлов

## Документация

### 📚 Архитектура и дизайн
- [**Архитектура бэкенда**](./docs/architecture.md) - Общая архитектура и структура кода
- [**Диаграмма архитектуры**](./docs/backend-architecture-diagram.md) - Визуальное представление взаимодействия модулей
- [**Модуль безопасности**](./docs/security-architecture.md) - Защита API ключей и токенов
- [**Сервисный слой**](./docs/service-layer.md) - Архитектура сервисов и паттерны
- [**Система плагинов**](./docs/plugin-system-design.md) - Расширяемость через плагины
- [**Итоги рефакторинга**](./docs/refactoring-summary.md) - Результаты модернизации архитектуры

### 🛠️ Разработка
- [**Checklist разработки**](./docs/development-checklist.md) - Пошаговое руководство для новых функций
- [**Статус зависимостей**](./docs/dependencies-status.md) - Актуальность всех зависимостей
- [**Руководство по тестированию**](./docs/testing-guide.md) - Стратегия тестирования и покрытие
- [**Интеграция с FFmpeg**](./docs/ffmpeg-integration.md) - Работа с FFmpeg и кодировщиками
- [**Обработка ошибок**](./docs/error-handling-guide.md) - Типы ошибок и восстановление
- [**Мониторинг и метрики**](./docs/monitoring-and-metrics.md) - Система мониторинга производительности

### 📦 Документация модулей
- [**Core**](./src/core/README.md) - Ядро системы и основные компоненты
  - [Performance](./src/core/performance/README.md) - Оптимизация производительности
  - [Plugins](./src/core/plugins/README.md) - Система плагинов
  - [Telemetry](./src/core/telemetry/README.md) - Телеметрия и аналитика
- [**Video Compiler**](./src/video_compiler/README.md) - Движок рендеринга видео
- [**Media**](./src/media/README.md) - Обработка медиафайлов
- [**Recognition**](./src/recognition/README.md) - Распознавание объектов и сцен

## Структура проекта

```
src-tauri/
├── src/
│   ├── main.rs                    # Точка входа
│   ├── lib.rs                     # Конфигурация Tauri и инициализация
│   ├── app_builder.rs             # Регистрация всех команд (280+)
│   ├── command_registry.rs        # Реестр команд
│   ├── core/                      # Ядро системы
│   │   ├── di.rs                  # Dependency Injection контейнер
│   │   ├── events.rs              # Event Bus система
│   │   ├── mod.rs                 # Экспорт модулей
│   │   ├── test_utils.rs          # Тестовая инфраструктура
│   │   ├── performance/           # Оптимизация производительности
│   │   │   ├── cache.rs           # LRU/LFU/FIFO кэширование
│   │   │   ├── memory.rs          # Memory pooling
│   │   │   ├── runtime.rs         # Worker pools
│   │   │   └── zerocopy.rs        # Zero-copy операции
│   │   ├── plugins/               # Система плагинов
│   │   │   ├── manager.rs         # Управление плагинами
│   │   │   ├── loader.rs          # WASM загрузчик
│   │   │   ├── sandbox.rs         # Изоляция плагинов
│   │   │   ├── permissions.rs     # Система разрешений
│   │   │   └── api.rs             # Plugin API
│   │   └── telemetry/             # Метрики и мониторинг
│   │       ├── metrics.rs         # OpenTelemetry метрики
│   │       ├── health.rs          # Health checks
│   │       ├── tracer.rs          # Distributed tracing
│   │       └── middleware.rs      # HTTP middleware
│   ├── security/                  # Модуль безопасности
│   │   ├── secure_storage.rs      # Шифрованное хранилище
│   │   ├── api_validator.rs       # Валидация API ключей
│   │   ├── api_validator_service.rs # Асинхронная валидация
│   │   ├── oauth_handler.rs       # OAuth авторизация
│   │   ├── env_importer.rs        # Импорт из .env
│   │   ├── commands.rs            # Tauri команды
│   │   ├── additional_commands.rs # Дополнительные команды
│   │   └── registry.rs            # Регистрация команд
│   ├── video_server/              # HTTP сервер для видео
│   ├── video_compiler/            # Движок рендеринга (400+ команд)
│   │   ├── core/                  # Ядро компилятора
│   │   │   ├── pipeline.rs        # Pipeline архитектура
│   │   │   ├── gpu.rs             # GPU ускорение
│   │   │   ├── cache.rs           # Кэширование
│   │   │   └── stages/            # Этапы pipeline
│   │   ├── services/              # Сервисный слой
│   │   ├── ffmpeg_builder/        # Построитель FFmpeg команд
│   │   ├── ffmpeg_executor.rs     # Исполнитель команд
│   │   ├── schema/                # Структуры данных проекта
│   │   └── commands/              # 50+ модулей команд
│   ├── media/                     # Обработка медиа
│   │   ├── processor.rs           # Асинхронный процессор
│   │   ├── metadata_extractor.rs  # Извлечение метаданных
│   │   ├── preview_manager.rs     # Генерация превью
│   │   └── media_analyzer.rs      # Анализ медиафайлов
│   ├── recognition/               # Распознавание (YOLO)
│   │   ├── yolo_processor.rs      # YOLO обработчик
│   │   ├── model_manager.rs       # Управление моделями
│   │   ├── frame_processor.rs     # Обработка кадров
│   │   └── commands/              # Команды распознавания
│   ├── plugins/                   # Примеры плагинов
│   │   └── examples/              # BlurEffect, YouTubeUploader
│   ├── filesystem.rs              # Файловые операции
│   ├── language_tauri.rs          # Локализация
│   ├── subtitles/                 # Работа с субтитрами
│   └── app_dirs.rs                # Управление директориями
├── tests/                         # Интеграционные тесты
├── docs/                          # Документация
│   ├── architecture.md            # Общая архитектура
│   ├── security-architecture.md   # Архитектура безопасности
│   ├── service-layer.md           # Сервисный слой
│   ├── plugin-system-design.md    # Система плагинов
│   ├── testing-guide.md           # Руководство по тестированию
│   ├── ffmpeg-integration.md      # Интеграция FFmpeg
│   ├── error-handling-guide.md    # Обработка ошибок
│   └── monitoring-and-metrics.md  # Мониторинг
└── Cargo.toml                     # Зависимости
```

## Разработка новых функций

### Добавление новой Tauri команды

1. **Создайте команду** в соответствующем модуле:
```rust
#[tauri::command]
pub async fn my_new_command(
    state: State<'_, MyState>,
    param: String
) -> Result<ReturnType, String> {
    // Реализация
}
```

2. **Зарегистрируйте команду** в `app_builder.rs`:
```rust
// В invoke_handler добавьте:
crate::my_module::my_new_command,
```

3. **Добавьте тесты** для команды
4. **Обновите TypeScript типы** запустив в debug режиме
5. **Документируйте** команду в README модуля

### Создание нового модуля

1. Создайте директорию в `src/`
2. Добавьте `mod.rs` с экспортами
3. Создайте `commands.rs` для Tauri команд
4. Добавьте `types.rs` для структур данных
5. Создайте `tests/` директорию с тестами
6. Добавьте README.md с документацией
7. Зарегистрируйте модуль в `lib.rs`

## Вклад в проект

### Требования к коду

1. ✅ Пишите тесты для новых функций
2. ✅ Поддерживайте покрытие кода >80%
3. ✅ Запускайте `cargo fmt` перед коммитом
4. ✅ Обновляйте документацию
5. ✅ Следуйте паттернам обработки ошибок
6. ✅ Добавляйте метрики для новых операций
7. ✅ Используйте async/await для I/O операций
8. ✅ Применяйте DI для управления зависимостями

### Полезные команды

```bash
# Проверка форматирования
cargo fmt -- --check

# Линтинг
cargo clippy -- -D warnings

# Полная проверка
cargo check --all-features
```

## Архитектурные принципы

### 1. Модульность
- Каждый модуль самодостаточен со своими командами, типами и тестами
- Модули взаимодействуют через четко определенные интерфейсы
- Зависимости инжектируются через DI контейнер

### 2. Асинхронность
- Все I/O операции асинхронные (tokio)
- Неблокирующая архитектура для высокой производительности
- Правильная обработка отмены операций

### 3. Безопасность
- Type-safe код без unsafe блоков в production путях
- Шифрование конфиденциальных данных
- Валидация всех внешних входных данных

### 4. Производительность
- LRU кэширование для часто используемых данных
- Zero-copy операции где возможно
- GPU ускорение для обработки видео
- Worker pools для параллельной обработки

### 5. Наблюдаемость
- Структурированное логирование
- OpenTelemetry метрики и трейсинг
- Health checks для всех сервисов
- Детальная обработка ошибок

## Версии и обновления

### Текущие версии (январь 2025)
- **Tauri**: 2.5 (рекомендуется обновить до 2.6.2)
- **Rust**: 1.81.0+
- **FFmpeg**: 7.0+
- **ONNX Runtime**: 2.0.0-rc.10

### План обновления зависимостей
1. Обновить Tauri до 2.6.2 для последних исправлений
2. Проверить совместимость плагинов с новой версией
3. Обновить tauri-build до соответствующей версии
4. Протестировать на всех платформах

## Лицензия

Copyright © 2025 Timeline Studio. Все права защищены.