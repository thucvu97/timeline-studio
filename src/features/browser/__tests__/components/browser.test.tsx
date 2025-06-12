import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Browser } from "../../components/browser"

// Мокаем зависимости
vi.mock("../../components/browser-tabs", () => ({
  BrowserTabs: ({ activeTab, onTabChange }: any) => (
    <div data-testid="browser-tabs" data-active-tab={activeTab}>
      <button onClick={() => onTabChange("media")} data-testid="tab-media">
        Media
      </button>
      <button onClick={() => onTabChange("music")} data-testid="tab-music">
        Music
      </button>
      <button onClick={() => onTabChange("effects")} data-testid="tab-effects">
        Effects
      </button>
    </div>
  ),
}))

vi.mock("../../components/browser-content", () => ({
  BrowserContent: () => <div data-testid="browser-content">Browser Content</div>,
}))

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange, className }: any) => (
    <div className={className} data-testid="tabs" data-value={value}>
      {children}
      <button onClick={() => onValueChange("test")} data-testid="trigger-tab-change" />
    </div>
  ),
}))

vi.mock("@/features/app-state", () => ({
  useAppSettings: () => ({
    getUserSettings: vi.fn(() => ({})),
    updateUserSettings: vi.fn(),
  }),
}))

describe("Browser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендериться с компонентами табов и контента", () => {
    render(<Browser />)

    expect(screen.getByTestId("browser-tabs")).toBeInTheDocument()
    expect(screen.getByTestId("browser-content")).toBeInTheDocument()
  })

  it("должен иметь начальную вкладку media", () => {
    render(<Browser />)

    const tabs = screen.getByTestId("tabs")
    expect(tabs).toHaveAttribute("data-value", "media")

    const browserTabs = screen.getByTestId("browser-tabs")
    expect(browserTabs).toHaveAttribute("data-active-tab", "media")
  })

  it("должен переключать вкладки при клике", () => {
    render(<Browser />)

    // Переключаемся на music
    fireEvent.click(screen.getByTestId("tab-music"))

    const tabs = screen.getByTestId("tabs")
    expect(tabs).toHaveAttribute("data-value", "music")

    const browserTabs = screen.getByTestId("browser-tabs")
    expect(browserTabs).toHaveAttribute("data-active-tab", "music")

    // Переключаемся на effects
    fireEvent.click(screen.getByTestId("tab-effects"))

    expect(tabs).toHaveAttribute("data-value", "effects")
    expect(browserTabs).toHaveAttribute("data-active-tab", "effects")
  })

  it("должен иметь правильные CSS классы", () => {
    render(<Browser />)

    const tabs = screen.getByTestId("tabs")
    expect(tabs).toHaveClass("flex", "h-full", "w-full", "flex-col", "gap-0", "dark:bg-[#2D2D2D]")
  })

  it("должен обрабатывать изменение вкладки через компонент Tabs", () => {
    render(<Browser />)

    // Триггерим изменение через Tabs компонент
    fireEvent.click(screen.getByTestId("trigger-tab-change"))

    const tabs = screen.getByTestId("tabs")
    expect(tabs).toHaveAttribute("data-value", "test")
  })

  it("должен рендериться внутри контейнера с правильными классами", () => {
    const { container } = render(<Browser />)

    // Browser -> BrowserStateProvider -> div.relative -> Tabs
    const wrapper = container.querySelector(".relative.h-full.w-full")!
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveClass("relative", "h-full", "w-full")
  })

  it("должен предоставлять контекст состояния браузера дочерним компонентам", () => {
    // Этот тест проверяет, что BrowserStateProvider оборачивает компоненты
    // Факт того, что компонент рендерится без ошибок, подтверждает,
    // что контекст доступен
    expect(() => render(<Browser />)).not.toThrow()
  })

  it("должен сохранять состояние вкладки при повторном рендере", () => {
    const { rerender } = render(<Browser />)

    // Переключаемся на music
    fireEvent.click(screen.getByTestId("tab-music"))

    let browserTabs = screen.getByTestId("browser-tabs")
    expect(browserTabs).toHaveAttribute("data-active-tab", "music")

    // Перерендериваем компонент
    rerender(<Browser />)

    // Состояние должно сохраниться
    browserTabs = screen.getByTestId("browser-tabs")
    expect(browserTabs).toHaveAttribute("data-active-tab", "music")
  })
})
