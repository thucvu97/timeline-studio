import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  Camera,
  ChevronFirst,
  ChevronLast,
  CircleDot,
  Grid2x2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SquarePlay,
  StepBack,
  StepForward,
  UnfoldHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { getFrameTime } from "@/lib/video"
import { MediaFile } from "@/types/media"

import { usePlayer } from "./player-provider"
import { useFullscreen } from "./use-fullscreen"
import { VolumeSlider } from "./volume-slider"

interface PlayerControlsProps {
  currentTime: number
}

export function PlayerControls({ currentTime }: PlayerControlsProps) {
  const { t } = useTranslation()
  const {
    isPlaying,
    setIsPlaying,
    video,
    setVideo,
    setCurrentTime,
    volume,
    setVolume,
    isRecording,
    setIsRecording,
    setIsSeeking,
    isChangingCamera,
    setIsChangingCamera,
    isResizableMode,
    setIsResizableMode,
  } = usePlayer()

  // Используем состояние для хранения текущего времени воспроизведения
  const [localDisplayTime, setLocalDisplayTime] = useState(0)
  const lastSaveTime = useRef(0)
  const SAVE_INTERVAL = 25000 // Сохраняем каждые 25 секунд

  // Используем хук для отслеживания полноэкранного режима
  const { isFullscreen } = useFullscreen()

  // Удаляем неиспользуемый ref

  // Временно отключаем сохранение состояния периодически
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastSaveTime.current >= SAVE_INTERVAL) {
        lastSaveTime.current = now
      }
    }, SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [video])

  // Функция для переключения полноэкранного режима
  const handleFullscreen = useCallback(() => {
    // Проверяем, есть ли активное видео
    if (!video) {
      console.log("[handleFullscreen] Нет активного видео для отображения в полноэкранном режиме")
      return
    }

    // Находим контейнер медиаплеера
    const playerContainer = document.querySelector(".media-player-container")!

    if (!playerContainer) {
      console.error("[handleFullscreen] Не найден контейнер медиаплеера")
      return
    }

    // Используем функцию toggleFullscreen из хука useFullscreenChange
    const { toggleFullscreen } = useFullscreen()
    toggleFullscreen(playerContainer)

    console.log(`[handleFullscreen] ${isFullscreen ? "Выход из" : "Вход в"} полноэкранный режим`)
  }, [video, isFullscreen])

  // Нормализуем currentTime для отображения, если это Unix timestamp
  const calculatedDisplayTime = useMemo(() => {
    if (currentTime > 365 * 24 * 60 * 60) {
      // Если время больше года в секундах, это, вероятно, Unix timestamp
      // Используем локальное время для отображения
      return localDisplayTime
    }
    return currentTime
  }, [currentTime, localDisplayTime])

  if (!video) {
    return null
  }

  // Получаем frameTime с помощью функции getFrameTime
  const frameTime = getFrameTime(video || undefined)

  // Определяем isFirstFrame и isLastFrame на основе мемоизированных значений
  const isFirstFrame = useMemo(() => {
    return Math.abs(currentTime - video.startTime) < frameTime
  }, [currentTime, video?.startTime, frameTime])

  const isLastFrame = useMemo(() => {
    return Math.abs(currentTime - video.endTime) < frameTime
  }, [currentTime, video?.endTime, frameTime])

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
    const newTime = Math.min(currentTime + frameTime, video.endTime)
    setLocalDisplayTime(newTime)
    setCurrentTime(newTime)
    setIsSeeking(true)
  }, [currentTime, frameTime, video.endTime, setLocalDisplayTime, setCurrentTime, setIsSeeking])

  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(currentTime - frameTime, video.startTime)
    setLocalDisplayTime(newTime)
    setCurrentTime(newTime)
    setIsSeeking(true)
  }, [currentTime, frameTime, video.startTime, setLocalDisplayTime, setCurrentTime, setIsSeeking])

  const handleChevronFirst = useCallback(() => {
    const newTime = video.startTime
    setLocalDisplayTime(newTime)
    setCurrentTime(newTime)
    setIsSeeking(true)
  }, [video.startTime, setLocalDisplayTime, setCurrentTime, setIsSeeking])

  const handleChevronLast = useCallback(() => {
    const newTime = video.endTime
    setLocalDisplayTime(newTime)
    setCurrentTime(newTime)
    setIsSeeking(true)
  }, [video.endTime, setLocalDisplayTime, setCurrentTime, setIsSeeking])

  return (
    <div className="flex w-full flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="relative h-1 w-full rounded-full border border-white bg-gray-800">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-white transition-all duration-200 ease-out"
                style={{
                  width: `${(Math.max(0, calculatedDisplayTime) / (video?.duration || 100)) * 100}%`,
                }}
              />
              <div
                className="absolute top-1/2 h-[13px] w-[13px] -translate-y-1/2 rounded-full border border-white bg-white transition-all duration-200 ease-out"
                style={{
                  left: `calc(${(Math.max(0, calculatedDisplayTime) / (video?.duration || 100)) * 100}% - 6px)`,
                }}
              />
              <Slider
                value={[Math.max(0, calculatedDisplayTime)]}
                min={0}
                max={video?.duration || 100}
                step={0.001}
                onValueChange={handleTimeChange}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                disabled={isChangingCamera} // Отключаем слайдер во время переключения камеры
              />
            </div>
          </div>
          <span className="rounded-md bg-white px-1 text-xs text-black transition-opacity duration-200 ease-out dark:bg-black dark:text-white">
            {currentTime > 365 * 24 * 60 * 60
              ? formatSectorTime(Math.max(0, calculatedDisplayTime), video?.startTime)
              : formatRelativeTime(Math.max(0, calculatedDisplayTime))}
          </span>
          <span className="mb-[3px]">/</span>
          <span className="rounded-md bg-white px-1 text-xs text-black transition-opacity duration-200 ease-out dark:bg-black dark:text-white">
            {formatRelativeTime(video?.duration || 0)}
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
            {/* Кнопка шаблона - всегда активна, переключает режим шаблона */}
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? t("timeline.controlsMain.resetTemplate") || "Сбросить шаблон"
                  : "Reset Template"
              }
              // onClick={handleResetTemplate}
            >
              <SquarePlay className="h-8 w-8" />
            </Button>

            {/* Кнопка переключения режима resizable - показываем только если применен шаблон */}
            <Button
              className={`h-8 w-8 cursor-pointer ${isResizableMode ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isResizableMode
                    ? t("timeline.controlsMain.fixedSizeMode")
                    : t("timeline.controlsMain.resizableMode")
                  : ""
              }
              onClick={() => setIsResizableMode(!isResizableMode)}
              // disabled={!appliedTemplate}
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
              title={
                typeof window !== "undefined"
                  ? isPlaying
                    ? t("timeline.controls.pause")
                    : t("timeline.controls.play")
                  : "Play"
              }
              onClick={handlePlayPause}
              disabled={isChangingCamera}
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
              disabled={isChangingCamera} // Отключаем кнопку во время переключения камеры
            >
              <CircleDot
                className={cn(
                  "h-8 w-8",
                  isRecording ? "animate-pulse text-red-500 hover:text-red-600" : "text-white hover:text-gray-300",
                )}
              />
            </Button>

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
              <div className="w-20">
                <VolumeSlider
                  volume={volume}
                  volumeRef={volumeRef}
                  onValueChange={handleVolumeChange}
                  onValueCommit={handleVolumeChangeEnd}
                />
              </div>
            </div>

            <Button
              className={`ml-1 h-8 w-8 ${!video ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
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
              disabled={!video}
            >
              {isFullscreen ? <Minimize2 className="h-8 w-8" /> : <Maximize2 className="h-8 w-8" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
