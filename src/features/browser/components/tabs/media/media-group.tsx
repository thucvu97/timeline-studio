import React from "react"

import { CopyPlus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useMedia } from "@/features/browser/media"
import { cn } from "@/lib/utils"
import { MediaFile } from "@/types/media"

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
export const MediaGroup: React.FC<MediaGroupProps> = ({
  title,
  files,
  viewMode,
  previewSize,
  addFilesToTimeline,
}) => {
  const { t } = useTranslation()
  const media = useMedia()

  // Не показываем группу, если в ней нет файлов
  if (files.length === 0) {
    return null
  }

  // Проверяем, все ли файлы в группе уже добавлены
  const allFilesAdded = media.areAllFilesAdded(files)

  // Обработчик добавления медиа-файла
  const handleAddMedia = (file: MediaFile) => {
    // Проверяем, не добавлен ли файл уже
    if (media.isFileAdded(file)) {
      console.log(
        `[handleAddMedia] Файл ${file.name} уже добавлен в медиафайлы`,
      )
      return
    }

    // Проверяем, является ли файл изображением
    if (file.isImage) {
      console.log(
        "[handleAddMedia] Добавляем изображение только в медиафайлы:",
        file.name,
      )
      return
    }

    // Добавляем файл на таймлайн
    if (file.path) {
      console.log(
        "[handleAddMedia] Вызываем addFilesToTimeline с файлом:",
        file,
      )
      addFilesToTimeline([file])
    }
  }

  // Если группа не имеет заголовка, отображаем только файлы
  if (!title || title === "") {
    return (
      <div
        key="ungrouped"
        className={
          viewMode === "grid"
            ? "items-left flex flex-wrap gap-3"
            : viewMode === "thumbnails"
              ? "flex flex-wrap justify-between gap-3"
              : "space-y-1"
        }
      >
        {files.map((file, index) => (
          <MediaItem
            key={`${file.id || file.path || file.name}-${index}`}
            file={file}
            index={index}
            viewMode={viewMode}
            previewSize={previewSize}
            onAddMedia={handleAddMedia}
          />
        ))}
      </div>
    )
  }

  // Если группа имеет заголовок, отображаем заголовок и файлы
  return (
    <div key={title} className="mb-4">
      <div className="mb-2 flex items-center justify-between pl-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "flex h-7 cursor-pointer items-center gap-1 rounded-sm bg-[#dddbdd] px-2 text-xs hover:bg-[#38dacac3] dark:bg-[#45444b] dark:hover:bg-[#35d1c1] dark:hover:text-black",
            allFilesAdded && "cursor-not-allowed opacity-50",
          )}
          onClick={() => {
            // Фильтруем файлы - изображения не добавляем на таймлайн
            const nonImageFiles = files.filter((file) => !file.isImage)

            // Добавляем видео и аудио файлы на таймлайн
            if (nonImageFiles.length > 0) {
              addFilesToTimeline(nonImageFiles)
            }
          }}
          disabled={allFilesAdded}
        >
          <span className="px-1 text-xs">
            {allFilesAdded ? t("browser.media.added") : t("browser.media.add")}
          </span>
          <CopyPlus className="mr-1 h-3 w-3" />
        </Button>
      </div>
      <div
        className={
          viewMode === "grid" || viewMode === "thumbnails"
            ? "items-left flex flex-wrap gap-3"
            : "space-y-1"
        }
      >
        {files.map((file, index) => (
          <MediaItem
            key={`${file.id || file.path || file.name}-${index}`}
            file={file}
            index={index}
            viewMode={viewMode}
            previewSize={previewSize}
            onAddMedia={handleAddMedia}
          />
        ))}
      </div>
    </div>
  )
}
