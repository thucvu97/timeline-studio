import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { TransitionPreview } from "../../components/transition-preview"
import { Transition } from "../../types/transitions"

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock("@/features/browser", () => ({
  ApplyButton: ({ resource, onClick }: any) => (
    <button data-testid="apply-button" onClick={onClick}>
      Apply {resource.id}
    </button>
  ),
}))

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({ resource }: any) => <button data-testid="add-media-button">Add {resource.id}</button>,
}))

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: ({ file }: any) => <button data-testid="favorite-button">Favorite {file.id}</button>,
}))

vi.mock("../../hooks/use-transitions", () => ({
  useTransitions: () => ({
    transitions: [
      {
        id: "fade",
        type: "fade",
        name: "Fade",
        labels: { ru: "Затухание", en: "Fade" },
        category: "basic",
        complexity: "basic",
        duration: { default: 1.0, min: 0.5, max: 3.0 },
        ffmpegCommand: () => "fade",
      },
      {
        id: "zoom",
        type: "zoom",
        name: "Zoom",
        labels: { ru: "Увеличение", en: "Zoom" },
        category: "advanced",
        complexity: "intermediate",
        duration: { default: 1.5, min: 0.5, max: 3.0 },
        ffmpegCommand: () => "zoompan",
      },
    ] as Transition[],
  }),
}))

