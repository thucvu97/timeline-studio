import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { StyleTemplate } from "@/features/style-templates/types"
import type { SubtitleStyleTemplate } from "@/features/subtitles/types"
import type { Transition } from "@/features/transitions/types/transitions"

/**
 * Валидирует объект эффекта видео
 */
export function validateEffect(data: any): VideoEffect | null {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.name || !data.type || !data.ffmpegCommand) return null

  const requiredFields = ["id", "name", "type", "duration", "category", "complexity"]
  if (!requiredFields.every((field) => field in data)) return null

  return data as VideoEffect
}

/**
 * Валидирует объект фильтра видео
 */
export function validateFilter(data: any): VideoFilter | null {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.name || !data.params) return null

  const requiredFields = ["id", "name", "category", "complexity", "params"]
  if (!requiredFields.every((field) => field in data)) return null

  return data as VideoFilter
}

/**
 * Валидирует объект перехода
 */
export function validateTransition(data: any): Transition | null {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.type || !data.ffmpegCommand) return null

  const requiredFields = ["id", "type", "name", "duration", "category", "complexity"]
  if (!requiredFields.every((field) => field in data)) return null

  if (!data.duration || typeof data.duration !== "object") return null
  if (!("min" in data.duration) || !("max" in data.duration) || !("default" in data.duration)) return null

  return data as Transition
}

/**
 * Валидирует объект стиля субтитров
 */
export function validateSubtitleStyle(data: any): SubtitleStyleTemplate | null {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.name || !data.style) return null

  const requiredFields = ["id", "name", "category", "complexity", "style"]
  if (!requiredFields.every((field) => field in data)) return null

  if (!data.style || typeof data.style !== "object" || Array.isArray(data.style)) return null

  return data as SubtitleStyleTemplate
}

/**
 * Валидирует объект стилевого шаблона
 */
export function validateStyleTemplate(data: any): StyleTemplate | null {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.name || !data.category) return null

  const requiredFields = ["id", "name", "category", "style", "aspectRatio", "duration"]
  if (!requiredFields.every((field) => field in data)) return null

  if (!Array.isArray(data.elements)) return null

  return data as StyleTemplate
}

/**
 * Возвращает расширения медиа файлов
 */
export function getMediaExtensions(): string[] {
  return [
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".mkv",
    ".webm",
    ".m4v",
    ".mpg",
    ".mpeg",
    ".3gp",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".svg",
    ".webp",
    ".ico",
    ".tiff",
  ]
}

/**
 * Возвращает расширения музыкальных файлов
 */
export function getMusicExtensions(): string[] {
  return [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".wma", ".opus"]
}

/**
 * Обрабатывает массив элементов пакетами
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }

  return results
}
