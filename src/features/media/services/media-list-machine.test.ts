import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { MediaFile } from "@/types/media"

import {
  DEFAULT_PREVIEW_SIZE,
  MAX_PREVIEW_SIZE,
  MIN_PREVIEW_SIZE,
  PREVIEW_SIZES,
  mediaListMachine,
} from "./media-list-machine"

// Мокаем fetch для тестов
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({ media: [] }),
})

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})

// Создаем моковые медиафайлы для тестов
const mockMediaFiles: MediaFile[] = [
  {
    id: "1",
    name: "test1.mp4",
    path: "/test/test1.mp4",
    isVideo: true,
    duration: 120,
    size: 1000,
  },
  {
    id: "2",
    name: "test2.jpg",
    path: "/test/test2.jpg",
    isImage: true,
    size: 500,
  },
]

describe("MediaListMachine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()

    // Сбрасываем мок для fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ media: [] }),
    })
  })

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(mediaListMachine).toBeDefined()
    expect(mediaListMachine.id).toBe("mediaList")
  })

  it("should have correct initial context", () => {
    // Создаем актора из машины состояний
    const actor = createActor(mediaListMachine)

    // Запускаем актора
    actor.start()

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем начальный контекст
    expect(snapshot.context).toEqual({
      mediaFiles: [],
      filteredFiles: [],
      error: null,
      isLoading: false, // Теперь isLoading сразу false, т.к. мы сразу переходим в success
      searchQuery: "",
      sortBy: "date",
      sortOrder: "desc",
      filterType: "all",
      viewMode: "list",
      groupBy: "none",
      showFavoritesOnly: false,
      availableExtensions: [],
      previewSize: DEFAULT_PREVIEW_SIZE,
      canIncreaseSize: true,
      canDecreaseSize: true,
    })

    // Проверяем начальное состояние
    expect(snapshot.value).toBe("success") // Теперь сразу success, т.к. мы сразу переходим в success

    // Останавливаем актора
    actor.stop()
  })

  it("should initialize with empty media files", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(mediaListMachine)

    // Запускаем актора
    actor.start()

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что машина сразу в состоянии success
    expect(snapshot.value).toBe("success")

    // Проверяем, что контекст инициализирован пустыми массивами
    expect(snapshot.context.mediaFiles).toEqual([])
    expect(snapshot.context.filteredFiles).toEqual([])
    expect(snapshot.context.isLoading).toBe(false)
    expect(snapshot.context.error).toBeNull()

    // Останавливаем актора
    actor.stop()
  })

  it("should handle fetch errors gracefully", async () => {
    // Мокируем ошибку от API
    global.fetch = vi.fn().mockRejectedValue(new Error("API error"))

    // Создаем актора из машины состояний
    const actor = createActor(mediaListMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина обработает ошибку
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что машина перешла в состояние success (так как ошибки обрабатываются возвратом пустого массива)
    expect(snapshot.value).toBe("success")

    // Проверяем, что контекст содержит пустые массивы файлов
    expect(snapshot.context.mediaFiles).toEqual([])
    expect(snapshot.context.filteredFiles).toEqual([])
    expect(snapshot.context.isLoading).toBe(false)

    // Останавливаем актора
    actor.stop()
  })

  it("should handle TOGGLE_FAVORITES event correctly", async () => {
    // Мокируем успешный ответ от API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ media: mockMediaFiles }),
    })

    // Создаем актора из машины состояний
    const actor = createActor(mediaListMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние success
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Отправляем событие TOGGLE_FAVORITES
    actor.send({ type: "TOGGLE_FAVORITES", mediaContext: {} })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что showFavoritesOnly инвертировался
    expect(snapshot.context.showFavoritesOnly).toBe(true)

    // Отправляем событие TOGGLE_FAVORITES еще раз
    actor.send({ type: "TOGGLE_FAVORITES", mediaContext: {} })

    // Получаем снимок состояния
    const newSnapshot = actor.getSnapshot()

    // Проверяем, что showFavoritesOnly инвертировался обратно
    expect(newSnapshot.context.showFavoritesOnly).toBe(false)

    // Останавливаем актора
    actor.stop()
  })

  it("should handle INCREASE_PREVIEW_SIZE event correctly", async () => {
    // Мокируем успешный ответ от API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ media: mockMediaFiles }),
    })

    // Создаем актора из машины состояний
    const actor = createActor(mediaListMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние success
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Сохраняем текущий размер превью
    const initialSize = actor.getSnapshot().context.previewSize

    // Находим индекс текущего размера в массиве PREVIEW_SIZES
    const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= initialSize)

    // Определяем ожидаемый следующий размер
    const expectedNextSize =
      currentIndex < PREVIEW_SIZES.length - 1 ? PREVIEW_SIZES[currentIndex + 1] : MAX_PREVIEW_SIZE

    // Отправляем событие INCREASE_PREVIEW_SIZE
    actor.send({ type: "INCREASE_PREVIEW_SIZE" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что размер превью увеличился до следующего значения в массиве
    expect(snapshot.context.previewSize).toBe(expectedNextSize)

    // Останавливаем актора
    actor.stop()
  })

  it("should handle DECREASE_PREVIEW_SIZE event correctly", async () => {
    // Мокируем успешный ответ от API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ media: mockMediaFiles }),
    })

    // Создаем актора из машины состояний
    const actor = createActor(mediaListMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние success
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Сохраняем текущий размер превью
    const initialSize = actor.getSnapshot().context.previewSize

    // Находим индекс текущего размера в массиве PREVIEW_SIZES
    const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= initialSize)

    // Определяем ожидаемый предыдущий размер
    const expectedPrevSize = currentIndex > 0 ? PREVIEW_SIZES[currentIndex - 1] : MIN_PREVIEW_SIZE

    // Отправляем событие DECREASE_PREVIEW_SIZE
    actor.send({ type: "DECREASE_PREVIEW_SIZE" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что размер превью уменьшился до предыдущего значения в массиве
    expect(snapshot.context.previewSize).toBe(expectedPrevSize)

    // Останавливаем актора
    actor.stop()
  })
})
