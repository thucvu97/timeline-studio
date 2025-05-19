# AGENT.md - Timeline Tauri App coding guide

## Commands
- **Build frontend**: `bun build`
- **Dev with hot reload**: `bun dev`
- **Lint**: `bun lint` (JS/TS), `bun lint:css` (CSS), `bun lint:rust` (Rust)
- **Format**: `bun format:imports` (JS/TS imports), `bun format:rust` (Rust)
- **Fix**: `bun lint:fix` (JS/TS), `bun lint:css:fix` (CSS), `bun fix:rust` (Rust)
- **Test**: `bun test` (all), `bun test:app` (features), `bun test:watch` (watch mode)
- **Run single test**: `bun test src/path/to/file.test.ts` or `vitest run src/path/to/file.test.ts`
- **Typecheck**: `bun check:all` (runs lint and tests)
- **Run Tauri**: `bun tauri dev` (development), `bun tauri build` (production)

## MCP Configuration
```json
{
  "servers": {
    "Context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

## Code style
- **JS/TS**: Biome + ESLint, semicolons as needed, double quotes
- **Imports**: Grouped (builtin → external → internal → sibling/parent → CSS)
- **Components**: Follow feature-based organization in `src/features/`
- **State management**: Use XState for complex state (create machines with `setup` method)
- **Styling**: Tailwind CSS, use CSS variables for theming
- **Errors**: TypeScript strict mode, avoid `any` types
- **Testing**: Vitest, place tests next to implementation files (.test.ts/.test.tsx)
- **Rust**: 2-space indentation, 100 column width, use clippy

## Тестирование
- **Инструменты**: Vitest + Testing Library + XState Test
- **Структура**: Тесты располагаются рядом с тестируемыми файлами (.test.ts/.test.tsx)
- **Утилиты**: В `src/test/` находятся вспомогательные утилиты и настройки:
  - `setup.ts` - глобальная настройка и моки для тестов
  - `test-utils.tsx` - кастомный рендерер с провайдерами
- **Моки**: Все внешние зависимости (Tauri API, localStorage, и т.д.) мокируются
- **Компонентное тестирование**: Используйте `render` из `@/test/test-utils.tsx`
- **XState Testing**: Используйте `createActor` и проверяйте снимки состояний

## Тестирование компонентов

```typescript
import { render, screen, fireEvent } from '@/test/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyComponent } from './my-component'

// Мокаем зависимости
vi.mock('react-i18next')
vi.mock('@/features/some-feature')

describe('MyComponent', () => {
  // Мокаем функции обратного вызова
  const mockOnChange = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('должен корректно рендериться', () => {
    render(<MyComponent propValue="test" onChange={mockOnChange} />)
    
    // Проверяем что компонент отрендерен
    expect(screen.getByTestId('my-component')).toBeInTheDocument()
    
    // Проверяем что текст отображается
    expect(screen.getByText('Название')).toBeInTheDocument()
  })
  
  it('должен вызывать onChange при клике на кнопку', () => {
    render(<MyComponent propValue="test" onChange={mockOnChange} />)
    
    // Находим кнопку и кликаем по ней
    const button = screen.getByRole('button', { name: /сохранить/i })
    fireEvent.click(button)
    
    // Проверяем что коллбэк был вызван с правильными параметрами
    expect(mockOnChange).toHaveBeenCalledWith('test')
  })
  
  it('должен отображать правильное состояние при изменении пропсов', () => {
    const { rerender } = render(<MyComponent propValue="old" onChange={mockOnChange} />)
    
    // Перерендериваем с новыми пропсами
    rerender(<MyComponent propValue="new" onChange={mockOnChange} />)
    
    // Проверяем что состояние обновилось
    expect(screen.getByDisplayValue('new')).toBeInTheDocument()
  })
})
```

## XState Machine Template

```typescript
import { assign, setup } from "xstate"

// Define types for context and events
export interface MyContext {
  data: string[]
  isLoading: boolean
  error: string | null
}

export type MyEvent =
  | { type: "FETCH" }
  | { type: "ADD"; item: string }
  | { type: "REMOVE"; index: number }
  | { type: "RESET" }

// Create machine with setup method (XState v5 pattern)
export const myMachine = setup({
  types: {
    context: {} as MyContext,
    events: {} as MyEvent,
  },
  actions: {
    logAction: ({ context, event }) => {
      console.log(`Action triggered by ${event.type}`, context)
    },
  },
}).createMachine({
  id: "myMachine",
  initial: "idle",
  context: {
    data: [],
    isLoading: false,
    error: null,
  },
  states: {
    idle: {
      on: {
        FETCH: "loading",
        ADD: {
          actions: assign({
            data: ({ context, event }) => [...context.data, event.item],
          }),
        },
        REMOVE: {
          actions: assign({
            data: ({ context, event }) => 
              context.data.filter((_, i) => i !== event.index),
          }),
        },
        RESET: {
          actions: assign({
            data: [],
          }),
        },
      },
    },
    loading: {
      entry: assign({ isLoading: true, error: null }),
      exit: assign({ isLoading: false }),
      // ... more states
    },
  },
})

export type MyMachine = typeof myMachine
```

## XState Machine Test Template

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { myMachine } from "./my-machine"

describe("My Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock external dependencies
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  it("should start in the correct initial state", () => {
    const actor = createActor(myMachine)
    actor.start()
    
    expect(actor.getSnapshot().value).toBe("idle")
    expect(actor.getSnapshot().context).toEqual({
      data: [],
      isLoading: false,
      error: null
    })
  })

  it("should add items to context when ADD event is sent", () => {
    const actor = createActor(myMachine)
    actor.start()
    
    actor.send({ type: "ADD", item: "test item" })
    
    expect(actor.getSnapshot().value).toBe("idle")
    expect(actor.getSnapshot().context.data).toEqual(["test item"])
  })

  it("should transition to loading state when FETCH event is sent", () => {
    const actor = createActor(myMachine)
    actor.start()
    
    actor.send({ type: "FETCH" })
    
    expect(actor.getSnapshot().value).toBe("loading")
    expect(actor.getSnapshot().context.isLoading).toBe(true)
  })

  it("should reset context when RESET event is sent", () => {
    const actor = createActor(myMachine)
    actor.start()
    
    // First add some data
    actor.send({ type: "ADD", item: "item 1" })
    actor.send({ type: "ADD", item: "item 2" })
    
    // Then reset
    actor.send({ type: "RESET" })
    
    expect(actor.getSnapshot().context.data).toEqual([])
  })
})
```