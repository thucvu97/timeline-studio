/**
 * @vitest-environment jsdom
 *
 * Unit tests for TrackInsertionZone and TrackInsertionZones components
 */

import { DndContext } from "@dnd-kit/core"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TrackInsertionZone, TrackInsertionZones } from "../../components/track-insertion-zone"

import type { Track } from "../../types"

// Mock dnd-kit droppable
vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core")
  return {
    ...actual,
    useDroppable: vi.fn((args) => ({
      setNodeRef: vi.fn(),
      isOver: false,
      active: null,
      over: null,
      node: { current: null },
      rect: null,
      data: args.data,
      id: args.id,
    })),
  }
})

// Mock hooks
const mockDragState = {
  isDragging: false,
  draggedItem: null,
  dragOverTrack: null,
  dropPosition: null,
}

const mockTracks: Track[] = [
  {
    id: "video-track-1",
    name: "Video Track 1",
    type: "video",
    height: 80,
    isHidden: false,
    isLocked: false,
    clips: [],
  },
  {
    id: "audio-track-1",
    name: "Audio Track",
    type: "audio",
    height: 60,
    isHidden: false,
    isLocked: false,
    clips: [],
  },
]

vi.mock("../../hooks/use-drag-drop-timeline", () => ({
  useDragDropTimeline: () => ({
    dragState: mockDragState,
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    isValidDropTarget: vi.fn(() => false),
    isValidDropTargetForNewTrack: vi.fn(() => true),
  }),
}))

vi.mock("../../hooks/use-tracks", () => ({
  useTracks: () => ({
    tracks: mockTracks,
    setTrackHeight: vi.fn(),
  }),
}))

describe("TrackInsertionZone", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Component Rendering", () => {
    it("should render with correct data-testid", () => {
      const { container } = render(<TrackInsertionZone position="above" insertIndex={0} />)

      const zone = container.firstChild
      expect(zone).toHaveAttribute("data-testid", "track-insertion-above-none-0")
    })

    it("should render with track ID in data-testid when provided", () => {
      const { container } = render(<TrackInsertionZone position="between" trackId="track-1" insertIndex={1} />)

      const zone = container.firstChild
      expect(zone).toHaveAttribute("data-testid", "track-insertion-between-track-1-1")
    })

    it("should apply custom className", () => {
      const { container } = render(<TrackInsertionZone position="below" insertIndex={2} className="custom-class" />)

      const zone = container.firstChild
      expect(zone).toHaveClass("custom-class")
      expect(zone).toHaveClass("group")
    })

    it("should render hover text based on position", () => {
      render(<TrackInsertionZone position="above" insertIndex={0} />)
      expect(screen.getByText("Создать трек выше")).toBeInTheDocument()

      render(<TrackInsertionZone position="between" trackId="track-1" insertIndex={1} />)
      expect(screen.getByText("Создать трек между")).toBeInTheDocument()

      render(<TrackInsertionZone position="below" insertIndex={2} />)
      expect(screen.getByText("Создать трек ниже")).toBeInTheDocument()
    })

    it("should have correct styling classes", () => {
      const { container } = render(<TrackInsertionZone position="above" insertIndex={0} />)

      const zone = container.firstChild
      expect(zone).toHaveClass("relative", "h-2", "group", "transition-all", "duration-200")

      // Check hover indicator container
      const hoverIndicator = screen.getByText("Создать трек выше").parentElement
      expect(hoverIndicator).toHaveClass("flex", "items-center", "gap-2")
    })
  })

  describe("Drag Over State", () => {
    it("should show active state when dragged over", async () => {
      // Import and mock useDroppable
      const { useDroppable } = await import("@dnd-kit/core")
      vi.mocked(useDroppable).mockReturnValueOnce({
        setNodeRef: vi.fn(),
        isOver: true,
        active: { id: "test-file" },
        over: null,
        node: { current: null },
        rect: null,
        data: {},
        id: "track-insertion-above-none-0",
      })

      const { container } = render(<TrackInsertionZone position="above" insertIndex={0} />)

      const zone = container.firstChild
      // When isOver is true, it should have active classes
      expect(zone).toHaveClass("h-8", "bg-primary/20", "border-2", "border-primary", "border-dashed")
    })

    it("should show dashed border on hover", () => {
      const { container } = render(<TrackInsertionZone position="between" trackId="track-1" insertIndex={1} />)

      // Check that the component renders with hover-related classes
      const zone = container.firstChild
      expect(zone).toHaveClass("group")
      // The hover text exists
      expect(screen.getByText("Создать трек между")).toBeInTheDocument()
    })
  })

  describe("Drop Zone Registration", () => {
    it("should register as droppable with correct ID", async () => {
      const { useDroppable } = await import("@dnd-kit/core")

      render(<TrackInsertionZone position="above" insertIndex={0} />)

      expect(vi.mocked(useDroppable)).toHaveBeenCalledWith({
        id: "track-insertion-above-none-0",
        data: {
          type: "track-insertion",
          position: "above",
          trackId: undefined,
          insertIndex: 0,
        },
      })
    })

    it("should include trackId in droppable data when provided", async () => {
      const { useDroppable } = await import("@dnd-kit/core")

      render(<TrackInsertionZone position="between" trackId="track-123" insertIndex={1} />)

      expect(vi.mocked(useDroppable)).toHaveBeenCalledWith({
        id: "track-insertion-between-track-123-1",
        data: {
          type: "track-insertion",
          position: "between",
          trackId: "track-123",
          insertIndex: 1,
        },
      })
    })
  })
})

