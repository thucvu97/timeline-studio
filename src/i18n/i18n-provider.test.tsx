import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { I18nProvider } from "./i18n-provider"

// Отключаем глобальный мок для этого теста
vi.unmock("@/i18n/i18n-provider")

// Мокаем i18n
vi.mock("./index", () => {
  const mockI18n = {
    isInitialized: false,
    on: vi.fn(),
    off: vi.fn(),
  }
  return {
    default: mockI18n,
  }
})

// Мокаем I18nextProvider
vi.mock("react-i18next", () => ({
  I18nextProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="i18next-provider">{children}</div>
  ),
}))

describe("I18nProvider", () => {
  it("should render nothing when i18n is not initialized", () => {
    // Рендерим компонент
    render(
      <I18nProvider>
        <div data-testid="test-child">Test</div>
      </I18nProvider>,
    )

    // Проверяем, что дочерний компонент не отрендерен
    expect(screen.queryByTestId("test-child")).toBeNull()
    expect(screen.queryByTestId("i18next-provider")).toBeNull()
  })

  it("should render children when i18n is initialized", async () => {
    // Получаем мок i18n
    const i18nMock = (await import("./index")).default

    // Устанавливаем isInitialized в true
    vi.mocked(i18nMock).isInitialized = true

    // Рендерим компонент
    render(
      <I18nProvider>
        <div data-testid="test-child">Test</div>
      </I18nProvider>,
    )

    // Проверяем, что дочерний компонент отрендерен
    expect(screen.getByTestId("i18next-provider")).toBeInTheDocument()
    expect(screen.getByTestId("test-child")).toBeInTheDocument()
    expect(screen.getByText("Test")).toBeInTheDocument()
  })

  it("should subscribe to initialized event when i18n is not initialized", async () => {
    // Получаем мок i18n
    const i18nMock = (await import("./index")).default

    // Устанавливаем isInitialized в false
    vi.mocked(i18nMock).isInitialized = false

    // Рендерим компонент
    render(
      <I18nProvider>
        <div data-testid="test-child">Test</div>
      </I18nProvider>,
    )

    // Проверяем, что подписка на событие initialized была создана
    expect(i18nMock.on).toHaveBeenCalledWith("initialized", expect.any(Function))

    // Проверяем, что дочерний компонент не отрендерен
    expect(screen.queryByTestId("test-child")).toBeNull()
  })

  it("should unsubscribe from initialized event on unmount", async () => {
    // Получаем мок i18n
    const i18nMock = (await import("./index")).default

    // Устанавливаем isInitialized в false
    vi.mocked(i18nMock).isInitialized = false

    // Рендерим компонент
    const { unmount } = render(
      <I18nProvider>
        <div data-testid="test-child">Test</div>
      </I18nProvider>,
    )

    // Проверяем, что подписка на событие initialized была создана
    expect(i18nMock.on).toHaveBeenCalledWith("initialized", expect.any(Function))

    // Получаем обработчик события
    const initHandler = vi.mocked(i18nMock.on).mock.calls[0][1] as () => void

    // Размонтируем компонент
    unmount()

    // Проверяем, что отписка от события initialized была выполнена
    expect(i18nMock.off).toHaveBeenCalledWith("initialized", initHandler)
  })
})
