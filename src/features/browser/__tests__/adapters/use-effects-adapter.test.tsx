import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { VideoEffect } from "@/features/effects/types"

import { useEffectsAdapter } from "../../adapters/use-effects-adapter"

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

// Мокаем данные эффектов
const mockEffects = [
  {
    id: "blur",
    name: "Размытие",
    description: { ru: "Эффект размытия", en: "Blur effect" },
    category: "filter",
    type: "blur",
    complexity: "basic",
    tags: ["blur"],
    duration: { min: 0, max: 10, default: 1 },
    ffmpegCommand: () => "blur=5",
    previewPath: "/effects/blur.mp4",
    labels: { ru: "Размытие", en: "Blur" },
    params: {},
  },
  {
    id: "sepia",
    name: "Сепия",
    description: { ru: "Винтажный эффект", en: "Vintage effect" },
    category: "color-correction",
    type: "sepia",
    complexity: "intermediate",
    tags: ["vintage"],
    duration: { min: 0, max: 10, default: 1 },
    ffmpegCommand: () => "sepia",
    previewPath: "/effects/sepia.mp4",
    labels: { ru: "Сепия", en: "Sepia" },
    params: {},
  },
]

// Простой мок для useUnifiedEffectsAdapter
vi.mock("../../hooks/use-resources", () => ({
  useEffectsAdapter: (config: any) => {
    // Базовые данные, которые возвращает унифицированный адаптер
    const baseReturn = {
      items: mockEffects,
      loading: false,
      error: null,
      stats: {
        total: 2,
        byType: { effect: 2, filter: 0, transition: 0 },
        bySource: { "built-in": 2 },
        cacheSize: 1024,
        memoryUsage: 2048,
      },
    }

    // Добавляем методы адаптера
    const mockAdapter = {
      ...baseReturn,
      useData: () => ({
        items: mockEffects,
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
            case "type":
              return item.type.toLowerCase()
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
            item.type,
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
            case "type":
              return item.type || "unknown"
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
            [
              "color-correction",
              "artistic",
              "vintage",
              "cinematic",
              "creative",
              "technical",
              "distortion",
              "filter",
            ].includes(filterType)
          ) {
            return item.category === filterType
          }
          return true
        }),
      favoriteType: "effect",
    }
    return mockAdapter
  },
}))

