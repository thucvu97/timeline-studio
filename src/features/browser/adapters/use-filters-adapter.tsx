import React from "react"

import { useFavorites } from "@/features/app-state"
import { useDraggable } from "@/features/drag-drop"
import { FilterPreview } from "@/features/filters/components/filter-preview"
import { useFilters } from "@/features/filters/hooks/use-filters"
import { VideoFilter } from "@/features/filters/types/filters"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для фильтров
 */
const FilterPreviewWrapper: React.FC<PreviewComponentProps<VideoFilter>> = ({
  item: filter,
  size,
  viewMode,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.(filter)
  }

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "filter",
    () => filter,
    () => ({
      url: `/filters/${filter.type}.png`, // Preview URL if available
      width: 120,
      height: 80,
    }),
  )

  // Для фильтров FilterPreview ожидает другие пропсы
  const previewSize = typeof size === "number" ? size : size.width
  const previewWidth = typeof size === "number" ? size : size.width
  const previewHeight = typeof size === "number" ? size : size.height

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
        {...dragProps}
      >
        {/* Filter preview thumbnail */}
        <div className="flex-shrink-0 w-12 h-9 bg-gray-200 rounded overflow-hidden">
          <video
            src="/t1.mp4"
            className="w-full h-full object-cover"
            style={{ filter: getFilterPreviewStyle(filter) }}
            muted
            playsInline
            preload="metadata"
          />
        </div>

        {/* Filter Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{filter.labels?.ru || filter.name}</div>
          <div className="text-xs text-muted-foreground truncate">{filter.description?.en || ""}</div>
        </div>

        {/* Category */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{filter.category}</div>

        {/* Complexity */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{filter.complexity}</div>
      </div>
    )
  }

  // Thumbnails mode - use the original FilterPreview component
  return (
    <div {...dragProps}>
      <FilterPreview
        filter={filter}
        onClick={handleClick}
        size={previewSize}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
      />
    </div>
  )
}

/**
 * Функция для получения CSS-фильтра для превью
 */
function getFilterPreviewStyle(filter: VideoFilter): string {
  if (!filter.params) return ""

  const { brightness, contrast, saturation, hue, temperature, tint } = filter.params

  const filters = []

  if (brightness !== undefined) filters.push(`brightness(${Math.max(0, 1 + brightness)})`)
  if (contrast !== undefined) filters.push(`contrast(${Math.max(0, contrast)})`)
  if (saturation !== undefined) filters.push(`saturate(${Math.max(0, saturation)})`)
  if (hue !== undefined) filters.push(`hue-rotate(${hue}deg)`)

  // Простая эмуляция температуры
  if (temperature !== undefined) {
    const tempValue = Math.abs(temperature) * 0.01
    if (temperature > 0) {
      filters.push(`sepia(${Math.min(1, tempValue)})`)
    } else {
      filters.push(`hue-rotate(${temperature * 2}deg)`)
    }
  }

  if (tint !== undefined) filters.push(`hue-rotate(${tint}deg)`)

  return filters.join(" ")
}

/**
 * Хук для создания адаптера фильтров
 */
export function useFiltersAdapter(): ListAdapter<VideoFilter> {
  const { filters, loading, error } = useFilters()
  const { isItemFavorite } = useFavorites()

  return {
    // Хук для получения данных
    useData: () => ({
      items: filters,
      loading,
      error: error || null,
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
          // Определяем порядок сложности: basic < intermediate < advanced
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
          // Группируем по первому тегу или "untagged"
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
      if (["color-correction", "creative", "cinematic", "vintage", "technical", "artistic"].includes(filterType)) {
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
