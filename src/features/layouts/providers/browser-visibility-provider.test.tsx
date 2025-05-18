import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  BrowserVisibilityProvider,
  useBrowserVisibility,
} from "./browser-visibility-provider"

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Мокаем useHotkeys
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn((key, callback, options) => {
    // Сохраняем callback для тестирования
    ;(global as any).hotkeyCallback = callback
  }),
}))

// Компонент-обертка для тестирования хука useBrowserVisibility
const BrowserVisibilityWrapper = ({
  children,
}: { children: React.ReactNode }) => {
  return <BrowserVisibilityProvider>{children}</BrowserVisibilityProvider>
}

// Тестовый компонент, который использует хук useBrowserVisibility
const TestComponent = () => {
  const { isBrowserVisible, toggleBrowserVisibility } = useBrowserVisibility()

  return (
    <div>
      <div data-testid="browser-visible">
        {isBrowserVisible ? "true" : "false"}
      </div>
      <button data-testid="toggle-button" onClick={toggleBrowserVisibility}>
        Toggle Browser
      </button>
    </div>
  )
}

describe("BrowserVisibilityProvider", () => {
  // Устанавливаем моки перед каждым тестом
  beforeEach(() => {
    // Мокаем localStorage
    Object.defineProperty(window, "localStorage", { value: localStorageMock })

    // Очищаем моки
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  // Восстанавливаем оригинальные объекты после тестов
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should provide initial context values with default browser visibility (true)", () => {
    // Рендерим тестовый компонент с провайдером
    render(
      <BrowserVisibilityProvider>
        <TestComponent />
      </BrowserVisibilityProvider>,
    )

    // Проверяем, что начальное значение isBrowserVisible равно true
    expect(screen.getByTestId("browser-visible").textContent).toBe("true")
  })

  it("should load browser visibility from localStorage if available", () => {
    // Устанавливаем значение в localStorage
    localStorageMock.getItem.mockReturnValueOnce("false")

    // Рендерим тестовый компонент с провайдером
    render(
      <BrowserVisibilityProvider>
        <TestComponent />
      </BrowserVisibilityProvider>,
    )

    // Проверяем, что значение isBrowserVisible загружено из localStorage
    expect(screen.getByTestId("browser-visible").textContent).toBe("false")
    expect(localStorageMock.getItem).toHaveBeenCalledWith("browser-visible")
  })

  it("should toggle browser visibility when button is clicked", async () => {
    // Рендерим тестовый компонент с провайдером
    render(
      <BrowserVisibilityProvider>
        <TestComponent />
      </BrowserVisibilityProvider>,
    )

    // Проверяем начальное значение
    expect(screen.getByTestId("browser-visible").textContent).toBe("true")

    // Кликаем на кнопку переключения
    await userEvent.click(screen.getByTestId("toggle-button"))

    // Проверяем, что значение изменилось
    expect(screen.getByTestId("browser-visible").textContent).toBe("false")

    // Проверяем, что новое значение сохранено в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "browser-visible",
      "false",
    )
  })

  it("should handle localStorage errors gracefully", async () => {
    // Мокаем ошибку при чтении из localStorage
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error("localStorage error")
    })

    // Рендерим тестовый компонент с провайдером
    render(
      <BrowserVisibilityProvider>
        <TestComponent />
      </BrowserVisibilityProvider>,
    )

    // Проверяем, что значение isBrowserVisible равно значению по умолчанию (true)
    expect(screen.getByTestId("browser-visible").textContent).toBe("true")

    // Мокаем ошибку при записи в localStorage
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error("localStorage error")
    })

    // Кликаем на кнопку переключения
    await userEvent.click(screen.getByTestId("toggle-button"))

    // Ждем обновления состояния
    await waitFor(() => {
      // Проверяем, что значение изменилось, несмотря на ошибку
      expect(screen.getByTestId("browser-visible").textContent).toBe("false")
    })
  })

  it("should toggle browser visibility when hotkey is pressed", async () => {
    // Рендерим тестовый компонент с провайдером
    render(
      <BrowserVisibilityProvider>
        <TestComponent />
      </BrowserVisibilityProvider>,
    )

    // Проверяем начальное значение
    expect(screen.getByTestId("browser-visible").textContent).toBe("true")

    // Получаем callback, сохраненный в useHotkeys
    const hotkeyCallback = (global as any).hotkeyCallback

    // Создаем мок-событие
    const mockEvent = {
      preventDefault: vi.fn(),
    }

    // Вызываем callback с мок-событием
    act(() => {
      hotkeyCallback(mockEvent)
    })

    // Проверяем, что preventDefault был вызван
    expect(mockEvent.preventDefault).toHaveBeenCalled()

    // Ждем обновления состояния
    await waitFor(() => {
      // Проверяем, что значение изменилось
      expect(screen.getByTestId("browser-visible").textContent).toBe("false")
    })
  })

  it("should throw error when useBrowserVisibility is used outside of BrowserVisibilityProvider", () => {
    // Проверяем, что хук useBrowserVisibility выбрасывает ошибку, если используется вне провайдера
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    // Оборачиваем в try-catch, чтобы перехватить ошибку
    let error: Error | null = null
    try {
      renderHook(() => useBrowserVisibility())
    } catch (e) {
      error = e as Error
    }

    // Проверяем, что была выброшена ошибка с правильным сообщением
    expect(error).not.toBeNull()
    expect(error?.message).toBe(
      "useBrowserVisibility must be used within a BrowserVisibilityProvider",
    )

    consoleError.mockRestore()
  })

  it("should provide correct context values when using renderHook", () => {
    // Используем renderHook для тестирования хука useBrowserVisibility
    const { result } = renderHook(() => useBrowserVisibility(), {
      wrapper: BrowserVisibilityWrapper,
    })

    // Проверяем начальные значения
    expect(result.current.isBrowserVisible).toBe(true)

    // Переключаем видимость браузера
    act(() => {
      result.current.toggleBrowserVisibility()
    })

    // Проверяем, что значение изменилось
    expect(result.current.isBrowserVisible).toBe(false)

    // Проверяем, что новое значение сохранено в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "browser-visible",
      "false",
    )
  })
})
