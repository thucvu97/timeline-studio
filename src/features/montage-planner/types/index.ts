/**
 * Types for Smart Montage Planner module
 * Defines structures for montage plans, fragments, and analysis results
 */

import type { VideoEffect } from "@/features/effects/types"
import type { MediaFile } from "@/features/media/types/media"
import type { Transition } from "@/features/transitions/types/transitions"

// Person identification
export interface Person {
  id: string
  name: string
  confidence: number
}

// Fragment represents a segment of video selected for the montage
export interface Fragment {
  id: string
  videoId: string
  sourceFile?: MediaFile
  startTime: number // in seconds
  endTime: number // in seconds
  duration: number
  screenshotPath?: string
  objects: string[] // detected objects from YOLO
  people: Person[] // identified people
  transitionId?: string // ID of transition to apply
  transition?: Transition
  effectId?: string // ID of effect to apply
  effect?: VideoEffect
  score: MomentScore
  tags: string[]
  description?: string
}

// Scoring components for fragment evaluation
export interface MomentScore {
  timestamp: number
  duration: number
  scores: {
    visual: number // 0-100, visual appeal
    technical: number // 0-100, technical quality
    emotional: number // 0-100, emotional impact
    narrative: number // 0-100, narrative value
    action: number // 0-100, action level
    composition: number // 0-100, frame composition
  }
  totalScore: number // 0-100, weighted average
  category: MomentCategory
  weight?: number // 0-1, importance weight for optimization
  rank?: number // 1-n, rank among all moments
}

export enum MomentCategory {
  Highlight = "highlight",
  Transition = "transition",
  BRoll = "b-roll",
  Opening = "opening",
  Closing = "closing",
  Comedy = "comedy",
  Drama = "drama",
  Action = "action",
}

// Video analysis results
export interface VideoAnalysis {
  quality: {
    resolution: { width: number; height: number }
    frameRate: number
    bitrate: number
    sharpness: number // 0-100
    stability: number // 0-100 (camera shake)
    exposure: number // -100 to 100
    colorGrading: number // 0-100 consistency
  }
  content: {
    actionLevel: number // 0-100
    faces: Array<{ box: [number, number, number, number]; confidence: number }>
    objects: Array<{ label: string; confidence: number; box: [number, number, number, number] }>
    sceneType: SceneType
    lighting: LightingCondition
  }
  motion: {
    cameraMovement: CameraMovement
    subjectMovement: number // 0-100
    flowDirection: FlowDirection
    cutFriendliness: number // 0-100
  }
}

export enum SceneType {
  Indoor = "indoor",
  Outdoor = "outdoor",
  Nature = "nature",
  Urban = "urban",
  Studio = "studio",
  Unknown = "unknown",
}

export enum LightingCondition {
  Bright = "bright",
  Normal = "normal",
  Dark = "dark",
  Mixed = "mixed",
}

export enum CameraMovement {
  Static = "static",
  Pan = "pan",
  Tilt = "tilt",
  Zoom = "zoom",
  Dolly = "dolly",
  Handheld = "handheld",
  Mixed = "mixed",
}

export enum FlowDirection {
  LeftToRight = "left-to-right",
  RightToLeft = "right-to-left",
  TopToBottom = "top-to-bottom",
  BottomToTop = "bottom-to-top",
  Center = "center",
  Mixed = "mixed",
}

// Audio analysis results
export interface AudioAnalysis {
  quality: {
    sampleRate: number
    bitDepth: number
    noiseLevel: number // 0-100
    clarity: number // 0-100
    dynamicRange: number // dB
  }
  content: {
    speechPresence: number // 0-100
    musicPresence: number // 0-100
    ambientLevel: number // 0-100
    emotionalTone: EmotionalTone
  }
  music?: {
    tempo: number // BPM
    key?: string
    energy: number // 0-100
    beatMarkers: number[] // timestamps
  }
}

export enum EmotionalTone {
  Happy = "happy",
  Sad = "sad",
  Energetic = "energetic",
  Calm = "calm",
  Tense = "tense",
  Neutral = "neutral",
}

