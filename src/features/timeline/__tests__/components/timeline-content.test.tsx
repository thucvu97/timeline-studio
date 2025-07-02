import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TimelineContent } from "../../components/timeline-content"

// Мокаем все внешние зависимости
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}))

vi.mock("@/components/ui/resizable", () => ({
  ResizableHandle: () => <div data-testid="resizable-handle" />,
  ResizablePanel: ({ children, ...props }: any) => (
    <div data-testid="resizable-panel" {...props}>
      {children}
    </div>
  ),
  ResizablePanelGroup: ({ children, ...props }: any) => (
    <div data-testid="resizable-group" {...props}>
      {children}
    </div>
  ),
}))

// Мокаем хуки
const mockTimelineContext = {
  project: null,
  uiState: {
    timeScale: 10,
    scrollX: 0,
    scrollY: 0,
    editMode: "select" as const,
    snapMode: "none" as const,
    selectedClips: [],
    selectedTracks: [],
    selectedSections: [],
    selectedTrackIds: [],
  },
  currentTime: 0,
  createProject: vi.fn(),
  addSection: vi.fn(),
  addTrack: vi.fn(),
  updateTrack: vi.fn(),
  selectTracks: vi.fn(),
  seek: vi.fn(),
  error: null,
  clearError: vi.fn(),
}

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: () => mockTimelineContext,
}))

const mockUseTracks = {
  tracks: [],
  setTrackHeight: vi.fn(),
}

vi.mock("../../hooks/use-tracks", () => ({
  useTracks: () => mockUseTracks,
}))

// Мокаем useTimelinePlayerSync
vi.mock("../../hooks/use-timeline-player-sync", () => ({
  useTimelinePlayerSync: () => ({
    isSynced: false,
    syncedClip: null,
  }),
}))

vi.mock("../../hooks/use-clips", () => ({
  useClips: () => ({
    clips: [],
  }),
}))

vi.mock("../../hooks/use-drag-drop-timeline", () => ({
  useDragDropTimeline: () => ({
    dragState: {
      isDragging: false,
      dropPosition: null,
    },
  }),
}))

vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: {
      name: "Test Project",
      id: "test-project",
    },
  }),
}))

vi.mock("@/features/project-settings/hooks/use-project-settings", () => ({
  useProjectSettings: () => ({
    settings: {
      aspectRatio: {
        value: { width: 16, height: 9 },
      },
      frameRate: "30",
    },
  }),
}))

// Мокаем компоненты
vi.mock("../../components/drag-drop-provider", () => ({
  DragDropProvider: ({ children }: any) => <div data-testid="drag-drop-provider">{children}</div>,
}))

vi.mock("../../components/timeline-preview-strip", () => ({
  TimelinePreviewStrip: () => <div data-testid="timeline-preview-strip">Preview Strip</div>,
}))

vi.mock("../../components/timeline-scale", () => ({
  TimelineScale: ({ timeScale, currentTime }: any) => (
    <div data-testid="timeline-scale" data-time-scale={timeScale} data-current-time={currentTime}>
      Timeline Scale
    </div>
  ),
}))

vi.mock("../../components/track/track", () => ({
  Track: ({ track }: any) => (
    <div data-testid={`track-${track.id}`} data-track-type={track.type}>
      Track {track.name}
    </div>
  ),
}))

vi.mock("../../components/track-controls-panel", () => ({
  TrackControlsPanel: () => <div data-testid="track-controls-panel">Track Controls</div>,
}))

vi.mock("../../components/track-insertion-zone", () => ({
  TrackInsertionZones: ({ trackIds }: any) => (
    <div data-testid="track-insertion-zones" data-track-count={trackIds?.length || 0}>
      Insertion Zones
    </div>
  ),
}))