describe("useEffectsAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return effects adapter with correct structure", () => {
    const { result } = renderHook(() => useEffectsAdapter())

    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "effect")
    expect(result.current).toHaveProperty("isFavorite")

    // Проверяем через useData()
    const { items } = result.current.useData()
    expect(items).toHaveLength(2)
    expect(items[0].id).toBe("blur")
  })

  describe("getSortValue", () => {
    const testEffect: VideoEffect = {
      id: "blur",
      name: "Размытие",
      description: { ru: "Эффект размытия", en: "Blur effect" },
      category: "filter",
      type: "blur",
      complexity: "basic",
      tags: ["blur"],
      duration: { min: 0, max: 10, default: 1 },
      ffmpegCommand: () => "blur=5",
      previewPath: "/effects/blur.mp4",
      labels: { ru: "Размытие", en: "Blur" },
      params: {},
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.getSortValue(testEffect, "name")).toBe("размытие")
      expect(result.current.getSortValue(testEffect, "category")).toBe("filter")
      expect(result.current.getSortValue(testEffect, "complexity")).toBe(0) // basic = 0
      expect(result.current.getSortValue(testEffect, "type")).toBe("blur")
      expect(result.current.getSortValue(testEffect, "unknown")).toBe("размытие")
    })
  })

  describe("getSearchableText", () => {
    const testEffect: VideoEffect = {
      id: "blur",
      name: "Размытие",
      description: { ru: "Эффект размытия изображения", en: "Image blur effect" },
      category: "filter",
      type: "blur",
      complexity: "basic",
      tags: ["blur", "filter"],
      labels: { ru: "Размытие", en: "Blur" },
      duration: { min: 0, max: 10, default: 1 },
      ffmpegCommand: () => "blur=5",
      previewPath: "/effects/blur.mp4",
      params: {},
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      const searchableText = result.current.getSearchableText(testEffect)
      expect(searchableText).toContain("Размытие")
      expect(searchableText).toContain("Blur")
      expect(searchableText).toContain("Эффект размытия изображения")
      expect(searchableText).toContain("Image blur effect")
      expect(searchableText).toContain("filter")
      expect(searchableText).toContain("blur")
    })
  })

  describe("getGroupValue", () => {
    const testEffect: VideoEffect = {
      id: "blur",
      name: "Размытие",
      description: { ru: "Эффект размытия", en: "Blur effect" },
      category: "filter",
      type: "blur",
      complexity: "basic",
      tags: ["blur", "filter"],
      duration: { min: 0, max: 10, default: 1 },
      ffmpegCommand: () => "blur=5",
      previewPath: "/effects/blur.mp4",
      labels: { ru: "Размытие", en: "Blur" },
      params: {},
    }

    it("should group by different fields", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.getGroupValue(testEffect, "category")).toBe("filter")
      expect(result.current.getGroupValue(testEffect, "complexity")).toBe("basic")
      expect(result.current.getGroupValue(testEffect, "type")).toBe("blur")
      expect(result.current.getGroupValue(testEffect, "tags")).toBe("blur")
      expect(result.current.getGroupValue(testEffect, "unknown")).toBe("")
    })
  })

  describe("matchesFilter", () => {
    const filterEffect: VideoEffect = {
      id: "blur",
      name: "Размытие",
      description: { ru: "Эффект размытия", en: "Blur effect" },
      category: "filter",
      type: "blur",
      complexity: "basic",
      tags: ["blur"],
      duration: { min: 0, max: 10, default: 1 },
      ffmpegCommand: () => "blur=5",
      previewPath: "/effects/blur.mp4",
      labels: { ru: "Размытие", en: "Blur" },
      params: {},
    }

    const colorEffect: VideoEffect = {
      id: "sepia",
      name: "Сепия",
      description: { ru: "Винтажный эффект", en: "Vintage effect" },
      category: "color-correction",
      type: "sepia",
      complexity: "intermediate",
      tags: ["vintage"],
      duration: { min: 0, max: 10, default: 1 },
      ffmpegCommand: () => "sepia",
      previewPath: "/effects/sepia.mp4",
      labels: { ru: "Сепия", en: "Sepia" },
      params: {},
    }

    it("should match filter by complexity", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.matchesFilter?.(filterEffect, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(filterEffect, "intermediate")).toBe(false)
      expect(result.current.matchesFilter?.(colorEffect, "intermediate")).toBe(true)
    })

    it("should match filter by category", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.matchesFilter?.(colorEffect, "color-correction")).toBe(true)
      expect(result.current.matchesFilter?.(filterEffect, "color-correction")).toBe(false)
    })

    it("should return true for 'all' filter", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.matchesFilter?.(filterEffect, "all")).toBe(true)
      expect(result.current.matchesFilter?.(colorEffect, "all")).toBe(true)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.matchesFilter?.(filterEffect, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'effect'", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      expect(result.current.favoriteType).toBe("effect")
    })
  })

  describe("isFavorite", () => {
    it("should check if effect is favorite", () => {
      const { result } = renderHook(() => useEffectsAdapter())

      const testEffect: VideoEffect = {
        id: "blur",
        name: "Размытие",
        description: { ru: "Эффект размытия", en: "Blur effect" },
        category: "filter",
        type: "blur",
        complexity: "basic",
        tags: ["blur"],
        duration: { min: 0, max: 10, default: 1 },
        ffmpegCommand: () => "blur=5",
        previewPath: "/effects/blur.mp4",
        labels: { ru: "Размытие", en: "Blur" },
        params: {},
      }

      expect(result.current.isFavorite).toBeDefined()
      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite(testEffect)).toBe(false)
    })
  })
})
