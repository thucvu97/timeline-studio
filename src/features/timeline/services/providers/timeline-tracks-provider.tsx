/**
 * Timeline Tracks Provider
 * Управление треками: добавление, удаление, изменение, переупорядочивание
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

import type { TimelineTrack, TrackType } from "../../types"
import { useTimelineProject } from "./timeline-project-provider"
import type { TimelineTracksContextType } from "./types"

const TimelineTracksContext = createContext<TimelineTracksContextType | null>(null)

interface TimelineTracksProviderProps {
  children: ReactNode
}

export function TimelineTracksProvider({ children }: TimelineTracksProviderProps) {
  const { backend, project } = useTimelineProject()
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)

  // Get tracks from project
  const tracks = useMemo(() => project?.globalTracks || [], [project])

  // Track operations
  const addTrack = useCallback(
    async (type: TrackType, name?: string) => {
      const trackName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track`
      
      const backendTrackType = type.toUpperCase() as any // Backend expects uppercase
      
      await backend.executeCommand({
        type: "AddTrack",
        params: {
          name: trackName,
          track_type: backendTrackType,
          index: null,
        },
      })
    },
    [backend],
  )

  const removeTrack = useCallback(
    async (trackId: string) => {
      await backend.executeCommand({
        type: "DeleteTrack",
        params: { track_id: trackId },
      })
      
      // Clear active track if it's being deleted
      if (activeTrackId === trackId) {
        setActiveTrackId(null)
      }
    },
    [backend, activeTrackId],
  )

  const updateTrack = useCallback(
    async (trackId: string, updates: Partial<TimelineTrack>) => {
      const updateParams: any = {}

      if (updates.name !== undefined) {
        updateParams.name = updates.name
      }
      if (updates.isLocked !== undefined) {
        updateParams.locked = updates.isLocked
      }
      if (updates.isMuted !== undefined) {
        updateParams.enabled = !updates.isMuted
      }
      if (updates.volume !== undefined) {
        updateParams.volume = updates.volume
      }
      if (updates.height !== undefined) {
        updateParams.height = updates.height
      }

      // Only send parameters that were actually provided
      await backend.executeCommand({
        type: "UpdateTrack",
        params: {
          track_id: trackId,
          updates: updateParams,
        },
      })
    },
    [backend],
  )

  const reorderTracks = useCallback(
    async (trackIds: string[]) => {
      // For now, just update active track if provided
      // Full reordering would require backend support
      console.log("Track reordering not yet implemented:", trackIds)
    },
    [],
  )

  const setActiveTrack = useCallback((trackId: string | null) => {
    setActiveTrackId(trackId)
  }, [])

  const contextValue: TimelineTracksContextType = useMemo(
    () => ({
      // State
      tracks,
      activeTrackId,

      // Actions
      addTrack,
      removeTrack,
      updateTrack,
      reorderTracks,
      setActiveTrack,
    }),
    [tracks, activeTrackId, addTrack, removeTrack, updateTrack, reorderTracks, setActiveTrack],
  )

  return (
    <TimelineTracksContext.Provider value={contextValue}>
      {children}
    </TimelineTracksContext.Provider>
  )
}

export function useTimelineTracks() {
  const context = useContext(TimelineTracksContext)
  if (!context) {
    throw new Error("useTimelineTracks must be used within a TimelineTracksProvider")
  }
  return context
}