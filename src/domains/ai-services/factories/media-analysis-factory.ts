/**
 * Media Analysis Factory
 * Фабрика для создания сервисов анализа медиа
 */

import { ContentAnalysisService } from "../services/content"
import type {
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaAnalysisFactory,
} from "../types/interfaces"

export class MediaAnalysisFactoryImpl implements MediaAnalysisFactory {
  private ffmpegService: IFFmpegAnalysisService | null = null
  private visionService: IVisionService | null = null
  private contentService: IContentAnalysisService | null = null

  createFFmpegService(): IFFmpegAnalysisService {
    if (!this.ffmpegService) {
      // Заглушка для FFmpeg сервиса
      this.ffmpegService = {
        analyzeVideo: async () => ({
          duration: 0,
          fps: 30,
          resolution: { width: 1920, height: 1080 },
          codec: "h264",
          bitrate: 5000000,
          scenes: [],
          quality: { overall: 80, sharpness: 0.8, noise: 0.2, compression: 0.7, motionIntensity: 0.5 },
        }),
        analyzeAudio: async () => ({
          duration: 0,
          channels: 2,
          sampleRate: 44100,
          bitrate: 128000,
          codec: "aac",
          volume: { average: 0.7, peak: 0.9, min: 0.1, max: 0.95 },
          silentSegments: [],
        }),
        extractFrames: async () => [],
        extractAudioSegment: async () => "",
        getVideoMetadata: async () => ({
          format: "mp4",
          duration: 0,
          width: 1920,
          height: 1080,
          fps: 30,
          bitrate: 5000000,
          hasAudio: true,
        }),
        detectScenes: async () => [],
        analyzeQuality: async () => ({ overall: 80 }),
        detectSilence: async () => ({ silentSegments: [], totalSilenceDuration: 0, speechRatio: 0.8 }),
        analyzeMotion: async () => ({ motionIntensity: 50, stabilityScore: 0.9 }),
        extractKeyframes: async () => [],
        convertToFormat: async () => true,
      } as IFFmpegAnalysisService
    }
    return this.ffmpegService
  }

  createVisionService(): IVisionService {
    if (!this.visionService) {
      // Заглушка для Vision сервиса
      this.visionService = {
        analyzeFrame: async () => ({
          objects: [],
          faces: [],
          text: [],
          scene: { type: "general", confidence: 0.8, attributes: [] },
          nsfw: { safe: 1, suggestive: 0, explicit: 0 },
        }),
        analyzeVideo: async () => [],
        detectFaces: async () => [],
        recognizeText: async () => "",
        analyzeFrames: async () => [],
        detectObjects: async () => [],
        extractText: async () => [],
        analyzeComposition: async () => ({
          ruleOfThirds: { score: 0.7, points: [] },
          leadingLines: { score: 0.6, lines: [] },
          balance: { score: 0.8, centerOfMass: { x: 0.5, y: 0.5 } },
          symmetry: { score: 0.7 },
        }),
        analyzeColors: async () => ({
          dominantColors: [],
          palette: [],
          temperature: "neutral",
          saturation: "medium",
          brightness: "medium",
        }),
      } as IVisionService
    }
    return this.visionService
  }

  createContentAnalysisService(): IContentAnalysisService {
    if (!this.contentService) {
      this.contentService = new ContentAnalysisService()
    }
    return this.contentService
  }

  async isFFmpegAvailable(): Promise<boolean> {
    try {
      const ffmpeg = this.createFFmpegService()
      // Пытаемся выполнить простую операцию для проверки доступности
      await ffmpeg.getVideoMetadata("/dev/null")
      return true
    } catch {
      // FFmpeg недоступен или произошла ошибка
      try {
        // Альтернативная проверка через которую мы можем проверить наличие FFmpeg
        // child_process доступен только в Node.js окружении (не в браузере)
        if (typeof window === "undefined" && typeof process !== "undefined" && process.versions?.node) {
          const { exec } = require("child_process")
          return new Promise((resolve) => {
            exec("ffmpeg -version", (error: any) => {
              resolve(!error)
            })
          })
        }
        return false
      } catch {
        return false
      }
    }
  }

  async getAvailableServices(): Promise<string[]> {
    const services: string[] = []

    // Проверяем FFmpeg
    if (await this.isFFmpegAvailable()) {
      services.push("ffmpeg")
    }

    // Проверяем Vision сервисы
    try {
      const visionService = this.createVisionService()
      // Простая проверка - пытаемся создать сервис
      if (visionService) {
        services.push("vision")
      }
    } catch {
      // Vision сервис недоступен
    }

    // Content analysis доступен если есть хотя бы FFmpeg
    if (services.includes("ffmpeg")) {
      services.push("content-analysis")
    }

    return services
  }

  // Дополнительные методы для управления
  async validateServices(): Promise<{ [service: string]: boolean }> {
    const results = {
      ffmpeg: false,
      vision: false,
      contentAnalysis: false,
    }

    try {
      results.ffmpeg = await this.isFFmpegAvailable()
    } catch {
      // FFmpeg validation failed
    }

    try {
      const visionService = this.createVisionService()
      results.vision = !!visionService
    } catch {
      // Vision validation failed
    }

    results.contentAnalysis = results.ffmpeg // Content analysis требует FFmpeg

    return results
  }

  async getServiceCapabilities(): Promise<{
    ffmpeg: string[]
    vision: string[]
    contentAnalysis: string[]
  }> {
    return {
      ffmpeg: [
        "metadata",
        "scene-detection",
        "quality-analysis",
        "silence-detection",
        "motion-analysis",
        "keyframe-extraction",
        "format-conversion",
      ],
      vision: ["frame-analysis", "object-detection", "text-extraction", "composition-analysis", "color-analysis"],
      contentAnalysis: ["full-media-analysis", "batch-processing", "combined-analysis", "quality-scoring"],
    }
  }

  // Очистка ресурсов
  dispose(): void {
    this.ffmpegService = null
    this.visionService = null
    this.contentService = null
  }

  // Статистика использования
  getUsageStats(): {
    ffmpegCalls: number
    visionCalls: number
    contentCalls: number
    averageProcessingTime: number
  } {
    // TODO: Implement usage statistics tracking
    return {
      ffmpegCalls: 0,
      visionCalls: 0,
      contentCalls: 0,
      averageProcessingTime: 0,
    }
  }
}

// Singleton instance
let factoryInstance: MediaAnalysisFactoryImpl | null = null

export function createMediaAnalysisFactory(): MediaAnalysisFactory {
  if (!factoryInstance) {
    factoryInstance = new MediaAnalysisFactoryImpl()
  }
  return factoryInstance
}

export function getMediaAnalysisFactory(): MediaAnalysisFactory {
  return createMediaAnalysisFactory()
}
