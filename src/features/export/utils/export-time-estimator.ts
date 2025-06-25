/**
 * Утилита для оценки времени экспорта видео
 */

import { ExportSettings } from "../types/export-types"

export interface TimeEstimate {
  estimatedSeconds: number
  confidence: "low" | "medium" | "high"
  factors: string[]
}

export interface ProjectMetrics {
  durationSeconds: number
  clipCount: number
  effectsCount: number
  transitionsCount: number
  resolutionMultiplier: number
  hasComplexEffects: boolean
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ExportTimeEstimator {
  // Базовые коэффициенты времени (секунда экспорта на секунду видео)
  private static readonly BASE_RATIOS = {
    h264_fast: 0.3,
    h264_medium: 0.8,
    h264_slow: 1.5,
    h265_fast: 0.5,
    h265_medium: 1.2,
    h265_slow: 2.0,
    prores: 0.4,
    webm: 1.0,
  }

  // Коэффициенты сложности
  private static readonly COMPLEXITY_MULTIPLIERS = {
    clip: 0.02, // Каждый клип добавляет 2% времени
    effect: 0.1, // Каждый эффект добавляет 10% времени
    transition: 0.05, // Каждый переход добавляет 5% времени
    complexEffect: 0.3, // Сложные эффекты (цветокоррекция, стабилизация)
  }

  // Коэффициенты разрешения (относительно 1080p)
  private static readonly RESOLUTION_MULTIPLIERS = {
    "720": 0.6,
    "1080": 1.0,
    "1440": 1.8,
    "2160": 3.5, // 4K
  }

  static estimateExportTime(settings: ExportSettings, projectMetrics: ProjectMetrics): TimeEstimate {
    const factors: string[] = []
    let confidence: "low" | "medium" | "high" = "medium"

    // Определяем базовую скорость кодирования
    const codecKey = ExportTimeEstimator.getCodecKey(settings.format, settings.quality)
    const baseRatio = ExportTimeEstimator.BASE_RATIOS[codecKey] || 1.0
    factors.push(`Codec: ${codecKey} (${baseRatio}x)`)

    // Учитываем разрешение
    const resolution = settings.resolution || "1080"
    const resolutionMultiplier =
      ExportTimeEstimator.RESOLUTION_MULTIPLIERS[resolution as keyof typeof this.RESOLUTION_MULTIPLIERS] || 1.0
    factors.push(`Resolution: ${resolution}p (${resolutionMultiplier}x)`)

    // Учитываем сложность проекта
    let complexityMultiplier = 1.0

    // Клипы
    const clipMultiplier = 1 + projectMetrics.clipCount * ExportTimeEstimator.COMPLEXITY_MULTIPLIERS.clip
    complexityMultiplier *= clipMultiplier
    factors.push(`Clips: ${projectMetrics.clipCount} (+${Math.round((clipMultiplier - 1) * 100)}%)`)

    // Эффекты
    if (projectMetrics.effectsCount > 0) {
      const effectMultiplier = 1 + projectMetrics.effectsCount * ExportTimeEstimator.COMPLEXITY_MULTIPLIERS.effect
      complexityMultiplier *= effectMultiplier
      factors.push(`Effects: ${projectMetrics.effectsCount} (+${Math.round((effectMultiplier - 1) * 100)}%)`)
    }

    // Переходы
    if (projectMetrics.transitionsCount > 0) {
      const transitionMultiplier =
        1 + projectMetrics.transitionsCount * ExportTimeEstimator.COMPLEXITY_MULTIPLIERS.transition
      complexityMultiplier *= transitionMultiplier
      factors.push(
        `Transitions: ${projectMetrics.transitionsCount} (+${Math.round((transitionMultiplier - 1) * 100)}%)`,
      )
    }

    // Сложные эффекты
    if (projectMetrics.hasComplexEffects) {
      const complexEffectMultiplier = 1 + ExportTimeEstimator.COMPLEXITY_MULTIPLIERS.complexEffect
      complexityMultiplier *= complexEffectMultiplier
      factors.push(`Complex effects (+${Math.round(ExportTimeEstimator.COMPLEXITY_MULTIPLIERS.complexEffect * 100)}%)`)
      confidence = "low" // Сложные эффекты труднее предсказать
    }

    // Итоговый расчет
    const totalMultiplier = baseRatio * resolutionMultiplier * complexityMultiplier
    const estimatedSeconds = Math.round(projectMetrics.durationSeconds * totalMultiplier)

    // Корректировка доверия к оценке
    if (projectMetrics.clipCount < 5 && projectMetrics.effectsCount < 3) {
      confidence = "high"
    } else if (projectMetrics.effectsCount > 10 || projectMetrics.hasComplexEffects) {
      confidence = "low"
    }

    return {
      estimatedSeconds,
      confidence,
      factors,
    }
  }

  private static getCodecKey(format: string, quality: string): keyof typeof ExportTimeEstimator.BASE_RATIOS {
    const formatLower = format.toLowerCase()
    const qualityLower = quality.toLowerCase()

    if (formatLower.includes("prores")) {
      return "prores"
    }

    if (formatLower.includes("webm")) {
      return "webm"
    }

    if (formatLower.includes("h265") || formatLower.includes("hevc")) {
      if (qualityLower.includes("draft") || qualityLower === "fast") {
        return "h265_fast"
      }
      if (qualityLower.includes("best") || qualityLower === "slow") {
        return "h265_slow"
      }
      return "h265_medium"
    }

    // Default to H.264
    if (qualityLower.includes("draft") || qualityLower === "fast") {
      return "h264_fast"
    }
    if (qualityLower.includes("best") || qualityLower === "slow") {
      return "h264_slow"
    }
    return "h264_medium"
  }

  /**
   * Форматирует время в читаемый вид
   */
  static formatEstimatedTime(seconds: number): string {
    if (seconds < 60) {
      return `~${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes < 60) {
      return remainingSeconds > 0 ? `~${minutes}m ${remainingSeconds}s` : `~${minutes}m`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes > 0) {
      return `~${hours}h ${remainingMinutes}m`
    }

    return `~${hours}h`
  }

  /**
   * Получает иконку доверия к оценке
   */
  static getConfidenceIcon(confidence: "low" | "medium" | "high"): string {
    switch (confidence) {
      case "high":
        return "✓"
      case "medium":
        return "~"
      case "low":
        return "?"
      default:
        return "~"
    }
  }

  /**
   * Получает описание доверия к оценке
   */
  static getConfidenceDescription(confidence: "low" | "medium" | "high"): string {
    switch (confidence) {
      case "high":
        return "High confidence - simple project"
      case "medium":
        return "Medium confidence - typical project"
      case "low":
        return "Low confidence - complex effects may vary"
      default:
        return "Unknown confidence"
    }
  }
}
