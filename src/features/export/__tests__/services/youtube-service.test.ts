import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock OAuth service
vi.mock("../../services/oauth-service", () => ({
  OAuthService: {
    getStoredToken: vi.fn(),
  },
}))

// Import after mocking
const { YouTubeService } = await import("../../services/youtube-service")
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
  responseText = JSON.stringify({ id: "test_video_id", status: { uploadStatus: "uploaded" } })
  
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

describe("YouTubeService - Comprehensive", () => {
  const mockToken = {
    accessToken: "test_youtube_access_token",
    refreshToken: "test_refresh_token",
    expiresIn: 3600,
    tokenType: "Bearer",
  }

  const mockVideoFile = new File(["video content"], "test.mp4", { type: "video/mp4" })
  Object.defineProperty(mockVideoFile, "size", { value: 50 * 1024 * 1024 }) // 50MB

  const mockMetadata = {
    title: "Test YouTube Video",
    description: "Test description",
    tags: ["test", "video"],
    privacy: "private" as const,
  }

  const baseSettings = {
    fileName: "test",
    savePath: "",
    format: "Mp4" as const,
    quality: "good" as const,
    resolution: "1080",
    frameRate: "30",
    enableGPU: true,
    socialNetwork: "youtube",
    isLoggedIn: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(OAuthService.getStoredToken).mockResolvedValue(mockToken)
  })

  describe("uploadVideo - Full Flow", () => {
    it("should complete full upload flow successfully", async () => {
      const progressCallback = vi.fn()
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, mockMetadata, progressCallback)

      // Simulate successful upload
      setTimeout(() => {
        xhrInstance.triggerProgress(25 * 1024 * 1024, 50 * 1024 * 1024) // 50% progress
        xhrInstance.triggerProgress(50 * 1024 * 1024, 50 * 1024 * 1024) // 100% progress
        xhrInstance.triggerLoad()
      }, 10)

      const result = await uploadPromise

      expect(result).toEqual({
        id: "test_video_id",
        url: "https://www.youtube.com/watch?v=test_video_id",
        status: "uploaded",
      })

      expect(progressCallback).toHaveBeenCalledWith(50)
      expect(progressCallback).toHaveBeenCalledWith(100)
    })

    it("should throw error when not authenticated", async () => {
      vi.mocked(OAuthService.getStoredToken).mockResolvedValue(null)

      await expect(YouTubeService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow(
        "Not authenticated with YouTube"
      )
    })

    it("should handle upload failure", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      xhrInstance.status = 400
      xhrInstance.statusText = "Bad Request"
      xhrInstance.responseText = JSON.stringify({
        error: { message: "Invalid video format" }
      })
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await expect(uploadPromise).rejects.toThrow("HTTP 400: Bad Request")
    })

    it("should handle upload failure without error message", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      xhrInstance.status = 500
      xhrInstance.statusText = "Internal Server Error"
      xhrInstance.responseText = JSON.stringify({})
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await expect(uploadPromise).rejects.toThrow("HTTP 500: Internal Server Error")
    })

    it("should handle network error during upload", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerError()
      }, 10)

      await expect(uploadPromise).rejects.toThrow("Network error during upload")
    })

    it("should handle HTTP errors", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      xhrInstance.status = 500
      xhrInstance.statusText = "Internal Server Error"
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await expect(uploadPromise).rejects.toThrow("HTTP 500: Internal Server Error")
    })

    it("should upload with thumbnail", async () => {
      const metadataWithThumbnail = {
        ...mockMetadata,
        thumbnail: "https://example.com/thumbnail.jpg",
      }

      // Mock thumbnail fetch first
      vi.mocked(fetch).mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(["thumbnail"], { type: "image/jpeg" })),
      } as any)
      
      // Mock thumbnail upload second
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("success"),
      } as any)

      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, metadataWithThumbnail)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      const result = await uploadPromise

      expect(result.id).toBe("test_video_id")
      expect(fetch).toHaveBeenNthCalledWith(1, "https://example.com/thumbnail.jpg")
      expect(fetch).toHaveBeenNthCalledWith(2,
        "https://www.googleapis.com/youtube/v3/thumbnails/set?videoId=test_video_id&uploadType=media",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test_youtube_access_token",
          },
          body: expect.any(FormData),
        })
      )
    })

    it("should handle thumbnail upload failure gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      
      const metadataWithThumbnail = {
        ...mockMetadata,
        thumbnail: "https://example.com/thumbnail.jpg",
      }

      // Mock thumbnail fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(["thumbnail"], { type: "image/jpeg" })),
      } as any)
      
      // Mock thumbnail upload failure
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("thumbnail upload failed"),
      } as any)

      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, metadataWithThumbnail)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      const result = await uploadPromise

      expect(result.id).toBe("test_video_id")
      expect(consoleSpy).toHaveBeenCalledWith("Failed to upload thumbnail:", "thumbnail upload failed")
      
      consoleSpy.mockRestore()
    })

    it("should handle thumbnail fetch failure gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      
      const metadataWithThumbnail = {
        ...mockMetadata,
        thumbnail: "https://example.com/thumbnail.jpg",
      }

      // Mock thumbnail fetch failure
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"))

      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, metadataWithThumbnail)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      const result = await uploadPromise

      expect(result.id).toBe("test_video_id")
      expect(consoleSpy).toHaveBeenCalledWith("Thumbnail upload failed:", expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it("should log and re-throw upload errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      // Create an XMLHttpRequest that will throw an error
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockImplementation(() => {
        throw new Error("XMLHttpRequest creation failed")
      })

      await expect(YouTubeService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow(
        "XMLHttpRequest creation failed"
      )

      expect(consoleSpy).toHaveBeenCalledWith("YouTube upload error:", expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe("uploadWithProgress", () => {
    it("should configure XMLHttpRequest correctly", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const formData = new FormData()
      formData.append("test", "data")
      const progressCallback = vi.fn()

      const uploadPromise = (YouTubeService as any).uploadWithProgress(
        "https://api.example.com/upload",
        formData,
        "test_token",
        progressCallback
      )

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await uploadPromise

      expect(xhrInstance.open).toHaveBeenCalledWith("POST", "https://api.example.com/upload")
      expect(xhrInstance.setRequestHeader).toHaveBeenCalledWith("Authorization", "Bearer test_token")
      expect(xhrInstance.send).toHaveBeenCalledWith(formData)
    })

    it("should handle progress events correctly", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const progressCallback = vi.fn()
      const formData = new FormData()

      const uploadPromise = (YouTubeService as any).uploadWithProgress(
        "https://api.example.com/upload",
        formData,
        "test_token",
        progressCallback
      )

      setTimeout(() => {
        xhrInstance.triggerProgress(1024, 2048) // 50%
        xhrInstance.triggerProgress(2048, 2048) // 100%
        xhrInstance.triggerLoad()
      }, 10)

      await uploadPromise

      expect(progressCallback).toHaveBeenCalledWith(50)
      expect(progressCallback).toHaveBeenCalledWith(100)
    })

    it("should not call progress callback when event is not computable", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const progressCallback = vi.fn()
      const formData = new FormData()

      const uploadPromise = (YouTubeService as any).uploadWithProgress(
        "https://api.example.com/upload",
        formData,
        "test_token",
        progressCallback
      )

      setTimeout(() => {
        // Trigger progress with lengthComputable: false
        const progressHandler = xhrInstance.upload.addEventListener.mock.calls.find(
          ([event]) => event === "progress"
        )?.[1]
        if (progressHandler) {
          progressHandler({ lengthComputable: false, loaded: 1024, total: 2048 })
        }
        xhrInstance.triggerLoad()
      }, 10)

      await uploadPromise

      expect(progressCallback).not.toHaveBeenCalled()
    })

    it("should work without progress callback", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const formData = new FormData()
      const uploadPromise = (YouTubeService as any).uploadWithProgress(
        "https://api.example.com/upload",
        formData,
        "test_token"
      )

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      const response = await uploadPromise
      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it("should return Response object with correct data", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      xhrInstance.responseText = JSON.stringify({ success: true })
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const formData = new FormData()
      const uploadPromise = (YouTubeService as any).uploadWithProgress(
        "https://api.example.com/upload",
        formData,
        "test_token"
      )

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      const response = await uploadPromise
      const data = await response.json()

      expect(data).toEqual({ success: true })
    })
  })

  describe("Video Resource Creation", () => {
    it("should create video resource with default values", async () => {
      const minimalMetadata = { title: "Test Video" }
      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, minimalMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await uploadPromise

      const formDataCall = xhrInstance.send.mock.calls[0][0] as FormData
      const metadataString = formDataCall.get("metadata") as string
      const metadata = JSON.parse(metadataString)

      expect(metadata.snippet).toEqual({
        title: "Test Video",
        description: "",
        tags: [],
        categoryId: "22", // People & Blogs default
        defaultLanguage: "en",
      })

      expect(metadata.status).toEqual({
        privacyStatus: "private",
        embeddable: true,
        license: "youtube",
      })
    })

    it("should create video resource with all metadata", async () => {
      const fullMetadata = {
        title: "Full Test Video",
        description: "Full description",
        tags: ["tag1", "tag2"],
        categoryId: "24",
        privacy: "public" as const,
        language: "ru",
      }

      const xhrInstance = new MockXMLHttpRequest()
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, fullMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await uploadPromise

      const formDataCall = xhrInstance.send.mock.calls[0][0] as FormData
      const metadataString = formDataCall.get("metadata") as string
      const metadata = JSON.parse(metadataString)

      expect(metadata.snippet).toEqual({
        title: "Full Test Video",
        description: "Full description",
        tags: ["tag1", "tag2"],
        categoryId: "24",
        defaultLanguage: "ru",
      })

      expect(metadata.status.privacyStatus).toBe("public")
    })
  })

  describe("getUserInfo", () => {
    const mockUserInfo = {
      snippet: {
        title: "Test Channel",
        description: "Test channel description",
        thumbnails: { default: { url: "https://example.com/avatar.jpg" } },
      },
    }

    it("should get user info with provided token", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [mockUserInfo] }),
      } as any)

      const result = await YouTubeService.getUserInfo("custom_token")

      expect(fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: {
            Authorization: "Bearer custom_token",
          },
        }
      )

      expect(result).toEqual(mockUserInfo)
    })

    it("should get user info with stored token", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [mockUserInfo] }),
      } as any)

      const result = await YouTubeService.getUserInfo()

      expect(OAuthService.getStoredToken).toHaveBeenCalledWith("youtube")
      expect(fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: {
            Authorization: "Bearer test_youtube_access_token",
          },
        }
      )

      expect(result).toEqual(mockUserInfo)
    })

    it("should throw error when no token available", async () => {
      vi.mocked(OAuthService.getStoredToken).mockResolvedValue(null)

      await expect(YouTubeService.getUserInfo()).rejects.toThrow("Not authenticated")
    })

    it("should throw error when API request fails", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as any)

      await expect(YouTubeService.getUserInfo("invalid_token")).rejects.toThrow(
        "Failed to get user info"
      )
    })

    it("should handle missing items in response", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}), // No items field
      } as any)

      const result = await YouTubeService.getUserInfo("test_token")

      expect(result).toBeUndefined()
    })

    it("should handle empty items array", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as any)

      const result = await YouTubeService.getUserInfo("test_token")

      expect(result).toBeUndefined()
    })
  })

  describe("getVideoCategories", () => {
    const mockCategories = [
      { id: "1", snippet: { title: "Film & Animation" } },
      { id: "2", snippet: { title: "Autos & Vehicles" } },
    ]

    it("should get video categories with default region", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: mockCategories }),
      } as any)

      const result = await YouTubeService.getVideoCategories()

      expect(fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US",
        {
          headers: {
            Authorization: "Bearer test_youtube_access_token",
          },
        }
      )

      expect(result).toEqual(mockCategories)
    })

    it("should get video categories with custom region", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: mockCategories }),
      } as any)

      const result = await YouTubeService.getVideoCategories("RU")

      expect(fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=RU",
        expect.any(Object)
      )

      expect(result).toEqual(mockCategories)
    })

    it("should return empty array when not authenticated", async () => {
      vi.mocked(OAuthService.getStoredToken).mockResolvedValue(null)

      const result = await YouTubeService.getVideoCategories()

      expect(result).toEqual([])
      expect(fetch).not.toHaveBeenCalled()
    })

    it("should return empty array when API fails", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
      } as any)

      const result = await YouTubeService.getVideoCategories()

      expect(result).toEqual([])
    })

    it("should return empty array when network error occurs", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"))

      const result = await YouTubeService.getVideoCategories()

      expect(result).toEqual([])
    })

    it("should handle missing items in response", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}), // No items field
      } as any)

      const result = await YouTubeService.getVideoCategories()

      expect(result).toEqual([])
    })
  })

  describe("validateSettings", () => {
    it("should return error for missing title", () => {
      const settings = { ...baseSettings, title: "" }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual(["Title is required"])
    })

    it("should return error for whitespace-only title", () => {
      const settings = { ...baseSettings, title: "   " }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual(["Title is required"])
    })

    it("should return error for title too long", () => {
      const settings = { ...baseSettings, title: "a".repeat(101) }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual(["Title must be 100 characters or less"])
    })

    it("should return error for description too long", () => {
      const settings = { ...baseSettings, title: "Test", description: "a".repeat(5001) }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual(["Description must be 5000 characters or less"])
    })

    it("should return error for too many tags", () => {
      const settings = { ...baseSettings, title: "Test", tags: "a".repeat(501) }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual(["Too many tags (maximum 500)"])
    })

    it("should return multiple errors for invalid settings", () => {
      const invalidSettings = {
        ...baseSettings,
        title: "", // Missing title
        description: "a".repeat(5001), // Too long description
        tags: "a".repeat(501), // Too many tags
      }

      const result = YouTubeService.validateSettings(invalidSettings)

      expect(result).toEqual([
        "Title is required",
        "Description must be 5000 characters or less",
        "Too many tags (maximum 500)",
      ])
    })

    it("should return no errors for valid settings", () => {
      const validSettings = {
        ...baseSettings,
        title: "Valid YouTube Title",
        description: "Valid description for YouTube",
        tags: "valid,tags,here",
      }

      const result = YouTubeService.validateSettings(validSettings)

      expect(result).toEqual([])
    })

    it("should accept title at maximum length", () => {
      const settings = { ...baseSettings, title: "a".repeat(100) }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should accept description at maximum length", () => {
      const settings = {
        ...baseSettings,
        title: "Valid Title",
        description: "a".repeat(5000),
      }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should accept tags at maximum length", () => {
      const settings = {
        ...baseSettings,
        title: "Valid Title",
        tags: "a".repeat(500),
      }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should handle undefined optional fields", () => {
      const settings = { ...baseSettings, title: "Valid Title" }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual([])
    })
  })

  describe("exportSettings", () => {
    it("should export settings with all fields", async () => {
      const settings = {
        ...baseSettings,
        title: "Test YouTube Video",
        description: "Test description",
        tags: "tag1,tag2,tag3",
        privacy: "public" as const,
        language: "ru",
        thumbnail: "https://example.com/thumb.jpg",
      }

      const result = await YouTubeService.exportSettings(settings)

      expect(result).toEqual({
        title: "Test YouTube Video",
        description: "Test description",
        tags: "tag1,tag2,tag3",
        privacy: "public",
        language: "ru",
        thumbnail: "https://example.com/thumb.jpg",
      })
    })

    it("should handle default title when title is missing", async () => {
      const settingsWithoutTitle = { ...baseSettings }
      delete (settingsWithoutTitle as any).title

      const result = await YouTubeService.exportSettings(settingsWithoutTitle)

      expect(result.title).toBe("Untitled Video")
    })

    it("should handle default privacy and language", async () => {
      const settings = { ...baseSettings, title: "Test Video" }

      const result = await YouTubeService.exportSettings(settings)

      expect(result.privacy).toBe("private")
      expect(result.language).toBe("en")
    })

    it("should handle undefined optional fields", async () => {
      const settings = { ...baseSettings, title: "Test Video" }

      const result = await YouTubeService.exportSettings(settings)

      expect(result.description).toBeUndefined()
      expect(result.tags).toBeUndefined()
      expect(result.thumbnail).toBeUndefined()
    })
  })

  describe("API Constants", () => {
    it("should use correct API base URL", () => {
      expect((YouTubeService as any).API_BASE).toBe("https://www.googleapis.com/youtube/v3")
    })
  })

  describe("Error Handling Edge Cases", () => {
    it("should handle JSON parsing errors in upload response", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      xhrInstance.responseText = "invalid json"
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      await expect(uploadPromise).rejects.toThrow()
    })

    it("should handle missing status in upload response", async () => {
      const xhrInstance = new MockXMLHttpRequest()
      xhrInstance.responseText = JSON.stringify({ id: "test_video_id" }) // No status field
      vi.mocked(XMLHttpRequest).mockReturnValue(xhrInstance as any)

      const uploadPromise = YouTubeService.uploadVideo(mockVideoFile, mockMetadata)

      setTimeout(() => {
        xhrInstance.triggerLoad()
      }, 10)

      const result = await uploadPromise

      expect(result).toEqual({
        id: "test_video_id",
        url: "https://www.youtube.com/watch?v=test_video_id",
        status: "uploaded", // Default fallback
      })
    })

    it("should handle getUserInfo JSON parsing errors", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as any)

      await expect(YouTubeService.getUserInfo("token")).rejects.toThrow("Invalid JSON")
    })

    it("should handle getVideoCategories JSON parsing errors", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as any)

      const result = await YouTubeService.getVideoCategories()

      expect(result).toEqual([])
    })
  })
})