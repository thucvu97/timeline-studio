/**
 * Comprehensive tests for use-timeline-ai-analysis hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useTimelineAIAnalysis } from "../../hooks/use-timeline-ai-analysis"
import { MockTimelineProvider } from "../test-providers"

import type { TimelineClip } from "../../types/timeline"

// Mock timeline-machine
vi.mock("../../services/timeline-machine", () => ({
  timelineMachine: {},
}))

// Mock AI engines
const mockSceneEngine = {
  initialize: vi.fn().mockResolvedValue(undefined),
  process: vi.fn().mockResolvedValue({
    scenes: [
      {
        id: "scene-1",
        type: "dialogue",
        startTime: 0,
        duration: 15, // Больше 10 секунд - будет предложение о нарезке
        confidence: 0.9,
      },
      {
        id: "scene-2",
        type: "action",
        startTime: 15,
        duration: 3, // Меньше 5 секунд - будет предложение о скорости
        confidence: 0.85,
      },
    ],
    totalScenes: 2,
    averageSceneLength: 9,
    keyMoments: [
      {
        id: "moment-1",
        timestamp: 5,
        type: "emotional_peak",
        description: "Эмоциональный пик",
        score: 0.9,
      },
    ],
  }),
}

const mockOrchestrator = {
  initialize: vi.fn().mockResolvedValue(undefined),
  analyzeContent: vi.fn().mockResolvedValue({
    id: "analysis-1",
    mediaFile: {},
    insights: {
      summary: "Видео содержит диалог и экшн-сцены",
      duration: 18,
      dominantColors: ["#ff0000", "#00ff00"],
    },
    keyMoments: [
      {
        id: "moment-2",
        timestamp: 10,
        type: "climax",
        description: "Кульминация",
        score: 0.95,
      },
    ],
    qualityMetrics: {
      overall: 45,
      sharpness: 70,
      brightness: 50,
      contrast: 60,
    },
    contentType: "video",
    timestamp: new Date().toISOString(),
  }),
}

vi.mock("@/features/ai-content-intelligence/engines/scene-analysis/services/scene-analysis-engine", () => ({
  SceneAnalysisEngine: vi.fn(() => mockSceneEngine),
}))

vi.mock("@/features/ai-content-intelligence/shared/services/ai-intelligence-orchestrator", () => ({
  AIIntelligenceOrchestrator: vi.fn(() => mockOrchestrator),
}))

// Mock useTimeline
const mockSend = vi.fn()
const mockProject = {
  id: "project-1",
  name: "Test Project",
  sections: [
    {
      id: "section-1",
      name: "Section 1",
      tracks: [
        {
          id: "track-1",
          clips: [
            {
              id: "clip-1",
              name: "Test Clip",
              mediaFile: {
                path: "/test/video.mp4",
                name: "video.mp4",
                duration: 20,
                size: 1000000,
                format: "mp4",
              },
            } as TimelineClip,
          ],
        },
      ],
    },
  ],
  globalTracks: [],
}

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: vi.fn(() => ({
    project: mockProject,
    uiState: {},
    send: mockSend,
  })),
}))

describe("useTimelineAIAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("должен инициализироваться с начальным состоянием", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    expect(result.current.state).toEqual({
      isAnalyzing: false,
      analysisProgress: 0,
      currentAnalysis: null,
      sceneAnalysis: null,
      insights: null,
      keyMoments: [],
      error: null,
      lastAnalyzedClipId: null,
    })

    expect(result.current.suggestions).toEqual([])
    expect(result.current.enableAutoAnalysis).toBe(true)
  })

  it("должен инициализировать AI движки при монтировании", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook(() => useTimelineAIAnalysis(), { wrapper })

    await waitFor(() => {
      expect(mockSceneEngine.initialize).toHaveBeenCalled()
      expect(mockOrchestrator.initialize).toHaveBeenCalled()
    })
  })

  it("должен анализировать клип", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    expect(mockSceneEngine.process).toHaveBeenCalledWith({
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
      },
    })

    expect(mockOrchestrator.analyzeContent).toHaveBeenCalledWith({
      mediaFile: {
        path: "/test/video.mp4",
        filename: "video.mp4",
        size: 1000000,
        format: "mp4",
        duration: 20,
      },
    })

    expect(result.current.state.sceneAnalysis).toBeDefined()
    expect(result.current.state.currentAnalysis).toBeDefined()
    expect(result.current.state.isAnalyzing).toBe(false)
    expect(result.current.state.analysisProgress).toBe(100)
  })

  it("должен генерировать предложения после анализа", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    expect(result.current.suggestions.length).toBeGreaterThan(0)

    // Проверяем предложения по типам
    const markerSuggestions = result.current.suggestions.filter((s) => s.type === "marker")
    const speedSuggestions = result.current.suggestions.filter((s) => s.type === "speed")
    const colorSuggestions = result.current.suggestions.filter((s) => s.type === "color")

    // Проверяем что есть предложения
    expect(markerSuggestions.length).toBeGreaterThan(0)
    expect(speedSuggestions.length).toBeGreaterThan(0)
    expect(colorSuggestions.length).toBeGreaterThan(0)
  })

  it("должен анализировать весь timeline", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    await act(async () => {
      await result.current.analyzeTimeline()
    })

    expect(mockSceneEngine.process).toHaveBeenCalled()
    expect(mockOrchestrator.analyzeContent).toHaveBeenCalled()
    expect(result.current.state.isAnalyzing).toBe(false)
  })

  it("должен очищать анализ", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    // Сначала анализируем
    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    expect(result.current.state.currentAnalysis).toBeDefined()
    expect(result.current.suggestions.length).toBeGreaterThan(0)

    // Очищаем
    act(() => {
      result.current.clearAnalysis()
    })

    expect(result.current.state).toEqual({
      isAnalyzing: false,
      analysisProgress: 0,
      currentAnalysis: null,
      sceneAnalysis: null,
      insights: null,
      keyMoments: [],
      error: null,
      lastAnalyzedClipId: null,
    })
    expect(result.current.suggestions).toEqual([])
  })

  it("должен применять предложение о нарезке", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    // Настраиваем мок для генерации предложения о нарезке
    mockSceneEngine.process.mockResolvedValueOnce({
      scenes: [
        {
          id: "scene-1",
          type: "dialogue",
          startTime: 0,
          duration: 5,
          confidence: 0.9,
        },
        {
          id: "scene-2",
          type: "action",
          startTime: 5,
          duration: 15, // Больше 10 секунд - будет предложение о нарезке
          confidence: 0.85,
        },
      ],
      totalScenes: 2,
      averageSceneLength: 10,
      keyMoments: [],
    })

    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    // Находим предложение о нарезке
    const cutSuggestion = result.current.suggestions.find((s) => s.type === "cut")
    expect(cutSuggestion).toBeDefined()

    if (cutSuggestion) {
      await act(async () => {
        await result.current.applySuggestion(cutSuggestion)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "SPLIT_CLIP",
        clipId: cutSuggestion.clipId,
        splitTime: cutSuggestion.timestamp,
      })
    }
  })

  it("должен применять предложение о маркере", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    // Сначала анализируем клип чтобы получить предложения
    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    // Находим предложение о маркере
    const markerSuggestion = result.current.suggestions.find((s) => s.type === "marker")
    expect(markerSuggestion).toBeDefined()

    if (markerSuggestion) {
      await act(async () => {
        await result.current.applySuggestion(markerSuggestion)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "ADD_MARKER",
        marker: expect.objectContaining({
          type: "note",
          timecode: markerSuggestion.timestamp,
          name: markerSuggestion.title,
          description: markerSuggestion.description,
          color: "#3b82f6",
        }),
      })
    }
  })

  it("должен применять предложение о скорости", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    // Сначала анализируем клип чтобы получить предложения
    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    // Находим предложение о скорости
    const speedSuggestion = result.current.suggestions.find((s) => s.type === "speed")
    expect(speedSuggestion).toBeDefined()

    if (speedSuggestion) {
      await act(async () => {
        await result.current.applySuggestion(speedSuggestion)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_CLIP",
        clipId: speedSuggestion.clipId,
        updates: {
          playbackRate: speedSuggestion.actionData.speed,
        },
      })
    }
  })

  it("должен отклонять предложения", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    // Сначала анализируем клип чтобы получить предложения
    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    const suggestionsCount = result.current.suggestions.length
    expect(suggestionsCount).toBeGreaterThan(0)

    const firstSuggestion = result.current.suggestions[0]

    act(() => {
      result.current.dismissSuggestion(firstSuggestion.id)
    })

    expect(result.current.suggestions.length).toBe(suggestionsCount - 1)
    expect(result.current.suggestions.find((s) => s.id === firstSuggestion.id)).toBeUndefined()
  })

  it("должен генерировать маркеры из анализа", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    // Сначала анализируем
    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    // Генерируем маркеры
    await act(async () => {
      await result.current.generateMarkersFromAnalysis()
    })

    // Проверяем, что были созданы маркеры для ключевых моментов
    expect(mockSend).toHaveBeenCalledWith({
      type: "ADD_MARKER",
      marker: expect.objectContaining({
        type: "chapter",
        timecode: 10,
        name: "Кульминация",
      }),
    })

    // Проверяем, что были созданы маркеры для смены сцен
    expect(mockSend).toHaveBeenCalledWith({
      type: "ADD_MARKER",
      marker: expect.objectContaining({
        type: "section",
        timecode: 15,
        name: "Сцена 2",
      }),
    })
  })

  it("должен находить ключевые моменты в клипе", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    const keyMoments = await act(async () => {
      return await result.current.findKeyMoments(testClip)
    })

    expect(keyMoments).toHaveLength(1)
    expect(keyMoments[0]).toEqual({
      id: "moment-1",
      timestamp: 5,
      type: "emotional_peak",
      description: "Эмоциональный пик",
      score: 0.9,
    })
  })

  it("должен обрабатывать ошибки при анализе", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    mockSceneEngine.process.mockRejectedValueOnce(new Error("Ошибка анализа"))

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    expect(result.current.state.error).toBe("Ошибка анализа")
    expect(result.current.state.isAnalyzing).toBe(false)
  })

  it("должен переключать автоматический анализ", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    expect(result.current.enableAutoAnalysis).toBe(true)

    act(() => {
      result.current.setEnableAutoAnalysis(false)
    })

    expect(result.current.enableAutoAnalysis).toBe(false)
  })

  it("должен автоматически анализировать новые клипы", async () => {
    vi.useFakeTimers()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    // Убеждаемся, что автоанализ включен
    expect(result.current.enableAutoAnalysis).toBe(true)

    // Ждем таймер (автоанализ срабатывает через 1 секунду)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })

    // Проверяем что анализ был запущен
    expect(mockSceneEngine.process).toHaveBeenCalledWith({
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
      },
    })

    vi.useRealTimers()
  })

  it("не должен анализировать клип без медиафайла", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    const clipWithoutMedia: TimelineClip = {
      id: "clip-no-media",
      name: "Empty Clip",
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClip(clipWithoutMedia)
    })

    expect(mockSceneEngine.process).not.toHaveBeenCalled()
    expect(mockOrchestrator.analyzeContent).not.toHaveBeenCalled()
  })

  it("не должен запускать новый анализ пока идет текущий", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    const testClip: TimelineClip = {
      id: "clip-test",
      name: "Test Clip",
      mediaFile: {
        path: "/test/video.mp4",
        name: "video.mp4",
        duration: 20,
        size: 1000000,
        format: "mp4",
      },
    } as TimelineClip

    // Задерживаем выполнение анализа
    mockSceneEngine.process.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

    // Запускаем первый анализ
    act(() => {
      void result.current.analyzeClip(testClip)
    })

    expect(result.current.state.isAnalyzing).toBe(true)

    // Пытаемся запустить второй анализ
    await act(async () => {
      await result.current.analyzeClip(testClip)
    })

    // Проверяем, что process был вызван только один раз
    expect(mockSceneEngine.process).toHaveBeenCalledTimes(1)
  })
})
