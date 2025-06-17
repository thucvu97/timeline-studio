/**
 * Main hook for Timeline drag and drop functionality
 */

import { useCallback, useState } from "react"

import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core"

import { useTimeline } from "./use-timeline"
import { useTimelineActions } from "./use-timeline-actions"
import { DragData, DragState } from "../types/drag-drop"
import {
  calculateTimelinePosition,
  canDropOnTrack,
  findInsertionPoint,
  snapToGrid,
} from "../utils/drag-calculations"

export interface UseDragDropTimelineReturn {
  dragState: DragState
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  isValidDropTarget: (trackId: string, trackType: string) => boolean
}

export function useDragDropTimeline(): UseDragDropTimelineReturn {
  const { uiState } = useTimeline()
  const { addSingleMediaToTimeline } = useTimelineActions()

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverTrack: null,
    dropPosition: null,
  })

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const dragData = active.data.current as DragData | undefined

    if (dragData) {
      setDragState({
        isDragging: true,
        draggedItem: dragData,
        dragOverTrack: null,
        dropPosition: null,
      })

      console.log("[DragDrop] Drag started:", dragData.mediaFile.name)
    }
  }, [])

  // Handle drag over (for visual feedback)
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event

      if (!over || !dragState.draggedItem) {
        setDragState((prev) => ({
          ...prev,
          dragOverTrack: null,
          dropPosition: null,
        }))
        return
      }

      const dragData = active.data.current as DragData
      const dropData = over.data.current as { trackId: string; trackType: string } | undefined

      if (!dropData || !dragData) {
        return
      }

      // Check if this is a valid drop target
      const isValid = canDropOnTrack(dragData.mediaFile, dropData.trackType as any)

      if (isValid) {
        // Calculate drop position based on mouse position
        const mouseX = (event.activatorEvent as MouseEvent).clientX
        const trackElement = document.querySelector(`[data-track-id="${dropData.trackId}"]`)
        
        if (trackElement) {
          const rect = trackElement.getBoundingClientRect()
          const scrollLeft = trackElement.scrollLeft || 0
          
          let timePosition = calculateTimelinePosition(
            mouseX,
            rect,
            scrollLeft,
            uiState.timeScale
          )

          // Apply snapping if enabled
          timePosition = snapToGrid(timePosition, uiState.snapMode)

          // Find insertion point (avoiding overlaps)
          const insertionTime = findInsertionPoint(
            timePosition,
            dropData.trackId,
            dragData.mediaFile.duration || 10
          )

          setDragState((prev) => ({
            ...prev,
            dragOverTrack: dropData.trackId,
            dropPosition: {
              trackId: dropData.trackId,
              startTime: insertionTime,
            },
          }))
        }
      } else {
        setDragState((prev) => ({
          ...prev,
          dragOverTrack: null,
          dropPosition: null,
        }))
      }
    },
    [dragState.draggedItem, uiState.timeScale, uiState.snapMode]
  )

  // Handle drag end (actual drop)
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && dragState.draggedItem && dragState.dropPosition) {
        const dragData = active.data.current as DragData
        const dropData = over.data.current as { trackId: string; trackType: string } | undefined

        if (dropData && dragData) {
          const isValid = canDropOnTrack(dragData.mediaFile, dropData.trackType as any)

          if (isValid) {
            console.log(
              "[DragDrop] Dropping media:",
              dragData.mediaFile.name,
              "on track:",
              dropData.trackId,
              "at time:",
              dragState.dropPosition.startTime
            )

            // Use enhanced timeline action with custom positioning
            addSingleMediaToTimeline(
              dragData.mediaFile,
              dragState.dropPosition.trackId,
              dragState.dropPosition.startTime
            )
          }
        }
      }

      // Reset drag state
      setDragState({
        isDragging: false,
        draggedItem: null,
        dragOverTrack: null,
        dropPosition: null,
      })

      console.log("[DragDrop] Drag ended")
    },
    [dragState.draggedItem, dragState.dropPosition, addSingleMediaToTimeline]
  )

  // Check if a track is a valid drop target for the current drag
  const isValidDropTarget = useCallback(
    (trackId: string, trackType: string) => {
      if (!dragState.isDragging || !dragState.draggedItem) {
        return false
      }

      return canDropOnTrack(dragState.draggedItem.mediaFile, trackType as any)
    },
    [dragState.isDragging, dragState.draggedItem]
  )

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isValidDropTarget,
  }
}