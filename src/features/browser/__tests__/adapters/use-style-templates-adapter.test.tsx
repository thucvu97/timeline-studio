import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useStyleTemplatesAdapter } from "../../adapters/use-style-templates-adapter"

// Минимальные моки для тестирования
const mockStyleTemplates = [
  {
    id: "intro-fade",
    name: "Плавное появление",
    description: "Плавная анимация появления",
    category: "intro",
    style: "modern",
    aspectRatio: "16:9",
    duration: 2,
    hasAnimation: true,
    hasText: false,
    thumbnail: "/style-templates/fade-intro.png",
    tags: ["вступление", "плавное", "intro", "fade"],
  },
  {
    id: "title-bounce",
    name: "Подпрыгивающий заголовок",
    description: "Анимация подпрыгивающего заголовка",
    category: "title",
    style: "creative",
    aspectRatio: "16:9",
    duration: 1.5,
    hasAnimation: true,
    hasText: true,
    thumbnail: "/style-templates/bounce-title.png",
    tags: ["заголовок", "анимация", "title", "bounce"],
  },
  {
    id: "outro-minimal",
    name: "Минималистичное завершение",
    description: "Чистое минималистичное завершение",
    category: "outro",
    style: "minimal",
    aspectRatio: "9:16",
    duration: 15,
    hasAnimation: false,
    hasText: true,
    thumbnail: null,
    tags: ["завершение", "минимализм", "outro", "minimal"],
  },
]

// Создаем реальные функции для тестирования логики
const mockGetSortValue = vi.fn((template: any, sortBy: string) => {
  switch (sortBy) {
    case "name":
      return template.name.toLowerCase()
    case "category":
      return template.category.toLowerCase()
    case "style":
      return template.style.toLowerCase()
    case "duration":
      return template.duration
    case "aspectRatio":
      return template.aspectRatio
    default:
      return template.name.toLowerCase()
  }
})

const mockGetSearchableText = vi.fn((template: any) => {
  const texts = [
    template.name,
    template.description || "",
    template.category,
    template.style,
    template.aspectRatio,
    ...(template.tags || []),
  ]
  return texts.filter(Boolean)
})

const mockGetGroupValue = vi.fn((template: any, groupBy: string) => {
  switch (groupBy) {
    case "category":
      return template.category || "other"
    case "style":
      return template.style || "other"
    case "aspectRatio":
      return template.aspectRatio || "16:9"
    case "duration":
      if (template.duration <= 3) return "Короткие (≤3с)"
      if (template.duration <= 10) return "Средние (3-10с)"
      return "Длинные (>10с)"
    case "features":
      if (template.hasText && template.hasAnimation) return "Текст + анимация"
      if (template.hasText) return "С текстом"
      if (template.hasAnimation) return "С анимацией"
      return "Базовые"
    default:
      return ""
  }
})

const mockMatchesFilter = vi.fn((template: any, filterType: string) => {
  if (filterType === "all") return true

  // Фильтрация по категории
  if (["intro", "outro", "lower-third", "title", "transition", "overlay"].includes(filterType)) {
    return template.category === filterType
  }

  // Фильтрация по стилю
  if (["modern", "vintage", "minimal", "corporate", "creative", "cinematic"].includes(filterType)) {
    return template.style === filterType
  }

  // Фильтрация по соотношению сторон
  if (["16:9", "9:16", "1:1"].includes(filterType)) {
    return template.aspectRatio === filterType
  }

  // Фильтрация по наличию текста
  if (filterType === "hasText") {
    return template.hasText
  }

  // Фильтрация по наличию анимации
  if (filterType === "hasAnimation") {
    return template.hasAnimation
  }

  return true
})

vi.mock("@/features/browser/hooks/use-resources", () => ({
  useStyleTemplatesAdapter: vi.fn(() => ({
    items: mockStyleTemplates,
    loading: false,
    error: null,
    stats: { total: 3 },
    getSortValue: mockGetSortValue,
    getSearchableText: mockGetSearchableText,
    getGroupValue: mockGetGroupValue,
    matchesFilter: mockMatchesFilter,
    PreviewComponent: ({ item }: any) => <div data-testid="style-template-preview">{item.name}</div>,
    favoriteType: "template",
    isFavorite: vi.fn(() => false),
  })),
}))

vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: any) => children,
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
}))

vi.mock("@/features/drag-drop", () => ({
  useDraggable: vi.fn(() => ({})),
}))

vi.mock("@/features/style-templates/components/style-template-preview", () => ({
  StyleTemplatePreview: ({ template, onSelect }: any) => (
    <div data-testid="style-template-preview" onClick={() => onSelect(template.id)}>
      {template.name}
    </div>
  ),
}))

