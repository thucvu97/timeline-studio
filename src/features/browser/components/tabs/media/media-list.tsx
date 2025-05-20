import { memo, useCallback, useEffect, useMemo, useState } from "react"

import { CopyPlus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMedia } from "@/features/browser/media"
import { useUserSettings } from "@/features/user-settings/user-settings-provider"
import i18n from "@/i18n"
import { formatDateByLanguage } from "@/i18n/constants"
import { getFileType, groupFilesByDate } from "@/lib/media-files"
import { cn } from "@/lib/utils"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/media"

import { FileMetadata } from "./file-metadata"
import { MediaToolbar } from "./media-toolbar"
import { NoFiles } from "../../layout/no-files"
import { StatusBar } from "../../layout/status-bar"
import { MediaPreview } from "../../preview"

interface GroupedMediaFiles {
  title: string
  files: MediaFile[]
}

// Обновляем тип для viewMode
type ViewMode = "list" | "grid" | "thumbnails"

// Размеры превью, доступные для выбора
export const PREVIEW_SIZES = [
  60, 80, 100, 125, 150, 200, 250, 300, 400,
] as const
export const DEFAULT_SIZE = 100

// Минимальные размеры для разных типов превью
export const MIN_SIZE = 60
export const MIN_SIZE_TEMPLATES = 100
export const MIN_SIZE_TRANSITIONS = 100
export const MIN_SIZE_SUBTITLES = 80

// Максимальные размеры для разных типов превью
export const MAX_SIZE = 400
export const MAX_SIZE_TEMPLATES = 300
export const MAX_SIZE_TRANSITIONS = 400
export const MAX_SIZE_SUBTITLES = 250

// Объект с минимальными размерами для каждого типа превью
export const MIN_SIZES = {
  MEDIA: MIN_SIZE,
  TRANSITIONS: MIN_SIZE_TRANSITIONS,
  SUBTITLES: MIN_SIZE_SUBTITLES,
  TEMPLATES: MIN_SIZE_TEMPLATES,
} as const

// Объект с максимальными размерами для каждого типа превью
export const MAX_SIZES = {
  MEDIA: MAX_SIZE,
  TRANSITIONS: MAX_SIZE_TRANSITIONS,
  SUBTITLES: MAX_SIZE_SUBTITLES,
  TEMPLATES: MAX_SIZE_TEMPLATES,
} as const

// Ключи для localStorage
export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
  SUBTITLES: "timeline-subtitles-preview-size",
  TEMPLATES: "timeline-templates-preview-size",
} as const

// Функция для загрузки сохраненного размера из localStorage
export const getSavedSize = (key: keyof typeof STORAGE_KEYS): number => {
  if (typeof window === "undefined") return DEFAULT_SIZE

  try {
    const savedValue = localStorage.getItem(STORAGE_KEYS[key])
    if (savedValue) {
      const parsedValue = parseInt(savedValue, 10)
      // Проверяем, что значение входит в допустимый диапазон и находится между минимальным и максимальным для данного типа
      if (
        PREVIEW_SIZES.includes(parsedValue as (typeof PREVIEW_SIZES)[number]) &&
        parsedValue >= MIN_SIZES[key] &&
        parsedValue <= MAX_SIZES[key]
      ) {
        return parsedValue
      }
    }
  } catch (error) {
    console.error(
      `[PreviewSizes] Error reading from localStorage for ${key}:`,
      error,
    )
  }

  // Если нет сохраненного значения или оно некорректно, возвращаем значение по умолчанию,
  // но в пределах минимального и максимального для данного типа
  return Math.min(Math.max(DEFAULT_SIZE, MIN_SIZES[key]), MAX_SIZES[key])
}

// Функция для сохранения размера в localStorage
export const saveSize = (
  key: keyof typeof STORAGE_KEYS,
  size: number,
): void => {
  if (typeof window === "undefined") return

  try {
    // Проверяем, что размер находится в пределах минимального и максимального для данного типа
    const validSize = Math.min(Math.max(size, MIN_SIZES[key]), MAX_SIZES[key])
    localStorage.setItem(STORAGE_KEYS[key], validSize.toString())
  } catch (error) {
    console.error(
      `[PreviewSizes] Error saving to localStorage for ${key}:`,
      error,
    )
  }
}

// Хук для управления размером превью
export const usePreviewSize = (key: keyof typeof STORAGE_KEYS) => {
  const [previewSize, setPreviewSize] = useState(DEFAULT_SIZE)
  const [isSizeLoaded, setIsSizeLoaded] = useState(false)

  // Получаем минимальный и максимальный размеры для данного типа превью
  const minSize = MIN_SIZES[key]
  const maxSize = MAX_SIZES[key]

  // Загружаем размер после монтирования компонента
  useEffect(() => {
    setPreviewSize(getSavedSize(key))
    setIsSizeLoaded(true)
  }, [key])

  // Обертка для setPreviewSize, которая также сохраняет размер в localStorage
  const updatePreviewSize = useCallback(
    (size: number) => {
      // Проверяем, что размер находится в пределах минимального и максимального для данного типа
      const validSize = Math.min(Math.max(size, minSize), maxSize)
      setPreviewSize(validSize)
      saveSize(key, validSize)
    },
    [key, minSize, maxSize],
  )

  // Обработчики для изменения размера превью
  const handleIncreaseSize = useCallback(() => {
    const currentIndex = PREVIEW_SIZES.indexOf(
      previewSize as (typeof PREVIEW_SIZES)[number],
    )
    if (
      currentIndex < PREVIEW_SIZES.length - 1 &&
      PREVIEW_SIZES[currentIndex + 1] <= maxSize
    ) {
      updatePreviewSize(PREVIEW_SIZES[currentIndex + 1])
    }
  }, [previewSize, updatePreviewSize, maxSize])

  const handleDecreaseSize = useCallback(() => {
    const currentIndex = PREVIEW_SIZES.indexOf(
      previewSize as (typeof PREVIEW_SIZES)[number],
    )
    if (currentIndex > 0 && PREVIEW_SIZES[currentIndex - 1] >= minSize) {
      updatePreviewSize(PREVIEW_SIZES[currentIndex - 1])
    }
  }, [previewSize, updatePreviewSize, minSize])

  // Проверка возможности увеличения/уменьшения размера
  const canIncreaseSize =
    PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) <
      PREVIEW_SIZES.length - 1 &&
    PREVIEW_SIZES[
      PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) + 1
    ] <= maxSize
  const canDecreaseSize =
    PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) > 0 &&
    PREVIEW_SIZES[
      PREVIEW_SIZES.indexOf(previewSize as (typeof PREVIEW_SIZES)[number]) - 1
    ] >= minSize

  return {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  }
}

const addFilesToTimeline = (files: any[]) => {
  console.log("Adding files to timeline, files: ", files)
}

const saveSettings = (settings: any) => {
  console.log("Saving settings:", settings)
}

