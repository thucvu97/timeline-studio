/**
 * AI Intelligence State Machine
 * Управление состоянием AI Content Intelligence через XState
 */

import { assign, emit, fromPromise, setup } from "xstate"
import type { AIConfig, IntelligentContent, PipelineProgress, ProcessingError, ProcessingStep } from "../types"
import { ProcessingStatus } from "../types"
import type { ContentInsights, UnifiedContentAnalysis } from "../types/content-analysis"
import { ContentType, Emotion } from "../types/content-analysis"
import type { AdaptedContent, PlatformId } from "../types/platform-adaptation"
import type { GeneratedScript, ScriptGenerationParams } from "../types/script-generation"
import { NarrativeType, PaceType } from "../types/script-generation"
import {
  getAIService,
  getFFmpegService,
  type IFFmpegAnalysisService,
  type IUnifiedAIService,
} from "./media-analysis-interface"

// Context типы
export interface AIIntelligenceContext {
  // Конфигурация
  config: AIConfig

  // Данные
  mediaFiles: MediaFile[]
  analysis?: UnifiedContentAnalysis
  script?: GeneratedScript
  moments?: ProcessedMoment[]
  classification?: ContentClassification
  platformContent?: AdaptedContent[]

  // Состояние обработки
  currentStep: string
  steps: ProcessingStep[]
  progress: number
  errors: ProcessingError[]

  // Результат
  result?: IntelligentContent
}

// Event типы
export type AIIntelligenceEvent =
  | { type: "START_ANALYSIS"; mediaFiles: MediaFile[]; config: AIConfig }
  | { type: "ANALYSIS_COMPLETE"; analysis: UnifiedContentAnalysis }
  | { type: "ANALYSIS_FAILED"; error: Error }
  | { type: "START_SCRIPT_GENERATION"; params: ScriptGenerationParams }
  | { type: "SCRIPT_GENERATED"; script: GeneratedScript }
  | { type: "SCRIPT_GENERATION_FAILED"; error: Error }
  | { type: "START_PLATFORM_ADAPTATION"; platforms: PlatformId[] }
  | { type: "PLATFORM_ADAPTATION_COMPLETE"; content: AdaptedContent[] }
  | { type: "PLATFORM_ADAPTATION_FAILED"; error: Error }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "CANCEL" }
  | { type: "RESET" }
  | { type: "UPDATE_PROGRESS"; step: string; progress: number }

// Вспомогательные типы
interface MediaFile {
  path: string
  name: string
  size?: number
}

interface ProcessedMoment {
  id: string
  timestamp: number
  duration: number
  type: string
  score: number
  description: string
  thumbnail?: string
  tags: string[]
}

interface ContentClassification {
  primary: any
  secondary: any[]
  confidence: number
  tags: string[]
  warnings?: string[]
}

