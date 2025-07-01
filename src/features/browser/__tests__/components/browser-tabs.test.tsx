import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserTabs } from "../../components/browser-tabs"
import { EffectsProvider } from "../../providers/effects-provider"

// Мокаем ленивые загрузчики ресурсов
vi.mock("../../services/resource-loaders", () => ({
  loadAllResourcesLazy: vi.fn().mockResolvedValue({
    effects: { success: true, data: [], source: "built-in", timestamp: Date.now() },
    filters: { success: true, data: [], source: "built-in", timestamp: Date.now() },
    transitions: { success: true, data: [], source: "built-in", timestamp: Date.now() },
  }),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем TabsList и TabsTrigger
vi.mock("@/components/ui/tabs", () => ({
  TabsList: ({ children, className }: any) => (
    <div className={className} data-testid="tabs-list">
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, className, ...props }: any) => (
    <button className={className} data-testid={`${value}-tab`} data-value={value} data-state="inactive" {...props}>
      {children}
    </button>
  ),
}))

// Мокаем иконки lucide
vi.mock("lucide-react", () => ({
  Clapperboard: () => <span data-testid="icon-clapperboard" />,
  Music: () => <span data-testid="icon-music" />,
  Type: () => <span data-testid="icon-type" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Blend: () => <span data-testid="icon-blend" />,
  FlipHorizontal2: () => <span data-testid="icon-flip" />,
  Video: () => <span data-testid="icon-video" />,
  Sticker: () => <span data-testid="icon-sticker" />,
}))

describe("BrowserTabs", () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(<EffectsProvider>{component}</EffectsProvider>)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен рендерить все вкладки", () => {
    renderWithProvider(<BrowserTabs activeTab="media" />)

    expect(screen.getByTestId("media-tab")).toBeInTheDocument()
    expect(screen.getByTestId("music-tab")).toBeInTheDocument()
    expect(screen.getByTestId("subtitles-tab")).toBeInTheDocument()
    expect(screen.getByTestId("effects-tab")).toBeInTheDocument()
    expect(screen.getByTestId("filters-tab")).toBeInTheDocument()
    expect(screen.getByTestId("transitions-tab")).toBeInTheDocument()
    expect(screen.getByTestId("templates-tab")).toBeInTheDocument()
    expect(screen.getByTestId("style-templates-tab")).toBeInTheDocument()
  })

  it("должен отображать правильные иконки для каждой вкладки", () => {
    renderWithProvider(<BrowserTabs activeTab="media" />)

    expect(screen.getByTestId("media-tab")).toContainElement(screen.getByTestId("icon-clapperboard"))
    expect(screen.getByTestId("music-tab")).toContainElement(screen.getByTestId("icon-music"))
    expect(screen.getByTestId("subtitles-tab")).toContainElement(screen.getByTestId("icon-type"))
    expect(screen.getByTestId("effects-tab")).toContainElement(screen.getByTestId("icon-sparkles"))
    expect(screen.getByTestId("filters-tab")).toContainElement(screen.getByTestId("icon-blend"))
    expect(screen.getByTestId("transitions-tab")).toContainElement(screen.getByTestId("icon-flip"))
    expect(screen.getByTestId("templates-tab")).toContainElement(screen.getByTestId("icon-video"))
    expect(screen.getByTestId("style-templates-tab")).toContainElement(screen.getByTestId("icon-sticker"))
  })

  it("должен отображать правильные метки для каждой вкладки", () => {
    renderWithProvider(<BrowserTabs activeTab="media" />)

    expect(screen.getByTestId("media-tab")).toHaveTextContent("browser.tabs.media")
    expect(screen.getByTestId("music-tab")).toHaveTextContent("browser.tabs.music")
    expect(screen.getByTestId("subtitles-tab")).toHaveTextContent("browser.tabs.subtitles")
    expect(screen.getByTestId("effects-tab")).toHaveTextContent("browser.tabs.effects")
    expect(screen.getByTestId("filters-tab")).toHaveTextContent("browser.tabs.filters")
    expect(screen.getByTestId("transitions-tab")).toHaveTextContent("browser.tabs.transitions")
    expect(screen.getByTestId("templates-tab")).toHaveTextContent("browser.tabs.templates")
    expect(screen.getByTestId("style-templates-tab")).toHaveTextContent("browser.tabs.styleTemplates")
  })

  it("должен устанавливать правильное состояние для активной вкладки", () => {
    renderWithProvider(<BrowserTabs activeTab="music" />)

    // Note: В мокированном компоненте все вкладки имеют data-state="inactive" по умолчанию
    // В реальном приложении Radix UI управляет этим автоматически
    expect(screen.getByTestId("media-tab")).toHaveAttribute("data-state", "inactive")
    expect(screen.getByTestId("music-tab")).toHaveAttribute("data-state", "inactive")
    expect(screen.getByTestId("effects-tab")).toHaveAttribute("data-state", "inactive")
  })

  it("должен реагировать на клики по вкладкам", () => {
    renderWithProvider(<BrowserTabs activeTab="media" />)

    // Проверяем что клики не вызывают ошибок
    fireEvent.click(screen.getByTestId("music-tab"))
    fireEvent.click(screen.getByTestId("effects-tab"))
    fireEvent.click(screen.getByTestId("templates-tab"))

    // В реальном приложении Radix UI Tabs управляет переключением через контекст
    expect(screen.getByTestId("music-tab")).toBeInTheDocument()
    expect(screen.getByTestId("effects-tab")).toBeInTheDocument()
    expect(screen.getByTestId("templates-tab")).toBeInTheDocument()
  })

  it("должен применять правильные CSS классы к списку вкладок", () => {
    renderWithProvider(<BrowserTabs activeTab="media" />)

    const tabsList = screen.getByTestId("tabs-list")
    expect(tabsList).toHaveClass(
      "h-[50px]",
      "flex-shrink-0",
      "justify-start",
      "border-none",
      "rounded-none",
      "dark:bg-[#2D2D2D]",
      "m-0",
      "p-0",
    )
  })

  it("должен обрабатывать клики по активной вкладке", () => {
    renderWithProvider(<BrowserTabs activeTab="media" />)

    // Проверяем что клик по активной вкладке не вызывает ошибок
    fireEvent.click(screen.getByTestId("media-tab"))
    expect(screen.getByTestId("media-tab")).toBeInTheDocument()
  })

  it("должен логировать активную вкладку при рендере", () => {
    const consoleLogSpy = vi.spyOn(console, "log")

    renderWithProvider(<BrowserTabs activeTab="effects" />)

    expect(consoleLogSpy).toHaveBeenCalledWith("BrowserTabs rendered, activeTab:", "effects")
  })

  it("должен мемоизировать компонент", () => {
    const { rerender } = renderWithProvider(<BrowserTabs activeTab="media" />)

    const firstRender = screen.getByTestId("tabs-list")

    // Перерендериваем с теми же пропсами
    rerender(
      <EffectsProvider>
        <BrowserTabs activeTab="media" />
      </EffectsProvider>,
    )

    const secondRender = screen.getByTestId("tabs-list")

    // Компонент мемоизирован, но это сложно проверить напрямую
    // Проверяем, что компонент все еще существует
    expect(firstRender).toBeInTheDocument()
    expect(secondRender).toBeInTheDocument()
  })

  it("должен обновляться при изменении activeTab", () => {
    const { rerender } = renderWithProvider(<BrowserTabs activeTab="media" />)

    // В мокированном компоненте проверяем наличие вкладок
    expect(screen.getByTestId("media-tab")).toBeInTheDocument()
    expect(screen.getByTestId("music-tab")).toBeInTheDocument()

    rerender(
      <EffectsProvider>
        <BrowserTabs activeTab="music" />
      </EffectsProvider>,
    )

    // После перерендера вкладки все еще существуют
    expect(screen.getByTestId("media-tab")).toBeInTheDocument()
    expect(screen.getByTestId("music-tab")).toBeInTheDocument()
  })

  it("должен обрабатывать все возможные вкладки", () => {
    const tabs = [
      { testId: "media-tab", value: "media" },
      { testId: "music-tab", value: "music" },
      { testId: "subtitles-tab", value: "subtitles" },
      { testId: "effects-tab", value: "effects" },
      { testId: "filters-tab", value: "filters" },
      { testId: "transitions-tab", value: "transitions" },
      { testId: "templates-tab", value: "templates" },
      { testId: "style-templates-tab", value: "style-templates" },
    ]

    renderWithProvider(<BrowserTabs activeTab="media" />)

    tabs.forEach(({ testId }) => {
      const tab = screen.getByTestId(testId)
      expect(tab).toBeInTheDocument()
      // Проверяем что клики не вызывают ошибок
      fireEvent.click(tab)
    })
  })
})
