import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useTemplatesAdapter } from "../../adapters/use-templates-adapter"

// Мокаем зависимости
vi.mock("@/features/templates", () => ({
  useTemplates: vi.fn(() => ({
    isLoading: false,
    error: null,
    templates: [
      {
        id: "2x2-grid",
        name: { en: "2x2 Grid", ru: "Сетка 2x2" },
        description: { en: "Four video grid", ru: "Сетка из четырех видео" },
        category: "grid",
        cellCount: 4,
        aspectRatio: "16:9",
        thumbnail: "/templates/2x2.png",
      },
      {
        id: "split-screen",
        name: { en: "Split Screen", ru: "Разделенный экран" },
        description: { en: "Two video split", ru: "Разделение на два видео" },
        category: "split",
        cellCount: 2,
        aspectRatio: "16:9",
        thumbnail: "/templates/split.png",
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
    language: "ru",
  },
}))

describe("useTemplatesAdapter", () => {
  it("should return templates adapter with correct structure", () => {
    const { result } = renderHook(() => useTemplatesAdapter())

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "templates")
  })

  describe("useData", () => {
    it("should return templates data", () => {
      const { result } = renderHook(() => useTemplatesAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.isLoading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].id).toBe("2x2-grid")
      expect(dataResult.current.items[1].id).toBe("split-screen")
    })
  })

  describe("getSortValue", () => {
    const testTemplate = {
      id: "2x2-grid",
      name: { en: "2x2 Grid", ru: "Сетка 2x2" },
      description: { en: "Four video grid", ru: "Сетка из четырех видео" },
      category: "grid",
      cellCount: 4,
      aspectRatio: "16:9",
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useTemplatesAdapter())

      expect(result.current.getSortValue(testTemplate, "name")).toBe("Сетка 2x2")
      expect(result.current.getSortValue(testTemplate, "category")).toBe("grid")
      expect(result.current.getSortValue(testTemplate, "cellCount")).toBe(4)
      expect(result.current.getSortValue(testTemplate, "id")).toBe("2x2-grid")
      expect(result.current.getSortValue(testTemplate, "unknown")).toBe("Сетка 2x2")
    })
  })

  describe("getSearchableText", () => {
    const testTemplate = {
      id: "2x2-grid",
      name: { en: "2x2 Grid", ru: "Сетка 2x2" },
      description: { en: "Four video grid", ru: "Сетка из четырех видео" },
      category: "grid",
      cellCount: 4,
      aspectRatio: "16:9",
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useTemplatesAdapter())

      const searchableText = result.current.getSearchableText(testTemplate)
      expect(searchableText).toEqual(["Сетка 2x2", "Сетка из четырех видео", "grid"])
    })
  })

  describe("getGroupValue", () => {
    const testTemplate = {
      id: "2x2-grid",
      name: { en: "2x2 Grid", ru: "Сетка 2x2" },
      description: { en: "Four video grid", ru: "Сетка из четырех видео" },
      category: "grid",
      cellCount: 4,
      aspectRatio: "16:9",
    }

    it("should group by category", () => {
      const { result } = renderHook(() => useTemplatesAdapter())

      expect(result.current.getGroupValue(testTemplate, "category")).toBe("grid")
      expect(result.current.getGroupValue(testTemplate, "cellCount")).toBe("3-6 видео")
      expect(result.current.getGroupValue(testTemplate, "unknown")).toBe("Прочее")
    })

    it("should group by cell count ranges", () => {
      const { result } = renderHook(() => useTemplatesAdapter())

      const singleTemplate = { ...testTemplate, cellCount: 1 }
      const largeTemplate = { ...testTemplate, cellCount: 9 }

      expect(result.current.getGroupValue(singleTemplate, "cellCount")).toBe("1 видео")
      expect(result.current.getGroupValue(largeTemplate, "cellCount")).toBe("7+ видео")
    })
  })

  describe("matchesFilter", () => {
    const gridTemplate = {
      id: "2x2-grid",
      name: { ru: "Сетка 2x2" },
      category: "grid",
      cellCount: 4,
    }

    const splitTemplate = {
      id: "split-screen",
      name: { ru: "Разделенный экран" },
      category: "split",
      cellCount: 2,
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useTemplatesAdapter())

      expect(result.current.matchesFilter?.(gridTemplate, "grid")).toBe(true)
      expect(result.current.matchesFilter?.(splitTemplate, "grid")).toBe(false)
      expect(result.current.matchesFilter?.(splitTemplate, "split")).toBe(true)
      expect(result.current.matchesFilter?.(gridTemplate, "split")).toBe(false)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useTemplatesAdapter())

      expect(result.current.matchesFilter?.(gridTemplate, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useTemplatesAdapter())

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'templates'", () => {
      const { result } = renderHook(() => useTemplatesAdapter())

      expect(result.current.favoriteType).toBe("templates")
    })
  })
})
