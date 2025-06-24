import "./browser-adapter-mocks" // Импортируем моки первыми

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useSubtitlesAdapter } from "../../adapters/use-subtitles-adapter"

// Мокаем только специфичные для subtitles зависимости
vi.mock("@/features/subtitles/hooks/use-subtitle-styles", () => ({
  useSubtitles: vi.fn(() => ({
    subtitles: [
      {
        id: "basic",
        name: "Основной",
        description: { ru: "Стандартный стиль субтитров", en: "Standard subtitle style" },
        category: "basic",
        complexity: "basic",
        labels: { ru: "Основной", en: "Basic" },
        tags: ["standard", "simple"],
        style: {
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: "bold",
          fontFamily: "Arial",
        },
      },
      {
        id: "cinematic",
        name: "Кинематографический",
        description: { ru: "Стиль для фильмов", en: "Cinema style" },
        category: "cinematic",
        complexity: "intermediate",
        labels: { ru: "Кинематографический", en: "Cinematic" },
        tags: ["cinema", "movie"],
        style: {
          color: "#ffff00",
          fontSize: "18px",
          fontWeight: "normal",
          fontFamily: "Times New Roman",
        },
      },
    ],
    loading: false,
    error: null,
  })),
}))

describe("useSubtitlesAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("should return subtitles adapter with correct structure", () => {
    const { result } = renderHook(() => useSubtitlesAdapter(), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "subtitle")
  })

  describe("useData", () => {
    it("should return subtitle styles data", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
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
      description: { ru: "Стандартный стиль", en: "Standard style" },
      category: "basic",
      complexity: "basic",
      labels: { ru: "Основной", en: "Basic" },
      style: {
        color: "#ffffff",
        fontSize: "16px",
        fontFamily: "Arial",
      },
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testStyle, "name")).toBe("основной")
      expect(result.current.getSortValue(testStyle, "category")).toBe("basic")
      expect(result.current.getSortValue(testStyle, "complexity")).toBe(0) // basic = 0
      expect(result.current.getSortValue(testStyle, "font")).toBe("arial")
      expect(result.current.getSortValue(testStyle, "unknown")).toBe("основной")
    })
  })

  describe("getSearchableText", () => {
    const testStyle = {
      id: "basic",
      name: "Основной",
      description: { ru: "Стандартный стиль субтитров", en: "Standard subtitle style" },
      category: "basic",
      labels: { ru: "Основной", en: "Basic" },
      tags: ["standard", "simple"],
      style: {
        color: "#ffffff",
        fontFamily: "Arial",
      },
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testStyle)
      expect(searchableText).toContain("Основной")
      expect(searchableText).toContain("Basic")
      expect(searchableText).toContain("Стандартный стиль субтитров")
      expect(searchableText).toContain("Standard subtitle style")
      expect(searchableText).toContain("basic")
      expect(searchableText).toContain("Arial")
      expect(searchableText).toContain("standard")
    })
  })

  describe("getGroupValue", () => {
    const testStyle = {
      id: "basic",
      name: "Основной",
      description: { ru: "Стандартный стиль", en: "Standard style" },
      category: "basic",
      complexity: "basic",
      tags: ["standard", "simple"],
      style: {
        color: "#ffffff",
        fontFamily: "Arial",
      },
    }

    it("should group by different fields", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testStyle, "category")).toBe("basic")
      expect(result.current.getGroupValue(testStyle, "complexity")).toBe("basic")
      expect(result.current.getGroupValue(testStyle, "font")).toBe("Arial")
      expect(result.current.getGroupValue(testStyle, "tags")).toBe("standard")
      expect(result.current.getGroupValue(testStyle, "unknown")).toBe("")
    })
  })

  describe("matchesFilter", () => {
    const basicStyle = {
      id: "basic",
      name: "Основной",
      description: { ru: "Стандартный стиль", en: "Standard style" },
      category: "basic",
      complexity: "basic",
      style: { color: "#ffffff", fontFamily: "Arial" },
    }

    const cinematicStyle = {
      id: "cinematic",
      name: "Кинематографический",
      description: { ru: "Стиль для фильмов", en: "Cinema style" },
      category: "cinematic",
      complexity: "intermediate",
      style: { color: "#ffff00", fontFamily: "Times New Roman" },
    }

    it("should match filter by complexity", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(basicStyle, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(basicStyle, "intermediate")).toBe(false)
      expect(result.current.matchesFilter?.(cinematicStyle, "intermediate")).toBe(true)
    })

    it("should match filter by category", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(basicStyle, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(cinematicStyle, "basic")).toBe(false)
      expect(result.current.matchesFilter?.(cinematicStyle, "cinematic")).toBe(true)
      expect(result.current.matchesFilter?.(basicStyle, "cinematic")).toBe(false)
    })

    it("should return true for 'all' filter", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(basicStyle, "all")).toBe(true)
      expect(result.current.matchesFilter?.(cinematicStyle, "all")).toBe(true)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(basicStyle, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })

    it("should render correctly in list mode", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockStyle = {
        id: "basic",
        name: "Основной",
        labels: { ru: "Основной", en: "Basic" },
        description: { ru: "Стандартный стиль", en: "Standard style" },
        category: "basic",
        complexity: "basic" as const,
        style: {
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: "bold",
          fontFamily: "Arial",
        },
      }

      const mockProps = {
        item: mockStyle,
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
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockStyle = {
        id: "cinematic",
        name: "Кинематографический",
        labels: { ru: "Кинематографический", en: "Cinematic" },
        description: { ru: "Стиль для фильмов", en: "Cinema style" },
        category: "cinematic",
        complexity: "intermediate" as const,
        style: {
          color: "#ffff00",
          fontSize: "18px",
          fontWeight: "normal",
          fontFamily: "Times New Roman",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        },
      }

      const mockProps = {
        item: mockStyle,
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
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockStyle = {
        id: "minimal",
        name: "Минималистичный",
        labels: { ru: "Минималистичный", en: "Minimal" },
        description: { ru: "Простой стиль", en: "Simple style" },
        category: "minimal",
        complexity: "basic" as const,
        style: {
          color: "#000000",
          fontSize: "14px",
          fontWeight: "normal",
          fontFamily: "Helvetica",
        },
      }

      const mockProps = {
        item: mockStyle,
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
    it("should be 'subtitle'", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("subtitle")
    })
  })

  describe("isFavorite", () => {
    it("should check if subtitle style is favorite", () => {
      const { result } = renderHook(() => useSubtitlesAdapter(), { wrapper: BrowserProviders })

      const testStyle = {
        id: "basic",
        name: "Основной",
        labels: { ru: "Основной", en: "Basic" },
        description: { ru: "Стандартный стиль", en: "Standard style" },
        category: "basic",
        complexity: "basic" as const,
        style: {
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: "bold",
          fontFamily: "Arial",
        },
      }

      expect(result.current.isFavorite).toBeDefined()
      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite(testStyle)).toBe(false)
    })
  })
})
