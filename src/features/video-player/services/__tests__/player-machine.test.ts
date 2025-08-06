/**
 * Tests for Player Machine (XState)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import type { MediaFile } from "@/features/media/types/media"
import { type PlayerContextType, type PlayerEvent, playerMachine } from "../player-machine"

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
}

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

describe("Player Machine", () => {
  let actor: ReturnType<typeof createActor<typeof playerMachine>>

  beforeEach(() => {
    vi.clearAllMocks()
    actor = createActor(playerMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("initial state", () => {
    it("should start in idle state with initial context", () => {
      expect(actor.getSnapshot().value).toBe("idle")

      const context = actor.getSnapshot().context
      expect(context.video).toBeNull()
      expect(context.currentTime).toBe(0)
      expect(context.duration).toBe(0)
      expect(context.volume).toBe(100)
      expect(context.isPlaying).toBe(false)
      expect(context.isSeeking).toBe(false)
      expect(context.isChangingCamera).toBe(false)
      expect(context.isRecording).toBe(false)
      expect(context.isVideoLoading).toBe(false)
      expect(context.isVideoReady).toBe(false)
      expect(context.isResizableMode).toBe(false)
      expect(context.speedRampingEnabled).toBe(false)
      expect(context.currentPlaybackRate).toBe(1.0)
      expect(context.basePlaybackRate).toBe(1.0)
      expect(context.prerenderEnabled).toBe(false)
      expect(context.prerenderQuality).toBe(75)
      expect(context.prerenderSegmentDuration).toBe(5)
      expect(context.prerenderApplyEffects).toBe(true)
      expect(context.prerenderAutoPrerender).toBe(true)
      expect(context.previewMedia).toBeNull()
      expect(context.videoSource).toBe("browser")
      expect(context.appliedEffects).toEqual([])
      expect(context.appliedFilters).toEqual([])
      expect(context.appliedTemplate).toBeNull()
    })
  })

  describe("state transitions", () => {
    it("should transition from idle to loading when setVideo is sent", () => {
      actor.send({ type: "setVideo", video: mockMediaFile })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("loading")
      expect(snapshot.context.video).toEqual(mockMediaFile)
      expect(snapshot.context.isVideoLoading).toBe(true)
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[PlayerMachine] Установлено видео: test-video-1, path=/test/video.mp4",
      )
    })

    it("should transition from loading to ready when setVideoReady is sent", () => {
      actor.send({ type: "setVideo", video: mockMediaFile })
      actor.send({ type: "setVideoReady", isVideoReady: true })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("ready")
      expect(snapshot.context.isVideoReady).toBe(true)
      expect(snapshot.context.isVideoLoading).toBe(false)
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Видео test-video-1 готово к воспроизведению")
    })

    it("should transition from ready back to loading when new video is set", () => {
      // First, get to ready state
      actor.send({ type: "setVideo", video: mockMediaFile })
      actor.send({ type: "setVideoReady", isVideoReady: true })

      const newVideo: MediaFile = { ...mockMediaFile, id: "test-video-2", name: "new-video.mp4" }
      actor.send({ type: "setVideo", video: newVideo })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("loading")
      expect(snapshot.context.video).toEqual(newVideo)
      expect(snapshot.context.isVideoLoading).toBe(true)
    })
  })

  describe("playback controls in idle state", () => {
    it("should handle setCurrentTime", () => {
      actor.send({ type: "setCurrentTime", currentTime: 30 })

      expect(actor.getSnapshot().context.currentTime).toBe(30)
    })

    it("should handle setIsPlaying", () => {
      actor.send({ type: "setIsPlaying", isPlaying: true })

      expect(actor.getSnapshot().context.isPlaying).toBe(true)
    })

    it("should handle setIsSeeking", () => {
      actor.send({ type: "setIsSeeking", isSeeking: true })

      expect(actor.getSnapshot().context.isSeeking).toBe(true)
    })

    it("should handle setDuration", () => {
      actor.send({ type: "setDuration", duration: 180 })

      expect(actor.getSnapshot().context.duration).toBe(180)
    })

    it("should handle setVolume", () => {
      actor.send({ type: "setVolume", volume: 75 })

      expect(actor.getSnapshot().context.volume).toBe(75)
    })
  })

  describe("camera and recording controls", () => {
    it("should handle setIsChangingCamera", () => {
      actor.send({ type: "setIsChangingCamera", isChangingCamera: true })

      expect(actor.getSnapshot().context.isChangingCamera).toBe(true)
    })

    it("should handle setIsRecording", () => {
      actor.send({ type: "setIsRecording", isRecording: true })

      expect(actor.getSnapshot().context.isRecording).toBe(true)
    })

    it("should handle setIsResizableMode", () => {
      actor.send({ type: "setIsResizableMode", isResizableMode: true })

      expect(actor.getSnapshot().context.isResizableMode).toBe(true)
    })
  })

  describe("prerender settings", () => {
    it("should handle setPrerenderSettings with all options", () => {
      actor.send({
        type: "setPrerenderSettings",
        prerenderEnabled: true,
        prerenderQuality: 90,
        prerenderSegmentDuration: 10,
        prerenderApplyEffects: false,
        prerenderAutoPrerender: false,
      })

      const context = actor.getSnapshot().context
      expect(context.prerenderEnabled).toBe(true)
      expect(context.prerenderQuality).toBe(90)
      expect(context.prerenderSegmentDuration).toBe(10)
      expect(context.prerenderApplyEffects).toBe(false)
      expect(context.prerenderAutoPrerender).toBe(false)
    })

    it("should handle setPrerenderSettings with partial options", () => {
      actor.send({
        type: "setPrerenderSettings",
        prerenderEnabled: true,
        prerenderQuality: 85,
      })

      const context = actor.getSnapshot().context
      expect(context.prerenderEnabled).toBe(true)
      expect(context.prerenderQuality).toBe(85)
      // These should keep their default values
      expect(context.prerenderSegmentDuration).toBe(5)
      expect(context.prerenderApplyEffects).toBe(true)
      expect(context.prerenderAutoPrerender).toBe(true)
    })
  })

  describe("preview media and video source", () => {
    it("should handle setPreviewMedia", () => {
      actor.send({ type: "setPreviewMedia", media: mockMediaFile })

      expect(actor.getSnapshot().context.previewMedia).toEqual(mockMediaFile)
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Установлено preview media: test-video-1")
    })

    it("should handle setPreviewMedia with null", () => {
      actor.send({ type: "setPreviewMedia", media: null })

      expect(actor.getSnapshot().context.previewMedia).toBeNull()
    })

    it("should handle setVideoSource", () => {
      actor.send({ type: "setVideoSource", source: "timeline" })

      expect(actor.getSnapshot().context.videoSource).toBe("timeline")
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Установлен источник видео: timeline")
    })
  })

  describe("effects management", () => {
    const mockEffect = {
      id: "brightness",
      name: "Brightness",
      params: { value: 0.2 },
    }

    it("should handle applyEffect", () => {
      actor.send({ type: "applyEffect", effect: mockEffect })

      const context = actor.getSnapshot().context
      expect(context.appliedEffects).toHaveLength(1)
      expect(context.appliedEffects[0]).toEqual(mockEffect)
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Применен эффект: Brightness")
    })

    it("should accumulate multiple effects", () => {
      const effect2 = { id: "contrast", name: "Contrast", params: { value: 1.5 } }

      actor.send({ type: "applyEffect", effect: mockEffect })
      actor.send({ type: "applyEffect", effect: effect2 })

      const context = actor.getSnapshot().context
      expect(context.appliedEffects).toHaveLength(2)
      expect(context.appliedEffects).toEqual([mockEffect, effect2])
    })

    it("should handle clearEffects", () => {
      actor.send({ type: "applyEffect", effect: mockEffect })
      actor.send({ type: "clearEffects" })

      expect(actor.getSnapshot().context.appliedEffects).toEqual([])
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Очищены эффекты")
    })
  })

  describe("filters management", () => {
    const mockFilter = {
      id: "vintage",
      name: "Vintage",
      params: { intensity: 0.8 },
    }

    it("should handle applyFilter", () => {
      actor.send({ type: "applyFilter", filter: mockFilter })

      const context = actor.getSnapshot().context
      expect(context.appliedFilters).toHaveLength(1)
      expect(context.appliedFilters[0]).toEqual(mockFilter)
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Применен фильтр: Vintage")
    })

    it("should accumulate multiple filters", () => {
      const filter2 = { id: "blur", name: "Blur", params: { radius: 5 } }

      actor.send({ type: "applyFilter", filter: mockFilter })
      actor.send({ type: "applyFilter", filter: filter2 })

      const context = actor.getSnapshot().context
      expect(context.appliedFilters).toHaveLength(2)
      expect(context.appliedFilters).toEqual([mockFilter, filter2])
    })

    it("should handle clearFilters", () => {
      actor.send({ type: "applyFilter", filter: mockFilter })
      actor.send({ type: "clearFilters" })

      expect(actor.getSnapshot().context.appliedFilters).toEqual([])
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Очищены фильтры")
    })
  })

  describe("template management", () => {
    const mockTemplate = {
      id: "split-screen",
      name: "Split Screen",
    }
    const mockFiles = [mockMediaFile, { ...mockMediaFile, id: "video-2" }]

    it("should handle applyTemplate", () => {
      actor.send({
        type: "applyTemplate",
        template: mockTemplate,
        files: mockFiles,
      })

      const context = actor.getSnapshot().context
      expect(context.appliedTemplate).toEqual({
        id: mockTemplate.id,
        name: mockTemplate.name,
        files: mockFiles,
      })
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Применен шаблон: Split Screen с 2 файлами")
    })

    it("should handle clearTemplate", () => {
      actor.send({
        type: "applyTemplate",
        template: mockTemplate,
        files: mockFiles,
      })
      actor.send({ type: "clearTemplate" })

      expect(actor.getSnapshot().context.appliedTemplate).toBeNull()
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Очищен шаблон")
    })
  })

  describe("speed ramping", () => {
    it("should handle setSpeedRampingEnabled", () => {
      actor.send({ type: "setSpeedRampingEnabled", enabled: true })

      expect(actor.getSnapshot().context.speedRampingEnabled).toBe(true)
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Speed ramping включен")
    })

    it("should handle setSpeedRampingEnabled disabled", () => {
      actor.send({ type: "setSpeedRampingEnabled", enabled: false })

      expect(actor.getSnapshot().context.speedRampingEnabled).toBe(false)
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Speed ramping выключен")
    })

    it("should handle updatePlaybackRate", () => {
      actor.send({ type: "updatePlaybackRate", rate: 1.5 })

      expect(actor.getSnapshot().context.currentPlaybackRate).toBe(1.5)
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Playback rate обновлен: 1.5")
    })

    it("should handle setBasePlaybackRate", () => {
      actor.send({ type: "setBasePlaybackRate", rate: 0.5 })

      expect(actor.getSnapshot().context.basePlaybackRate).toBe(0.5)
      expect(consoleSpy.log).toHaveBeenCalledWith("[PlayerMachine] Base playback rate установлен: 0.5")
    })
  })

  describe("video loading state", () => {
    it("should handle setVideoLoading in loading state", () => {
      actor.send({ type: "setVideo", video: mockMediaFile })
      actor.send({ type: "setVideoLoading", isVideoLoading: false })

      expect(actor.getSnapshot().context.isVideoLoading).toBe(false)
    })

    it("should handle other events in loading state", () => {
      actor.send({ type: "setVideo", video: mockMediaFile })

      // Test that all events work in loading state
      actor.send({ type: "setIsPlaying", isPlaying: true })
      actor.send({ type: "setCurrentTime", currentTime: 45 })
      actor.send({ type: "setIsSeeking", isSeeking: true })
      actor.send({ type: "setIsChangingCamera", isChangingCamera: true })
      actor.send({ type: "setIsRecording", isRecording: true })
      actor.send({ type: "setDuration", duration: 200 })
      actor.send({ type: "setVolume", volume: 50 })

      const context = actor.getSnapshot().context
      expect(context.isPlaying).toBe(true)
      expect(context.currentTime).toBe(45)
      expect(context.isSeeking).toBe(true)
      expect(context.isChangingCamera).toBe(true)
      expect(context.isRecording).toBe(true)
      expect(context.duration).toBe(200)
      expect(context.volume).toBe(50)
    })
  })

  describe("ready state", () => {
    beforeEach(() => {
      // Get to ready state
      actor.send({ type: "setVideo", video: mockMediaFile })
      actor.send({ type: "setVideoReady", isVideoReady: true })
    })

    it("should handle all events in ready state", () => {
      actor.send({ type: "setIsPlaying", isPlaying: true })
      actor.send({ type: "setCurrentTime", currentTime: 60 })
      actor.send({ type: "setIsSeeking", isSeeking: true })
      actor.send({ type: "setIsChangingCamera", isChangingCamera: true })
      actor.send({ type: "setIsRecording", isRecording: true })
      actor.send({ type: "setDuration", duration: 300 })
      actor.send({ type: "setVolume", volume: 25 })
      actor.send({ type: "setIsResizableMode", isResizableMode: true })

      const context = actor.getSnapshot().context
      expect(context.isPlaying).toBe(true)
      expect(context.currentTime).toBe(60)
      expect(context.isSeeking).toBe(true)
      expect(context.isChangingCamera).toBe(true)
      expect(context.isRecording).toBe(true)
      expect(context.duration).toBe(300)
      expect(context.volume).toBe(25)
      expect(context.isResizableMode).toBe(true)
    })

    it("should handle effects and filters in ready state", () => {
      const effect = { id: "test", name: "Test Effect", params: {} }
      const filter = { id: "test", name: "Test Filter", params: {} }

      actor.send({ type: "applyEffect", effect })
      actor.send({ type: "applyFilter", filter })

      const context = actor.getSnapshot().context
      expect(context.appliedEffects).toContain(effect)
      expect(context.appliedFilters).toContain(filter)
    })

    it("should handle speed ramping in ready state", () => {
      actor.send({ type: "setSpeedRampingEnabled", enabled: true })
      actor.send({ type: "updatePlaybackRate", rate: 2.0 })
      actor.send({ type: "setBasePlaybackRate", rate: 1.25 })

      const context = actor.getSnapshot().context
      expect(context.speedRampingEnabled).toBe(true)
      expect(context.currentPlaybackRate).toBe(2.0)
      expect(context.basePlaybackRate).toBe(1.25)
    })
  })

  describe("context persistence across states", () => {
    it("should maintain context values during state transitions", () => {
      // Set some values in idle state
      actor.send({ type: "setVolume", volume: 80 })
      actor.send({ type: "setCurrentTime", currentTime: 15 })

      // Transition to loading
      actor.send({ type: "setVideo", video: mockMediaFile })

      // Values should persist
      expect(actor.getSnapshot().context.volume).toBe(80)
      expect(actor.getSnapshot().context.currentTime).toBe(15)

      // Transition to ready
      actor.send({ type: "setVideoReady", isVideoReady: true })

      // Values should still persist
      expect(actor.getSnapshot().context.volume).toBe(80)
      expect(actor.getSnapshot().context.currentTime).toBe(15)
    })

    it("should maintain applied effects and filters across state transitions", () => {
      const effect = { id: "test-effect", name: "Test Effect", params: {} }
      const filter = { id: "test-filter", name: "Test Filter", params: {} }

      // Apply in idle state
      actor.send({ type: "applyEffect", effect })
      actor.send({ type: "applyFilter", filter })

      // Transition through states
      actor.send({ type: "setVideo", video: mockMediaFile })
      actor.send({ type: "setVideoReady", isVideoReady: true })

      // Effects and filters should persist
      const context = actor.getSnapshot().context
      expect(context.appliedEffects).toContain(effect)
      expect(context.appliedFilters).toContain(filter)
    })
  })

  describe("logging actions", () => {
    it("should not log effect application in loading state", () => {
      actor.send({ type: "setVideo", video: mockMediaFile })
      consoleSpy.log.mockClear()

      const effect = { id: "test", name: "Test Effect", params: {} }
      actor.send({ type: "applyEffect", effect })

      // In loading state, logging actions are not included
      expect(consoleSpy.log).not.toHaveBeenCalledWith("[PlayerMachine] Применен эффект: Test Effect")
    })

    it("should not log effect application in ready state", () => {
      actor.send({ type: "setVideo", video: mockMediaFile })
      actor.send({ type: "setVideoReady", isVideoReady: true })
      consoleSpy.log.mockClear()

      const effect = { id: "test", name: "Test Effect", params: {} }
      actor.send({ type: "applyEffect", effect })

      // In ready state, logging actions are not included either
      expect(consoleSpy.log).not.toHaveBeenCalledWith("[PlayerMachine] Применен эффект: Test Effect")
    })
  })

  describe("type safety", () => {
    it("should have properly typed context", () => {
      const snapshot = actor.getSnapshot()
      const context: PlayerContextType = snapshot.context

      // This test mainly ensures TypeScript compilation works correctly
      expect(typeof context.video).toBe("object")
      expect(typeof context.currentTime).toBe("number")
      expect(typeof context.isPlaying).toBe("boolean")
      expect(Array.isArray(context.appliedEffects)).toBe(true)
      expect(Array.isArray(context.appliedFilters)).toBe(true)
    })

    it("should accept properly typed events", () => {
      // These should compile without TypeScript errors
      const events: PlayerEvent[] = [
        { type: "setCurrentTime", currentTime: 30 },
        { type: "setIsPlaying", isPlaying: true },
        { type: "setVideo", video: mockMediaFile },
        { type: "applyEffect", effect: { id: "test", name: "Test", params: {} } },
        { type: "setPrerenderSettings", prerenderEnabled: true },
      ]

      events.forEach((event) => {
        expect(() => actor.send(event)).not.toThrow()
      })
    })
  })
})
