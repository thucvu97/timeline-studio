/**
 * Clip - Основной компонент клипа на Timeline
 */

import React from "react"

import { cn } from "@/lib/utils"

import { AudioClip } from "./audio-clip"
import { SubtitleClip } from "./subtitle-clip"
import { VideoClip } from "./video-clip"
import { TimelineClip, TimelineTrack, isSubtitleClip } from "../../types"

interface ClipProps {
  clip: TimelineClip
  track: TimelineTrack
  timeScale: number // Пикселей на секунду
  onUpdate?: (updates: Partial<TimelineClip>) => void
  onRemove?: () => void
  className?: string
}

export function Clip({ clip, track, timeScale, onUpdate, onRemove, className }: ClipProps) {
  // Вычисляем позицию и размеры клипа
  const left = clip.startTime * timeScale
  const width = clip.duration * timeScale
  const minWidth = 20 // Минимальная ширина клипа

  // Выбираем специализированный компонент в зависимости от типа трека
  const renderClipContent = () => {
    switch (track.type) {
      case "video":
      case "image":
        return <VideoClip clip={clip} track={track} onUpdate={onUpdate} onRemove={onRemove} />

      case "audio":
      case "music":
      case "voiceover":
      case "sfx":
      case "ambient":
        return <AudioClip clip={clip} track={track} onUpdate={onUpdate} onRemove={onRemove} />

      case "subtitle":
      case "title":
        if (isSubtitleClip(clip)) {
          return <SubtitleClip clip={clip} trackHeight={track.height} isSelected={clip.isSelected} />
        }
        return (
          <div className="h-full w-full bg-muted border border-border rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Invalid subtitle clip</span>
          </div>
        )

      default:
        return (
          <div className="h-full w-full bg-muted border border-border rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">{track.type}</span>
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        "absolute top-1 bottom-1 cursor-pointer",
        "transition-all duration-150",
        clip.isSelected && "ring-2 ring-primary ring-offset-1",
        clip.isLocked && "opacity-60 cursor-not-allowed",
        className,
      )}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, minWidth)}px`,
      }}
      data-testid="timeline-clip"
    >
      {renderClipContent()}
    </div>
  )
}
