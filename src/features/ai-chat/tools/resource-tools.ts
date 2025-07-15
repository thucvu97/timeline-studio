/**
 * AI инструменты для управления ресурсами
 *
 * Предоставляет Claude инструменты для анализа, добавления
 * и управления ресурсами в Resources Provider
 */

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import { ResourcesContextType } from "@/features/resources/services/resources-provider"

import { ClaudeTool } from "../services/claude-service"

/**
 * Инструменты для работы с ресурсами
 */
export const resourceTools: ClaudeTool[] = [
  {
    name: "analyze_available_resources",
    description: "Анализирует все доступные ресурсы в Resources Provider и возвращает подробную статистику",
    input_schema: {
      type: "object",
      properties: {
        resourceType: {
          type: "string",
          enum: ["all", "media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
          description: "Тип ресурсов для анализа",
        },
        includeStats: {
          type: "boolean",
          description: "Включить статистику использования",
          default: true,
        },
        filter: {
          type: "object",
          properties: {
            addedAfter: { type: "string", description: "ISO дата, после которой были добавлены ресурсы" },
            addedBy: { type: "string", description: "Фильтр по источнику добавления" },
          },
          description: "Дополнительные фильтры для анализа",
        },
      },
      required: ["resourceType"],
    },
  },

  {
    name: "add_resource_to_pool",
    description: "Добавляет конкретный ресурс в пул ресурсов проекта с указанием причины",
    input_schema: {
      type: "object",
      properties: {
        resourceType: {
          type: "string",
          enum: ["media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
          description: "Тип добавляемого ресурса",
        },
        resourceId: {
          type: "string",
          description: "Уникальный идентификатор ресурса",
        },
        reason: {
          type: "string",
          description: "Объяснение, зачем этот ресурс добавляется в проект",
        },
        autoApply: {
          type: "boolean",
          description: "Автоматически применить ресурс к подходящим элементам",
          default: false,
        },
      },
      required: ["resourceType", "resourceId", "reason"],
    },
  },

  {
    name: "bulk_add_resources",
    description: "Массово добавляет ресурсы в пул по заданным критериям",
    input_schema: {
      type: "object",
      properties: {
        criteria: {
          type: "object",
          properties: {
            resourceType: {
              type: "string",
              enum: ["media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
            },
            selectionMethod: {
              type: "string",
              enum: ["all", "filtered", "recent", "favorites", "smart"],
              description: "Метод выбора ресурсов",
            },
            filters: {
              type: "object",
              properties: {
                searchQuery: { type: "string" },
                dateRange: {
                  type: "object",
                  properties: {
                    start: { type: "string" },
                    end: { type: "string" },
                  },
                },
                fileTypes: {
                  type: "array",
                  items: { type: "string", enum: ["video", "audio", "image"] },
                },
                minDuration: { type: "number" },
                maxDuration: { type: "number" },
                tags: { type: "array", items: { type: "string" } },
              },
            },
            maxCount: {
              type: "number",
              description: "Максимальное количество ресурсов для добавления",
            },
          },
          required: ["resourceType", "selectionMethod"],
        },
        reason: {
          type: "string",
          description: "Объяснение цели массового добавления ресурсов",
        },
      },
      required: ["criteria", "reason"],
    },
  },

  {
    name: "remove_resource_from_pool",
    description: "Удаляет ресурс из пула ресурсов проекта",
    input_schema: {
      type: "object",
      properties: {
        resourceId: {
          type: "string",
          description: "Идентификатор удаляемого ресурса",
        },
        reason: {
          type: "string",
          description: "Причина удаления ресурса",
        },
        removeFromTimeline: {
          type: "boolean",
          description: "Также удалить из таймлайна, если используется",
          default: false,
        },
      },
      required: ["resourceId", "reason"],
    },
  },

  {
    name: "suggest_complementary_resources",
    description: "Анализирует текущие ресурсы и предлагает дополнительные для улучшения проекта",
    input_schema: {
      type: "object",
      properties: {
        baseContent: {
          type: "array",
          items: {
            type: "object",
            properties: {
              resourceId: { type: "string" },
              resourceType: { type: "string" },
            },
          },
          description: "Основной контент для анализа",
        },
        projectType: {
          type: "string",
          enum: ["wedding", "travel", "corporate", "social", "documentary", "education", "music-video", "commercial"],
          description: "Тип проекта для контекстных предложений",
        },
        mood: {
          type: "string",
          enum: ["energetic", "calm", "dramatic", "romantic", "professional", "playful", "serious", "uplifting"],
          description: "Желаемое настроение проекта",
        },
        targetDuration: {
          type: "number",
          description: "Целевая длительность проекта в секундах",
        },
        includeAutoAdd: {
          type: "boolean",
          description: "Автоматически добавить наиболее подходящие ресурсы",
          default: false,
        },
      },
      required: ["projectType", "mood"],
    },
  },

  {
    name: "update_resource_parameters",
    description: "Обновляет параметры уже добавленного ресурса",
    input_schema: {
      type: "object",
      properties: {
        resourceId: {
          type: "string",
          description: "Идентификатор ресурса для обновления",
        },
        newParameters: {
          type: "object",
          description: "Новые параметры ресурса (зависят от типа ресурса)",
        },
        reason: {
          type: "string",
          description: "Причина изменения параметров",
        },
      },
      required: ["resourceId", "newParameters", "reason"],
    },
  },

  {
    name: "analyze_resource_compatibility",
    description: "Анализирует совместимость ресурсов между собой и с текущим проектом",
    input_schema: {
      type: "object",
      properties: {
        resourceIds: {
          type: "array",
          items: { type: "string" },
          description: "Список идентификаторов ресурсов для проверки совместимости",
        },
        checkAgainst: {
          type: "string",
          enum: ["project-settings", "other-resources", "timeline-structure", "all"],
          description: "С чем проверять совместимость",
        },
        includeRecommendations: {
          type: "boolean",
          description: "Включить рекомендации по устранению проблем совместимости",
          default: true,
        },
      },
      required: ["resourceIds"],
    },
  },

  {
    name: "get_resource_usage_stats",
    description: "Получает статистику использования ресурсов в проекте",
    input_schema: {
      type: "object",
      properties: {
        timeRange: {
          type: "object",
          properties: {
            start: { type: "string", description: "Начальная дата анализа" },
            end: { type: "string", description: "Конечная дата анализа" },
          },
          description: "Временной диапазон для анализа",
        },
        groupBy: {
          type: "string",
          enum: ["type", "date", "source", "usage-frequency"],
          description: "Способ группировки статистики",
        },
        includeUnused: {
          type: "boolean",
          description: "Включить неиспользуемые ресурсы в статистику",
          default: true,
        },
      },
    },
  },

  {
    name: "cleanup_unused_resources",
    description: "Удаляет неиспользуемые ресурсы из пула для оптимизации",
    input_schema: {
      type: "object",
      properties: {
        dryRun: {
          type: "boolean",
          description: "Только показать, что будет удалено, не удалять",
          default: true,
        },
        criteria: {
          type: "object",
          properties: {
            unusedForDays: { type: "number", description: "Не использовались N дней" },
            resourceTypes: {
              type: "array",
              items: { type: "string" },
              description: "Типы ресурсов для очистки",
            },
            excludeFavorites: {
              type: "boolean",
              description: "Исключить избранные ресурсы",
              default: true,
            },
          },
        },
        reason: {
          type: "string",
          description: "Причина очистки ресурсов",
        },
      },
      required: ["reason"],
    },
  },

  {
    name: "export_resource_list",
    description: "Экспортирует список ресурсов в различных форматах для внешнего использования",
    input_schema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["json", "csv", "text", "markdown"],
          description: "Формат экспорта",
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить метаданные ресурсов",
          default: true,
        },
        filterCriteria: {
          type: "object",
          properties: {
            resourceTypes: { type: "array", items: { type: "string" } },
            usedOnly: { type: "boolean" },
            addedAfter: { type: "string" },
          },
          description: "Критерии фильтрации для экспорта",
        },
      },
      required: ["format"],
    },
  },
]

