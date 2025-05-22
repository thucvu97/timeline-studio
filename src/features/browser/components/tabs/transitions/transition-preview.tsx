import { useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { useResources } from "@/features/browser/resources"
import { MediaFile } from "@/types/media"
import { TransitionResource } from "@/types/resources"
import { transitions as transitionEffects } from "@/types/transitions"

import { transitions } from "./transitions"
import { AddMediaButton } from "../../layout/add-media-button"
import { FavoriteButton } from "../../layout/favorite-button"

/**
 * Интерфейс пропсов для компонента TransitionPreview
 * @interface TransitionPreviewProps
 * @property {MediaFile} sourceVideo - Исходное видео для перехода
 * @property {MediaFile} targetVideo - Целевое видео для перехода
 * @property {string} transitionType - Тип перехода (zoom, fade, slide и т.д.)
 * @property {Function} onClick - Функция обработки клика по превью
 * @property {number} size - Размер превью в пикселях
 */
interface TransitionPreviewProps {
  sourceVideo: MediaFile
  targetVideo: MediaFile
  transitionType:
    | "zoom"
    | "fade"
    | "slide"
    | "scale"
    | "rotate"
    | "flip"
    | "push"
    | "squeeze"
    | "diagonal"
    | "spiral"
    | "fold"
    | "wave"
    | "shutter"
    | "bounce"
    | "swirl"
    | "dissolve"
  onClick: () => void
  size: number
}

/**
 * Компонент для отображения превью перехода между видео
 * Показывает анимированный переход между двумя видео и позволяет добавить переход в проект
 *
 * @param {TransitionPreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью перехода
 */
export function TransitionPreview({
  sourceVideo,
  targetVideo,
  transitionType,
  onClick,
  size,
}: TransitionPreviewProps) {
  const { t } = useTranslation() // Хук для интернационализации
  const {
    addTransition,
    isTransitionAdded,
    removeResource,
    transitionResources,
  } = useResources() // Получаем методы для работы с ресурсами

  const [isHovering, setIsHovering] = useState(false) // Состояние наведения мыши
  const [isError, setIsError] = useState(false) // Состояние ошибки загрузки видео

  // Ссылки на элементы видео и таймеры
  const sourceVideoRef = useRef<HTMLVideoElement>(null) // Ссылка на исходное видео
  const targetVideoRef = useRef<HTMLVideoElement>(null) // Ссылка на целевое видео
  const transitionTimeoutRef = useRef<NodeJS.Timeout>(null) // Таймер для запуска перехода
  const loopTimeoutRef = useRef<NodeJS.Timeout>(null) // Таймер для зацикливания демонстрации

  // Находим переход по типу из списка доступных переходов
  const transition = transitionEffects.find(
    (t) => t.id === transitionType || t.type === transitionType,
  )

  // Создаем объект перехода с правильным id, если его нет в transitionEffects
  const transitionObj = transition ?? {
    id: transitionType,
    type: transitionType as any,
    name:
      transitions.find((t) => t.type === transitionType)?.labels.ru ??
      transitionType,
    duration: 1.5,
    ffmpegCommand: () => "",
    params: {},
    previewPath: "",
  }

  // Проверяем, добавлен ли переход уже в хранилище ресурсов
  const isAdded = isTransitionAdded(transitionObj)

  // Отладочный вывод
  // useEffect(() => {
  //   console.log(`Transition ${transitionObj.id} (${transitionType}) isAdded:`, isAdded)
  // }, [transitionObj, transitionType, isAdded])

  /**
   * Сбрасывает состояние видео элементов к начальному
   * Устанавливает время воспроизведения на начало и сбрасывает все CSS-стили
   */
  const resetVideos = useCallback(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    // Сбрасываем время воспроизведения
    sourceVideo.currentTime = 0
    targetVideo.currentTime = 0

    // Сброс всех возможных стилей для исходного видео
    sourceVideo.style.transform = "scale(1)"
    sourceVideo.style.opacity = "1"
    sourceVideo.style.filter = "blur(0px) wave(0, 0%, 0%)"
    sourceVideo.style.clipPath = "none"
    sourceVideo.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
    sourceVideo.style.mixBlendMode = "normal"

    // Сброс всех возможных стилей для целевого видео
    targetVideo.style.opacity = "0" // Целевое видео изначально скрыто
    targetVideo.style.transform = "scale(1)"
    targetVideo.style.filter = "blur(0px)"
    targetVideo.style.clipPath = "none"
    targetVideo.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
    targetVideo.style.mixBlendMode = "normal"
  }, [])

  /**
   * Запускает анимацию перехода между видео
   * Сначала показывает исходное видео, затем применяет эффект перехода и показывает целевое видео
   */
  const startTransition = useCallback(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current || isError) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    // Сбрасываем состояние видео перед началом перехода
    resetVideos()
    // Запускаем воспроизведение исходного видео
    void sourceVideo.play()

    // Устанавливаем таймер для начала перехода через 1 секунду
    transitionTimeoutRef.current = setTimeout(() => {
      // Показываем целевое видео
      targetVideo.style.opacity = "1"

      // Применяем соответствующий эффект перехода в зависимости от типа
      switch (transitionType) {
        case "zoom":
          // Эффект увеличения: исходное видео увеличивается и исчезает
          sourceVideo.style.transform = "scale(2)"
          sourceVideo.style.opacity = "0"
          break

        case "fade":
          // Эффект затухания: исходное видео плавно исчезает
          sourceVideo.style.opacity = "0"
          break

        case "slide":
          // Эффект слайда: исходное видео уезжает влево
          sourceVideo.style.transform = "translateX(-100%)"
          break

        case "scale":
          // Эффект масштабирования: исходное видео уменьшается и исчезает
          sourceVideo.style.transform = "scale(0.1)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "scale(1)"
          break

        case "rotate":
          // Эффект вращения: исходное видео вращается и уменьшается
          sourceVideo.style.transform = "rotate(180deg) scale(0.5)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "rotate(0deg) scale(1)"
          break

        case "flip":
          // Эффект переворота: исходное видео переворачивается по оси Y
          sourceVideo.style.transform = "rotateY(180deg)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "rotateY(0deg)"
          break

        case "push":
          // Эффект выталкивания: исходное видео выталкивается влево
          sourceVideo.style.transform = "translateX(-100%)"
          targetVideo.style.transform = "translateX(0%)"
          targetVideo.style.transition = "transform 1s ease-in-out"
          break

        case "squeeze":
          // Эффект сжатия: исходное видео сжимается по горизонтали
          sourceVideo.style.transform = "scaleX(0)"
          sourceVideo.style.opacity = "0"
          break

        case "diagonal":
          // Эффект диагонали: исходное видео уходит по диагонали
          sourceVideo.style.transform = "translate(-100%, -100%)"
          sourceVideo.style.opacity = "0"
          break

        case "spiral":
          // Эффект спирали: исходное видео вращается и уменьшается
          sourceVideo.style.transform = "rotate(720deg) scale(0)"
          sourceVideo.style.opacity = "0"
          break

        case "fold":
          // Эффект складывания: исходное видео складывается как страница
          sourceVideo.style.transform = "perspective(500px) rotateX(90deg)"
          sourceVideo.style.opacity = "0"
          break

        case "wave":
          // Эффект волны: исходное видео искажается волной и исчезает
          sourceVideo.style.transform = "scale(1.5)"
          sourceVideo.style.filter = "wave(16, 50%, 50%)"
          sourceVideo.style.opacity = "0"
          break

        case "shutter":
          // Эффект шторки: исходное видео закрывается шторкой
          sourceVideo.style.clipPath = "inset(0 50% 0 50%)"
          sourceVideo.style.opacity = "0"
          break

        case "bounce":
          // Эффект отскока: исходное видео уменьшается с эффектом пружины
          sourceVideo.style.transform = "scale(0)"
          sourceVideo.style.opacity = "0"
          sourceVideo.style.transition =
            "all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
          break

        case "swirl":
          // Эффект вихря: исходное видео вращается быстрее и исчезает
          sourceVideo.style.transform = "rotate(1080deg) scale(0)"
          sourceVideo.style.opacity = "0"
          sourceVideo.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)"
          break

        case "dissolve":
          // Эффект растворения: исходное и целевое видео смешиваются
          sourceVideo.style.mixBlendMode = "multiply"
          targetVideo.style.mixBlendMode = "screen"
          sourceVideo.style.opacity = "0"
          break
      }

      // Запускаем воспроизведение целевого видео
      void targetVideo.play()

      // Устанавливаем таймер для повторения перехода через 2 секунды
      loopTimeoutRef.current = setTimeout(() => {
        if (isHovering) {
          startTransition() // Повторяем переход, если курсор все еще наведен
        }
      }, 2000)
    }, 1000)
  }, [isHovering, transitionType, isError, resetVideos])

  /**
   * Эффект для управления воспроизведением видео и обработки ошибок
   * Запускает переход при наведении и останавливает при уходе курсора
   */
  useEffect(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    // Функция обработки ошибок загрузки видео
    const handleError = () => setIsError(true)

    // Добавляем обработчики ошибок для обоих видео
    sourceVideo.addEventListener("error", handleError)
    targetVideo.addEventListener("error", handleError)

    if (isHovering) {
      // Если курсор наведен - запускаем переход
      startTransition()
    } else {
      // Если курсор не наведен - останавливаем видео и сбрасываем стили
      resetVideos()
      sourceVideo.pause()
      targetVideo.pause()
      // Очищаем таймеры
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current)
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }

    // Функция очистки при размонтировании компонента
    return () => {
      // Удаляем обработчики ошибок
      sourceVideo.removeEventListener("error", handleError)
      targetVideo.removeEventListener("error", handleError)
      // Очищаем таймеры
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current)
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }
  }, [isHovering, startTransition, resetVideos])

  return (
    <div className="flex flex-col items-center">
      <div className="group relative">
        {/* Контейнер превью перехода */}
        <div
          className="flex cursor-pointer overflow-hidden rounded-xs bg-[#1a1a1a]"
          style={{ width: `${size}px`, height: `${size}px` }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={onClick}
        >
          {isError ? (
            // Отображаем сообщение об ошибке, если видео не загрузилось
            <div className="flex h-full items-center justify-center text-white">
              {t("timeline.player.videoLoadError")}
            </div>
          ) : (
            // Контейнер для видео с переходом
            <div className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-md">
              {/* Исходное видео (видимое в начале) */}
              <video
                ref={sourceVideoRef}
                src={sourceVideo.path}
                className="h-full w-full origin-center object-cover transition-all duration-1000"
                muted
                playsInline
                preload="auto"
                onError={() => setIsError(true)}
                data-testid="source-video"
              />
              {/* Целевое видео (появляется при переходе) */}
              <video
                ref={targetVideoRef}
                src={targetVideo.path}
                className="absolute inset-0 h-full w-full origin-center object-cover opacity-0 transition-all duration-1000"
                muted
                playsInline
                preload="auto"
                onError={() => setIsError(true)}
                data-testid="target-video"
              />
              {/* Кнопка добавления в избранное */}
              <FavoriteButton
                file={{
                  id: transitionObj.id,
                  path: "",
                  name: transitionObj.name,
                }}
                size={size}
                type="transition"
              />

              {/* Кнопка добавления перехода в проект */}
              <div
                className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
              >
                <AddMediaButton
                  file={{ id: transitionType, path: "", name: transitionType }}
                  onAddMedia={(e) => {
                    e.stopPropagation() // Предотвращаем всплытие события клика
                    addTransition(transitionObj) // Добавляем переход в ресурсы проекта
                  }}
                  onRemoveMedia={(e) => {
                    e.stopPropagation() // Предотвращаем всплытие события клика
                    // Находим ресурс с этим переходом и удаляем его
                    const resource = transitionResources.find(
                      (res: TransitionResource) =>
                        res.resourceId === transitionObj.id ||
                        res.resourceId === transitionObj.type,
                    )
                    if (resource) {
                      removeResource(resource.id) // Удаляем ресурс из проекта
                    } else {
                      console.warn(
                        `Не удалось найти ресурс перехода с ID ${transitionObj.id} для удаления`,
                      )
                    }
                  }}
                  isAdded={isAdded}
                  size={size}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Название перехода */}
      <div className="mt-1 text-xs">
        {t(`transitions.types.${transitionType}`)}{" "}
        {/* Локализованное название перехода */}
      </div>
    </div>
  )
}
