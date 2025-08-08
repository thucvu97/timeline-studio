/**
 * Timeline Domain Providers
 *
 * Модульная система провайдеров для работы с расширенной timeline машиной.
 * Каждый провайдер отвечает за свою область ответственности.
 */

import type { MediaFile } from "@domains/ai-services/types/montage-planner"
import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useContext } from "react"
// Используем типы из доменов вместо features
import type { TimelineClip as DomainTimelineClip, Timeline, Track } from "../types"

// Временный alias для совместимости
type TimelineProject = Timeline
type TimelineTrack = Track
type TimelineClip = DomainTimelineClip

import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"

// ===========================
// Project Provider
// ===========================
interface TimelineProjectContext {
  project: TimelineProject | null
  isLoading: boolean
  hasUnsavedChanges: boolean
  createProject: (name: string, settings?: any) => Promise<void>
  saveProject: () => Promise<void>
  loadProject: (path: string) => Promise<void>
}

const TimelineProjectContext = createContext<TimelineProjectContext | null>(null)

export function TimelineProjectProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline

  const project = useSelector(timelineActor, (state) => state.context.project)
  const isLoading = useSelector(timelineActor, (state) => state.context.isLoading)
  const hasUnsavedChanges = useSelector(timelineActor, (state) => state.context.hasUnsavedChanges)

  const contextValue: TimelineProjectContext = {
    project,
    isLoading,
    hasUnsavedChanges,
    createProject: orchestrator.createProject.bind(orchestrator),
    saveProject: orchestrator.saveProject.bind(orchestrator),
    loadProject: orchestrator.loadProject.bind(orchestrator),
  }

  return <TimelineProjectContext.Provider value={contextValue}>{children}</TimelineProjectContext.Provider>
}

export function useTimelineProject() {
  const context = useContext(TimelineProjectContext)
  if (!context) {
    throw new Error("useTimelineProject must be used within TimelineProjectProvider")
  }
  return context
}

// ===========================
// Playback Provider
// ===========================
interface TimelinePlaybackContext {
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  duration: number
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
}

const TimelinePlaybackContext = createContext<TimelinePlaybackContext | null>(null)

export function TimelinePlaybackProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline

  const isPlaying = useSelector(timelineActor, (state) => state.context.isPlaying)
  const currentTime = useSelector(timelineActor, (state) => state.context.currentTime)
  const playbackRate = useSelector(timelineActor, (state) => state.context.playbackRate)
  const duration = useSelector(timelineActor, (state) => state.context.duration)

  const contextValue: TimelinePlaybackContext = {
    isPlaying,
    currentTime,
    playbackRate,
    duration,
    play: orchestrator.play.bind(orchestrator),
    pause: orchestrator.pause.bind(orchestrator),
    stop: orchestrator.stopPlayback.bind(orchestrator),
    seek: orchestrator.seek.bind(orchestrator),
    setPlaybackRate: (rate: number) => {
      timelineActor.send({ type: "SET_PLAYBACK_RATE", rate })
    },
  }

  return <TimelinePlaybackContext.Provider value={contextValue}>{children}</TimelinePlaybackContext.Provider>
}

export function useTimelinePlayback() {
  const context = useContext(TimelinePlaybackContext)
  if (!context) {
    throw new Error("useTimelinePlayback must be used within TimelinePlaybackProvider")
  }
  return context
}

// ===========================
// Tracks Provider
// ===========================
interface TimelineTracksContext {
  tracks: TimelineTrack[]
  activeTrackId: string | null
  addTrack: (type: any, name?: string, sectionId?: string) => Promise<void>
  removeTrack: (trackId: string) => Promise<void>
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => Promise<void>
  reorderTracks: (sectionId: string, trackIds: string[]) => Promise<void>
  setActiveTrack: (trackId: string | null) => void
}

const TimelineTracksContext = createContext<TimelineTracksContext | null>(null)

