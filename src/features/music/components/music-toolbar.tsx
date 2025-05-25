import React from "react";

import { useBrowserState } from "@/components/common/browser-state-provider";
import { MediaToolbar } from "@/components/common/media-toolbar";
import { getToolbarConfigForContent } from "@/components/common/media-toolbar-configs";
import { useMedia } from "@/features/browser/media";


interface MusicToolbarProps {
  onImport: () => void;
  onImportFile: () => void;
  onImportFolder: () => void;
}

/**
 * Компонент для управления музыкальными инструментами
 * Использует общий MediaToolbar компонент
 *
 * @param onImport - Callback для импорта файлов
 * @param onImportFile - Callback для импорта файлов
 * @param onImportFolder - Callback для импорта папок
 */
export function MusicToolbar({
  onImport,
  onImportFile,
  onImportFolder,
}: MusicToolbarProps) {
  // useTranslation не нужен, так как переводы обрабатываются в MediaToolbar
  const media = useMedia();

  // Получаем все данные и методы из хука useMusic
  const {
    searchQuery,
    sortBy,
    sortOrder,
    filterType,
    viewMode,
    groupBy,
    availableExtensions,
    showFavoritesOnly,
    search,
    sort,
    filter,
    changeOrder,
    changeViewMode,
    changeGroupBy,
    toggleFavorites,
  } = useMusic();

  // Получаем конфигурацию для музыки
  const config = getToolbarConfigForContent("music");

  // Функции-обёртки для передачи в общий компонент
  const handleSearch = (query: string) => {
    search(query, media);
  };

  const handleSort = (sortBy: string) => {
    sort(sortBy);
  };

  const handleFilter = (filterType: string) => {
    filter(filterType, media);
  };

  const handleChangeViewMode = (mode: "list" | "grid" | "thumbnails") => {
    changeViewMode(mode as "list" | "thumbnails");
  };

  const handleChangeGroupBy = (groupBy: string) => {
    changeGroupBy(groupBy as "none" | "artist" | "genre" | "album");
  };

  const handleToggleFavorites = () => {
    toggleFavorites(media);
  };

  return (
    <MediaToolbar
      // Состояние
      searchQuery={searchQuery}
      sortBy={sortBy}
      sortOrder={sortOrder}
      filterType={filterType}
      viewMode={viewMode}
      groupBy={groupBy}
      availableExtensions={availableExtensions}
      showFavoritesOnly={showFavoritesOnly}

      // Опции
      sortOptions={config.sortOptions}
      groupOptions={config.groupOptions}
      filterOptions={config.filterOptions}
      availableViewModes={config.viewModes}

      // Колбэки
      onSearch={handleSearch}
      onSort={handleSort}
      onFilter={handleFilter}
      onChangeOrder={changeOrder}
      onChangeViewMode={handleChangeViewMode}
      onChangeGroupBy={handleChangeGroupBy}
      onToggleFavorites={handleToggleFavorites}

      // Импорт
      onImport={onImport}
      onImportFile={onImportFile}
      onImportFolder={onImportFolder}

      // Настройки
      showImport={true}
      showGroupBy={config.showGroupBy}
      showZoom={config.showZoom}
    />
  );
}
