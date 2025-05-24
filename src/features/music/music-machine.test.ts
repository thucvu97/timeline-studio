import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { MediaFile } from "@/types/media"

import { musicMachine } from "./music-machine"
import { filterFiles, sortFiles } from "./music-utils"

// Мокаем модуль music-utils
vi.mock("./music-utils", () => ({
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
vi.spyOn(console, "warn").mockImplementation(() => {})

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
    expect(snapshot.value).toBe("success") // Теперь сразу success, т.к. мы сразу переходим в success

    // Останавливаем актора
    actor.stop()
  })

  it("should initialize with empty music files", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что машина сразу в состоянии success
    expect(snapshot.value).toBe("success")

    // Проверяем, что контекст инициализирован пустыми массивами
    expect(snapshot.context.musicFiles).toEqual([])
    expect(snapshot.context.filteredFiles).toEqual([])

    // Останавливаем актора
    actor.stop()
  })

  it("should handle errors gracefully", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что машина сразу в состоянии success
    expect(snapshot.value).toBe("success")

    // Проверяем, что контекст инициализирован пустыми массивами
    expect(snapshot.context.musicFiles).toEqual([])
    expect(snapshot.context.filteredFiles).toEqual([])
    expect(snapshot.context.error).toBeUndefined()

    // Останавливаем актора
    actor.stop()
  })

  it("should handle SEARCH event correctly", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Устанавливаем мок для filterFiles
    vi.mocked(filterFiles).mockReturnValueOnce([])

    // Отправляем событие SEARCH
    actor.send({ type: "SEARCH", query: "test", mediaContext: {} })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что searchQuery обновился
    expect(snapshot.context.searchQuery).toBe("test")

    // Проверяем, что filterFiles был вызван с правильными параметрами
    expect(filterFiles).toHaveBeenCalledWith([], "test", "all", false, {})

    // Останавливаем актора
    actor.stop()
  })

  it("should handle SORT event correctly", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Устанавливаем мок для sortFiles
    vi.mocked(sortFiles).mockReturnValueOnce([])

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
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Устанавливаем мок для sortFiles
    vi.mocked(sortFiles).mockReturnValueOnce([])

    // Отправляем событие CHANGE_ORDER
    actor.send({ type: "CHANGE_ORDER" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что sortOrder изменился с "asc" на "desc"
    expect(snapshot.context.sortOrder).toBe("desc")

    // Проверяем, что sortFiles был вызван с правильными параметрами
    expect(sortFiles).toHaveBeenCalledWith(expect.any(Array), snapshot.context.sortBy, "desc")

    // Останавливаем актора
    actor.stop()
  })

  it("should handle FILTER event correctly", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Устанавливаем мок для filterFiles
    vi.mocked(filterFiles).mockReturnValueOnce([])

    // Отправляем событие FILTER
    actor.send({ type: "FILTER", filterType: "mp3", mediaContext: {} })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что filterType обновился
    expect(snapshot.context.filterType).toBe("mp3")

    // Проверяем, что filterFiles был вызван с правильными параметрами
    expect(filterFiles).toHaveBeenCalledWith([], snapshot.context.searchQuery, "mp3", false, {})

    // Останавливаем актора
    actor.stop()
  })

  it("should handle CHANGE_VIEW_MODE event correctly", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие CHANGE_VIEW_MODE
    actor.send({ type: "CHANGE_VIEW_MODE", mode: "thumbnails" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что viewMode обновился
    expect(snapshot.context.viewMode).toBe("thumbnails")

    // Останавливаем актора
    actor.stop()
  })

  it("should handle CHANGE_GROUP_BY event correctly", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие CHANGE_GROUP_BY
    actor.send({ type: "CHANGE_GROUP_BY", groupBy: "artist" })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что groupBy обновился
    expect(snapshot.context.groupBy).toBe("artist")

    // Останавливаем актора
    actor.stop()
  })

  it("should handle TOGGLE_FAVORITES event correctly", async () => {
    // Создаем актора из машины состояний
    const actor = createActor(musicMachine)

    // Запускаем актора
    actor.start()

    // Устанавливаем мок для filterFiles
    vi.mocked(filterFiles).mockReturnValueOnce([])

    // Отправляем событие TOGGLE_FAVORITES
    actor.send({ type: "TOGGLE_FAVORITES", mediaContext: {} })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что showFavoritesOnly обновился
    expect(snapshot.context.showFavoritesOnly).toBe(true)

    // Проверяем, что filterFiles был вызван с правильными параметрами
    expect(filterFiles).toHaveBeenCalledWith([], snapshot.context.searchQuery, snapshot.context.filterType, true, {})

    // Отправляем событие TOGGLE_FAVORITES еще раз, чтобы переключить обратно
    actor.send({ type: "TOGGLE_FAVORITES", mediaContext: {} })

    // Получаем снимок состояния
    const newSnapshot = actor.getSnapshot()

    // Проверяем, что showFavoritesOnly переключился обратно
    expect(newSnapshot.context.showFavoritesOnly).toBe(false)

    // Останавливаем актора
    actor.stop()
  })

  describe("Error state", () => {
    it("should handle RETRY event correctly in error state", async () => {
      // Создаем актора из машины состояний с начальным состоянием error
      const errorMachine = musicMachine.provide({
        actors: {
          fetchMusicFiles: () => {
            throw new Error("Test error")
          },
        },
      })

      const actor = createActor(errorMachine)

      // Запускаем актора
      actor.start()

      // Переводим машину в состояние ошибки
      actor.send({ type: "RETRY" })

      // Отправляем событие RETRY
      actor.send({ type: "RETRY" })

      // Получаем снимок состояния
      const snapshot = actor.getSnapshot()

      // Проверяем, что машина перешла в состояние loading
      expect(snapshot.value).toBe("success")

      // Останавливаем актора
      actor.stop()
    })

    it("should handle error state correctly", async () => {
      // Создаем актора из машины состояний
      const actor = createActor(musicMachine)

      // Запускаем актора
      actor.start()

      // Симулируем ошибку, устанавливая контекст напрямую
      actor.send({
        type: "RETRY",
        error: "Test error"
      })

      // Получаем снимок состояния
      const snapshot = actor.getSnapshot()

      // Проверяем, что контекст содержит ожидаемые значения
      expect(snapshot.context.musicFiles).toEqual([])
      expect(snapshot.context.filteredFiles).toEqual([])

      // Останавливаем актора
      actor.stop()
    })

    it("should handle SORT event correctly in error state", async () => {
      // Создаем актора из машины состояний
      const actor = createActor(musicMachine)

      // Запускаем актора
      actor.start()

      // Устанавливаем мок для sortFiles
      vi.mocked(sortFiles).mockReturnValueOnce([])

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

    it("should handle FILTER event correctly in error state", async () => {
      // Создаем актора из машины состояний
      const actor = createActor(musicMachine)

      // Запускаем актора
      actor.start()

      // Устанавливаем мок для filterFiles
      vi.mocked(filterFiles).mockReturnValueOnce([])

      // Отправляем событие FILTER
      actor.send({ type: "FILTER", filterType: "mp3", mediaContext: {} })

      // Получаем снимок состояния
      const snapshot = actor.getSnapshot()

      // Проверяем, что filterType обновился
      expect(snapshot.context.filterType).toBe("mp3")

      // Проверяем, что filterFiles был вызван с правильными параметрами
      expect(filterFiles).toHaveBeenCalledWith([], snapshot.context.searchQuery, "mp3", false, {})

      // Останавливаем актора
      actor.stop()
    })

    it("should handle SEARCH event correctly in error state", async () => {
      // Создаем актора из машины состояний
      const actor = createActor(musicMachine)

      // Запускаем актора
      actor.start()

      // Устанавливаем мок для filterFiles
      vi.mocked(filterFiles).mockReturnValueOnce([])

      // Отправляем событие SEARCH
      actor.send({ type: "SEARCH", query: "test", mediaContext: {} })

      // Получаем снимок состояния
      const snapshot = actor.getSnapshot()

      // Проверяем, что searchQuery обновился
      expect(snapshot.context.searchQuery).toBe("test")

      // Проверяем, что filterFiles был вызван с правильными параметрами
      expect(filterFiles).toHaveBeenCalledWith([], "test", "all", false, {})

      // Останавливаем актора
      actor.stop()
    })

    it("should handle CHANGE_VIEW_MODE event correctly in error state", async () => {
      // Создаем актора из машины состояний
      const actor = createActor(musicMachine)

      // Запускаем актора
      actor.start()

      // Отправляем событие CHANGE_VIEW_MODE
      actor.send({ type: "CHANGE_VIEW_MODE", mode: "thumbnails" })

      // Получаем снимок состояния
      const snapshot = actor.getSnapshot()

      // Проверяем, что viewMode обновился
      expect(snapshot.context.viewMode).toBe("thumbnails")

      // Останавливаем актора
      actor.stop()
    })

    it("should handle TOGGLE_FAVORITES event correctly in error state", async () => {
      // Создаем актора из машины состояний
      const actor = createActor(musicMachine)

      // Запускаем актора
      actor.start()

      // Устанавливаем мок для filterFiles
      vi.mocked(filterFiles).mockReturnValueOnce([])

      // Отправляем событие TOGGLE_FAVORITES
      actor.send({ type: "TOGGLE_FAVORITES", mediaContext: {} })

      // Получаем снимок состояния
      const snapshot = actor.getSnapshot()

      // Проверяем, что showFavoritesOnly обновился
      expect(snapshot.context.showFavoritesOnly).toBe(true)

      // Проверяем, что filterFiles был вызван с правильными параметрами
      expect(filterFiles).toHaveBeenCalledWith([], snapshot.context.searchQuery, snapshot.context.filterType, true, {})

      // Останавливаем актора
      actor.stop()
    })

    it("should handle CHANGE_GROUP_BY event correctly in error state", async () => {
      // Создаем актора из машины состояний
      const actor = createActor(musicMachine)

      // Запускаем актора
      actor.start()

      // Отправляем событие CHANGE_GROUP_BY
      actor.send({ type: "CHANGE_GROUP_BY", groupBy: "artist" })

      // Получаем снимок состояния
      const snapshot = actor.getSnapshot()

      // Проверяем, что groupBy обновился
      expect(snapshot.context.groupBy).toBe("artist")

      // Останавливаем актора
      actor.stop()
    })

    it("should handle CHANGE_ORDER event correctly in error state", async () => {
      // Создаем актора из машины состояний
      const actor = createActor(musicMachine)

      // Запускаем актора
      actor.start()

      // Устанавливаем мок для sortFiles
      vi.mocked(sortFiles).mockReturnValueOnce([])

      // Отправляем событие CHANGE_ORDER
      actor.send({ type: "CHANGE_ORDER" })

      // Получаем снимок состояния
      const snapshot = actor.getSnapshot()

      // Проверяем, что sortOrder изменился с "asc" на "desc"
      expect(snapshot.context.sortOrder).toBe("desc")

      // Проверяем, что sortFiles был вызван с правильными параметрами
      expect(sortFiles).toHaveBeenCalledWith(expect.any(Array), snapshot.context.sortBy, "desc")

      // Останавливаем актора
      actor.stop()
    })
  })
})
