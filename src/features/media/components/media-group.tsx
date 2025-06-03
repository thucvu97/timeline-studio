import React from "react"

import { ContentGroup } from "@/components/common/content-group"
import { MediaFile } from "@/features/media/types/media"

import { MediaItem } from "./media-item"
import { useMedia } from "../hooks"

/**
 * Интерфейс свойств компонента MediaGroup
 */
interface MediaGroupProps {
  /** Заголовок группы */
  title: string
  /** Файлы в группе */
  files: MediaFile[]
  /** Режим отображения */
  viewMode: "list" | "grid" | "thumbnails"
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
export const MediaGroup: React.FC<MediaGroupProps> = ({ title, files, viewMode, previewSize, addFilesToTimeline }) => {
  const media = useMedia()

  // Обработчик добавления медиа-файла
  const handleAddMedia = (file: MediaFile) => {
    // Проверяем, не добавлен ли файл уже
    if (media.isFileAdded(file)) {
      console.log(`[handleAddMedia] Файл ${file.name} уже добавлен в медиафайлы`)
      return
    }

    // Проверяем, является ли файл изображением
    if (file.isImage) {
      console.log("[handleAddMedia] Добавляем изображение только в медиафайлы:", file.name)
      return
    }

    // Добавляем файл на таймлайн
    if (file.path) {
      console.log("[handleAddMedia] Вызываем addFilesToTimeline с файлом:", file)
      addFilesToTimeline([file])
    }
  }

  // Функция рендеринга медиа-элемента
  const renderMediaItem = (file: MediaFile, index: number) => (
    <MediaItem
      key={`${file.id || file.path || file.name}-${index}`}
      file={file}
      index={index}
      viewMode={viewMode}
      previewSize={previewSize}
      onAddMedia={handleAddMedia}
    />
  )

  // Обработчик добавления всех файлов
  const handleAddAllFiles = (files: MediaFile[]) => {
    // Фильтруем файлы - изображения не добавляем на таймлайн
    const nonImageFiles = files.filter((file) => !file.isImage)

    // Добавляем видео и аудио файлы на таймлайн
    if (nonImageFiles.length > 0) {
      addFilesToTimeline(nonImageFiles)
    }
  }

  return (
    <ContentGroup
      title={title}
      items={files}
      viewMode={viewMode}
      renderItem={renderMediaItem}
      onAddAll={handleAddAllFiles}
      areAllItemsAdded={media.areAllFilesAdded}
      addButtonText="browser.media.add"
      addedButtonText="browser.media.added"
    />
  )
}