// Actors
const analyzeContentActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      mediaFiles: MediaFile[]
      config: AIConfig
      ffmpegService: IFFmpegAnalysisService
      aiService: IUnifiedAIService
    }
  }) => {
    const { mediaFiles, ffmpegService, aiService } = input

    // Базовый анализ через FFmpeg
    const ffmpegAnalysis = await performFFmpegAnalysis(mediaFiles[0], ffmpegService)

    // AI анализ
    const aiAnalysis = await performAIAnalysis(ffmpegAnalysis, mediaFiles[0], aiService)

    // Объединение результатов
    const unifiedAnalysis: UnifiedContentAnalysis = {
      mediaFile: {
        path: mediaFiles[0].path,
        name: mediaFiles[0].name,
        filename: mediaFiles[0].name,
        size: mediaFiles[0].size || 0,
        format: ffmpegAnalysis.metadata.format,
        duration: ffmpegAnalysis.metadata.duration,
      },
      scenes: aiAnalysis.scenes || [],
      keyMoments: aiAnalysis.keyMoments || [],
      contentType: aiAnalysis.contentType || ContentType.NARRATIVE,
      genres: aiAnalysis.genres || [],
      mood: aiAnalysis.mood || { primary: Emotion.CALM, intensity: 0.5 },
      targetAudience: aiAnalysis.targetAudience || {
        ageRange: { min: 18, max: 65 },
        interests: [],
        demographics: { primary: "general" },
      },
      technicalSpecs: {
        resolution: {
          width: ffmpegAnalysis.metadata.width,
          height: ffmpegAnalysis.metadata.height,
          aspectRatio: `${ffmpegAnalysis.metadata.width}:${ffmpegAnalysis.metadata.height}`,
        },
        frameRate: ffmpegAnalysis.metadata.fps,
        bitrate: ffmpegAnalysis.metadata.bitrate,
        codec: ffmpegAnalysis.metadata.codec,
        audioChannels: ffmpegAnalysis.metadata.audioChannels || 2,
        audioCodec: ffmpegAnalysis.metadata.audioCodec || "unknown",
        audioBitrate: 0,
        duration: ffmpegAnalysis.metadata.duration,
      },
      qualityMetrics: ffmpegAnalysis.quality || {
        overall: 75,
        sharpness: 80,
        brightness: 70,
        contrast: 75,
        saturation: 70,
        stability: 85,
        noise: 20,
      },
      detections: {
        objects: [],
        faces: [],
        text: [],
        audio: {
          speech: [],
          music: [],
          soundEffects: [],
          silence: ffmpegAnalysis.silence?.silences || [],
        },
        scenes: (ffmpegAnalysis.scenes?.scenes || []).map((s: any, idx: number) => ({
          ...s,
          sceneNumber: idx + 1,
          duration: s.endTime - s.startTime,
          changeScore: s.confidence || 0.5,
        })),
      },
      insights: {
        strengths: aiAnalysis.insights?.strengths || [],
        improvements: aiAnalysis.insights?.improvements || [],
        recommendations: aiAnalysis.insights?.recommendations || [],
      } as ContentInsights,
    }

    return unifiedAnalysis
  },
)

const generateScriptActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      analysis: UnifiedContentAnalysis
      params: ScriptGenerationParams
      aiService: IUnifiedAIService
    }
  }) => {
    const { analysis, params } = input

    // Временная заглушка для генерации сценария
    const script: GeneratedScript = {
      id: `script-${Date.now()}`,
      title: "Generated Script",
      genre: params.genre || [],
      duration: analysis.technicalSpecs.duration,
      structure: {
        type: params.narrativeStructure || NarrativeType.THREE_ACT,
        acts: [],
        turningPoints: [],
      },
      scenes: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        language: "en",
        tone: params.tone || { primary: Emotion.CALM, intensity: 0.5 },
        pacing: { overall: PaceType.MODERATE, variations: [] },
        style: params.style,
      },
    }

    return script
  },
)

const adaptForPlatformsActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      analysis: UnifiedContentAnalysis
      script?: GeneratedScript
      platforms: PlatformId[]
      aiService: IUnifiedAIService
    }
  }) => {
    const { platforms } = input

    // Временная заглушка для адаптации
    const adaptations: AdaptedContent[] = platforms.map((platform) => ({
      id: `adapted-${platform}-${Date.now()}`,
      platform,
      originalContent: {
        sceneIds: [],
        duration: 60,
      },
      adaptations: {
        video: {
          resolution: { width: 1920, height: 1080, preferred: true },
          aspectRatio: { ratio: "16:9", width: 16, height: 9, preferred: true },
          frameRate: 30,
          codec: "h264",
          bitrate: 5000000,
        },
        audio: {
          volume: [],
          compression: { threshold: -20, ratio: 4, attack: 5, release: 50 },
          normalization: true,
          enhancements: [],
        },
        text: {
          title: { text: "Title", language: "en", characterCount: 5 },
          description: {
            text: "Description",
            language: "en",
            characterCount: 11,
          },
          captions: {
            enabled: false,
            style: {} as any,
            language: "en",
            content: [],
          },
          hashtags: [],
          mentions: [],
        },
        graphics: {
          overlays: [],
        },
        timing: {
          cuts: [],
          speed: [],
        },
      },
      metadata: {
        createdAt: new Date(),
        language: "en",
        tags: [],
      },
    }))

    return adaptations
  },
)

