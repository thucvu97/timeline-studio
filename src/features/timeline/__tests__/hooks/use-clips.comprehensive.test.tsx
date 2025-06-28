/**
 * Comprehensive tests for useClips hook
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"
import { TimelineProviders } from "@/test/test-utils"

import { useClips } from "../../hooks/use-clips"
import { useTimeline } from "../../hooks/use-timeline"
import { TimelineClip, TimelineProject, TrackType } from "../../types"

// Mock useTimeline hook
vi.mock("../../hooks/use-timeline")

// Mock data
const mockMediaFile: MediaFile = {
  id: "media-1",
  path: "/path/to/video.mp4",
  type: "video",
  name: "test-video.mp4",
  size: 1000000,
  duration: 60,
  dimensions: { width: 1920, height: 1080 },
  lastModified: Date.now(),
  frameRate: 30,
  codec: "h264",
  bitrate: 5000000,
  hasAudio: true,
  hasVideo: true,
}

const mockClip: TimelineClip = {
  id: "clip-1",
  trackId: "track-1",
  mediaId: "media-1",
  startTime: 0,
  duration: 10,
  trimStart: 0,
  trimEnd: 10,
  volume: 1,
  speed: 1,
  opacity: 1,
  isReversed: false,
  position: {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
}

const mockProject: TimelineProject = {
  id: "project-1",
  name: "Test Project",
  settings: {
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    aspectRatio: "16:9",
    duration: 300,
    backgroundColor: "#000000",
  },
  resources: {
    media: [mockMediaFile],
    fonts: [],
    colors: [],
    effects: [],
    transitions: [],
  },
  sections: [
    {
      id: "section-1",
      name: "Section 1",
      startTime: 0,
      duration: 60,
      tracks: [
        {
          id: "track-1",
          name: "Video Track",
          type: "video" as TrackType,
          order: 0,
          enabled: true,
          locked: false,
          height: 80,
          clips: [mockClip],
        },
        {
          id: "track-2",
          name: "Audio Track",
          type: "audio" as TrackType,
          order: 1,
          enabled: true,
          locked: false,
          height: 60,
          clips: [],
        },
      ],
    },
  ],
  globalTracks: [
    {
      id: "global-track-1",
      name: "Title Track",
      type: "title" as TrackType,
      order: 0,
      enabled: true,
      locked: false,
      height: 60,
      clips: [],
    },
  ],
  markers: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const mockUseTimeline = {
  project: mockProject,
  uiState: {
    selectedClipIds: [],
    selectedTrackIds: [],
    currentTime: 0,
    timelineZoom: 1,
    timelineScroll: 0,
    snapEnabled: true,
    rippleEditEnabled: false,
  },
  addClip: vi.fn(),
  removeClip: vi.fn(),
  updateClip: vi.fn(),
  moveClip: vi.fn(),
  splitClip: vi.fn(),
  trimClip: vi.fn(),
  selectClips: vi.fn(),
  clearSelection: vi.fn(),
}

describe("useClips - Comprehensive Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTimeline).mockReturnValue(mockUseTimeline as any)
  })

  describe("Clip Operations", () => {
    it("should find clip by ID and enrich with media file", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clip = result.current.findClip("clip-1")
      expect(clip).toBeDefined()
      expect(clip?.id).toBe("clip-1")
      expect(clip?.mediaFile).toEqual(mockMediaFile)
    })

    it("should get clips by track", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clips = result.current.getClipsByTrack("track-1")
      expect(clips).toHaveLength(1)
      expect(clips[0].id).toBe("clip-1")
    })

    it("should get clips in time range", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clips = result.current.getClipsInRange(0, 15)
      expect(clips).toHaveLength(1)
      expect(clips[0].id).toBe("clip-1")
    })

    it("should get clips by track type", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const videoClips = result.current.getClipsByType("video")
      expect(videoClips).toHaveLength(1)
      expect(videoClips[0].id).toBe("clip-1")

      const audioClips = result.current.getClipsByType("audio")
      expect(audioClips).toHaveLength(0)
    })

    it("should find nearest clip to time", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clip = result.current.findNearestClipToTime(5)
      expect(clip).toBeDefined()
      expect(clip?.id).toBe("clip-1")
    })
  })

  describe("Clip Actions", () => {
    it("should duplicate clip", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.duplicateClip("clip-1")
      })

      expect(mockUseTimeline.addClip).toHaveBeenCalledWith(
        "track-1",
        mockMediaFile,
        11, // startTime after original clip
        10  // same duration
      )
    })

    it("should duplicate clip to different track", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.duplicateClip("clip-1", "track-2")
      })

      expect(mockUseTimeline.addClip).toHaveBeenCalledWith(
        "track-2",
        mockMediaFile,
        11,
        10
      )
    })

    it("should not duplicate non-existent clip", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.duplicateClip("non-existent")
      })

      expect(mockUseTimeline.addClip).not.toHaveBeenCalled()
    })
  })

  describe("Selection Management", () => {
    it("should select single clip", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.selectClip("clip-1")
      })

      expect(mockUseTimeline.selectClips).toHaveBeenCalledWith(["clip-1"])
    })

    it("should add clip to selection", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockUseTimeline,
        uiState: {
          ...mockUseTimeline.uiState,
          selectedClipIds: ["clip-2"],
        },
      } as any)

      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.selectClip("clip-1", true)
      })

      expect(mockUseTimeline.selectClips).toHaveBeenCalledWith(["clip-2", "clip-1"])
    })

    it("should remove clip from selection when already selected", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockUseTimeline,
        uiState: {
          ...mockUseTimeline.uiState,
          selectedClipIds: ["clip-1", "clip-2"],
        },
      } as any)

      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.selectClip("clip-1", true)
      })

      expect(mockUseTimeline.selectClips).toHaveBeenCalledWith(["clip-2"])
    })

    it("should select multiple clips", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.selectMultipleClips(["clip-1", "clip-2", "clip-3"])
      })

      expect(mockUseTimeline.selectClips).toHaveBeenCalledWith(["clip-1", "clip-2", "clip-3"])
    })

    it("should select clips in area", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.selectClipsInArea(0, 15, ["track-1"])
      })

      expect(mockUseTimeline.selectClips).toHaveBeenCalledWith(["clip-1"])
    })

    it("should clear clip selection", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.clearClipSelection()
      })

      expect(mockUseTimeline.clearSelection).toHaveBeenCalled()
    })
  })

  describe("Clip Properties", () => {
    it("should set clip volume with bounds", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.setClipVolume("clip-1", 0.5)
      })
      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", { volume: 0.5 })

      act(() => {
        result.current.setClipVolume("clip-1", -1)
      })
      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", { volume: 0 })

      act(() => {
        result.current.setClipVolume("clip-1", 2)
      })
      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", { volume: 1 })
    })

    it("should set clip speed with bounds", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.setClipSpeed("clip-1", 2)
      })
      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", { speed: 2 })

      act(() => {
        result.current.setClipSpeed("clip-1", 0)
      })
      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", { speed: 0.1 })

      act(() => {
        result.current.setClipSpeed("clip-1", 20)
      })
      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", { speed: 10 })
    })

    it("should set clip opacity with bounds", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.setClipOpacity("clip-1", 0.7)
      })
      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", { opacity: 0.7 })
    })

    it("should toggle clip reverse", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.toggleClipReverse("clip-1")
      })

      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", { isReversed: true })
    })

    it("should not toggle reverse for non-existent clip", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.toggleClipReverse("non-existent")
      })

      expect(mockUseTimeline.updateClip).not.toHaveBeenCalled()
    })

    it("should set clip position with bounds", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      act(() => {
        result.current.setClipPosition("clip-1", {
          x: 0.5,
          y: 0.5,
          width: 0.8,
          height: 0.8,
        })
      })

      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", {
        position: {
          x: 0.5,
          y: 0.5,
          width: 0.8,
          height: 0.8,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
      })

      // Test with out of bounds values
      act(() => {
        result.current.setClipPosition("clip-1", {
          x: -1,
          y: 2,
          width: 1.5,
          height: -0.5,
        })
      })

      expect(mockUseTimeline.updateClip).toHaveBeenCalledWith("clip-1", {
        position: {
          x: 0,
          y: 1,
          width: 1,
          height: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
      })
    })
  })

  describe("Validation and Checks", () => {
    it("should check if clip can be placed", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const canPlace = result.current.canPlaceClip("track-1", 15, 10)
      expect(canPlace).toBe(true)

      const cannotPlace = result.current.canPlaceClip("track-1", 5, 10)
      expect(cannotPlace).toBe(false)
    })

    it("should get clip conflicts", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const conflicts = result.current.getClipConflicts("track-1", 5, 10)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].id).toBe("clip-1")

      const noConflicts = result.current.getClipConflicts("track-1", 15, 10)
      expect(noConflicts).toHaveLength(0)
    })

    it("should exclude clip from conflict check", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const conflicts = result.current.getClipConflicts("track-1", 5, 10, "clip-1")
      expect(conflicts).toHaveLength(0)
    })

    it("should check if clip is selected", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockUseTimeline,
        uiState: {
          ...mockUseTimeline.uiState,
          selectedClipIds: ["clip-1"],
        },
      } as any)

      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.isClipSelected("clip-1")).toBe(true)
      expect(result.current.isClipSelected("clip-2")).toBe(false)
    })
  })

  describe("Utilities", () => {
    it("should get clip at specific time", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clip = result.current.getClipAtTime("track-1", 5)
      expect(clip).toBeDefined()
      expect(clip?.id).toBe("clip-1")

      const noClip = result.current.getClipAtTime("track-1", 15)
      expect(noClip).toBeNull()
    })

    it("should get clip statistics", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const stats = result.current.getClipStats()
      expect(stats).toEqual({
        totalClips: 1,
        totalDuration: 10,
        selectedCount: 0,
        clipsByType: {
          video: 1,
          audio: 0,
          image: 0,
          title: 0,
          subtitle: 0,
          music: 0,
          voiceover: 0,
          sfx: 0,
          ambient: 0,
        },
      })
    })

    it("should count selected clips in statistics", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockUseTimeline,
        uiState: {
          ...mockUseTimeline.uiState,
          selectedClipIds: ["clip-1"],
        },
      } as any)

      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const stats = result.current.getClipStats()
      expect(stats.selectedCount).toBe(1)
    })
  })

  describe("Computed Values", () => {
    it("should compute clips by track", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.clipsByTrack).toEqual({
        "track-1": [expect.objectContaining({ id: "clip-1" })],
      })
    })

    it("should compute selected clips", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockUseTimeline,
        uiState: {
          ...mockUseTimeline.uiState,
          selectedClipIds: ["clip-1"],
        },
      } as any)

      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.selectedClips).toHaveLength(1)
      expect(result.current.selectedClips[0].id).toBe("clip-1")
    })
  })

  describe("Edge Cases", () => {
    it("should handle project without sections", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockUseTimeline,
        project: {
          ...mockProject,
          sections: [],
        },
      } as any)

      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.clips).toEqual([])
      expect(result.current.getClipsByType("video")).toEqual([])
    })

    it("should handle null project", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockUseTimeline,
        project: null,
      } as any)

      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.clips).toEqual([])
      expect(result.current.findClip("any")).toBeNull()
      expect(result.current.getClipsInRange(0, 10)).toEqual([])
      expect(result.current.findNearestClipToTime(5)).toBeNull()
      expect(result.current.canPlaceClip("track", 0, 10)).toBe(false)
    })

    it("should handle clips without media files", () => {
      vi.mocked(useTimeline).mockReturnValue({
        ...mockUseTimeline,
        project: {
          ...mockProject,
          resources: {
            ...mockProject.resources,
            media: [], // No media files
          },
        },
      } as any)

      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clip = result.current.findClip("clip-1")
      expect(clip).toBeDefined()
      expect(clip?.mediaFile).toBeUndefined()
    })
  })
})