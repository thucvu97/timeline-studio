/**
 * Automation AI Tools - Инструменты автоматизации и оптимизации
 *
 * Автоматические процессы, пакетная обработка и интеллектуальные шаблоны
 */

// Batch processing инструменты
export * from "./batch-processing-tools"
// Enhanced subtitle automation инструменты
export * from "./enhanced-subtitle-automation"
// Performance optimization инструменты
export * from "./performance-tools"
// Smart templates инструменты
export * from "./smart-templates-tools"
// Subtitle automation инструменты
export * from "./subtitle-tools"
// Workflow automation инструменты
export * from "./workflow-tools"

import { batchProcessingTools } from "./batch-processing-tools"
import { enhancedSubtitleAutomation } from "./enhanced-subtitle-automation"
import { renderPerformanceTools } from "./performance-tools"
import { templateLayoutTools } from "./smart-templates-tools"
import { subtitleTools } from "./subtitle-tools"
// Сбор всех automation инструментов в один массив
import { workflowAutomationTools } from "./workflow-tools"

export const automationTools = [
  ...workflowAutomationTools,
  ...batchProcessingTools,
  ...renderPerformanceTools,
  ...templateLayoutTools,
  ...subtitleTools,
  // Enhanced subtitle automation (новый AI инструмент)
  enhancedSubtitleAutomation,
]

export const AUTOMATION_TOOLS_COUNT = automationTools.length
