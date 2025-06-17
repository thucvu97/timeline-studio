/**
 * Track - Основной компонент трека Timeline
 *
 * Отображает трек с заголовком и содержимым (клипами)
 */

import React from "react"

import { cn } from "@/lib/utils"

import { TimelineTrack } from "../../types"
import { TrackHeightAdjuster } from "../track-height-adjuster"
import { TrackContent } from "./track-content"
import { TrackHeader } from "./track-header"

interface TrackProps {
  track: TimelineTrack | null
  timeScale?: number // Пикселей на секунду
  currentTime?: number
  isSelected?: boolean
  onSelect?: (trackId: string) => void
  onUpdate?: (track: TimelineTrack) => void
  onMuteToggle?: (trackId: string) => void
  onLockToggle?: (trackId: string) => void
  onHeightChange?: (trackId: string, height: number) => void
  className?: string
  style?: React.CSSProperties
}

export function Track({
  track,
  timeScale = 100,
  currentTime = 0,
  isSelected = false,
  onSelect,
  onUpdate,
  onMuteToggle,
  onLockToggle,
  onHeightChange,
  className,
  style,
}: TrackProps) {
  // Обработка null track
  if (!track) {
    return (
      <div
        data-testid="timeline-track"
        className={cn("flex border-b border-border bg-background track", className)}
        style={style}
      >
        <div className="p-4 text-muted-foreground">Invalid track</div>
      </div>
    )
  }

  const handleSelect = () => {
    onSelect?.(track.id)
  }

  const handleUpdate = (updates: Partial<TimelineTrack>) => {
    onUpdate?.({ ...track, ...updates })
  }

  return (
    <div
      data-testid="timeline-track"
      className={cn(
        "flex border-b border-border bg-background track relative",
        "hover:bg-accent/5 transition-colors",
        isSelected && "bg-accent/10 border-accent",
        track.isHidden && "opacity-50",
        className,
      )}
      style={{ height: track.height, ...style }}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleSelect()
        }
      }}
    >
      {/* Заголовок трека (фиксированная ширина) */}
      <div className="flex-shrink-0 w-48 border-r border-border">
        <TrackHeader track={track} isSelected={isSelected} onUpdate={handleUpdate} />
      </div>

      {/* Содержимое трека (клипы) */}
      <div className="flex-1 relative overflow-hidden">
        <TrackContent track={track} timeScale={timeScale} currentTime={currentTime} onUpdate={handleUpdate} />
      </div>

      {/* Регулятор высоты трека */}
      {onHeightChange && (
        <TrackHeightAdjuster trackId={track.id} currentHeight={track.height} onHeightChange={onHeightChange} />
      )}
    </div>
  )
}
