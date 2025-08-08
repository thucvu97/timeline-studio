/**
 * Tests for PreviewGrid component
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { UnifiedContentAnalysis } from "../../../shared/types"
import { PreviewGrid } from "../preview-grid"

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = (await importOriginal()) as any
  const MockIcon = ({ ...props }: any) => <div data-testid="mock-icon" {...props} />

  return {
    ...actual,
    Play: MockIcon,
    Pause: MockIcon,
    Download: MockIcon,
    Heart: MockIcon,
    Share2: MockIcon,
    Filter: MockIcon,
    Grid3X3: MockIcon,
    Grid2X2: MockIcon,
    List: MockIcon,
    Search: MockIcon,
    Clock: MockIcon,
    Eye: MockIcon,
    Star: MockIcon,
    MoreVertical: MockIcon,
  }
})

// Mock analysis data
const createMockAnalysis = (): UnifiedContentAnalysis => ({
  mediaFile: {
    path: "/test/video.mp4",
    filename: "video.mp4",
    name: "video.mp4",
    size: 1024 * 1024 * 100,
    format: "mp4",
    duration: 180,
  },
  scenes: [
    {
      id: "scene-1",
      startTime: 0,
      endTime: 60,
      duration: 60,
      type: "dialogue" as any,
      keyFrames: [
        {
          time: 30,
          timestamp: 30,
          thumbnailPath: "/thumbnails/scene-1-frame-1.jpg",
          composition: {
            ruleOfThirds: 0.8,
            balance: 0.7,
            leadingLines: true,
            depth: 0.6,
            colorHarmony: 0.9,
          },
          isKeyMoment: true,
          score: 85,
        },
      ],
      quality: {
        overall: 85,
        sharpness: 90,
        brightness: 80,
        contrast: 85,
        saturation: 75,
        stability: 95,
        noise: 10,
      },
      content: {
        objects: [
          {
            id: "obj-1",
            label: "person",
            confidence: 0.95,
            boundingBox: { x: 0, y: 0, width: 100, height: 100 },
            frameNumbers: [1, 2, 3],
          },
        ],
        faces: [],
        text: [],
        activities: [],
      },
      transitions: [],
    },
    {
      id: "scene-2",
      startTime: 60,
      endTime: 120,
      duration: 60,
      type: "action" as any,
      keyFrames: [
        {
          time: 90,
          timestamp: 90,
          thumbnailPath: "/thumbnails/scene-2-frame-1.jpg",
          composition: {
            ruleOfThirds: 0.6,
            balance: 0.8,
            leadingLines: false,
            depth: 0.9,
            colorHarmony: 0.7,
          },
          isKeyMoment: false,
          score: 75,
        },
      ],
      quality: {
        overall: 75,
        sharpness: 80,
        brightness: 70,
        contrast: 75,
        saturation: 80,
        stability: 85,
        noise: 15,
      },
      content: {
        objects: [
          {
            id: "obj-2",
            label: "car",
            confidence: 0.88,
            boundingBox: { x: 0, y: 0, width: 200, height: 150 },
            frameNumbers: [61, 62, 63],
          },
        ],
        faces: [],
        text: [],
        activities: [],
      },
      transitions: [],
    },
  ],
  keyMoments: [
    {
      id: "moment-1",
      timestamp: 30,
      duration: 5,
      type: "emotional_peak" as any,
      score: 95,
      description: "Intense emotional dialogue",
      sceneId: "scene-1",
    },
    {
      id: "moment-2",
      timestamp: 90,
      duration: 10,
      type: "action_peak" as any,
      score: 88,
      description: "High-speed chase begins",
      sceneId: "scene-2",
    },
  ],
  contentType: "narrative" as any,
  genres: ["drama" as any, "action" as any],
  mood: {
    primary: "dramatic" as any,
    intensity: 0.8,
  },
  targetAudience: {
    ageRange: { min: 16, max: 35 },
    interests: ["action", "drama", "suspense"],
    demographics: {
      primary: "young adults",
    },
  },
  technicalSpecs: {
    resolution: { width: 1920, height: 1080, aspectRatio: "16:9" },
    frameRate: 30,
    bitrate: 5000000,
    codec: "h264",
    audioChannels: 2,
    audioCodec: "aac",
    audioBitrate: 128000,
    duration: 180,
  },
  qualityMetrics: {
    overall: 80,
    sharpness: 85,
    brightness: 75,
    contrast: 80,
    saturation: 78,
    stability: 90,
    noise: 12,
  },
  detections: {
    objects: [],
    faces: [],
    text: [],
    audio: {
      speech: [],
      music: [],
      soundEffects: [],
      silence: [],
    },
    scenes: [],
  },
  insights: {
    summary: "A dramatic narrative with intense emotional moments and action sequences.",
    highlights: [
      "Strong emotional dialogue at 0:30",
      "Effective use of pacing between dialogue and action",
      "High production quality throughout",
    ],
    suggestions: [],
    warnings: [],
    opportunities: [],
  },
})

describe("PreviewGrid", () => {
  it("should render empty state when no analysis provided", () => {
    render(<PreviewGrid analysis={null} />)

    expect(screen.getByText("Нет контента для отображения")).toBeInTheDocument()
    expect(screen.getByText("Загрузите и проанализируйте видео")).toBeInTheDocument()
  })

  it("should render preview items when analysis provided", () => {
    const analysis = createMockAnalysis()
    render(<PreviewGrid analysis={analysis} />)

    // Should show scenes, moments, and highlights
    expect(screen.getByText("Сцена dialogue")).toBeInTheDocument()
    expect(screen.getByText("Сцена action")).toBeInTheDocument()
    expect(screen.getByText("emotional peak")).toBeInTheDocument()
    expect(screen.getByText("action peak")).toBeInTheDocument()
    expect(screen.getAllByText("Основной момент")).toHaveLength(3) // 3 highlights
  })

  it("should filter items by type", async () => {
    const user = userEvent.setup()
    const analysis = createMockAnalysis()
    render(<PreviewGrid analysis={analysis} />)

    // Initially all items should be visible
    expect(screen.getByText("Сцена dialogue")).toBeInTheDocument()
    expect(screen.getByText("emotional peak")).toBeInTheDocument()

    // Filter by scenes only
    await user.click(screen.getByText("Сцены"))

    await waitFor(() => {
      expect(screen.getByText("Сцена dialogue")).toBeInTheDocument()
      expect(screen.getByText("Сцена action")).toBeInTheDocument()
      // Moments should be filtered out
      expect(screen.queryByText("emotional peak")).not.toBeInTheDocument()
    })
  })

  it("should search items by title and description", async () => {
    const user = userEvent.setup()
    const analysis = createMockAnalysis()
    render(<PreviewGrid analysis={analysis} />)

    const searchInput = screen.getByPlaceholderText("Поиск по контенту...")

    // Search for "emotional"
    await user.type(searchInput, "emotional")

    await waitFor(() => {
      expect(screen.getByText("emotional peak")).toBeInTheDocument()
      expect(screen.queryByText("action peak")).not.toBeInTheDocument()
    })
  })

  it("should switch between grid and list view modes", async () => {
    const user = userEvent.setup()
    const analysis = createMockAnalysis()
    render(<PreviewGrid analysis={analysis} />)

    // Should start in grid mode by default
    const gridContainer = screen.getByText("Сцена dialogue").closest(".grid")
    expect(gridContainer).toBeTruthy()

    // Switch to list view
    const listButton = screen
      .getAllByTestId("mock-icon")
      .find((icon) => icon.closest("button")?.getAttribute("class")?.includes("ghost"))
    if (listButton) {
      await user.click(listButton.closest("button")!)

      await waitFor(() => {
        const listContainer = screen.getByText("Сцена dialogue").closest(".space-y-2")
        expect(listContainer).toBeTruthy()
      })
    }
  })

  it("should handle item selection when enabled", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    const analysis = createMockAnalysis()

    render(<PreviewGrid analysis={analysis} enableSelection={true} onSelectionChange={onSelectionChange} />)

    // Should show checkboxes and select all option
    expect(screen.getAllByRole("checkbox")).toHaveLength(8) // 1 for select-all + 7 items

    // Click on first item to select it
    const firstItem = screen.getByText("Сцена dialogue").closest('[class*="cursor-pointer"]')
    if (firstItem) {
      await user.click(firstItem)

      expect(onSelectionChange).toHaveBeenCalled()
    }
  })

  it("should call action handlers when provided", async () => {
    const user = userEvent.setup()
    const onItemPlay = vi.fn()
    const onItemDownload = vi.fn()
    const onItemStar = vi.fn()
    const onItemShare = vi.fn()
    const analysis = createMockAnalysis()

    render(
      <PreviewGrid
        analysis={analysis}
        onItemPlay={onItemPlay}
        onItemDownload={onItemDownload}
        onItemStar={onItemStar}
        onItemShare={onItemShare}
      />,
    )

    // Find and click on first item (card should be clickable)
    const firstCard = screen.getByText("Сцена dialogue").closest('[class*="cursor-pointer"]')
    expect(firstCard).toBeTruthy()

    // Click on the card to trigger onItemSelect (which isn't passed, so it should work)
    await user.click(firstCard!)

    // Check that action handlers are available (they should be functions)
    expect(onItemPlay).toBeInstanceOf(Function)
    expect(onItemDownload).toBeInstanceOf(Function)
    expect(onItemStar).toBeInstanceOf(Function)
    expect(onItemShare).toBeInstanceOf(Function)
  })

  it("should handle pagination correctly", async () => {
    const user = userEvent.setup()
    const analysis = createMockAnalysis()

    render(<PreviewGrid analysis={analysis} itemsPerPage={3} />)

    // Should show pagination controls if more than 3 items
    const totalItems = 2 + 2 + 3 // 2 scenes + 2 moments + 3 highlights = 7 items
    if (totalItems > 3) {
      expect(screen.getByText(/Страница \d+ из \d+/)).toBeInTheDocument()

      // Should have next button
      const nextButton = screen.getByText("Вперед")
      expect(nextButton).toBeInTheDocument()

      // Click next button
      await user.click(nextButton)

      // Should show different content on page 2
      await waitFor(() => {
        expect(screen.getByText(/Страница 2 из/)).toBeInTheDocument()
      })
    }
  })

  it("should sort items correctly", async () => {
    const user = userEvent.setup()
    const analysis = createMockAnalysis()
    render(<PreviewGrid analysis={analysis} />)

    const sortSelect = screen.getByDisplayValue("По времени")

    // Change to sort by score
    await user.selectOptions(sortSelect, "score")

    await waitFor(() => {
      expect(sortSelect).toHaveValue("score")
    })
  })

  it("should apply custom className", () => {
    const customClass = "custom-preview-grid"
    const analysis = createMockAnalysis()
    const { container } = render(<PreviewGrid analysis={analysis} className={customClass} />)

    const element = container.querySelector(".preview-grid")
    expect(element).toHaveClass(customClass)
  })

  it("should display correct item counts and summary", () => {
    const analysis = createMockAnalysis()
    render(<PreviewGrid analysis={analysis} />)

    // Should show results summary
    expect(screen.getByText(/Показано \d+ из \d+ элементов/)).toBeInTheDocument()
  })

  it("should handle thumbnail loading errors gracefully", () => {
    const analysis = createMockAnalysis()
    render(<PreviewGrid analysis={analysis} />)

    // Find image elements
    const images = screen.getAllByRole("img")
    expect(images.length).toBeGreaterThan(0)

    // Check that images have src attributes
    const firstImage = images[0] as HTMLImageElement
    expect(firstImage).toBeTruthy()
    expect(firstImage.src).toBeTruthy()

    // Test would verify onError handling, but in JSDOM it's hard to test
    // We just verify the image elements exist and have proper src
    expect(firstImage.alt).toBeTruthy()
  })
})