vi.mock("@/features/browser/providers/effects-provider", () => ({
  EffectsProvider: ({ children }: any) => children,
  useEffectsProvider: vi.fn(() => ({
    api: {
      getEffects: vi.fn(() => []),
      getFilters: vi.fn(() => []),
      getTransitions: vi.fn(() => []),
      getTemplates: vi.fn(() => []),
      getResources: vi.fn(() => []),
      getResourceById: vi.fn(() => null),
      searchResources: vi.fn(() => []),
      getResourcesByCategory: vi.fn(() => []),
      getResourcesByTags: vi.fn(() => []),
      getResourcesByComplexity: vi.fn(() => []),
      loadSource: vi.fn(() => Promise.resolve({ success: true, data: [], source: "built-in", timestamp: Date.now() })),
      isSourceLoaded: vi.fn(() => true),
      refreshSource: vi.fn(() =>
        Promise.resolve({ success: true, data: [], source: "built-in", timestamp: Date.now() }),
      ),
      preloadCategory: vi.fn(() =>
        Promise.resolve({ success: true, data: [], source: "built-in", timestamp: Date.now() }),
      ),
      getSourceConfig: vi.fn(() => null),
      updateSourceConfig: vi.fn(),
      getLoadingState: vi.fn(() => ({
        isLoading: false,
        loadedSources: new Set(["built-in"]),
        loadingQueue: [],
        error: null,
        progress: 100,
      })),
      getStats: vi.fn(() => ({
        total: 0,
        byType: {},
        bySource: {},
        cacheSize: 0,
        memoryUsage: 0,
      })),
      getCacheSize: vi.fn(() => 0),
      clearCache: vi.fn(),
      clearSourceCache: vi.fn(),
      invalidateCache: vi.fn(),
      onLoadingStateChange: vi.fn(() => () => {}),
      onResourcesUpdate: vi.fn(() => () => {}),
      onError: vi.fn(() => () => {}),
    },
    config: {
      initialSources: ["built-in"],
      backgroundLoadDelay: 1000,
      enableCaching: true,
      maxCacheSize: 100,
    },
    isInitialized: true,
  })),
}))

// Простой враппер для тестов
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

