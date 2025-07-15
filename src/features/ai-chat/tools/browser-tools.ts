/**
 * AI инструменты для работы с медиа браузером
 *
 * Предоставляет Claude возможности для анализа и поиска
 * медиафайлов в браузере перед добавлением в ресурсы
 */

import { ResourceType } from "@/features/resources/types"
import { BrowserTab } from "@/shared/types/browser"

import { ClaudeTool } from "../services/claude-service"

/**
 * Инструменты для работы с медиа браузером
 */
export const browserTools: ClaudeTool[] = [
  {
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
            },
            durationRange: {
              type: "object",
              properties: {
                min: { type: "number", description: "Минимальная длительность в секундах" },
                max: { type: "number", description: "Максимальная длительность в секундах" },
              },
            },
          },
        },
        analysisDepth: {
          type: "string",
          enum: ["basic", "detailed", "full"],
          description: "Глубина анализа файлов",
          default: "basic",
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить технические метаданные файлов",
          default: false,
        },
      },
      required: ["tab"],
    },
  },

  {
    name: "search_media_files",
    description: "Выполняет целенаправленный поиск медиафайлов по конкретным критериям",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Поисковый запрос (название файла, тег, описание)",
        },
        searchCriteria: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["video", "audio", "image", "any"],
              description: "Тип искомых файлов",
            },
            sortBy: {
              type: "string",
              enum: ["name", "date", "duration", "size", "relevance"],
              description: "Критерий сортировки результатов",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Порядок сортировки",
            },
            limit: {
              type: "number",
              description: "Максимальное количество результатов",
              default: 50,
            },
          },
        },
        advancedFilters: {
          type: "object",
          properties: {
            resolution: {
              type: "object",
              properties: {
                minWidth: { type: "number" },
                minHeight: { type: "number" },
                aspectRatio: { type: "string" },
              },
            },
            codec: { type: "string", description: "Кодек видео/аудио" },
            fps: { type: "number", description: "Частота кадров для видео" },
            bitrate: { type: "number", description: "Битрейт для аудио/видео" },
            hasAudio: { type: "boolean", description: "Наличие аудиодорожки" },
            isStabilized: { type: "boolean", description: "Стабилизированное видео" },
          },
        },
      },
      required: ["query"],
    },
  },

  {
    name: "get_file_groups",
    description: "Получает информацию о группах файлов (серии, последовательности, связанные файлы)",
    input_schema: {
      type: "object",
      properties: {
        groupingStrategy: {
          type: "string",
          enum: ["by-date", "by-location", "by-series", "by-type", "by-duration", "smart"],
          description: "Стратегия группировки файлов",
        },
        includeMergedGroups: {
          type: "boolean",
          description: "Включить объединенные группы файлов",
          default: true,
        },
        minGroupSize: {
          type: "number",
          description: "Минимальное количество файлов в группе",
          default: 2,
        },
      },
    },
  },

  {
    name: "analyze_file_relationships",
    description: "Анализирует связи между файлами (последовательности, дубликаты, версии)",
    input_schema: {
      type: "object",
      properties: {
        fileIds: {
          type: "array",
          items: { type: "string" },
          description: "Список идентификаторов файлов для анализа связей",
        },
        relationshipTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["sequence", "duplicate", "version", "similar", "complementary"],
          },
          description: "Типы связей для поиска",
        },
        similarity: {
          type: "object",
          properties: {
            threshold: { type: "number", description: "Порог схожести (0-1)" },
            compareBy: {
              type: "array",
              items: { type: "string", enum: ["visual", "audio", "metadata", "filename"] },
            },
          },
        },
      },
    },
  },

  {
    name: "bulk_select_files",
    description: "Массово выбирает файлы по критериям для последующего добавления в ресурсы",
    input_schema: {
      type: "object",
      properties: {
        selectionCriteria: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["all-matching", "best-quality", "representative", "time-distributed", "manual-list"],
              description: "Метод выбора файлов",
            },
            filters: {
              type: "object",
              properties: {
                searchQuery: { type: "string" },
                fileTypes: { type: "array", items: { type: "string" } },
                qualityThreshold: { type: "string", enum: ["low", "medium", "high", "excellent"] },
                dateRange: {
                  type: "object",
                  properties: {
                    start: { type: "string" },
                    end: { type: "string" },
                  },
                },
              },
            },
            maxCount: {
              type: "number",
              description: "Максимальное количество файлов для выбора",
            },
            prioritize: {
              type: "array",
              items: { type: "string", enum: ["favorites", "recent", "high-quality", "diverse", "long-duration"] },
              description: "Приоритеты при выборе файлов",
            },
          },
          required: ["method"],
        },
        purpose: {
          type: "string",
          description: "Цель выбора файлов (для какого типа проекта)",
        },
      },
      required: ["selectionCriteria", "purpose"],
    },
  },

  {
    name: "get_browser_state",
    description: "Получает текущее состояние браузера (активная вкладка, фильтры, выбранные файлы)",
    input_schema: {
      type: "object",
      properties: {
        includeSelection: {
          type: "boolean",
          description: "Включить информацию о выбранных файлах",
          default: true,
        },
        includeFilters: {
          type: "boolean",
          description: "Включить текущие фильтры и настройки",
          default: true,
        },
        includeStats: {
          type: "boolean",
          description: "Включить статистику по файлам в браузере",
          default: false,
        },
      },
    },
  },

  {
    name: "update_browser_filters",
    description: "Обновляет фильтры и настройки браузера для лучшего отображения нужных файлов",
    input_schema: {
      type: "object",
      properties: {
        tab: {
          type: "string",
          enum: ["media", "effects", "filters", "transitions", "templates", "music"],
          description: "Вкладка для изменения настроек",
        },
        newFilters: {
          type: "object",
          properties: {
            searchQuery: { type: "string" },
            filterType: { type: "string" },
            sortBy: { type: "string" },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
            viewMode: { type: "string", enum: ["grid", "list", "detail"] },
            showFavoritesOnly: { type: "boolean" },
          },
        },
        reason: {
          type: "string",
          description: "Причина изменения фильтров",
        },
      },
      required: ["tab", "newFilters", "reason"],
    },
  },

  {
    name: "analyze_missing_content",
    description: "Анализирует, какого типа контента не хватает в браузере для конкретного проекта",
    input_schema: {
      type: "object",
      properties: {
        projectType: {
          type: "string",
          enum: ["wedding", "travel", "corporate", "social", "documentary", "education", "music-video"],
          description: "Тип проекта для анализа",
        },
        currentContent: {
          type: "object",
          properties: {
            videoCount: { type: "number" },
            audioCount: { type: "number" },
            imageCount: { type: "number" },
            totalDuration: { type: "number" },
            dominantTypes: { type: "array", items: { type: "string" } },
          },
          description: "Характеристики текущего контента",
        },
        targetRequirements: {
          type: "object",
          properties: {
            desiredDuration: { type: "number" },
            mustHaveElements: { type: "array", items: { type: "string" } },
            preferredRatio: { type: "string" },
            qualityLevel: { type: "string", enum: ["basic", "professional", "cinema"] },
          },
        },
      },
      required: ["projectType"],
    },
  },

  {
    name: "suggest_import_sources",
    description: "Предлагает источники для импорта недостающего контента",
    input_schema: {
      type: "object",
      properties: {
        missingContentTypes: {
          type: "array",
          items: { type: "string" },
          description: "Типы недостающего контента",
        },
        projectBudget: {
          type: "string",
          enum: ["free", "low", "medium", "high"],
          description: "Бюджет проекта для предложений",
        },
        preferredSources: {
          type: "array",
          items: { type: "string", enum: ["stock-footage", "music-library", "user-generated", "ai-generated"] },
          description: "Предпочитаемые источники контента",
        },
      },
      required: ["missingContentTypes"],
    },
  },

  {
    name: "export_file_list",
    description: "Экспортирует список файлов из браузера в различных форматах",
    input_schema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["json", "csv", "text", "xml"],
          description: "Формат экспорта списка файлов",
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить метаданные файлов в экспорт",
          default: false,
        },
        filterCriteria: {
          type: "object",
          description: "Критерии для фильтрации экспортируемых файлов",
        },
      },
      required: ["format"],
    },
  },
]