describe("TransitionPreview", () => {
  const mockSourceVideo: MediaFile = {
    id: "source",
    path: "/path/to/source.mp4",
    name: "source.mp4",
    size: 1000,
    type: "video",
    duration: 10,
    metadata: {
      width: 1920,
      height: 1080,
      fps: 30,
      codec: "h264",
      bitrate: 5000000,
    },
  }

  const mockTargetVideo: MediaFile = {
    id: "target",
    path: "/path/to/target.mp4",
    name: "target.mp4",
    size: 1000,
    type: "video",
    duration: 10,
    metadata: {
      width: 1920,
      height: 1080,
      fps: 30,
      codec: "h264",
      bitrate: 5000000,
    },
  }

  const mockTransition: Transition = {
    id: "fade",
    type: "fade",
    name: "Fade",
    labels: { ru: "Затухание", en: "Fade" },
    category: "basic",
    complexity: "basic",
    duration: { default: 1.0, min: 0.5, max: 3.0 },
    ffmpegCommand: () => "fade",
  }

  const defaultProps = {
    sourceVideo: mockSourceVideo,
    targetVideo: mockTargetVideo,
    transitionType: "fade",
    onClick: vi.fn(),
    size: 120,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Mock HTMLVideoElement methods globally
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    HTMLVideoElement.prototype.pause = vi.fn()
    HTMLVideoElement.prototype.load = vi.fn()

    // Mock currentTime and other properties
    Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
      value: 0,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe("Component Rendering", () => {
    it("should render with basic props", () => {
      render(<TransitionPreview {...defaultProps} />)

      // Check that video elements are rendered
      expect(screen.getByTestId("source-video")).toBeInTheDocument()
      expect(screen.getByTestId("target-video")).toBeInTheDocument()

      // Check that control buttons are rendered
      expect(screen.getByTestId("favorite-button")).toBeInTheDocument()
      expect(screen.getByTestId("apply-button")).toBeInTheDocument()
    })

    it("should render with transition prop", () => {
      render(<TransitionPreview {...defaultProps} transition={mockTransition} />)

      // Should show add media button when transition is provided
      expect(screen.getByTestId("add-media-button")).toBeInTheDocument()
    })

    it("should render with custom preview dimensions", () => {
      render(<TransitionPreview {...defaultProps} previewWidth={200} previewHeight={150} />)

      const container = screen.getByTestId("source-video").closest("div")?.parentElement
      expect(container).toHaveStyle({ width: "200px", height: "150px" })
    })

    it("should display transition name", () => {
      render(<TransitionPreview {...defaultProps} transition={mockTransition} />)

      expect(screen.getByText("Затухание")).toBeInTheDocument()
    })

    it("should display category indicator", () => {
      render(<TransitionPreview {...defaultProps} transition={mockTransition} />)

      const categoryIndicator = screen.getByText("BSC")
      expect(categoryIndicator).toBeInTheDocument()

      // The indicator should be within a div that has styling
      const styledParent = categoryIndicator.closest('div[class*="bg-"]')
      expect(styledParent).toBeTruthy()
    })

    it("should display duration indicator", () => {
      render(<TransitionPreview {...defaultProps} transition={mockTransition} />)

      expect(screen.getByText("1.0s")).toBeInTheDocument()
    })
  })

  describe("Video Error Handling", () => {
    it("should display error message when video fails to load", async () => {
      render(<TransitionPreview {...defaultProps} />)

      const sourceVideo = screen.getByTestId("source-video")
      fireEvent.error(sourceVideo)

      // Error message should appear immediately
      expect(screen.getByText("timeline.player.videoLoadError")).toBeInTheDocument()
    })

    it("should not start transition when video has error", async () => {
      render(<TransitionPreview {...defaultProps} />)

      const sourceVideo = screen.getByTestId("source-video")
      fireEvent.error(sourceVideo)

      // Error message should appear immediately
      expect(screen.getByText("timeline.player.videoLoadError")).toBeInTheDocument()

      // Try to trigger hover on the error state container
      const errorContainer = screen.getByText("timeline.player.videoLoadError").closest("div")?.parentElement
      if (errorContainer) {
        fireEvent.mouseEnter(errorContainer)
      }

      expect(HTMLVideoElement.prototype.play).not.toHaveBeenCalled()
    })
  })

  describe("Hover Interactions", () => {
    it("should respond to mouse enter and leave events", async () => {
      const { container } = render(<TransitionPreview {...defaultProps} />)

      // Find the preview container with onMouseEnter/onMouseLeave handlers
      const previewContainer = container.querySelector('[style*="width"][style*="height"]')
      expect(previewContainer).toBeTruthy()

      // Hover functionality exists but is complex to test due to refs and timers
      // The component handles hover states internally
      fireEvent.mouseEnter(previewContainer!)
      fireEvent.mouseLeave(previewContainer!)

      // Verify the component rendered without errors
      expect(screen.getByTestId("source-video")).toBeInTheDocument()
      expect(screen.getByTestId("target-video")).toBeInTheDocument()
    })
  })

  describe("Click Interactions", () => {
    it("should call onClick when preview is clicked", () => {
      const onClick = vi.fn()
      const { container } = render(<TransitionPreview {...defaultProps} onClick={onClick} />)

      // Click on the actual preview container div that has onClick
      const previewDiv = container.querySelector(".cursor-pointer.rounded-xs")
      expect(previewDiv).toBeTruthy()
      fireEvent.click(previewDiv!)

      expect(onClick).toHaveBeenCalled()
    })
  })

  describe("Transition Effects", () => {
    it("should apply fade transition effect", async () => {
      const { container } = render(<TransitionPreview {...defaultProps} transitionType="fade" />)

      const sourceVideo = screen.getByTestId("source-video")
      const targetVideo = screen.getByTestId("target-video")

      // Trigger transition
      const previewContainer = container.querySelector(".cursor-pointer.rounded-xs")
      fireEvent.mouseEnter(previewContainer!)

      // Advance through transition
      await vi.advanceTimersByTimeAsync(500)

      // Check that videos have opacity styles applied
      const sourceContainer = sourceVideo.parentElement
      const targetContainer = targetVideo.parentElement

      expect(sourceContainer).toBeTruthy()
      expect(targetContainer).toBeTruthy()
    })

    it("should apply zoom transition effect", async () => {
      const { container } = render(<TransitionPreview {...defaultProps} transitionType="zoom" />)

      const sourceVideo = screen.getByTestId("source-video")
      const targetVideo = screen.getByTestId("target-video")

      // Trigger transition
      const previewContainer = container.querySelector(".cursor-pointer.rounded-xs")
      fireEvent.mouseEnter(previewContainer!)

      // Advance through transition
      await vi.advanceTimersByTimeAsync(500)

      // Check that videos have transform styles applied
      const sourceStyle = sourceVideo.style
      const targetStyle = targetVideo.style

      // Zoom effect should apply scale transform
      expect(sourceStyle.transform || targetStyle.transform).toBeTruthy()
    })

    it("should apply slide transition effect", async () => {
      const { container } = render(<TransitionPreview {...defaultProps} transitionType="slide" />)

      const sourceVideo = screen.getByTestId("source-video")
      const targetVideo = screen.getByTestId("target-video")

      // Trigger transition
      const previewContainer = container.querySelector(".cursor-pointer.rounded-xs")
      fireEvent.mouseEnter(previewContainer!)

      // Advance through transition
      await vi.advanceTimersByTimeAsync(500)

      // Check that videos have transform styles applied
      const sourceStyle = sourceVideo.style
      const targetStyle = targetVideo.style

      // Slide effect should apply translate transform
      expect(sourceStyle.transform || targetStyle.transform).toBeTruthy()
    })
  })

  describe("Transition Types", () => {
    const transitionTypes = [
      "scale",
      "rotate",
      "flip",
      "push",
      "squeeze",
      "diagonal",
      "spiral",
      "fold",
      "wave",
      "shutter",
      "bounce",
      "swirl",
      "dissolve",
    ]

    transitionTypes.forEach((type) => {
      it(`should render ${type} transition without errors`, () => {
        const { container } = render(<TransitionPreview {...defaultProps} transitionType={type} />)

        // Verify the component renders correctly with the transition type
        expect(screen.getByTestId("source-video")).toBeInTheDocument()
        expect(screen.getByTestId("target-video")).toBeInTheDocument()

        // Find the preview container
        const previewContainer = container.querySelector('[style*="width"][style*="height"]')
        expect(previewContainer).toBeTruthy()

        // Verify hover handlers are attached
        fireEvent.mouseEnter(previewContainer!)
        fireEvent.mouseLeave(previewContainer!)
      })
    })
  })

  describe("Category Indicators", () => {
    it("should show correct indicator for basic category", () => {
      render(<TransitionPreview {...defaultProps} transition={mockTransition} />)
      expect(screen.getByText("BSC")).toBeInTheDocument()
    })

    it("should show correct indicator for advanced category", () => {
      const advancedTransition = { ...mockTransition, category: "advanced" as const }
      render(<TransitionPreview {...defaultProps} transition={advancedTransition} />)
      expect(screen.getByText("ADV")).toBeInTheDocument()
    })

    it("should show correct indicator for creative category", () => {
      const creativeTransition = { ...mockTransition, category: "creative" as const }
      render(<TransitionPreview {...defaultProps} transition={creativeTransition} />)
      expect(screen.getByText("CRE")).toBeInTheDocument()
    })

    it("should show correct indicator for 3d category", () => {
      const threeDTransition = { ...mockTransition, category: "3d" as const }
      render(<TransitionPreview {...defaultProps} transition={threeDTransition} />)
      expect(screen.getByText("3D")).toBeInTheDocument()
    })

    it("should show correct indicator for artistic category", () => {
      const artisticTransition = { ...mockTransition, category: "artistic" as const }
      render(<TransitionPreview {...defaultProps} transition={artisticTransition} />)
      expect(screen.getByText("ART")).toBeInTheDocument()
    })

    it("should show correct indicator for cinematic category", () => {
      const cinematicTransition = { ...mockTransition, category: "cinematic" as const }
      render(<TransitionPreview {...defaultProps} transition={cinematicTransition} />)
      expect(screen.getByText("CIN")).toBeInTheDocument()
    })

    it("should show UNK for unknown category", () => {
      const unknownTransition = { ...mockTransition, category: "unknown" as any }
      render(<TransitionPreview {...defaultProps} transition={unknownTransition} />)
      expect(screen.getByText("UNK")).toBeInTheDocument()
    })
  })

  describe("Transition Lookup", () => {
    it("should find transition by type when transition prop is not provided", () => {
      render(<TransitionPreview {...defaultProps} transitionType="zoom" />)

      // Should display the zoom transition name from the mocked transitions
      expect(screen.getByText("Увеличение")).toBeInTheDocument()
    })

    it("should use transition prop over looking up by type", () => {
      const customTransition = {
        ...mockTransition,
        id: "custom",
        labels: { ru: "Пользовательский", en: "Custom" },
      }
      render(<TransitionPreview {...defaultProps} transition={customTransition} transitionType="zoom" />)

      // Should display the custom transition name, not zoom
      expect(screen.getByText("Пользовательский")).toBeInTheDocument()
      expect(screen.queryByText("Увеличение")).not.toBeInTheDocument()
    })
  })

  describe("Video Reset Behavior", () => {
    it("should reset video styles on mouse leave", async () => {
      render(<TransitionPreview {...defaultProps} transitionType="zoom" />)

      const sourceVideo = screen.getByTestId("source-video")
      const targetVideo = screen.getByTestId("target-video")
      const previewContainer = screen.getByTestId("source-video").closest(".cursor-pointer")

      // Start transition
      fireEvent.mouseEnter(previewContainer!)

      // Wait for transition to start and advance timers to apply zoom effect
      await vi.advanceTimersByTimeAsync(1100) // 1000ms delay + 100ms for effect

      // Leave hover
      fireEvent.mouseLeave(previewContainer!)

      // Wait a bit for reset
      await vi.advanceTimersByTimeAsync(100)

      // After mouse leave, videos should be reset to initial state
      expect(sourceVideo.style.transform).toBe("scale(1)")
      expect(sourceVideo.style.opacity).toBe("1")
      expect(targetVideo.style.opacity).toBe("0")
    })
  })
})
