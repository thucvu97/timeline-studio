import type { ChangeEvent } from "react"

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
import { cn } from "@/lib/utils"

/**
 * Интерфейс пропсов для компонента TemplateListToolbar
 * @interface TemplateListToolbarProps
 * @property {string} searchQuery - Текущий поисковый запрос
 * @property {Function} setSearchQuery - Функция для обновления поискового запроса
 * @property {boolean} canDecreaseSize - Флаг возможности уменьшения размера превью
 * @property {boolean} canIncreaseSize - Флаг возможности увеличения размера превью
 * @property {Function} handleDecreaseSize - Обработчик уменьшения размера превью
 * @property {Function} handleIncreaseSize - Обработчик увеличения размера превью
 * @property {boolean} [showFavoritesOnly] - Флаг отображения только избранных шаблонов
 * @property {Function} [onToggleFavorites] - Обработчик переключения режима избранного
 */
interface TemplateListToolbarProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  canDecreaseSize: boolean
  canIncreaseSize: boolean
  handleDecreaseSize: () => void
  handleIncreaseSize: () => void
  showFavoritesOnly?: boolean
  onToggleFavorites?: () => void
}

/**
 * Компонент панели инструментов для списка шаблонов
 * Содержит поле поиска и кнопки управления отображением шаблонов
 *
 * @param {TemplateListToolbarProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент панели инструментов
 */
export function TemplateListToolbar({
  searchQuery,
  setSearchQuery,
  canDecreaseSize,
  canIncreaseSize,
  handleDecreaseSize,
  handleIncreaseSize,
  showFavoritesOnly = false, // По умолчанию не показываем только избранные
  onToggleFavorites = () => {}, // Пустая функция по умолчанию
}: TemplateListToolbarProps) {
  const { t } = useTranslation() // Хук для интернационализации

  /**
   * Обработчик изменения поискового запроса
   * @param {ChangeEvent<HTMLInputElement>} e - Событие изменения ввода
   */
  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value) // Обновляем поисковый запрос
  }

  return (
    <div className="flex items-center justify-between p-1 dark:bg-[#2D2D2D]">
      {/* Поле поиска шаблонов */}
      <Input
        type="search"
        placeholder={t("browser.toolbar.searchByName")}
        className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 bg-transparent text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
        value={searchQuery}
        onChange={onSearchChange}
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
                  onClick={onToggleFavorites}
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
  )
}
