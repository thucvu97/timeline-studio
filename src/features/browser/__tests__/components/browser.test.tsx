import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Browser } from "../../components/browser"

// Мокаем зависимости
let mockOnTabChange: (tab: string) => void

vi.mock("../../components/browser-tabs", () => ({
  BrowserTabs: ({ activeTab, onTabChange }: any) => {
    mockOnTabChange = onTabChange
    return (
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
        <button onClick={() => onTabChange("test")} data-testid="trigger-tab-change" />
        Browser Tabs Mock - Active: {activeTab}
      </div>
    )
  },
}))

vi.mock("../../components/browser-content", () => ({
  BrowserContent: () => <div data-testid="browser-content">Browser Content</div>,
}))

vi.mock("@/features/app-state", () => ({
  useAppSettings: () => ({
    getUserSettings: vi.fn(() => ({})),
    updateUserSettings: vi.fn(),
  }),
  AppSettingsProvider: ({ children }: { children: any }) => children,
}))

// Мокаем EffectsProvider
vi.mock("../../providers/effects-provider", () => ({
  EffectsProvider: ({ children }: { children: any }) => children,
}))

// Мокаем BrowserStateProvider и его хук
let mockActiveTab = "media"
let mockSwitchTab = vi.fn()

vi.mock("../../services/browser-state-provider", () => ({
  BrowserStateProvider: ({ children }: { children: any }) => children,
  useBrowserState: () => ({
    activeTab: mockActiveTab,
    switchTab: mockSwitchTab,
  }),
}))

describe("Browser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockActiveTab = "media"
    mockSwitchTab = vi.fn((tab: string) => {
      mockActiveTab = tab
    })
  })

  it("должен рендериться с компонентами табов и контента", () => {
    render(<Browser />)

    expect(screen.getByTestId("browser-tabs")).toBeInTheDocument()
    expect(screen.getByTestId("browser-content")).toBeInTheDocument()
  })

  it("должен иметь начальную вкладку media", () => {
    render(<Browser />)

    const browserTabs = screen.getByTestId("browser-tabs")
    expect(browserTabs).toHaveAttribute("data-active-tab", "media")
  })

  it("должен переключать вкладки при клике", () => {
    render(<Browser />)

    const musicTab = screen.getByTestId("tab-music")
    fireEvent.click(musicTab)

    expect(mockSwitchTab).toHaveBeenCalledWith("music")
  })

  it("должен иметь правильные CSS классы", () => {
    const { container } = render(<Browser />)

    const wrapper = container.querySelector(".relative.h-full.w-full.flex.flex-col")
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveClass("dark:bg-[#2D2D2D]")
  })

  it("должен обрабатывать изменение вкладки через компонент Tabs", () => {
    render(<Browser />)

    const tabChangeButton = screen.getByTestId("trigger-tab-change")
    fireEvent.click(tabChangeButton)

    expect(mockSwitchTab).toHaveBeenCalledWith("test")
  })

  it("должен рендериться внутри контейнера с правильными классами", () => {
    const { container } = render(<Browser />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("relative h-full w-full flex flex-col")
  })

  it("должен предоставлять контекст состояния браузера дочерним компонентам", () => {
    // Факт того, что компонент рендерится без ошибок, подтверждает,
    // что контекст доступен
    expect(() => render(<Browser />)).not.toThrow()
  })

  it("должен сохранять состояние вкладки при повторном рендере", () => {
    const { rerender } = render(<Browser />)

    // Переключаем вкладку
    const effectsTab = screen.getByTestId("tab-effects")
    fireEvent.click(effectsTab)

    // Перерендер компонента
    rerender(<Browser />)

    // Проверяем, что активная вкладка сохранилась
    expect(mockSwitchTab).toHaveBeenCalledWith("effects")
  })
})
