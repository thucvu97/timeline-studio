/**
 * Tests for useTimelineIntegration hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { useTimelineIntegration } from "../../hooks/use-timeline-integration"
import { EmotionalTone, MONTAGE_STYLES, MomentCategory, MontagePlan } from "../../types"

// Mock timeline hooks
vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: vi.fn(() => ({
    project: mockTimelineProject,
    updateProject: vi.fn(),
    addMarkers: vi.fn(),
  })),
}))

vi.mock("@/features/timeline/hooks/use-timeline-actions", () => ({
  useTimelineActions: vi.fn(() => ({
    addMediaToTimeline: vi.fn(),
  })),
}))

const mockTimelineProject = {
  id: "project1",
  name: "Test Project",
  duration: 0,
  fps: 30,
  sampleRate: 48000,
  sections: [],
  globalTracks: [],
  resources: {
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    styleTemplates: [],
    subtitleStyles: [],
    music: [],
    media: [],
  },
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  version: "1.0.0",
}

describe("useTimelineIntegration", () => {
  let mockMediaFiles: MediaFile[]
  let mockPlan: MontagePlan

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock media files
    mockMediaFiles = [
      {
        id: "video1",
        name: "video1.mp4",
        path: "/path/to/video1.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
        size: 1000000,
        type: "video",
        format: "mp4",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Create mock montage plan
    mockPlan = {
      id: "plan1",
      name: "Test Montage",
      style: MONTAGE_STYLES.dynamicAction,
      totalDuration: 30,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      sequences: [],
      pacing: {
        overall: "medium",
        variability: 50,
        peaks: [],
        valleys: [],
      },
      qualityScore: 85,
      engagementScore: 90,
      coherenceScore: 80,
      // Additional test-specific fields for backward compatibility
      clips: [
        {
          id: "clip1",
          source_file: "/path/to/video1.mp4",
          start_time: 0,
          end_time: 10,
          duration: 10,
          order: 0,
          moment: {
            id: "moment1",
            timestamp: 5,
            duration: 10,
            category: MomentCategory.Action,
            emotionalTone: EmotionalTone.Energetic,
            totalScore: 85,
            scores: {
              visual: 90,
              technical: 80,
              emotional: 85,
              narrative: 75,
              action: 95,
              composition: 88,
            },
            detections: [],
            qualityAnalysis: {
              sharpness: 85,
              stability: 90,
              exposure: 50,
              colorGrading: 80,
              noiseLevel: 15,
              dynamicRange: 75,
            },
          },
          adjustments: {},
        },
      ],
      transitions: [],
    } as any
  })

  describe("applyPlanToTimeline", () => {
    it("should apply plan to timeline successfully", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")
      const updateProjectMock = vi.fn()
      const addMarkersMock = vi.fn()

      vi.mocked(useTimeline).mockReturnValue({
        project: mockTimelineProject,
        updateProject: updateProjectMock,
        addMarkers: addMarkersMock,
      } as any)

      const { result } = renderHook(() => useTimelineIntegration())

      await act(async () => {
        await result.current.applyPlanToTimeline(mockPlan, mockMediaFiles, {
          createNewSection: true,
          sectionName: "Test Section",
        })
      })

      await waitFor(() => {
        expect(updateProjectMock).toHaveBeenCalled()
        expect(addMarkersMock).toHaveBeenCalled()
        expect(result.current.error).toBeNull()
      })
    })

    it("should handle missing media files", async () => {
      const { result } = renderHook(() => useTimelineIntegration())

      // Use empty media files array
      await act(async () => {
        await result.current.applyPlanToTimeline(mockPlan, [])
      })

      await waitFor(() => {
        expect(result.current.error).toContain("Missing media files")
      })
    })

    it("should handle missing project", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")

      vi.mocked(useTimeline).mockReturnValue({
        project: null,
        updateProject: vi.fn(),
        addMarkers: vi.fn(),
      } as any)

      const { result } = renderHook(() => useTimelineIntegration())

      await act(async () => {
        await result.current.applyPlanToTimeline(mockPlan, mockMediaFiles)
      })

      expect(result.current.error).toBe("No timeline project loaded")
    })
  })

  describe("createMarkersFromPlan", () => {
    it("should create markers from plan", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")
      const addMarkersMock = vi.fn()

      vi.mocked(useTimeline).mockReturnValue({
        project: mockTimelineProject,
        updateProject: vi.fn(),
        addMarkers: addMarkersMock,
      } as any)

      const { result } = renderHook(() => useTimelineIntegration())

      act(() => {
        result.current.createMarkersFromPlan(mockPlan, 10)
      })

      expect(addMarkersMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: expect.stringContaining("Start") }),
          expect.objectContaining({ name: expect.stringContaining("End") }),
        ]),
      )
    })
  })

  describe("canApplyPlan", () => {
    it("should return true for valid plan", () => {
      const { result } = renderHook(() => useTimelineIntegration())

      expect(result.current.canApplyPlan(mockPlan)).toBe(true)
    })

    it("should return false for plan without clips", () => {
      const { result } = renderHook(() => useTimelineIntegration())

      const invalidPlan = { ...mockPlan, clips: [] }
      expect(result.current.canApplyPlan(invalidPlan)).toBe(false)
    })

    it("should return false when no project loaded", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")

      vi.mocked(useTimeline).mockReturnValue({
        project: null,
        updateProject: vi.fn(),
        addMarkers: vi.fn(),
      } as any)

      const { result } = renderHook(() => useTimelineIntegration())

      expect(result.current.canApplyPlan(mockPlan)).toBe(false)
    })
  })

  describe("getRequiredMediaFiles", () => {
    it("should return unique media file paths", () => {
      const { result } = renderHook(() => useTimelineIntegration())

      // Add duplicate file references
      const planWithDuplicates = {
        ...mockPlan,
        clips: [
          ...mockPlan.clips,
          {
            ...mockPlan.clips[0],
            id: "clip2",
            source_file: "/path/to/video1.mp4", // Same file
          },
          {
            ...mockPlan.clips[0],
            id: "clip3",
            source_file: "/path/to/video2.mp4", // Different file
          },
        ],
      }

      const requiredFiles = result.current.getRequiredMediaFiles(planWithDuplicates)

      expect(requiredFiles).toHaveLength(2)
      expect(requiredFiles).toContain("/path/to/video1.mp4")
      expect(requiredFiles).toContain("/path/to/video2.mp4")
    })
  })
})
