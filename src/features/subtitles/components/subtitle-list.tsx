import { useCallback, useMemo } from "react"

import { useTranslation } from "react-i18next"

import { ContentGroup } from "@/components/common/content-group"
import { useFavorites } from "@/features/app-state"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { useProjectSettings } from "@/features/project-settings"

import { SubtitlePreview } from "./subtitle-preview"
import { useSubtitles } from "../hooks/use-subtitle-styles"
import { SubtitleStyle } from "../types/subtitles"

/**
 * Компонент для отображения списка доступных стилей субтитров
 * Позволяет просматривать, искать и добавлять стили в проект
 */
export function SubtitleList() {
  const { t } = useTranslation() // Хук для интернационализации

  // Загружаем субтитры из JSON
  const { subtitles, loading, error } = useSubtitles()

  // Используем общий провайдер состояния браузера
  const { currentTabSettings } = useBrowserState()

  // Получаем настройки проекта для соотношения сторон
  const { settings } = useProjectSettings()

  const { isItemFavorite } = useFavorites()

  // Извлекаем настройки для стилей субтитров
  const { searchQuery, showFavoritesOnly, sortBy, sortOrder, groupBy, filterType, previewSizeIndex } =
    currentTabSettings

  // Получаем текущий размер превью из массива
  const basePreviewSize = PREVIEW_SIZES[previewSizeIndex]

  // Вычисляем размеры превью с учетом соотношения сторон проекта
  const previewDimensions = useMemo(() => {
    const aspectRatio = settings.aspectRatio.value
    const ratio = aspectRatio.width / aspectRatio.height

    let width: number
    let height: number

    if (ratio >= 1) {
      // Горизонтальное или квадратное видео
      width = basePreviewSize
      height = Math.round(basePreviewSize / ratio)
    } else {
      // Вертикальное видео
      height = basePreviewSize
      width = Math.round(basePreviewSize * ratio)
    }

    return { width, height }
  }, [basePreviewSize, settings.aspectRatio])

  /**
   * Фильтрация, сортировка и группировка стилей субтитров
   */
  const processedStyles = useMemo(() => {
    // 1. Фильтрация
    const filtered = subtitles.filter((style) => {
      // Фильтрация по поисковому запросу
      const matchesSearch =
        !searchQuery ||
        style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (style.labels?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (style.labels?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (style.description?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (style.description?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (style.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // Фильтрация по избранному
      const matchesFavorites = !showFavoritesOnly || isItemFavorite(style, "subtitle")

      // Фильтрация по типу (сложность или категория)
      const matchesFilter = (() => {
        if (filterType === "all") return true

        // Фильтрация по сложности
        if (["basic", "intermediate", "advanced"].includes(filterType)) {
          return (style.complexity || "basic") === filterType
        }

        // Фильтрация по категории
        if (["basic", "cinematic", "stylized", "minimal", "animated", "modern"].includes(filterType)) {
          return style.category === filterType
        }

        return true
      })()

      return matchesSearch && matchesFavorites && matchesFilter
    })

    // 2. Сортировка
    filtered.sort((a, b) => {
      let result = 0

      switch (sortBy) {
        case "name":
          const nameA = a.name.toLowerCase()
          const nameB = b.name.toLowerCase()
          result = nameA.localeCompare(nameB)
          break

        case "complexity":
          const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
          const complexityA = complexityOrder[a.complexity || "basic"]
          const complexityB = complexityOrder[b.complexity || "basic"]
          result = complexityA - complexityB
          break

        case "category":
          const categoryA = (a.category || "").toLowerCase()
          const categoryB = (b.category || "").toLowerCase()
          result = categoryA.localeCompare(categoryB)
          break

        default:
          result = 0
      }

      return sortOrder === "asc" ? result : -result
    })

    return filtered
  }, [subtitles, searchQuery, showFavoritesOnly, filterType, sortBy, sortOrder, isItemFavorite])

  /**
   * Группировка стилей субтитров по выбранному критерию
   */
  const groupedStyles = useMemo(() => {
    if (groupBy === "none") {
      return [{ title: "", styles: processedStyles }]
    }

    const groups: Record<string, SubtitleStyle[]> = {}

    processedStyles.forEach((style) => {
      let groupKey = ""

      switch (groupBy) {
        case "category":
          groupKey = style.category || "other"
          break
        case "complexity":
          groupKey = style.complexity || "basic"
          break
        case "tags":
          groupKey = style.tags && style.tags.length > 0 ? style.tags[0] : "untagged"
          break
        default:
          groupKey = "ungrouped"
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(style)
    })

    // Преобразуем в массив групп с переводами заголовков
    return Object.entries(groups)
      .map(([key, styles]) => {
        let title = ""

        switch (groupBy) {
          case "category":
            title = t(`subtitles.categories.${key}`, key)
            break
          case "complexity":
            title = t(`subtitles.complexity.${key}`, key)
            break
          case "tags":
            title = key === "untagged" ? t("subtitles.styles.allTags", "Без тегов") : key
            break
          default:
            title = key
        }

        return { title, styles }
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [processedStyles, groupBy, t])

  /**
   * Обработчик клика по стилю субтитров
   */
  const handleStyleClick = (style: SubtitleStyle) => {
    console.log("Applying subtitle style:", style.name, style.style) // Отладочный вывод
    // Здесь может быть логика применения стиля субтитров к видео
  }

  // Показываем состояние загрузки
  if (loading) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-full items-center justify-center text-gray-500">
          {t("common.loading", "Загрузка...")}
        </div>
      </div>
    )
  }

  // Показываем ошибку загрузки
  if (error) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-full items-center justify-center text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Контейнер для списка стилей субтитров с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3">
        {processedStyles.length === 0 ? (
          // Отображаем сообщение, если стили не найдены
          <div className="flex h-full items-center justify-center text-gray-500">
            {showFavoritesOnly ? t("browser.media.noFavorites") : t("common.noResults")}
          </div>
        ) : (
          // Отображаем сгруппированные стили
          <div className="space-y-4">
            {groupedStyles.map((group) => (
              <ContentGroup
                key={group.title || "ungrouped"}
                title={group.title}
                items={group.styles}
                viewMode="thumbnails"
                renderItem={(style: SubtitleStyle) => (
                  <SubtitlePreview
                    key={style.id}
                    style={style}
                    onClick={() => handleStyleClick(style)}
                    size={basePreviewSize}
                    previewWidth={previewDimensions.width}
                    previewHeight={previewDimensions.height}
                  />
                )}
                itemsContainerClassName="grid gap-2"
                itemsContainerStyle={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(${previewDimensions.width}px, 1fr))`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