// Montage plan structures
export interface MontagePlan {
  id: string
  name: string
  metadata: PlanMetadata
  sequences: Sequence[]
  totalDuration: number
  style: MontageStyle
  pacing: PacingProfile
  qualityScore: number
  engagementScore: number
  coherenceScore: number
}

export interface PlanMetadata {
  createdAt: Date
  updatedAt: Date
  version: number
  instructions?: string
  targetDuration?: number
  targetPlatform?: TargetPlatform
}

export enum TargetPlatform {
  YouTube = "youtube",
  Instagram = "instagram",
  TikTok = "tiktok",
  Twitter = "twitter",
  Facebook = "facebook",
  General = "general",
}

export interface Sequence {
  id: string
  type: SequenceType
  clips: PlannedClip[]
  duration: number
  purpose: SequencePurpose
  energyLevel: number // 0-100
  emotionalArc: EmotionalCurve
  transitions: TransitionPlan[]
}

export enum SequenceType {
  Intro = "intro",
  Main = "main",
  Climax = "climax",
  Resolution = "resolution",
  Outro = "outro",
  Montage = "montage",
}

export enum SequencePurpose {
  Hook = "hook",
  Exposition = "exposition",
  Development = "development",
  Climax = "climax",
  Resolution = "resolution",
  CallToAction = "call-to-action",
}

export interface PlannedClip {
  fragmentId: string
  fragment?: Fragment
  sequenceOrder: number
  role: ClipRole
  importance: number // 0-100
  adjustments?: ClipAdjustments
  suggestions: ClipSuggestion[]
}

export enum ClipRole {
  Hero = "hero",
  Supporting = "supporting",
  Filler = "filler",
  Transition = "transition",
  Establishing = "establishing",
}

export interface ClipAdjustments {
  speedMultiplier?: number
  colorCorrection?: boolean
  stabilization?: boolean
  crop?: { x: number; y: number; width: number; height: number }
}

export interface ClipSuggestion {
  type: SuggestionType
  description: string
  confidence: number
}

export enum SuggestionType {
  Trim = "trim",
  Effect = "effect",
  Transition = "transition",
  Replace = "replace",
  Remove = "remove",
}

export interface TransitionPlan {
  fromClipId: string
  toClipId: string
  transitionId: string
  duration: number
}

// Rhythm and pacing
export interface RhythmAnalysis {
  globalTempo: number // cuts per minute
  tempoChanges: TempoChange[]
  patterns: RhythmPattern[]
  musicSync: MusicSyncPoint[]
}

export interface TempoChange {
  timestamp: number
  oldTempo: number
  newTempo: number
  reason: TempoChangeReason
  smoothness: number // 0-100
}

export enum TempoChangeReason {
  ActionIncrease = "action_increase",
  EmotionalPeak = "emotional_peak",
  SceneChange = "scene_change",
  MusicChange = "music_change",
  NarrativeShift = "narrative_shift",
}

export interface RhythmPattern {
  type: PatternType
  startTime: number
  endTime: number
  strength: number // 0-100
}

export enum PatternType {
  Regular = "regular",
  Accelerating = "accelerating",
  Decelerating = "decelerating",
  Syncopated = "syncopated",
  Chaotic = "chaotic",
}

export interface MusicSyncPoint {
  timestamp: number
  type: "beat" | "bar" | "phrase" | "drop"
  strength: number // 0-100
}

// Montage styles
export interface MontageStyle {
  id: string
  name: string
  description: string
  cutting: {
    averageShotLength: number // seconds
    variability: number // 0-100
    rhythmComplexity: number // 0-100
  }
  transitions: {
    preferredTypes: string[]
    frequency: number // 0-100
    complexity: number // 0-100
  }
  emotionalArc: EmotionalCurve
  colorGrading?: {
    style: string
    intensity: number // 0-100
  }
}

