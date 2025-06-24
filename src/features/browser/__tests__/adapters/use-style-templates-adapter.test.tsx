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
        style: "modern",
        aspectRatio: "16:9",
        duration: 2,
        hasAnimation: true,
        hasText: false,
        thumbnail: "/style-templates/fade-intro.png",
        tags: { ru: ["вступление", "плавное"], en: ["intro", "fade"] },
      },
      {
        id: "title-bounce",
        name: { en: "Bouncing Title", ru: "Подпрыгивающий заголовок" },
        description: { en: "Bouncing title animation", ru: "Анимация подпрыгивающего заголовка" },
        category: "title",
        style: "creative",
        aspectRatio: "16:9",
        duration: 1.5,
        hasAnimation: true,
        hasText: true,
        thumbnail: "/style-templates/bounce-title.png",
        tags: { ru: ["заголовок", "анимация"], en: ["title", "bounce"] },
      },
      {
        id: "outro-minimal",
        name: { en: "Minimal Outro", ru: "Минималистичное завершение" },
        description: { en: "Clean minimal outro", ru: "Чистое минималистичное завершение" },
        category: "outro",
        style: "minimal",
        aspectRatio: "9:16",
        duration: 15,
        hasAnimation: false,
        hasText: true,
        thumbnail: null,
        tags: { ru: ["завершение", "минимализм"], en: ["outro", "minimal"] },
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
      expect(dataResult.current.items).toHaveLength(3)
      expect(dataResult.current.items[0].id).toBe("intro-fade")
      expect(dataResult.current.items[1].id).toBe("title-bounce")
      expect(dataResult.current.items[2].id).toBe("outro-minimal")
    })
  })

  describe("getSortValue", () => {
    const testTemplate = {
      id: "intro-fade",
      name: { en: "Fade Intro", ru: "Плавное появление" },
      description: { en: "Smooth fade in", ru: "Плавная анимация" },
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 2,
      hasAnimation: true,
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testTemplate, "name")).toBe("плавное появление")
      expect(result.current.getSortValue(testTemplate, "category")).toBe("intro")
      expect(result.current.getSortValue(testTemplate, "style")).toBe("modern")
      expect(result.current.getSortValue(testTemplate, "duration")).toBe(2)
      expect(result.current.getSortValue(testTemplate, "aspectRatio")).toBe("16:9")
      expect(result.current.getSortValue(testTemplate, "unknown")).toBe("плавное появление")
    })
  })

  describe("getSearchableText", () => {
    const testTemplate = {
      id: "intro-fade",
      name: { en: "Fade Intro", ru: "Плавное появление" },
      description: { en: "Smooth fade in animation", ru: "Плавная анимация появления" },
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 2,
      hasAnimation: true,
      tags: { ru: ["вступление", "плавное"], en: ["intro", "fade"] },
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testTemplate)
      expect(searchableText).toContain("Плавное появление")
      expect(searchableText).toContain("Fade Intro")
      expect(searchableText).toContain("Плавная анимация появления")
      expect(searchableText).toContain("Smooth fade in animation")
      expect(searchableText).toContain("intro")
      expect(searchableText).toContain("modern")
      expect(searchableText).toContain("16:9")
      expect(searchableText).toContain("вступление")
      expect(searchableText).toContain("плавное")
      expect(searchableText).toContain("fade")
    })
  })

  describe("getGroupValue", () => {
    const testTemplate = {
      id: "intro-fade",
      name: { ru: "Плавное появление" },
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 2,
      hasAnimation: true,
      hasText: false,
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
      const mediumTemplate = { ...testTemplate, duration: 5 }
      const longTemplate = { ...testTemplate, duration: 15 }

      expect(result.current.getGroupValue(shortTemplate, "duration")).toBe("Короткие (≤3с)")
      expect(result.current.getGroupValue(mediumTemplate, "duration")).toBe("Средние (3-10с)")
      expect(result.current.getGroupValue(longTemplate, "duration")).toBe("Длинные (>10с)")
    })

    it("should group by style", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testTemplate, "style")).toBe("modern")
      expect(result.current.getGroupValue({ ...testTemplate, style: null }, "style")).toBe("other")
    })

    it("should group by aspect ratio", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testTemplate, "aspectRatio")).toBe("16:9")
      expect(result.current.getGroupValue({ ...testTemplate, aspectRatio: null }, "aspectRatio")).toBe("16:9")
    })

    it("should group by features", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      const withTextAndAnimation = { ...testTemplate, hasText: true, hasAnimation: true }
      const withTextOnly = { ...testTemplate, hasText: true, hasAnimation: false }
      const withAnimationOnly = { ...testTemplate, hasText: false, hasAnimation: true }
      const basic = { ...testTemplate, hasText: false, hasAnimation: false }

      expect(result.current.getGroupValue(withTextAndAnimation, "features")).toBe("Текст + анимация")
      expect(result.current.getGroupValue(withTextOnly, "features")).toBe("С текстом")
      expect(result.current.getGroupValue(withAnimationOnly, "features")).toBe("С анимацией")
      expect(result.current.getGroupValue(basic, "features")).toBe("Базовые")
    })
  })

  describe("matchesFilter", () => {
    const introTemplate = {
      id: "intro-fade",
      name: { ru: "Плавное появление" },
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 2,
      hasAnimation: true,
      hasText: false,
    }

    const titleTemplate = {
      id: "title-bounce",
      name: { ru: "Подпрыгивающий заголовок" },
      category: "title",
      style: "creative",
      aspectRatio: "16:9",
      duration: 1.5,
      hasAnimation: true,
      hasText: true,
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(introTemplate, "intro")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "intro")).toBe(false)
      expect(result.current.matchesFilter?.(titleTemplate, "title")).toBe(true)
      expect(result.current.matchesFilter?.(introTemplate, "title")).toBe(false)
    })

    it("should match filter by style", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(introTemplate, "modern")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "modern")).toBe(false)
      expect(result.current.matchesFilter?.(titleTemplate, "creative")).toBe(true)
      expect(result.current.matchesFilter?.(introTemplate, "creative")).toBe(false)
    })

    it("should match filter by aspect ratio", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      const verticalTemplate = { ...introTemplate, aspectRatio: "9:16" }
      const squareTemplate = { ...introTemplate, aspectRatio: "1:1" }

      expect(result.current.matchesFilter?.(introTemplate, "16:9")).toBe(true)
      expect(result.current.matchesFilter?.(verticalTemplate, "16:9")).toBe(false)
      expect(result.current.matchesFilter?.(verticalTemplate, "9:16")).toBe(true)
      expect(result.current.matchesFilter?.(squareTemplate, "1:1")).toBe(true)
    })

    it("should match filter by features", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(introTemplate, "hasAnimation")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "hasText")).toBe(true)
      expect(result.current.matchesFilter?.(introTemplate, "hasText")).toBe(false)
    })

    it("should return true for 'all' filter", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(introTemplate, "all")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "all")).toBe(true)
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

    it("should render correctly in list mode", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockTemplate = {
        id: "intro-fade",
        name: { en: "Fade Intro", ru: "Плавное появление" },
        description: { en: "Smooth fade in animation", ru: "Плавная анимация появления" },
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 2,
        hasAnimation: true,
        hasText: false,
        thumbnail: "/style-templates/fade-intro.png",
        tags: { ru: ["вступление", "плавное"], en: ["intro", "fade"] },
      }

      const mockProps = {
        item: mockTemplate,
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
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockTemplate = {
        id: "title-bounce",
        name: { en: "Bouncing Title", ru: "Подпрыгивающий заголовок" },
        description: { en: "Bouncing title animation", ru: "Анимация подпрыгивающего заголовка" },
        category: "title",
        style: "creative",
        aspectRatio: "16:9",
        duration: 1.5,
        hasAnimation: true,
        hasText: true,
        thumbnail: "/style-templates/bounce-title.png",
        tags: { ru: ["заголовок", "анимация"], en: ["title", "bounce"] },
      }

      const mockProps = {
        item: mockTemplate,
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
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const mockTemplate = {
        id: "outro-minimal",
        name: { en: "Minimal Outro", ru: "Минималистичное завершение" },
        description: { en: "Clean minimal outro", ru: "Чистое минималистичное завершение" },
        category: "outro",
        style: "minimal",
        aspectRatio: "9:16",
        duration: 15,
        hasAnimation: false,
        hasText: true,
        thumbnail: null,
        tags: { ru: ["завершение", "минимализм"], en: ["outro", "minimal"] },
      }

      const mockProps = {
        item: mockTemplate,
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
    it("should be 'template'", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("template")
    })
  })

  describe("isFavorite", () => {
    it("should check if style template is favorite", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: BrowserProviders })

      const testTemplate = {
        id: "intro-fade",
        name: { en: "Fade Intro", ru: "Плавное появление" },
        description: { en: "Smooth fade in animation", ru: "Плавная анимация появления" },
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 2,
        hasAnimation: true,
        hasText: false,
        thumbnail: "/style-templates/fade-intro.png",
        tags: { ru: ["вступление", "плавное"], en: ["intro", "fade"] },
      }

      expect(result.current.isFavorite).toBeDefined()
      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite(testTemplate)).toBe(false)
    })
  })
})
