export interface TranscriptionOptions {
  language?: string // auto-detect if not specified
  task: "transcribe" | "translate"
  modelSize: "tiny" | "base" | "small" | "medium" | "large-v1" | "large-v2" | "large-v3"
  wordTimestamps: boolean
  vadFilter: boolean
  maxSegmentLength?: number
  provider?: "openai" | "local" | "faster-whisper"
  device?: "auto" | "cpu" | "cuda" | "mps"
  computeType?: "auto" | "int8" | "float16" | "float32"
}

export interface TranscriptionSegment {
  id: number
  start: number
  end: number
  text: string
  words?: TranscriptionWord[]
  confidence?: number
}

export interface TranscriptionWord {
  word: string
  start: number
  end: number
  confidence?: number
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[]
  language: string
  languageProbability: number
  duration: number
  text: string
  processingTime?: number
}

export interface TranscriptionProgress {
  status: "idle" | "initializing" | "processing" | "completed" | "error"
  progress: number
  message?: string
  currentTime?: number
  totalTime?: number
}

export interface ModelInfo {
  name: string
  size: string
  params?: string
  englishOnly?: boolean
  isDownloaded: boolean
}

export type SubtitleFormat = "srt" | "vtt" | "ass"
