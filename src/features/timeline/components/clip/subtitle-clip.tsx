import React from "react"

import { cn } from "@/lib/utils"

import { useTimeline } from "../../hooks/use-timeline"
import { useTimelineSelection } from "../../hooks/use-timeline-selection"
import { SubtitleClip as SubtitleClipType } from "../../types/timeline"

interface SubtitleClipProps {
  clip: SubtitleClipType
  trackHeight: number
  isSelected?: boolean
  isDragging?: boolean
  onMouseDown?: (e: React.MouseEvent) => void
  onDoubleClick?: (e: React.MouseEvent) => void
}

export function SubtitleClip({
  clip,
  trackHeight,
  isSelected = false,
  isDragging = false,
  onMouseDown,
  onDoubleClick,
}: SubtitleClipProps) {
  const { uiState } = useTimeline()
  const { selectClip } = useTimelineSelection()

  // Получаем pixelsPerSecond из uiState.timeScale
  const pixelsPerSecond = uiState.timeScale

  // Расчет позиции и размера
  const left = clip.startTime * pixelsPerSecond
  const width = clip.duration * pixelsPerSecond

  // Обработка клика
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectClip(clip.id)
  }

  // Определение цвета в зависимости от стиля
  const getSubtitleColor = () => {
    // Можно использовать разные цвета для разных стилей субтитров
    if (clip.subtitleStyleId) {
      // TODO: Получить цвет из стиля
      return "hsl(47 95% 50%)" // Желтый для стилизованных субтитров
    }
    return "hsl(25 95% 50%)" // Оранжевый для обычных субтитров
  }

  // Обрезка текста если он слишком длинный
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return `${text.substring(0, maxLength - 3)}...`
  }

  return (
    <div
      className={cn(
        "absolute rounded-md overflow-hidden cursor-move transition-all",
        "border-2 hover:brightness-110",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDragging && "opacity-50",
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: `${trackHeight - 8}px`,
        top: "4px",
        backgroundColor: getSubtitleColor(),
        borderColor: isSelected ? "hsl(var(--primary))" : "transparent",
      }}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      {/* Градиент для визуальной глубины */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"
        style={{ pointerEvents: "none" }}
      />

      {/* Информация о клипе */}
      <div className="relative h-full flex flex-col justify-between p-2">
        {/* Текст субтитра */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{truncateText(clip.text, 50)}</p>
          </div>
        </div>

        {/* Индикаторы анимаций */}
        <div className="flex items-center gap-1">
          {clip.animationIn && (
            <span className="text-[10px] bg-black/30 text-white px-1 rounded">{clip.animationIn.type}</span>
          )}
          {clip.animationOut && (
            <span className="text-[10px] bg-black/30 text-white px-1 rounded">{clip.animationOut.type}</span>
          )}
        </div>

        {/* Временные метки */}
        {width > 80 && (
          <div className="absolute bottom-1 right-1">
            <span className="text-[10px] text-white/80">{clip.duration.toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Ручки для изменения размера */}
      {isSelected && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 bg-black/20 hover:bg-black/40 cursor-ew-resize"
            onMouseDown={(e) => {
              e.stopPropagation()
              // TODO: Реализовать изменение начала клипа
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 bg-black/20 hover:bg-black/40 cursor-ew-resize"
            onMouseDown={(e) => {
              e.stopPropagation()
              // TODO: Реализовать изменение конца клипа
            }}
          />
        </>
      )}
    </div>
  )
}
