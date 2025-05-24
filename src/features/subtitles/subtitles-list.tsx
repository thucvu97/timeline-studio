import React, { useCallback, useState } from "react"

import { Star, ZoomIn, ZoomOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePreviewSize } from "@/features/browser/components/preview/preview-size-provider"
import { useMedia } from "@/features/browser/media"
import { cn } from "@/lib/utils"

import { SUBTITLE_CATEGORIES, SubtitleStyle } from "./subtitles"
import { SubtitlesPreview } from "./subtitles-preview"

/**
 * Компонент для отображения списка доступных стилей субтитров
 * Позволяет просматривать, фильтровать и выбирать стили для применения к видео
 *
 * @returns {JSX.Element} Компонент списка стилей субтитров
 */
export function SubtitlesList() {
  const { t } = useTranslation() // Хук для интернационализации
  const [searchQuery, setSearchQuery] = useState("") // Поисковый запрос
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false) // Флаг отображения только избранных
  const media = useMedia() // Доступ к контексту медиа
  const { isItemFavorite } = media

  /**
   * Получаем параметры размера превью из хука usePreviewSize
   * Используется для управления размером отображаемых превью стилей
   */
  const {
    previewSize, // Текущий размер превью
    increaseSize, // Функция увеличения размера
    decreaseSize, // Функция уменьшения размера
    canIncreaseSize, // Флаг возможности увеличения
    canDecreaseSize, // Флаг возможности уменьшения
  } = usePreviewSize()

  /**
   * Обработчик переключения режима отображения избранных стилей
   */
  const handleToggleFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev) // Инвертируем текущее значение
  }, [])

  // Обработчик выбора стиля субтитров
  const handleSelectStyle = (style: SubtitleStyle) => {
    console.log("Selected subtitle style:", style)
    // В будущем здесь будет логика добавления субтитров на временную шкалу
    alert(
      t("subtitles.addedToTimeline", {
        name: style.name,
        defaultValue: `Стиль субтитров "${style.name}" добавлен на таймлайн`,
      }),
    )
  }

  /**
   * Получаем все стили субтитров из всех категорий
   */
  const allSubtitleStyles = SUBTITLE_CATEGORIES.flatMap((category) => category.styles)

  /**
   * Фильтрация стилей по поисковому запросу и избранному
   * Возвращает стили, соответствующие критериям поиска и фильтрации
   */
  const filteredStyles = allSubtitleStyles.filter((style) => {
    // Фильтрация по поисковому запросу
    const searchLower = searchQuery.toLowerCase() // Приводим запрос к нижнему регистру

    // Проверяем, соответствует ли стиль поисковому запросу
    const matchesSearch = style.name.toLowerCase().includes(searchLower)

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly || // Если не включен режим "только избранное", показываем все
      isItemFavorite({ id: style.id, path: "", name: style.name }, "sbtitle")

    // Стиль должен соответствовать обоим условиям
    return matchesSearch && matchesFavorites
  })

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Панель инструментов с поиском и кнопками управления */}
      <div className="flex items-center justify-between p-1 dark:bg-[#252526]">
        {/* Поле поиска стилей субтитров */}
        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="search-input" // Идентификатор для тестирования
        />

        {/* Контейнер для кнопок управления */}
        <div className="flex items-center gap-1">
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
                      // Добавляем фон, если активен режим избранного
                      showFavoritesOnly ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                    onClick={handleToggleFavorites}
                  >
                    <Star
                      size={16}
                      // Заполняем звезду, если активен режим избранного
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
                      // Делаем кнопку неактивной, если нельзя уменьшить размер
                      !canDecreaseSize && "cursor-not-allowed opacity-50",
                    )}
                    onClick={decreaseSize}
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
                      // Делаем кнопку неактивной, если нельзя увеличить размер
                      !canIncreaseSize && "cursor-not-allowed opacity-50",
                    )}
                    onClick={increaseSize}
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

      {/* Контейнер для списка стилей субтитров с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3">
        {/* Состояние загрузки - пустой контейнер */}
        {filteredStyles.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {t("browser.tabs.subtitles")} {t("common.notFound")}
          </div>
        ) : (
          /* Отображение найденных стилей в виде сетки */
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
            style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
          >
            {/* Отображение каждого стиля */}
            {filteredStyles.map((style) => (
              <SubtitlesPreview
                key={style.id}
                style={style} // Стиль субтитров
                onClick={() => handleSelectStyle(style)} // Обработчик клика
                size={previewSize} // Размер превью
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubtitlesList
