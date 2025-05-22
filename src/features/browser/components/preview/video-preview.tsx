import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Film } from "lucide-react"

import { formatDuration } from "@/lib/date"
import { getFileUrl } from "@/lib/file-utils"
import { cn, formatResolution } from "@/lib/utils"
import { calculateAdaptiveWidth, calculateWidth, parseRotation } from "@/lib/video"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/media"

import { AddMediaButton } from "../layout/add-media-button"
import { FavoriteButton } from "../layout/favorite-button"

interface VideoPreviewProps {
  file: MediaFile
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
  size?: number
  showFileName?: boolean
  dimensions?: [number, number]
  ignoreRatio?: boolean
}

/**
 * Предварительный просмотр видеофайла
 *
 * Функционал:
 * - Отображает превью видеофайла с поддержкой ленивой загрузки
 * - Адаптивный размер контейнера с соотношением сторон 16:9
 * - Поддерживает два размера UI (стандартный и большой при size > 100)
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект файла с путем и метаданными
 * @param onAddMedia - Callback для добавления файла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла (по умолчанию false)
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 * @param ignoreRatio - Флаг для игнорирования соотношения сторон (по умолчанию false)
 */
export const VideoPreview = memo(function VideoPreview({
  file,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
  ignoreRatio = false,
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  // Используем useRef для хранения времени последнего обновления
  const lastUpdateTimeRef = useRef(0)

  // Создаем стабильные ключи для рефов
  useEffect(() => {
    const videoStreams = file.probeData?.streams.filter((s) => s.codec_type === "video") ?? []
    // biome-ignore lint/complexity/noForEach: <explanation>
    videoStreams.forEach((stream) => {
      const key = stream.streamKey ?? `stream-${stream.index}`
      videoRefs.current[key] ??= null
    })
  }, [file.probeData?.streams])

  // Используем useRef для хранения hoverTime вместо useState
  // чтобы избежать ререндеров при движении мыши
  const hoverTimeRef = useRef<number | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, stream: FfprobeStream) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * (file.duration ?? 0)

      // Обновляем ref и состояние при каждом движении мыши
      hoverTimeRef.current = newTime
      // Обновляем состояние без задержки
      setHoverTime(newTime)

      const key = stream.streamKey ?? `stream-${stream.index}`
      const videoRef = videoRefs.current[key]
      if (videoRef) {
        // Устанавливаем время напрямую без лишних логов
        videoRef.currentTime = newTime
      }
    },
    [file.duration], // Удалили hoverTime из зависимостей, так как он не используется для условной проверки
  )

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
    // При уходе мыши останавливаем воспроизведение всех видео, кроме видео в шаблоне
    if (isPlaying) {
      // stopAllVideos(true)
      setIsPlaying(false)
    }
  }, [isPlaying])

  // Функция handlePlayPause, которая управляет воспроизведением только в превью
  const handlePlayPause = useCallback(
    (e: React.MouseEvent, stream: FfprobeStream) => {
      e.preventDefault()
      const key = stream.streamKey ?? `stream-${stream.index}`
      const videoRef = videoRefs.current[key]
      if (!videoRef) return

      // Определяем новое состояние воспроизведения (противоположное текущему)
      const newPlayingState = !isPlaying

      // Воспроизводим только в превью
      if (newPlayingState) {
        // Запускаем воспроизведение в превью
        if (hoverTime !== null) {
          videoRef.currentTime = hoverTime
        }
        videoRef.play().catch((err: unknown) => console.error("[VideoPreview] Ошибка воспроизведения в превью:", err))
      } else {
        // Останавливаем воспроизведение в превью
        videoRef.pause()
      }

      // Обновляем локальное состояние воспроизведения
      setIsPlaying(newPlayingState)

      console.log(`[VideoPreview] Видео ${newPlayingState ? "запущено" : "остановлено"} в превью:`, file.name)
    },
    [isPlaying, hoverTime, file],
  )

  // Функция для получения URL видео
  const getVideoUrl = useCallback(() => {
    const url = getFileUrl(file.path)
    console.log("[VideoPreview] Сконвертированный URL:", url)
    return url
  }, [file.path])

  // Оптимизируем вычисления с помощью useMemo
  const videoData = useMemo(() => {
    const videoStreams = file.probeData?.streams.filter((s) => s.codec_type === "video") ?? []
    const isMultipleStreams = videoStreams.length > 1

    return { videoStreams, isMultipleStreams }
  }, [file.probeData?.streams])

  return (
    <div className={cn("flex h-full w-full items-center justify-center")}>
      {videoData.videoStreams.map((stream: FfprobeStream) => {
        const key = stream.streamKey ?? `stream-${stream.index}`
        const isMultipleStreams = videoData.isMultipleStreams
        const width = calculateWidth(stream.width ?? 0, stream.height ?? 0, size, parseRotation(stream.rotation))

        const adptivedWidth = calculateAdaptiveWidth(width, isMultipleStreams, stream.display_aspect_ratio)

        // Исправляем проблему с деструктуризацией
        const aspectRatio = stream.display_aspect_ratio?.split(":").map(Number) ?? [16, 9]
        const ratio = aspectRatio[0] / aspectRatio[1]

        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            key={key}
            className="relative flex-shrink-0"
            style={{
              height: `${size}px`,
              width:
                ratio > 1
                  ? ignoreRatio
                    ? width
                    : adptivedWidth
                  : isMultipleStreams && ignoreRatio
                    ? width
                    : adptivedWidth,
            }}
            onClick={(e) => handlePlayPause(e, stream)}
          >
            <div
              className="group relative h-full w-full"
              onMouseMove={(e) => handleMouseMove(e, stream)}
              onMouseLeave={handleMouseLeave}
            >
              <video
                ref={(el) => {
                  videoRefs.current[key] = el
                }}
                src={getVideoUrl()}
                preload="auto"
                tabIndex={0}
                playsInline
                muted={false} // Включаем звук в превью по запросу пользователя
                className={cn("absolute inset-0 h-full w-full focus:outline-none", isAdded ? "opacity-50" : "")}
                style={{
                  transition: "opacity 0.2s ease-in-out",
                }}
                onEnded={() => {
                  console.log("Video ended for stream:", stream.index)
                  setIsPlaying(false)
                }}
                onPlay={(e) => {
                  console.log("Video playing for stream:", stream.index)
                  const video = e.currentTarget
                  const currentTime = hoverTime
                  if (currentTime !== null) {
                    video.currentTime = currentTime
                  }
                }}
                onTimeUpdate={(e) => {
                  // Обновляем только каждые 500 мс вместо случайного выбора
                  const now = Date.now()
                  if (now - lastUpdateTimeRef.current > 500) {
                    lastUpdateTimeRef.current = now
                    console.log(
                      "Time update for stream:",
                      stream.index,
                      "current time:",
                      e.currentTarget.currentTime.toFixed(2),
                    )
                  }
                }}
                onError={(e) => {
                  console.log("Video error for stream:", stream.index, e)
                }}
                onKeyDown={(e) => {
                  if (e.code === "Space") {
                    e.preventDefault()
                    handlePlayPause(e as unknown as React.MouseEvent, stream)
                  }
                }}
                onLoadedData={() => {
                  console.log("Video loaded for stream:", stream.index)
                  setIsLoaded(true)
                }}
              />

              {/* Продолжительность видео */}
              {!(isMultipleStreams && stream.index === 0) && (
                <div
                  className={cn(
                    "pointer-events-none absolute rounded-xs bg-black/50 text-xs leading-[16px] text-white",
                    size > 100 ? "top-1 right-1 px-[4px] py-[2px]" : "top-0.5 right-0.5 px-0.5 py-0",
                  )}
                  style={{
                    fontSize: size > 100 ? "13px" : "11px",
                  }}
                >
                  {formatDuration(file.duration ?? 0, 0, true)}
                </div>
              )}

              {/* Иконка видео */}
              {!(isMultipleStreams && stream.index !== 0) && (
                <div
                  className={cn(
                    "pointer-events-none absolute rounded-xs bg-black/50 p-0.5 text-white",
                    size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5",
                  )}
                >
                  <Film size={size > 100 ? 16 : 12} />
                </div>
              )}

              {/* Кнопка избранного */}
              {!(isMultipleStreams && stream.index !== 0) && <FavoriteButton file={file} size={size} type="media" />}

              {/* Разрешение видео */}
              {isLoaded && !(isMultipleStreams && stream.index !== 0) && (
                <div
                  className={`pointer-events-none absolute ${
                    size > 100 ? "left-[28px]" : "left-[22px]"
                  } rounded-xs bg-black/50 text-xs leading-[16px] ${size > 100 ? "bottom-1" : "bottom-0.5"} ${
                    size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                  } text-white`}
                  style={{
                    fontSize: size > 100 ? "13px" : "11px",
                  }}
                >
                  {formatResolution(stream.width ?? 0, stream.height ?? 0)}
                </div>
              )}

              {/* Имя файла */}
              {showFileName && !(isMultipleStreams && stream.index !== 0) && (
                <div
                  className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${
                    size > 100 ? "left-1" : "left-0.5"
                  } ${
                    size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                  } line-clamp-1 rounded-xs bg-black/50 text-xs leading-[16px] text-white ${isMultipleStreams ? "max-w-[100%]" : "max-w-[60%]"}`}
                  style={{
                    fontSize: size > 100 ? "13px" : "11px",
                  }}
                >
                  {file.name}
                </div>
              )}

              {/* Кнопка добавления */}
              {onAddMedia &&
                isLoaded &&
                stream.index === (file.probeData?.streams.filter((s) => s.codec_type === "video").length ?? 0) - 1 && (
                  <AddMediaButton file={file} onAddMedia={onAddMedia} isAdded={isAdded} size={size} />
                )}
            </div>
          </div>
        )
      })}
    </div>
  )
})
