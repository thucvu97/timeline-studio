import { useCallback, useEffect, useRef, useState } from "react"

import { DraggableItem, DraggableType, DropTarget, getDragDropManager } from "../services/drag-drop-manager"

/**
 * Хук для элементов которые можно перетаскивать
 */
export function useDraggable(type: DraggableType, getData: () => any, getPreview?: () => any) {
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      // Skip during SSR
      if (typeof window === "undefined") return

      const item: DraggableItem = {
        type,
        data: getData(),
        preview: getPreview?.(),
      }

      getDragDropManager().startDrag(item, event.nativeEvent)
    },
    [type, getData, getPreview],
  )

  const handleDragEnd = useCallback(() => {
    // DragDropManager автоматически обработает dragend
  }, [])

  return {
    draggable: typeof window !== "undefined",
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  }
}

/**
 * Хук для drop зон
 */
export function useDropZone(
  id: string,
  accepts: DraggableType[],
  onDrop: (item: DraggableItem, event: DragEvent) => void,
) {
  const elementRef = useRef<HTMLElement>(null)
  const dropTargetRef = useRef<DropTarget | undefined>(undefined)

  useEffect(() => {
    // Skip during SSR
    if (typeof window === "undefined" || !elementRef.current) return

    dropTargetRef.current = {
      id,
      accepts,
      element: elementRef.current,
      onDrop,
      onDragEnter: (_item) => {
        // Можно добавить визуальную индикацию
        elementRef.current?.classList.add("bg-primary/10", "border-primary", "border-dashed", "border-2")
      },
      onDragLeave: () => {
        elementRef.current?.classList.remove("bg-primary/10", "border-primary", "border-dashed", "border-2")
      },
      onDragOver: (_item, event) => {
        event.preventDefault()
        // Можно обновить визуальную индикацию
      },
    }

    const unregister = getDragDropManager().registerDropTarget(dropTargetRef.current)

    return () => {
      unregister()
      elementRef.current?.classList.remove("bg-primary/10", "border-primary", "border-dashed", "border-2")
    }
  }, [id, accepts, onDrop])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // Drop обработается через DragDropManager
  }, [])

  return {
    ref: elementRef,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }
}

/**
 * Хук для отслеживания текущего drag состояния
 */
export function useDragDropState() {
  const [currentDrag, setCurrentDrag] = useState<DraggableItem | null>(null)

  useEffect(() => {
    // Skip during SSR
    if (typeof window === "undefined") return

    const handleDragStart = (item: DraggableItem) => setCurrentDrag(item)
    const handleDragEnd = () => setCurrentDrag(null)

    const manager = getDragDropManager()
    manager.on("dragStart", handleDragStart)
    manager.on("dragEnd", handleDragEnd)
    manager.on("dragCancel", handleDragEnd)

    return () => {
      manager.off("dragStart", handleDragStart)
      manager.off("dragEnd", handleDragEnd)
      manager.off("dragCancel", handleDragEnd)
    }
  }, [])

  return currentDrag
}
