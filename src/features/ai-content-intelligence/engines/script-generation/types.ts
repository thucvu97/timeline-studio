/**
 * Типы для Script Generation Engine
 */

import type { ContentType, SceneAnalysis } from "../../shared/types/content-analysis"
import type { Character, GeneratedScript, NarrativeType } from "../../shared/types/script-generation"

export interface ScriptGenerationConfig {
  // AI настройки
  ai: {
    model: string
    temperature: number
    maxTokens: number
    enableStreaming: boolean
  }

  // Настройки генерации
  generation: {
    includeSceneDescriptions: boolean
    includeVisualCues: boolean
    includeAudioCues: boolean
    includeTransitions: boolean
    generateDialogue: boolean
    generateVoiceover: boolean
    adaptToSceneAnalysis: boolean
  }

  // Настройки структуры
  structure: {
    defaultNarrativeType: NarrativeType
    minSceneLength: number // секунды
    maxSceneLength: number // секунды
    targetPacing: "slow" | "medium" | "fast"
  }

  // Настройки языка
  language: {
    primaryLanguage: string
    tone: "formal" | "casual" | "professional" | "creative"
    vocabulary: "simple" | "standard" | "advanced"
  }
}

export interface ScriptGenerationContext {
  analysis: SceneAnalysis[]
  metadata: VideoContextMetadata
  userPrompt?: string
  references?: ScriptReference[]
  constraints?: ScriptConstraints
}

// VideoMetadata импортируется из общих типов
export interface VideoContextMetadata {
  duration: number
  title?: string
  description?: string
  tags?: string[]
  location?: string
  date?: Date
}

export interface ScriptReference {
  type: "style" | "structure" | "tone" | "example"
  content: string
  weight: number // 0-1, важность референса
}

export interface ScriptConstraints {
  maxDuration?: number
  minDuration?: number
  requiredElements?: RequiredElement[]
  forbiddenElements?: string[]
  targetAudience?: string
}

export interface RequiredElement {
  type: "intro" | "outro" | "cta" | "branding" | "custom"
  description: string
  placement?: "beginning" | "middle" | "end" | "any"
  duration?: number
}

// ScriptTemplate is imported from shared types

export interface TemplateStructure {
  sections: TemplateSection[]
  totalDuration?: number
  flexibility: "rigid" | "flexible" | "adaptive"
}

export interface TemplateSection {
  id: string
  type: SectionType
  name: string
  description: string
  durationPercentage?: number
  minDuration?: number
  maxDuration?: number
  content: SectionContent[]
  optional: boolean
}

export enum SectionType {
  INTRO = "intro",
  HOOK = "hook",
  MAIN_CONTENT = "main_content",
  TRANSITION = "transition",
  CLIMAX = "climax",
  RESOLUTION = "resolution",
  OUTRO = "outro",
  CTA = "cta",
}

export interface SectionContent {
  type: ContentType
  template: string
  variables?: string[]
  conditions?: ContentCondition[]
}

// ContentType is imported from shared types

export interface ContentCondition {
  type: "scene_type" | "duration" | "mood" | "custom"
  operator: "equals" | "contains" | "greater_than" | "less_than"
  value: any
}

export interface TemplateVariable {
  name: string
  type: "string" | "number" | "boolean" | "array" | "object"
  description: string
  required: boolean
  defaultValue?: any
  validation?: VariableValidation
}

export interface VariableValidation {
  pattern?: string
  min?: number
  max?: number
  enum?: any[]
}

export interface DialogueGenerationParams {
  characters: Character[] // Using Character from shared types
  scene: SceneContext
  style: DialogueStyle
  constraints?: DialogueConstraints
}

// Character is imported from shared types
// Using CharacterProfile for engine-specific character info
export interface CharacterProfile {
  id: string
  name: string
  role: string
  personality?: string
  speakingStyle?: string
  background?: string
}

export interface SceneContext {
  location: string
  timeOfDay: string
  mood: string
  action: string
  previousDialogue?: string
}

export interface DialogueStyle {
  tone: "dramatic" | "comedic" | "serious" | "casual" | "poetic"
  pacing: "slow" | "medium" | "fast"
  naturalism: number // 0-1, насколько естественный диалог
  subtext: boolean
}

export interface DialogueConstraints {
  maxLength?: number
  minLength?: number
  requiredTopics?: string[]
  avoidTopics?: string[]
  mustInclude?: string[]
}

export interface ScriptGenerationResult extends GeneratedScript {
  quality: ScriptQuality
  alternatives?: ScriptAlternative[]
  improvements?: ScriptImprovement[]
}

export interface ScriptQuality {
  overall: number // 0-1
  structure: number
  pacing: number
  coherence: number
  creativity: number
  audienceAppeal: number
}

export interface ScriptAlternative {
  id: string
  type: "variation" | "different_style" | "different_structure"
  description: string
  preview: string
  differences: string[]
}

export interface ScriptImprovement {
  type: ImprovementType
  description: string
  impact: "low" | "medium" | "high"
  implementation: string
}

export enum ImprovementType {
  PACING = "pacing",
  DIALOGUE = "dialogue",
  STRUCTURE = "structure",
  VISUAL = "visual",
  AUDIO = "audio",
  ENGAGEMENT = "engagement",
}
