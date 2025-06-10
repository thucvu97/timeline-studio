/**
 * Преобразование Timeline в ProjectSchema для Video Compiler
 */

import { VideoEffect } from "@/features/effects/types/effects"
import { Transition } from "@/features/transitions/types/transitions"
import {
  AspectRatio,
  Clip as BackendClip,
  Effect as BackendEffect,
  Track as BackendTrack,
  Transition as BackendTransition,
  OutputFormat,
  ProjectSchema,
  TrackType,
  toBackendParameter,
  toRustEnumCase,
} from "@/types/video-compiler"

import { TimelineClip, TimelineProject, TimelineTrack } from "../types/timeline"

/**
 * Преобразует проект Timeline в схему для Video Compiler
 */
export function timelineToProjectSchema(
  timeline: TimelineProject,
  effects: VideoEffect[] = [],
  transitions: Transition[] = [],
): ProjectSchema {
  const now = new Date().toISOString()

  // Собираем все треки из секций и глобальные треки
  const tracks: BackendTrack[] = []

  // Добавляем треки из секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach((track) => {
      tracks.push(convertTrack(track, effects))
    })
  })

  // Добавляем глобальные треки
  timeline.globalTracks?.forEach((track) => {
    tracks.push(convertTrack(track, effects))
  })

  // Собираем все эффекты из треков и клипов
  const allEffects: BackendEffect[] = collectAllEffects(timeline, effects)

  // Преобразуем переходы
  const allTransitions: BackendTransition[] = collectAllTransitions(timeline, transitions)

  return {
    version: "1.0.0",
    metadata: {
      name: timeline.name || "Untitled Project",
      description: timeline.description,
      created_at: timeline.createdAt ? timeline.createdAt.toISOString() : now,
      modified_at: now,
      author: undefined,
    },
    timeline: {
      duration: calculateProjectDuration(timeline),
      fps: timeline.settings?.fps || 30,
      resolution: timeline.settings?.resolution
        ? [timeline.settings.resolution.width, timeline.settings.resolution.height]
        : [1920, 1080],
      sample_rate: timeline.settings?.sampleRate || 48000,
      aspect_ratio: getAspectRatio(
        timeline.settings?.resolution
          ? [timeline.settings.resolution.width, timeline.settings.resolution.height]
          : [1920, 1080],
      ),
    },
    tracks,
    effects: allEffects,
    transitions: allTransitions,
    settings: {
      export: {
        format: OutputFormat.Mp4,
        quality: 85,
        video_bitrate: 8000,
        audio_bitrate: 192,
        hardware_acceleration: true,
        ffmpeg_args: [],
      },
      preview: {
        resolution: [1280, 720],
        fps: 30,
        quality: 75,
      },
      custom: {},
    },
  }
}

/**
 * Преобразует трек Timeline в трек Backend
 */
function convertTrack(track: TimelineTrack, effects: VideoEffect[]): BackendTrack {
  const trackType = getTrackType(track.type)

  return {
    id: track.id,
    track_type: trackType,
    name: track.name || `${track.type} Track`,
    enabled: !track.isMuted,
    locked: track.isLocked ?? false,
    volume: track.volume ?? 1.0,
    clips: track.clips.map((clip) => convertClip(clip)),
    effects: track.trackEffects?.map((e) => e.effectId) || [],
  }
}

/**
 * Преобразует клип Timeline в клип Backend
 */
function convertClip(clip: TimelineClip): BackendClip {
  return {
    id: clip.id,
    source_path: clip.mediaFile?.path || "",
    start_time: clip.startTime,
    end_time: clip.startTime + clip.duration,
    source_start: clip.mediaStartTime || 0,
    source_end: clip.mediaEndTime || clip.duration,
    speed: clip.speed || 1.0,
    volume: clip.volume ?? 1.0,
    effects: clip.effects?.map((e) => e.effectId) || [],
  }
}

/**
 * Собирает все эффекты из проекта
 */
function collectAllEffects(timeline: TimelineProject, availableEffects: VideoEffect[]): BackendEffect[] {
  const effectsMap = new Map<string, BackendEffect>()

  // Функция для добавления эффекта
  const addEffect = (effectId: string) => {
    if (effectsMap.has(effectId)) return

    const effect = availableEffects.find((e) => e.id === effectId)
    if (!effect) return

    // Преобразуем параметры
    const parameters: Record<string, any> = {}
    if (effect.params) {
      // Специальный маппинг для некоторых эффектов
      if (["brightness", "contrast", "saturation"].includes(effect.type) && effect.params.intensity) {
        parameters.value = effect.params.intensity
      } else {
        Object.entries(effect.params).forEach(([key, value]) => {
          parameters[key] = value
        })
      }
    }

    effectsMap.set(effectId, {
      id: effect.id,
      effect_type: toRustEnumCase(effect.type) as any,
      name: effect.name,
      enabled: true,
      parameters,
      ffmpeg_command: typeof effect.ffmpegCommand === "function" ? undefined : effect.ffmpegCommand,
    })
  }

  // Собираем эффекты из треков в секциях
  timeline.sections?.forEach((section) => {
    section.tracks.forEach((track) => {
      track.trackEffects?.forEach((effect) => addEffect(effect.effectId))

      // Собираем эффекты из клипов
      track.clips.forEach((clip) => {
        clip.effects?.forEach((effect) => addEffect(effect.effectId))
      })
    })
  })

  // Собираем эффекты из глобальных треков
  timeline.globalTracks?.forEach((track) => {
    track.trackEffects?.forEach((effect) => addEffect(effect.effectId))

    // Собираем эффекты из клипов
    track.clips.forEach((clip) => {
      clip.effects?.forEach((effect) => addEffect(effect.effectId))
    })
  })

  return Array.from(effectsMap.values())
}

