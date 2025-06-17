/**
 * Tests for useDragDropTimeline hook
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Import mocks
import "@/test/mocks/dnd-kit"
import "../../__mocks__/hooks"

import { useDragDropTimeline } from "../../hooks/use-drag-drop-timeline"

describe("useDragDropTimeline", () => {
  describe("Hook Initialization", () => {
    it("should return object with all required properties and methods", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current).toHaveProperty("dragState")
      expect(result.current).toHaveProperty("handleDragStart")
      expect(result.current).toHaveProperty("handleDragOver")
      expect(result.current).toHaveProperty("handleDragEnd")
      expect(result.current).toHaveProperty("isValidDropTarget")
    })

    it("should initialize with correct default drag state", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current.dragState).toEqual({
        isDragging: false,
        draggedItem: null,
        dragOverTrack: null,
        dropPosition: null,
      })
    })

    it("should return functions for all event handlers", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(typeof result.current.handleDragStart).toBe("function")
      expect(typeof result.current.handleDragOver).toBe("function")
      expect(typeof result.current.handleDragEnd).toBe("function")
      expect(typeof result.current.isValidDropTarget).toBe("function")
    })
  })

  describe("Drag State Management", () => {
    it("should have isDragging false by default", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current.dragState.isDragging).toBe(false)
    })

    it("should have all drag state properties defined", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current.dragState.draggedItem).toBeNull()
      expect(result.current.dragState.dragOverTrack).toBeNull()
      expect(result.current.dragState.dropPosition).toBeNull()
    })
  })

  describe("Validation Functions", () => {
    it("should return false for isValidDropTarget when not dragging", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      const isValid = result.current.isValidDropTarget("track-1", "video")
      expect(isValid).toBe(false)
    })
  })
})