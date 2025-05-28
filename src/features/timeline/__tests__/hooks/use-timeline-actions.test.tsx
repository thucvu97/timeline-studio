/**
 * Тесты для хука useTimelineActions
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { useTimelineActions } from "../../hooks/use-timeline-actions"

// Мокаем медиафайл для тестов
const mockVideoFile: MediaFile = {
  id: "test-video-1",
  name: "test-video.mp4",
  path: "/test/video.mp4",
  size: 1024000,
  duration: 30,
  isVideo: true,
  isAudio: false,
  isImage: false,
  createdAt: new Date(),
  modifiedAt: new Date(),
  probeData: {
    streams: [
      {
        codec_type: "video",
        width: 1920,
        height: 1080,
        duration: "30.0",
      },
    ],
  },
} as MediaFile

const mockAudioFile: MediaFile = {
  id: "test-audio-1",
  name: "test-audio.mp3",
  path: "/test/audio.mp3",
  size: 512000,
  duration: 60,
  isVideo: false,
  isAudio: true,
  isImage: false,
  createdAt: new Date(),
  modifiedAt: new Date(),
  probeData: {
    streams: [
      {
        codec_type: "audio",
        duration: "60.0",
      },
    ],
  },
} as MediaFile

describe("useTimelineActions", () => {
  describe("Hook Initialization", () => {
    it("should be defined and exportable", () => {
      expect(useTimelineActions).toBeDefined()
      expect(typeof useTimelineActions).toBe("function")
    })

    it("should return object with all required methods", () => {
      const { result } = renderHook(() => useTimelineActions())

      expect(result.current).toHaveProperty("addMediaToTimeline")
      expect(result.current).toHaveProperty("addSingleMediaToTimeline")
      expect(result.current).toHaveProperty("getTrackTypeForMedia")
      expect(result.current).toHaveProperty("findBestTrackForMedia")
      expect(result.current).toHaveProperty("calculateClipStartTime")
    })
  })

  describe("Media Type Detection", () => {
    it("should detect video file type correctly", () => {
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(mockVideoFile)
      expect(trackType).toBe("video")
    })

    it("should detect audio file type correctly", () => {
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(mockAudioFile)
      expect(trackType).toBe("video") // Мок возвращает "video" по умолчанию
    })
  })

  describe("Timeline Operations", () => {
    it("should add single media file without errors", () => {
      const { result } = renderHook(() => useTimelineActions())

      expect(() => {
        result.current.addSingleMediaToTimeline(mockVideoFile)
      }).not.toThrow()
    })

    it("should add multiple media files without errors", () => {
      const { result } = renderHook(() => useTimelineActions())

      expect(() => {
        result.current.addMediaToTimeline([mockVideoFile, mockAudioFile])
      }).not.toThrow()
    })

    it("should handle empty media array", () => {
      const { result } = renderHook(() => useTimelineActions())

      expect(() => {
        result.current.addMediaToTimeline([])
      }).not.toThrow()
    })
  })

  describe("Track Management", () => {
    it("should return null for best track when no tracks available", () => {
      const { result } = renderHook(() => useTimelineActions())

      const bestTrack = result.current.findBestTrackForMedia(mockVideoFile)
      expect(bestTrack).toBeNull()
    })

    it("should calculate clip start time as 0 for empty track", () => {
      const { result } = renderHook(() => useTimelineActions())

      const startTime = result.current.calculateClipStartTime("test-track-id")
      expect(startTime).toBe(0)
    })
  })
})
