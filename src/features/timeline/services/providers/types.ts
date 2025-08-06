/**
 * Типы для модульных провайдеров Timeline
 */

import type { ReactNode } from "react"
import type { ProjectCommand, ProjectState } from "@/types/generated/tauri-bindings"
import type { TimelineClip, TimelineProject, TimelineTrack, TrackType } from "../../types"

export interface BaseProviderProps {
  children: ReactNode
}

export interface BackendIntegration {
  executeCommand: (command: ProjectCommand) => Promise<void>
  projectState: ProjectState | null
  project: TimelineProject | null
}

// Project Provider Types
export interface TimelineProjectContextType {
  // State
  project: TimelineProject | null
  isLoading: boolean
  hasUnsavedChanges: boolean
  
  // Actions
  createProject: (name: string) => Promise<void>
  saveProject: () => Promise<void>
  loadProject: (path: string) => Promise<void>
  
  // Backend integration
  backend: BackendIntegration
}

// Playback Provider Types
export interface TimelinePlaybackContextType {
  // State
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  duration: number
  
  // Actions  
  play: () => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  seek: (time: number) => Promise<void>
  setPlaybackRate: (rate: number) => Promise<void>
}

// Tracks Provider Types
export interface TimelineTracksContextType {
  // State
  tracks: TimelineTrack[]
  activeTrackId: string | null
  
  // Actions
  addTrack: (type: TrackType, name?: string) => Promise<void>
  removeTrack: (trackId: string) => Promise<void>
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => Promise<void>
  reorderTracks: (trackIds: string[]) => Promise<void>
  setActiveTrack: (trackId: string | null) => void
}

// Clips Provider Types
export interface TimelineClipsContextType {
  // State
  clips: TimelineClip[]
  
  // Actions
  addClip: (trackId: string, mediaFile: import("@/features/media/types/media").MediaFile | string, time: number) => Promise<void>
  removeClip: (clipId: string) => Promise<void>
  moveClip: (clipId: string, trackId: string, time: number) => Promise<void>
  trimClip: (clipId: string, startTime: number, endTime: number) => Promise<void>
  splitClip: (clipId: string, time: number) => Promise<void>
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => Promise<void>
}

// Selection Provider Types
export interface TimelineSelectionContextType {
  // State
  selectedClipIds: string[]
  selectedTrackIds: string[]
  clipboardClips: TimelineClip[]
  
  // Actions
  selectClips: (clipIds: string[], addToSelection?: boolean) => void
  selectTracks: (trackIds: string[], addToSelection?: boolean) => void
  clearSelection: () => void
  copyClips: () => Promise<void>
  cutClips: () => Promise<void>
  pasteClips: (trackId: string, time: number) => Promise<void>
  deleteSelected: () => Promise<void>
}

// Effects Provider Types  
export interface TimelineEffectsContextType {
  // Actions
  applyEffect: (clipId: string, effectId: string, params?: any) => Promise<void>
  removeEffect: (clipId: string, effectId: string) => Promise<void>
  applyFilter: (clipId: string, filterId: string, params?: any) => Promise<void>
  removeFilter: (clipId: string, filterId: string) => Promise<void>
  applyTransition: (clipId: string, transitionId: string, params?: any) => Promise<void>
  removeTransition: (clipId: string, transitionId: string) => Promise<void>
}