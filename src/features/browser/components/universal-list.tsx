import { useMemo } from "react"

import { useTranslation } from "react-i18next"

import { StatusBar } from "@/features/browser/components/layout/status-bar"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { cn } from "@/lib/utils"

import { NoFiles } from "./no-files"
import { VirtualizedContentGroup } from "./virtualized-content-group"
import type { GroupedItems, ListAdapter, ListItem, UniversalListProps } from "../types/list"
import { filterItems, groupItems, sortItems } from "../utils"

/**
 * Универсальный компонент списка для отображения любого типа контента
 * Использует адаптер для получения данных и их обработки
 */
export function UniversalList<T extends ListItem>({
  adapter,
  onItemSelect,
  onItemDragStart,
  className
}: UniversalListProps<T>) {
  const { t } = useTranslation()
  
  // Получаем данные через адаптер
  const { items, loading, error } = adapter.useData()
  
  // Получаем настройки из состояния браузера
  const { currentTabSettings, previewSize } = useBrowserState()
  const { searchQuery, showFavoritesOnly, viewMode, sortBy, filterType, groupBy, sortOrder } = currentTabSettings
  
  // Получаем текущий размер превью
  const currentPreviewSize = PREVIEW_SIZES[previewSize]
  
  // Фильтрация и сортировка
  const processedItems = useMemo(() => {
    // Фильтрация
    const filtered = filterItems(
      items,
      { searchQuery, showFavoritesOnly, filterType },
      adapter.getSearchableText,
      adapter.matchesFilter,
      adapter.isFavorite
    )
    
    // Сортировка
    const sorted = sortItems(
      filtered,
      sortBy,
      sortOrder,
      adapter.getSortValue
    )
    
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
    adapter.isFavorite
  ])
  
  // Группировка
  const groupedItems = useMemo(() => {
    return groupItems(
      processedItems,
      groupBy,
      adapter.getGroupValue,
      sortOrder
    )
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
        <div className="text-red-500">{t("common.error")}: {error.message}</div>
      </div>
    )
  }
  
  // Если нет элементов
  if (items.length === 0) {
    return (
      <NoFiles
        message={t("browser.noFiles.message")}
        actions={adapter.importHandlers ? [
          {
            label: t("browser.noFiles.importFile"),
            onClick: adapter.importHandlers.importFile || (() => {}),
            disabled: adapter.importHandlers.isImporting
          },
          ...(adapter.importHandlers.importFolder ? [{
            label: t("browser.noFiles.importFolder"),
            onClick: adapter.importHandlers.importFolder,
            disabled: adapter.importHandlers.isImporting
          }] : [])
        ] : []}
      />
    )
  }
  
  // Если после фильтрации нет элементов
  if (processedItems.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <NoFiles
          message={searchQuery 
            ? t("browser.noFiles.noSearchResults") 
            : showFavoritesOnly 
              ? t("browser.noFiles.noFavorites")
              : t("browser.noFiles.noFilesInFilter")
          }
        />
        <StatusBar
          totalCount={items.length}
          filteredCount={0}
          selectedCount={0}
        />
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
            renderItem={(item, itemProps) => (
              <adapter.PreviewComponent
                item={item}
                size={{ width: currentPreviewSize, height: currentPreviewSize }}
                viewMode={viewMode}
                onClick={onItemSelect}
                onDragStart={onItemDragStart}
                isSelected={false}
                isFavorite={adapter.isFavorite?.(item) || false}
                onToggleFavorite={() => {}}
                {...itemProps}
              />
            )}
          />
        ))}
      </div>
      
      <StatusBar
        totalCount={items.length}
        filteredCount={processedItems.length}
        selectedCount={0}
      />
    </div>
  )
}