/**
 * Сервис для анализа видео с помощью FFmpeg и AI
 * Предоставляет возможности анализа сцен, качества, аудио и метаданных
 */

import { invoke } from "@tauri-apps/api/core"

// Типы результатов анализа
export interface VideoMetadata {
  duration: number // в секундах
  width: number
  height: number
  fps: number
  bitrate: number
  codec: string
  format: string
  hasAudio: boolean
  audioCodec?: string
  audioChannels?: number
  audioSampleRate?: number
  fileSize: number
}

export interface SceneDetectionResult {
  scenes: Array<{
    startTime: number // в секундах
    endTime: number
    confidence: number
    thumbnailPath?: string
  }>
  totalScenes: number
  averageSceneLength: number
}

export interface QualityAnalysisResult {
  overall: number // 0-1, общая оценка качества
  sharpness: number // 0-1, резкость
  brightness: number // 0-1, яркость
  contrast: number // 0-1, контрастность
  saturation: number // 0-1, насыщенность
  noise: number // 0-1, уровень шума (меньше = лучше)
  stability: number // 0-1, стабилизация (дрожание камеры)
  issues: string[] // список обнаруженных проблем
}

export interface SilenceDetectionResult {
  silences: Array<{
    startTime: number
    endTime: number
    duration: number
    confidence: number
  }>
  totalSilenceDuration: number
  speechPercentage: number
}

export interface MotionAnalysisResult {
  motionIntensity: number // 0-1, интенсивность движения
  cameraMovement: {
    panning: number // 0-1, панорамирование
    tilting: number // 0-1, наклон
    zooming: number // 0-1, зум
    stability: number // 0-1, стабильность
  }
  objectMovement: number // 0-1, движение объектов в кадре
  motionProfile: Array<{
    timestamp: number
    intensity: number
  }>
}

export interface KeyFrameExtractionResult {
  keyFrames: Array<{
    timestamp: number
    imagePath: string
    confidence: number
    description?: string // если используется AI описание
  }>
  thumbnailPath: string // лучший кадр для превью
}

export interface AudioAnalysisResult {
  volume: {
    average: number // 0-1
    peak: number // 0-1
    rms: number // 0-1
  }
  frequency: {
    lowEnd: number // 0-1, басы
    midRange: number // 0-1, средние частоты
    highEnd: number // 0-1, высокие частоты
  }
  dynamics: {
    dynamicRange: number // 0-1
    compressionRatio: number
  }
  quality: {
    clipping: boolean
    noiseLevel: number // 0-1
    overallQuality: number // 0-1
  }
}

// Параметры анализа
export interface VideoAnalysisOptions {
  sceneDetection?: {
    threshold?: number // 0-1, чувствительность детекции сцен
    minSceneLength?: number // минимальная длина сцены в секундах
  }
  qualityAnalysis?: {
    sampleRate?: number // количество кадров для анализа в секунду
    enableNoiseDetection?: boolean
    enableStabilityCheck?: boolean
  }
  silenceDetection?: {
    threshold?: number // уровень тишины в dB
    minDuration?: number // минимальная длительность тишины в секундах
  }
  motionAnalysis?: {
    sensitivity?: number // 0-1, чувствительность к движению
  }
  keyFrameExtraction?: {
    count?: number // количество ключевых кадров
    quality?: "low" | "medium" | "high"
    aiDescription?: boolean // использовать AI для описания кадров
  }
  audioAnalysis?: {
    enableSpectralAnalysis?: boolean
    enableDynamicsAnalysis?: boolean
  }
}

/**
 * Основной сервис FFmpeg анализа
 */
export class FFmpegAnalysisService {
  private static instance: FFmpegAnalysisService

  private constructor() {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): FFmpegAnalysisService {
    if (!FFmpegAnalysisService.instance) {
      FFmpegAnalysisService.instance = new FFmpegAnalysisService()
    }
    return FFmpegAnalysisService.instance
  }

