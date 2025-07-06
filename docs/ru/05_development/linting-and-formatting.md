# Линтинг и форматирование кода

Подробное руководство по настройке и использованию инструментов для проверки качества кода в Timeline Studio.

## 🎯 Обзор инструментов

Timeline Studio использует несколько инструментов для обеспечения качества кода:

- **ESLint** - линтинг JavaScript/TypeScript
- **Stylelint** - линтинг CSS
- **Clippy** - линтинг Rust кода  
- **rustfmt** - форматирование Rust кода
- **Biome** - альтернативный быстрый линтер/форматтер
- **Prettier** - встроен в ESLint конфигурацию

## 📁 Конфигурационные файлы

### ESLint
- **Файл**: `eslint.config.mjs`
- **Основан на**: ESLint 9 с flat config
- **Плагины**: TypeScript, React, Import ordering
- **Особенности**:
  - Поддержка TypeScript strict mode
  - Автоматическая сортировка импортов
  - React hooks правила
  - Next.js специфичные правила

### Stylelint  
- **Файл**: `.stylelintrc.json`
- **Конфигурация**: Standard + Tailwind CSS
- **Особенности**:
  - Поддержка Tailwind CSS директив (@apply, @layer, etc.)
  - Игнорирование дублирующих селекторов для Tailwind
  - Автоисправление при сохранении (в VS Code)

### Clippy (Rust)
- **Файл**: `src-tauri/Cargo.toml` + CLI флаги
- **Уровень**: `-D warnings` (warnings как errors)
- **Особенности**:
  - Строгие правила качества кода
  - Автоисправления где возможно
  - Проверка на неиспользуемый код

### Biome
- **Файл**: `biome.json`
- **Альтернатива**: ESLint + Prettier
- **Преимущества**: Значительно быстрее ESLint

## 🚀 Команды линтинга

### JavaScript/TypeScript (ESLint)

```bash
# Проверка всех TS/JS файлов
bun run lint

# Автоисправление ошибок
bun run lint:fix

# Только форматирование импортов
bun run format:imports

# Версии для Windows (обходят проблемы с путями)
bun run lint:windows
bun run lint:fix:windows
bun run format:imports:windows
```

**Что проверяется:**
- Синтаксические ошибки TypeScript
- Неиспользуемые переменные и импорты
- React hooks правила
- Порядок импортов (builtin → external → internal → sibling)
- Code style и форматирование

### CSS (Stylelint)

```bash
# Проверка всех CSS файлов
bun run lint:css

# Автоисправление ошибок
bun run lint:css:fix
```

**Что проверяется:**
- CSS синтаксис и валидность
- Tailwind CSS совместимость
- Порядок свойств
- Дублирующие правила (кроме Tailwind)

### Rust (Clippy + rustfmt)

```bash
# Только проверка линтинга
bun run lint:rust

# Автоисправление ошибок
bun run lint:rust:fix

# Только форматирование
bun run format:rust

# Проверка форматирования (CI)
bun run format:rust:check

# Комплексная проверка
bun run check:rust
```

**Что проверяется:**
- Потенциальные ошибки и небезопасный код
- Производительность и идиомы Rust
- Неиспользуемый код и импорты
- Стиль кодирования
- Форматирование (отступы, пробелы, etc.)

### Biome (альтернативный)

```bash
# Проверка (линтинг + форматирование)
bun run biome:check

# Автоисправление
bun run biome:check:apply

# Только форматирование
bun run biome:format

# Только линтинг
bun run biome:lint

# Автоисправление линтинга
bun run biome:lint:fix
```

## 🔄 Комплексные команды

### Проверка всего проекта
```bash
# Полная проверка (линтинг + тесты)
bun run check:all

# Только линтинг всех языков
bun run lint && bun run lint:css && bun run lint:rust
```

### Автоисправление всего
```bash
# Исправление всех автоисправляемых ошибок
bun run fix:all

# Только Rust исправления
bun run fix:rust
```

## ⚙️ Настройка IDE

### VS Code

Рекомендуемые расширения:
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss", 
    "stylelint.vscode-stylelint",
    "rust-lang.rust-analyzer",
    "biomejs.biome"
  ]
}
```

Настройки (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "rust-analyzer.checkOnSave.command": "clippy",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### JetBrains IDEs

1. Установить плагины:
   - ESLint
   - Stylelint  
   - Rust
   - Tailwind CSS

2. Включить автоисправление при сохранении:
   - File → Settings → Tools → Actions on Save
   - ✅ Reformat code
   - ✅ Run eslint --fix
   - ✅ Run code cleanup

## 🤖 CI/CD интеграция

### GitHub Actions

Workflow файлы:
- `lint-js.yml` - проверка JS/TS (запускается при изменении JS/TS файлов)
- `lint-css.yml` - проверка CSS (запускается при изменении CSS файлов)  
- `lint-rs.yml` - проверка Rust (запускается при изменении Rust файлов)
- `check-all.yml` - полная проверка (запускается всегда)

### Pre-commit hooks

Можно настроить с помощью `husky`:

```bash
# Установка husky
bun add -D husky

# Настройка pre-commit hook
echo "bun run check:all" > .husky/pre-commit
chmod +x .husky/pre-commit
```

## 🚨 Решение проблем

### Распространенные ошибки ESLint

**Проблема**: `import/order` ошибки
```bash
# Решение: автоисправление импортов
bun run format:imports
```

**Проблема**: TypeScript ошибки типов  
```bash
# Решение: проверить tsconfig.json и типы
bun run lint --ext .ts,.tsx --no-fix
```

### Распространенные ошибки Stylelint

**Проблема**: Tailwind директивы не распознаются
```json
// .stylelintrc.json - проверить конфигурацию
{
  "extends": ["stylelint-config-tailwindcss"],
  "rules": {
    "at-rule-no-unknown": [true, {
      "ignoreAtRules": ["tailwind", "apply", "variants", "responsive", "screen"]
    }]
  }
}
```

### Распространенные ошибки Clippy

**Проблема**: `clippy::assertions_on_constants`
```rust
// Плохо
assert!(true);

// Хорошо - убрать или заменить на осмысленную проверку
// Если тест доходит до конца функции - он успешен
```

**Проблема**: `clippy::unused_variables`
```rust
// Плохо
let unused_var = 42;

// Хорошо - добавить префикс _
let _unused_var = 42;
// или использовать переменную
```

## 📊 Метрики качества

### Цели проекта
- **ESLint**: 0 ошибок, 0 предупреждений
- **Stylelint**: 0 ошибок
- **Clippy**: 0 ошибок (warnings как errors)
- **rustfmt**: все файлы отформатированы

### Мониторинг
- CI/CD статус badges в README
- Автоматические проверки в PR
- Покрытие кода в codecov

## 🔧 Кастомизация правил

### Отключение правил ESLint
```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      // Отключить конкретное правило
      '@typescript-eslint/no-unused-vars': 'off',
      
      // Изменить уровень
      'import/order': 'warn'
    }
  }
];
```

### Отключение правил Clippy
```rust
// Для всего файла
#![allow(clippy::too_many_arguments)]

// Для функции
#[allow(clippy::redundant_closure)]
fn example() {}

// Для блока кода
#[allow(clippy::needless_return)]
{
    return value;
}
```

### Игнорирование файлов

**ESLint** (`.eslintignore`):
```
dist/
node_modules/
*.generated.ts
```

**Stylelint** (`.stylelintignore`):
```
dist/
node_modules/
*.min.css
```

**rustfmt** (`src-tauri/.rustfmt.toml`):
```toml
ignore = [
    "src/generated/",
]
```