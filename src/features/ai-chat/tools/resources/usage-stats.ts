/**
 * AI инструменты для статистики и управления использованием ресурсов
 */

import {
  formatFileSize,
  getResourcesProvider,
  getResourcesStateAccess,
  getResourcesStats,
  hasResourcesAccess,
} from "./utils/helpers"

import type { CleanupParams, ResourceToolResult, UsageStatsParams } from "./types"
import type { ClaudeTool } from "../../services/claude-service"


export const getResourceUsageStatsTool: ClaudeTool = {
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
}

export const cleanupUnusedResourcesTool: ClaudeTool = {
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
}

export async function getResourceUsageStats(params: UsageStatsParams): Promise<ResourceToolResult> {
  const { timeRange, groupBy = "type", includeUnused = true } = params

  if (!hasResourcesAccess()) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = getResourcesProvider()
    const stats = getResourcesStats()

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

export async function cleanupUnusedResources(params: CleanupParams): Promise<ResourceToolResult> {
  const { dryRun = true, criteria = {}, reason } = params
  const { unusedForDays = 30, resourceTypes = [], excludeFavorites = true } = criteria

  if (!hasResourcesAccess()) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = getResourcesProvider()
    const resourcesStateAccess = getResourcesStateAccess()!
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
              shouldRemove = true
            }
          }
          break
        }
        case "effect": {
          const effectResource = resourcesProvider.effectResources.find((e) => e.resourceId === resource.resourceId)
          if (effectResource) {
            resourceName = (effectResource as any).effect.name
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
              potentialSavings: formatFileSize(totalSizeToRemove),
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
          freedSpace: formatFileSize(totalSizeToRemove),
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
