import { useCallback, useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/plugin-fs"

import { useResources } from "@/features/resources"

import { StyleTemplate } from "../types"

/**
 * Хук для импорта пользовательских стилистических шаблонов
 * Позволяет импортировать JSON файлы со стилистическими шаблонами
 *
 * TODO: В будущем добавить поддержку форматов:
 * - .bundle (Filmora стили)
 * - .zip (упакованные стили)
 * - .css (CSS стили)
 * - .aep (After Effects шаблоны)
 */
export function useStyleTemplatesImport() {
  const [isImporting, setIsImporting] = useState(false)
  const { addStyleTemplate } = useResources()

  /**
   * Импорт JSON файла со стилистическими шаблонами
   */
  const importStyleTemplatesFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Style Templates JSON",
            extensions: ["json"],
          },
        ],
      })

      if (selected) {
        // Читаем содержимое JSON файла
        const content = await readTextFile(selected)
        const templatesData = JSON.parse(content)
        
        // Проверяем формат данных
        if (Array.isArray(templatesData)) {
          // Импортируем каждый шаблон
          for (const templateData of templatesData) {
            if (validateStyleTemplate(templateData)) {
              addStyleTemplate(templateData as StyleTemplate)
            }
          }
          console.log(`Импортировано ${templatesData.length} стилистических шаблонов`)
        } else if (templatesData.templates && Array.isArray(templatesData.templates)) {
          // Альтернативный формат с обёрткой
          for (const templateData of templatesData.templates) {
            if (validateStyleTemplate(templateData)) {
              addStyleTemplate(templateData as StyleTemplate)
            }
          }
          console.log(`Импортировано ${templatesData.templates.length} стилистических шаблонов`)
        }
      }
    } catch (error) {
      console.error("Ошибка при импорте стилистических шаблонов:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  /**
   * Импорт отдельных файлов стилистических шаблонов
   * Пока поддерживает только JSON, в будущем добавим другие форматы
   */
  const importStyleTemplateFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Style Template Files",
            extensions: ["json"], // TODO: добавить "bundle", "zip", "css", "aep"
          },
        ],
      })

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]
        
        // Обрабатываем каждый файл
        for (const filePath of files) {
          const fileName = filePath.split('/').pop() || ''
          const fileExtension = fileName.split('.').pop()?.toLowerCase()
          
          if (fileExtension === 'json') {
            // Читаем JSON файл
            const content = await readTextFile(filePath)
            const templateData = JSON.parse(content)
            
            if (validateStyleTemplate(templateData)) {
              addStyleTemplate(templateData as StyleTemplate)
              console.log(`Импортирован шаблон из файла: ${fileName}`)
            }
          } else {
            console.warn(`Формат файла ${fileExtension} пока не поддерживается`)
          }
        }
        
        console.log(`Обработано ${files.length} файлов`)
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов стилистических шаблонов:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  return {
    importStyleTemplatesFile,
    importStyleTemplateFile,
    isImporting,
  }
}

/**
 * Валидация структуры стилистического шаблона
 */
function validateStyleTemplate(template: any): boolean {
  return (
    template &&
    typeof template.id === 'string' &&
    template.name &&
    typeof template.name.ru === 'string' &&
    typeof template.name.en === 'string' &&
    template.category &&
    template.style &&
    template.aspectRatio &&
    typeof template.duration === 'number' &&
    Array.isArray(template.elements)
  )
}
