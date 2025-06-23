import React from "react"

import { useTranslation } from "react-i18next"

import { useFavorites } from "@/features/app-state"
import { StyleTemplatePreview } from "@/features/style-templates/components/style-template-preview"
import { useStyleTemplates } from "@/features/style-templates/hooks"
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
  onDragStart,
  isSelected,
  isFavorite,
  onToggleFavorite,
  onAddToTimeline,
}) => {
  const { i18n } = useTranslation()
  const currentLanguage = (i18n.language || "ru") as "ru" | "en"

  const handleClick = () => {
    onClick?.(template)
  }

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(template, e)
  }

  const handleSelect = (templateId: string) => {
    console.log("Template selected:", templateId)
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
        onDragStart={handleDragStart}
        draggable
      >
        {/* Template preview thumbnail */}
        <div className="flex-shrink-0 w-16 h-9 bg-gray-100 rounded overflow-hidden relative">
          {template.thumbnail ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={template.thumbnail} alt={template.name[currentLanguage]} className="w-full h-full object-cover" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {template.name[currentLanguage].substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Animation indicator */}
          {template.hasAnimation && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />}
        </div>

        {/* Template Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{template.name[currentLanguage]}</div>
          <div className="text-xs text-muted-foreground truncate">
            {template.description?.[currentLanguage] || `${template.category} • ${template.style}`}
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
    <div onDragStart={handleDragStart} draggable>
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
 */
export function useStyleTemplatesAdapter(): ListAdapter<StyleTemplate> {
  const { templates, loading, error } = useStyleTemplates()
  const { isItemFavorite } = useFavorites()
  const { i18n } = useTranslation()
  const currentLanguage = (i18n.language || "ru") as "ru" | "en"

  return {
    // Хук для получения данных
    useData: () => ({
      items: templates,
      loading,
      error: error || null,
    }),

    // Компонент превью
    PreviewComponent: StyleTemplatePreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (template, sortBy) => {
      switch (sortBy) {
        case "name":
          return template.name[currentLanguage].toLowerCase()

        case "category":
          return template.category.toLowerCase()

        case "style":
          return template.style.toLowerCase()

        case "duration":
          return template.duration

        case "aspectRatio":
          return template.aspectRatio

        default:
          return template.name[currentLanguage].toLowerCase()
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (template) => {
      const texts = [
        template.name.ru,
        template.name.en,
        template.description?.ru || "",
        template.description?.en || "",
        template.category,
        template.style,
        template.aspectRatio,
        ...(template.tags?.ru || []),
        ...(template.tags?.en || []),
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (template, groupBy) => {
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

    // Функция для фильтрации по типу
    matchesFilter: (template, filterType) => {
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

    // Обработчики импорта не нужны для стилистических шаблонов (они встроенные)
    importHandlers: undefined,

    // Проверка избранного
    isFavorite: (template) =>
      isItemFavorite(
        {
          id: template.id,
          path: "",
          name: template.name[currentLanguage],
        },
        "template",
      ),

    // Тип для системы избранного
    favoriteType: "template",
  }
}
