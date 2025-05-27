import { useCallback, useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"

/**
 * Хук для импорта пользовательских многокамерных шаблонов
 * Позволяет импортировать JSON файлы с шаблонами
 *
 * TODO: В будущем добавить поддержку форматов:
 * - .bundle (Filmora)
 * - .cct (CapCut)
 * - .zip (упакованные шаблоны)
 * - .mogrt (Adobe Premiere Pro)
 */
export function useTemplatesImport() {
  const [isImporting, setIsImporting] = useState(false)

  /**
   * Импорт JSON файла с многокамерными шаблонами
   */
  const importTemplatesFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Templates JSON",
            extensions: ["json"],
          },
        ],
      })

      if (selected) {
        console.log("Импорт JSON файла с многокамерными шаблонами:", selected)
        // TODO: Обработка импорта JSON файла с шаблонами
        // Валидация структуры, добавление в пользовательскую коллекцию
      }
    } catch (error) {
      console.error("Ошибка при импорте шаблонов:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  /**
   * Импорт отдельных файлов шаблонов
   * Пока поддерживает только JSON, в будущем добавим другие форматы
   */
  const importTemplateFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Template Files",
            extensions: ["json"], // TODO: добавить "bundle", "cct", "zip", "mogrt"
          },
        ],
      })

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]
        console.log("Импорт файлов многокамерных шаблонов:", files)
        // TODO: Обработка импорта файлов шаблонов
        // Парсинг разных форматов, конвертация в наш формат
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов шаблонов:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  return {
    importTemplatesFile,
    importTemplateFile,
    isImporting,
  }
}