export interface EmotionalCurve {
  startEnergy: number // 0-100
  peakPosition: number // 0-1 (position in timeline)
  peakEnergy: number // 0-100
  endEnergy: number // 0-100
  variability: number // 0-100
}

export interface PacingProfile {
  type: PacingType
  averageCutDuration: number
  cutDurationRange: [number, number]
  rhythmComplexity: number // 0-100
}

export enum PacingType {
  Steady = "steady",
  Accelerating = "accelerating",
  Decelerating = "decelerating",
  Variable = "variable",
  Rhythmic = "rhythmic",
}

// Predefined montage styles
export const MONTAGE_STYLES: Record<string, MontageStyle> = {
  dynamicAction: {
    id: "dynamic-action",
    name: "Dynamic Action",
    description: "Fast-paced with frequent cuts and high energy",
    cutting: {
      averageShotLength: 2,
      variability: 60,
      rhythmComplexity: 80,
    },
    transitions: {
      preferredTypes: ["cut", "whip-pan", "zoom"],
      frequency: 90,
      complexity: 60,
    },
    emotionalArc: {
      startEnergy: 70,
      peakPosition: 0.7,
      peakEnergy: 95,
      endEnergy: 80,
      variability: 70,
    },
  },
  cinematicDrama: {
    id: "cinematic-drama",
    name: "Cinematic Drama",
    description: "Slow-paced with emotional focus and long takes",
    cutting: {
      averageShotLength: 6,
      variability: 40,
      rhythmComplexity: 30,
    },
    transitions: {
      preferredTypes: ["fade", "dissolve", "cut"],
      frequency: 40,
      complexity: 20,
    },
    emotionalArc: {
      startEnergy: 30,
      peakPosition: 0.8,
      peakEnergy: 85,
      endEnergy: 20,
      variability: 50,
    },
  },
  musicVideo: {
    id: "music-video",
    name: "Music Video",
    description: "Beat-synchronized cuts with rhythmic editing",
    cutting: {
      averageShotLength: 3,
      variability: 30,
      rhythmComplexity: 90,
    },
    transitions: {
      preferredTypes: ["cut", "flash", "glitch"],
      frequency: 80,
      complexity: 70,
    },
    emotionalArc: {
      startEnergy: 60,
      peakPosition: 0.6,
      peakEnergy: 90,
      endEnergy: 70,
      variability: 80,
    },
  },
  documentary: {
    id: "documentary",
    name: "Documentary",
    description: "Natural rhythm with informative pacing",
    cutting: {
      averageShotLength: 5,
      variability: 50,
      rhythmComplexity: 40,
    },
    transitions: {
      preferredTypes: ["cut", "fade", "wipe"],
      frequency: 50,
      complexity: 30,
    },
    emotionalArc: {
      startEnergy: 40,
      peakPosition: 0.5,
      peakEnergy: 60,
      endEnergy: 40,
      variability: 30,
    },
  },
  socialMedia: {
    id: "social-media",
    name: "Social Media",
    description: "Attention-grabbing with quick hooks",
    cutting: {
      averageShotLength: 1.5,
      variability: 70,
      rhythmComplexity: 60,
    },
    transitions: {
      preferredTypes: ["cut", "swipe", "zoom"],
      frequency: 85,
      complexity: 50,
    },
    emotionalArc: {
      startEnergy: 85,
      peakPosition: 0.3,
      peakEnergy: 95,
      endEnergy: 90,
      variability: 60,
    },
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description: "Professional and measured pace",
    cutting: {
      averageShotLength: 4,
      variability: 30,
      rhythmComplexity: 20,
    },
    transitions: {
      preferredTypes: ["cut", "fade", "slide"],
      frequency: 60,
      complexity: 20,
    },
    emotionalArc: {
      startEnergy: 50,
      peakPosition: 0.5,
      peakEnergy: 70,
      endEnergy: 60,
      variability: 20,
    },
  },
}

