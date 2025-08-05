/**
 * Basic tests for EffectsPreviewPlayer component
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { EffectsPreviewPlayer } from "../effects-preview-player"

// Mock dependencies
const mockGetEffectsPreviewService = vi.fn()
vi.mock("../../services/effects-preview", () => ({
  getEffectsPreviewService: () => mockGetEffectsPreviewService(),
}))

const mockUsePlayer = vi.fn()
vi.mock("../../services/player-provider", () => ({
  usePlayer: () => mockUsePlayer(),
}))

const mockUseProjectSettings = vi.fn()
vi.mock("@/features/project-settings", () => ({
  useProjectSettings: () => mockUseProjectSettings(),
}))

const mockConvertVideoSrc = vi.fn()
vi.mock("@/lib/tauri-utils", () => ({
  convertVideoSrc: (src: string) => mockConvertVideoSrc(src),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
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

vi.mock("../player-controls", () => ({
  PlayerControls: () => <div data-testid="player-controls">Player Controls</div>,
}))

describe("EffectsPreviewPlayer - Basic Tests", () => {
  const mockEffectsPreviewService = {
    stopRealTimePreview: vi.fn(),
    startRealTimePreview: vi.fn(),
    getAvailableEffects: vi.fn().mockReturnValue([
      { id: "blur", name: "Blur", category: "basic" },
      { id: "grayscale", name: "Grayscale", category: "color" },
    ]),
    getEffectParameters: vi.fn().mockReturnValue({
      intensity: 1.0,
    }),
  }

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
    currentTime: 0,
  }

  const defaultMockSettings = {
    settings: {
      aspectRatio: { 
        value: { width: 16, height: 9 } 
      },
    },
  }

  beforeEach(() => {
    mockGetEffectsPreviewService.mockReturnValue(mockEffectsPreviewService)
    mockUsePlayer.mockReturnValue(defaultMockPlayer)
    mockUseProjectSettings.mockReturnValue(defaultMockSettings)
    mockConvertVideoSrc.mockImplementation((src) => `converted:${src}`)
    vi.clearAllMocks()
  })

  it("renders the video player component", () => {
    render(<EffectsPreviewPlayer />)

    expect(screen.getByTestId("aspect-ratio")).toBeInTheDocument()
    expect(screen.getByTestId("player-controls")).toBeInTheDocument()
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
  })

  it("displays effects button", () => {
    render(<EffectsPreviewPlayer />)

    const effectsButton = screen.getByRole("button", { name: /Настройки эффектов/i })
    expect(effectsButton).toBeInTheDocument()
  })

  it("shows effects panel when button clicked", async () => {
    render(<EffectsPreviewPlayer />)

    const effectsButton = screen.getByRole("button", { name: /Настройки эффектов/i })
    fireEvent.click(effectsButton)

    await waitFor(() => {
      expect(screen.getByText("Эффекты")).toBeInTheDocument()
    })
  })

  it("shows no video state", () => {
    mockUsePlayer.mockReturnValue({
      currentVideo: null,
      currentTime: 0,
    })

    render(<EffectsPreviewPlayer />)

    expect(screen.getByText("Нет видео")).toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeInTheDocument()
  })

  it("calls getAvailableEffects on mount", () => {
    render(<EffectsPreviewPlayer />)

    expect(mockEffectsPreviewService.getAvailableEffects).toHaveBeenCalled()
  })

  it("calls stopRealTimePreview on unmount", () => {
    const { unmount } = render(<EffectsPreviewPlayer />)

    // Сбрасываем счетчик вызовов перед размонтированием
    mockEffectsPreviewService.stopRealTimePreview.mockClear()
    
    unmount()

    expect(mockEffectsPreviewService.stopRealTimePreview).toHaveBeenCalled()
  })

  it("converts video source path", () => {
    render(<EffectsPreviewPlayer />)

    const video = document.querySelector('video') as HTMLVideoElement
    expect(video.src).toContain("converted:/path/to/video.mp4")
  })

  it("displays aspect ratio correctly", () => {
    render(<EffectsPreviewPlayer />)

    const aspectRatio = screen.getByTestId("aspect-ratio")
    expect(aspectRatio).toHaveAttribute("data-ratio", "1.7777777777777777") // 16/9
  })
})