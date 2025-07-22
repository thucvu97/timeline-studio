/**
 * Timeline Provider V2
 *
 * Новый провайдер timeline с интеграцией backend state management
 */

import React, { createContext, useCallback, useEffect, useMemo } from "react"

import { useMachine } from "@xstate/react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { ProjectCommand } from "@/features/app-state/types/commands"
import { ProjectState } from "@/features/app-state/types/unified-project"
import { MediaFile } from "@/features/media/types/media"

import { AppliedEffect, TimelineClip, TimelineProject, TimelineSection, TimelineTrack, TrackType } from "../types"
import { TimelineUIContext, timelineUIMachine } from "./timeline-ui-machine"
import { copyClips, cutClips, pasteClips } from "../utils/clip-operations"

export interface TimelineContextType {
  // Данные проекта (из backend)
  project: TimelineProject | null
  isPlaying: boolean
  currentTime: number
  playbackRate: number

  // UI состояние (из UI машины)
  uiState: TimelineUIContext
  timeScale: number
  scrollPosition: { x: number; y: number }
  editMode: "select" | "cut" | "trim" | "move"
  snapMode: "none" | "grid" | "clips" | "markers"

  // Выделение
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]

  // Флаги
  isLoading: boolean
  error: string | null
  hasClipboard: boolean

  // Команды проекта (через backend)
  createProject: (name: string, settings?: any) => Promise<void>
  saveProject: (path?: string) => Promise<void>

  // Команды секций
  addSection: (name: string, startTime: number, duration: number, realStartTime?: Date) => Promise<void>
  removeSection: (sectionId: string) => Promise<void>
  updateSection: (sectionId: string, updates: Partial<TimelineSection>) => Promise<void>

  // Команды треков
  addTrack: (trackType: TrackType, name?: string, index?: number) => Promise<void>
  removeTrack: (trackId: string) => Promise<void>
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => Promise<void>

  // Команды клипов
  addClip: (trackId: string, mediaFile: MediaFile, startTime: number) => Promise<void>
  removeClip: (clipId: string) => Promise<void>
  moveClip: (clipId: string, trackId: string, startTime: number) => Promise<void>
  trimClip: (clipId: string, start: number, end: number) => Promise<void>
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => Promise<void>

  // Команды эффектов клипов
  addEffectToClip: (clipId: string, effect: AppliedEffect) => Promise<void>
  removeEffectFromClip: (clipId: string, effectId: string) => Promise<void>
  updateClipEffect: (clipId: string, effectId: string, updates: Partial<AppliedEffect>) => Promise<void>
  reorderClipEffects: (clipId: string, fromIndex: number, toIndex: number) => Promise<void>

  // Команды воспроизведения
  play: () => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  seek: (time: number) => Promise<void>
  setPlaybackRate: (rate: number) => Promise<void>

  // UI команды (локальные)
  setTimeScale: (scale: number) => void
  setScrollPosition: (x: number, y: number) => void
  setEditMode: (mode: "select" | "cut" | "trim" | "move") => void
  toggleSnap: (snapMode: "none" | "grid" | "clips" | "markers") => void

  // Выделение (локальное)
  selectClips: (clipIds: string[], addToSelection?: boolean) => void
  selectTracks: (trackIds: string[], addToSelection?: boolean) => void
  selectSections: (sectionIds: string[], addToSelection?: boolean) => void
  clearSelection: () => void

  // Буфер обмена
  copySelection: () => void
  cutSelection: () => void
  paste: (targetTrackId?: string, targetTime?: number) => Promise<void>

  // Операции перетаскивания
  startDragClip: (clipId: string) => void
  startDragTrack: (trackId: string) => void
  stopDrag: () => void

  // Утилиты
  clearError: () => void

  // Прямая отправка событий (для компонентов, которые используют кастомные события)
  send: (event: any) => void
}

export const TimelineContext = createContext<TimelineContextType | null>(null)

interface TimelineProviderV2Props {
  children: React.ReactNode
}

