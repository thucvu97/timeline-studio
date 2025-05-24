# Тестирование Rust кода

## Обзор

В проекте Timeline Studio реализовано комплексное тестирование Rust кода для обеспечения надежности и качества бэкенда Tauri.

## Структура тестов

### Модульная архитектура `media/`

Тесты организованы по модулям в директории `src-tauri/src/media/`:

- `types.rs` - тесты структур данных и сериализации
- `ffmpeg.rs` - тесты проверки FFmpeg
- `files.rs` - тесты работы с файлами и директориями
- `metadata.rs` - тесты получения метаданных
- `mod.rs` - модульная организация

Всего **13 тестов** покрывают:

#### 1. **Проверка FFmpeg**
```rust
#[test]
fn test_check_ffmpeg()
```
- Проверяет наличие FFmpeg в системе
- Не делает assert, так как FFmpeg может отсутствовать в CI

#### 2. **Работа с директориями**
```rust
#[test]
fn test_get_media_files_with_valid_directory()
fn test_get_media_files_with_invalid_directory()
fn test_get_media_files_with_empty_directory()
```
- Тестирует поиск медиафайлов в директориях
- Проверяет обработку ошибок для несуществующих путей
- Проверяет корректную работу с пустыми директориями

#### 3. **Фильтрация файлов по расширениям**
```rust
#[test]
fn test_supported_media_extensions()
```
- Проверяет, что поддерживаются только медиафайлы
- Тестирует фильтрацию по расширениям: mp4, avi, mkv, mp3, jpg и др.
- Исключает неподдерживаемые форматы: txt, doc, pdf

#### 4. **Получение метаданных**
```rust
#[test]
fn test_get_media_metadata_with_nonexistent_file()
```
- Тестирует обработку ошибок при работе с несуществующими файлами

#### 5. **Сериализация структур данных**
```rust
#[test]
fn test_media_file_structure_serialization()
fn test_media_metadata_enum()
```
- Проверяет корректную сериализацию/десериализацию JSON
- Тестирует структуры: `MediaFile`, `FfprobeStream`, `FfprobeFormat`
- Проверяет enum `MediaMetadata` с тегированными типами

## Запуск тестов

### Команды npm

```bash
# Запуск всех Rust тестов
npm run test:rust

# Запуск тестов в режиме наблюдения
npm run test:rust:watch

# Запуск всех тестов (JS + Rust)
npm run check:all
```

### Команды cargo

```bash
# Из корневой директории
cd src-tauri && cargo test

# Запуск конкретного теста
cd src-tauri && cargo test test_get_media_files_with_valid_directory

# Запуск с подробным выводом
cd src-tauri && cargo test -- --nocapture
```

## Покрытие кода

### Генерация отчета покрытия

```bash
# Генерация LCOV отчета
npm run test:coverage:rust

# Отправка в DeepSource
npm run test:coverage:rust:report
```

### Файлы покрытия

- `src-tauri/coverage.info` - LCOV отчет для Rust кода
- Интеграция с DeepSource для анализа покрытия

## Тестовые утилиты

### Создание временных файлов

```rust
fn create_test_file(dir: &TempDir, name: &str, content: &[u8]) -> String
```
- Создает временный файл для тестирования
- Автоматически очищается после теста

### Создание тестовых директорий

```rust
fn create_test_directory() -> TempDir
```
- Создает временную директорию с тестовыми файлами
- Включает файлы разных типов: видео, аудио, изображения, документы

## Зависимости для тестирования

### В `Cargo.toml`

```toml
[dev-dependencies]
tempfile = "3.8"    # Для создания временных файлов
serde_json = "1"    # Для тестирования сериализации
```

## Результаты тестов

```
running 13 tests
test media::files::tests::test_get_media_files_with_invalid_directory ... ok
test media::files::tests::test_is_media_file ... ok
test media::metadata::tests::test_generate_iso8601_timestamp ... ok
test media::metadata::tests::test_extract_creation_time ... ok
test media::metadata::tests::test_parse_stream_data ... ok
test media::types::tests::test_media_metadata_enum ... ok
test media::types::tests::test_supported_extensions ... ok
test media::types::tests::test_media_file_structure_serialization ... ok
test media::files::tests::test_get_media_files_with_empty_directory ... ok
test media::files::tests::test_get_media_files_with_valid_directory ... ok
test media::files::tests::test_supported_media_extensions ... ok
test media::metadata::tests::test_get_media_metadata_with_nonexistent_file ... ok
test media::ffmpeg::tests::test_check_ffmpeg ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

## Рекомендации

### Добавление новых тестов

1. **Создавайте тесты для каждой новой функции**
2. **Тестируйте граничные случаи и ошибки**
3. **Используйте временные файлы для изоляции тестов**
4. **Добавляйте документацию к тестам**

### Лучшие практики

- ✅ Используйте `#[cfg(test)]` для тестового кода
- ✅ Создавайте вспомогательные функции для повторяющихся операций
- ✅ Тестируйте как успешные, так и ошибочные сценарии
- ✅ Используйте осмысленные имена тестов
- ✅ Добавляйте комментарии к сложным тестам

### Интеграция с CI/CD

Тесты автоматически запускаются в составе `npm run check:all` и должны быть включены в пайплайн CI/CD для обеспечения качества кода.
