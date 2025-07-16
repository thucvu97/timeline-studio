import React from "react"

import { useFavorites } from "@/features/app-state"
import { useStyleTemplatesAdapter as useUnifiedStyleTemplatesAdapter } from "@/features/browser/hooks/use-resources"
import { useDraggable } from "@/features/drag-drop"
import { StyleTemplatePreview } from "@/features/style-templates/components/style-template-preview"
import { StyleTemplate } from "@/features/style-templates/types"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для стилистических шаблонов
 */
const StyleTemplatePreviewWrapper: React.FC<PreviewComponentProps<StyleTemplate>> = ({
  item: template,
  size,
  viewMode,
  onClick,
  onAddToTimeline,
}) => {
  const handleClick = () => {
    onClick?.(template)
  }

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "template",
    () => template,
    () => ({
      url: template.thumbnail || `/style-templates/${template.id}.png`,
      width: 120,
      height: 80,
    }),
  )

  const handleSelect = (templateId: string) => {
    // Template selected
    onAddToTimeline?.(template)
  }

  // Для стилистических шаблонов StyleTemplatePreview ожидает другие пропсы
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
        {/* Template preview thumbnail */}
        <div className="flex-shrink-0 w-16 h-9 bg-gray-100 rounded overflow-hidden relative">
          {template.thumbnail ? (
            <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{template.name.substring(0, 2).toUpperCase()}</span>
            </div>
          )}

          {/* Animation indicator */}
          {template.hasAnimation && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />}
        </div>

        {/* Template Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{template.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {template.description || `${template.category} • ${template.style}`}
          </div>
        </div>

        {/* Category */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{template.category}</div>

        {/* Style */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{template.style}</div>

        {/* Duration */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{template.duration}s</div>

        {/* Features */}
        <div className="flex-shrink-0 flex gap-1">
          {template.hasText && <div className="w-2 h-2 bg-blue-500 rounded-full" title="Содержит текст" />}
          {template.hasAnimation && <div className="w-2 h-2 bg-green-500 rounded-full" title="Содержит анимацию" />}
        </div>
      </div>
    )
  }

  // Thumbnails mode - use the original StyleTemplatePreview component
  return (
    <div {...dragProps}>
      <StyleTemplatePreview
        template={template}
        size={previewSize}
        onSelect={handleSelect}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
      />
    </div>
  )
}

/**
 * Хук для создания адаптера стилистических шаблонов
 * Мигрирован на унифицированную систему browser-хуков
 */
export function useStyleTemplatesAdapter(): ListAdapter<StyleTemplate> {
  const { isItemFavorite } = useFavorites()

  // Используем унифицированный адаптер с конфигурацией для стилистических шаблонов
  const { items, loading, error, stats, ...restAdapter } = useUnifiedStyleTemplatesAdapter({
    PreviewComponent: StyleTemplatePreviewWrapper,
    customHandlers: {
      getSortValue: (template: StyleTemplate, sortBy: string) => {
        switch (sortBy) {
          case "name":
            return template.name.toLowerCase()
          case "category":
            return template.category.toLowerCase()
          case "style":
            return template.style.toLowerCase()
          case "duration":
            return template.duration
          case "aspectRatio":
            return template.aspectRatio
          default:
            return template.name.toLowerCase()
        }
      },
      getSearchableText: (template: StyleTemplate) => {
        const texts = [
          template.name,
          template.description || "",
          template.category,
          template.style,
          template.aspectRatio,
          ...(template.tags || []),
        ]
        return texts.filter(Boolean)
      },
      getGroupValue: (template: StyleTemplate, groupBy: string) => {
        switch (groupBy) {
          case "category":
            return template.category || "other"
          case "style":
            return template.style || "other"
          case "aspectRatio":
            return template.aspectRatio || "16:9"
          case "duration":
            if (template.duration <= 3) return "Короткие (≤3с)"
            if (template.duration <= 10) return "Средние (3-10с)"
            return "Длинные (>10с)"
          case "features":
            if (template.hasText && template.hasAnimation) return "Текст + анимация"
            if (template.hasText) return "С текстом"
            if (template.hasAnimation) return "С анимацией"
            return "Базовые"
          default:
            return ""
        }
      },
      matchesFilter: (template: StyleTemplate, filterType: string) => {
        if (filterType === "all") return true

        // Фильтрация по категории
        if (["intro", "outro", "lower-third", "title", "transition", "overlay"].includes(filterType)) {
          return template.category === filterType
        }

        // Фильтрация по стилю
        if (["modern", "vintage", "minimal", "corporate", "creative", "cinematic"].includes(filterType)) {
          return template.style === filterType
        }

        // Фильтрация по соотношению сторон
        if (["16:9", "9:16", "1:1"].includes(filterType)) {
          return template.aspectRatio === filterType
        }

        // Фильтрация по наличию текста
        if (filterType === "hasText") {
          return template.hasText
        }

        // Фильтрация по наличию анимации
        if (filterType === "hasAnimation") {
          return template.hasAnimation
        }

        return true
      },
    },
  })

  return {
    ...restAdapter,
    // Данные с правильной типизацией
    useData: () => ({
      items: items as StyleTemplate[],
      loading,
      error: error ? new Error(error) : null,
    }),
    // Компонент превью
    PreviewComponent: StyleTemplatePreviewWrapper,
    // Проверка избранного (переопределяем)
    isFavorite: (template: StyleTemplate) =>
      isItemFavorite(
        {
          id: template.id,
          path: "",
          name: template.name,
        },
        "template",
      ),
  }
}
