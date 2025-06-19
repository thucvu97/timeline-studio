/**
 * Main hook for Timeline drag and drop functionality
 */

import { useCallback, useState } from "react"

import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core"

import { TrackType } from "../types"
import { useTimeline } from "./use-timeline"
import { useTimelineActions } from "./use-timeline-actions"
import { DragData, DragState } from "../types/drag-drop"
import {
  calculateTimelinePosition,
  canDropOnTrack,
  findInsertionPoint,
  getTrackTypeForMediaFile,
  snapToGrid,
} from "../utils/drag-calculations"

export interface UseDragDropTimelineReturn {
  dragState: DragState
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  isValidDropTarget: (trackId: string, trackType: string) => boolean
  isValidDropTargetForNewTrack: (expectedTrackType?: TrackType) => boolean
}

export function useDragDropTimeline(): UseDragDropTimelineReturn {
  const { uiState } = useTimeline()
  const { addSingleMediaToTimeline } = useTimelineActions()
  const { addTrack } = useTimeline()

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
      const dropData = over.data.current as any

      if (!dropData || !dragData) {
        return
      }

      // Handle track insertion zones
      if (dropData.type === "track-insertion") {
        const expectedTrackType = getTrackTypeForMediaFile(dragData.mediaFile)
        setDragState((prev) => ({
          ...prev,
          dragOverTrack: null,
          dropPosition: {
            type: "track-insertion",
            insertIndex: dropData.insertIndex,
            trackType: expectedTrackType,
            startTime: 0,
          } as any,
        }))
        return
      }

      // Handle existing track drops
      if (dropData.trackId && dropData.trackType) {
        // Check if this is a valid drop target
        const isValid = canDropOnTrack(dragData.mediaFile, dropData.trackType)

        if (isValid) {
          // Calculate drop position based on mouse position
          const mouseX = (event.activatorEvent as MouseEvent).clientX
          const trackElement = document.querySelector(`[data-track-id="${dropData.trackId}"]`)

          if (trackElement) {
            const rect = trackElement.getBoundingClientRect()
            const scrollLeft = trackElement.scrollLeft || 0

            let timePosition = calculateTimelinePosition(mouseX, rect, scrollLeft, uiState.timeScale)

            // Apply snapping if enabled
            timePosition = snapToGrid(timePosition, uiState.snapMode)

            // Find insertion point (avoiding overlaps)
            const insertionTime = findInsertionPoint(timePosition, dropData.trackId, dragData.mediaFile.duration || 10)

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
      }
    },
    [dragState.draggedItem, uiState.timeScale, uiState.snapMode],
  )

  // Handle drag end (actual drop)
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && dragState.draggedItem && dragState.dropPosition) {
        const dragData = active.data.current as DragData
        const dropData = over.data.current as any

        if (dropData && dragData) {
          // Handle track insertion (create new track)
          if (dropData.type === "track-insertion") {
            const trackType = getTrackTypeForMediaFile(dragData.mediaFile)
            const trackName = `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track`

            console.log("[DragDrop] Creating new track:", trackName, "for media:", dragData.mediaFile.name)

            // Create new track and add media to it
            addTrack(trackType as any, undefined, trackName)

            // TODO: We need to get the newly created track ID to add the media
            // For now, we'll add it to the first compatible track
            // This needs to be improved with proper track creation callback
            setTimeout(() => {
              addSingleMediaToTimeline(dragData.mediaFile, undefined, 0)
            }, 100)
          } else if (dropData.trackId && dropData.trackType) {
            // Handle existing track drop
            const isValid = canDropOnTrack(dragData.mediaFile, dropData.trackType)

            if (isValid) {
              console.log(
                "[DragDrop] Dropping media:",
                dragData.mediaFile.name,
                "on track:",
                dropData.trackId,
                "at time:",
                dragState.dropPosition.startTime,
              )

              // Use enhanced timeline action with custom positioning
              addSingleMediaToTimeline(
                dragData.mediaFile,
                dragState.dropPosition.trackId,
                dragState.dropPosition.startTime,
              )
            }
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
    [dragState.draggedItem, dragState.dropPosition, addSingleMediaToTimeline, addTrack],
  )

  // Check if a track is a valid drop target for the current drag
  const isValidDropTarget = useCallback(
    (_trackId: string, trackType: string) => {
      if (!dragState.isDragging || !dragState.draggedItem) {
        return false
      }

      return canDropOnTrack(dragState.draggedItem.mediaFile, trackType as any)
    },
    [dragState.isDragging, dragState.draggedItem],
  )

  // Check if a track insertion zone is valid for the current drag
  const isValidDropTargetForNewTrack = useCallback(
    (expectedTrackType?: TrackType) => {
      if (!dragState.isDragging || !dragState.draggedItem) {
        return false
      }

      const requiredTrackType = getTrackTypeForMediaFile(dragState.draggedItem.mediaFile)

      // If no expected track type is specified, any media can create a new track
      if (!expectedTrackType) {
        return true
      }

      // Check if the expected track type matches what the media file requires
      return requiredTrackType === expectedTrackType
    },
    [dragState.isDragging, dragState.draggedItem],
  )

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isValidDropTarget,
    isValidDropTargetForNewTrack,
  }
}
