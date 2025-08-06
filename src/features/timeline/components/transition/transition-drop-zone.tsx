import { useDroppable } from "@dnd-kit/core"
import { useRef, useState } from "react"

import type { Transition } from "@/features/transitions/types/transitions"
import { cn } from "@/lib/utils"

import type { TimelineClip } from "../../types/timeline"

interface TransitionDropZoneProps {
  leftClip: TimelineClip
  rightClip: TimelineClip
  trackId: string
  timeScale: number
  onDrop: (transition: Transition) => void
  disabled?: boolean
  className?: string
}

/**
 * Зона для drag & drop переходов между клипами
 */
export function TransitionDropZone({
  leftClip,
  rightClip,
  trackId,
  timeScale,
  _onDrop,
  disabled = false,
  className,
}: TransitionDropZoneProps) {
  const [isHovered, setIsHovered] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Вычисляем позицию и размер зоны
  const leftEnd = leftClip.startTime + leftClip.duration
  const rightStart = rightClip.startTime
  const gap = rightStart - leftEnd

  // Позиция зоны - середина между клипами
  const position = leftEnd + gap / 2
  const left = position * timeScale

  // Настраиваем drop zone с @dnd-kit
  const { isOver, setNodeRef } = useDroppable({
    id: `transition-drop-${leftClip.id}-${rightClip.id}`,
    disabled,
    data: {
      type: "transition-drop",
      leftClipId: leftClip.id,
      rightClipId: rightClip.id,
      trackId,
    },
  })

  // Drop обрабатывается через DndContext в родительском компоненте

  // Если клипы не соседние, не показываем зону
  if (Math.abs(gap) > 0.01) {
    return null
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        if (dropZoneRef.current !== el) {
          dropZoneRef.current = el
        }
      }}
      className={cn("absolute top-0 bottom-0 z-10", "transition-all duration-200", isOver && "scale-110", className)}
      style={{
        left: left - 15, // Центрируем зону
        width: 30, // Ширина зоны
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Визуальный индикатор */}
      <div
        className={cn(
          "absolute inset-0 rounded",
          "border-2 border-dashed transition-all",
          isOver
            ? "border-primary bg-primary/20"
            : isHovered
              ? "border-muted-foreground/50 bg-muted/20"
              : "border-transparent",
        )}
      >
        {/* Центральная линия */}
        <div
          className={cn(
            "absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5",
            "transition-all",
            isOver ? "bg-primary" : isHovered ? "bg-muted-foreground/50" : "bg-transparent",
          )}
        />

        {/* Иконка при наведении */}
        {(isOver || isHovered) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                "text-xs font-bold",
                isOver ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground",
              )}
            >
              +
            </div>
          </div>
        )}
      </div>

      {/* Подсказка при наведении */}
      {isOver && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md">
            Отпустите для добавления перехода
          </div>
        </div>
      )}
    </div>
  )
}
