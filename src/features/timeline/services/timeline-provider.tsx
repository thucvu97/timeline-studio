/**
 * Timeline Provider
 *
 * React контекст для управления состоянием Timeline
 */

import React, { createContext, useCallback } from "react"

import { useMachine } from "@xstate/react"

import { MediaFile } from "@/features/media/types/media"

import { TimelineClip, TimelineProject, TimelineSection, TimelineTrack, TimelineUIState, TrackType } from "../types"
import { timelineMachine } from "./timeline-machine"

export interface TimelineContextType {
  // Состояние
  project: TimelineProject | null
  uiState: TimelineUIState
  isPlaying: boolean
  isRecording: boolean
  currentTime: number
  error: string | null
  lastAction: string | null

  // Статус машины состояний
  isReady: boolean
  isSaving: boolean

  // Действия с проектом
  createProject: (name: string, settings?: any) => void
  loadProject: (project: TimelineProject) => void
  saveProject: () => void
  closeProject: () => void

  // Действия с секциями
  addSection: (name: string, startTime: number, duration: number, realStartTime?: Date) => void
  removeSection: (sectionId: string) => void
  updateSection: (sectionId: string, updates: Partial<TimelineSection>) => void

  // Действия с треками
  addTrack: (trackType: TrackType, sectionId?: string, name?: string) => void
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void
  reorderTracks: (trackIds: string[]) => void

  // Действия с клипами
  addClip: (trackId: string, mediaFile: MediaFile, startTime: number, duration?: number) => void
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void
  splitClip: (clipId: string, splitTime: number) => void
  trimClip: (clipId: string, newStartTime: number, newDuration: number) => void

  // Выделение
  selectClips: (clipIds: string[], addToSelection?: boolean) => void
  selectTracks: (trackIds: string[], addToSelection?: boolean) => void
  selectSections: (sectionIds: string[], addToSelection?: boolean) => void
  clearSelection: () => void

  // Воспроизведение
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void

  // UI
  setTimeScale: (scale: number) => void
  setScrollPosition: (x: number, y: number) => void
  setEditMode: (mode: "select" | "cut" | "trim" | "move") => void
  toggleSnap: (snapMode: "none" | "grid" | "clips" | "markers") => void

  // История
  undo: () => void
  redo: () => void
  clearHistory: () => void

  // Буфер обмена
  copySelection: () => void
  cutSelection: () => void
  paste: (targetTrackId?: string, targetTime?: number) => void

  // Утилиты
  clearError: () => void

  // Прямой доступ к send для расширенных операций
  send: (event: any) => void
}

export const TimelineContext = createContext<TimelineContextType | null>(null)

interface TimelineProviderProps {
  children: React.ReactNode
}

