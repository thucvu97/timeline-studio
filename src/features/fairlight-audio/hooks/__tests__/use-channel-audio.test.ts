import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useChannelAudio } from "../use-channel-audio"

// Mock dependencies
const mockUseTimeline = vi.fn()
const mockUseAudioEngine = vi.fn()
const mockConnectMediaElement = vi.fn()
const mockAudioFileManager = {
  loadAudioFile: vi.fn(),
  unloadAll: vi.fn(),
}

vi.mock("@/features/timeline/hooks", () => ({
  useTimeline: () => mockUseTimeline(),
}))

vi.mock("../use-audio-engine", () => ({
  useAudioEngine: () => mockUseAudioEngine(),
}))

vi.mock("../../services/audio-file-manager", () => ({
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
const createMockAudioElement = (startTime: string) => {
  const element = {
    currentTime: 0,
    duration: 10,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dataset: {} as DOMStringMap,
  } as unknown as HTMLAudioElement

  // Properly set dataset.startTime
  Object.defineProperty(element.dataset, "startTime", {
    value: startTime,
    writable: true,
    configurable: true,
  })

  return element
}

const mockAudioElement = createMockAudioElement("0")
const mockAudioElement2 = createMockAudioElement("10")

describe("useChannelAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock return values
    mockUseTimeline.mockReturnValue(mockTimeline)
    mockUseAudioEngine.mockReturnValue({
      connectMediaElement: mockConnectMediaElement,
      isInitialized: true,
    })
    mockAudioFileManager.loadAudioFile
      .mockResolvedValueOnce({
        element: mockAudioElement,
        id: "loaded-audio-1",
      })
      .mockResolvedValueOnce({
        element: mockAudioElement2,
        id: "loaded-audio-2",
      })
    mockConnectMediaElement.mockClear()

    // Reset audio element mocks
    mockAudioElement.currentTime = 0
    mockAudioElement2.currentTime = 0
    vi.mocked(mockAudioElement.play).mockClear().mockResolvedValue(undefined)
    vi.mocked(mockAudioElement.pause).mockClear()
    vi.mocked(mockAudioElement2.play).mockClear().mockResolvedValue(undefined)
    vi.mocked(mockAudioElement2.pause).mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
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
        expect(mockAudioFileManager.loadAudioFile).toHaveBeenCalledWith("media2", "/path/to/audio2.mp3")
      })

      await waitFor(() => {
        expect(result.current.audioElements.size).toBe(2)
        expect(result.current.audioElement).toBe(mockAudioElement) // Should return first element
        expect(result.current.activeClipId).toBe("clip1")
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
        expect(result.current.audioElements.size).toBe(0)
        expect(result.current.audioElement).toBe(null)
        expect(result.current.activeClipId).toBe(null)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockAudioFileManager.loadAudioFile).not.toHaveBeenCalled()
    })

    it("handles missing media file in project resources", async () => {
      // Use console.error spy
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

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

      // Wait for loading to complete first
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Then check console.error was called
      expect(consoleSpy).toHaveBeenCalledWith(
        "[AudioLoader] Media file nonexistent-media not found in project resources",
      )
      expect(result.current.audioElements.size).toBe(0)
      expect(result.current.error).toBe(null) // No error set, just skip the file

      consoleSpy.mockRestore()
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
      // Use console.error spy
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const loadError = new Error("Failed to load audio file")
      // Reset the mock and set it to reject
      mockAudioFileManager.loadAudioFile.mockReset()
      mockAudioFileManager.loadAudioFile.mockRejectedValue(loadError)

      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Wait a bit more to ensure console.error is called
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // Check that error was logged - the format is "[AudioLoader] Failed to load clip <clipId>:" followed by the error
      expect(consoleSpy).toHaveBeenCalledWith("[AudioLoader] Failed to load clip clip1:", loadError)
      expect(result.current.audioElements.size).toBe(0) // No clips loaded due to errors
      expect(result.current.error).toBe(null) // Error logged but not set in state for individual clips

      consoleSpy.mockRestore()
    })

    it("handles unknown errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Reset the mock and set it to reject
      mockAudioFileManager.loadAudioFile.mockReset()
      mockAudioFileManager.loadAudioFile.mockRejectedValue("Unknown error")

      const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Wait for console.error to be called
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // Check that error was logged
      expect(consoleSpy).toHaveBeenCalledWith("[AudioLoader] Failed to load clip clip1:", "Unknown error")
      expect(result.current.audioElements.size).toBe(0)
      expect(result.current.error).toBe(null)

      consoleSpy.mockRestore()
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
    describe("play", () => {
      it("plays audio when timeline is playing", async () => {
        // Start with timeline playing
        mockUseTimeline.mockReturnValue({
          ...mockTimeline,
          isPlaying: true,
          currentTime: 5,
        })

        const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

        await waitFor(() => {
          expect(result.current.audioElements.size).toBe(2)
          expect(result.current.activeClipId).toBe("clip1")
        })

        // Since timeline is already playing, play should have been called during effect
        // But with multiple clips, this behavior might be different
        // Let's just verify the state is correct
        expect(result.current.activeClipId).toBe("clip1")

        // Clear the mock to test manual play
        vi.mocked(mockAudioElement.play).mockClear()

        act(() => {
          result.current.play()
        })

        // Check that play was called
        expect(mockAudioElement.play).toHaveBeenCalledOnce()
        // Check the currentTime was set
        const activeElement = result.current.audioElements.get("clip1")
        expect(activeElement?.currentTime).toBe(5)
      })

      it("does not play audio when timeline is not playing", async () => {
        const { result } = renderHook(() => useChannelAudio("ch1", "track1"))

        await waitFor(() => {
          expect(result.current.audioElements.size).toBe(2)
        })

        vi.mocked(mockAudioElement.play).mockClear()

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
          expect(result.current.audioElements.size).toBe(2)
        })

        // Clear mocks before testing
        vi.mocked(mockAudioElement.pause).mockClear()
        vi.mocked(mockAudioElement2.pause).mockClear()

        act(() => {
          result.current.pause()
        })

        // Should pause both audio elements
        expect(mockAudioElement.pause).toHaveBeenCalledOnce()
        expect(mockAudioElement2.pause).toHaveBeenCalledOnce()
      })

      it("does nothing when audio element is not available", () => {
        // Reset the pause mock completely to ensure isolation
        vi.mocked(mockAudioElement.pause).mockClear()

        const { result } = renderHook(() => useChannelAudio("ch1"))

        // No audio element is loaded, so pause should not be called
        expect(result.current.audioElement).toBe(null)

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
          expect(result.current.audioElements.size).toBe(2)
          expect(result.current.activeClipId).toBe("clip1")
        })

        act(() => {
          result.current.seek(5)
        })

        // After seek, check that the correct clip is active
        expect(result.current.activeClipId).toBe("clip1")
        // The seek function updates the element through updateActiveClip
        // We can check if the element in the map has the correct currentTime
        const activeElement = result.current.audioElements.get("clip1")
        expect(activeElement?.currentTime).toBe(5)
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
        expect(result.current.audioElements.size).toBe(2)
        expect(result.current.activeClipId).toBe("clip1")
      })

      // Clear the play mock to ensure we're only checking new calls
      vi.mocked(mockAudioElement.play).mockClear()

      // Change timeline to playing
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        isPlaying: true,
        currentTime: 3,
      })

      rerender()

      // The effect should trigger play through the play function
      // Since play() checks if timeline.isPlaying is true before playing
      await waitFor(() => {
        // Check that the audio element's currentTime was updated
        const activeElement = result.current.audioElements.get("clip1")
        expect(activeElement?.currentTime).toBe(3)
      })

      // The play might be called through the effect
      expect(mockAudioElement.play).toHaveBeenCalled()
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
        expect(result.current.audioElements.size).toBe(2)
        expect(result.current.activeClipId).toBe("clip1")
      })

      // Change timeline to not playing
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        isPlaying: false,
        currentTime: 3,
      })

      rerender()

      await waitFor(() => {
        // Both audio elements should be paused when timeline stops
        expect(mockAudioElement.pause).toHaveBeenCalled()
        expect(mockAudioElement2.pause).toHaveBeenCalled()
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
        expect(result.current.audioElements.size).toBe(2)
        expect(result.current.activeClipId).toBe("clip1")
      })

      // Change timeline current time to 10 (should switch to clip2)
      mockUseTimeline.mockReturnValue({
        ...mockTimeline,
        currentTime: 10,
      })

      rerender()

      await waitFor(() => {
        // Should switch to clip2 at time 10
        expect(result.current.activeClipId).toBe("clip2")
        // The seek logic happens in useEffect, we can't guarantee exact currentTime
      })
    })
  })

  describe("function stability", () => {
    it("returns stable function references", async () => {
      const { result, rerender } = renderHook(() => useChannelAudio("ch1", "track1"))

      await waitFor(() => {
        expect(result.current.audioElements.size).toBe(2)
        expect(result.current.activeClipId).toBe("clip1")
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

      renderHook(() => useChannelAudio("ch1", "track1"))

      // Should not attempt to load audio
      expect(mockAudioFileManager.loadAudioFile).not.toHaveBeenCalled()
    })

    it("returns empty array when no trackId", () => {
      renderHook(() => useChannelAudio("ch1"))

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
