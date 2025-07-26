/**
 * AI инструмент для синхронизации с музыкой
 */

import type { TimelineToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"

export const synchronizeWithMusicTool: ClaudeTool = {
  name: "synchronize_with_music",
  description: "Синхронизирует клипы и переходы с музыкальным ритмом",
  input_schema: {
    type: "object",
    properties: {
      musicTrackId: {
        type: "string",
        description: "ID музыкального трека для синхронизации",
      },
      syncOptions: {
        type: "object",
        properties: {
          syncCuts: {
            type: "boolean",
            description: "Синхронизировать монтажные склейки с битом",
          },
          syncTransitions: {
            type: "boolean",
            description: "Синхронизировать переходы с музыкой",
          },
          beatDetection: {
            type: "string",
            enum: ["auto", "manual", "bpm-based"],
            description: "Метод детекции битов",
          },
          targetBPM: {
            type: "number",
            description: "Целевой BPM (если известен)",
          },
        },
      },
    },
    required: ["musicTrackId"],
  },
}

export async function synchronizeWithMusic(params: any): Promise<TimelineToolResult> {
  const {
    musicTrackId,
    syncOptions = {
      syncCuts: true,
      syncTransitions: true,
      beatDetection: "auto",
    },
  } = params

  try {
    const { getTimelineStateAccess } = await import("./types")

    const timelineAccess = getTimelineStateAccess()
    if (!timelineAccess) {
      return {
        success: false,
        message: "Timeline state access не настроен",
        errors: ["Доступ к timeline не сконфигурирован"],
      }
    }

    const currentProject = timelineAccess.getCurrentProject()
    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для синхронизации",
        errors: ["Откройте или создайте проект в timeline"],
      }
    }

    // Найти музыкальный трек
    const allTracks = [...currentProject.globalTracks]
    currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

    const musicTrack = allTracks.find((track) => track.id === musicTrackId)
    if (!musicTrack) {
      return {
        success: false,
        message: "Музыкальный трек не найден",
        errors: [`Трек с ID ${musicTrackId} не существует в проекте`],
      }
    }

    // Найти музыкальный клип
    const musicClip = musicTrack.clips.find((clip) => clip.mediaFile?.isAudio)
    if (!musicClip) {
      return {
        success: false,
        message: "Аудио клип не найден на указанном треке",
        errors: ["На треке нет аудио контента для синхронизации"],
      }
    }

    // Анализ музыки и детекция битов
    const musicAnalysis = await analyzeMusicForSync(musicClip, syncOptions)

    const synchronizedElements: string[] = []
    const recommendations: string[] = []
    let modificationsCount = 0

    // Синхронизация монтажных склеек
    if (syncOptions.syncCuts) {
      const cutSyncResult = await syncCutsWithBeats(currentProject, musicAnalysis)
      synchronizedElements.push(...cutSyncResult.modifiedClips)
      modificationsCount += cutSyncResult.modificationsCount
      recommendations.push(...cutSyncResult.recommendations)
    }

    // Синхронизация переходов
    if (syncOptions.syncTransitions) {
      const transitionSyncResult = await syncTransitionsWithMusic(currentProject, musicAnalysis)
      synchronizedElements.push(...transitionSyncResult.modifiedTransitions)
      modificationsCount += transitionSyncResult.modificationsCount
      recommendations.push(...transitionSyncResult.recommendations)
    }

    // Генерация дополнительных рекомендаций
    const additionalRecommendations = generateSyncRecommendations(musicAnalysis, currentProject)
    recommendations.push(...additionalRecommendations)

    return {
      success: true,
      message: `Синхронизация с музыкой завершена (${modificationsCount} изменений)`,
      data: {
        analysis: {
          detectedBPM: musicAnalysis.bpm || 0,
          beatMarkers: musicAnalysis.beats?.length || 0,
          musicDuration: musicAnalysis.duration || 0,
          rhythmComplexity: musicAnalysis.rhythmComplexity || 0,
        },
        synchronizedElements,
        modificationsCount,
        syncOptions,
      },
      warnings:
        modificationsCount === 0 ? ["Не удалось выполнить синхронизацию - проверьте настройки и контент"] : undefined,
      nextActions: [
        "Просмотреть синхронизированный результат",
        "Тонкая настройка временных меток",
        "Добавить переходы на музыкальные акценты",
        "Проанализировать ритмическую структуру",
      ],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка синхронизации с музыкой: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

// Анализ музыки для синхронизации
async function analyzeMusicForSync(musicClip: any, syncOptions: any): Promise<any> {
  // Анализируем аудио клип для детекции битов
  const duration = musicClip.duration

  // Простая детекция BPM на основе длительности и предполагаемых ударов
  const bpm = syncOptions.targetBPM || estimateBPMFromClip(musicClip)

  // Генерируем массив битов на основе BPM
  const beats = generateBeatMarkers(bpm, duration, musicClip.startTime)

  // Определяем ритмическую сложность
  const rhythmComplexity = calculateRhythmComplexity(bpm, duration)

  return {
    bpm,
    beats,
    duration,
    rhythmComplexity,
    musicClip,
    detectionMethod: syncOptions.beatDetection,
  }
}

// Синхронизация монтажных склеек с битами
async function syncCutsWithBeats(project: any, musicAnalysis: any): Promise<any> {
  const modifiedClips: string[] = []
  const recommendations: string[] = []
  let modificationsCount = 0

  // Собираем все видео треки
  const allTracks = [...project.globalTracks]
  project.sections.forEach((section: any) => allTracks.push(...section.tracks))

  const videoTracks = allTracks.filter((track) => track.type === "video")

  if (videoTracks.length === 0) {
    recommendations.push("Нет видео треков для синхронизации монтажных склеек")
    return { modifiedClips, modificationsCount, recommendations }
  }

  // Для каждого видео трека пытаемся синхронизировать склейки с битами
  for (const track of videoTracks) {
    const trackModifications = syncTrackClipsWithBeats(track, musicAnalysis.beats)
    modifiedClips.push(...trackModifications.modifiedClips)
    modificationsCount += trackModifications.count
  }

  if (modificationsCount > 0) {
    recommendations.push(`Синхронизировано ${modificationsCount} монтажных склеек с музыкальным ритмом`)
    recommendations.push("Проверьте, что переходы выглядят естественно")
  }

  return { modifiedClips, modificationsCount, recommendations }
}

// Синхронизация переходов с музыкой
async function syncTransitionsWithMusic(project: any, musicAnalysis: any): Promise<any> {
  const modifiedTransitions: string[] = []
  const recommendations: string[] = []
  let modificationsCount = 0

  // Ищем существующие переходы и синхронизируем их с битами
  const allTracks = [...project.globalTracks]
  project.sections.forEach((section: any) => allTracks.push(...section.tracks))

  for (const track of allTracks) {
    for (const clip of track.clips) {
      if (clip.transitions && clip.transitions.length > 0) {
        for (const transition of clip.transitions) {
          // Найти ближайший бит для синхронизации перехода
          const nearestBeat = findNearestBeat(transition.startTime || clip.startTime, musicAnalysis.beats)

          if (nearestBeat && Math.abs(nearestBeat.time - (transition.startTime || clip.startTime)) < 0.5) {
            // Синхронизируем переход с битом
            transition.startTime = nearestBeat.time
            modifiedTransitions.push(transition.id || `transition_${clip.id}`)
            modificationsCount++
          }
        }
      }
    }
  }

  // Предлагаем создать новые переходы на сильных битах
  const strongBeats = musicAnalysis.beats.filter((beat: any) => beat.strength > 0.7)
  if (strongBeats.length > 0) {
    recommendations.push(
      `Найдено ${strongBeats.length} сильных битов - рассмотрите добавление переходов на эти моменты`,
    )
  }

  return { modifiedTransitions, modificationsCount, recommendations }
}

// Вспомогательные функции

function estimateBPMFromClip(clip: any): number {
  // Простая оценка BPM на основе длительности клипа
  // В реальной реализации здесь был бы анализ аудио
  const duration = clip.duration

  // Предполагаем стандартные BPM диапазоны
  if (duration < 60) {
    return 140 // Быстрая музыка
  }
  if (duration < 180) {
    return 120 // Умеренная
  }
  return 80 // Медленная
}

function generateBeatMarkers(bpm: number, duration: number, startOffset = 0): any[] {
  const beats: any[] = []
  const beatInterval = 60 / bpm // Интервал между битами в секундах

  for (let time = startOffset; time < startOffset + duration; time += beatInterval) {
    beats.push({
      time,
      strength: Math.random() * 0.5 + 0.5, // Случайная сила бита от 0.5 до 1
      isDownbeat: beats.length % 4 === 0, // Каждый 4-й бит - сильная доля
    })
  }

  return beats
}

function calculateRhythmComplexity(bpm: number, _duration: number): string {
  // Оценка сложности ритма
  if (bpm > 140) {
    return "high" // Быстрая музыка = сложная синхронизация
  }
  if (bpm > 100) {
    return "medium"
  }
  return "low"
}

function syncTrackClipsWithBeats(track: any, beats: any[]): any {
  const modifiedClips: string[] = []
  let count = 0

  // Для каждого клипа на треке пытаемся найти ближайший бит
  for (let i = 1; i < track.clips.length; i++) {
    const currentClip = track.clips[i]
    const nearestBeat = findNearestBeat(currentClip.startTime, beats)

    if (nearestBeat && Math.abs(nearestBeat.time - currentClip.startTime) < 1.0) {
      // Синхронизируем только если различие меньше 1 секунды
      const adjustment = nearestBeat.time - currentClip.startTime
      currentClip.startTime = nearestBeat.time

      // Корректируем последующие клипы
      for (let j = i + 1; j < track.clips.length; j++) {
        track.clips[j].startTime += adjustment
      }

      modifiedClips.push(currentClip.id)
      count++
    }
  }

  return { modifiedClips, count }
}

function findNearestBeat(time: number, beats: any[]): any {
  if (beats.length === 0) return null

  let nearestBeat = beats[0]
  let minDistance = Math.abs(beats[0].time - time)

  for (const beat of beats) {
    const distance = Math.abs(beat.time - time)
    if (distance < minDistance) {
      minDistance = distance
      nearestBeat = beat
    }
  }

  return nearestBeat
}

function generateSyncRecommendations(musicAnalysis: any, project: any): string[] {
  const recommendations: string[] = []

  // Рекомендации на основе анализа музыки
  if (musicAnalysis.bpm > 140) {
    recommendations.push("Быстрая музыка - рассмотрите короткие, динамичные кадры")
  } else if (musicAnalysis.bpm < 80) {
    recommendations.push("Медленная музыка - используйте более длинные кадры и плавные переходы")
  }

  if (musicAnalysis.rhythmComplexity === "high") {
    recommendations.push("Сложный ритм - будьте осторожны с частыми склейками")
  }

  // Анализ структуры проекта
  const totalClips =
    project.globalTracks.reduce((sum: number, track: any) => sum + track.clips.length, 0) +
    project.sections.reduce(
      (sum: number, section: any) =>
        sum + section.tracks.reduce((trackSum: number, track: any) => trackSum + track.clips.length, 0),
      0,
    )

  if (totalClips < musicAnalysis.beats.length / 4) {
    recommendations.push("Мало клипов относительно музыкальных битов - добавьте больше контента")
  }

  return recommendations
}
