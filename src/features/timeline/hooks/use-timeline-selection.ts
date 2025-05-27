/**
 * Hook for managing Timeline selection
 */

import { useMemo } from "react"

import {
  TimelineClip,
  TimelineSection,
  TimelineTrack
} from "@/types/timeline"

import { useTimeline } from "../timeline-provider"
import { useClips } from "./use-clips"
import { useTracks } from "./use-tracks"

export interface UseTimelineSelectionReturn {
  // Текущее выделение
  selectedClips: TimelineClip[]
  selectedTracks: TimelineTrack[]
  selectedSections: TimelineSection[]

  // Состояние выделения
  hasSelection: boolean
  selectionCount: {
    clips: number
    tracks: number
    sections: number
    total: number
  }

  // Информация о выделении
  selectionBounds: {
    startTime: number
    endTime: number
    duration: number
    trackIds: string[]
  } | null

  // Действия с выделением
  selectClip: (clipId: string, addToSelection?: boolean) => void
  selectTrack: (trackId: string, addToSelection?: boolean) => void
  selectSection: (sectionId: string, addToSelection?: boolean) => void
  selectMultiple: (items: { clipIds?: string[]; trackIds?: string[]; sectionIds?: string[] }) => void
  selectAll: () => void
  selectNone: () => void
  invertSelection: () => void

  // Выделение по области
  selectInTimeRange: (startTime: number, endTime: number, trackIds?: string[]) => void
  selectByType: (trackType: string) => void

  // Операции с выделенными элементами
  deleteSelected: () => void
  duplicateSelected: () => void
  groupSelected: () => void
  ungroupSelected: () => void

  // Свойства выделенных элементов
  setSelectedVolume: (volume: number) => void
  setSelectedSpeed: (speed: number) => void
  setSelectedOpacity: (opacity: number) => void
  muteSelected: () => void
  unmuteSelected: () => void
  lockSelected: () => void
  unlockSelected: () => void

  // Буфер обмена
  copySelected: () => void
  cutSelected: () => void
  pasteAtTime: (time: number, trackId?: string) => void

  // Утилиты
  isClipSelected: (clipId: string) => boolean
  isTrackSelected: (trackId: string) => boolean
  isSectionSelected: (sectionId: string) => boolean
  getSelectionStats: () => {
    totalDuration: number
    averageVolume: number
    trackTypes: string[]
    mediaTypes: string[]
  }
}

