import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useTransitionsAdapter } from "../../adapters/use-transitions-adapter"

// Мокаем зависимости
vi.mock("@/features/transitions", () => ({
  useTransitions: vi.fn(() => ({
    isLoading: false,
    error: null,
    transitions: [
      {
        id: "fade",
        name: "Затухание",
        description: "Плавное затухание между клипами",
        category: "fade",
        duration: 1000,
        icon: "🌅",
      },
      {
        id: "slide",
        name: "Слайд",
        description: "Переход со сдвигом",
        category: "movement",
        duration: 500,
        icon: "➡️",
      },
    ],
  })),
}))

vi.mock("@/features/app-state", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useFavorites: vi.fn(() => ({
      isItemFavorite: vi.fn(() => false),
    })),
  }
})

vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key) => key),
  },
}))

describe("useTransitionsAdapter", () => {
  it("should return transitions adapter with correct structure", () => {
    const { result } = renderHook(() => useTransitionsAdapter())

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "transitions")
  })

  describe("useData", () => {
    it("should return transitions data", () => {
      const { result } = renderHook(() => useTransitionsAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.isLoading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].name).toBe("Затухание")
      expect(dataResult.current.items[1].name).toBe("Слайд")
    })
  })

  describe("getSortValue", () => {
    const testTransition = {
      id: "fade",
      name: "Затухание",
      description: "Плавное затухание",
      category: "fade",
      duration: 1000,
      icon: "🌅",
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useTransitionsAdapter())

      expect(result.current.getSortValue(testTransition, "name")).toBe("Затухание")
      expect(result.current.getSortValue(testTransition, "category")).toBe("fade")
      expect(result.current.getSortValue(testTransition, "duration")).toBe(1000)
      expect(result.current.getSortValue(testTransition, "id")).toBe("fade")
      expect(result.current.getSortValue(testTransition, "unknown")).toBe("Затухание")
    })
  })

  describe("getSearchableText", () => {
    const testTransition = {
      id: "fade",
      name: "Затухание",
      description: "Плавное затухание между клипами",
      category: "fade",
      duration: 1000,
      icon: "🌅",
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useTransitionsAdapter())

      const searchableText = result.current.getSearchableText(testTransition)
      expect(searchableText).toEqual(["Затухание", "Плавное затухание между клипами", "fade"])
    })
  })

  describe("getGroupValue", () => {
    const testTransition = {
      id: "fade",
      name: "Затухание",
      description: "Плавное затухание",
      category: "fade",
      duration: 1000,
      icon: "🌅",
    }

    it("should group by category", () => {
      const { result } = renderHook(() => useTransitionsAdapter())

      expect(result.current.getGroupValue(testTransition, "category")).toBe("fade")
      expect(result.current.getGroupValue(testTransition, "duration")).toBe("Средние (0.5-2с)")
      expect(result.current.getGroupValue(testTransition, "unknown")).toBe("Прочее")
    })

    it("should group by duration ranges", () => {
      const { result } = renderHook(() => useTransitionsAdapter())

      const shortTransition = { ...testTransition, duration: 200 }
      const longTransition = { ...testTransition, duration: 3000 }

      expect(result.current.getGroupValue(shortTransition, "duration")).toBe("Быстрые (<0.5с)")
      expect(result.current.getGroupValue(longTransition, "duration")).toBe("Медленные (>2с)")
    })
  })

  describe("matchesFilter", () => {
    const fadeTransition = {
      id: "fade",
      name: "Затухание",
      description: "Плавное затухание",
      category: "fade",
      duration: 1000,
      icon: "🌅",
    }

    const slideTransition = {
      id: "slide",
      name: "Слайд",
      description: "Переход со сдвигом",
      category: "movement",
      duration: 500,
      icon: "➡️",
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useTransitionsAdapter())

      expect(result.current.matchesFilter?.(fadeTransition, "fade")).toBe(true)
      expect(result.current.matchesFilter?.(slideTransition, "fade")).toBe(false)
      expect(result.current.matchesFilter?.(slideTransition, "movement")).toBe(true)
      expect(result.current.matchesFilter?.(fadeTransition, "movement")).toBe(false)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useTransitionsAdapter())

      expect(result.current.matchesFilter?.(fadeTransition, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useTransitionsAdapter())

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'transitions'", () => {
      const { result } = renderHook(() => useTransitionsAdapter())

      expect(result.current.favoriteType).toBe("transitions")
    })
  })
})
