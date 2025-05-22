import React from "react"

import {
  ArrowDownUp,
  ArrowUpDown,
  Check,
  File,
  Filter,
  Folder,
  Grid2x2,
  List,
  ListFilterPlus,
  SortDesc,
  Star,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useMedia } from "@/features/browser/media"
import { cn } from "@/lib/utils"

import { useMusic } from "./music-provider"

interface MusicToolbarProps {
  onImport: () => void
  onImportFile: () => void
  onImportFolder: () => void
}

/**
 * Компонент для управления музыкальными инструментами
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
  const { t } = useTranslation()
  const media = useMedia()

  // Получаем все данные и методы из хука useMusic
  const {
    searchQuery,
    sortBy: currentSortBy,
    sortOrder,
    filterType: currentFilterType,
    viewMode,
    groupBy: currentGroupBy,
    availableExtensions,
    showFavoritesOnly,
    search,
    sort,
    filter,
    changeOrder,
    changeViewMode,
    changeGroupBy,
    toggleFavorites,
  } = useMusic()

  // Функции для обработки изменений
  const handleViewModeChange = (mode: "list" | "thumbnails") => {
    changeViewMode(mode)
  }

  const handleSort = (sortBy: string) => {
    sort(sortBy)
  }

  const handleFilter = (filterType: string) => {
    filter(filterType, media)
  }

  const handleGroupBy = (groupBy: "none" | "artist" | "genre" | "album") => {
    changeGroupBy(groupBy)
  }

  const handleToggleFavorites = () => {
    toggleFavorites(media)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value, media)
  }

  return (
    <div className="flex items-center justify-between p-1 bg-[#2D2D2D]">
      <div className="flex w-[calc(100%-100px)] items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex cursor-pointer items-center gap-1 bg-[#dddbdd] px-1 text-xs hover:bg-[#d1d1d1] dark:bg-[#45444b] dark:hover:bg-[#dddbdd]/25"
          onClick={onImport}
        >
          <span className="px-2 text-xs">{t("common.import")}</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onImportFile()
                  }}
                >
                  <File size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("browser.media.addMedia")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onImportFolder()
                  }}
                >
                  <Folder size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("browser.media.addFolder")}</TooltipContent>
            </Tooltip>
          </div>
        </Button>

        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          style={{
            backgroundColor: "transparent",
          }}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="flex items-end gap-2">
        {/* Кнопка избранного */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "mr-1 h-6 w-6 cursor-pointer",
                  showFavoritesOnly ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                )}
                onClick={handleToggleFavorites}
              >
                <Star
                  size={16}
                  className={showFavoritesOnly ? "fill-current" : ""}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("browser.media.favorites")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Кнопки режима отображения */}
        <TooltipProvider>
          <div className="flex overflow-hidden rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-1 h-6 w-6 cursor-pointer",
                    viewMode === "list" && "bg-[#dddbdd] dark:bg-[#45444b]",
                  )}
                  onClick={() => handleViewModeChange("list")}
                >
                  <List size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.list")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-1 h-6 w-6 cursor-pointer",
                    viewMode === "thumbnails" &&
                      "bg-[#dddbdd] dark:bg-[#45444b]",
                  )}
                  onClick={() => handleViewModeChange("thumbnails")}
                >
                  <Grid2x2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.thumbnails")}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Sort Dropdown */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      currentSortBy !== "name"
                        ? "bg-[#dddbdd] dark:bg-[#45444b]"
                        : "",
                    )}
                  >
                    <SortDesc size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.sort")}</TooltipContent>
              <DropdownMenuContent className="space-y-1" align="end">
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    {currentSortBy === "name" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.sortBy.name")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-2">
                    {currentSortBy === "title" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.sortBy.title")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("artist")}
                >
                  <div className="flex items-center gap-2">
                    {currentSortBy === "artist" && (
                      <Check className="h-4 w-4" />
                    )}
                    <span>{t("browser.toolbar.sortBy.artist")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-2">
                    {currentSortBy === "date" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.sortBy.date")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("size")}
                >
                  <div className="flex items-center gap-2">
                    {currentSortBy === "size" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.sortBy.size")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("duration")}
                >
                  <div className="flex items-center gap-2">
                    {currentSortBy === "duration" && (
                      <Check className="h-4 w-4" />
                    )}
                    <span>{t("browser.toolbar.sortBy.duration")}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Filter Dropdown */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      currentFilterType !== "all"
                        ? "bg-[#dddbdd] dark:bg-[#45444b]"
                        : "",
                    )}
                  >
                    <Filter size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.filter")}</TooltipContent>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFilter("all")}>
                  <div className="flex items-center gap-2">
                    {currentFilterType === "all" && (
                      <Check className="h-4 w-4" />
                    )}
                    <span>{t("browser.toolbar.filterBy.all")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableExtensions.map((extension) => (
                  <DropdownMenuItem
                    key={extension}
                    onClick={() => handleFilter(extension)}
                  >
                    <div className="flex items-center gap-2">
                      {currentFilterType === extension && (
                        <Check className="h-4 w-4" />
                      )}
                      <span>{extension.toUpperCase()}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Group Dropdown */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      currentGroupBy !== "none"
                        ? "bg-[#dddbdd] dark:bg-[#45444b]"
                        : "",
                    )}
                  >
                    <ListFilterPlus size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.group")}</TooltipContent>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleGroupBy("none")}>
                  <div className="flex items-center gap-2">
                    {currentGroupBy === "none" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.groupBy.none")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleGroupBy("artist")}>
                  <div className="flex items-center gap-2">
                    {currentGroupBy === "artist" && (
                      <Check className="h-4 w-4" />
                    )}
                    <span>{t("browser.toolbar.groupBy.artist")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGroupBy("genre")}>
                  <div className="flex items-center gap-2">
                    {currentGroupBy === "genre" && (
                      <Check className="h-4 w-4" />
                    )}
                    <span>{t("browser.toolbar.groupBy.genre")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGroupBy("album")}>
                  <div className="flex items-center gap-2">
                    {currentGroupBy === "album" && (
                      <Check className="h-4 w-4" />
                    )}
                    <span>{t("browser.toolbar.groupBy.album")}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Кнопка изменения порядка сортировки */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer"
                onClick={changeOrder}
              >
                {sortOrder === "asc" ? (
                  <ArrowDownUp size={16} />
                ) : (
                  <ArrowUpDown size={16} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sortOrder === "asc"
                ? t("browser.toolbar.sortOrder.desc")
                : t("browser.toolbar.sortOrder.asc")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
