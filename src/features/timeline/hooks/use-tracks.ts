/**
 * Hook for working with Timeline tracks
 */

import { useMemo } from "react"

import { findTrackById, getAllTracks, getTracksByType, sortTracksByOrder } from "@/lib/timeline/utils"

import { useTimeline } from "../timeline-provider"
import { TimelineTrack, TrackType } from "../types"

export interface UseTracksReturn {
  // Данные
  tracks: TimelineTrack[]
  globalTracks: TimelineTrack[]
  sectionTracks: TimelineTrack[]

  // Фильтрация
  getTracksByType: (type: TrackType) => TimelineTrack[]
  getTracksBySection: (sectionId: string) => TimelineTrack[]
  findTrack: (trackId: string) => TimelineTrack | null

  // Состояние
  selectedTracks: TimelineTrack[]
  visibleTracks: TimelineTrack[]

  // Действия
  addTrack: (trackType: TrackType, sectionId?: string, name?: string) => void
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void
  reorderTracks: (trackIds: string[]) => void

  // Управление состоянием треков
  toggleTrackMute: (trackId: string) => void
  toggleTrackLock: (trackId: string) => void
  toggleTrackVisibility: (trackId: string) => void
  toggleTrackSolo: (trackId: string) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setTrackPan: (trackId: string, pan: number) => void
  setTrackHeight: (trackId: string, height: number) => void

  // Выделение
  selectTrack: (trackId: string, addToSelection?: boolean) => void
  selectMultipleTracks: (trackIds: string[]) => void
  clearTrackSelection: () => void

  // Утилиты
  canAddTrackToSection: (sectionId: string, trackType: TrackType) => boolean
  getTrackStats: (trackId: string) => {
    clipCount: number
    totalDuration: number
    isEmpty: boolean
  }
}

export function useTracks(): UseTracksReturn {
  const { project, uiState, addTrack, removeTrack, updateTrack, reorderTracks, selectTracks, clearSelection } =
    useTimeline()

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const tracks = useMemo(() => {
    if (!project) return []
    return getAllTracks(project)
  }, [project])

  const globalTracks = useMemo(() => {
    if (!project) return []
    return sortTracksByOrder(project.globalTracks)
  }, [project])

  const sectionTracks = useMemo(() => {
    if (!project) return []
    const allSectionTracks = project.sections.flatMap((section) => section.tracks)
    return sortTracksByOrder(allSectionTracks)
  }, [project])

  const selectedTracks = useMemo(() => {
    return tracks.filter((track) => uiState.selectedTrackIds.includes(track.id))
  }, [tracks, uiState.selectedTrackIds])

  const visibleTracks = useMemo(() => {
    return tracks.filter((track) => !track.isHidden && uiState.visibleTrackTypes.includes(track.type))
  }, [tracks, uiState.visibleTrackTypes])

  // ============================================================================
  // FILTERING FUNCTIONS
  // ============================================================================

  const getTracksByTypeFunc = useMemo(
    () => (type: TrackType) => {
      if (!project) return []
      return getTracksByType(project, type)
    },
    [project],
  )

  const getTracksBySection = useMemo(
    () => (sectionId: string) => {
      if (!project) return []
      const section = project.sections.find((s) => s.id === sectionId)
      return section ? sortTracksByOrder(section.tracks) : []
    },
    [project],
  )

  const findTrack = useMemo(
    () => (trackId: string) => {
      if (!project) return null
      return findTrackById(project, trackId)
    },
    [project],
  )

  // ============================================================================
  // TRACK STATE MANAGEMENT
  // ============================================================================

  const toggleTrackMute = (trackId: string) => {
    const track = findTrack(trackId)
    if (track) {
      updateTrack(trackId, { isMuted: !track.isMuted })
    }
  }

  const toggleTrackLock = (trackId: string) => {
    const track = findTrack(trackId)
    if (track) {
      updateTrack(trackId, { isLocked: !track.isLocked })
    }
  }

  const toggleTrackVisibility = (trackId: string) => {
    const track = findTrack(trackId)
    if (track) {
      updateTrack(trackId, { isHidden: !track.isHidden })
    }
  }

  const toggleTrackSolo = (trackId: string) => {
    const track = findTrack(trackId)
    if (track) {
      updateTrack(trackId, { isSolo: !track.isSolo })
    }
  }

  const setTrackVolume = (trackId: string, volume: number) => {
    updateTrack(trackId, { volume: Math.max(0, Math.min(1, volume)) })
  }

  const setTrackPan = (trackId: string, pan: number) => {
    updateTrack(trackId, { pan: Math.max(-1, Math.min(1, pan)) })
  }

  const setTrackHeight = (trackId: string, height: number) => {
    updateTrack(trackId, { height: Math.max(40, Math.min(300, height)) })
  }

  // ============================================================================
  // SELECTION MANAGEMENT
  // ============================================================================

  const selectTrack = (trackId: string, addToSelection = false) => {
    if (addToSelection) {
      const currentSelection = uiState.selectedTrackIds
      const newSelection = currentSelection.includes(trackId)
        ? currentSelection.filter((id) => id !== trackId)
        : [...currentSelection, trackId]
      selectTracks(newSelection)
    } else {
      selectTracks([trackId])
    }
  }

  const selectMultipleTracks = (trackIds: string[]) => {
    selectTracks(trackIds)
  }

  const clearTrackSelection = () => {
    clearSelection()
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const canAddTrackToSection = (sectionId: string, trackType: TrackType): boolean => {
    // Проверяем, существует ли секция
    if (!project) return false
    const section = project.sections.find((s) => s.id === sectionId)
    if (!section) return false

    // Проверяем ограничения по типам треков
    const existingTypes = section.tracks.map((t) => t.type)

    // Например, можно ограничить количество видео треков
    if (trackType === "video" && existingTypes.filter((t) => t === "video").length >= 10) {
      return false
    }

    return true
  }

  const getTrackStats = (trackId: string) => {
    const track = findTrack(trackId)
    if (!track) {
      return { clipCount: 0, totalDuration: 0, isEmpty: true }
    }

    const clipCount = track.clips.length
    const totalDuration = track.clips.reduce((sum, clip) => sum + clip.duration, 0)
    const isEmpty = clipCount === 0

    return { clipCount, totalDuration, isEmpty }
  }

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    // Данные
    tracks,
    globalTracks,
    sectionTracks,

    // Фильтрация
    getTracksByType: getTracksByTypeFunc,
    getTracksBySection,
    findTrack,

    // Состояние
    selectedTracks,
    visibleTracks,

    // Действия
    addTrack,
    removeTrack,
    updateTrack,
    reorderTracks,

    // Управление состоянием треков
    toggleTrackMute,
    toggleTrackLock,
    toggleTrackVisibility,
    toggleTrackSolo,
    setTrackVolume,
    setTrackPan,
    setTrackHeight,

    // Выделение
    selectTrack,
    selectMultipleTracks,
    clearTrackSelection,

    // Утилиты
    canAddTrackToSection,
    getTrackStats,
  }
}
