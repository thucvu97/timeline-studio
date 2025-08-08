/**
 * Hook для работы с Video Editing доменом
 */

import { useCallback, useEffect, useState } from "react"
import type { MediaFile } from "@/features/media/types/media"
import type { PlayerContext } from "../machines/player-machine"
import type { TimelineContext } from "../machines/timeline-machine"
import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"

export function useVideoEditing() {
  const [orchestrator] = useState(() => getVideoEditingOrchestrator())
  const [timelineState, setTimelineState] = useState<TimelineContext>(() => orchestrator.getTimelineState().context)
  const [playerState, setPlayerState] = useState<PlayerContext>(() => orchestrator.getPlayerState().context)

  // Подписка на изменения состояния
  useEffect(() => {
    const timelineSub = orchestrator.subscribeToTimeline((state) => {
      setTimelineState(state.context)
    })

    const playerSub = orchestrator.subscribeToPlayer((state) => {
      setPlayerState(state.context)
    })

    return () => {
      timelineSub.unsubscribe()
      playerSub.unsubscribe()
    }
  }, [orchestrator])

  // Управление видео
  const loadVideo = useCallback(
    (video: MediaFile) => {
      return orchestrator.loadVideo(video)
    },
    [orchestrator],
  )

  const play = useCallback(() => {
    orchestrator.play()
  }, [orchestrator])

  const pause = useCallback(() => {
    orchestrator.pause()
  }, [orchestrator])

  const stop = useCallback(() => {
    orchestrator.stop()
  }, [orchestrator])

  const seek = useCallback(
    (time: number) => {
      orchestrator.seek(time)
    },
    [orchestrator],
  )

  const setPlaybackRate = useCallback(
    (rate: number) => {
      orchestrator.setPlaybackRate(rate)
    },
    [orchestrator],
  )

  const setVolume = useCallback(
    (volume: number) => {
      orchestrator.setVolume(volume)
    },
    [orchestrator],
  )

  // Управление эффектами
  const applyEffect = useCallback(
    (effect: { id: string; name: string; params: any }) => {
      orchestrator.applyEffect(effect)
    },
    [orchestrator],
  )

  const removeEffect = useCallback(
    (effectId: string) => {
      orchestrator.removeEffect(effectId)
    },
    [orchestrator],
  )

  // Управление фильтрами
  const applyFilter = useCallback(
    (filter: { id: string; name: string; params: any }) => {
      orchestrator.applyFilter(filter)
    },
    [orchestrator],
  )

  const removeFilter = useCallback(
    (filterId: string) => {
      orchestrator.removeFilter(filterId)
    },
    [orchestrator],
  )

  // Управление шаблонами
  const applyTemplate = useCallback(
    (template: { id: string; name: string; files: MediaFile[] }) => {
      orchestrator.applyTemplate(template)
    },
    [orchestrator],
  )

  const removeTemplate = useCallback(() => {
    orchestrator.removeTemplate()
  }, [orchestrator])

  // Управление timeline UI
  const setTimeScale = useCallback(
    (scale: number) => {
      orchestrator.setTimeScale(scale)
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

  // Управление выделением
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

  // Управление записью
  const startRecording = useCallback(() => {
    orchestrator.startRecording()
  }, [orchestrator])

  const stopRecording = useCallback(() => {
    orchestrator.stopRecording()
  }, [orchestrator])

  return {
    // Состояние
    timelineState,
    playerState,

    // Управление видео
    loadVideo,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setVolume,

    // Управление эффектами
    applyEffect,
    removeEffect,

    // Управление фильтрами
    applyFilter,
    removeFilter,

    // Управление шаблонами
    applyTemplate,
    removeTemplate,

    // Управление timeline UI
    setTimeScale,
    setEditMode,
    setSnapMode,

    // Управление выделением
    selectClip,
    selectTrack,
    selectSection,
    clearSelection,

    // Управление записью
    startRecording,
    stopRecording,

    // Удобные геттеры
    isPlaying: playerState.isPlaying,
    currentTime: playerState.currentTime,
    duration: playerState.duration,
    volume: playerState.volume,
    selectedClipIds: timelineState.selectedClipIds,
    selectedTrackIds: timelineState.selectedTrackIds,
    selectedSectionIds: timelineState.selectedSectionIds,
    editMode: timelineState.editMode,
    snapMode: timelineState.snapMode,
    timeScale: timelineState.timeScale,
  }
}
