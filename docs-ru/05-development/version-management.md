# Управление версиями

## Обзор

Timeline Studio использует централизованную систему управления версиями, где версия приложения синхронизируется между несколькими файлами:

- `package.json` - версия npm пакета
- `src-tauri/Cargo.toml` - версия Rust приложения  
- `src-tauri/tauri.conf.json` - версия Tauri приложения
- `src/test/mocks/tauri/api/app.ts` - версия в тестовых моках

## Проблема

При ручном обновлении версии приходится изменять все эти файлы, что неудобно и может привести к рассинхронизации версий.

## Решение

### 1. Автоматические скрипты

Созданы два скрипта для управления версиями:

#### `scripts/update-version.js`
Базовый скрипт для обновления версии во всех файлах:

```bash
# Обновить версию до 0.27.0
npm run update-version 0.27.0
```

#### `scripts/version-sync.mjs`
Продвинутый скрипт с поддержкой различных стратегий:

```bash
# Обновить версию вручную
npm run version:sync 0.27.0

# Взять версию из Cargo.toml как основную
npm run version:from-cargo

# Взять версию из package.json как основную
npm run version:from-package
```

### 2. Процесс обновления версии

#### Локальная разработка

1. Обновите версию:
   ```bash
   npm run update-version 0.27.0
   ```

2. Проверьте изменения:
   ```bash
   git diff
   ```

3. Запустите тесты:
   ```bash
   npm test
   npm run test:rust
   ```

4. Создайте коммит:
   ```bash
   git add -A
   git commit -m "chore: bump version to 0.27.0"
   ```

5. Создайте тег:
   ```bash
   git tag v0.27.0
   ```

6. Отправьте изменения:
   ```bash
   git push origin main
   git push origin v0.27.0
   ```

#### CI/CD автоматизация

Создан GitHub Action workflow `.github/workflows/version-bump.yml` для автоматизации процесса:

1. Перейдите в Actions → Version Bump
2. Нажмите "Run workflow"
3. Выберите тип обновления:
   - `patch` - 0.26.0 → 0.26.1
   - `minor` - 0.26.0 → 0.27.0
   - `major` - 0.26.0 → 1.0.0
   - `custom` - произвольная версия

Workflow автоматически создаст Pull Request с обновленными версиями.

### 3. Альтернативные подходы

#### Автоматическое определение версии Tauri

Можно удалить поле `version` из `tauri.conf.json`, и Tauri автоматически возьмет версию из `Cargo.toml`:

```diff
// src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Timeline Studio",
- "version": "0.26.0",
  "identifier": "com.chatman-media.timeline-studio",
```

#### Ссылка на package.json

```json
// src-tauri/tauri.conf.json
{
  "version": "../package.json"
}
```

#### Workspace версии для Rust

Для больших проектов можно использовать workspace версии:

```toml
# Корневой Cargo.toml
[workspace]
members = ["src-tauri"]

[workspace.package]
version = "0.26.0"

# src-tauri/Cargo.toml
[package]
version.workspace = true
```

## Интеграция с релизами

### Semantic Release

Для полной автоматизации можно настроить semantic-release:

```bash
npm install --save-dev semantic-release @semantic-release/git @semantic-release/changelog
```

Конфигурация `.releaserc.json`:
```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "npm run update-version ${nextRelease.version}"
      }
    ],
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

### Conventional Commits

Используйте conventional commits для автоматического определения типа версии:

- `fix:` - patch версия
- `feat:` - minor версия  
- `BREAKING CHANGE:` - major версия

## Проверка версий

### Текущая версия приложения

```typescript
import { getVersion } from '@tauri-apps/api/app';

const version = await getVersion();
console.log('App version:', version);
```

### В Rust коде

```rust
let version = env!("CARGO_PKG_VERSION");
println!("App version: {}", version);
```

## Troubleshooting

### Версии не синхронизированы

Запустите скрипт синхронизации:
```bash
npm run version:sync $(node -p "require('./package.json').version")
```

### Ошибка при обновлении

Проверьте права доступа к файлам и валидность JSON/TOML синтаксиса.

### CI/CD не создает PR

Убедитесь, что у GitHub Actions есть права на создание PR в настройках репозитория.

## Best Practices

1. **Всегда используйте скрипты** для обновления версий
2. **Следуйте Semantic Versioning**: MAJOR.MINOR.PATCH
3. **Создавайте теги** для каждой версии
4. **Обновляйте CHANGELOG** при изменении версии
5. **Тестируйте** перед релизом на всех платформах

## Связанные документы

- [CI/CD Setup](./ci-cd-setup.md) - настройка автоматизации
- [Build](../06-deployment/build.md) - процесс сборки
- [Development Commands](./development-commands.md) - команды разработки