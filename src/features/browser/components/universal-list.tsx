import { useMemo } from "react"

import { useTranslation } from "react-i18next"

import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { cn } from "@/lib/utils"

import { filterItems, groupItems, sortItems } from "../utils"
import { NoFiles } from "./no-files"
import { VirtualizedContentGroup } from "./virtualized-content-group"

import type { ListItem, UniversalListProps } from "../types/list"

/**
 * Универсальный компонент списка для отображения любого типа контента
 * Использует адаптер для получения данных и их обработки
 */
export function UniversalList<T extends ListItem>({
  adapter,
  onItemSelect,
  onItemDragStart,
  className,
}: UniversalListProps<T>) {
  const { t } = useTranslation()

  // Получаем данные через адаптер
  const { items, loading, error } = adapter.useData()

  // Получаем настройки из состояния браузера
  const { currentTabSettings } = useBrowserState()
  const { searchQuery, showFavoritesOnly, viewMode, sortBy, filterType, groupBy, sortOrder, previewSizeIndex } =
    currentTabSettings

  // Получаем текущий размер превью
  const currentPreviewSize = PREVIEW_SIZES[previewSizeIndex]

  // Фильтрация и сортировка
  const processedItems = useMemo(() => {
    // Фильтрация
    const filtered = filterItems(
      items,
      { searchQuery, showFavoritesOnly, filterType },
      adapter.getSearchableText,
      adapter.matchesFilter,
      adapter.isFavorite,
    )

    // Сортировка
    const sorted = sortItems(filtered, sortBy, sortOrder, adapter.getSortValue)

    return sorted
  }, [
    items,
    searchQuery,
    showFavoritesOnly,
    filterType,
    sortBy,
    sortOrder,
    adapter.getSearchableText,
    adapter.getSortValue,
    adapter.matchesFilter,
    adapter.isFavorite,
  ])

  // Группировка
  const groupedItems = useMemo(() => {
    return groupItems(processedItems, groupBy, adapter.getGroupValue, sortOrder)
  }, [processedItems, groupBy, sortOrder, adapter.getGroupValue])

  // Обработка состояний загрузки и ошибок
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-red-500">
          {t("common.error")}: {error.message}
        </div>
      </div>
    )
  }

  // Если нет элементов
  if (items.length === 0) {
    // Получаем тип из адаптера для NoFiles компонента
    const mediaType =
      adapter.favoriteType === "media"
        ? "media"
        : adapter.favoriteType === "music"
          ? "music"
          : adapter.favoriteType === "effect"
            ? "effects"
            : adapter.favoriteType === "filter"
              ? "filters"
              : adapter.favoriteType === "transition"
                ? "transitions"
                : adapter.favoriteType === "template"
                  ? "templates"
                  : adapter.favoriteType === "styleTemplate"
                    ? "style-templates"
                    : adapter.favoriteType === "subtitle"
                      ? "subtitles"
                      : "media"

    return <NoFiles type={mediaType} onImport={adapter.importHandlers?.importFile} />
  }

  // Если после фильтрации нет элементов
  if (processedItems.length === 0) {
    // Получаем тип из адаптера для NoFiles компонента
    const mediaType =
      adapter.favoriteType === "media"
        ? "media"
        : adapter.favoriteType === "music"
          ? "music"
          : adapter.favoriteType === "effect"
            ? "effects"
            : adapter.favoriteType === "filter"
              ? "filters"
              : adapter.favoriteType === "transition"
                ? "transitions"
                : adapter.favoriteType === "template"
                  ? "templates"
                  : adapter.favoriteType === "styleTemplate"
                    ? "style-templates"
                    : adapter.favoriteType === "subtitle"
                      ? "subtitles"
                      : "media"

    return (
      <div className="flex h-full flex-col">
        <NoFiles type={mediaType} />
      </div>
    )
  }

  // Рендерим группы
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex-1 overflow-auto">
        {groupedItems.map((group, index) => (
          <VirtualizedContentGroup<T>
            key={`${group.title}-${index}`}
            title={group.title}
            items={group.items}
            viewMode={viewMode}
            previewSize={{ width: currentPreviewSize, height: currentPreviewSize }}
            favoriteType={adapter.favoriteType}
            renderItem={(item) => (
              <adapter.PreviewComponent
                item={item}
                size={{ width: currentPreviewSize, height: currentPreviewSize }}
                viewMode={viewMode}
                onClick={onItemSelect}
                onDragStart={onItemDragStart}
                isSelected={false}
                isFavorite={adapter.isFavorite?.(item) || false}
                onToggleFavorite={() => {}}
              />
            )}
          />
        ))}
      </div>

      {/* StatusBar is only needed for media tab, skip it for other tabs */}
    </div>
  )
}
