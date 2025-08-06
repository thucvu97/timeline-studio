/**
 * Timeline Selection Provider
 * Управление выделением: клипы, треки, копирование, вставка
 */

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

import { type ClipboardData, copyClips } from "../../utils/clip-operations"
import { useTimelineClips } from "./timeline-clips-provider"
import type { TimelineSelectionContextType } from "./types"

const TimelineSelectionContext = createContext<TimelineSelectionContextType | null>(null)

interface TimelineSelectionProviderProps {
  children: ReactNode
}

export function TimelineSelectionProvider({ children }: TimelineSelectionProviderProps) {
  const { clips, removeClip } = useTimelineClips()
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([])
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(null)

  // Selection operations
  const selectClips = useCallback((clipIds: string[], addToSelection = false) => {
    if (addToSelection) {
      setSelectedClipIds((prev) => [...new Set([...prev, ...clipIds])])
    } else {
      setSelectedClipIds(clipIds)
    }
  }, [])

  const selectTracks = useCallback((trackIds: string[], addToSelection = false) => {
    if (addToSelection) {
      setSelectedTrackIds((prev) => [...new Set([...prev, ...trackIds])])
    } else {
      setSelectedTrackIds(trackIds)
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedClipIds([])
    setSelectedTrackIds([])
  }, [])

  // Clipboard operations
  const copySelectedClips = useCallback(async () => {
    const selectedClips = clips.filter((clip) => selectedClipIds.includes(clip.id))
    if (selectedClips.length === 0) {
      console.warn("No clips selected for copying")
      return
    }

    try {
      const clipboardData = copyClips(selectedClips)
      setClipboardData(clipboardData)
    } catch (error) {
      console.error("Failed to copy clips:", error)
    }
  }, [clips, selectedClipIds])

  const cutClips = useCallback(async () => {
    await copySelectedClips()

    // Delete selected clips
    for (const clipId of selectedClipIds) {
      await removeClip(clipId)
    }

    clearSelection()
  }, [copySelectedClips, selectedClipIds, removeClip, clearSelection])

  const pasteClips = useCallback(
    async (trackId: string, time: number) => {
      // This would need backend support for batch operations
      // For now, just clear clipboard
      console.log("Paste clips not yet implemented:", { trackId, time, data: clipboardData })
      setClipboardData(null)
    },
    [clipboardData],
  )

  const deleteSelected = useCallback(async () => {
    for (const clipId of selectedClipIds) {
      await removeClip(clipId)
    }
    clearSelection()
  }, [selectedClipIds, removeClip, clearSelection])

  const contextValue: TimelineSelectionContextType = useMemo(
    () => ({
      // State
      selectedClipIds,
      selectedTrackIds,
      clipboardClips: clipboardData?.clips || [],

      // Actions
      selectClips,
      selectTracks,
      clearSelection,
      copyClips: copySelectedClips,
      cutClips,
      pasteClips,
      deleteSelected,
    }),
    [
      selectedClipIds,
      selectedTrackIds,
      clipboardData,
      selectClips,
      selectTracks,
      clearSelection,
      copySelectedClips,
      cutClips,
      pasteClips,
      deleteSelected,
    ],
  )

  return <TimelineSelectionContext.Provider value={contextValue}>{children}</TimelineSelectionContext.Provider>
}

export function useTimelineSelection() {
  const context = useContext(TimelineSelectionContext)
  if (!context) {
    throw new Error("useTimelineSelection must be used within a TimelineSelectionProvider")
  }
  return context
}
