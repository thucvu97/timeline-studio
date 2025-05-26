# AGENT.md - Timeline Studio coding guide

## Commands

- **Build frontend**: `bun run build`
- **Dev with hot reload**: `bun run dev`
- **Lint**: `bun run lint` (JS/TS), `bun run lint:css` (CSS), `bun run lint:rust` (Rust)
- **Format**: `bun run format:imports` (JS/TS imports), `bun run format:rust` (Rust)
- **Fix**: `bun run lint:fix` (JS/TS), `bun run lint:css:fix` (CSS), `bun run fix:rust` (Rust)
- **Test**: `bun run test` (all), `bun run test:app` (features), `bun run test:watch` (watch mode)
- **Run single test**: `bun run test src/path/to/file.test.ts` or `vitest run src/path/to/file.test.ts`
- **Typecheck**: `bun run check:all` (runs lint and tests)
- **Run Tauri**: `bun run tauri dev` (development), `bun run tauri build` (production)

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

- **JS/TS**: ESLint, semicolons as needed, double quotes
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
- **Тестовые идентификаторы**: Используйте `data-testid` для идентификации элементов в тестах
- **Мокирование модулей**: Всегда мокируйте модули на уровне модуля, а не отдельных функций
- **Мокирование i18n**: Используйте асинхронный подход с importOriginal для сохранения оригинальной функциональности
- **Мокирование localStorage**: Определяйте его на объекте window и очищайте в beforeEach блоках
- **Мокирование HTMLVideoElement**: При тестировании видео-компонентов мокируйте методы play/pause/currentTime
- **Проверка стилей**: Используйте `toHaveStyle` для проверки CSS-свойств, но будьте осторожны с вложенными элементами

### Исправление проблем с тестами

#### Проблемы с моками

1. **Отсутствующие иконки в lucide-react**:

   - Добавляйте недостающие иконки в глобальный мок в `setup.ts`
   - Используйте универсальную функцию `createMockIcon` для создания моков иконок
   - Если есть локальные моки, убедитесь что они включают все необходимые иконки

2. **Конфликты локальных и глобальных моков**:

   - Предпочитайте глобальные моки в `setup.ts` для консистентности
   - Используйте `vi.unmock()` для отключения глобального мока в специфических тестах
   - Локальные моки должны дополнять, а не заменять глобальные

3. **Неправильные утилиты рендеринга**:
   - Используйте `renderWithBase` для компонентов, требующих базовые провайдеры
   - Используйте `renderWithProviders` для компонентов с дополнительными провайдерами
   - Обычный `render` только для изолированных компонентов

#### Типичные ошибки и решения

1. **"No export defined on mock"**:

   ```typescript
   // ❌ Неправильно - отсутствует экспорт в моке
   vi.mock("lucide-react", () => ({
     Play: () => <div>Play</div>
   }))

   // ✅ Правильно - добавить недостающий экспорт
   vi.mock("lucide-react", () => ({
     Play: () => <div>Play</div>,
     AlertTriangle: () => <div>AlertTriangle</div>
   }))
   ```

2. **Компонент не рендерится из-за мока провайдера**:

   ```typescript
   // ❌ Неправильно - глобальный мок мешает тестированию
   vi.mock("@/i18n/i18n-provider", () => ({
     I18nProvider: ({ children }) => children,
   }));

   // ✅ Правильно - отключить мок для конкретного теста
   vi.unmock("@/i18n/i18n-provider");
   ```

3. **Дублирующие моки**:

   ```typescript
   // ❌ Неправильно - дублирование глобального мока
   vi.mock("react-i18next", () => ({
     useTranslation: () => ({ t: (key) => key }),
   }));

   // ✅ Правильно - убрать локальный мок, использовать глобальный
   // Мок уже есть в setup.ts
   ```

#### Отладка тестов

1. **Проверка состояния моков**:

   ```bash
   # Запуск конкретного теста с подробным выводом
   bun run test src/path/to/test.test.tsx --reporter=verbose
   ```

2. **Проверка рендеринга**:

   ```typescript
   // Добавить debug для просмотра DOM
   const { debug } = render(<Component />)
   debug() // Выведет HTML в консоль
   ```

3. **Проверка моков**:
   ```typescript
   // Проверить что мок работает
   console.log(vi.isMockFunction(mockFunction));
   console.log(mockFunction.mock.calls);
   ```

