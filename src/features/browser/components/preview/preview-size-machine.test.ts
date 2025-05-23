import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import {
  DEFAULT_PREVIEW_SIZE,
  MAX_PREVIEW_SIZE,
  MIN_PREVIEW_SIZE,
  PREVIEW_SIZES,
  getSavedSize,
  previewSizeMachine,
  saveSize,
} from "./preview-size-machine"

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Устанавливаем мок для localStorage
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})

describe("PreviewSizeMachine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(previewSizeMachine).toBeDefined()
    expect(previewSizeMachine.id).toBe("previewSize")
  })

  it("should have correct constants", () => {
    // Проверяем константы
    expect(MIN_PREVIEW_SIZE).toBe(100)
    expect(MAX_PREVIEW_SIZE).toBe(400)
    expect(DEFAULT_PREVIEW_SIZE).toBe(100)

    // Проверяем массив размеров превью
    expect(PREVIEW_SIZES).toEqual([100, 125, 150, 200, 250, 300, 400])
  })

  it("should have correct initial context", () => {
    // Создаем актора из машины состояний
    const actor = createActor(previewSizeMachine)

    // Запускаем актора
    actor.start()

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем начальный контекст
    expect(snapshot.context).toEqual({
      previewSize: DEFAULT_PREVIEW_SIZE,
      canIncreaseSize: true,
      canDecreaseSize: false,
    })

    // Проверяем начальное состояние
    expect(snapshot.value).toBe("idle")

    // Останавливаем актора
    actor.stop()
  })

  it("should increase preview size when INCREASE_PREVIEW_SIZE event is sent", () => {
    // Создаем актора из машины состояний
    const actor = createActor(previewSizeMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие INCREASE_PREVIEW_SIZE
    actor.send({ type: "INCREASE_PREVIEW_SIZE" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что размер превью увеличился
    expect(snapshot.context.previewSize).toBe(125) // Следующий размер после 100
    expect(snapshot.context.canIncreaseSize).toBe(true)
    expect(snapshot.context.canDecreaseSize).toBe(true)

    // Останавливаем актора
    actor.stop()
  })

  it("should decrease preview size when DECREASE_PREVIEW_SIZE event is sent", () => {
    // Создаем актора из машины состояний с увеличенным размером превью
    const actor = createActor(previewSizeMachine)

    // Запускаем актора
    actor.start()

    // Устанавливаем размер превью на 200 (не минимальный)
    actor.send({ type: "SET_PREVIEW_SIZE", size: 200 })

    // Затем отправляем событие DECREASE_PREVIEW_SIZE
    actor.send({ type: "DECREASE_PREVIEW_SIZE" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что размер превью уменьшился до предыдущего значения в массиве
    expect(snapshot.context.previewSize).toBe(150)
    expect(snapshot.context.canIncreaseSize).toBe(true)
    expect(snapshot.context.canDecreaseSize).toBe(true)

    // Останавливаем актора
    actor.stop()
  })

  it("should set preview size when SET_PREVIEW_SIZE event is sent", () => {
    // Создаем актора из машины состояний
    const actor = createActor(previewSizeMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие SET_PREVIEW_SIZE
    actor.send({ type: "SET_PREVIEW_SIZE", size: 250 })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что размер превью установлен
    expect(snapshot.context.previewSize).toBe(250)
    expect(snapshot.context.canIncreaseSize).toBe(true)
    expect(snapshot.context.canDecreaseSize).toBe(true)

    // Останавливаем актора
    actor.stop()
  })

  it("should not allow decreasing size below minimum", () => {
    // Создаем актора из машины состояний
    const actor = createActor(previewSizeMachine)

    // Запускаем актора
    actor.start()

    // Пытаемся уменьшить размер превью (уже на минимуме)
    actor.send({ type: "DECREASE_PREVIEW_SIZE" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что размер превью не изменился
    expect(snapshot.context.previewSize).toBe(MIN_PREVIEW_SIZE)
    expect(snapshot.context.canDecreaseSize).toBe(false)

    // Останавливаем актора
    actor.stop()
  })

  it("should not allow increasing size above maximum", () => {
    // Создаем актора из машины состояний
    const actor = createActor(previewSizeMachine)

    // Запускаем актора
    actor.start()

    // Устанавливаем максимальный размер превью
    actor.send({ type: "SET_PREVIEW_SIZE", size: MAX_PREVIEW_SIZE })

    // Пытаемся увеличить размер превью
    actor.send({ type: "INCREASE_PREVIEW_SIZE" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что размер превью не изменился
    expect(snapshot.context.previewSize).toBe(MAX_PREVIEW_SIZE)
    expect(snapshot.context.canIncreaseSize).toBe(false)

    // Останавливаем актора
    actor.stop()
  })

  it("should save and load preview size from localStorage", () => {
    // Тестируем функцию сохранения размера превью
    saveSize(200)
    expect(localStorageMock.setItem).toHaveBeenCalledWith("timeline-preview-size", "200")

    // Мокируем возвращаемое значение из localStorage
    localStorageMock.getItem.mockReturnValueOnce("200")

    // Тестируем функцию загрузки размера превью
    const size = getSavedSize()
    expect(localStorageMock.getItem).toHaveBeenCalledWith("timeline-preview-size")
    expect(size).toBe(200)
  })

  it("should return default size when localStorage is empty", () => {
    // Мокируем возвращаемое значение из localStorage (null)
    localStorageMock.getItem.mockReturnValueOnce(null)

    // Тестируем функцию загрузки размера превью
    const size = getSavedSize()
    expect(size).toBe(DEFAULT_PREVIEW_SIZE)
  })

  it("should handle invalid localStorage values", () => {
    // Мокируем возвращаемое значение из localStorage (невалидное значение)
    localStorageMock.getItem.mockReturnValueOnce("invalid")

    // Тестируем функцию загрузки размера превью
    const size = getSavedSize()
    expect(size).toBe(DEFAULT_PREVIEW_SIZE)
  })

  it("should handle localStorage errors", () => {
    // Мокируем ошибку при чтении из localStorage
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error("localStorage error")
    })

    // Тестируем функцию загрузки размера превью
    const size = getSavedSize()
    expect(size).toBe(DEFAULT_PREVIEW_SIZE)
    expect(console.error).toHaveBeenCalled()
  })
})
