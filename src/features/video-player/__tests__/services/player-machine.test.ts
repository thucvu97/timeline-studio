import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { MediaFile } from "@/features/media/types/media"

import { playerMachine } from "../../services/player-machine"

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {})
})

// Создаем тестовый объект MediaFile
const testVideo: MediaFile = {
  id: "test-video-1",
  name: "Test Video",
  path: "/path/to/test-video.mp4",
  duration: 120,
}

describe("Player Machine", () => {
  it("should have correct initial context", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Проверяем, что начальное состояние - idle
    expect(actor.getSnapshot().value).toBe("idle")

    // Проверяем, что начальный контекст правильный
    expect(actor.getSnapshot().context).toEqual({
      video: null,
      currentTime: 0,
      isPlaying: false,
      isSeeking: false,
      isChangingCamera: false,
      isRecording: false,
      isVideoLoading: false,
      isVideoReady: false,
      isResizableMode: false,
      duration: 0,
      volume: 100,
      // Настройки пререндера
      prerenderEnabled: false,
      prerenderQuality: 75,
      prerenderSegmentDuration: 5,
      prerenderApplyEffects: true,
      prerenderAutoPrerender: true,
      // Новые поля
      previewMedia: null,
      videoSource: "browser",
      // Preview apply workflow fields
      appliedEffects: [],
      appliedFilters: [],
      appliedTemplate: null,
    })
  })

  it("should transition to loading state when setVideo event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setVideo
    actor.send({ type: "setVideo", video: testVideo })

    // Проверяем, что состояние изменилось на loading
    expect(actor.getSnapshot().value).toBe("loading")

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.video).toEqual(testVideo)
    expect(actor.getSnapshot().context.isVideoLoading).toBe(true)
  })

  it("should transition to ready state when setVideoReady event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setVideo
    actor.send({ type: "setVideo", video: testVideo })

    // Проверяем, что состояние изменилось на loading
    expect(actor.getSnapshot().value).toBe("loading")

    // Отправляем событие setVideoReady
    actor.send({ type: "setVideoReady", isVideoReady: true })

    // Проверяем, что состояние изменилось на ready
    expect(actor.getSnapshot().value).toBe("ready")

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isVideoReady).toBe(true)
    expect(actor.getSnapshot().context.isVideoLoading).toBe(false)
  })

  it("should update currentTime when setCurrentTime event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setCurrentTime
    actor.send({ type: "setCurrentTime", currentTime: 10 })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.currentTime).toBe(10)
  })

  it("should update isPlaying when setIsPlaying event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setIsPlaying
    actor.send({ type: "setIsPlaying", isPlaying: true })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isPlaying).toBe(true)
  })

  it("should update isSeeking when setIsSeeking event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setIsSeeking
    actor.send({ type: "setIsSeeking", isSeeking: true })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isSeeking).toBe(true)
  })

  it("should update isChangingCamera when setIsChangingCamera event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setIsChangingCamera
    actor.send({ type: "setIsChangingCamera", isChangingCamera: true })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isChangingCamera).toBe(true)
  })

  it("should update isRecording when setIsRecording event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setIsRecording
    actor.send({ type: "setIsRecording", isRecording: true })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isRecording).toBe(true)
  })

  it("should update duration when setDuration event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setDuration
    actor.send({ type: "setDuration", duration: 120 })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.duration).toBe(120)
  })

  it("should update volume when setVolume event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setVolume
    actor.send({ type: "setVolume", volume: 50 })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.volume).toBe(50)

    // Проверяем, что можно установить минимальное значение
    actor.send({ type: "setVolume", volume: 0 })
    expect(actor.getSnapshot().context.volume).toBe(0)

    // Проверяем, что можно установить максимальное значение
    actor.send({ type: "setVolume", volume: 100 })
    expect(actor.getSnapshot().context.volume).toBe(100)
  })

  it("should update isResizableMode when setIsResizableMode event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие setIsResizableMode
    actor.send({ type: "setIsResizableMode", isResizableMode: false })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isResizableMode).toBe(false)
  })
})

