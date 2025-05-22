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
    // Проверяем, начинается ли путь с маленькой буквы 'users/'
    if (filePath.startsWith('users/')) {
      // Заменяем 'users/' на '/Users/'
      filePath = '/Users/' + filePath.substring(6)
    }

    // Если путь не начинается с '/', добавляем его
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath
    }

    // Используем Tauri API для конвертации пути файла в URL
    const fileUrl = convertFileSrc(filePath)
    console.log("[getFileUrl] Исходный путь:", filePath)
    console.log("[getFileUrl] Конвертированный URL:", fileUrl)

    return fileUrl
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
