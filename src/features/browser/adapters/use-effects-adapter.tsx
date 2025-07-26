import React from "react"

import { useFavorites } from "@/features/app-state"
import { useEffectsAdapter as useUnifiedEffectsAdapter } from "@/features/browser/hooks/use-resources"
import { useDraggable } from "@/features/drag-drop"
import { EffectPreview } from "@/features/effects/components/effect-preview"
import { BaseEffect } from "@/features/effects/types"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для эффектов
 */
const EffectPreviewWrapper: React.FC<PreviewComponentProps<BaseEffect>> = ({
  item: effect,
  size,
  viewMode,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.(effect)
  }

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "effect",
    () => effect,
    () => ({
      url: `/effects/${effect.id}.png`, // Preview URL if available
      width: 120,
      height: 80,
    }),
  )

  // Для эффектов EffectPreview ожидает другие пропсы
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
        {/* Effect Preview */}
        <div className="flex-shrink-0">
          <EffectPreview effect={effect} onClick={handleClick} size={48} width={48} height={36} />
        </div>

        {/* Effect Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{effect.name?.ru || effect.name?.en || ""}</div>
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
      {...dragProps}
    >
      {/* Effect Preview */}
      <EffectPreview
        effect={effect}
        onClick={handleClick}
        size={previewSize}
        width={previewWidth}
        height={previewHeight}
      />

      {/* Effect Info */}
      <div className="text-center mt-2 w-full">
        <div className="font-medium text-sm truncate">{effect.name?.ru || effect.name?.en || ""}</div>
        <div className="text-xs text-muted-foreground truncate">{effect.category}</div>
      </div>
    </div>
  )
}

/**
 * Хук для создания адаптера эффектов
 * Мигрирован на унифицированную систему browser-хуков
 */
export function useEffectsAdapter(): ListAdapter<BaseEffect> {
  const { isItemFavorite } = useFavorites()

  // Используем унифицированный адаптер с конфигурацией для эффектов
  const adapter = useUnifiedEffectsAdapter({
    PreviewComponent: EffectPreviewWrapper,
    customHandlers: {
      getSortValue: (effect: BaseEffect, sortBy: string) => {
        switch (sortBy) {
          case "name":
            // effect.name - это объект с локализацией, используем английскую версию
            return (effect.name?.en || effect.name?.ru || "").toLowerCase()
          case "category":
            return effect.category.toLowerCase()
          case "complexity":
            // Определяем порядок сложности: basic < intermediate < advanced
            const complexityOrder: Record<string, number> = { low: 0, medium: 1, high: 2, extreme: 3 }
            return complexityOrder[effect.complexity || "low"]
          case "processingType":
            return effect.processingType
          default:
            return (effect.name?.en || effect.name?.ru || "").toLowerCase()
        }
      },
      getSearchableText: (effect: BaseEffect) => {
        const texts = [
          effect.name?.ru || "",
          effect.name?.en || "",
          // labels removed - not in BaseEffect
          effect.description?.ru || "",
          effect.description?.en || "",
          effect.category,
          effect.processingType,
          ...(effect.tags || []),
        ]
        return texts.filter(Boolean)
      },
      getGroupValue: (effect: BaseEffect, groupBy: string) => {
        switch (groupBy) {
          case "category":
            return effect.category || "other"
          case "complexity":
            return effect.complexity || "basic"
          case "processingType":
            return effect.processingType || "render"
          case "tags":
            // Группируем по первому тегу или "untagged"
            return effect.tags && effect.tags.length > 0 ? effect.tags[0] : "untagged"
          default:
            return ""
        }
      },
      matchesFilter: (effect: BaseEffect, filterType: string) => {
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
    },
  })

  // Adapter data ready

  return {
    ...adapter,
    // Проверка избранного (переопределяем)
    isFavorite: (effect: BaseEffect) => isItemFavorite(effect, "effect"),
  }
}
