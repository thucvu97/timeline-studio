import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock OAuth service
vi.mock("../../services/oauth-service", () => ({
  OAuthService: {
    getStoredToken: vi.fn(),
  },
}))

// Import after mocking
import * as TikTokService from "../../services/tiktok-service"

const { OAuthService } = await import("../../services/oauth-service")

// Mock global fetch
global.fetch = vi.fn()

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  upload = { addEventListener: vi.fn() }
  addEventListener = vi.fn()
  open = vi.fn()
  setRequestHeader = vi.fn()
  send = vi.fn()
  status = 200
  statusText = "OK"

  // Mock methods to trigger events
  triggerLoad() {
    const loadHandler = this.addEventListener.mock.calls.find(([event]) => event === "load")?.[1]
    if (loadHandler) loadHandler()
  }

  triggerError() {
    const errorHandler = this.addEventListener.mock.calls.find(([event]) => event === "error")?.[1]
    if (errorHandler) errorHandler()
  }

  triggerProgress(loaded: number, total: number) {
    const progressHandler = this.upload.addEventListener.mock.calls.find(([event]) => event === "progress")?.[1]
    if (progressHandler) progressHandler({ lengthComputable: true, loaded, total })
  }
}

global.XMLHttpRequest = vi.fn(() => new MockXMLHttpRequest()) as any

