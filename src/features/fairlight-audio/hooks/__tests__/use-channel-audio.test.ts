import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useChannelAudio } from "../use-channel-audio"

// Mock dependencies using vi.hoisted
const { mockUseTimeline, mockUseAudioEngine, mockConnectMediaElement, mockAudioFileManager } = vi.hoisted(() => ({
  mockUseTimeline: vi.fn(),
  mockUseAudioEngine: vi.fn(),
  mockConnectMediaElement: vi.fn(),
  mockAudioFileManager: {
    loadAudioFile: vi.fn(),
    unloadAll: vi.fn(),
  },
}))

vi.mock("@/features/timeline/hooks", () => ({
  useTimeline: mockUseTimeline,
}))

vi.mock("../use-audio-engine", () => ({
  useAudioEngine: mockUseAudioEngine,
}))

vi.mock("../services/audio-file-manager", () => ({
  AudioFileManager: vi.fn(() => mockAudioFileManager),
}))

// Mock data
const mockTimeline = {
  project: {
    sections: [
      {
        id: "section1",
        tracks: [
          {
            id: "track1",
            clips: [
              {
                id: "clip1",
                mediaId: "media1",
                startTime: 0,
              },
              {
                id: "clip2",
                mediaId: "media2",
                startTime: 10,
              },
            ],
          },
        ],
      },
    ],
    resources: {
      media: [
        {
          id: "media1",
          path: "/path/to/audio1.mp3",
          isAudio: true,
          name: "Audio 1",
        },
        {
          id: "media2",
          path: "/path/to/audio2.mp3",
          isAudio: true,
          name: "Audio 2",
        },
        {
          id: "media3",
          path: "/path/to/video.mp4",
          isAudio: false,
          name: "Video",
        },
      ],
    },
  },
  isPlaying: false,
  currentTime: 0,
}