/**
 * Собирает все переходы из проекта
 */
function collectAllTransitions(timeline: TimelineProject, availableTransitions: Transition[]): BackendTransition[] {
  const transitions: BackendTransition[] = []

  // Функция для обработки переходов в треке
  const processTrackTransitions = (track: TimelineTrack) => {
    for (let i = 0; i < track.clips.length - 1; i++) {
      const currentClip = track.clips[i]
      const nextClip = track.clips[i + 1]

      // Если клипы перекрываются, это может быть переход
      if (currentClip.startTime + currentClip.duration > nextClip.startTime) {
        const transitionDuration = currentClip.startTime + currentClip.duration - nextClip.startTime

        // Ищем переход в массиве transitions клипа
        const appliedTransition = currentClip.transitions?.find((t) => t.type === "cross")
        const transitionType = appliedTransition?.transitionId || "fade"
        const transition = availableTransitions.find((t) => t.id === transitionType)

        if (transition) {
          transitions.push({
            id: `transition_${currentClip.id}_${nextClip.id}`,
            transition_type: transition.type,
            name: transition.labels.en,
            labels: transition.labels,
            description: transition.description,
            category: toRustEnumCase(transition.category) as any,
            complexity: toRustEnumCase(transition.complexity) as any,
            tags: transition.tags.map((tag) => toRustEnumCase(tag) as any),
            duration: {
              min: transition.duration.min,
              max: transition.duration.max,
              default: transition.duration.default,
              current: transitionDuration,
            },
            start_time: nextClip.startTime,
            from_clip_id: currentClip.id,
            to_clip_id: nextClip.id,
            parameters: {},
            ffmpeg_command: typeof transition.ffmpegCommand === "function" ? undefined : transition.ffmpegCommand,
          })
        }
      }
    }
  }

  // Обрабатываем переходы в треках секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach(processTrackTransitions)
  })

  // Обрабатываем переходы в глобальных треках
  timeline.globalTracks?.forEach(processTrackTransitions)

  return transitions
}

/**
 * Определяет тип трека
 */
function getTrackType(type: string): TrackType {
  switch (type.toLowerCase()) {
    case "video":
      return TrackType.Video
    case "audio":
      return TrackType.Audio
    case "subtitle":
    case "text":
      return TrackType.Subtitle
    default:
      return TrackType.Video
  }
}

/**
 * Вычисляет общую продолжительность проекта
 */
function calculateProjectDuration(timeline: TimelineProject): number {
  let maxEndTime = 0

  // Проверяем клипы в треках секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const clipEndTime = clip.startTime + clip.duration
        if (clipEndTime > maxEndTime) {
          maxEndTime = clipEndTime
        }
      })
    })
  })

  // Проверяем клипы в глобальных треках
  timeline.globalTracks?.forEach((track) => {
    track.clips.forEach((clip) => {
      const clipEndTime = clip.startTime + clip.duration
      if (clipEndTime > maxEndTime) {
        maxEndTime = clipEndTime
      }
    })
  })

  return maxEndTime
}

/**
 * Определяет соотношение сторон по разрешению
 */
function getAspectRatio(resolution?: [number, number]): AspectRatio {
  if (!resolution) return AspectRatio.Ratio16x9

  const [width, height] = resolution
  const ratio = width / height

  if (Math.abs(ratio - 16 / 9) < 0.01) return AspectRatio.Ratio16x9
  if (Math.abs(ratio - 4 / 3) < 0.01) return AspectRatio.Ratio4x3
  if (Math.abs(ratio - 1) < 0.01) return AspectRatio.Ratio1x1
  if (Math.abs(ratio - 9 / 16) < 0.01) return AspectRatio.Ratio9x16

  return AspectRatio.Custom
}

/**
 * Пример использования
 */
/*
// В компоненте Timeline
import { useTimeline } from '@/features/timeline/hooks/use-timeline';
import { useEffects } from '@/features/effects/hooks/use-effects';
import { useTransitions } from '@/features/transitions/hooks/use-transitions';
import { useVideoCompiler } from '@/hooks/use-video-compiler';
import { timelineToProjectSchema } from './timeline-to-project';

function ExportButton() {
  const { project } = useTimeline();
  const { effects } = useEffects();
  const { transitions } = useTransitions();
  const { startRender } = useVideoCompiler();
  
  const handleExport = async () => {
    // Преобразуем timeline в схему проекта
    const projectSchema = timelineToProjectSchema(project, effects, transitions);
    
    // Запускаем рендеринг
    const outputPath = `/Users/${username}/Movies/export.mp4`;
    await startRender(projectSchema, outputPath);
  };
  
  return (
    <button onClick={handleExport}>
      Экспортировать видео
    </button>
  );
}
*/
