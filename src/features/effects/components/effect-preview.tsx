import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { ApplyButton } from "@/features"
import { AddMediaButton } from "@/features/browser/components/layout/add-media-button"
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button"
import { VideoEffect } from "@/features/effects/types"
import { useResources } from "@/features/resources"
import { EffectResource, TimelineResource } from "@/features/resources/types"
import { usePlayer, useVideoSelection } from "@/features/video-player"

import { EffectIndicators } from "./effect-indicators"
import { useEffects } from "../hooks/use-effects"
import { generateCSSFilterForEffect, getPlaybackRate } from "../utils/css-effects"
import { getEffectPreview } from "../utils/effect-previews"

// Получаем путь к превью видео для конкретного эффекта
const getPreviewPath = (effectType: string) => {
  const preview = getEffectPreview(effectType)
  return preview.videoPath
}

/**
 * Интерфейс пропсов для компонента EffectPreview
 */
interface EffectPreviewProps {
  effectType: VideoEffect["type"]
  onClick: () => void
  size: number
  width?: number // Ширина превью (опционально, по умолчанию равна size)
  height?: number // Высота превью (опционально, по умолчанию равна size)
  customParams?: Record<string, number> // Пользовательские параметры для эффекта
}

/**
 * Компонент для отображения превью видеоэффекта
 * Показывает видео с применённым эффектом и позволяет добавить эффект в проект
 */
