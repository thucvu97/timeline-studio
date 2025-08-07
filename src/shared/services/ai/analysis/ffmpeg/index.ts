/**
 * FFmpeg Analysis Service
 * Адаптер для интеграции с FFmpeg анализом через shared интерфейсы
 */

import type {
  IFFmpegAnalysisService,
  MotionAnalysisResult,
  QualityAnalysisResult,
  SceneDetectionResult,
  SilenceDetectionResult,
  VideoMetadata,
} from "../interfaces"

// Импорт существующего FFmpeg сервиса (временно, до полной миграции)
let FFmpegAnalysisService: any = null

try {
  // Динамический импорт для избежания циклических зависимостей
  const ffmpegModule = require("@/features/ai-chat/services/ffmpeg-analysis-service")
  FFmpegAnalysisService = ffmpegModule.FFmpegAnalysisService
} catch (error) {
  // Fallback на legacy адаптер
  try {
    const legacyModule = require("@/features/ai-chat/services/legacy-adapters")
    FFmpegAnalysisService = legacyModule.FFmpegAnalysisService
  } catch (legacyError) {
    console.warn("FFmpeg service not available:", error)
  }
}

export class FFmpegAdapter implements IFFmpegAnalysisService {
  private ffmpegService: any

  constructor() {
    if (FFmpegAnalysisService) {
      this.ffmpegService = FFmpegAnalysisService.getInstance()
    }
  }

  async getVideoMetadata(path: string): Promise<VideoMetadata> {
    if (!this.ffmpegService) {
      throw new Error("FFmpeg service not available")
    }

    try {
      const metadata = await this.ffmpegService.getVideoMetadata(path)

      return {
        format: metadata.format || "unknown",
        duration: metadata.duration || 0,
        width: metadata.width || 0,
        height: metadata.height || 0,
        fps: metadata.fps || 0,
        bitrate: metadata.bitrate || 0,
        hasAudio: metadata.hasAudio || false,
        audioChannels: metadata.audioChannels,
        audioSampleRate: metadata.audioSampleRate,
        codec: metadata.codec,
      }
    } catch (error) {
      throw new Error(`FFmpeg metadata error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async detectScenes(
    path: string,
    options: {
      sensitivity?: number
      minSceneDuration?: number
      method?: "threshold" | "histogram"
    } = {},
  ): Promise<SceneDetectionResult> {
    if (!this.ffmpegService) {
      throw new Error("FFmpeg service not available")
    }

    try {
      const result = await this.ffmpegService.detectScenes(path, {
        sensitivity: options.sensitivity || 0.3,
        minSceneDuration: options.minSceneDuration || 2.0,
      })

      return {
        scenes:
          result.scenes?.map((scene: any, index: number) => ({
            id: scene.id || `scene_${index}`,
            startTime: scene.startTime || scene.start || 0,
            endTime: scene.endTime || scene.end || 0,
            duration: (scene.endTime || scene.end || 0) - (scene.startTime || scene.start || 0),
            confidence: scene.confidence || 0.8,
            keyFrames: scene.keyFrames || [],
            description: scene.description,
          })) || [],
        totalDuration: result.totalDuration || 0,
        confidence: result.confidence || 0.8,
        method: options.method || "threshold",
      }
    } catch (error) {
      throw new Error(`FFmpeg scene detection error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async analyzeQuality(
    path: string,
    options: {
      checkVideo?: boolean
      checkAudio?: boolean
      deepAnalysis?: boolean
    } = {},
  ): Promise<QualityAnalysisResult> {
    if (!this.ffmpegService) {
      throw new Error("FFmpeg service not available")
    }

    try {
      const result = await this.ffmpegService.analyzeQuality(path, options)

      return {
        overall: result.overall || result.quality?.overall || 75,
        video: result.video
          ? {
              sharpness: result.video.sharpness || 75,
              brightness: result.video.brightness || 75,
              contrast: result.video.contrast || 75,
              saturation: result.video.saturation || 75,
              noise: result.video.noise || 25,
              stability: result.video.stability || 75,
            }
          : undefined,
        audio: result.audio
          ? {
              clarity: result.audio.clarity || 75,
              volume: result.audio.volume || 75,
              clipping: result.audio.clipping || false,
              noiseLevel: result.audio.noiseLevel || 25,
            }
          : undefined,
        issues: result.issues || [],
        recommendations: result.recommendations || [],
      }
    } catch (error) {
      throw new Error(`FFmpeg quality analysis error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async detectSilence(
    path: string,
    options: {
      threshold?: number
      minDuration?: number
    } = {},
  ): Promise<SilenceDetectionResult> {
    if (!this.ffmpegService) {
      throw new Error("FFmpeg service not available")
    }

    try {
      const result = await this.ffmpegService.detectSilence(path, options)

      return {
        silentSegments:
          result.silentSegments?.map((segment: any) => ({
            startTime: segment.startTime || segment.start || 0,
            endTime: segment.endTime || segment.end || 0,
            duration: segment.duration || segment.endTime - segment.startTime || 0,
            confidence: segment.confidence || 0.9,
          })) || [],
        totalSilenceDuration: result.totalSilenceDuration || 0,
        speechRatio: result.speechRatio || 0.8,
      }
    } catch (error) {
      throw new Error(`FFmpeg silence detection error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async analyzeMotion(
    path: string,
    options: {
      sensitivity?: number
      stabilityCheck?: boolean
    } = {},
  ): Promise<MotionAnalysisResult> {
    if (!this.ffmpegService) {
      throw new Error("FFmpeg service not available")
    }

    try {
      const result = await this.ffmpegService.analyzeMotion(path, options)

      return {
        motionIntensity: result.motionIntensity || result.intensity || 50,
        motionVectors: result.motionVectors || [],
        cameraMovement: result.cameraMovement
          ? {
              type: result.cameraMovement.type || "static",
              intensity: result.cameraMovement.intensity || 0,
            }
          : undefined,
        stabilityScore: result.stabilityScore || result.stability || 75,
      }
    } catch (error) {
      throw new Error(`FFmpeg motion analysis error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async extractKeyframes(
    path: string,
    options: {
      count?: number
      interval?: number
      outputDir?: string
    } = {},
  ): Promise<string[]> {
    if (!this.ffmpegService) {
      throw new Error("FFmpeg service not available")
    }

    try {
      const keyframes = await this.ffmpegService.extractKeyframes(path, {
        frameCount: options.count || 10,
        interval: options.interval || 5,
        outputDirectory: options.outputDir || "/tmp/keyframes",
      })

      return keyframes || []
    } catch (error) {
      throw new Error(`FFmpeg keyframe extraction error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async convertToFormat(_inputPath: string, _outputPath: string, _format: string): Promise<boolean> {
    if (!this.ffmpegService) {
      throw new Error("FFmpeg service not available")
    }

    try {
      // TODO: Implement format conversion if needed
      console.warn("Format conversion not yet implemented in adapter")
      return false
    } catch (error) {
      throw new Error(`FFmpeg conversion error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

// Фабричная функция
export function createFFmpegService(): FFmpegAdapter {
  return new FFmpegAdapter()
}
