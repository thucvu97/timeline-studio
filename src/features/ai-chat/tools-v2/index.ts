/**
 * AI Tools v2 - Domain-Based Architecture
 * 
 * Новая организация AI инструментов по функциональным доменам для Timeline Studio
 */

// Базовый класс для всех AI инструментов
export * from "./base-ai-tool"

// Core domain - основные инструменты
export * from "./core"

// Analysis domain - инструменты анализа
export * from "./analysis"

// Automation domain - инструменты автоматизации  
export * from "./automation"

// Integration domain - инструменты интеграции
export * from "./integration"

// Импортируем счетчики инструментов из каждого домена
import { 
  coreTools, 
  CORE_TOOLS_COUNT 
} from "./core"

import { 
  analysisTools, 
  ANALYSIS_TOOLS_COUNT 
} from "./analysis"

import { 
  automationTools, 
  AUTOMATION_TOOLS_COUNT 
} from "./automation"

import { 
  integrationTools, 
  INTEGRATION_TOOLS_COUNT 
} from "./integration"

// Объединяем все инструменты
export const allToolsV2 = [
  ...coreTools,
  ...analysisTools,
  ...automationTools,
  ...integrationTools,
]

// Статистика новой архитектуры
export const AI_TOOLS_V2_STATS = {
  core: CORE_TOOLS_COUNT,
  analysis: ANALYSIS_TOOLS_COUNT,
  automation: AUTOMATION_TOOLS_COUNT,
  integration: INTEGRATION_TOOLS_COUNT,
  total: allToolsV2.length,
} as const

// Функция для получения инструментов по домену
export function getToolsByDomain(domain: keyof typeof AI_TOOLS_V2_STATS) {
  switch (domain) {
    case 'core':
      return coreTools
    case 'analysis':
      return analysisTools
    case 'automation':
      return automationTools
    case 'integration':
      return integrationTools
    default:
      return allToolsV2
  }
}

// Типы для domain-based архитектуры
export type AIToolDomain = keyof typeof AI_TOOLS_V2_STATS
export type AIToolsByDomain = {
  [K in AIToolDomain]: K extends 'total' ? typeof allToolsV2 : ReturnType<typeof getToolsByDomain>
}

// Утилиты для работы с новой архитектурой
export const AIToolsV2Utils = {
  getStats: () => AI_TOOLS_V2_STATS,
  getToolsByDomain,
  getAllTools: () => allToolsV2,
  getDomains: () => Object.keys(AI_TOOLS_V2_STATS).filter(k => k !== 'total') as AIToolDomain[],
} as const