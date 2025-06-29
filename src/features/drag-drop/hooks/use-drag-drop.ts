import { useCallback, useEffect, useRef, useState } from "react"

import { DraggableItem, DraggableType, DropTarget, dragDropManager } from "../services/drag-drop-manager"

/**
 * Хук для элементов которые можно перетаскивать
 */
export function useDraggable(type: DraggableType, getData: () => any, getPreview?: () => any) {
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      const item: DraggableItem = {
        type,
        data: getData(),
        preview: getPreview?.(),
      }

      dragDropManager.startDrag(item, event.nativeEvent)
    },
    [type, getData, getPreview],
  )

  const handleDragEnd = useCallback(() => {
    // DragDropManager автоматически обработает dragend
  }, [])

  return {
    draggable: true,
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
    if (!elementRef.current) return

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

    const unregister = dragDropManager.registerDropTarget(dropTargetRef.current)

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
    const handleDragStart = (item: DraggableItem) => setCurrentDrag(item)
    const handleDragEnd = () => setCurrentDrag(null)

    dragDropManager.on("dragStart", handleDragStart)
    dragDropManager.on("dragEnd", handleDragEnd)
    dragDropManager.on("dragCancel", handleDragEnd)

    return () => {
      dragDropManager.off("dragStart", handleDragStart)
      dragDropManager.off("dragEnd", handleDragEnd)
      dragDropManager.off("dragCancel", handleDragEnd)
    }
  }, [])

  return currentDrag
}
