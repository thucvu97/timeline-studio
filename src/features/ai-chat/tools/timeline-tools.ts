/**
 * AI инструменты для работы с Timeline (модульная версия)
 *
 * Этот файл экспортирует все Timeline инструменты из модульной структуры
 * и предоставляет функцию выполнения для совместимости
 */

// Импортируем функции выполнения
import { analyzeContentForStory } from "./timeline/analyze-story"
import { analyzeTimelineStructure } from "./timeline/analyze-structure"
import { applyAutomaticEnhancements } from "./timeline/apply-enhancements"
import { createTimelineProject } from "./timeline/create-project"
import { createSectionsByStrategy } from "./timeline/create-sections"
import { createTrackStructure } from "./timeline/create-tracks"
import { detectAndSplitScenes } from "./timeline/detect-scenes"
import { exportTimelineData } from "./timeline/export-data"
import { placeClipsOnTimeline } from "./timeline/place-clips"
import { suggestTimelineImprovements } from "./timeline/suggest-improvements"
import { synchronizeWithMusic } from "./timeline/sync-music"

import type { TimelineToolResult } from "./timeline/types"

// Экспортируем инструменты для обратной совместимости
export {
  setTimelineStateAccess,
  type TimelineToolEvent,
  type TimelineToolResult,
  timelineTools,
} from "./timeline"

/**
 * Выполняет инструменты Timeline
 */
export async function executeTimelineTool(toolName: string, input: Record<string, any>): Promise<TimelineToolResult> {
  try {
    switch (toolName) {
      case "analyze_timeline_structure":
        return await analyzeTimelineStructure(input)

      case "create_timeline_project":
        return await createTimelineProject(input)

      case "create_sections_by_strategy":
        return await createSectionsByStrategy(input)

      case "create_track_structure":
        return await createTrackStructure(input)

      case "place_clips_on_timeline":
        return await placeClipsOnTimeline(input)

      case "apply_automatic_enhancements":
        return await applyAutomaticEnhancements(input)

      case "analyze_content_for_story":
        return await analyzeContentForStory(input)

      case "detect_and_split_scenes":
        return await detectAndSplitScenes(input)

      case "synchronize_with_music":
        return await synchronizeWithMusic(input)

      case "suggest_timeline_improvements":
        return await suggestTimelineImprovements(input)

      case "export_timeline_data":
        return await exportTimelineData(input)

      default:
        throw new Error(`Неизвестный timeline инструмент: ${toolName}`)
    }
  } catch (error) {
    console.error(`Ошибка выполнения timeline tool ${toolName}:`, error)
    return {
      success: false,
      message: `Ошибка выполнения инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
