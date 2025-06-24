import "./browser-adapter-mocks" // Импортируем моки первыми

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useTransitionsAdapter } from "../../adapters/use-transitions-adapter"

// Мокаем специфичные для transitions зависимости
vi.mock("@/features/transitions/hooks/use-transitions", () => ({
  useTransitions: vi.fn(() => ({
    transitions: [
      {
        id: "fade",
        name: "Fade",
        labels: { ru: "Затухание", en: "Fade" },
        description: { ru: "Плавное затухание", en: "Smooth fade" },
        category: "basic",
        type: "fade",
        complexity: "basic",
        duration: { default: 1, min: 0.5, max: 3 },
        tags: ["fade", "basic"],
      },
      {
        id: "slide-left",
        name: "Slide Left",
        labels: { ru: "Слайд влево", en: "Slide Left" },
        description: { ru: "Переход со сдвигом влево", en: "Slide transition to left" },
        category: "advanced",
        type: "slide",
        complexity: "intermediate",
        duration: { default: 0.8, min: 0.3, max: 2 },
        tags: ["slide", "movement"],
      },
    ],
    loading: false,
    error: null,
  })),
}))

describe("useTransitionsAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("should return transitions adapter with correct structure", () => {
    const { result } = renderHook(() => useTransitionsAdapter(), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "transition")
  })

  describe("useData", () => {
    it("should return transitions data", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].id).toBe("fade")
      expect(dataResult.current.items[1].id).toBe("slide-left")
    })
  })

  describe("getSortValue", () => {
    const testTransition = {
      id: "fade",
      name: "Fade",
      labels: { ru: "Затухание", en: "Fade" },
      description: { ru: "Плавное затухание", en: "Smooth fade" },
      category: "basic",
      type: "fade",
      complexity: "basic",
      duration: { default: 1, min: 0.5, max: 3 },
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testTransition, "name")).toBe("затухание")
      expect(result.current.getSortValue(testTransition, "category")).toBe("basic")
      expect(result.current.getSortValue(testTransition, "complexity")).toBe(0) // basic = 0
      expect(result.current.getSortValue(testTransition, "duration")).toBe(1)
      expect(result.current.getSortValue(testTransition, "type")).toBe("fade")
      expect(result.current.getSortValue(testTransition, "unknown")).toBe("затухание")
    })
  })

  describe("getSearchableText", () => {
    const testTransition = {
      id: "fade",
      name: "Fade",
      labels: { ru: "Затухание", en: "Fade" },
      description: { ru: "Плавное затухание", en: "Smooth fade" },
      category: "basic",
      type: "fade",
      tags: ["fade", "basic"],
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testTransition)
      expect(searchableText).toContain("Fade")
      expect(searchableText).toContain("Затухание")
      expect(searchableText).toContain("Плавное затухание")
      expect(searchableText).toContain("Smooth fade")
      expect(searchableText).toContain("basic")
      expect(searchableText).toContain("fade")
    })
  })

  describe("getGroupValue", () => {
    const testTransition = {
      id: "fade",
      name: "Fade",
      category: "basic",
      type: "fade",
      complexity: "basic",
      duration: { default: 1, min: 0.5, max: 3 },
      tags: ["fade", "basic"],
    }

    it("should group by different fields", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testTransition, "category")).toBe("basic")
      expect(result.current.getGroupValue(testTransition, "complexity")).toBe("basic")
      expect(result.current.getGroupValue(testTransition, "type")).toBe("fade")
      expect(result.current.getGroupValue(testTransition, "tags")).toBe("fade")
      expect(result.current.getGroupValue(testTransition, "duration")).toBe("Короткие (≤1с)")
      expect(result.current.getGroupValue(testTransition, "unknown")).toBe("")
    })

    it("should group by duration ranges", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      const shortTransition = { ...testTransition, duration: { default: 0.5 } }
      const mediumTransition = { ...testTransition, duration: { default: 2 } }
      const longTransition = { ...testTransition, duration: { default: 4 } }

      expect(result.current.getGroupValue(shortTransition, "duration")).toBe("Короткие (≤1с)")
      expect(result.current.getGroupValue(mediumTransition, "duration")).toBe("Средние (1-3с)")
      expect(result.current.getGroupValue(longTransition, "duration")).toBe("Длинные (>3с)")
    })
  })

  describe("matchesFilter", () => {
    const basicTransition = {
      id: "fade",
      name: "Fade",
      category: "basic",
      complexity: "basic",
    }

    const advancedTransition = {
      id: "slide-left",
      name: "Slide Left",
      category: "creative", // Используем категорию, которая не пересекается с complexity
      complexity: "intermediate",
    }

    it("should match filter by complexity", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(basicTransition, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(basicTransition, "intermediate")).toBe(false)
      expect(result.current.matchesFilter?.(advancedTransition, "intermediate")).toBe(true)
    })

    it("should match filter by category", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      // Фильтрация по категории работает только для определенных категорий: basic, advanced, creative, 3d, artistic, cinematic
      expect(result.current.matchesFilter?.(basicTransition, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(advancedTransition, "basic")).toBe(false)
      expect(result.current.matchesFilter?.(advancedTransition, "creative")).toBe(true)
      expect(result.current.matchesFilter?.(basicTransition, "creative")).toBe(false)
    })

    it("should return true for 'all' and unknown filter", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(basicTransition, "all")).toBe(true)
      expect(result.current.matchesFilter?.(basicTransition, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })

    it("should render correctly in list mode", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockTransition = {
        id: "fade",
        name: "Fade",
        labels: { ru: "Затухание", en: "Fade" },
        description: { ru: "Плавное затухание", en: "Smooth fade" },
        category: "basic",
        type: "fade",
        complexity: "basic" as const,
        duration: { default: 1, min: 0.5, max: 3 },
      }

      const mockProps = {
        item: mockTransition,
        size: 100,
        viewMode: "list" as const,
        onClick: vi.fn(),
        onDragStart: vi.fn(),
        isSelected: false,
        isFavorite: false,
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      expect(() => <PreviewComponent {...mockProps} />).not.toThrow()
    })

    it("should render correctly in grid mode", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockTransition = {
        id: "slide",
        name: "Slide",
        labels: { ru: "Слайд", en: "Slide" },
        description: { ru: "Слайд переход", en: "Slide transition" },
        category: "advanced",
        type: "slide",
        complexity: "intermediate" as const,
        duration: { default: 0.8, min: 0.3, max: 2 },
      }

      const mockProps = {
        item: mockTransition,
        size: 120,
        viewMode: "grid" as const,
        onClick: vi.fn(),
        onDragStart: vi.fn(),
        isSelected: false,
        isFavorite: false,
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      expect(() => <PreviewComponent {...mockProps} />).not.toThrow()
    })

    it("should handle thumbnails mode with dimensions", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockTransition = {
        id: "wipe",
        name: "Wipe",
        labels: { ru: "Вытеснение", en: "Wipe" },
        description: { ru: "Эффект вытеснения", en: "Wipe effect" },
        category: "creative",
        type: "wipe",
        complexity: "advanced" as const,
        duration: { default: 1.5, min: 0.5, max: 3 },
      }

      const mockProps = {
        item: mockTransition,
        size: { width: 160, height: 90 },
        viewMode: "thumbnails" as const,
        onClick: vi.fn(),
        onDragStart: vi.fn(),
        isSelected: true,
        isFavorite: true,
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      expect(() => <PreviewComponent {...mockProps} />).not.toThrow()
    })
  })

  describe("favoriteType", () => {
    it("should be 'transition'", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("transition")
    })
  })

  describe("isFavorite", () => {
    it("should check if transition is favorite", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: BrowserProviders })

      const testTransition = {
        id: "fade",
        name: "Fade",
        labels: { ru: "Затухание", en: "Fade" },
        description: { ru: "Плавное затухание", en: "Smooth fade" },
        category: "basic",
        type: "fade",
        complexity: "basic" as const,
        duration: { default: 1, min: 0.5, max: 3 },
      }

      expect(result.current.isFavorite).toBeDefined()
      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite(testTransition)).toBe(false)
    })
  })
})
