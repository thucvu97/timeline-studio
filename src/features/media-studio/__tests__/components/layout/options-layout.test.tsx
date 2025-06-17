import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { OptionsLayout } from "../../../components/layout/options-layout"

// Мокаем useUserSettings чтобы контролировать видимость компонентов
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    isBrowserVisible: true,
    isOptionsVisible: true,
    isTimelineVisible: true,
  }),
}))

// Мокаем зависимости
vi.mock("@/features/browser/components/browser", () => ({
  Browser: () => <div data-testid="browser">Browser</div>,
}))

vi.mock("@/features/video-player/components/video-player", () => ({
  VideoPlayer: () => <div data-testid="video-player">VideoPlayer</div>,
}))

vi.mock("@/features/timeline/components/timeline", () => ({
  Timeline: () => <div data-testid="timeline">Timeline</div>,
}))

vi.mock("@/features/timeline/hooks", () => ({
  useTimeline: () => ({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    zoom: 1,
    setCurrentTime: vi.fn(),
    setDuration: vi.fn(),
    setIsPlaying: vi.fn(),
    setZoom: vi.fn(),
  }),
}))

vi.mock("@/features/options", () => ({
  Options: () => <div data-testid="options">Options</div>,
}))

vi.mock("@/features/project-settings/hooks", () => ({
  useProjectSettings: () => ({
    settings: {
      aspectRatio: {
        value: { width: 1920, height: 1080 },
        update: vi.fn(),
      },
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
    },
    updateProjectSettings: vi.fn(),
  }),
}))

vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="player-provider">{children}</div>,
  usePlayer: () => ({
    video: null,
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
  }),
}))

// Создаем мок контекста вне функции
const mockTimelineContext = {
  project: null,
  uiState: {
    selectedClipIds: [],
    selectedTrackId: null,
    zoom: 1,
    scrollPosition: 0,
  },
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  error: null,
  lastAction: null,
  isReady: true,
  isSaving: false,
}

vi.mock("@/features/timeline/services/timeline-provider", () => ({
  TimelineContext: {
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) => children(mockTimelineContext),
  },
  TimelineProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="timeline-provider">{children}</div>
  ),
  useTimeline: () => mockTimelineContext,
}))

vi.mock("@/features/video-compiler/hooks/use-prerender", () => ({
  usePrerender: () => ({
    isRendering: false,
    progress: 0,
    startPrerender: vi.fn(),
    stopPrerender: vi.fn(),
    clearPrerenderCache: vi.fn(),
  }),
  usePrerenderCache: () => ({
    clearCache: vi.fn(),
    cacheSize: 0,
    totalCacheSize: 0,
  }),
}))

vi.mock("@/features/video-player/components/prerender-controls", () => ({
  PrerenderControls: () => null,
}))

describe("OptionsLayout", () => {
  it("должен рендерить все компоненты", () => {
    render(<OptionsLayout />)

    expect(screen.getByTestId("browser")).toBeInTheDocument()
    expect(screen.getByTestId("video-player")).toBeInTheDocument()
    expect(screen.getByTestId("timeline")).toBeInTheDocument()
    expect(screen.getByTestId("options")).toBeInTheDocument()
  })

  it("должен иметь структуру layout с опциями", () => {
    const { container } = render(<OptionsLayout />)

    // Проверяем основной контейнер
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveAttribute("data-panel-group")
  })

  it("должен правильно размещать компоненты", () => {
    const { container } = render(<OptionsLayout />)

    // Проверяем наличие ResizablePanelGroup
    const panelGroup = container.querySelector("[data-panel-group]")
    expect(panelGroup).toBeInTheDocument()

    // Проверяем наличие панелей
    const panels = container.querySelectorAll("[data-panel]")
    expect(panels.length).toBeGreaterThan(0)
  })
})
