/**
 * Timeline AI Tools - модульная организация инструментов для работы с Timeline
 */

// Экспортируем все инструменты
// Собираем все инструменты в массив для удобства
import { analyzeContentForStoryTool } from "./analyze-story"
import { analyzeTimelineStructureTool } from "./analyze-structure"
import { applyAutomaticEnhancementsTool } from "./apply-enhancements"
import { createTimelineProjectTool } from "./create-project"
import { createSectionsByStrategyTool } from "./create-sections"
import { createTrackStructureTool } from "./create-tracks"
import { detectAndSplitScenesTool } from "./detect-scenes"
import { exportTimelineDataTool } from "./export-data"
import { placeClipsOnTimelineTool } from "./place-clips"
import { suggestTimelineImprovementsTool } from "./suggest-improvements"
import { synchronizeWithMusicTool } from "./sync-music"

export { analyzeContentForStory, analyzeContentForStoryTool } from "./analyze-story"
export { analyzeTimelineStructureTool } from "./analyze-structure"
export { applyAutomaticEnhancements, applyAutomaticEnhancementsTool } from "./apply-enhancements"
export { createTimelineProjectTool } from "./create-project"
export { createSectionsByStrategyTool } from "./create-sections"
export { createTrackStructureTool } from "./create-tracks"
export { detectAndSplitScenes, detectAndSplitScenesTool } from "./detect-scenes"
export { exportTimelineData, exportTimelineDataTool } from "./export-data"
export { placeClipsOnTimelineTool } from "./place-clips"
export { suggestTimelineImprovements, suggestTimelineImprovementsTool } from "./suggest-improvements"
export { synchronizeWithMusic, synchronizeWithMusicTool } from "./sync-music"
// Экспортируем типы
export * from "./types"
export * from "./utils/analyzers"
export * from "./utils/calculators"
export * from "./utils/creators"
export * from "./utils/detectors"
export * from "./utils/exporters"
export * from "./utils/formatters"
// Экспортируем утилиты
export * from "./utils/generators"
export * from "./utils/helpers"

export const timelineTools = [
  analyzeTimelineStructureTool,
  createTimelineProjectTool,
  createSectionsByStrategyTool,
  createTrackStructureTool,
  placeClipsOnTimelineTool,
  applyAutomaticEnhancementsTool,
  analyzeContentForStoryTool,
  detectAndSplitScenesTool,
  synchronizeWithMusicTool,
  suggestTimelineImprovementsTool,
  exportTimelineDataTool,
]
