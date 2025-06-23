import React, { useEffect, useState } from "react"

import { useFavorites } from "@/features/app-state"
import { useProjectSettings } from "@/features/project-settings"
import { TemplatePreview } from "@/features/templates/components/template-preview"
import { MediaTemplate, TEMPLATE_MAP } from "@/features/templates/lib/templates"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Преобразует метку соотношения сторон в группу шаблонов
 */
function mapAspectLabelToGroup(label: string): "landscape" | "square" | "portrait" {
  if (label === "1:1") return "square"
  if (label === "9:16" || label === "4:5") return "portrait"
  return "landscape"
}

/**
 * Компонент превью для шаблонов
 */
const TemplatePreviewWrapper: React.FC<PreviewComponentProps<MediaTemplate>> = ({
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
  const { settings } = useProjectSettings()

  const handleClick = () => {
    onClick?.(template)
  }

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(template, e)
  }

  // Для шаблонов TemplatePreview ожидает другие пропсы
  const previewSize = typeof size === "number" ? size : size.width
  const dimensions: [number, number] = [settings.aspectRatio.value.width, settings.aspectRatio.value.height]

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
        onDragStart={handleDragStart}
        draggable
      >
        {/* Template preview thumbnail */}
        <div className="flex-shrink-0 w-12 h-9 bg-gray-100 rounded overflow-hidden">
          <TemplatePreview template={template} size={32} dimensions={dimensions} onClick={handleClick} />
        </div>

        {/* Template Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{template.id}</div>
          <div className="text-xs text-muted-foreground truncate">
            {template.screens} экран{template.screens > 1 ? "а" : ""}
          </div>
        </div>

        {/* Split type */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{template.split}</div>

        {/* Screens count */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{template.screens}</div>

        {/* Resizable indicator */}
        {template.resizable && <div className="flex-shrink-0 text-xs text-green-600">Resizable</div>}
      </div>
    )
  }

  // Thumbnails mode - use the original TemplatePreview component
  return (
    <div onDragStart={handleDragStart} draggable>
      <TemplatePreview template={template} size={previewSize} dimensions={dimensions} onClick={handleClick} />
    </div>
  )
}

/**
 * Хук для создания адаптера шаблонов
 */
export function useTemplatesAdapter(): ListAdapter<MediaTemplate> {
  const { settings } = useProjectSettings()
  const { isItemFavorite } = useFavorites()
  const [templates, setTemplates] = useState<MediaTemplate[]>([])

  // Обновляем шаблоны при изменении соотношения сторон
  useEffect(() => {
    const group = mapAspectLabelToGroup(settings.aspectRatio.label)
    setTemplates(TEMPLATE_MAP[group] || [])
  }, [settings.aspectRatio])

  return {
    // Хук для получения данных
    useData: () => ({
      items: templates,
      loading: false,
      error: null,
    }),

    // Компонент превью
    PreviewComponent: TemplatePreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (template, sortBy) => {
      switch (sortBy) {
        case "name":
        case "id":
          return template.id.toLowerCase()

        case "screens":
          return template.screens

        case "split":
          return template.split.toLowerCase()

        case "resizable":
          return template.resizable ? 1 : 0

        default:
          return template.id.toLowerCase()
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (template) => {
      const texts = [
        template.id,
        template.split,
        template.screens.toString(),
        template.resizable ? "resizable" : "fixed",
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (template, groupBy) => {
      switch (groupBy) {
        case "split":
          return template.split || "other"

        case "screens":
          if (template.screens === 1) return "1 экран"
          if (template.screens === 2) return "2 экрана"
          if (template.screens <= 4) return "3-4 экрана"
          if (template.screens <= 6) return "5-6 экранов"
          return "7+ экранов"

        case "resizable":
          return template.resizable ? "Изменяемые" : "Фиксированные"

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу
    matchesFilter: (template, filterType) => {
      if (filterType === "all") return true

      // Фильтрация по типу разделения
      if (["vertical", "horizontal", "diagonal", "custom", "grid"].includes(filterType)) {
        return template.split === filterType
      }

      // Фильтрация по количеству экранов
      if (filterType.startsWith("screens-")) {
        const screenCount = Number.parseInt(filterType.split("-")[1])
        return template.screens === screenCount
      }

      // Фильтрация по изменяемости
      if (filterType === "resizable") {
        return template.resizable === true
      }

      if (filterType === "fixed") {
        return !template.resizable
      }

      return true
    },

    // Обработчики импорта не нужны для шаблонов (они встроенные)
    importHandlers: undefined,

    // Проверка избранного
    isFavorite: (template) => isItemFavorite(template, "template"),

    // Тип для системы избранного
    favoriteType: "template",
  }
}
