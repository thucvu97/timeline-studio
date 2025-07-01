# Итоги внедрения централизованного управления версиями

## Проблема
Версия приложения (0.26.0) была продублирована в 4-5 файлах, что требовало ручного обновления при каждом релизе.

## Решение

### 1. Созданы скрипты автоматизации
- **`scripts/update-version.js`** - базовый скрипт обновления версий
- **`scripts/version-sync.mjs`** - продвинутый ES модуль с поддержкой стратегий:
  - `manual` - обновление всех файлов из аргумента командной строки
  - `cargo` - синхронизация версии из Cargo.toml
  - `package` - синхронизация версии из package.json

### 2. Добавлены npm скрипты
```json
"update-version": "node scripts/update-version.js",
"version:sync": "node scripts/version-sync.mjs",
"version:from-cargo": "VERSION_STRATEGY=cargo node scripts/version-sync.mjs",
"version:from-package": "VERSION_STRATEGY=package node scripts/version-sync.mjs"
```

### 3. Создан GitHub Actions workflow
- **`.github/workflows/version-bump.yml`** - автоматическое создание PR при изменении версии

### 4. Обновлен код для динамического получения версии
- **`timeline-studio-project-service.ts`** - теперь использует `getVersion()` из Tauri API
- Все тесты обновлены для поддержки async методов

### 5. Добавлена документация
- **`VERSION_MANAGEMENT.md`** - полное руководство по управлению версиями
- **`docs-ru/05-development/version-management.md`** - русская версия документации

## Файлы с версиями

### Основные источники версии:
1. `package.json` - основной источник для frontend
2. `src-tauri/Cargo.toml` - основной источник для backend

### Автоматически синхронизируемые:
1. `src-tauri/tauri.conf.json` - версия приложения Tauri
2. `src/test/mocks/tauri/api/app.ts` - мок для тестов

### Динамически получают версию:
1. `src/features/app-state/services/timeline-studio-project-service.ts` - через `getVersion()`

## Использование

### Ручное обновление версии:
```bash
npm run update-version 0.27.0
```

### Синхронизация из package.json:
```bash
npm run version:from-package
```

### Синхронизация из Cargo.toml:
```bash
npm run version:from-cargo
```

## Результат
- Устранено дублирование версий
- Автоматизирован процесс обновления
- Добавлена защита от ошибок
- Улучшена поддерживаемость кода
- Версия теперь всегда актуальна во всех частях приложения