describe("TikTokService - Comprehensive", () => {
  const mockToken = {
    accessToken: "test_tiktok_access_token",
    refreshToken: "test_refresh_token",
    expiresIn: 3600,
    tokenType: "Bearer",
  }

  const mockVideoFile = new File(["video content"], "test.mp4", { type: "video/mp4" })
  Object.defineProperty(mockVideoFile, "size", { value: 50 * 1024 * 1024 }) // 50MB

  const mockMetadata = {
    title: "Test TikTok Video",
    description: "Test description",
    privacy_level: "PUBLIC_TO_EVERYONE" as const,
  }

  const baseSettings = {
    fileName: "test",
    savePath: "",
    format: "Mp4" as const,
    quality: "good" as const,
    resolution: "1080",
    frameRate: "30",
    enableGPU: true,
    socialNetwork: "tiktok",
    isLoggedIn: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(OAuthService.getStoredToken).mockResolvedValue(mockToken)
  })

  describe("uploadVideo - Full Flow", () => {
    const mockInitResponse = {
      publish_id: "test_publish_id",
      upload_url: "https://upload.tiktokapis.com/test",
    }

    const mockPublishResponse = {
      share_url: "https://tiktok.com/@user/video/123",
      embed_url: "https://embed.tiktok.com/123",
      unique_id: "unique_123",
    }

    it("should complete full upload flow successfully", async () => {
      // Mock initialize upload
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockInitResponse }),
        } as any)
        // Mock publish video
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockPublishResponse }),
        } as any)

      const progressCallback = vi.fn()
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = TikTokService.uploadVideo(mockVideoFile, mockMetadata, progressCallback)

      // Simulate successful upload
      setTimeout(() => {
        xhrInstance.triggerProgress(25 * 1024 * 1024, 50 * 1024 * 1024) // 50% progress
        xhrInstance.triggerProgress(50 * 1024 * 1024, 50 * 1024 * 1024) // 100% progress
        xhrInstance.triggerLoad()
      }, 10)

      const result = await uploadPromise

      expect(result).toEqual({
        publish_id: "test_publish_id",
        share_url: mockPublishResponse.share_url,
        embed_url: mockPublishResponse.embed_url,
        unique_id: mockPublishResponse.unique_id,
      })

      expect(progressCallback).toHaveBeenCalledWith(50)
      expect(progressCallback).toHaveBeenCalledWith(100)
    })

    it("should throw error when not authenticated", async () => {
      vi.mocked(OAuthService.getStoredToken).mockResolvedValue(null)

      await expect(TikTokService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow(
        "Not authenticated with TikTok",
      )
    })

    it("should handle initialization failure", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: "Invalid metadata" } }),
      } as any)

      await expect(TikTokService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow(
        "TikTok init failed: Invalid metadata",
      )
    })

    it("should handle initialization failure without error message", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as any)

      await expect(TikTokService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow(
        "TikTok init failed: Unknown error",
      )
    })

    it("should handle upload file failure", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockInitResponse }),
      } as any)

      const xhrInstance = new MockXMLHttpRequest()
      xhrInstance.status = 500
      xhrInstance.statusText = "Internal Server Error"
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = TikTokService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await expect(uploadPromise).rejects.toThrow("HTTP 500: Internal Server Error")
    })

    it("should handle network error during upload", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockInitResponse }),
      } as any)

      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = TikTokService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerError()
      }, 10)

      await expect(uploadPromise).rejects.toThrow("Network error during upload")
    })

    it("should handle publish failure", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockInitResponse }),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: { message: "Publish failed" } }),
        } as any)

      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = TikTokService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await expect(uploadPromise).rejects.toThrow("TikTok publish failed: Publish failed")
    })

    it("should log and re-throw upload errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock initialization to fail inside the try-catch block
      vi.mocked(fetch).mockRejectedValue(new Error("Network initialization failed"))

      await expect(TikTokService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow(
        "Network initialization failed",
      )

      expect(consoleSpy).toHaveBeenCalledWith("TikTok upload error:", expect.any(Error))
      consoleSpy.mockRestore()
    })
  })
  // Tests for private methods removed as they are no longer exposed

  describe("getUserInfo", () => {
    const mockUserInfo = {
      display_name: "Test User",
      bio_description: "Test bio",
      avatar_url: "https://example.com/avatar.jpg",
    }

    it("should get user info with provided token", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUserInfo } }),
      } as any)

      const result = await TikTokService.getUserInfo("custom_token")

      expect(fetch).toHaveBeenCalledWith("https://open.tiktokapis.com/v2/user/info/", {
        method: "GET",
        headers: {
          Authorization: "Bearer custom_token",
        },
      })

      expect(result).toEqual(mockUserInfo)
    })

    it("should get user info with stored token", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUserInfo } }),
      } as any)

      const result = await TikTokService.getUserInfo()

      expect(OAuthService.getStoredToken).toHaveBeenCalledWith("tiktok")
      expect(fetch).toHaveBeenCalledWith("https://open.tiktokapis.com/v2/user/info/", {
        method: "GET",
        headers: {
          Authorization: "Bearer test_tiktok_access_token",
        },
      })

      expect(result).toEqual(mockUserInfo)
    })

    it("should throw error when no token available", async () => {
      vi.mocked(OAuthService.getStoredToken).mockResolvedValue(null)

      await expect(TikTokService.getUserInfo()).rejects.toThrow("Not authenticated")
    })

    it("should throw error when API request fails", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as any)

      await expect(TikTokService.getUserInfo("invalid_token")).rejects.toThrow("Failed to get user info")
    })

    it("should handle missing user data in response", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }), // No user field
      } as any)

      const result = await TikTokService.getUserInfo("test_token")

      expect(result).toBeUndefined()
    })
  })

  describe("validateSettings - Extended", () => {
    it("should return multiple errors for invalid settings", () => {
      const invalidSettings = {
        ...baseSettings,
        title: "", // Missing title
        description: "a".repeat(2201), // Too long description
      }

      const result = TikTokService.validateSettings(invalidSettings)

      expect(result).toEqual(["Title is required", "Description must be 2200 characters or less"])
    })

    it("should handle whitespace-only title", () => {
      const settings = { ...baseSettings, title: "   " }

      const result = TikTokService.validateSettings(settings)

      expect(result).toEqual(["Title is required"])
    })

    it("should accept title at maximum length", () => {
      const settings = { ...baseSettings, title: "a".repeat(150) }

      const result = TikTokService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should accept description at maximum length", () => {
      const settings = {
        ...baseSettings,
        title: "Valid Title",
        description: "a".repeat(2200),
      }

      const result = TikTokService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should handle undefined description", () => {
      const settings = { ...baseSettings, title: "Valid Title" }

      const result = TikTokService.validateSettings(settings)

      expect(result).toEqual([])
    })
  })

  describe("exportSettings - Extended", () => {
    it("should handle default title when title is missing", async () => {
      const settingsWithoutTitle = { ...baseSettings }
      ;(settingsWithoutTitle as any).title = undefined

      const result = await TikTokService.exportSettings(settingsWithoutTitle)

      expect(result.title).toBe("Untitled Video")
    })

    it("should handle unknown privacy setting", async () => {
      const settings = {
        ...baseSettings,
        title: "Test",
        privacy: "unknown" as any,
      }

      const result = await TikTokService.exportSettings(settings)

      expect(result.privacy_level).toBe("PUBLIC_TO_EVERYONE")
    })

    it("should set all boolean options correctly", async () => {
      const settings = { ...baseSettings, title: "Test" }

      const result = await TikTokService.exportSettings(settings)

      expect(result.disable_duet).toBe(false)
      expect(result.disable_comment).toBe(false)
      expect(result.disable_stitch).toBe(false)
      expect(result.video_cover_timestamp_ms).toBe(1000)
    })
  })

  describe("validateVideoFile - Extended", () => {
    it("should return multiple errors for invalid file", () => {
      const invalidFile = new File(["content"], "test.avi", { type: "video/avi" })
      Object.defineProperty(invalidFile, "size", { value: 300 * 1024 * 1024 }) // 300MB

      const result = TikTokService.validateVideoFile(invalidFile)

      expect(result).toEqual([
        "Video file size must be less than 287MB",
        "Video format must be MP4, MOV, MPEG, or WebM",
      ])
    })

    it("should accept file at maximum size", () => {
      const validFile = new File(["content"], "test.mp4", { type: "video/mp4" })
      Object.defineProperty(validFile, "size", { value: 286 * 1024 * 1024 }) // 286MB

      const result = TikTokService.validateVideoFile(validFile)

      expect(result).toEqual([])
    })

    it("should accept all supported formats", () => {
      const formats = [
        { type: "video/mp4", name: "test.mp4" },
        { type: "video/mov", name: "test.mov" },
        { type: "video/mpeg", name: "test.mpeg" },
        { type: "video/webm", name: "test.webm" },
      ]

      formats.forEach(({ type, name }) => {
        const file = new File(["content"], name, { type })
        Object.defineProperty(file, "size", { value: 50 * 1024 * 1024 })

        const result = TikTokService.validateVideoFile(file)
        expect(result).toEqual([])
      })
    })
  })

  describe("getOptimalSettings - Extended", () => {
    it("should return immutable settings object", () => {
      const settings1 = TikTokService.getOptimalSettings()
      const settings2 = TikTokService.getOptimalSettings()

      expect(settings1).toEqual(settings2)
      expect(settings1).not.toBe(settings2) // Different objects
    })

    it("should include all expected properties", () => {
      const settings = TikTokService.getOptimalSettings()

      expect(settings).toHaveProperty("resolution", "1080")
      expect(settings).toHaveProperty("frameRate", "30")
      expect(settings).toHaveProperty("format", "Mp4")
      expect(settings).toHaveProperty("quality", "good")
      expect(settings).toHaveProperty("useVerticalResolution", true)
    })
  })

  // API Constants test removed as API_BASE is now private

  describe("Error Handling Edge Cases", () => {
    it("should handle fetch network errors during initialization", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"))

      await expect(TikTokService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow("Network error")
    })

    it("should handle JSON parsing errors", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as any)

      await expect(TikTokService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow("Invalid JSON")
    })

    it("should handle getUserInfo JSON parsing errors", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as any)

      await expect(TikTokService.getUserInfo("token")).rejects.toThrow("Invalid JSON")
    })
  })
})
