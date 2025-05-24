import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BrowserContent } from "./browser-content"

// Мокаем компоненты UI
vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ children, value, className }: any) => (
    <div data-testid={`tab-content-${value}`} data-value={value} className={className}>
      {children}
    </div>
  ),
}))

// Мокаем компоненты вкладок
vi.mock("@/features", () => ({
  MusicList: () => <div data-testid="music-list">Music List</div>,
  TransitionsList: () => <div data-testid="transitions-list">Transitions List</div>,
  EffectList: () => <div data-testid="effect-list">Effect List</div>,
  FilterList: () => <div data-testid="filter-list">Filter List</div>,
  SubtitlesList: () => <div data-testid="subtitles-list">Subtitles List</div>,
  TemplateList: () => <div data-testid="template-list">Template List</div>,
  MediaList: () => <div data-testid="media-list">Media List</div>,
  MediaListProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe("BrowserContent", () => {
  it("should render all tab contents", () => {
    // Рендерим компонент
    render(<BrowserContent />)

    // Проверяем, что все содержимое вкладок отображается
    expect(screen.getByTestId("tab-content-media")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-music")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-transitions")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-effects")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-subtitles")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-filters")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-templates")).toBeInTheDocument()
  })

  it("should render media content with MediaListProvider", () => {
    // Рендерим компонент
    render(<BrowserContent />)

    // Проверяем, что содержимое вкладки "media" отображается с провайдером
    expect(screen.getByTestId("media-list")).toBeInTheDocument()
  })

  it("should render music content", () => {
    // Рендерим компонент
    render(<BrowserContent />)

    // Проверяем, что содержимое вкладки "music" отображается
    expect(screen.getByTestId("music-list")).toBeInTheDocument()
  })

  it("should render transitions content", () => {
    // Рендерим компонент
    render(<BrowserContent />)

    // Проверяем, что содержимое вкладки "transitions" отображается
    expect(screen.getByTestId("transitions-list")).toBeInTheDocument()
  })

  it("should render effects content", () => {
    // Рендерим компонент
    render(<BrowserContent />)

    // Проверяем, что содержимое вкладки "effects" отображается
    expect(screen.getByTestId("effect-list")).toBeInTheDocument()
  })

  it("should render subtitles content", () => {
    // Рендерим компонент
    render(<BrowserContent />)

    // Проверяем, что содержимое вкладки "subtitles" отображается
    expect(screen.getByTestId("subtitles-list")).toBeInTheDocument()
  })

  it("should render filters content", () => {
    // Рендерим компонент
    render(<BrowserContent />)

    // Проверяем, что содержимое вкладки "filters" отображается
    expect(screen.getByTestId("filter-list")).toBeInTheDocument()
  })

  it("should render templates content", () => {
    // Рендерим компонент
    render(<BrowserContent />)

    // Проверяем, что содержимое вкладки "templates" отображается
    expect(screen.getByTestId("template-list")).toBeInTheDocument()
  })
})