export function TimelineTracksProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline

  const project = useSelector(timelineActor, (state) => state.context.project)
  const activeTrackId = useSelector(timelineActor, (state) => state.context.activeTrackId)

  const tracks = project?.globalTracks || []

  const contextValue: TimelineTracksContext = {
    tracks,
    activeTrackId,
    addTrack: orchestrator.addTrack.bind(orchestrator),
    removeTrack: async (trackId: string) => {
      await orchestrator.executeCommand({
        type: "DeleteTrack",
        params: { track_id: trackId },
      })
      timelineActor.send({ type: "REMOVE_TRACK", trackId })
    },
    updateTrack: async (trackId: string, updates: Partial<TimelineTrack>) => {
      // Implement track update logic
      timelineActor.send({ type: "UPDATE_TRACK", trackId, updates })
    },
    reorderTracks: async (sectionId: string, trackIds: string[]) => {
      timelineActor.send({ type: "REORDER_TRACKS", sectionId, trackIds })
    },
    setActiveTrack: (trackId: string | null) => {
      timelineActor.send({ type: "SET_ACTIVE_TRACK", trackId })
    },
  }

  return <TimelineTracksContext.Provider value={contextValue}>{children}</TimelineTracksContext.Provider>
}

export function useTimelineTracks() {
  const context = useContext(TimelineTracksContext)
  if (!context) {
    throw new Error("useTimelineTracks must be used within TimelineTracksProvider")
  }
  return context
}

// ===========================
// Clips Provider
// ===========================
interface TimelineClipsContext {
  clips: TimelineClip[]
  addClip: (trackId: string, mediaFile: MediaFile | string, time: number) => Promise<void>
  removeClip: (clipId: string) => Promise<void>
  moveClip: (clipId: string, trackId: string, time: number) => Promise<void>
  trimClip: (clipId: string, startTime: number, endTime: number) => Promise<void>
  splitClip: (clipId: string, time: number) => Promise<void>
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => Promise<void>
  batchUpdateClips: (clips: TimelineClip[]) => Promise<void>
}

const TimelineClipsContext = createContext<TimelineClipsContext | null>(null)

export function TimelineClipsProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline

  const project = useSelector(timelineActor, (state) => state.context.project)

  // Собираем все клипы из всех треков
  const clips = project?.globalTracks.flatMap((track) => track.clips) || []

  const contextValue: TimelineClipsContext = {
    clips,
    addClip: orchestrator.addClip.bind(orchestrator),
    removeClip: async (clipId: string) => {
      await orchestrator.executeCommand({
        type: "DeleteClip",
        params: { clip_id: clipId },
      })
      timelineActor.send({ type: "REMOVE_CLIP", clipId })
    },
    moveClip: async (clipId: string, trackId: string, time: number) => {
      await orchestrator.executeCommand({
        type: "MoveClip",
        params: { clip_id: clipId, track_id: trackId, time },
      })
      timelineActor.send({ type: "MOVE_CLIP", clipId, trackId, time })
    },
    trimClip: async (clipId: string, startTime: number, endTime: number) => {
      await orchestrator.executeCommand({
        type: "TrimClip",
        params: { clip_id: clipId, start: startTime, end: endTime },
      })
      timelineActor.send({ type: "TRIM_CLIP", clipId, startTime, endTime })
    },
    splitClip: async (clipId: string, time: number) => {
      // TODO: SplitClip command not available in backend yet
      // For now, just update the UI state
      timelineActor.send({ type: "SPLIT_CLIP", clipId, time })
    },
    updateClip: async (clipId: string, updates: Partial<TimelineClip>) => {
      timelineActor.send({ type: "UPDATE_CLIP", clipId, updates })
    },
    batchUpdateClips: async (clips: TimelineClip[]) => {
      timelineActor.send({ type: "BATCH_UPDATE_CLIPS", clips })
    },
  }

  return <TimelineClipsContext.Provider value={contextValue}>{children}</TimelineClipsContext.Provider>
}

export function useTimelineClips() {
  const context = useContext(TimelineClipsContext)
  if (!context) {
    throw new Error("useTimelineClips must be used within TimelineClipsProvider")
  }
  return context
}

// ===========================
// Selection Provider
// ===========================
interface TimelineSelectionContext {
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]
  selectClips: (clipIds: string[], addToSelection?: boolean) => void
  selectTracks: (trackIds: string[], addToSelection?: boolean) => void
  selectSections: (sectionIds: string[], addToSelection?: boolean) => void
  clearSelection: () => void
  copyClips: () => Promise<void>
  cutClips: () => Promise<void>
  pasteClips: (trackId: string, time: number) => Promise<void>
  deleteSelected: () => Promise<void>
}

const TimelineSelectionContext = createContext<TimelineSelectionContext | null>(null)

