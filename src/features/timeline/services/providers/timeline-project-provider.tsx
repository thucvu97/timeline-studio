/**
 * Timeline Project Provider
 * Управление проектом: создание, загрузка, сохранение, backend интеграция
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { MediaFile } from "@/features/media/types/media"
import type { Clip, Project, ProjectCommand, ProjectState } from "@/types/generated/tauri-bindings"

import type { TimelineClip, TimelineProject, TimelineTrack, TrackType } from "../../types"
import type { BackendIntegration, TimelineProjectContextType } from "./types"

// Утилиты преобразования (перенесены из основного провайдера)
function convertClipToTimelineClip(clip: Clip, trackId: string): TimelineClip {
  return {
    id: clip.id,
    name: clip.name,
    mediaId: clip.media_id,
    trackId,
    startTime: clip.timeline_in,
    duration: clip.timeline_out - clip.timeline_in,
    mediaStartTime: clip.source_in,
    mediaEndTime: clip.source_out,
    offset: 0,
    mediaDuration: clip.source_out - clip.source_in,
    volume: 1.0,
    speed: clip.playback_rate,
    isReversed: false,
    opacity: 1.0,
    effects: [],
    filters: [],
    transitions: [],
    isSelected: false,
    isLocked: !clip.enabled,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function convertProjectToTimelineProject(project: Project): TimelineProject {
  const tracks: TimelineTrack[] = project.timeline.tracks.map((track, index) => ({
    id: track.id,
    name: track.name,
    type: track.track_type.toLowerCase() as TrackType,
    order: index,
    clips: track.clips.map((clip) => convertClipToTimelineClip(clip, track.id)),
    transitions: [],
    isLocked: track.locked,
    isMuted: !track.enabled,
    isHidden: false,
    isSolo: false,
    volume: track.volume,
    pan: track.pan,
    height: track.height,
    trackEffects: [],
    trackFilters: [],
  }))

  return {
    id: project.id,
    name: project.metadata.name,
    duration: project.timeline.duration,
    fps: project.timeline.fps,
    sampleRate: project.timeline.sample_rate,
    sections: [],
    globalTracks: tracks,
    resources: {
      effects: [],
      filters: [],
      transitions: [],
      timelineTransitions: [],
      templates: [],
      styleTemplates: [],
      subtitleStyles: [],
      music: [],
      media: [],
    },
    settings: {
      resolution: project.settings.resolution,
      fps: project.settings.frame_rate,
      aspectRatio: "16:9",
      sampleRate: project.settings.audio_sample_rate,
      channels: project.settings.audio_channels,
      bitDepth: 16,
      timeFormat: "timecode" as const,
      snapToGrid: false,
      gridSize: 1,
      autoSave: true,
      autoSaveInterval: 300,
    },
    createdAt: new Date(project.metadata.created_at),
    updatedAt: new Date(),
    version: project.metadata.version,
  }
}

const TimelineProjectContext = createContext<TimelineProjectContextType | null>(null)

interface TimelineProjectProviderProps {
  children: ReactNode
}

export function TimelineProjectProvider({ children }: TimelineProjectProviderProps) {
  const [project, setProject] = useState<TimelineProject | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [projectState, setProjectState] = useState<ProjectState | null>(null)

  // Backend integration
  const backendSync = useMemo(() => getBackendSync(), [])

  // Execute command function
  const executeCommand = useCallback(
    async (command: ProjectCommand) => {
      try {
        setIsLoading(true)
        await backendSync.executeCommand(command)
      } catch (error) {
        console.error("Failed to execute command:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Backend state subscription
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setProjectState(state)
      
      if (state.project) {
        const timelineProject = convertProjectToTimelineProject(state.project)
        setProject(timelineProject)
      } else {
        setProject(null)
      }
    })

    return unsubscribe
  }, [backendSync])

  // Project operations
  const createProject = useCallback(
    async (name: string) => {
      await executeCommand({
        type: "CreateProject",
        params: {
          name,
          settings: {
            fps: 30,
            resolution: "1920x1080",
          },
        },
      })
      setHasUnsavedChanges(true)
    },
    [executeCommand],
  )

  const saveProject = useCallback(
    async () => {
      await executeCommand({
        type: "SaveProject",
        params: { path: null },
      })
      setHasUnsavedChanges(false)
    },
    [executeCommand],
  )

  const loadProject = useCallback(
    async (path: string) => {
      await executeCommand({
        type: "OpenProject",
        params: { path },
      })
      setHasUnsavedChanges(false)
    },
    [executeCommand],
  )

  // Backend integration object
  const backend: BackendIntegration = useMemo(
    () => ({
      executeCommand,
      projectState,
      project,
    }),
    [executeCommand, projectState, project],
  )

  const contextValue: TimelineProjectContextType = useMemo(
    () => ({
      // State
      project,
      isLoading,
      hasUnsavedChanges,
      
      // Actions
      createProject,
      saveProject,
      loadProject,
      
      // Backend
      backend,
    }),
    [project, isLoading, hasUnsavedChanges, createProject, saveProject, loadProject, backend],
  )

  return (
    <TimelineProjectContext.Provider value={contextValue}>
      {children}
    </TimelineProjectContext.Provider>
  )
}

export function useTimelineProject() {
  const context = useContext(TimelineProjectContext)
  if (!context) {
    throw new Error("useTimelineProject must be used within a TimelineProjectProvider")
  }
  return context
}