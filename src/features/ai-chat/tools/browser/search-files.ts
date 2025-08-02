/**
 * AI инструменты для поиска файлов в браузере
 */

import type { ClaudeTool } from "../../services/claude-service"

import type { BrowserToolResult, SearchMediaParams } from "./types"
import { findFilesByPattern, getBrowserFiles, getBrowserStateAccess, hasBrowserAccess } from "./utils/helpers"

export const searchMediaFilesTool: ClaudeTool = {
  name: "search_media_files",
  description: "Выполняет поиск медиафайлов в браузере по различным критериям",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Поисковый запрос",
      },
      searchIn: {
        type: "array",
        items: { type: "string", enum: ["filename", "metadata", "tags", "location"] },
        description: "Области поиска",
        default: ["filename"],
      },
      tab: {
        type: "string",
        enum: ["media", "effects", "filters", "transitions", "templates", "music"],
        description: "Вкладка для поиска (если не указана, поиск во всех)",
      },
      advanced: {
        type: "object",
        properties: {
          exactMatch: {
            type: "boolean",
            description: "Точное соответствие",
            default: false,
          },
          caseSensitive: {
            type: "boolean",
            description: "Учитывать регистр",
            default: false,
          },
          includeHidden: {
            type: "boolean",
            description: "Включить скрытые файлы",
            default: false,
          },
          searchSubfolders: {
            type: "boolean",
            description: "Поиск в подпапках",
            default: true,
          },
        },
        description: "Расширенные настройки поиска",
      },
      maxResults: {
        type: "number",
        description: "Максимальное количество результатов",
        default: 100,
      },
    },
    required: ["query"],
  },
}

