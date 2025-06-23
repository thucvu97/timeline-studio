import React, { useRef, useState } from "react"

import { CirclePause, CirclePlay } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useFavorites, useMusicFiles } from "@/features/app-state"
import { parseDuration, parseFileSize } from "@/features/browser/utils"
import { MediaFile } from "@/features/media/types/media"
import { useMusicImport } from "@/features/music/hooks/use-music-import"
import { useResources } from "@/features/resources"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"

import { getDateGroup, getDurationGroup } from "../utils/grouping"

import type { ListAdapter, PreviewComponentProps } from "../types/list"

/**
 * Компонент превью для музыкальных файлов
 */
const MusicPreviewWrapper: React.FC<PreviewComponentProps<MediaFile>> = ({
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
  const { t } = useTranslation()
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isMusicAdded } = useResources()

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!audioRef.current) {
      audioRef.current = new Audio(file.path)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      void audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const duration = file.probeData?.format.duration || 0
  const artist = String(file.probeData?.format.tags?.artist || "")
  const title = String(file.probeData?.format.tags?.title || file.name)
  const isAdded = isMusicAdded(file)

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent",
          isAdded && "border-green-500",
        )}
        onClick={() => onClick?.(file)}
        onDragStart={(e) => onDragStart?.(file, e)}
        draggable
      >
        {/* Play/Pause Button */}
        <button
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          onClick={handlePlayPause}
        >
          {isPlaying ? <CirclePause className="w-4 h-4" /> : <CirclePlay className="w-4 h-4" />}
        </button>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{title}</div>
          {artist && <div className="text-xs text-muted-foreground truncate">{artist}</div>}
        </div>

        {/* Duration */}
        <div className="flex-shrink-0 text-xs text-muted-foreground">{duration > 0 ? formatTime(duration) : ""}</div>

        {/* Status indicator */}
        {isAdded && <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" />}
      </div>
    )
  }

  // Thumbnails mode
  return (
    <div
      className={cn(
        "flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors",
        "hover:bg-accent/50",
        isSelected && "bg-accent",
        isAdded && "border-green-500",
      )}
      style={{ width: typeof size === "number" ? size : size.width }}
      onClick={() => onClick?.(file)}
      onDragStart={(e) => onDragStart?.(file, e)}
      draggable
    >
      {/* Play/Pause Button */}
      <button
        className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors mb-2"
        onClick={handlePlayPause}
      >
        {isPlaying ? <CirclePause className="w-6 h-6" /> : <CirclePlay className="w-6 h-6" />}
      </button>

      {/* File Info */}
      <div className="text-center">
        <div className="font-medium text-sm truncate max-w-full">{title}</div>
        {artist && <div className="text-xs text-muted-foreground truncate">{artist}</div>}
        <div className="text-xs text-muted-foreground mt-1">{duration > 0 ? formatTime(duration) : ""}</div>
      </div>

      {/* Status indicator */}
      {isAdded && <div className="w-2 h-2 bg-green-500 rounded-full mt-1" />}
    </div>
  )
}

/**
 * Хук для создания адаптера музыкальных файлов
 */
export function useMusicAdapter(): ListAdapter<MediaFile> {
  const { musicFiles } = useMusicFiles()
  const { isItemFavorite } = useFavorites()
  const { importFile, importDirectory, isImporting } = useMusicImport()

  const allMusicFiles = musicFiles.allFiles || []

  return {
    // Хук для получения данных
    useData: () => ({
      items: allMusicFiles,
      loading: false, // musicFiles не предоставляет loading состояние
      error: null,
    }),

    // Компонент превью
    PreviewComponent: MusicPreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (file, sortBy) => {
      switch (sortBy) {
        case "name":
          return file.name.toLowerCase()

        case "title":
          return String(file.probeData?.format.tags?.title || file.name).toLowerCase()

        case "artist":
          return String(file.probeData?.format.tags?.artist || "").toLowerCase()

        case "size":
          return parseFileSize(file.size)

        case "duration":
          return parseDuration(file.probeData?.format.duration)
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
        String(file.probeData?.format.tags?.genre || ""),
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (file, groupBy) => {
      switch (groupBy) {
        case "artist":
          const artist = String(file.probeData?.format.tags?.artist || "")
          return artist || "Неизвестный исполнитель"

        case "genre":
          const genre = String(file.probeData?.format.tags?.genre || "")
          return genre || "Без жанра"

        case "album":
          const album = String(file.probeData?.format.tags?.album || "")
          return album || "Без альбома"

        case "date":
          return getDateGroup(file.startTime)

        case "duration":
          const duration = parseDuration(file.probeData?.format.duration)
          return getDurationGroup(duration)

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу (расширения)
    matchesFilter: (file, filterType) => {
      if (filterType === "all") return true

      const fileExt = file.name.split(".").pop()?.toLowerCase() || ""
      return fileExt === filterType.toLowerCase()
    },

    // Обработчики импорта
    importHandlers: {
      importFile,
      importFolder: importDirectory,
      isImporting,
    },

    // Проверка избранного
    isFavorite: (file) => isItemFavorite(file, "music"),

    // Тип для системы избранного
    favoriteType: "music",
  }
}
