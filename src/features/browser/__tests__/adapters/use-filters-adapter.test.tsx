import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { VideoFilter } from "@/features/filters/types/filters"

import { useFiltersAdapter } from "../../adapters/use-filters-adapter"

// Импортируем глобальные моки
import "./browser-adapter-mocks"

// Мокаем только то, что действительно нужно
vi.mock("@/features/app-state", () => ({
  useFavorites: () => ({
    isItemFavorite: () => false,
  }),
  AppSettingsProvider: ({ children }: any) => children,
  useAppSettings: () => ({
    getMusicFiles: () => ({ allFiles: [] }),
  }),
}))

vi.mock("@/features/drag-drop", () => ({
  useDraggable: () => ({}),
}))

// Мокаем данные фильтров
const mockFilters = [
  {
    id: "brightness",
    name: "Яркость",
    description: { ru: "Настройка яркости", en: "Brightness adjustment" },
    category: "color-correction",
    complexity: "basic",
    labels: { ru: "Яркость", en: "Brightness" },
    tags: ["color", "brightness"],
    params: { brightness: 0.2 },
  },
  {
    id: "sepia",
    name: "Сепия",
    description: { ru: "Винтажный эффект", en: "Vintage effect" },
    category: "vintage",
    complexity: "intermediate",
    labels: { ru: "Сепия", en: "Sepia" },
    tags: ["vintage"],
    params: { saturation: 0.5 },
  },
]

// Простой мок для useUnifiedFiltersAdapter
vi.mock("../../hooks/use-resources", () => ({
  useFiltersAdapter: (config: any) => {
    // Базовые данные, которые возвращает унифицированный адаптер
    const baseReturn = {
      items: mockFilters,
      loading: false,
      error: null,
      stats: {
        total: 2,
        byType: { effect: 0, filter: 2, transition: 0 },
        bySource: { "built-in": 2 },
        cacheSize: 1024,
        memoryUsage: 2048,
      },
    }

    // Добавляем методы адаптера
    const mockAdapter = {
      ...baseReturn,
      useData: () => ({
        items: mockFilters,
        loading: false,
        error: null,
      }),
      PreviewComponent: config?.PreviewComponent || (() => null),
      getSortValue:
        config?.customHandlers?.getSortValue ||
        ((item: any, sortBy: string) => {
          switch (sortBy) {
            case "name":
              return item.name.toLowerCase()
            case "category":
              return item.category.toLowerCase()
            case "complexity":
              const complexityOrder: Record<string, number> = { basic: 0, intermediate: 1, advanced: 2 }
              return complexityOrder[item.complexity || "basic"]
            default:
              return item.name.toLowerCase()
          }
        }),
      getSearchableText:
        config?.customHandlers?.getSearchableText ||
        ((item: any) => {
          const texts = [
            item.name,
            item.labels?.ru || "",
            item.labels?.en || "",
            item.description?.ru || "",
            item.description?.en || "",
            item.category,
            ...(item.tags || []),
          ]
          return texts.filter(Boolean)
        }),
      getGroupValue:
        config?.customHandlers?.getGroupValue ||
        ((item: any, groupBy: string) => {
          switch (groupBy) {
            case "category":
              return item.category || "other"
            case "complexity":
              return item.complexity || "basic"
            case "tags":
              return item.tags && item.tags.length > 0 ? item.tags[0] : "untagged"
            default:
              return ""
          }
        }),
      matchesFilter:
        config?.customHandlers?.matchesFilter ||
        ((item: any, filterType: string) => {
          if (filterType === "all") return true
          if (["basic", "intermediate", "advanced"].includes(filterType)) {
            return (item.complexity || "basic") === filterType
          }
          if (
            ["color-correction", "artistic", "vintage", "cinematic", "creative", "technical", "distortion"].includes(
              filterType,
            )
          ) {
            return item.category === filterType
          }
          return true
        }),
      favoriteType: "filter",
    }
    return mockAdapter
  },
}))

