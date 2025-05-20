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
import { MediaFile } from "@/types/media"

import { TransitionPreview } from "./transition-preview"
import { transitions } from "./transitions"
import { usePreviewSize } from "../../preview/preview-size"

/**
 * Компонент для отображения списка доступных переходов между видео
 * Позволяет просматривать, фильтровать и выбирать переходы для применения в проекте
 *
 * @param {Object} props - Пропсы компонента
 * @param {Function} [props.onSelect] - Функция обратного вызова при выборе перехода
 * @returns {JSX.Element} Компонент списка переходов
 */
export function TransitionsList({
  onSelect,
}: { onSelect?: (id: string) => void }) {
  const { t } = useTranslation() // Хук для интернационализации
  const [searchQuery, setSearchQuery] = useState("") // Поисковый запрос
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false) // Флаг отображения только избранных
  const media = useMedia() // Доступ к контексту медиа

  /**
   * Получаем параметры размера превью из хука usePreviewSize
   * Используется для управления размером отображаемых превью переходов
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
   * Обработчик переключения режима отображения избранных переходов
   */
  const handleToggleFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev) // Инвертируем текущее значение
  }, [])

  /**
   * Демонстрационные видео для превью переходов
   * Используются для визуализации эффекта перехода
   */
  const demoVideos = {
    source: { path: "t1.mp4" } as MediaFile, // Исходное видео
    target: { path: "t2.mp4" } as MediaFile, // Целевое видео
  }

  /**
   * Фильтрация переходов по поисковому запросу и избранному
   * Возвращает переходы, соответствующие критериям поиска и фильтрации
   */
  const filteredTransitions = transitions.filter((transition) => {
    // Фильтрация по поисковому запросу
    const searchLower = searchQuery.toLowerCase() // Приводим запрос к нижнему регистру

    // Получаем локализованное название перехода
    const localizedName = t(
      `transitions.types.${transition.type}`,
    ).toLowerCase()

    // Проверяем, соответствует ли переход поисковому запросу
    // Ищем совпадения в локализованном названии или ID перехода
    const matchesSearch =
      localizedName.includes(searchLower) ||
      transition.id.toLowerCase().includes(searchLower)

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly || // Если не включен режим "только избранное", показываем все
      media.isItemFavorite(
        { id: transition.id, path: "", name: transition.id },
        "transition",
      )

    // Переход должен соответствовать обоим условиям
    return matchesSearch && matchesFavorites
  })

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Панель инструментов с поиском и кнопками управления */}
      <div className="flex items-center justify-between p-1">
        {/* Поле поиска переходов */}
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

      {/* Контейнер для списка переходов с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3 dark:bg-[#1b1a1f]">
        {/* Состояние загрузки - пустой контейнер */}
        {!isSizeLoaded ? (
          <div className="flex h-full items-center justify-center text-gray-500"></div>
        ) : /* Состояние "ничего не найдено" - сообщение */
        filteredTransitions.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {t("browser.tabs.transitions")} {t("common.notFound")}
          </div>
        ) : (
          /* Отображение найденных переходов в виде сетки */
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
            style={
              { "--preview-size": `${previewSize}px` } as React.CSSProperties
            }
          >
            {/* Отображение каждого перехода */}
            {filteredTransitions.map((transition) => (
              <TransitionPreview
                key={transition.id}
                sourceVideo={demoVideos.source} // Исходное видео для превью
                targetVideo={demoVideos.target} // Целевое видео для превью
                transitionType={transition.type} // Тип перехода
                onClick={() => onSelect?.(transition.id)} // Обработчик клика
                size={previewSize} // Размер превью
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
