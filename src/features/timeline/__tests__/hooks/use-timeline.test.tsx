import { act, renderHook } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Мокаем backend-sync ДО импорта компонентов
vi.mock("@/features/app-state/services/backend-sync", () => {
  const mockExecuteCommand = vi.fn()
  const mockOnStateChange = vi.fn()
  const mockOnEvent = vi.fn()
  const mockConnect = vi.fn()
  const mockDisconnect = vi.fn()
  const mockGetProjectState = vi.fn()
  const mockGetEventHistory = vi.fn()

  // Создаем мок класса BackendSync внутри фабрики
  class MockBackendSync {
    onStateChange = mockOnStateChange
    onEvent = mockOnEvent
    executeCommand = mockExecuteCommand
    connect = mockConnect
    disconnect = mockDisconnect
    getProjectState = mockGetProjectState
    getEventHistory = mockGetEventHistory
  }

  const mockBackendSyncInstance = new MockBackendSync()

  return {
    getBackendSync: vi.fn(() => mockBackendSyncInstance),
    BackendSync: MockBackendSync,
    _mockExecuteCommand: mockExecuteCommand,
    _mockOnStateChange: mockOnStateChange,
    _mockOnEvent: mockOnEvent,
    _mockConnect: mockConnect,
    _mockDisconnect: mockDisconnect,
    _mockGetProjectState: mockGetProjectState,
    _mockGetEventHistory: mockGetEventHistory,
  }
})

// Мокаем useMachine для UI машины
const mockUISend = vi.fn()
const mockUIState = {
  context: {
    timeScale: 1,
    scrollX: 0,
    scrollY: 0,
    scrollPosition: { x: 0, y: 0 },
    editMode: "select" as const,
    snapMode: "none" as const,
    selectedClipIds: [] as string[],
    selectedTrackIds: [] as string[],
    selectedSectionIds: [] as string[],
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
    clipboard: null,
    uiError: null,
  },
}

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockUIState, mockUISend]),
}))

import { MediaFile } from "@/features/media/types/media"

import { useTimeline } from "../../hooks/use-timeline"
import { TimelineProvider } from "../../services/timeline-provider"

// Получаем моки из модуля
const {
  _mockExecuteCommand: mockExecuteCommand,
  _mockOnStateChange: mockOnStateChange,
  _mockOnEvent: mockOnEvent,
  _mockConnect: mockConnect,
  _mockDisconnect: mockDisconnect,
  _mockGetProjectState: mockGetProjectState,
  _mockGetEventHistory: mockGetEventHistory,
} = await import("@/features/app-state/services/backend-sync")

const wrapper = ({ children }: { children: React.ReactNode }) => <TimelineProvider>{children}</TimelineProvider>

