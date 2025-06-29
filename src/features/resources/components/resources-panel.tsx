import {
  Blend,
  Clapperboard,
  FlipHorizontal2,
  Music,
  Package,
  Palette,
  Scissors,
  Sparkles,
  Sticker,
  Subtitles,
  Type,
  Video,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { DraggableType, useDraggable } from "@/features/drag-drop"
import { useResources } from "@/features/resources"
import { TimelineResource } from "@/features/resources/types"

/**
 * Компонент для отдельного ресурса с поддержкой drag
 */
function ResourceItem({ resource, onRemove }: { resource: TimelineResource; onRemove: (id: string) => void }) {
  const { t } = useTranslation()

  // Определяем тип для DragDropManager
  const getDraggableType = (resourceType: TimelineResource["type"]): DraggableType => {
    switch (resourceType) {
      case "media":
        return "media"
      case "music":
        return "music"
      case "effect":
        return "effect"
      case "filter":
        return "filter"
      case "transition":
        return "transition"
      case "template":
        return "template"
      case "styleTemplate":
        return "style-template"
      case "subtitle":
        return "subtitle-style"
      default:
        return "media"
    }
  }

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    getDraggableType(resource.type),
    () => resource.data,
    () => ({
      url: resource.data?.thumbnail || resource.data?.path,
      width: 120,
      height: 80,
    }),
  )

  return (
    <div
      key={resource.id}
      className="group relative mb-1 flex h-[26px] w-[110px] flex-shrink-0 cursor-pointer items-center gap-2 rounded-sm border border-[#333] px-2 hover:bg-[#444] hover:text-white transition-colors duration-150"
      {...dragProps}
    >
      {/* Иконка ресурса (слева) */}
      <div className="flex-shrink-0">
        {resource.type === "media" && <Clapperboard className="h-4 w-4" />}
        {resource.type === "music" && <Music className="h-4 w-4" />}
        {resource.type === "subtitle" && <Subtitles className="h-4 w-4" />}
        {resource.type === "effect" && <Package className="h-4 w-4" />}
        {resource.type === "filter" && <Palette className="h-4 w-4" />}
        {resource.type === "transition" && <Scissors className="h-4 w-4" />}
        {resource.type === "template" && <Video className="h-4 w-4" />}
        {resource.type === "styleTemplate" && <Sticker className="h-4 w-4" />}
      </div>

      {/* Название ресурса (справа) */}
      <div className="flex-1 overflow-hidden">
        <div className="truncate text-[10px]">
          {resource.type === "template"
            ? t(`templates.templateLabels.${resource.name}`, resource.name)
            : resource.type === "styleTemplate"
              ? t(`styleTemplates.${resource.name}`, resource.name)
              : resource.name}
        </div>
      </div>

      {/* Кнопка удаления - показывается при наведении */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(resource.id)
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-0.5 hover:bg-red-500/20 rounded"
      >
        <X className="h-3 w-3 text-red-500" />
      </button>
    </div>
  )
}

/**
 * Компонент для отображения ресурсов таймлайна в левой панели
 */
export function ResourcesPanel() {
  const { t } = useTranslation()

  // Полностью отключаем логирование
  const {
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    styleTemplateResources,
    mediaResources,
    musicResources,
    subtitleResources,
    removeResource,
  } = useResources()

  // Полностью отключаем логирование

  // Категории ресурсов с их данными
  const categories = [
    {
      id: "media",
      name: t("browser.tabs.media"),
      icon: <Clapperboard className="h-3.5 w-3.5 text-gray-400" />,
      resources: mediaResources,
    },
    {
      id: "music",
      name: t("browser.tabs.music"),
      icon: <Music className="h-3.5 w-3.5 text-gray-400" />,
      resources: musicResources,
    },
    {
      id: "subtitles",
      name: t("browser.tabs.subtitles"),
      icon: <Type className="h-3.5 w-3.5 text-gray-400" />,
      resources: subtitleResources,
    },
    {
      id: "effects",
      name: t("browser.tabs.effects"),
      icon: <Sparkles className="h-3.5 w-3.5 text-gray-400" />,
      resources: effectResources,
    },
    {
      id: "filters",
      name: t("browser.tabs.filters"),
      icon: <Blend className="h-3.5 w-3.5 text-gray-400" />,
      resources: filterResources,
    },
    {
      id: "transitions",
      name: t("browser.tabs.transitions"),
      icon: <FlipHorizontal2 className="h-3.5 w-3.5 text-gray-400" />,
      resources: transitionResources,
    },
    {
      id: "templates",
      name: t("browser.tabs.templates"),
      icon: <Video className="h-3.5 w-3.5 text-gray-400" />,
      resources: templateResources,
    },
    {
      id: "styleTemplates",
      name: t("browser.tabs.styleTemplates"),
      icon: <Sticker className="h-3.5 w-3.5 text-gray-400" />,
      resources: styleTemplateResources,
    },
  ]

  // Функция для отображения списка ресурсов
  const renderResourceList = (resources: TimelineResource[]) => {
    if (resources.length === 0) {
      return null // Если ресурсов нет, не показываем ничего
    }

    return (
      <div>
        <div className="flex flex-wrap gap-1 px-1 py-1">
          {resources.map((resource) => (
            <ResourceItem key={resource.id} resource={resource} onRemove={removeResource} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* <div className="border-b border-[#333] p-1.5">
        <h3 className="text-xs font-medium">{t("timeline.resources.title", "Ресурсы")}</h3>
      </div> */}

      {/* Прокручиваемый контейнер для всех категорий */}
      <div className="scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent flex-1 overflow-y-auto">
        <div className="space-y-2 p-1.5">
          {categories.map((category) => (
            <div key={category.id} className="space-y-1">
              {/* Заголовок категории */}
              <div className="flex items-center gap-1.5 border-b border-[#333] pb-1 text-[11px] font-medium">
                {category.icon}
                {category.name}
                {category.resources.length > 0 && (
                  <span className="ml-1 text-[9px]">({category.resources.length})</span>
                )}
              </div>

              {/* Список ресурсов категории */}
              {renderResourceList(category.resources)}

              {/* Сообщение, если нет ресурсов */}
              {category.resources.length === 0 && (
                <div className="pl-1 text-[10px] text-muted-foreground">
                  {t("timeline.resources.noResources", "Нет добавленных ресурсов")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
