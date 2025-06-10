import { memo, useCallback, useMemo } from "react"

import { useAppSettings } from "@/features/app-state"
import { VirtualizedContentGroup } from "@/features/browser/components/virtualized-content-group"
import { MediaFile } from "@/features/media/types/media"

import { MediaItem } from "./media-item"

/**
 * Интерфейс свойств компонента MediaGroup
 */
interface MediaGroupProps {
  /** Заголовок группы */
  title: string
  /** Файлы в группе */
  files: MediaFile[]
  /** Режим отображения */
  viewMode: string
  /** Размер превью */
  previewSize: number
  /** Функция для добавления файлов на таймлайн */
  addFilesToTimeline: (files: MediaFile[]) => void
}

/**
 * Компонент для отображения группы медиа-файлов
 *
 * @param {MediaGroupProps} props - Свойства компонента
 * @returns {JSX.Element | null} Компонент группы медиа-файлов или null, если группа пуста
 */
export const MediaGroup = memo<MediaGroupProps>(
  ({ title, files, viewMode, previewSize, addFilesToTimeline }) => {
    const { getMediaFiles } = useAppSettings()

    // Мемоизируем функцию рендеринга медиа-элемента
    const renderMediaItem = useCallback(
      (file: MediaFile, index: number) => (
        <MediaItem
          key={file.id || file.path || file.name}
          file={file}
          index={index}
          viewMode={viewMode}
          previewSize={previewSize}
        />
      ),
      [viewMode, previewSize],
    )

    // Мемоизируем проверку добавленных файлов
    const areAllFilesAdded = useCallback(
      (items: MediaFile[]) => {
        const allFiles = getMediaFiles().allFiles
        return items.every((file) => allFiles.some((item) => item.id === file.id))
      },
      [getMediaFiles],
    )

    // Мемоизируем обработчик добавления всех файлов
    const handleAddAllFiles = useCallback(
      (files: MediaFile[]) => {
        // Фильтруем файлы - изображения не добавляем на таймлайн
        const nonImageFiles = files.filter((file) => !file.isImage)

        // Добавляем видео и аудио файлы на таймлайн
        if (nonImageFiles.length > 0) {
          addFilesToTimeline(nonImageFiles)
        }
      },
      [addFilesToTimeline],
    )

    return (
      <VirtualizedContentGroup
        title={title}
        items={files}
        viewMode={viewMode as "list" | "grid" | "thumbnails"}
        renderItem={renderMediaItem}
        onAddAll={handleAddAllFiles}
        areAllItemsAdded={areAllFilesAdded}
        addButtonText="browser.media.add"
        addedButtonText="browser.media.added"
        previewSize={previewSize}
      />
    )
  },
  (prevProps, nextProps) => {
    // Кастомная функция сравнения
    return (
      prevProps.title === nextProps.title &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.previewSize === nextProps.previewSize &&
      prevProps.files.length === nextProps.files.length &&
      prevProps.files.every((file, index) => file.id === nextProps.files[index]?.id)
    )
  },
)

MediaGroup.displayName = "MediaGroup"
