/**
 * Resources AI Tools - модульная организация инструментов для работы с ресурсами
 */

import { analyzeAvailableResources, analyzeAvailableResourcesTool } from "./analyze-resources"
import { analyzeResourceCompatibility, analyzeResourceCompatibilityTool } from "./compatibility-analysis"
import { exportResourceList, exportResourceListTool } from "./export-resources"
import {
  addResourceToPool,
  addResourceToPoolTool,
  bulkAddResources,
  bulkAddResourcesTool,
  removeResourceFromPool,
  removeResourceFromPoolTool,
  updateResourceParameters,
  updateResourceParametersTool
} from "./manage-resources"
import { suggestComplementaryResources, suggestComplementaryResourcesTool } from "./suggest-resources"
import { cleanupUnusedResources, cleanupUnusedResourcesTool, getResourceUsageStats, getResourceUsageStatsTool } from "./usage-stats"

import type { ResourceToolResult } from "./types"

export { analyzeAvailableResources, analyzeAvailableResourcesTool } from "./analyze-resources"
export { analyzeResourceCompatibility, analyzeResourceCompatibilityTool } from "./compatibility-analysis"
export { exportResourceList, exportResourceListTool } from "./export-resources"
export {
  addResourceToPool,
  addResourceToPoolTool,
  bulkAddResources,
  bulkAddResourcesTool,
  removeResourceFromPool,
  removeResourceFromPoolTool,
  updateResourceParameters,
  updateResourceParametersTool,
} from "./manage-resources"
export { suggestComplementaryResources, suggestComplementaryResourcesTool } from "./suggest-resources"
// Экспортируем типы
export * from "./types"
export {
  cleanupUnusedResources,
  cleanupUnusedResourcesTool,
  getResourceUsageStats,
  getResourceUsageStatsTool,
} from "./usage-stats"

// Экспортируем утилиты
export * from "./utils/helpers"

export const resourceTools = [
  analyzeAvailableResourcesTool,
  addResourceToPoolTool,
  bulkAddResourcesTool,
  removeResourceFromPoolTool,
  suggestComplementaryResourcesTool,
  updateResourceParametersTool,
  analyzeResourceCompatibilityTool,
  getResourceUsageStatsTool,
  cleanupUnusedResourcesTool,
  exportResourceListTool,
]

export async function executeResourceTool(toolName: string, params: any): Promise<ResourceToolResult> {
  try {
    switch (toolName) {
      case "analyze_available_resources":
        return await analyzeAvailableResources(params)

      case "add_resource_to_pool":
        return await addResourceToPool(params)

      case "bulk_add_resources":
        return await bulkAddResources(params)

      case "remove_resource_from_pool":
        return await removeResourceFromPool(params)

      case "suggest_complementary_resources":
        return await suggestComplementaryResources(params)

      case "update_resource_parameters":
        return await updateResourceParameters(params)

      case "analyze_resource_compatibility":
        return await analyzeResourceCompatibility(params)

      case "get_resource_usage_stats":
        return await getResourceUsageStats(params)

      case "cleanup_unused_resources":
        return await cleanupUnusedResources(params)

      case "export_resource_list":
        return await exportResourceList(params)

      default:
        return {
          success: false,
          message: `Неизвестный resource инструмент: ${toolName}`,
          errors: [`Unknown resource tool: ${toolName}`],
        }
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка выполнения resource инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
