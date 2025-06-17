/**
 * TrackInsertionZone - Зоны для создания новых треков
 * 
 * Компонент создает drop-зоны между треками для автоматического
 * создания новых треков при перетаскивании медиа файлов:
 * - Зоны вставки выше, между и ниже треков
 * - Автоматическое определение типа трека по медиа файлу
 * - Визуальная обратная связь при hovering
 */

import React from "react"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

interface TrackInsertionZoneProps {
  position: "above" | "between" | "below"
  trackId?: string // ID трека, относительно которого позиционируется зона
  insertIndex: number // Индекс позиции для вставки нового трека
  className?: string
}

export function TrackInsertionZone({ 
  position, 
  trackId, 
  insertIndex, 
  className 
}: TrackInsertionZoneProps) {
  const dropId = `track-insertion-${position}-${trackId || 'none'}-${insertIndex}`
  
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: {
      type: 'track-insertion',
      position,
      trackId,
      insertIndex,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative group transition-all duration-200 ease-in-out",
        // Базовая высота зоны
        "h-2",
        // Увеличиваем активную область при hover
        "hover:h-6",
        // Эффекты при drag over
        isOver && "h-8 bg-primary/20 border-2 border-primary border-dashed",
        className
      )}
      data-testid={dropId}
    >
      {/* Индикатор вставки - показывается только при hover или drag over */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "opacity-0 transition-opacity duration-200",
          // Показываем при hover группы или при drag over
          "group-hover:opacity-60",
          isOver && "opacity-100"
        )}
      >
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium",
          "bg-primary/10 border border-primary/30 text-primary",
          // Анимация появления
          "transform scale-95 group-hover:scale-100 transition-transform duration-200",
          isOver && "scale-100 bg-primary/20 border-primary"
        )}>
          <Plus className="w-3 h-3" />
          <span>
            {position === "above" && "Создать трек выше"}
            {position === "between" && "Создать трек между"}
            {position === "below" && "Создать трек ниже"}
          </span>
        </div>
      </div>

      {/* Скрытая линия разделения для визуального позиционирования */}
      <div
        className={cn(
          "absolute top-1/2 left-4 right-4 h-px",
          "bg-primary/20 opacity-0 transition-opacity duration-200",
          isOver && "opacity-80"
        )}
      />
    </div>
  )
}

/**
 * TrackInsertionZones - Контейнер для управления всеми зонами вставки
 * 
 * Размещает зоны вставки в правильных позициях относительно существующих треков
 */
interface TrackInsertionZonesProps {
  trackIds: string[]
  className?: string
  isVisible?: boolean // Показывать зоны только во время drag операции
}

export function TrackInsertionZones({ 
  trackIds, 
  className, 
  isVisible = true 
}: TrackInsertionZonesProps) {
  // Не показываем зоны если они не видимы или нет треков
  if (!isVisible) {
    return null
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Зона выше первого трека */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <TrackInsertionZone
          position="above"
          insertIndex={0}
        />
      </div>

      {/* Зоны между треками */}
      {trackIds.map((trackId, index) => (
        <div
          key={`between-${trackId}`}
          className="absolute left-0 right-0 pointer-events-auto"
          style={{
            // Позиционируем между треками (примерно 80px высота трека + отступы)
            top: `${(index + 1) * 90}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <TrackInsertionZone
            position="between"
            trackId={trackId}
            insertIndex={index + 1}
          />
        </div>
      ))}

      {/* Зона ниже последнего трека */}
      <div 
        className="absolute left-0 right-0 pointer-events-auto"
        style={{
          top: `${trackIds.length * 90 + 20}px`
        }}
      >
        <TrackInsertionZone
          position="below"
          insertIndex={trackIds.length}
        />
      </div>
    </div>
  )
}