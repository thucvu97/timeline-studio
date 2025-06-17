/**
 * Drag and Drop Types for Timeline
 */

import { MediaFile } from "@/features/media/types/media"

export type DragType = "video" | "audio" | "image"

export interface DragData {
  type: DragType
  mediaFile: MediaFile
}

export interface DropPosition {
  trackId: string
  startTime: number
}

export interface DragState {
  isDragging: boolean
  draggedItem: DragData | null
  dragOverTrack: string | null
  dropPosition: DropPosition | null
}

export interface TimelineDropTarget {
  trackId: string
  trackType: string
  isValidTarget: boolean
}