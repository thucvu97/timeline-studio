import React from "react"

import { useBrowserState } from "@/components/common/browser-state-provider"
import { MediaToolbar } from "@/components/common/media-toolbar"
import { getToolbarConfigForContent } from "@/components/common/media-toolbar-configs"
import { TabsContent } from "@/components/ui/tabs"
import { EffectList, FilterList, MediaList, MusicList, SubtitleList, TemplateList, TransitionList } from "@/features"
import { useMediaImport } from "@/features/browser/media/use-media-import"
import { useEffectsImport } from "@/features/effects/hooks/use-effects-import"
import { useFiltersImport } from "@/features/filters/hooks/use-filters-import"
import { useMusicImport } from "@/features/music/hooks/use-music-import"
import { StyleTemplateList } from "@/features/style-templates"
import { useStyleTemplatesImport } from "@/features/style-templates/hooks/use-style-templates-import"
import { useSubtitlesImport } from "@/features/subtitles/hooks/use-subtitles-import"
import { useTemplatesImport } from "@/features/templates/hooks/use-templates-import"
import { useTransitionsImport } from "@/features/transitions/hooks/use-transitions-import"
import { PREVIEW_SIZES } from "@/lib/constants/preview-sizes"

export function BrowserContent() {
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

  // Получаем функции импорта для всех вкладок
  const {
    importFile: importMediaFile,
    importFolder: importMediaFolder,
    isImporting: isImportingMedia,
  } = useMediaImport()
  const {
    importFile: importMusicFile,
    importDirectory: importMusicDirectory,
    isImporting: isImportingMusic,
  } = useMusicImport()
  const { importEffectsFile, importEffectFile, isImporting: isImportingEffects } = useEffectsImport()
  const { importFiltersFile, importFilterFile, isImporting: isImportingFilters } = useFiltersImport()
  const { importSubtitlesFile, importSubtitleFile, isImporting: isImportingSubtitles } = useSubtitlesImport()
  const { importTransitionsFile, importTransitionFile, isImporting: isImportingTransitions } = useTransitionsImport()
  const { importTemplatesFile, importTemplateFile, isImporting: isImportingTemplates } = useTemplatesImport()
  const {
    importStyleTemplatesFile,
    importStyleTemplateFile,
    isImporting: isImportingStyleTemplates,
  } = useStyleTemplatesImport()

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

  const handleImportFile = async () => {
    switch (activeTab) {
      case "media":
        await importMediaFile()
        break
      case "music":
        await importMusicFile()
        break
      case "effects":
        await importEffectsFile()
        break
      case "filters":
        await importFiltersFile()
        break
      case "subtitles":
        await importSubtitlesFile()
        break
      case "transitions":
        await importTransitionsFile()
        break
      case "templates":
        await importTemplatesFile()
        break
      case "style-templates":
        await importStyleTemplatesFile()
        break
      default:
        console.log("Импорт файлов не поддерживается для вкладки:", activeTab)
    }
  }

  const handleImportFolder = async () => {
    switch (activeTab) {
      case "media":
        await importMediaFolder()
        break
      case "music":
        await importMusicDirectory()
        break
      case "effects":
        await importEffectFile()
        break
      case "filters":
        await importFilterFile()
        break
      case "subtitles":
        await importSubtitleFile()
        break
      case "transitions":
        await importTransitionFile()
        break
      case "templates":
        await importTemplateFile()
        break
      case "style-templates":
        await importStyleTemplateFile()
        break
      default:
        console.log("Импорт папок не поддерживается для вкладки:", activeTab)
    }
  }

  // Определяем состояние импорта для текущей вкладки
  const isImporting = (() => {
    switch (activeTab) {
      case "media":
        return isImportingMedia
      case "music":
        return isImportingMusic
      case "effects":
        return isImportingEffects
      case "filters":
        return isImportingFilters
      case "subtitles":
        return isImportingSubtitles
      case "transitions":
        return isImportingTransitions
      case "templates":
        return isImportingTemplates
      case "style-templates":
        return isImportingStyleTemplates
      default:
        return false
    }
  })()

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
        availableExtensions={[]} // Для медиа не используется
        sortOptions={toolbarConfig.sortOptions}
        groupOptions={toolbarConfig.groupOptions}
        filterOptions={toolbarConfig.filterOptions}
        availableViewModes={toolbarConfig.viewModes}
        // Настройки отображения
        showImport={true} // Импорт доступен для всех вкладок
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
        onImport={handleImportFile}
        onImportFile={handleImportFile}
        onImportFolder={handleImportFolder}
        isImporting={isImporting}
        // Зум
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />

      <TabsContent value="media" className={contentClassName}>
        <MediaList />
      </TabsContent>
      <TabsContent value="music" className={contentClassName}>
        <MusicList />
      </TabsContent>
      <TabsContent value="transitions" className={contentClassName}>
        <TransitionList />
      </TabsContent>
      <TabsContent value="effects" className={contentClassName}>
        <EffectList />
      </TabsContent>
      <TabsContent value="subtitles" className={contentClassName}>
        <SubtitleList />
      </TabsContent>
      <TabsContent value="filters" className={contentClassName}>
        <FilterList />
      </TabsContent>
      <TabsContent value="templates" className={contentClassName}>
        <TemplateList />
      </TabsContent>
      <TabsContent value="style-templates" className={contentClassName}>
        <StyleTemplateList />
      </TabsContent>
    </>
  )
}
