// Mock social networks service for testing

import { SocialExportSettings } from "../types/export-types"

export interface UploadResult {
  success: boolean
  url?: string
  id?: string
  error?: string
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SocialNetworksService {
  private static mockUserInfo: Record<string, any> = {
    youtube: { name: "Test YouTube User", id: "youtube123" },
    tiktok: { display_name: "Test TikTok User", id: "tiktok123" },
    telegram: { name: "Test Telegram User", id: "telegram123" },
  }

  static async login(network: string): Promise<boolean> {
    // Simulate successful login
    return true
  }

  static async logout(network: string): Promise<void> {
    // Simulate logout
  }

  static async isLoggedIn(network: string): Promise<boolean> {
    // For testing, check if we have a mock token
    const token = localStorage.getItem(`oauth_token_${network}`)
    return !!token
  }

  static getStoredUserInfo(network: string): any {
    return SocialNetworksService.mockUserInfo[network] || null
  }

  static async refreshTokenIfNeeded(network: string): Promise<boolean> {
    // Mock implementation - always return true
    return true
  }

  static validateSettings(network: string, settings: SocialExportSettings): string[] {
    const errors: string[] = []

    if (!settings.title || settings.title.trim().length === 0) {
      errors.push("Title is required")
    }

    if (network === "youtube") {
      if (settings.title && settings.title.length > 100) {
        errors.push("Title is too long")
      }
      if (settings.description && settings.description.length > 5000) {
        errors.push("Description is too long")
      }
    }

    if (network === "tiktok") {
      if (settings.title && settings.title.length > 150) {
        errors.push("Title is too long")
      }
      if (settings.description && settings.description.length > 2200) {
        errors.push("Description is too long")
      }
    }

    return errors
  }

  static async validateVideoFile(network: string, file: File): Promise<string[]> {
    // Mock validation - return no errors
    return []
  }

  static async uploadVideo(
    network: string,
    videoFile: File,
    settings: SocialExportSettings,
    onProgress?: (progress: number) => void,
  ): Promise<UploadResult> {
    // Check if logged in
    if (!(await SocialNetworksService.isLoggedIn(network))) {
      return {
        success: false,
        error: `Not logged in to ${network}`,
      }
    }

    // Validate settings first
    const validationErrors = SocialNetworksService.validateSettings(network, settings)
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors[0],
      }
    }

    // Simulate progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        onProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    // Simulate successful upload
    return {
      success: true,
      url: `https://${network}.com/video/mock123`,
      id: "mock123",
    }
  }

  static getOptimalSettings(network: string): Partial<SocialExportSettings> {
    const common = {
      format: "Mp4" as any,
      quality: "good" as any,
      frameRate: "30",
    }

    switch (network) {
      case "youtube":
        return {
          ...common,
          resolution: "1080",
          useVerticalResolution: false,
        }
      case "tiktok":
        return {
          ...common,
          resolution: "1080",
          useVerticalResolution: true,
        }
      default:
        return common
    }
  }
}
