/**
 * Drag and Drop Types for Timeline
 */

import type { MediaFile } from "@/features/media/types/media"

export type DragType = "video" | "audio" | "image"

export interface DragData {
  type: DragType
  mediaFile: MediaFile
  // Для multi-select drag & drop
  isMultiSelect?: boolean
  selectedFiles?: MediaFile[]
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
  // Для multi-select визуализации
  draggedCount?: number
  // Для snap feedback
  snapPoint?: any | null
  snapActive?: boolean
}

export interface TimelineDropTarget {
  trackId: string
  trackType: string
  isValidTarget: boolean
}
