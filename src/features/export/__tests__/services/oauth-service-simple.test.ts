import { beforeEach, describe, expect, it, vi } from "vitest"

import { OAuthService } from "../../services/oauth-service"

// Mock environment utilities before importing services
vi.mock("@/lib/environment", () => ({
  isDesktop: vi.fn().mockReturnValue(false),
  getTauriVersion: vi.fn().mockResolvedValue("2.0.0"),
  getSystemInfo: vi.fn().mockResolvedValue({
    platform: "darwin",
    osVersion: "14.0.0",
    arch: "aarch64",
  }),
}))

// Мокаем зависимости
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock SecureTokenStorage
vi.mock("../../services/secure-token-storage", () => ({
  SecureTokenStorage: {
    storeToken: vi.fn(),
    getStoredToken: vi.fn(),
    removeToken: vi.fn(),
  },
}))

const mockEnv = {
  NEXT_PUBLIC_YOUTUBE_CLIENT_ID: "youtube_client_id",
  NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET: "youtube_client_secret",
  NEXT_PUBLIC_TIKTOK_CLIENT_ID: "tiktok_client_id",
  NEXT_PUBLIC_TIKTOK_CLIENT_SECRET: "tiktok_client_secret",
  NEXT_PUBLIC_OAUTH_REDIRECT_URI: "http://localhost:3000/oauth/callback",
}

vi.stubEnv("NEXT_PUBLIC_YOUTUBE_CLIENT_ID", mockEnv.NEXT_PUBLIC_YOUTUBE_CLIENT_ID)
vi.stubEnv("NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET", mockEnv.NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET)
vi.stubEnv("NEXT_PUBLIC_TIKTOK_CLIENT_ID", mockEnv.NEXT_PUBLIC_TIKTOK_CLIENT_ID)
vi.stubEnv("NEXT_PUBLIC_TIKTOK_CLIENT_SECRET", mockEnv.NEXT_PUBLIC_TIKTOK_CLIENT_SECRET)
vi.stubEnv("NEXT_PUBLIC_OAUTH_REDIRECT_URI", mockEnv.NEXT_PUBLIC_OAUTH_REDIRECT_URI)

const { toast } = await import("sonner")
const { SecureTokenStorage } = await import("../../services/secure-token-storage")

global.fetch = vi.fn()

describe("OAuthService (simplified)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe("loginToNetwork", () => {
    it("should throw error for unsupported network", async () => {
      await expect(OAuthService.loginToNetwork("unsupported")).rejects.toThrow("Unsupported network: unsupported")
    })

    it("should show error if clientId is not configured", async () => {
      vi.stubEnv("NEXT_PUBLIC_YOUTUBE_CLIENT_ID", "")

      const result = await OAuthService.loginToNetwork("youtube")

      expect(result).toBeNull()
      expect(toast.error).toHaveBeenCalledWith("OAuth not configured for youtube. Please check environment variables.")
    })
  })

  describe("refreshToken", () => {
    it("should refresh Google token successfully", async () => {
      const mockResponse = {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_in: 3600,
        token_type: "Bearer",
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any)

      const result = await OAuthService.refreshToken("youtube", "old_refresh_token")

      expect(result).toEqual({
        accessToken: "new_access_token",
        refreshToken: "new_refresh_token",
        expiresIn: 3600,
        tokenType: "Bearer",
      })
    })

    it("should return null for unsupported network", async () => {
      const result = await OAuthService.refreshToken("unsupported", "refresh_token")

      expect(result).toBeNull()
    })
  })

  describe("logout", () => {
    it("should clear stored tokens and user info", async () => {
      await OAuthService.logout("youtube")

      expect(SecureTokenStorage.removeToken).toHaveBeenCalledWith("youtube")
      expect(toast.success).toHaveBeenCalledWith("Logged out from youtube")
    })
  })

  describe("getStoredToken", () => {
    it("should return stored token if valid", async () => {
      const token = {
        accessToken: "valid_token",
        refreshToken: "refresh_token",
        expiresIn: 3600,
        tokenType: "Bearer",
        expiresAt: Date.now() + 3600 * 1000, // Действителен еще час
      }

      vi.mocked(SecureTokenStorage.getStoredToken).mockResolvedValue(token)

      const result = await OAuthService.getStoredToken("youtube")

      expect(result).toEqual(token)
      expect(SecureTokenStorage.getStoredToken).toHaveBeenCalledWith("youtube")
    })

    it("should return null if no token stored", async () => {
      vi.mocked(SecureTokenStorage.getStoredToken).mockResolvedValue(null)

      const result = await OAuthService.getStoredToken("youtube")

      expect(result).toBeNull()
      expect(SecureTokenStorage.getStoredToken).toHaveBeenCalledWith("youtube")
    })

    it("should return null and logout if token expired", async () => {
      vi.mocked(SecureTokenStorage.getStoredToken).mockResolvedValue(null)

      const result = await OAuthService.getStoredToken("youtube")

      expect(result).toBeNull()
      expect(SecureTokenStorage.getStoredToken).toHaveBeenCalledWith("youtube")
    })
  })

  describe("storeToken", () => {
    it("should store token with calculated expiry time", async () => {
      const token = {
        accessToken: "new_token",
        refreshToken: "refresh_token",
        expiresIn: 3600,
        tokenType: "Bearer",
      }

      await OAuthService.storeToken("youtube", token)

      expect(SecureTokenStorage.storeToken).toHaveBeenCalledWith("youtube", token)
    })
  })
})
