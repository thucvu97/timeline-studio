# Решение проблем с Tailwind CSS v4 в CI/CD

## Проблема

Tailwind CSS v4 использует нативные модули (native bindings), которые могут не работать в некоторых CI/CD средах, особенно на Ubuntu в GitHub Actions.

Ошибка выглядит так:
```
Error: Failed to load native binding
    at Object.<anonymous> (/path/to/node_modules/@tailwindcss/oxide/index.js:372:11)
```

## Решения

### 1. Переменные окружения (Рекомендуется)

Мы добавили переменную окружения `TAILWIND_DISABLE_TOUCH=true`, которая заставляет Tailwind CSS использовать fallback вместо нативных модулей.

#### В GitHub Actions:
```yaml
- name: Setup Tailwind CSS fallback for CI
  run: |
    echo "TAILWIND_DISABLE_TOUCH=true" >> $GITHUB_ENV
    echo "NODE_ENV=production" >> $GITHUB_ENV
```

#### Локально (если нужно):
```bash
export TAILWIND_DISABLE_TOUCH=true
npm run build
```

### 2. Специальный скрипт для CI

Добавлен скрипт `build:ci` в package.json:
```json
{
  "scripts": {
    "build:ci": "TAILWIND_DISABLE_TOUCH=true NODE_ENV=production next build --no-lint"
  }
}
```

### 3. Конфигурация Tailwind

В `tailwind.config.js` добавлены настройки для лучшей совместимости:
```javascript
export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
  // ...
}
```

## Альтернативные решения

### Если проблемы продолжаются:

1. **Использовать Docker** с предустановленными зависимостями
2. **Кэшировать node_modules** в GitHub Actions
3. **Использовать другую версию Node.js** (например, 18 вместо 20)

### Откат к Tailwind CSS v3 (не рекомендуется):

Если ничего не помогает, можно временно откатиться к v3:
```bash
npm install tailwindcss@^3.4.15 autoprefixer@^10.4.20 postcss@^8.5.1
```

## Проверка решения

После применения исправлений, сборка должна проходить без ошибок:
```bash
npm run build:ci
```

## Дополнительная информация

- [Tailwind CSS v4 Alpha Documentation](https://tailwindcss.com/docs/v4-beta)
- [GitHub Issue: Native binding errors in CI](https://github.com/tailwindlabs/tailwindcss/issues/...)
