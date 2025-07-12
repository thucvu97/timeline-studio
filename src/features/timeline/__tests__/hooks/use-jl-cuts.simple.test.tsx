import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useJLCuts } from "../../hooks/use-jl-cuts"
import { useTimeline } from "../../hooks/use-timeline"

// Mock useTimeline hook
vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: vi.fn(),
}))

describe("useJLCuts - Simple Tests", () => {
  const mockSend = vi.fn()

  const mockVideoClip = {
    id: "video-1",
    trackId: "video-track",
    linkedClipId: "audio-1",
    isLinked: true,
    audioOffset: 0,
  }

  const mockAudioClip = {
    id: "audio-1",
    trackId: "audio-track",
    linkedClipId: "video-1",
    isLinked: true,
    audioOffset: 0,
  }

  const mockProject = {
    sections: [
      {
        tracks: [
          {
            id: "video-track",
            type: "video",
            clips: [mockVideoClip],
          },
          {
            id: "audio-track",
            type: "audio",
            clips: [mockAudioClip],
          },
        ],
      },
    ],
    globalTracks: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTimeline as any).mockReturnValue({
      project: mockProject,
      send: mockSend,
    })
  })

  it("should create J-Cut correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    act(() => {
      result.current.createJCut("video-1", 0.5)
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "CREATE_JL_CUT",
      clipId: "audio-1",
      cutType: "j-cut",
      offset: 0.5,
    })
  })

  it("should create L-Cut correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    act(() => {
      result.current.createLCut("video-1", 0.5)
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "CREATE_JL_CUT",
      clipId: "audio-1",
      cutType: "l-cut",
      offset: 0.5,
    })
  })

  it("should reset cut correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    act(() => {
      result.current.resetCut("video-1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "RESET_JL_CUT",
      clipId: "audio-1",
    })
  })

  it("should link clips correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    act(() => {
      result.current.linkClips("video-2", "audio-2")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "LINK_CLIPS",
      videoClipId: "video-2",
      audioClipId: "audio-2",
    })
  })

  it("should unlink clips correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    act(() => {
      result.current.unlinkClips("video-1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "UNLINK_CLIPS",
      clipId: "video-1",
      linkedClipId: "audio-1",
    })
  })

  it("should identify video clip correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    expect(result.current.isVideoClip(mockVideoClip as any)).toBe(true)
    expect(result.current.isAudioClip(mockVideoClip as any)).toBe(false)
  })

  it("should identify audio clip correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    expect(result.current.isAudioClip(mockAudioClip as any)).toBe(true)
    expect(result.current.isVideoClip(mockAudioClip as any)).toBe(false)
  })

  it("should get linked clip correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    const linkedClip = result.current.getLinkedClip("video-1")
    expect(linkedClip?.id).toBe("audio-1")
  })

  it("should detect J/L cut correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    // No offset - no J/L cut
    expect(result.current.hasJLCut("video-1")).toBe(false)

    // With offset - has J/L cut
    mockAudioClip.audioOffset = 0.5
    expect(result.current.hasJLCut("video-1")).toBe(true)
  })
})