describe("Prerender Settings", () => {
  it("should update prerender settings with partial values", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Update only some settings
    actor.send({
      type: "setPrerenderSettings",
      prerenderEnabled: true,
      prerenderQuality: 90,
    })

    const context = actor.getSnapshot().context
    expect(context.prerenderEnabled).toBe(true)
    expect(context.prerenderQuality).toBe(90)
    // Other settings should remain default
    expect(context.prerenderSegmentDuration).toBe(5)
    expect(context.prerenderApplyEffects).toBe(true)
    expect(context.prerenderAutoPrerender).toBe(true)
  })

  it("should update all prerender settings at once", () => {
    const actor = createActor(playerMachine)
    actor.start()

    actor.send({
      type: "setPrerenderSettings",
      prerenderEnabled: false,
      prerenderQuality: 50,
      prerenderSegmentDuration: 10,
      prerenderApplyEffects: false,
      prerenderAutoPrerender: false,
    })

    const context = actor.getSnapshot().context
    expect(context.prerenderEnabled).toBe(false)
    expect(context.prerenderQuality).toBe(50)
    expect(context.prerenderSegmentDuration).toBe(10)
    expect(context.prerenderApplyEffects).toBe(false)
    expect(context.prerenderAutoPrerender).toBe(false)
  })

  it("should handle setPrerenderSettings in all states", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Test in idle state
    actor.send({ type: "setPrerenderSettings", prerenderEnabled: true })
    expect(actor.getSnapshot().context.prerenderEnabled).toBe(true)

    // Move to loading state
    actor.send({ type: "setVideo", video: testVideo })
    expect(actor.getSnapshot().value).toBe("loading")

    // Test in loading state
    actor.send({ type: "setPrerenderSettings", prerenderQuality: 85 })
    expect(actor.getSnapshot().context.prerenderQuality).toBe(85)

    // Move to ready state
    actor.send({ type: "setVideoReady", isVideoReady: true })
    expect(actor.getSnapshot().value).toBe("ready")

    // Test in ready state
    actor.send({ type: "setPrerenderSettings", prerenderSegmentDuration: 15 })
    expect(actor.getSnapshot().context.prerenderSegmentDuration).toBe(15)
  })
})

describe("State Transitions", () => {
  it("should handle video loading flow correctly", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Start in idle
    expect(actor.getSnapshot().value).toBe("idle")
    expect(actor.getSnapshot().context.isVideoLoading).toBe(false)
    expect(actor.getSnapshot().context.isVideoReady).toBe(false)

    // Set video -> loading
    actor.send({ type: "setVideo", video: testVideo })
    expect(actor.getSnapshot().value).toBe("loading")
    expect(actor.getSnapshot().context.isVideoLoading).toBe(true)
    expect(actor.getSnapshot().context.isVideoReady).toBe(false)
    expect(actor.getSnapshot().context.video).toEqual(testVideo)

    // Video ready -> ready
    actor.send({ type: "setVideoReady", isVideoReady: true })
    expect(actor.getSnapshot().value).toBe("ready")
    expect(actor.getSnapshot().context.isVideoLoading).toBe(false)
    expect(actor.getSnapshot().context.isVideoReady).toBe(true)
  })

  it("should handle video change while in ready state", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Get to ready state
    actor.send({ type: "setVideo", video: testVideo })
    actor.send({ type: "setVideoReady", isVideoReady: true })
    expect(actor.getSnapshot().value).toBe("ready")

    const newVideo: MediaFile = {
      id: "test-video-2",
      name: "Test Video 2",
      path: "/path/to/test-video2.mp4",
      duration: 180,
    }

    // Change video while ready
    actor.send({ type: "setVideo", video: newVideo })
    expect(actor.getSnapshot().value).toBe("loading")
    expect(actor.getSnapshot().context.video).toEqual(newVideo)
    expect(actor.getSnapshot().context.isVideoLoading).toBe(true)
    // isVideoReady remains true until explicitly set to false
    expect(actor.getSnapshot().context.isVideoReady).toBe(true)
  })

  it("should handle setVideoLoading event in loading state", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Move to loading state
    actor.send({ type: "setVideo", video: testVideo })
    expect(actor.getSnapshot().value).toBe("loading")

    // Update loading status
    actor.send({ type: "setVideoLoading", isVideoLoading: false })
    expect(actor.getSnapshot().context.isVideoLoading).toBe(false)
    // Should still be in loading state
    expect(actor.getSnapshot().value).toBe("loading")
  })
})

