/**
 * Hook для работы с Player
 */

import { useCallback, useEffect, useState } from "react"
import type { MediaFile } from "@/features/media/types/media"
import type { PlayerContext } from "../machines/player-machine"
import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"

export function usePlayer() {
  const [orchestrator] = useState(() => getVideoEditingOrchestrator())
  const [state, setState] = useState<PlayerContext>(() => orchestrator.getPlayerState().context)

  // Подписка на изменения состояния
  useEffect(() => {
    const subscription = orchestrator.subscribeToPlayer((state) => {
      setState(state.context)
    })

    return () => {
      subscription.unsubscribe()
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

  // Speed Ramping
  const toggleSpeedRamping = useCallback(() => {
    orchestrator.getPlayerActor().send({ type: "TOGGLE_SPEED_RAMPING" })
  }, [orchestrator])

  const setBasePlaybackRate = useCallback(
    (rate: number) => {
      orchestrator.getPlayerActor().send({
        type: "SET_BASE_PLAYBACK_RATE",
        rate,
      })
    },
    [orchestrator],
  )

  // Управление источником видео
  const setVideoSource = useCallback(
    (source: "browser" | "timeline") => {
      orchestrator.getPlayerActor().send({
        type: "SET_VIDEO_SOURCE",
        source,
      })
    },
    [orchestrator],
  )

  const setPreviewMedia = useCallback(
    (media: MediaFile | null) => {
      orchestrator.getPlayerActor().send({
        type: "SET_PREVIEW_MEDIA",
        media,
      })
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

  // Режим изменения размера
  const setResizableMode = useCallback(
    (enabled: boolean) => {
      orchestrator.getPlayerActor().send({
        type: "SET_RESIZABLE_MODE",
        enabled,
      })
    },
    [orchestrator],
  )

  // Управление записью
  const startRecording = useCallback(() => {
    orchestrator.startRecording()
  }, [orchestrator])

  const stopRecording = useCallback(() => {
    orchestrator.stopRecording()
  }, [orchestrator])

  // Настройки пререндера
  const setPrerenderEnabled = useCallback(
    (enabled: boolean) => {
      orchestrator.getPlayerActor().send({
        type: "SET_PRERENDER_ENABLED",
        enabled,
      })
    },
    [orchestrator],
  )

  const setPrerenderQuality = useCallback(
    (quality: number) => {
      orchestrator.getPlayerActor().send({
        type: "SET_PRERENDER_QUALITY",
        quality,
      })
    },
    [orchestrator],
  )

  const setPrerenderSegmentDuration = useCallback(
    (duration: number) => {
      orchestrator.getPlayerActor().send({
        type: "SET_PRERENDER_SEGMENT_DURATION",
        duration,
      })
    },
    [orchestrator],
  )

  const setPrerenderApplyEffects = useCallback(
    (apply: boolean) => {
      orchestrator.getPlayerActor().send({
        type: "SET_PRERENDER_APPLY_EFFECTS",
        apply,
      })
    },
    [orchestrator],
  )

  const setPrerenderAuto = useCallback(
    (auto: boolean) => {
      orchestrator.getPlayerActor().send({
        type: "SET_PRERENDER_AUTO",
        auto,
      })
    },
    [orchestrator],
  )

  return {
    // Состояние
    ...state,

    // Управление видео
    loadVideo,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setVolume,

    // Speed Ramping
    toggleSpeedRamping,
    setBasePlaybackRate,

    // Управление источником
    setVideoSource,
    setPreviewMedia,

    // Управление эффектами
    applyEffect,
    removeEffect,

    // Управление фильтрами
    applyFilter,
    removeFilter,

    // Управление шаблонами
    applyTemplate,
    removeTemplate,

    // Режимы
    setResizableMode,

    // Запись
    startRecording,
    stopRecording,

    // Настройки пререндера
    setPrerenderEnabled,
    setPrerenderQuality,
    setPrerenderSegmentDuration,
    setPrerenderApplyEffects,
    setPrerenderAuto,

    // Вспомогательные функции
    hasVideo: state.video !== null,
    canPlay: state.isVideoReady && !state.isPlaying,
    canPause: state.isPlaying,
    hasEffects: state.appliedEffects.length > 0,
    hasFilters: state.appliedFilters.length > 0,
    hasTemplate: state.appliedTemplate !== null,
  }
}