export function EffectPreview({
  effectType,
  onClick,
  size,
  width = size, // По умолчанию ширина равна size (квадратное превью)
  height = size, // По умолчанию высота равна size (квадратное превью)
  customParams, // Пользовательские параметры для эффекта
}: EffectPreviewProps) {
  const { i18n } = useTranslation() // Хук для интернационализации
  const { isEffectAdded } = useResources() // Получаем методы для работы с ресурсами
  const { effects } = useEffects() // Получаем эффекты из хука
  const [isHovering, setIsHovering] = useState(false) // Состояние наведения мыши
  const [videoSrc, setVideoSrc] = useState<string | null>(null) // Путь к видео (для ленивой загрузки)
  const videoRef = useRef<HTMLVideoElement>(null) // Ссылка на элемент видео
  const timeoutRef = useRef<NodeJS.Timeout>(null) // Ссылка на таймер для воспроизведения видео
  const { applyEffect } = usePlayer() // Получаем метод для применения эффекта
  const { getCurrentVideo } = useVideoSelection() // Получаем текущее видео для применения эффекта

  // Находим эффект по типу из списка доступных эффектов
  const baseEffect = effects.find((e: VideoEffect) => e.type === effectType)

  // Создаем эффект с пользовательскими параметрами, если они переданы
  const effect = useMemo(() => {
    if (!baseEffect) return null

    if (customParams && Object.keys(customParams).length > 0) {
      return {
        ...baseEffect,
        params: {
          ...baseEffect.params,
          ...customParams,
        },
      }
    }

    return baseEffect
  }, [baseEffect, customParams])

  // Проверяем, добавлен ли эффект уже в хранилище ресурсов
  // Мемоизируем результат для оптимизации
  const isAdded = useMemo(() => {
    return effect ? isEffectAdded(effect) : false
  }, [effect, isEffectAdded])

  // Обработчик применения эффекта
  const handleApplyEffect = useCallback(
    (_resource: TimelineResource, _type: string) => {
      if (!effect) return

      console.log("[EffectPreview] Applying effect:", effect.name)
      applyEffect({
        id: effect.id,
        name: effect.name,
        params: effect.params,
      })
    },
    [effect, applyEffect],
  )

  // Ленивая загрузка видео при наведении
  useEffect(() => {
    if (isHovering && !videoSrc) {
      setVideoSrc(getPreviewPath(effectType))
    }
  }, [isHovering, effectType, videoSrc])

  /**
   * Эффект для управления воспроизведением видео и применением эффектов
   * Запускает видео при наведении и применяет соответствующий эффект
   */
  useEffect(() => {
    if (!effect) return
    if (!videoSrc || !videoRef.current) return
    const videoElement = videoRef.current

    /**
     * Применяет эффект к видео и запускает его воспроизведение
     * Устанавливает таймер для повторного воспроизведения
     */
    const applyEffect = () => {
      videoElement.currentTime = 0 // Сбрасываем время видео на начало
      videoElement.style.filter = "" // Сбрасываем предыдущие фильтры
      videoElement.style.boxShadow = "" // Сбрасываем дополнительные эффекты
      videoElement.playbackRate = 1 // Сбрасываем скорость воспроизведения

      // Применяем CSS-фильтр на основе параметров эффекта
      const cssFilter = generateCSSFilterForEffect(effect)
      if (cssFilter) {
        videoElement.style.filter = cssFilter
      }

      // Специальные эффекты, требующие дополнительных CSS-стилей
      if (effect.type === "vignette") {
        // Создаем эффект виньетки через box-shadow
        const intensity = customParams?.intensity ?? effect.params?.intensity ?? 0.3
        const radius = customParams?.radius ?? effect.params?.radius ?? 0.8
        const shadowSize = Math.round(Math.min(width, height) * (1 - radius) * 0.5)
        const shadowBlur = Math.round(shadowSize * intensity * 2)
        videoElement.style.boxShadow = `inset 0 0 ${shadowBlur}px ${shadowSize}px rgba(0,0,0,${intensity})`
      } else {
        videoElement.style.boxShadow = ""
      }

      // Устанавливаем скорость воспроизведения
      const playbackRate = getPlaybackRate(effect)
      videoElement.playbackRate = playbackRate

      // Запускаем воспроизведение видео
      videoElement.play().catch((err: unknown) => {
        console.log("Autoplay prevented:", err)
      })

      // Устанавливаем таймер для повторного воспроизведения через 2 секунды
      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyEffect()
        }
      }, 2000)
    }

    // Если курсор наведен на превью - применяем эффект и запускаем видео
    if (isHovering) {
      applyEffect()
    } else {
      // Если курсор не наведен - останавливаем видео и сбрасываем эффекты
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.style.filter = ""
      videoElement.style.boxShadow = ""
      videoElement.playbackRate = 1
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isHovering, effect, width, height, customParams, videoSrc])

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью эффекта */}
      <div
        className="group relative cursor-pointer rounded-xs bg-gray-800"
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onClick}
      >
        {/* Видео для демонстрации эффекта */}
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xs"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              objectFit: "cover", // Обрезаем видео по размерам контейнера
            }}
            muted
            playsInline
            preload="metadata"
            data-testid="effect-video"
          />
        )}

        {/* Плейсхолдер пока видео не загружено */}
        {!videoSrc && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xs bg-gray-800 flex items-center justify-center"
            style={{
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            <div className="text-gray-500 text-xs">
              {effect?.labels?.[i18n.language as keyof typeof effect.labels] || effect?.name || effectType}
            </div>
          </div>
        )}

        {/* Индикаторы эффекта */}
        {effect && (
          <>
            {/* Цветовой индикатор сложности слева */}
            <div className="absolute bottom-1 left-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  effect.complexity === "basic"
                    ? "bg-green-500"
                    : effect.complexity === "intermediate"
                      ? "bg-yellow-500"
                      : effect.complexity === "advanced"
                        ? "bg-red-500"
                        : "bg-gray-500"
                }`}
                title={`effects.complexity.${effect.complexity || "basic"}`}
              />
            </div>

            {/* Индикаторы категории и тегов справа */}
            <div className="absolute top-1 left-1">
              <EffectIndicators effect={effect} size={size > 150 ? "md" : "sm"} />
            </div>
          </>
        )}

        {/* Кнопка добавления в избранное */}
        {effect && <FavoriteButton file={{ id: effect.id, path: "", name: effect.name }} size={size} type="effect" />}
        {effect && (
          <ApplyButton
            resource={
              {
                id: effect.id,
                type: "effect",
                name: effect.name,
              } as EffectResource
            }
            size={size}
            type="effect"
            onApply={handleApplyEffect}
          />
        )}
        {/* Кнопка добавления эффекта в проект */}
        <div className={isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"}>
          {effect && (
            <AddMediaButton
              resource={{ id: effect.id, type: "effect", name: effect.name } as EffectResource}
              size={size}
              type="effect"
            />
          )}
        </div>
      </div>
      {/* Название эффекта */}
      <div className="mt-1 text-xs text-center">
        {effect
          ? effect.labels?.[i18n.language as keyof typeof effect.labels] ||
            effect.labels?.en ||
            effect.name ||
            effectType
          : effectType}
      </div>
    </div>
  )
}