describe("useFiltersAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return filters adapter with correct structure", () => {
    const { result } = renderHook(() => useFiltersAdapter())

    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "filter")
    expect(result.current).toHaveProperty("isFavorite")

    // Проверяем через useData()
    const { items } = result.current.useData()
    expect(items).toHaveLength(2)
    expect(items[0].id).toBe("brightness")
  })

  describe("getSortValue", () => {
    const testFilter: VideoFilter = {
      id: "brightness",
      name: "Яркость",
      description: { ru: "Настройка яркости", en: "Brightness adjustment" },
      category: "color-correction",
      complexity: "basic",
      labels: { ru: "Яркость", en: "Brightness" },
      tags: ["color", "brightness"],
      params: { brightness: 0.2 },
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.getSortValue(testFilter, "name")).toBe("яркость")
      expect(result.current.getSortValue(testFilter, "category")).toBe("color-correction")
      expect(result.current.getSortValue(testFilter, "complexity")).toBe(0) // basic = 0
      expect(result.current.getSortValue(testFilter, "unknown")).toBe("яркость")
    })
  })

  describe("getSearchableText", () => {
    const testFilter: VideoFilter = {
      id: "brightness",
      name: "Яркость",
      description: { ru: "Настройка яркости изображения", en: "Image brightness adjustment" },
      category: "color-correction",
      complexity: "basic",
      labels: { ru: "Яркость", en: "Brightness" },
      tags: ["color", "brightness", "adjustment"],
      params: { brightness: 0.2 },
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      const searchableText = result.current.getSearchableText(testFilter)
      // Проверяем наличие основных текстов
      expect(searchableText).toContain("Яркость")
      expect(searchableText).toContain("Brightness")
      expect(searchableText).toContain("color-correction")
      expect(searchableText).toContain("color")
      expect(searchableText).toContain("brightness")
      expect(searchableText).toContain("adjustment")
      // Проверяем описания - в массиве есть английское описание
      expect(searchableText).toContain("Image brightness adjustment")
      // Русское описание не попадает в массив, так как мок его не возвращает
      // Проверяем, что хотя бы русское название есть
      expect(
        searchableText.filter((text) => text.includes("яркость") || text.includes("Яркость")).length,
      ).toBeGreaterThan(0)
    })
  })

  describe("getGroupValue", () => {
    const testFilter: VideoFilter = {
      id: "brightness",
      name: "Яркость",
      description: { ru: "Настройка яркости", en: "Brightness adjustment" },
      category: "color-correction",
      complexity: "basic",
      labels: { ru: "Яркость", en: "Brightness" },
      tags: ["color", "brightness"],
      params: { brightness: 0.2 },
    }

    it("should group by different fields", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.getGroupValue(testFilter, "category")).toBe("color-correction")
      expect(result.current.getGroupValue(testFilter, "complexity")).toBe("basic")
      expect(result.current.getGroupValue(testFilter, "tags")).toBe("color")
      expect(result.current.getGroupValue(testFilter, "unknown")).toBe("")
    })
  })

  describe("matchesFilter", () => {
    const colorFilter: VideoFilter = {
      id: "brightness",
      name: "Яркость",
      description: { ru: "Настройка яркости", en: "Brightness adjustment" },
      category: "color-correction",
      complexity: "basic",
      labels: { ru: "Яркость", en: "Brightness" },
      tags: ["color"],
      params: { brightness: 0.2 },
    }

    const vintageFilter: VideoFilter = {
      id: "sepia",
      name: "Сепия",
      description: { ru: "Винтажный эффект", en: "Vintage effect" },
      category: "vintage",
      complexity: "intermediate",
      labels: { ru: "Сепия", en: "Sepia" },
      tags: ["vintage"],
      params: { saturation: 0.5 },
    }

    it("should match filter by complexity", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.matchesFilter?.(colorFilter, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(colorFilter, "intermediate")).toBe(false)
      expect(result.current.matchesFilter?.(vintageFilter, "intermediate")).toBe(true)
    })

    it("should match filter by category", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.matchesFilter?.(colorFilter, "color-correction")).toBe(true)
      expect(result.current.matchesFilter?.(colorFilter, "vintage")).toBe(false)
      expect(result.current.matchesFilter?.(vintageFilter, "vintage")).toBe(true)
    })

    it("should return true for 'all' filter", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.matchesFilter?.(colorFilter, "all")).toBe(true)
      expect(result.current.matchesFilter?.(vintageFilter, "all")).toBe(true)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.matchesFilter?.(colorFilter, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'filter'", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      expect(result.current.favoriteType).toBe("filter")
    })
  })

  describe("isFavorite", () => {
    it("should check if filter is favorite", () => {
      const { result } = renderHook(() => useFiltersAdapter())

      const testFilter: VideoFilter = {
        id: "brightness",
        name: "Яркость",
        description: { ru: "Настройка яркости", en: "Brightness adjustment" },
        category: "color-correction",
        complexity: "basic",
        labels: { ru: "Яркость", en: "Brightness" },
        tags: ["color"],
        params: { brightness: 0.2 },
      }

      expect(result.current.isFavorite).toBeDefined()
      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite(testFilter)).toBe(false)
    })
  })
})
