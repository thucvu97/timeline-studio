import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useFramePreview } from "@/features/media/hooks/use-frame-preview"
import { ExtractionPurpose, TimelineFrame } from "@/features/video-compiler/services/frame-extraction-service"

// Мокаем зависимости
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Создаем моки для сервисов
const mockGetPreviewData = vi.fn()
const mockGenerateThumbnail = vi.fn()
const mockGetCachedFrames = vi.fn()
const mockExtractTimelineFrames = vi.fn()
const mockCacheFramesInIndexedDB = vi.fn()
const mockExtractRecognitionFrames = vi.fn()

vi.mock("@/features/media/hooks/use-media-preview", () => ({
  useMediaPreview: () => ({
    getPreviewData: mockGetPreviewData,
    generateThumbnail: mockGenerateThumbnail,
  }),
}))

vi.mock("@/features/video-compiler/services/frame-extraction-service", () => {
  enum ExtractionPurpose {
    ObjectDetection = "ObjectDetection",
    SceneDetection = "SceneDetection",
    FaceDetection = "FaceDetection",
  }
  
  return {
    FrameExtractionService: {
      getInstance: () => ({
        getCachedFrames: mockGetCachedFrames,
        extractTimelineFrames: mockExtractTimelineFrames,
        cacheFramesInIndexedDB: mockCacheFramesInIndexedDB,
        extractRecognitionFrames: mockExtractRecognitionFrames,
      }),
    },
    ExtractionPurpose,
  }
})