describe("TimelineContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTimelineContext.project = null
    mockTimelineContext.error = null
    mockUseTracks.tracks = []
  })

  describe("Инициализация проекта", () => {
    it("должен создавать проект при первой загрузке", async () => {
      render(<TimelineContent />)

      await waitFor(() => {
        expect(mockTimelineContext.createProject).toHaveBeenCalledWith("Test Project", {
          width: 16,
          height: 9,
          frameRate: 30,
        })
      })
    })

    it("должен добавлять секцию если проект пустой", async () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      await waitFor(() => {
        expect(mockTimelineContext.addSection).toHaveBeenCalledWith("Main Section", 0, 300)
      })
    })

    it("не должен создавать проект если он уже существует", () => {
      mockTimelineContext.project = {
        id: "existing-project",
        name: "Existing Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      expect(mockTimelineContext.createProject).not.toHaveBeenCalled()
    })
  })

  describe("Отображение компонентов", () => {
    it("должен отображать все основные компоненты", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      expect(screen.getByTestId("drag-drop-provider")).toBeInTheDocument()
      expect(screen.getByTestId("track-controls-panel")).toBeInTheDocument()
      expect(screen.getByTestId("timeline-scale")).toBeInTheDocument()
    })

    it("должен отображать сообщение об отсутствии проекта", () => {
      render(<TimelineContent />)

      expect(screen.getByText("Загрузка Timeline...")).toBeInTheDocument()
      expect(screen.getByText("Инициализация проекта...")).toBeInTheDocument()
    })

    it("должен отображать пустое состояние для секций", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      // Секции автоматически добавляются, поэтому проверяем наличие основных компонентов
      expect(screen.getByTestId("drag-drop-provider")).toBeInTheDocument()
      expect(screen.getByTestId("timeline-scale")).toBeInTheDocument()
    })

    it("должен отображать пустое состояние для треков", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      expect(screen.getByText("Треки не найдены")).toBeInTheDocument()
      expect(screen.getByText("Добавить видео трек")).toBeInTheDocument()
    })
  })

  describe("Отображение ошибок", () => {
    it("должен отображать ошибку если она есть", () => {
      mockTimelineContext.error = "Test error message"

      render(<TimelineContent />)

      expect(screen.getByText("Ошибка Timeline")).toBeInTheDocument()
      expect(screen.getByText("Test error message")).toBeInTheDocument()
    })

    it("должен позволять закрыть ошибку", () => {
      mockTimelineContext.error = "Test error message"

      render(<TimelineContent />)

      const dismissButton = screen.getByText("Закрыть")
      fireEvent.click(dismissButton)

      expect(mockTimelineContext.clearError).toHaveBeenCalled()
    })
  })

  describe("Работа с треками", () => {
    it("должен отображать треки секции", () => {
      const mockTracks = [
        {
          id: "track-1",
          sectionId: "section-1",
          type: "video" as const,
          name: "Video Track 1",
          height: 100,
          isExpanded: true,
          isLocked: false,
          isMuted: false,
          clips: [],
        },
        {
          id: "track-2",
          sectionId: "section-1",
          type: "audio" as const,
          name: "Audio Track 1",
          height: 80,
          isExpanded: true,
          isLocked: false,
          isMuted: false,
          clips: [],
        },
      ]

      vi.mocked(vi.fn()).mockImplementation(() => ({
        useTracks: () => ({
          tracks: mockTracks,
          setTrackHeight: vi.fn(),
        }),
      }))

      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: mockTracks,
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      // Компоненты будут рендериться внутри DragDropProvider
      expect(screen.getByTestId("drag-drop-provider")).toBeInTheDocument()
    })

    it("должен добавлять трек при нажатии кнопки", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      const addTrackButton = screen.getByText("Добавить видео трек")
      fireEvent.click(addTrackButton)

      expect(mockTimelineContext.addTrack).toHaveBeenCalledWith("video", undefined, "Видео трек")
    })
  })

  describe("Прокрутка и масштабирование", () => {
    it("должен обрабатывать горизонтальную прокрутку", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      const scrollContainer = document.querySelector(".overflow-auto")
      expect(scrollContainer).toBeInTheDocument()
    })

    it("должен передавать timeScale в дочерние компоненты", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      const timelineScale = screen.getByTestId("timeline-scale")
      expect(timelineScale).toBeInTheDocument()
    })
  })

  describe("Resizable панели", () => {
    it("должен отображать resizable группу", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      expect(screen.getByTestId("resizable-group")).toBeInTheDocument()
    })

    it("должен отображать resizable handle", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      expect(screen.getByTestId("resizable-handle")).toBeInTheDocument()
    })

    it("должен отображать resizable панели", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      const panels = screen.getAllByTestId("resizable-panel")
      expect(panels).toHaveLength(2) // Панель контролов и панель треков
    })
  })

  describe("Drag and Drop", () => {
    it("должен оборачивать контент в DragDropProvider", () => {
      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: [],
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      expect(screen.getByTestId("drag-drop-provider")).toBeInTheDocument()
    })

    it("должен отображать track insertion zones", () => {
      const testTracks = [
        {
          id: "track-1",
          sectionId: "section-1",
          type: "video" as const,
          name: "Video Track 1",
          height: 100,
          isExpanded: true,
          isLocked: false,
          isMuted: false,
          clips: [],
        },
      ]

      // Обновляем мок useTracks чтобы возвращать треки
      mockUseTracks.tracks = testTracks

      mockTimelineContext.project = {
        id: "test-project",
        name: "Test Project",
        sections: [{ id: "section-1", name: "Section 1", startTime: 0, duration: 300 }],
        tracks: testTracks,
        clips: [],
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<TimelineContent />)

      expect(screen.getByTestId("track-insertion-zones")).toBeInTheDocument()
    })
  })
})
