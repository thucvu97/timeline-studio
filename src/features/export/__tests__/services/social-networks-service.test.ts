import { beforeEach, describe, expect, it, vi } from "vitest"

import { SocialNetworksService } from "../../services/social-networks-service"

// Мокаем зависимости
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("../../services/oauth-service", () => ({
  OAuthService: {
    loginToNetwork: vi.fn(),
    storeToken: vi.fn(),
    getStoredToken: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}))

vi.mock("../../services/youtube-service", () => ({
  YouTubeService: {
    getUserInfo: vi.fn(),
    validateSettings: vi.fn(),
    exportSettings: vi.fn(),
    uploadVideo: vi.fn(),
  },
}))

vi.mock("../../services/tiktok-service", () => ({
  TikTokService: {
    getUserInfo: vi.fn(),
    validateSettings: vi.fn(),
    exportSettings: vi.fn(),
    uploadVideo: vi.fn(),
    getOptimalSettings: vi.fn(),
    validateVideoFile: vi.fn(),
  },
}))

const { toast } = await import("sonner")
const { OAuthService } = await import("../../services/oauth-service")
const { YouTubeService } = await import("../../services/youtube-service")
const { TikTokService } = await import("../../services/tiktok-service")

describe("SocialNetworksService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe("login", () => {
    it("should successfully log in to a network", async () => {
      const mockToken = { accessToken: "token123", refreshToken: "refresh123" }
      const mockUserInfo = { name: "Test User", id: "user123" }

      vi.mocked(OAuthService.loginToNetwork).mockResolvedValue(mockToken)
      vi.mocked(YouTubeService.getUserInfo).mockResolvedValue(mockUserInfo)

      const result = await SocialNetworksService.login("youtube")

      expect(result).toBe(true)
      expect(toast.info).toHaveBeenCalledWith("Connecting to youtube...")
      expect(toast.success).toHaveBeenCalledWith("Successfully connected to youtube")
      expect(OAuthService.storeToken).toHaveBeenCalledWith("youtube", mockToken)
      expect(localStorage.getItem("youtube_user_info")).toBe(JSON.stringify(mockUserInfo))
    })

    it("should handle authentication failure", async () => {
      vi.mocked(OAuthService.loginToNetwork).mockResolvedValue(null)

      const result = await SocialNetworksService.login("youtube")

      expect(result).toBe(false)
      expect(toast.error).toHaveBeenCalledWith("Failed to connect to youtube: Authentication failed")
    })

    it("should handle network errors", async () => {
      vi.mocked(OAuthService.loginToNetwork).mockRejectedValue(new Error("Network error"))

      const result = await SocialNetworksService.login("youtube")

      expect(result).toBe(false)
      expect(toast.error).toHaveBeenCalledWith("Failed to connect to youtube: Network error")
    })
  })

  describe("logout", () => {
    it("should logout from network", () => {
      SocialNetworksService.logout("youtube")

      expect(OAuthService.logout).toHaveBeenCalledWith("youtube")
      expect(toast.info).toHaveBeenCalledWith("Disconnected from youtube")
    })
  })

  describe("isLoggedIn", () => {
    it("should return true if token exists", () => {
      vi.mocked(OAuthService.getStoredToken).mockReturnValue({ accessToken: "token" })

      const result = SocialNetworksService.isLoggedIn("youtube")

      expect(result).toBe(true)
    })

    it("should return false if no token", () => {
      vi.mocked(OAuthService.getStoredToken).mockReturnValue(null)

      const result = SocialNetworksService.isLoggedIn("youtube")

      expect(result).toBe(false)
    })
  })

  describe("getUserInfo", () => {
    it("should get YouTube user info", async () => {
      const mockUserInfo = { name: "YouTube User" }
      vi.mocked(YouTubeService.getUserInfo).mockResolvedValue(mockUserInfo)

      const result = await SocialNetworksService.getUserInfo("youtube", "token")

      expect(result).toBe(mockUserInfo)
      expect(YouTubeService.getUserInfo).toHaveBeenCalledWith("token")
    })

    it("should get TikTok user info", async () => {
      const mockUserInfo = { display_name: "TikTok User" }
      vi.mocked(TikTokService.getUserInfo).mockResolvedValue(mockUserInfo)

      const result = await SocialNetworksService.getUserInfo("tiktok", "token")

      expect(result).toBe(mockUserInfo)
      expect(TikTokService.getUserInfo).toHaveBeenCalledWith("token")
    })

    it("should throw error for unsupported network", async () => {
      try {
        await SocialNetworksService.getUserInfo("unknown", "token")
        expect.fail("Expected method to throw")
      } catch (error) {
        expect((error as Error).message).toBe("User info not implemented for unknown")
      }
    })
  })

  describe("getStoredUserInfo", () => {
    it("should return stored user info", () => {
      const mockUserInfo = { name: "Stored User" }
      localStorage.setItem("youtube_user_info", JSON.stringify(mockUserInfo))

      const result = SocialNetworksService.getStoredUserInfo("youtube")

      expect(result).toEqual(mockUserInfo)
    })

    it("should return null if no stored info", () => {
      const result = SocialNetworksService.getStoredUserInfo("youtube")

      expect(result).toBeNull()
    })

    it("should return null if stored info is invalid JSON", () => {
      localStorage.setItem("youtube_user_info", "invalid-json")

      const result = SocialNetworksService.getStoredUserInfo("youtube")

      expect(result).toBeNull()
    })
  })

  describe("uploadVideo", () => {
    const mockVideoFile = new File(["video content"], "test.mp4", { type: "video/mp4" })
    const mockSettings = {
      fileName: "test",
      savePath: "",
      format: "Mp4" as const,
      quality: "good" as const,
      resolution: "1080",
      frameRate: "30",
      enableGPU: true,
      socialNetwork: "youtube",
      isLoggedIn: true,
      title: "Test Video",
    }

    beforeEach(() => {
      vi.mocked(OAuthService.getStoredToken).mockReturnValue({ accessToken: "token" })
    })

    it("should successfully upload to YouTube", async () => {
      const mockMetadata = { title: "Test Video" }
      const mockUploadResult = { id: "video123", url: "https://youtube.com/watch?v=video123" }

      vi.mocked(YouTubeService.validateSettings).mockReturnValue([])
      vi.mocked(YouTubeService.exportSettings).mockResolvedValue(mockMetadata)
      vi.mocked(YouTubeService.uploadVideo).mockResolvedValue(mockUploadResult)

      const result = await SocialNetworksService.uploadVideo("youtube", mockVideoFile, mockSettings)

      expect(result).toEqual({
        success: true,
        url: "https://youtube.com/watch?v=video123",
        id: "video123",
      })
    })

    it("should successfully upload to TikTok", async () => {
      const mockSettings2 = { ...mockSettings, socialNetwork: "tiktok" }
      const mockMetadata = { title: "Test Video" }
      const mockUploadResult = { publish_id: "tiktok123", share_url: "https://tiktok.com/@user/video/tiktok123" }

      vi.mocked(TikTokService.validateSettings).mockReturnValue([])
      vi.mocked(TikTokService.exportSettings).mockResolvedValue(mockMetadata)
      vi.mocked(TikTokService.uploadVideo).mockResolvedValue(mockUploadResult)

      const result = await SocialNetworksService.uploadVideo("tiktok", mockVideoFile, mockSettings2)

      expect(result).toEqual({
        success: true,
        url: "https://tiktok.com/@user/video/tiktok123",
        id: "tiktok123",
      })
    })

    it("should handle not logged in error", async () => {
      vi.mocked(OAuthService.getStoredToken).mockReturnValue(null)

      const result = await SocialNetworksService.uploadVideo("youtube", mockVideoFile, mockSettings)

      expect(result).toEqual({
        success: false,
        error: "Not logged in to youtube",
      })
    })

    it("should handle validation errors", async () => {
      vi.mocked(YouTubeService.validateSettings).mockReturnValue(["Title is required"])

      const result = await SocialNetworksService.uploadVideo("youtube", mockVideoFile, mockSettings)

      expect(result).toEqual({
        success: false,
        error: "Validation failed: Title is required",
      })
    })

    it("should handle unsupported network", async () => {
      const result = await SocialNetworksService.uploadVideo("unknown", mockVideoFile, mockSettings)

      expect(result).toEqual({
        success: false,
        error: "Upload not implemented for unknown",
      })
    })

    it("should handle upload errors", async () => {
      vi.mocked(YouTubeService.validateSettings).mockReturnValue([])
      vi.mocked(YouTubeService.exportSettings).mockRejectedValue(new Error("Upload failed"))

      const result = await SocialNetworksService.uploadVideo("youtube", mockVideoFile, mockSettings)

      expect(result).toEqual({
        success: false,
        error: "Upload failed",
      })
    })
  })

  describe("validateSettings", () => {
    const mockSettings = {
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

    it("should validate YouTube settings", () => {
      const mockErrors = ["Title is required"]
      vi.mocked(YouTubeService.validateSettings).mockReturnValue(mockErrors)

      const result = SocialNetworksService.validateSettings("youtube", mockSettings)

      expect(result).toBe(mockErrors)
      expect(YouTubeService.validateSettings).toHaveBeenCalledWith(mockSettings)
    })

    it("should validate TikTok settings", () => {
      const mockErrors = ["Description too long"]
      vi.mocked(TikTokService.validateSettings).mockReturnValue(mockErrors)

      const result = SocialNetworksService.validateSettings("tiktok", mockSettings)

      expect(result).toBe(mockErrors)
      expect(TikTokService.validateSettings).toHaveBeenCalledWith(mockSettings)
    })

    it("should return empty array for unknown network", () => {
      const result = SocialNetworksService.validateSettings("unknown", mockSettings)

      expect(result).toEqual([])
    })
  })

  describe("getOptimalSettings", () => {
    it("should return YouTube optimal settings", () => {
      const result = SocialNetworksService.getOptimalSettings("youtube")

      expect(result).toEqual({
        resolution: "1080",
        frameRate: "30",
        format: "Mp4",
        quality: "good",
      })
    })

    it("should return TikTok optimal settings", () => {
      const mockSettings = { resolution: "1080", useVerticalResolution: true }
      vi.mocked(TikTokService.getOptimalSettings).mockReturnValue(mockSettings)

      const result = SocialNetworksService.getOptimalSettings("tiktok")

      expect(result).toBe(mockSettings)
    })

    it("should return Telegram optimal settings", () => {
      const result = SocialNetworksService.getOptimalSettings("telegram")

      expect(result).toEqual({
        resolution: "720",
        frameRate: "30",
        format: "Mp4",
        quality: "normal",
      })
    })

    it("should return empty object for unknown network", () => {
      const result = SocialNetworksService.getOptimalSettings("unknown")

      expect(result).toEqual({})
    })
  })

  describe("refreshTokenIfNeeded", () => {
    it("should return false if no token", async () => {
      vi.mocked(OAuthService.getStoredToken).mockReturnValue(null)

      const result = await SocialNetworksService.refreshTokenIfNeeded("youtube")

      expect(result).toBe(false)
    })

    it("should return false if no refresh token", async () => {
      vi.mocked(OAuthService.getStoredToken).mockReturnValue({ accessToken: "token" })

      const result = await SocialNetworksService.refreshTokenIfNeeded("youtube")

      expect(result).toBe(false)
    })

    it("should return true if token is still valid", async () => {
      const futureTime = Date.now() + 10 * 60 * 1000 // 10 минут в будущем
      vi.mocked(OAuthService.getStoredToken).mockReturnValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: futureTime,
      })

      const result = await SocialNetworksService.refreshTokenIfNeeded("youtube")

      expect(result).toBe(true)
    })

    it("should refresh token if near expiration", async () => {
      const nearExpiration = Date.now() + 2 * 60 * 1000 // 2 минуты в будущем
      const newToken = { accessToken: "newToken", refreshToken: "newRefresh" }

      vi.mocked(OAuthService.getStoredToken).mockReturnValue({
        accessToken: "oldToken",
        refreshToken: "refresh",
        expiresAt: nearExpiration,
      })
      vi.mocked(OAuthService.refreshToken).mockResolvedValue(newToken)

      const result = await SocialNetworksService.refreshTokenIfNeeded("youtube")

      expect(result).toBe(true)
      expect(OAuthService.refreshToken).toHaveBeenCalledWith("youtube", "refresh")
      expect(OAuthService.storeToken).toHaveBeenCalledWith("youtube", newToken)
    })

    it("should logout on refresh failure", async () => {
      const nearExpiration = Date.now() + 2 * 60 * 1000
      vi.mocked(OAuthService.getStoredToken).mockReturnValue({
        accessToken: "oldToken",
        refreshToken: "refresh",
        expiresAt: nearExpiration,
      })
      vi.mocked(OAuthService.refreshToken).mockRejectedValue(new Error("Refresh failed"))

      const logoutSpy = vi.spyOn(SocialNetworksService, "logout")

      const result = await SocialNetworksService.refreshTokenIfNeeded("youtube")

      expect(result).toBe(false)
      expect(logoutSpy).toHaveBeenCalledWith("youtube")
    })
  })

  describe("validateVideoFile", () => {
    it("should return error for no file", async () => {
      const result = await SocialNetworksService.validateVideoFile("youtube", null as any)

      expect(result).toEqual(["No video file selected"])
    })

    it("should return error for non-video file", async () => {
      const textFile = new File(["text"], "test.txt", { type: "text/plain" })

      const result = await SocialNetworksService.validateVideoFile("youtube", textFile)

      expect(result).toEqual(["Selected file is not a video"])
    })

    it("should validate TikTok video file", async () => {
      const videoFile = new File(["video"], "test.mp4", { type: "video/mp4" })
      const mockErrors = ["File too large"]
      vi.mocked(TikTokService.validateVideoFile).mockReturnValue(mockErrors)

      const result = await SocialNetworksService.validateVideoFile("tiktok", videoFile)

      expect(result).toEqual(mockErrors)
      expect(TikTokService.validateVideoFile).toHaveBeenCalledWith(videoFile)
    })

    it("should validate YouTube file size", async () => {
      // Создаем большой файл (больше 256GB)
      const largeFile = new File(["video"], "large.mp4", { type: "video/mp4" })
      Object.defineProperty(largeFile, "size", {
        value: 257 * 1024 * 1024 * 1024, // 257GB
        writable: false,
      })

      const result = await SocialNetworksService.validateVideoFile("youtube", largeFile)

      expect(result).toEqual(["Video file size must be less than 256GB"])
    })

    it("should validate Telegram file size", async () => {
      // Создаем большой файл (больше 2GB)
      const largeFile = new File(["video"], "large.mp4", { type: "video/mp4" })
      Object.defineProperty(largeFile, "size", {
        value: 3 * 1024 * 1024 * 1024, // 3GB
        writable: false,
      })

      const result = await SocialNetworksService.validateVideoFile("telegram", largeFile)

      expect(result).toEqual(["Video file size must be less than 2GB"])
    })

    it("should return no errors for valid file", async () => {
      const videoFile = new File(["video"], "test.mp4", { type: "video/mp4" })

      const result = await SocialNetworksService.validateVideoFile("youtube", videoFile)

      expect(result).toEqual([])
    })
  })
})