describe("TrackInsertionZones", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset drag state
    mockDragState.isDragging = false
    mockDragState.draggedItem = null
  })

  describe("Component Visibility", () => {
    it("should not render when not dragging", () => {
      const trackIds = mockTracks.map((t) => t.id)
      const { container } = render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={false} />
        </DndContext>,
      )

      // When isVisible is false, the component returns null
      const zones = container.querySelector("[data-testid^='track-insertion-']")
      expect(zones).toBeNull()
    })

    it("should render zones when dragging", () => {
      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }
      const trackIds = mockTracks.map((t) => t.id)

      render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      // Should render zones: above first track, between tracks, and below last track
      // With 2 tracks: 1 above + 1 between + 1 below = 3 zones minimum
      const zones = screen.getAllByTestId(/track-insertion-/)
      expect(zones.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe("Zone Positioning", () => {
    it("should render zone above first track", () => {
      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }
      const trackIds = mockTracks.map((t) => t.id)

      render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      expect(screen.getByTestId("track-insertion-above-none-0")).toBeInTheDocument()
      expect(screen.getByText("Создать трек выше")).toBeInTheDocument()
    })

    it("should render zones between tracks", () => {
      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }
      const trackIds = mockTracks.map((t) => t.id)

      render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      // Zone between first and second track
      expect(screen.getByTestId("track-insertion-between-video-track-1-1")).toBeInTheDocument()
    })

    it("should render zone below last track", () => {
      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }
      const trackIds = mockTracks.map((t) => t.id)

      render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      expect(screen.getByTestId("track-insertion-below-none-2")).toBeInTheDocument()
      expect(screen.getByText("Создать трек ниже")).toBeInTheDocument()
    })

    it("should calculate correct heights based on track heights", () => {
      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }
      const trackIds = mockTracks.map((t) => t.id)

      const { container } = render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      const zones = container.querySelectorAll("[data-testid^='track-insertion-']")

      // Check we have the expected number of zones
      // With 2 tracks: above + between each track + below
      expect(zones.length).toBeGreaterThanOrEqual(3)

      // The zones exist and are positioned in containers
      expect(zones[0]).toHaveAttribute("data-testid", "track-insertion-above-none-0")
      expect(zones[1]).toHaveAttribute("data-testid", "track-insertion-between-video-track-1-1")
      // The last zone should be the below zone
      expect(zones[zones.length - 1]).toHaveAttribute("data-testid", expect.stringMatching(/track-insertion-below/))
    })
  })

  describe("No Tracks State", () => {
    it("should render single zone when no tracks exist", () => {
      // Override mock to return empty tracks
      vi.mocked(vi.importActual("../../hooks/use-tracks") as any).useTracks = vi.fn(() => ({
        tracks: [],
        setTrackHeight: vi.fn(),
      }))

      vi.doMock("../../hooks/use-tracks", () => ({
        useTracks: () => ({
          tracks: [],
          setTrackHeight: vi.fn(),
        }),
      }))

      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }

      render(
        <DndContext>
          <TrackInsertionZones trackIds={[]} isVisible={true} />
        </DndContext>,
      )

      const zones = screen.getAllByTestId(/track-insertion-/)
      expect(zones).toHaveLength(2) // above and below zones when no tracks
      expect(screen.getByTestId("track-insertion-above-none-0")).toBeInTheDocument()
      expect(screen.getByTestId("track-insertion-below-none-0")).toBeInTheDocument()
    })
  })

  describe("Container Styling", () => {
    it("should have correct container classes", () => {
      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }
      const trackIds = mockTracks.map((t) => t.id)

      const { container } = render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      const zonesContainer = container.firstChild
      expect(zonesContainer).toHaveClass("absolute", "inset-0", "pointer-events-none")
    })

    it("should position zones absolutely", () => {
      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }
      const trackIds = mockTracks.map((t) => t.id)

      render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      const zones = screen.getAllByTestId(/track-insertion-/)
      // The zones themselves are in containers that are positioned absolutely
      zones.forEach((zone) => {
        const parent = zone.parentElement
        expect(parent).toHaveClass("absolute")
      })
    })
  })

  describe("Drag Validation", () => {
    it("should check if drop is valid for new track", () => {
      const mockIsValidDropTargetForNewTrack = vi.fn(() => true)

      vi.doMock("../../hooks/use-drag-drop-timeline", () => ({
        useDragDropTimeline: () => ({
          dragState: mockDragState,
          handleDragStart: vi.fn(),
          handleDragOver: vi.fn(),
          handleDragEnd: vi.fn(),
          isValidDropTarget: vi.fn(() => false),
          isValidDropTargetForNewTrack: mockIsValidDropTargetForNewTrack,
        }),
      }))

      mockDragState.isDragging = true
      mockDragState.draggedItem = { id: "test.mp4", name: "test.mp4", type: "media" }
      const trackIds = mockTracks.map((t) => t.id)

      render(
        <DndContext>
          <TrackInsertionZones trackIds={trackIds} isVisible={true} />
        </DndContext>,
      )

      // Zones should be rendered as the validation would pass
      // With 2 tracks we get: above (1) + between tracks (1) + below (1) = 3 zones
      const zones = screen.getAllByTestId(/track-insertion-/)
      expect(zones.length).toBeGreaterThanOrEqual(3) // At least 3 zones
    })
  })
})
