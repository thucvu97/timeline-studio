/**
 * Интерфейсы для сервисов анализа медиа
 * Позволяют избежать прямых зависимостей от конкретных реализаций
 */

// Базовые типы медиа анализа
export interface MediaFile {
  path: string
  name: string
  size?: number
  duration?: number
  format?: string
  type?: "video" | "audio" | "image"
}

export interface VideoMetadata {
  format: string
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  hasAudio: boolean
  audioChannels?: number
  audioSampleRate?: number
  codec?: string
}

export interface SceneDetectionResult {
  scenes: Scene[]
  totalDuration: number
  confidence: number
  method: "threshold" | "histogram" | "optical_flow" | "ai"
}

export interface Scene {
  id: string
  startTime: number
  endTime: number
  duration: number
  confidence: number
  keyFrames?: string[]
  description?: string
}

export interface QualityAnalysisResult {
  overall: number // 0-100
  video?: {
    sharpness: number
    brightness: number
    contrast: number
    saturation: number
    noise: number
    stability: number
  }
  audio?: {
    clarity: number
    volume: number
    clipping: boolean
    noiseLevel: number
  }
  issues?: string[]
  recommendations?: string[]
}

export interface SilenceDetectionResult {
  silentSegments: SilentSegment[]
  totalSilenceDuration: number
  speechRatio: number
}

export interface SilentSegment {
  startTime: number
  endTime: number
  duration: number
  confidence: number
}

export interface MotionAnalysisResult {
  motionIntensity: number // 0-100
  motionVectors?: MotionVector[]
  cameraMovement?: {
    type: "static" | "pan" | "tilt" | "zoom" | "shake"
    intensity: number
  }
  stabilityScore: number
}

export interface MotionVector {
  timestamp: number
  x: number
  y: number
  magnitude: number
  direction: number
}

// Интерфейс для FFmpeg анализа
export interface IFFmpegAnalysisService {
  // Базовый анализ
  getVideoMetadata(path: string): Promise<VideoMetadata>

  // Детекция сцен
  detectScenes(
    path: string,
    options?: {
      sensitivity?: number
      minSceneDuration?: number
      method?: "threshold" | "histogram"
    },
  ): Promise<SceneDetectionResult>

  // Анализ качества
  analyzeQuality(
    path: string,
    options?: {
      checkVideo?: boolean
      checkAudio?: boolean
      deepAnalysis?: boolean
    },
  ): Promise<QualityAnalysisResult>

  // Аудио анализ
  detectSilence(
    path: string,
    options?: {
      threshold?: number
      minDuration?: number
    },
  ): Promise<SilenceDetectionResult>

  // Анализ движения
  analyzeMotion(
    path: string,
    options?: {
      sensitivity?: number
      stabilityCheck?: boolean
    },
  ): Promise<MotionAnalysisResult>

  // Извлечение кадров
  extractKeyframes(
    path: string,
    options?: {
      count?: number
      interval?: number
      outputDir?: string
    },
  ): Promise<string[]>

  // Конвертация
  convertToFormat(inputPath: string, outputPath: string, format: string): Promise<boolean>
}

// Интерфейс для компьютерного зрения
export interface IVisionService {
  // Анализ изображений
  analyzeFrame(imagePath: string): Promise<FrameAnalysis>
  analyzeFrames(imagePaths: string[]): Promise<FrameAnalysis[]>

  // Детекция объектов
  detectObjects(imagePath: string): Promise<DetectedObject[]>

  // Распознавание текста (OCR)
  extractText(imagePath: string): Promise<ExtractedText[]>

  // Анализ композиции
  analyzeComposition(imagePath: string): Promise<CompositionAnalysis>

  // Анализ цвета
  analyzeColors(imagePath: string): Promise<ColorAnalysis>
}

export interface FrameAnalysis {
  id: string
  timestamp: number
  objects: DetectedObject[]
  text: ExtractedText[]
  composition: CompositionAnalysis
  colors: ColorAnalysis
  quality: {
    sharpness: number
    brightness: number
    contrast: number
  }
}

export interface DetectedObject {
  class: string
  confidence: number
  boundingBox: BoundingBox
  attributes?: Record<string, any>
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ExtractedText {
  text: string
  confidence: number
  boundingBox: BoundingBox
  language?: string
}

export interface CompositionAnalysis {
  ruleOfThirds: {
    score: number
    points: Point2D[]
  }
  leadingLines: {
    score: number
    lines: Line2D[]
  }
  balance: {
    score: number
    centerOfMass: Point2D
  }
  symmetry: {
    score: number
    axis?: "horizontal" | "vertical" | "both"
  }
}

export interface Point2D {
  x: number
  y: number
}

export interface Line2D {
  start: Point2D
  end: Point2D
  angle: number
}

export interface ColorAnalysis {
  dominantColors: Color[]
  palette: Color[]
  temperature: "warm" | "cool" | "neutral"
  saturation: "high" | "medium" | "low"
  brightness: "bright" | "medium" | "dark"
}

export interface Color {
  r: number
  g: number
  b: number
  hex: string
  percentage: number
}

// Фабрика сервисов анализа
export interface MediaAnalysisFactory {
  createFFmpegService(): IFFmpegAnalysisService
  createVisionService(): IVisionService

  // Составные сервисы
  createContentAnalysisService(): IContentAnalysisService

  // Утилиты
  isFFmpegAvailable(): Promise<boolean>
  getAvailableServices(): Promise<string[]>
}

// Интерфейс для полного анализа контента
export interface IContentAnalysisService {
  analyzeMedia(file: MediaFile, options?: ContentAnalysisOptions): Promise<ContentAnalysisResult>
  batchAnalyzeMedia(files: MediaFile[], options?: ContentAnalysisOptions): Promise<ContentAnalysisResult[]>
}

export interface ContentAnalysisOptions {
  analysisDepth?: "quick" | "normal" | "deep"
  includeSceneDetection?: boolean
  includeQualityAnalysis?: boolean
  includeVisionAnalysis?: boolean
  includeMotionAnalysis?: boolean
  outputDir?: string
}

export interface ContentAnalysisResult {
  mediaFile: MediaFile
  metadata: VideoMetadata
  scenes?: SceneDetectionResult
  quality?: QualityAnalysisResult
  motion?: MotionAnalysisResult
  silence?: SilenceDetectionResult
  frames?: FrameAnalysis[]
  processingTime: number
  errors?: string[]
  warnings?: string[]
}
