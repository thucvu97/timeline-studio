/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { DndContext } from "@dnd-kit/core"

import { TrackInsertionZone, TrackInsertionZones } from "../track-insertion-zone"

// Mock useDroppable hook
vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core")
  return {
    ...actual,
    useDroppable: vi.fn(() => ({
      isOver: false,
      setNodeRef: vi.fn(),
    })),
  }
})

describe("TrackInsertionZone", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders above insertion zone", () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZone position="above" insertIndex={0} />
      </DndContext>
    )
    
    expect(screen.getByText("Создать трек выше")).toBeInTheDocument()
  })

  it("renders between insertion zone", () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZone position="between" insertIndex={1} trackId="track-1" />
      </DndContext>
    )
    
    expect(screen.getByText("Создать трек между")).toBeInTheDocument()
  })

  it("renders below insertion zone", () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZone position="below" insertIndex={2} />
      </DndContext>
    )
    
    expect(screen.getByText("Создать трек ниже")).toBeInTheDocument()
  })

  it("has correct test id", () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZone position="above" insertIndex={0} />
      </DndContext>
    )
    
    expect(screen.getByTestId("track-insertion-above-none-0")).toBeInTheDocument()
  })

  it("includes trackId in test id when provided", () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZone position="between" insertIndex={1} trackId="track-1" />
      </DndContext>
    )
    
    expect(screen.getByTestId("track-insertion-between-track-1-1")).toBeInTheDocument()
  })
})

describe("TrackInsertionZones", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <TrackInsertionZones trackIds={["track-1", "track-2"]} isVisible={false} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it("renders zones when visible", () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZones trackIds={["track-1", "track-2"]} isVisible={true} />
      </DndContext>
    )
    
    // Should render: above first, between tracks, below last = 4 zones total
    expect(screen.getAllByText(/Создать трек/)).toHaveLength(4)
    expect(screen.getByText("Создать трек выше")).toBeInTheDocument()
    expect(screen.getAllByText("Создать трек между")).toHaveLength(2) // 2 tracks = 2 between zones
    expect(screen.getByText("Создать трек ниже")).toBeInTheDocument()
  })

  it("renders correct number of zones for track list", () => {
    const trackIds = ["track-1", "track-2", "track-3"]
    
    render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZones trackIds={trackIds} isVisible={true} />
      </DndContext>
    )
    
    // For 3 tracks: 1 above + 3 between + 1 below = 5 zones
    expect(screen.getAllByText(/Создать трек/)).toHaveLength(5)
  })

  it("defaults to visible when isVisible not provided", () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZones trackIds={["track-1"]} />
      </DndContext>
    )
    
    // Should render zones by default: above + between + below = 3 zones for 1 track
    expect(screen.getAllByText(/Создать трек/)).toHaveLength(3)
  })

  it("renders with custom className", () => {
    const { container } = render(
      <DndContext onDragEnd={() => {}}>
        <TrackInsertionZones trackIds={[]} isVisible={true} className="custom-class" />
      </DndContext>
    )
    
    expect(container.firstChild).toHaveClass("custom-class")
  })
})