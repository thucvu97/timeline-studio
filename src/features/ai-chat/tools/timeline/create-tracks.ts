/**
 * AI инструмент для создания структуры треков на Timeline
 */

import type { TimelineTrack } from "@/features/timeline/types/timeline"

import { generateTrackId } from "./utils/generators"
import { getCurrentTimelineProject, saveTimelineProject } from "./utils/helpers"

import type { TimelineToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"

export const createTrackStructureTool: ClaudeTool = {
  name: "create_track_structure",
  description: "Создает структуру треков для проекта или секции",
  input_schema: {
    type: "object",
    properties: {
      tracks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Название трека" },
            type: {
              type: "string",
              enum: ["video", "audio", "subtitle", "effects", "music"],
              description: "Тип трека",
            },
            height: { type: "number", description: "Высота трека в пикселях" },
            volume: { type: "number", description: "Громкость трека (0-1)" },
            pan: { type: "number", description: "Панорама (-1 до 1)" },
            isLocked: { type: "boolean", description: "Заблокирован ли трек" },
            isMuted: { type: "boolean", description: "Приглушен ли трек" },
            isHidden: { type: "boolean", description: "Скрыт ли трек" },
          },
          required: ["name", "type"],
        },
        description: "Массив треков для создания",
      },
      targetType: {
        type: "string",
        enum: ["global", "section"],
        description: "Где создать треки: глобально или в секции",
      },
      targetSectionId: {
        type: "string",
        description: "ID секции для создания треков (если targetType = section)",
      },
      replaceExisting: {
        type: "boolean",
        description: "Заменить существующие треки",
        default: false,
      },
    },
    required: ["tracks"],
  },
}

export async function createTrackStructure(params: any): Promise<TimelineToolResult> {
  const { tracks, targetType = "global", targetSectionId, replaceExisting = false } = params

  try {
    const currentProject = await getCurrentTimelineProject()

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для создания треков",
        errors: ["Создайте проект Timeline перед созданием треков"],
      }
    }

    const newTracks: TimelineTrack[] = tracks.map((trackConfig: any, index: number) => ({
      id: generateTrackId(),
      name: trackConfig.name || `Track ${index + 1}`,
      type: trackConfig.type,
      order: index,
      clips: [],
      isLocked: trackConfig.isLocked === true,
      isMuted: trackConfig.isMuted === true,
      isHidden: trackConfig.isHidden === true,
      isSolo: false,
      volume: trackConfig.volume ?? 1,
      pan: trackConfig.pan ?? 0,
      height: trackConfig.height ?? 100,
      trackEffects: [],
      trackFilters: [],
    }))

    if (targetType === "section" && targetSectionId) {
      // Добавляем треки в конкретную секцию
      const section = currentProject.sections.find((s) => s.id === targetSectionId)

      if (!section) {
        return {
          success: false,
          message: `Секция с ID ${targetSectionId} не найдена`,
          errors: [`Section ${targetSectionId} not found`],
        }
      }

      if (replaceExisting) {
        section.tracks = newTracks
      } else {
        // Обновляем порядок для новых треков
        newTracks.forEach((track, index) => {
          track.order = section.tracks.length + index
        })
        section.tracks.push(...newTracks)
      }
    } else {
      // Добавляем глобальные треки
      if (replaceExisting) {
        currentProject.globalTracks = newTracks
      } else {
        // Обновляем порядок для новых треков
        newTracks.forEach((track, index) => {
          track.order = currentProject.globalTracks.length + index
        })
        currentProject.globalTracks.push(...newTracks)
      }
    }

    await saveTimelineProject(currentProject)

    return {
      success: true,
      message: `Создано ${newTracks.length} треков`,
      data: {
        createdElements: newTracks.map((t) => t.id),
        analysis: {
          tracksCreated: newTracks.length,
          targetType,
          targetSectionId,
          trackTypes: newTracks.reduce<Record<string, number>>((acc, track) => {
            acc[track.type] = (acc[track.type] || 0) + 1
            return acc
          }, {}),
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка создания треков: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
