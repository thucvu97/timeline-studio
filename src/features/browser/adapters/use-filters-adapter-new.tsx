import React from "react"

import { useFavorites } from "@/features/app-state"
import { FilterPreview } from "@/features/filters/components/filter-preview"
import { VideoFilter } from "@/features/filters/types/filters"

import { useResourcesAdapter } from "../hooks/use-resources"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для фильтров (адаптированный для нового провайдера)
 */
const FilterPreviewWrapper: React.FC<PreviewComponentProps<VideoFilter>> = ({
  item: filter,
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
    onClick?.(filter)
  }

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(filter, e)
  }

  // Для фильтров FilterPreview ожидает другие пропсы
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
        {/* Filter Preview */}
        <div className="flex-shrink-0">
          <FilterPreview filter={filter} onClick={handleClick} size={48} width={48} height={36} />
        </div>

        {/* Filter Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{filter.name}</div>
          <div className="text-xs text-muted-foreground truncate">{filter.description?.en || ""}</div>
        </div>

        {/* Category */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{filter.category}</div>

        {/* Complexity */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{filter.complexity}</div>
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
      {/* Filter Preview */}
      <FilterPreview
        filter={filter}
        onClick={handleClick}
        size={previewSize}
        width={previewWidth}
        height={previewHeight}
      />

      {/* Filter Info */}
      <div className="text-center mt-2 w-full">
        <div className="font-medium text-sm truncate">{filter.name}</div>
        <div className="text-xs text-muted-foreground truncate">{filter.category}</div>
      </div>
    </div>
  )
}

/**
 * Новый хук для создания адаптера фильтров с использованием EffectsProvider
 */
export function useFiltersAdapterNew(): ListAdapter<VideoFilter> {
  // Используем новый унифицированный адаптер
  const resourcesAdapter = useResourcesAdapter("filters", {})
  const { isItemFavorite } = useFavorites()

  return {
    // Хук для получения данных
    useData: () => ({
      items: resourcesAdapter.items as VideoFilter[],
      loading: resourcesAdapter.loading,
      error: resourcesAdapter.error,
    }),

    // Компонент превью
    PreviewComponent: FilterPreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (filter, sortBy) => {
      switch (sortBy) {
        case "name":
          return filter.name.toLowerCase()

        case "category":
          return filter.category.toLowerCase()

        case "complexity":
          const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
          return complexityOrder[filter.complexity || "basic"]

        default:
          return filter.name.toLowerCase()
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (filter) => {
      const texts = [
        filter.name,
        filter.labels?.ru || "",
        filter.labels?.en || "",
        filter.description?.en || "",
        filter.category,
        ...(filter.tags || []),
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (filter, groupBy) => {
      switch (groupBy) {
        case "category":
          return filter.category || "other"

        case "complexity":
          return filter.complexity || "basic"

        case "tags":
          return filter.tags && filter.tags.length > 0 ? filter.tags[0] : "untagged"

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу
    matchesFilter: (filter, filterType) => {
      if (filterType === "all") return true

      // Фильтрация по сложности
      if (["basic", "intermediate", "advanced"].includes(filterType)) {
        return (filter.complexity || "basic") === filterType
      }

      // Фильтрация по категории
      if (["color-correction", "technical", "cinematic", "artistic", "creative", "vintage"].includes(filterType)) {
        return filter.category === filterType
      }

      return true
    },

    // Обработчики импорта не нужны для фильтров (они встроенные)
    importHandlers: undefined,

    // Проверка избранного
    isFavorite: (filter) => isItemFavorite(filter, "filter"),

    // Тип для системы избранного
    favoriteType: "filter",
  }
}
