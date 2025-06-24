import "./browser-adapter-mocks" // Импортируем моки первыми

import React from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useFiltersAdapter } from "../../adapters/use-filters-adapter"

// Мокаем только специфичные для фильтров зависимости
vi.mock("@/features/filters/hooks/use-filters", () => ({
  useFilters: vi.fn(() => ({
    filters: [
      {
        id: "brightness",
        name: "Яркость",
        description: { en: "Регулировка яркости изображения", ru: "Brightness adjustment" },
        category: "color-correction",
        complexity: "basic",
        labels: { ru: "Яркость", en: "Brightness" },
        tags: ["color", "brightness"],
        params: { brightness: 0.2 },
      },
      {
        id: "contrast",
        name: "Контрастность",
        description: { en: "Регулировка контрастности", ru: "Contrast adjustment" },
        category: "color-correction",
        complexity: "basic",
        labels: { ru: "Контрастность", en: "Contrast" },
        tags: ["color", "contrast"],
        params: { contrast: 1.5 },
      },
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
  })

  describe("useData", () => {
    it("should return filters data", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].name).toBe("Яркость")
      expect(dataResult.current.items[1].name).toBe("Контрастность")
    })
  })

  describe("getSortValue", () => {
    const testFilter = {
      id: "brightness",
      name: "Яркость",
      description: { en: "Регулировка яркости", ru: "Brightness adjustment" },
      category: "color-correction",
      complexity: "basic" as const,
      labels: { ru: "Яркость", en: "Brightness" },
      tags: ["color"],
      params: { brightness: 0.2 },
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testFilter, "name")).toBe("яркость")
      expect(result.current.getSortValue(testFilter, "category")).toBe("color-correction")
      expect(result.current.getSortValue(testFilter, "complexity")).toBe(0) // basic = 0
      expect(result.current.getSortValue(testFilter, "unknown")).toBe("яркость")
    })
  })

  describe("getSearchableText", () => {
    const testFilter = {
      id: "brightness",
      name: "Яркость",
      description: { en: "Регулировка яркости изображения", ru: "Brightness adjustment" },
      category: "color-correction",
      complexity: "basic" as const,
      labels: { ru: "Яркость", en: "Brightness" },
      tags: ["color", "brightness"],
      params: { brightness: 0.2 },
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testFilter)
      expect(searchableText).toContain("Яркость")
      expect(searchableText).toContain("Brightness")
      expect(searchableText).toContain("Регулировка яркости изображения")
      expect(searchableText).toContain("color-correction")
      expect(searchableText).toContain("color")
      expect(searchableText).toContain("brightness")
    })
  })

  describe("getGroupValue", () => {
    const testFilter = {
      id: "brightness",
      name: "Яркость",
      description: { en: "Регулировка яркости", ru: "Brightness adjustment" },
      category: "color-correction",
      complexity: "basic" as const,
      labels: { ru: "Яркость", en: "Brightness" },
      tags: ["color", "brightness"],
      params: { brightness: 0.2 },
    }

    it("should group by different fields", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testFilter, "category")).toBe("color-correction")
      expect(result.current.getGroupValue(testFilter, "complexity")).toBe("basic")
      expect(result.current.getGroupValue(testFilter, "tags")).toBe("color")
      expect(result.current.getGroupValue(testFilter, "unknown")).toBe("")
    })
  })

  describe("matchesFilter", () => {
    const colorFilter = {
      id: "brightness",
      name: "Яркость",
      description: { en: "Регулировка яркости", ru: "Brightness adjustment" },
      category: "color-correction",
      complexity: "basic" as const,
      labels: { ru: "Яркость", en: "Brightness" },
      tags: ["color"],
      params: { brightness: 0.2 },
    }

    const creativeFilter = {
      id: "gaussian",
      name: "Размытие",
      description: { en: "Гауссово размытие", ru: "Gaussian blur" },
      category: "creative",
      complexity: "intermediate" as const,
      labels: { ru: "Размытие", en: "Blur" },
      tags: ["blur"],
      params: { blur: 2 },
    }

    it("should match filter by complexity", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(colorFilter, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(colorFilter, "intermediate")).toBe(false)
      expect(result.current.matchesFilter?.(creativeFilter, "intermediate")).toBe(true)
    })

    it("should match filter by category", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(colorFilter, "color-correction")).toBe(true)
      expect(result.current.matchesFilter?.(creativeFilter, "color-correction")).toBe(false)
      expect(result.current.matchesFilter?.(creativeFilter, "creative")).toBe(true)
      expect(result.current.matchesFilter?.(colorFilter, "creative")).toBe(false)
    })

    it("should return true for 'all' filter", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(colorFilter, "all")).toBe(true)
      expect(result.current.matchesFilter?.(creativeFilter, "all")).toBe(true)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(colorFilter, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'filter'", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("filter")
    })
  })
})
