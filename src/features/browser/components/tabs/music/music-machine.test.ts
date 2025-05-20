import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { MediaFile } from "@/types/media"

import { musicMachine } from "./music-machine"
import { filterFiles, sortFiles } from "./music-utils"

// Мокаем модуль music-utils
vi.mock("@/features/browser/components/tabs/music/music-utils", () => ({
  filterFiles: vi.fn((files) => files),
  sortFiles: vi.fn((files) => files),
}))

// Мокаем fetch для тестов
global.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({ media: [] }),
})

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Создаем моковые медиафайлы для тестов
const mockMediaFiles: MediaFile[] = [
  {
    id: "1",
    name: "test1.mp3",
    path: "/test/test1.mp3",
    isAudio: true, // Используем isAudio вместо type
    probeData: {
      format: {
        duration: 120,
        size: 1000,
        tags: {
          title: "Test Song 1",
          artist: "Test Artist 1",
          genre: "Rock",
          date: "2021-01-01",
        },
      },
      streams: [], // Добавляем пустой массив streams для соответствия типу FfprobeData
    },
    duration: 120, // Добавляем duration для соответствия типу MediaFile
  },
  {
    id: "2",
    name: "test2.mp3",
    path: "/test/test2.mp3",
    isAudio: true, // Используем isAudio вместо type
    probeData: {
      format: {
        duration: 180,
        size: 2000,
        tags: {
          title: "Test Song 2",
          artist: "Test Artist 2",
          genre: "Pop",
          date: "2022-01-01",
        },
      },
      streams: [], // Добавляем пустой массив streams для соответствия типу FfprobeData
    },
    duration: 180, // Добавляем duration для соответствия типу MediaFile
  },
]

describe("MusicMachine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
    vi.mocked(filterFiles).mockImplementation((files) => files)
    vi.mocked(sortFiles).mockImplementation((files) => files)

    // Сбрасываем мок для fetch
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ media: [] }),
    })
  })

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(musicMachine).toBeDefined()
    expect(musicMachine.id).toBe("music")
  })

  it("should have correct initial context", () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем начальный контекст
    expect(snapshot.context).toEqual({
      musicFiles: [],
      filteredFiles: [],
      searchQuery: "",
      sortBy: "name",
      sortOrder: "asc",
      filterType: "all",
      viewMode: "list",
      groupBy: "none",
      availableExtensions: [],
      showFavoritesOnly: false,
    })

    // Проверяем начальное состояние
    expect(snapshot.value).toBe("loading")

    // Останавливаем актора
    actor.stop()
  })

  it("should transition to success state when fetch is successful", async () => {
    // Мокируем успешный ответ от API
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ media: mockMediaFiles }),
    })

    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние success
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что машина перешла в состояние success
    expect(snapshot.value).toBe("success")

    // Проверяем, что контекст обновился
    expect(snapshot.context.musicFiles).toEqual(mockMediaFiles)
    expect(snapshot.context.filteredFiles).toEqual(mockMediaFiles)

    // Останавливаем актора
    actor.stop()
  })

  it("should transition to error state when fetch fails", async () => {
    // Мокируем ошибку от API
    global.fetch = vi.fn().mockRejectedValue(new Error("API error"))

    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние error
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что машина перешла в состояние error
    expect(snapshot.value).toBe("error")

    // Проверяем, что контекст содержит ошибку
    expect(snapshot.context.error).toBeDefined()

    // Останавливаем актора
    actor.stop()
  })

  it("should handle SEARCH event correctly", async () => {
    // Мокируем успешный ответ от API
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ media: mockMediaFiles }),
    })

    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние success
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Отправляем событие SEARCH
    actor.send({ type: "SEARCH", query: "test", mediaContext: {} })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что searchQuery обновился
    expect(snapshot.context.searchQuery).toBe("test")

    // Проверяем, что filterFiles был вызван с правильными параметрами
    expect(filterFiles).toHaveBeenCalledWith(
      mockMediaFiles,
      "test",
      "all",
      false,
      {},
    )

    // Останавливаем актора
    actor.stop()
  })

  it("should handle SORT event correctly", async () => {
    // Мокируем успешный ответ от API
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ media: mockMediaFiles }),
    })

    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние success
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Отправляем событие SORT
    actor.send({ type: "SORT", sortBy: "title" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что sortBy обновился
    expect(snapshot.context.sortBy).toBe("title")

    // Проверяем, что sortFiles был вызван с правильными параметрами
    expect(sortFiles).toHaveBeenCalledWith(expect.any(Array), "title", "asc")

    // Останавливаем актора
    actor.stop()
  })

  it("should handle CHANGE_ORDER event correctly", async () => {
    // Мокируем успешный ответ от API
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ media: mockMediaFiles }),
    })

    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние success
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Отправляем событие CHANGE_ORDER
    actor.send({ type: "CHANGE_ORDER" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что sortOrder изменился с "asc" на "desc"
    expect(snapshot.context.sortOrder).toBe("desc")

    // Проверяем, что sortFiles был вызван с правильными параметрами
    expect(sortFiles).toHaveBeenCalledWith(
      expect.any(Array),
      snapshot.context.sortBy,
      "desc",
    )

    // Останавливаем актора
    actor.stop()
  })

  it("should handle FILTER event correctly", async () => {
    // Мокируем успешный ответ от API
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ media: mockMediaFiles }),
    })

    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Ждем, пока машина перейдет в состояние success
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Отправляем событие FILTER
    actor.send({ type: "FILTER", filterType: "mp3", mediaContext: {} })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что filterType обновился
    expect(snapshot.context.filterType).toBe("mp3")

    // Проверяем, что filterFiles был вызван с правильными параметрами
    expect(filterFiles).toHaveBeenCalledWith(
      mockMediaFiles,
      snapshot.context.searchQuery,
      "mp3",
      false,
      {},
    )

    // Останавливаем актора
    actor.stop()
  })
})
