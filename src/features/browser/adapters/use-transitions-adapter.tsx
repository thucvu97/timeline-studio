import React from "react"

import { useFavorites } from "@/features/app-state"
import { MediaFile } from "@/features/media/types/media"
import { TransitionPreview } from "@/features/transitions/components/transition-preview"
import { useTransitions } from "@/features/transitions/hooks/use-transitions"
import { Transition } from "@/features/transitions/types/transitions"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для переходов
 */
const TransitionPreviewWrapper: React.FC<PreviewComponentProps<Transition>> = ({
  item: transition,
  size,
  viewMode,
  onClick,
  onDragStart,
  isSelected,
  isFavorite,
  onToggleFavorite,
  onAddToTimeline,
}) => {
  const handleClick = () => {
    onClick?.(transition)
  }

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(transition, e)
  }

  // Демонстрационные видео для превью переходов
  const demoVideos = {
    source: { path: "/t1.mp4" } as MediaFile,
    target: { path: "/t2.mp4" } as MediaFile,
  }

  // Для переходов TransitionPreview ожидает другие пропсы
  const previewSize = typeof size === "number" ? size : size.width
  const previewWidth = typeof size === "number" ? size : size.width
  const previewHeight = typeof size === "number" ? size : size.height

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
        onDragStart={handleDragStart}
        draggable
      >
        {/* Transition preview thumbnail */}
        <div className="flex-shrink-0 w-12 h-9 bg-gray-200 rounded overflow-hidden relative">
          <video src="/t1.mp4" className="w-full h-full object-cover" muted playsInline preload="metadata" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </div>

        {/* Transition Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {transition.labels?.ru || transition.labels?.en || transition.name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {transition.description?.ru || transition.description?.en || ""}
          </div>
        </div>

        {/* Category */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{transition.category}</div>

        {/* Complexity */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{transition.complexity}</div>

        {/* Duration */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{transition.duration?.default || "1"}s</div>
      </div>
    )
  }

  // Thumbnails mode - use the original TransitionPreview component
  return (
    <div onDragStart={handleDragStart} draggable>
      <TransitionPreview
        transition={transition}
        sourceVideo={demoVideos.source}
        targetVideo={demoVideos.target}
        transitionType={transition.type}
        onClick={handleClick}
        size={previewSize}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
      />
    </div>
  )
}

/**
 * Хук для создания адаптера переходов
 */
export function useTransitionsAdapter(): ListAdapter<Transition> {
  const { transitions, loading, error } = useTransitions()
  const { isItemFavorite } = useFavorites()

  return {
    // Хук для получения данных
    useData: () => ({
      items: transitions,
      loading,
      error: error || null,
    }),

    // Компонент превью
    PreviewComponent: TransitionPreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (transition, sortBy) => {
      switch (sortBy) {
        case "name":
          return (transition.labels?.ru || transition.labels?.en || transition.name || "").toLowerCase()

        case "category":
          return transition.category.toLowerCase()

        case "complexity":
          // Определяем порядок сложности: basic < intermediate < advanced
          const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
          return complexityOrder[transition.complexity || "basic"]

        case "duration":
          return transition.duration?.default || 1

        case "type":
          return transition.type.toLowerCase()

        default:
          return (transition.labels?.ru || transition.labels?.en || transition.name || "").toLowerCase()
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (transition) => {
      const texts = [
        transition.name || "",
        transition.labels?.ru || "",
        transition.labels?.en || "",
        transition.description?.ru || "",
        transition.description?.en || "",
        transition.category,
        transition.type,
        ...(transition.tags || []),
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (transition, groupBy) => {
      switch (groupBy) {
        case "category":
          return transition.category || "other"

        case "complexity":
          return transition.complexity || "basic"

        case "type":
          return transition.type || "unknown"

        case "tags":
          // Группируем по первому тегу или "untagged"
          return transition.tags && transition.tags.length > 0 ? transition.tags[0] : "untagged"

        case "duration":
          const duration = transition.duration?.default || 1
          if (duration <= 1) return "Короткие (≤1с)"
          if (duration <= 3) return "Средние (1-3с)"
          return "Длинные (>3с)"

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу
    matchesFilter: (transition, filterType) => {
      if (filterType === "all") return true

      // Фильтрация по сложности
      if (["basic", "intermediate", "advanced"].includes(filterType)) {
        return (transition.complexity || "basic") === filterType
      }

      // Фильтрация по категории
      if (["basic", "advanced", "creative", "3d", "artistic", "cinematic"].includes(filterType)) {
        return transition.category === filterType
      }

      return true
    },

    // Обработчики импорта не нужны для переходов (они встроенные)
    importHandlers: undefined,

    // Проверка избранного
    isFavorite: (transition) => isItemFavorite(transition, "transition"),

    // Тип для системы избранного
    favoriteType: "transition",
  }
}