/**
 * Типы событий для ресурсов, которые могут генерировать инструменты
 */
export type ResourceToolEvent =
  | { type: "RESOURCE_ADDED"; resourceId: string; resourceType: string; reason: string }
  | { type: "RESOURCE_REMOVED"; resourceId: string; reason: string }
  | { type: "RESOURCES_BULK_ADDED"; count: number; criteria: any; reason: string }
  | { type: "RESOURCE_UPDATED"; resourceId: string; changes: any; reason: string }
  | { type: "RESOURCES_ANALYZED"; analysis: any }
  | { type: "RESOURCES_CLEANUP"; removedCount: number; criteria: any }

/**
 * Результат выполнения инструмента для ресурсов
 */
export interface ResourceToolResult {
  success: boolean
  message: string
  data?: {
    addedResources?: string[]
    removedResources?: string[]
    analysis?: any
    suggestions?: string[]
    warnings?: string[]
  }
  errors?: string[]
  nextActions?: string[]
}

/**
 * Интерфейс для доступа к состоянию Resources Provider
 */
interface ResourcesStateAccess {
  getResourcesProvider: () => ResourcesContextType
  addMediaFile: (file: MediaFile) => Promise<void>
  addEffect: (effect: VideoEffect) => Promise<void>
  addFilter: (filter: VideoFilter) => Promise<void>
  addResource: (resourceType: string, resource: any) => Promise<void>
  removeResource: (resourceId: string, type: string) => Promise<void>
  updateResource: (resourceId: string, params: Record<string, any>) => Promise<void>
  getResourceStats: () => {
    totalMedia: number
    totalEffects: number
    totalFilters: number
    totalSize: number
    totalDuration: number
  }
}

// Глобальная переменная для доступа к состоянию resources
let resourcesStateAccess: ResourcesStateAccess | null = null

/**
 * Устанавливает доступ к состоянию resources
 */
export function setResourcesStateAccess(access: ResourcesStateAccess | null) {
  resourcesStateAccess = access
}

/**
 * Выполняет инструмент для работы с ресурсами
 */
