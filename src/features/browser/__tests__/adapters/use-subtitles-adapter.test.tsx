import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useSubtitlesAdapter } from "../../adapters/use-subtitles-adapter"

// Мокаем зависимости
vi.mock("@/features/subtitles", () => ({
  useSubtitleStyles: vi.fn(() => ({
    isLoading: false,
    error: null,
    subtitleStyles: [
      {
        id: "basic",
        name: "Основной",
        description: "Стандартный стиль субтитров",
        category: "basic",
        cssStyles: {
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: "bold",
        },
      },
      {
        id: "cinematic",
        name: "Кинематографический",
        description: "Стиль для фильмов",
        category: "cinematic",
        cssStyles: {
          color: "#ffff00",
          fontSize: "18px",
          fontWeight: "normal",
        },
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

describe("useSubtitlesAdapter", () => {
  it("should return subtitles adapter with correct structure", () => {
    const { result } = renderHook(() => useSubtitlesAdapter())

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "subtitles")
  })

  describe("useData", () => {
    it("should return subtitle styles data", () => {
      const { result } = renderHook(() => useSubtitlesAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.isLoading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].name).toBe("Основной")
      expect(dataResult.current.items[1].name).toBe("Кинематографический")
    })
  })

  describe("getSortValue", () => {
    const testStyle = {
      id: "basic",
      name: "Основной",
      description: "Стандартный стиль",
      category: "basic",
      cssStyles: {
        color: "#ffffff",
        fontSize: "16px",
      },
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useSubtitlesAdapter())

      expect(result.current.getSortValue(testStyle, "name")).toBe("Основной")
      expect(result.current.getSortValue(testStyle, "category")).toBe("basic")
      expect(result.current.getSortValue(testStyle, "id")).toBe("basic")
      expect(result.current.getSortValue(testStyle, "unknown")).toBe("Основной")
    })
  })

  describe("getSearchableText", () => {
    const testStyle = {
      id: "basic",
      name: "Основной",
      description: "Стандартный стиль субтитров",
      category: "basic",
      cssStyles: {
        color: "#ffffff",
      },
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useSubtitlesAdapter())

      const searchableText = result.current.getSearchableText(testStyle)
      expect(searchableText).toEqual(["Основной", "Стандартный стиль субтитров", "basic"])
    })
  })

  describe("getGroupValue", () => {
    const testStyle = {
      id: "basic",
      name: "Основной",
      description: "Стандартный стиль",
      category: "basic",
      cssStyles: {
        color: "#ffffff",
      },
    }

    it("should group by category", () => {
      const { result } = renderHook(() => useSubtitlesAdapter())

      expect(result.current.getGroupValue(testStyle, "category")).toBe("basic")
      expect(result.current.getGroupValue(testStyle, "unknown")).toBe("Прочее")
    })
  })

  describe("matchesFilter", () => {
    const basicStyle = {
      id: "basic",
      name: "Основной",
      description: "Стандартный стиль",
      category: "basic",
      cssStyles: { color: "#ffffff" },
    }

    const cinematicStyle = {
      id: "cinematic",
      name: "Кинематографический",
      description: "Стиль для фильмов",
      category: "cinematic",
      cssStyles: { color: "#ffff00" },
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useSubtitlesAdapter())

      expect(result.current.matchesFilter?.(basicStyle, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(cinematicStyle, "basic")).toBe(false)
      expect(result.current.matchesFilter?.(cinematicStyle, "cinematic")).toBe(true)
      expect(result.current.matchesFilter?.(basicStyle, "cinematic")).toBe(false)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useSubtitlesAdapter())

      expect(result.current.matchesFilter?.(basicStyle, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useSubtitlesAdapter())

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'subtitles'", () => {
      const { result } = renderHook(() => useSubtitlesAdapter())

      expect(result.current.favoriteType).toBe("subtitles")
    })
  })
})
