import React from "react"

import { Loader2 } from "lucide-react"

interface StyleTemplateLoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

/**
 * Компонент загрузки для стилистических шаблонов
 * Показывает индикатор загрузки с анимацией
 */
export function StyleTemplateLoading({
  message = "Загрузка шаблонов...",
  size = "md",
}: StyleTemplateLoadingProps): React.ReactElement {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const containerClasses = {
    sm: "p-4",
    md: "p-8",
    lg: "p-12",
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  )
}

/**
 * Скелетон для превью шаблона
 */
export function StyleTemplatePreviewSkeleton({ size }: { size: number }): React.ReactElement {
  const height = size * 0.75 // Примерное соотношение сторон

  return (
    <div
      className="animate-pulse overflow-hidden rounded-lg border border-gray-700 bg-gray-800"
      style={{ width: size, height: height + 80 }}
    >
      {/* Превью */}
      <div className="bg-gray-700" style={{ width: size, height }} />

      {/* Информация */}
      <div className="p-3">
        <div className="mb-2 h-4 w-3/4 rounded bg-gray-700" />
        <div className="flex justify-between">
          <div className="h-3 w-1/3 rounded bg-gray-600" />
          <div className="h-3 w-1/4 rounded bg-gray-600" />
        </div>
      </div>
    </div>
  )
}

/**
 * Сетка скелетонов для списка шаблонов
 */
export function StyleTemplateListSkeleton({
  count = 6,
  size = 200,
}: {
  count?: number
  size?: number
}): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, index) => (
        <StyleTemplatePreviewSkeleton key={index} size={size} />
      ))}
    </div>
  )
}
