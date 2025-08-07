/**
 * Automation AI Tools - Инструменты автоматизации и оптимизации
 * 
 * Автоматические процессы, пакетная обработка и интеллектуальные шаблоны
 */

// Workflow automation инструменты
export * from "./workflow-tools"

// Batch processing инструменты  
export * from "./batch-processing-tools"

// Performance optimization инструменты
export * from "./performance-tools"

// Smart templates инструменты
export * from "./smart-templates-tools"

// Subtitle automation инструменты
export * from "./subtitle-tools"

// Сбор всех automation инструментов в один массив
import { workflowAutomationTools } from "./workflow-tools"
import { batchProcessingTools } from "./batch-processing-tools"
import { renderPerformanceTools } from "./performance-tools"
import { templateLayoutTools } from "./smart-templates-tools"
import { subtitleTools } from "./subtitle-tools"

export const automationTools = [
  ...workflowAutomationTools,
  ...batchProcessingTools,
  ...renderPerformanceTools,
  ...templateLayoutTools,
  ...subtitleTools,
]

export const AUTOMATION_TOOLS_COUNT = automationTools.length