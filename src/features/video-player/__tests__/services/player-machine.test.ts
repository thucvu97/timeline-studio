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
})
