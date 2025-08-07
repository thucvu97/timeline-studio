/**
 * AI инструменты для работы с Timeline (модульная версия)
 *
 * Этот файл экспортирует все Timeline инструменты из модульной структуры
 * и предоставляет функцию выполнения для совместимости
 */

// Импортируем BaseAITool функции выполнения
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
 * Выполняет инструменты Timeline с использованием BaseAITool архитектуры
 */
export async function executeTimelineTool(toolName: string, input: Record<string, any>): Promise<TimelineToolResult> {
  try {
    switch (toolName) {
      case "analyze_timeline_structure":
        const structureResult = await analyzeTimelineStructure(input)
        return structureResult.success
          ? {
              success: true,
              data: structureResult.data,
              message: structureResult.data?.message || "Анализ структуры завершен",
            }
          : {
              success: false,
              errors: structureResult.errors,
              message: structureResult.errors?.[0] || "Ошибка анализа структуры",
            }

      case "create_timeline_project":
        const projectResult = await createTimelineProject(input)
        return projectResult.success
          ? {
              success: true,
              data: projectResult.data,
              message: projectResult.data?.message || "Проект создан",
            }
          : {
              success: false,
              errors: projectResult.errors,
              message: projectResult.errors?.[0] || "Ошибка создания проекта",
            }

      case "create_sections_by_strategy":
        const sectionsResult = await createSectionsByStrategy(input)
        return sectionsResult.success
          ? {
              success: true,
              data: sectionsResult.data,
              message: sectionsResult.data?.message || "Секции созданы",
            }
          : {
              success: false,
              errors: sectionsResult.errors,
              message: sectionsResult.errors?.[0] || "Ошибка создания секций",
            }

      case "create_track_structure":
        const tracksResult = await createTrackStructure(input)
        return tracksResult.success
          ? {
              success: true,
              data: tracksResult.data,
              message: tracksResult.data?.message || "Треки созданы",
            }
          : {
              success: false,
              errors: tracksResult.errors,
              message: tracksResult.errors?.[0] || "Ошибка создания треков",
            }

      case "place_clips_on_timeline":
        const clipsResult = await placeClipsOnTimeline(input)
        return clipsResult.success
          ? {
              success: true,
              data: clipsResult.data,
              message: clipsResult.data?.message || "Клипы размещены",
            }
          : {
              success: false,
              errors: clipsResult.errors,
              message: clipsResult.errors?.[0] || "Ошибка размещения клипов",
            }

      case "apply_automatic_enhancements":
        const enhancementsResult = await applyAutomaticEnhancements(input)
        return enhancementsResult.success
          ? {
              success: true,
              data: enhancementsResult.data,
              message: enhancementsResult.data?.message || "Улучшения применены",
            }
          : {
              success: false,
              errors: enhancementsResult.errors,
              message: enhancementsResult.errors?.[0] || "Ошибка применения улучшений",
            }

      case "analyze_content_for_story":
        const storyResult = await analyzeContentForStory(input)
        return storyResult.success
          ? {
              success: true,
              data: storyResult.data,
              message: storyResult.data?.message || "Анализ истории завершен",
            }
          : {
              success: false,
              errors: storyResult.errors,
              message: storyResult.errors?.[0] || "Ошибка анализа истории",
            }

      case "detect_and_split_scenes":
        const scenesResult = await detectAndSplitScenes(input)
        return scenesResult.success
          ? {
              success: true,
              data: scenesResult.data,
              message: scenesResult.data?.message || "Сцены обнаружены",
            }
          : {
              success: false,
              errors: scenesResult.errors,
              message: scenesResult.errors?.[0] || "Ошибка обнаружения сцен",
            }

      case "synchronize_with_music":
        const musicResult = await synchronizeWithMusic(input)
        return musicResult.success
          ? {
              success: true,
              data: musicResult.data,
              message: musicResult.data?.message || "Синхронизация с музыкой завершена",
            }
          : {
              success: false,
              errors: musicResult.errors,
              message: musicResult.errors?.[0] || "Ошибка синхронизации с музыкой",
            }

      case "suggest_timeline_improvements":
        const improvementsResult = await suggestTimelineImprovements(input)
        return improvementsResult.success
          ? {
              success: true,
              data: improvementsResult.data,
              message: improvementsResult.data?.message || "Рекомендации созданы",
            }
          : {
              success: false,
              errors: improvementsResult.errors,
              message: improvementsResult.errors?.[0] || "Ошибка создания рекомендаций",
            }

      case "export_timeline_data":
        const exportResult = await exportTimelineData(input)
        return exportResult.success
          ? {
              success: true,
              data: exportResult.data,
              message: exportResult.data?.message || "Экспорт завершен",
            }
          : {
              success: false,
              errors: exportResult.errors,
              message: exportResult.errors?.[0] || "Ошибка экспорта",
            }

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
