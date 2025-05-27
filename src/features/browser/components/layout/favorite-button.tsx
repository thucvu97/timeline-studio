import { memo, useEffect, useRef, useState } from "react"

import { Star } from "lucide-react"
import { useTranslation } from "react-i18next"

import { MediaFile } from "@/features/media/types/media";
import { cn } from "@/lib/utils"

import { useMedia } from "../../media"

interface FavoriteButtonProps {
  file: MediaFile
  size?: number
  type?: "media" | "audio" | "transition" | "effect" | "template" | "filter" | "subtitle"
}

/**
 * Кнопка для добавления/удаления элемента в избранное
 *
 * Функционал:
 * - Отображает кнопку добавления в избранное
 * - Кнопка с состояниями (в избранном/не в избранном)
 * - Плавная анимация при добавлении в избранное
 * - Задержка перед отображением кнопки удаления из избранного после добавления
 *
 * @param file - Объект медиафайла или другого элемента
 * @param size - Размер кнопки (по умолчанию 60)
 * @param type - Тип элемента (по умолчанию "media")
 */
export const FavoriteButton = memo(function FavoriteButton({ file, size = 60, type = "media" }: FavoriteButtonProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const { isItemFavorite, addToFavorites, removeFromFavorites } = media
  const isFavorite = isItemFavorite(file, type)
  const [isHovering, setIsHovering] = useState(false)
  const [isRecentlyAdded, setIsRecentlyAdded] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prevIsFavoriteRef = useRef(isFavorite)

  useEffect(() => {
    // Обновляем состояние немедленно при изменении isFavorite
    if (isFavorite !== prevIsFavoriteRef.current) {
      // Если элемент добавлен в избранное, устанавливаем флаг isRecentlyAdded
      if (isFavorite) {
        setIsRecentlyAdded(true)

        // Очищаем предыдущий таймер, если он есть
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }

        // Через 1.5 секунды сбрасываем флаг
        timerRef.current = setTimeout(() => {
          setIsRecentlyAdded(false)
          timerRef.current = null
        }, 1500)
      } else {
        // Если элемент удален из избранного, сбрасываем флаг isRecentlyAdded
        setIsRecentlyAdded(false)

        // Очищаем таймер
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }

      // Обновляем предыдущее значение isFavorite
      prevIsFavoriteRef.current = isFavorite
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isFavorite])

  // Принудительно обновляем состояние при монтировании компонента
  useEffect(() => {
    // Если элемент уже в избранном при монтировании компонента
    if (isFavorite) {
      setIsRecentlyAdded(true)
      prevIsFavoriteRef.current = true

      // Через 1.5 секунды сбрасываем флаг
      const timer = setTimeout(() => {
        setIsRecentlyAdded(false)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [isFavorite])

  // Определяем, можно ли показывать кнопку удаления
  // Не показываем кнопку удаления в течение 3 секунд после добавления
  const canShowRemoveButton = !isRecentlyAdded

  const handleToggleFavorite = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (isFavorite && isHovering && canShowRemoveButton) {
      // Удаляем из избранного
      removeFromFavorites(file, type)
    } else if (!isFavorite) {
      // Добавляем в избранное
      addToFavorites(file, type)
      // Немедленно обновляем визуальное состояние
      setIsRecentlyAdded(true)
    }
  }

  const iconSize = size > 100 ? "h-3.5 w-3.5" : "h-2.5 w-2.5"

  return (
    <button
      type="button"
      className={cn(
        "absolute z-[1] cursor-pointer rounded-full p-1 text-white transition-all duration-150 border-0 outline-none focus:ring-2 focus:ring-teal-light",
        size > 100 ? "right-[36px] bottom-1" : "right-[28px] bottom-0.5",
        isFavorite
          ? isRecentlyAdded
            ? "visible scale-110 bg-teal dark:bg-teal" // Яркий цвет и увеличенный размер для недавно добавленных
            : "visible bg-teal dark:bg-teal" // Добавлен класс visible
          : "invisible bg-secondary dark:bg-secondary group-hover:visible group-hover:bg-teal-light/75 hover:bg-teal-light dark:group-hover:bg-teal-light/75 dark:hover:bg-teal-light", // Скрыта по умолчанию, видима при наведении
      )}
      onClick={handleToggleFavorite}
      onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          handleToggleFavorite(e)
        }
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      title={
        isFavorite
          ? isHovering && canShowRemoveButton
            ? t("browser.media.removeFromFavorites")
            : t("browser.media.inFavorites")
          : t("browser.media.addToFavorites")
      }
    >
      <Star
        className={`${iconSize} ${isFavorite ? "fill-white" : ""} transition-transform duration-150 hover:scale-110`}
        strokeWidth={2}
      />
    </button>
  )
})
