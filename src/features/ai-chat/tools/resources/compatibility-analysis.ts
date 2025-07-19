/**
 * AI инструмент для анализа совместимости ресурсов
 */

import {
  checkResourceCompatibility,
  getResourceDetails,
  getResourcesProvider,
  hasResourcesAccess,
} from "./utils/helpers"

import type { CompatibilityParams, ResourceToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"


export const analyzeResourceCompatibilityTool: ClaudeTool = {
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
}

export async function analyzeResourceCompatibility(params: CompatibilityParams): Promise<ResourceToolResult> {
  const { resourceIds, checkAgainst = "all", includeRecommendations = true } = params

  if (!hasResourcesAccess()) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = getResourcesProvider()
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
      const resourceDetails = getResourceDetails(resourceId)

      if (!resourceDetails) {
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
      if (resourceDetails.type === "media" || resourceDetails.type === "music") {
        if (resourceDetails.file) {
          const compatibilityCheck = checkResourceCompatibility(resourceDetails, projectSettings)
          issues.push(...compatibilityCheck.issues)
          compatible = compatibilityCheck.compatible
        }
      }

      // Проверка совместимости между ресурсами
      if (checkAgainst === "other-resources" || checkAgainst === "all") {
        // Проверяем совместимость с другими ресурсами того же типа
        const sameTypeResources = resourcesProvider.resources.filter(
          (r) => r.type === resourceDetails.type && r.resourceId !== resourceId,
        )

        if (sameTypeResources.length > 0) {
          // Здесь можно добавить специфичные проверки для каждого типа
          if (resourceDetails.type === "transition" && sameTypeResources.length > 5) {
            issues.push("Слишком много различных переходов может создать визуальный хаос")
          }

          if (resourceDetails.type === "filter" && sameTypeResources.length > 3) {
            issues.push("Множественные фильтры могут конфликтовать между собой")
          }
        }
      }

      compatibilityResults.push({
        resourceId,
        resourceType: resourceDetails.type,
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
