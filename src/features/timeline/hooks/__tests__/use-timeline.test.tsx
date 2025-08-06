import { renderHook } from "@testing-library/react"
import { type ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { TimelineProvider } from "../../services/timeline-provider"
import { useTimeline } from "../use-timeline"

// Мок для timeline-ui-machine
vi.mock("../../services/timeline-ui-machine", () => ({
  timelineUIMachine: {
    provide: vi.fn(() => ({})),
    transition: vi.fn(),
  },
}))

// Мок для useMachine
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [
    {
      context: {
        selectedClipIds: [],
        selectedTrackIds: [],
        selectedSectionIds: [],
        timeScale: 1,
        scrollPosition: { x: 0, y: 0 },
        editMode: "select",
        snapMode: "none",
        isPlaying: false,
        currentTime: 0,
        playbackRate: 1,
        clipboard: null,
        uiError: null,
      },
    },
    vi.fn(),
  ]),
}))

// Мок для backend sync
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    onStateChange: vi.fn(() => vi.fn()),
    onEvent: vi.fn(() => vi.fn()),
    executeCommand: vi.fn(() => Promise.resolve({ success: true, data: null })),
  })),
}))

const wrapper = ({ children }: { children: ReactNode }) => <TimelineProvider>{children}</TimelineProvider>

describe("useTimeline", () => {
  it("должен возвращать контекст timeline", () => {
    const { result } = renderHook(() => useTimeline(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.project).toBe(null)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentTime).toBe(0)
    expect(result.current.playbackRate).toBe(1)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.hasClipboard).toBe(false)
    expect(result.current.clips).toEqual([])
  })

  it("должен выбрасывать ошибку вне провайдера", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTimeline())
    }).toThrow("useTimeline must be used within a TimelineProvider")

    consoleSpy.mockRestore()
  })

  it("должен содержать все необходимые методы", () => {
    const { result } = renderHook(() => useTimeline(), { wrapper })

    // Проверяем наличие всех команд проекта
    expect(typeof result.current.createProject).toBe("function")
    expect(typeof result.current.saveProject).toBe("function")

    // Проверяем наличие команд треков
    expect(typeof result.current.addTrack).toBe("function")
    expect(typeof result.current.removeTrack).toBe("function")
    expect(typeof result.current.updateTrack).toBe("function")

    // Проверяем наличие команд клипов
    expect(typeof result.current.addClip).toBe("function")
    expect(typeof result.current.removeClip).toBe("function")
    expect(typeof result.current.moveClip).toBe("function")
    expect(typeof result.current.trimClip).toBe("function")
    expect(typeof result.current.splitClip).toBe("function")
    expect(typeof result.current.updateClip).toBe("function")

    // Проверяем наличие команд воспроизведения
    expect(typeof result.current.play).toBe("function")
    expect(typeof result.current.pause).toBe("function")
    expect(typeof result.current.stop).toBe("function")
    expect(typeof result.current.seek).toBe("function")
    expect(typeof result.current.setPlaybackRate).toBe("function")

    // Проверяем наличие UI команд
    expect(typeof result.current.setTimeScale).toBe("function")
    expect(typeof result.current.setScrollPosition).toBe("function")
    expect(typeof result.current.setEditMode).toBe("function")
    expect(typeof result.current.toggleSnap).toBe("function")

    // Проверяем наличие команд выделения
    expect(typeof result.current.selectClips).toBe("function")
    expect(typeof result.current.selectTracks).toBe("function")
    expect(typeof result.current.selectSections).toBe("function")
    expect(typeof result.current.clearSelection).toBe("function")

    // Проверяем наличие команд буфера обмена
    expect(typeof result.current.copySelection).toBe("function")
    expect(typeof result.current.cutSelection).toBe("function")
    expect(typeof result.current.paste).toBe("function")

    // Проверяем наличие команд перетаскивания
    expect(typeof result.current.startDragClip).toBe("function")
    expect(typeof result.current.startDragTrack).toBe("function")
    expect(typeof result.current.stopDrag).toBe("function")

    // Проверяем наличие утилит
    expect(typeof result.current.clearError).toBe("function")
    expect(typeof result.current.send).toBe("function")
  })

  it("должен содержать правильные начальные значения состояния UI", () => {
    const { result } = renderHook(() => useTimeline(), { wrapper })

    expect(result.current.timeScale).toBe(1)
    expect(result.current.scrollPosition).toEqual({ x: 0, y: 0 })
    expect(result.current.editMode).toBe("select")
    expect(result.current.snapMode).toBe("none")
    expect(result.current.selectedClipIds).toEqual([])
    expect(result.current.selectedTrackIds).toEqual([])
    expect(result.current.selectedSectionIds).toEqual([])
  })

  it("должен экспортировать правильный тип контекста", () => {
    const { result } = renderHook(() => useTimeline(), { wrapper })

    // Проверяем что контекст содержит uiState
    expect(result.current.uiState).toBeDefined()
    expect(result.current.uiState.selectedClipIds).toEqual([])
    expect(result.current.uiState.isPlaying).toBe(false)
    expect(result.current.uiState.currentTime).toBe(0)
  })
})
