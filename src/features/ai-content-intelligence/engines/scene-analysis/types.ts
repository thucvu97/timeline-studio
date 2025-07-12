/**
 * Типы для Scene Analysis Engine
 */

import type { ContentType, Genre, KeyMoment, SceneAnalysis } from "../../shared/types/content-analysis"

export interface SceneAnalysisConfig {
  // FFmpeg параметры
  ffmpeg: {
    sceneThreshold: number // 0-1
    minSceneLength: number // секунды
    keyframeInterval: number // секунды между ключевыми кадрами
    qualitySampleRate: number // кадров в секунду для анализа качества
  }

  // Computer Vision параметры
  vision: {
    enableObjectDetection: boolean
    enableFaceDetection: boolean
    enableTextRecognition: boolean
    enableActivityDetection: boolean
    confidenceThreshold: number // 0-1
  }

  // AI анализ
  ai: {
    enableContentClassification: boolean
    enableMoodDetection: boolean
    enableGenreDetection: boolean
    model?: string // Какую AI модель использовать
  }

  // Производительность
  performance: {
    parallel: boolean
    maxThreads: number
    cacheResults: boolean
  }
}

export interface SceneAnalysisResult {
  scenes: SceneAnalysis[]
  keyMoments: KeyMoment[]
  classification: {
    contentType: ContentType
    genres: Genre[]
    confidence: number
  }
  summary: {
    totalScenes: number
    averageSceneDuration: number
    dominantColors: string[]
    visualComplexity: number // 0-1
    audioProfile: AudioProfile
  }
  timeline: TimelineData
}

export interface AudioProfile {
  hasSpeech: boolean
  hasMusic: boolean
  hasSilence: boolean
  speechPercentage: number
  musicPercentage: number
  averageVolume: number
  dynamicRange: number
}

export interface TimelineData {
  duration: number
  segments: TimelineSegment[]
  keyframes: KeyframeData[]
}

export interface TimelineSegment {
  start: number
  end: number
  type: SegmentType
  confidence: number
  metadata?: any
}

export enum SegmentType {
  INTRO = "intro",
  MAIN_CONTENT = "main_content",
  TRANSITION = "transition",
  OUTRO = "outro",
  CREDITS = "credits",
}

export interface KeyframeData {
  timestamp: number
  thumbnailPath: string
  features: VisualFeatures
  importance: number // 0-1
}

export interface VisualFeatures {
  dominantColors: ColorInfo[]
  composition: CompositionMetrics
  lighting: LightingInfo
  motion: MotionMetrics
}

export interface ColorInfo {
  hex: string
  percentage: number
  name?: string
}

export interface CompositionMetrics {
  ruleOfThirds: number // 0-1
  symmetry: number // 0-1
  balance: number // 0-1
  leadingLines: boolean
  goldenRatio: number // 0-1
}

export interface LightingInfo {
  brightness: number // 0-1
  contrast: number // 0-1
  type: LightingType
  quality: number // 0-1
}

export enum LightingType {
  NATURAL = "natural",
  ARTIFICIAL = "artificial",
  MIXED = "mixed",
  LOW_KEY = "low_key",
  HIGH_KEY = "high_key",
}

export interface MotionMetrics {
  intensity: number // 0-1
  direction: MotionDirection
  speed: number // pixels per second
  cameraMovement: CameraMovement
}

export enum MotionDirection {
  STATIC = "static",
  LEFT = "left",
  RIGHT = "right",
  UP = "up",
  DOWN = "down",
  DIAGONAL = "diagonal",
  CHAOTIC = "chaotic",
}

export interface CameraMovement {
  type: CameraMovementType
  intensity: number // 0-1
  smooth: boolean
}

export enum CameraMovementType {
  STATIC = "static",
  PAN = "pan",
  TILT = "tilt",
  ZOOM = "zoom",
  DOLLY = "dolly",
  HANDHELD = "handheld",
  TRACKING = "tracking",
}
