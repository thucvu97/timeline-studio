import { memo, useCallback, useEffect, useRef } from "react"

import { VirtualItem, useVirtualizer } from "@tanstack/react-virtual"

import { MediaItem } from "@/features/media/components/media-item"
import { usePreviewPreloader } from "@/features/media/hooks/use-preview-preloader"
import { MediaFile } from "@/features/media/types/media"

interface VirtualizedContentGroupWithPreloadProps {
  files: MediaFile[]
  viewMode: string
  itemHeight: number
  previewSize: number
  groupName?: string
}

/**
 * Виртуализированная группа контента с предзагрузкой превью
 * Использует @tanstack/react-virtual для виртуализации и usePreviewPreloader для предзагрузки
 */
export const VirtualizedContentGroupWithPreload = memo<VirtualizedContentGroupWithPreloadProps>(
  ({ files, viewMode, itemHeight, previewSize, groupName }) => {
    const parentRef = useRef<HTMLDivElement>(null)
    const lastVisibleRangeRef = useRef<[number, number]>([0, 0])

    // Инициализируем предзагрузчик
    const { handleVisibleRangeChange } = usePreviewPreloader({
      preloadAhead: 10, // Загружаем 10 элементов вперед
      preloadBehind: 5, // И 5 элементов назад
      debounceDelay: 150, // Задержка 150мс
      maxConcurrent: 4, // До 4 параллельных загрузок
    })

    // Настройка виртуализатора
    const rowVirtualizer = useVirtualizer({
      count: files.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => itemHeight,
      overscan: 5,
      // Включаем измерение для динамических размеров
      measureElement:
        viewMode === "list"
          ? (element) => {
            return element.getBoundingClientRect().height
          }
          : undefined,
    })

    // Обработчик изменения видимых элементов
    const handleScroll = useCallback(() => {
      const items = rowVirtualizer.getVirtualItems()
      if (items.length === 0) return

      const firstVisibleIndex = items[0].index
      const lastVisibleIndex = items[items.length - 1].index
      const newRange: [number, number] = [firstVisibleIndex, lastVisibleIndex]

      // Проверяем, изменился ли диапазон
      if (
        newRange[0] !== lastVisibleRangeRef.current[0] ||
        newRange[1] !== lastVisibleRangeRef.current[1]
      ) {
        lastVisibleRangeRef.current = newRange
        // Преобразуем MediaFile[] в массив с fileId для совместимости с хуком
        const filesWithFileId = files.map(file => ({ fileId: file.id }))
        handleVisibleRangeChange(newRange, filesWithFileId)
      }
    }, [files, handleVisibleRangeChange, rowVirtualizer])

    // Подписываемся на события скролла
    useEffect(() => {
      const scrollElement = parentRef.current
      if (!scrollElement) return

      scrollElement.addEventListener("scroll", handleScroll, { passive: true })
      
      // Вызываем сразу для начальной загрузки
      handleScroll()

      return () => {
        scrollElement.removeEventListener("scroll", handleScroll)
      }
    }, [handleScroll])

    // Рендер элемента
    const renderVirtualItem = useCallback(
      (virtualItem: VirtualItem) => {
        const file = files[virtualItem.index]
        if (!file) return null

        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MediaItem
              file={file}
              index={virtualItem.index}
              viewMode={viewMode}
              previewSize={previewSize}
            />
          </div>
        )
      },
      [files, viewMode, previewSize, rowVirtualizer.measureElement]
    )

    return (
      <div className="relative h-full w-full">
        {groupName && (
          <div className="sticky top-0 z-10 bg-background px-4 py-2 font-semibold">
            {groupName}
          </div>
        )}
        
        <div
          ref={parentRef}
          className="h-full w-full overflow-auto"
          style={{
            contain: "strict",
          }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map(renderVirtualItem)}
          </div>
        </div>
      </div>
    )
  }
)

VirtualizedContentGroupWithPreload.displayName = "VirtualizedContentGroupWithPreload"