## Тестирование компонентов

### Базовый пример тестирования компонента

```typescript
import { render, screen, fireEvent } from '@/test/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyComponent } from './my-component'

// Мокаем зависимости
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Возвращаем ключ как значение для простоты тестирования
  }),
}))

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
    expect(screen.getByText('common.title')).toBeInTheDocument()
  })

  it('должен вызывать onChange при клике на кнопку', () => {
    render(<MyComponent propValue="test" onChange={mockOnChange} />)

    // Находим кнопку и кликаем по ней
    const button = screen.getByTestId('save-button')
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

### Тестирование компонентов с видео

```typescript
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VideoComponent } from "./video-component"

// Мокируем HTMLVideoElement
Object.defineProperty(window.HTMLVideoElement.prototype, "play", {
  configurable: true,
  value: vi.fn().mockImplementation(function () {
    // Эмулируем успешное воспроизведение
    return Promise.resolve()
  }),
})

Object.defineProperty(window.HTMLVideoElement.prototype, "pause", {
  configurable: true,
  value: vi.fn(),
})

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("VideoComponent", () => {
  const mockProps = {
    videoSrc: "test-video.mp4",
    onPlay: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders correctly with all elements", () => {
    render(<VideoComponent {...mockProps} />)

    // Проверяем, что видео элемент отрендерился
    const videoElement = screen.getByTestId("video-element")
    expect(videoElement).toBeInTheDocument()
    expect(videoElement).toHaveAttribute("src", "test-video.mp4")
  })

  it("plays video when play button is clicked", async () => {
    render(<VideoComponent {...mockProps} />)

    const playButton = screen.getByTestId("play-button")
    fireEvent.click(playButton)

    // Проверяем, что видео начинает воспроизводиться
    await waitFor(() => {
      const videoElement = screen.getByTestId("video-element")
      expect(videoElement.play).toHaveBeenCalled()
      expect(mockProps.onPlay).toHaveBeenCalled()
    })
  })
})
```

### Тестирование компонентов с фильтрами и эффектами

```typescript
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FilterPreview } from "./filter-preview"

// Мокируем FavoriteButton и AddMediaButton
vi.mock("../../layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <div data-testid="favorite-button">
      Favorite Button for {file.name} ({type})
    </div>
  ),
}))

vi.mock("../../layout/add-media-button", () => ({
  AddMediaButton: ({ file, onAddMedia, onRemoveMedia, isAdded, size }: any) => (
    <div>
      {isAdded ? (
        <button
          data-testid="remove-media-button"
          onClick={(e) => onRemoveMedia(e)}
        >
          Remove {file.name}
        </button>
      ) : (
        <button
          data-testid="add-media-button"
          onClick={(e) => onAddMedia(e)}
        >
          Add {file.name}
        </button>
      )}
    </div>
  ),
}))

// Мокируем useResources
const mockAddFilter = vi.fn()
const mockRemoveResource = vi.fn()
const mockIsFilterAdded = vi.fn().mockReturnValue(false)

vi.mock("@/features/browser/resources", () => ({
  useResources: () => ({
    addFilter: mockAddFilter,
    removeResource: mockRemoveResource,
    isFilterAdded: mockIsFilterAdded,
    filterResources: [
      { id: "filter-resource-1", resourceId: "brightness", type: "filter" }
    ],
  }),
}))

