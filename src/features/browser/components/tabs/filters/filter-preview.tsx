import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { useResources } from "@/features/browser/resources"
import { VideoFilter } from "@/types/filters"
import { FilterResource } from "@/types/resources"

import { AddMediaButton } from "../../layout/add-media-button"
import { FavoriteButton } from "../../layout/favorite-button"

interface FilterPreviewProps {
  filter: VideoFilter
  onClick: () => void
  size: number
}

export function FilterPreview({ filter, onClick, size }: FilterPreviewProps) {
  const { t } = useTranslation()
  const { addFilter, isFilterAdded, removeResource, filterResources } =
    useResources()
  const [isHovering, setIsHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  // Проверяем, добавлен ли фильтр уже в хранилище
  const isAdded = isFilterAdded(filter)

  const getFilterStyle = () => {
    const { brightness, contrast, saturation, gamma, temperature, tint } =
      filter.params
    const filters = []

    if (brightness !== undefined) filters.push(`brightness(${1 + brightness})`)
    if (contrast !== undefined) filters.push(`contrast(${contrast})`)
    if (saturation !== undefined) filters.push(`saturate(${saturation})`)
    if (gamma !== undefined) filters.push(`gamma(${gamma})`)
    if (temperature !== undefined) filters.push(`sepia(${temperature}%)`)
    if (tint !== undefined) filters.push(`hue-rotate(${tint}deg)`)

    return filters.join(" ")
  }

  useEffect(() => {
    if (!videoRef.current) return
    const videoElement = videoRef.current

    const applyFilter = () => {
      videoElement.currentTime = 0
      videoElement.style.filter = getFilterStyle()
      void videoElement.play()

      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyFilter()
        }
      }, 2000)
    }

    if (isHovering) {
      applyFilter()
    } else {
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.style.filter = ""
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovering, filter])

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
          data-testid="filter-video"
        />

        {/* Кнопка избранного */}
        <FavoriteButton
          file={{ id: filter.id, path: "", name: filter.name }}
          size={size}
          type="filter"
        />

        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={{ id: filter.id, path: "", name: filter.name }}
            onAddMedia={(e) => {
              e.stopPropagation()
              addFilter(filter)
            }}
            onRemoveMedia={(e) => {
              e.stopPropagation()
              // Находим ресурс с этим фильтром и удаляем его
              const resource = filterResources.find(
                (res: FilterResource) => res.resourceId === filter.id,
              )
              if (resource) {
                removeResource(resource.id)
              } else {
                console.warn(
                  `Не удалось найти ресурс фильтра с ID ${filter.id} для удаления`,
                )
              }
            }}
            isAdded={isAdded}
            size={size}
          />
        </div>
      </div>
      <div className="mt-1 text-xs text-gray-300">
        {t(`filters.presets.${filter.id}`)}
      </div>
    </div>
  )
}
