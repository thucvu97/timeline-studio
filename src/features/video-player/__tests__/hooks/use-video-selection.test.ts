import React from "react"
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

// Импортируем после определения моков
import { useVideoSelection } from "@/features/video-player/hooks/use-video-selection"
import { PlayerProvider } from "@/features/video-player/services/player-provider"

// Мокаем useUserSettings
vi.mock("@/features/user-settings", () => ({
  useUserSettings: vi.fn(() => ({
    playerVolume: 100,
    handlePlayerVolumeChange: vi.fn(),
  })),
}))

// Мокаем xstate с динамическим videoSource
const mockMachineContext = {
  video: null,
  currentTime: 0,
  isPlaying: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  isVideoLoading: false,
  isVideoReady: false,
  isResizableMode: true,
  duration: 0,
  volume: 100,
  previewMedia: null,
  videoSource: "browser",
  appliedEffects: [],
  appliedFilters: [],
  appliedTemplate: null,
}

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [
    {
      context: mockMachineContext,
    },
    vi.fn(),
  ]),
}))

// Типы для тестирования
const createMockMediaFile = (name: string): MediaFile => ({
  id: `file-${name}`,
  name,
  path: `/test/${name}`,
  isVideo: true,
  isLocal: true,
  isDirectory: false,
  size: 1024,
  extension: "mp4",
  lastModified: Date.now(),
})

describe("useVideoSelection", () => {
  const mockSelectedFiles = [
    createMockMediaFile("video1.mp4"),
    createMockMediaFile("video2.mp4"),
    createMockMediaFile("video3.mp4"),
  ]

  beforeEach(() => {
    // Reset context before each test
    mockMachineContext.previewMedia = null
    mockMachineContext.videoSource = "browser"
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(PlayerProvider, null, children)
  }

  describe("getVideosForPreview", () => {
    it("should return previewMedia when source is browser and previewMedia exists", () => {
      mockMachineContext.previewMedia = mockSelectedFiles[0]
      mockMachineContext.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const videos = result.current.getVideosForPreview()

      expect(videos).toEqual([mockSelectedFiles[0]])
    })

    it("should return empty array when source is browser and no previewMedia", () => {
      mockMachineContext.previewMedia = null
      mockMachineContext.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const videos = result.current.getVideosForPreview()

      expect(videos).toEqual([])
    })

    it("should return previewMedia when source is timeline and previewMedia exists", () => {
      mockMachineContext.previewMedia = mockSelectedFiles[0]
      mockMachineContext.videoSource = "timeline"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const videos = result.current.getVideosForPreview()

      expect(videos).toEqual([mockSelectedFiles[0]])
    })

    it("should respect count parameter when getting videos", () => {
      mockMachineContext.previewMedia = mockSelectedFiles[0]
      mockMachineContext.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      // Request 2 videos but only have 1 previewMedia
      const videos = result.current.getVideosForPreview(2)

      expect(videos).toEqual([mockSelectedFiles[0]])
    })
  })

  describe("getCurrentVideo", () => {
    it("should return previewMedia when it exists", () => {
      mockMachineContext.previewMedia = mockSelectedFiles[0]
      mockMachineContext.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const video = result.current.getCurrentVideo()

      expect(video).toEqual(mockSelectedFiles[0])
    })

    it("should return previewMedia from timeline source", () => {
      mockMachineContext.previewMedia = mockSelectedFiles[1]
      mockMachineContext.videoSource = "timeline"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const video = result.current.getCurrentVideo()

      expect(video).toEqual(mockSelectedFiles[1])
    })

    it("should return null when no previewMedia is available", () => {
      mockMachineContext.previewMedia = null
      mockMachineContext.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const video = result.current.getCurrentVideo()

      expect(video).toBeNull()
    })
  })

  describe("hasEnoughVideos", () => {
    it("should return true when enough videos are available", () => {
      mockMachineContext.previewMedia = mockSelectedFiles[0]
      mockMachineContext.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      expect(result.current.hasEnoughVideos(1)).toBe(true)
      expect(result.current.hasEnoughVideos(2)).toBe(false) // Only 1 video available
    })

    it("should return false when no videos are available", () => {
      mockMachineContext.previewMedia = null
      mockMachineContext.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      expect(result.current.hasEnoughVideos(1)).toBe(false)
      expect(result.current.hasEnoughVideos(2)).toBe(false)
    })

    it("should work with timeline source", () => {
      mockMachineContext.previewMedia = mockSelectedFiles[0]
      mockMachineContext.videoSource = "timeline"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      expect(result.current.hasEnoughVideos(1)).toBe(true)
      expect(result.current.hasEnoughVideos(2)).toBe(false)
    })
  })

  describe("integration tests", () => {
    it("should handle switching between browser and timeline sources", () => {
      // Set initial state
      mockMachineContext.videoSource = "browser"
      mockMachineContext.previewMedia = mockSelectedFiles[0]
      
      const { result } = renderHook(() => useVideoSelection(), { wrapper })
      
      expect(result.current.getCurrentVideo()).toEqual(mockSelectedFiles[0])
      
      // Switch to timeline source
      mockMachineContext.videoSource = "timeline"
      mockMachineContext.previewMedia = mockSelectedFiles[1]
      
      // Need to re-render to pick up context changes
      const { result: result2 } = renderHook(() => useVideoSelection(), { wrapper })
      
      expect(result2.current.getCurrentVideo()).toEqual(mockSelectedFiles[1])
    })
  })
})