describe("Complex Event Sequences", () => {
  it("should handle rapid state changes", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Rapid play/pause toggles
    actor.send({ type: "setIsPlaying", isPlaying: true })
    actor.send({ type: "setIsPlaying", isPlaying: false })
    actor.send({ type: "setIsPlaying", isPlaying: true })
    expect(actor.getSnapshot().context.isPlaying).toBe(true)

    // Rapid seeking
    actor.send({ type: "setIsSeeking", isSeeking: true })
    actor.send({ type: "setCurrentTime", currentTime: 30 })
    actor.send({ type: "setCurrentTime", currentTime: 45 })
    actor.send({ type: "setIsSeeking", isSeeking: false })
    expect(actor.getSnapshot().context.currentTime).toBe(45)
    expect(actor.getSnapshot().context.isSeeking).toBe(false)
  })

  it("should handle all events in loading state", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Move to loading state
    actor.send({ type: "setVideo", video: testVideo })
    expect(actor.getSnapshot().value).toBe("loading")

    // Test all events that work in loading state
    actor.send({ type: "setIsPlaying", isPlaying: true })
    actor.send({ type: "setCurrentTime", currentTime: 10 })
    actor.send({ type: "setIsSeeking", isSeeking: true })
    actor.send({ type: "setIsChangingCamera", isChangingCamera: true })
    actor.send({ type: "setIsRecording", isRecording: true })
    actor.send({ type: "setDuration", duration: 200 })
    actor.send({ type: "setVolume", volume: 80 })
    actor.send({ type: "setIsResizableMode", isResizableMode: true })
    actor.send({ type: "setPrerenderSettings", prerenderEnabled: true })
    actor.send({ type: "setPreviewMedia", media: testVideo })
    actor.send({ type: "setVideoSource", source: "timeline" })

    const context = actor.getSnapshot().context
    expect(context.isPlaying).toBe(true)
    expect(context.currentTime).toBe(10)
    expect(context.isSeeking).toBe(true)
    expect(context.isChangingCamera).toBe(true)
    expect(context.isRecording).toBe(true)
    expect(context.duration).toBe(200)
    expect(context.volume).toBe(80)
    expect(context.isResizableMode).toBe(true)
    expect(context.prerenderEnabled).toBe(true)
    expect(context.previewMedia).toEqual(testVideo)
    expect(context.videoSource).toBe("timeline")
  })

  it("should handle all events in ready state", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Move to ready state
    actor.send({ type: "setVideo", video: testVideo })
    actor.send({ type: "setVideoReady", isVideoReady: true })
    expect(actor.getSnapshot().value).toBe("ready")

    // Test all events in ready state
    actor.send({ type: "setIsPlaying", isPlaying: true })
    actor.send({ type: "setCurrentTime", currentTime: 20 })
    actor.send({ type: "setIsSeeking", isSeeking: false })
    actor.send({ type: "setIsChangingCamera", isChangingCamera: false })
    actor.send({ type: "setIsRecording", isRecording: false })
    actor.send({ type: "setDuration", duration: 150 })
    actor.send({ type: "setVolume", volume: 60 })
    actor.send({ type: "setIsResizableMode", isResizableMode: false })
    actor.send({ type: "setPrerenderSettings", prerenderQuality: 100 })

    const context = actor.getSnapshot().context
    expect(context.isPlaying).toBe(true)
    expect(context.currentTime).toBe(20)
    expect(context.isSeeking).toBe(false)
    expect(context.isChangingCamera).toBe(false)
    expect(context.isRecording).toBe(false)
    expect(context.duration).toBe(150)
    expect(context.volume).toBe(60)
    expect(context.isResizableMode).toBe(false)
    expect(context.prerenderQuality).toBe(100)
  })
})

