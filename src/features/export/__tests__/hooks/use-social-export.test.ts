import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setTranslations } from "@/test/mocks/libraries"

// Mock sonner before importing the hook
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Now import the module after mocking
const { toast } = await import("sonner")
const { useSocialExport } = await import("../../hooks/use-social-export")

describe("useSocialExport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up translations for this test suite
    setTranslations({
      "dialogs.export.oauth.youtube": "Opening YouTube OAuth...",
      "dialogs.export.oauth.tiktok": "Opening TikTok OAuth...",
      "dialogs.export.oauth.telegram": "Opening Telegram OAuth...",
      "dialogs.export.errors.loginFailed": "Failed to login to",
      "dialogs.export.errors.titleRequired": "Title is required",
      "dialogs.export.errors.titleTooLong": "Title is too long",
      "dialogs.export.errors.descriptionTooLong": "Description is too long",
      "dialogs.export.errors.notLoggedIn": "Not logged in",
      "dialogs.export.uploadSuccess": "Successfully uploaded to",
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("loginToSocialNetwork", () => {
    it("should show info toast for YouTube login", async () => {
      const { result } = renderHook(() => useSocialExport())

      await act(async () => {
        const success = await result.current.loginToSocialNetwork("youtube")
        expect(success).toBe(true)
      })

      expect(toast.info).toHaveBeenCalledWith("Opening YouTube OAuth...")
    })

    it("should show info toast for TikTok login", async () => {
      const { result } = renderHook(() => useSocialExport())

      await act(async () => {
        const success = await result.current.loginToSocialNetwork("tiktok")
        expect(success).toBe(true)
      })

      expect(toast.info).toHaveBeenCalledWith("Opening TikTok OAuth...")
    })

    it("should show info toast for Telegram login", async () => {
      const { result } = renderHook(() => useSocialExport())

      await act(async () => {
        const success = await result.current.loginToSocialNetwork("telegram")
        expect(success).toBe(true)
      })

      expect(toast.info).toHaveBeenCalledWith("Opening Telegram OAuth...")
    })
  })

  describe("validateSocialExport", () => {
    it("should return false if not logged in", () => {
      const { result } = renderHook(() => useSocialExport())

      const isValid = result.current.validateSocialExport({
        fileName: "test",
        savePath: "",
        format: "Mp4",
        quality: "good",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "youtube",
        isLoggedIn: false,
      })

      expect(isValid).toBe(false)
      expect(toast.error).toHaveBeenCalledWith("Not logged in")
    })

    it("should return false if title is missing", () => {
      const { result } = renderHook(() => useSocialExport())

      const isValid = result.current.validateSocialExport({
        fileName: "test",
        savePath: "",
        format: "Mp4",
        quality: "good",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "youtube",
        isLoggedIn: true,
        title: "",
      })

      expect(isValid).toBe(false)
      expect(toast.error).toHaveBeenCalledWith("Title is required")
    })

    it("should return true for valid settings", () => {
      const { result } = renderHook(() => useSocialExport())

      const isValid = result.current.validateSocialExport({
        fileName: "test",
        savePath: "",
        format: "Mp4",
        quality: "good",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "youtube",
        isLoggedIn: true,
        title: "My Video",
      })

      expect(isValid).toBe(true)
      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  describe("uploadToSocialNetwork", () => {
    it("should throw error for unknown social network", async () => {
      const { result } = renderHook(() => useSocialExport())

      await expect(
        result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          fileName: "test",
          savePath: "",
          format: "Mp4",
          quality: "good",
          resolution: "1080",
          frameRate: "30",
          enableGPU: true,
          socialNetwork: "unknown",
          isLoggedIn: true,
        }),
      ).rejects.toThrow("Unknown social network")
    })

    it("should throw error if not logged in", async () => {
      const { result } = renderHook(() => useSocialExport())

      await expect(
        result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          fileName: "test",
          savePath: "",
          format: "Mp4",
          quality: "good",
          resolution: "1080",
          frameRate: "30",
          enableGPU: true,
          socialNetwork: "youtube",
          isLoggedIn: false,
        }),
      ).rejects.toThrow("Not logged in")
    })

    it("should validate YouTube requirements", async () => {
      const { result } = renderHook(() => useSocialExport())

      // Title too long
      await expect(
        result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          fileName: "test",
          savePath: "",
          format: "Mp4",
          quality: "good",
          resolution: "1080",
          frameRate: "30",
          enableGPU: true,
          socialNetwork: "youtube",
          isLoggedIn: true,
          title: "a".repeat(101),
        }),
      ).rejects.toThrow("Title is too long")

      // Description too long
      await expect(
        result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          fileName: "test",
          savePath: "",
          format: "Mp4",
          quality: "good",
          resolution: "1080",
          frameRate: "30",
          enableGPU: true,
          socialNetwork: "youtube",
          isLoggedIn: true,
          title: "My Video",
          description: "a".repeat(5001),
        }),
      ).rejects.toThrow("Description is too long")
    })

    it("should validate TikTok requirements", async () => {
      const { result } = renderHook(() => useSocialExport())

      // Description too long for TikTok
      await expect(
        result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          fileName: "test",
          savePath: "",
          format: "Mp4",
          quality: "good",
          resolution: "1080",
          frameRate: "30",
          enableGPU: true,
          socialNetwork: "tiktok",
          isLoggedIn: true,
          title: "My Video",
          description: "a".repeat(2201),
        }),
      ).rejects.toThrow("Description is too long")
    })

    it("should successfully upload video", async () => {
      const { result } = renderHook(() => useSocialExport())

      await act(async () => {
        await result.current.uploadToSocialNetwork("/path/to/video.mp4", {
          fileName: "test",
          savePath: "",
          format: "Mp4",
          quality: "good",
          resolution: "1080",
          frameRate: "30",
          enableGPU: true,
          socialNetwork: "youtube",
          isLoggedIn: true,
          title: "My Video",
          description: "Test description",
          tags: ["test"],
          privacy: "public",
        })
      })

      expect(toast.success).toHaveBeenCalledWith("Successfully uploaded to")
    })
  })
})
