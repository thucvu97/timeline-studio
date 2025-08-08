/**
 * AI Intelligence Types for AI Services Domain
 *
 * Перенесено из src/features/ai-content-intelligence/shared/types/
 */

import {
  AdaptedContent,
  AIConfig,
  GeneratedScript,
  IntelligentContent,
  PlatformId,
  ProcessingError,
  ProcessingStep,
  ScriptGenerationParams,
  UnifiedContentAnalysis,
} from "../../../features/ai-content-intelligence/shared/types"

// Re-export all AI intelligence types from original location
export type {
  AIConfig,
  IntelligentContent,
  PipelineProgress,
  ProcessingError,
  ProcessingStep,
} from "../../../features/ai-content-intelligence/shared/types"

export { ProcessingStatus } from "../../../features/ai-content-intelligence/shared/types"

export type { UnifiedContentAnalysis } from "../../../features/ai-content-intelligence/shared/types/content-analysis"

export {
  ContentType,
  Emotion,
} from "../../../features/ai-content-intelligence/shared/types/content-analysis"

export type {
  AdaptedContent,
  PlatformId,
} from "../../../features/ai-content-intelligence/shared/types/platform-adaptation"

export type {
  GeneratedScript,
  ScriptGenerationParams,
} from "../../../features/ai-content-intelligence/shared/types/script-generation"

export {
  NarrativeType,
  PaceType,
} from "../../../features/ai-content-intelligence/shared/types/script-generation"

// Machine-specific types
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

// Temporary types (will be replaced with domain contracts)
export interface MediaFile {
  path: string
  name: string
  size?: number
}

export interface ProcessedMoment {
  id: string
  timestamp: number
  duration: number
  type: string
  score: number
  description: string
  thumbnail?: string
  tags: string[]
}

export interface ContentClassification {
  primary: any
  secondary: any[]
  confidence: number
  tags: string[]
  warnings?: string[]
}

// ContentInsights interface (missing from original)
export interface ContentInsights {
  summary: string
  highlights: string[]
  suggestions: string[]
  warnings: string[]
  opportunities: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  marketingAngles: string[]
  targetDemographics: string[]
}

// Re-exports for backward compatibility
export type { AIConfig as LegacyAIConfig }
export type { IntelligentContent as LegacyIntelligentContent }
export type { UnifiedContentAnalysis as LegacyUnifiedContentAnalysis }
