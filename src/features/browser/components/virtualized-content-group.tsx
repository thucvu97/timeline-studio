import React, { useEffect, useMemo, useRef, useState } from "react"

import { CopyPlus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Интерфейс свойств компонента VirtualizedContentGroup
 */
interface VirtualizedContentGroupProps<T> {
  /** Заголовок группы */
  title: string
  /** Элементы в группе */
  items: T[]
  /** Режим отображения */
  viewMode?: "list" | "grid" | "thumbnails"
  /** Функция рендеринга элемента */
  renderItem: (item: T, props?: any) => React.ReactNode
  /** Функция для добавления всех элементов группы */
  onAddAll?: (items: T[]) => void
  /** Проверка, все ли элементы добавлены */
  areAllItemsAdded?: (items: T[]) => boolean
  /** Текст кнопки добавления */
  addButtonText?: string
  /** Текст кнопки когда все добавлены */
  addedButtonText?: string
  /** Размер превью для вычисления размеров элементов */
  previewSize?: { width: number; height: number } | number
  /** Тип элемента для системы избранного */
  favoriteType?: string
}

/**
 * Виртуализированный компонент для отображения группы контента
 * Рендерит только видимые элементы для оптимизации производительности
 */
export function VirtualizedContentGroup<T>({
  title,
  items,
  viewMode = "thumbnails",
  renderItem,
  onAddAll,
  areAllItemsAdded,
  addButtonText,
  addedButtonText,
  previewSize = 150,
  favoriteType,
}: VirtualizedContentGroupProps<T>) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 30 })

  // Вычисляем размеры элементов в зависимости от режима отображения
  const { itemWidth, itemHeight, gap } = useMemo(() => {
    const size = typeof previewSize === "number" ? previewSize : previewSize.width
    switch (viewMode) {
      case "list":
        // Для list режима используем фиксированную высоту
        return { itemWidth: 0, itemHeight: 68, gap: 4 } // 60px preview + 8px padding
      case "grid":
        return { itemWidth: size + 16, itemHeight: size + 60, gap: 16 }
      case "thumbnails":
        return { itemWidth: size + 16, itemHeight: size + 60, gap: 12 }
      default:
        return { itemWidth: size + 16, itemHeight: size + 60, gap: 12 }
    }
  }, [viewMode, previewSize])

  // Находим контейнер с прокруткой
  useEffect(() => {
    const findScrollContainer = () => {
      let current = containerRef.current?.parentElement
      while (current) {
        const hasOverflow =
          getComputedStyle(current).overflowY === "auto" || getComputedStyle(current).overflowY === "scroll"
        if (hasOverflow && current.scrollHeight > current.clientHeight) {
          return current
        }
        current = current.parentElement
      }
      return null
    }

    scrollContainerRef.current = findScrollContainer()
  }, [])

  // Обработчик прокрутки для виртуализации
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || !containerRef.current) return

    const handleScroll = () => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const scrollRect = scrollContainer.getBoundingClientRect()

      // Вычисляем видимую область относительно контейнера группы
      const relativeTop = Math.max(0, scrollRect.top - containerRect.top)
      const visibleHeight = scrollContainer.clientHeight

      if (viewMode === "list") {
        // Для списка просто вычисляем по индексам
        const startIndex = Math.floor(relativeTop / (itemHeight + gap))
        const endIndex = Math.ceil((relativeTop + visibleHeight) / (itemHeight + gap))

        setVisibleRange({
          start: Math.max(0, startIndex - 5),
          end: Math.min(items.length, endIndex + 5),
        })
      } else {
        // Для сетки нужно учитывать количество колонок
        const containerWidth = containerRef.current.clientWidth
        const itemsPerRow = Math.floor(containerWidth / (itemWidth + gap)) || 1
        const rowHeight = itemHeight + gap

        const startRow = Math.floor(relativeTop / rowHeight)
        const endRow = Math.ceil((relativeTop + visibleHeight) / rowHeight)

        setVisibleRange({
          start: Math.max(0, startRow * itemsPerRow - itemsPerRow * 2),
          end: Math.min(items.length, endRow * itemsPerRow + itemsPerRow * 2),
        })
      }
    }

    // Слушаем событие прокрутки
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true })
    // Слушаем изменение размера окна
    window.addEventListener("resize", handleScroll, { passive: true })

    // Вызываем сразу для инициализации
    handleScroll()

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [items.length, itemHeight, itemWidth, gap, viewMode])

  // Вычисляем общую высоту контейнера
  const totalHeight = useMemo(() => {
    if (viewMode === "list") {
      return items.length * (itemHeight + gap)
    }
    const containerWidth = 800 // примерная ширина
    const itemsPerRow = Math.floor(containerWidth / (itemWidth + gap)) || 1
    const rows = Math.ceil(items.length / itemsPerRow)
    return rows * (itemHeight + gap)
  }, [items.length, viewMode, itemHeight, itemWidth, gap])

  // Не показываем группу, если в ней нет элементов
  if (items.length === 0) {
    return null
  }

  // Проверяем, все ли элементы в группе уже добавлены
  const allItemsAdded = areAllItemsAdded ? areAllItemsAdded(items) : false

  // Видимые элементы
  const visibleItems = items.slice(visibleRange.start, visibleRange.end)

  // Определяем CSS классы для контейнера элементов
  const getItemsContainerClasses = () => {
    switch (viewMode) {
      case "grid":
        return "items-left flex flex-wrap"
      case "thumbnails":
        return "flex flex-wrap justify-between"
      case "list":
        return "flex flex-col"
      default:
        return "flex flex-wrap"
    }
  }

  // Стили для промежутков
  const gapStyle = viewMode === "list" ? { gap: `${gap}px 0` } : { gap: `${gap}px` }

  // Если группа не имеет заголовка, отображаем только элементы
  if (!title || title === "") {
    return (
      <div ref={containerRef} className="relative w-full" style={{ minHeight: totalHeight }}>
        <div
          className={getItemsContainerClasses()}
          style={{
            ...gapStyle,
            transform: `translateY(${Math.floor(visibleRange.start / (viewMode === "list" ? 1 : Math.floor(800 / (itemWidth + gap)) || 1)) * (itemHeight + gap)}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <React.Fragment key={visibleRange.start + index}>{renderItem(item)}</React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  // Если группа имеет заголовок, отображаем заголовок и элементы
  return (
    <div key={title} className="mb-4">
      <div className="mb-2 flex items-center justify-between pl-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {onAddAll && (
          <Button
            variant="secondary"
            size="sm"
            className={cn(
              "flex h-7 cursor-pointer items-center gap-1 rounded-sm bg-[#dddbdd] px-2 text-xs hover:bg-[#38dacac3] dark:bg-[#45444b] dark:hover:bg-[#35d1c1] dark:hover:text-black",
              allItemsAdded && "cursor-not-allowed opacity-50",
            )}
            onClick={() => onAddAll(items)}
            disabled={allItemsAdded}
          >
            <span className="px-1 text-xs">
              {allItemsAdded ? addedButtonText || t("common.allFilesAdded") : addButtonText || t("common.add")}
            </span>
            <CopyPlus className="mr-1 h-3 w-3" />
          </Button>
        )}
      </div>
      <div ref={containerRef} className="relative w-full" style={{ minHeight: totalHeight }}>
        <div
          className={getItemsContainerClasses()}
          style={{
            ...gapStyle,
            transform: `translateY(${Math.floor(visibleRange.start / (viewMode === "list" ? 1 : Math.floor(800 / (itemWidth + gap)) || 1)) * (itemHeight + gap)}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <React.Fragment key={visibleRange.start + index}>{renderItem(item)}</React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
