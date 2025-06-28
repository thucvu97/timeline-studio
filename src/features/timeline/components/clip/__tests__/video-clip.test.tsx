/**
 * Tests for VideoClip component
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TimelineClip, TimelineTrack, TrackType } from "../../../types"
import { VideoClip } from "../video-clip"

// Mock data
const mockVideoClip: TimelineClip = {
  id: "clip-1",
  trackId: "track-1",
  mediaId: "media-1",
  name: "Test Video Clip",
  startTime: 0,
  duration: 10,
  trimStart: 0,
  trimEnd: 10,
  mediaStartTime: 0,
  mediaEndTime: 10,
  volume: 1,
  speed: 1,
  opacity: 1,
  isReversed: false,
  isSelected: false,
  isLocked: false,
  effects: [],
  filters: [],
  transitions: [],
  position: {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
}

const mockVideoTrack: TimelineTrack = {
  id: "track-1",
  name: "Video Track",
  type: "video" as TrackType,
  order: 0,
  enabled: true,
  locked: false,
  height: 80,
  clips: [],
}

const mockImageTrack: TimelineTrack = {
  ...mockVideoTrack,
  type: "image" as TrackType,
  name: "Image Track",
}

describe("VideoClip", () => {
  const mockOnUpdate = vi.fn()
  const mockOnRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render video clip with correct name and icon", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      expect(screen.getByText("Test Video Clip")).toBeInTheDocument()
      expect(screen.getByText("10s")).toBeInTheDocument()
    })

    it("should render image clip with image icon", () => {
      render(<VideoClip clip={mockVideoClip} track={mockImageTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      expect(screen.getByText("Test Video Clip")).toBeInTheDocument()
    })

    it("should apply correct colors for video track", () => {
      const { container } = render(
        <VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      const clipElement = container.firstChild
      expect(clipElement).toHaveClass("bg-blue-500")
    })

    it("should apply correct colors for image track", () => {
      const { container } = render(
        <VideoClip clip={mockVideoClip} track={mockImageTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      const clipElement = container.firstChild
      expect(clipElement).toHaveClass("bg-purple-500")
    })
  })

  describe("Selection", () => {
    it("should call onUpdate when clicked", () => {
      const { container } = render(
        <VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      fireEvent.click(container.firstChild!)
      expect(mockOnUpdate).toHaveBeenCalledWith({ isSelected: true })
    })

    it("should toggle selection state", () => {
      const selectedClip = { ...mockVideoClip, isSelected: true }
      const { container } = render(
        <VideoClip clip={selectedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      fireEvent.click(container.firstChild!)
      expect(mockOnUpdate).toHaveBeenCalledWith({ isSelected: false })
    })

    it("should show selection ring when selected", () => {
      const selectedClip = { ...mockVideoClip, isSelected: true }
      const { container } = render(
        <VideoClip clip={selectedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(container.firstChild).toHaveClass("ring-2")
    })
  })

  describe("Hover Effects", () => {
    it("should show action buttons on hover", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      // Initially buttons should not be visible
      expect(screen.queryByTitle("Копировать")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Разделить")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Удалить")).not.toBeInTheDocument()

      // Hover over the clip
      const clipElement = screen.getByText("Test Video Clip").closest("div")!
      fireEvent.mouseEnter(clipElement.parentElement!)

      // Buttons should be visible
      expect(screen.getByTitle("Копировать")).toBeInTheDocument()
      expect(screen.getByTitle("Разделить")).toBeInTheDocument()
      expect(screen.getByTitle("Удалить")).toBeInTheDocument()
    })

    it("should hide action buttons on mouse leave", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")!

      // Hover and then leave
      fireEvent.mouseEnter(clipElement.parentElement!)
      fireEvent.mouseLeave(clipElement.parentElement!)

      // Buttons should not be visible
      expect(screen.queryByTitle("Копировать")).not.toBeInTheDocument()
    })

    it("should not show buttons when clip is locked", () => {
      const lockedClip = { ...mockVideoClip, isLocked: true }
      render(<VideoClip clip={lockedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")!
      fireEvent.mouseEnter(clipElement.parentElement!)

      // Buttons should not be visible
      expect(screen.queryByTitle("Копировать")).not.toBeInTheDocument()
    })

    it("should show resize handles on hover", () => {
      const { container } = render(
        <VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      fireEvent.mouseEnter(container.firstChild as Element)

      const resizeHandles = container.querySelectorAll(".cursor-w-resize, .cursor-e-resize")
      expect(resizeHandles).toHaveLength(2)
    })
  })

  describe("Action Buttons", () => {
    it("should handle copy button click", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")!
      fireEvent.mouseEnter(clipElement.parentElement!)

      const copyButton = screen.getByTitle("Копировать")
      fireEvent.click(copyButton)

      expect(consoleSpy).toHaveBeenCalledWith("Copy clip:", "clip-1")
      consoleSpy.mockRestore()
    })

    it("should handle split button click", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")!
      fireEvent.mouseEnter(clipElement.parentElement!)

      const splitButton = screen.getByTitle("Разделить")
      fireEvent.click(splitButton)

      expect(consoleSpy).toHaveBeenCalledWith("Split clip:", "clip-1")
      consoleSpy.mockRestore()
    })

    it("should handle remove button click", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")!
      fireEvent.mouseEnter(clipElement.parentElement!)

      const removeButton = screen.getByTitle("Удалить")
      fireEvent.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalled()
    })

    it("should stop propagation on button clicks", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")!
      fireEvent.mouseEnter(clipElement.parentElement!)

      const removeButton = screen.getByTitle("Удалить")
      fireEvent.click(removeButton)

      // onUpdate should not be called (selection should not change)
      expect(mockOnUpdate).not.toHaveBeenCalled()
    })
  })

  describe("Visual Indicators", () => {
    it("should show effects indicator", () => {
      const clipWithEffects = {
        ...mockVideoClip,
        effects: [{ id: "effect-1", type: "blur" }],
      }

      render(
        <VideoClip clip={clipWithEffects} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByTitle("Эффекты применены")).toBeInTheDocument()
    })

    it("should show filters indicator", () => {
      const clipWithFilters = {
        ...mockVideoClip,
        filters: [{ id: "filter-1", type: "brightness" }],
      }

      render(
        <VideoClip clip={clipWithFilters} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByTitle("Фильтры применены")).toBeInTheDocument()
    })

    it("should show transitions indicator", () => {
      const clipWithTransitions = {
        ...mockVideoClip,
        transitions: [{ id: "transition-1", type: "fade" }],
      }

      render(
        <VideoClip clip={clipWithTransitions} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByTitle("Переходы применены")).toBeInTheDocument()
    })

    it("should show opacity when locked", () => {
      const lockedClip = { ...mockVideoClip, isLocked: true }
      const { container } = render(
        <VideoClip clip={lockedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(container.firstChild).toHaveClass("opacity-60")
    })
  })

  describe("Progress Bar", () => {
    it("should calculate trim progress correctly", () => {
      const trimmedClip = {
        ...mockVideoClip,
        mediaStartTime: 5,
        mediaEndTime: 15,
        duration: 5,
      }

      const { container } = render(
        <VideoClip clip={trimmedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      const progressBar = container.querySelector(".h-1.bg-black\\/30 > div")
      expect(progressBar).toHaveStyle({
        marginLeft: "33.33333333333333%",
        width: "33.33333333333333%",
      })
    })
  })

  describe("Edge Cases", () => {
    it("should handle clip without name", () => {
      const clipWithoutName = { ...mockVideoClip, name: "" }
      render(
        <VideoClip clip={clipWithoutName} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      // Should not throw error
      expect(screen.getByText("10s")).toBeInTheDocument()
    })

    it("should handle zero duration", () => {
      const zeroDurationClip = { ...mockVideoClip, duration: 0 }
      render(
        <VideoClip clip={zeroDurationClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByText("0s")).toBeInTheDocument()
    })

    it("should handle missing callbacks", () => {
      const { container } = render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} />)

      // Should not throw when clicking without callbacks
      expect(() => fireEvent.click(container.firstChild!)).not.toThrow()
    })
  })
})
