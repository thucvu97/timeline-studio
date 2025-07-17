/**
 * Comprehensive tests for use-timeline-persons hook
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useTimelinePersons } from "../../hooks/use-timeline-persons"
import { MockTimelineProvider } from "../test-providers"

import type { TimelineClip } from "../../types/timeline"

// Mock timeline-machine
vi.mock("../../services/timeline-machine", () => ({
  timelineMachine: {},
}))

// Mock для person identification
const mockDetectFaces = vi.fn()
const mockIdentifyPerson = vi.fn()
const mockCreatePersonFromFace = vi.fn()
const mockAnalyzeVideoForPersons = vi.fn()
const mockSend = vi.fn()

const mockPersons = [
  {
    id: "person-1",
    name: "John Doe",
    photos: ["/photo1.jpg"],
    appearances: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "person-2",
    name: "Jane Smith",
    photos: ["/photo2.jpg"],
    appearances: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

vi.mock("@/features/person-identification/hooks/use-person-identification", () => ({
  usePersonIdentification: vi.fn(() => ({
    persons: mockPersons,
    detectFaces: mockDetectFaces,
    identifyPerson: mockIdentifyPerson,
    createPersonFromFace: mockCreatePersonFromFace,
    analyzeVideoForPersons: mockAnalyzeVideoForPersons,
    error: null,
  })),
}))

// Mock useTimeline
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
              name: "Test Video Clip",
              type: "video",
              startTime: 0,
              duration: 10,
              mediaFile: {
                path: "/test/video.mp4",
                name: "video.mp4",
                duration: 10,
                format: "video/mp4",
              },
            } as TimelineClip,
            {
              id: "clip-2",
              name: "Test Audio Clip",
              type: "audio",
              startTime: 10,
              duration: 5,
              mediaFile: {
                path: "/test/audio.mp3",
                name: "audio.mp3",
                duration: 5,
                format: "audio/mp3",
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
    send: mockSend,
  })),
}))

describe("useTimelinePersons", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Настройка моков по умолчанию
    mockDetectFaces.mockResolvedValue([
      {
        id: "face-1",
        confidence: 0.9,
        boundingBox: { x: 100, y: 100, width: 50, height: 50 },
        frameNumber: 150,
        timestamp: { seconds: 5, nanos: 0 },
        thumbnail: "/thumb1.jpg",
      },
      {
        id: "face-2",
        confidence: 0.8,
        boundingBox: { x: 200, y: 100, width: 50, height: 50 },
        frameNumber: 180,
        timestamp: { seconds: 6, nanos: 0 },
        thumbnail: "/thumb2.jpg",
      },
    ])

    mockIdentifyPerson.mockResolvedValue({
      person: mockPersons[0],
      confidence: 0.85,
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("должен инициализироваться с начальным состоянием", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    expect(result.current.state).toEqual({
      isAnalyzing: false,
      analysisProgress: 0,
      appearances: [],
      error: null,
    })

    expect(result.current.enablePersonDetection).toBe(true)
    expect(result.current.confidenceThreshold).toBe(0.7)
  })

  it("должен возвращать персон из person identification", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    expect(result.current.persons).toHaveLength(2)
    expect(result.current.persons[0].name).toBe("John Doe")
    expect(result.current.persons[1].name).toBe("Jane Smith")
  })

  it("должен анализировать клип на наличие персон", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    // Проверяем вызовы методов
    expect(mockDetectFaces).toHaveBeenCalledWith("/test/video.mp4", {
      start: 0,
      end: 10,
    })

    expect(mockIdentifyPerson).toHaveBeenCalledTimes(2)

    // Проверяем состояние
    expect(result.current.state.isAnalyzing).toBe(false)
    expect(result.current.state.analysisProgress).toBe(100)
    expect(result.current.state.appearances).toHaveLength(2)
    expect(result.current.state.error).toBeNull()
  })

  it("должен правильно создавать appearance записи", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    const appearances = result.current.state.appearances

    expect(appearances[0]).toMatchObject({
      personId: "person-1",
      clipId: "clip-1",
      startTime: 5,
      endTime: 6,
      confidence: 0.85,
      boundingBox: { x: 100, y: 100, width: 50, height: 50 },
      thumbnailPath: "/thumb1.jpg",
    })
  })

  it("должен фильтровать лица с низкой уверенностью", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    // Устанавливаем высокий порог уверенности
    act(() => {
      result.current.setConfidenceThreshold(0.9)
    })

    // Мок возвращает идентификацию с уверенностью 0.85
    mockIdentifyPerson.mockResolvedValue({
      person: mockPersons[0],
      confidence: 0.85,
    })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    // Не должно быть появлений, так как уверенность ниже порога
    expect(result.current.state.appearances).toHaveLength(0)
  })

  it("должен получать персон для конкретного клипа", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    const personsForClip = result.current.getPersonsForClip("clip-1")

    expect(personsForClip).toHaveLength(1)
    expect(personsForClip[0].name).toBe("John Doe")
  })

  it("должен получать appearances для конкретного клипа", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    const appearancesForClip = result.current.getAppearancesForClip("clip-1")

    expect(appearancesForClip).toHaveLength(2)
    expect(appearancesForClip[0].clipId).toBe("clip-1")
  })

  it("должен анализировать весь timeline", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    await act(async () => {
      await result.current.analyzeTimelineForPersons()
    })

    // Должен анализировать только видео клипы (clip-1), но не аудио (clip-2)
    expect(mockDetectFaces).toHaveBeenCalledTimes(1)
    expect(mockDetectFaces).toHaveBeenCalledWith("/test/video.mp4", {
      start: 0,
      end: 10,
    })
  })

  it("должен очищать анализ персон", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    // Сначала анализируем
    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    expect(result.current.state.appearances).toHaveLength(2)

    // Очищаем
    act(() => {
      result.current.clearPersonsAnalysis()
    })

    expect(result.current.state).toEqual({
      isAnalyzing: false,
      analysisProgress: 0,
      appearances: [],
      error: null,
    })
  })

  it("должен показывать детали персоны", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    act(() => {
      result.current.showPersonDetail("person-1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "SHOW_MODAL",
      modal: {
        type: "person_detail",
        data: { personId: "person-1" },
      },
    })
  })

  it("должен обрабатывать ошибки при анализе", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    mockDetectFaces.mockRejectedValueOnce(new Error("Ошибка обнаружения лиц"))

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    expect(result.current.state.error).toBe("Ошибка обнаружения лиц")
    expect(result.current.state.isAnalyzing).toBe(false)
  })

  it("должен переключать обнаружение персон", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    expect(result.current.enablePersonDetection).toBe(true)

    act(() => {
      result.current.setEnablePersonDetection(false)
    })

    expect(result.current.enablePersonDetection).toBe(false)
  })

  it("должен устанавливать порог уверенности", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    expect(result.current.confidenceThreshold).toBe(0.7)

    act(() => {
      result.current.setConfidenceThreshold(0.85)
    })

    expect(result.current.confidenceThreshold).toBe(0.85)
  })

  it("не должен анализировать клип без медиафайла", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    const clipWithoutMedia: TimelineClip = {
      id: "clip-no-media",
      name: "Empty Clip",
    } as TimelineClip

    await act(async () => {
      await result.current.analyzeClipForPersons(clipWithoutMedia)
    })

    expect(mockDetectFaces).not.toHaveBeenCalled()
  })

  it("не должен анализировать когда обнаружение персон отключено", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    act(() => {
      result.current.setEnablePersonDetection(false)
    })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    expect(mockDetectFaces).not.toHaveBeenCalled()
  })

  it("не должен запускать новый анализ пока идет текущий", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    // Задерживаем выполнение detectFaces
    mockDetectFaces.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

    // Запускаем первый анализ
    act(() => {
      void result.current.analyzeClipForPersons(testClip)
    })

    expect(result.current.state.isAnalyzing).toBe(true)

    // Пытаемся запустить второй анализ
    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    // detectFaces должен быть вызван только один раз
    expect(mockDetectFaces).toHaveBeenCalledTimes(1)
  })

  it("должен автоматически анализировать новые клипы", async () => {
    vi.useFakeTimers()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    // Убеждаемся, что обнаружение персон включено
    expect(result.current.enablePersonDetection).toBe(true)

    // Ждем таймер (автоанализ срабатывает через 2 секунды)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100)
    })

    // Проверяем что анализ был запущен
    expect(mockDetectFaces).toHaveBeenCalledWith("/test/video.mp4", {
      start: 0,
      end: 10,
    })

    vi.useRealTimers()
  })

  it("должен обновлять appearances при повторном анализе клипа", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    // Первый анализ
    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    expect(result.current.state.appearances).toHaveLength(2)

    // Изменяем результаты мока
    mockDetectFaces.mockResolvedValueOnce([
      {
        id: "face-3",
        confidence: 0.95,
        boundingBox: { x: 150, y: 150, width: 60, height: 60 },
        frameNumber: 200,
        timestamp: { seconds: 7, nanos: 0 },
        thumbnail: "/thumb3.jpg",
      },
    ])

    // Второй анализ того же клипа
    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    // Старые appearances должны быть заменены новыми
    expect(result.current.state.appearances).toHaveLength(1)
    expect(result.current.state.appearances[0].startTime).toBe(7)
  })

  it("должен обрабатывать неизвестные лица с высокой уверенностью", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    // Мок возвращает null для идентификации (неизвестное лицо)
    mockIdentifyPerson.mockResolvedValue(null)

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    const testClip = mockProject.sections[0].tracks[0].clips[0]

    await act(async () => {
      await result.current.analyzeClipForPersons(testClip)
    })

    // Проверяем, что было залогировано неизвестное лицо
    expect(consoleSpy).toHaveBeenCalledWith(
      "Unknown face detected with high confidence:",
      expect.objectContaining({
        confidence: expect.any(Number),
      }),
    )

    // Не должно быть appearances для неизвестных лиц
    expect(result.current.state.appearances).toHaveLength(0)

    consoleSpy.mockRestore()
  })
})
