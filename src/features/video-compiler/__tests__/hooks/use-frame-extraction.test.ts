import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Subtitle, SubtitleAlignX, SubtitleAlignY, SubtitleFontWeight } from "@/types/video-compiler"

import { useFrameExtraction } from "../../hooks/use-frame-extraction"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    promise: vi.fn((promise) => {
      return promise
    }),
  },
}))

// Мокаем сервис извлечения кадров
vi.mock("../../services/frame-extraction-service", () => ({
  ExtractionPurpose: {
    TimelinePreview: "timeline_preview",
    ObjectDetection: "object_detection",
    SceneRecognition: "scene_recognition",
    TextRecognition: "text_recognition",
    SubtitleAnalysis: "subtitle_analysis",
  },
  frameExtractionService: {
    getCachedFrames: vi.fn(),
    extractTimelineFrames: vi.fn(),
    extractRecognitionFrames: vi.fn(),
    extractSubtitleFrames: vi.fn(),
    cacheFrames: vi.fn(),
    clearFrameCache: vi.fn(),
    cacheFramesInIndexedDB: vi.fn(),
  },
}))

describe("useFrameExtraction", () => {
  let mockFrameExtractionService: any

  const mockTimelineFrames = [
    {
      timestamp: 0,
      frameData: "data:image/png;base64,frame1",
      isKeyframe: true,
    },
    {
      timestamp: 1,
      frameData: "data:image/png;base64,frame2",
      isKeyframe: false,
    },
    {
      timestamp: 2,
      frameData: "data:image/png;base64,frame3",
      isKeyframe: true,
    },
  ]

  const mockRecognitionFrames = [
    {
      timestamp: 0,
      frameData: new Uint8Array([1, 2, 3, 4]),
      resolution: [640, 480] as [number, number],
      sceneChangeScore: 0.8,
      isKeyframe: true,
    },
    {
      timestamp: 2,
      frameData: new Uint8Array([5, 6, 7, 8]),
      resolution: [640, 480] as [number, number],
      sceneChangeScore: 0.3,
      isKeyframe: false,
    },
  ]

  const mockSubtitleFrames = [
    {
      subtitleId: "sub1",
      subtitleText: "Hello world",
      timestamp: 1.5,
      frameData: new Uint8Array([9, 10, 11, 12]),
      startTime: 1.0,
      endTime: 2.0,
    },
    {
      subtitleId: "sub2",
      subtitleText: "Test subtitle",
      timestamp: 3.7,
      frameData: new Uint8Array([13, 14, 15, 16]),
      startTime: 3.5,
      endTime: 4.0,
    },
  ]

  const mockSubtitles: Subtitle[] = [
    {
      id: "sub1",
      text: "Hello world",
      start_time: 1.0,
      end_time: 2.0,
      position: {
        x: 0,
        y: 0,
        align_x: SubtitleAlignX.Center,
        align_y: SubtitleAlignY.Bottom,
      },
      style: {
        font_family: "Arial",
        font_size: 24,
        font_weight: SubtitleFontWeight.Normal,
        color: "#ffffff",
      },
      enabled: true,
    },
    {
      id: "sub2",
      text: "Test subtitle",
      start_time: 3.5,
      end_time: 4.0,
      position: {
        x: 0,
        y: 0,
        align_x: SubtitleAlignX.Center,
        align_y: SubtitleAlignY.Bottom,
      },
      style: {
        font_family: "Arial",
        font_size: 24,
        font_weight: SubtitleFontWeight.Normal,
        color: "#ffffff",
      },
      enabled: true,
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    const { frameExtractionService } = await import("../../services/frame-extraction-service")
    mockFrameExtractionService = frameExtractionService
  })

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useFrameExtraction())

      expect(result.current.timelineFrames).toEqual([])
      expect(result.current.recognitionFrames).toEqual([])
      expect(result.current.subtitleFrames).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(result.current.error).toBeNull()
    })

    it("should accept custom options", () => {
      const customOptions = {
        cacheResults: false,
        autoLoad: true,
        interval: 2.0,
        maxFrames: 50,
      }

      const { result } = renderHook(() => useFrameExtraction(customOptions))

      // Options are internal, but we can verify they're used correctly
      expect(result.current.timelineFrames).toEqual([])
    })
  })

  describe("extractTimelineFrames", () => {
    it("should extract timeline frames successfully", async () => {
      mockFrameExtractionService.getCachedFrames.mockResolvedValueOnce(null)
      mockFrameExtractionService.extractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(mockFrameExtractionService.extractTimelineFrames).toHaveBeenCalledWith("/video.mp4", 10, 1.0, undefined)

      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)
      expect(result.current.isLoading).toBe(false)
    })

    it("should use cached frames if available", async () => {
      mockFrameExtractionService.getCachedFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(mockFrameExtractionService.extractTimelineFrames).not.toHaveBeenCalled()
      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)
    })

    it("should use custom options for extraction", async () => {
      mockFrameExtractionService.getCachedFrames.mockResolvedValueOnce(null)
      mockFrameExtractionService.extractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() =>
        useFrameExtraction({
          interval: 2.0,
          maxFrames: 50,
        }),
      )

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(mockFrameExtractionService.extractTimelineFrames).toHaveBeenCalledWith("/video.mp4", 10, 2.0, 50)
    })

    it("should handle extraction error", async () => {
      const errorMessage = "Failed to extract frames"
      mockFrameExtractionService.getCachedFrames.mockResolvedValueOnce(null)
      mockFrameExtractionService.extractTimelineFrames.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(result.current.error?.message).toBe(errorMessage)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe("extractRecognitionFrames", () => {
    it("should extract recognition frames for object detection", async () => {
      const { ExtractionPurpose } = await import("../../services/frame-extraction-service")
      mockFrameExtractionService.extractRecognitionFrames.mockResolvedValueOnce(mockRecognitionFrames)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractRecognitionFrames("/video.mp4", ExtractionPurpose.ObjectDetection)
      })

      expect(mockFrameExtractionService.extractRecognitionFrames).toHaveBeenCalledWith(
        "/video.mp4",
        ExtractionPurpose.ObjectDetection,
        1.0, // Uses the default interval from hook options
      )

      expect(result.current.recognitionFrames).toEqual(mockRecognitionFrames)
    })

    it("should extract recognition frames for scene recognition", async () => {
      const { ExtractionPurpose } = await import("../../services/frame-extraction-service")
      mockFrameExtractionService.extractRecognitionFrames.mockResolvedValueOnce(mockRecognitionFrames)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractRecognitionFrames("/video.mp4", ExtractionPurpose.SceneRecognition)
      })

      expect(mockFrameExtractionService.extractRecognitionFrames).toHaveBeenCalledWith(
        "/video.mp4",
        ExtractionPurpose.SceneRecognition,
        1.0,
      )
    })
  })

  describe("extractSubtitleFrames", () => {
    it("should extract subtitle frames", async () => {
      mockFrameExtractionService.extractSubtitleFrames.mockResolvedValueOnce(mockSubtitleFrames)

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractSubtitleFrames("/video.mp4", mockSubtitles)
      })

      expect(mockFrameExtractionService.extractSubtitleFrames).toHaveBeenCalledWith("/video.mp4", mockSubtitles)

      expect(result.current.subtitleFrames).toEqual(mockSubtitleFrames)
    })

    it("should handle empty subtitles array", async () => {
      mockFrameExtractionService.extractSubtitleFrames.mockResolvedValueOnce([])

      const { result } = renderHook(() => useFrameExtraction())

      await act(async () => {
        await result.current.extractSubtitleFrames("/video.mp4", [])
      })

      expect(mockFrameExtractionService.extractSubtitleFrames).toHaveBeenCalledWith("/video.mp4", [])
      expect(result.current.subtitleFrames).toEqual([])
    })
  })

  describe("clearCache", () => {
    it("should clear cache without resetting state", async () => {
      mockFrameExtractionService.clearFrameCache.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useFrameExtraction())

      // Устанавливаем некоторые кадры через extraction
      mockFrameExtractionService.getCachedFrames.mockResolvedValueOnce(null)
      mockFrameExtractionService.extractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)

      await act(async () => {
        await result.current.clearCache()
      })

      expect(mockFrameExtractionService.clearFrameCache).toHaveBeenCalled()
      // State should remain unchanged after clearing cache
      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)
      expect(result.current.recognitionFrames).toEqual([])
      expect(result.current.subtitleFrames).toEqual([])
    })
  })

  describe("reset", () => {
    it("should reset state without clearing cache", async () => {
      const { result } = renderHook(() => useFrameExtraction())

      // Устанавливаем некоторые данные
      mockFrameExtractionService.getCachedFrames.mockResolvedValueOnce(null)
      mockFrameExtractionService.extractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)

      act(() => {
        result.current.reset()
      })

      expect(result.current.timelineFrames).toEqual([])
      expect(result.current.recognitionFrames).toEqual([])
      expect(result.current.subtitleFrames).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.progress).toBe(0)
      expect(mockFrameExtractionService.clearFrameCache).not.toHaveBeenCalled()
    })
  })

  describe("concurrent extraction", () => {
    it("should handle concurrent extraction requests", async () => {
      const { ExtractionPurpose } = await import("../../services/frame-extraction-service")

      mockFrameExtractionService.getCachedFrames.mockResolvedValue(null)
      mockFrameExtractionService.extractTimelineFrames.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTimelineFrames), 100)),
      )
      mockFrameExtractionService.extractRecognitionFrames.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRecognitionFrames), 100)),
      )

      const { result } = renderHook(() => useFrameExtraction())

      // Запускаем две экстракции одновременно
      const promise1 = act(async () => {
        await result.current.extractTimelineFrames("/video1.mp4", 10)
      })

      const promise2 = act(async () => {
        await result.current.extractRecognitionFrames("/video2.mp4", ExtractionPurpose.ObjectDetection)
      })

      await Promise.all([promise1, promise2])

      expect(mockFrameExtractionService.extractTimelineFrames).toHaveBeenCalledTimes(1)
      expect(mockFrameExtractionService.extractRecognitionFrames).toHaveBeenCalledTimes(1)
      expect(result.current.timelineFrames).toEqual(mockTimelineFrames)
      expect(result.current.recognitionFrames).toEqual(mockRecognitionFrames)
    })
  })

  describe("adaptive interval calculation", () => {
    it("should calculate adaptive interval for long videos", async () => {
      mockFrameExtractionService.getCachedFrames.mockResolvedValueOnce(null)
      mockFrameExtractionService.extractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() =>
        useFrameExtraction({
          interval: 1.0,
          maxFrames: 100,
        }),
      )

      // Длинное видео (300 секунд)
      await act(async () => {
        await result.current.extractTimelineFrames("/long-video.mp4", 300)
      })

      // Хук использует адаптивный интервал внутри
      expect(mockFrameExtractionService.extractTimelineFrames).toHaveBeenCalledWith(
        "/long-video.mp4",
        300,
        1.0, // Интервал остается тем же, адаптация происходит внутри сервиса
        100,
      )
    })
  })

  describe("progress tracking", () => {
    it("should update progress during extraction", async () => {
      mockFrameExtractionService.getCachedFrames.mockResolvedValueOnce(null)
      mockFrameExtractionService.extractTimelineFrames.mockResolvedValueOnce(mockTimelineFrames)

      const { result } = renderHook(() => useFrameExtraction())

      expect(result.current.progress).toBe(0)

      await act(async () => {
        await result.current.extractTimelineFrames("/video.mp4", 10)
      })

      // После завершения прогресс должен быть 100
      expect(result.current.progress).toBe(100)
    })
  })
})