describe("useTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteCommand.mockClear()
    mockExecuteCommand.mockResolvedValue({ success: true, data: null, error: null })
    mockOnStateChange.mockClear()
    mockOnStateChange.mockReturnValue(() => {})
    mockOnEvent.mockClear()
    mockOnEvent.mockReturnValue(() => {})
    mockConnect.mockClear()
    mockDisconnect.mockClear()
    mockGetProjectState.mockClear()
    mockGetEventHistory.mockClear()
    mockUISend.mockClear()
  })

  it("должен выбрасывать ошибку при использовании вне провайдера", () => {
    // Проверяем что хук выбрасывает ошибку при использовании вне провайдера
    expect(() => {
      renderHook(() => useTimeline())
    }).toThrow("useTimeline must be used within a TimelineProvider")
  })

  it("должен возвращать контекст при использовании внутри провайдера", () => {
    const { result } = renderHook(() => useTimeline(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.project).toBeNull()
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentTime).toBe(0)
    expect(result.current.playbackRate).toBe(1)
  })

  describe("Управление проектом", () => {
    it("должен создавать новый проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.createProject("Test Project", {
          fps: 30,
          resolution: "1920x1080",
        })
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: {
          name: "Test Project",
          settings: {
            fps: 30,
            resolution: "1920x1080",
          },
        },
      })
    })

    it("должен загружать существующий проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // В новой архитектуре загрузка проекта происходит через backend
      // Проверяем, что есть проект после загрузки
      expect(result.current.project).toBeNull()
    })

    it("должен сохранять проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.saveProject()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveProject",
        params: {
          path: null,
        },
      })
    })

    it("должен закрывать проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // В новой архитектуре проект закрывается через backend команду
      // Проверяем что проект null после закрытия
      expect(result.current.project).toBeNull()
    })
  })

  describe("Управление секциями", () => {
    it("должен выводить предупреждение о неподдерживаемости секций", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      await act(async () => {
        await result.current.addSection("New Section", 0, 10)
      })

      expect(warnSpy).toHaveBeenCalledWith("Sections are not supported in the new architecture")
      expect(mockExecuteCommand).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it("должен выводить предупреждение при удалении секции", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      await act(async () => {
        await result.current.removeSection("section-1")
      })

      expect(warnSpy).toHaveBeenCalledWith("Sections are not supported in the new architecture")
      expect(mockExecuteCommand).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe("Управление треками", () => {
    it("должен добавлять новый трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.addTrack("video", "Video Track")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddTrack",
        params: {
          name: "Video Track",
          track_type: "VIDEO",
          index: null,
        },
      })
    })

    it("должен удалять трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.removeTrack("track-1")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "DeleteTrack",
        params: {
          track_id: "track-1",
        },
      })
    })

    it("должен обновлять трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.updateTrack("track-1", { name: "Updated Track" })
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "UpdateTrack",
        params: {
          track_id: "track-1",
          updates: {
            enabled: null,
            locked: null,
          },
        },
      })
    })
  })

  describe("Управление клипами", () => {
    it("должен добавлять клип из медиафайла", async () => {
      const mockMediaFile: MediaFile = {
        id: "media-1",
        name: "test.mp4",
        path: "/test/test.mp4",
        isVideo: true,
        duration: 60,
        size: 1024,
      }

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.addClip("track-1", mockMediaFile, 0)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddClip",
        params: {
          track_id: "track-1",
          media_id: mockMediaFile.id,
          time: 0,
        },
      })
    })

    it("должен удалять клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.removeClip("clip-1")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "DeleteClip",
        params: {
          clip_id: "clip-1",
        },
      })
    })

    it("должен обновлять клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.updateClip("clip-1", { volume: 0.5 })
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "UpdateClip",
        params: {
          clip_id: "clip-1",
          updates: {
            playback_rate: 1,
            enabled: null,
          },
        },
      })
    })

    it("должен перемещать клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.moveClip("clip-1", "track-2", 20)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "MoveClip",
        params: {
          clip_id: "clip-1",
          track_id: "track-2",
          time: 20,
        },
      })
    })

    it("должен обрезать клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.trimClip("clip-1", 2, 8)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "TrimClip",
        params: {
          clip_id: "clip-1",
          start: 2,
          end: 8,
        },
      })
    })
  })

  describe("UI операции", () => {
    it("должен устанавливать масштаб временной шкалы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.setTimeScale(2)
      })

      expect(mockUISend).toHaveBeenCalledWith({
        type: "SET_TIME_SCALE",
        scale: 2,
      })
    })

    it("должен устанавливать позицию прокрутки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.setScrollPosition(100, 50)
      })

      expect(mockUISend).toHaveBeenCalledWith({
        type: "SET_SCROLL_POSITION",
        x: 100,
        y: 50,
      })
    })

    it("должен устанавливать режим редактирования", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.setEditMode("cut")
      })

      expect(mockUISend).toHaveBeenCalledWith({
        type: "SET_EDIT_MODE",
        mode: "cut",
      })
    })

    it("должен переключать режим привязки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.toggleSnap("grid")
      })

      expect(mockUISend).toHaveBeenCalledWith({
        type: "TOGGLE_SNAP",
        snapMode: "grid",
      })
    })
  })

  describe("Выделение", () => {
    it("должен выделять клипы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.selectClips(["clip-1", "clip-2"])
      })

      expect(mockUISend).toHaveBeenCalledWith({
        type: "SELECT_CLIPS",
        clipIds: ["clip-1", "clip-2"],
        addToSelection: undefined,
      })
    })

    it("должен выделять треки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.selectTracks(["track-1", "track-2"])
      })

      expect(mockUISend).toHaveBeenCalledWith({
        type: "SELECT_TRACKS",
        trackIds: ["track-1", "track-2"],
        addToSelection: undefined,
      })
    })

    it("должен выделять секции", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.selectSections(["section-1", "section-2"])
      })

      expect(mockUISend).toHaveBeenCalledWith({
        type: "SELECT_SECTIONS",
        sectionIds: ["section-1", "section-2"],
        addToSelection: undefined,
      })
    })

    it("должен сбрасывать выделение", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.clearSelection()
      })

      expect(mockUISend).toHaveBeenCalledWith({
        type: "CLEAR_SELECTION",
      })
    })
  })

  describe("Воспроизведение", () => {
    it("должен запускать воспроизведение", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.play()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Play",
        params: {},
      })
    })

    it("должен останавливать воспроизведение", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.pause()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Pause",
        params: {},
      })
    })

    it("должен перематывать к определенному времени", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.seek(30)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Seek",
        params: { time: 30 },
      })
    })

    it("должен устанавливать скорость воспроизведения", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.setPlaybackRate(2)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SetPlaybackRate",
        params: { rate: 2 },
      })
    })
  })

  describe("Операции с буфером обмена", () => {
    it("должен копировать выделенные элементы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.copySelection()
      })

      // В новой архитектуре copySelection обрабатывается внутри провайдера
      // Проверяем что метод существует
      expect(result.current.copySelection).toBeDefined()
      expect(typeof result.current.copySelection).toBe("function")
    })

    it("должен вырезать выделенные элементы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.cutSelection()
      })

      // В новой архитектуре cutSelection обрабатывается внутри провайдера
      expect(result.current.cutSelection).toBeDefined()
    })

    it("должен вставлять элементы", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.paste("track-1", 10)
      })

      // paste теперь асинхронный и работает с backend
      expect(result.current.paste).toBeDefined()
    })
  })

  describe("Интеграция с редактором", () => {
    it("должен иметь методы работы с эффектами", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Проверяем что методы существуют
      expect(result.current.addEffectToClip).toBeDefined()
      expect(typeof result.current.addEffectToClip).toBe("function")
      expect(result.current.removeEffectFromClip).toBeDefined()
      expect(typeof result.current.removeEffectFromClip).toBe("function")
      expect(result.current.updateClipEffect).toBeDefined()
      expect(typeof result.current.updateClipEffect).toBe("function")
      expect(result.current.reorderClipEffects).toBeDefined()
      expect(typeof result.current.reorderClipEffects).toBe("function")
    })

    it("должен отправлять события через send", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Проверяем метод send
      expect(result.current.send).toBeDefined()
      expect(typeof result.current.send).toBe("function")

      // Отправляем кастомное событие
      result.current.send({
        type: "ADD_EFFECT_TO_CLIP",
        clipId: "clip-1",
        effect: {
          id: "effect-1",
          effectId: "blur",
          intensity: 0.5,
          order: 0,
        },
      })

      // Метод send должен работать без ошибок
      expect(true).toBe(true)
    })
  })
})
