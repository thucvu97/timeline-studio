/**
 * Hook для виртуализации клипов на треке
 * Рендерит только видимые клипы в viewport
 */

import { useCallback, useMemo, useRef } from "react"
import type { TimelineClip } from "../types"

interface UseVirtualizedClipsOptions {
  clips: TimelineClip[]
  timeScale: number // пикселей в секунду
  containerWidth: number
  scrollOffset: number
  overscan?: number
}

export function useVirtualizedClips({
  clips,
  timeScale,
  containerWidth,
  scrollOffset,
  overscan = 3,
}: UseVirtualizedClipsOptions) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Вычисляем видимый временной диапазон
  const visibleTimeRange = useMemo(() => {
    const startTime = scrollOffset / timeScale
    const endTime = (scrollOffset + containerWidth) / timeScale
    return { startTime, endTime }
  }, [scrollOffset, containerWidth, timeScale])

  // Фильтруем только видимые клипы с учетом overscan
  const visibleClips = useMemo(() => {
    const overscanTime = (overscan * containerWidth) / timeScale
    const expandedStart = visibleTimeRange.startTime - overscanTime
    const expandedEnd = visibleTimeRange.endTime + overscanTime

    return clips.filter((clip) => {
      const clipEnd = clip.startTime + clip.duration
      return clipEnd >= expandedStart && clip.startTime <= expandedEnd
    })
  }, [clips, visibleTimeRange, overscan, containerWidth, timeScale])

  // Вычисляем позиции и размеры для каждого клипа
  const clipLayouts = useMemo(() => {
    return visibleClips.map((clip) => {
      const left = clip.startTime * timeScale
      const width = clip.duration * timeScale
      return {
        clip,
        left,
        width,
        isFullyVisible:
          clip.startTime >= visibleTimeRange.startTime && clip.startTime + clip.duration <= visibleTimeRange.endTime,
      }
    })
  }, [visibleClips, timeScale, visibleTimeRange])

  // Функция для определения, нужно ли рендерить превью/waveform
  const shouldRenderDetails = useCallback(
    (clip: TimelineClip) => {
      const clipWidth = clip.duration * timeScale
      return clipWidth > 50 // Рендерим детали только если клип шире 50px
    },
    [timeScale],
  )

  // Функция для получения оптимизированного качества превью
  const getPreviewQuality = useCallback(
    (clip: TimelineClip) => {
      const clipWidth = clip.duration * timeScale
      if (clipWidth < 100) return "low"
      if (clipWidth < 300) return "medium"
      return "high"
    },
    [timeScale],
  )

  return {
    parentRef,
    visibleClips: clipLayouts,
    shouldRenderDetails,
    getPreviewQuality,
    visibleTimeRange,
  }
}
