/**
 * Интерфейсы для сервисов анализа медиа
 * Позволяют избежать прямых зависимостей от других модулей
 */

import type {
  MotionAnalysisResult,
  QualityAnalysisResult,
  SceneDetectionResult,
  SilenceDetectionResult,
  VideoMetadata,
} from "@/shared/types/media-analysis"

export interface IFFmpegAnalysisService {
  getVideoMetadata(path: string): Promise<VideoMetadata>
  detectScenes(path: string): Promise<SceneDetectionResult>
  analyzeQuality(path: string): Promise<QualityAnalysisResult>
  detectSilence(path: string): Promise<SilenceDetectionResult>
  analyzeMotion(path: string): Promise<MotionAnalysisResult>
}

export interface IUnifiedAIService {
  analyze?(content: string): Promise<unknown>
  generateText?(prompt: string): Promise<string>
}

// Фабрика для создания сервисов (будет настроена извне)
export interface ServiceFactory {
  createFFmpegService(): IFFmpegAnalysisService
  createAIService(): IUnifiedAIService
}

let serviceFactory: ServiceFactory | null = null

export function setServiceFactory(factory: ServiceFactory) {
  serviceFactory = factory
}

export function getFFmpegService(): IFFmpegAnalysisService {
  if (!serviceFactory) {
    // Возвращаем заглушку если фабрика не настроена
    return {
      async getVideoMetadata() {
        return {
          format: "mp4",
          duration: 60,
          width: 1920,
          height: 1080,
          fps: 30,
          bitrate: 5000000,
          codec: "h264",
          hasAudio: true,
          audioChannels: 2,
          audioCodec: "aac",
          audioSampleRate: 48000,
          fileSize: 30000000,
        }
      },
      async detectScenes() {
        return {
          scenes: [],
          totalScenes: 0,
          averageSceneLength: 0,
        }
      },
      async analyzeQuality() {
        return {
          overall: 75,
          sharpness: 80,
          brightness: 70,
          contrast: 75,
          saturation: 70,
          stability: 85,
          noise: 20,
          issues: [],
        }
      },
      async detectSilence() {
        return {
          silences: [],
          totalSilenceDuration: 0,
          speechPercentage: 100,
        }
      },
      async analyzeMotion() {
        return {
          motionIntensity: 0.5,
          cameraMovement: {
            panning: 0,
            tilting: 0,
            zooming: 0,
            stability: 1,
          },
          objectMovement: 0,
          motionProfile: [],
        }
      },
    }
  }
  return serviceFactory.createFFmpegService()
}

export function getAIService(): IUnifiedAIService {
  if (!serviceFactory) {
    // Возвращаем заглушку если фабрика не настроена
    return {
      async analyze() {
        return { analyzed: true }
      },
      async generateText() {
        return "Generated text placeholder"
      },
    }
  }
  return serviceFactory.createAIService()
}
