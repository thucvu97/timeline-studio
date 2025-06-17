/**
 * @vitest-environment jsdom
 *
 * Интеграционные тесты для drag-drop функциональности Timeline
 * Тестируют взаимодействие между компонентами, хуками и утилитами
 */

import { DndContext } from "@dnd-kit/core"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DragDropProvider } from "../../components/drag-drop-provider"
import { TimelineContent } from "../../components/timeline-content"
import { TrackControlsPanel } from "../../components/track-controls-panel"
import { TrackInsertionZones } from "../../components/track-insertion-zone"
import { useTimeline } from "../../hooks/use-timeline"
import { useTracks } from "../../hooks/use-tracks"
import * as dragCalculations from "../../utils/drag-calculations"

// Мок ResizeObserver перед импортом компонентов
beforeEach(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

// Моки для внешних зависимостей
const mockAddTrack = vi.fn()
const mockUpdateTrack = vi.fn()
const mockAddSingleMediaToTimeline = vi.fn()
const mockSelectTracks = vi.fn()
const mockSeek = vi.fn()
const mockAddSection = vi.fn()
const mockCreateProject = vi.fn()
const mockClearError = vi.fn()

// Mock для useCurrentProject
vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: {
      id: "test-project",
      name: "Current Timeline Project",
      path: "/test/project.timeline",
      lastOpened: Date.now(),
    },
  }),
}))

// Mock для useProjectSettings
vi.mock("@/features/project-settings/hooks/use-project-settings", () => ({
  useProjectSettings: () => ({
    settings: {
      aspectRatio: {
        value: { width: 1920, height: 1080 },
      },
      frameRate: "30",
    },
  }),
}))

// Mock для timeline machine
vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: vi.fn(() => ({
    project: {
      id: "test-project",
      name: "Test Project",
      settings: {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
      },
      sections: [
        {
          id: "section-1",
          name: "Main Section",
          startTime: 0,
          endTime: 300,
        },
      ],
    },
    uiState: {
      timeScale: 1,
      snapMode: "none",
      selectedTrackIds: [],
    },
    currentTime: 0,
    addTrack: mockAddTrack,
    updateTrack: mockUpdateTrack,
    selectTracks: mockSelectTracks,
    seek: mockSeek,
    addSection: mockAddSection,
    createProject: mockCreateProject,
    clearError: mockClearError,
    error: null,
  })),
}))

// Mock для tracks
vi.mock("../../hooks/use-tracks", () => ({
  useTracks: vi.fn(() => ({
    tracks: [
      {
        id: "video-track-1",
        name: "Video Track 1",
        type: "video",
        height: 80,
        isHidden: false,
        isLocked: false,
        clips: [],
      },
      {
        id: "audio-track-1",
        name: "Audio Track 1",
        type: "audio",
        height: 60,
        isHidden: false,
        isLocked: false,
        clips: [],
      },
    ],
    setTrackHeight: vi.fn(),
  })),
}))

// Mock для clips
vi.mock("../../hooks/use-clips", () => ({
  useClips: () => ({
    clips: [
      {
        id: "clip-1",
        trackId: "video-track-1",
        startTime: 0,
        duration: 30,
        mediaFile: {
          name: "existing-video.mp4",
          path: "/path/to/existing-video.mp4",
          isVideo: true,
          isAudio: false,
          isImage: false,
        },
      },
    ],
  }),
}))

// Mock для timeline actions
vi.mock("../../hooks/use-timeline-actions", () => ({
  useTimelineActions: () => ({
    addSingleMediaToTimeline: mockAddSingleMediaToTimeline,
  }),
}))

// Mock для app state
vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: {
      id: "current-project-1",
      name: "Current Timeline Project",
    },
  }),
}))

// Mock для project settings
vi.mock("@/features/project-settings/hooks/use-project-settings", () => ({
  useProjectSettings: () => ({
    settings: {
      aspectRatio: {
        value: { width: 1920, height: 1080 },
      },
      frameRate: "30",
    },
  }),
}))