// Analysis options
export interface AnalysisOptions {
  videoAnalysis?: {
    enableSceneDetection?: boolean
    enableObjectDetection?: boolean
    enableFaceDetection?: boolean
    enableMotionAnalysis?: boolean
    sampleRate?: number // frames per second to analyze
  }
  audioAnalysis?: {
    enableSpeechDetection?: boolean
    enableMusicAnalysis?: boolean
    enableSilenceDetection?: boolean
    enableEmotionDetection?: boolean
  }
  momentDetection?: {
    threshold?: number // 0-1, sensitivity
    minDuration?: number // seconds
    categories?: MomentCategory[]
  }
}

// Progress tracking
export interface AnalysisProgress {
  phase: AnalysisPhase
  progress: number // 0-100
  currentFile?: string
  message?: string
  eta?: number // seconds
}

export enum AnalysisPhase {
  Initializing = "initializing",
  ExtractingFrames = "extracting_frames",
  AnalyzingVideo = "analyzing_video",
  AnalyzingAudio = "analyzing_audio",
  DetectingMoments = "detecting_moments",
  GeneratingPlan = "generating_plan",
  OptimizingPlan = "optimizing_plan",
  Complete = "complete",
}

// Plan generation options
export interface PlanGenerationOptions {
  style: string // style ID
  targetDuration?: number // seconds
  targetPlatform?: TargetPlatform
  instructions?: string
  preferences?: {
    favorPeople?: string[] // person IDs to favor
    avoidPeople?: string[] // person IDs to avoid
    favorObjects?: string[] // object types to favor
    avoidObjects?: string[] // object types to avoid
    minClipDuration?: number
    maxClipDuration?: number
  }
}

// Validation results
export interface PlanValidation {
  isValid: boolean
  issues: ValidationIssue[]
  suggestions: string[]
}

export interface ValidationIssue {
  type: ValidationIssueType
  severity: "error" | "warning" | "info"
  message: string
  affectedClips?: string[]
}

export enum ValidationIssueType {
  DurationMismatch = "duration_mismatch",
  MissingTransition = "missing_transition",
  QualityIssue = "quality_issue",
  PacingIssue = "pacing_issue",
  ContinuityError = "continuity_error",
}

// Statistics
export interface PlanStatistics {
  shotLengthDistribution: {
    min: number
    max: number
    average: number
    median: number
    standardDeviation: number
  }
  rhythmConsistency: number // 0-100
  emotionalFlow: {
    smoothness: number // 0-100
    peakCount: number
    averageEnergy: number
  }
  materialUsage: {
    totalSourceDuration: number
    usedDuration: number
    utilizationRate: number // 0-1
    clipCount: number
  }
  qualityMetrics: {
    averageVisualScore: number
    averageTechnicalScore: number
    lowestQualityClip?: string
  }
}

// Export formats
export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean
  includeAnalysis?: boolean
  includeSuggestions?: boolean
}

export enum ExportFormat {
  JSON = "json",
  EDL = "edl",
  XML = "xml",
  CSV = "csv",
}

// Temporal distribution analysis types
export interface TemporalDistribution {
  density: number // moments per minute
  gaps: TimeGap[]
  clusters: MomentCluster[]
  coverage: number // percentage of video covered by moments
}

export interface TimeGap {
  start: number
  end: number
  duration: number
}

export interface MomentCluster {
  moments: MomentScore[]
  startTime: number
  endTime: number
  density: number // moments per second in cluster
}

// Emotional arc data for visualizations
export interface EmotionalArc {
  timestamp: number
  emotionalIntensity: number
  category: MomentCategory
  score: number
}

// Enhanced plan statistics for components
export interface EnhancedPlanStatistics {
  totalClips: number
  totalDuration: number
  averageClipLength: number
  qualityScore: number
  engagementScore: number
  utilizationRate: number
  sequenceBreakdown: Record<SequenceType, number>
  emotionalArc: EmotionalArc[]
  transitionUsage: Record<string, number>
}

// Analysis progress with detailed tracking
export interface DetailedAnalysisProgress {
  stage: string
  progress: number
  message: string
  timestamp: number
  videosProcessed?: number
  totalVideos?: number
  currentOperation?: string
}
