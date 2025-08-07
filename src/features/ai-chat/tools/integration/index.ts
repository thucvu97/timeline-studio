/**
 * Integration AI Tools - Инструменты интеграции и экспорта
 *
 * Экспорт проектов, интеграция с платформами и конвертация форматов
 */

// Export management инструменты
export * from "./export-tools"
// Format conversion инструменты
export * from "./format-conversion-tools"
// Platform integration инструменты
export * from "./platform-integration-tools"

// Сбор всех integration инструментов в один массив
import { exportManagementTools } from "./export-tools"
import { mediaProcessingTools } from "./format-conversion-tools"
import { platformOptimizationTools } from "./platform-integration-tools"

export const integrationTools = [...exportManagementTools, ...platformOptimizationTools, ...mediaProcessingTools]

export const INTEGRATION_TOOLS_COUNT = integrationTools.length
