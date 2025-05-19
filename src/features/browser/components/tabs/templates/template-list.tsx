import React, { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { AddMediaButton } from "@/features/browser/components/layout/add-media-button"
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button"
import { usePreviewSize } from "@/features/browser/components/tabs/media"
import { useMedia } from "@/features/browser/media"
import { useResources } from "@/features/browser/resources"
import { useProjectSettings } from "@/features/project-settings/project-settings-provider"
import { MediaFile } from "@/types/media"
import { TemplateResource } from "@/types/resources"

import { getTemplateLabels } from "./template-labels"
import { TemplateListToolbar } from "./template-list-toolbar"
import { MediaTemplate, TEMPLATE_MAP } from "./templates"

function mapAspectLabelToGroup(
  label: string,
): "landscape" | "square" | "portrait" {
  if (label === "1:1") return "square"
  if (label === "9:16" || label === "4:5") return "portrait"
  return "landscape"
}

interface TemplatePreviewProps {
  template: MediaTemplate
  onClick: () => void
  size: number
  dimensions: [number, number]
}

export function TemplatePreview({
  template,
  onClick,
  size,
  dimensions,
}: TemplatePreviewProps) {
  const [width, height] = dimensions
  // Локальное состояние для отслеживания добавления шаблона
  const [localIsAdded, setLocalIsAdded] = useState(false)

  // Вычисляем размеры превью, сохраняя соотношение сторон
  const calculateDimensions = (): { width: number; height: number } => {
    // Для квадратных шаблонов используем одинаковую ширину и высоту
    if (width === height) {
      return { width: size, height: size }
    }

    // Для вертикальных шаблонов используем максимально возможную ширину
    // и увеличиваем высоту пропорционально
    if (height > width) {
      // Используем 90% доступного пространства для лучшего отображения
      const fixedWidth = (size / height) * width
      return { width: fixedWidth, height: size }
    }

    // Для горизонтальных шаблонов уменьшаем высоту пропорционально
    const calculatedHeight = Math.min((size * height) / width, size)
    return { width: size, height: calculatedHeight }
  }

  const { height: previewHeight, width: previewWidth } = calculateDimensions()
  const { addTemplate, isTemplateAdded, removeResource, templateResources } =
    useResources()

  // Создаем клон элемента с добавлением ключа для предотвращения предупреждения React
  const renderedTemplate = template.render()

  // Проверяем, добавлен ли шаблон уже в хранилище
  const isAddedFromStore = isTemplateAdded(template)

  // При изменении состояния в хранилище, обновляем локальное состояние
  useEffect(() => {
    setLocalIsAdded(isAddedFromStore)
  }, [isAddedFromStore])

  // Используем комбинированное состояние - либо из хранилища, либо локальное
  const isAdded = isAddedFromStore || localIsAdded

  const handleAddTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation()
    // Немедленно обновляем локальное состояние
    setLocalIsAdded(true)
    // Добавляем шаблон в хранилище
    addTemplate(template)

    // Принудительно обновляем состояние, чтобы кнопка стала видимой сразу
    setTimeout(() => {
      // Это вызовет перерисовку компонента
      const isAdded = isTemplateAdded(template)
      console.log(`Шаблон ${template.id} добавлен: ${isAdded}`)
    }, 10)
  }

  const handleRemoveTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation()
    // Немедленно обновляем локальное состояние
    setLocalIsAdded(false)
    // Находим ресурс с этим шаблоном и удаляем его
    const resource = templateResources.find(
      (res: TemplateResource) => res.resourceId === template.id,
    )

    if (resource) {
      removeResource(resource.id)
    } else {
      console.warn(
        `Не удалось найти ресурс шаблона с ID ${template.id} для удаления`,
      )
    }
  }

  return (
    <div
      className="group relative cursor-pointer"
      style={{
        aspectRatio: `${width} / ${height}`,
        height: `${previewHeight}px`,
        width: `${previewWidth}px`,
      }}
      onClick={onClick}
    >
      {React.cloneElement(renderedTemplate, {
        key: `template-preview-${template.id}`,
      })}

      {/* Кнопка избранного */}
      <FavoriteButton
        file={{ id: template.id, path: "", name: template.id }}
        size={previewWidth}
        type="template"
      />

      <div
        className={`transition-opacity duration-200 ${
          isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ visibility: isAdded ? "visible" : "inherit" }}
      >
        <AddMediaButton
          file={{ id: template.id, path: "", name: template.id }}
          onAddMedia={handleAddTemplate}
          onRemoveMedia={handleRemoveTemplate}
          isAdded={isAdded}
          size={previewWidth}
        />
      </div>
    </div>
  )
}

export function TemplateList() {
  const { t, i18n } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [, setActiveTemplate] = useState<MediaTemplate | null>(null)
  const [, setCurrentGroup] = useState<"landscape" | "portrait" | "square">(
    "landscape",
  )
  const [currentDimensions, setCurrentDimensions] = useState<[number, number]>([
    1920, 1080,
  ])
  const [templates, setTemplates] = useState<MediaTemplate[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const { settings } = useProjectSettings()

  const handleToggleFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev)
  }, [])

  // Получаем доступ к контексту медиа для работы с медиафайлами
  const media = useMedia()

  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = usePreviewSize("TEMPLATES")

  // Эффект для инициализации и обновления шаблонов при монтировании компонента
  useEffect(() => {
    const group = mapAspectLabelToGroup(settings.aspectRatio.label)
    const dimensions: [number, number] = [
      settings.aspectRatio.value.width,
      settings.aspectRatio.value.height,
    ]

    setCurrentGroup(group)
    setCurrentDimensions(dimensions)
    setTemplates(TEMPLATE_MAP[group])

    console.log("[TemplateList] Templates updated:", {
      aspectRatio: settings.aspectRatio.label,
      resolution: settings.resolution,
      group,
      dimensions,
      width: settings.aspectRatio.value.width,
      height: settings.aspectRatio.value.height,
    })
  }, [settings.aspectRatio, settings.resolution])

  const filteredTemplates = templates.filter((template) => {
    const searchLower = searchQuery.toLowerCase().trim()

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly ||
      media.isItemFavorite(
        { id: template.id, path: "", name: template.id },
        "template",
      )

    // Если не проходит фильтр по избранному, сразу возвращаем false
    if (!matchesFavorites) {
      return false
    }

    // Если поисковый запрос пустой, возвращаем все шаблоны (с учетом фильтра по избранному)
    if (!searchLower) {
      return true
    }

    // Проверяем, является ли запрос одной цифрой (количество экранов)
    if (/^\d+$/.test(searchLower)) {
      const screenCount = parseInt(searchLower, 10)
      return template.screens === screenCount
    }

    // Проверяем, является ли запрос двумя цифрами, разделенными пробелом или x/х (например, "5 2" или "5x2")
    const twoDigitsMatch = /^(\d+)[\s×x](\d+)$/.exec(searchLower)
    if (twoDigitsMatch) {
      const [, firstDigit, secondDigit] = twoDigitsMatch
      // Проверяем, содержит ли ID шаблона эти две цифры в правильном порядке
      const digitPattern = new RegExp(`${firstDigit}[^\\d]*${secondDigit}`)
      return digitPattern.test(template.id)
    }

    // Стандартный поиск по ID
    if (template.id.toLowerCase().includes(searchLower)) {
      return true
    }

    // Поиск по локализованным названиям
    const label = getTemplateLabels(template.id)
    if (label && label.toLowerCase().includes(searchLower)) {
      return true
    }

    return false
  })

  // Группируем шаблоны по количеству экранов
  const groupedTemplates = filteredTemplates.reduce<
    Record<number, MediaTemplate[]>
  >((acc, template) => {
    const screenCount = template.screens || 1
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[screenCount]) {
      acc[screenCount] = []
    }
    acc[screenCount].push(template)
    return acc
  }, {})

  // Получаем отсортированные ключи групп (количество экранов)
  const sortedGroups = Object.keys(groupedTemplates)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <TemplateListToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        canDecreaseSize={canDecreaseSize}
        canIncreaseSize={canIncreaseSize}
        handleDecreaseSize={handleDecreaseSize}
        handleIncreaseSize={handleIncreaseSize}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={handleToggleFavorites}
      />

      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-3 dark:bg-[#1b1a1f]">
        {!isSizeLoaded ? (
          <div className="flex h-full items-center justify-center text-gray-500" />
        ) : filteredTemplates.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {t("browser.tabs.templates")} {t("common.notFound")}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Выводим шаблоны, сгруппированные по количеству экранов */}
            {sortedGroups.map((screenCount) => (
              <div key={screenCount} className="mb-4">
                <h3 className="mb-3 text-sm font-medium text-gray-400">
                  {screenCount}{" "}
                  {t(
                    `browser.templateScreens.${screenCount === 1 ? "one" : i18n.language === "ru" && screenCount < 5 ? "few" : "many"}`,
                    {
                      count: screenCount,
                      defaultValue: screenCount === 1 ? "screen" : "screens",
                    },
                  )}
                </h3>
                <div
                  className="flex flex-wrap gap-4"
                  style={
                    {
                      "--preview-size": `${previewSize}px`,
                    } as React.CSSProperties
                  }
                >
                  {groupedTemplates[screenCount].map((template) => (
                    <div
                      key={template.id}
                      className="flex flex-col items-center"
                    >
                      <TemplatePreview
                        template={template}
                        onClick={() => {
                          console.log("Clicked", template.id)
                        }}
                        size={previewSize}
                        dimensions={currentDimensions}
                      />
                      <div
                        className="mt-1 truncate text-center text-xs text-gray-400"
                        title={getTemplateLabels(template.id) || template.id}
                        style={{ width: `${previewSize}px` }}
                      >
                        {getTemplateLabels(template.id) || template.id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
