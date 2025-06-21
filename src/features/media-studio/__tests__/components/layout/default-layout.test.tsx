import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DefaultLayout } from "../../../components/layout/default-layout"

// Создаем мокированный модуль для управления видимостью компонентов
const mockUserSettings = vi.hoisted(() => ({
  isBrowserVisible: true,
  isOptionsVisible: true,
  isTimelineVisible: true,
}))

// Мокаем useUserSettings чтобы контролировать видимость компонентов
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => mockUserSettings,
}))

// Мокаем зависимости
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

vi.mock("@/features/panels/components", () => ({
  LeftPanel: () => <div data-testid="left-panel">LeftPanel</div>,
  RightPanel: () => <div data-testid="right-panel">RightPanel</div>,
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

vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="player-provider">{children}</div>,
  usePlayer: () => ({
    video: null,
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
  }),
}))

// Мокаем ResizablePanel компоненты
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanel: ({ children, defaultSize, minSize, maxSize, style }: any) => (
    <div 
      data-testid="resizable-panel" 
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      style={style}
    >
      {children}
    </div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
  ResizablePanelGroup: ({ children, direction, autoSaveId }: any) => (
    <div 
      data-testid="resizable-panel-group"
      data-direction={direction}
      data-auto-save-id={autoSaveId}
      className="flex h-full w-full"
    >
      {children}
    </div>
  ),
}))

