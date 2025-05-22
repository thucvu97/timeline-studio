import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Browser } from "./browser"

// Мокаем компоненты BrowserTabs и BrowserContent
vi.mock("./browser-tabs", () => ({
  BrowserTabs: vi.fn(({ activeTab, onTabChange }) => (
    <div data-testid="browser-tabs" data-active-tab={activeTab}>
      <button data-testid="tab-trigger-media" onClick={() => onTabChange("media")}>
        Media
      </button>
      <button data-testid="tab-trigger-music" onClick={() => onTabChange("music")}>
        Music
      </button>
    </div>
  )),
}))

vi.mock("./browser-content", () => ({
  BrowserContent: vi.fn(() => <div data-testid="browser-content">Content</div>),
}))

// Мокаем компоненты UI
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div data-testid="tabs-value-change" onClick={() => onValueChange("music")}>
        Change Value
      </div>
    </div>
  ),
}))

describe("Browser", () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render BrowserTabs and BrowserContent components", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что компоненты BrowserTabs и BrowserContent отображаются
    expect(screen.getByTestId("browser-tabs")).toBeInTheDocument()
    expect(screen.getByTestId("browser-content")).toBeInTheDocument()
  })

  it('should have "media" as default active tab', () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что вкладка "media" активна по умолчанию
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "media")
    expect(screen.getByTestId("browser-tabs")).toHaveAttribute("data-active-tab", "media")
  })

  it("should change active tab when tab is clicked", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем начальное значение
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "media")

    // Кликаем на элемент, который вызывает onValueChange с 'music'
    fireEvent.click(screen.getByTestId("tabs-value-change"))

    // Проверяем, что активная вкладка изменилась
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "music")
    expect(screen.getByTestId("browser-tabs")).toHaveAttribute("data-active-tab", "music")
  })

  it("should pass activeTab to BrowserTabs", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что BrowserTabs получает правильное значение activeTab
    expect(screen.getByTestId("browser-tabs")).toHaveAttribute("data-active-tab", "media")

    // Изменяем активную вкладку
    fireEvent.click(screen.getByTestId("tabs-value-change"))

    // Проверяем, что BrowserTabs получает обновленное значение activeTab
    expect(screen.getByTestId("browser-tabs")).toHaveAttribute("data-active-tab", "music")
  })

  it("should update activeTab when tab is clicked in BrowserTabs", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем начальное значение
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "media")

    // Кликаем на вкладку "Media" в BrowserTabs
    fireEvent.click(screen.getByTestId("tab-trigger-media"))

    // Проверяем, что активная вкладка не изменилась (уже была "media")
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "media")

    // Кликаем на вкладку "Music" в BrowserTabs
    fireEvent.click(screen.getByTestId("tab-trigger-music"))

    // Проверяем, что активная вкладка изменилась
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "music")
  })
})