export function TimelineSelectionProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline

  const selectedClipIds = useSelector(timelineActor, (state) => state.context.selectedClipIds)
  const selectedTrackIds = useSelector(timelineActor, (state) => state.context.selectedTrackIds)
  const selectedSectionIds = useSelector(timelineActor, (state) => state.context.selectedSectionIds)

  const contextValue: TimelineSelectionContext = {
    selectedClipIds,
    selectedTrackIds,
    selectedSectionIds,
    selectClips: (clipIds: string[], addToSelection?: boolean) => {
      timelineActor.send({ type: "SELECT_CLIPS", clipIds, addToSelection })
    },
    selectTracks: (trackIds: string[], addToSelection?: boolean) => {
      timelineActor.send({ type: "SELECT_TRACKS", trackIds, addToSelection })
    },
    selectSections: (sectionIds: string[], addToSelection?: boolean) => {
      timelineActor.send({ type: "SELECT_SECTIONS", sectionIds, addToSelection })
    },
    clearSelection: () => {
      timelineActor.send({ type: "CLEAR_SELECTION" })
    },
    copyClips: async () => {
      timelineActor.send({ type: "COPY_CLIPS" })
    },
    cutClips: async () => {
      timelineActor.send({ type: "CUT_CLIPS" })
    },
    pasteClips: async (trackId: string, time: number) => {
      timelineActor.send({ type: "PASTE_CLIPS", trackId, time })
    },
    deleteSelected: async () => {
      timelineActor.send({ type: "DELETE_SELECTED" })
    },
  }

  return <TimelineSelectionContext.Provider value={contextValue}>{children}</TimelineSelectionContext.Provider>
}

export function useTimelineSelection() {
  const context = useContext(TimelineSelectionContext)
  if (!context) {
    throw new Error("useTimelineSelection must be used within TimelineSelectionProvider")
  }
  return context
}

// ===========================
// Effects Provider
// ===========================
interface TimelineEffectsContext {
  applyEffect: (clipId: string, effectId: string, params?: any) => Promise<void>
  removeEffect: (clipId: string, effectId: string) => Promise<void>
  applyFilter: (clipId: string, filterId: string, params?: any) => Promise<void>
  removeFilter: (clipId: string, filterId: string) => Promise<void>
  applyTransition: (clipId: string, transitionId: string, params?: any) => Promise<void>
  removeTransition: (clipId: string, transitionId: string) => Promise<void>
}

const TimelineEffectsContext = createContext<TimelineEffectsContext | null>(null)

export function TimelineEffectsProvider({ children }: { children: ReactNode }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline

  const contextValue: TimelineEffectsContext = {
    applyEffect: async (clipId: string, effectId: string, params?: any) => {
      timelineActor.send({ type: "APPLY_EFFECT", clipId, effectId, params })
    },
    removeEffect: async (clipId: string, effectId: string) => {
      timelineActor.send({ type: "REMOVE_EFFECT", clipId, effectId })
    },
    applyFilter: async (clipId: string, filterId: string, params?: any) => {
      timelineActor.send({ type: "APPLY_FILTER", clipId, filterId, params })
    },
    removeFilter: async (clipId: string, filterId: string) => {
      timelineActor.send({ type: "REMOVE_FILTER", clipId, filterId })
    },
    applyTransition: async (clipId: string, transitionId: string, params?: any) => {
      timelineActor.send({ type: "APPLY_TRANSITION", clipId, transitionId, params })
    },
    removeTransition: async (clipId: string, transitionId: string) => {
      timelineActor.send({ type: "REMOVE_TRANSITION", clipId, transitionId })
    },
  }

  return <TimelineEffectsContext.Provider value={contextValue}>{children}</TimelineEffectsContext.Provider>
}

export function useTimelineEffects() {
  const context = useContext(TimelineEffectsContext)
  if (!context) {
    throw new Error("useTimelineEffects must be used within TimelineEffectsProvider")
  }
  return context
}

// ===========================
// Combined Timeline Provider
// ===========================
export function TimelineProvider({ children }: { children: ReactNode }) {
  return (
    <TimelineProjectProvider>
      <TimelinePlaybackProvider>
        <TimelineTracksProvider>
          <TimelineClipsProvider>
            <TimelineSelectionProvider>
              <TimelineEffectsProvider>{children}</TimelineEffectsProvider>
            </TimelineSelectionProvider>
          </TimelineClipsProvider>
        </TimelineTracksProvider>
      </TimelinePlaybackProvider>
    </TimelineProjectProvider>
  )
}