  /**
   * Получить базовые метаданные видеофайла
   */
  public async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
    try {
      const result = await invoke<VideoMetadata>("ffmpeg_get_metadata", {
        filePath,
      })
      return result
    } catch (error) {
      console.error("Ошибка получения метаданных видео:", error)
      throw new Error(`Не удалось получить метаданные: ${String(error)}`)
    }
  }

  /**
   * Определить сцены в видео
   */
  public async detectScenes(
    filePath: string,
    options: VideoAnalysisOptions["sceneDetection"] = {},
  ): Promise<SceneDetectionResult> {
    try {
      const result = await invoke<SceneDetectionResult>("ffmpeg_detect_scenes", {
        filePath,
        threshold: options.threshold || 0.3,
        minSceneLength: options.minSceneLength || 1.0,
      })
      return result
    } catch (error) {
      console.error("Ошибка детекции сцен:", error)
      throw new Error(`Не удалось определить сцены: ${String(error)}`)
    }
  }

  /**
   * Анализ качества видео
   */
  public async analyzeQuality(
    filePath: string,
    options: VideoAnalysisOptions["qualityAnalysis"] = {},
  ): Promise<QualityAnalysisResult> {
    try {
      const result = await invoke<QualityAnalysisResult>("ffmpeg_analyze_quality", {
        filePath,
        sampleRate: options.sampleRate || 1.0,
        enableNoiseDetection: options.enableNoiseDetection ?? true,
        enableStabilityCheck: options.enableStabilityCheck ?? true,
      })
      return result
    } catch (error) {
      console.error("Ошибка анализа качества:", error)
      throw new Error(`Не удалось проанализировать качество: ${String(error)}`)
    }
  }

  /**
   * Детекция тишины в аудио
   */
  public async detectSilence(
    filePath: string,
    options: VideoAnalysisOptions["silenceDetection"] = {},
  ): Promise<SilenceDetectionResult> {
    try {
      const result = await invoke<SilenceDetectionResult>("ffmpeg_detect_silence", {
        filePath,
        threshold: options.threshold || -30, // dB
        minDuration: options.minDuration || 1.0,
      })
      return result
    } catch (error) {
      console.error("Ошибка детекции тишины:", error)
      throw new Error(`Не удалось определить тишину: ${String(error)}`)
    }
  }

  /**
   * Анализ движения в видео
   */
  public async analyzeMotion(
    filePath: string,
    options: VideoAnalysisOptions["motionAnalysis"] = {},
  ): Promise<MotionAnalysisResult> {
    try {
      const result = await invoke<MotionAnalysisResult>("ffmpeg_analyze_motion", {
        filePath,
        sensitivity: options.sensitivity || 0.5,
      })
      return result
    } catch (error) {
      console.error("Ошибка анализа движения:", error)
      throw new Error(`Не удалось проанализировать движение: ${String(error)}`)
    }
  }

  /**
   * Извлечение ключевых кадров
   */
  public async extractKeyFrames(
    filePath: string,
    options: VideoAnalysisOptions["keyFrameExtraction"] = {},
  ): Promise<KeyFrameExtractionResult> {
    try {
      const result = await invoke<KeyFrameExtractionResult>("ffmpeg_extract_keyframes", {
        filePath,
        count: options.count || 10,
        quality: options.quality || "medium",
        aiDescription: options.aiDescription || false,
      })
      return result
    } catch (error) {
      console.error("Ошибка извлечения ключевых кадров:", error)
      throw new Error(`Не удалось извлечь ключевые кадры: ${String(error)}`)
    }
  }

  /**
   * Анализ аудиодорожки
   */
  public async analyzeAudio(
    filePath: string,
    options: VideoAnalysisOptions["audioAnalysis"] = {},
  ): Promise<AudioAnalysisResult> {
    try {
      const result = await invoke<AudioAnalysisResult>("ffmpeg_analyze_audio", {
        filePath,
        enableSpectralAnalysis: options.enableSpectralAnalysis ?? true,
        enableDynamicsAnalysis: options.enableDynamicsAnalysis ?? true,
      })
      return result
    } catch (error) {
      console.error("Ошибка анализа аудио:", error)
      throw new Error(`Не удалось проанализировать аудио: ${String(error)}`)
    }
  }

  /**
   * Комплексный анализ видео (все типы анализа)
   */
  public async comprehensiveAnalysis(
    filePath: string,
    options: VideoAnalysisOptions = {},
  ): Promise<{
    metadata: VideoMetadata
    scenes: SceneDetectionResult
    quality: QualityAnalysisResult
    silence: SilenceDetectionResult
    motion: MotionAnalysisResult
    keyFrames: KeyFrameExtractionResult
    audio: AudioAnalysisResult
  }> {
    try {
      // Выполняем все анализы параллельно для оптимизации
      const [metadata, scenes, quality, silence, motion, keyFrames, audio] = await Promise.all([
        this.getVideoMetadata(filePath),
        this.detectScenes(filePath, options.sceneDetection),
        this.analyzeQuality(filePath, options.qualityAnalysis),
        this.detectSilence(filePath, options.silenceDetection),
        this.analyzeMotion(filePath, options.motionAnalysis),
        this.extractKeyFrames(filePath, options.keyFrameExtraction),
        this.analyzeAudio(filePath, options.audioAnalysis),
      ])

      return {
        metadata,
        scenes,
        quality,
        silence,
        motion,
        keyFrames,
        audio,
      }
    } catch (error) {
      console.error("Ошибка комплексного анализа:", error)
      throw new Error(`Не удалось выполнить комплексный анализ: ${String(error)}`)
    }
  }

  /**
   * Быстрый анализ для предпросмотра (только основные метрики)
   */
  public async quickAnalysis(filePath: string): Promise<{
    duration: number
    resolution: string
    quality: number
    hasAudio: boolean
    estimatedScenes: number
  }> {
    try {
      const metadata = await this.getVideoMetadata(filePath)

      // Быстрая оценка качества (без глубокого анализа)
      const quickQuality = await invoke<{ overall: number; estimatedScenes: number }>("ffmpeg_quick_analysis", {
        filePath,
      })

      return {
        duration: metadata.duration,
        resolution: `${metadata.width}x${metadata.height}`,
        quality: quickQuality.overall,
        hasAudio: metadata.hasAudio,
        estimatedScenes: quickQuality.estimatedScenes,
      }
    } catch (error) {
      console.error("Ошибка быстрого анализа:", error)
      throw new Error(`Не удалось выполнить быстрый анализ: ${String(error)}`)
    }
  }

  /**
   * Получить рекомендации по улучшению видео на основе анализа
   */
  public generateImprovementSuggestions(analysisResult: {
    quality: QualityAnalysisResult
    audio: AudioAnalysisResult
    motion: MotionAnalysisResult
  }): Array<{
    type: "quality" | "audio" | "motion" | "editing"
    severity: "low" | "medium" | "high"
    issue: string
    suggestion: string
    autoFixAvailable: boolean
  }> {
    const suggestions: Array<{
      type: "quality" | "audio" | "motion" | "editing"
      severity: "low" | "medium" | "high"
      issue: string
      suggestion: string
      autoFixAvailable: boolean
    }> = []

    // Анализ качества видео
    if (analysisResult.quality.sharpness < 0.6) {
      suggestions.push({
        type: "quality",
        severity: "medium",
        issue: "Низкая резкость изображения",
        suggestion: "Применить фильтр повышения резкости (unsharp)",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.quality.brightness < 0.3 || analysisResult.quality.brightness > 0.8) {
      suggestions.push({
        type: "quality",
        severity: "medium",
        issue: "Неоптимальная яркость",
        suggestion: "Настроить уровни яркости и контраста",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.quality.stability < 0.7) {
      suggestions.push({
        type: "quality",
        severity: "high",
        issue: "Нестабильное изображение (дрожание камеры)",
        suggestion: "Применить стабилизацию видео (deshake)",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.quality.noise > 0.4) {
      suggestions.push({
        type: "quality",
        severity: "medium",
        issue: "Высокий уровень шума",
        suggestion: "Применить фильтр шумоподавления (denoise)",
        autoFixAvailable: true,
      })
    }

    // Анализ аудио
    if (analysisResult.audio.quality.clipping) {
      suggestions.push({
        type: "audio",
        severity: "high",
        issue: "Обрезание аудиосигнала (клиппинг)",
        suggestion: "Уменьшить громкость и применить лимитер",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.audio.quality.noiseLevel > 0.3) {
      suggestions.push({
        type: "audio",
        severity: "medium",
        issue: "Высокий уровень фонового шума",
        suggestion: "Применить фильтр шумоподавления для аудио",
        autoFixAvailable: true,
      })
    }

    if (analysisResult.audio.volume.average < 0.2) {
      suggestions.push({
        type: "audio",
        severity: "medium",
        issue: "Низкий уровень громкости",
        suggestion: "Нормализовать громкость аудио",
        autoFixAvailable: true,
      })
    }

    // Анализ движения
    if (analysisResult.motion.cameraMovement.stability < 0.6) {
      suggestions.push({
        type: "motion",
        severity: "medium",
        issue: "Резкие движения камеры",
        suggestion: "Добавить плавные переходы между кадрами",
        autoFixAvailable: false,
      })
    }

    if (analysisResult.motion.motionIntensity < 0.2) {
      suggestions.push({
        type: "editing",
        severity: "low",
        issue: "Статичные кадры",
        suggestion: "Добавить динамические переходы или эффекты",
        autoFixAvailable: false,
      })
    }

    return suggestions
  }
}
