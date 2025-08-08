/**
 * Tests for AnalysisViewer component
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { UnifiedContentAnalysis } from "../../../shared/types"
import { AnalysisViewer } from "../analysis-viewer"

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = (await importOriginal()) as any
  const MockIcon = ({ ...props }: any) => <div data-testid="mock-icon" {...props} />

  return {
    ...actual,
    Brain: MockIcon,
    Clock: MockIcon,
    Film: MockIcon,
    Sparkles: MockIcon,
    TrendingUp: MockIcon,
    Eye: MockIcon,
    Users: MockIcon,
    FileVideo: MockIcon,
    Music: MockIcon,
    MessageSquare: MockIcon,
    Zap: MockIcon,
    AlertTriangle: MockIcon,
  }
})

// Mock analysis data
const createMockAnalysis = (): UnifiedContentAnalysis => ({
  mediaFile: {
    path: "/test/video.mp4",
    filename: "video.mp4",
    name: "video.mp4",
    size: 1024 * 1024 * 100, // 100MB
    format: "mp4",
    duration: 180, // 3 minutes
  },
  scenes: [
    {
      id: "scene-1",
      startTime: 0,
      endTime: 60,
      duration: 60,
      type: "dialogue" as any,
      keyFrames: [],
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
      keyFrames: [],
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
    suggestions: [
      {
        type: "pacing" as any,
        description: "Consider tightening the transition between scenes",
        priority: "medium" as any,
      },
      {
        type: "color" as any,
        description: "Color grading could enhance the dramatic mood",
        priority: "low" as any,
      },
    ],
    warnings: [
      {
        type: "quality" as any,
        description: "Slight noise detected in action scenes",
        severity: "warning" as any,
      },
    ],
    opportunities: [],
  },
})

describe("AnalysisViewer", () => {
  it("should render empty state when no analysis provided", () => {
    render(<AnalysisViewer analysis={null} />)

    expect(screen.getByText("Нет данных для отображения")).toBeInTheDocument()
    expect(screen.getByText("Загрузите видео для анализа")).toBeInTheDocument()
  })

  it("should render analysis data when provided", () => {
    const analysis = createMockAnalysis()
    render(<AnalysisViewer analysis={analysis} />)

    // Check header
    expect(screen.getByText("Результаты AI анализа")).toBeInTheDocument()

    // Check metrics
    expect(screen.getByText("3:00")).toBeInTheDocument() // Duration
    expect(screen.getAllByText("2")).toHaveLength(2) // Scenes count and Key moments count
    expect(screen.getAllByText("80%").length).toBeGreaterThanOrEqual(1) // Quality metric

    // Check tabs
    expect(screen.getByText("Обзор")).toBeInTheDocument()
    expect(screen.getByText("Сцены")).toBeInTheDocument()
    expect(screen.getByText("Моменты")).toBeInTheDocument()
    expect(screen.getByText("Инсайты")).toBeInTheDocument()
    expect(screen.getByText("Технические данные")).toBeInTheDocument()
  })

  it("should switch tabs when clicked", async () => {
    const user = userEvent.setup()
    const analysis = createMockAnalysis()
    render(<AnalysisViewer analysis={analysis} />)

    // Initially on Overview tab
    expect(screen.getByText("Классификация контента")).toBeInTheDocument()

    // Switch to Scenes tab
    await user.click(screen.getByText("Сцены"))
    await waitFor(() => {
      expect(screen.getByText("dialogue")).toBeInTheDocument()
      expect(screen.getByText("action")).toBeInTheDocument()
    })

    // Switch to Moments tab
    await user.click(screen.getByText("Моменты"))
    await waitFor(() => {
      expect(screen.getByText("Intense emotional dialogue")).toBeInTheDocument()
      expect(screen.getByText("High-speed chase begins")).toBeInTheDocument()
    })
  })

  it("should call onSceneSelect when scene is clicked", async () => {
    const user = userEvent.setup()
    const onSceneSelect = vi.fn()
    const analysis = createMockAnalysis()

    render(<AnalysisViewer analysis={analysis} onSceneSelect={onSceneSelect} />)

    // Switch to Scenes tab
    await user.click(screen.getByText("Сцены"))

    // Click on first scene card (find by cursor-pointer class)
    await waitFor(() => {
      const firstScene = screen.getByText("dialogue").closest('[class*="cursor-pointer"]')
      expect(firstScene).toBeTruthy()
      return user.click(firstScene!)
    })

    expect(onSceneSelect).toHaveBeenCalledWith("scene-1")
  })

  it("should call onMomentSelect when moment is clicked", async () => {
    const user = userEvent.setup()
    const onMomentSelect = vi.fn()
    const analysis = createMockAnalysis()

    render(<AnalysisViewer analysis={analysis} onMomentSelect={onMomentSelect} />)

    // Switch to Moments tab
    await user.click(screen.getByText("Моменты"))

    // Click on first moment card
    await waitFor(() => {
      const firstMoment = screen.getByText("Intense emotional dialogue").closest('[class*="cursor-pointer"]')
      expect(firstMoment).toBeTruthy()
      return user.click(firstMoment!)
    })

    expect(onMomentSelect).toHaveBeenCalledWith("moment-1")
  })

  it("should apply custom className", () => {
    const customClass = "custom-analysis-viewer"
    const analysis = createMockAnalysis()
    const { container } = render(<AnalysisViewer analysis={analysis} className={customClass} />)

    const element = container.querySelector(".analysis-viewer")
    expect(element).toHaveClass(customClass)
  })

  it("should display technical specs correctly", async () => {
    const user = userEvent.setup()
    const analysis = createMockAnalysis()
    render(<AnalysisViewer analysis={analysis} />)

    // Switch to Technical tab
    await user.click(screen.getByText("Технические данные"))

    await waitFor(() => {
      expect(screen.getByText("1920x1080")).toBeInTheDocument()
      expect(screen.getByText("16:9")).toBeInTheDocument()
      expect(screen.getByText("30 fps")).toBeInTheDocument()
      expect(screen.getByText("h264")).toBeInTheDocument()
      expect(screen.getByText("aac")).toBeInTheDocument()
    })
  })

  it("should display insights correctly", async () => {
    const user = userEvent.setup()
    const analysis = createMockAnalysis()
    render(<AnalysisViewer analysis={analysis} />)

    // Switch to Insights tab
    await user.click(screen.getByText("Инсайты"))

    await waitFor(() => {
      // Check highlights
      expect(screen.getByText("Strong emotional dialogue at 0:30")).toBeInTheDocument()

      // Check suggestions
      expect(screen.getByText("Consider tightening the transition between scenes")).toBeInTheDocument()

      // Check warnings
      expect(screen.getByText("Slight noise detected in action scenes")).toBeInTheDocument()
    })
  })

  it("should format time correctly", () => {
    const analysis = createMockAnalysis()
    render(<AnalysisViewer analysis={analysis} />)

    // Check duration formatting (3 minutes = 3:00)
    expect(screen.getByText("3:00")).toBeInTheDocument()
  })

  it("should display quality color based on value", () => {
    const analysis = createMockAnalysis()
    render(<AnalysisViewer analysis={analysis} />)

    // Quality is 80%, should have green color class in the metrics section
    const qualityElements = screen.getAllByText("80%")
    const headerQualityElement = qualityElements.find((el) => el.className.includes("text-green-600"))
    expect(headerQualityElement).toBeTruthy()
  })
})
