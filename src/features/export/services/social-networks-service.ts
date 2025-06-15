// Объединяющий сервис для всех социальных сетей

import { toast } from "sonner"

import { OAuthService } from "./oauth-service"
import { TikTokService } from "./tiktok-service"
import { YouTubeService } from "./youtube-service"
import { SocialExportSettings } from "../types/export-types"

export interface SocialUploadResult {
  success: boolean
  url?: string
  id?: string
  error?: string
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SocialNetworksService {
  static async login(network: string): Promise<boolean> {
    try {
      toast.info(`Connecting to ${network}...`)

      const token = await OAuthService.loginToNetwork(network)
      if (!token) {
        throw new Error("Authentication failed")
      }

      // Сохраняем токен
      OAuthService.storeToken(network, token)

      // Получаем информацию о пользователе
      const userInfo = await SocialNetworksService.getUserInfo(network, token.accessToken)
      if (userInfo) {
        localStorage.setItem(`${network}_user_info`, JSON.stringify(userInfo))
      }

      toast.success(`Successfully connected to ${network}`)
      return true
    } catch (error) {
      console.error(`Login failed for ${network}:`, error)
      toast.error(`Failed to connect to ${network}: ${error instanceof Error ? error.message : "Unknown error"}`)
      return false
    }
  }

  static logout(network: string): void {
    OAuthService.logout(network)
    toast.info(`Disconnected from ${network}`)
  }

  static isLoggedIn(network: string): boolean {
    const token = OAuthService.getStoredToken(network)
    return !!token
  }

  static getUserInfo(network: string, accessToken?: string): Promise<any> {
    switch (network) {
      case "youtube":
        return YouTubeService.getUserInfo(accessToken)
      case "tiktok":
        return TikTokService.getUserInfo(accessToken)
      default:
        throw new Error(`User info not implemented for ${network}`)
    }
  }

  static getStoredUserInfo(network: string): any {
    try {
      const stored = localStorage.getItem(`${network}_user_info`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  static async uploadVideo(
    network: string,
    videoFile: File | Blob,
    settings: SocialExportSettings,
    onProgress?: (progress: number) => void,
  ): Promise<SocialUploadResult> {
    try {
      // Проверяем авторизацию
      if (!SocialNetworksService.isLoggedIn(network)) {
        throw new Error(`Not logged in to ${network}`)
      }

      // Валидируем настройки
      const validationErrors = SocialNetworksService.validateSettings(network, settings)
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(", ")}`)
      }

      let result: any

      switch (network) {
        case "youtube": {
          const metadata = await YouTubeService.exportSettings(settings)
          result = await YouTubeService.uploadVideo(videoFile, metadata, onProgress)
          break
        }
        case "tiktok": {
          const metadata = await TikTokService.exportSettings(settings)
          result = await TikTokService.uploadVideo(videoFile, metadata, onProgress)
          break
        }
        default:
          throw new Error(`Upload not implemented for ${network}`)
      }

      return {
        success: true,
        url: result.url || result.share_url,
        id: result.id || result.publish_id,
      }
    } catch (error) {
      console.error(`Upload failed for ${network}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  static validateSettings(network: string, settings: SocialExportSettings): string[] {
    switch (network) {
      case "youtube":
        return YouTubeService.validateSettings(settings)
      case "tiktok":
        return TikTokService.validateSettings(settings)
      default:
        return []
    }
  }

  static getOptimalSettings(network: string): Partial<SocialExportSettings> {
    switch (network) {
      case "youtube":
        return {
          resolution: "1080",
          frameRate: "30",
          format: "Mp4" as any,
          quality: "good",
        }
      case "tiktok":
        return TikTokService.getOptimalSettings()
      case "telegram":
        return {
          resolution: "720",
          frameRate: "30",
          format: "Mp4" as any,
          quality: "normal",
        }
      default:
        return {}
    }
  }

  static async refreshTokenIfNeeded(network: string): Promise<boolean> {
    const token = OAuthService.getStoredToken(network)
    if (!token || !token.refreshToken) {
      return false
    }

    // Проверяем, нужно ли обновить токен (за 5 минут до истечения)
    const refreshThreshold = 5 * 60 * 1000 // 5 минут
    const expiresAt = (token as any).expiresAt

    if (!expiresAt || Date.now() < expiresAt - refreshThreshold) {
      return true // Токен еще действителен
    }

    try {
      const newToken = await OAuthService.refreshToken(network, token.refreshToken)
      if (newToken) {
        OAuthService.storeToken(network, newToken)
        return true
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
      // Логаут при неудачном обновлении токена
      SocialNetworksService.logout(network)
    }

    return false
  }

  static async validateVideoFile(network: string, file: File): Promise<string[]> {
    const errors: string[] = []

    // Общие проверки
    if (!file) {
      errors.push("No video file selected")
      return errors
    }

    if (!file.type.startsWith("video/")) {
      errors.push("Selected file is not a video")
      return errors
    }

    // Специфичные для платформы проверки
    switch (network) {
      case "tiktok":
        errors.push(...TikTokService.validateVideoFile(file))
        break
      case "youtube":
        // YouTube имеет лимит 256GB или 12 часов
        const maxYouTubeSize = 256 * 1024 * 1024 * 1024 // 256GB
        if (file.size > maxYouTubeSize) {
          errors.push("Video file size must be less than 256GB")
        }
        break
      case "telegram":
        // Telegram имеет лимит 2GB
        const maxTelegramSize = 2 * 1024 * 1024 * 1024 // 2GB
        if (file.size > maxTelegramSize) {
          errors.push("Video file size must be less than 2GB")
        }
        break
    }

    return errors
  }
}