describe("Preview Apply Workflow", () => {
  it("should apply effect to context", () => {
    const actor = createActor(playerMachine)
    actor.start()

    const effect = { id: "effect-1", name: "Blur", params: { intensity: 0.5 } }

    actor.send({ type: "applyEffect", effect })

    expect(actor.getSnapshot().context.appliedEffects).toEqual([effect])
  })

  it("should apply filter to context", () => {
    const actor = createActor(playerMachine)
    actor.start()

    const filter = { id: "filter-1", name: "Vintage", params: { saturation: 0.8 } }

    actor.send({ type: "applyFilter", filter })

    expect(actor.getSnapshot().context.appliedFilters).toEqual([filter])
  })

  it("should apply template to context", () => {
    const actor = createActor(playerMachine)
    actor.start()

    const template = { id: "template-1", name: "Split Screen" }
    const files = [testVideo]

    actor.send({ type: "applyTemplate", template, files })

    expect(actor.getSnapshot().context.appliedTemplate).toEqual({
      id: template.id,
      name: template.name,
      files: files,
    })
  })

  it("should clear effects from context", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // First apply an effect
    const effect = { id: "effect-1", name: "Blur", params: { intensity: 0.5 } }
    actor.send({ type: "applyEffect", effect })
    expect(actor.getSnapshot().context.appliedEffects).toEqual([effect])

    // Then clear effects
    actor.send({ type: "clearEffects" })
    expect(actor.getSnapshot().context.appliedEffects).toEqual([])
  })

  it("should clear filters from context", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // First apply a filter
    const filter = { id: "filter-1", name: "Vintage", params: { saturation: 0.8 } }
    actor.send({ type: "applyFilter", filter })
    expect(actor.getSnapshot().context.appliedFilters).toEqual([filter])

    // Then clear filters
    actor.send({ type: "clearFilters" })
    expect(actor.getSnapshot().context.appliedFilters).toEqual([])
  })

  it("should clear template from context", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // First apply a template
    const template = { id: "template-1", name: "Split Screen" }
    const files = [testVideo]
    actor.send({ type: "applyTemplate", template, files })
    expect(actor.getSnapshot().context.appliedTemplate).not.toBeNull()

    // Then clear template
    actor.send({ type: "clearTemplate" })
    expect(actor.getSnapshot().context.appliedTemplate).toBeNull()
  })

  it("should set preview media", () => {
    const actor = createActor(playerMachine)
    actor.start()

    actor.send({ type: "setPreviewMedia", media: testVideo })

    expect(actor.getSnapshot().context.previewMedia).toEqual(testVideo)
  })

  it("should set video source", () => {
    const actor = createActor(playerMachine)
    actor.start()

    actor.send({ type: "setVideoSource", source: "timeline" })

    expect(actor.getSnapshot().context.videoSource).toBe("timeline")
  })

  it("should apply multiple effects", () => {
    const actor = createActor(playerMachine)
    actor.start()

    const effect1 = { id: "effect-1", name: "Blur", params: { intensity: 0.5 } }
    const effect2 = { id: "effect-2", name: "Glow", params: { strength: 0.3 } }

    actor.send({ type: "applyEffect", effect: effect1 })
    actor.send({ type: "applyEffect", effect: effect2 })

    expect(actor.getSnapshot().context.appliedEffects).toEqual([effect1, effect2])
  })

  it("should apply multiple filters", () => {
    const actor = createActor(playerMachine)
    actor.start()

    const filter1 = { id: "filter-1", name: "Vintage", params: { saturation: 0.8 } }
    const filter2 = { id: "filter-2", name: "Sepia", params: { amount: 0.6 } }

    actor.send({ type: "applyFilter", filter: filter1 })
    actor.send({ type: "applyFilter", filter: filter2 })

    expect(actor.getSnapshot().context.appliedFilters).toEqual([filter1, filter2])
  })

  it("should handle apply events in loading state", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Move to loading state
    actor.send({ type: "setVideo", video: testVideo })
    expect(actor.getSnapshot().value).toBe("loading")

    const effect = { id: "effect-1", name: "Blur", params: { intensity: 0.5 } }
    const filter = { id: "filter-1", name: "Vintage", params: { saturation: 0.8 } }
    const template = { id: "template-1", name: "Split Screen" }

    actor.send({ type: "applyEffect", effect })
    actor.send({ type: "applyFilter", filter })
    actor.send({ type: "applyTemplate", template, files: [testVideo] })

    const context = actor.getSnapshot().context
    expect(context.appliedEffects).toEqual([effect])
    expect(context.appliedFilters).toEqual([filter])
    expect(context.appliedTemplate).toEqual({
      id: template.id,
      name: template.name,
      files: [testVideo],
    })
  })

  it("should handle clear events in loading state", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Apply some effects first
    const effect = { id: "effect-1", name: "Blur", params: { intensity: 0.5 } }
    const filter = { id: "filter-1", name: "Vintage", params: { saturation: 0.8 } }
    const template = { id: "template-1", name: "Split Screen" }

    actor.send({ type: "applyEffect", effect })
    actor.send({ type: "applyFilter", filter })
    actor.send({ type: "applyTemplate", template, files: [testVideo] })

    // Move to loading state
    actor.send({ type: "setVideo", video: testVideo })
    expect(actor.getSnapshot().value).toBe("loading")

    // Clear in loading state
    actor.send({ type: "clearEffects" })
    actor.send({ type: "clearFilters" })
    actor.send({ type: "clearTemplate" })

    const context = actor.getSnapshot().context
    expect(context.appliedEffects).toEqual([])
    expect(context.appliedFilters).toEqual([])
    expect(context.appliedTemplate).toBeNull()
  })

  it("should handle apply and clear events in ready state", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Move to ready state
    actor.send({ type: "setVideo", video: testVideo })
    actor.send({ type: "setVideoReady", isVideoReady: true })
    expect(actor.getSnapshot().value).toBe("ready")

    const effect = { id: "effect-1", name: "Glow", params: { strength: 0.7 } }
    const filter = { id: "filter-1", name: "Black & White", params: {} }
    const template = { id: "template-1", name: "Picture in Picture" }

    // Apply in ready state
    actor.send({ type: "applyEffect", effect })
    actor.send({ type: "applyFilter", filter })
    actor.send({ type: "applyTemplate", template, files: [testVideo] })

    let context = actor.getSnapshot().context
    expect(context.appliedEffects).toEqual([effect])
    expect(context.appliedFilters).toEqual([filter])
    expect(context.appliedTemplate).not.toBeNull()

    // Clear in ready state
    actor.send({ type: "clearEffects" })
    actor.send({ type: "clearFilters" })
    actor.send({ type: "clearTemplate" })

    context = actor.getSnapshot().context
    expect(context.appliedEffects).toEqual([])
    expect(context.appliedFilters).toEqual([])
    expect(context.appliedTemplate).toBeNull()
  })
})

