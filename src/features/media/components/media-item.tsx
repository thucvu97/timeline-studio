import React, { useCallback, useMemo } from "react"

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
  viewMode: "list" | "grid" | "thumbnails"
  /** Размер превью */
  previewSize: number
  /** Обработчик добавления медиа */
  onAddMedia: (file: MediaFile) => void
}

/**
 * Компонент для отображения отдельного медиа-файла в различных режимах просмотра
 *
 * @param {MediaItemProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент медиа-элемента
 */
export const MediaItem: React.FC<MediaItemProps> = ({ file, index, viewMode, previewSize, onAddMedia }) => {
  const { favorites } = useFavorites() // Хук для работы с избранным
  // Мемоизируем уникальный ключ для предотвращения перерендеров
  const fileId = useMemo(() => `${file.id || file.path || file.name}-${index}`, [file.id, file.path, file.name, index])

  const isAdded = favorites.media.some((item) => item.id === file.id) // Проверяем, добавлен ли файл в избранное

  // Мемоизируем обработчик добавления медиа
  const handleAddMedia = useCallback(() => {
    onAddMedia(file)
  }, [onAddMedia, file])

  // Рендерим компонент в зависимости от режима отображения
  switch (viewMode) {
    case "list":
      return (
        <div
          key={fileId}
          className={cn(
            "group flex h-full items-center border border-transparent p-0",
            "bg-white hover:border-[#38daca71] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            isAdded && "pointer-events-none",
          )}
        >
          <div className="relative mr-3 flex h-full flex-shrink-0 gap-1">
            <MediaPreview file={file} onAddMedia={handleAddMedia} isAdded={isAdded} size={previewSize} ignoreRatio />
          </div>
          <FileMetadata file={file} size={previewSize} />
        </div>
      )

    case "grid":
      return (
        <div
          key={fileId}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-xs",
            "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            isAdded && "pointer-events-none",
          )}
          style={{
            width: `${((previewSize * 16) / 9).toFixed(0)}px`,
          }}
        >
          <div className="group relative w-full flex-1 flex-grow flex-row">
            <MediaPreview file={file} onAddMedia={handleAddMedia} isAdded={isAdded} size={previewSize} />
          </div>
          <div
            className="truncate p-1 text-xs"
            style={{
              fontSize: previewSize > 100 ? "13px" : "12px",
            }}
          >
            {file.name}
          </div>
        </div>
      )

    case "thumbnails":
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
            <MediaPreview
              file={file}
              onAddMedia={handleAddMedia}
              isAdded={isAdded}
              size={previewSize}
              showFileName
              ignoreRatio
            />
          </div>
        </div>
      )

    default:
      return null
  }
}
