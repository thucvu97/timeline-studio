/**
 * XState machine for Smart Montage Planner
 * Manages the state of video analysis, plan generation, and optimization
 */

import { invoke } from "@tauri-apps/api/core"
import { assign, setup } from "xstate"

import type { MediaFile } from "@/features/media/types/media"

import {
  type AnalysisOptions,
  AnalysisPhase,
  type AnalysisProgress,
  type AudioAnalysis,
  type Fragment,
  type MomentScore,
  type MontagePlan,
  type PlanGenerationOptions,
  type PlanStatistics,
  type PlanValidation,
  type VideoAnalysis,
} from "../types"

// Machine context
export interface MontagePlannerContext {
  // Input data
  videoIds: string[]
  mediaFiles: Map<string, MediaFile>
  instructions: string
  selectedStyle: string
  targetDuration?: number
  analysisOptions: AnalysisOptions
  generationOptions: PlanGenerationOptions

  // Analysis results
  videoAnalyses: Map<string, VideoAnalysis>
  audioAnalyses: Map<string, AudioAnalysis>
  fragments: Fragment[]
  momentScores: MomentScore[]

  // Generated plan
  currentPlan: MontagePlan | null
  planHistory: MontagePlan[]
  planStatistics: PlanStatistics | null
  planValidation: PlanValidation | null

  // Progress and state
  progress: AnalysisProgress
  isAnalyzing: boolean
  isGenerating: boolean
  isOptimizing: boolean
  error: string | null
}