describe("useFramePreview", () => {
  const mockFrames: TimelineFrame[] = [
    { timestamp: 0, frameData: "base64_frame_0", isKeyframe: true },
    { timestamp: 1, frameData: "base64_frame_1", isKeyframe: false },
    { timestamp: 2, frameData: "base64_frame_2", isKeyframe: false },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем все моки на дефолтные значения
    mockGetPreviewData.mockResolvedValue(null)
    mockGenerateThumbnail.mockResolvedValue("thumbnail_base64")
    mockGetCachedFrames.mockResolvedValue(null)
    mockExtractTimelineFrames.mockResolvedValue(mockFrames)
    mockCacheFramesInIndexedDB.mockResolvedValue(undefined)
    mockExtractRecognitionFrames.mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("extractTimelineFrames", () => {
    it("should use cached frames from IndexedDB", async () => {
      mockGetCachedFrames.mockResolvedValue(mockFrames)

      const onFramesExtracted = vi.fn()
      const { result } = renderHook(() => useFramePreview({ onFramesExtracted }))

      let extractedFrames: TimelineFrame[] = []
      await act(async () => {
        extractedFrames = await result.current.extractTimelineFrames(
          "file-123",
          "/path/to/video.mp4",
          120, // duration
          1.0, // interval
          10   // maxFrames
        )
      })

      expect(mockGetCachedFrames).toHaveBeenCalledWith("/path/to/video.mp4")
      expect(onFramesExtracted).toHaveBeenCalledWith(mockFrames)
      expect(extractedFrames).toEqual(mockFrames)
      expect(result.current.isExtracting).toBe(false)
      expect(result.current.error).toBeNull()
      
      // Не должны вызываться другие методы
      expect(mockExtractTimelineFrames).not.toHaveBeenCalled()
      expect(mockGetPreviewData).not.toHaveBeenCalled()
    })

    it("should use cached frames from Preview Manager", async () => {
      mockGetCachedFrames.mockResolvedValue(null)
      mockGetPreviewData.mockResolvedValue({
        timeline_frames: [
          { timestamp: 0, base64_data: "base64_frame_0", is_keyframe: true },
          { timestamp: 1, base64_data: "base64_frame_1", is_keyframe: false },
        ],
      })

      const onFramesExtracted = vi.fn()
      const { result } = renderHook(() => useFramePreview({ onFramesExtracted }))

      await act(async () => {
        await result.current.extractTimelineFrames("file-123", "/path/to/video.mp4", 120)
      })

      expect(mockGetPreviewData).toHaveBeenCalledWith("file-123")
      expect(mockCacheFramesInIndexedDB).toHaveBeenCalled()
      expect(onFramesExtracted).toHaveBeenCalled()
      
      // Не должен вызываться extractTimelineFrames
      expect(mockExtractTimelineFrames).not.toHaveBeenCalled()
    })

    it("should extract new frames when not cached", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      
      mockGetCachedFrames.mockResolvedValue(null)
      mockGetPreviewData.mockResolvedValue(null)
      mockExtractTimelineFrames.mockResolvedValue(mockFrames)

      const { result } = renderHook(() => useFramePreview())

      await act(async () => {
        await result.current.extractTimelineFrames("file-123", "/path/to/video.mp4", 120, 1.0, 10)
      })

      expect(mockExtractTimelineFrames).toHaveBeenCalledWith(
        "/path/to/video.mp4",
        120,
        1.0,
        10
      )
      expect(mockGenerateThumbnail).toHaveBeenCalledWith(
        "file-123",
        "/path/to/video.mp4",
        320,
        180,
        0 // первый кадр
      )
      expect(mockCacheFramesInIndexedDB).toHaveBeenCalledWith("/path/to/video.mp4", mockFrames)
      expect(invoke).toHaveBeenCalledWith("save_timeline_frames", {
        file_id: "file-123",
        frames: expect.any(Array),
      })
    })

    it.skip("should handle extraction errors", async () => {
      const error = new Error("Extraction failed")
      mockGetCachedFrames.mockResolvedValue(null)
      mockGetPreviewData.mockResolvedValue(null)
      mockExtractTimelineFrames.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useFramePreview({ onError }))

      await expect(
        act(async () => {
          await result.current.extractTimelineFrames("file-123", "/path/to/video.mp4", 120)
        })
      ).rejects.toThrow("Extraction failed")

      expect(onError).toHaveBeenCalledWith("Extraction failed")
      expect(result.current.error).toBe("Extraction failed")
      expect(result.current.isExtracting).toBe(false)
    })

    it("should set isExtracting state correctly", async () => {
      // Создаем промис с контролируемым разрешением
      let resolveExtraction: (value: TimelineFrame[]) => void
      const extractionPromise = new Promise<TimelineFrame[]>((resolve) => {
        resolveExtraction = resolve
      })
      
      mockGetCachedFrames.mockResolvedValue(null)
      mockGetPreviewData.mockResolvedValue(null)
      mockExtractTimelineFrames.mockReturnValue(extractionPromise)

      const { result } = renderHook(() => useFramePreview())

      expect(result.current.isExtracting).toBe(false)

      // Начинаем извлечение
      act(() => {
        void result.current.extractTimelineFrames("file-123", "/path/to/video.mp4", 120)
      })

      // Ждем обновления состояния
      await waitFor(() => {
        expect(result.current.isExtracting).toBe(true)
      })

      // Разрешаем промис
      await act(async () => {
        resolveExtraction!(mockFrames)
      })

      // Ждем, пока промис завершится и состояние обновится
      await waitFor(() => {
        expect(result.current.isExtracting).toBe(false)
      })
    })
  })

  describe("extractRecognitionFrames", () => {
    it("should use cached recognition frames", async () => {
      const mockRecognitionFrames = [
        { timestamp: 0, data: "recognition_data_0" },
        { timestamp: 1, data: "recognition_data_1" },
      ]

      mockGetPreviewData.mockResolvedValue({
        recognition_frames: mockRecognitionFrames,
      })

      const { result } = renderHook(() => useFramePreview())

      let recognitionFrames: any
      await act(async () => {
        recognitionFrames = await result.current.extractRecognitionFrames(
          "file-123",
          "/path/to/video.mp4",
          1.0,
          ExtractionPurpose.ObjectDetection
        )
      })

      expect(mockGetPreviewData).toHaveBeenCalledWith("file-123")
      expect(recognitionFrames).toEqual(mockRecognitionFrames)
      
      // Не должен вызываться extractRecognitionFrames
      expect(mockExtractRecognitionFrames).not.toHaveBeenCalled()
    })

    it("should extract new recognition frames when not cached", async () => {
      const mockRecognitionFrames = [{ timestamp: 0, data: "new_recognition_data" }]
      
      mockGetPreviewData.mockResolvedValue(null)
      mockExtractRecognitionFrames.mockResolvedValue(mockRecognitionFrames)

      const { result } = renderHook(() => useFramePreview())

      let recognitionFrames: any
      await act(async () => {
        recognitionFrames = await result.current.extractRecognitionFrames(
          "file-123",
          "/path/to/video.mp4",
          2.0,
          ExtractionPurpose.SceneDetection
        )
      })

      expect(mockExtractRecognitionFrames).toHaveBeenCalledWith(
        "/path/to/video.mp4",
        "SceneDetection",
        2.0
      )
      expect(recognitionFrames).toEqual(mockRecognitionFrames)
    })

    it("should handle recognition extraction errors", async () => {
      const error = new Error("Recognition extraction failed")
      
      mockGetPreviewData.mockResolvedValue(null)
      mockExtractRecognitionFrames.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useFramePreview({ onError }))

      // Вызываем функцию и ожидаем ошибку
      await act(async () => {
        try {
          await result.current.extractRecognitionFrames("file-123", "/path/to/video.mp4")
        } catch (err) {
          // Ошибка ожидается
        }
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Recognition extraction failed")
        expect(result.current.error).toBe("Recognition extraction failed")
      })
    })
  })

  describe("getFrameAtTimestamp", () => {
    it("should return cached frame at timestamp", async () => {
      mockGetPreviewData.mockResolvedValue({
        timeline_frames: [
          { timestamp: 1.0, base64_data: "cached_frame_at_1" },
          { timestamp: 2.0, base64_data: "cached_frame_at_2" },
        ],
      })

      const { result } = renderHook(() => useFramePreview())

      let frameData: string | null = null
      await act(async () => {
        frameData = await result.current.getFrameAtTimestamp("file-123", "/path/to/video.mp4", 1.05)
      })

      expect(mockGetPreviewData).toHaveBeenCalledWith("file-123")
      expect(frameData).toBe("cached_frame_at_1")
      
      // Не должен вызываться generateThumbnail
      expect(mockGenerateThumbnail).not.toHaveBeenCalled()
    })

    it("should generate new thumbnail when frame not cached", async () => {
      mockGetPreviewData.mockResolvedValue({
        timeline_frames: [
          { timestamp: 1.0, base64_data: "cached_frame_at_1" },
        ],
      })

      mockGenerateThumbnail.mockResolvedValue("new_thumbnail_at_5")

      const { result } = renderHook(() => useFramePreview())

      let frameData: string | null = null
      await act(async () => {
        frameData = await result.current.getFrameAtTimestamp("file-123", "/path/to/video.mp4", 5.0)
      })

      expect(mockGenerateThumbnail).toHaveBeenCalledWith(
        "file-123",
        "/path/to/video.mp4",
        320,
        180,
        5.0
      )
      expect(frameData).toBe("new_thumbnail_at_5")
    })

    it("should handle errors when getting frame at timestamp", async () => {
      const error = new Error("Failed to generate thumbnail")
      
      mockGetPreviewData.mockResolvedValue(null)
      mockGenerateThumbnail.mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(() => useFramePreview({ onError }))

      let frameData: string | null = null
      await act(async () => {
        frameData = await result.current.getFrameAtTimestamp("file-123", "/path/to/video.mp4", 3.0)
      })

      expect(frameData).toBeNull()
      expect(onError).toHaveBeenCalledWith("Failed to generate thumbnail")
      expect(result.current.error).toBe("Failed to generate thumbnail")
    })

    it("should handle non-Error exceptions", async () => {
      mockGetPreviewData.mockResolvedValue(null)
      mockGenerateThumbnail.mockRejectedValue("String error")

      const onError = vi.fn()
      const { result } = renderHook(() => useFramePreview({ onError }))

      let frameData: string | null = null
      await act(async () => {
        frameData = await result.current.getFrameAtTimestamp("file-123", "/path/to/video.mp4", 3.0)
      })

      expect(frameData).toBeNull()
      expect(onError).toHaveBeenCalledWith("Failed to get frame at timestamp")
      expect(result.current.error).toBe("Failed to get frame at timestamp")
    })
  })
})