/**
 * Типы событий браузера, которые могут генерировать инструменты
 */
export type BrowserToolEvent =
  | { type: "BROWSER_ANALYZED"; tab: string; filesFound: number }
  | { type: "FILES_SEARCHED"; query: string; resultsCount: number }
  | { type: "FILES_SELECTED"; count: number; criteria: any }
  | { type: "BROWSER_FILTERS_UPDATED"; tab: string; newFilters: any }
  | { type: "RELATIONSHIPS_ANALYZED"; files: string[]; relationships: any[] }

/**
 * Результат выполнения инструмента браузера
 */
export interface BrowserToolResult {
  success: boolean
  message: string
  data?: {
    files?: any[]
    groups?: any[]
    relationships?: any[]
    analysis?: any
    suggestions?: any[]
    selectedFiles?: string[]
    groupingStrategy?: string
    totalFiles?: number
    groupedFiles?: number
    analyzedFiles?: number
    relationshipTypes?: string[]
    selectionSummary?: any
    activeTab?: string
    currentFilters?: any
    stats?: any
    tab?: string
    updatedFilters?: any
    reason?: string
    projectType?: string
    currentContent?: any
    requirements?: any
    missingContent?: any
    recommendations?: string[]
    projectBudget?: string
    preferredSources?: string[]
    exportData?: string
    format?: string
    fileCount?: number
    includeMetadata?: boolean
  }
  errors?: string[]
  warnings?: string[]
  nextActions?: string[]
}

/**
 * Интерфейс для медиа файла
 */
interface MediaFile {
  id: string
  name: string
  path: string
  type: "video" | "audio" | "image"
  size: number
  duration?: number
  createdAt: Date
  modifiedAt: Date
  metadata?: {
    resolution?: { width: number; height: number }
    fps?: number
    codec?: string
    bitrate?: number
    hasAudio?: boolean
  }
  tags?: string[]
  isFavorite?: boolean
}

/**
 * Выполняет инструменты браузера
 */
