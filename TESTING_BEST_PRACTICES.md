# 🧪 Лучшие практики тестирования Timeline Studio

## 🎯 Быстрый чеклист

### ✅ Перед написанием теста

1. **Проверьте глобальные моки** в `src/test/setup.ts`
2. **Выберите правильную утилиту рендеринга**:
   - `render` - для изолированных компонентов
   - `renderWithBase` - для компонентов с базовыми провайдерами
   - `renderWithProviders` - для компонентов с дополнительными провайдерами
3. **Проверьте существующие моки** для зависимостей

### ✅ При написании теста

1. **Используйте `data-testid`** для идентификации элементов
2. **Мокируйте на уровне модуля**, не отдельных функций
3. **Очищайте моки** в `beforeEach`
4. **Проверяйте поведение**, не реализацию

### ✅ При ошибках

1. **"No export defined on mock"** → добавьте экспорт в мок
2. **Компонент не рендерится** → проверьте утилиту рендеринга
3. **Конфликт моков** → используйте `vi.unmock()` или исправьте глобальный мок

## 🔧 Типичные проблемы и решения

### 1. Отсутствующие иконки lucide-react

```typescript
// ❌ Ошибка: No "AlertTriangle" export is defined
// ✅ Решение: добавить в setup.ts
vi.mock("lucide-react", () => ({
  // ... существующие иконки
  AlertTriangle: createMockIcon("AlertTriangle"),
  Subtitles: createMockIcon("Subtitles"),
}));
```

### 2. Конфликт локальных и глобальных моков

```typescript
// ❌ Проблема: локальный мок переопределяет глобальный
vi.mock("lucide-react", () => ({
  Play: () => <div>Play</div>
  // Отсутствуют другие иконки из глобального мока
}))

// ✅ Решение 1: добавить все необходимые иконки
vi.mock("lucide-react", () => ({
  Play: () => <div>Play</div>,
  AlertTriangle: () => <div>AlertTriangle</div>,
  // ... другие иконки
}))

// ✅ Решение 2: убрать локальный мок, использовать глобальный
// Удалить vi.mock("lucide-react") из теста
```

### 3. Неправильная утилита рендеринга

```typescript
// ❌ Неправильно: компонент требует провайдеры
import { render } from '@testing-library/react'
render(<ComponentWithProviders />)

// ✅ Правильно: использовать утилиту с провайдерами
import { renderWithBase } from '@/test/test-utils'
renderWithBase(<ComponentWithProviders />)
```

### 4. Тестирование компонентов с логикой

```typescript
// ❌ Неправильно: глобальный мок мешает тестированию
// Глобальный мок в setup.ts просто рендерит children

// ✅ Правильно: отключить мок для конкретного теста
vi.unmock("@/i18n/i18n-provider")
import { I18nProvider } from "./i18n-provider"
```

## 📝 Шаблоны для тестов

### Базовый компонент

```typescript
import { describe, expect, it, vi } from 'vitest'
import { renderWithBase, screen } from '@/test/test-utils'
import { MyComponent } from './my-component'

describe('MyComponent', () => {
  it('должен корректно рендериться', () => {
    renderWithBase(<MyComponent />)
    expect(screen.getByTestId('my-component')).toBeInTheDocument()
  })
})
```

### Компонент с иконками

```typescript
// Если нужны дополнительные иконки, добавьте их в локальный мок
vi.mock('lucide-react', () => ({
  // Включите все иконки из глобального мока + новые
  Play: () => <div data-testid="play-icon" />,
  NewIcon: () => <div data-testid="new-icon" />,
}))
```

### XState машина

```typescript
import { createActor } from 'xstate'
import { myMachine } from './my-machine'

describe('MyMachine', () => {
  it('должна начинать в правильном состоянии', () => {
    const actor = createActor(myMachine)
    actor.start()
    
    expect(actor.getSnapshot().value).toBe('idle')
  })
})
```

## 🚀 Команды для отладки

```bash
# Запуск конкретного теста
bun run test src/path/to/test.test.tsx

# Запуск с подробным выводом
bun run test src/path/to/test.test.tsx --reporter=verbose

# Запуск в watch режиме
bun run test:watch src/path/to/test.test.tsx

# Запуск всех тестов
bun run test
```

## 📚 Полезные ссылки

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [XState Testing](https://xstate.js.org/docs/guides/testing.html)
- [Основная документация](./AGENT.md#тестирование)
- [Анализ покрытия](./TESTING_COVERAGE_ANALYSIS.md)
