import "./browser-adapter-mocks" // Импортируем моки первыми

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useFiltersAdapter } from "../../adapters/use-filters-adapter"
import type { VideoFilter, FilterCategory } from "@/features/filters/types/filters"

// Мокаем только специфичные для filters зависимости
vi.mock("@/features/filters/hooks/use-filters", () => ({
  useFilters: vi.fn(() => ({
    filters: [
      {
        id: "brightness",
        name: "Яркость",
        description: { en: "Brightness adjustment", ru: "Настройка яркости" },
        category: "color-correction" as FilterCategory,
        complexity: "basic",
        labels: { ru: "Яркость", en: "Brightness" },
        tags: ["color", "brightness"],
        params: { brightness: 0.2 },
      },
      {
        id: "contrast",
        name: "Контрастность",
        description: { en: "Contrast adjustment", ru: "Настройка контрастности" },
        category: "creative" as FilterCategory,
        complexity: "intermediate",
        labels: { ru: "Контрастность", en: "Contrast" },
        tags: ["color", "contrast"],
        params: { contrast: 1.5 },
      },
      {
        id: "sepia",
        name: "Сепия",
        description: { en: "Sepia tone effect", ru: "Эффект сепии" },
        category: "vintage" as FilterCategory,
        complexity: "advanced",
        labels: { ru: "Сепия", en: "Sepia" },
        tags: ["vintage", "retro"],
        params: { saturation: 0.5, hue: 30, temperature: 20, tint: -10 },
      },
      {
        id: "cinematic",
        name: "Кинематографический",
        description: { en: "Cinematic look", ru: "Кинематографический вид" },
        category: "cinematic" as FilterCategory,
        complexity: "intermediate",
        labels: { ru: "Кинематографический", en: "Cinematic" },
        tags: ["cinema", "film"],
        params: { contrast: 1.2, temperature: -15 },
      },
      {
        id: "no-labels",
        name: "Без меток",
        category: "technical" as FilterCategory,
        complexity: "basic",
        params: { temperature: -30 },
      },
      {
        id: "artistic",
        name: "Артистический",
        description: { en: "Artistic filter", ru: "Артистический фильтр" },
        category: "artistic" as FilterCategory,
        tags: [],
        params: {},
      }
    ],
    loading: false,
    error: null,
  })),
}))

