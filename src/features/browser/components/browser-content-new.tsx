import { TabsContent } from "@/components/ui/tabs"
import { MediaToolbar } from "@/features/browser/components/media-toolbar"
import { getToolbarConfigForContent } from "@/features/browser/components/media-toolbar-configs"
import { UniversalList } from "@/features/browser/components/universal-list"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { useTimelineActions } from "@/features/timeline/hooks"

import { useMediaAdapter } from "../adapters/use-media-adapter"

/**
 * Новая версия BrowserContent с использованием UniversalList
 * Пока только для медиа файлов для тестирования
 */
export function BrowserContentNew() {
  const contentClassName = "bg-background m-0 flex-1 overflow-auto"
  
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
  
  // Хук для добавления медиафайлов на таймлайн
  const { addMediaToTimeline } = useTimelineActions()
  
  // Получаем адаптер для медиа
  const mediaAdapter = useMediaAdapter()
  
  // Извлекаем настройки для текущей вкладки
  const { searchQuery, showFavoritesOnly, viewMode, sortBy, filterType, groupBy, sortOrder, previewSizeIndex } =
    currentTabSettings
  
  // Получаем конфигурацию тулбара для текущей вкладки
  const toolbarConfig = getToolbarConfigForContent(activeTab)
  
  // Обработчики
  const handleSearch = (query: string) => {
    setSearchQuery(query, activeTab)
  }
  
  const handleSort = (sortBy: string) => {
    setSort(sortBy, sortOrder, activeTab)
  }
  
  const handleFilter = (filterType: string) => {
    setFilter(filterType, activeTab)
  }
  
  const handleChangeOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc"
    setSort(sortBy, newOrder, activeTab)
  }
  
  const handleViewModeChange = (mode: "list" | "grid" | "thumbnails") => {
    setViewMode(mode as any, activeTab)
  }
  
  const handleGroupBy = (groupBy: string) => {
    setGroupBy(groupBy, activeTab)
  }
  
  const handleToggleFavorites = () => {
    toggleFavorites(activeTab)
  }
  
  const handleZoomIn = () => {
    if (previewSizeIndex < PREVIEW_SIZES.length - 1) {
      setPreviewSize(previewSizeIndex + 1, activeTab)
    }
  }
  
  const handleZoomOut = () => {
    if (previewSizeIndex > 0) {
      setPreviewSize(previewSizeIndex - 1, activeTab)
    }
  }
  
  const canZoomIn = previewSizeIndex < PREVIEW_SIZES.length - 1
  const canZoomOut = previewSizeIndex > 0
  
  // Получаем адаптер для текущей вкладки
  const adapter = activeTab === "media" ? mediaAdapter : undefined
  
  return (
    <>
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
        showImport={true}
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
        // Импорт
        onImportFile={adapter?.importHandlers?.importFile}
        onImportFolder={adapter?.importHandlers?.importFolder}
        isImporting={adapter?.importHandlers?.isImporting}
        // Зум
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />
      
      {/* Контент с использованием UniversalList для медиа */}
      {activeTab === "media" && adapter ? (
        <TabsContent value="media" className={contentClassName}>
          <UniversalList
            adapter={adapter}
            onItemSelect={(item) => addMediaToTimeline(item)}
            onItemDragStart={(item, event) => {
              event.dataTransfer.setData("mediaFile", JSON.stringify(item))
            }}
          />
        </TabsContent>
      ) : (
        // Временно показываем заглушку для остальных вкладок
        <TabsContent value={activeTab} className={contentClassName}>
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">
              {activeTab} - адаптер в разработке
            </div>
          </div>
        </TabsContent>
      )}
    </>
  )
}