/**
 * Tests for VideoClip component
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Мокаем backend-sync ДО импорта компонентов
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: () => ({
    onStateChange: vi.fn(() => () => {}),
    sendCommand: vi.fn().mockResolvedValue(undefined),
    executeCommand: vi.fn().mockResolvedValue({ success: true }),
    onEvent: vi.fn(() => () => {}),
  }),
}))

// Мокаем useUserSettings
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    playerVolume: 100,
    handlePlayerVolumeChange: vi.fn(),
  }),
}))

// Мокаем timeline-player-sync
vi.mock("../../../services/timeline-player-sync", () => ({
  timelinePlayerSync: {
    syncSelectedClip: vi.fn().mockResolvedValue(undefined),
  },
}))

// Мокаем useTimeline
const mockTimelineActor = {
  send: vi.fn(),
}

const mockUiState = {
  context: {
    selectedClipIds: [],
    currentTime: 0,
  },
}

const mockTimeline = {
  timelineActor: mockTimelineActor,
  uiState: mockUiState,
  selectClips: vi.fn(),
  copySelection: vi.fn(),
  splitClip: vi.fn(),
}

vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => mockTimeline,
}))

import { VideoClip } from "../../../components/clip/video-clip"
import type { TimelineClip, TimelineTrack, TrackType } from "../../../types"

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
    // Сбрасываем моки timeline
    mockTimeline.selectClips.mockClear()
    mockTimeline.copySelection.mockClear()
    mockTimeline.splitClip.mockClear()
    mockTimelineActor.send.mockClear()
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
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.click(clipElement!)

      expect(mockOnUpdate).toHaveBeenCalledWith({ isSelected: true })
    })

    it("should toggle selection state", () => {
      const selectedClip = { ...mockVideoClip, isSelected: true }
      render(<VideoClip clip={selectedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.click(clipElement!)

      expect(mockOnUpdate).toHaveBeenCalledWith({ isSelected: false })
    })

    it("should show selection ring when selected", () => {
      const selectedClip = { ...mockVideoClip, isSelected: true }
      const { container } = render(
        <VideoClip clip={selectedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      const clipElement = container.firstChild
      expect(clipElement).toHaveClass("ring-2")
    })
  })

  describe("Hover Effects", () => {
    it("should show action buttons on hover", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.mouseEnter(clipElement!)

      expect(screen.getByTitle("Копировать")).toBeInTheDocument()
      expect(screen.getByTitle("Разделить")).toBeInTheDocument()
      expect(screen.getByTitle("Удалить")).toBeInTheDocument()
    })

    it("should hide action buttons on mouse leave", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.mouseEnter(clipElement!)
      fireEvent.mouseLeave(clipElement!)

      expect(screen.queryByTitle("Копировать")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Разделить")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Удалить")).not.toBeInTheDocument()
    })

    it("should not show buttons when clip is locked", () => {
      const lockedClip = { ...mockVideoClip, isLocked: true }
      render(<VideoClip clip={lockedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.mouseEnter(clipElement!)

      expect(screen.queryByTitle("Копировать")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Разделить")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Удалить")).not.toBeInTheDocument()
    })

    it("should show resize handles on hover", () => {
      const { container } = render(
        <VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.mouseEnter(clipElement!)

      // В новой реализации ручки отображаются как дивы с классами cursor-*-resize
      const leftHandle = container.querySelector(".cursor-w-resize")
      const rightHandle = container.querySelector(".cursor-e-resize")

      expect(leftHandle).toBeInTheDocument()
      expect(rightHandle).toBeInTheDocument()
    })
  })

  describe("Action Buttons", () => {
    it("should handle copy button click", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.mouseEnter(clipElement!)

      const copyButton = screen.getByTitle("Копировать")
      fireEvent.click(copyButton)

      // Проверяем что были вызваны правильные методы
      expect(mockTimeline.selectClips).toHaveBeenCalledWith(["clip-1"], false)
      expect(mockTimeline.copySelection).toHaveBeenCalled()
    })

    it("should handle split button click", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.mouseEnter(clipElement!)

      const splitButton = screen.getByTitle("Разделить")
      fireEvent.click(splitButton)

      // Проверяем что был вызван метод разделения
      expect(mockTimeline.splitClip).toHaveBeenCalledWith("clip-1", 5) // clip.startTime + clip.duration / 2 = 0 + 10 / 2 = 5
    })

    it("should handle remove button click", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.mouseEnter(clipElement!)

      const removeButton = screen.getByTitle("Удалить")
      fireEvent.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalled()
    })

    it("should stop propagation on button clicks", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.mouseEnter(clipElement!)

      const removeButton = screen.getByTitle("Удалить")
      fireEvent.click(removeButton)

      // Should not trigger clip selection
      expect(mockOnUpdate).not.toHaveBeenCalled()
    })
  })

  describe("Visual Indicators", () => {
    it("should show effects indicator", () => {
      const clipWithEffects = {
        ...mockVideoClip,
        effects: [{ id: "effect-1", name: "Blur", params: {} }],
      }
      render(
        <VideoClip clip={clipWithEffects} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByTitle("Эффекты применены")).toBeInTheDocument()
    })

    it("should show filters indicator", () => {
      const clipWithFilters = {
        ...mockVideoClip,
        filters: [{ id: "filter-1", name: "Vintage", value: "vintage" }],
      }
      render(
        <VideoClip clip={clipWithFilters} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByTitle("Фильтры применены")).toBeInTheDocument()
    })

    it("should show transitions indicator", () => {
      const clipWithTransitions = {
        ...mockVideoClip,
        transitions: [{ id: "transition-1", name: "Fade", duration: 1000 }],
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

      const clipElement = container.firstChild
      expect(clipElement).toHaveClass("opacity-60")
    })
  })

  describe("Progress Bar", () => {
    it("should calculate trim progress correctly", () => {
      const trimmedClip = {
        ...mockVideoClip,
        trimStart: 2,
        trimEnd: 8,
        mediaStartTime: 2,
        mediaEndTime: 8,
      }
      const { container } = render(
        <VideoClip clip={trimmedClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      // В новой реализации прогресс бар - это просто div с белым фоном
      const progressBars = container.getElementsByClassName("bg-white/50")
      expect(progressBars).toHaveLength(1)
      const progressBar = progressBars[0]

      // Проверяем вычисления
      // width = duration / (mediaEndTime - mediaStartTime + duration) * 100
      // width = 10 / (8 - 2 + 10) * 100 = 10 / 16 * 100 = 62.5%
      expect(progressBar).toHaveStyle({ width: "62.5%" })
    })
  })

  describe("Edge Cases", () => {
    it("should handle clip without name", () => {
      const clipWithoutName = { ...mockVideoClip, name: "" }
      const { container } = render(
        <VideoClip clip={clipWithoutName} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      // Клип должен отображаться, даже без имени
      expect(screen.getByText("10s")).toBeInTheDocument()

      // Проверяем, что есть элемент с классом truncate, но он может быть пустым
      const nameElements = container.querySelectorAll(".truncate")
      expect(nameElements.length).toBeGreaterThan(0)
      // Проверяем, что хотя бы один элемент пустой
      const emptyNameElement = Array.from(nameElements).find((el) => el.textContent === "")
      expect(emptyNameElement).toBeTruthy()
    })

    it("should handle zero duration", () => {
      const zeroDurationClip = { ...mockVideoClip, duration: 0 }
      render(
        <VideoClip clip={zeroDurationClip} track={mockVideoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByText("0s")).toBeInTheDocument()
    })

    it("should handle missing callbacks", () => {
      render(<VideoClip clip={mockVideoClip} track={mockVideoTrack} />)

      const clipElement = screen.getByText("Test Video Clip").closest("div")
      fireEvent.click(clipElement!)

      // Should not throw error
      expect(true).toBe(true)
    })
  })
})
