/**
 * Тесты для хука useTracks
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useTracks } from "../../hooks/use-tracks"

// Мокаем зависимости
vi.mock("../timeline-provider", () => ({
  useTimeline: () => ({
    project: mockProject,
    uiState: mockUIState,
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    updateTrack: vi.fn(),
    reorderTracks: vi.fn(),
    selectTracks: vi.fn(),
    clearSelection: vi.fn(),
  }),
}))

vi.mock("@/lib/timeline/utils", () => ({
  getAllTracks: vi.fn(() => mockTracks),
  findTrackById: vi.fn((project, id) => mockTracks.find((track) => track.id === id) || null),
  getTracksByType: vi.fn((project, type) => mockTracks.filter((track) => track.type === type)),
  sortTracksByOrder: vi.fn((tracks) => tracks),
}))

// Мокаем треки
const mockTracks: TimelineTrack[] = [
  {
    id: "track-1",
    name: "Video Track 1",
    type: "video",
    clips: [],
    isMuted: false,
    isLocked: false,
    isHidden: false,
    isSolo: false,
    volume: 1,
    pan: 0,
    height: 80,
    order: 0,
    trackEffects: [],
    trackFilters: [],
  },
  {
    id: "track-2",
    name: "Audio Track 1",
    type: "audio",
    clips: [],
    isMuted: true,
    isLocked: false,
    isHidden: false,
    isSolo: false,
    volume: 0.8,
    pan: -0.2,
    height: 60,
    order: 1,
    trackEffects: [],
    trackFilters: [],
  },
  {
    id: "track-3",
    name: "Hidden Track",
    type: "video",
    clips: [],
    isMuted: false,
    isLocked: false,
    isHidden: true,
    isSolo: false,
    volume: 1,
    pan: 0,
    height: 80,
    order: 2,
    trackEffects: [],
    trackFilters: [],
  },
]

// Мокаем проект
const mockProject: TimelineProject = {
  id: "project-1",
  name: "Test Project",
  duration: 60,
  fps: 30,
  sampleRate: 44100,
  sections: [
    {
      id: "section-1",
      index: 0,
      name: "Main Section",
      startTime: 0,
      endTime: 30,
      duration: 30,
      isCollapsed: false,
      tracks: [mockTracks[0], mockTracks[1]],
    },
    {
      id: "section-2",
      index: 1,
      name: "Secondary Section",
      startTime: 30,
      endTime: 60,
      duration: 30,
      isCollapsed: false,
      tracks: [mockTracks[2]],
    },
  ],
  globalTracks: [],
  settings: {
    resolution: {
      width: 1920,
      height: 1080,
    },
    fps: 30,
    aspectRatio: "16:9",
    sampleRate: 44100,
    channels: 2,
    bitDepth: 16,
    timeFormat: "timecode",
    snapToGrid: true,
    gridSize: 1,
    autoSave: true,
    autoSaveInterval: 300,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  version: "1.0.0",
}

// Мокаем UI состояние
const mockUIState = {
  selectedClipIds: [],
  selectedTrackIds: ["track-1"],
  currentTime: 0,
  zoom: 1,
  scrollPosition: 0,
  visibleTrackTypes: ["video", "audio"],
}

describe("useTracks", () => {
  describe("Hook Initialization", () => {
    it("should be defined and exportable", () => {
      expect(useTracks).toBeDefined()
      expect(typeof useTracks).toBe("function")
    })

    it("should return object with all required properties and methods", () => {
      const { result } = renderHook(() => useTracks())

      // Проверяем наличие основных свойств
      expect(result.current).toHaveProperty("tracks")
      expect(result.current).toHaveProperty("selectedTracks")
      expect(result.current).toHaveProperty("visibleTracks")
      expect(result.current).toHaveProperty("sectionTracks")
      expect(result.current).toHaveProperty("globalTracks")

      // Проверяем наличие методов
      expect(result.current).toHaveProperty("findTrack")
      expect(result.current).toHaveProperty("getTracksByType")
      expect(result.current).toHaveProperty("getTracksBySection")
      expect(result.current).toHaveProperty("canAddTrackToSection")
      expect(result.current).toHaveProperty("getTrackStats")
    })
  })

  describe("Default State", () => {
    it("should return empty arrays by default", () => {
      const { result } = renderHook(() => useTracks())

      expect(result.current.tracks).toEqual([])
      expect(result.current.selectedTracks).toEqual([])
      expect(result.current.visibleTracks).toEqual([])
      expect(result.current.sectionTracks).toEqual([])
      expect(result.current.globalTracks).toEqual([])
    })
  })

  describe("Track Search and Filtering", () => {
    it("should return null for non-existent track", () => {
      const { result } = renderHook(() => useTracks())

      const track = result.current.findTrack("non-existent-track")
      expect(track).toBeNull()
    })

    it("should return empty array for tracks by type", () => {
      const { result } = renderHook(() => useTracks())

      const videoTracks = result.current.getTracksByType("video")
      expect(videoTracks).toEqual([])

      const audioTracks = result.current.getTracksByType("audio")
      expect(audioTracks).toEqual([])
    })

    it("should return empty array for tracks by section", () => {
      const { result } = renderHook(() => useTracks())

      const sectionTracks = result.current.getTracksBySection("section-1")
      expect(sectionTracks).toEqual([])
    })
  })

  describe("Track Management", () => {
    it("should return false for adding track to non-existent section", () => {
      const { result } = renderHook(() => useTracks())

      const canAdd = result.current.canAddTrackToSection("non-existent", "video")
      expect(canAdd).toBe(false)
    })

    it("should return default track statistics", () => {
      const { result } = renderHook(() => useTracks())

      const stats = result.current.getTrackStats("non-existent-track")
      expect(stats).toEqual({
        clipCount: 0,
        totalDuration: 0,
        isEmpty: true,
      })
    })
  })

  describe("Error Handling", () => {
    it("should not throw errors when calling methods with invalid parameters", () => {
      const { result } = renderHook(() => useTracks())

      expect(() => {
        result.current.findTrack("")
        result.current.getTracksByType("invalid" as any)
        result.current.getTracksBySection("")
        result.current.canAddTrackToSection("", "video")
        result.current.getTrackStats("")
      }).not.toThrow()
    })
  })
})
