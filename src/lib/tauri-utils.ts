/**
 * Утилиты для работы с Tauri
 */

import { convertFileSrc } from "@tauri-apps/api/core"
import { exists } from "@tauri-apps/plugin-fs"

/**
 * Преобразует локальный файловый путь в asset URL для Tauri v2
 * Использует встроенную функцию, но декодирует кириллические символы перед этим
 *
 * @param filePath - Локальный путь к файлу
 * @returns Asset URL для использования в HTML элементах
 */
export function convertToAssetUrl(filePath: string): string {
  // Декодируем путь, если он уже закодирован
  let cleanPath = filePath
  try {
    cleanPath = decodeURIComponent(filePath)
  } catch {
    // Если декодирование не удалось, используем исходный путь
  }

  // Используем встроенную функцию Tauri с декодированным путем
  return convertFileSrc(cleanPath)
}

/**
 * Преобразует путь к видео файлу для использования в Tauri v2
 * Использует file:// протокол для обхода проблем с asset протоколом для видео
 *
 * @param filePath - Локальный путь к видео файлу
 * @returns URL для использования в video элементах
 */
export function convertVideoSrc(filePath: string): string {
  // Для видео в Tauri 2.0 лучше использовать file:// протокол
  // так как asset протокол имеет известные проблемы с видео файлами
  if (filePath.startsWith("file://")) {
    return filePath
  }

  // На Windows нужно заменить обратные слеши
  const normalizedPath = filePath.replace(/\\/g, "/")

  // Добавляем file:// протокол
  return `file://${normalizedPath}`
}

/**
 * Проверяет доступность файла через Tauri API
 * @param filePath - Путь к файлу
 * @returns Promise<boolean> - true если файл доступен
 */
export async function checkFileAccess(filePath: string): Promise<boolean> {
  try {
    const fileExists = await exists(filePath)
    console.log(`[TauriUtils] File exists check for ${filePath}: ${fileExists}`)
    return fileExists
  } catch (error) {
    console.error(`[TauriUtils] Error checking file access for ${filePath}:`, error)
    return false
  }
}

/**
 * Проверяет, работает ли приложение в Tauri окружении
 * @returns true если приложение запущено в Tauri
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && window.__TAURI__ !== undefined
}