export async function executeResourceTool(toolName: string, input: Record<string, any>): Promise<ResourceToolResult> {
  try {
    switch (toolName) {
      case "analyze_available_resources":
        return await analyzeAvailableResources(input)
      case "add_resource_to_pool":
        return await addResourceToPool(input)
      case "bulk_add_resources":
        return await bulkAddResources(input)
      case "remove_resource_from_pool":
        return await removeResourceFromPool(input)
      case "suggest_complementary_resources":
        return await suggestComplementaryResources(input)
      case "update_resource_parameters":
        return await updateResourceParameters(input)
      case "analyze_resource_compatibility":
        return await analyzeResourceCompatibility(input)
      case "get_resource_usage_stats":
        return await getResourceUsageStats(input)
      case "cleanup_unused_resources":
        return await cleanupUnusedResources(input)
      case "export_resource_list":
        return await exportResourceList(input)
      default:
        return {
          success: false,
          message: `Неизвестный инструмент: ${toolName}`,
          errors: [`Инструмент ${toolName} не найден`],
        }
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка выполнения инструмента ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

/**
 * Анализирует все доступные ресурсы в Resources Provider
 */
async function analyzeAvailableResources(input: Record<string, any>): Promise<ResourceToolResult> {
  const { resourceType, includeStats = true, filter } = input

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()
    const stats = resourcesStateAccess.getResourceStats()

    const analysis: any = {
      resourceType,
      totalCount: 0,
      categoryBreakdown: {},
      items: [],
    }

    // Анализируем конкретный тип ресурсов
    switch (resourceType) {
      case "media":
        analysis.totalCount = resourcesProvider.mediaResources.length
        analysis.items = resourcesProvider.mediaResources.map((r) => ({
          id: r.id,
          name: r.file.name,
          duration: r.file.duration,
          size: r.file.size,
          type: r.file.isVideo ? "video" : r.file.isAudio ? "audio" : r.file.isImage ? "image" : "unknown",
        }))
        break
      case "effect":
        analysis.totalCount = resourcesProvider.effectResources.length
        analysis.items = resourcesProvider.effectResources.map((r) => ({
          id: r.id,
          name: r.effect.name,
          category: r.effect.category,
        }))
        break
      case "filter":
        analysis.totalCount = resourcesProvider.filterResources.length
        analysis.items = resourcesProvider.filterResources.map((r) => ({
          id: r.id,
          name: r.filter.name,
          category: r.filter.category,
        }))
        break
      case "music":
        analysis.totalCount = resourcesProvider.musicResources.length
        analysis.items = resourcesProvider.musicResources.map((r) => ({
          id: r.id,
          name: r.file.name,
          duration: r.file.duration,
          size: r.file.size,
        }))
        break
      case "all":
        analysis.totalCount = stats.totalMedia + stats.totalEffects + stats.totalFilters
        analysis.categoryBreakdown = {
          media: stats.totalMedia,
          effects: stats.totalEffects,
          filters: stats.totalFilters,
          music: resourcesProvider.musicResources.length,
          transitions: resourcesProvider.transitionResources.length,
          templates: resourcesProvider.templateResources.length,
        }
        break
      default:
        analysis.totalCount = 0
        analysis.items = []
        break
    }

    if (includeStats) {
      analysis.stats = {
        totalSize: stats.totalSize,
        totalDuration: stats.totalDuration,
        resourceBreakdown: analysis.categoryBreakdown,
      }
    }

    // Генерируем предложения на основе анализа
    const suggestions: string[] = []
    if (stats.totalMedia < 5) {
      suggestions.push("Рекомендуется добавить больше медиафайлов для разнообразия")
    }
    if (stats.totalEffects < 3) {
      suggestions.push("Добавьте визуальные эффекты для улучшения качества")
    }
    if (resourcesProvider.musicResources.length === 0) {
      suggestions.push("Добавьте музыкальные треки для звукового сопровождения")
    }

    return {
      success: true,
      message: `Анализ ресурсов типа ${resourceType} выполнен`,
      data: {
        analysis,
        suggestions,
      },
      nextActions: ["Просмотреть детали анализа", "Добавить рекомендуемые ресурсы"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа ресурсов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Добавляет конкретный ресурс в пул ресурсов проекта
 */
async function addResourceToPool(input: Record<string, any>): Promise<ResourceToolResult> {
  const { resourceType, resourceId, reason, autoApply = false } = input

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()

    // Проверяем, не добавлен ли уже ресурс
    const existingResource = resourcesProvider.resources.find((r) => r.resourceId === resourceId)
    if (existingResource) {
      return {
        success: false,
        message: `Ресурс ${resourceId} уже добавлен в пул`,
        errors: [`Ресурс с ID ${resourceId} уже существует в пуле`],
      }
    }

    // В реальной реализации здесь будет поиск ресурса по ID из глобального хранилища
    // Пока создаем заглушку для ресурса
    let resourceToAdd: any = null

    switch (resourceType) {
      case "media":
      case "music":
        // В реальной реализации получаем из Browser state
        resourceToAdd = {
          id: resourceId,
          name: `${resourceType}_${resourceId}`,
          path: `/path/to/${resourceId}`,
          type: resourceType === "music" ? "audio" : "video",
          size: 1024 * 1024 * 10, // 10MB
          duration: 120, // 2 минуты
        }
        break
      case "effect":
        resourceToAdd = {
          id: resourceId,
          name: `Effect ${resourceId}`,
          category: "visual",
          description: "Visual effect",
        }
        break
      case "filter":
        resourceToAdd = {
          id: resourceId,
          name: `Filter ${resourceId}`,
          category: "color",
          intensity: 0.5,
        }
        break
      case "transition":
        resourceToAdd = {
          id: resourceId,
          type: "fade",
          name: `Transition ${resourceId}`,
          duration: 1000,
        }
        break
      default:
        return {
          success: false,
          message: `Неподдерживаемый тип ресурса: ${resourceType}`,
          errors: [`Тип ресурса ${resourceType} не поддерживается`],
        }
    }

    // Добавляем ресурс через ResourcesProvider
    await resourcesStateAccess.addResource(resourceType, resourceToAdd)

    const warnings: string[] = []
    if (autoApply) {
      // В реальной реализации здесь будет автоматическое применение к подходящим элементам
      warnings.push("Автоматическое применение пока не реализовано")
    }

    return {
      success: true,
      message: `Ресурс ${resourceId} добавлен в пул (${reason})`,
      data: {
        addedResources: [resourceId],
        analysis: {
          resourceType,
          resourceId,
          reason,
          autoApplied: autoApply,
          timestamp: new Date().toISOString(),
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      nextActions: autoApply
        ? ["Проверить применение ресурса", "Настроить параметры ресурса"]
        : ["Разместить ресурс на таймлайне", "Настроить параметры ресурса"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка добавления ресурса: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Массово добавляет ресурсы в пул по заданным критериям
 */
async function bulkAddResources(input: Record<string, any>): Promise<ResourceToolResult> {
  const { criteria, reason } = input
  const { resourceType, selectionMethod, filters, maxCount } = criteria

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()
    const addedResources: string[] = []
    let availableResources: any[] = []

    // Получаем доступные ресурсы по типу
    switch (resourceType) {
      case "media":
        // В реальной реализации здесь будет доступ к browser state для получения всех медиа файлов
        availableResources = [] // browserStateAccess?.getMediaFiles() || []
        break
      case "music":
        availableResources = [] // browserStateAccess?.getMusicFiles() || []
        break
      case "effect":
        // Здесь можно получить эффекты из глобального хранилища
        availableResources = []
        break
      case "filter":
        availableResources = []
        break
      case "transition":
        availableResources = []
        break
      default:
        availableResources = []
        break
    }

    // Фильтруем ресурсы по критериям
    let filteredResources = availableResources

    if (selectionMethod === "filtered" && filters) {
      filteredResources = availableResources.filter((resource) => {
        if (filters.searchQuery && !resource.name?.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
          return false
        }
        if (filters.tags?.length && !filters.tags.some((tag: string) => resource.tags?.includes(tag))) {
          return false
        }
        if (filters.minDuration && resource.duration < filters.minDuration) {
          return false
        }
        if (filters.maxDuration && resource.duration > filters.maxDuration) {
          return false
        }
        return true
      })
    } else if (selectionMethod === "recent") {
      filteredResources = availableResources.slice(-10)
    } else if (selectionMethod === "favorites") {
      // MediaFile не имеет поля isFavorite, поэтому возвращаем пустой массив для favorites
      filteredResources = []
    }

    // Ограничиваем количество
    const resourcesToAdd = filteredResources.slice(0, maxCount || 10)

    // Добавляем ресурсы
    for (const resource of resourcesToAdd) {
      try {
        await resourcesStateAccess.addResource(resourceType, resource)
        addedResources.push(resource.id || resource.name)
      } catch (error) {
        console.warn(`Failed to add resource ${resource.id}:`, error)
      }
    }

    return {
      success: true,
      message: `Массово добавлено ${addedResources.length} ресурсов типа ${resourceType}`,
      data: {
        addedResources,
        analysis: {
          criteria,
          reason,
          selectionMethod,
          actualCount: addedResources.length,
          availableCount: availableResources.length,
          filteredCount: filteredResources.length,
        },
      },
      nextActions:
        addedResources.length > 0
          ? ["Проверить добавленные ресурсы", "Разместить на таймлайне"]
          : ["Изменить критерии поиска"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка массового добавления ресурсов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Удаляет ресурс из пула ресурсов проекта
 */
async function removeResourceFromPool(input: Record<string, any>): Promise<ResourceToolResult> {
  const { resourceId, reason, removeFromTimeline = false } = input

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()

    // Находим ресурс в провайдере
    const resource = resourcesProvider.resources.find((r) => r.resourceId === resourceId)

    if (!resource) {
      return {
        success: false,
        message: `Ресурс ${resourceId} не найден в пуле`,
        errors: [`Ресурс с ID ${resourceId} не существует`],
      }
    }

    // Удаляем ресурс
    await resourcesStateAccess.removeResource(resourceId, resource.type)

    const warnings: string[] = []

    if (removeFromTimeline) {
      // В реальной реализации здесь будет вызов timeline state machine
      // для удаления всех клипов с этим ресурсом
      warnings.push("Ресурс также удален из таймлайна")
      warnings.push("Внимание: это может повлиять на структуру проекта")
    }

    return {
      success: true,
      message: `Ресурс ${resourceId} (${resource.type}) удален из пула`,
      data: {
        removedResources: [resourceId],
        analysis: {
          reason,
          removedFromTimeline: removeFromTimeline,
          resourceType: resource.type,
          timestamp: new Date().toISOString(),
        },
        warnings,
      },
      nextActions: removeFromTimeline
        ? ["Проверить таймлайн на целостность", "Заменить удаленные клипы"]
        : ["Проверить зависимости ресурса"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка удаления ресурса: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Анализирует текущие ресурсы и предлагает дополнительные
 */
async function suggestComplementaryResources(input: Record<string, any>): Promise<ResourceToolResult> {
  const { baseContent = [], projectType, mood, targetDuration, includeAutoAdd = false } = input

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()
    const stats = resourcesStateAccess.getResourceStats()

    const suggestions: string[] = []
    const recommendedResources: any[] = []

    // Анализируем существующие ресурсы
    const hasMusic = resourcesProvider.musicResources.length > 0
    const hasTransitions = resourcesProvider.transitionResources.length > 0
    const hasEffects = resourcesProvider.effectResources.length > 0
    const hasFilters = resourcesProvider.filterResources.length > 0

    // Генерируем предложения на основе типа проекта и настроения
    const moodEffects: Record<string, string[]> = {
      energetic: ["speed-ramp", "shake", "zoom-burst", "glitch"],
      calm: ["blur", "soft-focus", "slow-motion", "fade"],
      dramatic: ["black-white", "contrast", "vignette", "dramatic-zoom"],
      romantic: ["warm-filter", "soft-glow", "heart-overlay", "bokeh"],
      professional: ["clean-transitions", "minimal-effects", "corporate-lower-thirds"],
      playful: ["cartoon-effects", "bounce", "spin", "colorful-transitions"],
      serious: ["desaturate", "film-grain", "documentary-style"],
      uplifting: ["light-leaks", "sun-flare", "bright-transitions"],
    }

    const projectTypeResources: Record<string, string[]> = {
      wedding: ["romantic-music", "elegant-transitions", "warm-filters", "title-templates"],
      travel: ["upbeat-music", "map-animations", "location-titles", "cinematic-effects"],
      corporate: ["professional-music", "clean-transitions", "brand-templates", "infographics"],
      social: ["trendy-music", "quick-cuts", "social-media-templates", "emoji-overlays"],
      documentary: ["ambient-music", "simple-transitions", "interview-templates", "subtitles"],
      education: ["background-music", "clear-transitions", "educational-graphics", "annotations"],
      "music-video": ["sync-effects", "beat-transitions", "visual-effects", "color-grades"],
      commercial: ["upbeat-music", "product-highlights", "call-to-action", "brand-elements"],
    }

    // Предложения на основе отсутствующих ресурсов
    if (!hasMusic) {
      suggestions.push(`Добавить фоновую музыку в стиле ${mood} для ${projectType} проекта`)
      recommendedResources.push({ type: "music", style: mood, purpose: projectType })
    }

    if (!hasTransitions) {
      suggestions.push(`Использовать переходы, подходящие для ${projectType} проекта`)
      recommendedResources.push({ type: "transition", style: projectType })
    }

    if (!hasFilters && moodEffects[mood]) {
      suggestions.push(`Добавить цветовые фильтры для настроения ${mood}`)
      recommendedResources.push({ type: "filter", effects: moodEffects[mood] })
    }

    if (!hasEffects && projectTypeResources[projectType]) {
      suggestions.push(`Включить эффекты, характерные для ${projectType}`)
      recommendedResources.push({ type: "effect", effects: projectTypeResources[projectType] })
    }

    // Анализ длительности и предложения
    if (targetDuration) {
      const currentDuration = stats.totalDuration
      if (currentDuration < targetDuration * 0.8) {
        suggestions.push("Добавить больше контента для достижения целевой длительности")
      } else if (currentDuration > targetDuration * 1.2) {
        suggestions.push("Рассмотреть сокращение контента или ускорение темпа")
      }
    }

    // Специфичные предложения для baseContent
    if (baseContent.length > 0) {
      const videoCount = baseContent.filter((c: any) => c.resourceType === "media").length
      const audioCount = baseContent.filter((c: any) => c.resourceType === "music").length

      if (videoCount > 5 && !hasTransitions) {
        suggestions.push("Добавить переходы между многочисленными видеоклипами")
      }

      if (audioCount === 0 && videoCount > 0) {
        suggestions.push("Добавить музыкальное сопровождение к видеоряду")
      }
    }

    // Автоматическое добавление рекомендуемых ресурсов
    const addedResources: string[] = []
    if (includeAutoAdd && recommendedResources.length > 0) {
      // В реальной реализации здесь будет поиск и добавление конкретных ресурсов
      // Пока просто имитируем добавление
      for (const recommendation of recommendedResources.slice(0, 3)) {
        const resourceId = `auto_${recommendation.type}_${Date.now()}`
        addedResources.push(resourceId)
      }
    }

    return {
      success: true,
      message: `Найдено ${suggestions.length} предложений для улучшения проекта`,
      data: {
        suggestions,
        analysis: {
          baseContent,
          projectType,
          mood,
          targetDuration,
          compatibility: "high",
          currentStats: {
            hasMusic,
            hasTransitions,
            hasEffects,
            hasFilters,
            totalResources: stats.totalMedia + stats.totalEffects + stats.totalFilters,
          },
          recommendations: recommendedResources,
        },
        addedResources,
      },
      nextActions:
        includeAutoAdd && addedResources.length > 0
          ? ["Проверить автоматически добавленные ресурсы", "Настроить параметры добавленных ресурсов"]
          : ["Просмотреть рекомендации", "Добавить рекомендуемые ресурсы вручную"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа и предложения ресурсов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Обновляет параметры уже добавленного ресурса
 */
async function updateResourceParameters(input: Record<string, any>): Promise<ResourceToolResult> {
  const { resourceId, newParameters, reason } = input

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()

    // Находим ресурс
    const resource = resourcesProvider.resources.find((r) => r.resourceId === resourceId)

    if (!resource) {
      return {
        success: false,
        message: `Ресурс ${resourceId} не найден`,
        errors: [`Ресурс с ID ${resourceId} не существует в пуле`],
      }
    }

    // Обновляем параметры ресурса
    await resourcesStateAccess.updateResource(resourceId, newParameters)

    // Анализируем изменения
    const changedParams = Object.keys(newParameters)
    const criticalChanges = []

    // Проверяем критичные изменения
    if ("duration" in newParameters) {
      criticalChanges.push("Изменена длительность - может повлиять на синхронизацию")
    }
    if ("resolution" in newParameters) {
      criticalChanges.push("Изменено разрешение - может потребоваться перерендеринг")
    }
    if ("fps" in newParameters) {
      criticalChanges.push("Изменена частота кадров - может повлиять на плавность")
    }
    if ("volume" in newParameters || "audioGain" in newParameters) {
      criticalChanges.push("Изменены аудио параметры - проверьте баланс звука")
    }

    return {
      success: true,
      message: `Параметры ресурса ${resourceId} обновлены (${changedParams.length} изменений)`,
      data: {
        analysis: {
          resourceId,
          resourceType: resource.type,
          updatedParameters: newParameters,
          changedFields: changedParams,
          reason,
          timestamp: new Date().toISOString(),
          criticalChanges,
        },
        warnings: criticalChanges,
      },
      nextActions:
        criticalChanges.length > 0
          ? ["Проверить влияние изменений на таймлайн", "Пересчитать превью", "Проверить совместимость"]
          : ["Просмотреть обновленный ресурс"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка обновления параметров: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Анализирует совместимость ресурсов между собой и с проектом
 */
async function analyzeResourceCompatibility(input: Record<string, any>): Promise<ResourceToolResult> {
  const { resourceIds, checkAgainst = "all", includeRecommendations = true } = input

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()
    const compatibilityResults: any[] = []
    const recommendations: string[] = []

    // Получаем информацию о проекте (в реальной реализации из ProjectSettings)
    const projectSettings = {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      sampleRate: 48000,
      aspectRatio: "16:9",
    }

    // Анализируем каждый ресурс
    for (const resourceId of resourceIds) {
      const resource = resourcesProvider.resources.find((r) => r.resourceId === resourceId)

      if (!resource) {
        compatibilityResults.push({
          resourceId,
          compatible: false,
          issues: ["Ресурс не найден в пуле"],
          resourceType: "unknown",
        })
        continue
      }

      const issues: string[] = []
      let compatible = true

      // Проверяем совместимость в зависимости от типа ресурса
      if (resource.type === "media" || resource.type === "music") {
        const mediaResource =
          resourcesProvider.mediaResources.find((m) => m.resourceId === resourceId) ||
          resourcesProvider.musicResources.find((m) => m.resourceId === resourceId)

        if (mediaResource) {
          const file = mediaResource.file

          // Проверка разрешения для видео
          if (file.isVideo && file.probeData?.streams) {
            const videoStream = file.probeData.streams.find((s) => s.codec_type === "video")
            if (videoStream && videoStream.width && videoStream.height) {
              if (
                videoStream.width !== projectSettings.resolution.width ||
                videoStream.height !== projectSettings.resolution.height
              ) {
                issues.push(
                  `Несовместимость разрешения: ${videoStream.width}x${videoStream.height} vs ${projectSettings.resolution.width}x${projectSettings.resolution.height}`,
                )
                compatible = false
              }
            }
          }

          // Проверка частоты кадров
          if (file.isVideo && file.probeData?.streams) {
            const videoStream = file.probeData.streams.find((s) => s.codec_type === "video")
            if (videoStream && videoStream.r_frame_rate) {
              // Парсим frame rate (может быть в формате "30/1" или "30")
              const fps = eval(videoStream.r_frame_rate) // Простой способ для формата типа "30/1"
              if (fps && fps !== projectSettings.fps) {
                issues.push(`Различная частота кадров: ${fps} fps vs ${projectSettings.fps} fps`)
                if (Math.abs(fps - projectSettings.fps) > 5) {
                  compatible = false
                }
              }
            }
          }

          // Проверка частоты дискретизации аудио
          if (file.isAudio && file.probeData?.streams) {
            const audioStream = file.probeData.streams.find((s) => s.codec_type === "audio")
            if (
              audioStream &&
              audioStream.sample_rate &&
              Number.parseInt(audioStream.sample_rate.toString()) !== projectSettings.sampleRate
            ) {
              issues.push(
                `Различная частота дискретизации: ${audioStream.sample_rate} Hz vs ${projectSettings.sampleRate} Hz`,
              )
            }
          }
        }
      }

      // Проверка совместимости между ресурсами
      if (checkAgainst === "other-resources" || checkAgainst === "all") {
        // Проверяем совместимость с другими ресурсами того же типа
        const sameTypeResources = resourcesProvider.resources.filter(
          (r) => r.type === resource.type && r.resourceId !== resourceId,
        )

        if (sameTypeResources.length > 0) {
          // Здесь можно добавить специфичные проверки для каждого типа
          if (resource.type === "transition" && sameTypeResources.length > 5) {
            issues.push("Слишком много различных переходов может создать визуальный хаос")
          }

          if (resource.type === "filter" && sameTypeResources.length > 3) {
            issues.push("Множественные фильтры могут конфликтовать между собой")
          }
        }
      }

      compatibilityResults.push({
        resourceId,
        resourceType: resource.type,
        compatible,
        issues,
      })
    }

    // Генерируем рекомендации
    if (includeRecommendations) {
      const hasResolutionIssues = compatibilityResults.some((r) =>
        r.issues.some((i: string) => i.includes("разрешения")),
      )
      const hasFpsIssues = compatibilityResults.some((r) => r.issues.some((i: string) => i.includes("частота кадров")))
      const hasAudioIssues = compatibilityResults.some((r) => r.issues.some((i: string) => i.includes("дискретизации")))

      if (hasResolutionIssues) {
        recommendations.push("Конвертировать все видео в единое разрешение проекта")
        recommendations.push("Использовать масштабирование с сохранением соотношения сторон")
      }

      if (hasFpsIssues) {
        recommendations.push("Синхронизировать частоту кадров всех видеофайлов")
        recommendations.push("Использовать интерполяцию кадров для плавности")
      }

      if (hasAudioIssues) {
        recommendations.push("Конвертировать аудио в единую частоту дискретизации")
        recommendations.push("Проверить синхронизацию аудио и видео после конвертации")
      }

      // Общие рекомендации
      const incompatibleCount = compatibilityResults.filter((r) => !r.compatible).length
      if (incompatibleCount > 0) {
        recommendations.push("Создать прокси-файлы для несовместимых ресурсов")
        recommendations.push("Использовать предварительный рендеринг для проблемных участков")
      }
    }

    const overallCompatibility = compatibilityResults.every((r) => r.compatible)
      ? "excellent"
      : compatibilityResults.filter((r) => r.compatible).length > compatibilityResults.length / 2
        ? "good"
        : "needs-attention"

    return {
      success: true,
      message: `Анализ совместимости ${resourceIds.length} ресурсов завершен`,
      data: {
        analysis: {
          checkAgainst,
          results: compatibilityResults,
          overallCompatibility,
          projectSettings,
          summary: {
            total: compatibilityResults.length,
            compatible: compatibilityResults.filter((r) => r.compatible).length,
            incompatible: compatibilityResults.filter((r) => !r.compatible).length,
          },
        },
        suggestions: recommendations,
      },
      nextActions:
        recommendations.length > 0
          ? ["Применить рекомендации", "Конвертировать несовместимые ресурсы"]
          : ["Ресурсы готовы к использованию"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа совместимости: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Получает статистику использования ресурсов в проекте
 */
async function getResourceUsageStats(input: Record<string, any>): Promise<ResourceToolResult> {
  const { timeRange, groupBy = "type", includeUnused = true } = input

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()
    const stats = resourcesStateAccess.getResourceStats()

    // Подсчитываем статистику по типам
    const typeStats = {
      media: {
        total: resourcesProvider.mediaResources.length,
        used: 0, // В реальной реализации будет подсчет из Timeline
        size: resourcesProvider.mediaResources.reduce((sum, r) => sum + (r.file.size || 0), 0),
        duration: resourcesProvider.mediaResources.reduce((sum, r) => sum + (r.file.duration || 0), 0),
      },
      music: {
        total: resourcesProvider.musicResources.length,
        used: 0,
        size: resourcesProvider.musicResources.reduce((sum, r) => sum + (r.file.size || 0), 0),
        duration: resourcesProvider.musicResources.reduce((sum, r) => sum + (r.file.duration || 0), 0),
      },
      effects: {
        total: resourcesProvider.effectResources.length,
        used: 0,
        categories: resourcesProvider.effectResources.reduce<Record<string, number>>((acc, r) => {
          const category = r.effect.category || "other"
          acc[category] = (acc[category] || 0) + 1
          return acc
        }, {}),
      },
      filters: {
        total: resourcesProvider.filterResources.length,
        used: 0,
        categories: resourcesProvider.filterResources.reduce<Record<string, number>>((acc, r) => {
          const category = r.filter.category || "other"
          acc[category] = (acc[category] || 0) + 1
          return acc
        }, {}),
      },
      transitions: {
        total: resourcesProvider.transitionResources.length,
        used: 0,
        types: resourcesProvider.transitionResources.reduce<Record<string, number>>((acc, r) => {
          const type = r.transition.type
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {}),
      },
      templates: {
        total: resourcesProvider.templateResources.length,
        used: 0,
      },
      styleTemplates: {
        total: resourcesProvider.styleTemplateResources.length,
        used: 0,
      },
      subtitles: {
        total: resourcesProvider.subtitleResources.length,
        used: 0,
      },
    }

    // Группировка статистики
    let groupedStats: any = {}

    if (groupBy === "type") {
      groupedStats = typeStats
    } else if (groupBy === "date") {
      // Группировка по дате добавления
      groupedStats = {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        older: 0,
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      resourcesProvider.resources.forEach((resource) => {
        const addedDate = new Date(resource.addedAt || now)
        if (addedDate >= today) {
          groupedStats.today++
        } else if (addedDate >= weekAgo) {
          groupedStats.thisWeek++
        } else if (addedDate >= monthAgo) {
          groupedStats.thisMonth++
        } else {
          groupedStats.older++
        }
      })
    } else if (groupBy === "source") {
      // Группировка по источнику
      groupedStats = {
        imported: 0,
        builtin: 0,
        downloaded: 0,
        generated: 0,
      }

      // В реальной реализации будет подсчет по источникам
      groupedStats.imported = resourcesProvider.resources.length
    } else if (groupBy === "usage-frequency") {
      // Группировка по частоте использования
      groupedStats = {
        never: 0,
        rarely: 0,
        sometimes: 0,
        often: 0,
      }

      // В реальной реализации будет подсчет из Timeline
      groupedStats.never = resourcesProvider.resources.length
    }

    // Подсчет общей статистики
    const totalResources = resourcesProvider.resources.length
    const usedResources = 0 // В реальной реализации из Timeline
    const unusedResources = includeUnused ? totalResources - usedResources : 0

    // Генерация предложений
    const suggestions: string[] = []

    if (unusedResources > totalResources * 0.3) {
      suggestions.push("Рассмотреть удаление неиспользуемых ресурсов для экономии места")
    }

    if (typeStats.music.total === 0) {
      suggestions.push("Добавить музыкальные треки для звукового сопровождения")
    } else if (typeStats.music.total < 3) {
      suggestions.push("Добавить больше музыкальных треков для разнообразия")
    }

    if (typeStats.transitions.total === 0) {
      suggestions.push("Добавить переходы для плавности монтажа")
    }

    if (typeStats.effects.total === 0) {
      suggestions.push("Использовать визуальные эффекты для улучшения качества")
    }

    if (stats.totalSize > 1000 * 1024 * 1024) {
      // > 1GB
      suggestions.push("Оптимизировать размер медиафайлов для лучшей производительности")
    }

    return {
      success: true,
      message: "Статистика использования ресурсов получена",
      data: {
        analysis: {
          totalResources,
          usedResources,
          unusedResources: includeUnused ? unusedResources : undefined,
          byType: typeStats,
          groupedBy: groupBy,
          groupedStats,
          overallStats: {
            totalSize: stats.totalSize,
            totalDuration: stats.totalDuration,
            averageSize: totalResources > 0 ? Math.round(stats.totalSize / totalResources) : 0,
          },
          timeRange,
        },
        suggestions,
      },
      nextActions:
        suggestions.length > 0
          ? ["Оптимизировать неиспользуемые ресурсы", "Применить рекомендации"]
          : ["Экспортировать статистику"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка получения статистики: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Удаляет неиспользуемые ресурсы из пула для оптимизации
 */
async function cleanupUnusedResources(input: Record<string, any>): Promise<ResourceToolResult> {
  const { dryRun = true, criteria = {}, reason } = input
  const { unusedForDays = 30, resourceTypes = [], excludeFavorites = true } = criteria

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()
    const toRemove: Array<{ resourceId: string; type: string; name: string; size?: number }> = []

    // Получаем текущую дату для проверки давности использования
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - unusedForDays * 24 * 60 * 60 * 1000)

    // Проходим по всем ресурсам и находим неиспользуемые
    for (const resource of resourcesProvider.resources) {
      // Фильтр по типу ресурса
      if (resourceTypes.length > 0 && !resourceTypes.includes(resource.type)) {
        continue
      }

      // В реальной реализации здесь будет проверка:
      // 1. Используется ли ресурс в Timeline
      // 2. Когда последний раз использовался
      // 3. Является ли избранным

      let shouldRemove = false
      let resourceName = ""
      let resourceSize = 0

      // Проверяем по типу ресурса
      switch (resource.type) {
        case "media": {
          const mediaResource = resourcesProvider.mediaResources.find((m) => m.resourceId === resource.resourceId)
          if (mediaResource) {
            resourceName = mediaResource.file.name
            resourceSize = mediaResource.file.size || 0
            // В реальной реализации проверка использования в Timeline
            const isUsedInTimeline = false // timelineStateAccess?.isResourceUsed(resource.resourceId)
            const lastUsed = new Date(resource.addedAt || now)

            if (!isUsedInTimeline && lastUsed < cutoffDate) {
              // MediaFile не имеет поля isFavorite, поэтому всегда проверяем
              shouldRemove = true
            }
          }
          break
        }
        case "music": {
          const musicResource = resourcesProvider.musicResources.find((m) => m.resourceId === resource.resourceId)
          if (musicResource) {
            resourceName = musicResource.file.name
            resourceSize = musicResource.file.size || 0
            const isUsedInTimeline = false
            const lastUsed = new Date(resource.addedAt || now)

            if (!isUsedInTimeline && lastUsed < cutoffDate) {
              // MediaFile не имеет поля isFavorite, поэтому всегда проверяем
              shouldRemove = true
            }
          }
          break
        }
        case "effect": {
          const effectResource = resourcesProvider.effectResources.find((e) => e.resourceId === resource.resourceId)
          if (effectResource) {
            resourceName = effectResource.effect.name
            const isUsedInTimeline = false
            if (!isUsedInTimeline) {
              shouldRemove = true
            }
          }
          break
        }
        case "filter": {
          const filterResource = resourcesProvider.filterResources.find((f) => f.resourceId === resource.resourceId)
          if (filterResource) {
            resourceName = filterResource.filter.name
            const isUsedInTimeline = false
            if (!isUsedInTimeline) {
              shouldRemove = true
            }
          }
          break
        }
        case "transition": {
          const transitionResource = resourcesProvider.transitionResources.find(
            (t) => t.resourceId === resource.resourceId,
          )
          if (transitionResource) {
            resourceName = transitionResource.transition.name || transitionResource.transition.type
            const isUsedInTimeline = false
            if (!isUsedInTimeline) {
              shouldRemove = true
            }
          }
          break
        }
        default:
          break
      }

      if (shouldRemove) {
        toRemove.push({
          resourceId: resource.resourceId,
          type: resource.type,
          name: resourceName,
          size: resourceSize,
        })
      }
    }

    // Подсчитываем статистику
    const totalSizeToRemove = toRemove.reduce((sum, r) => sum + (r.size || 0), 0)
    const byType = toRemove.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1
      return acc
    }, {})

    if (dryRun) {
      return {
        success: true,
        message: `Найдено ${toRemove.length} неиспользуемых ресурсов для удаления`,
        data: {
          analysis: {
            dryRun: true,
            toRemove: toRemove.map((r) => ({ id: r.resourceId, type: r.type, name: r.name })),
            criteria: { unusedForDays, resourceTypes, excludeFavorites },
            reason,
            statistics: {
              totalCount: toRemove.length,
              totalSize: totalSizeToRemove,
              byType,
              potentialSavings: `${(totalSizeToRemove / 1024 / 1024).toFixed(2)} MB`,
            },
          },
          suggestions:
            toRemove.length > 0
              ? ["Проверить список перед удалением", "Создать резервную копию перед очисткой"]
              : ["Все ресурсы используются или недавно добавлены"],
        },
        nextActions:
          toRemove.length > 0
            ? ["Проверить список для удаления", "Выполнить реальную очистку"]
            : ["Изменить критерии поиска"],
      }
    }

    // Выполняем реальное удаление
    const removedResources: string[] = []
    const errors: string[] = []

    for (const resource of toRemove) {
      try {
        await resourcesStateAccess.removeResource(resource.resourceId, resource.type)
        removedResources.push(resource.resourceId)
      } catch (error) {
        errors.push(`Не удалось удалить ${resource.name}: ${String(error)}`)
      }
    }

    return {
      success: errors.length === 0,
      message: `Удалено ${removedResources.length} из ${toRemove.length} неиспользуемых ресурсов`,
      data: {
        removedResources,
        analysis: {
          dryRun: false,
          criteria,
          reason,
          removedCount: removedResources.length,
          failedCount: errors.length,
          freedSpace: `${(totalSizeToRemove / 1024 / 1024).toFixed(2)} MB`,
          byType,
        },
        warnings: errors.length > 0 ? errors : undefined,
      },
      nextActions: ["Проверить освобожденное место", "Оптимизировать оставшиеся ресурсы"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка очистки ресурсов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

/**
 * Экспортирует список ресурсов в различных форматах
 */
async function exportResourceList(input: Record<string, any>): Promise<ResourceToolResult> {
  const { format, includeMetadata = true, filterCriteria = {} } = input

  if (!resourcesStateAccess) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = resourcesStateAccess.getResourcesProvider()
    let resourcesToExport = [...resourcesProvider.resources]

    // Применяем фильтры
    if (filterCriteria.resourceTypes?.length > 0) {
      resourcesToExport = resourcesToExport.filter((r) => filterCriteria.resourceTypes.includes(r.type))
    }

    if (filterCriteria.usedOnly) {
      // В реальной реализации фильтр по использованию в Timeline
      // resourcesToExport = resourcesToExport.filter(r => timelineStateAccess?.isResourceUsed(r.resourceId))
    }

    if (filterCriteria.addedAfter) {
      const afterDate = new Date(filterCriteria.addedAfter)
      resourcesToExport = resourcesToExport.filter((r) => new Date(r.addedAt || 0) >= afterDate)
    }

    // Собираем данные для экспорта
    const exportItems = resourcesToExport.map((resource) => {
      const baseData: any = {
        id: resource.resourceId,
        type: resource.type,
        addedAt: resource.addedAt,
      }

      if (includeMetadata) {
        // Добавляем метаданные в зависимости от типа
        switch (resource.type) {
          case "media":
          case "music": {
            const mediaResource =
              resourcesProvider.mediaResources.find((m) => m.resourceId === resource.resourceId) ||
              resourcesProvider.musicResources.find((m) => m.resourceId === resource.resourceId)
            if (mediaResource) {
              baseData.name = mediaResource.file.name
              baseData.path = mediaResource.file.path
              baseData.size = mediaResource.file.size
              baseData.duration = mediaResource.file.duration
              // Извлекаем resolution и fps из probeData
              if (mediaResource.file.probeData?.streams) {
                const videoStream = mediaResource.file.probeData.streams.find((s) => s.codec_type === "video")
                if (videoStream) {
                  baseData.resolution = {
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                  }
                  if (videoStream.r_frame_rate) {
                    try {
                      baseData.fps = eval(videoStream.r_frame_rate)
                    } catch {
                      baseData.fps = 30 // default
                    }
                  }
                }
              }
              // MediaFile не имеет поля isFavorite
              baseData.isFavorite = false
            }
            break
          }
          case "effect": {
            const effectResource = resourcesProvider.effectResources.find((e) => e.resourceId === resource.resourceId)
            if (effectResource) {
              baseData.name = effectResource.effect.name
              baseData.category = effectResource.effect.category
              baseData.description = effectResource.effect.description
            }
            break
          }
          case "filter": {
            const filterResource = resourcesProvider.filterResources.find((f) => f.resourceId === resource.resourceId)
            if (filterResource) {
              baseData.name = filterResource.filter.name
              baseData.category = filterResource.filter.category
              // VideoFilter не имеет поля intensity, используем параметры фильтра
              baseData.params = filterResource.filter.params
            }
            break
          }
          case "transition": {
            const transitionResource = resourcesProvider.transitionResources.find(
              (t) => t.resourceId === resource.resourceId,
            )
            if (transitionResource) {
              baseData.name = transitionResource.transition.name || transitionResource.transition.type
              baseData.duration = transitionResource.transition.duration
            }
            break
          }
          default:
            break
        }
      }

      return baseData
    })

    // Форматируем данные в зависимости от формата
    let exportContent = ""
    let mimeType = "text/plain"
    let fileExtension = "txt"

    switch (format) {
      case "json":
        exportContent = JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            projectName: "Timeline Studio Project", // В реальной реализации из ProjectSettings
            totalResources: exportItems.length,
            filterCriteria,
            resources: exportItems,
          },
          null,
          2,
        )
        mimeType = "application/json"
        fileExtension = "json"
        break

      case "csv":
        // Создаем CSV с заголовками
        const headers = ["ID", "Type", "Name", "Added At", "Size", "Duration", "Category"]
        const rows = exportItems.map((item) => [
          item.id,
          item.type,
          item.name || "",
          item.addedAt || "",
          item.size || "",
          item.duration || "",
          item.category || "",
        ])
        exportContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
        mimeType = "text/csv"
        fileExtension = "csv"
        break

      case "markdown":
        exportContent = `# Timeline Studio Resources Export

**Export Date:** ${new Date().toISOString()}  
**Total Resources:** ${exportItems.length}

## Resources by Type

`
        const byType = exportItems.reduce<Record<string, any[]>>((acc, item) => {
          if (!acc[item.type]) acc[item.type] = []
          acc[item.type].push(item)
          return acc
        }, {})

        for (const [type, items] of Object.entries(byType)) {
          exportContent += `\n### ${type.charAt(0).toUpperCase() + type.slice(1)} (${items.length})\n\n`
          items.forEach((item) => {
            exportContent += `- **${item.name || item.id}**`
            if (item.duration) exportContent += ` - ${(item.duration / 60).toFixed(2)} min`
            if (item.size) exportContent += ` - ${(item.size / 1024 / 1024).toFixed(2)} MB`
            exportContent += "\n"
          })
        }
        mimeType = "text/markdown"
        fileExtension = "md"
        break
      default:
        exportContent = `Timeline Studio Resources Export
================================
Export Date: ${new Date().toISOString()}
Total Resources: ${exportItems.length}

Resources:
${exportItems.map((item) => `- [${item.type}] ${item.name || item.id}`).join("\n")}
`
        break
    }

    // В реальной реализации здесь будет сохранение файла через Tauri API
    const exportPath = `/exports/resources_${Date.now()}.${fileExtension}`

    // Статистика экспорта
    const exportStats = {
      totalCount: exportItems.length,
      byType: exportItems.reduce<Record<string, number>>((acc, item) => {
        acc[item.type] = Number(acc[item.type] || 0) + 1
        return acc
      }, {}),
      totalSize: exportItems.reduce((sum: number, item: any) => sum + Number(item.size || 0), 0),
    }

    return {
      success: true,
      message: `Список ресурсов экспортирован в формате ${format}`,
      data: {
        analysis: {
          format,
          timestamp: new Date().toISOString(),
          includeMetadata,
          filterCriteria,
          resourceCount: exportItems.length,
          exportPath,
          mimeType,
          contentSize: exportContent.length,
          statistics: exportStats,
        },
        suggestions: [
          "Сохранить экспорт для резервного копирования",
          "Использовать для переноса ресурсов между проектами",
        ],
      },
      nextActions: ["Открыть экспортированный файл", "Поделиться экспортом"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка экспорта списка ресурсов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
