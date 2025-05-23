# DeepSource Integration

Этот проект интегрирован с DeepSource для автоматического анализа качества кода и покрытия тестами.

## Настройка

### 1. Установка DeepSource CLI

```bash
curl https://deepsource.io/cli | sh
```

### 2. Настройка переменной окружения

Получите DSN из настроек репозитория в DeepSource и установите переменную окружения:

```bash
export DEEPSOURCE_DSN=https://your-dsn@deepsource.io
```

## Использование

### Анализ покрытия тестами

#### JavaScript/TypeScript
```bash
# Запуск тестов с генерацией отчета покрытия
npm run test:coverage

# Отправка отчета в DeepSource
npm run test:coverage:report
```

#### Rust
```bash
# Предварительные требования (выполнить один раз)
# 1. Установить rustup (если Rust установлен через Homebrew)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path

# 2. Добавить cargo в PATH и установить llvm-tools-preview
source "$HOME/.cargo/env"
rustup component add llvm-tools-preview

# 3. Установить cargo-llvm-cov
cargo install cargo-llvm-cov

# Генерация отчета покрытия
cd src-tauri
source "$HOME/.cargo/env"
cargo llvm-cov --lcov --output-path coverage.info

# Отправка отчета в DeepSource
../bin/deepsource report --analyzer test-coverage --key rust --value-file ./coverage.info
```

## Конфигурация

Конфигурация DeepSource находится в файле `.deepsource.toml` и включает:

- **JavaScript анализатор**: анализ TypeScript/React кода
- **Rust анализатор**: анализ Rust кода в `src-tauri`
- **Test Coverage анализатор**: анализ покрытия тестами
- **Prettier трансформер**: автоматическое форматирование кода

## Автоматизация в CI/CD

Для автоматической отправки отчетов в CI/CD добавьте в ваш workflow:

```yaml
- name: Install DeepSource CLI
  run: curl https://deepsource.io/cli | sh

- name: Run tests and report coverage
  env:
    DEEPSOURCE_DSN: ${{ secrets.DEEPSOURCE_DSN }}
  run: |
    npm run test:coverage
    ./bin/deepsource report --analyzer test-coverage --key javascript --value-file ./coverage/lcov.info
```

## Исключения

Следующие файлы и папки исключены из анализа:
- `node_modules/**`
- `dist/**`, `build/**`, `.next/**`
- `coverage/**`, `docs/**`
- `promo/**`
- `src/lib/dayjs.ts`
