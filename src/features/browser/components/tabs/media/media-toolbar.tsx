import React from "react"

import {
  ArrowDownUp,
  ArrowUpDown,
  Check,
  File,
  Filter,
  Folder,
  Grid,
  LayoutDashboard,
  LayoutList,
  ListFilterPlus,
  SortDesc,
  Star,
  ZoomIn,
  ZoomOut,
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

import { useMediaList } from "./media-list-provider"

/**
 * Компонент для управления медиа-инструментами
 * Использует контекст из MediaListProvider вместо пропсов
 *
 * @returns {JSX.Element} Панель инструментов для управления медиа-файлами
 */
export function MediaToolbar() {
  const { t } = useTranslation()
  const media = useMedia()

  // Извлекаем значения из контекста
  const {
    viewMode,
    sortBy,
    sortOrder,
    filterType,
    groupBy,
    changeViewMode,
    sort,
    filter,
    changeGroupBy,
    changeOrder,
    search,
    toggleFavorites,
    canIncreaseSize,
    canDecreaseSize,
    increasePreviewSize,
    decreasePreviewSize,
    searchQuery,
    showFavoritesOnly,
    setSearchQuery,
  } = useMediaList()

  // Обработчики для обновления стейта и вызова методов из контекста
  const handleSort = (sortBy: string) => {
    console.log(`Sort requested in toolbar: "${sortBy}"`)
    sort(sortBy)
  }

  const handleFilter = (filterType: string) => {
    console.log(`Filter requested in toolbar: "${filterType}"`)
    filter(filterType, media)
  }

  const handleGroupBy = (groupBy: string) => {
    console.log(`Group by requested in toolbar: "${groupBy}"`)
    changeGroupBy(groupBy)
  }

  const handleChangeOrder = () => {
    console.log("Change order requested in toolbar")
    changeOrder()
  }

  const handleToggleFavorites = () => {
    console.log("Toggle favorites requested in toolbar")
    // Используем только toggleFavorites, который уже инвертирует флаг в машине состояний
    toggleFavorites(media)
  }

  const handleSearch = (query: string) => {
    console.log(`Search requested in toolbar: "${query}"`)
    setSearchQuery(query)
    search(query, media)
  }

  const handleViewModeChange = (mode: "list" | "grid" | "thumbnails") => {
    console.log(`View mode change requested in toolbar: "${mode}"`)
    changeViewMode(mode)
  }

  const handleImportFile = () => {
    console.log("Импорт файла")
    // Показываем диалог выбора файлов
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = "video/*,audio/*,image/*"

    input.onchange = () => {
      console.log("Файлы выбраны, закрываем диалог")
      // Тут просто закрываем диалог, не обрабатываем файлы
    }

    input.click()
  }

  const handleImportFolder = () => {
    console.log("Импорт папки")
    // Показываем диалог выбора папки
    const input = document.createElement("input")
    input.type = "file"
    // Используем setAttribute для webkitdirectory, так как это нестандартный атрибут
    input.setAttribute("webkitdirectory", "")
    input.setAttribute("directory", "")

    input.onchange = () => {
      console.log("Папка выбрана, закрываем диалог")
      // Тут просто закрываем диалог, не обрабатываем файлы
    }

    input.click()
  }

  return (
    <div className="flex items-center justify-between p-1 dark:bg-[#2D2D2D]">
      <div className="flex w-[calc(100%-100px)] items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex cursor-pointer items-center gap-1 bg-[#dddbdd] px-1 text-xs hover:bg-[#d1d1d1] dark:bg-[#45444b] dark:hover:bg-[#dddbdd]/25"
          onClick={() => handleImportFile()}
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
                    handleImportFile()
                  }}
                >
                  <File size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("browser.media.uploadMedia")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImportFolder()
                  }}
                  data-testid="folder-import-button"
                >
                  <Folder size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("browser.media.addFolder")}</TooltipContent>
            </Tooltip>
          </div>
        </Button>

        {/* <Button
          variant="outline"
          size="sm"
          className="flex cursor-pointer items-center gap-1 bg-[#dddbdd] px-1 text-xs hover:bg-[#d1d1d1] dark:bg-[#45444b] dark:hover:bg-[#dddbdd]/25"
          onClick={(e) => {
            e.stopPropagation()
            openModal("camera-capture")
          }}
        >
          <span className="px-2 text-xs">{t("common.record")}</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    openModal("camera-capture")
                  }}
                >
                  <Webcam size={12} />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("browser.media.recordVideo")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer rounded-sm p-1 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    openModal("voice-recording")
                  }}
                >
                  <Mic size={12} className="" />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("browser.media.recordVoice")}</TooltipContent>
            </Tooltip>
          </div>
        </Button> */}

        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          style={{
            backgroundColor: "transparent",
          }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        {/* Кнопки переключения режимов просмотра */}
        <TooltipProvider>
          <div className="mr-2 flex overflow-hidden rounded-md">
            {/* Кнопка избранного */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-0 ml-1 h-6 w-6 cursor-pointer",
                    showFavoritesOnly ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                  )}
                  onClick={handleToggleFavorites}
                  data-testid="favorites-button"
                >
                  <Star
                    size={16}
                    className={showFavoritesOnly ? "fill-current" : ""}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("browser.media.favorites")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-0 ml-2 h-6 w-6 cursor-pointer",
                    viewMode === "grid" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                  )}
                  onClick={() => handleViewModeChange("grid")}
                  data-testid="grid-view-button"
                >
                  <Grid size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.grid")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-0 h-6 w-6 cursor-pointer",
                    viewMode === "thumbnails"
                      ? "bg-[#dddbdd] dark:bg-[#45444b]"
                      : "",
                  )}
                  onClick={() => handleViewModeChange("thumbnails")}
                  data-testid="thumbnails-view-button"
                >
                  <LayoutDashboard size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.thumbnails")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-1 h-6 w-6 cursor-pointer",
                    viewMode === "list" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                  )}
                  onClick={() => handleViewModeChange("list")}
                  data-testid="list-view-button"
                >
                  <LayoutList size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.list")}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Кнопки изменения размера
        TODO: Добавить анимацию при наведении
        */}
        <TooltipProvider>
          <div className="mr-2 flex overflow-hidden rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-1 h-6 w-6 cursor-pointer",
                    !canDecreaseSize && "cursor-not-allowed opacity-50",
                  )}
                  onClick={decreasePreviewSize}
                  disabled={!canDecreaseSize}
                  data-testid="zoom-out-button"
                >
                  <ZoomOut size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.zoomOut")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "mr-1 h-6 w-6 cursor-pointer",
                    !canIncreaseSize && "cursor-not-allowed opacity-50",
                  )}
                  onClick={increasePreviewSize}
                  disabled={!canIncreaseSize}
                  data-testid="zoom-in-button"
                >
                  <ZoomIn size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.zoomIn")}</TooltipContent>
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
                    size="icon"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      sortBy !== "name" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
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
                    {sortBy === "name" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.sortBy.name")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => {
                    console.log("Сортировка по дате запрошена из UI")
                    handleSort("date")
                  }}
                >
                  <div className="flex items-center gap-2">
                    {sortBy === "date" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.sortBy.date")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => {
                    console.log("Сортировка по размеру запрошена из UI")
                    handleSort("size")
                  }}
                >
                  <div className="flex items-center gap-2">
                    {sortBy === "size" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.sortBy.size")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-6 cursor-pointer"
                  onClick={() => handleSort("duration")}
                >
                  <div className="flex items-center gap-2">
                    {sortBy === "duration" && <Check className="h-4 w-4" />}
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
                    size="icon"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      filterType !== "all"
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
                    {filterType === "all" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.filterBy.all")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFilter("video")}>
                  <div className="flex items-center gap-2">
                    {filterType === "video" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.filterBy.video")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilter("audio")}>
                  <div className="flex items-center gap-2">
                    {filterType === "audio" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.filterBy.audio")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilter("image")}>
                  <div className="flex items-center gap-2">
                    {filterType === "image" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.filterBy.image")}</span>
                  </div>
                </DropdownMenuItem>
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
                      groupBy !== "none"
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
                    {groupBy === "none" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.groupBy.none")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleGroupBy("type")}>
                  <div className="flex items-center gap-2">
                    {groupBy === "type" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.groupBy.type")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGroupBy("date")}>
                  <div className="flex items-center gap-2">
                    {groupBy === "date" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.groupBy.date")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGroupBy("duration")}>
                  <div className="flex items-center gap-2">
                    {groupBy === "duration" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.groupBy.duration")}</span>
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
                onClick={handleChangeOrder}
                data-testid="sort-order-button"
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
