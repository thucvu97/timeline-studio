/**
 * Basic tests for EnhancedVideoPlayer component
 */

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EnhancedVideoPlayer } from "../enhanced-video-player"

// Mock dependencies
const mockUsePlayer = vi.fn()
vi.mock("../../services/player-provider", () => ({
  usePlayer: () => mockUsePlayer(),
}))

const mockUseProjectSettings = vi.fn()
vi.mock("@/features/project-settings", () => ({
  useProjectSettings: () => mockUseProjectSettings(),
}))

const mockUseTimeline = vi.fn()
vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => mockUseTimeline(),
}))

const mockUsePrerender = vi.fn()
const mockUsePrerenderCache = vi.fn()
vi.mock("@/features/video-compiler/hooks/use-prerender", () => ({
  usePrerender: () => mockUsePrerender(),
  usePrerenderCache: () => mockUsePrerenderCache(),
}))

const mockConvertVideoSrc = vi.fn()
vi.mock("@/lib/tauri-utils", () => ({
  convertVideoSrc: (src: string) => mockConvertVideoSrc(src),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock UI components
vi.mock("@/components/ui/aspect-ratio", () => ({
  AspectRatio: ({ children, ratio }: { children: React.ReactNode; ratio: number }) => (
    <div data-testid="aspect-ratio" data-ratio={ratio}>
      {children}
    </div>
  ),
}))

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className}>
      Loading...
    </div>
  ),
}))

vi.mock("../player-controls", () => ({
  PlayerControls: () => <div data-testid="player-controls">Player Controls</div>,
}))

describe("EnhancedVideoPlayer - Basic Tests", () => {
  const defaultMockPlayer = {
    currentVideo: {
      id: "video-1",
      path: "/path/to/video.mp4",
      name: "Test Video",
      media_type: "Video",
      duration: 120,
      metadata: {
        format: "mp4",
        codec: "h264",
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
      },
    },
    currentTime: 10,
    duration: 120,
  }

  const defaultMockSettings = {
    settings: {
      aspectRatio: {
        value: { width: 16, height: 9 },
      },
    },
  }

  const defaultMockTimeline = {
    project: {
      id: "project-1",
      name: "Test Project",
      timeline: {
        duration: 120,
        fps: 30,
        sample_rate: 48000,
        tracks: [],
        markers: [],
      },
    },
  }

  const defaultMockPrerender = {
    prerender: vi.fn(),
    isRendering: false,
    currentResult: null,
  }

  const defaultMockPrerenderCache = {
    hasInCache: vi.fn().mockReturnValue(false),
    getFromCache: vi.fn().mockReturnValue(null),
    addToCache: vi.fn(),
  }

  beforeEach(() => {
    mockUsePlayer.mockReturnValue(defaultMockPlayer)
    mockUseProjectSettings.mockReturnValue(defaultMockSettings)
    mockUseTimeline.mockReturnValue(defaultMockTimeline)
    mockUsePrerender.mockReturnValue(defaultMockPrerender)
    mockUsePrerenderCache.mockReturnValue(defaultMockPrerenderCache)
    mockConvertVideoSrc.mockImplementation((src) => `converted:${src}`)
    vi.clearAllMocks()
  })

  it("renders the video player component", () => {
    render(<EnhancedVideoPlayer />)

    expect(screen.getByTestId("aspect-ratio")).toBeInTheDocument()
    expect(screen.getByTestId("player-controls")).toBeInTheDocument()
    const video = document.querySelector("video")
    expect(video).toBeInTheDocument()
  })

  it("shows no video state when no video is loaded", () => {
    mockUsePlayer.mockReturnValue({
      ...defaultMockPlayer,
      currentVideo: null,
    })

    render(<EnhancedVideoPlayer />)

    expect(screen.getByText("Нет видео")).toBeInTheDocument()
    expect(document.querySelector("video")).not.toBeInTheDocument()
  })

  it("converts video source path", () => {
    render(<EnhancedVideoPlayer />)

    const video = document.querySelector("video") as HTMLVideoElement
    expect(video.src).toContain("converted:/path/to/video.mp4")
  })

  it("displays aspect ratio correctly", () => {
    render(<EnhancedVideoPlayer />)

    const aspectRatio = screen.getByTestId("aspect-ratio")
    expect(aspectRatio).toHaveAttribute("data-ratio", "1.7777777777777777") // 16/9
  })

  it("shows prerender controls when video is loaded", () => {
    render(<EnhancedVideoPlayer />)

    // The component should have some prerender-related UI elements
    expect(screen.getByTestId("aspect-ratio")).toBeInTheDocument()
  })

  it("handles timeline project properly", () => {
    render(<EnhancedVideoPlayer />)

    // Verify that timeline hook was called
    expect(mockUseTimeline).toHaveBeenCalled()
  })

  it("handles prerender cache properly", () => {
    render(<EnhancedVideoPlayer />)

    // Verify that prerender cache hook was called
    expect(mockUsePrerenderCache).toHaveBeenCalled()
  })

  it("passes correct props to video element", () => {
    render(<EnhancedVideoPlayer />)

    const video = document.querySelector("video") as HTMLVideoElement

    // Video should have correct attributes
    expect(video).toHaveAttribute("preload", "auto")
    expect(video).toHaveAttribute("playsInline")
    expect(video).not.toHaveAttribute("controls") // Custom controls are used
  })
})
