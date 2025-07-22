/**
 * Unified project types that match the Rust backend structure
 * This is the single source of truth for project data
 */

// Main project state - matches Rust ProjectState
export interface ProjectState {
  project: Project | null
  uiState: UiState
  playbackState: PlaybackState
  version: number
}

// Project structure - matches Rust Project
export interface Project {
  id: string
  metadata: ProjectMetadata
  timeline: Timeline
  mediaPool: MediaPool
  settings: ProjectSettings
}

// Project metadata
export interface ProjectMetadata {
  name: string
  description?: string
  createdAt: string // ISO datetime
  modifiedAt: string // ISO datetime
  filePath?: string
  isDirty: boolean
  version: string
}

// Timeline structure
export interface Timeline {
  duration: number
  fps: number
  sampleRate: number
  tracks: Track[]
  markers: Marker[]
}

// Track in the timeline
export interface Track {
  id: string
  name: string
  trackType: TrackType
  enabled: boolean
  locked: boolean
  height: number
  clips: Clip[]
  effects: string[] // IDs of applied effects
  volume: number
  pan: number
}

// Track types
export enum TrackType {
  Video = "Video",
  Audio = "Audio",
  Title = "Title",
  Music = "Music",
  Voiceover = "Voiceover",
  Sfx = "Sfx",
  Ambient = "Ambient",
}

// Clip in a track
export interface Clip {
  id: string
  mediaId: string // Reference to MediaPool
  name: string
  timelineIn: number
  timelineOut: number
  sourceIn: number
  sourceOut: number
  playbackRate: number
  enabled: boolean
  effects: string[]
  transitions: Transition[]
}

// Transition between clips
export interface Transition {
  id: string
  transitionType: string
  duration: number
  params: Record<string, any>
}

// Timeline marker
export interface Marker {
  id: string
  name: string
  time: number
  color: string
  markerType: MarkerType
  description?: string
}

export enum MarkerType {
  Chapter = "Chapter",
  Section = "Section",
  Note = "Note",
  Export = "Export",
}

// Media pool - centralized media storage
export interface MediaPool {
  items: Record<string, MediaItem>
}

// Media item in the pool
export interface MediaItem {
  id: string
  path: string
  name: string
  mediaType: MediaType
  duration?: number
  metadata: MediaMetadata
  thumbnail?: string
  usageCount: number
}

export enum MediaType {
  Video = "Video",
  Audio = "Audio",
  Image = "Image",
}

// Media metadata
export interface MediaMetadata {
  format: string
  codec?: string
  resolution?: Resolution
  frameRate?: number
  bitrate?: number
  audioChannels?: number
  sampleRate?: number
}

export interface Resolution {
  width: number
  height: number
}

// Project settings
export interface ProjectSettings {
  resolution: Resolution
  frameRate: number
  audioSampleRate: number
  audioChannels: number
}

// UI state (not persisted, but synchronized)
export interface UiState {
  selectedClips: string[]
  selectedTracks: string[]
  timelineZoom: number
  timelineScroll: number
  activeTool: string
}

// Playback state
export interface PlaybackState {
  // Basic playback
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  loopEnabled: boolean
  loopStart?: number
  loopEnd?: number

  // Player state
  volume: number
  currentMediaId: string | null
  selectedClipId: string | null
  videoSource: "browser" | "timeline"

  // Applied resources
  appliedEffects: AppliedEffect[]
  appliedFilters: AppliedFilter[]
  appliedTemplate: AppliedTemplate | null

  // Player flags
  isLoading: boolean
  isSeeking: boolean
  duration: number
}

// Applied effect
export interface AppliedEffect {
  id: string
  effectId: string
  params: Record<string, any>
  enabled: boolean
}

// Applied filter
export interface AppliedFilter {
  id: string
  filterId: string
  params: Record<string, any>
  enabled: boolean
}

// Applied template
export interface AppliedTemplate {
  id: string
  templateId: string
  mediaIds: string[]
  params: Record<string, any>
}
