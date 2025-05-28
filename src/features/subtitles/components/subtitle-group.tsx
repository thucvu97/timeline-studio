import { useTranslation } from "react-i18next"

import { SubtitlePreview } from "./subtitle-preview"
import { SubtitleStyle } from "../types/subtitles"

interface SubtitleGroupProps {
  title: string
  subtitles: SubtitleStyle[]
  previewSize: number
  previewWidth: number
  previewHeight: number
  onSubtitleClick: (subtitle: SubtitleStyle) => void
}

/**
 * Компонент для отображения группы стилей субтитров
 * Показывает заголовок группы и сетку стилей
 */
export function SubtitleGroup({
  title,
  subtitles,
  previewSize,
  previewWidth,
  previewHeight,
  onSubtitleClick,
}: SubtitleGroupProps) {
  const { t } = useTranslation()

  if (subtitles.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Заголовок группы (если есть) */}
      {title && <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>}

      {/* Сетка субтитров */}
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
        style={{ "--preview-size": `${previewWidth}px` } as React.CSSProperties}
      >
        {subtitles.map((subtitle) => (
          <SubtitlePreview
            key={subtitle.id}
            style={subtitle}
            onClick={() => onSubtitleClick(subtitle)}
            size={previewSize}
            previewWidth={previewWidth}
            previewHeight={previewHeight}
          />
        ))}
      </div>
    </div>
  )
}
