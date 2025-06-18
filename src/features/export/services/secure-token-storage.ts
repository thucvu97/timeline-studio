/**
 * Secure Token Storage Service
 *
 * Обеспечивает безопасное хранение OAuth токенов с использованием
 * Tauri secure storage или зашифрованного localStorage как fallback.
 */

import { isDesktop } from "@/lib/environment"

interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
  expiresAt?: number
}

interface EncryptedToken {
  data: string
  iv: string
  timestamp: number
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SecureTokenStorage {
  private static readonly ENCRYPTION_KEY = "timeline-studio-oauth"
  private static readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 дней

  /**
   * Сохраняет OAuth токен безопасным способом
   */
  static async storeToken(network: string, token: OAuthToken): Promise<void> {
    const tokenWithExpiry = {
      ...token,
      expiresAt: Date.now() + token.expiresIn * 1000,
    }

    const key = `${network}_oauth_token`

    try {
      if (isDesktop()) {
        // Используем Tauri secure storage для desktop
        await SecureTokenStorage.storeTauriSecure(key, tokenWithExpiry)
      } else {
        // Используем зашифрованный localStorage для web
        await SecureTokenStorage.storeEncrypted(key, tokenWithExpiry)
      }
    } catch (error) {
      console.error(`Failed to store token for ${network}:`, error)
      // Fallback к обычному localStorage (не рекомендуется для продакшена)
      localStorage.setItem(key, JSON.stringify(tokenWithExpiry))
    }
  }

  /**
   * Получает сохраненный OAuth токен
   */
  static async getStoredToken(network: string): Promise<OAuthToken | null> {
    const key = `${network}_oauth_token`

    try {
      let token: OAuthToken | null = null

      if (isDesktop()) {
        // Читаем из Tauri secure storage
        token = await SecureTokenStorage.getTauriSecure(key)
      } else {
        // Читаем из зашифрованного localStorage
        token = await SecureTokenStorage.getEncrypted(key)
      }

      if (!token) {
        return null
      }

      // Проверяем, не истек ли токен
      if (token.expiresAt && Date.now() > token.expiresAt) {
        await SecureTokenStorage.removeToken(network)
        return null
      }

      return token
    } catch (error) {
      console.error(`Failed to get token for ${network}:`, error)
      // Fallback к localStorage
      return SecureTokenStorage.getFromLocalStorage(key)
    }
  }

  /**
   * Удаляет сохраненный токен
   */
  static async removeToken(network: string): Promise<void> {
    const key = `${network}_oauth_token`

    try {
      if (isDesktop()) {
        await SecureTokenStorage.removeTauriSecure(key)
      } else {
        localStorage.removeItem(key)
      }

      // Также удаляем пользовательские данные
      const userKey = `${network}_user_info`
      if (isDesktop()) {
        await SecureTokenStorage.removeTauriSecure(userKey)
      } else {
        localStorage.removeItem(userKey)
      }
    } catch (error) {
      console.error(`Failed to remove token for ${network}:`, error)
      // Fallback к localStorage
      localStorage.removeItem(key)
      localStorage.removeItem(`${network}_user_info`)
    }
  }

  /**
   * Очищает все OAuth токены
   */
  static async clearAllTokens(): Promise<void> {
    const networks = ["youtube", "tiktok", "telegram"]

    for (const network of networks) {
      await SecureTokenStorage.removeToken(network)
    }
  }

  /**
   * Сохраняет токен через Tauri secure storage
   */
  private static async storeTauriSecure(key: string, token: OAuthToken): Promise<void> {
    try {
      // Динамический импорт Tauri API
      const { Store } = await import("@tauri-apps/plugin-store")

      const store = await Store.load("oauth-tokens.dat")
      await store.set(key, token)
      await store.save()
    } catch (error) {
      console.error("Tauri store not available, falling back to encrypted localStorage:", error)
      await SecureTokenStorage.storeEncrypted(key, token)
    }
  }

  /**
   * Получает токен из Tauri secure storage
   */
  private static async getTauriSecure(key: string): Promise<OAuthToken | null> {
    try {
      const { Store } = await import("@tauri-apps/plugin-store")

      const store = await Store.load("oauth-tokens.dat")
      const token = await store.get<OAuthToken>(key)
      return token || null
    } catch (error) {
      console.error("Tauri store not available, falling back to encrypted localStorage:", error)
      return SecureTokenStorage.getEncrypted(key)
    }
  }

  /**
   * Удаляет токен из Tauri secure storage
   */
  private static async removeTauriSecure(key: string): Promise<void> {
    try {
      const { Store } = await import("@tauri-apps/plugin-store")

      const store = await Store.load("oauth-tokens.dat")
      await store.delete(key)
      await store.save()
    } catch (error) {
      console.error("Tauri store not available:", error)
    }
  }

  /**
   * Сохраняет зашифрованный токен в localStorage
   */
  private static async storeEncrypted(key: string, token: OAuthToken): Promise<void> {
    try {
      const encrypted = await SecureTokenStorage.encrypt(JSON.stringify(token))
      localStorage.setItem(key, JSON.stringify(encrypted))
    } catch (error) {
      console.error("Encryption failed, storing plain text:", error)
      localStorage.setItem(key, JSON.stringify(token))
    }
  }

  /**
   * Получает зашифрованный токен из localStorage
   */
  private static async getEncrypted(key: string): Promise<OAuthToken | null> {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const parsed = JSON.parse(stored)

      // Проверяем, зашифрован ли токен
      if (parsed.data && parsed.iv) {
        const decrypted = await SecureTokenStorage.decrypt(parsed)
        return JSON.parse(decrypted)
      }
      // Это незашифрованный токен, возвращаем как есть
      return parsed
    } catch (error) {
      console.error("Failed to decrypt token:", error)
      return null
    }
  }

  /**
   * Fallback к обычному localStorage
   */
  private static getFromLocalStorage(key: string): OAuthToken | null {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const token = JSON.parse(stored)

      // Проверяем истечение
      if (token.expiresAt && Date.now() > token.expiresAt) {
        localStorage.removeItem(key)
        return null
      }

      return token
    } catch {
      return null
    }
  }

  /**
   * Шифрует данные используя Web Crypto API
   */
  private static async encrypt(data: string): Promise<EncryptedToken> {
    const encoder = new TextEncoder()
    const key = await SecureTokenStorage.getDerivedKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(data))

    return {
      data: Array.from(new Uint8Array(encrypted))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      iv: Array.from(iv)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      timestamp: Date.now(),
    }
  }

  /**
   * Расшифровывает данные
   */
  private static async decrypt(encrypted: EncryptedToken): Promise<string> {
    // Проверяем возраст зашифрованных данных
    if (Date.now() - encrypted.timestamp > SecureTokenStorage.MAX_AGE) {
      throw new Error("Encrypted token too old")
    }

    const key = await SecureTokenStorage.getDerivedKey()
    const iv = new Uint8Array(encrypted.iv.match(/.{2}/g)?.map((hex) => Number.parseInt(hex, 16)) || [])
    const data = new Uint8Array(encrypted.data.match(/.{2}/g)?.map((hex) => Number.parseInt(hex, 16)) || [])

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)

    return new TextDecoder().decode(decrypted)
  }

  /**
   * Получает ключ шифрования
   */
  private static async getDerivedKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SecureTokenStorage.ENCRYPTION_KEY),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    )

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("timeline-studio-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    )
  }
}