export function useTimelineSelection(): UseTimelineSelectionReturn {
  const {
    project,
    uiState,
    selectClips,
    selectTracks,
    selectSections,
    clearSelection,
    removeClip,
    updateClip,
    copySelection,
    cutSelection,
    paste
  } = useTimeline()

  const { tracks, findTrack } = useTracks()
  const { clips, findClip, duplicateClip } = useClips()

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedClips = useMemo(() => {
    return clips.filter(clip => uiState.selectedClipIds.includes(clip.id))
  }, [clips, uiState.selectedClipIds])

  const selectedTracks = useMemo(() => {
    return tracks.filter(track => uiState.selectedTrackIds.includes(track.id))
  }, [tracks, uiState.selectedTrackIds])

  const selectedSections = useMemo(() => {
    if (!project) return []
    return project.sections.filter(section => uiState.selectedSectionIds.includes(section.id))
  }, [project, uiState.selectedSectionIds])

  const hasSelection = useMemo(() => {
    return selectedClips.length > 0 || selectedTracks.length > 0 || selectedSections.length > 0
  }, [selectedClips, selectedTracks, selectedSections])

  const selectionCount = useMemo(() => {
    const clips = selectedClips.length
    const tracks = selectedTracks.length
    const sections = selectedSections.length
    return {
      clips,
      tracks,
      sections,
      total: clips + tracks + sections
    }
  }, [selectedClips, selectedTracks, selectedSections])

  const selectionBounds = useMemo(() => {
    if (selectedClips.length === 0) return null

    const startTime = Math.min(...selectedClips.map(clip => clip.startTime))
    const endTime = Math.max(...selectedClips.map(clip => clip.startTime + clip.duration))
    const trackIds = [...new Set(selectedClips.map(clip => clip.trackId))]

    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      trackIds
    }
  }, [selectedClips])

  // ============================================================================
  // SELECTION ACTIONS
  // ============================================================================

  const selectClip = (clipId: string, addToSelection = false) => {
    if (addToSelection) {
      const currentIds = uiState.selectedClipIds
      const newIds = currentIds.includes(clipId)
        ? currentIds.filter(id => id !== clipId)
        : [...currentIds, clipId]
      selectClips(newIds)
    } else {
      selectClips([clipId])
    }
  }

  const selectTrack = (trackId: string, addToSelection = false) => {
    if (addToSelection) {
      const currentIds = uiState.selectedTrackIds
      const newIds = currentIds.includes(trackId)
        ? currentIds.filter(id => id !== trackId)
        : [...currentIds, trackId]
      selectTracks(newIds)
    } else {
      selectTracks([trackId])
    }
  }

  const selectSection = (sectionId: string, addToSelection = false) => {
    if (addToSelection) {
      const currentIds = uiState.selectedSectionIds
      const newIds = currentIds.includes(sectionId)
        ? currentIds.filter(id => id !== sectionId)
        : [...currentIds, sectionId]
      selectSections(newIds)
    } else {
      selectSections([sectionId])
    }
  }

  const selectMultiple = (items: { clipIds?: string[]; trackIds?: string[]; sectionIds?: string[] }) => {
    if (items.clipIds) selectClips(items.clipIds)
    if (items.trackIds) selectTracks(items.trackIds)
    if (items.sectionIds) selectSections(items.sectionIds)
  }

  const selectAll = () => {
    selectClips(clips.map(clip => clip.id))
  }

  const selectNone = () => {
    clearSelection()
  }

  const invertSelection = () => {
    const allClipIds = clips.map(clip => clip.id)
    const currentSelection = uiState.selectedClipIds
    const newSelection = allClipIds.filter(id => !currentSelection.includes(id))
    selectClips(newSelection)
  }

  // ============================================================================
  // AREA SELECTION
  // ============================================================================

  const selectInTimeRange = (startTime: number, endTime: number, trackIds?: string[]) => {
    const targetTracks = trackIds || tracks.map(t => t.id)
    const clipsInRange = clips.filter(clip => {
      if (!targetTracks.includes(clip.trackId)) return false

      const clipEndTime = clip.startTime + clip.duration
      return !(clipEndTime <= startTime || clip.startTime >= endTime)
    })

    selectClips(clipsInRange.map(clip => clip.id))
  }

  const selectByType = (trackType: string) => {
    const tracksOfType = tracks.filter(track => track.type === trackType)
    const clipsOfType = clips.filter(clip =>
      tracksOfType.some(track => track.id === clip.trackId)
    )
    selectClips(clipsOfType.map(clip => clip.id))
  }

  // ============================================================================
  // OPERATIONS ON SELECTED
  // ============================================================================

  const deleteSelected = () => {
    selectedClips.forEach(clip => removeClip(clip.id))
    clearSelection()
  }

  const duplicateSelected = () => {
    selectedClips.forEach(clip => {
      duplicateClip(clip.id)
    })
  }

  const groupSelected = () => {
    // TODO: Implement grouping functionality
    console.log("Grouping selected items...")
  }

  const ungroupSelected = () => {
    // TODO: Implement ungrouping functionality
    console.log("Ungrouping selected items...")
  }

  // ============================================================================
  // PROPERTIES OF SELECTED
  // ============================================================================

  const setSelectedVolume = (volume: number) => {
    selectedClips.forEach(clip => {
      updateClip(clip.id, { volume })
    })
  }

  const setSelectedSpeed = (speed: number) => {
    selectedClips.forEach(clip => {
      updateClip(clip.id, { speed })
    })
  }

  const setSelectedOpacity = (opacity: number) => {
    selectedClips.forEach(clip => {
      updateClip(clip.id, { opacity })
    })
  }

  const muteSelected = () => {
    selectedClips.forEach(clip => {
      updateClip(clip.id, { volume: 0 })
    })
  }

  const unmuteSelected = () => {
    selectedClips.forEach(clip => {
      updateClip(clip.id, { volume: 1 })
    })
  }

  const lockSelected = () => {
    selectedClips.forEach(clip => {
      updateClip(clip.id, { isLocked: true })
    })
  }

  const unlockSelected = () => {
    selectedClips.forEach(clip => {
      updateClip(clip.id, { isLocked: false })
    })
  }

  // ============================================================================
  // CLIPBOARD OPERATIONS
  // ============================================================================

  const copySelected = () => {
    copySelection()
  }

  const cutSelected = () => {
    cutSelection()
  }

  const pasteAtTime = (time: number, trackId?: string) => {
    paste(trackId, time)
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const isClipSelected = (clipId: string): boolean => {
    return uiState.selectedClipIds.includes(clipId)
  }

  const isTrackSelected = (trackId: string): boolean => {
    return uiState.selectedTrackIds.includes(trackId)
  }

  const isSectionSelected = (sectionId: string): boolean => {
    return uiState.selectedSectionIds.includes(sectionId)
  }

  const getSelectionStats = () => {
    const totalDuration = selectedClips.reduce((sum, clip) => sum + clip.duration, 0)
    const averageVolume = selectedClips.length > 0
      ? selectedClips.reduce((sum, clip) => sum + clip.volume, 0) / selectedClips.length
      : 0

    const trackTypes = [...new Set(selectedClips.map(clip => {
      const track = findTrack(clip.trackId)
      return track?.type || 'unknown'
    }))]

    const mediaTypes = [...new Set(selectedClips.map(clip => {
      const mediaFile = clip.mediaFile
      if (mediaFile?.isVideo) return 'video'
      if (mediaFile?.isAudio) return 'audio'
      if (mediaFile?.isImage) return 'image'
      return 'unknown'
    }))]

    return {
      totalDuration,
      averageVolume,
      trackTypes,
      mediaTypes
    }
  }

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    // Текущее выделение
    selectedClips,
    selectedTracks,
    selectedSections,

    // Состояние выделения
    hasSelection,
    selectionCount,
    selectionBounds,

    // Действия с выделением
    selectClip,
    selectTrack,
    selectSection,
    selectMultiple,
    selectAll,
    selectNone,
    invertSelection,

    // Выделение по области
    selectInTimeRange,
    selectByType,

    // Операции с выделенными элементами
    deleteSelected,
    duplicateSelected,
    groupSelected,
    ungroupSelected,

    // Свойства выделенных элементов
    setSelectedVolume,
    setSelectedSpeed,
    setSelectedOpacity,
    muteSelected,
    unmuteSelected,
    lockSelected,
    unlockSelected,

    // Буфер обмена
    copySelected,
    cutSelected,
    pasteAtTime,

    // Утилиты
    isClipSelected,
    isTrackSelected,
    isSectionSelected,
    getSelectionStats
  }
}
