/**
 * AI инструмент для анализа нарратива и истории в Timeline
 */

import type { TimelineToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"

export const analyzeContentForStoryTool: ClaudeTool = {
  name: "analyze_content_for_story",
  description: "Анализирует контент на таймлайне для выявления нарративной структуры",
  input_schema: {
    type: "object",
    properties: {
      analysisScope: {
        type: "string",
        enum: ["full-timeline", "selected-section", "time-range"],
        description: "Область анализа",
      },
      storyElements: {
        type: "array",
        items: {
          type: "string",
          enum: ["narrative-arc", "pacing", "emotional-flow", "visual-continuity", "audio-consistency"],
        },
        description: "Элементы истории для анализа",
      },
    },
  },
}

export async function analyzeContentForStory(params: any): Promise<TimelineToolResult> {
  const { analysisScope = "full-timeline", storyElements = ["narrative-arc", "pacing", "emotional-flow"] } = params

  try {
    const { getTimelineStateAccess } = await import("./types")
    const { analyzeNarrativeStructure, analyzePacing, analyzeEmotionalFlow } = await import("./utils/analyzers")

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
        message: "Нет активного проекта для анализа",
        errors: ["Откройте или создайте проект в timeline"],
      }
    }

    const analysis: any = {
      scope: analysisScope,
      analyzedElements: storyElements,
      timestamp: new Date().toISOString(),
    }

    const suggestions: string[] = []
    const warnings: string[] = []

    // Анализируем выбранные элементы истории
    for (const element of storyElements) {
      switch (element) {
        case "narrative-arc":
          const narrativeAnalysis = analyzeNarrativeStructure(currentProject)
          analysis.narrativeStructure = narrativeAnalysis

          if (!narrativeAnalysis.hasNarrative) {
            warnings.push("Нарративная структура не обнаружена")
            suggestions.push("Добавьте больше контента для создания полноценной истории")
          } else {
            suggestions.push(...narrativeAnalysis.suggestions)
          }
          break

        case "pacing":
          const pacingAnalysis = analyzePacing(currentProject)
          analysis.pacing = pacingAnalysis

          if (pacingAnalysis.rhythm === "none") {
            warnings.push("Невозможно определить ритм - недостаточно клипов")
          } else {
            suggestions.push(
              `Текущий ритм: ${pacingAnalysis.rhythm} (средняя длительность кадра: ${pacingAnalysis.averageShotLength.toFixed(1)}с)`,
            )

            if (pacingAnalysis.rhythm === "fast" && pacingAnalysis.tempo === "very-fast") {
              suggestions.push("Слишком быстрый ритм может утомлять зрителей - рассмотрите добавление пауз")
            } else if (pacingAnalysis.rhythm === "slow" && pacingAnalysis.tempo === "very-slow") {
              suggestions.push("Медленный ритм может быть скучным - добавьте динамики")
            }
          }
          break

        case "emotional-flow":
          const emotionalAnalysis = analyzeEmotionalFlow(currentProject)
          analysis.emotionalFlow = emotionalAnalysis

          if (!emotionalAnalysis.hasEmotionalArc) {
            warnings.push("Эмоциональная дуга не обнаружена")
            suggestions.push("Создайте секции для структурирования эмоционального потока")
          } else {
            suggestions.push(`Эмоциональная дуга: ${emotionalAnalysis.overallArc}`)

            if (emotionalAnalysis.overallArc === "flat") {
              suggestions.push("Добавьте эмоционального контраста между секциями")
            }
          }
          break

        case "visual-continuity":
          // Анализ визуальной непрерывности
          const visualAnalysis = analyzeVisualContinuity(currentProject)
          analysis.visualContinuity = visualAnalysis
          suggestions.push(...visualAnalysis.suggestions)
          break

        case "audio-consistency":
          // Анализ аудио согласованности
          const audioAnalysis = analyzeAudioConsistency(currentProject)
          analysis.audioConsistency = audioAnalysis
          suggestions.push(...audioAnalysis.suggestions)
          break

        default:
          // Неизвестный элемент истории - пропускаем
          break
      }
    }

    // Общие рекомендации по улучшению истории
    const overallSuggestions = generateOverallStoryRecommendations(analysis, currentProject)
    suggestions.push(...overallSuggestions)

    return {
      success: true,
      message: `Анализ нарратива завершен для области: ${analysisScope}`,
      data: {
        analysis,
        suggestions: [...new Set(suggestions)], // Убираем дубликаты
        projectStats: timelineAccess.getProjectStats(),
      } as any,
      warnings: warnings.length > 0 ? warnings : undefined,
      nextActions: [
        "Применить рекомендации по улучшению истории",
        "Создать секции для лучшей структуры",
        "Настроить ритм монтажа",
        "Проанализировать эмоциональный поток",
      ],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа истории: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

// Вспомогательные функции для дополнительного анализа

function analyzeVisualContinuity(project: any): any {
  const allTracks = [...project.globalTracks]
  project.sections.forEach((section: any) => allTracks.push(...section.tracks))

  const videoTracks = allTracks.filter((track) => track.type === "video")
  const suggestions: string[] = []

  if (videoTracks.length === 0) {
    suggestions.push("Добавьте видео треки для визуального контента")
    return { hasVisualContent: false, suggestions }
  }

  // Анализируем переходы между клипами
  let abruptTransitions = 0
  videoTracks.forEach((track) => {
    for (let i = 1; i < track.clips.length; i++) {
      const prevClip = track.clips[i - 1]
      const currentClip = track.clips[i]
      const gap = currentClip.startTime - (prevClip.startTime + prevClip.duration)

      if (gap === 0) {
        // Прямой срез без перехода
        abruptTransitions++
      }
    }
  })

  if (abruptTransitions > videoTracks.reduce((sum, track) => sum + track.clips.length, 0) * 0.5) {
    suggestions.push("Рассмотрите добавление переходов между клипами для плавности")
  }

  return {
    hasVisualContent: true,
    abruptTransitions,
    continuityScore: Math.max(0, 1 - abruptTransitions * 0.1),
    suggestions,
  }
}

function analyzeAudioConsistency(project: any): any {
  const allTracks = [...project.globalTracks]
  project.sections.forEach((section: any) => allTracks.push(...section.tracks))

  const audioTracks = allTracks.filter((track) => track.type === "audio")
  const suggestions: string[] = []

  if (audioTracks.length === 0) {
    suggestions.push("Добавьте аудио треки для звукового сопровождения")
    return { hasAudioContent: false, suggestions }
  }

  // Анализируем уровни громкости (примерный)
  const allAudioClips: any[] = []
  audioTracks.forEach((track) => allAudioClips.push(...track.clips))

  if (allAudioClips.length === 0) {
    suggestions.push("Добавьте аудио клипы на аудио треки")
    return { hasAudioContent: false, suggestions }
  }

  // Проверяем покрытие аудио
  const totalProjectDuration = Math.max(...allAudioClips.map((clip) => clip.startTime + clip.duration))
  const audioCoverage = allAudioClips.reduce((sum, clip) => sum + clip.duration, 0) / totalProjectDuration

  if (audioCoverage < 0.8) {
    suggestions.push("Увеличьте аудио покрытие проекта для лучшего восприятия")
  }

  // Ищем тишину
  const audioGaps = findAudioGaps(allAudioClips, totalProjectDuration)
  if (audioGaps.length > 0) {
    suggestions.push(`Обнаружено ${audioGaps.length} пробелов в аудио - добавьте фоновую музыку или звуки`)
  }

  return {
    hasAudioContent: true,
    audioCoverage,
    audioGaps: audioGaps.length,
    consistencyScore: Math.min(1, audioCoverage + (audioGaps.length === 0 ? 0.2 : 0)),
    suggestions,
  }
}

function generateOverallStoryRecommendations(analysis: any, project: any): string[] {
  const suggestions: string[] = []

  // Анализируем общую структуру проекта
  const sectionsCount = project.sections.length
  const allTracks = [...project.globalTracks]
  project.sections.forEach((section: any) => allTracks.push(...section.tracks))
  const totalClips = allTracks.reduce((sum: number, track: any) => sum + track.clips.length, 0)

  if (sectionsCount === 0) {
    suggestions.push("Создайте секции для структурирования истории (введение, развитие, кульминация, развязка)")
  } else if (sectionsCount < 3) {
    suggestions.push("Добавьте больше секций для создания классической трехактной структуры")
  }

  if (totalClips < 10) {
    suggestions.push("Добавьте больше клипов для создания полноценного повествования")
  }

  // Проверяем баланс между анализированными элементами
  const hasNarrative = analysis.narrativeStructure?.hasNarrative
  const hasPacing = analysis.pacing?.rhythm !== "none"
  const hasEmotionalFlow = analysis.emotionalFlow?.hasEmotionalArc

  if (!hasNarrative && !hasPacing && !hasEmotionalFlow) {
    suggestions.push("История нуждается в базовой структуре - начните с создания секций и добавления контента")
  }

  return suggestions
}

function findAudioGaps(audioClips: any[], totalDuration: number): Array<{ start: number; end: number }> {
  if (audioClips.length === 0) return [{ start: 0, end: totalDuration }]

  const sortedClips = [...audioClips].sort((a, b) => a.startTime - b.startTime)
  const gaps: Array<{ start: number; end: number }> = []

  // Проверяем начало
  if (sortedClips[0].startTime > 1) {
    gaps.push({ start: 0, end: sortedClips[0].startTime })
  }

  // Проверяем промежутки
  for (let i = 1; i < sortedClips.length; i++) {
    const prevEnd = sortedClips[i - 1].startTime + sortedClips[i - 1].duration
    const currentStart = sortedClips[i].startTime

    if (currentStart - prevEnd > 1) {
      // Пробел больше 1 секунды
      gaps.push({ start: prevEnd, end: currentStart })
    }
  }

  // Проверяем конец
  const lastClip = sortedClips[sortedClips.length - 1]
  const lastEnd = lastClip.startTime + lastClip.duration
  if (totalDuration - lastEnd > 1) {
    gaps.push({ start: lastEnd, end: totalDuration })
  }

  return gaps
}
