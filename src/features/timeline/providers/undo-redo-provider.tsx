/**
 * Провайдер для автоматической регистрации действий Undo/Redo
 */

import { createContext, type ReactNode, useContext, useEffect } from "react"
import { useTimeline } from "../hooks/use-timeline"
import { UndoRedoHelpers, useUndoRedo } from "../hooks/use-undo-redo"
import type { TimelineClip, TimelineTrack } from "../types"

interface UndoRedoContextType {
  registerAction: ReturnType<typeof useUndoRedo>["registerAction"]
  startGrouping: ReturnType<typeof useUndoRedo>["startGrouping"]
  endGrouping: ReturnType<typeof useUndoRedo>["endGrouping"]
}

const UndoRedoContext = createContext<UndoRedoContextType | null>(null)

interface UndoRedoProviderProps {
  children: ReactNode
}

export function UndoRedoProvider({ children }: UndoRedoProviderProps) {
  const undoRedo = useUndoRedo()
  const timeline = useTimeline()

  // Создаем контекст с основными функциями регистрации
  const contextValue: UndoRedoContextType = {
    registerAction: undoRedo.registerAction,
    startGrouping: undoRedo.startGrouping,
    endGrouping: undoRedo.endGrouping,
  }

  return <UndoRedoContext.Provider value={contextValue}>{children}</UndoRedoContext.Provider>
}

/**
 * Hook для использования UndoRedo в дочерних компонентах
 */
export function useUndoRedoContext() {
  const context = useContext(UndoRedoContext)
  if (!context) {
    throw new Error("useUndoRedoContext must be used within UndoRedoProvider")
  }
  return context
}

/**
 * Hook для автоматической регистрации действий с клипами
 */
export function useClipUndoRedo() {
  const { registerAction, startGrouping, endGrouping } = useUndoRedoContext()

  const registerAddClip = (clipId: string, trackId: string, mediaFile: any, time: number) => {
    return registerAction(UndoRedoHelpers.createAddClipAction(clipId, trackId, mediaFile, time))
  }

  const registerRemoveClip = (clip: TimelineClip) => {
    return registerAction(UndoRedoHelpers.createRemoveClipAction(clip))
  }

  const registerMoveClip = (
    clipId: string,
    oldTrackId: string,
    oldTime: number,
    newTrackId: string,
    newTime: number,
  ) => {
    return registerAction(UndoRedoHelpers.createMoveClipAction(clipId, oldTrackId, oldTime, newTrackId, newTime))
  }

  const registerBatchOperation = (description: string, originalClips: TimelineClip[], updatedClips: TimelineClip[]) => {
    return registerAction(UndoRedoHelpers.createBatchOperationAction(description, originalClips, updatedClips))
  }

  const registerUpdateClip = (
    clipId: string,
    oldProperties: Partial<TimelineClip>,
    newProperties: Partial<TimelineClip>,
  ) => {
    return registerAction({
      type: "UPDATE_CLIP",
      description: "Изменить свойства клипа",
      undoData: { clipId, oldProperties },
      redoData: { clipId, newProperties },
      affectedEntities: { clips: [clipId] },
      priority: "medium",
      mergeable: true,
    })
  }

  const registerTrimClip = (
    clipId: string,
    oldStartTime: number,
    oldEndTime: number,
    newStartTime: number,
    newEndTime: number,
  ) => {
    return registerAction({
      type: "TRIM_CLIP",
      description: "Обрезать клип",
      undoData: { clipId, oldStartTime, oldEndTime },
      redoData: { clipId, newStartTime, newEndTime },
      affectedEntities: { clips: [clipId] },
      priority: "medium",
      mergeable: true,
    })
  }

  const registerSplitClip = (originalClipId: string, newClipId: string, splitTime: number) => {
    return registerAction({
      type: "SPLIT_CLIP",
      description: "Разделить клип",
      undoData: { originalClipId, newClipId },
      redoData: { originalClipId, newClipId, splitTime },
      affectedEntities: { clips: [originalClipId, newClipId] },
      priority: "high",
      mergeable: false,
    })
  }

  return {
    registerAddClip,
    registerRemoveClip,
    registerMoveClip,
    registerBatchOperation,
    registerUpdateClip,
    registerTrimClip,
    registerSplitClip,
    startGrouping,
    endGrouping,
  }
}

