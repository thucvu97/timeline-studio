import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/types/media"

import { musicMachine } from "./music-machine"
import { filterFiles, sortFiles } from "./music-utils"

// Мокаем модуль music-utils
vi.mock("./music-utils", () => ({
  filterFiles: vi.fn((files) => files),
  sortFiles: vi.fn((files) => files),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Создаем моковые медиафайлы для тестов
const mockMediaFiles: MediaFile[] = [
  {
    id: "1",
    name: "test1.mp3",
    path: "/test/test1.mp3",
    type: "audio",
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
    },
  },
  {
    id: "2",
    name: "test2.mp3",
    path: "/test/test2.mp3",
    type: "audio",
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
    },
  },
]

describe("MusicMachine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
    vi.mocked(filterFiles).mockImplementation((files) => files)
    vi.mocked(sortFiles).mockImplementation((files) => files)
  })

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(musicMachine).toBeDefined()

    // Проверяем основные свойства машины состояний
    expect(musicMachine.id).toBe("music")
    expect(musicMachine.config.initial).toBe("loading")

    // Проверяем, что машина имеет нужные состояния
    expect(musicMachine.config.states).toHaveProperty("loading")
    expect(musicMachine.config.states).toHaveProperty("loaded")
    expect(musicMachine.config.states).toHaveProperty("error")
  })

  it("should have correct initial context", () => {
    // Проверяем начальный контекст машины состояний
    const initialContext = musicMachine.config.context
    expect(initialContext).toEqual({
      media: [],
      filteredMedia: [],
      searchQuery: "",
      sortBy: "date",
      sortOrder: "desc",
      filterType: "all",
      viewMode: "thumbnails",
      groupBy: "none",
      showFavoritesOnly: false,
      availableExtensions: [],
      error: null,
    })
  })

  it("should have correct transitions", () => {
    // Проверяем переходы машины состояний
    const loadingState = musicMachine.config.states.loading
    expect(loadingState.on).toHaveProperty("FETCH.DONE")
    expect(loadingState.on).toHaveProperty("FETCH.ERROR")

    const loadedState = musicMachine.config.states.loaded
    expect(loadedState.on).toHaveProperty("SEARCH")
    expect(loadedState.on).toHaveProperty("SORT")
    expect(loadedState.on).toHaveProperty("FILTER")
    expect(loadedState.on).toHaveProperty("CHANGE_VIEW_MODE")
    expect(loadedState.on).toHaveProperty("CHANGE_GROUP_BY")
    expect(loadedState.on).toHaveProperty("CHANGE_ORDER")
    expect(loadedState.on).toHaveProperty("TOGGLE_FAVORITES")
  })

  it("should handle SEARCH event correctly", () => {
    // Создаем действие для события SEARCH
    const searchAction = musicMachine.config.states.loaded.on.SEARCH.actions[0]

    // Проверяем, что действие определено
    expect(searchAction).toBeDefined()

    // Создаем мок-контекст и событие
    const mockContext = {
      ...musicMachine.config.context,
      media: mockMediaFiles,
    }
    const mockEvent = { type: "SEARCH", query: "test", mediaContext: {} }

    // Вызываем действие
    const result = searchAction.exec(
      { context: mockContext, event: mockEvent } as any,
      {} as any,
      {} as any,
    )

    // Проверяем, что filterFiles был вызван с правильными параметрами
    expect(filterFiles).toHaveBeenCalledWith(
      mockMediaFiles,
      "test",
      "all",
      false,
      {},
    )
  })

  it("should handle SORT event correctly", () => {
    // Создаем действие для события SORT
    const sortAction = musicMachine.config.states.loaded.on.SORT.actions[0]

    // Проверяем, что действие определено
    expect(sortAction).toBeDefined()

    // Создаем мок-контекст и событие
    const mockContext = {
      ...musicMachine.config.context,
      media: mockMediaFiles,
      filteredMedia: mockMediaFiles,
      sortOrder: "asc",
    }
    const mockEvent = { type: "SORT", sortBy: "title" }

    // Вызываем действие
    const result = sortAction.exec(
      { context: mockContext, event: mockEvent } as any,
      {} as any,
      {} as any,
    )

    // Проверяем, что sortFiles был вызван с правильными параметрами
    expect(sortFiles).toHaveBeenCalledWith(mockMediaFiles, "title", "asc")
  })

  it("should handle CHANGE_ORDER event correctly", () => {
    // Создаем действие для события CHANGE_ORDER
    const changeOrderAction =
      musicMachine.config.states.loaded.on.CHANGE_ORDER.actions[0]

    // Проверяем, что действие определено
    expect(changeOrderAction).toBeDefined()

    // Создаем мок-контекст и событие
    const mockContext = {
      ...musicMachine.config.context,
      sortOrder: "asc",
      filteredMedia: mockMediaFiles,
    }
    const mockEvent = { type: "CHANGE_ORDER" }

    // Вызываем действие
    const result = changeOrderAction.exec(
      { context: mockContext, event: mockEvent } as any,
      {} as any,
      {} as any,
    )

    // Проверяем, что sortFiles был вызван с правильными параметрами
    expect(sortFiles).toHaveBeenCalledWith(
      mockMediaFiles,
      mockContext.sortBy,
      "desc",
    )
  })

  it("should handle FILTER event correctly", () => {
    // Создаем действие для события FILTER
    const filterAction = musicMachine.config.states.loaded.on.FILTER.actions[0]

    // Проверяем, что действие определено
    expect(filterAction).toBeDefined()

    // Создаем мок-контекст и событие
    const mockContext = {
      ...musicMachine.config.context,
      media: mockMediaFiles,
      searchQuery: "test",
    }
    const mockEvent = { type: "FILTER", filterType: "mp3", mediaContext: {} }

    // Вызываем действие
    const result = filterAction.exec(
      { context: mockContext, event: mockEvent } as any,
      {} as any,
      {} as any,
    )

    // Проверяем, что filterFiles был вызван с правильными параметрами
    expect(filterFiles).toHaveBeenCalledWith(
      mockMediaFiles,
      "test",
      "mp3",
      false,
      {},
    )
  })
})
