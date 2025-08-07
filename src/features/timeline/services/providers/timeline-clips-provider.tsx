/**
 * Timeline Clips Provider
 * Управление клипами: добавление, удаление, перемещение, обрезка, разделение
 */

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useMemo } from "react"

import type { MediaFile } from "@/features/media/types/media"
import type { TimelineClip } from "../../types"
import { useTimelineProject } from "./timeline-project-provider"
import type { TimelineClipsContextType } from "./types"

const TimelineClipsContext = createContext<TimelineClipsContextType | null>(null)

interface TimelineClipsProviderProps {
  children: ReactNode
}

export function TimelineClipsProvider({ children }: TimelineClipsProviderProps) {
  const { backend, project } = useTimelineProject()

  // Get all clips from all tracks
  const clips = useMemo(() => {
    if (!project) return []

    return project.globalTracks.flatMap((track) => track.clips.map((clip) => ({ ...clip, trackId: track.id })))
  }, [project])

  // Clip operations
  const addClip = useCallback(
    async (trackId: string, mediaFile: MediaFile | string, time: number) => {
      const mediaId = typeof mediaFile === "string" ? mediaFile : mediaFile.id

      await backend.executeCommand({
        type: "AddClip",
        params: {
          track_id: trackId,
          media_id: mediaId,
          time,
        },
      })
    },
    [backend],
  )

  const removeClip = useCallback(
    async (clipId: string) => {
      await backend.executeCommand({
        type: "DeleteClip",
        params: { clip_id: clipId },
      })
    },
    [backend],
  )

  const moveClip = useCallback(
    async (clipId: string, trackId: string, time: number) => {
      await backend.executeCommand({
        type: "MoveClip",
        params: {
          clip_id: clipId,
          track_id: trackId,
          time,
        },
      })
    },
    [backend],
  )

  const trimClip = useCallback(
    async (clipId: string, startTime: number, endTime: number) => {
      await backend.executeCommand({
        type: "TrimClip",
        params: {
          clip_id: clipId,
          start: startTime,
          end: endTime,
        },
      })
    },
    [backend],
  )

  const splitClip = useCallback(
    async (clipId: string, time: number) => {
      // Note: Split functionality may need to be implemented in backend
      // For now, we'll implement it as a trim + add new clip operation
      const clip = clips.find((c) => c.id === clipId)
      if (!clip) return

      // First part: trim original clip to end at split time
      await trimClip(clipId, clip.mediaStartTime, time)

      // Second part: add new clip starting at split time
      await addClip(clip.trackId, clip.mediaId, time)
    },
    [backend, clips, trimClip, addClip],
  )

  const updateClip = useCallback(
    async (clipId: string, updates: Partial<TimelineClip>) => {
      const updateParams: any = {}

      if (updates.name !== undefined) {
        updateParams.name = updates.name
      }
      if (updates.speed !== undefined) {
        updateParams.playback_rate = updates.speed
      }
      if (updates.volume !== undefined) {
        updateParams.volume = updates.volume
      }
      if (updates.isLocked !== undefined) {
        updateParams.enabled = !updates.isLocked
      }

      // Only send parameters that were actually provided
      await backend.executeCommand({
        type: "UpdateClip",
        params: {
          clip_id: clipId,
          updates: updateParams,
        },
      })
    },
    [backend],
  )

  const batchUpdateClips = useCallback(
    async (clips: TimelineClip[]) => {
      // Batch update multiple clips at once
      // For now, we'll update them sequentially
      // TODO: Implement batch command in backend for better performance
      for (const clip of clips) {
        await updateClip(clip.id, clip)
      }
    },
    [updateClip],
  )

  const contextValue: TimelineClipsContextType = useMemo(
    () => ({
      // State
      clips,

      // Actions
      addClip,
      removeClip,
      moveClip,
      trimClip,
      splitClip,
      updateClip,
      batchUpdateClips,
    }),
    [clips, addClip, removeClip, moveClip, trimClip, splitClip, updateClip, batchUpdateClips],
  )

  return <TimelineClipsContext.Provider value={contextValue}>{children}</TimelineClipsContext.Provider>
}

export function useTimelineClips() {
  const context = useContext(TimelineClipsContext)
  if (!context) {
    throw new Error("useTimelineClips must be used within a TimelineClipsProvider")
  }
  return context
}
