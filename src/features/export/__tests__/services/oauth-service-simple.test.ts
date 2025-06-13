import { beforeEach, describe, expect, it, vi } from "vitest"

import { OAuthService } from "../../services/oauth-service"

// Мокаем зависимости
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
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

global.fetch = vi.fn()

describe("OAuthService (simplified)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe("loginToNetwork", () => {
    it("should throw error for unsupported network", async () => {
      await expect(OAuthService.loginToNetwork("unsupported")).rejects.toThrow(
        "Unsupported network: unsupported"
      )
    })

    it("should show error if clientId is not configured", async () => {
      vi.stubEnv("NEXT_PUBLIC_YOUTUBE_CLIENT_ID", "")

      const result = await OAuthService.loginToNetwork("youtube")

      expect(result).toBeNull()
      expect(toast.error).toHaveBeenCalledWith(
        "OAuth not configured for youtube. Please check environment variables."
      )
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
    it("should clear stored tokens and user info", () => {
      localStorage.setItem("youtube_oauth_token", "token_data")
      localStorage.setItem("youtube_user_info", "user_data")

      OAuthService.logout("youtube")

      expect(localStorage.getItem("youtube_oauth_token")).toBeNull()
      expect(localStorage.getItem("youtube_user_info")).toBeNull()
    })
  })

  describe("getStoredToken", () => {
    it("should return stored token if valid", () => {
      const token = {
        accessToken: "valid_token",
        refreshToken: "refresh_token",
        expiresIn: 3600,
        tokenType: "Bearer",
        expiresAt: Date.now() + 3600 * 1000, // Действителен еще час
      }

      localStorage.setItem("youtube_oauth_token", JSON.stringify(token))

      const result = OAuthService.getStoredToken("youtube")

      expect(result).toEqual(token)
    })

    it("should return null if no token stored", () => {
      const result = OAuthService.getStoredToken("youtube")

      expect(result).toBeNull()
    })

    it("should return null and logout if token expired", () => {
      const expiredToken = {
        accessToken: "expired_token",
        expiresAt: Date.now() - 1000, // Истек секунду назад
      }

      localStorage.setItem("youtube_oauth_token", JSON.stringify(expiredToken))

      const result = OAuthService.getStoredToken("youtube")

      expect(result).toBeNull()
      expect(localStorage.getItem("youtube_oauth_token")).toBeNull()
    })
  })

  describe("storeToken", () => {
    it("should store token with calculated expiry time", () => {
      const token = {
        accessToken: "new_token",
        refreshToken: "refresh_token",
        expiresIn: 3600,
        tokenType: "Bearer",
      }

      const beforeStore = Date.now()
      OAuthService.storeToken("youtube", token)
      const afterStore = Date.now()

      const stored = JSON.parse(localStorage.getItem("youtube_oauth_token")!)
      
      expect(stored.accessToken).toBe("new_token")
      expect(stored.refreshToken).toBe("refresh_token")
      expect(stored.expiresIn).toBe(3600)
      expect(stored.tokenType).toBe("Bearer")
      
      // Проверяем, что время истечения рассчитано правильно
      expect(stored.expiresAt).toBeGreaterThanOrEqual(beforeStore + 3600 * 1000)
      expect(stored.expiresAt).toBeLessThanOrEqual(afterStore + 3600 * 1000)
    })
  })
})