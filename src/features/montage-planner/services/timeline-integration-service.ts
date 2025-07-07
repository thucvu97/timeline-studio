/**
 * Timeline Integration Service
 *
 * Сервис для применения монтажных планов к Timeline
 */

import { MediaFile } from "@/features/media/types/media"
import {
  TimelineClip,
  TimelineProject,
  TimelineSection,
  TimelineTrack,
  TrackType,
  createTimelineClip,
  createTimelineSection,
  createTimelineTrack,
} from "@/features/timeline/types"

import { MontageClip, MontagePlan, TransitionPlan } from "../types"

export interface TimelineIntegrationOptions {
  // Создать новую секцию для плана
  createNewSection?: boolean
  sectionName?: string

  // Использовать существующие треки
  useExistingTracks?: boolean

  // Применить переходы
  applyTransitions?: boolean

  // Смещение времени
  timeOffset?: number

  // Целевые треки (если не создаем новые)
  targetVideoTrack?: string
  targetAudioTrack?: string
}

// Экспортируем функции вместо класса со статическими методами
/**
 * Применить монтажный план к Timeline
 */
export function applyPlanToTimeline(
  plan: MontagePlan,
  project: TimelineProject,
  mediaFiles: MediaFile[],
  options: TimelineIntegrationOptions = {},
): TimelineProject {
  const {
    createNewSection = true,
    sectionName = plan.name,
    useExistingTracks = false,
    applyTransitions = true,
    timeOffset = 0,
  } = options

  // Клонируем проект для безопасности
  const updatedProject = { ...project }

  // Создаем мапу медиафайлов по пути для быстрого доступа
  const mediaMap = new Map<string, MediaFile>()
  mediaFiles.forEach((file) => {
    mediaMap.set(file.path, file)
  })

  // Определяем секцию для добавления клипов
  let targetSection: TimelineSection

  if (createNewSection) {
    // Создаем новую секцию для монтажного плана
    targetSection = createTimelineSection({
      name: sectionName,
      startTime: calculateSectionStartTime(updatedProject),
      duration: plan.total_duration,
      realStartTime: new Date(),
    })

    updatedProject.sections = [...updatedProject.sections, targetSection]
  } else {
    // Используем последнюю секцию или создаем, если нет
    targetSection = updatedProject.sections[updatedProject.sections.length - 1]
    if (!targetSection) {
      targetSection = createTimelineSection({
        name: "Main Section",
        startTime: 0,
        duration: plan.total_duration,
      })
      updatedProject.sections = [targetSection]
    }
  }

  // Определяем треки для клипов
  const { videoTrack, audioTrack } = getOrCreateTracks(targetSection, useExistingTracks, options)

  // Группируем клипы по трекам
  const videoClips = plan.clips.filter((clip) => {
    const mediaFile = mediaMap.get(clip.source_file)
    return mediaFile?.isVideo || mediaFile?.isImage
  })

  const audioClips = plan.clips.filter((clip) => {
    const mediaFile = mediaMap.get(clip.source_file)
    return mediaFile?.isAudio
  })

  // Добавляем видео клипы
  if (videoTrack && videoClips.length > 0) {
    const timelineClips = createTimelineClips(videoClips, videoTrack.id, mediaMap, timeOffset)

    // Применяем переходы если нужно
    if (applyTransitions && plan.transitions.length > 0) {
      applyTransitionsToClips(timelineClips, plan.transitions)
    }

    videoTrack.clips = [...(videoTrack.clips || []), ...timelineClips]
  }

  // Добавляем аудио клипы
  if (audioTrack && audioClips.length > 0) {
    const timelineClips = createTimelineClips(audioClips, audioTrack.id, mediaMap, timeOffset)

    audioTrack.clips = [...(audioTrack.clips || []), ...timelineClips]
  }

  // Обновляем длительность проекта
  updatedProject.duration = Math.max(updatedProject.duration, calculateProjectDuration(updatedProject))

  return updatedProject
}

/**
 * Создать клипы для Timeline из монтажных клипов
 */
function createTimelineClips(
  montageClips: MontageClip[],
  trackId: string,
  mediaMap: Map<string, MediaFile>,
  timeOffset: number,
): TimelineClip[] {
  return montageClips
    .map((montageClip, index) => {
      const mediaFile = mediaMap.get(montageClip.source_file)

      if (!mediaFile) {
        console.warn(`Media file not found: ${montageClip.source_file}`)
        return null
      }

      const timelineClip = createTimelineClip({
        id: `montage_clip_${montageClip.id}`,
        name: `${mediaFile.name} - Moment ${index + 1}`,
        trackId,
        startTime: Number(montageClip.start_time) + Number(timeOffset),
        duration: montageClip.duration,
        mediaFileId: mediaFile.id,
        sourceStartTime: montageClip.start_time,
        sourceEndTime: montageClip.end_time,
      })

      // Применяем настройки из монтажного клипа
      if (montageClip.adjustments) {
        const adjustments = montageClip.adjustments

        // Скорость воспроизведения
        if (adjustments.speed_multiplier) {
          timelineClip.playbackRate = adjustments.speed_multiplier
        }

        // Fade in/out
        if (adjustments.fade_in) {
          timelineClip.fadeInDuration = adjustments.fade_in
        }
        if (adjustments.fade_out) {
          timelineClip.fadeOutDuration = adjustments.fade_out
        }

        // Стабилизация
        if (adjustments.stabilization) {
          // Добавляем эффект стабилизации
          timelineClip.appliedEffects = [
            ...(timelineClip.appliedEffects || []),
            {
              effectId: "stabilization",
              enabled: true,
              customParams: {},
            },
          ]
        }

        // Кроп
        if (adjustments.crop) {
          timelineClip.cropSettings = adjustments.crop
        }
      }

      // Добавляем метаданные о моменте
      timelineClip.metadata = {
        ...timelineClip.metadata,
        montageMetadata: {
          momentCategory: montageClip.moment.category,
          momentScore: montageClip.moment.total_score,
          compositionScore: montageClip.moment.scores.composition,
          emotionalTone: montageClip.moment.emotional_tone,
        },
      }

      return timelineClip
    })
    .filter(Boolean) as TimelineClip[]
}

