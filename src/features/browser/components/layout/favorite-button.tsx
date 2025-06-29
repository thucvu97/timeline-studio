import { memo, useCallback, useEffect, useRef, useState } from "react"

import { Star, StarOff } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useFavorites } from "@/features/app-state"
import { MediaFile } from "@/features/media/types/media"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  file: MediaFile
  size?: number
  type?: "media" | "music" | "transition" | "effect" | "template" | "filter" | "subtitle" | "styleTemplate"
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
 * @param size - Размер кнопки (по умолчанию 150px)
 * @param type - Тип элемента (по умолчанию "media")
 */
export const FavoriteButton = memo(function FavoriteButton({ file, size = 150, type = "media" }: FavoriteButtonProps) {
  const { t } = useTranslation()
  const { addToFavorites, removeFromFavorites, favorites } = useFavorites()
  const isFavorite = favorites[type]?.some((f) => f.id === file.id)
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

        // Через 1 секунду сбрасываем флаг
        timerRef.current = setTimeout(() => {
          setIsRecentlyAdded(false)
          timerRef.current = null
        }, 1000)
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

      // Через 1 секунду сбрасываем флаг
      const timer = setTimeout(() => {
        setIsRecentlyAdded(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isFavorite])

  // Определяем, можно ли показывать кнопку удаления
  // Не показываем кнопку удаления в течение 3 секунд после добавления
  const canShowRemoveButton = !isRecentlyAdded

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      e.preventDefault()

      if (isFavorite && isHovering && canShowRemoveButton) {
        // Удаляем из избранного
        removeFromFavorites(type, file.id)
      } else if (!isFavorite) {
        // Добавляем в избранное
        addToFavorites(type, file)
        // Немедленно обновляем визуальное состояние
        setIsRecentlyAdded(true)
      }
    },
    [isFavorite, isHovering, canShowRemoveButton, removeFromFavorites, addToFavorites, file.id, type],
  )

  return (
    <button
      type="button"
      className={cn(
        "absolute z-[1] top-1 right-1 cursor-pointer rounded-full p-1 transition-all duration-150 dark:hover:text-black/50 border-0 outline-none focus:ring-2 focus:ring-teal",
        isFavorite
          ? isRecentlyAdded
            ? "visible scale-110 bg-teal dark:bg-teal" // Яркий цвет и увеличенный размер для недавно добавленных
            : "visible bg-teal dark:bg-teal" // Добавлен класс visible
          : "invisible bg-secondary dark:bg-secondary group-hover:visible group-hover:bg-teal-light hover:bg-teal-light dark:group-hover:bg-teal dark:hover:bg-teal", // Скрыта по умолчанию, видима при наведении
      )}
      style={{ color: "#ffffff" }}
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
      {isFavorite && isHovering && canShowRemoveButton ? (
        <StarOff
          className={"transition-transform duration-150 hover:scale-110"}
          style={{ color: "#000", height: `${6 + size / 30}px`, width: `${6 + size / 30}px` }}
          strokeWidth={1}
        />
      ) : (
        <Star
          className={"transition-transform fill-white duration-150 hover:scale-110"}
          style={{ color: "#ffffff", height: `${6 + size / 30}px`, width: `${6 + size / 30}px` }}
          strokeWidth={2}
        />
      )}
    </button>
  )
})
