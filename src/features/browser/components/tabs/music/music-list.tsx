import type { MouseEvent } from "react"
import { useMemo, useRef, useState } from "react"

import { CirclePause, CirclePlay, Pause, Play } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useMedia } from "@/features/browser/media"
import { useResources } from "@/features/browser/resources"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import { MediaFile } from "@/types/media"
import { MusicResource } from "@/types/resources"

import { MusicToolbar } from "./music-toolbar"
import { sortFiles } from "./music-utils"
import { useMusicMachine } from "./use-music-machine"
import { AddMediaButton } from "../../layout/add-media-button"
import { FavoriteButton } from "../../layout/favorite-button"

export function MusicList() {
  const { t } = useTranslation()
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { addMusic, removeResource, musicResources, isMusicFileAdded } =
    useResources()

  const {
    filteredFiles,
    sortBy,
    sortOrder,
    viewMode,
    showFavoritesOnly,
    groupBy,
  } = useMusicMachine()

  const media = useMedia()
  const groupedFiles = useMemo(() => {
    // Фильтруем файлы по избранному, если включена соответствующая опция
    const favoritesFilteredFiles = showFavoritesOnly
      ? filteredFiles.filter((file) => media.isItemFavorite(file, "audio"))
      : filteredFiles

    if (groupBy === "none") {
      return { "": favoritesFilteredFiles }
    }

    const unknownLabel = t("browser.common.unknown")
    const groups = favoritesFilteredFiles.reduce<Record<string, MediaFile[]>>(
      (acc, file) => {
        const key = file.probeData?.format.tags?.[groupBy] ?? unknownLabel
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(file)
        return acc
      },
      {},
    )

    // Сортируем группы
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
      // Перемещаем "Неизвестно" в конец списка
      if (a === unknownLabel) return 1
      if (b === unknownLabel) return -1

      // Обычная сортировка для остальных элементов
      if (sortOrder === "asc") {
        return a.localeCompare(b)
      }
      return b.localeCompare(a)
    })

    // Сортируем файлы внутри групп
    return Object.fromEntries(
      sortedGroups.map(([group, files]) => [
        group,
        sortFiles(files, sortBy, sortOrder),
      ]),
    )
  }, [filteredFiles, groupBy, sortBy, sortOrder, media, showFavoritesOnly, t])

  const handlePlayPause = (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation()

    if (activeFile?.path === file.path) {
      setIsPlaying(!isPlaying)
      if (audioRef.current) {
        void (isPlaying ? audioRef.current.pause() : audioRef.current.play())
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("ended", handleAudioEnd)
      }
      const audio = new Audio(file.path)
      audio.addEventListener("ended", handleAudioEnd)
      audioRef.current = audio
      void audio.play()
      setActiveFile(file)
      setIsPlaying(true)
    }
  }

  const handleAudioEnd = () => {
    setIsPlaying(false)
  }

  const handleImport = () => {
    console.log("Импорт файлов")
  }

  const handleImportFile = () => {
    console.log("Импорт отдельных файлов")
  }

  const handleImportFolder = () => {
    console.log("Импорт папки")
  }

  const handleAdd = (e: MouseEvent, file: MediaFile) => {
    e.stopPropagation()

    // Проверяем, не добавлен ли файл уже
    if (isMusicFileAdded(file)) {
      console.log(`[handleAdd] Музыкальный файл ${file.name} уже добавлен`)
      return
    }

    console.log("[handleAdd] Adding music file:", file.name)

    // Добавляем музыкальный файл только в ресурсы
    addMusic(file)
  }

  const handleRemove = (e: MouseEvent, file: MediaFile) => {
    e.stopPropagation()
    console.log("[handleRemove] Removing music file:", file.name)

    // Находим ресурс с этим музыкальным файлом
    const musicResource = musicResources.find(
      (resource: MusicResource) => resource.resourceId === file.id,
    )

    if (musicResource) {
      removeResource(musicResource.id)
    } else {
      console.warn(
        `Не удалось найти ресурс музыкального файла с ID ${file.id} для удаления`,
      )
    }
  }

  return (
    <div className="flex h-full flex-col" data-testid="music-list-container">
      <MusicToolbar
        onImport={handleImport}
        onImportFile={handleImportFile}
        onImportFolder={handleImportFolder}
      />
      <div
        className="flex-1 overflow-y-auto p-1 dark:bg-[#1b1a1f]"
        data-testid="music-list-content"
      >
        {/* Состояние загрузки */}
        {filteredFiles.length === 0 && (
          <>
            {/* Состояние загрузки */}
            {useMusicMachine().isLoading && (
              <div
                data-testid="music-list-loading"
                className="flex h-full items-center justify-center"
              >
                <p>{t("browser.loading")}</p>
              </div>
            )}

            {/* Состояние ошибки */}
            {useMusicMachine().isError && (
              <div
                data-testid="music-list-error"
                className="flex h-full flex-col items-center justify-center"
              >
                <p>{t("browser.error_loading")}</p>
                <p>{useMusicMachine().error}</p>
              </div>
            )}

            {/* Пустое состояние */}
            {!useMusicMachine().isLoading && !useMusicMachine().isError && (
              <div
                data-testid="music-list-empty"
                className="flex h-full items-center justify-center"
              >
                <p>{t("browser.no_music_files")}</p>
              </div>
            )}
          </>
        )}

        {/* Список файлов */}
        {Object.entries(groupedFiles).map(([group, files]) => (
          <div
            key={group}
            className=""
            data-testid={
              group ? `music-list-group-${group}` : "music-list-group-default"
            }
          >
            {group && (
              <h2
                className="mb-2 px-4 text-lg font-semibold"
                data-testid="music-list-group-title"
              >
                {group}
              </h2>
            )}
            {viewMode === "list" ? (
              <div
                key={group}
                className="h-full overflow-y-hidden"
                data-testid="music-list-view-list"
              >
                <div className="space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.path}
                      className="group relative flex cursor-pointer items-center gap-1 rounded-sm border border-transparent p-0 hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]"
                    >
                      <div className="relative">
                        <div className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded">
                          <button
                            onClick={(e) => handlePlayPause(e, file)}
                            className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded bg-black/30 opacity-50 transition-opacity duration-200 group-hover:opacity-100 ${
                              activeFile?.path === file.path
                                ? "opacity-100"
                                : ""
                            }`}
                          >
                            {activeFile?.path === file.path && isPlaying ? (
                              <CirclePause className="h-6 w-6 text-white" />
                            ) : (
                              <CirclePlay className="h-6 w-6 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div
                        className="flex h-12 min-w-0 flex-1 flex-col justify-between p-1"
                        onClick={(e) => handlePlayPause(e, file)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="max-w-[300px] truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.probeData?.format.tags?.title ?? file.name}
                          </p>
                          <p className="min-w-12 text-right text-xs text-gray-900 dark:text-gray-100">
                            {file.probeData?.format.duration && (
                              <span className="text-gray-500 dark:text-gray-400">
                                {formatTime(file.probeData.format.duration)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center justify-between truncate pr-7">
                          <div className="w-full truncate text-xs text-gray-500">
                            {file.probeData?.format.tags?.artist && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.artist}
                              </span>
                            )}
                            {file.probeData?.format.tags?.album && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.album}
                              </span>
                            )}
                            {/* {file.probeData?.format.tags?.title && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.title}
                              </span>
                            )} */}
                            {file.probeData?.format.tags?.genre && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.genre}
                              </span>
                            )}
                            {(file.probeData?.format.tags?.date ??
                              file.probeData?.format.tags?.TDOR) && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.date ||
                                  file.probeData.format.tags.TDOR}
                              </span>
                            )}
                          </div>

                          <div className="w-20 truncate text-right text-xs text-gray-500">
                            {/* Пустой блок для сохранения структуры */}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FavoriteButton file={file} size={60} type="audio" />
                        <AddMediaButton
                          file={file}
                          onAddMedia={handleAdd}
                          onRemoveMedia={handleRemove}
                          isAdded={isMusicFileAdded(file)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="flex w-full flex-wrap gap-3 p-2"
                data-testid="music-list-view-thumbnails"
              >
                {files.map((file) => (
                  <div
                    key={file.path}
                    className="group relative cursor-pointer"
                  >
                    <div className="flex h-15 w-[260px] items-center overflow-hidden rounded-lg border border-transparent bg-gray-100 hover:bg-gray-100 dark:bg-[#25242b] dark:group-hover:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]">
                      {/* Левая часть с кнопкой play */}
                      <div className="flex h-full w-12 items-center justify-center">
                        <button
                          onClick={(e) => handlePlayPause(e, file)}
                          className={`flex h-full w-full cursor-pointer items-center justify-center ${
                            activeFile?.path === file.path ? "opacity-100" : ""
                          }`}
                        >
                          {activeFile?.path === file.path && isPlaying ? (
                            <Pause
                              className={cn(
                                "h-5 w-5 text-white opacity-50 group-hover:opacity-100",
                              )}
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Play
                              className="h-5 w-5 text-white opacity-50 group-hover:opacity-100"
                              strokeWidth={1.5}
                            />
                          )}
                        </button>
                      </div>

                      {/* Правая часть с информацией */}
                      <div
                        className="flex flex-1 flex-col justify-between gap-5 px-0 py-0 pr-10"
                        onClick={(e) => handlePlayPause(e, file)}
                      >
                        <div className="absolute top-1 right-1">
                          {/* {activeFile?.path === file.path && mediaRecorder && isPlaying && (
                            <LiveAudioVisualizer
                              mediaRecorder={mediaRecorder}
                              width={30}
                              height={20}
                              barWidth={1}
                              gap={1}
                              barColor="#35d1c1"
                            backgroundColor="transparent"
                          />
                          )} */}
                        </div>
                        <div className="flex w-[170px] items-center justify-between">
                          <p className="max-w-[120px] truncate text-xs font-medium">
                            {file.probeData?.format.tags?.title ?? file.name}
                          </p>
                          <p className="min-w-12 text-right text-xs text-gray-500">
                            {file.probeData?.format.duration && (
                              <span className="text-gray-500 dark:text-gray-400">
                                {formatTime(file.probeData.format.duration)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex w-[170px] items-center justify-between">
                          <span className="max-w-[170px] truncate text-xs text-gray-500">
                            {file.probeData?.format.tags?.artist ?? ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <FavoriteButton file={file} size={120} type="audio" />
                        <AddMediaButton
                          file={file}
                          size={120}
                          onAddMedia={handleAdd}
                          onRemoveMedia={handleRemove}
                          isAdded={isMusicFileAdded(file)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
