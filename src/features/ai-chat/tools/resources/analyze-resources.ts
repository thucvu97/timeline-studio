/**
 * AI инструмент для анализа доступных ресурсов
 */

import { getResourcesProvider, getResourcesStats, hasResourcesAccess } from "./utils/helpers"

import type { AnalyzeResourcesParams, ResourceToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"


export const analyzeAvailableResourcesTool: ClaudeTool = {
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
}

export async function analyzeAvailableResources(params: AnalyzeResourcesParams): Promise<ResourceToolResult> {
  const { resourceType, includeStats = true, filter } = params

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
