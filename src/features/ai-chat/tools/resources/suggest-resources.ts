/**
 * AI инструмент для предложения дополнительных ресурсов
 */

import type { ClaudeTool } from "../../services/claude-service"

import type { ResourceToolResult, SuggestResourcesParams } from "./types"
import {
  getMoodEffects,
  getProjectTypeResources,
  getResourcesProvider,
  getResourcesStats,
  hasResourcesAccess,
} from "./utils/helpers"

export const suggestComplementaryResourcesTool: ClaudeTool = {
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
}

export async function suggestComplementaryResources(params: SuggestResourcesParams): Promise<ResourceToolResult> {
  const { baseContent = [], projectType, mood, targetDuration, includeAutoAdd = false } = params

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

    const suggestions: string[] = []
    const recommendedResources: any[] = []

    // Анализируем существующие ресурсы
    const hasMusic = resourcesProvider.musicResources.length > 0
    const hasTransitions = resourcesProvider.transitionResources.length > 0
    const hasEffects = resourcesProvider.effectResources.length > 0
    const hasFilters = resourcesProvider.filterResources.length > 0

    // Получаем рекомендации на основе настроения и типа проекта
    const moodEffects = getMoodEffects(mood)
    const projectTypeResources = getProjectTypeResources(projectType)

    // Предложения на основе отсутствующих ресурсов
    if (!hasMusic) {
      suggestions.push(`Добавить фоновую музыку в стиле ${mood} для ${projectType} проекта`)
      recommendedResources.push({ type: "music", style: mood, purpose: projectType })
    }

    if (!hasTransitions) {
      suggestions.push(`Использовать переходы, подходящие для ${projectType} проекта`)
      recommendedResources.push({ type: "transition", style: projectType })
    }

    if (!hasFilters && moodEffects.length > 0) {
      suggestions.push(`Добавить цветовые фильтры для настроения ${mood}`)
      recommendedResources.push({ type: "filter", effects: moodEffects })
    }

    if (!hasEffects && projectTypeResources.length > 0) {
      suggestions.push(`Включить эффекты, характерные для ${projectType}`)
      recommendedResources.push({ type: "effect", effects: projectTypeResources })
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
