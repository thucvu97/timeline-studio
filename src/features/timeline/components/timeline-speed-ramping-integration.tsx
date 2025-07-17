/**
 * Компонент для интеграции Speed Ramping с Timeline UI
 */

import React, { useEffect } from "react"

import { useSpeedRampingPlayerIntegration } from "../hooks/use-speed-ramping-player-integration"
import { useTimeline } from "../hooks/use-timeline"

export function TimelineSpeedRampingIntegration() {
  const { state: timelineState } = useTimeline()
  const { 
    updatePlaybackRateForTime, 
    setAutoUpdateEnabled,
    resetPlaybackRate 
  } = useSpeedRampingPlayerIntegration()

  // Автоматически включаем интеграцию при монтировании
  useEffect(() => {
    setAutoUpdateEnabled(true)
    
    return () => {
      setAutoUpdateEnabled(false)
    }
  }, [setAutoUpdateEnabled])

  // Обновляем скорость при изменении времени воспроизведения
  useEffect(() => {
    if (timelineState.context.isPlaying) {
      updatePlaybackRateForTime(timelineState.context.currentTime)
    }
  }, [timelineState.context.currentTime, timelineState.context.isPlaying, updatePlaybackRateForTime])

  // Сбрасываем скорость при паузе
  useEffect(() => {
    if (!timelineState.context.isPlaying) {
      resetPlaybackRate()
    }
  }, [timelineState.context.isPlaying, resetPlaybackRate])

  // Этот компонент не рендерит UI, только обрабатывает логику
  return null
}

/**
 * Индикатор текущей скорости воспроизведения
 */
export function SpeedRampingIndicator() {
  const { getCurrentPlaybackRate, isSpeedRampingActive } = useSpeedRampingPlayerIntegration()
  const { state: timelineState } = useTimeline()
  
  const currentRate = getCurrentPlaybackRate()
  const hasActiveSpeedRamping = Object.keys(timelineState.context.speedRampingConfigs).some(
    (clipId) => isSpeedRampingActive(clipId)
  )

  if (!hasActiveSpeedRamping || currentRate === 1.0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-md text-sm font-mono z-50">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        <span>Speed: {currentRate.toFixed(2)}x</span>
      </div>
    </div>
  )
}

/**
 * Компонент для отображения Speed Ramping статуса в Timeline
 */
export function TimelineSpeedRampingStatus() {
  const { state: timelineState } = useTimeline()
  const { isSpeedRampingActive } = useSpeedRampingPlayerIntegration()

  const activeSpeedRampingClips = Object.entries(timelineState.context.speedRampingConfigs)
    .filter(([clipId, config]) => config.enabled && isSpeedRampingActive(clipId))
    .map(([clipId]) => clipId)

  if (activeSpeedRampingClips.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
      <span>
        Speed Ramping: {activeSpeedRampingClips.length} clip{activeSpeedRampingClips.length > 1 ? 's' : ''}
      </span>
    </div>
  )
}