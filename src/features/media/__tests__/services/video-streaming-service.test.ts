import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VideoStreamingService, videoStreamingService } from "../../services/video-streaming-service"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем fetch глобально
global.fetch = vi.fn()

// Мокаем document.createElement
const mockVideo = {
  src: "",
  preload: "",
  onloadedmetadata: null as any,
  onerror: null as any,
  remove: vi.fn(),
}

global.document = {
  createElement: vi.fn((tag) => {
    if (tag === "video") {
      return mockVideo
    }
    return {}
  }),
} as any

describe("VideoStreamingService", () => {
  let service: VideoStreamingService

  beforeEach(() => {
    vi.clearAllMocks()
    // Получаем экземпляр сервиса
    service = VideoStreamingService.getInstance()
    // Очищаем кэш перед каждым тестом
    service.clearCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = VideoStreamingService.getInstance()
      const instance2 = VideoStreamingService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it("should export videoStreamingService singleton", () => {
      expect(videoStreamingService).toBe(VideoStreamingService.getInstance())
    })
  })

  describe("getVideoUrl", () => {
    it("should register video and return URL", async () => {
      const mockRegistration = {
        id: "video-123",
        url: "http://localhost:4567/video/video-123",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValue(mockRegistration)

      const url = await service.getVideoUrl("/path/to/video.mp4")

      expect(invoke).toHaveBeenCalledWith("register_video", {
        path: "/path/to/video.mp4",
      })
      expect(url).toBe("http://localhost:4567/video/video-123")
    })

    it("should return cached URL on subsequent calls", async () => {
      const mockRegistration = {
        id: "video-123",
        url: "http://localhost:4567/video/video-123",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValue(mockRegistration)

      // Первый вызов
      const url1 = await service.getVideoUrl("/path/to/video.mp4")
      // Второй вызов
      const url2 = await service.getVideoUrl("/path/to/video.mp4")

      // invoke должен быть вызван только один раз
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(url1).toBe(url2)
    })

    it("should handle concurrent requests for the same video", async () => {
      const mockRegistration = {
        id: "video-123",
        url: "http://localhost:4567/video/video-123",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRegistration), 100)),
      )

      // Запускаем несколько запросов одновременно
      const promises = [
        service.getVideoUrl("/path/to/video.mp4"),
        service.getVideoUrl("/path/to/video.mp4"),
        service.getVideoUrl("/path/to/video.mp4"),
      ]

      const urls = await Promise.all(promises)

      // invoke должен быть вызван только один раз
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(urls).toEqual([
        "http://localhost:4567/video/video-123",
        "http://localhost:4567/video/video-123",
        "http://localhost:4567/video/video-123",
      ])
    })

    it("should fallback to HTTP request when Tauri invoke fails", async () => {
      const mockRegistration = {
        id: "video-456",
        url: "http://localhost:4567/video/video-456",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockRejectedValue(new Error("Tauri command failed"))

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockRegistration,
      } as Response)

      const url = await service.getVideoUrl("/path/to/video.mp4")

      expect(invoke).toHaveBeenCalledWith("register_video", {
        path: "/path/to/video.mp4",
      })
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:4567/register?path=%2Fpath%2Fto%2Fvideo.mp4")
      expect(url).toBe("http://localhost:4567/video/video-456")
    })

    it("should handle HTTP request failure", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockRejectedValue(new Error("Tauri command failed"))

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
      } as Response)

      await expect(service.getVideoUrl("/path/to/video.mp4")).rejects.toThrow(
        "Failed to register video: Internal Server Error",
      )
    })
  })

  describe("preloadVideo", () => {
    it("should preload video metadata successfully", async () => {
      const mockRegistration = {
        id: "video-123",
        url: "http://localhost:4567/video/video-123",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValue(mockRegistration)

      const preloadPromise = service.preloadVideo("/path/to/video.mp4")

      // Симулируем успешную загрузку метаданных
      await vi.waitFor(() => {
        expect(mockVideo.src).toBe("http://localhost:4567/video/video-123")
        expect(mockVideo.preload).toBe("metadata")
      })

      // Вызываем onloadedmetadata
      mockVideo.onloadedmetadata()

      await expect(preloadPromise).resolves.toBeUndefined()
      expect(mockVideo.remove).not.toHaveBeenCalled() // remove вызывается только по таймауту
    })

    it("should handle video metadata loading error", async () => {
      const mockRegistration = {
        id: "video-123",
        url: "http://localhost:4567/video/video-123",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValue(mockRegistration)

      const preloadPromise = service.preloadVideo("/path/to/video.mp4")

      // Ждем небольшое время для установки src
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Вызываем onerror синхронно
      if (mockVideo.onerror) {
        mockVideo.onerror()
      }

      await expect(preloadPromise).rejects.toThrow("Failed to load video metadata")
    })

    it.skip("should cleanup video element after timeout", async () => {
      const mockRegistration = {
        id: "video-123",
        url: "http://localhost:4567/video/video-123",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValue(mockRegistration)

      vi.useFakeTimers()

      // Мокаем setTimeout для контроля таймера
      let timeoutCallback: any
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn((cb, ms) => {
        if (ms === 5000) {
          timeoutCallback = cb
        }
        return originalSetTimeout(cb, ms)
      }) as any

      const preloadPromise = service.preloadVideo("/path/to/video.mp4")

      // Ждем установки таймера
      await new Promise((resolve) => setImmediate(resolve))

      // Вызываем колбэк таймера напрямую
      if (timeoutCallback) {
        timeoutCallback()
      }

      await preloadPromise

      expect(mockVideo.remove).toHaveBeenCalled()

      global.setTimeout = originalSetTimeout
      vi.useRealTimers()
    })
  })

  describe("clearCache", () => {
    it("should clear specific video from cache", async () => {
      const mockRegistration = {
        id: "video-123",
        url: "http://localhost:4567/video/video-123",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValue(mockRegistration)

      // Кэшируем видео
      await service.getVideoUrl("/path/to/video.mp4")

      // Очищаем кэш для конкретного видео
      service.clearCache("/path/to/video.mp4")

      // При следующем вызове должен быть новый запрос
      vi.mocked(invoke).mockResolvedValue({
        id: "video-456",
        url: "http://localhost:4567/video/video-456",
      })

      const url = await service.getVideoUrl("/path/to/video.mp4")

      expect(invoke).toHaveBeenCalledTimes(2)
      expect(url).toBe("http://localhost:4567/video/video-456")
    })

    it("should clear all videos from cache when no path provided", async () => {
      const { invoke } = await import("@tauri-apps/api/core")

      // Кэшируем несколько видео
      vi.mocked(invoke).mockResolvedValueOnce({
        id: "video-1",
        url: "http://localhost:4567/video/video-1",
      })
      await service.getVideoUrl("/path/to/video1.mp4")

      vi.mocked(invoke).mockResolvedValueOnce({
        id: "video-2",
        url: "http://localhost:4567/video/video-2",
      })
      await service.getVideoUrl("/path/to/video2.mp4")

      // Очищаем весь кэш
      service.clearCache()

      // При следующих вызовах должны быть новые запросы
      vi.mocked(invoke).mockResolvedValueOnce({
        id: "video-3",
        url: "http://localhost:4567/video/video-3",
      })
      await service.getVideoUrl("/path/to/video1.mp4")

      vi.mocked(invoke).mockResolvedValueOnce({
        id: "video-4",
        url: "http://localhost:4567/video/video-4",
      })
      await service.getVideoUrl("/path/to/video2.mp4")

      expect(invoke).toHaveBeenCalledTimes(4)
    })
  })

  describe("isServerRunning", () => {
    it("should return true when server is running", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
      } as Response)

      const isRunning = await service.isServerRunning()

      expect(global.fetch).toHaveBeenCalledWith("http://localhost:4567/health", {
        method: "HEAD",
        signal: expect.any(AbortSignal),
      })
      expect(isRunning).toBe(true)
    })

    it("should return false when server returns error", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
      } as Response)

      const isRunning = await service.isServerRunning()

      expect(isRunning).toBe(false)
    })

    it("should return false when fetch fails", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"))

      const isRunning = await service.isServerRunning()

      expect(isRunning).toBe(false)
    })

    it("should timeout after 1 second", async () => {
      // Мокаем AbortSignal.timeout
      const mockAbortSignal = {
        aborted: false,
        reason: new Error("AbortError"),
      }

      const originalTimeout = AbortSignal.timeout
      AbortSignal.timeout = vi.fn(() => mockAbortSignal as any)

      vi.mocked(global.fetch).mockImplementation(() => {
        mockAbortSignal.aborted = true
        return Promise.reject(new Error("AbortError"))
      })

      const isRunning = await service.isServerRunning()

      expect(isRunning).toBe(false)
      expect(AbortSignal.timeout).toHaveBeenCalledWith(1000)

      // Восстанавливаем оригинальный метод
      AbortSignal.timeout = originalTimeout
    })
  })
})
