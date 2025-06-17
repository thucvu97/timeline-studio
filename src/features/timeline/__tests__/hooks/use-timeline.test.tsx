import React from "react"

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { useTimeline } from "../../hooks/use-timeline"
import { TimelineContextType, TimelineProvider } from "../../services/timeline-provider"
import { TrackType } from "../../types"

// Мокаем timeline machine
vi.mock("../../services/timeline-machine", () => ({
  timelineMachine: {
    id: "timeline",
    initial: "idle",
    context: {
      project: null,
      uiState: {
        timeScale: 1,
        scrollX: 0,
        scrollY: 0,
        editMode: "select",
        snapMode: "none",
        selectedClips: [],
        selectedTracks: [],
        selectedSections: [],
      },
      isPlaying: false,
      isRecording: false,
      currentTime: 0,
      error: null,
      lastAction: null,
    },
    states: {
      idle: {},
      ready: {},
      saving: {},
    },
  },
}))

// Мокаем useMachine
const mockSend = vi.fn()
const mockState = {
  matches: vi.fn().mockReturnValue(true),
  context: {
    project: null,
    uiState: {
      timeScale: 1,
      scrollX: 0,
      scrollY: 0,
      editMode: "select" as const,
      snapMode: "none" as const,
      selectedClips: [] as string[],
      selectedTracks: [] as string[],
      selectedSections: [] as string[],
    },
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    error: null,
    lastAction: null,
  },
}

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TimelineProvider>{children}</TimelineProvider>
)

