import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OptionsLayout } from "../../../components/layout/options-layout"

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

// Мокаем ResizablePanel компоненты
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanel: ({ children, defaultSize, minSize, maxSize }: any) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      data-panel="true"
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
      data-panel-group="true"
      className="flex h-full w-full"
    >
      {children}
    </div>
  ),
}))

describe("OptionsLayout", () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    mockUserSettings.isBrowserVisible = true
    mockUserSettings.isOptionsVisible = true
    mockUserSettings.isTimelineVisible = true
  })

  describe("Основная структура", () => {
    it("должен рендерить все компоненты когда все панели видимы", () => {
      render(<OptionsLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })

    it("должен иметь правильную структуру ResizablePanelGroup", () => {
      render(<OptionsLayout />)

      const mainPanelGroup = screen.getAllByTestId("resizable-panel-group")[0]
      expect(mainPanelGroup).toHaveAttribute("data-direction", "horizontal")
      expect(mainPanelGroup).toHaveAttribute("data-auto-save-id", "opts-layout-main")
    })

    it("должен правильно разделять левую и правую части", () => {
      render(<OptionsLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      const leftPanel = panels.find((p) => p.getAttribute("data-default-size") === "70")
      const rightPanel = panels.find((p) => p.getAttribute("data-default-size") === "30")

      expect(leftPanel).toBeInTheDocument()
      expect(rightPanel).toBeInTheDocument()
    })
  })

  describe("Случай: Options скрыт", () => {
    beforeEach(() => {
      mockUserSettings.isOptionsVisible = false
    })

    it("не должен рендерить Options когда isOptionsVisible = false", () => {
      render(<OptionsLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()
    })

    it("не должен создавать правую панель для Options", () => {
      render(<OptionsLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      const rightPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "30" && p.querySelector('[data-testid="options"]'),
      )

      expect(rightPanel).toBeFalsy()
    })
  })

  describe("Случай: Timeline и Browser скрыты", () => {
    beforeEach(() => {
      mockUserSettings.isTimelineVisible = false
      mockUserSettings.isBrowserVisible = false
    })

    it("должен показывать только VideoPlayer в левой части", () => {
      render(<OptionsLayout />)

      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
    })

    it("не должен создавать вложенные ResizablePanelGroup когда только VideoPlayer", () => {
      render(<OptionsLayout />)

      // Должна быть только основная группа
      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups).toHaveLength(1)
      expect(panelGroups[0]).toHaveAttribute("data-auto-save-id", "opts-layout-main")
    })
  })

  describe("Случай: Browser + VideoPlayer (Timeline скрыт)", () => {
    beforeEach(() => {
      mockUserSettings.isTimelineVisible = false
    })

    it("должен показывать Browser и VideoPlayer без Timeline", () => {
      render(<OptionsLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
    })

    it("должен использовать правильный autoSaveId", () => {
      render(<OptionsLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "opts-layout-1")).toBe(true)
    })

    it("должен использовать горизонтальное направление", () => {
      render(<OptionsLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const horizontalGroup = panelGroups.find((pg) => pg.getAttribute("data-auto-save-id") === "opts-layout-1")
      expect(horizontalGroup).toHaveAttribute("data-direction", "horizontal")
    })

    it("должен устанавливать правильные размеры панелей", () => {
      render(<OptionsLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      const browserPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "35" && p.querySelector('[data-testid="browser"]'),
      )
      const videoPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "65" && p.querySelector('[data-testid="video-player"]'),
      )

      expect(browserPanel).toBeInTheDocument()
      expect(videoPanel).toBeInTheDocument()
    })
  })

  describe("Случай: VideoPlayer + Timeline (Browser скрыт)", () => {
    beforeEach(() => {
      mockUserSettings.isBrowserVisible = false
    })

    it("должен показывать VideoPlayer и Timeline без Browser", () => {
      render(<OptionsLayout />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })

    it("должен использовать правильный autoSaveId", () => {
      render(<OptionsLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      expect(panelGroups.some((pg) => pg.getAttribute("data-auto-save-id") === "opts-layout-2")).toBe(true)
    })

    it("должен устанавливать правильные размеры панелей", () => {
      render(<OptionsLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      const videoPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "65" && p.querySelector('[data-testid="video-player"]'),
      )
      const timelinePanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "35" && p.querySelector('[data-testid="timeline"]'),
      )

      expect(videoPanel).toBeInTheDocument()
      expect(timelinePanel).toBeInTheDocument()
    })
  })

  describe("Случай: Browser + VideoPlayer + Timeline (все видимы)", () => {
    it("должен использовать вертикальную структуру для левой части", () => {
      render(<OptionsLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const verticalGroup = panelGroups.find(
        (pg) =>
          pg.getAttribute("data-direction") === "vertical" && pg.getAttribute("data-auto-save-id") === "opts-layout-3",
      )

      expect(verticalGroup).toBeInTheDocument()
    })

    it("должен использовать вложенную горизонтальную группу", () => {
      render(<OptionsLayout />)

      const panelGroups = screen.getAllByTestId("resizable-panel-group")
      const horizontalGroup = panelGroups.find(
        (pg) =>
          pg.getAttribute("data-direction") === "horizontal" &&
          pg.getAttribute("data-auto-save-id") === "opts-layout-4",
      )

      expect(horizontalGroup).toBeInTheDocument()
    })

    it("должен правильно располагать все компоненты", () => {
      render(<OptionsLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      // Верхняя часть: 50%
      const topPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "50" && p.querySelector('[data-testid="resizable-panel-group"]'),
      )
      expect(topPanel).toBeInTheDocument()

      // Browser: 30%
      const browserPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "30" && p.querySelector('[data-testid="browser"]'),
      )
      expect(browserPanel).toBeInTheDocument()

      // VideoPlayer: 50% (во вложенной группе)
      const videoPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "50" && p.querySelector('[data-testid="video-player"]'),
      )
      expect(videoPanel).toBeInTheDocument()

      // Timeline: 20% (внизу)
      const timelinePanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "20" && p.querySelector('[data-testid="timeline"]'),
      )
      expect(timelinePanel).toBeInTheDocument()
    })
  })

  describe("ResizableHandle", () => {
    it("должен добавлять handles между всеми панелями", () => {
      render(<OptionsLayout />)

      const handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeGreaterThan(0)
    })

    it("должен добавлять разное количество handles для разных конфигураций", () => {
      const { rerender } = render(<OptionsLayout />)

      let handles = screen.getAllByTestId("resizable-handle")
      const fullConfigHandles = handles.length

      // Без Timeline
      mockUserSettings.isTimelineVisible = false
      rerender(<OptionsLayout />)

      handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeLessThan(fullConfigHandles)

      // Без Browser и Timeline
      mockUserSettings.isBrowserVisible = false
      rerender(<OptionsLayout />)

      handles = screen.getAllByTestId("resizable-handle")
      expect(handles.length).toBeLessThan(fullConfigHandles)
    })
  })

  describe("Ограничения размеров", () => {
    it("должен устанавливать правильные minSize и maxSize", () => {
      render(<OptionsLayout />)

      const panels = screen.getAllByTestId("resizable-panel")

      panels.forEach((panel) => {
        const minSize = panel.getAttribute("data-min-size")
        const maxSize = panel.getAttribute("data-max-size")

        if (minSize) {
          expect(Number.parseInt(minSize)).toBeGreaterThanOrEqual(20)
        }
        if (maxSize) {
          expect(Number.parseInt(maxSize)).toBeLessThanOrEqual(100)
        }
      })
    })

    it("VideoPlayer должен иметь maxSize=100 в горизонтальной группе", () => {
      render(<OptionsLayout />)

      const panels = screen.getAllByTestId("resizable-panel")
      const videoPanel = panels.find(
        (p) => p.querySelector('[data-testid="video-player"]') && p.getAttribute("data-max-size") === "100",
      )

      expect(videoPanel).toBeInTheDocument()
    })
  })

  describe("Динамическое изменение видимости", () => {
    it("должен корректно обрабатывать изменения видимости Options", () => {
      const { rerender } = render(<OptionsLayout />)

      // Options видим
      expect(screen.getByTestId("options")).toBeInTheDocument()

      // Скрываем Options
      mockUserSettings.isOptionsVisible = false
      rerender(<OptionsLayout />)

      expect(screen.queryByTestId("options")).not.toBeInTheDocument()

      // Показываем Options снова
      mockUserSettings.isOptionsVisible = true
      rerender(<OptionsLayout />)

      expect(screen.getByTestId("options")).toBeInTheDocument()
    })

    it("должен корректно обрабатывать изменения видимости всех компонентов", () => {
      const { rerender } = render(<OptionsLayout />)

      // Скрываем Timeline
      mockUserSettings.isTimelineVisible = false
      rerender(<OptionsLayout />)

      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()

      // Скрываем Browser тоже
      mockUserSettings.isBrowserVisible = false
      rerender(<OptionsLayout />)

      expect(screen.queryByTestId("browser")).not.toBeInTheDocument()
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument()
      expect(screen.getByTestId("video-player")).toBeInTheDocument()

      // Возвращаем все обратно
      mockUserSettings.isBrowserVisible = true
      mockUserSettings.isTimelineVisible = true
      rerender(<OptionsLayout />)

      expect(screen.getByTestId("browser")).toBeInTheDocument()
      expect(screen.getByTestId("timeline")).toBeInTheDocument()
    })
  })

  describe("Условный рендеринг Options панели", () => {
    it("должен использовать условный рендеринг для правой панели", () => {
      const { rerender } = render(<OptionsLayout />)

      // Проверяем что правая панель существует когда Options видим
      let panels = screen.getAllByTestId("resizable-panel")
      const optionsPanel = panels.find(
        (p) => p.getAttribute("data-default-size") === "30" && p.querySelector('[data-testid="options"]'),
      )
      expect(optionsPanel).toBeInTheDocument()

      // Скрываем Options
      mockUserSettings.isOptionsVisible = false
      rerender(<OptionsLayout />)

      // Options не должен отображаться
      expect(screen.queryByTestId("options")).not.toBeInTheDocument()

      // Проверяем что нет панели с Options
      panels = screen.getAllByTestId("resizable-panel")
      const panelWithOptions = panels.find((p) => p.querySelector('[data-testid="options"]'))
      expect(panelWithOptions).toBeFalsy()
    })
  })

  describe("Интеграция компонентов", () => {
    it("должен правильно интегрировать все компоненты в сложной структуре", () => {
      render(<OptionsLayout />)

      // Проверяем что есть основная группа
      const mainGroup = screen
        .getAllByTestId("resizable-panel-group")
        .find((pg) => pg.getAttribute("data-auto-save-id") === "opts-layout-main")
      expect(mainGroup).toBeInTheDocument()
      expect(mainGroup).toHaveAttribute("data-direction", "horizontal")

      // Проверяем что есть вертикальная группа для левой части
      const verticalGroup = screen
        .getAllByTestId("resizable-panel-group")
        .find((pg) => pg.getAttribute("data-auto-save-id") === "opts-layout-3")
      expect(verticalGroup).toBeInTheDocument()
      expect(verticalGroup).toHaveAttribute("data-direction", "vertical")

      // Проверяем что есть вложенная горизонтальная группа
      const nestedHorizontalGroup = screen
        .getAllByTestId("resizable-panel-group")
        .find((pg) => pg.getAttribute("data-auto-save-id") === "opts-layout-4")
      expect(nestedHorizontalGroup).toBeInTheDocument()
      expect(nestedHorizontalGroup).toHaveAttribute("data-direction", "horizontal")
    })
  })
})
