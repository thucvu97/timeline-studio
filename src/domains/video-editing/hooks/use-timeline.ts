/**
 * Hook для работы с Timeline
 */

import { useCallback, useEffect, useState } from "react"
import type { ClipboardData } from "@/features/timeline/utils/clip-operations"
import type { TimelineContext } from "../machines/timeline-machine"
import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"

export function useTimeline() {
  const [orchestrator] = useState(() => getVideoEditingOrchestrator())
  const [state, setState] = useState<TimelineContext>(() => orchestrator.getTimelineState().context)

  // Подписка на изменения состояния
  useEffect(() => {
    const subscription = orchestrator.subscribeToTimeline((state) => {
      setState(state.context)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [orchestrator])

  // UI управление
  const setTimeScale = useCallback(
    (scale: number) => {
      orchestrator.setTimeScale(scale)
    },
    [orchestrator],
  )

  const setScrollPosition = useCallback(
    (x: number, y: number) => {
      orchestrator.getTimelineActor().send({
        type: "SET_SCROLL_POSITION",
        x,
        y,
      })
    },
    [orchestrator],
  )

  const setEditMode = useCallback(
    (mode: "select" | "cut" | "trim" | "move") => {
      orchestrator.setEditMode(mode)
    },
    [orchestrator],
  )

  const setSnapMode = useCallback(
    (mode: "none" | "grid" | "clips" | "markers") => {
      orchestrator.setSnapMode(mode)
    },
    [orchestrator],
  )

  // Выделение
  const selectClip = useCallback(
    (clipId: string, multiple = false) => {
      orchestrator.selectClip(clipId, multiple)
    },
    [orchestrator],
  )

  const selectTrack = useCallback(
    (trackId: string, multiple = false) => {
      orchestrator.selectTrack(trackId, multiple)
    },
    [orchestrator],
  )

  const selectSection = useCallback(
    (sectionId: string, multiple = false) => {
      orchestrator.selectSection(sectionId, multiple)
    },
    [orchestrator],
  )

  const clearSelection = useCallback(() => {
    orchestrator.clearSelection()
  }, [orchestrator])

  // Drag & Drop
  const startDragClip = useCallback(
    (clipId: string) => {
      orchestrator.getTimelineActor().send({
        type: "START_DRAG_CLIP",
        clipId,
      })
    },
    [orchestrator],
  )

  const startDragTrack = useCallback(
    (trackId: string) => {
      orchestrator.getTimelineActor().send({
        type: "START_DRAG_TRACK",
        trackId,
      })
    },
    [orchestrator],
  )

  const startDragResource = useCallback(
    (resourceType: "transition" | "effect" | "filter", resourceId: string) => {
      orchestrator.getTimelineActor().send({
        type: "START_DRAG_RESOURCE",
        resourceType,
        resourceId,
      })
    },
    [orchestrator],
  )

  const endDrag = useCallback(() => {
    orchestrator.getTimelineActor().send({ type: "END_DRAG" })
  }, [orchestrator])

  // Буфер обмена
  const copyToClipboard = useCallback(
    (data: ClipboardData) => {
      orchestrator.getTimelineActor().send({
        type: "COPY_TO_CLIPBOARD",
        data,
      })
    },
    [orchestrator],
  )

  const clearClipboard = useCallback(() => {
    orchestrator.getTimelineActor().send({ type: "CLEAR_CLIPBOARD" })
  }, [orchestrator])

  // UI флаги
  const toggleWaveforms = useCallback(() => {
    orchestrator.getTimelineActor().send({ type: "TOGGLE_WAVEFORMS" })
  }, [orchestrator])

  const toggleThumbnails = useCallback(() => {
    orchestrator.getTimelineActor().send({ type: "TOGGLE_THUMBNAILS" })
  }, [orchestrator])

  const toggleMarkers = useCallback(() => {
    orchestrator.getTimelineActor().send({ type: "TOGGLE_MARKERS" })
  }, [orchestrator])

  // Ошибки
  const setUIError = useCallback(
    (error: string) => {
      orchestrator.getTimelineActor().send({
        type: "SET_UI_ERROR",
        error,
      })
    },
    [orchestrator],
  )

  const clearUIError = useCallback(() => {
    orchestrator.getTimelineActor().send({ type: "CLEAR_UI_ERROR" })
  }, [orchestrator])

  return {
    // Состояние
    ...state,

    // UI управление
    setTimeScale,
    setScrollPosition,
    setEditMode,
    setSnapMode,

    // Выделение
    selectClip,
    selectTrack,
    selectSection,
    clearSelection,

    // Drag & Drop
    startDragClip,
    startDragTrack,
    startDragResource,
    endDrag,

    // Буфер обмена
    copyToClipboard,
    clearClipboard,

    // UI флаги
    toggleWaveforms,
    toggleThumbnails,
    toggleMarkers,

    // Ошибки
    setUIError,
    clearUIError,

    // Вспомогательные функции
    hasSelection:
      state.selectedClipIds.length > 0 || state.selectedTrackIds.length > 0 || state.selectedSectionIds.length > 0,
    hasClipboard: state.clipboard !== null,
  }
}
