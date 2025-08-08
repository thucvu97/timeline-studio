/**
 * Test utilities for AI Content Intelligence tests
 */

import { vi } from "vitest"
import type {
  AIConfig,
  AIFeatures,
  AIProvider,
  AIProviderConfig,
  AnalysisDepth,
  AccuracyLevel,
  SpeedPriority,
  ProcessingConfig,
  QualityConfig,
  ResourceLimit,
} from "../shared/types/ai-config"
import type { MediaFile } from "@/shared/services/ai/analysis/interfaces"
import type { SceneAnalysis, VideoAnalysis, AudioAnalysis } from "../shared/types/content-analysis"

/**
 * Create a complete mock AIConfig with all required properties
 */
export function createMockAIConfig(overrides?: Partial<AIConfig>): AIConfig {
  const defaultProviders: AIProviderConfig[] = [
    {
      provider: AIProvider.OPENAI,
      apiKey: "test-key",
      model: "gpt-4",
      maxTokens: 4000,
      temperature: 0.7,
    },
  ]

  const defaultFeatures: AIFeatures = {
    sceneAnalysis: true,
    scriptGeneration: false,
    multiPlatform: false,
    personIdentification: false,
    contentClassification: true,
    qualityEnhancement: false,
    autoSuggestions: true,
  }

  const defaultProcessing: ProcessingConfig = {
    parallel: true,
    maxConcurrent: 3,
    batchSize: 10,
    cacheResults: true,
    cacheDuration: 24,
    retryAttempts: 3,
    timeout: 300,
  }

  const defaultResourceLimit: ResourceLimit = {
    maxCPU: 80,
    maxRAM: 4096,
    maxGPU: 75,
    maxDiskSpace: 10240,
  }

  const defaultQuality: QualityConfig = {
    analysisDepth: AnalysisDepth.STANDARD,
    accuracy: AccuracyLevel.BALANCED,
    speed: SpeedPriority.NORMAL,
    resourceUsage: defaultResourceLimit,
  }

  return {
    providers: defaultProviders,
    defaultProvider: AIProvider.OPENAI,
    features: defaultFeatures,
    processing: defaultProcessing,
    quality: defaultQuality,
    ...overrides,
  }
}

/**
 * Create a mock MediaFile
 */
export function createMockMediaFile(overrides?: Partial<MediaFile>): MediaFile {
  return {
    path: "/test/video.mp4",
    filename: "video.mp4",
    name: "video",
    size: 10485760, // 10MB
    format: "mp4",
    duration: 120, // 2 minutes
    ...overrides,
  }
}

/**
 * Create mock scene analysis results
 */
export function createMockSceneAnalysis(count = 3): SceneAnalysis[] {
  const scenes: SceneAnalysis[] = []
  const sceneDuration = 10000 // 10 seconds per scene

  for (let i = 0; i < count; i++) {
    scenes.push({
      id: `scene-${i}`,
      startTime: i * sceneDuration,
      endTime: (i + 1) * sceneDuration,
      duration: sceneDuration,
      type: "dialogue" as any,
      keyFrames: [],
      quality: {
        overall: 80,
        sharpness: 85,
        brightness: 75,
        contrast: 80,
        saturation: 85,
        stability: 90,
        noise: 10,
      },
      content: {
        objects: [],
        faces: [],
        text: [],
        activities: [],
      },
      transitions: [],
    })
  }

  return scenes
}

/**
 * Create mock video analysis result
 */
export function createMockVideoAnalysis(): VideoAnalysis {
  return {
    metadata: {
      format: "mp4",
      duration: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 5000000,
      hasAudio: true,
      audioChannels: 2,
      audioSampleRate: 48000,
      codec: "h264",
    },
    quality: {
      overall: 0.85,
      sharpness: 0.9,
      brightness: 0.8,
      contrast: 0.85,
      saturation: 0.8,
      noise: 0.15,
    },
  }
}

/**
 * Create mock audio analysis result
 */
export function createMockAudioAnalysis(): AudioAnalysis {
  return {
    volume: {
      average: 0.5,
      peak: 0.8,
      min: 0.1,
      max: 0.8,
    },
    frequency: {
      dominant: 440,
      spectrum: [],
    },
    silentSegments: [],
    clippingSegments: [],
    hasAudio: true,
    duration: 120,
  }
}

/**
 * Create a mock XState Actor for tests
 */
export function createMockActor(state: any, send: any = vi.fn()) {
  return {
    getSnapshot: () => state,
    send,
    subscribe: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    getPersistedSnapshot: vi.fn(),
    [Symbol.observable]: vi.fn(),
    can: vi.fn(),
    system: {} as any,
    src: "test",
    id: "test-actor",
    sessionId: "test-session",
  }
}