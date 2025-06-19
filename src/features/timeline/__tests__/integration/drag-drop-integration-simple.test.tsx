/**
 * @vitest-environment jsdom
 *
 * Простые интеграционные тесты для drag-drop функциональности Timeline
 */

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DragDropProvider } from "../../components/drag-drop-provider"
import { TrackControlsPanel } from "../../components/track-controls-panel"
import { TrackInsertionZone } from "../../components/track-insertion-zone"

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Моки для хуков
const mockAddTrack = vi.fn()
const mockUpdateTrack = vi.fn()

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: () => ({
    project: {
      id: "test-project",
      name: "Test Project",
    },
    uiState: {
      timeScale: 1,
      snapMode: "none",
      selectedTrackIds: [],
    },
    addTrack: mockAddTrack,
    updateTrack: mockUpdateTrack,
  }),
}))

vi.mock("../../hooks/use-tracks", () => ({
  useTracks: () => ({
    tracks: [
      {
        id: "video-track-1",
        name: "Video Track 1",
        type: "video",
        height: 80,
        isHidden: false,
        isLocked: false,
      },
    ],
    setTrackHeight: vi.fn(),
  }),
}))

vi.mock("../../hooks/use-drag-drop-timeline", () => ({
  useDragDropTimeline: () => ({
    dragState: {
      isDragging: false,
      draggedItem: null,
      dragOverTrack: null,
      dropPosition: null,
    },
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    isValidDropTarget: vi.fn(() => false),
    isValidDropTargetForNewTrack: vi.fn(() => false),
  }),
}))

describe("Drag-Drop Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("DragDropProvider", () => {
    it("renders children correctly", () => {
      render(
        <DragDropProvider>
          <div data-testid="test-content">Test Content</div>
        </DragDropProvider>,
      )

      expect(screen.getByTestId("test-content")).toBeInTheDocument()
    })

    it("provides DndContext with accessibility elements", () => {
      const { container } = render(
        <DragDropProvider>
          <div>Content</div>
        </DragDropProvider>,
      )

      // DndContext creates accessibility elements
      expect(container.querySelector("[aria-live]")).toBeInTheDocument()
      expect(container.querySelector("[role='status']")).toBeInTheDocument()
    })
  })

  describe("TrackControlsPanel", () => {
    it("displays track controls header", () => {
      render(<TrackControlsPanel />)

      expect(screen.getByText("Управление треками")).toBeInTheDocument()
      // The track count is displayed in a paragraph like "1 трек"
      const trackCountElement = screen.getByText((_content, element) => {
        return element?.textContent === "1 трек"
      })
      expect(trackCountElement).toBeInTheDocument()
    })

    it("displays add track buttons", () => {
      render(<TrackControlsPanel />)

      expect(screen.getByText("Видео")).toBeInTheDocument()
      expect(screen.getByText("Аудио")).toBeInTheDocument()
      expect(screen.getByText("Изображения")).toBeInTheDocument()
    })

    it("displays track information", () => {
      render(<TrackControlsPanel />)

      expect(screen.getByText("Video Track 1")).toBeInTheDocument()
      expect(screen.getByText("80px")).toBeInTheDocument()
    })
  })

  describe("TrackInsertionZone", () => {
    it("renders a single insertion zone", () => {
      const { container } = render(<TrackInsertionZone position="above" insertIndex={0} />)

      // The zone should render with data-testid
      expect(container.firstChild).toBeInTheDocument()
      expect(container.firstChild).toHaveAttribute("data-testid", "track-insertion-above-none-0")
    })

    it("displays hover effect text", () => {
      render(<TrackInsertionZone position="between" trackId="track-1" insertIndex={1} />)

      // Should show the correct insertion text based on position
      expect(screen.getByText("Создать трек между")).toBeInTheDocument()
    })

    it("applies correct classes based on position", () => {
      const { container } = render(<TrackInsertionZone position="below" insertIndex={2} className="custom-class" />)

      const zone = container.firstChild
      expect(zone).toHaveClass("custom-class")
      expect(zone).toHaveClass("group")
    })
  })
})
