import { useCallback, useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/api/fs"

import { useResources } from "@/features/resources"

import { VideoFilter } from "../types/filters"

/**
 * Хук для импорта пользовательских фильтров
 * Позволяет импортировать JSON файлы с фильтрами или отдельные файлы фильтров
 */
export function useFiltersImport() {
  const [isImporting, setIsImporting] = useState(false)
  const { addFilter } = useResources()

  /**
   * Импорт JSON файла с фильтрами
   */
  const importFiltersFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Filters JSON",
            extensions: ["json"],
          },
        ],
      })

      if (selected) {
        // Читаем содержимое JSON файла
        const content = await readTextFile(selected)
        const filtersData = JSON.parse(content)

        // Проверяем формат данных
        if (Array.isArray(filtersData)) {
          // Импортируем каждый фильтр
          for (const filterData of filtersData) {
            if (filterData.id && filterData.name && filterData.category) {
              addFilter(filterData as VideoFilter)
            }
          }
          console.log(`Импортировано ${filtersData.length} фильтров`)
        } else if (filtersData.filters && Array.isArray(filtersData.filters)) {
          // Альтернативный формат с обёрткой
          for (const filterData of filtersData.filters) {
            if (filterData.id && filterData.name && filterData.category) {
              addFilter(filterData as VideoFilter)
            }
          }
          console.log(`Импортировано ${filtersData.filters.length} фильтров`)
        }
      }
    } catch (error) {
      console.error("Ошибка при импорте фильтров:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  /**
   * Импорт отдельных файлов фильтров (.cube, .3dl, .lut)
   */
  const importFilterFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Filter Files",
            extensions: ["cube", "3dl", "lut", "preset"],
          },
        ],
      })

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]

        // Обрабатываем каждый файл
        for (const filePath of files) {
          const fileName = filePath.split("/").pop() || ""
          const fileExtension = fileName.split(".").pop()?.toLowerCase()

          // Создаем объект фильтра на основе файла
          const filter: VideoFilter = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: fileName.replace(/\.[^/.]+$/, ""), // Убираем расширение
            category: "creative", // По умолчанию для импортированных
            complexity: "intermediate",
            tags: ["standard"],
            description: {
              en: `Custom ${fileExtension?.toUpperCase()} filter imported from ${fileName}`,
            },
            labels: {
              en: fileName.replace(/\.[^/.]+$/, ""),
            },
            params: {
              // Базовые параметры для LUT файлов
              brightness: 1,
              contrast: 1,
              saturation: 1,
            },
          }

          // Добавляем фильтр в ресурсы
          addFilter(filter)
        }

        console.log(`Импортировано ${files.length} файлов фильтров`)
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов фильтров:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  return {
    importFiltersFile,
    importFilterFile,
    isImporting,
  }
}
