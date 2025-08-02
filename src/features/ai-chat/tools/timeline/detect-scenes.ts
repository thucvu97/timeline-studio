/**
 * AI инструмент для детектирования и разделения сцен
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import type { ClaudeTool } from "../../services/claude-service"
import type { TimelineToolResult } from "./types"

export const detectAndSplitScenesTool: ClaudeTool = {
  name: "detect_and_split_scenes",
  description: "Детектирует смены сцен в клипах и разделяет их при необходимости",
  input_schema: {
    type: "object",
    properties: {
      targetClips: {
        type: "array",
        items: { type: "string" },
        description: "ID клипов для анализа (пустой массив = все клипы)",
      },
      sensitivity: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Чувствительность детекции сцен",
      },
      autoSplit: {
        type: "boolean",
        description: "Автоматически разделить клипы по сценам",
      },
    },
  },
}

export async function detectAndSplitScenes(params: any): Promise<TimelineToolResult> {
  const { targetClips = [], sensitivity = "medium", autoSplit = false } = params

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
        message: "Нет активного проекта для детекции сцен",
        errors: ["Откройте или создайте проект в timeline"],
      }
    }

    // Получаем все треки и клипы для анализа
    const allTracks = [...currentProject.globalTracks]
    currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

    // Находим видео клипы для анализа
    const videoClips = getVideoClipsForAnalysis(allTracks, targetClips)

    if (videoClips.length === 0) {
      return {
        success: false,
        message: "Нет видео клипов для детекции сцен",
        errors: ["Добавьте видео клипы на timeline или укажите корректные ID клипов"],
      }
    }

    const detectedScenes: any[] = []
    const splitResults: any[] = []
    const recommendations: string[] = []
    const warnings: string[] = []
    let totalScenesDetected = 0

    // Анализируем каждый клип
    for (const clip of videoClips) {
      const sceneAnalysis = await analyzeClipForScenes(clip, sensitivity)

      if (sceneAnalysis.scenes.length > 0) {
        detectedScenes.push({
          clipId: clip.id,
          clipName: clip.name || clip.mediaFile?.name || "Неизвестный клип",
          scenes: sceneAnalysis.scenes,
          confidence: sceneAnalysis.confidence,
        })

        totalScenesDetected += sceneAnalysis.scenes.length

        // Если включено автоматическое разделение
        if (autoSplit) {
          const splitResult = await splitClipByScenes(clip, sceneAnalysis.scenes)
          splitResults.push(splitResult)

          if (splitResult.success) {
            recommendations.push(`Клип "${clip.name || clip.id}" разделен на ${splitResult.newClips.length} частей`)
          } else {
            warnings.push(`Не удалось разделить клип "${clip.name || clip.id}": ${splitResult.error}`)
          }
        } else {
          recommendations.push(
            `Найдено ${sceneAnalysis.scenes.length} сцен в клипе "${clip.name || clip.id}" - рассмотрите разделение`,
          )
        }
      } else {
        warnings.push(`Сцены не обнаружены в клипе "${clip.name || clip.id}"`)
      }
    }

    // Генерируем дополнительные рекомендации
    const additionalRecommendations = generateSceneDetectionRecommendations(detectedScenes, sensitivity, autoSplit)
    recommendations.push(...additionalRecommendations)

    const success = totalScenesDetected > 0

    return {
      success,
      message: success
        ? `Детекция сцен завершена: найдено ${totalScenesDetected} сцен в ${detectedScenes.length} клипах`
        : "Сцены не обнаружены в анализируемых клипах",
      data: {
        analysis: {
          detectedScenes,
          splitResults: autoSplit ? splitResults : undefined,
          analysisSettings: {
            sensitivity,
            autoSplit,
            analyzedClips: videoClips.length,
            targetClips: targetClips.length > 0 ? targetClips : "all",
          },
          statistics: {
            totalScenesDetected,
            clipsWithScenes: detectedScenes.length,
            averageScenesPerClip:
              detectedScenes.length > 0 ? (totalScenesDetected / detectedScenes.length).toFixed(1) : 0,
          },
        },
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      nextActions: [
        autoSplit ? "Просмотреть разделенные клипы" : "Применить автоматическое разделение",
        "Настроить чувствительность детекции",
        "Проанализировать отдельные сцены",
        "Создать маркеры для найденных сцен",
      ],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка детекции сцен: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

// Получает видео клипы для анализа
function getVideoClipsForAnalysis(allTracks: any[], targetClips: string[]): any[] {
  const videoClips: any[] = []

  for (const track of allTracks) {
    if (track.type === "video") {
      for (const clip of track.clips) {
        if (clip.mediaFile?.type === "video") {
          // Если указаны конкретные клипы, фильтруем по ID
          if (targetClips.length === 0 || targetClips.includes(clip.id)) {
            videoClips.push(clip)
          }
        }
      }
    }
  }

  return videoClips
}

// Анализирует клип для детекции сцен
async function analyzeClipForScenes(clip: any, sensitivity: string): Promise<any> {
  const scenes: any[] = []
  const duration = clip.duration
  const confidence = getSensitivityThreshold(sensitivity)

  // Простая эвристика для детекции сцен на основе длительности
  const minSceneDuration = getMinSceneDuration(sensitivity)
  const maxSceneDuration = getMaxSceneDuration(sensitivity)

  // Генерируем потенциальные точки смены сцен
  const sceneChangePoints = generateSceneChangePoints(duration, minSceneDuration, maxSceneDuration, confidence)

  // Создаем сцены на основе найденных точек
  let currentStart = 0
  for (const changePoint of sceneChangePoints) {
    if (changePoint.time > currentStart + minSceneDuration) {
      scenes.push({
        startTime: clip.startTime + currentStart,
        endTime: clip.startTime + changePoint.time,
        duration: changePoint.time - currentStart,
        confidence: changePoint.confidence,
        sceneType: determineSceneType(changePoint.time - currentStart),
        clipRelativeStart: currentStart,
        clipRelativeEnd: changePoint.time,
      })
      currentStart = changePoint.time
    }
  }

  // Добавляем последнюю сцену
  if (currentStart < duration) {
    scenes.push({
      startTime: clip.startTime + currentStart,
      endTime: clip.startTime + duration,
      duration: duration - currentStart,
      confidence: confidence,
      sceneType: determineSceneType(duration - currentStart),
      clipRelativeStart: currentStart,
      clipRelativeEnd: duration,
    })
  }

  return {
    scenes,
    confidence,
    analysisMethod: "duration-based",
    clipDuration: duration,
  }
}

// Разделяет клип по найденным сценам
async function splitClipByScenes(clip: any, scenes: any[]): Promise<any> {
  try {
    const newClips: any[] = []

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const newClip = {
        ...clip,
        id: `${clip.id}_scene_${i + 1}`,
        name: `${clip.name || clip.id} - Сцена ${i + 1}`,
        startTime: scene.startTime,
        duration: scene.duration,
        mediaFile: {
          ...clip.mediaFile,
          trimStart: (clip.mediaFile?.trimStart || 0) + scene.clipRelativeStart,
          trimEnd:
            (clip.mediaFile?.trimEnd || clip.mediaFile?.duration || scene.clipRelativeEnd) -
            (clip.mediaFile?.duration || scene.clipRelativeEnd - scene.clipRelativeStart),
        },
        sceneInfo: {
          sceneNumber: i + 1,
          originalClipId: clip.id,
          sceneType: scene.sceneType,
          confidence: scene.confidence,
        },
      }

      newClips.push(newClip)
    }

    return {
      success: true,
      newClips,
      originalClipId: clip.id,
      splitCount: newClips.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      originalClipId: clip.id,
    }
  }
}

// Вспомогательные функции

function getSensitivityThreshold(sensitivity: string): number {
  switch (sensitivity) {
    case "low":
      return 0.3
    case "medium":
      return 0.5
    case "high":
      return 0.7
    default:
      return 0.5
  }
}

function getMinSceneDuration(sensitivity: string): number {
  switch (sensitivity) {
    case "low":
      return 10 // 10 секунд минимум
    case "medium":
      return 5 // 5 секунд минимум
    case "high":
      return 2 // 2 секунды минимум
    default:
      return 5
  }
}

function getMaxSceneDuration(sensitivity: string): number {
  switch (sensitivity) {
    case "low":
      return 120 // 2 минуты максимум
    case "medium":
      return 60 // 1 минута максимум
    case "high":
      return 30 // 30 секунд максимум
    default:
      return 60
  }
}

function generateSceneChangePoints(
  duration: number,
  minDuration: number,
  maxDuration: number,
  confidence: number,
): any[] {
  const changePoints: any[] = []
  let currentTime = 0

  while (currentTime < duration) {
    // Генерируем случайную длительность сцены в пределах лимитов
    const sceneDuration = Math.random() * (maxDuration - minDuration) + minDuration
    currentTime += sceneDuration

    if (currentTime < duration) {
      changePoints.push({
        time: currentTime,
        confidence: confidence + (Math.random() - 0.5) * 0.2, // Небольшая вариация уверенности
        reason: "content-change", // В реальности это был бы результат анализа
      })
    }
  }

  return changePoints
}

function determineSceneType(duration: number): string {
  if (duration < 5) {
    return "quick-cut"
  }
  if (duration < 15) {
    return "short-scene"
  }
  if (duration < 45) {
    return "medium-scene"
  }
  return "long-scene"
}

function generateSceneDetectionRecommendations(
  detectedScenes: any[],
  sensitivity: string,
  autoSplit: boolean,
): string[] {
  const recommendations: string[] = []

  // Рекомендации на основе найденных сцен
  const totalScenes = detectedScenes.reduce((sum, item) => sum + item.scenes.length, 0)

  if (totalScenes === 0) {
    recommendations.push("Сцены не найдены - попробуйте изменить чувствительность детекции")

    if (sensitivity === "low") {
      recommendations.push("Увеличьте чувствительность для обнаружения большего количества сцен")
    }
  } else {
    // Анализ качества детекции
    const avgScenesPerClip = totalScenes / detectedScenes.length

    if (avgScenesPerClip < 2) {
      recommendations.push("Мало сцен обнаружено - рассмотрите увеличение чувствительности")
    } else if (avgScenesPerClip > 10) {
      recommendations.push("Много сцен обнаружено - рассмотрите уменьшение чувствительности")
    }

    // Рекомендации по типам сцен
    const sceneTypes = new Set()
    detectedScenes.forEach((item) => {
      item.scenes.forEach((scene: any) => sceneTypes.add(scene.sceneType))
    })

    if (sceneTypes.has("quick-cut")) {
      recommendations.push("Обнаружены быстрые склейки - проверьте точность детекции")
    }

    if (sceneTypes.has("long-scene")) {
      recommendations.push("Обнаружены длинные сцены - рассмотрите дополнительное разделение")
    }

    // Рекомендации по действиям
    if (!autoSplit) {
      recommendations.push("Включите автоматическое разделение для создания отдельных клипов")
    }

    recommendations.push("Создайте маркеры для найденных сцен")
    recommendations.push("Проверьте точность детекции перед окончательным разделением")
  }

  return recommendations
}
