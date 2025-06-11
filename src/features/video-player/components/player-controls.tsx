import { useCallback, useMemo, useRef, useState } from "react"

import {
  Camera,
  ChevronFirst,
  ChevronLast,
  CircleDot,
  ImagePlay,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  StepBack,
  StepForward,
  TvMinimalPlay,
  UnfoldHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { MediaFile } from "@/features/media/types/media"
import { getFrameTime } from "@/features/media/utils/video"
import { cn } from "@/lib/utils"

import { PrerenderControls } from "./prerender-controls"
import { VolumeSlider } from "./volume-slider"
import { useFullscreen } from "../hooks/use-fullscreen"
import { usePlayer } from "../services/player-provider"

interface PlayerControlsProps {
  /**
   * Текущее время воспроизведения в секундах
   */
  currentTime: number

  /**
   * Медиафайл для воспроизведения (опционально)
   */
  file: MediaFile
}

export function PlayerControls({ currentTime, file }: PlayerControlsProps) {
  const { t } = useTranslation()
  const {
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    volume,
    setVolume,
    isRecording,
    setIsRecording,
    setIsSeeking,
    isChangingCamera,
    isResizableMode,
    setIsResizableMode,
  } = usePlayer()

  // Используем состояние для хранения текущего времени воспроизведения
  const [localDisplayTime, setLocalDisplayTime] = useState(0)
  const [parallelVideos, setParallelVideos] = useState<MediaFile[]>([])
  const [activeCameraIndex, setActiveCameraIndex] = useState(0)
  const [source, setSource] = useState<"timeline" | "browser">("timeline")

  // Используем хук для отслеживания полноэкранного режима
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  // Создаем ref для хранения текущего значения громкости
  const volumeRef = useRef<number>(volume)

  // Функция для переключения полноэкранного режима
  const handleFullscreen = useCallback(() => {
    // Находим контейнер медиаплеера
    const playerContainer = document.querySelector(".media-player-container")

    if (!playerContainer) {
      console.error("[handleFullscreen] Не найден контейнер медиаплеера")
      return
    }
    toggleFullscreen(playerContainer as HTMLElement)

    console.log(`[handleFullscreen] ${isFullscreen ? "Выход из" : "Вход в"} полноэкранный режим`)
  }, [isFullscreen])

  // Нормализуем currentTime для отображения, если это Unix timestamp
  const calculatedDisplayTime = useMemo(() => {
    if (currentTime > 365 * 24 * 60 * 60) {
      // Если время больше года в секундах, это, вероятно, Unix timestamp
      // Используем локальное время для отображения
      return localDisplayTime
    }
    return currentTime
  }, [currentTime, localDisplayTime])

  // Получаем frameTime с помощью функции getFrameTime
  const frameTime = getFrameTime(file)

  // Определяем isFirstFrame и isLastFrame на основе мемоизированных значений
  const isFirstFrame = useMemo(() => {
    return Math.abs(currentTime - (file.startTime ?? 0)) < frameTime
  }, [currentTime, file.startTime, frameTime])

  const isLastFrame = useMemo(() => {
    return Math.abs(currentTime - (file.endTime ?? 0)) < frameTime
  }, [currentTime, file.endTime, frameTime])

  const handleTimeChange = useCallback(
    (value: number[]) => {
      const newTime = value[0]
      setLocalDisplayTime(newTime)
      setCurrentTime(newTime)
      setIsSeeking(true)
    },
    [setLocalDisplayTime, setCurrentTime, setIsSeeking],
  )

  const handleRecordToggle = useCallback(() => {
    setIsRecording(!isRecording)
  }, [isRecording, setIsRecording])

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(currentTime + frameTime, file.endTime ?? file.duration ?? 0)
    setLocalDisplayTime(newTime)
    setCurrentTime(newTime)
    setIsSeeking(true)
  }, [currentTime, frameTime, file.endTime, file.duration, setLocalDisplayTime, setCurrentTime, setIsSeeking])

  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(currentTime - frameTime, file.startTime ?? 0)
    setLocalDisplayTime(newTime)
    setCurrentTime(newTime)
    setIsSeeking(true)
  }, [currentTime, frameTime, file.startTime, setLocalDisplayTime, setCurrentTime, setIsSeeking])

  const handleChevronFirst = useCallback(() => {
    const newTime = file.startTime ?? 0
    setLocalDisplayTime(newTime)
    setCurrentTime(newTime)
    setIsSeeking(true)
  }, [file.startTime, setLocalDisplayTime, setCurrentTime, setIsSeeking])

  const handleChevronLast = useCallback(() => {
    const newTime = file.endTime ?? 0
    setLocalDisplayTime(newTime)
    setCurrentTime(newTime)
    setIsSeeking(true)
  }, [file.endTime, setLocalDisplayTime, setCurrentTime, setIsSeeking])

  // Функция для переключения звука (вкл/выкл)
  const handleToggleMute = useCallback(() => {
    // Если звук выключен, устанавливаем последнее сохраненное значение или 100%
    if (volume === 0) {
      const newVolume = volumeRef.current > 0 ? volumeRef.current : 100
      setVolume(newVolume)
      console.log("[handleToggleMute] Unmute, volume:", newVolume)
    } else {
      // Сохраняем текущее значение громкости перед выключением
      volumeRef.current = volume
      setVolume(0)
      console.log("[handleToggleMute] Mute, saved volume:", volumeRef.current)
    }
  }, [volume, setVolume])

  // Функция для изменения громкости
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0] // Значение уже в диапазоне 0-100
      setVolume(newVolume)
    },
    [setVolume],
  )

  // Функция, вызываемая при завершении изменения громкости
  const handleVolumeChangeEnd = useCallback(() => {
    console.log("[handleVolumeChangeEnd] Volume change completed:", volume)
  }, [volume])

  // Функция для переключения источника видео
  const handleToggleSource = useCallback(() => {
    setSource((prevSource) => (prevSource === "timeline" ? "browser" : "timeline"))
  }, [])

  return (
    <div className="flex w-full flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-2 pl-4 py-1">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <div className="relative h-1 w-full rounded-full border border-teal dark:border-teal bg-white dark:bg-black">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-teal dark:bg-white transition-all duration-200 ease-out"
                style={{
                  width: `${(Math.max(0, calculatedDisplayTime) / (file.duration ?? 100)) * 100}%`,
                }}
              />
              <div
                className="absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full border border-teal dark:border-teal bg-teal transition-all duration-200 ease-out"
                style={{
                  left: `calc(${(Math.max(0, calculatedDisplayTime) / (file.duration ?? 100)) * 100}% - 7px)`,
                }}
              />
              <Slider
                value={[Math.max(0, calculatedDisplayTime)]}
                min={0}
                max={file.duration ?? 100}
                step={0.001}
                onValueChange={handleTimeChange}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                disabled={isChangingCamera} // Отключаем слайдер во время переключения камеры
              />
            </div>
          </div>
          <span className="rounded-xs bg-white font-light px-1.5 py-0.5 text-[11px] text-black transition-opacity duration-200 ease-out dark:bg-black dark:text-white ml-1">
            {file.startTime ?? "00:00:00:00"}
          </span>
          <span className="mb-[3px]">/</span>
          <span className="rounded-xs bg-white font-light px-1.5 py-0.5 text-[11px] text-black transition-opacity duration-200 ease-out dark:bg-background dark:text-white">
            {file.duration ?? "00:00:00:00"}
          </span>

          {/* Скрытый элемент для обновления компонента при воспроизведении */}
          {currentTime > 365 * 24 * 60 * 60 && (
            <span className="hidden">
              {localDisplayTime.toFixed(3)} - {calculatedDisplayTime.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="h-full w-full p-1">
        <div className="flex items-center justify-between px-1 py-0">
          {/* Левая часть: индикатор источника, кнопки для камер и шаблонов */}
          <div className="flex items-center gap-2">
            {/* Индикатор источника видео - всегда отображается и работает как переключатель */}
            <Button
              className={`h-8 w-8 cursor-pointer ${source === "browser" ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                source === "timeline"
                  ? t("timeline.source.timeline", "Таймлайн")
                  : t("timeline.source.browser", "Браузер")
              }
              onClick={handleToggleSource}
            >
              {/* Используем isHydrated для условного рендеринга иконки */}
              {source === "timeline" ? <TvMinimalPlay className="h-8 w-8" /> : <ImagePlay className="h-8 w-8" />}
            </Button>

            {/* Кнопка переключения режима resizable - показываем только если применен шаблон */}
            <Button
              className={`h-8 w-8 cursor-pointer ${isResizableMode ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                isResizableMode ? t("timeline.controlsMain.fixedSizeMode") : t("timeline.controlsMain.resizableMode")
              }
              onClick={() => setIsResizableMode(!isResizableMode)}
              disabled={!file.probeData}
            >
              {<UnfoldHorizontal className="h-8 w-8" />}
            </Button>

            {/* Кнопка снимка экрана */}
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.takeSnapshot") : "Take snapshot"}
              // onClick={takeSnapshot}
              disabled={isChangingCamera || isPlaying || !file.probeData} // Отключаем кнопку во время переключения камеры
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>

          {/* Центральная часть: кнопки управления воспроизведением */}
          <div
            className="flex items-center justify-center gap-2"
            style={{ flex: "1", marginLeft: "auto", marginRight: "auto" }}
          >
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.firstFrame") : "First frame"}
              onClick={handleChevronFirst}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <ChevronFirst className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.previousFrame") : "Previous frame"}
              onClick={handleSkipBackward}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <StepBack className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={isPlaying ? t("timeline.controls.pause") : t("timeline.controls.play")}
              onClick={handlePlayPause}
              disabled={isChangingCamera || !file.probeData}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>

            <Button
              className={"h-8 w-8 cursor-pointer"}
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isRecording
                    ? t("timeline.controls.stopRecord")
                    : t("timeline.controls.record")
                  : "Record"
              }
              onClick={handleRecordToggle}
              disabled={isChangingCamera || !file.probeData} // Отключаем кнопку во время переключения камеры
            >
              <CircleDot
                className={cn(
                  "h-8 w-8",
                  isRecording ? "animate-pulse text-red-500 hover:text-red-600" : "text-gray-300 hover:text-gray-400",
                )}
              />
            </Button>

            {/* Кнопка переключения между камерами - показываем только если есть параллельные видео */}
            {parallelVideos && parallelVideos.length > 1 && (
              <Button
                className={`h-8 w-8 cursor-pointer ${isChangingCamera ? "animate-pulse" : ""}`}
                variant="ghost"
                size="icon"
                title={
                  typeof window !== "undefined"
                    ? `${t("timeline.controlsMain.switchCamera")} (${parallelVideos.findIndex((v) => v.id === file?.id) + 1}/${parallelVideos.length})`
                    : "Switch Camera"
                }
                // onClick={handleSwitchCamera}
                disabled={isChangingCamera}
              >
                {activeCameraIndex}
              </Button>
            )}

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.nextFrame") : "Next frame"}
              onClick={handleSkipForward}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <StepForward className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.lastFrame") : "Last frame"}
              onClick={handleChevronLast}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <ChevronLast className="h-8 w-8" />
            </Button>
          </div>

          {/* Правая часть: кнопки управления звуком и полноэкранным режимом */}
          <div className="flex items-center gap-2" style={{ justifyContent: "flex-end" }}>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 w-8 cursor-pointer"
                variant="ghost"
                size="icon"
                title={
                  typeof window !== "undefined"
                    ? volume === 0
                      ? t("timeline.controls.unmuteAudio")
                      : t("timeline.controls.muteAudio")
                    : "Mute audio"
                }
                onClick={handleToggleMute}
              >
                {volume === 0 ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
              </Button>
              <VolumeSlider
                volume={volume}
                volumeRef={volumeRef}
                onValueChange={handleVolumeChange}
                onValueCommit={handleVolumeChangeEnd}
              />
            </div>

            <PrerenderControls currentTime={currentTime} duration={file.duration ?? 0} />

            <Button
              className="ml-1 h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isFullscreen
                    ? t("timeline.controls.exitFullscreen")
                    : t("timeline.controls.fullscreen")
                  : "Fullscreen"
              }
              onClick={handleFullscreen}
              disabled={!file}
            >
              {isFullscreen ? <Minimize2 className="h-8 w-8" /> : <Maximize2 className="h-8 w-8" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
