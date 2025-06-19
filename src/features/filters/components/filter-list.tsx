import { useMemo } from "react"

import { useTranslation } from "react-i18next"

import { useFavorites } from "@/features/app-state"
import { ContentGroup } from "@/features/browser/components/content-group"
import { NoFiles } from "@/features/browser/components/no-files"
import { PREVIEW_SIZES, useBrowserState } from "@/features/browser/services/browser-state-provider"
import { VideoFilter } from "@/features/filters/types/filters"
import { useProjectSettings } from "@/features/project-settings"

import { FilterPreview } from "./filter-preview"
import { useFilters } from "../hooks/use-filters"

/**
 * Компонент для отображения списка доступных видеофильтров
 * Позволяет просматривать, искать и добавлять фильтры в проект
 */
export function FilterList() {
  const { t } = useTranslation() // Хук для интернационализации

  // Загружаем фильтры из JSON
  const { filters, loading, error } = useFilters()

  const { isItemFavorite } = useFavorites() // Хук для доступа к избранным эффектам

  // Используем общий провайдер состояния браузера
  const { currentTabSettings } = useBrowserState()

  // Получаем настройки проекта для соотношения сторон
  const { settings } = useProjectSettings()

  // Извлекаем настройки для фильтров
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
   * Фильтрация, сортировка и группировка фильтров
   */
  const processedFilters = useMemo(() => {
    // 1. Фильтрация
    const filtered = filters.filter((filter) => {
      // Фильтрация по поисковому запросу
      const matchesSearch =
        !searchQuery ||
        filter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (filter.labels?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (filter.labels?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (filter.description?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (filter.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // Фильтрация по избранному
      const matchesFavorites = !showFavoritesOnly || isItemFavorite(filter, "filter")

      // Фильтрация по типу (сложность или категория)
      const matchesFilter = (() => {
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
  }, [filters, searchQuery, showFavoritesOnly, filterType, sortBy, sortOrder, isItemFavorite])

  /**
   * Группировка фильтров по выбранному критерию
   */
  const groupedFilters = useMemo(() => {
    if (groupBy === "none") {
      return [{ title: "", filters: processedFilters }]
    }

    const groups: Record<string, VideoFilter[]> = {}

    processedFilters.forEach((filter) => {
      let groupKey = ""

      switch (groupBy) {
        case "category":
          groupKey = filter.category || "other"
          break
        case "complexity":
          groupKey = filter.complexity || "basic"
          break
        case "tags":
          groupKey = filter.tags && filter.tags.length > 0 ? filter.tags[0] : "untagged"
          break
        default:
          groupKey = "ungrouped"
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(filter)
    })

    // Преобразуем в массив групп с переводами заголовков
    return Object.entries(groups)
      .map(([key, filters]) => {
        let title = ""

        switch (groupBy) {
          case "category":
            title = t(`filters.categories.${key}`, key)
            break
          case "complexity":
            title = t(`filters.complexity.${key}`, key)
            break
          case "tags":
            title = key === "untagged" ? t("filters.filters.allTags", "Без тегов") : key
            break
          default:
            title = key
        }

        return { title, filters }
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [processedFilters, groupBy, t])

  /**
   * Обработчик клика по фильтру
   */
  const handleFilterClick = (filter: VideoFilter) => {
    console.log("Applying filter:", filter.name, filter.params) // Отладочный вывод
    // Здесь может быть логика применения фильтра к видео
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
      {/* Контейнер для списка фильтров с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3">
        {processedFilters.length === 0 ? (
          // Отображаем сообщение, если фильтры не найдены
          <>
            {!showFavoritesOnly && <NoFiles type="filters" />}
            {showFavoritesOnly && (
              <div className="flex h-full items-center justify-center text-gray-500">
                {t("browser.media.noFavorites")}
              </div>
            )}
          </>
        ) : (
          // Отображаем сгруппированные фильтры
          <div className="space-y-4">
            {groupedFilters.map((group) => (
              <ContentGroup
                key={group.title || "ungrouped"}
                title={group.title}
                items={group.filters}
                viewMode="thumbnails"
                renderItem={(filter: VideoFilter) => (
                  <FilterPreview
                    key={filter.id}
                    filter={filter}
                    onClick={() => handleFilterClick(filter)}
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
