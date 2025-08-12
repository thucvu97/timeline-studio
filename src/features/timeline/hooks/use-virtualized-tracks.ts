/**
 * Hook для виртуализации треков Timeline
 * Использует @tanstack/react-virtual для рендеринга только видимых треков
 */

import { useVirtualizer } from "@tanstack/react-virtual"
import { useCallback, useMemo, useRef } from "react"
import type { TimelineTrack } from "../types"

interface UseVirtualizedTracksOptions {
  tracks: TimelineTrack[]
  estimateSize?: (index: number) => number
  overscan?: number
  horizontal?: boolean
}

export function useVirtualizedTracks({
  tracks,
  estimateSize = (index) => tracks[index]?.height || 80,
  overscan = 3,
  horizontal = false,
}: UseVirtualizedTracksOptions) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Создаем virtualizer
  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
    horizontal,
    // Добавляем измерение для точного позиционирования
    measureElement: (element) => {
      if (element && element instanceof HTMLElement) {
        return horizontal ? element.offsetWidth : element.offsetHeight
      }
      return estimateSize(0)
    },
  })

  // Получаем виртуальные элементы
  const virtualItems = virtualizer.getVirtualItems()

  // Вычисляем общий размер для скроллинга
  const totalSize = virtualizer.getTotalSize()

  // Функция для скролла к определенному треку
  const scrollToTrack = useCallback(
    (index: number, options?: { align?: "start" | "center" | "end" | "auto" }) => {
      virtualizer.scrollToIndex(index, options)
    },
    [virtualizer],
  )

  // Функция для получения позиции трека
  const getTrackOffset = useCallback(
    (index: number) => {
      const items = virtualizer.getVirtualItems()
      const item = items.find((item) => item.index === index)
      return item ? item.start : 0
    },
    [virtualizer],
  )

  // Мемоизированные стили для контейнера
  const containerStyle = useMemo(
    () => ({
      [horizontal ? "width" : "height"]: `${totalSize}px`,
      position: "relative" as const,
    }),
    [totalSize, horizontal],
  )

  // Функция для получения стилей виртуального элемента
  const getItemStyle = useCallback(
    (virtualItem: any) => ({
      position: "absolute" as const,
      top: horizontal ? 0 : virtualItem.start,
      left: horizontal ? virtualItem.start : 0,
      [horizontal ? "width" : "height"]: `${virtualItem.size}px`,
      [horizontal ? "height" : "width"]: "100%",
    }),
    [horizontal],
  )

  return {
    parentRef,
    virtualItems,
    totalSize,
    containerStyle,
    getItemStyle,
    scrollToTrack,
    getTrackOffset,
    virtualizer,
  }
}