// Оборачиваем в memo для предотвращения ненужных рендеров
export const MediaList = memo(function MediaList({
  viewMode: initialViewMode = "list",
}: {
  viewMode?: ViewMode
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const savedSettings = getSavedSize("MEDIA")

  // Инициализируем состояние с сохраненными настройками
  const [viewMode, setViewMode] = useState<"list" | "grid" | "thumbnails">(
    (savedSettings.viewMode as any) ?? initialViewMode,
  )
  const [sortBy, setSortBy] = useState<string>(savedSettings.sortBy ?? "date")
  const [filterType, setFilterType] = useState<string>(
    savedSettings.filterType ?? "all",
  )
  const [groupBy, setGroupBy] = useState<string>(
    savedSettings.groupBy ?? "none",
  )
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (savedSettings.sortOrder as "asc" | "desc") || "desc",
  )
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false)

  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = usePreviewSize("MEDIA")

  // Сохраняем настройки при их изменении
  useEffect(() => {
    saveSettings({
      viewMode,
      groupBy,
      sortBy,
      sortOrder,
      filterType,
    })
  }, [viewMode, groupBy, sortBy, sortOrder, filterType])

  // Обертка для setPreviewSize, которая также сохраняет размер в localStorage
  const updatePreviewSize = useCallback(
    (sizeOrUpdater: number | ((prevSize: number) => number)) => {
      if (typeof sizeOrUpdater === "function") {
        setPreviewSize((prevSize) => {
          const newSize = sizeOrUpdater(prevSize)
          saveSize(viewMode, newSize)
          return newSize
        })
      } else {
        setPreviewSize(sizeOrUpdater)
        saveSize(viewMode, sizeOrUpdater)
      }
    },
    [viewMode],
  )

  // Обработчики для MediaToolbar
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  // Функция для получения текущего минимального размера на основе режима
  const getMinSizeForCurrentMode = useCallback(() => {
    if (viewMode === "thumbnails") return 100
    return MIN_SIZE
  }, [viewMode])

  const handleSort = useCallback((newSortBy: string) => {
    setSortBy(newSortBy)
  }, [])

  const handleFilter = useCallback((newFilterType: string) => {
    setFilterType(newFilterType)
  }, [])

  const handleGroupBy = useCallback((newGroupBy: string) => {
    setGroupBy(newGroupBy)
  }, [])

  const handleChangeOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }, [])

  const handleToggleFavorites = useCallback(() => {
    console.log("[handleToggleFavorites] Toggling favorites filter")
    setShowFavoritesOnly((prev) => {
      const newValue = !prev
      console.log("[handleToggleFavorites] New value:", newValue)
      return newValue
    })
  }, [])

  // Фильтрация и сортировка
  const filteredAndSortedMedia = useMemo(() => {
    // Сначала фильтрация по типу
    let filtered =
      filterType === "all"
        ? media.allMediaFiles
        : media.allMediaFiles.filter((file: MediaFile) => {
            if (
              filterType === "video" &&
              file.probeData?.streams[0]?.codec_type === "video"
            )
              return true
            if (
              filterType === "audio" &&
              file.probeData?.streams[0]?.codec_type === "audio"
            )
              return true
            if (
              filterType === "image" &&
              /\.(jpg|jpeg|png|gif|webp)$/i.exec(file.name)
            )
              return true
            return false
          })

    // Фильтрация по избранному
    if (showFavoritesOnly) {
      filtered = filtered.filter((file: MediaFile) => {
        // Определяем тип файла для проверки в избранном
        let itemType = "media"

        // Для аудиофайлов используем тип "audio"
        if (
          file.isAudio ||
          (file.probeData?.streams[0]?.codec_type === "audio" &&
            !file.probeData.streams.some(
              (stream) => stream.codec_type === "video",
            ))
        ) {
          itemType = "audio"
        }

        return media.isItemFavorite(file, itemType)
      })
    }

    // Затем фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (file: MediaFile) =>
          file.name.toLowerCase().includes(query) ||
          String(file.probeData?.format.tags?.title ?? "")
            .toLowerCase()
            .includes(query) ||
          String(file.probeData?.format.tags?.artist ?? "")
            .toLowerCase()
            .includes(query) ||
          String(file.probeData?.format.tags?.album ?? "")
            .toLowerCase()
            .includes(query),
      )
    }

    // Затем сортировка
    return [...filtered].sort((a: MediaFile, b: MediaFile) => {
      // Определяем множитель для направления сортировки
      const orderMultiplier = sortOrder === "asc" ? 1 : -1

      if (sortBy === "name") {
        return orderMultiplier * (a.name || "").localeCompare(b.name || "")
      }

      if (sortBy === "size") {
        // Получаем размер из метаданных или из поля size
        const getSizeValue = (file: MediaFile): number => {
          // Приоритетно используем размер из метаданных, если он доступен
          if (file.probeData?.format.size !== undefined) {
            return file.probeData.format.size
          }

          // Иначе используем поле size (с конвертацией, если нужно)
          if (file.size !== undefined) {
            if (typeof file.size === "number") return file.size
            if (typeof file.size === "string") {
              // Если размер представлен строкой с единицами измерения (например, "1.5 GB")
              const sizeStr = file.size as string // явное приведение типа для линтера
              const match = /^([\d.]+)\s*([KMGT]?B)?$/i.exec(sizeStr)
              if (match) {
                const value = parseFloat(match[1])
                const unit = (match[2] || "").toUpperCase()

                if (unit === "KB") return value * 1024
                if (unit === "MB") return value * 1024 * 1024
                if (unit === "GB") return value * 1024 * 1024 * 1024
                if (unit === "TB") return value * 1024 * 1024 * 1024 * 1024
                return value // Просто байты
              }
              return parseFloat(sizeStr) || 0
            }
          }

          return 0
        }

        return orderMultiplier * (getSizeValue(b) - getSizeValue(a))
      }

      if (sortBy === "duration") {
        // Преобразуем duration в секунды, если это строка формата "00:00:00" или другого формата
        const getDurationInSeconds = (duration: any): number => {
          if (!duration) return 0
          if (typeof duration === "number") return duration
          if (typeof duration === "string") {
            // Если формат "01:23:45"
            const parts = duration.split(":").map(Number)
            if (parts.length === 3) {
              return parts[0] * 3600 + parts[1] * 60 + parts[2]
            }
            // Если формат "01:23"
            else if (parts.length === 2) {
              return parts[0] * 60 + parts[1]
            }
            // Если только число
            return parseFloat(duration) || 0
          }
          return 0
        }

        return (
          orderMultiplier *
          (getDurationInSeconds(b.duration) - getDurationInSeconds(a.duration))
        )
      }

      // По умолчанию сортируем по дате
      const timeA = a.startTime ?? 0
      const timeB = b.startTime ?? 0
      return orderMultiplier * (timeB - timeA)
    })
  }, [media, filterType, sortBy, sortOrder, searchQuery, showFavoritesOnly])

  // Группируем файлы
  const groupedFiles = useMemo<GroupedMediaFiles[]>(() => {
    // console.log("[groupedFiles] Group by:", groupBy)
    if (groupBy === "none") {
      return [{ title: "", files: filteredAndSortedMedia }]
    }

    if (groupBy === "type") {
      const groups: Record<string, MediaFile[]> = {
        video: [],
        audio: [],
        image: [],
      }

      filteredAndSortedMedia.forEach((file) => {
        const fileType = getFileType(file)
        if (fileType === "video") {
          groups.video.push(file)
        } else if (fileType === "audio") {
          groups.audio.push(file)
        } else {
          groups.image.push(file)
        }
      })

      return Object.entries(groups)
        .filter(([, files]) => files.length > 0)
        .sort(([a], [b]) => {
          if (sortOrder === "asc") {
            return a.localeCompare(b)
          }
          return b.localeCompare(a)
        })
        .map(([type, files]) => ({
          title: t(`browser.media.${type}`),
          files,
        }))
    }

    if (groupBy === "date") {
      const groups: Record<string, MediaFile[]> = {}
      // Получаем текущий язык из i18n
      const currentLanguage = i18n.language || "ru"
      const noDateText = i18n.t("dates.noDate", { defaultValue: "No date" })

      filteredAndSortedMedia.forEach((file) => {
        // Для изображений используем дату создания файла, если она доступна
        let timestamp = file.startTime
        if (!timestamp && /\.(jpg|jpeg|png|gif|webp)$/i.exec(file.name)) {
          // Пробуем получить дату из метаданных
          timestamp = file.probeData?.format.tags?.creation_time
            ? new Date(file.probeData.format.tags.creation_time).getTime() /
              1000
            : 0
        }

        const date = timestamp
          ? formatDateByLanguage(new Date(timestamp * 1000), currentLanguage, {
              includeYear: true,
              longFormat: true,
            })
          : noDateText

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(file)
      })

      return Object.entries(groups)
        .sort(([a], [b]) => {
          if (a === noDateText) return 1
          if (b === noDateText) return -1
          const dateA = new Date(a)
          const dateB = new Date(b)
          return sortOrder === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime()
        })
        .map(([date, files]) => ({
          title: date,
          files,
        }))
    }

    if (groupBy === "duration") {
      const groups: Record<string, MediaFile[]> = {
        noDuration: [], // файлы без длительности (изображения)
        veryShort: [], // до 1 минуты
        short: [], // 1-5 минут
        medium: [], // 5-30 минут
        long: [], // 30-60 минут
        veryLong: [], // 1-3 часа
        extraLong: [], // 3+ часа
      }

      filteredAndSortedMedia.forEach((file) => {
        // Для изображений используем специальную логику
        if (/\.(jpg|jpeg|png|gif|webp)$/i.exec(file.name)) {
          groups.noDuration.push(file)
          return
        }

        const duration = file.probeData?.format.duration ?? 0
        if (duration < 60) {
          // до 1 минуты
          groups.veryShort.push(file)
        } else if (duration < 300) {
          // 1-5 минут
          groups.short.push(file)
        } else if (duration < 1800) {
          // 5-30 минут
          groups.medium.push(file)
        } else if (duration < 3600) {
          // 30-60 минут
          groups.long.push(file)
        } else if (duration < 10800) {
          // 1-3 часа
          groups.veryLong.push(file)
        } else {
          // 3+ часа
          groups.extraLong.push(file)
        }
      })

      const groupOrder = [
        "noDuration",
        "veryShort",
        "short",
        "medium",
        "long",
        "veryLong",
        "extraLong",
      ]

      return Object.entries(groups)
        .filter(([, files]) => files.length > 0)
        .sort(([a], [b]) => {
          const indexA = groupOrder.indexOf(a)
          const indexB = groupOrder.indexOf(b)
          return sortOrder === "asc" ? indexA - indexB : indexB - indexA
        })
        .map(([type, files]) => ({
          title: t(`browser.toolbar.duration.${type}`),
          files,
        }))
    }

    return [{ title: "", files: filteredAndSortedMedia }]
  }, [filteredAndSortedMedia, groupBy, sortOrder])

  // Мемоизируем другие вычисления
  const sortedDates = useMemo(
    () => groupFilesByDate(media.allMediaFiles),
    [media.allMediaFiles],
  )

  const handleAddAllFiles = useCallback(() => {
    const nonImageFiles = media.allMediaFiles.filter(
      (file: MediaFile) => !file.isImage,
    )
    if (nonImageFiles.length > 0) {
      addFilesToTimeline(nonImageFiles)
    }
  }, [media.allMediaFiles, addFilesToTimeline])

  const addDateFiles = useCallback(
    (files: MediaFile[]) => {
      addFilesToTimeline(files)
    },
    [addFilesToTimeline],
  )

  const handleAddAllVideoFiles = useCallback(() => {
    const videoFiles = media.allMediaFiles.filter((file: MediaFile) =>
      file.probeData?.streams.some(
        (stream: FfprobeStream) => stream.codec_type === "video",
      ),
    )
    if (videoFiles.length > 0) {
      addFilesToTimeline(videoFiles)
    }
  }, [media.allMediaFiles, addFilesToTimeline])

  const handleAddAllAudioFiles = useCallback(() => {
    const audioFiles = media.allMediaFiles.filter(
      (file: MediaFile) =>
        !file.probeData?.streams.some(
          (stream: FfprobeStream) => stream.codec_type === "video",
        ) &&
        file.probeData?.streams.some(
          (stream: FfprobeStream) => stream.codec_type === "audio",
        ),
    )
    if (audioFiles.length > 0) {
      addFilesToTimeline(audioFiles)
    }
  }, [media.allMediaFiles, addFilesToTimeline])

  const handleAddMedia = useCallback(
    (e: React.MouseEvent, file: MediaFile) => {
      e.stopPropagation()
      console.log("[handleAddMedia] Adding media file:", file.name)

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
    },
    [addFilesToTimeline, media],
  )

  // Мемоизируем функцию рендеринга файла
  const renderFile = useCallback(
    (file: MediaFile, index: number) => {
      // Используем комбинацию id и индекса для создания уникального ключа
      const fileId = `${file.id || file.path || file.name}-${index}`
      const isAdded = media.isFileAdded(file)

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
                <MediaPreview
                  file={file}
                  onAddMedia={handleAddMedia}
                  isAdded={isAdded}
                  size={previewSize}
                  ignoreRatio={true}
                />
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
                <MediaPreview
                  file={file}
                  onAddMedia={handleAddMedia}
                  isAdded={isAdded}
                  size={previewSize}
                />
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
                  showFileName={true}
                  ignoreRatio={true}
                />
              </div>
            </div>
          )
      }
    },
    [viewMode, previewSize, media, handleAddMedia],
  )

  // Мемоизируем функцию рендеринга группы
  const renderGroup = useCallback(
    (group: { title: string; files: MediaFile[] }) => {
      // Не показываем группу, если в ней нет файлов
      if (group.files.length === 0) {
        return null
      }

      // Проверяем, все ли файлы в группе уже добавлены
      const allFilesAdded = media.areAllFilesAdded(group.files)

      if (!group.title || group.title === "") {
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
            {group.files.map((file, index) => renderFile(file, index))}
          </div>
        )
      }

      return (
        <div key={group.title} className="mb-4">
          <div className="mb-2 flex items-center justify-between pl-2">
            <h3 className="text-sm font-medium">{group.title}</h3>
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "flex h-7 cursor-pointer items-center gap-1 rounded-sm bg-[#dddbdd] px-2 text-xs hover:bg-[#38dacac3] dark:bg-[#45444b] dark:hover:bg-[#35d1c1] dark:hover:text-black",
                allFilesAdded && "cursor-not-allowed opacity-50",
              )}
              onClick={() => {
                // Фильтруем файлы - изображения не добавляем на таймлайн
                const nonImageFiles = group.files.filter(
                  (file) => !file.isImage,
                )

                // Добавляем видео и аудио файлы на таймлайн
                if (nonImageFiles.length > 0) {
                  addFilesToTimeline(nonImageFiles)
                }
              }}
              disabled={allFilesAdded}
            >
              <span className="px-1 text-xs">
                {allFilesAdded
                  ? t("browser.media.added")
                  : t("browser.media.add")}
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
            {group.files.map((file, index) => renderFile(file, index))}
          </div>
        </div>
      )
    },
    [viewMode, media, addFilesToTimeline, renderFile],
  )

  // Функция рендеринга контента
  const renderContent = useCallback(() => {
    if (filteredAndSortedMedia.length === 0) {
      return (
        <div className="p-4 text-center text-gray-400 dark:text-gray-500">
          {t("browser.media.noMedia")}
        </div>
      )
    }

    return (
      <div className="space-y-4 p-2">
        {groupedFiles.map((group) => renderGroup(group))}
      </div>
    )
  }, [filteredAndSortedMedia, groupedFiles, renderGroup])

  if (media.isLoading) {
    return (
      <div className="flex flex-col overflow-hidden">
        <div className="flex-1 p-3 pb-1">
          <Skeleton className="h-8 w-full rounded" />
        </div>
        <div className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-md p-0 pr-2"
            >
              <div className="h-[100px] w-[170px]">
                <Skeleton className="h-full w-full rounded" />
              </div>
              <div className="h-[90px] flex-1 items-center">
                <Skeleton className="mb-3 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (media.allMediaFiles.length === 0) {
    return <NoFiles />
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ height: "100%" }}
    >
      <MediaToolbar
        viewMode={viewMode as ViewMode}
        onViewModeChange={handleViewModeChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSort={handleSort}
        onFilter={handleFilter}
        onGroupBy={handleGroupBy}
        onChangeOrder={handleChangeOrder}
        sortOrder={sortOrder}
        currentSortBy={sortBy}
        currentFilterType={filterType}
        currentGroupBy={groupBy}
        onIncreaseSize={handleIncreaseSize}
        onDecreaseSize={handleDecreaseSize}
        canIncreaseSize={canIncreaseSize}
        canDecreaseSize={canDecreaseSize}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={handleToggleFavorites}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-0 dark:bg-[#1b1a1f]">
        {renderContent()}
      </div>
      <div className="m-0 flex-shrink-0 py-0.5 transition-all duration-200 ease-in-out">
        <StatusBar
          media={filteredAndSortedMedia}
          onAddAllVideoFiles={handleAddAllVideoFiles}
          onAddAllAudioFiles={handleAddAllAudioFiles}
          onAddDateFiles={addDateFiles}
          onAddAllFiles={handleAddAllFiles}
          sortedDates={sortedDates}
          addedFiles={media.includedFiles}
        />
      </div>
    </div>
  )
})