describe("useTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(result.current.project).toBe(null)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentTime).toBe(0)
  })

  describe("Управление проектом", () => {
    it("должен создавать новый проект", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.createProject("Test Project", { fps: 30 })
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "CREATE_PROJECT",
        name: "Test Project",
        settings: { fps: 30 },
      })
    })

    it("должен загружать существующий проект", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const mockProject = {
        id: "test-id",
        name: "Test Project",
        sections: [],
        tracks: [],
        clips: [],
        settings: { fps: 30 },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      act(() => {
        result.current.loadProject(mockProject)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "LOAD_PROJECT",
        project: mockProject,
      })
    })

    it("должен сохранять проект", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.saveProject()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "SAVE_PROJECT" })
    })

    it("должен закрывать проект", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.closeProject()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "CLOSE_PROJECT" })
    })
  })

  describe("Управление секциями", () => {
    it("должен добавлять новую секцию", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const realStartTime = new Date()
      
      act(() => {
        result.current.addSection("Intro", 0, 5000, realStartTime)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "ADD_SECTION",
        name: "Intro",
        startTime: 0,
        duration: 5000,
        realStartTime,
      })
    })

    it("должен удалять секцию", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.removeSection("section-1")
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "REMOVE_SECTION",
        sectionId: "section-1",
      })
    })

    it("должен обновлять секцию", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.updateSection("section-1", { name: "Updated Section" })
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_SECTION",
        sectionId: "section-1",
        updates: { name: "Updated Section" },
      })
    })
  })

  describe("Управление треками", () => {
    it("должен добавлять новый трек", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.addTrack("video" as TrackType, "section-1", "Video Track 1")
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "ADD_TRACK",
        trackType: "video",
        sectionId: "section-1",
        name: "Video Track 1",
      })
    })

    it("должен удалять трек", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.removeTrack("track-1")
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "REMOVE_TRACK",
        trackId: "track-1",
      })
    })

    it("должен обновлять трек", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.updateTrack("track-1", { isMuted: true, volume: 0.5 })
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_TRACK",
        trackId: "track-1",
        updates: { isMuted: true, volume: 0.5 },
      })
    })

    it("должен переупорядочивать треки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const trackIds = ["track-3", "track-1", "track-2"]
      
      act(() => {
        result.current.reorderTracks(trackIds)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "REORDER_TRACKS",
        trackIds,
      })
    })
  })

  describe("Управление клипами", () => {
    it("должен добавлять новый клип", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const mockMediaFile: MediaFile = {
        id: "media-1",
        name: "video.mp4",
        path: "/path/to/video.mp4",
        type: "video",
        duration: 10000,
        size: 1024000,
        metadata: {},
        lastModified: Date.now(),
      }
      
      act(() => {
        result.current.addClip("track-1", mockMediaFile, 1000, 5000)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "ADD_CLIP",
        trackId: "track-1",
        mediaFile: mockMediaFile,
        startTime: 1000,
        duration: 5000,
      })
    })

    it("должен удалять клип", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.removeClip("clip-1")
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "REMOVE_CLIP",
        clipId: "clip-1",
      })
    })

    it("должен обновлять клип", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.updateClip("clip-1", { 
          startTime: 2000, 
          duration: 3000,
          volume: 0.8,
        })
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_CLIP",
        clipId: "clip-1",
        updates: { 
          startTime: 2000, 
          duration: 3000,
          volume: 0.8,
        },
      })
    })

    it("должен перемещать клип", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.moveClip("clip-1", "track-2", 5000)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "MOVE_CLIP",
        clipId: "clip-1",
        newTrackId: "track-2",
        newStartTime: 5000,
      })
    })

    it("должен разделять клип", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.splitClip("clip-1", 2500)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SPLIT_CLIP",
        clipId: "clip-1",
        splitTime: 2500,
      })
    })

    it("должен обрезать клип", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.trimClip("clip-1", 1000, 4000)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "TRIM_CLIP",
        clipId: "clip-1",
        newStartTime: 1000,
        newDuration: 4000,
      })
    })
  })

  describe("Управление выделением", () => {
    it("должен выделять клипы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.selectClips(["clip-1", "clip-2"], true)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SELECT_CLIPS",
        clipIds: ["clip-1", "clip-2"],
        addToSelection: true,
      })
    })

    it("должен выделять треки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.selectTracks(["track-1"], false)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SELECT_TRACKS",
        trackIds: ["track-1"],
        addToSelection: false,
      })
    })

    it("должен выделять секции", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.selectSections(["section-1", "section-2"])
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SELECT_SECTIONS",
        sectionIds: ["section-1", "section-2"],
        addToSelection: false,
      })
    })

    it("должен очищать выделение", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.clearSelection()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "CLEAR_SELECTION" })
    })
  })

  describe("Управление воспроизведением", () => {
    it("должен начинать воспроизведение", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.play()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "PLAY" })
    })

    it("должен ставить на паузу", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.pause()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "PAUSE" })
    })

    it("должен останавливать воспроизведение", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.stop()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "STOP" })
    })

    it("должен перематывать на указанное время", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.seek(5000)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SEEK",
        time: 5000,
      })
    })

    it("должен устанавливать скорость воспроизведения", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.setPlaybackRate(1.5)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SET_PLAYBACK_RATE",
        rate: 1.5,
      })
    })
  })

  describe("Управление UI", () => {
    it("должен устанавливать масштаб времени", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.setTimeScale(2)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SET_TIME_SCALE",
        scale: 2,
      })
    })

    it("должен устанавливать позицию прокрутки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.setScrollPosition(100, 50)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SET_SCROLL_POSITION",
        x: 100,
        y: 50,
      })
    })

    it("должен устанавливать режим редактирования", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.setEditMode("trim")
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "SET_EDIT_MODE",
        mode: "trim",
      })
    })

    it("должен переключать режим привязки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.toggleSnap("grid")
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "TOGGLE_SNAP",
        snapMode: "grid",
      })
    })
  })

  describe("История изменений", () => {
    it("должен отменять последнее действие", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.undo()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "UNDO" })
    })

    it("должен повторять отменённое действие", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.redo()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "REDO" })
    })

    it("должен очищать историю", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.clearHistory()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "CLEAR_HISTORY" })
    })
  })

  describe("Буфер обмена", () => {
    it("должен копировать выделение", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.copySelection()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "COPY_SELECTION" })
    })

    it("должен вырезать выделение", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.cutSelection()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "CUT_SELECTION" })
    })

    it("должен вставлять из буфера обмена", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.paste("track-2", 3000)
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "PASTE",
        targetTrackId: "track-2",
        targetTime: 3000,
      })
    })

    it("должен вставлять без указания места", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.paste()
      })
      
      expect(mockSend).toHaveBeenCalledWith({
        type: "PASTE",
        targetTrackId: undefined,
        targetTime: undefined,
      })
    })
  })

  describe("Утилиты", () => {
    it("должен очищать ошибку", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      act(() => {
        result.current.clearError()
      })
      
      expect(mockSend).toHaveBeenCalledWith({ type: "CLEAR_ERROR" })
    })
  })

  describe("Статус машины состояний", () => {
    it("должен корректно определять состояние ready", () => {
      mockState.matches.mockReturnValue(true)
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      expect(result.current.isReady).toBe(true)
    })

    it("должен корректно определять состояние saving", () => {
      mockState.matches.mockImplementation((state: string) => state === "saving")
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      expect(result.current.isSaving).toBe(true)
    })
  })

  describe("Контекст данных", () => {
    it("должен предоставлять все данные контекста", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      
      expect(result.current).toMatchObject({
        project: null,
        uiState: {
          timeScale: 1,
          scrollX: 0,
          scrollY: 0,
          editMode: "select",
          snapMode: "none",
          selectedClips: [],
          selectedTracks: [],
          selectedSections: [],
        },
        isPlaying: false,
        isRecording: false,
        currentTime: 0,
        error: null,
        lastAction: null,
      })
    })

    it("должен обновлять данные при изменении состояния", () => {
      const { result, rerender } = renderHook(() => useTimeline(), { wrapper })
      
      // Обновляем состояние мока
      mockState.context.isPlaying = true
      mockState.context.currentTime = 5000
      
      rerender()
      
      expect(result.current.isPlaying).toBe(true)
      expect(result.current.currentTime).toBe(5000)
    })
  })
})