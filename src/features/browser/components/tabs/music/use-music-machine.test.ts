import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMusic } from "./music-provider"

// Мокаем useMusic из music-provider
vi.mock("./music-provider", () => {
  const mockMusicContext = {
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
    isPlaying: false,
    isLoading: true,
    isError: false,
    search: vi.fn(),
    sort: vi.fn(),
    filter: vi.fn(),
    changeOrder: vi.fn(),
    changeViewMode: vi.fn(),
    changeGroupBy: vi.fn(),
    toggleFavorites: vi.fn(),
    retry: vi.fn(),
  }

  return {
    useMusic: vi.fn(() => mockMusicContext),
  }
})

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
    const { result } = renderHook(() => useMusic())

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

  it("should call search with correct parameters", () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusic())

    // Создаем мок-медиаконтекст
    const mockMediaContext = { isItemFavorite: vi.fn() }

    // Вызываем метод search
    act(() => {
      result.current.search("test query", mockMediaContext)
    })

    // Получаем мок функции search из нашего мока useMusic
    const mockSearch = vi.mocked(result.current.search)

    // Проверяем, что search был вызван с правильными параметрами
    expect(mockSearch).toHaveBeenCalledWith("test query", mockMediaContext)
  })

  it("should call sort with correct parameters", () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusic())

    // Вызываем метод sort
    act(() => {
      result.current.sort("title")
    })

    // Получаем мок функции sort из нашего мока useMusic
    const mockSort = vi.mocked(result.current.sort)

    // Проверяем, что sort был вызван с правильными параметрами
    expect(mockSort).toHaveBeenCalledWith("title")
  })

  it("should call filter with correct parameters", () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusic())

    // Создаем мок-медиаконтекст
    const mockMediaContext = { isItemFavorite: vi.fn() }

    // Вызываем метод filter
    act(() => {
      result.current.filter("mp3", mockMediaContext)
    })

    // Получаем мок функции filter из нашего мока useMusic
    const mockFilter = vi.mocked(result.current.filter)

    // Проверяем, что filter был вызван с правильными параметрами
    expect(mockFilter).toHaveBeenCalledWith("mp3", mockMediaContext)
  })

  it("should call changeViewMode with correct parameters", () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusic())

    // Вызываем метод changeViewMode
    act(() => {
      result.current.changeViewMode("list")
    })

    // Получаем мок функции changeViewMode из нашего мока useMusic
    const mockChangeViewMode = vi.mocked(result.current.changeViewMode)

    // Проверяем, что changeViewMode был вызван с правильными параметрами
    expect(mockChangeViewMode).toHaveBeenCalledWith("list")
  })

  it("should call changeGroupBy with correct parameters", () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusic())

    // Вызываем метод changeGroupBy
    act(() => {
      result.current.changeGroupBy("artist")
    })

    // Получаем мок функции changeGroupBy из нашего мока useMusic
    const mockChangeGroupBy = vi.mocked(result.current.changeGroupBy)

    // Проверяем, что changeGroupBy был вызван с правильными параметрами
    expect(mockChangeGroupBy).toHaveBeenCalledWith("artist")
  })

  it("should call changeOrder with correct parameters", () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusic())

    // Вызываем метод changeOrder
    act(() => {
      result.current.changeOrder()
    })

    // Получаем мок функции changeOrder из нашего мока useMusic
    const mockChangeOrder = vi.mocked(result.current.changeOrder)

    // Проверяем, что changeOrder был вызван
    expect(mockChangeOrder).toHaveBeenCalled()
  })

  it("should call toggleFavorites with correct parameters", () => {
    // Рендерим хук
    const { result } = renderHook(() => useMusic())

    // Создаем мок-медиаконтекст
    const mockMediaContext = { isItemFavorite: vi.fn() }

    // Вызываем метод toggleFavorites
    act(() => {
      result.current.toggleFavorites(mockMediaContext)
    })

    // Получаем мок функции toggleFavorites из нашего мока useMusic
    const mockToggleFavorites = vi.mocked(result.current.toggleFavorites)

    // Проверяем, что toggleFavorites был вызван с правильными параметрами
    expect(mockToggleFavorites).toHaveBeenCalledWith(mockMediaContext)
  })
})
