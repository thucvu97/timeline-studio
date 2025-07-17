/**
 * AI инструменты для работы с видеоплеером (модульная версия)
 *
 * Этот файл экспортирует все Player инструменты из модульной структуры
 * и предоставляет функцию выполнения для совместимости
 */

// Импортируем функции выполнения
import { analyzeCurrentMedia } from "./player/analyze-media"
import { controlPlayback } from "./player/playback-control"
import { applyPreviewEffects, applyPreviewFilters } from "./player/preview-effects"

import type {
  MediaAnalysisParams,
  PlaybackControlParams,
  PlayerToolResult,
  PreviewEffectsParams,
  PreviewFiltersParams,
} from "./player/types"

// Экспортируем инструменты для обратной совместимости
export {
  type PlayerToolResult,
  playerTools,
} from "./player"

/**
 * Выполняет инструменты Player
 */
export async function executePlayerTool(toolName: string, input: Record<string, any>): Promise<PlayerToolResult> {
  try {
    switch (toolName) {
      case "analyze_current_media":
        return await analyzeCurrentMedia(input as MediaAnalysisParams)

      case "control_playback":
        return await controlPlayback(input as PlaybackControlParams)

      case "apply_preview_effects":
        return await applyPreviewEffects(input as PreviewEffectsParams)

      case "apply_preview_filters":
        return await applyPreviewFilters(input as PreviewFiltersParams)

      // Заглушки для остальных инструментов из старого файла
      case "apply_template_preview":
      case "analyze_media_quality":
      case "extract_frame_or_clip":
      case "compare_media_versions":
      case "save_preview_as_resource":
      case "generate_thumbnails":
        return {
          success: false,
          message: `Инструмент ${toolName} временно недоступен (в процессе миграции)`,
          warnings: [`Tool ${toolName} is being migrated to modular structure`],
        }

      default:
        throw new Error(`Неизвестный player инструмент: ${toolName}`)
    }
  } catch (error) {
    console.error(`Ошибка выполнения player tool ${toolName}:`, error)
    return {
      success: false,
      message: `Ошибка выполнения инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
