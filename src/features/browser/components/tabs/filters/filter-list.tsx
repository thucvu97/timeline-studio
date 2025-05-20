import { useCallback, useState } from "react"

import { Star, ZoomIn, ZoomOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useMedia } from "@/features/browser/media"
import { cn } from "@/lib/utils"

import { VideoFilter, filters } from "./filters"
import { usePreviewSize } from "../media"
import { FilterPreview } from "./filter-preview"

/**
 * Компонент для отображения списка доступных видеофильтров
 * Позволяет просматривать, искать и добавлять фильтры в проект
 *
 * @returns {JSX.Element} Компонент списка фильтров
 */
export function FilterList() {
  const { t } = useTranslation() // Хук для интернационализации
  const [searchQuery, setSearchQuery] = useState("") // Состояние поискового запроса
  const [, setActiveFilter] = useState<VideoFilter | null>(null) // Состояние активного фильтра
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false) // Флаг отображения только избранных фильтров
  const media = useMedia() // Хук для работы с медиа-файлами и избранным

  // Получаем параметры размера превью из хука
  const {
    previewSize, // Текущий размер превью
    isSizeLoaded, // Флаг загрузки размера
    handleIncreaseSize, // Функция увеличения размера
    handleDecreaseSize, // Функция уменьшения размера
    canIncreaseSize, // Флаг возможности увеличения
    canDecreaseSize, // Флаг возможности уменьшения
  } = usePreviewSize("TRANSITIONS")

  /**
   * Обработчик переключения режима отображения избранных фильтров
   */
  const handleToggleFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev)
  }, [])

  /**
   * Фильтрация списка фильтров по поисковому запросу и избранному
   */
  const filteredFilters = filters.filter((filter) => {
    // Фильтрация по поисковому запросу
    const searchLower = searchQuery.toLowerCase()
    const localizedName = t(`filters.presets.${filter.id}`).toLowerCase()
    const matchesSearch =
      localizedName.includes(searchLower) ||
      filter.name.toLowerCase().includes(searchLower)

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly ||
      media.isItemFavorite(
        { id: filter.id, path: "", name: filter.name },
        "filter",
      )

    // Фильтр должен соответствовать обоим условиям
    return matchesSearch && matchesFavorites
  })

  /**
   * Обработчик клика по фильтру
   * Устанавливает выбранный фильтр как активный
   *
   * @param {VideoFilter} filter - Выбранный фильтр
   */
  const handleFilterClick = (filter: VideoFilter) => {
    setActiveFilter(filter) // Устанавливаем активный фильтр
    console.log("Applying filter:", filter.name, filter.params) // Отладочный вывод
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Панель инструментов с поиском и кнопками */}
      <div className="flex items-center justify-between p-1">
        {/* Поле поиска фильтров */}
        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          style={{
            backgroundColor: "transparent",
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {/* Контейнер для кнопок управления */}
        <div className="flex items-center gap-1">
          {/* Кнопки изменения размера и избранного */}
          <TooltipProvider>
            <div className="mr-2 flex overflow-hidden rounded-md">
              {/* Кнопка переключения режима избранного */}
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
                  >
                    <Star
                      size={16}
                      className={showFavoritesOnly ? "fill-current" : ""}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.media.favorites")}</TooltipContent>
              </Tooltip>

              {/* Кнопка уменьшения размера превью */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mr-1 ml-2 h-6 w-6 cursor-pointer",
                      !canDecreaseSize && "cursor-not-allowed opacity-50",
                    )}
                    onClick={handleDecreaseSize}
                    disabled={!canDecreaseSize}
                  >
                    <ZoomOut size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.zoomOut")}</TooltipContent>
              </Tooltip>

              {/* Кнопка увеличения размера превью */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mr-1 h-6 w-6 cursor-pointer",
                      !canIncreaseSize && "cursor-not-allowed opacity-50",
                    )}
                    onClick={handleIncreaseSize}
                    disabled={!canIncreaseSize}
                  >
                    <ZoomIn size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.zoomIn")}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Контейнер для списка фильтров с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3 dark:bg-[#1b1a1f]">
        {!isSizeLoaded ? (
          // Отображаем пустой контейнер, пока размер не загружен
          <div className="flex h-full items-center justify-center text-gray-500" />
        ) : filteredFilters.length === 0 ? (
          // Отображаем сообщение, если фильтры не найдены
          <div className="flex h-full items-center justify-center text-gray-500">
            {t("browser.tabs.filters")} {t("common.notFound")}
          </div>
        ) : (
          // Отображаем сетку с превью фильтров
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
            style={
              { "--preview-size": `${previewSize}px` } as React.CSSProperties
            }
          >
            {/* Отображаем компоненты превью для каждого фильтра */}
            {filteredFilters.map((filter) => (
              <FilterPreview
                key={filter.id}
                filter={filter}
                onClick={() => handleFilterClick(filter)}
                size={previewSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