export function TimelineProvider({ children }: TimelineProviderProps) {
  const [state, send] = useMachine(timelineMachine)

  // Извлекаем данные из состояния машины
  const { project, uiState, isPlaying, isRecording, currentTime, error, lastAction } = state.context

  // Статус машины состояний
  const isReady = state.matches("ready")
  const isSaving = state.matches("saving")

  // Проект
  const createProject = useCallback(
    (name: string, settings?: any) => {
      send({ type: "CREATE_PROJECT", name, settings })
    },
    [send],
  )

  const loadProject = useCallback(
    (project: TimelineProject) => {
      send({ type: "LOAD_PROJECT", project })
    },
    [send],
  )

  const saveProject = useCallback(() => {
    send({ type: "SAVE_PROJECT" })
  }, [send])

  const closeProject = useCallback(() => {
    send({ type: "CLOSE_PROJECT" })
  }, [send])

  // Секции
  const addSection = useCallback(
    (name: string, startTime: number, duration: number, realStartTime?: Date) => {
      send({ type: "ADD_SECTION", name, startTime, duration, realStartTime })
    },
    [send],
  )

  const removeSection = useCallback(
    (sectionId: string) => {
      send({ type: "REMOVE_SECTION", sectionId })
    },
    [send],
  )

  const updateSection = useCallback(
    (sectionId: string, updates: Partial<TimelineSection>) => {
      send({ type: "UPDATE_SECTION", sectionId, updates })
    },
    [send],
  )

  // Треки
  const addTrack = useCallback(
    (trackType: TrackType, sectionId?: string, name?: string) => {
      send({ type: "ADD_TRACK", trackType, sectionId, name })
    },
    [send],
  )

  const removeTrack = useCallback(
    (trackId: string) => {
      send({ type: "REMOVE_TRACK", trackId })
    },
    [send],
  )

  const updateTrack = useCallback(
    (trackId: string, updates: Partial<TimelineTrack>) => {
      send({ type: "UPDATE_TRACK", trackId, updates })
    },
    [send],
  )

  const reorderTracks = useCallback(
    (trackIds: string[]) => {
      send({ type: "REORDER_TRACKS", trackIds })
    },
    [send],
  )

  // Клипы
  const addClip = useCallback(
    (trackId: string, mediaFile: MediaFile, startTime: number, duration?: number) => {
      send({ type: "ADD_CLIP", trackId, mediaFile, startTime, duration })
    },
    [send],
  )

  const removeClip = useCallback(
    (clipId: string) => {
      send({ type: "REMOVE_CLIP", clipId })
    },
    [send],
  )

  const updateClip = useCallback(
    (clipId: string, updates: Partial<TimelineClip>) => {
      send({ type: "UPDATE_CLIP", clipId, updates })
    },
    [send],
  )

  const moveClip = useCallback(
    (clipId: string, newTrackId: string, newStartTime: number) => {
      send({ type: "MOVE_CLIP", clipId, newTrackId, newStartTime })
    },
    [send],
  )

  const splitClip = useCallback(
    (clipId: string, splitTime: number) => {
      send({ type: "SPLIT_CLIP", clipId, splitTime })
    },
    [send],
  )

  const trimClip = useCallback(
    (clipId: string, newStartTime: number, newDuration: number) => {
      send({ type: "TRIM_CLIP", clipId, newStartTime, newDuration })
    },
    [send],
  )

  // Выделение
  const selectClips = useCallback(
    (clipIds: string[], addToSelection = false) => {
      send({ type: "SELECT_CLIPS", clipIds, addToSelection })
    },
    [send],
  )

  const selectTracks = useCallback(
    (trackIds: string[], addToSelection = false) => {
      send({ type: "SELECT_TRACKS", trackIds, addToSelection })
    },
    [send],
  )

  const selectSections = useCallback(
    (sectionIds: string[], addToSelection = false) => {
      send({ type: "SELECT_SECTIONS", sectionIds, addToSelection })
    },
    [send],
  )

  const clearSelection = useCallback(() => {
    send({ type: "CLEAR_SELECTION" })
  }, [send])

  // Воспроизведение
  const play = useCallback(() => {
    send({ type: "PLAY" })
  }, [send])

  const pause = useCallback(() => {
    send({ type: "PAUSE" })
  }, [send])

  const stop = useCallback(() => {
    send({ type: "STOP" })
  }, [send])

  const seek = useCallback(
    (time: number) => {
      send({ type: "SEEK", time })
    },
    [send],
  )

  const setPlaybackRate = useCallback(
    (rate: number) => {
      send({ type: "SET_PLAYBACK_RATE", rate })
    },
    [send],
  )

  // UI
  const setTimeScale = useCallback(
    (scale: number) => {
      send({ type: "SET_TIME_SCALE", scale })
    },
    [send],
  )

  const setScrollPosition = useCallback(
    (x: number, y: number) => {
      send({ type: "SET_SCROLL_POSITION", x, y })
    },
    [send],
  )

  const setEditMode = useCallback(
    (mode: "select" | "cut" | "trim" | "move") => {
      send({ type: "SET_EDIT_MODE", mode })
    },
    [send],
  )

  const toggleSnap = useCallback(
    (snapMode: "none" | "grid" | "clips" | "markers") => {
      send({ type: "TOGGLE_SNAP", snapMode })
    },
    [send],
  )

  // История
  const undo = useCallback(() => {
    send({ type: "UNDO" })
  }, [send])

  const redo = useCallback(() => {
    send({ type: "REDO" })
  }, [send])

  const clearHistory = useCallback(() => {
    send({ type: "CLEAR_HISTORY" })
  }, [send])

  // Буфер обмена
  const copySelection = useCallback(() => {
    send({ type: "COPY_SELECTION" })
  }, [send])

  const cutSelection = useCallback(() => {
    send({ type: "CUT_SELECTION" })
  }, [send])

  const paste = useCallback(
    (targetTrackId?: string, targetTime?: number) => {
      send({ type: "PASTE", targetTrackId, targetTime })
    },
    [send],
  )

  // Утилиты
  const clearError = useCallback(() => {
    send({ type: "CLEAR_ERROR" })
  }, [send])

  const contextValue: TimelineContextType = {
    // Состояние
    project,
    uiState,
    isPlaying,
    isRecording,
    currentTime,
    error,
    lastAction,
    isReady,
    isSaving,
    // Действия
    createProject,
    loadProject,
    saveProject,
    closeProject,
    addSection,
    removeSection,
    updateSection,
    addTrack,
    removeTrack,
    updateTrack,
    reorderTracks,
    addClip,
    removeClip,
    updateClip,
    moveClip,
    splitClip,
    trimClip,
    selectClips,
    selectTracks,
    selectSections,
    clearSelection,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setTimeScale,
    setScrollPosition,
    setEditMode,
    toggleSnap,
    undo,
    redo,
    clearHistory,
    copySelection,
    cutSelection,
    paste,
    clearError,
    send,
  }

  return <TimelineContext.Provider value={contextValue}>{children}</TimelineContext.Provider>
}