describe("Edge Cases and Error Handling", () => {
  it("should handle null preview media", () => {
    const actor = createActor(playerMachine)
    actor.start()

    actor.send({ type: "setPreviewMedia", media: null })
    expect(actor.getSnapshot().context.previewMedia).toBeNull()
  })

  it("should handle volume boundaries", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Test volume above 100 (should be clamped by UI, but machine accepts it)
    actor.send({ type: "setVolume", volume: 150 })
    expect(actor.getSnapshot().context.volume).toBe(150)

    // Test negative volume
    actor.send({ type: "setVolume", volume: -10 })
    expect(actor.getSnapshot().context.volume).toBe(-10)
  })

  it("should handle currentTime beyond duration", () => {
    const actor = createActor(playerMachine)
    actor.start()

    actor.send({ type: "setDuration", duration: 100 })
    actor.send({ type: "setCurrentTime", currentTime: 150 })
    
    // Machine doesn't validate, it accepts the value
    expect(actor.getSnapshot().context.currentTime).toBe(150)
  })

  it("should preserve context when transitioning states", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Set various context values in idle
    actor.send({ type: "setVolume", volume: 75 })
    actor.send({ type: "setIsResizableMode", isResizableMode: true })
    actor.send({ type: "setPrerenderSettings", prerenderQuality: 85 })

    const effect = { id: "effect-1", name: "Blur", params: { intensity: 0.5 } }
    actor.send({ type: "applyEffect", effect })

    // Transition to loading
    actor.send({ type: "setVideo", video: testVideo })
    
    // Check context preserved
    let context = actor.getSnapshot().context
    expect(context.volume).toBe(75)
    expect(context.isResizableMode).toBe(true)
    expect(context.prerenderQuality).toBe(85)
    expect(context.appliedEffects).toEqual([effect])

    // Transition to ready
    actor.send({ type: "setVideoReady", isVideoReady: true })
    
    // Check context still preserved
    context = actor.getSnapshot().context
    expect(context.volume).toBe(75)
    expect(context.isResizableMode).toBe(true)
    expect(context.prerenderQuality).toBe(85)
    expect(context.appliedEffects).toEqual([effect])
  })

  it("should handle console.log calls", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // Clear previous calls from other tests
    vi.clearAllMocks()

    // Check that console.log is called for setVideo
    actor.send({ type: "setVideo", video: testVideo })
    expect(console.log).toHaveBeenCalledWith(
      `[PlayerMachine] Установлено видео: ${testVideo.id}, path=${testVideo.path}`
    )

    // Check setPreviewMedia
    actor.send({ type: "setPreviewMedia", media: testVideo })
    expect(console.log).toHaveBeenCalledWith(
      `[PlayerMachine] Установлено preview media: ${testVideo.id}`
    )

    // Check setVideoSource
    actor.send({ type: "setVideoSource", source: "timeline" })
    expect(console.log).toHaveBeenCalledWith(
      `[PlayerMachine] Установлен источник видео: timeline`
    )

    // Test that applyEffect updates context correctly
    const effect = { id: "effect-1", name: "TestEffect", params: {} }
    actor.send({ type: "applyEffect", effect })
    expect(actor.getSnapshot().context.appliedEffects).toContainEqual(effect)

    // Test clearEffects updates context
    actor.send({ type: "clearEffects" })
    expect(actor.getSnapshot().context.appliedEffects).toEqual([])

    // Move to ready state to test logging there
    actor.send({ type: "setVideoReady", isVideoReady: true })
    expect(actor.getSnapshot().value).toBe("ready")
    expect(console.log).toHaveBeenCalledWith(
      `[PlayerMachine] Видео ${testVideo.id} готово к воспроизведению`
    )
  })
})

