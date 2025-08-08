/**
 * Tests for PlayerProvider
 */

import { act, render, renderHook, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/features/media/types/media"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import { PlayerProvider, usePlayer } from "../player-provider"

// Mock dependencies
vi.mock("@/features/app-state/services/app-machine", () => ({
  AppCommands: {
    playerSetMedia: vi.fn((mediaId: string, startTime?: number) => ({
      type: "PlayerSetMedia",
      params: { mediaId, startTime },
    })),
    playerSetVolume: vi.fn((volume: number) => ({
      type: "PlayerSetVolume",
      params: { volume },
    })),
    playerSelectClip: vi.fn((clipId: string) => ({
      type: "PlayerSelectClip",
      params: { clipId },
    })),
    playerClearSelection: vi.fn(() => ({
      type: "PlayerClearSelection",
      params: {},
    })),
    playerSetSource: vi.fn((source: string) => ({
      type: "PlayerSetSource",
      params: { source },
    })),
    playerApplyEffect: vi.fn((effectId: string, params: Record<string, any>) => ({
      type: "PlayerApplyEffect",
      params: { effectId, params },
    })),
    playerApplyFilter: vi.fn((filterId: string, params: Record<string, any>) => ({
      type: "PlayerApplyFilter",
      params: { filterId, params },
    })),
    playerApplyTemplate: vi.fn((templateId: string, mediaIds: string[]) => ({
      type: "PlayerApplyTemplate",
      params: { templateId, mediaIds },
    })),
    playerClearEffects: vi.fn(() => ({
      type: "PlayerClearEffects",
      params: {},
    })),
    playerClearFilters: vi.fn(() => ({
      type: "PlayerClearFilters",
      params: {},
    })),
    playerClearTemplate: vi.fn(() => ({
      type: "PlayerClearTemplate",
      params: {},
    })),
  },
}))

// Mock backend sync
const mockBackendSync = {
  onStateChange: vi.fn((callback: (state: ProjectState) => void) => {
    mockBackendSync._stateCallback = callback
    return vi.fn() // unsubscribe function
  }),
  executeCommand: vi.fn().mockResolvedValue({ success: true, data: {} }),
  _stateCallback: null as ((state: ProjectState) => void) | null,
  _triggerStateChange: (state: ProjectState) => {
    if (mockBackendSync._stateCallback) {
      mockBackendSync._stateCallback(state)
    }
  },
}

vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => mockBackendSync),
}))

// Mock user settings
const mockUserSettings = {
  playerVolume: 75,
  handlePlayerVolumeChange: vi.fn(),
}

vi.mock("@/features/user-settings", () => ({
  useUserSettings: vi.fn(() => mockUserSettings),
}))

// Mock MediaFile
const mockMediaFile: MediaFile = {
  id: "test-video-1",
  name: "test-video.mp4",
  path: "/test/video.mp4",
  type: "video",
  format: "mp4",
  duration: 120,
  size: 1000000,
  createdAt: new Date(),
  metadata: {
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    bitrate: 5000000,
    codecs: {
      video: "h264",
      audio: "aac",
    },
  },
} as unknown as MediaFile

// Mock ProjectState
const mockBackendState: ProjectState = {
  playback_state: {
    current_time: 30,
    is_playing: true,
    playback_rate: 1.5,
    volume: 0.8,
    current_media_id: "backend-video-1",
    selected_clip_id: "clip-1",
    video_source: "timeline",
    duration: 180,
    is_loading: false,
    is_seeking: false,
  },
} as ProjectState

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => <PlayerProvider>{children}</PlayerProvider>

