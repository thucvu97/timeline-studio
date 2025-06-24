import React from "react"

import { useFavorites } from "@/features/app-state"
import { TransitionPreview } from "@/features/transitions/components/transition-preview"
import { Transition } from "@/features/transitions/types/transitions"

import { useResourcesAdapter } from "../hooks/use-resources"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для переходов (адаптированный для нового провайдера)
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
        {/* Transition Preview */}
        <div className="flex-shrink-0">
          <TransitionPreview transition={transition} onClick={handleClick} size={48} width={48} height={36} />
        </div>

        {/* Transition Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {transition.labels?.ru || transition.labels?.en || transition.name || transition.id}
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
        <div className="flex-shrink-0 text-xs text-muted-foreground">
          {transition.duration?.default || 1}s
        </div>
      </div>
    )
  }

  // Thumbnails mode
  return (
    <div
      className="flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
      style={{ width: previewWidth }}
      onClick={handleClick}
      onDragStart={handleDragStart}
      draggable
    >
      {/* Transition Preview */}
      <TransitionPreview
        transition={transition}
        onClick={handleClick}
        size={previewSize}
        width={previewWidth}
        height={previewHeight}
      />

      {/* Transition Info */}
      <div className="text-center mt-2 w-full">
        <div className="font-medium text-sm truncate">
          {transition.labels?.ru || transition.labels?.en || transition.name || transition.id}
        </div>
        <div className="text-xs text-muted-foreground truncate">{transition.category}</div>
      </div>
    </div>
  )
}

/**
 * Новый хук для создания адаптера переходов с использованием EffectsProvider
 */
export function useTransitionsAdapterNew(): ListAdapter<Transition> {
  // Используем новый унифицированный адаптер
  const resourcesAdapter = useResourcesAdapter("transitions", {})
  const { isItemFavorite } = useFavorites()

  return {
    // Хук для получения данных
    useData: () => ({
      items: resourcesAdapter.items as Transition[],
      loading: resourcesAdapter.loading,
      error: resourcesAdapter.error,
    }),

    // Компонент превью
    PreviewComponent: TransitionPreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (transition, sortBy) => {
      switch (sortBy) {
        case "name":
          return (transition.labels?.ru || transition.labels?.en || transition.name || transition.id).toLowerCase()

        case "category":
          return transition.category.toLowerCase()

        case "complexity":
          const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
          return complexityOrder[transition.complexity || "basic"]

        case "duration":
          return transition.duration?.default || 1

        case "type":
          return transition.type.toLowerCase()

        default:
          return (transition.labels?.ru || transition.labels?.en || transition.name || transition.id).toLowerCase()
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (transition) => {
      const texts = [
        transition.labels?.ru || "",
        transition.labels?.en || "",
        transition.labels?.es || "",
        transition.labels?.fr || "",
        transition.labels?.de || "",
        transition.name || "",
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

        case "duration":
          const duration = transition.duration?.default || 1
          if (duration <= 0.5) return "short"
          if (duration <= 2) return "medium"
          return "long"

        case "tags":
          return transition.tags && transition.tags.length > 0 ? transition.tags[0] : "untagged"

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

      // Фильтрация по длительности
      if (["short", "medium", "long"].includes(filterType)) {
        const duration = transition.duration?.default || 1
        switch (filterType) {
          case "short":
            return duration <= 0.5
          case "medium":
            return duration > 0.5 && duration <= 2
          case "long":
            return duration > 2
        }
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