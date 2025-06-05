import { memo, useMemo } from "react"

import { useFavorites } from "@/features/app-state"
import { MediaPreview } from "@/features/browser"
import { MediaFile } from "@/features/media"
import { cn } from "@/lib/utils"

import { FileMetadata } from "./file-metadata"

/**
 * Интерфейс свойств компонента MediaItem
 */
interface MediaItemProps {
  /** Медиа-файл для отображения */
  file: MediaFile
  /** Индекс файла в списке */
  index: number
  /** Режим отображения (list, grid, thumbnails) */
  viewMode: string
  /** Размер превью */
  previewSize: number
}

/**
 * Компонент для отображения отдельного медиа-файла в различных режимах просмотра
 *
 * @param {MediaItemProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент медиа-элемента
 */
export const MediaItem = memo<MediaItemProps>(
  ({ file, index, viewMode, previewSize }) => {
    const { favorites } = useFavorites() // Хук для работы с избранным

    // Стабильный ключ файла
    const fileId = useMemo(() => file.id || file.path || file.name, [file.id, file.path, file.name])

    // Мемоизируем проверку избранного
    const isAdded = useMemo(() => favorites.media.some((item) => item.id === file.id), [favorites.media, file.id])

    // Мемоизируем стили для grid режима
    const gridStyles = useMemo(
      () => ({
        width: `${((previewSize * 16) / 9).toFixed(0)}px`,
      }),
      [previewSize],
    )

    // Мемоизируем размер шрифта
    const fontSize = useMemo(() => (previewSize > 150 ? "13px" : "12px"), [previewSize])

    // Мемоизируем базовые классы
    const baseClasses = useMemo(() => (isAdded ? "pointer-events-none" : ""), [isAdded])

    if (viewMode === "list") {
      return (
        <div
          className={cn(
            "group flex h-full items-center border border-transparent p-0",
            "bg-white hover:border-[#38daca71] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            baseClasses,
          )}
        >
          <div className="relative mr-3 flex h-full flex-shrink-0 gap-1">
            <MediaPreview file={file} size={previewSize} ignoreRatio />
          </div>
          <FileMetadata file={file} size={previewSize} />
        </div>
      )
    }

    if (viewMode === "grid") {
      return (
        <div
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-xs",
            "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            baseClasses,
          )}
          style={gridStyles}
        >
          <div className="group relative w-full flex-1 flex-grow flex-row">
            <MediaPreview file={file} size={previewSize} />
          </div>
          <div className="truncate p-1 text-xs" style={{ fontSize }}>
            {file.name}
          </div>
        </div>
      )
    }

    if (viewMode === "thumbnails") {
      return (
        <div
          key={fileId}
          className={cn(
            "flex h-full items-center p-0",
            "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            isAdded && "pointer-events-none",
          )}
        >
          <div className="group relative w-full flex-1 flex-grow flex-row">
            <MediaPreview file={file} size={previewSize} showFileName ignoreRatio />
          </div>
        </div>
      )
    }

    return null
  },
  (prevProps, nextProps) => {
    // Кастомная функция сравнения для более точного контроля
    return (
      prevProps.file.id === nextProps.file.id &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.previewSize === nextProps.previewSize &&
      prevProps.index === nextProps.index
    )
  },
)

MediaItem.displayName = "MediaItem"
