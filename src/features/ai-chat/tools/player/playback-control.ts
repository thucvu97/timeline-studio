/**
 * AI инструмент для управления воспроизведением
 */

import type { ClaudeTool } from "../../services/claude-service"

import type { PlaybackControlParams, PlayerToolResult } from "./types"
import { getPlayerState, hasLoadedMedia, setPlayerState } from "./utils/helpers"

export const controlPlaybackTool: ClaudeTool = {
  name: "control_playback",
  description: "Управляет воспроизведением медиа в плеере",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["play", "pause", "stop", "seek", "volume", "speed"],
        description: "Действие для выполнения",
      },
      value: {
        type: "number",
        description: "Значение для действия (громкость 0-1, скорость 0.1-4)",
      },
      position: {
        type: "number",
        description: "Позиция для перемотки в секундах",
      },
    },
    required: ["action"],
  },
}

export async function controlPlayback(params: PlaybackControlParams): Promise<PlayerToolResult> {
  try {
    if (!hasLoadedMedia()) {
      return {
        success: false,
        message: "Нет загруженного медиа для управления воспроизведением",
        warnings: ["Загрузите медиа файл в плеер"],
      }
    }

    const currentState = getPlayerState()
    if (!currentState) {
      return {
        success: false,
        message: "Не удалось получить состояние плеера",
        errors: ["Player state not available"],
      }
    }

    let message = ""
    const updates: any = {}

    switch (params.action) {
      case "play":
        if (currentState.isPlaying) {
          message = "Воспроизведение уже активно"
        } else {
          updates.isPlaying = true
          message = "Воспроизведение запущено"
        }
        break

      case "pause":
        if (!currentState.isPlaying) {
          message = "Воспроизведение уже приостановлено"
        } else {
          updates.isPlaying = false
          message = "Воспроизведение приостановлено"
        }
        break

      case "stop":
        updates.isPlaying = false
        updates.currentTime = 0
        message = "Воспроизведение остановлено"
        break

      case "seek":
        if (params.position === undefined) {
          return {
            success: false,
            message: "Не указана позиция для перемотки",
            errors: ["Position parameter is required for seek action"],
          }
        }

        const clampedPosition = Math.max(0, Math.min(params.position, currentState.duration))
        updates.currentTime = clampedPosition
        message = `Перемотка на ${clampedPosition.toFixed(2)} секунд`
        break

      case "volume":
        if (params.value === undefined) {
          return {
            success: false,
            message: "Не указано значение громкости",
            errors: ["Value parameter is required for volume action"],
          }
        }

        const clampedVolume = Math.max(0, Math.min(params.value, 1))
        updates.volume = clampedVolume
        updates.muted = clampedVolume === 0
        message = `Громкость установлена на ${(clampedVolume * 100).toFixed(0)}%`
        break

      case "speed":
        if (params.value === undefined) {
          return {
            success: false,
            message: "Не указано значение скорости",
            errors: ["Value parameter is required for speed action"],
          }
        }

        const clampedSpeed = Math.max(0.1, Math.min(params.value, 4))
        updates.playbackSpeed = clampedSpeed
        message = `Скорость воспроизведения установлена на ${clampedSpeed}x`
        break

      default:
        return {
          success: false,
          message: `Неизвестное действие: ${params.action}`,
          errors: [`Unknown action: ${params.action}`],
        }
    }

    // Применяем обновления
    if (Object.keys(updates).length > 0) {
      setPlayerState(updates)
    }

    return {
      success: true,
      message,
      data: {
        action: params.action,
        previousState: currentState,
        newState: { ...currentState, ...updates },
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка управления воспроизведением: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
