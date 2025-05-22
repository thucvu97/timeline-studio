import { useState } from "react"

import { useTranslation } from "react-i18next"

import { useResources } from "@/features/browser/resources"
import { SubtitleResource } from "@/types/resources"

import { SUBTITLE_PREVIEW_TEXT, SubtitleStyle, subtitleStyleToCss } from "./subtitles"
import { AddMediaButton } from "../../layout/add-media-button"
import { FavoriteButton } from "../../layout/favorite-button"

/**
 * Интерфейс пропсов для компонента SubtitlesPreview
 * @interface SubtitlesPreviewProps
 * @property {SubtitleStyle} style - Стиль субтитров для предпросмотра
 * @property {Function} onClick - Функция обработки клика по превью
 * @property {number} size - Размер превью в пикселях
 */
interface SubtitlesPreviewProps {
  style: SubtitleStyle
  onClick: () => void
  size: number
}

/**
 * Компонент для отображения превью стиля субтитров
 * Показывает пример текста с применённым стилем и позволяет добавить стиль в проект
 *
 * @param {SubtitlesPreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью стиля субтитров
 */
export function SubtitlesPreview({ style, onClick, size }: SubtitlesPreviewProps) {
  const { t } = useTranslation() // Хук для интернационализации
  const { addSubtitle, isSubtitleAdded, removeResource, subtitleResources } = useResources() // Получаем методы для работы с ресурсами
  const [isHovering, setIsHovering] = useState(false) // Состояние наведения мыши

  // Преобразуем стиль субтитров в CSS объект
  const subtitleCss = subtitleStyleToCss(style)

  // Вычисляем размер шрифта относительно размера превью
  const scaledFontSize = Math.max(12, Math.round(size / 10))

  // Проверяем, добавлен ли стиль субтитров уже в хранилище ресурсов
  const isAdded = isSubtitleAdded(style)

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью стиля субтитров */}
      <div
        className="group relative cursor-pointer rounded-xs bg-black"
        style={{ width: `${size}px`, height: `${size}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onClick}
      >
        {/* Фон превью - имитация видео */}
        <div className="absolute top-0 left-0 h-full w-full bg-[#131313]" />

        {/* Превью субтитров */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <div
            style={{
              ...subtitleCss,
              fontSize: `${scaledFontSize}px`,
              maxWidth: "90%",
            }}
          >
            {SUBTITLE_PREVIEW_TEXT}
          </div>
        </div>

        {/* Кнопка добавления в избранное */}
        <FavoriteButton file={{ id: style.id, path: "", name: style.name }} size={size} type="subtitle" />

        {/* Кнопка добавления стиля в проект */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={{ id: style.id, path: "", name: style.name }}
            onAddMedia={(e) => {
              e.stopPropagation() // Предотвращаем всплытие события клика
              addSubtitle(style) // Добавляем стиль субтитров в ресурсы проекта
            }}
            onRemoveMedia={(e: React.MouseEvent) => {
              e.stopPropagation() // Предотвращаем всплытие события клика
              // Находим ресурс с этим стилем и удаляем его
              const resource = subtitleResources.find((res: SubtitleResource) => res.resourceId === style.id)
              if (resource) {
                removeResource(resource.id) // Удаляем ресурс из проекта
              } else {
                console.warn(`Не удалось найти ресурс стиля субтитров с ID ${style.id} для удаления`)
              }
            }}
            isAdded={isAdded}
            size={size}
          />
        </div>
      </div>
      {/* Название стиля субтитров */}
      <div className="mt-1 text-xs">{style.name}</div>
    </div>
  )
}
