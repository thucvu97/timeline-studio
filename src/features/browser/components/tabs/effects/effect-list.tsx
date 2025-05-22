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
import { VideoEffect } from "@/types/effects"

import { EffectPreview } from "./effect-preview"
import { usePreviewSize } from "../../preview/preview-size"

import { effects } from "."

/**
 * Компонент для отображения списка доступных видеоэффектов
 * Позволяет просматривать, фильтровать и выбирать эффекты для применения к видео
 *
 * @returns {JSX.Element} Компонент списка эффектов
 */
export function EffectList() {
  const { t } = useTranslation() // Хук для интернационализации
  const [searchQuery, setSearchQuery] = useState("") // Поисковый запрос
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false) // Флаг отображения только избранных
  const media = useMedia() // Доступ к контексту медиа

  /**
   * Получаем параметры размера превью из хука usePreviewSize
   * Используется для управления размером отображаемых превью эффектов
   */
  const {
    previewSize, // Текущий размер превью
    isSizeLoaded, // Флаг загрузки размера
    handleIncreaseSize, // Функция увеличения размера
    handleDecreaseSize, // Функция уменьшения размера
    canIncreaseSize, // Флаг возможности увеличения
    canDecreaseSize, // Флаг возможности уменьшения
  } = usePreviewSize("TRANSITIONS")

  /**
   * Обработчик переключения режима отображения избранных эффектов
   */
  const handleToggleFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev) // Инвертируем текущее значение
  }, [])

  /**
   * Фильтрация эффектов по поисковому запросу и избранному
   * Возвращает эффекты, соответствующие критериям поиска и фильтрации
   */
  const filteredEffects = effects.filter((effect) => {
    // Фильтрация по поисковому запросу
    const searchLower = searchQuery.toLowerCase() // Приводим запрос к нижнему регистру

    // Получаем локализованное название эффекта
    const localizedName = t(`effects.presets.${effect.type}`).toLowerCase()

    // Проверяем, соответствует ли эффект поисковому запросу
    // Ищем совпадения в локализованном названии или имени эффекта
    const matchesSearch =
      localizedName.includes(searchLower) ||
      effect.name.toLowerCase().includes(searchLower)

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly || // Если не включен режим "только избранное", показываем все
      media.isItemFavorite(
        { id: effect.id, path: "", name: effect.name },
        "effect",
      )

    // Эффект должен соответствовать обоим условиям
    return matchesSearch && matchesFavorites
  })

  /**
   * Обработчик клика по эффекту
   * В текущей реализации только выводит информацию в консоль
   *
   * @param {VideoEffect} effect - Выбранный эффект
   */
  const handleEffectClick = (effect: VideoEffect) => {
    console.log("Applying effect:", effect.name) // Отладочный вывод
    // Здесь может быть логика применения эффекта к видео
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Панель инструментов с поиском и кнопками управления */}
      <div className="flex items-center justify-between p-1 bg-[#2D2D2D]">
        {/* Поле поиска эффектов */}
        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          style={{
            backgroundColor: "transparent",
          }}
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
                      // Делаем кнопку неактивной, если нельзя увеличить размер
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

      {/* Контейнер для списка эффектов с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3">
        {/* Состояние загрузки - пустой контейнер */}
        {!isSizeLoaded ? (
          <div className="flex h-full items-center justify-center text-gray-500" />
        ) : /* Состояние "ничего не найдено" - сообщение */
        filteredEffects.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {t("browser.tabs.effects")} {t("common.notFound")}
          </div>
        ) : (
          /* Отображение найденных эффектов в виде сетки */
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
            style={
              { "--preview-size": `${previewSize}px` } as React.CSSProperties
            }
          >
            {/* Отображение каждого эффекта */}
            {filteredEffects.map((effect) => (
              <EffectPreview
                key={effect.id}
                effectType={effect.type} // Тип эффекта
                onClick={() => handleEffectClick(effect)} // Обработчик клика
                size={previewSize} // Размер превью
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
