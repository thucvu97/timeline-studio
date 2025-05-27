import { useCallback, useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"

/**
 * Хук для импорта пользовательских стилей субтитров
 * Позволяет импортировать JSON файлы со стилями или отдельные файлы стилей
 */
export function useSubtitlesImport() {
  const [isImporting, setIsImporting] = useState(false)

  /**
   * Импорт JSON файла со стилями субтитров
   */
  const importSubtitlesFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Subtitles JSON",
            extensions: ["json"],
          },
        ],
      })

      if (selected) {
        console.log("Импорт JSON файла со стилями субтитров:", selected)
        // TODO: Обработка импорта JSON файла со стилями субтитров
      }
    } catch (error) {
      console.error("Ошибка при импорте стилей субтитров:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  /**
   * Импорт отдельных файлов стилей субтитров
   */
  const importSubtitleFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Subtitle Style Files",
            extensions: ["css", "json", "srt", "vtt", "ass"],
          },
        ],
      })

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]
        console.log("Импорт файлов стилей субтитров:", files)
        // TODO: Обработка импорта файлов стилей субтитров
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов стилей субтитров:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  return {
    importSubtitlesFile,
    importSubtitleFile,
    isImporting,
  }
}