export async function searchMediaFiles(params: SearchMediaParams): Promise<BrowserToolResult> {
  const { query, searchIn = ["filename"], tab, advanced = {}, maxResults = 100 } = params

  if (!hasBrowserAccess()) {
    return {
      success: false,
      message: "Browser state access не настроен",
      errors: ["Доступ к браузеру не сконфигурирован"],
    }
  }

  try {
    const browserStateAccess = getBrowserStateAccess()!
    let files = tab ? getBrowserFiles(tab) : getBrowserFiles()

    // Применяем расширенные настройки
    if (!advanced.includeHidden) {
      files = files.filter((file) => !file.name.startsWith("."))
    }

    let searchResults: any[] = []

    // Выполняем поиск в зависимости от настроек
    if (advanced.exactMatch) {
      // Точное соответствие
      const searchTerm = advanced.caseSensitive ? query : query.toLowerCase()

      searchResults = files.filter((file) => {
        return searchIn.some((area) => {
          switch (area) {
            case "filename":
              const fileName = advanced.caseSensitive ? file.name : file.name.toLowerCase()
              return fileName === searchTerm
            case "location":
              const location = advanced.caseSensitive ? file.location || "" : (file.location || "").toLowerCase()
              return location === searchTerm
            case "tags":
              return file.tags?.some((tag: string) => {
                const tagValue = advanced.caseSensitive ? tag : tag.toLowerCase()
                return tagValue === searchTerm
              })
            case "metadata":
              // В реальной реализации поиск по метаданным
              return false
            default:
              return false
          }
        })
      })
    } else if (query.includes("*") || query.includes("?")) {
      // Поиск по шаблону
      searchResults = findFilesByPattern(files, query)
    } else {
      // Обычный поиск (частичное соответствие)
      const searchTerm = advanced.caseSensitive ? query : query.toLowerCase()

      searchResults = files.filter((file) => {
        return searchIn.some((area) => {
          switch (area) {
            case "filename":
              const fileName = advanced.caseSensitive ? file.name : file.name.toLowerCase()
              return fileName.includes(searchTerm)
            case "location":
              const location = advanced.caseSensitive ? file.location || "" : (file.location || "").toLowerCase()
              return location.includes(searchTerm)
            case "tags":
              return (
                file.tags?.some((tag: string) => {
                  const tagValue = advanced.caseSensitive ? tag : tag.toLowerCase()
                  return tagValue.includes(searchTerm)
                }) || false
              )
            case "metadata":
              // В реальной реализации поиск по метаданным
              if (file.metadata) {
                const metadataString = JSON.stringify(file.metadata)
                const searchableMetadata = advanced.caseSensitive ? metadataString : metadataString.toLowerCase()
                return searchableMetadata.includes(searchTerm)
              }
              return false
            default:
              return false
          }
        })
      })
    }

    // Ограничиваем количество результатов
    if (searchResults.length > maxResults) {
      searchResults = searchResults.slice(0, maxResults)
    }

    // Сортируем результаты по релевантности (простая эвристика)
    searchResults = searchResults.sort((a, b) => {
      // Приоритет файлам, где запрос найден в начале имени
      const aStartsWithQuery = a.name.toLowerCase().startsWith(query.toLowerCase())
      const bStartsWithQuery = b.name.toLowerCase().startsWith(query.toLowerCase())

      if (aStartsWithQuery && !bStartsWithQuery) return -1
      if (!aStartsWithQuery && bStartsWithQuery) return 1

      // Затем по алфавиту
      return a.name.localeCompare(b.name)
    })

    // Анализируем результаты
    const analysis = {
      query,
      searchAreas: searchIn,
      tab: tab || "all",
      settings: advanced,
      totalMatches: searchResults.length,
      wasTruncated:
        files.filter((file) =>
          searchIn.some((area) => {
            const searchTerm = advanced.caseSensitive ? query : query.toLowerCase()
            switch (area) {
              case "filename":
                const fileName = advanced.caseSensitive ? file.name : file.name.toLowerCase()
                return fileName.includes(searchTerm)
              default:
                return false
            }
          }),
        ).length > maxResults,
      fileTypeBreakdown: searchResults.reduce((acc: Record<string, number>, file) => {
        const type = file.type || "unknown"
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}),
    }

    // Генерируем предложения
    const suggestions: string[] = []

    if (searchResults.length === 0) {
      suggestions.push(`По запросу "${query}" ничего не найдено`)
      suggestions.push("Попробуйте изменить поисковый запрос")
      suggestions.push("Проверьте правильность написания")
      if (advanced.exactMatch) {
        suggestions.push("Попробуйте отключить точное соответствие")
      }
      if (advanced.caseSensitive) {
        suggestions.push("Попробуйте отключить учет регистра")
      }
    } else {
      if (searchResults.length === maxResults) {
        suggestions.push(`Найдено максимальное количество результатов (${maxResults})`)
        suggestions.push("Уточните поисковый запрос для более точных результатов")
      }

      if (searchResults.length > 20) {
        suggestions.push("Много результатов - используйте дополнительные фильтры")
      }

      // Предложения по типам файлов
      const types = Object.keys(analysis.fileTypeBreakdown)
      if (types.length > 1) {
        suggestions.push(`Найдены файлы разных типов: ${types.join(", ")}`)
      }
    }

    // Следующие действия
    const nextActions: string[] = []
    if (searchResults.length > 0) {
      nextActions.push("Выбрать нужные файлы из результатов")
      nextActions.push("Добавить найденные файлы в ресурсы")
      if (searchResults.length > 10) {
        nextActions.push("Применить дополнительные фильтры")
      }
    } else {
      nextActions.push("Изменить поисковый запрос")
      nextActions.push("Попробовать поиск в других областях")
      if (tab) {
        nextActions.push("Расширить поиск на все вкладки")
      }
    }

    return {
      success: true,
      message: `Поиск по запросу "${query}" завершен: найдено ${searchResults.length} файлов`,
      data: {
        files: searchResults,
        analysis,
        suggestions,
      },
      nextActions,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка поиска файлов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
