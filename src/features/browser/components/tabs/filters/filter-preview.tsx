import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { useResources } from "@/features/browser/resources"
import { VideoFilter } from "@/types/filters"
import { FilterResource } from "@/types/resources"

import { AddMediaButton } from "../../layout/add-media-button"
import { FavoriteButton } from "../../layout/favorite-button"

/**
 * Интерфейс пропсов для компонента FilterPreview
 * @interface FilterPreviewProps
 * @property {VideoFilter} filter - Объект фильтра для предпросмотра
 * @property {Function} onClick - Функция обработки клика по превью
 * @property {number} size - Размер превью в пикселях
 */
interface FilterPreviewProps {
  filter: VideoFilter
  onClick: () => void
  size: number
}

/**
 * Компонент для отображения превью видеофильтра
 * Показывает видео с применённым фильтром и позволяет добавить фильтр в проект
 *
 * @param {FilterPreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью фильтра
 */
export function FilterPreview({ filter, onClick, size }: FilterPreviewProps) {
  const { t } = useTranslation() // Хук для интернационализации
  const { addFilter, isFilterAdded, removeResource, filterResources } =
    useResources() // Получаем методы для работы с ресурсами
  const [isHovering, setIsHovering] = useState(false) // Состояние наведения мыши
  const videoRef = useRef<HTMLVideoElement>(null) // Ссылка на элемент видео
  const timeoutRef = useRef<NodeJS.Timeout>(null) // Ссылка на таймер для воспроизведения видео

  // Проверяем, добавлен ли фильтр уже в хранилище ресурсов
  const isAdded = isFilterAdded(filter)

  /**
   * Формирует CSS-строку для применения фильтров к видео
   * Преобразует параметры фильтра в CSS-свойство filter
   *
   * @returns {string} CSS-строка с фильтрами
   */
  const getFilterStyle = () => {
    const { brightness, contrast, saturation, gamma, temperature, tint } =
      filter.params
    const filters = []

    // Добавляем CSS-фильтры в зависимости от наличия параметров
    if (brightness !== undefined) filters.push(`brightness(${1 + brightness})`)
    if (contrast !== undefined) filters.push(`contrast(${contrast})`)
    if (saturation !== undefined) filters.push(`saturate(${saturation})`)
    if (gamma !== undefined) filters.push(`gamma(${gamma})`)
    if (temperature !== undefined) filters.push(`sepia(${temperature}%)`)
    if (tint !== undefined) filters.push(`hue-rotate(${tint}deg)`)

    // Объединяем все фильтры в одну строку
    return filters.join(" ")
  }

  /**
   * Эффект для управления воспроизведением видео и применением фильтров
   * Запускает видео при наведении и применяет фильтры
   */
  useEffect(() => {
    if (!videoRef.current) return
    const videoElement = videoRef.current

    /**
     * Применяет фильтр к видео и запускает его воспроизведение
     * Устанавливает таймер для повторного воспроизведения
     */
    const applyFilter = () => {
      videoElement.currentTime = 0 // Сбрасываем время видео на начало
      videoElement.style.filter = getFilterStyle() // Применяем CSS-фильтры
      void videoElement.play() // Запускаем воспроизведение

      // Устанавливаем таймер для повторного воспроизведения через 2 секунды
      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyFilter()
        }
      }, 2000)
    }

    // Если курсор наведен на превью - применяем фильтр и запускаем видео
    if (isHovering) {
      applyFilter()
    } else {
      // Если курсор не наведен - останавливаем видео и сбрасываем фильтры
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.style.filter = ""
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovering, filter])

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью фильтра */}
      <div
        className="group relative cursor-pointer rounded-xs bg-black"
        style={{ width: `${size}px`, height: `${size}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onClick}
      >
        {/* Видео для демонстрации фильтра */}
        <video
          ref={videoRef}
          src="/t1.mp4" // Тестовое видео для демонстрации фильтра
          className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-xs object-cover"
          muted
          playsInline
          preload="auto"
          data-testid="filter-video"
        />

        {/* Кнопка добавления в избранное */}
        <FavoriteButton
          file={{ id: filter.id, path: "", name: filter.name }}
          size={size}
          type="filter"
        />

        {/* Кнопка добавления фильтра в проект */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={{ id: filter.id, path: "", name: filter.name }}
            onAddMedia={(e) => {
              e.stopPropagation() // Предотвращаем всплытие события клика
              addFilter(filter) // Добавляем фильтр в ресурсы проекта
            }}
            onRemoveMedia={(e) => {
              e.stopPropagation() // Предотвращаем всплытие события клика
              // Находим ресурс с этим фильтром и удаляем его
              const resource = filterResources.find(
                (res: FilterResource) => res.resourceId === filter.id,
              )
              if (resource) {
                removeResource(resource.id) // Удаляем ресурс из проекта
              } else {
                console.warn(
                  `Не удалось найти ресурс фильтра с ID ${filter.id} для удаления`,
                )
              }
            }}
            isAdded={isAdded}
            size={size}
          />
        </div>
      </div>
      {/* Название фильтра */}
      <div className="mt-1 text-xs text-gray-300">
        {t(`filters.presets.${filter.id}`)}{" "}
        {/* Локализованное название фильтра */}
      </div>
    </div>
  )
}
