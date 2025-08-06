/**
 * AI инструмент для анализа медиа браузера
 */

import type { ClaudeTool } from "../../services/claude-service"

import type { AnalyzeBrowserParams, BrowserToolResult } from "./types"
import {
  filterFiles,
  formatDuration,
  formatFileSize,
  getBrowserFiles,
  groupFiles,
  hasBrowserAccess,
  sortFiles,
} from "./utils/helpers"

export const analyzeMediaBrowserTool: ClaudeTool = {
  name: "analyze_media_browser",
  description: "Анализирует все доступные медиафайлы в браузере по указанным критериям",
  input_schema: {
    type: "object",
    properties: {
      tab: {
        type: "string",
        enum: ["media", "effects", "filters", "transitions", "templates", "music"],
        description: "Вкладка браузера для анализа",
      },
      filters: {
        type: "object",
        properties: {
          searchQuery: {
            type: "string",
            description: "Поисковый запрос для фильтрации файлов",
          },
          fileTypes: {
            type: "array",
            items: { type: "string", enum: ["video", "audio", "image"] },
            description: "Типы файлов для включения в анализ",
          },
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string", description: "Начальная дата (ISO format)" },
              end: { type: "string", description: "Конечная дата (ISO format)" },
            },
            description: "Диапазон дат создания/изменения файлов",
          },
          sizeRange: {
            type: "object",
            properties: {
              min: { type: "number", description: "Минимальный размер файла в байтах" },
              max: { type: "number", description: "Максимальный размер файла в байтах" },
            },
            description: "Диапазон размеров файлов",
          },
          durationRange: {
            type: "object",
            properties: {
              min: { type: "number", description: "Минимальная длительность в секундах" },
              max: { type: "number", description: "Максимальная длительность в секундах" },
            },
            description: "Диапазон длительности файлов",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Теги для фильтрации",
          },
          location: {
            type: "string",
            description: "Фильтр по расположению файлов",
          },
        },
        description: "Критерии фильтрации файлов",
      },
      includeMetadata: {
        type: "boolean",
        description: "Включить метаданные файлов в анализ",
        default: true,
      },
      groupBy: {
        type: "string",
        enum: ["type", "date", "size", "location", "tags"],
        description: "Способ группировки результатов",
      },
      sortBy: {
        type: "string",
        enum: ["name", "date", "size", "duration", "type"],
        description: "Критерий сортировки",
      },
      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
        description: "Порядок сортировки",
        default: "asc",
      },
    },
    required: ["tab"],
  },
}

export async function analyzeMediaBrowser(params: AnalyzeBrowserParams): Promise<BrowserToolResult> {
  const { tab, filters = {}, includeMetadata = true, groupBy, sortBy = "name", sortOrder = "asc" } = params

  if (!hasBrowserAccess()) {
    return {
      success: false,
      message: "Browser state access не настроен",
      errors: ["Доступ к браузеру не сконфигурирован"],
    }
  }

  try {
    // Получаем файлы из указанной вкладки
    let files = getBrowserFiles(tab)

    // Применяем фильтры
    if (Object.keys(filters).length > 0) {
      files = filterFiles(files, filters)
    }

    // Сортируем файлы
    if (sortBy) {
      files = sortFiles(files, sortBy, sortOrder)
    }

    // Подготавливаем данные для анализа
    const analysis: any = {
      tab,
      totalFiles: files.length,
      filters: filters,
      sorting: { sortBy, sortOrder },
    }

    // Статистика по типам файлов
    const fileTypeStats = files.reduce((acc: Record<string, number>, file) => {
      const type = file.type || "unknown"
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    // Общая статистика
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
    const totalDuration = files.reduce((sum, file) => sum + (file.duration || 0), 0)
    const averageSize = files.length > 0 ? totalSize / files.length : 0

    analysis.statistics = {
      fileTypeBreakdown: fileTypeStats,
      totalSize: totalSize,
      totalDuration: totalDuration,
      averageSize: averageSize,
      formattedTotalSize: formatFileSize(totalSize),
      formattedTotalDuration: formatDuration(totalDuration),
      formattedAverageSize: formatFileSize(averageSize),
    }

    // Группировка, если запрошена
    let groups: any[] = []
    if (groupBy) {
      groups = groupFiles(files, groupBy)
      analysis.grouping = {
        method: groupBy,
        totalGroups: groups.length,
        groupSummary: groups.map((group) => ({
          name: group.name,
          count: group.count,
          totalSize: formatFileSize(group.totalSize),
          totalDuration: group.totalDuration ? formatDuration(group.totalDuration) : undefined,
        })),
      }
    }

    // Подготавливаем список файлов для возврата
    const resultFiles = includeMetadata
      ? files
      : files.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          duration: f.duration,
        }))

    // Генерируем предложения
    const suggestions: string[] = []

    if (files.length === 0) {
      suggestions.push(`Во вкладке ${tab} нет файлов, соответствующих критериям`)
      if (Object.keys(filters).length > 0) {
        suggestions.push("Попробуйте изменить критерии фильтрации")
      }
    } else {
      if (files.length > 100) {
        suggestions.push("Большое количество файлов - рассмотрите дополнительную фильтрацию")
      }

      if (totalSize > 1000 * 1024 * 1024) {
        // > 1GB
        suggestions.push("Общий размер файлов превышает 1GB - проверьте доступное место")
      }

      const videoFiles = files.filter((f) => f.type?.includes("video")).length
      const audioFiles = files.filter((f) => f.type?.includes("audio")).length

      if (tab === "media" && videoFiles === 0 && audioFiles > 0) {
        suggestions.push("Найдены только аудио файлы - добавьте видео для полноценного монтажа")
      }

      if (tab === "media" && videoFiles > 0 && audioFiles === 0) {
        suggestions.push("Найдены только видео файлы - рассмотрите добавление фоновой музыки")
      }
    }

    // Определяем следующие действия
    const nextActions: string[] = []
    if (files.length > 0) {
      nextActions.push("Выбрать файлы для добавления в ресурсы")
      if (!groupBy) {
        nextActions.push("Сгруппировать файлы для лучшей организации")
      }
      nextActions.push("Применить дополнительные фильтры")
    } else {
      nextActions.push("Изменить критерии поиска")
      nextActions.push("Проверить другие вкладки браузера")
    }

    return {
      success: true,
      message: `Анализ вкладки ${tab} завершен: найдено ${files.length} файлов`,
      data: {
        files: resultFiles,
        groups: groups.length > 0 ? groups : undefined,
        analysis,
        suggestions,
      },
      nextActions,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа браузера: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
