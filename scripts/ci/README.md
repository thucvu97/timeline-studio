# CI/CD Scripts

Этa папка содержит скрипты, используемые в GitHub Actions workflows и для локальной разработки.

## Скрипты установки FFmpeg

### `setup-ffmpeg-windows.ps1`
PowerShell скрипт для установки FFmpeg на Windows.
- Скачивает предсобранные библиотеки
- Настраивает переменные окружения
- Проверяет наличие заголовков и библиотек

### `setup-ffmpeg-macos.sh`
Bash скрипт для установки FFmpeg на macOS.
- Использует Homebrew
- Настраивает DYLIB пути
- Экспортирует переменные окружения

### `setup-ffmpeg-linux.sh`
Bash скрипт для установки FFmpeg на Linux.
- Использует apt-get
- Устанавливает dev пакеты
- Настраивает pkg-config

### `setup-ffmpeg-pkg-config.sh`
Настройка pkg-config для FFmpeg на Unix системах.

### `setup-rust-env-windows.ps1`
Настройка Rust окружения для Windows сборок.
- Конфигурирует пути к FFmpeg
- Устанавливает BINDGEN переменные

## Скрипты версионирования

### `version-sync.mjs`
ES модуль для синхронизации версий между файлами:
- package.json
- Cargo.toml (src-tauri)
- tauri.conf.json
- version.json

Использование:
```bash
# Синхронизировать из package.json
npm run version:sync

# Синхронизировать из Cargo.toml
npm run version:from-cargo
```

### `update-version.cjs`
CommonJS скрипт для обновления версии проекта.
Обновляет все файлы с версиями одновременно.

### `sync-version.js`
Простой скрипт синхронизации версий (legacy).

## Скрипты changelog

### `sync-changelog.js`
Синхронизирует CHANGELOG.md с промо-сайтом.
Используется в `sync-changelog.yml` workflow.

## Использование в workflows

Эти скрипты вызываются из GitHub Actions:

```yaml
# Пример из workflow
- name: Setup FFmpeg
  run: ./scripts/ci/setup-ffmpeg-windows.ps1
  shell: pwsh
```

## Локальное использование

Для локальной разработки можно запускать скрипты напрямую:

```bash
# macOS
./scripts/ci/setup-ffmpeg-macos.sh

# Windows (PowerShell)
.\scripts\ci\setup-ffmpeg-windows.ps1

# Синхронизация версий
npm run version:sync
```

## Переменные окружения

Скрипты устанавливают следующие переменные:

### FFmpeg
- `FFMPEG_DIR` - Корневая директория FFmpeg
- `FFMPEG_INCLUDE_DIR` - Директория заголовков
- `FFMPEG_LIB_DIR` - Директория библиотек
- `PKG_CONFIG_PATH` - Путь к pkg-config файлам

### ONNX Runtime
- `ORT_DYLIB_PATH` - Путь к динамической библиотеке (macOS)
- `ORT_LIB_PATH` - Путь к библиотеке (Linux)

## Поддержка

При проблемах с скриптами:
1. Проверьте права на выполнение (`chmod +x script.sh`)
2. Убедитесь в наличии зависимостей (brew, apt-get, PowerShell)
3. Проверьте логи в GitHub Actions