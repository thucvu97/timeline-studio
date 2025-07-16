import { memo, useMemo } from "react"

import { MediaToolbar } from "@/features/browser/components/media-toolbar"
import { getToolbarConfigForContent } from "@/features/browser/components/media-toolbar-configs"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { useTimelineActions } from "@/features/timeline/hooks"

import { BrowserLoadingIndicator } from "./browser-loading-indicator"
import { LazyTabContent } from "./lazy-tab-content"
import { useEffectsProvider } from "../providers/effects-provider"


/**
 * Новая версия BrowserContent с использованием UniversalList и адаптеров
 * Поддерживает все типы контента через единую архитектуру
 */
export const BrowserContent = memo(() => {
  const contentClassName = "bg-background m-0 flex-1 overflow-auto"

  // Проверяем инициализацию EffectsProvider
  const { isInitialized } = useEffectsProvider()

  // Получаем состояние браузера
  const {
    activeTab,
    currentTabSettings,
    setSearchQuery,
    toggleFavorites,
    setSort,
    setGroupBy,
    setFilter,
    setViewMode,
    setPreviewSize,
  } = useBrowserState()

  // Хуки для добавления медиафайлов на таймлайн (нужны только для toolbar)
  const { addMediaToTimeline, addSingleMediaToTimeline } = useTimelineActions()

  // Извлекаем настройки для текущей вкладки
  const { searchQuery, showFavoritesOnly, viewMode, sortBy, filterType, groupBy, sortOrder, previewSizeIndex } =
    currentTabSettings

  // Получаем конфигурацию тулбара для текущей вкладки (мемоизируем)
  const toolbarConfig = useMemo(() => getToolbarConfigForContent(activeTab), [activeTab])

  // Мемоизированные обработчики
  const handleSearch = useMemo(
    () => (query: string) => setSearchQuery(query, activeTab),
    [setSearchQuery, activeTab]
  )

  const handleSort = useMemo(
    () => (sortBy: string) => setSort(sortBy, sortOrder, activeTab),
    [setSort, sortOrder, activeTab]
  )

  const handleFilter = useMemo(
    () => (filterType: string) => setFilter(filterType, activeTab),
    [setFilter, activeTab]
  )

  const handleChangeOrder = useMemo(() => {
    return () => {
      const newOrder = sortOrder === "asc" ? "desc" : "asc"
      setSort(sortBy, newOrder, activeTab)
    }
  }, [setSort, sortBy, sortOrder, activeTab])

  const handleViewModeChange = useMemo(
    () => (mode: "list" | "grid" | "thumbnails") => setViewMode(mode as any, activeTab),
    [setViewMode, activeTab]
  )

  const handleGroupBy = useMemo(
    () => (groupBy: string) => setGroupBy(groupBy, activeTab),
    [setGroupBy, activeTab]
  )

  const handleToggleFavorites = useMemo(
    () => () => toggleFavorites(activeTab),
    [toggleFavorites, activeTab]
  )

  const handleZoomIn = useMemo(() => {
    return () => {
      if (previewSizeIndex < PREVIEW_SIZES.length - 1) {
        setPreviewSize(previewSizeIndex + 1, activeTab)
      }
    }
  }, [previewSizeIndex, setPreviewSize, activeTab])

  const handleZoomOut = useMemo(() => {
    return () => {
      if (previewSizeIndex > 0) {
        setPreviewSize(previewSizeIndex - 1, activeTab)
      }
    }
  }, [previewSizeIndex, setPreviewSize, activeTab])

  const canZoomIn = previewSizeIndex < PREVIEW_SIZES.length - 1
  const canZoomOut = previewSizeIndex > 0


  return (
    <>
      {/* Индикатор загрузки ресурсов */}
      <BrowserLoadingIndicator />

      {/* Общий тулбар для всех вкладок */}
      <MediaToolbar
        // Состояние
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        filterType={filterType}
        groupBy={groupBy}
        viewMode={viewMode}
        showFavoritesOnly={showFavoritesOnly}
        // Конфигурация из toolbarConfig
        availableExtensions={[]}
        sortOptions={toolbarConfig.sortOptions}
        groupOptions={toolbarConfig.groupOptions}
        filterOptions={toolbarConfig.filterOptions}
        availableViewModes={toolbarConfig.viewModes}
        // Настройки отображения
        showImport={activeTab === "media" || activeTab === "music"}
        showGroupBy={toolbarConfig.showGroupBy}
        showZoom={toolbarConfig.showZoom}
        // Колбэки
        onSearch={handleSearch}
        onSort={handleSort}
        onFilter={handleFilter}
        onChangeOrder={handleChangeOrder}
        onChangeViewMode={handleViewModeChange}
        onChangeGroupBy={handleGroupBy}
        onToggleFavorites={handleToggleFavorites}
        // Импорт (пока отключен, так как адаптеры загружаются лениво)
        onImportFile={undefined}
        onImportFolder={undefined}
        isImporting={false}
        // Зум
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />

      {/* Контент только для активной вкладки */}
      <div className={contentClassName}>
        <LazyTabContent tabValue={activeTab} activeTab={activeTab} />
      </div>
    </>
  )
})

BrowserContent.displayName = "BrowserContent"
