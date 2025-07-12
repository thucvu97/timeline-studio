import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useClipEditing } from "../../hooks/use-clip-editing"
// Import actual dependencies to mock them
import { useEditModeContext } from "../../hooks/use-edit-mode"
import { useTimeline } from "../../hooks/use-timeline"
import { EDIT_MODES } from "../../types/edit-modes"
import * as editOperations from "../../utils/edit-operations"
import * as snapEngine from "../../utils/snap-engine"

// Mock dependencies
vi.mock("../../hooks/use-timeline")
vi.mock("../../hooks/use-edit-mode")

vi.mock("../../utils/edit-operations", () => ({
  getClipTrimBounds: vi.fn(),
  getSlideBounds: vi.fn(),
  getSlipBounds: vi.fn(),
}))

vi.mock("../../utils/snap-engine", () => ({
  DEFAULT_SNAP_CONFIG: {
    enabled: true,
    threshold: 10,
    targets: ["clips", "playhead", "markers"],
  },
  findSnapPoints: vi.fn(),
  snapTime: vi.fn(),
}))

// Test data
const mockClip = {
  id: "clip-1",
  trackId: "track-1",
  sourceId: "source-1",
  startTime: 10,
  duration: 20,
  offset: 0,
  trimStart: 0,
  trimEnd: 0,
  effects: [],
  speed: 1,
  volume: 1,
  opacity: 1,
  filters: [],
  transitions: { in: null, out: null },
  metadata: {},
}

const mockTrack = {
  id: "track-1",
  type: "video" as const,
  clips: [mockClip],
  enabled: true,
  locked: false,
  muted: false,
  height: 100,
  minimized: false,
  effects: [],
  volume: 1,
  pan: 0,
  metadata: {},
}

const mockProject = {
  id: "project-1",
  name: "Test Project",
  duration: 300,
  sections: [
    {
      id: "section-1",
      name: "Section 1",
      startTime: 0,
      duration: 300,
      tracks: [mockTrack],
    },
  ],
  globalTracks: [],
  settings: {} as any,
  timeline: {} as any,
  metadata: {},
  version: "1.0.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockUiState = {
  timeScale: 10,
  scrollX: 0,
  scrollY: 0,
  selectedClips: ["clip-1"],
  selectedTracks: [],
  hoveredClipId: null,
  hoveredTrackId: null,
  viewportWidth: 1920,
  viewportHeight: 1080,
}

const mockSend = vi.fn()

const mockTimelineContext = {
  project: mockProject,
  uiState: mockUiState,
  currentTime: 15,
  send: mockSend,
  state: {} as any,
  duration: 300,
  isPlaying: false,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  selectedClipIds: ["clip-1"],
  selectedTrackIds: [],
  activeTrackId: "track-1",
  markers: [],
  regions: [],
}

const mockEditModeContext = {
  editMode: EDIT_MODES.TRIM,
  setEditMode: vi.fn(),
  isEditMode: vi.fn(),
  cursor: "default",
}