// Guards
const hasScriptGenerationEnabled = ({ context }: { context: AIIntelligenceContext }) => {
  return context.config.features.scriptGeneration
}

const hasPlatformAdaptationEnabled = ({ context }: { context: AIIntelligenceContext }) => {
  return context.config.features.multiPlatform
}

// Actions
const updateProgress = assign({
  progress: ({ context, event }: { context: AIIntelligenceContext; event: AIIntelligenceEvent }) => {
    if (event.type === "UPDATE_PROGRESS") {
      return event.progress
    }
    return context.progress
  },
  currentStep: ({ context, event }: { context: AIIntelligenceContext; event: AIIntelligenceEvent }) => {
    if (event.type === "UPDATE_PROGRESS") {
      return event.step
    }
    return context.currentStep
  },
})

const addProcessingStep = assign({
  steps: ({ context }: { context: AIIntelligenceContext }, params: any) => [
    ...context.steps,
    {
      name: params.name,
      status: ProcessingStatus.RUNNING,
      startTime: new Date(),
    },
  ],
})

const completeProcessingStep = assign({
  steps: ({ context }: { context: AIIntelligenceContext }, params: { name: string }) => {
    return context.steps.map((step) =>
      step.name === params.name ? { ...step, status: ProcessingStatus.COMPLETED, endTime: new Date() } : step,
    )
  },
})

const addError = assign({
  errors: ({ context }: { context: AIIntelligenceContext }, params: any) => [
    ...context.errors,
    {
      step: params.step,
      code: params.code || "UNKNOWN_ERROR",
      message: params.message,
      details: params.details,
      timestamp: new Date(),
    },
  ],
})