/**
 * Hook для автоматической регистрации действий с треками
 */
export function useTrackUndoRedo() {
  const { registerAction, startGrouping, endGrouping } = useUndoRedoContext()

  const registerAddTrack = (trackId: string, trackType: string, trackName: string) => {
    return registerAction({
      type: "ADD_TRACK",
      description: `Добавить трек "${trackName}"`,
      undoData: { trackId },
      redoData: { trackId, trackType, trackName },
      affectedEntities: { tracks: [trackId] },
      priority: "medium",
      mergeable: false,
    })
  }

  const registerRemoveTrack = (track: TimelineTrack, clips: TimelineClip[] = []) => {
    return registerAction({
      type: "REMOVE_TRACK",
      description: `Удалить трек "${track.name}"`,
      undoData: {
        trackId: track.id,
        trackType: track.type,
        trackName: track.name,
        clips,
      },
      redoData: { trackId: track.id },
      affectedEntities: {
        tracks: [track.id],
        clips: clips.map((c) => c.id),
      },
      priority: "high",
      mergeable: false,
    })
  }

  const registerUpdateTrack = (
    trackId: string,
    oldProperties: Partial<TimelineTrack>,
    newProperties: Partial<TimelineTrack>,
  ) => {
    return registerAction({
      type: "UPDATE_TRACK",
      description: "Изменить трек",
      undoData: { trackId, oldProperties },
      redoData: { trackId, newProperties },
      affectedEntities: { tracks: [trackId] },
      priority: "medium",
      mergeable: true,
    })
  }

  const registerReorderTracks = (oldOrder: string[], newOrder: string[]) => {
    return registerAction({
      type: "REORDER_TRACKS",
      description: "Переставить треки",
      undoData: { trackOrder: oldOrder },
      redoData: { trackOrder: newOrder },
      affectedEntities: { tracks: newOrder },
      priority: "medium",
      mergeable: false,
    })
  }

  return {
    registerAddTrack,
    registerRemoveTrack,
    registerUpdateTrack,
    registerReorderTracks,
    startGrouping,
    endGrouping,
  }
}

/**
 * Hook для автоматической регистрации действий с keyframes
 */
export function useKeyframeUndoRedo() {
  const { registerAction, startGrouping, endGrouping } = useUndoRedoContext()

  const registerAddKeyframe = (clipId: string, keyframeId: string, keyframe: any) => {
    return registerAction({
      type: "ADD_KEYFRAME",
      description: "Добавить keyframe",
      undoData: { clipId, keyframeId },
      redoData: { clipId, keyframeId, keyframe },
      affectedEntities: { clips: [clipId], keyframes: [keyframeId] },
      priority: "medium",
      mergeable: false,
    })
  }

  const registerRemoveKeyframe = (clipId: string, keyframeId: string, keyframe: any) => {
    return registerAction({
      type: "REMOVE_KEYFRAME",
      description: "Удалить keyframe",
      undoData: { clipId, keyframeId, keyframe },
      redoData: { clipId, keyframeId },
      affectedEntities: { clips: [clipId], keyframes: [keyframeId] },
      priority: "medium",
      mergeable: false,
    })
  }

  const registerUpdateKeyframe = (clipId: string, keyframeId: string, oldKeyframe: any, newKeyframe: any) => {
    return registerAction({
      type: "UPDATE_KEYFRAME",
      description: "Изменить keyframe",
      undoData: { clipId, keyframeId, keyframe: oldKeyframe },
      redoData: { clipId, keyframeId, keyframe: newKeyframe },
      affectedEntities: { clips: [clipId], keyframes: [keyframeId] },
      priority: "medium",
      mergeable: true,
    })
  }

  return {
    registerAddKeyframe,
    registerRemoveKeyframe,
    registerUpdateKeyframe,
    startGrouping,
    endGrouping,
  }
}