describe("useFiltersAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return filters adapter with correct structure", () => {
    const { result } = renderHook(() => useFiltersAdapter(), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "filter")
    expect(result.current).toHaveProperty("matchesFilter")
    expect(result.current).toHaveProperty("isFavorite")
    expect(result.current.importHandlers).toBeUndefined()
  })

  describe("useData", () => {
    it("should return filters data", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(6)
      expect(dataResult.current.items[0].name).toBe("Яркость")
    })
  })

  describe("getSortValue", () => {
    const testFilter = {
      id: "test",
      name: "Тест Фильтр",
      description: { en: "Test filter" },
      category: "color-correction" as FilterCategory,
      complexity: "intermediate" as const,
      params: {},
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testFilter, "name")).toBe("тест фильтр")
      expect(result.current.getSortValue(testFilter, "category")).toBe("color-correction")
      expect(result.current.getSortValue(testFilter, "complexity")).toBe(1) // intermediate = 1
      expect(result.current.getSortValue(testFilter, "unknown")).toBe("тест фильтр")
    })

    it("should handle missing complexity", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const filterWithoutComplexity = { ...testFilter, complexity: undefined }

      expect(result.current.getSortValue(filterWithoutComplexity, "complexity")).toBe(0) // defaults to basic = 0
    })
  })

  describe("getSearchableText", () => {
    const testFilter = {
      id: "test",
      name: "Тест",
      description: { en: "Test description", ru: "Тестовое описание" },
      category: "color-correction" as FilterCategory,
      labels: { ru: "Тестовый", en: "Test" },
      tags: ["test", "sample"],
      params: {},
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testFilter)
      expect(searchableText).toContain("Тест")
      expect(searchableText).toContain("Тестовый")
      expect(searchableText).toContain("Test")
      expect(searchableText).toContain("Test description")
      expect(searchableText).toContain("color-correction")
      expect(searchableText).toContain("test")
      expect(searchableText).toContain("sample")
    })

    it("should handle missing fields", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const minimalFilter = {
        id: "minimal",
        name: "Минимальный",
        category: "basic" as FilterCategory,
        params: {},
      }

      const searchableText = result.current.getSearchableText(minimalFilter)
      expect(searchableText).toContain("Минимальный")
      expect(searchableText).toContain("basic")
      expect(searchableText.every(text => text !== undefined && text !== "")).toBe(true)
    })
  })

  describe("getGroupValue", () => {
    const testFilter = {
      id: "test",
      name: "Test",
      category: "creative" as FilterCategory,
      complexity: "advanced" as const,
      tags: ["effect", "custom"],
      params: {},
    }

    it("should group by different fields", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testFilter, "category")).toBe("creative")
      expect(result.current.getGroupValue(testFilter, "complexity")).toBe("advanced")
      expect(result.current.getGroupValue(testFilter, "tags")).toBe("effect")
      expect(result.current.getGroupValue(testFilter, "unknown")).toBe("")
    })

    it("should handle missing values", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const minimalFilter = {
        id: "minimal",
        name: "Minimal",
        params: {},
      }

      expect(result.current.getGroupValue(minimalFilter, "category")).toBe("other")
      expect(result.current.getGroupValue(minimalFilter, "complexity")).toBe("basic")
      expect(result.current.getGroupValue(minimalFilter, "tags")).toBe("untagged")
    })

    it("should handle empty tags array", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const filterWithEmptyTags = { ...testFilter, tags: [] }

      expect(result.current.getGroupValue(filterWithEmptyTags, "tags")).toBe("untagged")
    })
  })

  describe("matchesFilter", () => {
    const filters = [
      { id: "1", name: "F1", category: "color-correction", complexity: "basic", params: {} },
      { id: "2", name: "F2", category: "creative", complexity: "intermediate", params: {} },
      { id: "3", name: "F3", category: "cinematic", complexity: "advanced", params: {} },
      { id: "4", name: "F4", category: "vintage", complexity: "basic", params: {} },
      { id: "5", name: "F5", category: "technical", params: {} },
      { id: "6", name: "F6", category: "artistic", complexity: "intermediate", params: {} },
    ] as VideoFilter[]

    it("should match filter by complexity", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(filters[0], "basic")).toBe(true)
      expect(result.current.matchesFilter?.(filters[0], "intermediate")).toBe(false)
      expect(result.current.matchesFilter?.(filters[1], "intermediate")).toBe(true)
      expect(result.current.matchesFilter?.(filters[2], "advanced")).toBe(true)
    })

    it("should match filter by category", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(filters[0], "color-correction")).toBe(true)
      expect(result.current.matchesFilter?.(filters[1], "creative")).toBe(true)
      expect(result.current.matchesFilter?.(filters[2], "cinematic")).toBe(true)
      expect(result.current.matchesFilter?.(filters[3], "vintage")).toBe(true)
      expect(result.current.matchesFilter?.(filters[4], "technical")).toBe(true)
      expect(result.current.matchesFilter?.(filters[5], "artistic")).toBe(true)
    })

    it("should return true for 'all' filter", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      filters.forEach(filter => {
        expect(result.current.matchesFilter?.(filter, "all")).toBe(true)
      })
    })

    it("should return true for unknown filter type", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(filters[0], "unknown")).toBe(true)
    })

    it("should handle missing complexity", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const filterWithoutComplexity = filters[4] // technical filter has no complexity

      expect(result.current.matchesFilter?.(filterWithoutComplexity, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(filterWithoutComplexity, "intermediate")).toBe(false)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("isFavorite", () => {
    it("should check if filter is favorite", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const filter = { id: "test", name: "Test", category: "basic" as FilterCategory, params: {} }

      // По умолчанию из моков всегда возвращает false
      expect(result.current.isFavorite?.(filter)).toBe(false)
    })
  })

  describe("favoriteType", () => {
    it("should be 'filter'", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("filter")
    })
  })
})