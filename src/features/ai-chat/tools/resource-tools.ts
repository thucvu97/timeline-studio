/**
 * AI инструменты для управления ресурсами (модульная версия)
 *
 * Этот файл экспортирует все Resource инструменты из модульной структуры
 * и предоставляет функции для обратной совместимости
 */

// Импортируем функции выполнения
import { analyzeAvailableResources } from "./resources/analyze-resources"
import { analyzeResourceCompatibility } from "./resources/compatibility-analysis"
import { exportResourceList } from "./resources/export-resources"
import {
  addResourceToPool,
  bulkAddResources,
  removeResourceFromPool,
  updateResourceParameters,
} from "./resources/manage-resources"
import { suggestComplementaryResources } from "./resources/suggest-resources"
import type {
  AddResourceParams,
  AnalyzeResourcesParams,
  BulkAddResourcesParams,
  CleanupParams,
  CompatibilityParams,
  ExportListParams,
  RemoveResourceParams,
  ResourceToolResult,
  SuggestResourcesParams,
  UpdateResourceParams,
  UsageStatsParams,
} from "./resources/types"
import { cleanupUnusedResources, getResourceUsageStats } from "./resources/usage-stats"

// Экспортируем инструменты для обратной совместимости
export {
  type ResourcesStateAccess,
  type ResourceToolEvent,
  type ResourceToolResult,
  resourceTools,
  setResourcesStateAccess,
} from "./resources"

/**
 * Выполняет инструменты Resource
 */
export async function executeResourceTool(toolName: string, input: Record<string, any>): Promise<ResourceToolResult> {
  try {
    switch (toolName) {
      case "analyze_available_resources":
        return await analyzeAvailableResources(input as AnalyzeResourcesParams)

      case "add_resource_to_pool":
        return await addResourceToPool(input as AddResourceParams)

      case "bulk_add_resources":
        return await bulkAddResources(input as BulkAddResourcesParams)

      case "remove_resource_from_pool":
        return await removeResourceFromPool(input as RemoveResourceParams)

      case "suggest_complementary_resources":
        return await suggestComplementaryResources(input as SuggestResourcesParams)

      case "update_resource_parameters":
        return await updateResourceParameters(input as UpdateResourceParams)

      case "analyze_resource_compatibility":
        return await analyzeResourceCompatibility(input as CompatibilityParams)

      case "get_resource_usage_stats":
        return await getResourceUsageStats(input as UsageStatsParams)

      case "cleanup_unused_resources":
        return await cleanupUnusedResources(input as CleanupParams)

      case "export_resource_list":
        return await exportResourceList(input as ExportListParams)

      default:
        throw new Error(`Неизвестный resource инструмент: ${toolName}`)
    }
  } catch (error) {
    console.error(`Ошибка выполнения resource tool ${toolName}:`, error)
    return {
      success: false,
      message: `Ошибка выполнения инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