export async function executeBrowserTool(toolName: string, input: Record<string, any>): Promise<BrowserToolResult> {
  try {
    switch (toolName) {
      case "analyze_media_browser":
        return await analyzeMediaBrowser(input)

      case "search_media_files":
        return await searchMediaFiles(input)

      case "get_file_groups":
        return await getFileGroups(input)

      case "analyze_file_relationships":
        return await analyzeFileRelationships(input)

      case "bulk_select_files":
        return await bulkSelectFiles(input)

      case "get_browser_state":
        return await getBrowserState(input)

      case "update_browser_filters":
        return await updateBrowserFilters(input)

      case "analyze_missing_content":
        return await analyzeMissingContent(input)

      case "suggest_import_sources":
        return await suggestImportSources(input)

      case "export_file_list":
        return await exportFileList(input)

      default:
        throw new Error(`Неизвестный browser инструмент: ${toolName}`)
    }
  } catch (error) {
    console.error(`Ошибка выполнения browser tool ${toolName}:`, error)
    return {
      success: false,
      message: `Ошибка выполнения инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

// Реализация функций инструментов

async function analyzeMediaBrowser(params: any): Promise<BrowserToolResult> {
  const { tab = "media", filters = {}, analysisDepth = "basic", includeMetadata = false } = params

  try {
    // Получаем файлы из указанной вкладки браузера
    const files = await getFilesFromBrowserTab(tab, filters)

    // Базовый анализ
    const analysis = {
      totalFiles: files.length,
      fileTypes: analyzeFileTypes(files),
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      totalDuration: files.reduce((sum, file) => sum + (file.duration || 0), 0),
      dateRange: getDateRange(files),
      qualityDistribution: analyzeQualityDistribution(files),
    }

    if (analysisDepth === "detailed" || analysisDepth === "full") {
      analysis.resolutionStats = analyzeResolutions(files)
      analysis.codecStats = analyzeCodecs(files)
      analysis.duplicates = findDuplicates(files)
    }

    if (analysisDepth === "full") {
      analysis.recommendations = generateRecommendations(files, analysis)
      analysis.missingContent = identifyMissingContent(files, tab)
    }

    return {
      success: true,
      message: `Анализ ${tab} вкладки завершен: найдено ${files.length} файлов`,
      data: {
        files: includeMetadata ? files : files.map((f) => ({ id: f.id, name: f.name, type: f.type })),
        analysis,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа браузера: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function searchMediaFiles(params: any): Promise<BrowserToolResult> {
  const { query, searchCriteria = {}, advancedFilters = {} } = params
  const { type = "any", sortBy = "relevance", sortOrder = "desc", limit = 50 } = searchCriteria

  try {
    // Поиск файлов
    let files = await getAllBrowserFiles()

    // Фильтрация по типу
    if (type !== "any") {
      files = files.filter((file) => file.type === type)
    }

    // Текстовый поиск
    if (query) {
      files = files.filter(
        (file) =>
          file.name.toLowerCase().includes(query.toLowerCase()) ||
          (file.tags && file.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))),
      )
    }

    // Продвинутые фильтры
    files = applyAdvancedFilters(files, advancedFilters)

    // Сортировка
    files = sortFiles(files, sortBy, sortOrder)

    // Ограничение результатов
    if (limit) {
      files = files.slice(0, limit)
    }

    return {
      success: true,
      message: `Найдено ${files.length} файлов по запросу "${query}"`,
      data: {
        files,
        searchMetadata: {
          query,
          totalResults: files.length,
          appliedFilters: { type, ...advancedFilters },
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка поиска файлов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function getFileGroups(params: any): Promise<BrowserToolResult> {
  const { groupingStrategy = "smart", includeMergedGroups = true, minGroupSize = 2 } = params

  try {
    const files = await getAllBrowserFiles()
    let groups: any[] = []

    switch (groupingStrategy) {
      case "by-date":
        groups = groupFilesByDate(files, minGroupSize)
        break
      case "by-location":
        groups = groupFilesByLocation(files, minGroupSize)
        break
      case "by-series":
        groups = groupFilesBySeries(files, minGroupSize)
        break
      case "by-type":
        groups = groupFilesByType(files, minGroupSize)
        break
      case "by-duration":
        groups = groupFilesByDuration(files, minGroupSize)
        break
      case "smart":
        groups = smartGroupFiles(files, minGroupSize)
        break
      default:
        groups = smartGroupFiles(files, minGroupSize)
        break
    }

    if (includeMergedGroups) {
      groups = mergeSimilarGroups(groups)
    }

    return {
      success: true,
      message: `Создано ${groups.length} групп файлов`,
      data: {
        groups,
        groupingStrategy,
        totalFiles: files.length,
        groupedFiles: groups.reduce((sum, group) => Number(sum) + Number(group.files.length), 0),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка группировки файлов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function analyzeFileRelationships(params: any): Promise<BrowserToolResult> {
  const { fileIds, relationshipTypes = ["sequence", "duplicate", "similar"], similarity = {} } = params

  try {
    const files = await getAllBrowserFiles()
    const targetFiles = fileIds ? files.filter((f) => fileIds.includes(f.id)) : files

    const relationships = []

    for (const type of relationshipTypes) {
      switch (type) {
        case "sequence":
          relationships.push(...findSequenceRelationships(targetFiles))
          break
        case "duplicate":
          relationships.push(...findDuplicateRelationships(targetFiles))
          break
        case "version":
          relationships.push(...findVersionRelationships(targetFiles))
          break
        case "similar":
          relationships.push(...findSimilarRelationships(targetFiles, similarity))
          break
        case "complementary":
          relationships.push(...findComplementaryRelationships(targetFiles))
          break
        default:
          break
      }
    }

    return {
      success: true,
      message: `Найдено ${relationships.length} связей между файлами`,
      data: {
        relationships,
        analyzedFiles: targetFiles.length,
        relationshipTypes,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа связей: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function bulkSelectFiles(params: any): Promise<BrowserToolResult> {
  const { selectionCriteria, purpose } = params
  const { method, filters = {}, maxCount, prioritize = [] } = selectionCriteria

  try {
    let files = await getAllBrowserFiles()

    // Применяем фильтры
    files = applySelectionFilters(files, filters)

    // Применяем приоритеты
    files = applySelectionPriorities(files, prioritize)

    let selectedFiles: MediaFile[] = []

    switch (method) {
      case "all-matching":
        selectedFiles = files
        break
      case "best-quality":
        selectedFiles = selectBestQuality(files, maxCount)
        break
      case "representative":
        selectedFiles = selectRepresentative(files, maxCount)
        break
      case "time-distributed":
        selectedFiles = selectTimeDistributed(files, maxCount)
        break
      case "manual-list":
        // Для manual-list ожидаем fileIds в filters
        selectedFiles = files.filter((f) => filters.fileIds?.includes(f.id))
        break
      default:
        selectedFiles = files.slice(0, maxCount)
        break
    }

    if (maxCount && selectedFiles.length > maxCount) {
      selectedFiles = selectedFiles.slice(0, maxCount)
    }

    return {
      success: true,
      message: `Выбрано ${selectedFiles.length} файлов для проекта "${purpose}"`,
      data: {
        selectedFiles: selectedFiles.map((f) => f.id),
        files: selectedFiles,
        selectionSummary: {
          method,
          totalAvailable: files.length,
          selected: selectedFiles.length,
          purpose,
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка массового выбора файлов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function getBrowserState(params: any): Promise<BrowserToolResult> {
  const { includeSelection = true, includeFilters = true, includeStats = false } = params

  try {
    if (!browserStateAccess) {
      return {
        success: false,
        message: "Browser state access not configured",
        errors: ["Browser state access not available"],
      }
    }

    const browserState = browserStateAccess.getBrowserState()
    if (!browserState) {
      return {
        success: false,
        message: "Browser state not available",
        errors: ["Browser state is null"],
      }
    }

    const result: any = {
      activeTab: browserState.activeTab,
    }

    if (includeFilters) {
      const currentTabSettings = browserState.tabSettings[browserState.activeTab]
      result.currentFilters = {
        searchQuery: currentTabSettings.searchQuery,
        showFavoritesOnly: currentTabSettings.showFavoritesOnly,
        sortBy: currentTabSettings.sortBy,
        sortOrder: currentTabSettings.sortOrder,
        groupBy: currentTabSettings.groupBy,
        filterType: currentTabSettings.filterType,
        viewMode: currentTabSettings.viewMode,
      }
    }

    if (includeSelection) {
      // Получаем выбранные файлы из browser state
      if (typeof window !== "undefined" && (window as any).browserContext) {
        const browserContext = (window as any).browserContext
        result.selectedFiles = browserContext.selectedFiles || []
      } else {
        result.selectedFiles = []
      }
    }

    if (includeStats) {
      const files = await getAllBrowserFiles()
      result.stats = {
        totalFiles: files.length,
        fileTypes: analyzeFileTypes(files),
        totalSize: files.reduce((sum, file) => {
          const size = typeof file.size === "string" ? Number.parseFloat(file.size) : file.size
          return sum + size
        }, 0),
      }
    }

    return {
      success: true,
      message: "Состояние браузера получено",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка получения состояния браузера: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function updateBrowserFilters(params: any): Promise<BrowserToolResult> {
  const { tab, newFilters, reason } = params

  try {
    // Интеграция с browser-state-machine для обновления фильтров
    if (typeof window !== "undefined" && (window as any).browserContext) {
      const browserContext = (window as any).browserContext

      // Отправляем событие обновления фильтров
      if (browserContext.send) {
        // Обновляем поисковый запрос
        if (newFilters.searchQuery !== undefined) {
          browserContext.send({
            type: "SET_SEARCH_QUERY",
            query: newFilters.searchQuery,
            tab: tab as BrowserTab,
          })
        }

        // Обновляем сортировку
        if (newFilters.sortBy || newFilters.sortOrder) {
          browserContext.send({
            type: "SET_SORT",
            sortBy: newFilters.sortBy || "name",
            sortOrder: newFilters.sortOrder || "asc",
            tab: tab as BrowserTab,
          })
        }

        // Обновляем группировку
        if (newFilters.groupBy !== undefined) {
          browserContext.send({
            type: "SET_GROUP_BY",
            groupBy: newFilters.groupBy,
            tab: tab as BrowserTab,
          })
        }

        // Обновляем фильтр
        if (newFilters.filterType !== undefined) {
          browserContext.send({
            type: "SET_FILTER",
            filterType: newFilters.filterType,
            tab: tab as BrowserTab,
          })
        }

        // Обновляем режим отображения
        if (newFilters.viewMode !== undefined) {
          browserContext.send({
            type: "SET_VIEW_MODE",
            viewMode: newFilters.viewMode,
            tab: tab as BrowserTab,
          })
        }
      }
    }

    return {
      success: true,
      message: `Фильтры для вкладки ${tab} обновлены. ${reason}`,
      data: {
        tab,
        updatedFilters: newFilters,
        reason,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка обновления фильтров: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function analyzeMissingContent(params: any): Promise<BrowserToolResult> {
  const { projectType, currentContent = {}, targetRequirements = {} } = params

  try {
    const files = await getAllBrowserFiles()
    const contentAnalysis = analyzeCurrentContent(files, currentContent)
    const requirements = getProjectRequirements(projectType, targetRequirements)

    const missingContent = identifyMissingContentForProject(contentAnalysis, requirements)
    const suggestions = generateContentSuggestions(missingContent, projectType)

    return {
      success: true,
      message: `Анализ недостающего контента для проекта "${projectType}" завершен`,
      data: {
        projectType,
        currentContent: contentAnalysis,
        requirements,
        missingContent,
        suggestions,
        recommendations: generateImportRecommendations(missingContent),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа недостающего контента: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function suggestImportSources(params: any): Promise<BrowserToolResult> {
  const { missingContentTypes, projectBudget = "medium", preferredSources = [] } = params

  try {
    const suggestions = []

    for (const contentType of missingContentTypes) {
      const sources = generateImportSources(contentType, projectBudget, preferredSources)
      suggestions.push({
        contentType,
        sources,
        priority: calculateSourcePriority(contentType, projectBudget),
      })
    }

    return {
      success: true,
      message: `Предложения источников для ${missingContentTypes.length} типов контента`,
      data: {
        suggestions,
        projectBudget,
        preferredSources,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка генерации предложений источников: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

async function exportFileList(params: any): Promise<BrowserToolResult> {
  const { format, includeMetadata = false, filterCriteria = {} } = params

  try {
    let files = await getAllBrowserFiles()

    // Применяем фильтры если указаны
    if (Object.keys(filterCriteria).length > 0) {
      files = applySelectionFilters(files, filterCriteria)
    }

    let exportData: string

    switch (format) {
      case "json":
        exportData = JSON.stringify(
          files.map((f) =>
            includeMetadata
              ? f
              : {
                id: f.id,
                name: f.name,
                type: f.type,
                size: f.size,
                duration: f.duration,
              },
          ),
          null,
          2,
        )
        break
      case "csv":
        exportData = generateCSV(files, includeMetadata)
        break
      case "text":
        exportData = files.map((f) => `${f.name} (${f.type}, ${formatFileSize(f.size)})`).join("\n")
        break
      case "xml":
        exportData = generateXML(files, includeMetadata)
        break
      default:
        throw new Error(`Неподдерживаемый формат экспорта: ${format}`)
    }

    return {
      success: true,
      message: `Список ${files.length} файлов экспортирован в формате ${format}`,
      data: {
        exportData,
        format,
        fileCount: files.length,
        includeMetadata,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка экспорта списка файлов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

// Вспомогательные функции

async function getFilesFromBrowserTab(tab: string, filters: any): Promise<MediaFile[]> {
  // Интеграция с browser state machine
  try {
    if (typeof window !== "undefined" && (window as any).browserContext) {
      const browserContext = (window as any).browserContext

      // Получаем данные в зависимости от типа вкладки
      switch (tab) {
        case "media":
          return await getMediaFiles(filters)
        case "music":
          return await getMusicFiles(filters)
        case "effects":
        case "filters":
        case "transitions":
          return await getResourceFiles(tab as ResourceType, filters)
        default:
          return []
      }
    }

    // Fallback к статическим данным
    return await getStaticBrowserFiles(tab, filters)
  } catch (error) {
    console.warn("Error getting browser files:", error)
    return getStaticBrowserFiles(tab, filters)
  }
}

async function getAllBrowserFiles(): Promise<MediaFile[]> {
  // Интеграция с browser state machine для получения всех файлов
  try {
    const allFiles: MediaFile[] = []

    // Получаем файлы со всех вкладок
    const tabs = ["media", "music", "effects", "filters", "transitions"]

    for (const tab of tabs) {
      const tabFiles = await getFilesFromBrowserTab(tab, {})
      allFiles.push(...tabFiles)
    }

    return allFiles
  } catch (error) {
    console.warn("Error getting all browser files:", error)

    // Fallback к статическим примерам
    return getStaticBrowserFiles("all", {})
  }
}

function analyzeFileTypes(files: MediaFile[]): Record<string, number> {
  return files.reduce<Record<string, number>>((stats, file) => {
    stats[file.type] = (stats[file.type] || 0) + 1
    return stats
  }, {})
}

function getDateRange(files: MediaFile[]): { earliest: Date | null; latest: Date | null } {
  if (files.length === 0) return { earliest: null, latest: null }

  const dates = files.map((f) => f.createdAt)
  return {
    earliest: new Date(Math.min(...dates.map((d) => d.getTime()))),
    latest: new Date(Math.max(...dates.map((d) => d.getTime()))),
  }
}

function analyzeQualityDistribution(files: MediaFile[]): Record<string, number> {
  // Простая логика определения качества по разрешению
  return files.reduce<Record<string, number>>((dist, file) => {
    if (!file.metadata?.resolution) {
      dist.unknown = (dist.unknown || 0) + 1
      return dist
    }

    const { width, height } = file.metadata.resolution
    const pixels = width * height

    if (pixels >= 1920 * 1080) dist.hd = (dist.hd || 0) + 1
    else if (pixels >= 1280 * 720) dist.hd = (dist.hd || 0) + 1
    else if (pixels >= 854 * 480) dist.sd = (dist.sd || 0) + 1
    else dist.low = (dist.low || 0) + 1

    return dist
  }, {})
}

function analyzeResolutions(files: MediaFile[]): any {
  const resolutions: Record<string, number> = {}

  files.forEach((file) => {
    if (file.type === "video" && file.metadata?.resolution) {
      const { width, height } = file.metadata.resolution
      const resolutionKey = `${width}x${height}`
      resolutions[resolutionKey] = (resolutions[resolutionKey] || 0) + 1
    }
  })

  // Классифицируем по качеству
  const qualityDistribution: Record<string, number> = {}

  Object.entries(resolutions).forEach(([resolution, count]) => {
    const [width, height] = resolution.split("x").map(Number)
    const pixels = width * height

    let quality = "unknown"
    if (pixels >= 3840 * 2160) quality = "4K"
    else if (pixels >= 2560 * 1440) quality = "2K"
    else if (pixels >= 1920 * 1080) quality = "Full HD"
    else if (pixels >= 1280 * 720) quality = "HD"
    else if (pixels >= 854 * 480) quality = "SD"
    else quality = "Low"

    qualityDistribution[quality] = (qualityDistribution[quality] || 0) + count
  })

  return {
    resolutions,
    qualityDistribution,
    totalVideoFiles: Object.values(resolutions).reduce((sum, count) => sum + count, 0),
  }
}

function analyzeCodecs(files: MediaFile[]): any {
  const videoCodecs: Record<string, number> = {}
  const audioCodecs: Record<string, number> = {}

  files.forEach((file) => {
    if (file.type === "video" && file.metadata?.codec) {
      videoCodecs[file.metadata.codec] = (videoCodecs[file.metadata.codec] || 0) + 1
    }

    if (file.type === "audio" && file.metadata?.codec) {
      audioCodecs[file.metadata.codec] = (audioCodecs[file.metadata.codec] || 0) + 1
    }
  })

  // Определяем компатибильность
  const compatibility = {
    modernCodecs: 0,
    legacyCodecs: 0,
    unknownCodecs: 0,
  }

  const modernVideoCodecs = ["h264", "h265", "vp9", "av1"]
  const modernAudioCodecs = ["aac", "opus", "flac"]

  Object.entries(videoCodecs).forEach(([codec, count]) => {
    if (modernVideoCodecs.includes(codec.toLowerCase())) {
      compatibility.modernCodecs += count
    } else if (codec.toLowerCase() === "unknown") {
      compatibility.unknownCodecs += count
    } else {
      compatibility.legacyCodecs += count
    }
  })

  Object.entries(audioCodecs).forEach(([codec, count]) => {
    if (modernAudioCodecs.includes(codec.toLowerCase())) {
      compatibility.modernCodecs += count
    } else if (codec.toLowerCase() === "unknown") {
      compatibility.unknownCodecs += count
    } else {
      compatibility.legacyCodecs += count
    }
  })

  return {
    videoCodecs,
    audioCodecs,
    compatibility,
    recommendations: generateCodecRecommendations(compatibility),
  }
}

function findDuplicates(files: MediaFile[]): any[] {
  const duplicates: any[] = []
  const seenFiles = new Map<string, MediaFile[]>()

  // Группируем файлы по ключам
  files.forEach((file) => {
    // Ключ на основе имени и размера
    const nameKey = file.name.toLowerCase().replace(/\s+/g, "")
    const sizeKey = String(file.size)
    const key = `${nameKey}_${sizeKey}`

    if (!seenFiles.has(key)) {
      seenFiles.set(key, [])
    }
    seenFiles.get(key)!.push(file)
  })

  // Находим дубликаты
  for (const [key, group] of seenFiles) {
    if (group.length > 1) {
      duplicates.push({
        key,
        files: group,
        count: group.length,
        type: "exact_match",
        totalSize: group.reduce((sum, f) => sum + f.size, 0),
      })
    }
  }

  // Поиск похожих файлов (по имени)
  const similarNames = new Map<string, MediaFile[]>()
  files.forEach((file) => {
    const baseName = file.name
      .replace(/\d+/g, "")
      .replace(/[_\-\s]+/g, "")
      .toLowerCase()
    if (baseName.length > 3) {
      if (!similarNames.has(baseName)) {
        similarNames.set(baseName, [])
      }
      similarNames.get(baseName)!.push(file)
    }
  })

  for (const [baseName, group] of similarNames) {
    if (group.length > 1) {
      // Проверяем, что это не точные дубликаты
      const isExactDuplicate = duplicates.some((dup) => dup.files.some((f: MediaFile) => group.includes(f)))

      if (!isExactDuplicate) {
        duplicates.push({
          key: `similar_${baseName}`,
          files: group,
          count: group.length,
          type: "similar_names",
          totalSize: group.reduce((sum, f) => sum + f.size, 0),
        })
      }
    }
  }

  return duplicates.sort((a, b) => b.totalSize - a.totalSize)
}

function generateRecommendations(files: MediaFile[], analysis: any): string[] {
  const recommendations: string[] = []

  // Анализ количества файлов
  if (files.length === 0) {
    recommendations.push("Начните с импорта медиафайлов в браузер")
    return recommendations
  }

  if (files.length < 5) {
    recommendations.push("Добавьте больше медиафайлов для создания полноценного проекта")
  }

  // Анализ типов файлов
  if (analysis.fileTypes) {
    const hasVideo = analysis.fileTypes.video > 0
    const hasAudio = analysis.fileTypes.audio > 0
    const hasImages = analysis.fileTypes.image > 0

    if (hasVideo && !hasAudio) {
      recommendations.push("Добавьте аудиофайлы для фоновой музыки")
    }

    if (hasAudio && !hasVideo && !hasImages) {
      recommendations.push("Добавьте видео или изображения для создания визуального контента")
    }
  }

  // Анализ качества
  if (analysis.qualityDistribution) {
    const totalFiles = Object.values(analysis.qualityDistribution).reduce((sum: number, count: any) => sum + count, 0)
    const lowQualityCount = analysis.qualityDistribution.low || 0

    if (lowQualityCount / totalFiles > 0.5) {
      recommendations.push("Большинство файлов имеет низкое качество - рассмотрите замену на HD/4K")
    }
  }

  // Анализ дубликатов
  const duplicates = findDuplicates(files)
  if (duplicates.length > 0) {
    const duplicateSize = duplicates.reduce((sum, dup) => sum + dup.totalSize, 0)
    recommendations.push(`Обнаружено ${duplicates.length} групп дубликатов (экономия ${formatFileSize(duplicateSize)})`)
  }

  // Анализ организации
  const untaggedFiles = files.filter((f) => !f.tags || f.tags.length === 0)
  if (untaggedFiles.length > files.length * 0.3) {
    recommendations.push("Добавьте теги к файлам для лучшей организации")
  }

  // Общие рекомендации
  if (files.length > 50) {
    recommendations.push("Используйте фильтры и поиск для быстрого нахождения нужных файлов")
  }

  return recommendations
}

function identifyMissingContent(files: MediaFile[], tab: string): any {
  const fileTypes = analyzeFileTypes(files)
  const missing: any = {
    content: [],
    recommendations: [],
    priority: "medium",
  }

  switch (tab) {
    case "media":
      if (!fileTypes.video || fileTypes.video === 0) {
        missing.content.push("Видеофайлы")
        missing.recommendations.push("Добавьте видео для создания основного контента")
      }

      if (!fileTypes.image || fileTypes.image === 0) {
        missing.content.push("Изображения")
        missing.recommendations.push("Добавьте изображения для слайдов и обложек")
      }
      break

    case "music":
      if (!fileTypes.audio || fileTypes.audio === 0) {
        missing.content.push("Аудиофайлы")
        missing.recommendations.push("Добавьте музыку для фонового сопровождения")
        missing.priority = "high"
      }
      break

    case "effects":
      if (files.length === 0) {
        missing.content.push("Основные эффекты")
        missing.recommendations.push("Установите пакет основных эффектов")
      }
      break

    case "filters":
      if (files.length === 0) {
        missing.content.push("Цветовые фильтры")
        missing.recommendations.push("Установите набор LUT фильтров")
      }
      break

    case "transitions":
      if (files.length === 0) {
        missing.content.push("Переходы")
        missing.recommendations.push("Добавьте переходы для плавной смены сцен")
      }
      break

    default:
      // Для других вкладок
      break
  }

  return missing
}

function applyAdvancedFilters(files: MediaFile[], filters: any): MediaFile[] {
  let filteredFiles = [...files]

  // Фильтр по типу
  if (filters.fileTypes && filters.fileTypes.length > 0) {
    filteredFiles = filteredFiles.filter((file) => filters.fileTypes.includes(file.type))
  }

  // Фильтр по дате
  if (filters.dateRange) {
    const { start, end } = filters.dateRange
    if (start) {
      const startDate = new Date(start)
      filteredFiles = filteredFiles.filter((file) => file.createdAt >= startDate)
    }
    if (end) {
      const endDate = new Date(end)
      filteredFiles = filteredFiles.filter((file) => file.createdAt <= endDate)
    }
  }

  // Фильтр по размеру
  if (filters.sizeRange) {
    const { min, max } = filters.sizeRange
    if (min !== undefined) {
      filteredFiles = filteredFiles.filter((file) => file.size >= min)
    }
    if (max !== undefined) {
      filteredFiles = filteredFiles.filter((file) => file.size <= max)
    }
  }

  // Фильтр по длительности
  if (filters.durationRange) {
    const { min, max } = filters.durationRange
    if (min !== undefined) {
      filteredFiles = filteredFiles.filter((file) => (file.duration || 0) >= min)
    }
    if (max !== undefined) {
      filteredFiles = filteredFiles.filter((file) => (file.duration || 0) <= max)
    }
  }

  // Фильтр по поисковому запросу
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    filteredFiles = filteredFiles.filter((file) => {
      return (
        file.name.toLowerCase().includes(query) ||
        file.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        file.path.toLowerCase().includes(query)
      )
    })
  }

  // Фильтр по тегам
  if (filters.tags && filters.tags.length > 0) {
    filteredFiles = filteredFiles.filter((file) => {
      return filters.tags.some((tag: string) =>
        file.tags?.some((fileTag) => fileTag.toLowerCase().includes(tag.toLowerCase())),
      )
    })
  }

  // Фильтр по избранным
  if (filters.favoritesOnly) {
    filteredFiles = filteredFiles.filter((file) => file.isFavorite)
  }

  return filteredFiles
}

function sortFiles(files: MediaFile[], sortBy: string, sortOrder: string): MediaFile[] {
  return files.sort((a, b) => {
    let compareValue = 0

    switch (sortBy) {
      case "name":
        compareValue = a.name.localeCompare(b.name)
        break
      case "date":
        const dateA = new Date(a.startTime || 0).getTime()
        const dateB = new Date(b.startTime || 0).getTime()
        compareValue = dateA - dateB
        break
      case "size":
        const sizeA = typeof a.size === "string" ? Number.parseFloat(a.size) : a.size
        const sizeB = typeof b.size === "string" ? Number.parseFloat(b.size) : b.size
        compareValue = sizeA - sizeB
        break
      case "duration":
        const durA = typeof a.duration === "string" ? Number.parseFloat(a.duration) : a.duration || 0
        const durB = typeof b.duration === "string" ? Number.parseFloat(b.duration) : b.duration || 0
        compareValue = durA - durB
        break
      default:
        compareValue = 0
    }

    return sortOrder === "desc" ? -compareValue : compareValue
  })
}

// Функции группировки
function groupFilesByDate(files: MediaFile[], minGroupSize: number): any[] {
  const groups = new Map<string, MediaFile[]>()

  files.forEach((file) => {
    const date = new Date(file.createdAt)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(file)
  })

  // Фильтруем по минимальному размеру группы
  const result: any[] = []
  for (const [dateKey, groupFiles] of groups) {
    if (groupFiles.length >= minGroupSize) {
      result.push({
        key: dateKey,
        name: `Файлы от ${dateKey}`,
        files: groupFiles,
        count: groupFiles.length,
        type: "date",
        date: new Date(dateKey),
      })
    }
  }

  return result.sort((a, b) => b.date.getTime() - a.date.getTime())
}

function groupFilesByLocation(files: MediaFile[], minGroupSize: number): any[] {
  const groups = new Map<string, MediaFile[]>()

  files.forEach((file) => {
    // Извлекаем папку из пути
    const pathParts = file.path.split("/")
    const location = pathParts.length > 1 ? pathParts[pathParts.length - 2] : "root"

    if (!groups.has(location)) {
      groups.set(location, [])
    }
    groups.get(location)!.push(file)
  })

  const result: any[] = []
  for (const [location, groupFiles] of groups) {
    if (groupFiles.length >= minGroupSize) {
      result.push({
        key: location,
        name: `Папка: ${location}`,
        files: groupFiles,
        count: groupFiles.length,
        type: "location",
        location,
      })
    }
  }

  return result.sort((a, b) => b.count - a.count)
}

function groupFilesBySeries(files: MediaFile[], minGroupSize: number): any[] {
  const groups = new Map<string, MediaFile[]>()

  files.forEach((file) => {
    // Убираем цифры и расширение для поиска серий
    const baseName = file.name
      .replace(/\d+/g, "") // Убираем цифры
      .replace(/\.[^.]+$/, "") // Убираем расширение
      .replace(/[_\-\s]+/g, "_") // Нормализуем разделители
      .toLowerCase()
      .trim()

    if (baseName.length > 2) {
      if (!groups.has(baseName)) {
        groups.set(baseName, [])
      }
      groups.get(baseName)!.push(file)
    }
  })

  const result: any[] = []
  for (const [baseName, groupFiles] of groups) {
    if (groupFiles.length >= minGroupSize) {
      result.push({
        key: baseName,
        name: `Серия: ${baseName}`,
        files: groupFiles.sort((a, b) => a.name.localeCompare(b.name)),
        count: groupFiles.length,
        type: "series",
        series: baseName,
      })
    }
  }

  return result.sort((a, b) => b.count - a.count)
}

function groupFilesByType(files: MediaFile[], minGroupSize: number): any[] {
  const groups = new Map<string, MediaFile[]>()

  files.forEach((file) => {
    if (!groups.has(file.type)) {
      groups.set(file.type, [])
    }
    groups.get(file.type)!.push(file)
  })

  const result: any[] = []
  for (const [fileType, groupFiles] of groups) {
    if (groupFiles.length >= minGroupSize) {
      result.push({
        key: fileType,
        name: `Тип: ${fileType}`,
        files: groupFiles,
        count: groupFiles.length,
        type: "file_type",
        fileType,
      })
    }
  }

  return result.sort((a, b) => b.count - a.count)
}

function groupFilesByDuration(files: MediaFile[], minGroupSize: number): any[] {
  const groups = new Map<string, MediaFile[]>()

  files.forEach((file) => {
    if (file.duration) {
      let durationCategory = "unknown"

      if (file.duration < 30)
        durationCategory = "short" // < 30 сек
      else if (file.duration < 300)
        durationCategory = "medium" // 30 сек - 5 мин
      else if (file.duration < 1800)
        durationCategory = "long" // 5-30 мин
      else durationCategory = "very_long" // > 30 мин

      if (!groups.has(durationCategory)) {
        groups.set(durationCategory, [])
      }
      groups.get(durationCategory)!.push(file)
    }
  })

  const categoryNames = {
    short: "Короткие (< 30 сек)",
    medium: "Средние (30 сек - 5 мин)",
    long: "Длинные (5-30 мин)",
    very_long: "Очень длинные (> 30 мин)",
    unknown: "Неизвестная длительность",
  }

  const result: any[] = []
  for (const [category, groupFiles] of groups) {
    if (groupFiles.length >= minGroupSize) {
      result.push({
        key: category,
        name: categoryNames[category as keyof typeof categoryNames] || category,
        files: groupFiles,
        count: groupFiles.length,
        type: "duration",
        category,
      })
    }
  }

  return result.sort((a, b) => b.count - a.count)
}

function smartGroupFiles(files: MediaFile[], minGroupSize: number): any[] {
  // Комбинируем несколько стратегий группировки
  const allGroups: any[] = []

  // Группировка по сериям (приоритет)
  allGroups.push(...groupFilesBySeries(files, minGroupSize))

  // Группировка по дате для файлов, не попавших в серии
  const seriesFiles = new Set(allGroups.flatMap((g) => g.files.map((f: MediaFile) => f.id)))
  const nonSeriesFiles = files.filter((f) => !seriesFiles.has(f.id))

  if (nonSeriesFiles.length > 0) {
    allGroups.push(...groupFilesByDate(nonSeriesFiles, minGroupSize))
  }

  // Группировка по типу для оставшихся файлов
  const groupedFiles = new Set(allGroups.flatMap((g) => g.files.map((f: MediaFile) => f.id)))
  const ungroupedFiles = files.filter((f) => !groupedFiles.has(f.id))

  if (ungroupedFiles.length > 0) {
    allGroups.push(...groupFilesByType(ungroupedFiles, Math.max(1, minGroupSize)))
  }

  return allGroups.sort((a, b) => {
    // Приоритет: серии > дата > тип
    const priorities = { series: 3, date: 2, file_type: 1 }
    const priorityA = priorities[a.type as keyof typeof priorities] || 0
    const priorityB = priorities[b.type as keyof typeof priorities] || 0

    if (priorityA !== priorityB) return priorityB - priorityA
    return b.count - a.count
  })
}

// Функции анализа связей между файлами
function findSequenceRelationships(files: MediaFile[]): any[] {
  const relationships: any[] = []

  // Группируем файлы по базовому имени
  const groups = new Map<string, MediaFile[]>()

  files.forEach((file) => {
    const baseName = file.name
      .replace(/\d+/g, "")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .trim()
    if (!groups.has(baseName)) {
      groups.set(baseName, [])
    }
    groups.get(baseName)!.push(file)
  })

  // Ищем последовательности
  for (const [baseName, groupFiles] of groups) {
    if (groupFiles.length > 1) {
      // Сортируем файлы по номеру в имени
      const sorted = groupFiles.sort((a, b) => {
        const numA = Number.parseInt(/\d+/.exec(a.name)?.[0] || "0")
        const numB = Number.parseInt(/\d+/.exec(b.name)?.[0] || "0")
        return numA - numB
      })

      for (let i = 0; i < sorted.length - 1; i++) {
        relationships.push({
          type: "sequence",
          from: sorted[i].id,
          to: sorted[i + 1].id,
          confidence: 0.9,
          metadata: {
            series: baseName,
            position: i + 1,
            totalInSeries: sorted.length,
          },
        })
      }
    }
  }

  return relationships
}

function findDuplicateRelationships(files: MediaFile[]): any[] {
  const relationships: any[] = []
  const duplicateGroups = findDuplicates(files)

  duplicateGroups.forEach((group) => {
    const groupFiles = group.files
    for (let i = 0; i < groupFiles.length; i++) {
      for (let j = i + 1; j < groupFiles.length; j++) {
        relationships.push({
          type: "duplicate",
          from: groupFiles[i].id,
          to: groupFiles[j].id,
          confidence: group.type === "exact_match" ? 1.0 : 0.7,
          metadata: {
            duplicateType: group.type,
            savings: formatFileSize(groupFiles[j].size),
          },
        })
      }
    }
  })

  return relationships
}

function findVersionRelationships(files: MediaFile[]): any[] {
  const relationships: any[] = []

  // Ищем файлы с версионированием (v1, v2, _final, _edit, etc.)
  const versionPatterns = [/v\d+/i, /_v\d+/i, /_final/i, /_edit/i, /_draft/i, /_copy/i, /\(\d+\)/]

  files.forEach((file) => {
    const fileName = file.name.toLowerCase()

    for (const pattern of versionPatterns) {
      if (pattern.test(fileName)) {
        // Ищем базовое имя файла
        const baseName = fileName.replace(pattern, "").replace(/\.[^.]+$/, "")

        // Ищем другие версии этого файла
        const relatedFiles = files.filter((f) => {
          const otherName = f.name.toLowerCase().replace(/\.[^.]+$/, "")
          return f.id !== file.id && otherName.includes(baseName)
        })

        relatedFiles.forEach((relatedFile) => {
          relationships.push({
            type: "version",
            from: file.id,
            to: relatedFile.id,
            confidence: 0.8,
            metadata: {
              baseName,
              pattern: pattern.source,
            },
          })
        })
        break
      }
    }
  })

  return relationships
}

function findSimilarRelationships(files: MediaFile[], similarity: any = {}): any[] {
  const relationships: any[] = []
  const { threshold = 0.7, considerSize = true, considerDuration = true } = similarity

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const fileA = files[i]
      const fileB = files[j]

      let similarityScore = 0
      let factors = 0

      // Сравнение имен
      const nameA = fileA.name.toLowerCase()
      const nameB = fileB.name.toLowerCase()
      const nameSimilarity = calculateStringSimilarity(nameA, nameB)
      similarityScore += nameSimilarity
      factors++

      // Сравнение размеров
      if (considerSize && fileA.size && fileB.size) {
        const sizeDiff = Math.abs(fileA.size - fileB.size) / Math.max(fileA.size, fileB.size)
        const sizeSimilarity = 1 - sizeDiff
        similarityScore += sizeSimilarity
        factors++
      }

      // Сравнение длительности
      if (considerDuration && fileA.duration && fileB.duration) {
        const durationDiff = Math.abs(fileA.duration - fileB.duration) / Math.max(fileA.duration, fileB.duration)
        const durationSimilarity = 1 - durationDiff
        similarityScore += durationSimilarity
        factors++
      }

      const averageSimilarity = similarityScore / factors

      if (averageSimilarity >= threshold) {
        relationships.push({
          type: "similar",
          from: fileA.id,
          to: fileB.id,
          confidence: averageSimilarity,
          metadata: {
            nameSimilarity,
            sizeSimilarity: considerSize
              ? 1 - Math.abs(fileA.size - fileB.size) / Math.max(fileA.size, fileB.size)
              : null,
            durationSimilarity:
              considerDuration && fileA.duration && fileB.duration
                ? 1 - Math.abs(fileA.duration - fileB.duration) / Math.max(fileA.duration, fileB.duration)
                : null,
          },
        })
      }
    }
  }

  return relationships
}

function findComplementaryRelationships(files: MediaFile[]): any[] {
  const relationships: any[] = []

  // Ищем комплементарные файлы (видео + аудио, изображение + аудио, etc.)
  const videoFiles = files.filter((f) => f.type === "video")
  const audioFiles = files.filter((f) => f.type === "audio")
  const imageFiles = files.filter((f) => f.type === "image")

  // Видео + Аудио комбинации
  videoFiles.forEach((video) => {
    audioFiles.forEach((audio) => {
      const nameSimilarity = calculateStringSimilarity(
        video.name.toLowerCase().replace(/\.[^.]+$/, ""),
        audio.name.toLowerCase().replace(/\.[^.]+$/, ""),
      )

      if (nameSimilarity > 0.6) {
        relationships.push({
          type: "complementary",
          from: video.id,
          to: audio.id,
          confidence: nameSimilarity,
          metadata: {
            relationship: "video_audio",
            suggestion: "Подходит для синхронизации звука",
          },
        })
      }
    })
  })

  // Изображение + Аудио для слайд-шоу
  imageFiles.forEach((image) => {
    audioFiles.forEach((audio) => {
      if (audio.duration && audio.duration > 30) {
        // Достаточно длинное аудио
        relationships.push({
          type: "complementary",
          from: image.id,
          to: audio.id,
          confidence: 0.5,
          metadata: {
            relationship: "image_audio",
            suggestion: "Подходит для создания слайд-шоу",
          },
        })
      }
    })
  })

  return relationships
}

// Функции выбора файлов
function applySelectionFilters(files: MediaFile[], filters: any): MediaFile[] {
  let filtered = [...files]

  if (filters.fileTypes) {
    filtered = filtered.filter((f) => filters.fileTypes.includes(f.type))
  }

  if (filters.tags) {
    filtered = filtered.filter((f) => filters.tags.some((tag: string) => f.tags?.includes(tag)))
  }

  if (filters.sizeRange) {
    const { min, max } = filters.sizeRange
    if (min) filtered = filtered.filter((f) => f.size >= min)
    if (max) filtered = filtered.filter((f) => f.size <= max)
  }

  if (filters.durationRange) {
    const { min, max } = filters.durationRange
    if (min) filtered = filtered.filter((f) => (f.duration || 0) >= min)
    if (max) filtered = filtered.filter((f) => (f.duration || 0) <= max)
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange
    if (start) filtered = filtered.filter((f) => f.createdAt >= new Date(start))
    if (end) filtered = filtered.filter((f) => f.createdAt <= new Date(end))
  }

  return filtered
}

function applySelectionPriorities(files: MediaFile[], priorities: string[]): MediaFile[] {
  if (!priorities.length) return files

  return files.sort((a, b) => {
    for (const priority of priorities) {
      switch (priority) {
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime()
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime()
        case "largest":
          return b.size - a.size
        case "smallest":
          return a.size - b.size
        case "longest":
          return (b.duration || 0) - (a.duration || 0)
        case "shortest":
          return (a.duration || 0) - (b.duration || 0)
        case "favorites":
          if (a.isFavorite && !b.isFavorite) return -1
          if (!a.isFavorite && b.isFavorite) return 1
          break
        case "high_quality":
          const qualityA = getFileQualityScore(a)
          const qualityB = getFileQualityScore(b)
          return qualityB - qualityA
        default:
          // Неизвестный приоритет
          break
      }
    }
    return 0
  })
}

function selectBestQuality(files: MediaFile[], maxCount?: number): MediaFile[] {
  const sorted = files.sort((a, b) => getFileQualityScore(b) - getFileQualityScore(a))
  return maxCount ? sorted.slice(0, maxCount) : sorted
}

function selectRepresentative(files: MediaFile[], maxCount?: number): MediaFile[] {
  if (!maxCount || files.length <= maxCount) return files

  // Алгоритм выбора репрезентативной выборки
  const step = Math.floor(files.length / maxCount)
  const representative: MediaFile[] = []

  for (let i = 0; i < files.length; i += step) {
    if (representative.length < maxCount) {
      representative.push(files[i])
    }
  }

  return representative
}

function selectTimeDistributed(files: MediaFile[], maxCount?: number): MediaFile[] {
  if (!maxCount || files.length <= maxCount) return files

  // Сортируем по дате создания
  const sorted = files.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  if (sorted.length === 0) return []

  const selected: MediaFile[] = []
  const timeRange = sorted[sorted.length - 1].createdAt.getTime() - sorted[0].createdAt.getTime()
  const timeStep = timeRange / maxCount

  let currentTime = sorted[0].createdAt.getTime()
  let fileIndex = 0

  for (let i = 0; i < maxCount && fileIndex < sorted.length; i++) {
    // Находим ближайший файл к текущему времени
    while (
      fileIndex < sorted.length - 1 &&
      Math.abs(sorted[fileIndex + 1].createdAt.getTime() - currentTime) <
        Math.abs(sorted[fileIndex].createdAt.getTime() - currentTime)
    ) {
      fileIndex++
    }

    if (fileIndex < sorted.length) {
      selected.push(sorted[fileIndex])
      fileIndex++ // Переходим к следующему файлу
    }

    currentTime += timeStep
  }

  return selected
}

// Вспомогательные функции
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator)
    }
  }

  return matrix[str2.length][str1.length]
}

function getFileQualityScore(file: MediaFile): number {
  let score = 0

  // Оценка разрешения для видео
  if (file.type === "video" && file.metadata?.resolution) {
    const { width, height } = file.metadata.resolution
    const pixels = width * height

    if (pixels >= 3840 * 2160)
      score += 100 // 4K
    else if (pixels >= 2560 * 1440)
      score += 80 // 2K
    else if (pixels >= 1920 * 1080)
      score += 60 // Full HD
    else if (pixels >= 1280 * 720)
      score += 40 // HD
    else score += 20 // SD и ниже
  }

  // Оценка битрейта
  if (file.metadata?.bitrate) {
    if (file.metadata.bitrate >= 10000) score += 30
    else if (file.metadata.bitrate >= 5000) score += 20
    else if (file.metadata.bitrate >= 2000) score += 10
  }

  // Оценка кодека
  if (file.metadata?.codec) {
    const modernCodecs = ["h264", "h265", "vp9", "av1"]
    if (modernCodecs.includes(file.metadata.codec.toLowerCase())) {
      score += 20
    }
  }

  // Оценка размера файла (больше = лучше качество, но с разумными пределами)
  if (file.size > 0) {
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 100) score += 10
    else if (sizeMB > 50) score += 5
  }

  return score
}

function mergeSimilarGroups(groups: any[]): any[] {
  // Простая логика объединения похожих групп
  const merged: any[] = []
  const processed = new Set<string>()

  for (const group of groups) {
    if (processed.has(group.key)) continue

    const similar = groups.filter(
      (g) =>
        g.key !== group.key &&
        !processed.has(g.key) &&
        g.type === group.type &&
        calculateStringSimilarity(g.key, group.key) > 0.8,
    )

    if (similar.length > 0) {
      const mergedFiles = [group, ...similar].flatMap((g) => g.files)
      merged.push({
        key: `merged_${group.key}`,
        name: `Объединенная группа: ${group.name}`,
        files: mergedFiles,
        count: mergedFiles.length,
        type: group.type,
        subGroups: [group, ...similar],
      })

      processed.add(group.key)
      similar.forEach((g) => processed.add(g.key))
    } else {
      merged.push(group)
      processed.add(group.key)
    }
  }

  return merged
}

function generateCodecRecommendations(compatibility: any): string[] {
  const recommendations: string[] = []

  if (compatibility.legacyCodecs > compatibility.modernCodecs) {
    recommendations.push("Рекомендуется перекодировать устаревшие форматы в H.264/H.265")
  }

  if (compatibility.unknownCodecs > 0) {
    recommendations.push("Проверьте файлы с неопределенными кодеками")
  }

  if (compatibility.modernCodecs === 0) {
    recommendations.push("Добавьте файлы в современных форматах для лучшей совместимости")
  }

  return recommendations
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

function generateCSV(files: MediaFile[], includeMetadata: boolean): string {
  const headers = ["Name", "Type", "Size", "Duration", "Created"]
  if (includeMetadata) {
    headers.push("Path", "Resolution", "Codec", "Bitrate")
  }

  const rows = [headers.join(",")]

  files.forEach((file) => {
    const row = [
      escapeCsv(file.name),
      file.type,
      file.size.toString(),
      (file.duration || 0).toString(),
      file.createdAt.toISOString(),
    ]

    if (includeMetadata) {
      row.push(
        escapeCsv(file.path),
        file.metadata?.resolution ? `${file.metadata.resolution.width}x${file.metadata.resolution.height}` : "",
        file.metadata?.codec || "",
        file.metadata?.bitrate?.toString() || "",
      )
    }

    rows.push(row.join(","))
  })

  return rows.join("\n")
}

function generateXML(files: MediaFile[], includeMetadata: boolean): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<files>\n'

  files.forEach((file) => {
    xml += "  <file>\n"
    xml += `    <name>${escapeXml(file.name)}</name>\n`
    xml += `    <type>${file.type}</type>\n`
    xml += `    <size>${file.size}</size>\n`
    xml += `    <duration>${file.duration || 0}</duration>\n`
    xml += `    <created>${file.createdAt.toISOString()}</created>\n`

    if (includeMetadata) {
      xml += `    <path>${escapeXml(file.path)}</path>\n`
      if (file.metadata?.resolution) {
        xml += "    <resolution>\n"
        xml += `      <width>${file.metadata.resolution.width}</width>\n`
        xml += `      <height>${file.metadata.resolution.height}</height>\n`
        xml += "    </resolution>\n"
      }
      if (file.metadata?.codec) {
        xml += `    <codec>${escapeXml(file.metadata.codec)}</codec>\n`
      }
      if (file.metadata?.bitrate) {
        xml += `    <bitrate>${file.metadata.bitrate}</bitrate>\n`
      }
    }

    xml += "  </file>\n"
  })

  xml += "</files>"
  return xml
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case "&":
        return "&amp;"
      case "'":
        return "&apos;"
      case '"':
        return "&quot;"
      default:
        return c
    }
  })
}

// Заглушки для статических данных (fallback когда браузер недоступен)
async function getStaticBrowserFiles(tab: string, _filters: any): Promise<MediaFile[]> {
  // Возвращаем пустой массив для статических данных
  console.warn(`Using static fallback for tab: ${tab}`)
  return []
}

async function getMediaFiles(filters: any): Promise<MediaFile[]> {
  // Интеграция с реальным API браузера медиафайлов
  if (typeof window !== "undefined" && (window as any).browserContext?.getMediaFiles) {
    return await (window as any).browserContext.getMediaFiles(filters)
  }
  return []
}

async function getMusicFiles(filters: any): Promise<MediaFile[]> {
  // Интеграция с реальным API браузера музыки
  if (typeof window !== "undefined" && (window as any).browserContext?.getMusicFiles) {
    return await (window as any).browserContext.getMusicFiles(filters)
  }
  return []
}

async function getResourceFiles(resourceType: ResourceType, filters: any): Promise<MediaFile[]> {
  // Интеграция с ресурс-провайдером
  if (typeof window !== "undefined" && (window as any).resourcesContext) {
    const resourcesContext = (window as any).resourcesContext
    const resources = resourcesContext.getResources(resourceType, filters)

    // Конвертируем ресурсы в MediaFile формат
    return resources.map((resource: any) => ({
      id: resource.id,
      name: resource.name,
      type: resourceType === "effect" ? "video" : "audio",
      path: resource.path || "",
      size: resource.size || 0,
      duration: resource.duration,
      createdAt: new Date(resource.createdAt || Date.now()),
      metadata: resource.metadata,
      tags: resource.tags,
      isFavorite: resource.isFavorite,
    }))
  }
  return []
}

// Интерфейс для доступа к browser state machine
interface BrowserStateAccess {
  getBrowserState(): any
  updateBrowserFilter(tab: string, filters: any): void
  sendEvent(event: any): void
}

// Глобальная переменная для доступа к browser state
let browserStateAccess: BrowserStateAccess | null = null

// Функция для инициализации доступа к browser state
export function initializeBrowserStateAccess(access: BrowserStateAccess) {
  browserStateAccess = access
}
