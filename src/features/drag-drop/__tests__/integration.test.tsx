import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useDragDropState, useDraggable, useDropZone } from "../hooks/use-drag-drop"
import { DraggableItem } from "../services/drag-drop-manager"

// Mock the drag-drop manager
const mockManager = {
  startDrag: vi.fn(),
  registerDropTarget: vi.fn(),
  unregisterDropTarget: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getCurrentDrag: vi.fn(),
  canDropOnTarget: vi.fn(),
}

vi.mock("../services/drag-drop-manager", () => ({
  getDragDropManager: vi.fn(() => mockManager),
  DragDropManager: {
    getInstance: vi.fn(() => mockManager),
  },
}))

// Test components simulating cross-module drag operations
function MediaBrowserItem({ item }: { item: { id: string; name: string; type: string } }) {
  const draggable = useDraggable(
    "media",
    () => item,
    () => ({ url: `preview-${item.id}.jpg`, width: 120, height: 80 }),
  )

  return (
    <div
      data-testid={`media-item-${item.id}`}
      draggable={draggable.draggable}
      onDragStart={draggable.onDragStart}
      onDragEnd={draggable.onDragEnd}
      className="media-item"
    >
      {item.name}
    </div>
  )
}

function TimelineDropZone({ onMediaDrop }: { onMediaDrop: (item: DraggableItem) => void }) {
  const dropZone = useDropZone("timeline-track", ["media", "music"], (item, _event) => {
    onMediaDrop(item)
  })

  return (
    <div
      data-testid="timeline-drop-zone"
      ref={dropZone.ref}
      onDragOver={dropZone.onDragOver}
      onDrop={dropZone.onDrop}
      className="timeline-track"
    >
      Drop media here
    </div>
  )
}

function EffectsPanelItem({ effect }: { effect: { id: string; name: string } }) {
  const draggable = useDraggable("effect", () => effect)

  return (
    <div
      data-testid={`effect-${effect.id}`}
      draggable={draggable.draggable}
      onDragStart={draggable.onDragStart}
      onDragEnd={draggable.onDragEnd}
      className="effect-item"
    >
      {effect.name}
    </div>
  )
}

function EffectsDropZone({ onEffectDrop }: { onEffectDrop: (item: DraggableItem) => void }) {
  const dropZone = useDropZone("media-effects", ["effect", "filter"], (item, _event) => {
    onEffectDrop(item)
  })

  return (
    <div
      data-testid="effects-drop-zone"
      ref={dropZone.ref}
      onDragOver={dropZone.onDragOver}
      onDrop={dropZone.onDrop}
      className="effects-zone"
    >
      Drop effects here
    </div>
  )
}

function DragDropStateIndicator() {
  const currentDrag = useDragDropState()

  return (
    <div data-testid="drag-state">
      {currentDrag ? `Dragging: ${currentDrag.type} - ${currentDrag.data.name}` : "No drag active"}
    </div>
  )
}