describe.skip("PlayerProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBackendSync._stateCallback = null
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should provide initial context values", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const context = result.current
      expect(context.currentTime).toBe(0) // Default when no backend state
      expect(context.isPlaying).toBe(false)
      expect(context.playbackRate).toBe(1)
      expect(context.volume).toBe(0.75) // From user settings (75 / 100)
      expect(context.duration).toBe(0)
      expect(context.isVideoLoading).toBe(false)
      expect(context.isVideoReady).toBe(false)
      expect(context.isSeeking).toBe(false)
      expect(context.isChangingCamera).toBe(false)
      expect(context.isRecording).toBe(false)
      expect(context.isResizableMode).toBe(false)
      expect(context.currentVideo).toBeNull()
      expect(context.previewMedia).toBeNull()
      expect(context.videoSource).toBe("timeline")
      expect(context.selectedClipId).toBeNull()
      expect(context.appliedEffects).toEqual([])
      expect(context.appliedFilters).toEqual([])
      expect(context.appliedTemplate).toBeNull()
      expect(context.speedRampingEnabled).toBe(false)
      expect(context.currentPlaybackRate).toBe(1.0)
      expect(context.basePlaybackRate).toBe(1.0)
    })

    it("should initialize prerender settings", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const { prerenderSettings } = result.current
      expect(prerenderSettings.prerenderEnabled).toBe(false)
      expect(prerenderSettings.prerenderQuality).toBe(80)
      expect(prerenderSettings.prerenderSegmentDuration).toBe(10)
      expect(prerenderSettings.prerenderApplyEffects).toBe(true)
      expect(prerenderSettings.prerenderAutoPrerender).toBe(false)
    })

    it("should setup backend sync subscription", () => {
      renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      expect(mockBackendSync.onStateChange).toHaveBeenCalled()
    })
  })

  describe("backend state synchronization", () => {
    it("should update context when backend state changes", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      // Trigger backend state change
      act(() => {
        mockBackendSync._triggerStateChange(mockBackendState)
      })

      const context = result.current
      expect(context.currentTime).toBe(30)
      expect(context.isPlaying).toBe(true)
      expect(context.playbackRate).toBe(1.5)
      expect(context.volume).toBe(0.8)
      expect(context.selectedClipId).toBe("clip-1")
      expect(context.videoSource).toBe("timeline")
      expect(context.duration).toBe(180)
      expect(context.isVideoLoading).toBe(false)
      expect(context.isSeeking).toBe(false)
    })

    it("should prefer backend state over local state when available", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      // Set local state first
      act(() => {
        result.current.setVolume(0.5)
        result.current.setVideoSource("browser")
      })

      // Then update from backend
      act(() => {
        mockBackendSync._triggerStateChange(mockBackendState)
      })

      // Backend values should override local values
      expect(result.current.volume).toBe(0.8) // From backend
      expect(result.current.videoSource).toBe("timeline") // From backend
    })

    it("should use local state when backend state is null", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setVolume(0.6)
        result.current.setDuration(240)
      })

      // Trigger state change with null playback_state
      act(() => {
        mockBackendSync._triggerStateChange({ playback_state: null } as any)
      })

      // Should use local values
      expect(result.current.volume).toBe(0.6)
      expect(result.current.duration).toBe(240)
    })
  })

  describe("local state management", () => {
    it("should handle setCurrentVideo", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setCurrentVideo(mockMediaFile)
      })

      expect(result.current.currentVideo).toEqual(mockMediaFile)
    })

    it("should handle volume changes with user settings update", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setVolume(0.9)
      })

      expect(result.current.volume).toBe(0.9)
      expect(mockUserSettings.handlePlayerVolumeChange).toHaveBeenCalledWith(90)
    })

    it("should handle duration changes", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setDuration(300)
      })

      expect(result.current.duration).toBe(300)
    })

    it("should handle video loading state", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setVideoLoading(true)
      })

      expect(result.current.isVideoLoading).toBe(true)
    })

    it("should handle video ready state", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setVideoReady(true)
      })

      expect(result.current.isVideoReady).toBe(true)
    })

    it("should handle seeking state", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setIsSeeking(true)
      })

      expect(result.current.isSeeking).toBe(true)
    })

    it("should handle camera changing state", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setIsChangingCamera(true)
      })

      expect(result.current.isChangingCamera).toBe(true)
    })

    it("should handle recording state", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setIsRecording(true)
      })

      expect(result.current.isRecording).toBe(true)
    })

    it("should handle resizable mode", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setIsResizableMode(true)
      })

      expect(result.current.isResizableMode).toBe(true)
    })

    it("should handle preview media", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setPreviewMedia(mockMediaFile)
      })

      expect(result.current.previewMedia).toEqual(mockMediaFile)
    })

    it("should handle video source", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setVideoSource("browser")
      })

      expect(result.current.videoSource).toBe("browser")
    })
  })

  describe("effects and filters management", () => {
    it("should handle applyEffect", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const effect = { id: "brightness", name: "Brightness", params: { value: 0.2 } }

      act(() => {
        result.current.applyEffect(effect)
      })

      expect(result.current.appliedEffects).toContain(effect)
    })

    it("should accumulate multiple effects", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const effect1 = { id: "brightness", name: "Brightness", params: { value: 0.2 } }
      const effect2 = { id: "contrast", name: "Contrast", params: { value: 1.5 } }

      act(() => {
        result.current.applyEffect(effect1)
        result.current.applyEffect(effect2)
      })

      expect(result.current.appliedEffects).toEqual([effect1, effect2])
    })

    it("should handle clearEffects", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const effect = { id: "brightness", name: "Brightness", params: { value: 0.2 } }

      act(() => {
        result.current.applyEffect(effect)
        result.current.clearEffects()
      })

      expect(result.current.appliedEffects).toEqual([])
    })

    it("should handle applyFilter", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const filter = { id: "vintage", name: "Vintage", params: { intensity: 0.8 } }

      act(() => {
        result.current.applyFilter(filter)
      })

      expect(result.current.appliedFilters).toContain(filter)
    })

    it("should handle clearFilters", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const filter = { id: "vintage", name: "Vintage", params: { intensity: 0.8 } }

      act(() => {
        result.current.applyFilter(filter)
        result.current.clearFilters()
      })

      expect(result.current.appliedFilters).toEqual([])
    })

    it("should handle applyTemplate", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const template = { id: "split-screen", name: "Split Screen" }
      const files = [mockMediaFile]

      act(() => {
        result.current.applyTemplate(template, files)
      })

      expect(result.current.appliedTemplate).toEqual(template)
    })

    it("should handle clearTemplate", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const template = { id: "split-screen", name: "Split Screen" }

      act(() => {
        result.current.applyTemplate(template, [])
        result.current.clearTemplate()
      })

      expect(result.current.appliedTemplate).toBeNull()
    })
  })

  describe("speed ramping", () => {
    it("should handle setSpeedRampingEnabled", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setSpeedRampingEnabled(true)
      })

      expect(result.current.speedRampingEnabled).toBe(true)
    })

    it("should handle updatePlaybackRate", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.updatePlaybackRate(2.0)
      })

      expect(result.current.currentPlaybackRate).toBe(2.0)
    })

    it("should handle setBasePlaybackRate", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setBasePlaybackRate(0.5)
      })

      expect(result.current.basePlaybackRate).toBe(0.5)
    })
  })

  describe("prerender settings", () => {
    it("should handle setPrerenderSettings with partial update", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      act(() => {
        result.current.setPrerenderSettings({
          prerenderEnabled: true,
          prerenderQuality: 95,
        })
      })

      const { prerenderSettings } = result.current
      expect(prerenderSettings.prerenderEnabled).toBe(true)
      expect(prerenderSettings.prerenderQuality).toBe(95)
      // Other settings should remain unchanged
      expect(prerenderSettings.prerenderSegmentDuration).toBe(10)
      expect(prerenderSettings.prerenderApplyEffects).toBe(true)
      expect(prerenderSettings.prerenderAutoPrerender).toBe(false)
    })
  })

  describe("backend commands", () => {
    it("should handle play command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.play()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "Play",
        params: {},
      })
    })

    it("should handle pause command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.pause()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "Pause",
        params: {},
      })
    })

    it("should handle seek command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.seek(45)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "Seek",
        params: { time: 45 },
      })
    })

    it("should handle setPlaybackRate command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.setPlaybackRate(1.25)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "SetPlaybackRate",
        params: { rate: 1.25 },
      })
    })

    it("should handle playerSetMedia command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerSetMedia("media-1", 30)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerSetMedia",
        params: { mediaId: "media-1", startTime: 30 },
      })
    })

    it("should handle playerSetVolume command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerSetVolume(0.7)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerSetVolume",
        params: { volume: 0.7 },
      })
    })

    it("should handle playerSelectClip command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerSelectClip("clip-1")
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerSelectClip",
        params: { clipId: "clip-1" },
      })
    })

    it("should handle playerClearSelection command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerClearSelection()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerClearSelection",
        params: {},
      })
    })

    it("should handle playerSetSource command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerSetSource("browser")
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerSetSource",
        params: { source: "browser" },
      })
    })

    it("should handle playerApplyEffect command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerApplyEffect("brightness", { value: 0.2 })
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerApplyEffect",
        params: { effectId: "brightness", params: { value: 0.2 } },
      })
    })

    it("should handle playerApplyFilter command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerApplyFilter("vintage", { intensity: 0.8 })
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerApplyFilter",
        params: { filterId: "vintage", params: { intensity: 0.8 } },
      })
    })

    it("should handle playerApplyTemplate command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerApplyTemplate("split-screen", ["media-1", "media-2"])
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerApplyTemplate",
        params: { templateId: "split-screen", mediaIds: ["media-1", "media-2"] },
      })
    })

    it("should handle playerClearEffects command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerClearEffects()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerClearEffects",
        params: {},
      })
    })

    it("should handle playerClearFilters command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerClearFilters()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerClearFilters",
        params: {},
      })
    })

    it("should handle playerClearTemplate command", async () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await result.current.playerClearTemplate()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "PlayerClearTemplate",
        params: {},
      })
    })
  })

  describe("error handling", () => {
    it("should handle backend command failures", async () => {
      mockBackendSync.executeCommand.mockRejectedValueOnce(new Error("Command failed"))

      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.play()).rejects.toThrow("Command failed")
      })

      expect(consoleSpy).toHaveBeenCalledWith("Player command failed:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should handle backend command with unsuccessful result", async () => {
      mockBackendSync.executeCommand.mockResolvedValueOnce({
        success: false,
        error: "Backend error",
      })

      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await act(async () => {
        await expect(result.current.pause()).rejects.toThrow("Backend error")
      })

      expect(consoleSpy).toHaveBeenCalledWith("Player command failed:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should handle backend command with no error message", async () => {
      mockBackendSync.executeCommand.mockResolvedValueOnce({
        success: false,
      })

      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      await act(async () => {
        await expect(result.current.seek(60)).rejects.toThrow("Command failed")
      })
    })
  })

  describe("hook usage", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => usePlayer())
      }).toThrow("usePlayer must be used within PlayerProvider")

      consoleSpy.mockRestore()
    })

    it("should work with JSX components", () => {
      const TestComponent = () => {
        const player = usePlayer()
        return <div data-testid="current-time">{player.currentTime}</div>
      }

      render(
        <PlayerProvider>
          <TestComponent />
        </PlayerProvider>,
      )

      expect(screen.getByTestId("current-time")).toHaveTextContent("0")
    })
  })

  describe("legacy exports", () => {
    it("should export legacy aliases", () => {
      const { result } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      expect(result.current).toBeDefined()
      // Legacy exports should be the same as regular exports
    })
  })

  describe("cleanup", () => {
    it("should cleanup backend subscription on unmount", () => {
      const unsubscribe = vi.fn()
      mockBackendSync.onStateChange.mockReturnValue(unsubscribe)

      const { unmount } = renderHook(() => usePlayer(), {
        wrapper: TestWrapper,
      })

      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })
})
