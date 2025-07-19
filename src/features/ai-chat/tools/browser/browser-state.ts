/**
 * AI инструменты для управления состоянием браузера
 */

import { getBrowserStateAccess, getBrowserStats, getCurrentTab, hasBrowserAccess } from "./utils/helpers"

import type { BrowserToolResult, UpdateFiltersParams } from "./types"
import type { ClaudeTool } from "../../services/claude-service"


export const getBrowserStateTool: ClaudeTool = {
  name: "get_browser_state",
  description: "Получает текущее состояние медиа браузера включая активную вкладку, фильтры и выбранные файлы",
  input_schema: {
    type: "object",
    properties: {
      includeDetails: {
        type: "boolean",
        description: "Включить подробную информацию о файлах",
        default: false,
      },
    },
  },
}

export const updateBrowserFiltersTool: ClaudeTool = {
  name: "update_browser_filters",
  description: "Обновляет фильтры браузера для изменения отображаемых файлов",
  input_schema: {
    type: "object",
    properties: {
      filterType: {
        type: "string",
        enum: ["search", "fileType", "dateRange", "sizeRange", "tags", "location"],
        description: "Тип фильтра для обновления (не требуется при clearAll)",
      },
      filterValue: {
        description: "Значение фильтра (тип зависит от filterType)",
      },
      operation: {
        type: "string",
        enum: ["set", "add", "remove", "clear"],
        description: "Операция с фильтром",
      },
      clearAll: {
        type: "boolean",
        description: "Очистить все фильтры (используется с operation='clear')",
        default: false,
      },
      reason: {
        type: "string",
        description: "Причина изменения фильтров",
      },
    },
    required: ["operation", "reason"],
  },
}

