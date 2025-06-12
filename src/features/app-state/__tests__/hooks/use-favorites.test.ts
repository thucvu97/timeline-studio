import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useFavorites } from "../../hooks/use-favorites"

// Мокаем useAppSettings
const mockFavorites = {
  effects: [],
  filters: [],
  transitions: [],
  titles: [],
  colors: [],
  audio: [],
  emoji: [],
}

const mockAppSettings = {
  getFavorites: vi.fn(() => mockFavorites),
  updateFavorites: vi.fn(),
  addToFavorites: vi.fn(),
  removeFromFavorites: vi.fn(),
}

vi.mock("../../hooks/use-app-settings", () => ({
  useAppSettings: () => mockAppSettings,
}))

describe("useFavorites", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен возвращать объект избранных элементов", () => {
    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual(mockFavorites)
    expect(mockAppSettings.getFavorites).toHaveBeenCalled()
  })

  it("должен предоставлять метод обновления избранных", () => {
    const { result } = renderHook(() => useFavorites())

    const newFavorites = {
      ...mockFavorites,
      effects: [{ id: "effect1", name: "Blur" }],
    }

    act(() => {
      result.current.updateFavorites(newFavorites)
    })

    expect(mockAppSettings.updateFavorites).toHaveBeenCalledWith(newFavorites)
  })

  it("должен предоставлять метод добавления в избранное", () => {
    const { result } = renderHook(() => useFavorites())

    const newItem = { id: "filter1", name: "Sepia" }

    act(() => {
      result.current.addToFavorites(newItem, "filters")
    })

    expect(mockAppSettings.addToFavorites).toHaveBeenCalledWith(newItem, "filters")
  })

  it("должен предоставлять метод удаления из избранного", () => {
    const { result } = renderHook(() => useFavorites())

    act(() => {
      result.current.removeFromFavorites("effect1", "effects")
    })

    expect(mockAppSettings.removeFromFavorites).toHaveBeenCalledWith("effect1", "effects")
  })

  it("должен проверять, является ли элемент избранным", () => {
    const favoritesWithItems = {
      ...mockFavorites,
      effects: [
        { id: "effect1", name: "Blur" },
        { id: "effect2", name: "Sharpen" },
      ],
      filters: [{ id: "filter1", name: "Sepia" }],
    }

    mockAppSettings.getFavorites.mockReturnValue(favoritesWithItems)

    const { result } = renderHook(() => useFavorites())

    // Проверяем избранный элемент
    expect(result.current.isItemFavorite({ id: "effect1" }, "effects")).toBe(true)
    expect(result.current.isItemFavorite({ id: "filter1" }, "filters")).toBe(true)

    // Проверяем не избранный элемент
    expect(result.current.isItemFavorite({ id: "effect3" }, "effects")).toBe(false)
    expect(result.current.isItemFavorite({ id: "filter2" }, "filters")).toBe(false)
  })

  it("должен корректно работать с пустым типом избранного", () => {
    const { result } = renderHook(() => useFavorites())

    // Когда тип не существует в favorites, some вызывается на undefined и возвращает undefined
    expect(result.current.isItemFavorite({ id: "any" }, "nonExistentType")).toBe(undefined)
  })

  it("должен корректно работать с элементами без id", () => {
    const { result } = renderHook(() => useFavorites())

    expect(result.current.isItemFavorite({ name: "NoId" }, "effects")).toBe(false)
  })

  it("должен обновлять isItemFavorite при изменении избранных", () => {
    const favorites1 = {
      ...mockFavorites,
      effects: [{ id: "effect1", name: "Blur" }],
    }

    const favorites2 = {
      ...mockFavorites,
      effects: [
        { id: "effect1", name: "Blur" },
        { id: "effect2", name: "Sharpen" },
      ],
    }

    mockAppSettings.getFavorites.mockReturnValue(favorites1)

    const { result, rerender } = renderHook(() => useFavorites())

    expect(result.current.isItemFavorite({ id: "effect2" }, "effects")).toBe(false)

    // Меняем возвращаемое значение
    mockAppSettings.getFavorites.mockReturnValue(favorites2)

    // Перерендериваем хук
    rerender()

    expect(result.current.isItemFavorite({ id: "effect2" }, "effects")).toBe(true)
  })
})
