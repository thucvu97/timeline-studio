/**
 * Hook для синхронизации Timeline и Player
 */

import { useEffect } from "react"

import { usePlayer } from "@/features/video-player/services/player-provider"

import { useTimeline } from "./use-timeline"
import { useTimelineSelection } from "./use-timeline-selection"
import { timelinePlayerSync } from "../services/timeline-player-sync"

export function useTimelinePlayerSync() {
  const player = usePlayer()
  const { selectedClips } = useTimelineSelection()
  const { currentTime } = useTimeline()

  // Инициализируем сервис синхронизации с контекстом плеера
  useEffect(() => {
    timelinePlayerSync.setPlayerContext(player)
  }, [player])

  // Синхронизируем выбранный клип с плеером
  useEffect(() => {
    if (selectedClips.length === 1) {
      // Если выбран один клип, синхронизируем его
      const selectedClip = selectedClips[0]
      timelinePlayerSync.syncSelectedClip(selectedClip)
    } else if (selectedClips.length === 0) {
      // Если ничего не выбрано, очищаем синхронизацию
      timelinePlayerSync.clearSelection()
    }
    // Если выбрано несколько клипов, ничего не делаем
  }, [selectedClips])

  // Синхронизируем время воспроизведения
  useEffect(() => {
    timelinePlayerSync.syncPlaybackTime(currentTime)
  }, [currentTime])

  return {
    isSynced: selectedClips.length === 1,
    syncedClip: selectedClips.length === 1 ? selectedClips[0] : null,
  }
}