export function TimelineProvider({ children }: TimelineProviderV2Props) {
  const [uiState, sendUI] = useMachine(timelineUIMachine)
  const [backendState, setBackendState] = React.useState<ProjectState | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const backendSync = useMemo(() => getBackendSync(), [])

  // Подписка на backend состояние
  useEffect(() => {
    const unsubscribeState = backendSync.onStateChange((state: ProjectState) => {
      setBackendState(state)

      // Синхронизируем playback состояние с UI машиной
      if (state.playbackState) {
        sendUI({
          type: "SYNC_PLAYBACK_STATE",
          isPlaying: state.playbackState.isPlaying,
          currentTime: state.playbackState.currentTime,
          playbackRate: state.playbackState.playbackRate || 1,
        })
      }
    })

    const unsubscribeEvents = backendSync.onEvent((event) => {
      console.log("Timeline backend event:", event)
    })

    return () => {
      unsubscribeState()
      unsubscribeEvents()
    }
  }, [backendSync, sendUI])

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: ProjectCommand) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        console.error("Timeline command failed:", err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Команды проекта
  const createProject = useCallback(
    async (name: string, settings?: any) => {
      await executeCommand({
        type: "CreateProject",
        params: { name, settings: settings || {} },
      })
    },
    [executeCommand],
  )

  const saveProject = useCallback(
    async (path?: string) => {
      await executeCommand({
        type: "SaveProject",
        params: { path },
      })
    },
    [executeCommand],
  )

  // Команды треков (секции в новой архитектуре не используются)
  const addTrack = useCallback(
    async (trackType: TrackType, name?: string, index?: number) => {
      await executeCommand({
        type: "AddTrack",
        params: { name: name || `Track ${Date.now()}`, trackType, index },
      })
    },
    [executeCommand],
  )

  const removeTrack = useCallback(
    async (trackId: string) => {
      await executeCommand({
        type: "DeleteTrack",
        params: { trackId },
      })
    },
    [executeCommand],
  )

  const updateTrack = useCallback(
    async (trackId: string, updates: Partial<TimelineTrack>) => {
      await executeCommand({
        type: "UpdateTrack",
        params: { trackId, updates },
      })
    },
    [executeCommand],
  )

  // Команды клипов
  const addClip = useCallback(
    async (trackId: string, mediaFile: MediaFile, startTime: number) => {
      await executeCommand({
        type: "AddClip",
        params: { trackId, mediaId: mediaFile.id, time: startTime },
      })
    },
    [executeCommand],
  )

  const removeClip = useCallback(
    async (clipId: string) => {
      await executeCommand({
        type: "DeleteClip",
        params: { clipId },
      })
    },
    [executeCommand],
  )

  const moveClip = useCallback(
    async (clipId: string, trackId: string, startTime: number) => {
      await executeCommand({
        type: "MoveClip",
        params: { clipId, trackId, time: startTime },
      })
    },
    [executeCommand],
  )

  const trimClip = useCallback(
    async (clipId: string, start: number, end: number) => {
      await executeCommand({
        type: "TrimClip",
        params: { clipId, start, end },
      })
    },
    [executeCommand],
  )

  const updateClip = useCallback(
    async (clipId: string, updates: Partial<TimelineClip>) => {
      await executeCommand({
        type: "UpdateClip",
        params: { clipId, updates },
      })
    },
    [executeCommand],
  )

  // Команды воспроизведения
  const play = useCallback(async () => {
    await executeCommand({ type: "Play", params: {} })
  }, [executeCommand])

  const pause = useCallback(async () => {
    await executeCommand({ type: "Pause", params: {} })
  }, [executeCommand])

  const stop = useCallback(async () => {
    await executeCommand({ type: "Stop", params: {} })
  }, [executeCommand])

  const seek = useCallback(
    async (time: number) => {
      await executeCommand({ type: "Seek", params: { time } })
    },
    [executeCommand],
  )

  const setPlaybackRate = useCallback(
    async (rate: number) => {
      await executeCommand({ type: "SetPlaybackRate", params: { rate } })
    },
    [executeCommand],
  )

  // UI команды (локальные)
  const setTimeScale = useCallback(
    (scale: number) => {
      sendUI({ type: "SET_TIME_SCALE", scale })
    },
    [sendUI],
  )

  const setScrollPosition = useCallback(
    (x: number, y: number) => {
      sendUI({ type: "SET_SCROLL_POSITION", x, y })
    },
    [sendUI],
  )

  const setEditMode = useCallback(
    (mode: "select" | "cut" | "trim" | "move") => {
      sendUI({ type: "SET_EDIT_MODE", mode })
    },
    [sendUI],
  )

  const toggleSnap = useCallback(
    (snapMode: "none" | "grid" | "clips" | "markers") => {
      sendUI({ type: "TOGGLE_SNAP", snapMode })
    },
    [sendUI],
  )

  // Выделение
  const selectClips = useCallback(
    (clipIds: string[], addToSelection?: boolean) => {
      sendUI({ type: "SELECT_CLIPS", clipIds, addToSelection })
    },
    [sendUI],
  )

  const selectTracks = useCallback(
    (trackIds: string[], addToSelection?: boolean) => {
      sendUI({ type: "SELECT_TRACKS", trackIds, addToSelection })
    },
    [sendUI],
  )

  const selectSections = useCallback(
    (sectionIds: string[], addToSelection?: boolean) => {
      sendUI({ type: "SELECT_SECTIONS", sectionIds, addToSelection })
    },
    [sendUI],
  )

  const clearSelection = useCallback(() => {
    sendUI({ type: "CLEAR_SELECTION" })
  }, [sendUI])

  // Буфер обмена
  const copySelection = useCallback(() => {
    if (!backendState?.project) return

    const selectedClips = uiState.context.selectedClipIds
      .map((id) => backendState.project!.timeline.clips.find((c) => c.id === id))
      .filter(Boolean) as TimelineClip[]

    if (selectedClips.length > 0) {
      const clipboardData = copyClips(selectedClips)
      sendUI({ type: "COPY_SELECTION", clipboardData })
    }
  }, [backendState, uiState.context.selectedClipIds, sendUI])

  const cutSelection = useCallback(() => {
    if (!backendState?.project) return

    const selectedClips = uiState.context.selectedClipIds
      .map((id) => backendState.project!.timeline.clips.find((c) => c.id === id))
      .filter(Boolean) as TimelineClip[]

    if (selectedClips.length > 0) {
      const clipboardData = cutClips(selectedClips)
      sendUI({ type: "CUT_SELECTION", clipboardData })

      // Удаляем клипы из backend
      selectedClips.forEach((clip) => {
        removeClip(clip.id).catch(console.error)
      })
    }
  }, [backendState, uiState.context.selectedClipIds, sendUI, removeClip])

  const paste = useCallback(
    async (targetTrackId?: string, targetTime?: number) => {
      const clipboard = uiState.context.clipboard
      if (!clipboard || !backendState?.project) return

      const tracks = backendState.project.timeline.tracks
      const trackId = targetTrackId || tracks[0]?.id
      const time = targetTime || uiState.context.currentTime

      if (!trackId) return

      try {
        const pastedClips = pasteClips(clipboard, trackId, time)

        // Добавляем клипы в backend
        for (const clip of pastedClips) {
          // Нужно получить MediaFile из clip для добавления
          // Это упрощенная версия - в реальности нужно получить MediaFile из mediaPool
          const mediaFile = { id: clip.mediaId } as MediaFile
          await addClip(trackId, mediaFile, clip.startTime)
        }
      } catch (err) {
        console.error("Paste failed:", err)
      }
    },
    [uiState.context.clipboard, uiState.context.currentTime, backendState, addClip],
  )

  // Операции перетаскивания
  const startDragClip = useCallback(
    (clipId: string) => {
      sendUI({ type: "START_DRAG_CLIP", clipId })
    },
    [sendUI],
  )

  const startDragTrack = useCallback(
    (trackId: string) => {
      sendUI({ type: "START_DRAG_TRACK", trackId })
    },
    [sendUI],
  )

  const stopDrag = useCallback(() => {
    sendUI({ type: "STOP_DRAG" })
  }, [sendUI])

  // Функция поиска клипа по ID
  const findClipById = useCallback(
    (clipId: string): TimelineClip | undefined => {
      if (!backendState?.project) return undefined

      for (const track of backendState.project.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId)
        if (clip) return clip as TimelineClip
      }
      return undefined
    },
    [backendState],
  )

  // Команды эффектов клипов
  const addEffectToClip = useCallback(
    async (clipId: string, effect: AppliedEffect) => {
      const clip = findClipById(clipId)
      if (!clip) {
        throw new Error(`Clip ${clipId} not found`)
      }

      const updatedEffects = [...(clip.effects || []), effect]
      await updateClip(clipId, { effects: updatedEffects })
    },
    [findClipById, updateClip],
  )

  const removeEffectFromClip = useCallback(
    async (clipId: string, effectId: string) => {
      const clip = findClipById(clipId)
      if (!clip) {
        throw new Error(`Clip ${clipId} not found`)
      }

      const updatedEffects = (clip.effects || []).filter((e) => e.id !== effectId)
      await updateClip(clipId, { effects: updatedEffects })
    },
    [findClipById, updateClip],
  )

  const updateClipEffect = useCallback(
    async (clipId: string, effectId: string, updates: Partial<AppliedEffect>) => {
      const clip = findClipById(clipId)
      if (!clip) {
        throw new Error(`Clip ${clipId} not found`)
      }

      const updatedEffects = (clip.effects || []).map((e) => (e.id === effectId ? { ...e, ...updates } : e))
      await updateClip(clipId, { effects: updatedEffects })
    },
    [findClipById, updateClip],
  )

  const reorderClipEffects = useCallback(
    async (clipId: string, fromIndex: number, toIndex: number) => {
      const clip = findClipById(clipId)
      if (!clip) {
        throw new Error(`Clip ${clipId} not found`)
      }

      const effects = [...(clip.effects || [])]
      const [removed] = effects.splice(fromIndex, 1)
      effects.splice(toIndex, 0, removed)

      // Обновляем порядок
      const updatedEffects = effects.map((e, index) => ({ ...e, order: index }))
      await updateClip(clipId, { effects: updatedEffects })
    },
    [findClipById, updateClip],
  )

  // Прямая отправка событий
  const send = useCallback(
    (event: any) => {
      // Обрабатываем кастомные события для эффектов
      switch (event.type) {
        case "ADD_EFFECT_TO_CLIP":
          addEffectToClip(event.clipId, event.effect).catch(console.error)
          break
        case "REMOVE_EFFECT_FROM_CLIP":
          removeEffectFromClip(event.clipId, event.effectId).catch(console.error)
          break
        case "UPDATE_CLIP_EFFECT":
          updateClipEffect(event.clipId, event.effectId, event.updates).catch(console.error)
          break
        case "REORDER_CLIP_EFFECTS":
          reorderClipEffects(event.clipId, event.fromIndex, event.toIndex).catch(console.error)
          break
        default:
          // Передаем остальные события в UI машину
          sendUI(event)
      }
    },
    [sendUI, addEffectToClip, removeEffectFromClip, updateClipEffect, reorderClipEffects],
  )

  // Утилиты
  const clearError = useCallback(() => {
    setError(null)
    sendUI({ type: "CLEAR_UI_ERROR" })
  }, [sendUI])

  // Заглушки для методов которых нет в новой архитектуре
  const addSection = useCallback(
    async (_name: string, _startTime: number, _duration: number, _realStartTime?: Date) => {
      console.warn("Sections are not supported in the new architecture")
    },
    [],
  )

  const removeSection = useCallback(async (_sectionId: string) => {
    console.warn("Sections are not supported in the new architecture")
  }, [])

  const updateSection = useCallback(async (_sectionId: string, _updates: Partial<TimelineSection>) => {
    console.warn("Sections are not supported in the new architecture")
  }, [])

  // Контекстное значение
  const contextValue: TimelineContextType = {
    // Данные проекта
    project: backendState?.project || null,
    isPlaying: uiState.context.isPlaying,
    currentTime: uiState.context.currentTime,
    playbackRate: uiState.context.playbackRate,

    // UI состояние
    uiState: uiState.context,
    timeScale: uiState.context.timeScale,
    scrollPosition: uiState.context.scrollPosition,
    editMode: uiState.context.editMode,
    snapMode: uiState.context.snapMode,

    // Выделение
    selectedClipIds: uiState.context.selectedClipIds,
    selectedTrackIds: uiState.context.selectedTrackIds,
    selectedSectionIds: uiState.context.selectedSectionIds,

    // Флаги
    isLoading,
    error: error || uiState.context.uiError,
    hasClipboard: uiState.context.clipboard !== null,

    // Команды
    createProject,
    saveProject,
    addSection,
    removeSection,
    updateSection,
    addTrack,
    removeTrack,
    updateTrack,
    addClip,
    removeClip,
    moveClip,
    trimClip,
    updateClip,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setTimeScale,
    setScrollPosition,
    setEditMode,
    toggleSnap,
    selectClips,
    selectTracks,
    selectSections,
    clearSelection,
    copySelection,
    cutSelection,
    paste,
    startDragClip,
    startDragTrack,
    stopDrag,
    clearError,
    addEffectToClip,
    removeEffectFromClip,
    updateClipEffect,
    reorderClipEffects,
    send,
  }

  return <TimelineContext.Provider value={contextValue}>{children}</TimelineContext.Provider>
}

// Legacy exports для обратной совместимости
export { TimelineProvider as TimelineProviderV2 }
export { TimelineContext as TimelineContextV2 }
export type { TimelineContextType as TimelineContextTypeV2 }
