import { renderHook } from "@testing-library/react"
import { act } from "react-dom/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMusicMachine } from "./use-music-machine"

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => {
  const mockSend = vi.fn()
  const mockState = {
    context: {
      musicFiles: [],
      filteredFiles: [],
      searchQuery: "",
      sortBy: "date",
      sortOrder: "desc",
      filterType: "all",
      viewMode: "thumbnails",
      groupBy: "none",
      showFavoritesOnly: false,
      availableExtensions: ["mp3", "wav"],
      error: null,
    },
    matches: vi.fn().mockReturnValue(true),
  }

  return {
    useMachine: vi.fn(() => [mockState, mockSend]),
  }
})

// Мокаем musicMachine
vi.mock("./music-machine", () => ({
  musicMachine: {
    withConfig: () => ({
      context: {
        musicFiles: [],
        filteredFiles: [],
        searchQuery: "",
        sortBy: "date",
        sortOrder: "desc",
        filterType: "all",
        viewMode: "thumbnails",
        groupBy: "none",
        showFavoritesOnly: false,
        availableExtensions: ["mp3", "wav"],
        error: null,
      },
    }),
  },
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("useMusicMachine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  it("should return the correct state and methods", () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusicMachine())

    // Проверяем, что хук возвращает правильные значения
    expect(result.current).toHaveProperty("musicFiles")
    expect(result.current).toHaveProperty("filteredFiles")
    expect(result.current).toHaveProperty("searchQuery")
    expect(result.current).toHaveProperty("sortBy")
    expect(result.current).toHaveProperty("sortOrder")
    expect(result.current).toHaveProperty("filterType")
    expect(result.current).toHaveProperty("viewMode")
    expect(result.current).toHaveProperty("groupBy")
    expect(result.current).toHaveProperty("showFavoritesOnly")
    expect(result.current).toHaveProperty("availableExtensions")
    expect(result.current).toHaveProperty("error")

    // Проверяем, что хук возвращает правильные методы
    expect(result.current).toHaveProperty("search")
    expect(result.current).toHaveProperty("sort")
    expect(result.current).toHaveProperty("filter")
    expect(result.current).toHaveProperty("changeViewMode")
    expect(result.current).toHaveProperty("changeGroupBy")
    expect(result.current).toHaveProperty("changeOrder")
    expect(result.current).toHaveProperty("toggleFavorites")
    expect(result.current).toHaveProperty("isLoading")
    // isLoaded не возвращается из хука, вместо этого используется isLoading
    expect(result.current).toHaveProperty("isError")
  })

  it("should call send with correct parameters when search is called", async () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusicMachine())

    // Создаем мок-медиаконтекст
    const mockMediaContext = { isItemFavorite: vi.fn() }

    // Вызываем метод search
    act(() => {
      result.current.search("test query", mockMediaContext)
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "SEARCH",
      query: "test query",
      mediaContext: mockMediaContext,
    })
  })

  it("should call send with correct parameters when sort is called", async () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusicMachine())

    // Вызываем метод sort
    act(() => {
      result.current.sort("title")
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "SORT",
      sortBy: "title",
    })
  })

  it("should call send with correct parameters when filter is called", async () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusicMachine())

    // Создаем мок-медиаконтекст
    const mockMediaContext = { isItemFavorite: vi.fn() }

    // Вызываем метод filter
    act(() => {
      result.current.filter("mp3", mockMediaContext)
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "FILTER",
      filterType: "mp3",
      mediaContext: mockMediaContext,
    })
  })

  it("should call send with correct parameters when changeViewMode is called", async () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusicMachine())

    // Вызываем метод changeViewMode
    act(() => {
      result.current.changeViewMode("list")
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "CHANGE_VIEW_MODE",
      mode: "list",
    })
  })

  it("should call send with correct parameters when changeGroupBy is called", async () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusicMachine())

    // Вызываем метод changeGroupBy
    act(() => {
      result.current.changeGroupBy("artist")
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "CHANGE_GROUP_BY",
      groupBy: "artist",
    })
  })

  it("should call send with correct parameters when changeOrder is called", async () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusicMachine())

    // Вызываем метод changeOrder
    act(() => {
      result.current.changeOrder()
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "CHANGE_ORDER",
    })
  })

  it("should call send with correct parameters when toggleFavorites is called", async () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusicMachine())

    // Создаем мок-медиаконтекст
    const mockMediaContext = { isItemFavorite: vi.fn() }

    // Вызываем метод toggleFavorites
    act(() => {
      result.current.toggleFavorites(mockMediaContext)
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "TOGGLE_FAVORITES",
      mediaContext: mockMediaContext,
    })
  })
})
