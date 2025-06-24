import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useStyleTemplatesAdapter } from "../../adapters/use-style-templates-adapter"

// Мокаем зависимости
vi.mock("@/features/style-templates", () => ({
  useStyleTemplates: vi.fn(() => ({
    isLoading: false,
    error: null,
    styleTemplates: [
      {
        id: "intro-fade",
        name: { en: "Fade Intro", ru: "Плавное появление" },
        description: { en: "Smooth fade in animation", ru: "Плавная анимация появления" },
        category: "intro",
        duration: 2000,
        hasAnimation: true,
        thumbnail: "/style-templates/fade-intro.png",
      },
      {
        id: "title-bounce",
        name: { en: "Bouncing Title", ru: "Подпрыгивающий заголовок" },
        description: { en: "Bouncing title animation", ru: "Анимация подпрыгивающего заголовка" },
        category: "title",
        duration: 1500,
        hasAnimation: true,
        thumbnail: "/style-templates/bounce-title.png",
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

describe("useStyleTemplatesAdapter", () => {
  it("should return style templates adapter with correct structure", () => {
    const { result } = renderHook(() => useStyleTemplatesAdapter())

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "style-templates")
  })

  describe("useData", () => {
    it("should return style templates data", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.isLoading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].id).toBe("intro-fade")
      expect(dataResult.current.items[1].id).toBe("title-bounce")
    })
  })

  describe("getSortValue", () => {
    const testTemplate = {
      id: "intro-fade",
      name: { en: "Fade Intro", ru: "Плавное появление" },
      description: { en: "Smooth fade in", ru: "Плавная анимация" },
      category: "intro",
      duration: 2000,
      hasAnimation: true,
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())

      expect(result.current.getSortValue(testTemplate, "name")).toBe("Плавное появление")
      expect(result.current.getSortValue(testTemplate, "category")).toBe("intro")
      expect(result.current.getSortValue(testTemplate, "duration")).toBe(2000)
      expect(result.current.getSortValue(testTemplate, "id")).toBe("intro-fade")
      expect(result.current.getSortValue(testTemplate, "unknown")).toBe("Плавное появление")
    })
  })

  describe("getSearchableText", () => {
    const testTemplate = {
      id: "intro-fade",
      name: { en: "Fade Intro", ru: "Плавное появление" },
      description: { en: "Smooth fade in animation", ru: "Плавная анимация появления" },
      category: "intro",
      duration: 2000,
      hasAnimation: true,
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())

      const searchableText = result.current.getSearchableText(testTemplate)
      expect(searchableText).toEqual(["Плавное появление", "Плавная анимация появления", "intro"])
    })
  })

  describe("getGroupValue", () => {
    const testTemplate = {
      id: "intro-fade",
      name: { ru: "Плавное появление" },
      category: "intro",
      duration: 2000,
      hasAnimation: true,
    }

    it("should group by category", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())

      expect(result.current.getGroupValue(testTemplate, "category")).toBe("intro")
      expect(result.current.getGroupValue(testTemplate, "duration")).toBe("Средние (1-3с)")
      expect(result.current.getGroupValue(testTemplate, "unknown")).toBe("Прочее")
    })

    it("should group by duration ranges", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())

      const shortTemplate = { ...testTemplate, duration: 500 }
      const longTemplate = { ...testTemplate, duration: 5000 }

      expect(result.current.getGroupValue(shortTemplate, "duration")).toBe("Короткие (<1с)")
      expect(result.current.getGroupValue(longTemplate, "duration")).toBe("Длинные (>3с)")
    })
  })

  describe("matchesFilter", () => {
    const introTemplate = {
      id: "intro-fade",
      name: { ru: "Плавное появление" },
      category: "intro",
      duration: 2000,
      hasAnimation: true,
    }

    const titleTemplate = {
      id: "title-bounce",
      name: { ru: "Подпрыгивающий заголовок" },
      category: "title",
      duration: 1500,
      hasAnimation: true,
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())

      expect(result.current.matchesFilter?.(introTemplate, "intro")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "intro")).toBe(false)
      expect(result.current.matchesFilter?.(titleTemplate, "title")).toBe(true)
      expect(result.current.matchesFilter?.(introTemplate, "title")).toBe(false)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())

      expect(result.current.matchesFilter?.(introTemplate, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'style-templates'", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter())

      expect(result.current.favoriteType).toBe("style-templates")
    })
  })
})