describe("FilterPreview", () => {
  // Тестовый фильтр
  const testFilter = {
    id: "brightness",
    name: "Brightness",
    labels: {
      ru: "Яркость",
      en: "Brightness",
    },
    params: {
      brightness: 0.1,
      contrast: 0.8,
    },
  }

  const mockProps = {
    filter: testFilter,
    onClick: vi.fn(),
    size: 100,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем состояние isFilterAdded перед каждым тестом
    mockIsFilterAdded.mockReturnValue(false)
  })

  it("applies filter style when hovering", async () => {
    render(<FilterPreview {...mockProps} />)

    const videoElement = screen.getByTestId("filter-video")
    const container = videoElement.parentElement

    // Симулируем наведение мыши
    fireEvent.mouseEnter(container!)

    // Проверяем, что фильтр был применен
    await waitFor(() => {
      // Проверяем, что фильтр содержит нужные значения
      expect(videoElement.style.filter).toContain("brightness(1.1)")
      expect(videoElement.style.filter).toContain("contrast(0.8)")
    })
  })

  it("calls addFilter when add button is clicked", () => {
    render(<FilterPreview {...mockProps} />)

    const addButton = screen.getByTestId("add-media-button")
    fireEvent.click(addButton)

    expect(mockAddFilter).toHaveBeenCalledTimes(1)
    expect(mockAddFilter).toHaveBeenCalledWith(testFilter)
  })
})
```

## Тестирование XState машин с асинхронными действиями

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { resourcesMachine } from "./resources-machine";

// Мокируем IndexedDB
vi.mock("@/services/storage", () => ({
  StorageService: {
    getItem: vi.fn().mockImplementation((key) => {
      if (key === "resources") {
        return Promise.resolve({
          resources: [
            { id: "resource-1", type: "effect", resourceId: "brightness" },
            { id: "resource-2", type: "filter", resourceId: "contrast" },
          ],
        });
      }
      return Promise.resolve(null);
    }),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Resources Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start in the loading state", () => {
    const actor = createActor(resourcesMachine);
    actor.start();

    expect(actor.getSnapshot().value).toBe("loading");
    expect(actor.getSnapshot().context.resources).toEqual([]);
  });

  it("should load resources from storage and transition to idle", async () => {
    const actor = createActor(resourcesMachine);
    actor.start();

    // Ждем, пока машина перейдет в состояние idle
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.resources).toEqual([
      { id: "resource-1", type: "effect", resourceId: "brightness" },
      { id: "resource-2", type: "filter", resourceId: "contrast" },
    ]);
  });

  it("should add a new effect resource when ADD_EFFECT event is sent", async () => {
    const actor = createActor(resourcesMachine);
    actor.start();

    // Ждем, пока машина перейдет в состояние idle
    await new Promise((resolve) => setTimeout(resolve, 50));

    const effect = {
      id: "new-effect",
      type: "brightness",
      name: "New Effect",
      duration: 0,
      ffmpegCommand: () => "",
      params: {},
    };

    actor.send({ type: "ADD_EFFECT", effect });

    // Проверяем, что ресурс был добавлен
    expect(actor.getSnapshot().context.resources).toHaveLength(3);
    expect(actor.getSnapshot().context.resources[2].resourceId).toBe(
      "new-effect",
    );
    expect(actor.getSnapshot().context.resources[2].type).toBe("effect");
  });
});
```

## XState Machine Template

```typescript
import { assign, setup } from "xstate";

// Define types for context and events
export interface MyContext {
  data: string[];
  isLoading: boolean;
  error: string | null;
}

export type MyEvent =
  | { type: "FETCH" }
  | { type: "ADD"; item: string }
  | { type: "REMOVE"; index: number }
  | { type: "RESET" };

// Create machine with setup method (XState v5 pattern)
export const myMachine = setup({
  types: {
    context: {} as MyContext,
    events: {} as MyEvent,
  },
  actions: {
    logAction: ({ context, event }) => {
      console.log(`Action triggered by ${event.type}`, context);
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
});

export type MyMachine = typeof myMachine;
```

## XState Machine Test Template

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { myMachine } from "./my-machine";

describe("My Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock external dependencies
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should start in the correct initial state", () => {
    const actor = createActor(myMachine);
    actor.start();

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context).toEqual({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  it("should add items to context when ADD event is sent", () => {
    const actor = createActor(myMachine);
    actor.start();

    actor.send({ type: "ADD", item: "test item" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.data).toEqual(["test item"]);
  });

  it("should transition to loading state when FETCH event is sent", () => {
    const actor = createActor(myMachine);
    actor.start();

    actor.send({ type: "FETCH" });

    expect(actor.getSnapshot().value).toBe("loading");
    expect(actor.getSnapshot().context.isLoading).toBe(true);
  });

  it("should reset context when RESET event is sent", () => {
    const actor = createActor(myMachine);
    actor.start();

    // First add some data
    actor.send({ type: "ADD", item: "item 1" });
    actor.send({ type: "ADD", item: "item 2" });

    // Then reset
    actor.send({ type: "RESET" });

    expect(actor.getSnapshot().context.data).toEqual([]);
  });
});
```