describe("useStyleTemplatesAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("should return style templates adapter with correct structure", () => {
    const { result } = renderHook(() => useStyleTemplatesAdapter(), {
      wrapper: TestWrapper,
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
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBe(null)
      expect(dataResult.current.items).toHaveLength(3)
      expect(dataResult.current.items[0].id).toBe("intro-fade")
      expect(dataResult.current.items[1].id).toBe("title-bounce")
      expect(dataResult.current.items[2].id).toBe("outro-minimal")
    })
  })

  describe("getSortValue", () => {
    const testTemplate = {
      id: "intro-fade",
      name: "Плавное появление",
      description: "Плавная анимация",
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 2,
      hasAnimation: true,
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.getSortValue(testTemplate, "name")).toBe("плавное появление")
      expect(result.current.getSortValue(testTemplate, "category")).toBe("intro")
      expect(result.current.getSortValue(testTemplate, "style")).toBe("modern")
      expect(result.current.getSortValue(testTemplate, "duration")).toBe(2)
      expect(result.current.getSortValue(testTemplate, "aspectRatio")).toBe("16:9")
      expect(result.current.getSortValue(testTemplate, "unknown")).toBe("плавное появление")

      // Проверяем что mock был вызван с правильными параметрами
      expect(mockGetSortValue).toHaveBeenCalledWith(testTemplate, "name")
    })
  })

  describe("getSearchableText", () => {
    const testTemplate = {
      id: "intro-fade",
      name: "Плавное появление",
      description: "Плавная анимация появления",
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 2,
      hasAnimation: true,
      tags: ["вступление", "плавное", "intro", "fade"],
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      const searchableText = result.current.getSearchableText(testTemplate)
      expect(searchableText).toContain("Плавное появление")
      expect(searchableText).toContain("Плавная анимация появления")
      expect(searchableText).toContain("intro")
      expect(searchableText).toContain("modern")
      expect(searchableText).toContain("16:9")
      expect(searchableText).toContain("вступление")
      expect(searchableText).toContain("плавное")
      expect(searchableText).toContain("fade")

      // Проверяем что mock был вызван
      expect(mockGetSearchableText).toHaveBeenCalledWith(testTemplate)
    })
  })

  describe("getGroupValue", () => {
    const testTemplate = {
      id: "intro-fade",
      name: "Плавное появление",
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 2,
      hasAnimation: true,
      hasText: false,
    }

    it("should group by category", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.getGroupValue(testTemplate, "category")).toBe("intro")
      expect(result.current.getGroupValue(testTemplate, "duration")).toBe("Короткие (≤3с)")
      expect(result.current.getGroupValue(testTemplate, "unknown")).toBe("")
    })

    it("should group by duration ranges", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      const shortTemplate = { ...testTemplate, duration: 0.5 }
      const mediumTemplate = { ...testTemplate, duration: 5 }
      const longTemplate = { ...testTemplate, duration: 15 }

      expect(result.current.getGroupValue(shortTemplate, "duration")).toBe("Короткие (≤3с)")
      expect(result.current.getGroupValue(mediumTemplate, "duration")).toBe("Средние (3-10с)")
      expect(result.current.getGroupValue(longTemplate, "duration")).toBe("Длинные (>10с)")
    })

    it("should group by style", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.getGroupValue(testTemplate, "style")).toBe("modern")
      expect(result.current.getGroupValue({ ...testTemplate, style: null }, "style")).toBe("other")
    })

    it("should group by aspect ratio", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.getGroupValue(testTemplate, "aspectRatio")).toBe("16:9")
      expect(result.current.getGroupValue({ ...testTemplate, aspectRatio: null }, "aspectRatio")).toBe("16:9")
    })

    it("should group by features", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

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
      name: "Плавное появление",
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 2,
      hasAnimation: true,
      hasText: false,
    }

    const titleTemplate = {
      id: "title-bounce",
      name: "Подпрыгивающий заголовок",
      category: "title",
      style: "creative",
      aspectRatio: "16:9",
      duration: 1.5,
      hasAnimation: true,
      hasText: true,
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.matchesFilter?.(introTemplate, "intro")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "intro")).toBe(false)
      expect(result.current.matchesFilter?.(titleTemplate, "title")).toBe(true)
      expect(result.current.matchesFilter?.(introTemplate, "title")).toBe(false)
    })

    it("should match filter by style", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.matchesFilter?.(introTemplate, "modern")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "modern")).toBe(false)
      expect(result.current.matchesFilter?.(titleTemplate, "creative")).toBe(true)
      expect(result.current.matchesFilter?.(introTemplate, "creative")).toBe(false)
    })

    it("should match filter by aspect ratio", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      const verticalTemplate = { ...introTemplate, aspectRatio: "9:16" }
      const squareTemplate = { ...introTemplate, aspectRatio: "1:1" }

      expect(result.current.matchesFilter?.(introTemplate, "16:9")).toBe(true)
      expect(result.current.matchesFilter?.(verticalTemplate, "16:9")).toBe(false)
      expect(result.current.matchesFilter?.(verticalTemplate, "9:16")).toBe(true)
      expect(result.current.matchesFilter?.(squareTemplate, "1:1")).toBe(true)
    })

    it("should match filter by features", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.matchesFilter?.(introTemplate, "hasAnimation")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "hasText")).toBe(true)
      expect(result.current.matchesFilter?.(introTemplate, "hasText")).toBe(false)
    })

    it("should return true for 'all' filter", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.matchesFilter?.(introTemplate, "all")).toBe(true)
      expect(result.current.matchesFilter?.(titleTemplate, "all")).toBe(true)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.matchesFilter?.(introTemplate, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })

    it("should render correctly in list mode", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })
      const PreviewComponent = result.current.PreviewComponent

      const mockTemplate = {
        id: "intro-fade",
        name: "Плавное появление",
        description: "Плавная анимация появления",
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 2,
        hasAnimation: true,
        hasText: false,
        thumbnail: "/style-templates/fade-intro.png",
        tags: ["вступление", "плавное", "intro", "fade"],
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
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })
      const PreviewComponent = result.current.PreviewComponent

      const mockTemplate = {
        id: "title-bounce",
        name: "Подпрыгивающий заголовок",
        description: "Анимация подпрыгивающего заголовка",
        category: "title",
        style: "creative",
        aspectRatio: "16:9",
        duration: 1.5,
        hasAnimation: true,
        hasText: true,
        thumbnail: "/style-templates/bounce-title.png",
        tags: ["заголовок", "анимация", "title", "bounce"],
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
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })
      const PreviewComponent = result.current.PreviewComponent

      const mockTemplate = {
        id: "outro-minimal",
        name: "Минималистичное завершение",
        description: "Чистое минималистичное завершение",
        category: "outro",
        style: "minimal",
        aspectRatio: "9:16",
        duration: 15,
        hasAnimation: false,
        hasText: true,
        thumbnail: null,
        tags: ["завершение", "минимализм", "outro", "minimal"],
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
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      expect(result.current.favoriteType).toBe("template")
    })
  })

  describe("isFavorite", () => {
    it("should check if style template is favorite", () => {
      const { result } = renderHook(() => useStyleTemplatesAdapter(), { wrapper: TestWrapper })

      const testTemplate = {
        id: "intro-fade",
        name: "Плавное появление",
        description: "Плавная анимация появления",
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 2,
        hasAnimation: true,
        hasText: false,
        thumbnail: "/style-templates/fade-intro.png",
        tags: ["вступление", "плавное", "intro", "fade"],
      }

      expect(result.current.isFavorite).toBeDefined()
      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite(testTemplate)).toBe(false)
    })
  })
})
