/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { TrackControlsPanel } from "../track-controls-panel"
import { useTracks } from "../../hooks/use-tracks"
import { useTimeline } from "../../hooks/use-timeline"

// Mock hooks
vi.mock("../../hooks/use-tracks")
vi.mock("../../hooks/use-timeline")

const mockUseTracks = vi.mocked(useTracks)
const mockUseTimeline = vi.mocked(useTimeline)

describe("TrackControlsPanel", () => {
  const mockAddTrack = vi.fn()
  const mockUpdateTrack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseTimeline.mockReturnValue({
      addTrack: mockAddTrack,
      updateTrack: mockUpdateTrack,
    } as any)
  })

  it("renders with empty tracks list", () => {
    mockUseTracks.mockReturnValue({
      tracks: [],
    } as any)

    render(<TrackControlsPanel />)
    
    expect(screen.getByText("Управление треками")).toBeInTheDocument()
    expect(screen.getByText("0 треков")).toBeInTheDocument()
    expect(screen.getByText("Треки не найдены")).toBeInTheDocument()
  })

  it("renders track add buttons", () => {
    mockUseTracks.mockReturnValue({
      tracks: [],
    } as any)

    render(<TrackControlsPanel />)
    
    expect(screen.getByText("Видео")).toBeInTheDocument()
    expect(screen.getByText("Аудио")).toBeInTheDocument()
    expect(screen.getByText("Изображения")).toBeInTheDocument()
  })

  it("calls addTrack when video track button is clicked", () => {
    mockUseTracks.mockReturnValue({
      tracks: [],
    } as any)

    render(<TrackControlsPanel />)
    
    fireEvent.click(screen.getByText("Видео"))
    
    expect(mockAddTrack).toHaveBeenCalledWith("video", "Видео 1")
  })

  it("calls addTrack when audio track button is clicked", () => {
    mockUseTracks.mockReturnValue({
      tracks: [],
    } as any)

    render(<TrackControlsPanel />)
    
    fireEvent.click(screen.getByText("Аудио"))
    
    expect(mockAddTrack).toHaveBeenCalledWith("audio", "Аудио 1")
  })

  it("renders tracks with controls", () => {
    const mockTracks = [
      {
        id: "track-1",
        name: "Test Video Track",
        type: "video",
        height: 80,
        isHidden: false,
        isLocked: false,
      },
      {
        id: "track-2", 
        name: "Test Audio Track",
        type: "audio",
        height: 60,
        isHidden: true,
        isLocked: true,
      },
    ]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)
    
    expect(screen.getByText("2 треков")).toBeInTheDocument()
    expect(screen.getByText("Test Video Track")).toBeInTheDocument()
    expect(screen.getByText("Test Audio Track")).toBeInTheDocument()
  })

  it("toggles track visibility when eye button is clicked", () => {
    const mockTracks = [
      {
        id: "track-1",
        name: "Test Track",
        type: "video",
        height: 80,
        isHidden: false,
        isLocked: false,
      },
    ]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)
    
    const eyeButton = screen.getByRole("button", { name: /toggle visibility/i })
    fireEvent.click(eyeButton)
    
    expect(mockUpdateTrack).toHaveBeenCalledWith("track-1", { isHidden: true })
  })

  it("toggles track lock when lock button is clicked", () => {
    const mockTracks = [
      {
        id: "track-1",
        name: "Test Track",
        type: "video",
        height: 80,
        isHidden: false,
        isLocked: false,
      },
    ]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)
    
    const lockButton = screen.getByRole("button", { name: /toggle lock/i })
    fireEvent.click(lockButton)
    
    expect(mockUpdateTrack).toHaveBeenCalledWith("track-1", { isLocked: true })
  })

  it("renders track height slider with correct value", () => {
    const mockTracks = [
      {
        id: "track-1",
        name: "Test Track",
        type: "video",
        height: 120,
        isHidden: false,
        isLocked: false,
      },
    ]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)
    
    // Check that height is displayed
    expect(screen.getByText("120px")).toBeInTheDocument()
    expect(screen.getByText("Высота")).toBeInTheDocument()
  })

  it("shows track count correctly", () => {
    const mockTracks = [
      { id: "1", name: "Track 1", type: "video", height: 80 },
      { id: "2", name: "Track 2", type: "audio", height: 60 },
      { id: "3", name: "Track 3", type: "video", height: 100 },
    ]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)
    
    expect(screen.getByText("3 треков")).toBeInTheDocument()
  })

  it("expands additional track types", () => {
    mockUseTracks.mockReturnValue({
      tracks: [],
    } as any)

    render(<TrackControlsPanel />)
    
    const expandButton = screen.getByText("Дополнительные типы")
    fireEvent.click(expandButton)
    
    expect(screen.getByText("Музыка")).toBeInTheDocument()
    expect(screen.getByText("Субтитры")).toBeInTheDocument()
  })

  it("adds music track from additional types", () => {
    mockUseTracks.mockReturnValue({
      tracks: [],
    } as any)

    render(<TrackControlsPanel />)
    
    const expandButton = screen.getByText("Дополнительные типы")
    fireEvent.click(expandButton)
    
    fireEvent.click(screen.getByText("Музыка"))
    
    expect(mockAddTrack).toHaveBeenCalledWith("music", "Музыка 1")
  })

  it("shows correct track type badges", () => {
    const mockTracks = [
      { id: "1", name: "Video Track", type: "video", height: 80 },
      { id: "2", name: "Audio Track", type: "audio", height: 60 },
      { id: "3", name: "Image Track", type: "image", height: 70 },
    ]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)
    
    expect(screen.getByText("video")).toBeInTheDocument()
    expect(screen.getByText("audio")).toBeInTheDocument()
    expect(screen.getByText("image")).toBeInTheDocument()
  })
})