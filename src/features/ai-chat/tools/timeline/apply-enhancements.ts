/**
 * AI инструмент для применения автоматических улучшений к Timeline
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import type { ClaudeTool } from "../../services/claude-service"
import type { TimelineToolResult } from "./types"

export const applyAutomaticEnhancementsTool: ClaudeTool = {
  name: "apply_automatic_enhancements",
  description: "Применяет автоматические улучшения к элементам таймлайна",
  input_schema: {
    type: "object",
    properties: {
      enhancementTypes: {
        type: "array",
        items: {
          type: "string",
          enum: ["transitions", "color-correction", "audio-balance", "stabilization"],
        },
        description: "Типы улучшений для применения",
      },
      targetElements: {
        type: "string",
        enum: ["all", "selected", "section", "track"],
        description: "К каким элементам применить улучшения",
      },
    },
    required: ["enhancementTypes"],
  },
}

export async function applyAutomaticEnhancements(params: any): Promise<TimelineToolResult> {
  const { enhancementTypes = ["transitions", "color-correction", "audio-balance"], targetElements = "all" } = params

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

    const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
    if (!currentProject || !currentProject.id) {
      return {
        success: false,
        message: "Нет активного проекта для применения улучшений",
        errors: ["Откройте или создайте проект в timeline"],
      }
    }

    const appliedEnhancements: string[] = []
    const recommendations: string[] = []
    const warnings: string[] = []
    let modificationsCount = 0

    // Получаем все треки для анализа
    const allTracks = [...currentProject.globalTracks]
    currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

    // Применяем улучшения по типам
    for (const enhancementType of enhancementTypes) {
      const enhancementResult = await applyEnhancementType(enhancementType, allTracks, targetElements, currentProject)

      if (enhancementResult.applied) {
        appliedEnhancements.push(enhancementType)
        modificationsCount += enhancementResult.modificationsCount
        recommendations.push(...enhancementResult.recommendations)

        if (enhancementResult.warnings) {
          warnings.push(...enhancementResult.warnings)
        }
      }
    }

    // Генерируем общие рекомендации
    const overallRecommendations = generateEnhancementRecommendations(appliedEnhancements, currentProject, allTracks)
    recommendations.push(...overallRecommendations)

    const success = appliedEnhancements.length > 0

    return {
      success,
      message: success
        ? `Применено ${appliedEnhancements.length} улучшений (${modificationsCount} изменений)`
        : "Не удалось применить улучшения - проверьте контент проекта",
      data: {
        modificationsCount,
        enhancementDetails: {
          totalTracks: allTracks.length,
          processedElements: getProcessedElementsCount(allTracks, targetElements ?? "all"),
        },
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      nextActions: [
        "Просмотреть результаты улучшений",
        "Настроить параметры улучшений",
        "Применить дополнительные улучшения",
        "Экспортировать улучшенный проект",
      ],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка применения улучшений: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

// Применяет конкретный тип улучшения
async function applyEnhancementType(
  enhancementType: string,
  allTracks: any[],
  targetElements: string,
  _project: any,
): Promise<any> {
  switch (enhancementType) {
    case "transitions":
      return await applyTransitionEnhancements(allTracks, targetElements)

    case "color-correction":
      return await applyColorCorrectionEnhancements(allTracks, targetElements)

    case "audio-balance":
      return await applyAudioBalanceEnhancements(allTracks, targetElements)

    case "stabilization":
      return await applyStabilizationEnhancements(allTracks, targetElements)

    default:
      return {
        applied: false,
        modificationsCount: 0,
        recommendations: [`Неизвестный тип улучшения: ${enhancementType}`],
        warnings: [`Пропущен неподдерживаемый тип улучшения: ${enhancementType}`],
      }
  }
}

// Применяет улучшения переходов
async function applyTransitionEnhancements(allTracks: any[], targetElements: string): Promise<any> {
  const recommendations: string[] = []
  const warnings: string[] = []
  let modificationsCount = 0

  const videoTracks = allTracks.filter((track) => track.type === "video")

  if (videoTracks.length === 0) {
    return {
      applied: false,
      modificationsCount: 0,
      recommendations: [],
      warnings: ["Нет видео треков для применения переходов"],
    }
  }

  // Добавляем базовые переходы между клипами
  for (const track of videoTracks) {
    if (shouldProcessTrack(track, targetElements)) {
      const transitionResult = addBasicTransitionsToTrack(track)
      modificationsCount += transitionResult.addedTransitions

      if (transitionResult.addedTransitions > 0) {
        recommendations.push(
          `Добавлено ${transitionResult.addedTransitions} переходов на трек "${track.name || track.id}"`,
        )
      }
    }
  }

  return {
    applied: modificationsCount > 0,
    modificationsCount,
    recommendations,
    warnings,
  }
}

// Применяет улучшения цветокоррекции
async function applyColorCorrectionEnhancements(allTracks: any[], targetElements: string): Promise<any> {
  const recommendations: string[] = []
  const warnings: string[] = []
  let modificationsCount = 0

  const videoTracks = allTracks.filter((track) => track.type === "video")

  if (videoTracks.length === 0) {
    return {
      applied: false,
      modificationsCount: 0,
      recommendations: [],
      warnings: ["Нет видео треков для цветокоррекции"],
    }
  }

  // Применяем базовую цветокоррекцию
  for (const track of videoTracks) {
    if (shouldProcessTrack(track, targetElements)) {
      for (const clip of track.clips) {
        if (clip.mediaFile?.type === "video") {
          const colorResult = applyBasicColorCorrection(clip)
          if (colorResult.applied) {
            modificationsCount++
          }
        }
      }
    }
  }

  if (modificationsCount > 0) {
    recommendations.push(`Применена базовая цветокоррекция к ${modificationsCount} клипам`)
    recommendations.push("Проверьте результаты и настройте параметры при необходимости")
  }

  return {
    applied: modificationsCount > 0,
    modificationsCount,
    recommendations,
    warnings,
  }
}

// Применяет улучшения аудио баланса
async function applyAudioBalanceEnhancements(allTracks: any[], targetElements: string): Promise<any> {
  const recommendations: string[] = []
  const warnings: string[] = []
  let modificationsCount = 0

  const audioTracks = allTracks.filter((track) => track.type === "audio")

  if (audioTracks.length === 0) {
    return {
      applied: false,
      modificationsCount: 0,
      recommendations: [],
      warnings: ["Нет аудио треков для балансировки"],
    }
  }

  // Применяем нормализацию аудио
  for (const track of audioTracks) {
    if (shouldProcessTrack(track, targetElements)) {
      const audioResult = applyAudioNormalization(track)
      modificationsCount += audioResult.normalizedClips

      if (audioResult.normalizedClips > 0) {
        recommendations.push(
          `Нормализовано ${audioResult.normalizedClips} аудио клипов на треке "${track.name || track.id}"`,
        )
      }
    }
  }

  return {
    applied: modificationsCount > 0,
    modificationsCount,
    recommendations,
    warnings,
  }
}

// Применяет улучшения стабилизации
async function applyStabilizationEnhancements(allTracks: any[], targetElements: string): Promise<any> {
  const recommendations: string[] = []
  const warnings: string[] = []
  let modificationsCount = 0

  const videoTracks = allTracks.filter((track) => track.type === "video")

  if (videoTracks.length === 0) {
    return {
      applied: false,
      modificationsCount: 0,
      recommendations: [],
      warnings: ["Нет видео треков для стабилизации"],
    }
  }

  // Применяем базовую стабилизацию
  for (const track of videoTracks) {
    if (shouldProcessTrack(track, targetElements)) {
      for (const clip of track.clips) {
        if (clip.mediaFile?.type === "video") {
          const stabilizationResult = applyBasicStabilization(clip)
          if (stabilizationResult.applied) {
            modificationsCount++
          }
        }
      }
    }
  }

  if (modificationsCount > 0) {
    recommendations.push(`Применена стабилизация к ${modificationsCount} видео клипам`)
    recommendations.push("Стабилизация может изменить кадрирование видео")
  }

  return {
    applied: modificationsCount > 0,
    modificationsCount,
    recommendations,
    warnings,
  }
}

// Вспомогательные функции

function shouldProcessTrack(track: any, targetElements: string): boolean {
  switch (targetElements) {
    case "all":
      return true
    case "selected":
      return track.selected === true
    case "section":
      return track.sectionId !== undefined
    case "track":
      return true
    default:
      return true
  }
}

function addBasicTransitionsToTrack(track: any): any {
  let addedTransitions = 0

  for (let i = 1; i < track.clips.length; i++) {
    const currentClip = track.clips[i]
    const prevClip = track.clips[i - 1]

    // Проверяем, нет ли уже перехода
    if (!currentClip.transitions || currentClip.transitions.length === 0) {
      // Добавляем простой переход
      currentClip.transitions = currentClip.transitions || []
      currentClip.transitions.push({
        id: `transition_${currentClip.id}_${Date.now()}`,
        type: "fade",
        duration: 0.5,
        startTime: currentClip.startTime - 0.25,
        endTime: currentClip.startTime + 0.25,
      })
      addedTransitions++
    }
  }

  return { addedTransitions }
}

function applyBasicColorCorrection(clip: any): any {
  // Добавляем базовые эффекты цветокоррекции
  if (!clip.effects) {
    clip.effects = []
  }

  // Проверяем, нет ли уже цветокоррекции
  const hasColorCorrection = clip.effects.some(
    (effect: any) => effect.type === "color-correction" || effect.type === "color-balance",
  )

  if (!hasColorCorrection) {
    clip.effects.push({
      id: `color_correction_${clip.id}_${Date.now()}`,
      type: "color-correction",
      parameters: {
        brightness: 0,
        contrast: 0.1,
        saturation: 0.05,
        temperature: 0,
      },
      enabled: true,
    })
    return { applied: true }
  }

  return { applied: false }
}

function applyAudioNormalization(track: any): any {
  let normalizedClips = 0

  for (const clip of track.clips) {
    if (clip.mediaFile?.type === "audio") {
      // Добавляем нормализацию аудио
      if (!clip.effects) {
        clip.effects = []
      }

      const hasNormalization = clip.effects.some(
        (effect: any) => effect.type === "audio-normalize" || effect.type === "volume",
      )

      if (!hasNormalization) {
        clip.effects.push({
          id: `audio_normalize_${clip.id}_${Date.now()}`,
          type: "audio-normalize",
          parameters: {
            targetLevel: -23, // LUFS стандарт
            limitPeak: -3,
          },
          enabled: true,
        })
        normalizedClips++
      }
    }
  }

  return { normalizedClips }
}

function applyBasicStabilization(clip: any): any {
  // Добавляем базовую стабилизацию
  if (!clip.effects) {
    clip.effects = []
  }

  const hasStabilization = clip.effects.some(
    (effect: any) => effect.type === "stabilization" || effect.type === "image-stabilizer",
  )

  if (!hasStabilization) {
    clip.effects.push({
      id: `stabilization_${clip.id}_${Date.now()}`,
      type: "stabilization",
      parameters: {
        strength: 0.5,
        smoothing: 0.3,
        cropMode: "auto",
      },
      enabled: true,
    })
    return { applied: true }
  }

  return { applied: false }
}

function getProcessedElementsCount(allTracks: any[], targetElements: string): number {
  switch (targetElements) {
    case "all":
      return allTracks.reduce((sum, track) => sum + (track.clips?.length || 0), 0)
    case "selected":
      return allTracks
        .filter((track) => track.selected === true)
        .reduce((sum, track) => sum + (track.clips?.length || 0), 0)
    case "section":
      return allTracks
        .filter((track) => track.sectionId !== undefined)
        .reduce((sum, track) => sum + (track.clips?.length || 0), 0)
    case "track":
      return allTracks.reduce((sum, track) => sum + (track.clips?.length || 0), 0)
    default:
      return 0
  }
}

function generateEnhancementRecommendations(appliedEnhancements: string[], _project: any, allTracks: any[]): string[] {
  const recommendations: string[] = []

  // Рекомендации на основе примененных улучшений
  if (appliedEnhancements.includes("transitions")) {
    recommendations.push("Переходы добавлены - просмотрите результат и настройте длительность при необходимости")
  }

  if (appliedEnhancements.includes("color-correction")) {
    recommendations.push("Цветокоррекция применена - проверьте настройки для каждого клипа")
  }

  if (appliedEnhancements.includes("audio-balance")) {
    recommendations.push("Аудио нормализация применена - проверьте уровни громкости")
  }

  if (appliedEnhancements.includes("stabilization")) {
    recommendations.push("Стабилизация применена - проверьте кадрирование видео")
  }

  // Общие рекомендации
  const videoTracks = allTracks.filter((track) => track.type === "video")
  const audioTracks = allTracks.filter((track) => track.type === "audio")

  if (videoTracks.length > 0 && audioTracks.length === 0) {
    recommendations.push("Рассмотрите добавление аудио треков для полноценного проекта")
  }

  if (appliedEnhancements.length > 0) {
    recommendations.push("Сохраните проект после применения улучшений")
  }

  return recommendations
}
