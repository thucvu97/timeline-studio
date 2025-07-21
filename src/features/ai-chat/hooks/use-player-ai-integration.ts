import { useEffect, useCallback } from "react"

import { usePlayer } from "@/features/video-player"
import { PlayerStateAccess } from "@/features/ai-chat/tools/player/types"
import { setPlayerStateAccess } from "@/features/ai-chat/tools/player/utils/helpers"
import { MediaFile } from "@/features/media/types/media"

/**
 * Хук для интеграции Player с AI функциональностью
 * Предоставляет доступ к состоянию плеера для AI инструментов
 */
export function usePlayerAIIntegration() {
  const player = usePlayer()

  // Функция для получения текущего медиа
  const getCurrentMedia = useCallback((): MediaFile | null => {
    // Приоритет: previewMedia > video
    return player.previewMedia || player.video
  }, [player.previewMedia, player.video])

  // Функция для получения статуса воспроизведения
  const getPlaybackStatus = useCallback(() => {
    return {
      isPlaying: player.isPlaying,
      currentTime: player.currentTime,
      duration: player.duration,
      playbackRate: player.currentPlaybackRate,
      volume: player.volume,
      isSeeking: player.isSeeking,
      isLoading: player.isVideoLoading,
      isReady: player.isVideoReady,
    }
  }, [
    player.isPlaying,
    player.currentTime,
    player.duration,
    player.currentPlaybackRate,
    player.volume,
    player.isSeeking,
    player.isVideoLoading,
    player.isVideoReady,
  ])

  // Функция для получения примененных эффектов
  const getAppliedEffects = useCallback(() => {
    return {
      effects: player.appliedEffects || [],
      filters: player.appliedFilters || [],
      template: player.appliedTemplate,
    }
  }, [player.appliedEffects, player.appliedFilters, player.appliedTemplate])

  // Функция для анализа качества медиа
  const analyzeMediaQuality = useCallback((): any => {
    const media = getCurrentMedia()
    if (!media) return null

    const issues = []
    const videoStream = media.probeData?.streams?.find(s => s.codec_type === "video")
    const audioStream = media.probeData?.streams?.find(s => s.codec_type === "audio")

    // Проверка качества видео
    if (videoStream) {
      const width = videoStream.width || 0
      const height = videoStream.height || 0
      const bitrate = parseInt(videoStream.bit_rate || "0") || 0
      const fps = eval(videoStream.r_frame_rate || "0") || 0

      if (width < 1280 || height < 720) {
        issues.push({
          type: "low_resolution",
          severity: "warning",
          message: `Низкое разрешение: ${width}x${height}`,
        })
      }

      if (bitrate < 1000000 && bitrate > 0) {
        issues.push({
          type: "low_bitrate",
          severity: "warning",
          message: `Низкий битрейт: ${(bitrate / 1000000).toFixed(1)} Mbps`,
        })
      }

      if (fps < 24 && fps > 0) {
        issues.push({
          type: "low_fps",
          severity: "warning",
          message: `Низкая частота кадров: ${fps} fps`,
        })
      }
    }

    // Проверка качества аудио
    if (audioStream) {
      const sampleRate = parseInt(audioStream.sample_rate || "0") || 0
      const bitrate = parseInt(audioStream.bit_rate || "0") || 0

      if (sampleRate < 44100 && sampleRate > 0) {
        issues.push({
          type: "low_sample_rate",
          severity: "info",
          message: `Низкая частота дискретизации: ${sampleRate} Hz`,
        })
      }

      if (bitrate < 128000 && bitrate > 0) {
        issues.push({
          type: "low_audio_bitrate",
          severity: "info",
          message: `Низкий битрейт аудио: ${(bitrate / 1000).toFixed(0)} kbps`,
        })
      }
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : "unknown",
      fps: videoStream ? eval(videoStream.r_frame_rate || "0") || 0 : 0,
      videoBitrate: videoStream ? parseInt(videoStream.bit_rate || "0") || 0 : 0,
      audioBitrate: audioStream ? parseInt(audioStream.bit_rate || "0") || 0 : 0,
      sampleRate: audioStream ? parseInt(audioStream.sample_rate || "0") || 0 : 0,
    }
  }, [getCurrentMedia])

  // Эффект для установки доступа к состоянию плеера
  useEffect(() => {
    const playerAccess: PlayerStateAccess = {
      getPlayerState: () => ({
        currentMedia: getCurrentMedia(),
        isPlaying: player.isPlaying,
        currentTime: player.currentTime,
        duration: player.duration,
        volume: player.volume,
        playbackRate: player.currentPlaybackRate,
        appliedEffects: player.appliedEffects || [],
        appliedFilters: player.appliedFilters || [],
        appliedTemplate: player.appliedTemplate,
        videoSource: player.videoSource,
      }),
      getCurrentMedia,
      getPlaybackStatus,
      getAppliedEffects,
      play: () => player.setIsPlaying(true),
      pause: () => player.setIsPlaying(false),
      seek: (time: number) => player.setCurrentTime(time),
      setVolume: player.setVolume,
      setPlaybackRate: player.updatePlaybackRate,
      applyEffect: player.applyEffect,
      removeEffect: (effectId: string) => {
        // Удаляем эффект из списка
        const updatedEffects = player.appliedEffects.filter(e => e.id !== effectId)
        player.clearEffects()
        updatedEffects.forEach(e => player.applyEffect(e))
      },
      applyFilter: player.applyFilter,
      removeFilter: (filterId: string) => {
        // Удаляем фильтр из списка
        const updatedFilters = player.appliedFilters.filter(f => f.id !== filterId)
        player.clearFilters()
        updatedFilters.forEach(f => player.applyFilter(f))
      },
      applyTemplate: (template: any, files: MediaFile[]) => {
        player.applyTemplate(template, files)
      },
      clearTemplate: player.clearTemplate,
      setMedia: (media: MediaFile) => {
        player.setPreviewMedia(media)
        player.setVideoSource("browser")
      },
      analyzeMediaQuality,
      getPlayerStats: () => ({
        totalPlayTime: player.currentTime,
        mediaCount: player.video ? 1 : 0,
        effectsCount: player.appliedEffects.length,
        filtersCount: player.appliedFilters.length,
        hasTemplate: player.appliedTemplate !== null,
        speedRampingEnabled: player.speedRampingEnabled,
      }),
    }

    // Устанавливаем доступ для AI инструментов
    setPlayerStateAccess(playerAccess)

    // Очищаем при размонтировании
    return () => {
      setPlayerStateAccess(null)
    }
  }, [
    player,
    getCurrentMedia,
    getPlaybackStatus,
    getAppliedEffects,
    analyzeMediaQuality,
  ])

  return {
    isReady: player.isVideoReady && getCurrentMedia() !== null,
    hasMedia: getCurrentMedia() !== null,
    isPlaying: player.isPlaying,
    effectsCount: player.appliedEffects.length,
    filtersCount: player.appliedFilters.length,
  }
}