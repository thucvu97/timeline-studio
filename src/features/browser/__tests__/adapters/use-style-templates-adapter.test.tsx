import "./browser-adapter-mocks" // Импортируем моки первыми

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useStyleTemplatesAdapter } from "../../adapters/use-style-templates-adapter"

// Мокаем только специфичные для style-templates зависимости
vi.mock("@/features/style-templates/hooks", () => ({
  useStyleTemplates: vi.fn(() => ({
    templates: [
      {
        id: "intro-fade",
        name: { en: "Fade Intro", ru: "Плавное появление" },
        description: { en: "Smooth fade in animation", ru: "Плавная анимация появления" },
        category: "intro",
        duration: 2,
        hasAnimation: true,
        thumbnail: "/style-templates/fade-intro.png",
      },
      {
        id: "title-bounce",
        name: { en: "Bouncing Title", ru: "Подпрыгивающий заголовок" },
        description: { en: "Bouncing title animation", ru: "Анимация подпрыгивающего заголовка" },
        category: "title",
        duration: 1.5,
        hasAnimation: true,
        thumbnail: "/style-templates/bounce-title.png",
      },
    ],
    loading: false,
    error: null,
  })),
}))

describe("useStyleTemplatesAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("should return style templates adapter with correct structure", () => {
    const { result } = renderHook(() => useStyleTemplatesAdapter(), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "template")
  })

  describe("useData", () => {
    it("should return style templates data", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
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
      duration: 2,
      hasAnimation: true,
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testTemplate, "name")).toBe("плавное появление")
      expect(result.current.getSortValue(testTemplate, "category")).toBe("intro")
      expect(result.current.getSortValue(testTemplate, "duration")).toBe(2)
      expect(result.current.getSortValue(testTemplate, "unknown")).toBe("плавное появление")
    })
  })

  describe("getSearchableText", () => {
    const testTemplate = {
      id: "intro-fade",
      name: { en: "Fade Intro", ru: "Плавное появление" },
      description: { en: "Smooth fade in animation", ru: "Плавная анимация появления" },
      category: "intro",
      duration: 2,
      hasAnimation: true,
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testTemplate)
      expect(searchableText).toContain("Плавное появление")
      expect(searchableText).toContain("Fade Intro")
      expect(searchableText).toContain("Плавная анимация появления")
      expect(searchableText).toContain("Smooth fade in animation")
      expect(searchableText).toContain("intro")
    })
  })

  describe("getGroupValue", () => {
    const testTemplate = {
      id: "intro-fade",
      name: { ru: "Плавное появление" },
      category: "intro",
      duration: 2,
      hasAnimation: true,
    }

    it("should group by category", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testTemplate, "category")).toBe("intro")
      expect(result.current.getGroupValue(testTemplate, "duration")).toBe("Короткие (≤3с)")
      expect(result.current.getGroupValue(testTemplate, "unknown")).toBe("")
    })

    it("should group by duration ranges", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      const shortTemplate = { ...testTemplate, duration: 0.5 }
      const longTemplate = { ...testTemplate, duration: 5 }

      expect(result.current.getGroupValue(shortTemplate, "duration")).toBe("Короткие (≤3с)")
      expect(result.current.getGroupValue(longTemplate, "duration")).toBe("Средние (3-10с)")
    })
  })

  describe("matchesFilter", () => {
    const introTemplate = {
      id: "intro-fade",
      name: { ru: "Плавное появление" },
      category: "intro",
      duration: 2,
      hasAnimation: true,
    }

    const titleTemplate = {
      id: "title-bounce",
      name: { ru: "Подпрыгивающий заголовок" },
      category: "title",
      duration: 1.5,
      hasAnimation: true,
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(introTemplate, "intro")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "intro")).toBe(false)
      expect(result.current.matchesFilter?.(titleTemplate, "title")).toBe(true)
      expect(result.current.matchesFilter?.(introTemplate, "title")).toBe(false)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(introTemplate, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'template'", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("template")
    })
  })
})