describe("Complete Workflow Scenarios", () => {
  it("should handle complete video playback workflow", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // 1. Set video
    actor.send({ type: "setVideo", video: testVideo })
    expect(actor.getSnapshot().value).toBe("loading")

    // 2. Video becomes ready
    actor.send({ type: "setVideoReady", isVideoReady: true })
    expect(actor.getSnapshot().value).toBe("ready")

    // 3. Set duration from metadata
    actor.send({ type: "setDuration", duration: testVideo.duration })
    expect(actor.getSnapshot().context.duration).toBe(120)

    // 4. Start playback
    actor.send({ type: "setIsPlaying", isPlaying: true })
    expect(actor.getSnapshot().context.isPlaying).toBe(true)

    // 5. Update current time during playback
    actor.send({ type: "setCurrentTime", currentTime: 30 })
    actor.send({ type: "setCurrentTime", currentTime: 60 })
    expect(actor.getSnapshot().context.currentTime).toBe(60)

    // 6. User seeks
    actor.send({ type: "setIsSeeking", isSeeking: true })
    actor.send({ type: "setCurrentTime", currentTime: 90 })
    actor.send({ type: "setIsSeeking", isSeeking: false })
    expect(actor.getSnapshot().context.currentTime).toBe(90)
    expect(actor.getSnapshot().context.isSeeking).toBe(false)

    // 7. Pause playback
    actor.send({ type: "setIsPlaying", isPlaying: false })
    expect(actor.getSnapshot().context.isPlaying).toBe(false)

    // 8. Change volume
    actor.send({ type: "setVolume", volume: 50 })
    expect(actor.getSnapshot().context.volume).toBe(50)
  })

  it("should handle complete effects workflow", () => {
    const actor = createActor(playerMachine)
    actor.start()

    // 1. Set preview media
    actor.send({ type: "setPreviewMedia", media: testVideo })
    actor.send({ type: "setVideoSource", source: "browser" })

    // 2. Apply multiple effects
    const effect1 = { id: "e1", name: "Blur", params: { intensity: 0.3 } }
    const effect2 = { id: "e2", name: "Glow", params: { strength: 0.5 } }
    actor.send({ type: "applyEffect", effect: effect1 })
    actor.send({ type: "applyEffect", effect: effect2 })

    // 3. Apply filters
    const filter1 = { id: "f1", name: "Vintage", params: { amount: 0.7 } }
    actor.send({ type: "applyFilter", filter: filter1 })

    // 4. Apply template
    const template = { id: "t1", name: "Split Screen" }
    const files = [testVideo, { ...testVideo, id: "video2" }]
    actor.send({ type: "applyTemplate", template, files })

    // 5. Enable prerender with effects
    actor.send({
      type: "setPrerenderSettings",
      prerenderEnabled: true,
      prerenderApplyEffects: true,
      prerenderQuality: 90,
    })

    // 6. Check final state
    const context = actor.getSnapshot().context
    expect(context.appliedEffects).toHaveLength(2)
    expect(context.appliedFilters).toHaveLength(1)
    expect(context.appliedTemplate?.files).toHaveLength(2)
    expect(context.prerenderEnabled).toBe(true)
    expect(context.prerenderApplyEffects).toBe(true)

    // 7. Clear everything
    actor.send({ type: "clearEffects" })
    actor.send({ type: "clearFilters" })
    actor.send({ type: "clearTemplate" })

    // 8. Verify cleared
    const clearedContext = actor.getSnapshot().context
    expect(clearedContext.appliedEffects).toEqual([])
    expect(clearedContext.appliedFilters).toEqual([])
    expect(clearedContext.appliedTemplate).toBeNull()
  })
})
