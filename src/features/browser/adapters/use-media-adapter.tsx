import React from "react"

import { useAppSettings, useFavorites } from "@/features/app-state"
import { MediaPreview } from "@/features/browser/components/preview/media-preview"
import { parseDuration, parseFileSize } from "@/features/browser/utils"
import { useDraggable } from "@/features/drag-drop"
import { getFileType } from "@/features/media"
import { useMediaImport } from "@/features/media/hooks/use-media-import"
import { MediaFile } from "@/features/media/types/media"
import i18n from "@/i18n"

import { getDateGroup, getDurationGroup } from "../utils/grouping"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для медиафайлов - адаптер для MediaPreview
 */
const MediaPreviewWrapper: React.FC<PreviewComponentProps<MediaFile>> = ({
  item: file,
  size,
  viewMode,
  onClick,
  onDragStart,
  isSelected,
  isFavorite,
  onToggleFavorite,
  onAddToTimeline,
}) => {
  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "media",
    () => file,
    () => ({
      url: file.thumbnail || file.path,
      width: 120,
      height: 80,
    }),
  )

  return (
    <div onClick={() => onClick?.(file)} {...dragProps} className="cursor-pointer">
      <MediaPreview
        file={file}
        size={typeof size === "number" ? size : size.width}
        showFileName={viewMode === "list"}
      />
    </div>
  )
}

/**
 * Хук для создания адаптера медиафайлов с использованием React хуков
 */
export function useMediaAdapter(): ListAdapter<MediaFile> {
  const { isLoading, getError, state } = useAppSettings()
  const { isItemFavorite } = useFavorites()
  const { importFile, importFolder, isImporting } = useMediaImport()

  const allMediaFiles = state.context.mediaFiles.allFiles || []
  const error = getError()

  return {
    // Хук для получения данных
    useData: () => ({
      items: allMediaFiles,
      loading: isLoading,
      error,
    }),

    // Компонент превью
    PreviewComponent: MediaPreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (file, sortBy) => {
      switch (sortBy) {
        case "name":
          return file.name.toLowerCase()

        case "size":
          // Приоритетно используем размер из метаданных
          if (file.probeData?.format.size !== undefined) {
            return file.probeData.format.size
          }
          // Иначе парсим размер
          return parseFileSize(file.size)

        case "duration":
          return parseDuration(file.duration)
        default:
          return file.startTime || 0
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (file) => {
      const texts = [
        file.name,
        String(file.probeData?.format.tags?.title || ""),
        String(file.probeData?.format.tags?.artist || ""),
        String(file.probeData?.format.tags?.album || ""),
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (file, groupBy) => {
      const currentLanguage = i18n.language || "ru"

      switch (groupBy) {
        case "type":
          const fileType = getFileType(file)
          return i18n.t(`browser.media.${fileType}`)

        case "date":
          // Для изображений используем дату создания файла, если она доступна
          let timestamp = file.startTime
          if (!timestamp && /\.(jpg|jpeg|png|gif|webp)$/i.exec(file.name)) {
            // Пробуем получить дату из метаданных
            timestamp = file.probeData?.format.tags?.creation_time
              ? new Date(file.probeData.format.tags.creation_time).getTime() / 1000
              : 0
          }
          return getDateGroup(timestamp, currentLanguage)

        case "duration":
          const duration = parseDuration(file.duration)
          return getDurationGroup(duration)

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу
    matchesFilter: (file, filterType) => {
      if (filterType === "all") return true

      // Проверяем, загружены ли метаданные
      if (file.isLoadingMetadata === true) {
        // Если метаданные еще загружаются, используем базовые свойства файла
        if (filterType === "video" && file.isVideo) return true
        if (filterType === "audio" && file.isAudio) return true
        if (filterType === "image" && file.isImage) return true
        return false
      }

      // Если метаданные загружены, используем их для более точной фильтрации
      if (filterType === "video") {
        return file.isVideo || file.probeData?.streams.some((s) => s.codec_type === "video") || false
      }

      if (filterType === "audio") {
        return file.isAudio || file.probeData?.streams.some((s) => s.codec_type === "audio") || false
      }

      if (filterType === "image") {
        return file.isImage || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      }

      return false
    },

    // Обработчики импорта
    importHandlers: {
      importFile,
      importFolder,
      isImporting,
    },

    // Проверка избранного
    isFavorite: (file) => isItemFavorite(file, "media"),

    // Тип для системы избранного
    favoriteType: "media",
  }
}