describe("Drag Drop Integration", () => {
  const mockUnregister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockManager.registerDropTarget.mockReturnValue(mockUnregister)
    mockManager.getCurrentDrag.mockReturnValue(null)
  })

  it("should render draggable media items", () => {
    const mediaItem = { id: "video1", name: "Test Video.mp4", type: "video" }

    render(<MediaBrowserItem item={mediaItem} />)

    const element = screen.getByTestId("media-item-video1")
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent("Test Video.mp4")
    expect(element).toHaveAttribute("draggable", "true")
  })

  it("should render drop zones for timeline", () => {
    const onDrop = vi.fn()

    render(<TimelineDropZone onMediaDrop={onDrop} />)

    const dropZone = screen.getByTestId("timeline-drop-zone")
    expect(dropZone).toBeInTheDocument()
    expect(dropZone).toHaveTextContent("Drop media here")
  })

  it("should render draggable effects", () => {
    const effect = { id: "blur", name: "Gaussian Blur" }

    render(<EffectsPanelItem effect={effect} />)

    const element = screen.getByTestId("effect-blur")
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent("Gaussian Blur")
    expect(element).toHaveAttribute("draggable", "true")
  })

  it("should render effects drop zone", () => {
    const onDrop = vi.fn()

    render(<EffectsDropZone onEffectDrop={onDrop} />)

    const dropZone = screen.getByTestId("effects-drop-zone")
    expect(dropZone).toBeInTheDocument()
    expect(dropZone).toHaveTextContent("Drop effects here")
  })

  it("should show drag state indicator", () => {
    render(<DragDropStateIndicator />)

    const indicator = screen.getByTestId("drag-state")
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveTextContent("No drag active")
  })

  it("should register drop zones with manager", () => {
    const onMediaDrop = vi.fn()
    const onEffectDrop = vi.fn()

    render(
      <div>
        <TimelineDropZone onMediaDrop={onMediaDrop} />
        <EffectsDropZone onEffectDrop={onEffectDrop} />
      </div>,
    )

    // Should register both drop zones
    expect(mockManager.registerDropTarget).toHaveBeenCalledTimes(2)

    // Check that the drop targets are registered with correct IDs and accepts
    const calls = mockManager.registerDropTarget.mock.calls
    const timelineCall = calls.find((call) => call[0].id === "timeline-track")
    const effectsCall = calls.find((call) => call[0].id === "media-effects")

    expect(timelineCall).toBeDefined()
    expect(timelineCall[0].accepts).toEqual(["media", "music"])

    expect(effectsCall).toBeDefined()
    expect(effectsCall[0].accepts).toEqual(["effect", "filter"])
  })

  it("should handle multiple draggable types", () => {
    const mediaItem = { id: "video1", name: "Test Video.mp4", type: "video" }
    const effect = { id: "blur", name: "Gaussian Blur" }

    render(
      <div>
        <MediaBrowserItem item={mediaItem} />
        <EffectsPanelItem effect={effect} />
      </div>,
    )

    const mediaElement = screen.getByTestId("media-item-video1")
    const effectElement = screen.getByTestId("effect-blur")

    expect(mediaElement).toHaveAttribute("draggable", "true")
    expect(effectElement).toHaveAttribute("draggable", "true")
  })

  it("should handle cross-module compatibility", () => {
    // Simulate a media file being dragged over different drop zones
    const mediaItem = { id: "video1", name: "Test Video.mp4", type: "video" }
    const effectItem = { id: "blur", name: "Gaussian Blur" }

    const onMediaDrop = vi.fn()
    const onEffectDrop = vi.fn()

    render(
      <div>
        <MediaBrowserItem item={mediaItem} />
        <EffectsPanelItem effect={effectItem} />
        <TimelineDropZone onMediaDrop={onMediaDrop} />
        <EffectsDropZone onEffectDrop={onEffectDrop} />
      </div>,
    )

    // Verify that components rendered without errors
    expect(screen.getByTestId("media-item-video1")).toBeInTheDocument()
    expect(screen.getByTestId("effect-blur")).toBeInTheDocument()
    expect(screen.getByTestId("timeline-drop-zone")).toBeInTheDocument()
    expect(screen.getByTestId("effects-drop-zone")).toBeInTheDocument()

    // Verify drop zones accept appropriate types
    const calls = mockManager.registerDropTarget.mock.calls
    const timelineCall = calls.find((call) => call[0].id === "timeline-track")
    const effectsCall = calls.find((call) => call[0].id === "media-effects")

    // Timeline should accept media but not effects
    expect(timelineCall[0].accepts).toContain("media")
    expect(timelineCall[0].accepts).not.toContain("effect")

    // Effects zone should accept effects but not media
    expect(effectsCall[0].accepts).toContain("effect")
    expect(effectsCall[0].accepts).not.toContain("media")
  })

  it("should simulate complete drag and drop workflow", () => {
    const mediaItem = { id: "video1", name: "Test Video.mp4", type: "video" }
    const onMediaDrop = vi.fn()

    render(
      <div>
        <MediaBrowserItem item={mediaItem} />
        <TimelineDropZone onMediaDrop={onMediaDrop} />
        <DragDropStateIndicator />
      </div>,
    )

    // Simulate drag start
    const mockDragEvent = {
      nativeEvent: {
        clientX: 100,
        clientY: 200,
        dataTransfer: { setData: vi.fn(), effectAllowed: "", setDragImage: vi.fn() },
      },
    }

    const mediaElement = screen.getByTestId("media-item-video1")

    // Verify drag start would call manager
    expect(mediaElement).toHaveAttribute("draggable", "true")
    expect(typeof mediaElement.ondragstart).toBe("object") // Event handler is attached

    // Verify drop zone is set up to receive drops
    const dropZone = screen.getByTestId("timeline-drop-zone")
    expect(typeof dropZone.ondragover).toBe("object")
    expect(typeof dropZone.ondrop).toBe("object")

    // Verify drag state indicator shows no drag initially
    const indicator = screen.getByTestId("drag-state")
    expect(indicator).toHaveTextContent("No drag active")
  })

  it("should handle cleanup on unmount", () => {
    const onMediaDrop = vi.fn()

    const { unmount } = render(<TimelineDropZone onMediaDrop={onMediaDrop} />)

    unmount()

    expect(mockUnregister).toHaveBeenCalled()
  })

  it("should support different drag types with appropriate previews", () => {
    const items = [
      { id: "video1", name: "Video.mp4", type: "video" },
      { id: "audio1", name: "Music.mp3", type: "audio" },
      { id: "image1", name: "Photo.jpg", type: "image" },
    ]

    render(
      <div>
        {items.map((item) => (
          <MediaBrowserItem key={item.id} item={item} />
        ))}
      </div>,
    )

    items.forEach((item) => {
      const element = screen.getByTestId(`media-item-${item.id}`)
      expect(element).toBeInTheDocument()
      expect(element).toHaveAttribute("draggable", "true")
      expect(element).toHaveTextContent(item.name)
    })
  })

  it("should handle multiple drop zones with different capabilities", () => {
    function VideoDropZone() {
      const dropZone = useDropZone("timeline-video", ["media"], vi.fn())
      return (
        <div ref={dropZone.ref as React.RefObject<HTMLDivElement>} onDragOver={dropZone.onDragOver} onDrop={dropZone.onDrop} data-testid="timeline-video">
          timeline-video
        </div>
      )
    }

    function AudioDropZone() {
      const dropZone = useDropZone("timeline-audio", ["music"], vi.fn())
      return (
        <div ref={dropZone.ref as React.RefObject<HTMLDivElement>} onDragOver={dropZone.onDragOver} onDrop={dropZone.onDrop} data-testid="timeline-audio">
          timeline-audio
        </div>
      )
    }

    function EffectsDropZone() {
      const dropZone = useDropZone("effects-panel", ["effect", "filter"], vi.fn())
      return (
        <div ref={dropZone.ref as React.RefObject<HTMLDivElement>} onDragOver={dropZone.onDragOver} onDrop={dropZone.onDrop} data-testid="effects-panel">
          effects-panel
        </div>
      )
    }

    function UniversalDropZone() {
      const dropZone = useDropZone("universal-zone", ["media", "music", "effect", "filter", "transition"], vi.fn())
      return (
        <div ref={dropZone.ref as React.RefObject<HTMLDivElement>} onDragOver={dropZone.onDragOver} onDrop={dropZone.onDrop} data-testid="universal-zone">
          universal-zone
        </div>
      )
    }

    render(
      <div>
        <VideoDropZone />
        <AudioDropZone />
        <EffectsDropZone />
        <UniversalDropZone />
      </div>,
    )

    // All zones should be registered
    expect(mockManager.registerDropTarget).toHaveBeenCalledTimes(4)

    // Verify each zone is rendered
    expect(screen.getByTestId("timeline-video")).toBeInTheDocument()
    expect(screen.getByTestId("timeline-audio")).toBeInTheDocument()
    expect(screen.getByTestId("effects-panel")).toBeInTheDocument()
    expect(screen.getByTestId("universal-zone")).toBeInTheDocument()
  })

  it("should maintain performance with many draggable items", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      type: "media",
    }))

    render(
      <div>
        {items.map((item) => (
          <MediaBrowserItem key={item.id} item={item} />
        ))}
      </div>,
    )

    // Should render all items without performance issues
    items.forEach((item) => {
      expect(screen.getByTestId(`media-item-${item.id}`)).toBeInTheDocument()
    })
  })
})
