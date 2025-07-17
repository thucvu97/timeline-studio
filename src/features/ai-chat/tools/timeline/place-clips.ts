/**
 * AI инструмент для размещения клипов на Timeline
 */

import type { TimelineClip, TimelineTrack } from "@/features/timeline/types"

import { generateClipId } from "./utils/generators"
import {
  assignTrackForClip,
  getClipTrackDistribution,
  getCurrentTimelineProject,
  saveTimelineProject,
} from "./utils/helpers"

import type { TimelineToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"

// import { createTimelineClip } from "@/features/timeline/types" // TODO: Fix when available

export const placeClipsOnTimelineTool: ClaudeTool = {
  name: "place_clips_on_timeline",
  description: "Размещает клипы из ресурсов на треки таймлайна по заданной стратегии",
  input_schema: {
    type: "object",
    properties: {
      clips: {
        type: "array",
        items: {
          type: "object",
          properties: {
            resourceId: {
              type: "string",
              description: "ID ресурса для размещения",
            },
            name: {
              type: "string",
              description: "Название клипа",
            },
            targetTrackId: {
              type: "string",
              description: "ID целевого трека (опционально)",
            },
            startTime: {
              type: "number",
              description: "Время начала на треке",
            },
            duration: {
              type: "number",
              description: "Длительность клипа",
            },
            trimStart: {
              type: "number",
              description: "Обрезка начала медиа",
            },
            trimEnd: {
              type: "number",
              description: "Обрезка конца медиа",
            },
            contentType: {
              type: "string",
              description: "Тип контента (video, audio, image)",
            },
          },
          required: ["resourceId", "duration"],
        },
      },
      strategy: {
        type: "string",
        enum: ["sequential", "manual", "smart", "chronological", "content-based"],
        description: "Стратегия размещения клипов",
        default: "sequential",
      },
      trackAssignment: {
        type: "string",
        enum: ["auto", "content_type", "least_used", "time_based", "smart", "sequential"],
        description: "Стратегия назначения треков",
        default: "smart",
      },
      spacing: {
        type: "number",
        description: "Промежуток между клипами в секундах",
        default: 0,
      },
      preventOverlaps: {
        type: "boolean",
        description: "Предотвратить перекрытия клипов",
        default: true,
      },
    },
    required: ["clips"],
  },
}

export async function placeClipsOnTimeline(params: any): Promise<TimelineToolResult> {
  const { clips, strategy = "sequential", trackAssignment = "smart", spacing = 0, preventOverlaps = true } = params

  try {
    const currentProject = await getCurrentTimelineProject()

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для размещения клипов",
        errors: ["Создайте проект Timeline перед размещением клипов"],
      }
    }

    const placedClips: TimelineClip[] = []
    let currentTime = 0

    // Сортируем клипы если стратегия chronological
    const clipsToPlace = [...clips]
    if (strategy === "chronological") {
      clipsToPlace.sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
    }

    for (const clipConfig of clipsToPlace) {
      // Собираем все треки
      const allTracks: TimelineTrack[] = [...currentProject.globalTracks]
      currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

      // Определяем трек для размещения
      const trackId = clipConfig.targetTrackId || assignTrackForClip(allTracks, clipConfig, trackAssignment)

      if (!trackId) {
        console.warn(`Не удалось найти подходящий трек для клипа ${clipConfig.name}`)
        continue
      }

      // Определяем время начала
      let startTime = clipConfig.startTime
      if (strategy === "sequential") {
        startTime = currentTime
      } else if (strategy === "smart" && !startTime) {
        // Находим первое свободное место на треке
        const track = allTracks.find((t) => t.id === trackId)
        if (track) {
          const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)
          startTime = 0
          for (const existingClip of sortedClips) {
            if (existingClip.startTime >= startTime + clipConfig.duration) {
              break
            }
            startTime = existingClip.startTime + existingClip.duration + spacing
          }
        }
      }

      // Создаем клип
      const clip: TimelineClip = {
        id: generateClipId(),
        name: clipConfig.name || `Clip ${placedClips.length + 1}`,
        trackId,
        mediaId: clipConfig.resourceId,
        startTime: startTime || 0,
        duration: clipConfig.duration,
        mediaStartTime: clipConfig.trimStart || 0,
        mediaEndTime: (clipConfig.trimStart || 0) + clipConfig.duration,
        // Default values for TimelineClip
        volume: 1,
        speed: 1,
        offset: 0,
        isReversed: false,
        opacity: 1,
        effects: [],
        filters: [],
        transitions: [],
        mediaFile: undefined,
        isSelected: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Проверяем на перекрытия
      if (preventOverlaps) {
        const track = allTracks.find((t) => t.id === trackId)
        if (track) {
          const hasOverlap = track.clips.some(
            (existingClip: TimelineClip) =>
              clip.startTime < existingClip.startTime + existingClip.duration &&
              clip.startTime + clip.duration > existingClip.startTime,
          )

          if (hasOverlap) {
            console.warn(`Пропущен клип ${clip.name} из-за перекрытия`)
            continue
          }
        }
      }

      placedClips.push(clip)

      // Добавляем клип к треку
      const track = allTracks.find((t) => t.id === trackId)
      if (track) {
        track.clips.push(clip)
      }

      // Обновляем текущее время для sequential стратегии
      if (strategy === "sequential") {
        currentTime = clip.startTime + clip.duration + spacing
      }
    }

    // Сохраняем проект
    await saveTimelineProject(currentProject)

    return {
      success: true,
      message: `Размещено ${placedClips.length} клипов на Timeline`,
      data: {
        createdElements: placedClips.map((c) => c.id),
        analysis: {
          strategy,
          trackAssignment,
          placedCount: placedClips.length,
          skippedCount: clips.length - placedClips.length,
          totalDuration: placedClips.reduce((sum, clip) => sum + clip.duration, 0),
          trackDistribution: getClipTrackDistribution(placedClips),
        },
      },
      warnings:
        placedClips.length < clips.length
          ? [`${clips.length - placedClips.length} клипов не были размещены`]
          : undefined,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка размещения клипов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