describe("DefaultLayout", () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    mockUserSettings.isBrowserVisible = true
    mockUserSettings.isOptionsVisible = true
    mockUserSettings.isTimelineVisible = true
  })

  describe("Основная структура", () => {
    it("должен рендерить все компоненты когда все панели видимы", () => {
      render(<DefaultLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })

    it("должен иметь правильную структуру ResizablePanelGroup", () => {
      render(<DefaultLayout />)

      const mainPanelGroup = screen.getAllByTestId("resizable-panel-group")[0]
      expect(mainPanelGroup).toHaveAttribute("data-direction", "vertical")
      expect(mainPanelGroup).toHaveAttribute("data-auto-save-id", "default-layout-main")
    })

    it("должен правильно настраивать основные панели", () => {
      render(<DefaultLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      const topPanel = panels.find(p => p.getAttribute("data-default-size") === "50")
      
      expect(topPanel).toBeInTheDocument()
      expect(topPanel).toHaveAttribute("data-min-size", "20")
      expect(topPanel).toHaveAttribute("data-max-size", "80")
    })
  })

  describe("Случай: Timeline скрыт", () => {
    beforeEach(() => {
      mockUserSettings.isTimelineVisible = false
    })

    it("не должен рендерить Timeline когда isTimelineVisible = false", () => {
      render(<DefaultLayout />)

      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })

    it("не должен рендерить ResizableHandle для Timeline", () => {
      render(<DefaultLayout />)

      // Должен быть только 1 handle в верхней части (между Browser/VideoPlayer/Options)
      // Но не должно быть handle для Timeline
      const handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeLessThan(3) // Меньше чем с Timeline
    })
  })

  describe("Случай: Browser и Options скрыты", () => {
    it("должен показывать только VideoPlayer в верхней части", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false

      render(<DefaultLayout />)

      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
    })

    it("не должен создавать ResizablePanelGroup в верхней части когда только VideoPlayer", () => {
      mockUserSettings.isBrowserVisible = false
      mockUserSettings.isOptionsVisible = false

      render(<DefaultLayout />)

      // Должна быть только одна основная группа
      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups).toHaveLength(1)
      expect(panelGroups[0]).toHaveAttribute("data-auto-save-id", "default-layout-main")
    })
  })

  describe("Случай: Browser + VideoPlayer (Options скрыт)", () => {
    beforeEach(() => {
      mockUserSettings.isOptionsVisible = false
    })

    it("должен показывать Browser и VideoPlayer без Options", () => {
      render(<DefaultLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
    })

    it("должен использовать правильный autoSaveId", () => {
      render(<DefaultLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some(pg => pg.getAttribute("data-auto-save-id") === "default-layout-1")).toBe(true)
    })

    it("должен устанавливать правильные размеры панелей", () => {
      render(<DefaultLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      
      const browserPanel = panels.find(p => 
        p.getAttribute("data-default-size") === "35" &&
        p.querySelector('[data-testid="browser"]')
      )
      const videoPanel = panels.find(p => 
        p.getAttribute("data-default-size") === "65" &&
        p.querySelector('[data-testid="video-player"]')
      )

      expect(browserPanel).toBeInTheDocument()
      expect(videoPanel).toBeInTheDocument()
    })
  })

  describe("Случай: VideoPlayer + Options (Browser скрыт)", () => {
    beforeEach(() => {
      mockUserSettings.isBrowserVisible = false
    })

    it("должен показывать VideoPlayer и Options без Browser", () => {
      render(<DefaultLayout />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })

    it("должен использовать правильный autoSaveId", () => {
      render(<DefaultLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some(pg => pg.getAttribute("data-auto-save-id") === "default-layout-2")).toBe(true)
    })

    it("должен устанавливать правильные размеры панелей", () => {
      render(<DefaultLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      
      const videoPanel = panels.find(p => 
        p.getAttribute("data-default-size") === "65" &&
        p.querySelector('[data-testid="video-player"]')
      )
      const optionsPanel = panels.find(p => 
        p.getAttribute("data-default-size") === "35" &&
        p.querySelector('[data-testid="options"]')
      )

      expect(videoPanel).toBeInTheDocument()
      expect(optionsPanel).toBeInTheDocument()
    })
  })

  describe("Случай: Browser + VideoPlayer + Options (все видимы)", () => {
    it("должен показывать все компоненты в верхней части", () => {
      render(<DefaultLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })

    it("должен использовать правильный autoSaveId", () => {
      render(<DefaultLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some(pg => pg.getAttribute("data-auto-save-id") === "default-layout-3")).toBe(true)
    })

    it("должен устанавливать правильные размеры для трех панелей", () => {
      render(<DefaultLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      
      // Browser: 30%
      const browserPanel = panels.find(p => 
        p.getAttribute("data-default-size") === "30" &&
        p.querySelector('[data-testid="browser"]')
      )
      // VideoPlayer: 50%
      const videoPanel = panels.find(p => 
        p.getAttribute("data-default-size") === "50" &&
        p.querySelector('[data-testid="video-player"]')
      )
      // Options: 20%
      const optionsPanel = panels.find(p => 
        p.getAttribute("data-default-size") === "20" &&
        p.querySelector('[data-testid="options"]')
      )

      expect(browserPanel).toBeInTheDocument()
      expect(videoPanel).toBeInTheDocument()
      expect(optionsPanel).toBeInTheDocument()
    })
  })

  describe("Timeline панель", () => {
    it("должен настраивать Timeline панель с правильными размерами", () => {
      render(<DefaultLayout />)

      const timelinePanel = screen.getAllByTestId("resizable-panel").find(p => 
        p.querySelector('[data-testid="timeline"]')
      )

      expect(timelinePanel).toBeInTheDocument()
      expect(timelinePanel).toHaveAttribute("data-default-size", "20")
      expect(timelinePanel).toHaveAttribute("data-min-size", "20")
      expect(timelinePanel).toHaveAttribute("data-max-size", "100")
    })

    it("должен применять стили анимации к Timeline панели", () => {
      render(<DefaultLayout />)

      const timelinePanel = screen.getAllByTestId("resizable-panel").find(p => 
        p.querySelector('[data-testid="timeline"]')
      )

      expect(timelinePanel).toHaveStyle({
        transition: "width 0.3s ease-in-out"
      })
    })

    it("должен правильно обрабатывать условный рендеринг Timeline", () => {
      const { rerender } = render(<DefaultLayout />)
      
      // Timeline видим
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      
      // Скрываем Timeline
      mockUserSettings.isTimelineVisible = false
      rerender(<DefaultLayout />)
      
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      
      // Показываем Timeline снова
      mockUserSettings.isTimelineVisible = true
      rerender(<DefaultLayout />)
      
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })
  })

  describe("ResizableHandle", () => {
    it("должен добавлять handles между всеми панелями", () => {
      render(<DefaultLayout />)

      const handles = screen.getAllByTestId("resizable-handle")
      // Должно быть 3 handle: 2 в верхней части и 1 между верхней частью и Timeline
      expect(handles.length).toBeGreaterThanOrEqual(3)
    })

    it("должен добавлять правильное количество handles для разных конфигураций", () => {
      const { rerender } = render(<DefaultLayout />)
      
      let handles = screen.getAllByTestId("resizable-handle")
      const fullConfigHandles = handles.length
      
      // Без Timeline
      mockUserSettings.isTimelineVisible = false
      rerender(<DefaultLayout />)
      
      handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeLessThan(fullConfigHandles)
      
      // Без Options
      mockUserSettings.isTimelineVisible = true
      mockUserSettings.isOptionsVisible = false
      rerender(<DefaultLayout />)
      
      handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeLessThan(fullConfigHandles)
    })
  })

  describe("Ограничения размеров", () => {
    it("должен устанавливать minSize и maxSize для всех панелей", () => {
      render(<DefaultLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      
      panels.forEach(panel => {
        const minSize = panel.getAttribute("data-min-size")
        const maxSize = panel.getAttribute("data-max-size")
        
        if (minSize) {
          expect(parseInt(minSize)).toBeGreaterThanOrEqual(20)
        }
        if (maxSize) {
          expect(parseInt(maxSize)).toBeLessThanOrEqual(100)
        }
      })
    })

    it("VideoPlayer должен иметь правильные ограничения размера", () => {
      render(<DefaultLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      const videoPanel = panels.find(p => 
        p.querySelector('[data-testid="video-player"]') &&
        p.getAttribute("data-default-size") === "50"
      )

      expect(videoPanel).toBeTruthy()
      // В зависимости от layout логики maxSize может быть 80 или 100
      const maxSize = videoPanel?.getAttribute("data-max-size")
      expect(maxSize).toBeTruthy()
      expect(parseInt(maxSize || "0")).toBeGreaterThanOrEqual(80)
    })
  })

  describe("Горизонтальное направление верхней части", () => {
    it("должен использовать горизонтальное направление для верхней части", () => {
      render(<DefaultLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const horizontalGroup = panelGroups.find(pg => 
        pg.getAttribute("data-direction") === "horizontal" &&
        pg.getAttribute("data-auto-save-id")?.includes("default-layout-")
      )

      expect(horizontalGroup).toBeInTheDocument()
    })
  })

  describe("Динамическое изменение видимости", () => {
    it("должен корректно обрабатывать изменения видимости всех компонентов", () => {
      const { rerender } = render(<DefaultLayout />)
      
      // Все видимы
      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      
      // Скрываем Browser
      mockUserSettings.isBrowserVisible = false
      rerender(<DefaultLayout />)
      
      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      
      // Скрываем Options тоже
      mockUserSettings.isOptionsVisible = false
      rerender(<DefaultLayout />)
      
      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      
      // Возвращаем все обратно
      mockUserSettings.isBrowserVisible = true
      mockUserSettings.isOptionsVisible = true
      rerender(<DefaultLayout />)
      
      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })
  })
})