// Mock audio element
const mockAudioElement = {
  currentTime: 0,
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as HTMLAudioElement

describe.skip("useChannelAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock return values
    mockUseTimeline.mockReturnValue(mockTimeline)
    mockUseAudioEngine.mockReturnValue({
      connectMediaElement: mockConnectMediaElement,
      isInitialized: true,
    })
    mockAudioFileManager.loadAudioFile.mockResolvedValue({
      element: mockAudioElement,
      id: "loaded-audio",
    })

    // Reset audio element mocks
    mockAudioElement.currentTime = 0
    vi.mocked(mockAudioElement.play).mockResolvedValue(undefined)
  })

  describe("initialization", () => {
    it("starts with default state", () => {
      const { result } = renderHook(() => useChannelAudio("ch1"))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.audioElement).toBe(null)
    })

    it("provides playback control functions", () => {
      const { result } = renderHook(() => useChannelAudio("ch1"))

      expect(typeof result.current.play).toBe("function")
      expect(typeof result.current.pause).toBe("function")
      expect(typeof result.current.seek).toBe("function")
    })
  })

  describe("audio loading", () => {
    it("does not load audio when no trackId is provided", () => {
      renderHook(() => useChannelAudio("ch1"))

      expect(mockAudioFileManager.loadAudioFile).not.toHaveBeenCalled()
    })

    it("does not load audio when audio engine is not initialized", () => {
      mockUseAudioEngine.mockReturnValue({
        connectMediaElement: mockConnectMediaElement,
        isInitialized: false,
      })

      renderHook(() => useChannelAudio("ch1", "track1"))

      expect(mockAudioFileManager.loadAudioFile).not.toHaveBeenCalled()
    })

    it("loads audio when trackId is provided and engine is initialized", async () => {
      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(mockAudioFileManager.loadAudioFile).toHaveBeenCalledWith("media1", "/path/to/audio1.mp3")
      })

      await waitFor(() => {
        expect(result.current.audioElement).toBe(mockAudioElement)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("connects audio element to audio engine after loading", async () => {
      renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(mockConnectMediaElement).toHaveBeenCalledWith("ch1", mockAudioElement)
      })
    })

    it("handles no clips for track", async () => {
      // Mock timeline with empty clips
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        project: {
          ...mockTimeline.project,
          sections: [
            {
              id: "section1",
              tracks: [
                {
                  id: "track1",
                  clips: [],
                },
              ],
            },
          ],
        },
      })

      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.audioElement).toBe(null)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockAudioFileManager.loadAudioFile).not.toHaveBeenCalled()
    })

    it("handles missing media file in project resources", async () => {
      // Mock timeline with clip that references non-existent media
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        project: {
          ...mockTimeline.project,
          sections: [
            {
              id: "section1",
              tracks: [
                {
                  id: "track1",
                  clips: [
                    {
                      id: "clip1",
                      mediaId: "nonexistent-media",
                      startTime: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      })

      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.error).toBe("Media file nonexistent-media not found")
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("warns when media file is not marked as audio", async () => {
      // Use console.warn spy
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      // Mock timeline with video media
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        project: {
          ...mockTimeline.project,
          sections: [
            {
              id: "section1",
              tracks: [
                {
                  id: "track1",
                  clips: [
                    {
                      id: "clip1",
                      mediaId: "media3", // video file
                      startTime: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      })

      renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("[AudioLoader] Media file media3 is not marked as audio")
      })

      consoleSpy.mockRestore()
    })

    it("handles audio file loading errors", async () => {
      const loadError = new Error("Failed to load audio file")
      mockAudioFileManager.loadAudioFile.mockRejectedValue(loadError)

      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to load audio file")
        expect(result.current.audioElement).toBe(null)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("handles unknown errors gracefully", async () => {
      mockAudioFileManager.loadAudioFile.mockRejectedValue("Unknown error")

      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to load audio")
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe("cleanup", () => {
    it("unloads all audio files on unmount", async () => {
      const { unmount } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(mockAudioFileManager.loadAudioFile).toHaveBeenCalled()
      })

      unmount()

      expect(mockAudioFileManager.unloadAll).toHaveBeenCalledOnce()
    })

    it("unloads audio when trackId changes", async () => {
      const { rerender } = renderHook(({ trackId }) => useChannelAudio("ch1", trackId), {
        initialProps: { trackId: "track1" },
      })

      await waitFor(() => {
        expect(mockAudioFileManager.loadAudioFile).toHaveBeenCalled()
      })

      // Clear mocks to see new calls
      vi.clearAllMocks()

      rerender({ trackId: "track2" })

      expect(mockAudioFileManager.unloadAll).toHaveBeenCalledOnce()
    })

    it("does not call unloadAll when trackId is undefined", () => {
      const { unmount } = renderHook(() => useChannelAudio("ch1"))

      unmount()

      expect(mockAudioFileManager.unloadAll).not.toHaveBeenCalled()
    })
  })

  describe("playback control", () => {
    beforeEach(async () => {
      // Setup audio element for playback tests
      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.audioElement).toBe(mockAudioElement)
      })
    })

    describe("play", () => {
      it("plays audio when timeline is playing", async () => {
        mockUseTimeline.mockReturnValue({
          ...mockTimeline,
          isPlaying: true,
          currentTime: 5,
        })

        const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

        await waitFor(() => {
          expect(result.current.audioElement).toBe(mockAudioElement)
        })

        act(() => {
          result.current.play()
        })

        expect(mockAudioElement.currentTime).toBe(5)
        expect(mockAudioElement.play).toHaveBeenCalledOnce()
      })

      it("does not play audio when timeline is not playing", async () => {
        const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

        await waitFor(() => {
          expect(result.current.audioElement).toBe(mockAudioElement)
        })

        act(() => {
          result.current.play()
        })

        expect(mockAudioElement.play).not.toHaveBeenCalled()
      })

      it("does nothing when audio element is not available", () => {
        const { result } = renderHook(() => useChannelAudio("ch1"))

        act(() => {
          result.current.play()
        })

        expect(mockAudioElement.play).not.toHaveBeenCalled()
      })
    })

    describe("pause", () => {
      it("pauses audio element", async () => {
        const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

        await waitFor(() => {
          expect(result.current.audioElement).toBe(mockAudioElement)
        })

        act(() => {
          result.current.pause()
        })

        expect(mockAudioElement.pause).toHaveBeenCalledOnce()
      })

      it("does nothing when audio element is not available", () => {
        const { result } = renderHook(() => useChannelAudio("ch1"))

        act(() => {
          result.current.pause()
        })

        expect(mockAudioElement.pause).not.toHaveBeenCalled()
      })
    })

    describe("seek", () => {
      it("sets audio element current time", async () => {
        const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

        await waitFor(() => {
          expect(result.current.audioElement).toBe(mockAudioElement)
        })

        act(() => {
          result.current.seek(15)
        })

        expect(mockAudioElement.currentTime).toBe(15)
      })

      it("does nothing when audio element is not available", () => {
        const { result } = renderHook(() => useChannelAudio("ch1"))

        act(() => {
          result.current.seek(15)
        })

        // currentTime should remain unchanged
        expect(mockAudioElement.currentTime).toBe(0)
      })
    })
  })

  describe("timeline synchronization", () => {
    it("plays audio when timeline starts playing", async () => {
      // Start with timeline not playing
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        isPlaying: false,
        currentTime: 3,
      })

      const { result, rerender } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.audioElement).toBe(mockAudioElement)
      })

      // Change timeline to playing
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        isPlaying: true,
        currentTime: 3,
      })

      rerender()

      await waitFor(() => {
        expect(mockAudioElement.currentTime).toBe(3)
        expect(mockAudioElement.play).toHaveBeenCalled()
      })
    })

    it("pauses audio when timeline stops playing", async () => {
      // Start with timeline playing
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        isPlaying: true,
        currentTime: 3,
      })

      const { result, rerender } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.audioElement).toBe(mockAudioElement)
      })

      // Change timeline to not playing
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        isPlaying: false,
        currentTime: 3,
      })

      rerender()

      await waitFor(() => {
        expect(mockAudioElement.pause).toHaveBeenCalled()
      })
    })

    it("seeks audio when timeline current time changes", async () => {
      // Start with timeline at time 0
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        currentTime: 0,
      })

      const { result, rerender } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.audioElement).toBe(mockAudioElement)
      })

      // Change timeline current time
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        currentTime: 10,
      })

      rerender()

      await waitFor(() => {
        expect(mockAudioElement.currentTime).toBe(10)
      })
    })
  })

  describe("function stability", () => {
    it("returns stable function references", async () => {
      const { result, rerender } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.audioElement).toBe(mockAudioElement)
      })

      const firstRender = result.current

      rerender()

      const secondRender = result.current

      // Functions should be the same reference (stable)
      expect(secondRender.play).toBe(firstRender.play)
      expect(secondRender.pause).toBe(firstRender.pause)
      expect(secondRender.seek).toBe(firstRender.seek)
    })
  })

  describe("getAudioClipsForTrack", () => {
    it("returns empty array when no project", () => {
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        project: null,
      })

      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      // Should not attempt to load audio
      expect(mockAudioFileManager.loadAudioFile).not.toHaveBeenCalled()
    })

    it("returns empty array when no trackId", () => {
      const { result } = renderHook(() => useChannelAudio("ch1"))

      // Should not attempt to load audio
      expect(mockAudioFileManager.loadAudioFile).not.toHaveBeenCalled()
    })

    it("filters clips by track id correctly", async () => {
      // Mock timeline with multiple tracks
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        project: {
          ...mockTimeline.project,
          sections: [
            {
              id: "section1",
              tracks: [
                {
                  id: "track1",
                  clips: [{ id: "clip1", mediaId: "media1", startTime: 0 }],
                },
                {
                  id: "track2",
                  clips: [{ id: "clip2", mediaId: "media2", startTime: 0 }],
                },
              ],
            },
          ],
        },
      })

      renderHook(() => useChannelAudio("ch1", "track2"))

      await waitFor(() => {
        expect(mockAudioFileManager.loadAudioFile).toHaveBeenCalledWith("media2", "/path/to/audio2.mp3")
      })
    })

    it("skips clips without mediaId", async () => {
      // Mock timeline with clips without mediaId
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        project: {
          ...mockTimeline.project,
          sections: [
            {
              id: "section1",
              tracks: [
                {
                  id: "track1",
                  clips: [
                    { id: "clip1", mediaId: null, startTime: 0 },
                    { id: "clip2", mediaId: "media1", startTime: 5 },
                  ],
                },
              ],
            },
          ],
        },
      })

      renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(mockAudioFileManager.loadAudioFile).toHaveBeenCalledWith("media1", "/path/to/audio1.mp3")
      })
    })
  })
})
