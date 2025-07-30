/**
 * Tests for useTimelineIntegration hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { useTimelineIntegration } from "../../hooks/use-timeline-integration"
import { EmotionalTone, MONTAGE_STYLES, MomentCategory, MontagePlan } from "../../types"
import { mockMontagePlan, mockMediaFile } from "../test-utils"

// Mock timeline hooks
vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: vi.fn(() => ({
    project: null,
    saveProject: vi.fn(),
  })),
}))

vi.mock("@/features/timeline/hooks/use-timeline-actions", () => ({
  useTimelineActions: vi.fn(() => ({
    addMediaToTimeline: vi.fn(),
  })),
}))

vi.mock("@/features/timeline/hooks/use-timeline-markers", () => ({
  useTimelineMarkers: vi.fn(() => ({
    addMarker: vi.fn(),
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
        ...mockMediaFile,
        id: "video1",
        name: "video1.mp4",
        path: "/path/to/video1.mp4",
      },
    ]

    // Create mock montage plan
    mockPlan = {
      ...mockMontagePlan,
      id: "plan1",
      name: "Test Montage",
      style: MONTAGE_STYLES.dynamicAction,
      totalDuration: 30,
      sequences: [
        {
          id: "sequence1",
          type: "main",
          startTime: 0,
          duration: 30,
          transitions: [],
          clips: [
            {
              id: "clip1",
              fragmentId: "fragment1",
              startTime: 0,
              duration: 10,
              priority: 1,
              transitionIn: null,
              transitionOut: null,
              effects: [],
              fragment: {
                id: "fragment1",
                videoId: "video1",
                sourceFile: mockMediaFiles[0], // Ссылка на медиафайл
                startTime: 0,
                endTime: 10,
                duration: 10,
                objects: [],
                people: [],
                score: {
                  timestamp: 5,
                  duration: 10,
                  category: MomentCategory.Action,
                  scores: {
                    visual: 90,
                    technical: 80,
                    emotional: 85,
                    narrative: 75,
                    action: 95,
                    composition: 88,
                  },
                  totalScore: 85,
                },
                tags: [],
              },
            },
          ],
        },
      ],
    } as any
  })

  describe("applyPlanToTimeline", () => {
    it("should apply plan to timeline successfully", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")
      const { useTimelineMarkers } = await import("@/features/timeline/hooks/use-timeline-markers")
      
      const saveProjectMock = vi.fn().mockResolvedValue(undefined)
      const addMarkerMock = vi.fn()

      vi.mocked(useTimeline).mockReturnValue({
        project: mockTimelineProject,
        saveProject: saveProjectMock,
      } as any)

      vi.mocked(useTimelineMarkers).mockReturnValue({
        addMarker: addMarkerMock,
      } as any)

      const { result } = renderHook(() => useTimelineIntegration())

      await act(async () => {
        await result.current.applyPlanToTimeline(mockPlan, mockMediaFiles, {
          createNewSection: true,
          sectionName: "Test Section",
        })
      })

      // Проверяем, что сохранение и добавление маркеров были вызваны
      expect(saveProjectMock).toHaveBeenCalled()
      expect(addMarkerMock).toHaveBeenCalled()
      expect(result.current.error).toBeNull()
    })

    it("should handle missing media files", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")
      
      vi.mocked(useTimeline).mockReturnValue({
        project: mockTimelineProject,
        saveProject: vi.fn(),
      } as any)
      
      const { result } = renderHook(() => useTimelineIntegration())

      // Use empty media files array
      await act(async () => {
        await result.current.applyPlanToTimeline(mockPlan, [])
      })

      expect(result.current.error).toContain("Missing media files")
    })

    it("should handle missing project", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")

      vi.mocked(useTimeline).mockReturnValue({
        project: null,
        saveProject: vi.fn(),
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
      const { useTimelineMarkers } = await import("@/features/timeline/hooks/use-timeline-markers")
      const addMarkerMock = vi.fn()

      vi.mocked(useTimeline).mockReturnValue({
        project: mockTimelineProject,
        saveProject: vi.fn(),
      } as any)

      vi.mocked(useTimelineMarkers).mockReturnValue({
        addMarker: addMarkerMock,
      } as any)

      const { result } = renderHook(() => useTimelineIntegration())

      act(() => {
        result.current.createMarkersFromPlan(mockPlan, 10)
      })

      // Проверяем что addMarkerMock был вызван несколько раз (начало, моменты, конец)
      expect(addMarkerMock).toHaveBeenCalled()
      // Ожидаем вызовы для: start marker + key moments + end marker = 3 вызова
      expect(addMarkerMock).toHaveBeenCalledTimes(3)
    })
  })

  describe("canApplyPlan", () => {
    it("should return true for valid plan", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")

      vi.mocked(useTimeline).mockReturnValue({
        project: mockTimelineProject,
        saveProject: vi.fn(),
      } as any)

      const { result } = renderHook(() => useTimelineIntegration())

      expect(result.current.canApplyPlan(mockPlan)).toBe(true)
    })

    it("should return false for plan without sequences", () => {
      const { result } = renderHook(() => useTimelineIntegration())

      const invalidPlan = { ...mockPlan, sequences: [] }
      expect(result.current.canApplyPlan(invalidPlan)).toBe(false)
    })

    it("should return false when no project loaded", async () => {
      const { useTimeline } = await import("@/features/timeline/hooks/use-timeline")

      vi.mocked(useTimeline).mockReturnValue({
        project: null,
        saveProject: vi.fn(),
      } as any)

      const { result } = renderHook(() => useTimelineIntegration())

      expect(result.current.canApplyPlan(mockPlan)).toBe(false)
    })
  })

  describe("getRequiredMediaFiles", () => {
    it("should return unique media file paths", () => {
      const { result } = renderHook(() => useTimelineIntegration())

      const requiredFiles = result.current.getRequiredMediaFiles(mockPlan)

      // Наш mockPlan содержит один клип с mediaFileId: "video1"
      expect(requiredFiles).toHaveLength(1) 
      expect(requiredFiles).toContain("video1") // id медиафайла из fragment.sourceFile
    })
  })
})
