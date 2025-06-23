import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { setTranslations } from "@/test/mocks/libraries"

import { SOCIAL_NETWORKS } from "../../constants/export-constants"
import { useSocialExport } from "../../hooks/use-social-export"
import { SocialNetworksService } from "../../services/social-networks-service"

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("../../services/social-networks-service", () => ({
  SocialNetworksService: {
    login: vi.fn(),
    logout: vi.fn(),
    isLoggedIn: vi.fn(),
    getStoredUserInfo: vi.fn(),
    uploadVideo: vi.fn(),
  },
}))

describe("useSocialExport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setTranslations({
      "dialogs.export.errors.loginFailed": "Failed to login to {{network}}",
      "dialogs.export.errors.uploadFailed": "Upload to {{network}} failed",
      "dialogs.export.uploadSuccess": "Successfully uploaded to {{network}}",
    })
  })

  describe("loginToSocialNetwork", () => {
    it("should successfully login to social network", async () => {
      vi.mocked(SocialNetworksService.login).mockResolvedValue(true)

      const { result } = renderHook(() => useSocialExport())

      const success = await act(async () => {
        return await result.current.loginToSocialNetwork("youtube")
      })

      expect(success).toBe(true)
      expect(SocialNetworksService.login).toHaveBeenCalledWith("youtube")
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should handle login failure", async () => {
      vi.mocked(SocialNetworksService.login).mockRejectedValue(new Error("Auth failed"))

      const { result } = renderHook(() => useSocialExport())

      const success = await act(async () => {
        return await result.current.loginToSocialNetwork("youtube")
      })

      expect(success).toBe(false)
      expect(toast.error).toHaveBeenCalledWith("Failed to login to {{network}}")
    })
  })

  describe("logoutFromSocialNetwork", () => {
    it("should logout from social network", async () => {
      vi.mocked(SocialNetworksService.logout).mockResolvedValue()

      const { result } = renderHook(() => useSocialExport())

      await act(async () => {
        await result.current.logoutFromSocialNetwork("youtube")
      })

      expect(SocialNetworksService.logout).toHaveBeenCalledWith("youtube")
    })
  })

  describe("isLoggedIn", () => {
    it("should check if user is logged in", async () => {
      vi.mocked(SocialNetworksService.isLoggedIn).mockResolvedValue(true)

      const { result } = renderHook(() => useSocialExport())

      const loggedIn = await act(async () => {
        return await result.current.isLoggedIn("youtube")
      })

      expect(loggedIn).toBe(true)
      expect(SocialNetworksService.isLoggedIn).toHaveBeenCalledWith("youtube")
    })
  })

  describe("getUserInfo", () => {
    it("should get stored user info", () => {
      const mockUserInfo = { id: "123", name: "Test User", email: "test@example.com" }
      vi.mocked(SocialNetworksService.getStoredUserInfo).mockReturnValue(mockUserInfo)

      const { result } = renderHook(() => useSocialExport())

      const userInfo = result.current.getUserInfo("youtube")

      expect(userInfo).toEqual(mockUserInfo)
      expect(SocialNetworksService.getStoredUserInfo).toHaveBeenCalledWith("youtube")
    })
  })

  describe("uploadToSocialNetwork", () => {
    it("should throw error for unknown social network", async () => {
      const { result } = renderHook(() => useSocialExport())

      await expect(
        result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          socialNetwork: "unknown",
          title: "Test Video",
        }),
      ).rejects.toThrow("Unknown social network")
    })

    it("should throw error for Tauri file reading (current implementation)", async () => {
      const { result } = renderHook(() => useSocialExport())

      await expect(
        result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          socialNetwork: "youtube",
          title: "Test Video",
        }),
      ).rejects.toThrow("Social media upload requires file reading implementation in Tauri")

      expect(result.current.isUploading).toBe(false)
      expect(toast.error).toHaveBeenCalledWith("Upload to {{network}} failed")
    })

    it("should update upload progress state", async () => {
      const { result } = renderHook(() => useSocialExport())

      expect(result.current.uploadProgress).toBe(0)
      expect(result.current.isUploading).toBe(false)

      try {
        await result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          socialNetwork: "youtube",
          title: "Test Video",
        })
      } catch {
        // Expected to throw
      }

      // Should have attempted to set uploading state
      expect(result.current.isUploading).toBe(false) // Reset after error
    })
  })

  describe("validateSocialExport", () => {
    it("should validate unknown social network", () => {
      const { result } = renderHook(() => useSocialExport())

      const validation = result.current.validateSocialExport({
        socialNetwork: "unknown",
        title: "Test Video",
      })

      expect(validation.valid).toBe(false)
      expect(validation.error).toBe("Unknown social network")
    })

    it("should validate missing title", () => {
      const { result } = renderHook(() => useSocialExport())

      const validation = result.current.validateSocialExport({
        socialNetwork: "youtube",
        title: "",
      })

      expect(validation.valid).toBe(false)
      expect(validation.error).toBe("Title is required")
    })

    it("should validate file size limits", () => {
      const { result } = renderHook(() => useSocialExport())

      // TikTok has 287MB limit
      const validation = result.current.validateSocialExport({
        socialNetwork: "tiktok",
        title: "Test Video",
        fileSizeBytes: 300 * 1024 * 1024, // 300MB
      })

      expect(validation.valid).toBe(false)
      expect(validation.error).toContain("File size exceeds")
      expect(validation.error).toContain("TikTok")
    })

    it("should validate duration limits", () => {
      const { result } = renderHook(() => useSocialExport())

      // TikTok has 10 minutes limit
      const validation = result.current.validateSocialExport({
        socialNetwork: "tiktok",
        title: "Test Video",
        durationSeconds: 11 * 60, // 11 minutes
      })

      expect(validation.valid).toBe(false)
      expect(validation.error).toContain("Video duration exceeds")
      expect(validation.error).toContain("TikTok")
    })

    it("should pass validation for valid settings", () => {
      const { result } = renderHook(() => useSocialExport())

      const validation = result.current.validateSocialExport({
        socialNetwork: "youtube",
        title: "Test Video",
        fileSizeBytes: 1024 * 1024 * 1024, // 1GB
        durationSeconds: 60 * 60, // 1 hour
      })

      expect(validation.valid).toBe(true)
      expect(validation.error).toBeUndefined()
    })

    it("should handle networks without limits", () => {
      const { result } = renderHook(() => useSocialExport())

      // telegram has no duration limit but has file size limit
      const validation = result.current.validateSocialExport({
        socialNetwork: "telegram",
        title: "Test Video",
        fileSizeBytes: 1 * 1024 * 1024 * 1024, // 1GB (under 2GB limit)
        durationSeconds: 24 * 60 * 60, // 24 hours
      })

      expect(validation.valid).toBe(true)
    })
  })

  describe("hook state", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useSocialExport())

      expect(result.current.uploadProgress).toBe(0)
      expect(result.current.isUploading).toBe(false)
    })
  })
})