/**
 * Утилиты для работы с Tauri
 */

import { convertFileSrc } from "@tauri-apps/api/core"
import { exists } from "@tauri-apps/plugin-fs"

// Попробуем статический импорт для Tauri v2

/**
 * Преобразует локальный файловый путь в asset URL для Tauri v2
 * Использует встроенную функцию, но декодирует кириллические символы перед этим
 *
 * @param filePath - Локальный путь к файлу
 * @returns Asset URL для использования в HTML элементах
 */
export function convertToAssetUrl(filePath: string): string {
  // Проверяем Tauri окружение
  if (!isTauriEnvironment()) {
    console.warn("[convertToAssetUrl] Not in Tauri environment")
    return filePath
  }

  // Если путь уже является URL, возвращаем как есть
  if (filePath.startsWith("asset://") || filePath.startsWith("https://") || filePath.startsWith("http://")) {
    return filePath
  }

  // Декодируем путь, если он уже закодирован
  let cleanPath = filePath
  try {
    cleanPath = decodeURIComponent(filePath)
  } catch {
    // Если декодирование не удалось, используем исходный путь
  }

  // В Tauri v2 используем convertFileSrc
  try {
    const assetUrl = convertFileSrc(cleanPath)
    console.log("[convertToAssetUrl] convertFileSrc result:", assetUrl)
    return assetUrl
  } catch (error) {
    console.error("[convertToAssetUrl] Error with convertFileSrc:", error)
  }

  // Fallback - создаем asset URL вручную для Tauri 2.0
  // Кодируем только специальные символы, но не весь путь
  const escapedPath = cleanPath
    .split("/")
    .map((segment) => {
      // Кодируем каждый сегмент пути отдельно
      return encodeURIComponent(segment).replace(/'/g, "%27") // Дополнительно экранируем апостроф
    })
    .join("/")

  // В Tauri 2.0 формат: asset://localhost/путь
  const assetUrl = `asset://localhost/${escapedPath}`
  console.log("[convertToAssetUrl] Fallback asset URL:", assetUrl)

  return assetUrl
}

/**
 * Преобразует путь к видео файлу для использования в Tauri v2
 * Использует convertFileSrc для создания безопасного URL
 *
 * @param filePath - Локальный путь к видео файлу
 * @returns URL для использования в video элементах
 */
export function convertVideoSrc(filePath: string): string {
  // Проверяем, работаем ли мы в Tauri окружении
  if (!isTauriEnvironment()) {
    console.warn("[convertVideoSrc] Not in Tauri environment, returning original path")

    // В development режиме пробуем использовать asset URL напрямую
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      // Создаем asset URL для development
      const encodedPath = encodeURIComponent(filePath)
      const devAssetUrl = `http://asset.localhost/${encodedPath}`
      console.log("[convertVideoSrc] Dev mode asset URL:", devAssetUrl)
      return devAssetUrl
    }

    return filePath
  }

  // Если путь уже является URL, возвращаем как есть
  if (filePath.startsWith("asset://") || filePath.startsWith("https://") || filePath.startsWith("http://")) {
    return filePath
  }

  // Декодируем путь, если он уже закодирован
  let cleanPath = filePath
  try {
    cleanPath = decodeURIComponent(filePath)
  } catch {
    // Используем исходный путь
  }

  console.log("[convertVideoSrc] Converting:", {
    original: filePath,
    cleaned: cleanPath,
    isTauri: isTauriEnvironment(),
  })

  // В Tauri v2 используем convertFileSrc, но если она не работает, используем альтернативный подход
  try {
    // Пробуем использовать встроенную функцию
    const assetUrl = convertFileSrc(cleanPath)
    console.log("[convertVideoSrc] convertFileSrc result:", assetUrl)

    // Если URL начинается с asset://, возвращаем как есть
    if (assetUrl && assetUrl.startsWith("asset://")) {
      return assetUrl
    }

    // Если получили http://asset.localhost, тоже возвращаем
    if (assetUrl && assetUrl.startsWith("http://asset.localhost")) {
      return assetUrl
    }

    return assetUrl
  } catch (error) {
    console.error("[convertVideoSrc] Error with convertFileSrc:", error)
  }

  // Fallback - создаем asset URL вручную для Tauri 2.0
  // Кодируем только специальные символы, но не весь путь
  const escapedPath = cleanPath
    .split("/")
    .map((segment) => {
      // Кодируем каждый сегмент пути отдельно
      return encodeURIComponent(segment).replace(/'/g, "%27") // Дополнительно экранируем апостроф
    })
    .join("/")

  // В Tauri 2.0 формат: asset://localhost/путь
  const assetUrl = `asset://localhost/${escapedPath}`
  console.log("[convertVideoSrc] Fallback asset URL:", assetUrl)

  return assetUrl
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
  if (typeof window === "undefined") return false

  // В Tauri v2 также проверяем __TAURI_INTERNALS__
  const windowWithTauri = window as any
  const hasTauri = windowWithTauri.__TAURI__ !== undefined
  const hasTauriInternals = windowWithTauri.__TAURI_INTERNALS__ !== undefined

  const isTauri = hasTauri || hasTauriInternals

  if (isTauri) {
    console.log("[isTauriEnvironment] Tauri detected:", { hasTauri, hasTauriInternals })
  }

  return isTauri
}
