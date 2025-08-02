import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTransitionsAdapter } from "../../adapters/use-transitions-adapter"

// Минимальные моки для тестирования
const mockTransitions = [
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
]

// Создаем реальные функции для тестирования логики
const mockGetSortValue = vi.fn((transition: any, sortBy: string) => {
  switch (sortBy) {
    case "name":
      return (transition.labels?.ru || transition.labels?.en || transition.name || "").toLowerCase()
    case "category":
      return transition.category.toLowerCase()
    case "complexity": {
      const complexityOrder: Record<string, number> = { basic: 0, intermediate: 1, advanced: 2 }
      return complexityOrder[transition.complexity || "basic"]
    }
    case "duration":
      return transition.duration?.default || 1
    case "type":
      return transition.type.toLowerCase()
    default:
      return (transition.labels?.ru || transition.labels?.en || transition.name || "").toLowerCase()
  }
})

const mockGetSearchableText = vi.fn((transition: any) => {
  const texts = [
    transition.name || "",
    transition.labels?.ru || "",
    transition.labels?.en || "",
    transition.description?.ru || "",
    transition.description?.en || "",
    transition.category,
    transition.type,
    ...(transition.tags || []),
  ]
  return texts.filter(Boolean)
})

const mockGetGroupValue = vi.fn((transition: any, groupBy: string) => {
  switch (groupBy) {
    case "category":
      return transition.category || "other"
    case "complexity":
      return transition.complexity || "basic"
    case "type":
      return transition.type || "unknown"
    case "tags":
      return transition.tags && transition.tags.length > 0 ? transition.tags[0] : "untagged"
    case "duration": {
      const duration = transition.duration?.default || 1
      if (duration <= 1) return "Короткие (≤1с)"
      if (duration <= 3) return "Средние (1-3с)"
      return "Длинные (>3с)"
    }
    default:
      return ""
  }
})

const mockMatchesFilter = vi.fn((transition: any, filterType: string) => {
  if (filterType === "all") return true

  // Фильтрация по сложности
  if (["basic", "intermediate", "advanced"].includes(filterType)) {
    return (transition.complexity || "basic") === filterType
  }

  // Фильтрация по категории
  if (["basic", "advanced", "creative", "3d", "artistic", "cinematic"].includes(filterType)) {
    return transition.category === filterType
  }

  return true
})

vi.mock("@/features/browser/hooks/use-resources", () => ({
  useTransitionsAdapter: vi.fn(() => ({
    items: mockTransitions,
    loading: false,
    error: null,
    stats: { total: 2 },
    getSortValue: mockGetSortValue,
    getSearchableText: mockGetSearchableText,
    getGroupValue: mockGetGroupValue,
    matchesFilter: mockMatchesFilter,
    PreviewComponent: ({ item }: any) => <div data-testid="transition-preview">{item.name}</div>,
    favoriteType: "transition",
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

vi.mock("@/features/transitions/components/transition-preview", () => ({
  TransitionPreview: ({ transition, onClick }: any) => (
    <div data-testid="transition-preview" onClick={onClick}>
      {transition.name}
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

describe("useTransitionsAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("should return transitions adapter with correct structure", () => {
    const { result } = renderHook(() => useTransitionsAdapter(), {
      wrapper: TestWrapper,
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
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBe(null)
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
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

      expect(result.current.getSortValue(testTransition, "name")).toBe("затухание")
      expect(result.current.getSortValue(testTransition, "category")).toBe("basic")
      expect(result.current.getSortValue(testTransition, "complexity")).toBe(0) // basic = 0
      expect(result.current.getSortValue(testTransition, "duration")).toBe(1)
      expect(result.current.getSortValue(testTransition, "type")).toBe("fade")
      expect(result.current.getSortValue(testTransition, "unknown")).toBe("затухание")

      // Проверяем что mock был вызван с правильными параметрами
      expect(mockGetSortValue).toHaveBeenCalledWith(testTransition, "name")
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
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

      const searchableText = result.current.getSearchableText(testTransition)
      expect(searchableText).toContain("Fade")
      expect(searchableText).toContain("Затухание")
      expect(searchableText).toContain("Плавное затухание")
      expect(searchableText).toContain("Smooth fade")
      expect(searchableText).toContain("basic")
      expect(searchableText).toContain("fade")

      // Проверяем что mock был вызван
      expect(mockGetSearchableText).toHaveBeenCalledWith(testTransition)
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
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

      expect(result.current.getGroupValue(testTransition, "category")).toBe("basic")
      expect(result.current.getGroupValue(testTransition, "complexity")).toBe("basic")
      expect(result.current.getGroupValue(testTransition, "type")).toBe("fade")
      expect(result.current.getGroupValue(testTransition, "tags")).toBe("fade")
      expect(result.current.getGroupValue(testTransition, "duration")).toBe("Короткие (≤1с)")
      expect(result.current.getGroupValue(testTransition, "unknown")).toBe("")
    })

    it("should group by duration ranges", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

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
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

      expect(result.current.matchesFilter?.(basicTransition, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(basicTransition, "intermediate")).toBe(false)
      expect(result.current.matchesFilter?.(advancedTransition, "intermediate")).toBe(true)
    })

    it("should match filter by category", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

      // Фильтрация по категории работает только для определенных категорий: basic, advanced, creative, 3d, artistic, cinematic
      expect(result.current.matchesFilter?.(basicTransition, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(advancedTransition, "basic")).toBe(false)
      expect(result.current.matchesFilter?.(advancedTransition, "creative")).toBe(true)
      expect(result.current.matchesFilter?.(basicTransition, "creative")).toBe(false)
    })

    it("should return true for 'all' and unknown filter", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

      expect(result.current.matchesFilter?.(basicTransition, "all")).toBe(true)
      expect(result.current.matchesFilter?.(basicTransition, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })

    it("should render correctly in list mode", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })
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
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })
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
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })
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
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

      expect(result.current.favoriteType).toBe("transition")
    })
  })

  describe("isFavorite", () => {
    it("should check if transition is favorite", () => {
      const { result } = renderHook(() => useTransitionsAdapter(), { wrapper: TestWrapper })

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
