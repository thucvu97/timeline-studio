/**
 * Хук для интеграции Speed Ramping с плеером
 */

import { useCallback, useEffect, useRef } from "react"

// import { usePlayer } from "@/features/video-player/hooks/use-player"

import { useTimeline } from "./use-timeline"

export interface SpeedRampingPlayerIntegration {
  /**
   * Обновить скорость воспроизведения на основе текущего времени
   */
  updatePlaybackRateForTime: (time: number) => void

  /**
   * Получить текущую скорость воспроизведения
   */
  getCurrentPlaybackRate: () => number

  /**
   * Сбросить скорость воспроизведения к нормальной
   */
  resetPlaybackRate: () => void

  /**
   * Проверить, активен ли speed ramping для текущего клипа
   */
  isSpeedRampingActive: (clipId: string) => boolean

  /**
   * Включить/выключить автоматическое обновление скорости
   */
  setAutoUpdateEnabled: (enabled: boolean) => void
}

export function useSpeedRampingPlayerIntegration(): SpeedRampingPlayerIntegration {
  // const { send: sendPlayer } = usePlayer()
  const sendPlayer = () => {} // Мок для отправки команд плееру
  const timeline = useTimeline()

  const autoUpdateEnabledRef = useRef(true)
  const lastUpdateTimeRef = useRef(0)
  const updateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Получаем speed ramping service из timeline контекста
  // Временно убираем, так как нет speedRampingService в новой архитектуре
  const speedRampingService = null

  // Функция для обновления скорости воспроизведения
  const updatePlaybackRateForTime = useCallback(
    (time: number) => {
      if (!timeline.project || !autoUpdateEnabledRef.current) {
        return
      }

      // Находим активный клип на текущем времени
      const activeClip = findActiveClipAtTime(timeline.project, time)
      if (!activeClip) {
        resetPlaybackRate()
        return
      }

      // Проверяем, активен ли speed ramping для этого клипа
      if (!speedRampingService?.isSpeedRampingEnabled(activeClip.id)) {
        resetPlaybackRate()
        return
      }

      // Вычисляем время внутри клипа
      const clipTime = time - activeClip.startTime + activeClip.offset

      // Получаем скорость для этого времени
      const playbackRate = speedRampingService?.getPlaybackRateForTime(activeClip.id, clipTime) || 1.0

      // Обновляем плеер только если скорость изменилась
      if (Math.abs(playbackRate - lastUpdateTimeRef.current) > 0.001) {
        sendPlayer()
        lastUpdateTimeRef.current = playbackRate
      }
    },
    [timeline.project, speedRampingService, sendPlayer],
  )

  // Получить текущую скорость воспроизведения
  const getCurrentPlaybackRate = useCallback(() => {
    return lastUpdateTimeRef.current || 1.0
  }, [])

  // Сбросить скорость воспроизведения
  const resetPlaybackRate = useCallback(() => {
    sendPlayer()
    lastUpdateTimeRef.current = 1.0
  }, [sendPlayer])

  // Проверить, активен ли speed ramping для клипа
  const isSpeedRampingActive = useCallback(
    (clipId: string) => {
      return speedRampingService?.isSpeedRampingEnabled(clipId) || false
    },
    [speedRampingService],
  )

  // Включить/выключить автоматическое обновление
  const setAutoUpdateEnabled = useCallback(
    (enabled: boolean) => {
      autoUpdateEnabledRef.current = enabled

      if (enabled) {
        // Начинаем интервал обновления
        updateIntervalRef.current = setInterval(() => {
          const currentTime = timeline.currentTime
          updatePlaybackRateForTime(currentTime)
        }, 100) // Обновляем каждые 100ms
      } else {
        // Останавливаем интервал
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current)
          updateIntervalRef.current = undefined
        }
        resetPlaybackRate()
      }
    },
    [timeline.currentTime, updatePlaybackRateForTime, resetPlaybackRate],
  )

  // Автоматически обновляем скорость при изменении времени
  useEffect(() => {
    if (autoUpdateEnabledRef.current) {
      updatePlaybackRateForTime(timeline.currentTime)
    }
  }, [timeline.currentTime, updatePlaybackRateForTime])

  // Очищаем интервал при размонтировании
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

  return {
    updatePlaybackRateForTime,
    getCurrentPlaybackRate,
    resetPlaybackRate,
    isSpeedRampingActive,
    setAutoUpdateEnabled,
  }
}

// Утилита для поиска активного клипа на определенном времени
function findActiveClipAtTime(project: any, time: number) {
  // Ищем в глобальных треках
  for (const track of project.globalTracks) {
    for (const clip of track.clips) {
      if (time >= clip.startTime && time < clip.startTime + clip.duration) {
        return clip
      }
    }
  }

  // Ищем в секциях
  for (const section of project.sections) {
    for (const track of section.tracks) {
      for (const clip of track.clips) {
        if (time >= clip.startTime && time < clip.startTime + clip.duration) {
          return clip
        }
      }
    }
  }

  return null
}
