/**
 * Умный оптимизатор настроек экспорта
 * Автоматически подбирает оптимальные параметры на основе характеристик проекта
 */

import { ExportSettings } from "../types/export-types"

export interface ProjectAnalysis {
  // Характеристики проекта
  duration: number // секунды
  originalResolution: { width: number; height: number }
  fps: number
  clipCount: number
  hasAudio: boolean

  // Сложность контента
  hasMotion: boolean // Есть ли движение в кадре
  hasColorGrading: boolean // Есть ли цветокоррекция
  hasTextOverlays: boolean // Есть ли текстовые наложения
  effectsCount: number
  transitionsCount: number

  // Техническая информация
  estimatedFileSize?: number // в байтах
  targetPlatform?: "web" | "broadcast" | "archive" | "social"
}

export interface OptimizationResult {
  recommendedSettings: Partial<ExportSettings>
  reasons: string[]
  alternativeOptions?: Array<{
    name: string
    settings: Partial<ExportSettings>
    description: string
  }>
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SmartExportOptimizer {
  /**
   * Анализирует проект и возвращает оптимальные настройки экспорта
   */
  static optimizeSettings(analysis: ProjectAnalysis): OptimizationResult {
    const reasons: string[] = []
    const settings: Partial<ExportSettings> = {}

    // Определяем целевое разрешение
    const targetResolution = SmartExportOptimizer.determineOptimalResolution(analysis, reasons)
    settings.resolution = targetResolution

    // Определяем формат и кодек
    const { format, codec } = SmartExportOptimizer.determineOptimalFormat(analysis, reasons)
    settings.format = format
    if (codec) {
      settings.codec = codec
    }

    // Определяем качество
    const quality = SmartExportOptimizer.determineOptimalQuality(analysis, reasons)
    settings.quality = quality

    // Определяем FPS
    const fps = SmartExportOptimizer.determineOptimalFPS(analysis, reasons)
    settings.fps = fps

    // Определяем битрейт
    const bitrate = SmartExportOptimizer.calculateOptimalBitrate(analysis, targetResolution, quality, reasons)
    if (bitrate) {
      settings.bitrate = bitrate
    }

    // Определяем использование GPU
    const useGPU = SmartExportOptimizer.shouldUseGPU(analysis, reasons)
    settings.useGPU = useGPU

    // Альтернативные варианты
    const alternativeOptions = SmartExportOptimizer.generateAlternatives(analysis, settings)

    return {
      recommendedSettings: settings,
      reasons,
      alternativeOptions,
    }
  }

  private static determineOptimalResolution(analysis: ProjectAnalysis, reasons: string[]): string {
    const { width, height } = analysis.originalResolution
    const aspectRatio = width / height

    // Для социальных сетей
    if (analysis.targetPlatform === "social") {
      if (aspectRatio < 1) {
        reasons.push("Vertical video detected - optimizing for mobile social platforms")
        return "1080" // 1080x1920 для TikTok/Instagram Stories
      }
      reasons.push("Horizontal video - optimizing for YouTube/Facebook")
      return "1080" // 1920x1080 для большинства соцсетей
    }

    // Для архива - сохраняем оригинальное качество
    if (analysis.targetPlatform === "archive") {
      if (height >= 2160) {
        reasons.push("4K source detected - maintaining highest quality for archive")
        return "2160"
      }
      if (height >= 1440) {
        reasons.push("QHD source detected - maintaining high quality for archive")
        return "1440"
      }
    }

    // Автоматический выбор на основе длительности и сложности
    if (analysis.duration > 3600) {
      // Больше часа
      reasons.push("Long video detected - reducing resolution for manageable file size")
      return height >= 1440 ? "1080" : "720"
    }

    if (analysis.effectsCount > 10 || analysis.hasColorGrading) {
      reasons.push("Complex project detected - balancing quality and render time")
      return height >= 2160 ? "1440" : "1080"
    }

    // По умолчанию сохраняем близкое к оригиналу
    if (height >= 2160) return "2160"
    if (height >= 1440) return "1440"
    if (height >= 1080) return "1080"
    return "720"
  }

  private static determineOptimalFormat(
    analysis: ProjectAnalysis,
    reasons: string[],
  ): { format: string; codec?: string } {
    // Для веб-платформ
    if (analysis.targetPlatform === "web" || analysis.targetPlatform === "social") {
      reasons.push("Web/social platform - using H.264 for maximum compatibility")
      return { format: "mp4", codec: "h264" }
    }

    // Для архива с высоким качеством
    if (analysis.targetPlatform === "archive") {
      if (analysis.duration < 600) {
        // Короткие видео
        reasons.push("Short archive video - using ProRes for maximum quality")
        return { format: "mov", codec: "prores" }
      }
      reasons.push("Long archive video - using H.265 for efficient compression")
      return { format: "mp4", codec: "h265" }
    }

    // Для broadcast
    if (analysis.targetPlatform === "broadcast") {
      reasons.push("Broadcast target - using ProRes for professional workflow")
      return { format: "mov", codec: "prores" }
    }

    // По умолчанию H.264 MP4
    reasons.push("Universal format - H.264 MP4 for broad compatibility")
    return { format: "mp4", codec: "h264" }
  }

  private static determineOptimalQuality(analysis: ProjectAnalysis, reasons: string[]): string {
    // Для архива всегда максимальное качество
    if (analysis.targetPlatform === "archive") {
      reasons.push("Archive target - using highest quality settings")
      return "best"
    }

    // Для социальных сетей оптимизируем размер
    if (analysis.targetPlatform === "social") {
      reasons.push("Social platform - balancing quality and upload speed")
      return "good"
    }

    // На основе сложности проекта
    if (analysis.hasColorGrading || analysis.effectsCount > 5) {
      reasons.push("Complex effects detected - using higher quality to preserve details")
      return "best"
    }

    if (analysis.duration > 1800) {
      // Больше 30 минут
      reasons.push("Long video - optimizing for file size")
      return "good"
    }

    return "best"
  }

  private static determineOptimalFPS(analysis: ProjectAnalysis, reasons: string[]): string {
    // Для социальных сетей
    if (analysis.targetPlatform === "social") {
      if (analysis.fps <= 30) {
        reasons.push("Social platform - using 30fps for optimal compatibility")
        return "30"
      }
      reasons.push("High FPS source - reducing to 60fps for social platforms")
      return "60"
    }

    // Сохраняем оригинальный FPS если возможно
    if (analysis.fps === 24 || analysis.fps === 25) {
      reasons.push("Cinema/broadcast FPS detected - maintaining original frame rate")
      return analysis.fps.toString()
    }

    if (analysis.fps === 30) {
      reasons.push("Standard FPS - maintaining 30fps")
      return "30"
    }

    if (analysis.fps >= 60) {
      // Для экшн-контента сохраняем высокий FPS
      if (analysis.hasMotion) {
        reasons.push("High motion content - maintaining 60fps for smooth playback")
        return "60"
      }
      reasons.push("High FPS source without significant motion - reducing to 30fps")
      return "30"
    }

    return "30"
  }

  private static calculateOptimalBitrate(
    analysis: ProjectAnalysis,
    resolution: string,
    quality: string,
    reasons: string[],
  ): number | undefined {
    // Базовые битрейты для разных разрешений (в kbps)
    const baseBitrates = {
      "720": { draft: 2000, good: 5000, best: 8000 },
      "1080": { draft: 4000, good: 8000, best: 15000 },
      "1440": { draft: 8000, good: 16000, best: 25000 },
      "2160": { draft: 15000, good: 35000, best: 60000 },
    }

    const resolutionBitrates = baseBitrates[resolution as keyof typeof baseBitrates]
    if (!resolutionBitrates) return undefined

    let bitrate = resolutionBitrates[quality as keyof typeof resolutionBitrates]

    // Корректировка на основе контента
    if (analysis.hasMotion) {
      bitrate = Math.round(bitrate * 1.2)
      reasons.push("High motion detected - increasing bitrate by 20%")
    }

    if (analysis.hasColorGrading) {
      bitrate = Math.round(bitrate * 1.1)
      reasons.push("Color grading detected - increasing bitrate by 10%")
    }

    if (analysis.targetPlatform === "social") {
      bitrate = Math.round(bitrate * 0.8)
      reasons.push("Social platform - reducing bitrate for faster uploads")
    }

    return bitrate
  }

  private static shouldUseGPU(analysis: ProjectAnalysis, reasons: string[]): boolean {
    // GPU ускорение для больших проектов
    if (analysis.duration > 600 || analysis.clipCount > 20) {
      reasons.push("Large project - enabling GPU acceleration for faster encoding")
      return true
    }

    // GPU для высоких разрешений
    if (analysis.originalResolution.height >= 1440) {
      reasons.push("High resolution - enabling GPU acceleration")
      return true
    }

    // По умолчанию отключено для совместимости
    reasons.push("Standard project - CPU encoding for maximum compatibility")
    return false
  }

  private static generateAlternatives(
    _analysis: ProjectAnalysis,
    recommendedSettings: Partial<ExportSettings>,
  ): Array<{ name: string; settings: Partial<ExportSettings>; description: string }> {
    const alternatives = []

    // Быстрый вариант
    alternatives.push({
      name: "Fast Draft",
      settings: {
        ...recommendedSettings,
        quality: "draft",
        resolution: "720",
        useGPU: true,
      },
      description: "Lower quality for quick preview or draft sharing",
    })

    // Максимальное качество
    if (recommendedSettings.quality !== "best") {
      alternatives.push({
        name: "Maximum Quality",
        settings: {
          ...recommendedSettings,
          quality: "best",
          format: "mov",
          codec: "prores",
          useGPU: false,
        },
        description: "Highest quality for archival or professional use",
      })
    }

    // Компактный вариант
    alternatives.push({
      name: "Compact Size",
      settings: {
        ...recommendedSettings,
        codec: "h265",
        quality: "good",
        bitrate: recommendedSettings.bitrate ? Math.round(recommendedSettings.bitrate * 0.6) : undefined,
      },
      description: "Smaller file size with H.265 compression",
    })

    return alternatives
  }
}
