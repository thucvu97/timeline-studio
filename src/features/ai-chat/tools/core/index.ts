/**
 * Core AI Tools - Основные инструменты Timeline Studio
 *
 * Базовая функциональность для работы с Timeline, ресурсами, плеером и браузером
 */

// Browser инструменты
export * from "./browser"
// Effects & Filters инструменты
export * from "./effects-filters-tools"
// Player инструменты
export * from "./player"
// Resources инструменты
export * from "./resources"
// Settings инструменты
export * from "./settings-configuration-tools"
// Timeline инструменты
export * from "./timeline"

// Сбор всех core инструментов в один массив
import { browserTools } from "./browser"
import { effectsFiltersTools } from "./effects-filters-tools"
import { playerTools } from "./player"
import { resourceTools } from "./resources"
import { settingsConfigurationTools } from "./settings-configuration-tools"
import { timelineTools } from "./timeline"

export const coreTools = [
  ...timelineTools,
  ...resourceTools,
  ...browserTools,
  ...playerTools,
  ...effectsFiltersTools,
  ...settingsConfigurationTools,
]

export const CORE_TOOLS_COUNT = coreTools.length
