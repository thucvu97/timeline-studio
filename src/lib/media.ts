import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"

/**
 * Типы метаданных медиафайлов
 */
export interface VideoMetadata {
  duration?: number
  width?: number
  height?: number
  fps?: number
  codec?: string
  bitrate?: number
  size?: number
  creation_time?: string
}

export interface AudioMetadata {
  duration?: number
  codec?: string
  bitrate?: number
  sample_rate?: number
  channels?: number
  size?: number
  creation_time?: string
}

export interface ImageMetadata {
  width?: number
  height?: number
  format?: string
  size?: number
  creation_time?: string
}

export type MediaMetadata =
  | {
      type: "Video"
      duration?: number
      width?: number
      height?: number
      fps?: number
      codec?: string
      bitrate?: number
      size?: number
      creation_time?: string
    }
  | {
      type: "Audio"
      duration?: number
      codec?: string
      bitrate?: number
      sample_rate?: number
      channels?: number
      size?: number
      creation_time?: string
    }
  | {
      type: "Image"
      width?: number
      height?: number
      format?: string
      size?: number
      creation_time?: string
    }
  | { type: "Unknown" }

/**
 * Получение метаданных медиафайла
 * @param filePath Путь к файлу
 * @returns Метаданные файла
 */
export async function getMediaMetadata(
  filePath: string,
): Promise<MediaMetadata> {
  try {
    return await invoke<MediaMetadata>("get_media_metadata", { filePath })
  } catch (error) {
    console.error("Ошибка при получении метаданных:", error)
    throw error
  }
}

/**
 * Получение списка медиафайлов в директории
 * @param directory Путь к директории
 * @returns Список путей к медиафайлам
 */
export async function getMediaFiles(directory: string): Promise<string[]> {
  try {
    return await invoke<string[]>("get_media_files", { directory })
  } catch (error) {
    console.error("Ошибка при получении списка файлов:", error)
    throw error
  }
}

/**
 * Открытие диалога выбора файла
 * @returns Путь к выбранному файлу или null, если отменено
 */
export async function selectMediaFile(): Promise<string | null> {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Media",
          extensions: [
            "mp4",
            "avi",
            "mkv",
            "mov",
            "webm",
            "mp3",
            "wav",
            "ogg",
            "flac",
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
          ],
        },
      ],
    })

    if (selected === null) {
      return null
    }

    return selected
  } catch (error) {
    console.error("Ошибка при выборе файла:", error)
    throw error
  }
}

/**
 * Открытие диалога выбора директории
 * @returns Путь к выбранной директории или null, если отменено
 */
export async function selectMediaDirectory(): Promise<string | null> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    })

    if (selected === null) {
      return null
    }

    return selected
  } catch (error) {
    console.error("Ошибка при выборе директории:", error)
    throw error
  }
}

/**
 * Форматирование размера файла в читаемый вид
 * @param bytes Размер в байтах
 * @returns Отформатированный размер
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return "Неизвестно"

  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * Форматирование длительности в читаемый вид
 * @param seconds Длительность в секундах
 * @returns Отформатированная длительность
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined) return "Неизвестно"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}