describe("useClipEditing", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useTimeline).mockReturnValue(mockTimelineContext)
    vi.mocked(useEditModeContext).mockReturnValue(mockEditModeContext)

    // Default mock implementations
    vi.mocked(editOperations.getClipTrimBounds).mockReturnValue({ min: 0, max: 30 })
    vi.mocked(editOperations.getSlideBounds).mockReturnValue({ min: -10, max: 50 })
    vi.mocked(editOperations.getSlipBounds).mockReturnValue({ min: -5, max: 15 })
    vi.mocked(snapEngine.findSnapPoints).mockReturnValue([])
    vi.mocked(snapEngine.snapTime).mockImplementation((time) => ({ time, snapped: false }))
  })

  describe("Initialization", () => {
    it("должен правильно инициализироваться с существующим клипом", () => {
      const { result } = renderHook(() => useClipEditing("clip-1"))

      expect(result.current.clip).toEqual(mockClip)
      expect(result.current.track).toEqual(mockTrack)
      expect(result.current.isEditing).toBe(false)
      expect(result.current.preview).toBe(null)
    })

    it("должен возвращать null для несуществующего клипа", () => {
      const { result } = renderHook(() => useClipEditing("non-existent"))

      expect(result.current.clip).toBe(null)
      expect(result.current.track).toBe(null)
    })

    it("должен находить клип в глобальных треках", () => {
      const globalTrack = { ...mockTrack, id: "global-track-1" }
      vi.mocked(useTimeline).mockReturnValue({
        ...mockTimelineContext,
        project: {
          ...mockProject,
          sections: [{ ...mockProject.sections[0], tracks: [] }],
          globalTracks: [globalTrack],
        },
      })

      const { result } = renderHook(() => useClipEditing("clip-1"))

      expect(result.current.clip).toEqual(mockClip)
      expect(result.current.track).toEqual(globalTrack)
    })

    it("должен работать без проекта", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockTimelineContext,
        project: null,
      })

      const { result } = renderHook(() => useClipEditing("clip-1"))

      expect(result.current.clip).toBe(null)
      expect(result.current.track).toBe(null)
    })
  })

  describe("Trim операции", () => {
    it("должен начинать trim операцию", () => {
      const onEditStart = vi.fn()
      const { result } = renderHook(() => useClipEditing("clip-1", { onEditStart }))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      expect(result.current.isEditing).toBe(true)
      expect(onEditStart).toHaveBeenCalled()
    })

    it("не должен начинать trim без клипа", () => {
      const onEditStart = vi.fn()
      const { result } = renderHook(() => useClipEditing("non-existent", { onEditStart }))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      expect(result.current.isEditing).toBe(false)
      expect(onEditStart).not.toHaveBeenCalled()
    })

    it("должен обрабатывать trim движение в TRIM режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      act(() => {
        result.current.handleTrimMove(50) // 50px = 5 seconds at timeScale 10
      })

      expect(result.current.preview).toEqual({
        startTime: 15, // 10 + 5
        duration: 15, // 20 - 5
        offset: 5, // 0 + 5
      })
      expect(editOperations.getClipTrimBounds).toHaveBeenCalledWith(mockClip, "start", mockTrack)
    })

    it("должен ограничивать trim в пределах bounds", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM
      vi.mocked(editOperations.getClipTrimBounds).mockReturnValue({ min: 5, max: 25 })

      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      // Попытка trim за пределы max
      act(() => {
        result.current.handleTrimMove(200) // 20 seconds
      })

      expect(result.current.preview).toEqual({
        startTime: 25, // Ограничено max
        duration: 5, // 20 - (25 - 10)
        offset: 15, // 0 + (25 - 10)
      })
    })

    it("должен обрабатывать trim движение в RIPPLE режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.RIPPLE
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      act(() => {
        result.current.handleTrimMove(30) // 3 seconds
      })

      expect(result.current.preview).toEqual({
        startTime: 13, // 10 + 3
        duration: 17, // 20 - 3
        offset: 3, // 0 + 3
      })
    })

    it("должен обрабатывать SLIP режим", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP
      vi.mocked(editOperations.getSlipBounds).mockReturnValue({ min: -5, max: 10 })

      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      act(() => {
        result.current.handleTrimMove(50) // 5 seconds
      })

      expect(result.current.preview).toEqual({
        startTime: 10, // Не меняется
        duration: 20, // Не меняется
        offset: 5, // 0 + 5
      })
      expect(editOperations.getSlipBounds).toHaveBeenCalledWith(mockClip)
    })

    it("должен обрабатывать SLIDE режим", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIDE
      vi.mocked(editOperations.getSlideBounds).mockReturnValue({ min: -5, max: 20 })

      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      act(() => {
        result.current.handleTrimMove(100) // 10 seconds
      })

      expect(result.current.preview).toEqual({
        startTime: 20, // 10 + 10
        duration: 20, // Не меняется
        offset: 0, // Не меняется в slide
      })
      expect(editOperations.getSlideBounds).toHaveBeenCalledWith(mockClip, mockTrack)
    })

    it("не должен обрабатывать движение без активного редактирования", () => {
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimMove(50)
      })

      expect(result.current.preview).toBe(null)
    })

    it("не должен обрабатывать движение без клипа", () => {
      const { result } = renderHook(() => useClipEditing("non-existent"))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(50)
      })

      expect(result.current.preview).toBe(null)
    })
  })

  describe("Snapping", () => {
    it("должен применять snapping при движении", () => {
      vi.mocked(snapEngine.findSnapPoints).mockReturnValue([{ time: 15, type: "clip", strength: 1 }])
      vi.mocked(snapEngine.snapTime).mockReturnValue({ time: 15, snapped: true })

      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      act(() => {
        result.current.handleTrimMove(47) // Близко к 15 (14.7)
      })

      expect(result.current.preview?.startTime).toBe(15)
      expect(snapEngine.findSnapPoints).toHaveBeenCalledWith(
        mockProject,
        0,
        3000, // duration * timeScale
        10, // timeScale
        15, // currentTime
        snapEngine.DEFAULT_SNAP_CONFIG,
        "clip-1",
      )
    })

    it("должен использовать кастомный snap config", () => {
      const customSnapConfig = {
        enabled: false,
        threshold: 5,
        targets: ["clips"],
      }

      const { result } = renderHook(() => useClipEditing("clip-1", { snapConfig: customSnapConfig }))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(50)
      })

      expect(snapEngine.findSnapPoints).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        customSnapConfig,
        expect.any(String),
      )
    })
  })

  describe("Завершение операций", () => {
    it("должен коммитить TRIM изменения", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM
      const onEditEnd = vi.fn()
      const { result } = renderHook(() => useClipEditing("clip-1", { onEditEnd }))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(50)
      })

      act(() => {
        result.current.handleTrimEnd(true)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "TRIM_CLIP",
        clipId: "clip-1",
        newStartTime: 15,
        newDuration: 15,
      })
      expect(result.current.isEditing).toBe(false)
      expect(result.current.preview).toBe(null)
      expect(onEditEnd).toHaveBeenCalledWith(true)
    })

    it("должен отменять изменения при committed = false", () => {
      const onEditEnd = vi.fn()
      const { result } = renderHook(() => useClipEditing("clip-1", { onEditEnd }))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(50)
      })

      act(() => {
        result.current.handleTrimEnd(false)
      })

      expect(mockSend).not.toHaveBeenCalled()
      expect(result.current.isEditing).toBe(false)
      expect(result.current.preview).toBe(null)
      expect(onEditEnd).toHaveBeenCalledWith(false)
    })

    it("должен коммитить RIPPLE изменения", () => {
      mockEditModeContext.editMode = EDIT_MODES.RIPPLE
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(30)
      })

      act(() => {
        result.current.handleTrimEnd(true)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "RIPPLE_EDIT",
        clipId: "clip-1",
        edge: "start",
        delta: 3, // 13 - 10
      })
    })

    it("должен коммитить SLIP изменения", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(50)
      })

      act(() => {
        result.current.handleTrimEnd(true)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "SLIP_EDIT",
        clipId: "clip-1",
        delta: 5, // 5 - 0
      })
    })

    it("должен коммитить SLIDE изменения", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIDE
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(100)
      })

      act(() => {
        result.current.handleTrimEnd(true)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "SLIDE_EDIT",
        clipId: "clip-1",
        delta: 10, // 20 - 10
      })
    })

    it("не должен ничего делать без preview", () => {
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimEnd(true)
      })

      expect(mockSend).not.toHaveBeenCalled()
    })

    it("не должен ничего делать в неподдерживаемом режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SELECT
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      // Проверяем, что редактирование началось
      expect(result.current.isEditing).toBe(true)

      act(() => {
        result.current.handleTrimMove(50)
      })

      // В SELECT режиме не должно быть preview, так как default в switch не меняет значения
      // Но в текущей реализации он всё равно устанавливает preview с исходными значениями
      expect(result.current.preview).toEqual({
        startTime: 10,
        duration: 20,
        offset: 0,
      })

      act(() => {
        result.current.handleTrimEnd(true)
      })

      // Но send не должен вызываться, так как SELECT не обрабатывается
      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe("Split операции", () => {
    it("должен разделять клип в указанной позиции", () => {
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleSplit(20) // В середине клипа
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "SPLIT_CLIP",
        clipId: "clip-1",
        splitTime: 20,
      })
    })

    it("не должен разделять клип вне его границ", () => {
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleSplit(5) // До начала клипа
      })

      expect(mockSend).not.toHaveBeenCalled()

      act(() => {
        result.current.handleSplit(35) // После конца клипа
      })

      expect(mockSend).not.toHaveBeenCalled()
    })

    it("не должен разделять клип на границах", () => {
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleSplit(10) // Точно на начале
      })

      expect(mockSend).not.toHaveBeenCalled()

      act(() => {
        result.current.handleSplit(30) // Точно на конце
      })

      expect(mockSend).not.toHaveBeenCalled()
    })

    it("не должен разделять несуществующий клип", () => {
      const { result } = renderHook(() => useClipEditing("non-existent"))

      act(() => {
        result.current.handleSplit(20)
      })

      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe("Edge cases", () => {
    it("должен обрабатывать отрицательный timeDelta при trim", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      act(() => {
        result.current.handleTrimMove(-30) // -3 seconds
      })

      expect(result.current.preview).toEqual({
        startTime: 7, // 10 - 3
        duration: 23, // 20 + 3
        offset: -3, // 0 - 3
      })
    })

    it("должен работать с нулевым timeScale", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockTimelineContext,
        uiState: { ...mockUiState, timeScale: 0 },
      })

      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(50)
      })

      // При timeScale = 0, timeDelta будет Infinity, что приведёт к максимальным значениям bounds
      expect(result.current.preview).toEqual({
        startTime: 30, // max bound
        duration: 0, // уменьшилась на 20
        offset: 20, // увеличился на 20
      })
    })

    it("должен обрабатывать клип с offset", () => {
      const clipWithOffset = { ...mockClip, offset: 5 }
      const trackWithOffset = {
        ...mockTrack,
        clips: [clipWithOffset],
      }
      vi.mocked(useTimeline).mockReturnValue({
        ...mockTimelineContext,
        project: {
          ...mockProject,
          sections: [
            {
              ...mockProject.sections[0],
              tracks: [trackWithOffset],
            },
          ],
        },
      })

      mockEditModeContext.editMode = EDIT_MODES.TRIM
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
        result.current.handleTrimMove(20)
      })

      expect(result.current.preview).toEqual({
        startTime: 12,
        duration: 18,
        offset: 7, // 5 + 2
      })
    })

    it("должен корректно работать при множественных движениях", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM
      const { result } = renderHook(() => useClipEditing("clip-1"))

      act(() => {
        result.current.handleTrimStart("start", 100)
      })

      act(() => {
        result.current.handleTrimMove(20)
      })

      act(() => {
        result.current.handleTrimMove(50)
      })

      act(() => {
        result.current.handleTrimMove(-10)
      })

      // Финальный результат должен базироваться на последнем движении
      expect(result.current.preview).toEqual({
        startTime: 9, // 10 - 1
        duration: 21, // 20 + 1
        offset: -1, // 0 - 1
      })
    })
  })
})
