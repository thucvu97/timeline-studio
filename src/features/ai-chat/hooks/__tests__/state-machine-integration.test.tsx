import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { useBrowserAIIntegration } from "../use-browser-ai-integration"
import { useTimelineAIIntegration } from "../use-timeline-ai-integration"
import { usePlayerAIIntegration } from "../use-player-ai-integration"

// Мокаем зависимости
vi.mock("@/features/browser/services/browser-state-provider", () => ({
  useBrowserState: () => ({
    state: {
      activeTab: "media",
      tabSettings: {
        media: {
          searchQuery: "",
          showFavoritesOnly: false,
          sortBy: "name",
          sortOrder: "asc",
        }
      }
    },
    activeTab: "media",
    currentTabSettings: {},
    switchTab: vi.fn(),
    setSearchQuery: vi.fn(),
    toggleFavorites: vi.fn(),
    setSort: vi.fn(),
    setFilter: vi.fn(),
  })
}))

vi.mock("@/features/app-state/hooks", () => ({
  useAppSettings: () => ({
    state: {
      context: {
        mediaFiles: {
          allFiles: [
            { id: "1", name: "video1.mp4", isVideo: true },
            { id: "2", name: "audio1.mp3", isAudio: true },
          ],
          isLoading: false,
        }
      }
    }
  })
}))

vi.mock("@/features/timeline/hooks", () => ({
  useTimeline: () => ({
    project: {
      tracks: [
        {
          id: "track1",
          type: "video",
          clips: [
            { id: "clip1", startTime: 0, duration: 10 }
          ]
        }
      ],
      sections: []
    },
    isReady: true,
    isPlaying: false,
    currentTime: 0,
    uiState: {
      selectedClipIds: [],
      selectedTrackIds: [],
      editMode: "select",
      timeScale: 1,
    },
    addClip: vi.fn(),
    removeClip: vi.fn(),
    updateClip: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    updateTrack: vi.fn(),
    addSection: vi.fn(),
    removeSection: vi.fn(),
    updateSection: vi.fn(),
    selectClips: vi.fn(),
    clearSelection: vi.fn(),
    seek: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    createProject: vi.fn(),
  })
}))

vi.mock("@/features/video-player", () => ({
  usePlayer: () => ({
    video: { id: "video1", name: "test.mp4", path: "/test.mp4" },
    previewMedia: null,
    isPlaying: false,
    currentTime: 0,
    duration: 100,
    volume: 50,
    currentPlaybackRate: 1,
    isSeeking: false,
    isVideoLoading: false,
    isVideoReady: true,
    appliedEffects: [],
    appliedFilters: [],
    appliedTemplate: null,
    videoSource: "browser",
    speedRampingEnabled: false,
    setIsPlaying: vi.fn(),
    setCurrentTime: vi.fn(),
    setVolume: vi.fn(),
    updatePlaybackRate: vi.fn(),
    applyEffect: vi.fn(),
    applyFilter: vi.fn(),
    applyTemplate: vi.fn(),
    clearEffects: vi.fn(),
    clearFilters: vi.fn(),
    clearTemplate: vi.fn(),
    setPreviewMedia: vi.fn(),
    setVideoSource: vi.fn(),
  })
}))

describe("State Machine AI Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useBrowserAIIntegration", () => {
    it("should provide browser state access", () => {
      const { result } = renderHook(() => useBrowserAIIntegration())
      
      expect(result.current.isReady).toBe(true)
      expect(result.current.filesCount).toBe(2)
      expect(result.current.activeTab).toBe("media")
    })

    it("should not set global window.browserContext", () => {
      renderHook(() => useBrowserAIIntegration())
      
      expect((window as any).browserContext).toBeUndefined()
    })
  })

  describe("useTimelineAIIntegration", () => {
    it("should provide timeline state access", () => {
      const { result } = renderHook(() => useTimelineAIIntegration())
      
      expect(result.current.isReady).toBe(true)
      expect(result.current.hasProject).toBe(true)
      expect(result.current.clipsCount).toBe(1)
      expect(result.current.tracksCount).toBe(1)
      expect(result.current.projectDuration).toBe(10)
    })

    it("should not set global window.timelineContext", () => {
      renderHook(() => useTimelineAIIntegration())
      
      expect((window as any).timelineContext).toBeUndefined()
    })
  })

  describe("usePlayerAIIntegration", () => {
    it("should provide player state access", () => {
      const { result } = renderHook(() => usePlayerAIIntegration())
      
      expect(result.current.isReady).toBe(true)
      expect(result.current.hasMedia).toBe(true)
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.effectsCount).toBe(0)
      expect(result.current.filtersCount).toBe(0)
    })

    it("should not set global window.playerContext", () => {
      renderHook(() => usePlayerAIIntegration())
      
      expect((window as any).playerContext).toBeUndefined()
    })
  })
})