import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { useResources } from "@/features/browser/resources"
import { VideoEffect } from "@/types/effects"
import { EffectResource } from "@/types/resources"

import { AddMediaButton } from "../../layout/add-media-button"
import { FavoriteButton } from "../../layout/favorite-button"

import { effects } from "."

interface EffectPreviewProps {
  effectType: VideoEffect["type"]
  onClick: () => void
  size: number
}

export function EffectPreview({
  effectType,
  onClick,
  size,
}: EffectPreviewProps) {
  const { t } = useTranslation()
  const { addEffect, isEffectAdded, removeResource, effectResources } =
    useResources()
  const [isHovering, setIsHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  // Находим эффект по типу
  const effect = effects.find((e) => e.type === effectType)

  // Проверяем, добавлен ли эффект уже в хранилище
  const isAdded = effect ? isEffectAdded(effect) : false

  useEffect(() => {
    if (!videoRef.current) return
    const videoElement = videoRef.current

    const applyEffect = () => {
      videoElement.currentTime = 0
      videoElement.style.filter = ""

      switch (effectType) {
        case "brightness":
          videoElement.style.filter = "brightness(1.5)"
          break
        case "contrast":
          videoElement.style.filter = "contrast(1.5)"
          break
        case "saturation":
          videoElement.style.filter = "saturate(2)"
          break
        case "sepia":
          videoElement.style.filter = "sepia(0.8)"
          break
        case "grayscale":
          videoElement.style.filter = "grayscale(1)"
          break
        case "invert":
          videoElement.style.filter = "invert(0.8)"
          break
        case "hue-rotate":
          videoElement.style.filter = "hue-rotate(90deg)"
          break
        case "vintage":
          videoElement.style.filter =
            "sepia(0.5) contrast(1.2) brightness(0.9) saturate(0.8)"
          break
        case "duotone":
          videoElement.style.filter =
            "grayscale(1) brightness(1.2) contrast(1.5) sepia(0.5)"
          break
        case "speed":
          videoElement.playbackRate = 2
          break
        case "noir":
          videoElement.style.filter =
            "grayscale(1) contrast(1.5) brightness(0.8)"
          break
        case "cyberpunk":
          videoElement.style.filter =
            "hue-rotate(180deg) saturate(2) contrast(1.3) brightness(1.2)"
          break
        case "dreamy":
          videoElement.style.filter =
            "brightness(1.1) contrast(0.9) saturate(0.8) hue-rotate(30deg)"
          break
        case "infrared":
          videoElement.style.filter =
            "hue-rotate(-30deg) saturate(2) contrast(1.5) brightness(1.2)"
          break
        case "matrix":
          videoElement.style.filter =
            "brightness(1.2) saturate(1.5) hue-rotate(100deg)"
          break
        case "arctic":
          videoElement.style.filter =
            "brightness(1.2) saturate(0.8) contrast(1.1) hue-rotate(180deg)"
          break
        case "sunset":
          videoElement.style.filter =
            "brightness(1.1) contrast(1.2) saturate(1.5) hue-rotate(30deg) sepia(0.3)"
          break
        case "lomo":
          videoElement.style.filter =
            "contrast(1.4) brightness(0.9) sepia(0.3) saturate(1.5)"
          break
        case "twilight":
          videoElement.style.filter =
            "brightness(0.9) contrast(1.1) saturate(0.8) hue-rotate(-20deg)"
          break
        case "neon":
          videoElement.style.filter =
            "brightness(1.2) contrast(1.4) saturate(2) hue-rotate(180deg)"
          break
      }

      void videoElement.play()

      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyEffect()
        }
      }, 2000)
    }

    if (isHovering) {
      applyEffect()
    } else {
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.style.filter = ""
      videoElement.playbackRate = 1
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isHovering, effectType])

  return (
    <div className="flex flex-col items-center">
      <div
        className="group relative cursor-pointer rounded-xs bg-black"
        style={{ width: `${size}px`, height: `${size}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onClick}
      >
        <video
          ref={videoRef}
          src="/t1.mp4"
          className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-xs object-cover"
          muted
          playsInline
          preload="auto"
        />

        {/* Кнопка избранного */}
        {effect && (
          <FavoriteButton
            file={{ id: effect.id, path: "", name: effect.name }}
            size={size}
            type="effect"
          />
        )}

        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={{ id: effectType, path: "", name: effectType }}
            onAddMedia={(e) => {
              e.stopPropagation()
              if (effect) {
                addEffect(effect)
              }
            }}
            onRemoveMedia={(e: React.MouseEvent) => {
              e.stopPropagation()
              if (effect) {
                // Находим ресурс с этим эффектом и удаляем его
                const resource = effectResources.find(
                  (res: EffectResource) => res.resourceId === effect.id,
                )
                if (resource) {
                  removeResource(resource.id)
                } else {
                  console.warn(
                    `Не удалось найти ресурс эффекта с ID ${effect.id} для удаления`,
                  )
                }
              }
            }}
            isAdded={isAdded}
            size={size}
          />
        </div>
      </div>
      <div className="mt-1 text-xs text-gray-300">
        {t(`effects.presets.${effectType}`)}
      </div>
    </div>
  )
}
