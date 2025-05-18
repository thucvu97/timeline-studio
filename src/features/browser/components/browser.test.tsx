import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Browser } from "./browser"

// Мокаем компоненты Lucide
vi.mock("lucide-react", () => ({
  Image: vi.fn(() => <div data-testid="image-icon">Image</div>),
  Music: vi.fn(() => <div data-testid="music-icon">Music</div>),
  Sparkles: vi.fn(() => <div data-testid="sparkles-icon">Sparkles</div>),
  Blend: vi.fn(() => <div data-testid="blend-icon">Blend</div>),
  FlipHorizontal2: vi.fn(() => (
    <div data-testid="flip-horizontal-icon">FlipHorizontal2</div>
  )),
  Grid2X2: vi.fn(() => <div data-testid="grid-icon">Grid2X2</div>),
}))

// Мокаем компоненты UI
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
      <div
        data-testid="tabs-value-change"
        onClick={() => onValueChange("music")}
      >
        Change Value
      </div>
    </div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, className }: any) => (
    <div
      data-testid={`tab-trigger-${value}`}
      data-value={value}
      className={className}
    >
      {children}
    </div>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div
      data-testid={`tab-content-${value}`}
      data-value={value}
      className={className}
    >
      {children}
    </div>
  ),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.tabs.media": "Media",
        "browser.tabs.music": "Music",
        "browser.tabs.effects": "Effects",
        "browser.tabs.filters": "Filters",
        "browser.tabs.transitions": "Transitions",
        "browser.tabs.templates": "Templates",
      }
      return translations[key] || key
    },
  }),
}))

describe("Browser", () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all tabs", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что все вкладки отображаются
    expect(screen.getByTestId("tab-trigger-media")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-music")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-effects")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-filters")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-transitions")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-templates")).toBeInTheDocument()

    // Проверяем, что все содержимое вкладок отображается
    expect(screen.getByTestId("tab-content-media")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-music")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-transitions")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-effects")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-subtitles")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-filters")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-templates")).toBeInTheDocument()
  })

  it("should render tab labels correctly", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что все метки вкладок отображаются правильно
    // Используем getAllByText, так как текст может встречаться несколько раз
    expect(screen.getAllByText("Media").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Music").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Effects").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Transitions").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Templates").length).toBeGreaterThan(0)
  })

  it("should render tab icons correctly", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что все иконки вкладок отображаются
    expect(screen.getByTestId("image-icon")).toBeInTheDocument()
    expect(screen.getByTestId("music-icon")).toBeInTheDocument()
    expect(screen.getByTestId("sparkles-icon")).toBeInTheDocument()
    expect(screen.getByTestId("blend-icon")).toBeInTheDocument()
    expect(screen.getByTestId("flip-horizontal-icon")).toBeInTheDocument()
    expect(screen.getByTestId("grid-icon")).toBeInTheDocument()
  })

  it('should have "media" as default active tab', () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что вкладка "media" активна по умолчанию
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "media")
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
  })

  it("should apply correct styles to tab triggers", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что все триггеры вкладок имеют правильные стили
    const expectedStyles =
      "text-xs text-gray-800 dark:bg-[#1b1a1f] border-none " +
      "bg-gray-200 data-[state=active]:bg-secondary data-[state=active]:text-[#38dacac3] " +
      "dark:data-[state=active]:bg-secondary dark:data-[state=active]:text-[#35d1c1] " +
      "hover:text-gray-800 dark:text-gray-400 dark:hover:bg-secondary dark:hover:text-gray-100 " +
      "border-1 border-transparent flex flex-col items-center justify-center gap-1 py-2 " +
      "[&>svg]:data-[state=active]:text-[#38dacac3] cursor-pointer data-[state=active]:cursor-default rounded-none"

    expect(screen.getByTestId("tab-trigger-media")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-music")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-effects")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-filters")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-transitions")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-templates")).toHaveAttribute(
      "class",
      expectedStyles,
    )
  })
})
