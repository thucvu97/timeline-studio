import { convertFileSrc } from "@tauri-apps/api/core"

/**
 * Кодирует путь к файлу для корректной обработки кириллических символов
 * и конвертирует его в URL, который можно использовать в браузере
 *
 * @param filePath Путь к файлу
 * @returns URL, который можно использовать в браузере
 */
export function getFileUrl(filePath: string): string {
  try {
    // Собираем путь обратно
    console.log("[getFileUrl] Исходный путь:", filePath)
    const result = convertFileSrc(filePath)
    // Проверяем, что URL корректный
    console.log("[getFileUrl] Финальный URL:", result)

    return result
  } catch (error) {
    console.error("[getFileUrl] Ошибка при конвертации пути файла:", error)
    // В случае ошибки пробуем использовать convertFileSrc напрямую
    try {
      return convertFileSrc(filePath)
    } catch {
      // Если и это не сработало, возвращаем исходный путь
      return filePath
    }
  }
}