/**
 * Применить переходы к клипам
 */
function applyTransitionsToClips(clips: TimelineClip[], transitions: TransitionPlan[]): void {
  transitions.forEach((transition) => {
    const fromClip = clips.find((c) => c.id.endsWith(transition.from_clip))
    const toClip = clips.find((c) => c.id.endsWith(transition.to_clip))

    if (fromClip && toClip) {
      // Применяем переход к концу первого клипа
      fromClip.appliedTransitions = [
        ...(fromClip.appliedTransitions || []),
        {
          transitionId: transition.transition_type.toLowerCase(),
          position: "out",
          duration: transition.duration,
          targetClipId: toClip.id,
          customParams: {
            easing: transition.easing,
          },
        },
      ]

      // Корректируем время начала следующего клипа для перекрытия
      const overlap = transition.duration / 2
      toClip.startTime = Math.max(fromClip.startTime + fromClip.duration - overlap, toClip.startTime - overlap)
    }
  })
}

/**
 * Получить или создать треки для монтажа
 */
function getOrCreateTracks(
  section: TimelineSection,
  useExisting: boolean,
  options: TimelineIntegrationOptions,
): { videoTrack?: TimelineTrack; audioTrack?: TimelineTrack } {
  let videoTrack: TimelineTrack | undefined
  let audioTrack: TimelineTrack | undefined

  if (useExisting) {
    // Ищем существующие треки
    videoTrack = section.tracks.find((t) => t.id === options.targetVideoTrack || (t.type === "video" && !t.isLocked))

    audioTrack = section.tracks.find((t) => t.id === options.targetAudioTrack || (t.type === "audio" && !t.isLocked))
  }

  // Создаем новые треки если нужно
  if (!videoTrack) {
    videoTrack = createTimelineTrack({
      name: "Montage Video",
      type: "video" as TrackType,
      order: section.tracks.length,
    })
    section.tracks.push(videoTrack)
  }

  if (!audioTrack) {
    audioTrack = createTimelineTrack({
      name: "Montage Audio",
      type: "audio" as TrackType,
      order: section.tracks.length,
    })
    section.tracks.push(audioTrack)
  }

  return { videoTrack, audioTrack }
}

/**
 * Рассчитать время начала новой секции
 */
function calculateSectionStartTime(project: TimelineProject): number {
  if (project.sections.length === 0) {
    return 0
  }

  const lastSection = project.sections[project.sections.length - 1]
  return lastSection.startTime + lastSection.duration
}

/**
 * Рассчитать общую длительность проекта
 */
function calculateProjectDuration(project: TimelineProject): number {
  let maxEndTime = 0

  // Проверяем все секции
  project.sections.forEach((section) => {
    const sectionEndTime = section.startTime + section.duration
    maxEndTime = Math.max(maxEndTime, sectionEndTime)

    // Проверяем все треки в секции
    section.tracks.forEach((track) => {
      track.clips?.forEach((clip) => {
        const clipEndTime = clip.startTime + clip.duration
        maxEndTime = Math.max(maxEndTime, clipEndTime)
      })
    })
  })

  // Проверяем глобальные треки
  project.globalTracks?.forEach((track) => {
    track.clips?.forEach((clip) => {
      const clipEndTime = clip.startTime + clip.duration
      maxEndTime = Math.max(maxEndTime, clipEndTime)
    })
  })

  return maxEndTime
}

// Интерфейс для маркера Timeline (временно, пока нет в основных типах)
interface TimelineMarker {
  id: string
  name: string
  time: number
  color: string
  type: string
  description?: string
}

/**
 * Преобразовать монтажный план в маркеры Timeline
 */
export function createMarkersFromPlan(plan: MontagePlan, timeOffset = 0): TimelineMarker[] {
  const markers: TimelineMarker[] = []

  // Маркер начала плана
  markers.push({
    id: `montage_start_${plan.id}`,
    name: `${plan.name} - Start`,
    time: timeOffset,
    color: "#4CAF50",
    type: "section",
    description: `Generated montage plan (${plan.style.name})`,
  })

  // Маркеры для ключевых моментов
  plan.clips.forEach((clip, index) => {
    if (clip.moment.total_score > 80) {
      markers.push({
        id: `moment_${clip.id}`,
        name: `Key Moment ${Number(index) + 1}`,
        time: Number(clip.start_time || 0) + Number(timeOffset),
        color: "#FF9800",
        type: "note",
        description: `${clip.moment.category} - Score: ${clip.moment.total_score.toFixed(0)}`,
      })
    }
  })

  // Маркер конца плана
  markers.push({
    id: `montage_end_${plan.id}`,
    name: `${plan.name} - End`,
    time: Number(plan.total_duration) + Number(timeOffset),
    color: "#F44336",
    type: "section",
  })

  return markers
}
