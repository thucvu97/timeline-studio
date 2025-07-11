/**
 * Clip - Основной компонент клипа на Timeline
 */

import { memo, useCallback, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

import { AudioClip } from "./audio-clip"
import { ClipTrimHandles } from "./clip-trim-handles"
import { SubtitleClip } from "./subtitle-clip"
import { VideoClip } from "./video-clip"
import { useClipEditing } from "../../hooks/use-clip-editing"
import { useClipGroups } from "../../hooks/use-clip-groups"
import { useEditModeContext } from "../../hooks/use-edit-mode"
import { TimelineClip, TimelineTrack, isSubtitleClip } from "../../types"
import { EDIT_MODES } from "../../types/edit-modes"
import { GroupIndicator } from "../clip-groups/group-indicator"
import { RateStretchHandle } from "../edit-tools/rate-stretch-handle"
import { SlipSlideHandles } from "../edit-tools/slip-slide-handles"

interface ClipProps {
  clip: TimelineClip
  track: TimelineTrack
  timeScale: number // Пикселей на секунду
  onUpdate?: (updates: Partial<TimelineClip>) => void
  onRemove?: () => void
  className?: string
}

export const Clip = memo(function Clip({ clip, track, timeScale, onUpdate, onRemove, className }: ClipProps) {
  const { editMode } = useEditModeContext()
  const [isHovered, setIsHovered] = useState(false)
  const { getGroupByClip, toggleCollapse, lockGroup } = useClipGroups()

  const { isEditing, preview, handleTrimStart, handleTrimMove, handleTrimEnd } = useClipEditing(clip.id)
  
  // Получаем группу, если клип в ней находится
  const group = getGroupByClip(clip.id)

  // Мемоизируем вычисления позиции и размеров
  const { left, width } = useMemo(
    () => ({
      left: (preview?.startTime ?? clip.startTime) * timeScale,
      width: Math.max((preview?.duration ?? clip.duration) * timeScale, 20), // Минимальная ширина 20px
    }),
    [clip.startTime, clip.duration, timeScale, preview],
  )

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

  // Handle slip/slide start
  const handleSlipSlideStart = useCallback(
    (mouseX: number) => {
      if (editMode === EDIT_MODES.SLIP || editMode === EDIT_MODES.SLIDE) {
        handleTrimStart(editMode === EDIT_MODES.SLIP ? "start" : "end", mouseX)
      }
    },
    [editMode, handleTrimStart],
  )

  return (
    <div
      className={cn(
        "absolute top-1 bottom-1 cursor-pointer",
        "transition-all duration-150",
        clip.isSelected && "ring-2 ring-primary ring-offset-1",
        clip.isLocked && "opacity-60 cursor-not-allowed",
        isEditing && "z-10",
        className,
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      data-testid="timeline-clip"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderClipContent()}
      
      {/* Group indicator */}
      {group && !group.collapsed && (
        <div className="absolute top-0 left-0 m-1 z-10">
          <GroupIndicator
            group={group}
            onToggleCollapse={() => toggleCollapse(group.id)}
            onToggleLock={() => lockGroup(group.id, !group.locked)}
            className="scale-75 origin-top-left"
          />
        </div>
      )}

      {/* Trim handles for regular trim/ripple modes */}
      {(editMode === EDIT_MODES.TRIM || editMode === EDIT_MODES.RIPPLE) && (
        <ClipTrimHandles
          onTrimStart={handleTrimStart}
          onTrimMove={handleTrimMove}
          onTrimEnd={handleTrimEnd}
          isSelected={clip.isSelected || false}
          disabled={clip.isLocked}
        />
      )}

      {/* Slip/Slide handles */}
      <SlipSlideHandles
        clip={{
          ...clip,
          startTime: preview?.startTime ?? clip.startTime,
          duration: preview?.duration ?? clip.duration,
          offset: preview?.offset ?? clip.offset,
        }}
        isHovered={isHovered}
        isActive={isEditing}
        timeScale={timeScale}
        onSlipStart={editMode === EDIT_MODES.SLIP ? handleSlipSlideStart : undefined}
        onSlideStart={editMode === EDIT_MODES.SLIDE ? handleSlipSlideStart : undefined}
      />

      {/* Rate Stretch handles */}
      <RateStretchHandle
        clip={{
          ...clip,
          startTime: preview?.startTime ?? clip.startTime,
          duration: preview?.duration ?? clip.duration,
          playbackRate: clip.playbackRate,
        }}
        isHovered={isHovered}
        isActive={isEditing}
        timeScale={timeScale}
        onRateStretchStart={handleTrimStart}
      />
    </div>
  )
})