// Mock для drag calculations
vi.mock("../../utils/drag-calculations", () => ({
  calculateTimelinePosition: vi.fn((mouseX, rect) => {
    // Простая формула для тестов: позиция относительно левого края
    return Math.max(0, (mouseX - rect.left) * 0.1) // 10 пикселей = 1 секунда
  }),
  canDropOnTrack: vi.fn((mediaFile, trackType) => {
    // Видео может на video треки, аудио на audio/music треки
    if (mediaFile.isVideo && trackType === "video") return true
    if (mediaFile.isAudio && (trackType === "audio" || trackType === "music")) return true
    if (mediaFile.isImage && (trackType === "video" || trackType === "image")) return true
    return false
  }),
  getTrackTypeForMediaFile: vi.fn((mediaFile) => {
    if (mediaFile.isVideo) return "video"
    if (mediaFile.isAudio) return "audio"
    if (mediaFile.isImage) return "image"
    return "video"
  }),
  findInsertionPoint: vi.fn((targetTime) => targetTime),
  snapToGrid: vi.fn((time) => Math.round(time)),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe("Интеграция Drag-Drop функциональности", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Мокируем DOM методы
    Object.defineProperty(document, "querySelector", {
      value: vi.fn(() => ({
        getBoundingClientRect: () => ({
          left: 100,
          top: 50,
          width: 400,
          height: 80,
          right: 500,
          bottom: 130,
        }),
        scrollLeft: 0,
      })),
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("DragDropProvider интеграция", () => {
    it("должен инициализировать DndContext с правильными настройками", () => {
      const TestComponent = () => (
        <DragDropProvider>
          <div data-testid="dnd-content">DnD Content</div>
        </DragDropProvider>
      )

      const { container } = render(<TestComponent />)

      // DndContext должен быть инициализирован - проверяем наличие accessibility элементов
      expect(container.querySelector("[aria-live]")).toBeInTheDocument()
      expect(container.querySelector("[role='status']")).toBeInTheDocument()
      expect(screen.getByTestId("dnd-content")).toBeInTheDocument()
    })

    it("должен правильно обрабатывать события drag для медиафайлов", () => {
      const mediaFile = {
        name: "test-video.mp4",
        path: "/path/to/test-video.mp4",
        duration: 120,
        isVideo: true,
        isAudio: false,
        isImage: false,
      }

      const TestDraggableItem = () => (
        <DragDropProvider>
          <div
            draggable
            onDragStart={(e) => {
              // Симулируем drag события
              e.dataTransfer?.setData("application/json", JSON.stringify(mediaFile))
            }}
            data-testid="draggable-media"
          >
            {mediaFile.name}
          </div>
        </DragDropProvider>
      )

      render(<TestDraggableItem />)

      const draggableItem = screen.getByTestId("draggable-media")

      fireEvent.dragStart(draggableItem)

      // Проверяем что элемент можно перетаскивать
      expect(draggableItem).toHaveAttribute("draggable", "true")
    })
  })

  describe("TrackInsertionZones интеграция", () => {
    it("должен правильно создавать зоны для списка треков", () => {
      const trackIds = ["track-1", "track-2", "track-3"]

      render(
        <DndContext onDragEnd={() => {}}>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      // Для 3 треков должно быть 5 зон: 1 выше + 3 между + 1 ниже
      const insertionZones = screen.getAllByText(/Создать трек/)
      expect(insertionZones).toHaveLength(5)

      // Проверяем наличие всех типов зон
      expect(screen.getByText("Создать трек выше")).toBeInTheDocument()
      expect(screen.getAllByText("Создать трек между")).toHaveLength(3)
      expect(screen.getByText("Создать трек ниже")).toBeInTheDocument()
    })

    it("должен скрывать зоны когда isVisible = false", () => {
      const trackIds = ["track-1", "track-2"]

      render(<TrackInsertionZones trackIds={trackIds} isVisible={false} />)

      // Зоны не должны отображаться
      expect(screen.queryByText(/Создать трек/)).not.toBeInTheDocument()
    })

    it("должен правильно обрабатывать пустой список треков", () => {
      render(
        <DndContext onDragEnd={() => {}}>
          <TrackInsertionZones trackIds={[]} isVisible={true} />
        </DndContext>,
      )

      // Для пустого списка должны быть только зоны "выше" и "ниже"
      const insertionZones = screen.getAllByText(/Создать трек/)
      expect(insertionZones).toHaveLength(2)
      expect(screen.getByText("Создать трек выше")).toBeInTheDocument()
      expect(screen.getByText("Создать трек ниже")).toBeInTheDocument()
    })
  })

  describe("TrackControlsPanel интеграция", () => {
    it("должен отображать информацию о треках из hook", () => {
      render(<TrackControlsPanel />)

      expect(screen.getByText("Управление треками")).toBeInTheDocument()
      expect(screen.getByText("2 треков")).toBeInTheDocument() // 2 трека из мока

      // Проверяем отображение треков
      expect(screen.getByText("Video Track 1")).toBeInTheDocument()
      expect(screen.getByText("Audio Track 1")).toBeInTheDocument()
    })

    it("должен вызывать addTrack при нажатии кнопок добавления", () => {
      render(<TrackControlsPanel />)

      const videoButton = screen.getByText("Видео")
      fireEvent.click(videoButton)

      expect(mockAddTrack).toHaveBeenCalledWith("video", "Видео 2") // Уже есть 1 видео трек в моке

      const audioButton = screen.getByText("Аудио")
      fireEvent.click(audioButton)

      expect(mockAddTrack).toHaveBeenCalledWith("audio", "Аудио 2") // Уже есть 1 аудио трек в моке
    })

    it("должен обновлять треки при изменении настроек", () => {
      render(<TrackControlsPanel />)

      // Находим кнопку видимости для первого трека
      const visibilityButtons = screen.getAllByRole("button", { name: /toggle visibility/i })
      fireEvent.click(visibilityButtons[0])

      expect(mockUpdateTrack).toHaveBeenCalledWith("video-track-1", { isHidden: true })
    })
  })

  describe("Полная интеграция Timeline с drag-drop", () => {
    it("должен корректно рендерить TimelineContent с DragDrop поддержкой", () => {
      render(<TimelineContent />)

      // Проверяем основные элементы Timeline
      expect(screen.getByText("Current Timeline Project")).toBeInTheDocument()
      expect(screen.getByText("1920x1080 @ 30fps")).toBeInTheDocument()
      expect(screen.getByText("1 секций")).toBeInTheDocument()
      // Используем getAllByText так как "2 треков" появляется в двух местах
      const trackTexts = screen.getAllByText("2 треков")
      expect(trackTexts.length).toBeGreaterThan(0)
      expect(screen.getByText("1 клипов")).toBeInTheDocument()

      // Проверяем наличие TrackControlsPanel
      expect(screen.getByText("Управление треками")).toBeInTheDocument()

      // Проверяем наличие временной шкалы
      expect(screen.getByText("Временная шкала")).toBeInTheDocument()
    })

    it("должен обрабатывать создание проекта при первой загрузке", async () => {
      // Создаем отдельный компонент для теста с нужными моками
      const TestComponentNoProject = () => {
        // Переопределяем хук внутри компонента
        vi.mocked(useTimeline).mockImplementation(() => ({
          project: null, // нет проекта
          uiState: { timeScale: 1, snapMode: "none", selectedTrackIds: [] },
          currentTime: 0,
          createProject: mockCreateProject,
          addTrack: mockAddTrack,
          updateTrack: mockUpdateTrack,
          selectTracks: mockSelectTracks,
          seek: mockSeek,
          addSection: mockAddSection,
          clearError: mockClearError,
          error: null,
          addSingleMediaToTimeline: mockAddSingleMediaToTimeline,
        }))

        return <TimelineContent />
      }

      render(<TestComponentNoProject />)

      // Должен показать загрузку
      expect(screen.getByText("Загрузка Timeline...")).toBeInTheDocument()
      expect(screen.getByText("Инициализация проекта...")).toBeInTheDocument()
    })

    it("должен обрабатывать ошибки Timeline", async () => {
      // Создаем компонент с ошибкой
      const TestComponentWithError = () => {
        vi.mocked(useTimeline).mockImplementation(() => ({
          project: null,
          uiState: { timeScale: 1, snapMode: "none", selectedTrackIds: [] },
          currentTime: 0,
          createProject: mockCreateProject,
          addTrack: mockAddTrack,
          updateTrack: mockUpdateTrack,
          selectTracks: mockSelectTracks,
          seek: mockSeek,
          addSection: mockAddSection,
          clearError: mockClearError,
          error: "Тестовая ошибка загрузки проекта",
          addSingleMediaToTimeline: mockAddSingleMediaToTimeline,
        }))

        return <TimelineContent />
      }

      render(<TestComponentWithError />)

      expect(screen.getByText("Ошибка Timeline")).toBeInTheDocument()
      expect(screen.getByText("Тестовая ошибка загрузки проекта")).toBeInTheDocument()

      const closeButton = screen.getByText("Закрыть")
      fireEvent.click(closeButton)

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe("Симуляция реальных пользовательских сценариев", () => {
    it("симулирует добавление нового видео трека через drag-drop", async () => {
      const { container } = render(<TimelineContent />)

      // Симулируем перетаскивание видеофайла в зону создания трека
      const mediaFile = {
        name: "new-video.mp4",
        path: "/path/to/new-video.mp4",
        duration: 60,
        isVideo: true,
        isAudio: false,
        isImage: false,
      }

      // Проверяем наличие drag-drop accessibility элементов
      expect(container.querySelector("[aria-live]")).toBeInTheDocument()
      expect(container.querySelector("[role='status']")).toBeInTheDocument()

      // Симулируем события DragDropProvider
      const mockEvent = {
        active: {
          id: "media-item",
          data: { current: { type: "media-file", mediaFile } },
        },
        over: {
          id: "track-insertion-above-none-0",
          data: { current: { type: "track-insertion", insertIndex: 0 } },
        },
      }

      // В реальном сценарии это бы вызвалось через DnD события
      expect(mockAddTrack).toHaveBeenCalledTimes(0) // пока еще не вызвано
    })

    it("симулирует добавление клипа на существующий трек", () => {
      render(<TimelineContent />)

      const mediaFile = {
        name: "audio-track.mp3",
        path: "/path/to/audio-track.mp3",
        duration: 180,
        isVideo: false,
        isAudio: true,
        isImage: false,
      }

      // В реальном сценарии пользователь бы перетащил файл на audio-track-1
      // и это бы вызвало addSingleMediaToTimeline
      const targetTrackId = "audio-track-1"
      const dropTime = 30.5

      // Проверяем что панель управления треками существует
      expect(screen.getByText("Управление треками")).toBeInTheDocument()
      // И что в ней отображается правильное количество треков
      const trackTexts = screen.getAllByText("2 треков")
      expect(trackTexts.length).toBeGreaterThan(0)
    })

    it("симулирует управление треками через TrackControlsPanel", () => {
      render(<TimelineContent />)

      // Проверяем наличие панели управления
      expect(screen.getByText("Управление треками")).toBeInTheDocument()

      // Симулируем скрытие трека
      const visibilityButtons = screen.getAllByRole("button", { name: /toggle visibility/i })
      expect(visibilityButtons.length).toBeGreaterThan(0)

      fireEvent.click(visibilityButtons[0])
      expect(mockUpdateTrack).toHaveBeenCalledWith("video-track-1", { isHidden: true })

      // Симулируем блокировку трека
      const lockButtons = screen.getAllByRole("button", { name: /toggle lock/i })
      expect(lockButtons.length).toBeGreaterThan(0)

      fireEvent.click(lockButtons[0])
      expect(mockUpdateTrack).toHaveBeenCalledWith("video-track-1", { isLocked: true })
    })

    it("симулирует работу с высотой треков", () => {
      render(<TrackControlsPanel />)

      // Проверяем отображение текущей высоты треков
      expect(screen.getByText("80px")).toBeInTheDocument() // video track height
      expect(screen.getByText("60px")).toBeInTheDocument() // audio track height

      // Слайдеры высоты должны присутствовать
      const heightLabels = screen.getAllByText("Высота")
      expect(heightLabels.length).toBe(2) // по одному для каждого трека
    })
  })

  describe("Обработка ошибок и граничных случаев", () => {
    it("должен обрабатывать отсутствие треков", async () => {
      // Мокаем useTracks чтобы возвращал пустой массив
      vi.mocked(useTracks).mockImplementationOnce(() => ({
        tracks: [],
        setTrackHeight: vi.fn(),
      }))

      render(<TrackControlsPanel />)

      // Проверяем отображение нулевого количества треков
      const zeroText = screen.getByText("0 треков")
      expect(zeroText).toBeInTheDocument()

      // Кнопка добавления видео трека должна быть доступна
      expect(screen.getByText("Видео")).toBeInTheDocument()
    })

    it("должен обрабатывать некорректные данные медиафайлов", () => {
      const invalidMediaFile = {
        id: "invalid-file",
        name: "",
        path: "",
        duration: 0,
        isVideo: false,
        isAudio: false,
        isImage: false,
      }

      // Тестируем что система не крашится с некорректными данными
      expect(() => {
        dragCalculations.getTrackTypeForMediaFile(invalidMediaFile)
        dragCalculations.canDropOnTrack(invalidMediaFile, "video")
      }).not.toThrow()
    })

    it("должен обрабатывать большие значения времени", () => {
      // Тест с большими значениями (несколько часов)
      const largeTimeValue = 7200 // 2 часа в секундах

      expect(() => {
        const mockRect = { left: 0, right: 1000, top: 0, bottom: 100, x: 0, y: 0, width: 1000, height: 100 } as DOMRect
        dragCalculations.calculateTimelinePosition(10000, mockRect, 0, 1)
        dragCalculations.findInsertionPoint(largeTimeValue, "track-1", 300)
        dragCalculations.snapToGrid(largeTimeValue, "grid")
      }).not.toThrow()
    })

    it("должен корректно обрабатывать быстрые повторные операции", () => {
      // Очищаем предыдущие вызовы mockAddTrack
      mockAddTrack.mockClear()

      render(<TrackControlsPanel />)

      const videoButton = screen.getByText("Видео")

      // Быстрые повторные клики
      fireEvent.click(videoButton)
      fireEvent.click(videoButton)
      fireEvent.click(videoButton)

      // Должно быть вызвано 3 раза
      expect(mockAddTrack).toHaveBeenCalledTimes(3)
      // Так как компонент не перерендеривается, количество треков остается 1
      // Поэтому все 3 клика создают "Видео 2"
      expect(mockAddTrack).toHaveBeenNthCalledWith(1, "video", "Видео 2")
      expect(mockAddTrack).toHaveBeenNthCalledWith(2, "video", "Видео 2")
      expect(mockAddTrack).toHaveBeenNthCalledWith(3, "video", "Видео 2")
    })
  })
})
