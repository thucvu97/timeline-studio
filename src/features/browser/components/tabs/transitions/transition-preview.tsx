import { useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { useResources } from "@/features/browser/resources"
import { MediaFile } from "@/types/media"
import { TransitionResource } from "@/types/resources"
import { transitions as transitionEffects } from "@/types/transitions"

import { transitions } from "./transitions"
import { AddMediaButton } from "../../layout/add-media-button"
import { FavoriteButton } from "../../layout/favorite-button"

interface TransitionPreviewProps {
  sourceVideo: MediaFile
  targetVideo: MediaFile
  transitionType:
    | "zoom"
    | "fade"
    | "slide"
    | "scale"
    | "rotate"
    | "flip"
    | "push"
    | "squeeze"
    | "diagonal"
    | "spiral"
    | "fold"
    | "wave"
    | "shutter"
    | "bounce"
    | "swirl"
    | "dissolve"
  onClick: () => void
  size: number
}

export function TransitionPreview({
  sourceVideo,
  targetVideo,
  transitionType,
  onClick,
  size,
}: TransitionPreviewProps) {
  const { t } = useTranslation()
  const {
    addTransition,
    isTransitionAdded,
    removeResource,
    transitionResources,
  } = useResources()
  const [isHovering, setIsHovering] = useState(false)
  const [isError, setIsError] = useState(false)
  const sourceVideoRef = useRef<HTMLVideoElement>(null)
  const targetVideoRef = useRef<HTMLVideoElement>(null)
  const transitionTimeoutRef = useRef<NodeJS.Timeout>(null)
  const loopTimeoutRef = useRef<NodeJS.Timeout>(null)

  // Находим переход по типу
  const transition = transitionEffects.find(
    (t) => t.id === transitionType || t.type === transitionType,
  )

  // Создаем объект перехода с правильным id, если его нет в transitionEffects
  const transitionObj = transition ?? {
    id: transitionType,
    type: transitionType as any,
    name:
      transitions.find((t) => t.type === transitionType)?.labels.ru ??
      transitionType,
    duration: 1.5,
    ffmpegCommand: () => "",
    params: {},
    previewPath: "",
  }

  // Проверяем, добавлен ли переход уже в хранилище
  const isAdded = isTransitionAdded(transitionObj)

  // Отладочный вывод
  // useEffect(() => {
  //   console.log(`Transition ${transitionObj.id} (${transitionType}) isAdded:`, isAdded)
  // }, [transitionObj, transitionType, isAdded])

  const resetVideos = useCallback(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    sourceVideo.currentTime = 0
    targetVideo.currentTime = 0

    // Сброс всех возможных стилей
    sourceVideo.style.transform = "scale(1)"
    sourceVideo.style.opacity = "1"
    sourceVideo.style.filter = "blur(0px) wave(0, 0%, 0%)"
    sourceVideo.style.clipPath = "none"
    sourceVideo.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
    sourceVideo.style.mixBlendMode = "normal"

    targetVideo.style.opacity = "0"
    targetVideo.style.transform = "scale(1)"
    targetVideo.style.filter = "blur(0px)"
    targetVideo.style.clipPath = "none"
    targetVideo.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
    targetVideo.style.mixBlendMode = "normal"
  }, [])

  const startTransition = useCallback(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current || isError) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    resetVideos()
    void sourceVideo.play()

    transitionTimeoutRef.current = setTimeout(() => {
      targetVideo.style.opacity = "1"

      switch (transitionType) {
        case "zoom":
          sourceVideo.style.transform = "scale(2)"
          sourceVideo.style.opacity = "0"
          break

        case "fade":
          sourceVideo.style.opacity = "0"
          break

        case "slide":
          sourceVideo.style.transform = "translateX(-100%)"
          break

        case "scale":
          sourceVideo.style.transform = "scale(0.1)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "scale(1)"
          break

        case "rotate":
          sourceVideo.style.transform = "rotate(180deg) scale(0.5)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "rotate(0deg) scale(1)"
          break

        case "flip":
          sourceVideo.style.transform = "rotateY(180deg)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "rotateY(0deg)"
          break

        case "push":
          sourceVideo.style.transform = "translateX(-100%)"
          targetVideo.style.transform = "translateX(0%)"
          targetVideo.style.transition = "transform 1s ease-in-out"
          break

        case "squeeze":
          sourceVideo.style.transform = "scaleX(0)"
          sourceVideo.style.opacity = "0"
          break

        case "diagonal":
          sourceVideo.style.transform = "translate(-100%, -100%)"
          sourceVideo.style.opacity = "0"
          break

        case "spiral":
          sourceVideo.style.transform = "rotate(720deg) scale(0)"
          sourceVideo.style.opacity = "0"
          break

        case "fold":
          sourceVideo.style.transform = "perspective(500px) rotateX(90deg)"
          sourceVideo.style.opacity = "0"
          break

        case "wave":
          sourceVideo.style.transform = "scale(1.5)"
          sourceVideo.style.filter = "wave(16, 50%, 50%)"
          sourceVideo.style.opacity = "0"
          break

        case "shutter":
          sourceVideo.style.clipPath = "inset(0 50% 0 50%)"
          sourceVideo.style.opacity = "0"
          break

        case "bounce":
          sourceVideo.style.transform = "scale(0)"
          sourceVideo.style.opacity = "0"
          sourceVideo.style.transition =
            "all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
          break

        case "swirl":
          sourceVideo.style.transform = "rotate(1080deg) scale(0)"
          sourceVideo.style.opacity = "0"
          sourceVideo.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)"
          break

        case "dissolve":
          sourceVideo.style.mixBlendMode = "multiply"
          targetVideo.style.mixBlendMode = "screen"
          sourceVideo.style.opacity = "0"
          break
      }

      void targetVideo.play()

      loopTimeoutRef.current = setTimeout(() => {
        if (isHovering) {
          startTransition()
        }
      }, 2000)
    }, 1000)
  }, [isHovering, transitionType, isError, resetVideos])

  useEffect(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    const handleError = () => setIsError(true)

    sourceVideo.addEventListener("error", handleError)
    targetVideo.addEventListener("error", handleError)

    if (isHovering) {
      startTransition()
    } else {
      resetVideos()
      sourceVideo.pause()
      targetVideo.pause()
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current)
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }

    return () => {
      sourceVideo.removeEventListener("error", handleError)
      targetVideo.removeEventListener("error", handleError)
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current)
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }
  }, [isHovering, startTransition, resetVideos])

  return (
    <div className="flex flex-col items-center">
      <div className="group relative">
        <div
          className="flex cursor-pointer overflow-hidden rounded-xs bg-[#1a1a1a]"
          style={{ width: `${size}px`, height: `${size}px` }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={onClick}
        >
          {isError ? (
            <div className="flex h-full items-center justify-center text-white">
              {t("timeline.player.videoLoadError")}
            </div>
          ) : (
            <div className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-md">
              <video
                ref={sourceVideoRef}
                src={sourceVideo.path}
                className="h-full w-full origin-center object-cover transition-all duration-1000"
                muted
                playsInline
                preload="auto"
                onError={() => setIsError(true)}
                data-testid="source-video"
              />
              <video
                ref={targetVideoRef}
                src={targetVideo.path}
                className="absolute inset-0 h-full w-full origin-center object-cover opacity-0 transition-all duration-1000"
                muted
                playsInline
                preload="auto"
                onError={() => setIsError(true)}
                data-testid="target-video"
              />
              {/* Кнопка избранного */}
              <FavoriteButton
                file={{
                  id: transitionObj.id,
                  path: "",
                  name: transitionObj.name,
                }}
                size={size}
                type="transition"
              />

              <div
                className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
              >
                <AddMediaButton
                  file={{ id: transitionType, path: "", name: transitionType }}
                  onAddMedia={(e) => {
                    e.stopPropagation()
                    addTransition(transitionObj)
                  }}
                  onRemoveMedia={(e) => {
                    e.stopPropagation()
                    // Находим ресурс с этим переходом и удаляем его
                    const resource = transitionResources.find(
                      (res: TransitionResource) =>
                        res.resourceId === transitionObj.id ||
                        res.resourceId === transitionObj.type,
                    )
                    if (resource) {
                      removeResource(resource.id)
                    } else {
                      console.warn(
                        `Не удалось найти ресурс перехода с ID ${transitionObj.id} для удаления`,
                      )
                    }
                  }}
                  isAdded={isAdded}
                  size={size}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 text-xs text-gray-300">
        {t(`transitions.types.${transitionType}`)}
      </div>
    </div>
  )
}
