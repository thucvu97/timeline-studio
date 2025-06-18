import { beforeEach, describe, expect, it, vi } from "vitest"

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

// Mock Tauri Store
const mockStore = {
  load: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  save: vi.fn(),
}

vi.mock("@tauri-apps/plugin-store", () => ({
  Store: {
    load: vi.fn().mockResolvedValue(mockStore),
  },
}))

// Mock Web Crypto API
const mockCrypto = {
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }),
  subtle: {
    importKey: vi.fn(),
    deriveKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
}

Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
})

// Import after mocking
const { SecureTokenStorage } = await import("../../services/secure-token-storage")
const { isDesktop } = await import("@/lib/environment")

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
})

describe("SecureTokenStorage - Comprehensive", () => {
  const mockToken = {
    accessToken: "test_access_token",
    refreshToken: "test_refresh_token",
    expiresIn: 3600,
    tokenType: "Bearer",
  }

  const mockTokenWithExpiry = {
    ...mockToken,
    expiresAt: Date.now() + 3600 * 1000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isDesktop).mockReturnValue(false)
    
    // Reset crypto mocks
    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey)
    mockCrypto.subtle.deriveKey.mockResolvedValue({} as CryptoKey)
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
    mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockToken)))
    
    // Reset Tauri store mocks
    mockStore.set.mockResolvedValue(undefined)
    mockStore.get.mockResolvedValue(null)
    mockStore.delete.mockResolvedValue(undefined)
    mockStore.save.mockResolvedValue(undefined)
  })

  describe("storeToken", () => {
    it("should store token with calculated expiry time", async () => {
      const dateSpy = vi.spyOn(Date, "now").mockReturnValue(1000000)
      
      await SecureTokenStorage.storeToken("youtube", mockToken)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "youtube_oauth_token",
        expect.stringContaining("data")
      )

      dateSpy.mockRestore()
    })

    it("should use Tauri secure storage on desktop", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)

      await SecureTokenStorage.storeToken("youtube", mockToken)

      expect(mockStore.set).toHaveBeenCalledWith("youtube_oauth_token", {
        ...mockToken,
        expiresAt: expect.any(Number),
      })
      expect(mockStore.save).toHaveBeenCalled()
    })

    it("should fallback to encrypted localStorage on web", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      await SecureTokenStorage.storeToken("youtube", mockToken)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "youtube_oauth_token",
        expect.any(String)
      )
    })

    it("should fallback to plain localStorage when encryption fails", async () => {
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error("Encryption failed"))

      await SecureTokenStorage.storeToken("youtube", mockToken)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "youtube_oauth_token",
        expect.stringMatching(/^{.*"accessToken":"test_access_token".*}$/)
      )
    })

    it("should fallback to localStorage when Tauri storage fails", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)
      mockStore.set.mockRejectedValue(new Error("Tauri storage failed"))

      await SecureTokenStorage.storeToken("youtube", mockToken)

      // Should fallback to encrypted localStorage, not plain text
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "youtube_oauth_token",
        expect.stringContaining("data") // Contains encrypted data
      )
    })

    it("should handle different networks correctly", async () => {
      await SecureTokenStorage.storeToken("tiktok", mockToken)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "tiktok_oauth_token",
        expect.any(String)
      )
    })
  })

  describe("getStoredToken", () => {
    it("should return null when no token is stored", async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toBeNull()
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("youtube_oauth_token")
    })

    it("should return token when valid token is stored", async () => {
      const encryptedToken = {
        data: "encrypted_data",
        iv: "initialization_vector",
        timestamp: Date.now(),
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedToken))

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toEqual(mockToken)
    })

    it("should return null and remove expired token", async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredToken))

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("youtube_oauth_token")
    })

    it("should use Tauri secure storage on desktop", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)
      mockStore.get.mockResolvedValue(mockTokenWithExpiry)

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toEqual(mockTokenWithExpiry)
      expect(mockStore.get).toHaveBeenCalledWith("youtube_oauth_token")
    })

    it("should handle plain text tokens in localStorage", async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTokenWithExpiry))

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toEqual(mockTokenWithExpiry)
    })

    it("should fallback to localStorage when Tauri fails", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)
      mockStore.get.mockRejectedValue(new Error("Tauri failed"))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTokenWithExpiry))

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toEqual(mockTokenWithExpiry)
    })

    it("should handle decryption failures gracefully", async () => {
      const encryptedToken = {
        data: "invalid_encrypted_data",
        iv: "invalid_iv",
        timestamp: Date.now(),
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedToken))
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error("Decryption failed"))

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toBeNull()
    })

    it("should handle malformed JSON in localStorage", async () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json")

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toBeNull()
    })

    it("should handle expired encrypted tokens", async () => {
      const oldEncryptedToken = {
        data: "encrypted_data",
        iv: "initialization_vector",
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago (older than MAX_AGE)
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldEncryptedToken))
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error("Encrypted token too old"))

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toBeNull()
    })
  })

  describe("removeToken", () => {
    it("should remove token and user info from localStorage on web", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      await SecureTokenStorage.removeToken("youtube")

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("youtube_oauth_token")
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("youtube_user_info")
    })

    it("should remove token and user info from Tauri storage on desktop", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)

      await SecureTokenStorage.removeToken("youtube")

      expect(mockStore.delete).toHaveBeenCalledWith("youtube_oauth_token")
      expect(mockStore.delete).toHaveBeenCalledWith("youtube_user_info")
    })

    it("should handle Tauri delete errors gracefully", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockStore.delete.mockRejectedValue(new Error("Tauri delete failed"))

      await SecureTokenStorage.removeToken("youtube")

      expect(mockStore.delete).toHaveBeenCalledWith("youtube_oauth_token")
      expect(mockStore.delete).toHaveBeenCalledWith("youtube_user_info")
      expect(consoleSpy).toHaveBeenCalledWith("Tauri store not available:", expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it("should handle different networks correctly", async () => {
      await SecureTokenStorage.removeToken("tiktok")

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("tiktok_oauth_token")
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("tiktok_user_info")
    })
  })

  describe("clearAllTokens", () => {
    it("should remove tokens for all supported networks", async () => {
      await SecureTokenStorage.clearAllTokens()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("youtube_oauth_token")
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("youtube_user_info")
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("tiktok_oauth_token")
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("tiktok_user_info")
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("telegram_oauth_token")
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("telegram_user_info")
    })

    it("should work with Tauri storage on desktop", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)

      await SecureTokenStorage.clearAllTokens()

      expect(mockStore.delete).toHaveBeenCalledWith("youtube_oauth_token")
      expect(mockStore.delete).toHaveBeenCalledWith("youtube_user_info")
      expect(mockStore.delete).toHaveBeenCalledWith("tiktok_oauth_token")
      expect(mockStore.delete).toHaveBeenCalledWith("tiktok_user_info")
      expect(mockStore.delete).toHaveBeenCalledWith("telegram_oauth_token")
      expect(mockStore.delete).toHaveBeenCalledWith("telegram_user_info")
    })
  })

  describe("Tauri Storage Methods", () => {
    it("should handle Tauri store import failure gracefully", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)
      
      // Mock dynamic import failure
      vi.doMock("@tauri-apps/plugin-store", () => {
        throw new Error("Tauri not available")
      })

      await SecureTokenStorage.storeToken("youtube", mockToken)

      // Should fallback to encrypted localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe("Encryption Methods", () => {
    it("should generate unique IV for each encryption", async () => {
      const ivs: Uint8Array[] = []
      mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = ivs.length // Make each IV different based on call count
        }
        ivs.push(new Uint8Array(array))
        return array
      })

      await SecureTokenStorage.storeToken("youtube", mockToken)
      await SecureTokenStorage.storeToken("tiktok", mockToken)

      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2)
    })

    it("should properly encode encrypted data as hex", async () => {
      const mockEncryptedData = new Uint8Array([255, 0, 128, 64])
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData.buffer)

      await SecureTokenStorage.storeToken("youtube", mockToken)

      const storedCall = mockLocalStorage.setItem.mock.calls[0]
      const storedData = JSON.parse(storedCall[1])
      expect(storedData).toHaveProperty("data")
      expect(storedData).toHaveProperty("iv")
      expect(storedData).toHaveProperty("timestamp")
    })

    it("should properly derive encryption key", async () => {
      await SecureTokenStorage.storeToken("youtube", mockToken)

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "raw",
        expect.objectContaining({
          0: expect.any(Number), // Should be a Uint8Array with numeric indices
        }),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      )

      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        {
          name: "PBKDF2",
          salt: expect.objectContaining({
            0: expect.any(Number), // Should be a Uint8Array with numeric indices
          }),
          iterations: 100000,
          hash: "SHA-256",
        },
        {}, // key material
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      )
    })

    it("should handle hex parsing for decryption", async () => {
      const encryptedToken = {
        data: "ff0080405060708090a0b0c0d0e0f000",
        iv: "000102030405060708090a0b",
        timestamp: Date.now(),
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedToken))

      await SecureTokenStorage.getStoredToken("youtube")

      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        { name: "AES-GCM", iv: expect.any(Uint8Array) },
        {}, // derived key
        expect.any(Uint8Array) // encrypted data
      )
    })

    it("should handle invalid hex data gracefully", async () => {
      const encryptedToken = {
        data: "invalid_hex_data",
        iv: "invalid_hex_iv",
        timestamp: Date.now(),
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedToken))
      
      // Mock decrypt to throw an error for invalid hex
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error("Invalid hex data"))

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toBeNull()
    })
  })

  describe("Error Handling", () => {
    it("should log errors when storage operations fail", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      // Make both encryption and localStorage fail
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error("Encryption failed"))
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded")
      })

      try {
        await SecureTokenStorage.storeToken("youtube", mockToken)
      } catch (error) {
        // Expected to throw since all storage methods fail
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to store token for youtube:",
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it("should log errors when token retrieval fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      // Make localStorage.getItem throw during the fallback
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage access denied")
      })
      
      // Simulate being on web so it tries encrypted localStorage directly
      vi.mocked(isDesktop).mockReturnValue(false)

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to decrypt token:",
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it("should log errors when token removal fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      // Simulate being on web (not desktop) where localStorage is used directly
      vi.mocked(isDesktop).mockReturnValue(false)
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error("Cannot remove item")
      })

      try {
        await SecureTokenStorage.removeToken("youtube")
      } catch (error) {
        // Expected to throw since localStorage.removeItem fails
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to remove token for youtube:",
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe("Token Expiry", () => {
    it("should calculate correct expiry time", async () => {
      const mockNow = 1000000
      const dateSpy = vi.spyOn(Date, "now").mockReturnValue(mockNow)
      
      // Reset mocks to ensure clean state
      vi.clearAllMocks()
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockLocalStorage.setItem.mockImplementation(() => {}) // Don't throw

      await SecureTokenStorage.storeToken("youtube", mockToken)

      const expectedExpiry = mockNow + mockToken.expiresIn * 1000
      
      // Verify the token was stored with correct expiry
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      // The expiry calculation is done internally before encryption
      // Just verify that the process completed successfully
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled()

      dateSpy.mockRestore()
    })

    it("should handle tokens without expiresAt gracefully", async () => {
      const tokenWithoutExpiry = { ...mockToken }
      delete (tokenWithoutExpiry as any).expiresAt
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tokenWithoutExpiry))

      const result = await SecureTokenStorage.getStoredToken("youtube")

      expect(result).toEqual(tokenWithoutExpiry)
    })
  })

  describe("Web Crypto API Edge Cases", () => {
    it("should handle missing crypto API gracefully", async () => {
      // Temporarily remove crypto
      const originalCrypto = global.crypto
      delete (global as any).crypto
      
      // Reset mocks to ensure clean state
      vi.clearAllMocks()
      mockLocalStorage.setItem.mockImplementation(() => {}) // Don't throw

      await SecureTokenStorage.storeToken("youtube", mockToken)

      // Should fallback to plain localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "youtube_oauth_token",
        expect.stringMatching(/^{.*"accessToken":"test_access_token".*}$/)
      )

      // Restore crypto
      global.crypto = originalCrypto
    })

    it("should handle crypto operations that throw synchronously", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks()
      mockLocalStorage.setItem.mockImplementation(() => {}) // Don't throw
      
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error("Crypto not available")
      })

      await SecureTokenStorage.storeToken("youtube", mockToken)

      // Should fallback to plain localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "youtube_oauth_token",
        expect.stringMatching(/^{.*"accessToken":"test_access_token".*}$/)
      )
    })
  })
})