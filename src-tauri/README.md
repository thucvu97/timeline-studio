# Timeline Studio - Backend на Rust

## Обзор

Бэкенд Timeline Studio построен на Tauri v2 и предоставляет нативную функциональность для обработки видео, управления файлами и локальный HTTP-сервер для стриминга видео.

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

- **`core`** - Ядро системы (DI, события, плагины, телеметрия)
- **`security`** - Безопасное хранение API ключей и OAuth авторизация
- **`video_server`** - HTTP-сервер для стриминга видео (порт 4567)
- **`video_compiler`** - Движок рендеринга видео на базе FFmpeg
- **`media`** - Извлечение метаданных через FFprobe
- **`recognition`** - Распознавание объектов и сцен (YOLO)
- **`filesystem`** - Файловые операции и утилиты
- **`language`** - Локализация (10 языков)
- **`plugins`** - Примеры плагинов (эффекты, интеграции)

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
- [**Модуль безопасности**](./docs/security-architecture.md) - Защита API ключей и токенов
- [**Сервисный слой**](./docs/service-layer.md) - Архитектура сервисов и паттерны
- [**Система плагинов**](./docs/plugin-system-design.md) - Расширяемость через плагины
- [**Итоги рефакторинга**](./docs/refactoring-summary.md) - Результаты модернизации архитектуры

### 🛠️ Разработка
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
│   ├── lib.rs                     # Конфигурация Tauri
│   ├── core/                      # Ядро системы
│   │   ├── di/                    # Dependency Injection
│   │   ├── events/                # Система событий
│   │   ├── performance/           # Оптимизация производительности
│   │   ├── plugins/               # Система плагинов
│   │   └── telemetry/             # Метрики и мониторинг
│   ├── security/                  # Модуль безопасности
│   │   ├── secure_storage.rs      # Шифрованное хранилище
│   │   ├── api_validator.rs       # Валидация API ключей
│   │   ├── oauth_handler.rs       # OAuth авторизация
│   │   └── env_importer.rs        # Импорт из .env
│   ├── video_server/              # HTTP сервер для видео
│   ├── video_compiler/            # Движок рендеринга
│   │   ├── core/                  # Ядро компилятора
│   │   ├── services/              # Сервисный слой
│   │   ├── ffmpeg_builder/        # Построитель FFmpeg команд
│   │   └── commands/              # Команды Tauri
│   ├── media/                     # Обработка медиа
│   ├── recognition/               # Распознавание (YOLO)
│   ├── plugins/                   # Примеры плагинов
│   ├── filesystem/                # Файловые операции
│   └── language/                  # Локализация
├── tests/                         # Интеграционные тесты
├── docs/                          # Документация
└── Cargo.toml                     # Зависимости
```

## Вклад в проект

### Требования к коду

1. ✅ Пишите тесты для новых функций
2. ✅ Поддерживайте покрытие кода >80%
3. ✅ Запускайте `cargo fmt` перед коммитом
4. ✅ Обновляйте документацию
5. ✅ Следуйте паттернам обработки ошибок
6. ✅ Добавляйте метрики для новых операций

### Полезные команды

```bash
# Проверка форматирования
cargo fmt -- --check

# Линтинг
cargo clippy -- -D warnings

# Полная проверка
cargo check --all-features
```

## Лицензия

Copyright © 2025 Timeline Studio. Все права защищены.