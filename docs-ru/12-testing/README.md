# 09. Тестирование Timeline Studio

[← Назад к оглавлению](../README.md)

## 📋 Содержание

- [Обзор тестирования](#обзор-тестирования)
- [Структура компонентов Codecov](codecov-components.md)
- [Запуск тестов](#запуск-тестов)
- [Написание тестов](#написание-тестов)
- [Покрытие кода](#покрытие-кода)

## 🎯 Обзор тестирования

Timeline Studio использует комплексный подход к тестированию:

### Frontend тестирование
- **Фреймворк**: Vitest + React Testing Library
- **Тестовые файлы**: 291 файлов
- **Количество тестов**: ~4,500 тестов
- **Покрытие**: Отслеживается для каждой фичи отдельно

### Backend тестирование
- **Фреймворк**: Rust встроенное тестирование
- **Количество тестов**: ~700 тестов
- **Покрытие**: Отслеживается с помощью cargo-llvm-cov

## 🚀 Запуск тестов

### Frontend тесты
```bash
# Запуск всех тестов
bun run test

# Запуск с отслеживанием изменений
bun run test:watch

# Запуск конкретного файла
bun run test src/features/timeline/__tests__/use-timeline.test.ts

# Генерация отчета о покрытии
bun run test:coverage
```

### Backend тесты
```bash
# Запуск Rust тестов
bun run test:rust

# Генерация отчета о покрытии для Rust
bun run test:coverage:rust
```

### E2E тесты
```bash
# Запуск Playwright тестов
bun run test:e2e
```

## 📝 Написание тестов

### Структура тестов

Каждая фича содержит свою папку `__tests__/`:
```
src/features/timeline/
├── components/
├── hooks/
├── services/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   └── services/
└── __mocks__/
```

### Пример теста компонента

```typescript
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Timeline } from "../components/timeline"

describe("Timeline", () => {
  it("должен отображать таймлайн", () => {
    render(<Timeline />)
    expect(screen.getByTestId("timeline")).toBeInTheDocument()
  })
})
```

### Использование тестовых утилит

```typescript
import { renderWithProviders } from "@/test/test-utils"

// Рендеринг с провайдерами
const { result } = renderWithProviders(<MyComponent />)
```

## 📊 Покрытие кода

### Текущее состояние (23 июня 2025)
- **Общее количество тестов**: 4,501 пройдено ✅
- **Frontend**: 100% тестов проходят успешно
- **Rust**: 751 тест пройден, 0 провалено

### Компоненты без тестов
- **Критические компоненты**: 25 (timeline, recognition, video-player, export)
- **Критические хуки**: 6 (use-social-export, use-yolo-data, use-recognition-preview, use-frame-preview)

### Просмотр покрытия
- Локально: `coverage/index.html`
- CI/CD: [Codecov Dashboard](https://codecov.io/gh/chatman-media/timeline-studio)

## 🎯 Цели покрытия

- **Общий проект**: 80%
- **Новый код**: 70%
- **Frontend**: 75%
- **Backend**: 85%

## 🔧 Конфигурация

### Vitest конфигурация
Файл: `vitest.config.ts`
- Настройки покрытия
- Исключения (UI компоненты, моки)
- Алиасы путей

### Codecov конфигурация
Файл: `codecov.yml`
- [Компонентная структура](codecov-components.md)
- Флаги для frontend/backend
- Цели покрытия

## 📚 Дополнительные ресурсы

- [Vitest документация](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Codecov документация](https://docs.codecov.com/)