// Machine events
export type MontagePlannerEvent =
  | { type: "ADD_VIDEO"; videoId: string; file: MediaFile }
  | { type: "REMOVE_VIDEO"; videoId: string }
  | { type: "UPDATE_INSTRUCTIONS"; instructions: string }
  | { type: "SELECT_STYLE"; styleId: string }
  | { type: "SET_TARGET_DURATION"; duration: number }
  | { type: "UPDATE_ANALYSIS_OPTIONS"; options: Partial<AnalysisOptions> }
  | { type: "UPDATE_GENERATION_OPTIONS"; options: Partial<PlanGenerationOptions> }
  | { type: "START_ANALYSIS" }
  | { type: "CANCEL_ANALYSIS" }
  | { type: "ANALYSIS_PROGRESS"; progress: AnalysisProgress }
  | { type: "VIDEO_ANALYZED"; videoId: string; analysis: VideoAnalysis }
  | { type: "AUDIO_ANALYZED"; videoId: string; analysis: AudioAnalysis }
  | { type: "FRAGMENTS_DETECTED"; fragments: Fragment[] }
  | { type: "MOMENTS_SCORED"; scores: MomentScore[] }
  | { type: "ANALYSIS_COMPLETE"; fragments: Fragment[]; videoAnalysis: any; audioAnalysis: any }
  | { type: "GENERATE_PLAN" }
  | { type: "PLAN_GENERATED"; plan: MontagePlan }
  | { type: "GENERATION_COMPLETE"; plan: MontagePlan }
  | { type: "OPTIMIZE_PLAN" }
  | { type: "PLAN_OPTIMIZED"; plan: MontagePlan }
  | { type: "OPTIMIZATION_COMPLETE"; plan: MontagePlan }
  | { type: "VALIDATE_PLAN" }
  | { type: "PLAN_VALIDATED"; validation: PlanValidation }
  | { type: "VALIDATION_COMPLETE"; validation: PlanValidation }
  | { type: "CALCULATE_STATISTICS" }
  | { type: "STATISTICS_CALCULATED"; statistics: PlanStatistics }
  | { type: "APPLY_PLAN_TO_TIMELINE" }
  | { type: "EXPORT_PLAN"; format: string }
  | { type: "EDIT_FRAGMENT"; fragmentId: string; updates: Partial<Fragment> }
  | { type: "REORDER_FRAGMENTS"; sourceIndex: number; targetIndex: number }
  | { type: "ERROR"; message: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" }

// Machine definition
export const montagePlannerMachine = setup({
  types: {
    context: {} as MontagePlannerContext,
    events: {} as MontagePlannerEvent,
  },
  actions: {
    // Input management
    addVideo: assign({
      videoIds: ({ context, event }) => {
        if (event.type !== "ADD_VIDEO") return context.videoIds
        if (context.videoIds.includes(event.videoId)) return context.videoIds
        return [...context.videoIds, event.videoId]
      },
      mediaFiles: ({ context, event }) => {
        if (event.type !== "ADD_VIDEO") return context.mediaFiles
        if (context.mediaFiles.has(event.videoId)) return context.mediaFiles
        const newMap = new Map(context.mediaFiles)
        newMap.set(event.videoId, event.file)
        return newMap
      },
    }),

    removeVideo: assign({
      videoIds: ({ context, event }) => {
        if (event.type !== "REMOVE_VIDEO") return context.videoIds
        return context.videoIds.filter((id) => id !== event.videoId)
      },
      mediaFiles: ({ context, event }) => {
        if (event.type !== "REMOVE_VIDEO") return context.mediaFiles
        const newMap = new Map(context.mediaFiles)
        newMap.delete(event.videoId)
        return newMap
      },
    }),

    updateInstructions: assign({
      instructions: ({ event }) => (event.type === "UPDATE_INSTRUCTIONS" ? event.instructions : ""),
    }),

    selectStyle: assign({
      selectedStyle: ({ event }) => (event.type === "SELECT_STYLE" ? event.styleId : ""),
    }),

    setTargetDuration: assign({
      targetDuration: ({ event }) => (event.type === "SET_TARGET_DURATION" ? event.duration : undefined),
    }),

    updateAnalysisOptions: assign({
      analysisOptions: ({ context, event }) => {
        if (event.type !== "UPDATE_ANALYSIS_OPTIONS") return context.analysisOptions
        return { ...context.analysisOptions, ...event.options }
      },
    }),

    updateGenerationOptions: assign({
      generationOptions: ({ context, event }) => {
        if (event.type !== "UPDATE_GENERATION_OPTIONS") return context.generationOptions
        return { ...context.generationOptions, ...event.options }
      },
    }),

    // Analysis actions
    startAnalysis: assign({
      isAnalyzing: true,
      error: null,
      progress: {
        phase: AnalysisPhase.Initializing,
        progress: 0,
      },
    }),

    stopAnalysis: assign({
      isAnalyzing: false,
    }),

    updateProgress: assign({
      progress: ({ event }) =>
        event.type === "ANALYSIS_PROGRESS" ? event.progress : { phase: AnalysisPhase.Initializing, progress: 0 },
    }),

    storeVideoAnalysis: assign({
      videoAnalyses: ({ context, event }) => {
        if (event.type !== "VIDEO_ANALYZED") return context.videoAnalyses
        const newMap = new Map(context.videoAnalyses)
        newMap.set(event.videoId, event.analysis)
        return newMap
      },
    }),

    storeAudioAnalysis: assign({
      audioAnalyses: ({ context, event }) => {
        if (event.type !== "AUDIO_ANALYZED") return context.audioAnalyses
        const newMap = new Map(context.audioAnalyses)
        newMap.set(event.videoId, event.analysis)
        return newMap
      },
    }),

    storeFragments: assign({
      fragments: ({ event }) => (event.type === "FRAGMENTS_DETECTED" ? event.fragments : []),
    }),

    storeMomentScores: assign({
      momentScores: ({ event }) => (event.type === "MOMENTS_SCORED" ? event.scores : []),
    }),

    // Plan generation actions
    startGeneration: assign({
      isGenerating: true,
      error: null,
    }),

    stopGeneration: assign({
      isGenerating: false,
    }),

    storePlan: assign({
      currentPlan: ({ event }) =>
        event.type === "PLAN_GENERATED" ||
        event.type === "PLAN_OPTIMIZED" ||
        event.type === "GENERATION_COMPLETE" ||
        event.type === "OPTIMIZATION_COMPLETE"
          ? event.plan
          : null,
      planHistory: ({ context, event }) => {
        if (
          event.type === "PLAN_GENERATED" ||
          event.type === "PLAN_OPTIMIZED" ||
          event.type === "GENERATION_COMPLETE" ||
          event.type === "OPTIMIZATION_COMPLETE"
        ) {
          return [...context.planHistory, event.plan]
        }
        return context.planHistory
      },
    }),

    // Optimization actions
    startOptimization: assign({
      isOptimizing: true,
      error: null,
    }),

    stopOptimization: assign({
      isOptimizing: false,
    }),

    // Validation and statistics
    storeValidation: assign({
      planValidation: ({ event }) => (event.type === "PLAN_VALIDATED" ? event.validation : null),
    }),

    storeStatistics: assign({
      planStatistics: ({ event }) => (event.type === "STATISTICS_CALCULATED" ? event.statistics : null),
    }),

    // Fragment editing
    editFragment: assign({
      fragments: ({ context, event }) => {
        if (event.type !== "EDIT_FRAGMENT") return context.fragments
        return context.fragments.map((fragment) =>
          fragment.id === event.fragmentId ? { ...fragment, ...event.updates } : fragment,
        )
      },
    }),

    reorderFragments: assign({
      fragments: ({ context, event }) => {
        if (event.type !== "REORDER_FRAGMENTS") return context.fragments
        const newFragments = [...context.fragments]
        const [removed] = newFragments.splice(event.sourceIndex, 1)
        newFragments.splice(event.targetIndex, 0, removed)
        return newFragments
      },
    }),

    // Error handling
    setError: assign({
      error: ({ event }) => (event.type === "ERROR" ? event.message : null),
    }),

    setInvokeError: assign({
      error: ({ event }) => String(event.error || "Unknown error"),
    }),

    clearError: assign({
      error: null,
    }),

    // Reset
    resetContext: assign({
      videoIds: [],
      mediaFiles: new Map(),
      instructions: "",
      selectedStyle: "dynamic-action",
      targetDuration: undefined,
      videoAnalyses: new Map(),
      audioAnalyses: new Map(),
      fragments: [],
      momentScores: [],
      currentPlan: null,
      planHistory: [],
      planStatistics: null,
      planValidation: null,
      progress: {
        phase: AnalysisPhase.Initializing,
        progress: 0,
      },
      isAnalyzing: false,
      isGenerating: false,
      isOptimizing: false,
      error: null,
    }),
  },
  actors: {
    // Video analysis service
    analyzeVideos: async ({ videoIds, analysisOptions }: any) => {
      try {
        const result = await invoke("analyze_montage_videos", {
          videoIds,
          options: analysisOptions,
        })
        return result
      } catch (error) {
        throw new Error(`Video analysis failed: ${String(error)}`)
      }
    },

    // Plan generation service
    generatePlan: async ({ fragments, generationOptions }: any) => {
      try {
        const plan = await invoke("generate_montage_plan", {
          fragments,
          options: generationOptions,
        })
        return plan
      } catch (error) {
        throw new Error(`Plan generation failed: ${String(error)}`)
      }
    },

    // Plan optimization service
    optimizePlan: async ({ plan, preferences }: any) => {
      try {
        const optimizedPlan = await invoke("optimize_montage_plan", {
          plan,
          preferences,
        })
        return optimizedPlan
      } catch (error) {
        throw new Error(`Plan optimization failed: ${String(error)}`)
      }
    },

    // Validation service
    validatePlan: async ({ plan }: any) => {
      try {
        const validation = await invoke("validate_montage_plan", { plan })
        return validation
      } catch (error) {
        throw new Error(`Plan validation failed: ${String(error)}`)
      }
    },

    // Statistics calculation
    calculateStatistics: async ({ plan }: any) => {
      try {
        const statistics = await invoke("calculate_plan_statistics", { plan })
        return statistics
      } catch (error) {
        throw new Error(`Statistics calculation failed: ${String(error)}`)
      }
    },
  },
}).createMachine({
  id: "montagePlanner",
  initial: "idle",
  context: {
    videoIds: [],
    mediaFiles: new Map(),
    instructions: "",
    selectedStyle: "dynamic-action",
    targetDuration: undefined,
    analysisOptions: {
      videoAnalysis: {
        enableSceneDetection: true,
        enableObjectDetection: true,
        enableFaceDetection: true,
        enableMotionAnalysis: true,
        sampleRate: 1, // 1 fps
      },
      audioAnalysis: {
        enableSpeechDetection: true,
        enableMusicAnalysis: true,
        enableSilenceDetection: true,
        enableEmotionDetection: false,
      },
      momentDetection: {
        threshold: 0.7,
        minDuration: 1,
      },
    },
    generationOptions: {
      style: "dynamic-action",
    },
    videoAnalyses: new Map(),
    audioAnalyses: new Map(),
    fragments: [],
    momentScores: [],
    currentPlan: null,
    planHistory: [],
    planStatistics: null,
    planValidation: null,
    progress: {
      phase: AnalysisPhase.Initializing,
      progress: 0,
    },
    isAnalyzing: false,
    isGenerating: false,
    isOptimizing: false,
    error: null,
  },
  states: {
    idle: {
      on: {
        ADD_VIDEO: {
          actions: "addVideo",
        },
        REMOVE_VIDEO: {
          actions: "removeVideo",
        },
        UPDATE_INSTRUCTIONS: {
          actions: "updateInstructions",
        },
        SELECT_STYLE: {
          actions: "selectStyle",
        },
        SET_TARGET_DURATION: {
          actions: "setTargetDuration",
        },
        UPDATE_ANALYSIS_OPTIONS: {
          actions: "updateAnalysisOptions",
        },
        UPDATE_GENERATION_OPTIONS: {
          actions: "updateGenerationOptions",
        },
        START_ANALYSIS: {
          target: "analyzing",
          guard: ({ context }) => context.videoIds.length > 0,
        },
        GENERATE_PLAN: {
          target: "generating",
          guard: ({ context }) => context.fragments.length > 0,
        },
        OPTIMIZE_PLAN: {
          target: "optimizing",
          guard: ({ context }) => context.currentPlan !== null,
        },
        EDIT_FRAGMENT: {
          actions: "editFragment",
        },
        REORDER_FRAGMENTS: {
          actions: "reorderFragments",
        },
        RESET: {
          actions: "resetContext",
        },
        ANALYSIS_PROGRESS: {
          actions: "updateProgress",
        },
        FRAGMENTS_DETECTED: {
          actions: "storeFragments",
        },
        VIDEO_ANALYZED: {
          actions: "storeVideoAnalysis",
        },
        AUDIO_ANALYZED: {
          actions: "storeAudioAnalysis",
        },
        MOMENTS_SCORED: {
          actions: "storeMomentScores",
        },
        PLAN_GENERATED: {
          actions: "storePlan",
        },
        PLAN_OPTIMIZED: {
          actions: "storePlan",
        },
        GENERATION_COMPLETE: {
          actions: "storePlan",
        },
        PLAN_VALIDATED: {
          actions: "storeValidation",
        },
        CLEAR_ERROR: {
          actions: "clearError",
        },
        ERROR: {
          actions: "setError",
        },
      },
    },

    analyzing: {
      entry: "startAnalysis",
      exit: "stopAnalysis",
      invoke: {
        src: "analyzeVideos",
        input: ({ context }) => ({
          videoIds: context.videoIds,
          analysisOptions: context.analysisOptions,
        }),
        onDone: {
          target: "idle",
          actions: [
            ({ event }) => {
              // Store analysis results
              const { videoAnalyses, audioAnalyses, fragments, momentScores } = event.output
              return [
                { type: "VIDEO_ANALYZED", videoId: "all", analysis: videoAnalyses },
                { type: "AUDIO_ANALYZED", videoId: "all", analysis: audioAnalyses },
                { type: "FRAGMENTS_DETECTED", fragments },
                { type: "MOMENTS_SCORED", scores: momentScores },
              ]
            },
          ],
        },
        onError: {
          target: "error",
          actions: ["setInvokeError"],
        },
      },
      on: {
        ANALYSIS_PROGRESS: {
          actions: "updateProgress",
        },
        VIDEO_ANALYZED: {
          actions: "storeVideoAnalysis",
        },
        AUDIO_ANALYZED: {
          actions: "storeAudioAnalysis",
        },
        FRAGMENTS_DETECTED: {
          actions: "storeFragments",
        },
        MOMENTS_SCORED: {
          actions: "storeMomentScores",
        },
        CANCEL_ANALYSIS: {
          target: "idle",
        },
      },
    },

    generating: {
      entry: "startGeneration",
      exit: "stopGeneration",
      invoke: {
        src: "generatePlan",
        input: ({ context }) => ({
          fragments: context.fragments,
          generationOptions: {
            ...context.generationOptions,
            style: context.selectedStyle,
            targetDuration: context.targetDuration,
            instructions: context.instructions,
          },
        }),
        onDone: {
          target: "validating",
          actions: ["storePlan"],
        },
        onError: {
          target: "error",
          actions: ["setInvokeError"],
        },
      },
    },

    validating: {
      invoke: {
        src: "validatePlan",
        input: ({ context }) => ({
          plan: context.currentPlan,
        }),
        onDone: {
          target: "calculating",
          actions: ["storeValidation"],
        },
        onError: {
          target: "error",
          actions: ["setInvokeError"],
        },
      },
    },

    calculating: {
      invoke: {
        src: "calculateStatistics",
        input: ({ context }) => ({
          plan: context.currentPlan,
        }),
        onDone: {
          target: "ready",
          actions: ["storeStatistics"],
        },
        onError: {
          target: "error",
          actions: ["setInvokeError"],
        },
      },
    },

    ready: {
      on: {
        OPTIMIZE_PLAN: {
          target: "optimizing",
        },
        APPLY_PLAN_TO_TIMELINE: {
          actions: async ({ context }) => {
            // Emit event to timeline to apply the plan
            if (context.currentPlan) {
              await invoke("apply_montage_plan", { plan: context.currentPlan })
            }
          },
        },
        EXPORT_PLAN: {
          actions: async ({ context, event }) => {
            if (context.currentPlan && event.type === "EXPORT_PLAN") {
              await invoke("export_montage_plan", {
                plan: context.currentPlan,
                format: event.format,
              })
            }
          },
        },
        EDIT_FRAGMENT: {
          actions: "editFragment",
        },
        REORDER_FRAGMENTS: {
          actions: "reorderFragments",
        },
        GENERATE_PLAN: {
          target: "generating",
        },
        START_ANALYSIS: {
          target: "analyzing",
        },
        RESET: {
          target: "idle",
          actions: "resetContext",
        },
        CLEAR_ERROR: {
          actions: "clearError",
        },
        ERROR: {
          actions: "setError",
        },
      },
    },

    optimizing: {
      entry: "startOptimization",
      exit: "stopOptimization",
      invoke: {
        src: "optimizePlan",
        input: ({ context }) => ({
          plan: context.currentPlan,
          preferences: context.generationOptions.preferences,
        }),
        onDone: {
          target: "validating",
          actions: ["storePlan"],
        },
        onError: {
          target: "error",
          actions: ["setInvokeError"],
        },
      },
    },

    error: {
      on: {
        CLEAR_ERROR: {
          target: "idle",
          actions: "clearError",
        },
        RESET: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
  },
})