export async function getBrowserState(params: { includeDetails?: boolean } = {}): Promise<BrowserToolResult> {
  const { includeDetails = false } = params

  if (!hasBrowserAccess()) {
    return {
      success: false,
      message: "Browser state access не настроен",
      errors: ["Доступ к браузеру не сконфигурирован"],
    }
  }

  try {
    const browserStateAccess = getBrowserStateAccess()!

    // Получаем основную информацию о состоянии
    const currentTab = getCurrentTab()
    const stats = getBrowserStats()
    const selectedFiles = browserStateAccess.getSelectedFiles()
    const currentFilters = browserStateAccess.getFilters()

    // Собираем детальную информацию, если запрошена
    let detailedFiles: any[] = []
    if (includeDetails) {
      const allFiles = browserStateAccess.getFiles()
      detailedFiles = allFiles.map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        isSelected: selectedFiles.some((sf) => sf.id === file.id),
        location: file.location,
        tags: file.tags,
      }))
    }

    // Анализируем состояние браузера
    const analysis = {
      currentTab,
      statistics: stats,
      filters: {
        active: currentFilters,
        hasActiveFilters: Object.keys(currentFilters || {}).length > 0,
      },
      selection: {
        count: selectedFiles.length,
        percentage: stats.totalFiles > 0 ? Math.round((selectedFiles.length / stats.totalFiles) * 100) : 0,
        fileTypes: selectedFiles.reduce((acc: Record<string, number>, file) => {
          const type = file.type || "unknown"
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {}),
      },
      navigation: {
        availableTabs: ["media", "effects", "filters", "transitions", "templates", "music"],
        currentTab,
        filesInCurrentTab: stats.totalFiles,
      },
    }

    // Генерируем предложения на основе состояния
    const suggestions: string[] = []

    if (stats.totalFiles === 0) {
      suggestions.push(`Во вкладке ${currentTab} нет файлов`)
      suggestions.push("Проверьте другие вкладки или импортируйте файлы")
    } else {
      if (selectedFiles.length === 0) {
        suggestions.push("Нет выбранных файлов")
        suggestions.push("Выберите файлы для работы с ними")
      } else if (selectedFiles.length === stats.totalFiles) {
        suggestions.push("Выбраны все файлы")
        suggestions.push("Рассмотрите фильтрацию для более точного выбора")
      }

      if (analysis.filters.hasActiveFilters) {
        suggestions.push("Активны фильтры - возможно, скрыты некоторые файлы")
        suggestions.push("Сбросьте фильтры для просмотра всех файлов")
      }

      // Предложения по типам файлов
      const videoFiles = stats.filesByType.video || 0
      const audioFiles = stats.filesByType.audio || 0

      if (currentTab === "media") {
        if (videoFiles === 0 && audioFiles > 0) {
          suggestions.push("Найдены только аудио файлы")
        } else if (videoFiles > 0 && audioFiles === 0) {
          suggestions.push("Найдены только видео файлы")
        }
      }
    }

    // Следующие действия
    const nextActions: string[] = []
    if (stats.totalFiles > 0) {
      if (selectedFiles.length === 0) {
        nextActions.push("Выбрать файлы для работы")
      } else {
        nextActions.push("Добавить выбранные файлы в ресурсы")
      }

      if (!analysis.filters.hasActiveFilters && stats.totalFiles > 20) {
        nextActions.push("Применить фильтры для удобства")
      }

      nextActions.push("Переключиться на другую вкладку")
    } else {
      nextActions.push("Импортировать файлы")
      nextActions.push("Проверить другие вкладки")
    }

    return {
      success: true,
      message: `Состояние браузера получено: вкладка ${currentTab}, файлов ${stats.totalFiles}, выбрано ${selectedFiles.length}`,
      data: {
        state: analysis,
        files: includeDetails ? detailedFiles : undefined,
        suggestions,
      },
      nextActions,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка получения состояния браузера: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

export async function updateBrowserFilters(params: UpdateFiltersParams): Promise<BrowserToolResult> {
  const { filterType, filterValue, operation, reason, clearAll } = params

  if (!hasBrowserAccess()) {
    return {
      success: false,
      message: "Browser state access не настроен",
      errors: ["Доступ к браузеру не сконфигурирован"],
    }
  }

  try {
    const browserStateAccess = getBrowserStateAccess()!
    const currentFilters = browserStateAccess.getFilters() || {}
    let newFilters = { ...currentFilters }

    // Применяем операцию к фильтрам
    switch (operation) {
      case "set":
        if (filterType) {
          newFilters[filterType] = filterValue
        }
        break

      case "add":
        if (filterType) {
          if (Array.isArray(newFilters[filterType])) {
            if (!newFilters[filterType].includes(filterValue)) {
              newFilters[filterType].push(filterValue)
            }
          } else if (typeof newFilters[filterType] === "object" && newFilters[filterType] !== null) {
            newFilters[filterType] = { ...newFilters[filterType], ...filterValue }
          } else {
            newFilters[filterType] = filterValue
          }
        }
        break

      case "remove":
        if (filterType) {
          if (Array.isArray(newFilters[filterType])) {
            newFilters[filterType] = newFilters[filterType].filter((item: any) => item !== filterValue)
            if (newFilters[filterType].length === 0) {
              delete newFilters[filterType]
            }
          } else if (typeof filterValue === "string" && typeof newFilters[filterType] === "object") {
            delete newFilters[filterType][filterValue]
            if (Object.keys(newFilters[filterType]).length === 0) {
              delete newFilters[filterType]
            }
          } else {
            delete newFilters[filterType]
          }
        }
        break

      case "clear":
        // Специальная обработка для очистки всех фильтров
        if (clearAll) {
          newFilters = {}
        } else if (filterType) {
          delete newFilters[filterType]
        }
        break

      default:
        throw new Error(`Неизвестная операция фильтра: ${operation}`)
    }

    // Применяем новые фильтры
    browserStateAccess.setFilters(newFilters)

    // Получаем обновленную статистику
    const updatedStats = getBrowserStats()

    // Анализ изменений
    const analysis = {
      filterType: filterType || (clearAll ? "all" : undefined),
      operation,
      reason,
      oldFilters: currentFilters,
      newFilters,
      filterValue,
      clearAll,
      filtersActive: Object.keys(newFilters).length > 0,
      affectedFiles: updatedStats.totalFiles,
      timestamp: new Date().toISOString(),
    }

    // Генерируем предложения
    const suggestions: string[] = []

    switch (operation) {
      case "set":
      case "add":
        suggestions.push(`Фильтр ${filterType} применен`)
        if (updatedStats.totalFiles === 0) {
          suggestions.push("Фильтры слишком строгие - файлы не найдены")
          suggestions.push("Попробуйте ослабить критерии фильтрации")
        } else if (updatedStats.totalFiles < 5) {
          suggestions.push("Найдено мало файлов - возможно, стоит расширить критерии")
        }
        break

      case "remove":
        if (filterType) {
          suggestions.push(`Фильтр ${filterType} удален`)
        }
        if (updatedStats.totalFiles > 50) {
          suggestions.push("Много файлов - рассмотрите применение фильтров")
        }
        break

      case "clear":
        if (clearAll) {
          suggestions.push("Все фильтры очищены")
        } else if (filterType) {
          suggestions.push(`Фильтр ${filterType} очищен`)
        }
        if (updatedStats.totalFiles > 50) {
          suggestions.push("Много файлов - рассмотрите применение фильтров")
        }
        break

      default:
        suggestions.push(`Операция ${operation} выполнена`)
        break
    }

    // Специфичные предложения по типу фильтра
    if (filterType === "search" && operation === "set") {
      if (updatedStats.totalFiles === 0) {
        suggestions.push("По поисковому запросу ничего не найдено")
        suggestions.push("Проверьте правильность написания")
      }
    }

    if (filterType === "fileType" && operation === "set") {
      const fileTypes = Array.isArray(filterValue) ? filterValue : [filterValue]
      suggestions.push(`Отображаются только файлы типов: ${fileTypes.join(", ")}`)
    }

    // Следующие действия
    const nextActions: string[] = []
    if (updatedStats.totalFiles > 0) {
      nextActions.push("Просмотреть отфильтрованные файлы")
      nextActions.push("Выбрать нужные файлы")
      if (Object.keys(newFilters).length > 1) {
        nextActions.push("Настроить дополнительные фильтры")
      }
    } else {
      nextActions.push("Ослабить фильтры")
      nextActions.push("Очистить все фильтры")
    }

    return {
      success: true,
      message: clearAll
        ? `Все фильтры очищены (${reason})`
        : `Фильтры обновлены: ${operation} для ${filterType || "неопределен"} (${reason})`,
      data: {
        analysis,
        suggestions,
      },
      nextActions,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка обновления фильтров: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
