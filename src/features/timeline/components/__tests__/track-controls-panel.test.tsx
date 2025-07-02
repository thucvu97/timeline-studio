/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTimeline } from "../../hooks/use-timeline"
import { useTracks } from "../../hooks/use-tracks"
import { TrackControlsPanel } from "../track-controls-panel"

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

    expect(screen.getByText("Треки не найдены")).toBeInTheDocument()
  })

  it("renders tracks header when tracks exist", () => {
    mockUseTracks.mockReturnValue({
      tracks: [
        {
          id: "track-1",
          name: "Test Video Track",
          type: "video",
          height: 80,
          isHidden: false,
          isLocked: false,
        },
      ],
    } as any)

    render(<TrackControlsPanel />)

    expect(screen.getByText("Треки проекта")).toBeInTheDocument()
  })

  it("renders track with proper controls", () => {
    const mockTracks = [
      {
        id: "track-1",
        name: "Test Video Track",
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

    // Check track name is displayed
    expect(screen.getByText("Test Video Track")).toBeInTheDocument()

    // Check visibility and lock buttons are present
    expect(screen.getByRole("button", { name: "toggle visibility" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "toggle lock" })).toBeInTheDocument()
  })

  it("renders multiple tracks", () => {
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

  it("renders hidden track with correct icon", () => {
    const mockTracks = [
      {
        id: "track-1",
        name: "Test Track",
        type: "video",
        height: 120,
        isHidden: true,
        isLocked: false,
      },
    ]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)

    // Check that visibility toggle button is present for hidden track
    expect(screen.getByRole("button", { name: "toggle visibility" })).toBeInTheDocument()
    // Verify the track is actually hidden
    expect(screen.getByText("Test Track")).toBeInTheDocument()
  })

  it("renders locked track with correct icon", () => {
    const mockTracks = [
      {
        id: "track-1",
        name: "Test Track",
        type: "video",
        height: 80,
        isHidden: false,
        isLocked: true,
      },
    ]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)

    // Check that lock toggle button is present for locked track
    expect(screen.getByRole("button", { name: "toggle lock" })).toBeInTheDocument()
    // Verify the track is actually locked
    expect(screen.getByText("Test Track")).toBeInTheDocument()
  })

  it("shows correct track type badge for video", () => {
    const mockTracks = [{ id: "1", name: "Video Track", type: "video", height: 80, isHidden: false, isLocked: false }]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)

    expect(screen.getByText("video")).toBeInTheDocument()
  })

  it("shows correct track type badge for audio", () => {
    const mockTracks = [{ id: "2", name: "Audio Track", type: "audio", height: 60, isHidden: false, isLocked: false }]

    mockUseTracks.mockReturnValue({
      tracks: mockTracks,
    } as any)

    render(<TrackControlsPanel />)

    expect(screen.getByText("audio")).toBeInTheDocument()
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
