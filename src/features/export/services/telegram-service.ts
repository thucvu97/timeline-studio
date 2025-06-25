// Telegram Bot API service для загрузки видео

import { SocialExportSettings } from "../types/export-types"

export interface TelegramUploadResult {
  success: boolean
  url?: string
  id?: string
  error?: string
}

export interface TelegramVideoMetadata {
  caption?: string
  chat_id: string
  parse_mode?: "Markdown" | "MarkdownV2" | "HTML"
  supports_streaming?: boolean
  disable_notification?: boolean
  protect_content?: boolean
  reply_markup?: any
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TelegramService {
  private static readonly API_BASE = "https://api.telegram.org/bot"

  static async getUserInfo(accessToken?: string): Promise<any> {
    if (!accessToken) {
      throw new Error("Bot token is required")
    }

    try {
      const response = await fetch(`${TelegramService.API_BASE}${accessToken}/getMe`)

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`)
      }

      const data = await response.json()
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`)
      }

      return data.result
    } catch (error) {
      console.error("Failed to get Telegram bot info:", error)
      throw error
    }
  }

  static async uploadVideo(
    videoFile: File | Blob,
    metadata: TelegramVideoMetadata,
    onProgress?: (progress: number) => void,
  ): Promise<TelegramUploadResult> {
    try {
      // Получаем сохраненный bot token
      const botToken = localStorage.getItem("telegram_bot_token")
      if (!botToken) {
        throw new Error("No Telegram bot token found")
      }

      // Создаем FormData для отправки видео
      const formData = new FormData()
      formData.append("video", videoFile)
      formData.append("chat_id", metadata.chat_id)

      if (metadata.caption) {
        formData.append("caption", metadata.caption)
      }

      if (metadata.parse_mode) {
        formData.append("parse_mode", metadata.parse_mode)
      }

      if (metadata.supports_streaming !== undefined) {
        formData.append("supports_streaming", metadata.supports_streaming.toString())
      }

      if (metadata.disable_notification) {
        formData.append("disable_notification", "true")
      }

      if (metadata.protect_content) {
        formData.append("protect_content", "true")
      }

      // Имитируем прогресс загрузки
      if (onProgress) {
        const intervals = [10, 30, 50, 70, 90]
        for (const progress of intervals) {
          setTimeout(() => onProgress(progress), progress * 20)
        }
      }

      // Отправляем видео через Telegram Bot API
      const response = await fetch(`${TelegramService.API_BASE}${botToken}/sendVideo`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const data = await response.json()
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`)
      }

      if (onProgress) {
        onProgress(100)
      }

      const message = data.result
      const videoFileId = message.video?.file_id

      return {
        success: true,
        url: `https://t.me/${metadata.chat_id}/${message.message_id}`,
        id: videoFileId,
      }
    } catch (error) {
      console.error("Telegram upload failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  static async exportSettings(settings: SocialExportSettings): Promise<TelegramVideoMetadata> {
    // Получаем chat_id из настроек пользователя или используем дефолтный
    const chatId = localStorage.getItem("telegram_default_chat_id") || "@your_channel"

    let caption = ""
    if (settings.title) {
      caption += `*${settings.title}*`
    }
    if (settings.description) {
      caption += settings.title ? `\n\n${settings.description}` : settings.description
    }
    if (settings.tags && settings.tags.length > 0) {
      const hashtags = settings.tags.map((tag) => `#${tag.replace(/\s+/g, "_")}`).join(" ")
      caption += caption ? `\n\n${hashtags}` : hashtags
    }

    return {
      chat_id: chatId,
      caption: caption || undefined,
      parse_mode: "Markdown",
      supports_streaming: true,
      disable_notification: false,
      protect_content: false,
    }
  }

  static validateSettings(settings: SocialExportSettings): string[] {
    const errors: string[] = []

    // Проверяем наличие chat_id
    const chatId = localStorage.getItem("telegram_default_chat_id")
    if (!chatId) {
      errors.push("Telegram chat ID is required. Please configure in settings.")
    }

    // Проверяем длину caption (максимум 1024 символа для видео)
    const captionLength =
      (settings.title?.length || 0) + (settings.description?.length || 0) + (settings.tags?.join(" ").length || 0)

    if (captionLength > 1000) {
      // Оставляем небольшой запас для markdown разметки
      errors.push("Caption too long (max 1000 characters including title, description, and tags)")
    }

    return errors
  }

  static validateVideoFile(file: File): string[] {
    const errors: string[] = []

    // Telegram поддерживает основные видео форматы
    const supportedTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]

    if (!supportedTypes.includes(file.type)) {
      errors.push("Unsupported video format for Telegram")
    }

    // Максимальный размер файла для Telegram Bot API - 50MB
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxFileSize) {
      errors.push("Video file size exceeds 50MB limit for Telegram Bot API")
    }

    return errors
  }

  static getOptimalSettings(): Partial<SocialExportSettings> {
    return {
      resolution: "720",
      frameRate: "30",
      format: "Mp4" as any,
      quality: "normal",
    }
  }

  // Дополнительные методы для работы с каналами/чатами
  static async getChatInfo(chatId: string): Promise<any> {
    const botToken = localStorage.getItem("telegram_bot_token")
    if (!botToken) {
      throw new Error("No Telegram bot token found")
    }

    try {
      const response = await fetch(`${TelegramService.API_BASE}${botToken}/getChat?chat_id=${chatId}`)
      const data = await response.json()

      if (!data.ok) {
        throw new Error(`Failed to get chat info: ${data.description}`)
      }

      return data.result
    } catch (error) {
      console.error("Failed to get Telegram chat info:", error)
      throw error
    }
  }

  static async sendTestMessage(chatId: string, message: string = "Test message from Timeline Studio"): Promise<boolean> {
    const botToken = localStorage.getItem("telegram_bot_token")
    if (!botToken) {
      throw new Error("No Telegram bot token found")
    }

    try {
      const response = await fetch(`${TelegramService.API_BASE}${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      })

      const data = await response.json()
      return data.ok
    } catch (error) {
      console.error("Failed to send test message:", error)
      return false
    }
  }
}