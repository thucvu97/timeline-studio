import { TabsContent } from "@/components/ui/tabs"
import { MediaToolbar } from "@/features/browser/components/media-toolbar"
import { getToolbarConfigForContent } from "@/features/browser/components/media-toolbar-configs"
import { UniversalList } from "@/features/browser/components/universal-list"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { useTimelineActions } from "@/features/timeline/hooks"

import { BrowserLoadingIndicator } from "./browser-loading-indicator"
import { useEffectsAdapter } from "../adapters/use-effects-adapter"
import { useFiltersAdapter } from "../adapters/use-filters-adapter"
import { useMediaAdapter } from "../adapters/use-media-adapter"
import { useMusicAdapter } from "../adapters/use-music-adapter"
import { useStyleTemplatesAdapter } from "../adapters/use-style-templates-adapter"
import { useSubtitlesAdapter } from "../adapters/use-subtitles-adapter"
import { useTemplatesAdapter } from "../adapters/use-templates-adapter"
import { useTransitionsAdapter } from "../adapters/use-transitions-adapter"

/**
 * Новая версия BrowserContent с использованием UniversalList и адаптеров
 * Поддерживает все типы контента через единую архитектуру
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

  // Получаем все адаптеры
  const mediaAdapter = useMediaAdapter()
  const musicAdapter = useMusicAdapter()
  const effectsAdapter = useEffectsAdapter()
  const filtersAdapter = useFiltersAdapter()
  const transitionsAdapter = useTransitionsAdapter()
  const subtitlesAdapter = useSubtitlesAdapter()
  const templatesAdapter = useTemplatesAdapter()
  const styleTemplatesAdapter = useStyleTemplatesAdapter()

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
  const getAdapterForTab = () => {
    switch (activeTab) {
      case "media":
        return mediaAdapter
      case "music":
        return musicAdapter
      case "effects":
        return effectsAdapter
      case "filters":
        return filtersAdapter
      case "transitions":
        return transitionsAdapter
      case "subtitles":
        return subtitlesAdapter
      case "templates":
        return templatesAdapter
      case "style-templates":
        return styleTemplatesAdapter
      default:
        return undefined
    }
  }

  const adapter = getAdapterForTab()

  // Обработчики взаимодействия для разных типов контента
  const handleItemSelect = (item: any) => {
    switch (activeTab) {
      case "media":
        addMediaToTimeline(item)
        break
      case "music":
        // Музыка добавляется через AddMediaButton в адаптере
        console.log("Музыкальный файл выбран:", item.name)
        break
      case "effects":
        // Эффекты применяются через кнопки в превью
        console.log("Эффект выбран:", item.name)
        break
      case "filters":
        // Фильтры применяются через кнопки в превью
        console.log("Фильтр выбран:", item.name)
        break
      case "transitions":
        // Переходы применяются через кнопки в превью
        console.log("Переход выбран:", item.name || item.labels?.ru)
        break
      case "subtitles":
        // Стили субтитров применяются через кнопки в превью
        console.log("Стиль субтитров выбран:", item.name || item.labels?.ru)
        break
      case "templates":
        // Шаблоны применяются к проекту
        console.log("Шаблон выбран:", item.id)
        break
      case "style-templates":
        // Стилистические шаблоны добавляются в проект
        console.log("Стилистический шаблон выбран:", item.name?.ru || item.name?.en)
        break
      default:
        console.log("Неизвестный тип контента:", activeTab)
    }
  }

  // Удаляем старый обработчик, так как теперь drag обрабатывается через DragDropManager в UniversalList

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
        showImport={!!adapter?.importHandlers} // Показываем импорт только если есть обработчики
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

      {/* Контент с использованием UniversalList для всех типов */}
      {adapter ? (
        <TabsContent value={activeTab} className={contentClassName}>
          <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
        </TabsContent>
      ) : (
        // Показываем сообщение если адаптер не найден
        <TabsContent value={activeTab} className={contentClassName}>
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Адаптер для &quot;{activeTab}&quot; не найден</div>
          </div>
        </TabsContent>
      )}
    </>
  )
}
