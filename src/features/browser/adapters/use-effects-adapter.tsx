import React from "react"

import { useFavorites } from "@/features/app-state"
import { EffectPreview } from "@/features/effects/components/effect-preview"
import { useEffects } from "@/features/effects/hooks/use-effects"
import { VideoEffect } from "@/features/effects/types"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для эффектов
 */
const EffectPreviewWrapper: React.FC<PreviewComponentProps<VideoEffect>> = ({
  item: effect,
  size,
  viewMode,
  onClick,
  onDragStart,
}) => {
  const handleClick = () => {
    onClick?.(effect)
  }

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(effect, e)
  }

  // Для эффектов EffectPreview ожидает другие пропсы
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
        {/* Effect Preview */}
        <div className="flex-shrink-0">
          <EffectPreview effectType={effect.type} onClick={handleClick} size={48} width={48} height={36} />
        </div>

        {/* Effect Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{effect.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {effect.description?.ru || effect.description?.en || ""}
          </div>
        </div>

        {/* Category */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{effect.category}</div>

        {/* Complexity */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{effect.complexity}</div>
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
      {/* Effect Preview */}
      <EffectPreview
        effectType={effect.type}
        onClick={handleClick}
        size={previewSize}
        width={previewWidth}
        height={previewHeight}
      />

      {/* Effect Info */}
      <div className="text-center mt-2 w-full">
        <div className="font-medium text-sm truncate">{effect.name}</div>
        <div className="text-xs text-muted-foreground truncate">{effect.category}</div>
      </div>
    </div>
  )
}

/**
 * Хук для создания адаптера эффектов
 */
export function useEffectsAdapter(): ListAdapter<VideoEffect> {
  const { effects, loading, error } = useEffects()
  const { isItemFavorite } = useFavorites()

  return {
    // Хук для получения данных
    useData: () => ({
      items: effects,
      loading,
      error: error ?? null,
    }),

    // Компонент превью
    PreviewComponent: EffectPreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (effect, sortBy) => {
      switch (sortBy) {
        case "name":
          return effect.name.toLowerCase()

        case "category":
          return effect.category.toLowerCase()

        case "complexity":
          // Определяем порядок сложности: basic < intermediate < advanced
          const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
          return complexityOrder[effect.complexity || "basic"]

        case "type":
          return effect.type.toLowerCase()

        default:
          return effect.name.toLowerCase()
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (effect) => {
      const texts = [
        effect.name,
        effect.labels?.ru || "",
        effect.labels?.en || "",
        effect.description?.ru || "",
        effect.description?.en || "",
        effect.category,
        effect.type,
        ...(effect.tags || []),
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (effect, groupBy) => {
      switch (groupBy) {
        case "category":
          return effect.category || "other"

        case "complexity":
          return effect.complexity || "basic"

        case "type":
          return effect.type || "unknown"

        case "tags":
          // Группируем по первому тегу или "untagged"
          return effect.tags && effect.tags.length > 0 ? effect.tags[0] : "untagged"

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу
    matchesFilter: (effect, filterType) => {
      if (filterType === "all") return true

      // Фильтрация по сложности
      if (["basic", "intermediate", "advanced"].includes(filterType)) {
        return (effect.complexity || "basic") === filterType
      }

      // Фильтрация по категории
      if (
        ["color-correction", "artistic", "vintage", "cinematic", "creative", "technical", "distortion"].includes(
          filterType,
        )
      ) {
        return effect.category === filterType
      }

      return true
    },

    // Обработчики импорта не нужны для эффектов (они встроенные)
    importHandlers: undefined,

    // Проверка избранного
    isFavorite: (effect) => isItemFavorite(effect, "effect"),

    // Тип для системы избранного
    favoriteType: "effect",
  }
}
