import { useBrowserState } from "@/components/common/browser-state-provider";
import { MediaToolbar } from "@/components/common/media-toolbar";
import { getToolbarConfigForContent } from "@/components/common/media-toolbar-configs";
import { TabsContent } from "@/components/ui/tabs";
import { useMediaImport } from "@/features/browser/media/use-media-import";
import {
  EffectList,
  FilterList,
  MediaList,
  MusicList,
  SubtitlesList,
  TemplateList,
  TransitionsList,
} from "@/features";

export function BrowserContent() {
  const contentClassName = "bg-background m-0 flex-1 overflow-auto";

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
  } = useBrowserState();

  // Получаем функции импорта
  const { importFile, importFolder, isImporting } = useMediaImport();

  // Извлекаем настройки для текущей вкладки
  const {
    searchQuery,
    showFavoritesOnly,
    viewMode,
    sortBy,
    filterType,
    groupBy,
    sortOrder,
    previewSizeIndex,
  } = currentTabSettings;

  // Получаем конфигурацию тулбара для текущей вкладки
  const toolbarConfig = getToolbarConfigForContent(activeTab);



  // Обработчики
  const handleSearch = (query: string) => {
    setSearchQuery(query, activeTab);
  };

  const handleSort = (sortBy: string) => {
    setSort(sortBy, sortOrder, activeTab);
  };

  const handleFilter = (filterType: string) => {
    setFilter(filterType, activeTab);
  };

  const handleChangeOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSort(sortBy, newOrder, activeTab);
  };

  const handleViewModeChange = (mode: "list" | "grid" | "thumbnails") => {
    setViewMode(mode as any, activeTab);
  };

  const handleGroupBy = (groupBy: string) => {
    setGroupBy(groupBy, activeTab);
  };

  const handleToggleFavorites = () => {
    toggleFavorites(activeTab);
  };

  const handleZoomIn = () => {
    setPreviewSize(previewSizeIndex + 1, activeTab);
  };

  const handleZoomOut = () => {
    setPreviewSize(previewSizeIndex - 1, activeTab);
  };

  const handleImportFile = async () => {
    await importFile();
  };

  const handleImportFolder = async () => {
    await importFolder();
  };

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
        showImport={activeTab === "media" || activeTab === "music"} // Импорт только для медиа и музыки
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
        canZoomIn={previewSizeIndex < 6} // Максимальный индекс в PREVIEW_SIZES
        canZoomOut={previewSizeIndex > 0} // Минимальный индекс
      />

      <TabsContent value="media" className={contentClassName}>
        <MediaList />
      </TabsContent>
      <TabsContent value="music" className={contentClassName}>
        <MusicList />
      </TabsContent>
      <TabsContent value="transitions" className={contentClassName}>
        <TransitionsList />
      </TabsContent>
      <TabsContent value="effects" className={contentClassName}>
        <EffectList />
      </TabsContent>
      <TabsContent value="subtitles" className={contentClassName}>
        <SubtitlesList />
      </TabsContent>
      <TabsContent value="filters" className={contentClassName}>
        <FilterList />
      </TabsContent>
      <TabsContent value="templates" className={contentClassName}>
        <TemplateList />
      </TabsContent>
    </>
  );
}
