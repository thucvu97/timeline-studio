/**
 * TrackContent - Содержимое трека (клипы на временной шкале)
 */

import { memo, useCallback, useMemo } from "react"

import { useDroppable } from "@dnd-kit/core"

import { useDropZone } from "@/features/drag-drop"
import { cn } from "@/lib/utils"

import { useDragDropTimeline } from "../../hooks/use-drag-drop-timeline"
import { useTimeline } from "../../hooks/use-timeline"
import { TimelineTrack } from "../../types"
import { Clip } from "../clip/clip"

interface TrackContentProps {
  track: TimelineTrack
  timeScale: number // Пикселей на секунду
  currentTime: number
  onUpdate?: (updates: Partial<TimelineTrack>) => void
}

export const TrackContent = memo(function TrackContent({ track, timeScale, currentTime, onUpdate }: TrackContentProps) {
  const { dragState, isValidDropTarget } = useDragDropTimeline()
  const { addClip } = useTimeline()

  // Setup droppable functionality for @dnd-kit
  const { isOver, setNodeRef } = useDroppable({
    id: `track-${track.id}`,
    data: {
      trackId: track.id,
      trackType: track.type,
    },
  })

  // Register as drop zone for global DragDropManager
  const acceptedTypes: Array<"media" | "music"> =
    track.type === "video" ? ["media"] : track.type === "audio" ? ["media", "music"] : []

  const { ref: dropZoneRef } = useDropZone(`track-${track.id}`, acceptedTypes, (item, event) => {
    // Calculate drop position based on mouse position
    const rect = dropZoneRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const dropTime = x / timeScale

    // Add clip to timeline
    if (item.type === "media" || item.type === "music") {
      addClip({
        id: `clip-${Date.now()}`,
        trackId: track.id,
        name: item.data.name,
        startTime: dropTime,
        duration: item.data.duration || 5,
        mediaStartTime: 0,
        mediaEndTime: item.data.duration || 5,
        mediaFile: item.data,
        isSelected: false,
        isLocked: false,
        volume: 1,
        effects: [],
        filters: [],
        transitions: [],
      })
    }
  })

  // Check if this track is a valid drop target
  const isValidTarget = isValidDropTarget(track.id, track.type)
  const showDropFeedback = dragState.isDragging && isOver && isValidTarget

  // Мемоизируем отсортированные клипы
  const sortedClips = useMemo(() => [...track.clips].sort((a, b) => a.startTime - b.startTime), [track.clips])

  // Мемоизируем обработчики для предотвращения создания новых функций
  const handleClipUpdate = useCallback(
    (clipId: string, updates: any) => {
      const updatedClips = track.clips.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip))
      onUpdate?.({ clips: updatedClips })
    },
    [track.clips, onUpdate],
  )

  const handleClipRemove = useCallback(
    (clipId: string) => {
      const updatedClips = track.clips.filter((clip) => clip.id !== clipId)
      onUpdate?.({ clips: updatedClips })
    },
    [track.clips, onUpdate],
  )

  // Мемоизируем сетку временной шкалы
  const gridLines = useMemo(() => {
    const lines = []
    const maxTime = 300 // 5 минут
    const step = 10 // каждые 10 секунд
    for (let time = 0; time <= maxTime; time += step) {
      lines.push(
        <div key={time} className="absolute top-0 bottom-0 w-px bg-border/30" style={{ left: time * timeScale }} />,
      )
    }
    return lines
  }, [timeScale])

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        if (dropZoneRef.current !== el) {
          dropZoneRef.current = el
        }
      }}
      data-track-id={track.id}
      data-testid={`track-container-${track.id}`}
      className={cn(
        "relative h-full w-full",
        "bg-background border-l border-border",
        showDropFeedback && "bg-primary/10 border-primary",
        dragState.isDragging && isValidTarget && "border-dashed border-2",
        dragState.isDragging && !isValidTarget && "opacity-50",
      )}
    >
      {/* Drop zone visual feedback */}
      {showDropFeedback && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-primary border-dashed rounded-md pointer-events-none z-30">
          <div className="flex items-center justify-center h-full">
            <span className="text-primary font-medium">Drop here</span>
          </div>
        </div>
      )}

      {/* Insertion indicator */}
      {dragState.dropPosition?.trackId === track.id && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-25 pointer-events-none"
          style={{ left: dragState.dropPosition.startTime * timeScale }}
        />
      )}

      {/* Сетка временной шкалы */}
      <div className="absolute inset-0 pointer-events-none">{gridLines}</div>

      {/* Playhead (указатель текущего времени) */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
        style={{ left: currentTime * timeScale }}
      />

      {/* Клипы */}
      <div className="relative h-full">
        {sortedClips.map((clip) => (
          <Clip
            key={clip.id}
            clip={clip}
            track={track}
            timeScale={timeScale}
            onUpdate={(updates) => handleClipUpdate(clip.id, updates)}
            onRemove={() => handleClipRemove(clip.id)}
          />
        ))}
      </div>

      {/* Область для добавления клипов (drop zone) */}
      {track.clips.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-sm">Перетащите медиафайлы сюда</div>
            <div className="text-xs mt-1">или используйте Browser</div>
          </div>
        </div>
      )}
    </div>
  )
})
