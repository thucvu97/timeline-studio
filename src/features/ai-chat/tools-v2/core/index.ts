/**
 * Core AI Tools - Основные инструменты Timeline Studio
 * 
 * Базовая функциональность для работы с Timeline, ресурсами, плеером и браузером
 */

// Timeline инструменты
export * from "./timeline"

// Resources инструменты  
export * from "./resources"

// Browser инструменты
export * from "./browser"

// Player инструменты
export * from "./player"

// Effects & Filters инструменты
export * from "./effects-filters-tools"

// Settings инструменты
export * from "./settings-configuration-tools"

// Сбор всех core инструментов в один массив
import { timelineTools } from "./timeline"
import { resourcesTools } from "./resources"
import { browserTools } from "./browser"
import { playerTools } from "./player"
import { effectsFiltersTools } from "./effects-filters-tools"
import { settingsConfigurationTools } from "./settings-configuration-tools"

export const coreTools = [
  ...timelineTools,
  ...resourcesTools,
  ...browserTools,
  ...playerTools,
  ...effectsFiltersTools,
  ...settingsConfigurationTools,
]

export const CORE_TOOLS_COUNT = coreTools.length