// Машина состояний
export const aiIntelligenceMachine = setup({
  types: {} as {
    context: AIIntelligenceContext
    events: AIIntelligenceEvent
  },
  actors: {
    analyzeContentActor,
    generateScriptActor,
    adaptForPlatformsActor,
  },
  actions: {
    updateProgress: updateProgress as any,
    addProcessingStep: addProcessingStep as any,
    completeProcessingStep: completeProcessingStep as any,
    addError: addError as any,

    initializeContext: assign({
      mediaFiles: ({ event }) => (event.type === "START_ANALYSIS" ? event.mediaFiles : []),
      config: ({ event }) => (event.type === "START_ANALYSIS" ? event.config : ({} as AIConfig)),
      steps: () => [],
      errors: () => [],
      progress: () => 0,
      currentStep: () => "initializing",
    }),

    saveAnalysis: assign({
      analysis: ({ event }) => (event.type === "ANALYSIS_COMPLETE" ? event.analysis : undefined),
    }),

    saveScript: assign({
      script: ({ event }) => (event.type === "SCRIPT_GENERATED" ? event.script : undefined),
    }),

    savePlatformContent: assign({
      platformContent: ({ event }) => (event.type === "PLATFORM_ADAPTATION_COMPLETE" ? event.content : undefined),
    }),

    prepareResult: assign({
      result: ({ context }) => {
        const result: IntelligentContent = {
          id: `intelligent-content-${Date.now()}`,
          projectId: `project-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          analysis: context.analysis!,
          script: context.script,
          moments: context.moments || [],
          classification: context.classification || {
            primary: { category: "unknown", confidence: 0 },
            secondary: [],
            confidence: 0,
            tags: [],
          },
          platformContent: context.platformContent,
          metadata: {
            startTime: context.steps[0]?.startTime || new Date(),
            endTime: new Date(),
            duration: Date.now() - (context.steps[0]?.startTime?.getTime() || Date.now()),
            config: context.config,
            steps: context.steps,
            resources: {
              cpuUsage: 0,
              memoryUsage: 0,
              apiCalls: [],
              cacheHits: 0,
              cacheMisses: 0,
            },
            errors: context.errors.length > 0 ? context.errors : undefined,
          },
        }
        return result
      },
    }),

    emitProgress: emit(({ context }) => ({
      type: "progress.update" as const,
      progress: calculatePipelineProgress(context),
    })),

    emitComplete: emit(({ context }) => ({
      type: "processing.complete" as const,
      result: context.result,
    })),

    emitError: emit(({ context }) => ({
      type: "processing.error" as const,
      errors: context.errors,
    })),
  },
  guards: {
    hasScriptGenerationEnabled,
    hasPlatformAdaptationEnabled,
  },
}).createMachine({
  id: "aiIntelligence",
  initial: "idle",
  context: {
    config: {} as AIConfig,
    mediaFiles: [],
    currentStep: "",
    steps: [],
    progress: 0,
    errors: [],
  },
  states: {
    idle: {
      on: {
        START_ANALYSIS: {
          target: "analyzing",
          actions: ["initializeContext"],
        },
      },
    },

    analyzing: {
      entry: [{ type: "addProcessingStep", params: { name: "content_analysis" } }, "emitProgress"],
      invoke: {
        id: "analyzeContent",
        src: "analyzeContentActor",
        input: ({ context }) => ({
          mediaFiles: context.mediaFiles,
          config: context.config,
          ffmpegService: getFFmpegService(),
          aiService: getAIService(),
        }),
        onDone: {
          target: "analysisComplete",
          actions: [
            {
              type: "completeProcessingStep",
              params: { name: "content_analysis" },
            },
            assign({
              analysis: ({ event }) => event.output,
            }),
            "emitProgress",
          ],
        },
        onError: {
          target: "error",
          actions: [
            {
              type: "addError",
              params: ({ event }: any) => ({
                step: "content_analysis",
                code: "ANALYSIS_FAILED",
                message: event.error.message,
                details: event.error,
              }),
            },
            "emitError",
          ],
        },
      },
      on: {
        PAUSE: "paused",
        CANCEL: "cancelled",
      },
    },

    analysisComplete: {
      always: [
        {
          target: "generatingScript",
          guard: "hasScriptGenerationEnabled",
        },
        {
          target: "adaptingForPlatforms",
          guard: "hasPlatformAdaptationEnabled",
        },
        {
          target: "complete",
        },
      ],
    },

    generatingScript: {
      entry: [{ type: "addProcessingStep", params: { name: "script_generation" } }, "emitProgress"],
      invoke: {
        id: "generateScript",
        src: "generateScriptActor",
        input: ({ context }) => ({
          analysis: context.analysis!,
          params:
            context.config.scriptParams ||
            ({
              style: {
                visual: "cinematic" as any,
                narrative: "standard" as any,
                editing: "continuous" as any,
              },
              genre: [],
              tone: { primary: Emotion.CALM, intensity: 0.5 },
            } as ScriptGenerationParams),
          aiService: getAIService(),
        }),
        onDone: {
          target: "scriptGenerated",
          actions: [
            {
              type: "completeProcessingStep",
              params: { name: "script_generation" },
            },
            assign({
              script: ({ event }) => event.output,
            }),
            "emitProgress",
          ],
        },
        onError: {
          target: "error",
          actions: [
            {
              type: "addError",
              params: ({ event }: any) => ({
                step: "script_generation",
                code: "SCRIPT_GENERATION_FAILED",
                message: event.error.message,
                details: event.error,
              }),
            },
            "emitError",
          ],
        },
      },
      on: {
        PAUSE: "paused",
        CANCEL: "cancelled",
      },
    },

    scriptGenerated: {
      always: [
        {
          target: "adaptingForPlatforms",
          guard: "hasPlatformAdaptationEnabled",
        },
        {
          target: "complete",
        },
      ],
    },

    adaptingForPlatforms: {
      entry: [{ type: "addProcessingStep", params: { name: "platform_adaptation" } }, "emitProgress"],
      invoke: {
        id: "adaptForPlatforms",
        src: "adaptForPlatformsActor",
        input: ({ context }) => ({
          analysis: context.analysis!,
          script: context.script,
          platforms: context.config.platforms || [],
          aiService: getAIService(),
        }),
        onDone: {
          target: "complete",
          actions: [
            {
              type: "completeProcessingStep",
              params: { name: "platform_adaptation" },
            },
            assign({
              platformContent: ({ event }) => event.output,
            }),
            "emitProgress",
          ],
        },
        onError: {
          target: "error",
          actions: [
            {
              type: "addError",
              params: ({ event }: any) => ({
                step: "platform_adaptation",
                code: "PLATFORM_ADAPTATION_FAILED",
                message: event.error.message,
                details: event.error,
              }),
            },
            "emitError",
          ],
        },
      },
      on: {
        PAUSE: "paused",
        CANCEL: "cancelled",
      },
    },

    paused: {
      entry: "emitProgress",
      on: {
        RESUME: [
          {
            target: "analyzing",
            guard: ({ context }) => context.currentStep === "content_analysis",
          },
          {
            target: "generatingScript",
            guard: ({ context }) => context.currentStep === "script_generation",
          },
          {
            target: "adaptingForPlatforms",
            guard: ({ context }) => context.currentStep === "platform_adaptation",
          },
        ],
        CANCEL: "cancelled",
      },
    },

    complete: {
      entry: ["prepareResult", "emitComplete", "emitProgress"],
      type: "final",
    },

    cancelled: {
      entry: [
        {
          type: "addError",
          params: {
            step: "pipeline",
            code: "CANCELLED",
            message: "Processing was cancelled by user",
          },
        },
        "emitError",
      ],
      type: "final",
    },

    error: {
      entry: "emitError",
      type: "final",
    },
  },
  on: {
    RESET: {
      target: ".idle",
      actions: assign({
        mediaFiles: () => [],
        analysis: () => undefined,
        script: () => undefined,
        platformContent: () => undefined,
        moments: () => undefined,
        classification: () => undefined,
        currentStep: () => "",
        steps: () => [],
        progress: () => 0,
        errors: () => [],
        result: () => undefined,
      }),
    },
  },
})

// Вспомогательные функции
async function performFFmpegAnalysis(mediaFile: MediaFile, ffmpegService: IFFmpegAnalysisService) {
  const [metadata, scenes, quality, silence, motion] = await Promise.all([
    ffmpegService.getVideoMetadata(mediaFile.path),
    ffmpegService.detectScenes(mediaFile.path),
    ffmpegService.analyzeQuality(mediaFile.path),
    ffmpegService.detectSilence(mediaFile.path),
    ffmpegService.analyzeMotion(mediaFile.path),
  ])

  return { metadata, scenes, quality, silence, motion }
}

async function performAIAnalysis(_ffmpegResults: any, _mediaFile: MediaFile, _aiService: IUnifiedAIService) {
  // Временная заглушка - в реальности здесь будет вызов AI
  return {
    scenes: [],
    keyMoments: [],
    contentType: ContentType.NARRATIVE,
    genres: [],
    mood: { primary: Emotion.CALM, intensity: 0.5 },
    targetAudience: {
      ageRange: { min: 18, max: 65 },
      interests: [],
      demographics: { primary: "general" },
    },
    insights: {
      summary: "Analysis completed",
      highlights: [],
      suggestions: [],
      warnings: [],
      opportunities: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      marketingAngles: [],
      targetDemographics: [],
    },
  }
}

function calculatePipelineProgress(context: AIIntelligenceContext): PipelineProgress {
  const totalSteps = context.steps.length
  const completedSteps = context.steps.filter((s) => s.status === ProcessingStatus.COMPLETED).length
  const overall = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return {
    overall,
    currentStep: context.currentStep,
    steps: context.steps.map((step) => ({
      name: step.name,
      progress: step.status === ProcessingStatus.COMPLETED ? 100 : step.status === ProcessingStatus.RUNNING ? 50 : 0,
      status: step.status,
    })),
    messages: [],
  }
}
