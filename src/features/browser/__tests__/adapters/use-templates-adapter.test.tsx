import "./browser-adapter-mocks" // Импортируем моки первыми

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useTemplatesAdapter } from "../../adapters/use-templates-adapter"

// Мокаем специфичные для templates зависимости
vi.mock("@/features/templates/lib/templates", () => ({
  TEMPLATE_MAP: {
    landscape: [
      {
        id: "split-horizontal",
        screens: 2,
        split: "horizontal",
        resizable: true,
      },
      {
        id: "grid-2x2",
        screens: 4,
        split: "grid",
        resizable: false,
      },
    ],
    square: [],
    portrait: [],
  },
}))

// Мокаем TemplatePreview компонент
vi.mock("@/features/templates/components/template-preview", () => ({
  TemplatePreview: ({ template, onClick }: any) => (
    <div data-testid="template-preview" onClick={onClick}>
      Mock Template Preview: {template.id}
    </div>
  ),
}))



describe("useTemplatesAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("should return templates adapter with correct structure", () => {
    const { result } = renderHook(() => useTemplatesAdapter(), {
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
    it("should return templates data", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].id).toBe("split-horizontal")
      expect(dataResult.current.items[1].id).toBe("grid-2x2")
    })
  })

  describe("getSortValue", () => {
    const testTemplate = {
      id: "split-horizontal",
      screens: 2,
      split: "horizontal",
      resizable: true,
    }

    const nonResizableTemplate = {
      id: "grid-2x2",
      screens: 4,
      split: "grid",
      resizable: false,
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testTemplate, "name")).toBe("split-horizontal")
      expect(result.current.getSortValue(testTemplate, "id")).toBe("split-horizontal")
      expect(result.current.getSortValue(testTemplate, "screens")).toBe(2)
      expect(result.current.getSortValue(testTemplate, "split")).toBe("horizontal")
      expect(result.current.getSortValue(testTemplate, "resizable")).toBe(1)
      expect(result.current.getSortValue(testTemplate, "unknown")).toBe("split-horizontal")
    })

    it("should sort non-resizable templates correctly", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(nonResizableTemplate, "resizable")).toBe(0)
    })
  })

  describe("getSearchableText", () => {
    const testTemplate = {
      id: "split-horizontal",
      screens: 2,
      split: "horizontal",
      resizable: true,
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testTemplate)
      expect(searchableText).toContain("split-horizontal")
      expect(searchableText).toContain("horizontal")
      expect(searchableText).toContain("2")
      expect(searchableText).toContain("resizable")
    })
  })

  describe("getGroupValue", () => {
    const testTemplate = {
      id: "split-horizontal",
      screens: 2,
      split: "horizontal",
      resizable: true,
    }

    const nonResizableTemplate = {
      id: "grid-2x2",
      screens: 4,
      split: "grid", 
      resizable: false,
    }

    it("should group by split and screens", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testTemplate, "split")).toBe("horizontal")
      expect(result.current.getGroupValue(testTemplate, "screens")).toBe("2 экрана")
      expect(result.current.getGroupValue(testTemplate, "resizable")).toBe("Изменяемые")
      expect(result.current.getGroupValue(testTemplate, "unknown")).toBe("")
    })

    it("should group non-resizable templates correctly", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(nonResizableTemplate, "resizable")).toBe("Фиксированные")
    })

    it("should group by screen count ranges", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      const singleTemplate = { ...testTemplate, screens: 1 }
      const doubleTemplate = { ...testTemplate, screens: 2 }
      const quadTemplate = { ...testTemplate, screens: 4 }
      const hexTemplate = { ...testTemplate, screens: 6 }
      const largeTemplate = { ...testTemplate, screens: 8 }

      expect(result.current.getGroupValue(singleTemplate, "screens")).toBe("1 экран")
      expect(result.current.getGroupValue(doubleTemplate, "screens")).toBe("2 экрана")
      expect(result.current.getGroupValue(quadTemplate, "screens")).toBe("3-4 экрана")
      expect(result.current.getGroupValue(hexTemplate, "screens")).toBe("5-6 экранов")
      expect(result.current.getGroupValue(largeTemplate, "screens")).toBe("7+ экранов")
    })
  })

  describe("matchesFilter", () => {
    const horizontalTemplate = {
      id: "split-horizontal",
      screens: 2,
      split: "horizontal",
      resizable: true,
    }

    const gridTemplate = {
      id: "grid-2x2",
      screens: 4,
      split: "grid",
      resizable: false,
    }

    it("should match filter by split type", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(horizontalTemplate, "horizontal")).toBe(true)
      expect(result.current.matchesFilter?.(gridTemplate, "horizontal")).toBe(false)
      expect(result.current.matchesFilter?.(gridTemplate, "grid")).toBe(true)
      expect(result.current.matchesFilter?.(horizontalTemplate, "grid")).toBe(false)
    })

    it("should match filter by resizable", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(horizontalTemplate, "resizable")).toBe(true)
      expect(result.current.matchesFilter?.(gridTemplate, "resizable")).toBe(false)
      expect(result.current.matchesFilter?.(gridTemplate, "fixed")).toBe(true)
      expect(result.current.matchesFilter?.(horizontalTemplate, "fixed")).toBe(false)
    })

    it("should match filter by screen count", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(horizontalTemplate, "screens-2")).toBe(true)
      expect(result.current.matchesFilter?.(gridTemplate, "screens-2")).toBe(false)
      expect(result.current.matchesFilter?.(gridTemplate, "screens-4")).toBe(true)
    })

    it("should return true for 'all' and unknown filter", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(horizontalTemplate, "all")).toBe(true)
      expect(result.current.matchesFilter?.(horizontalTemplate, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })

    it("should render in list view mode", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      
      const mockTemplate = {
        id: "split-horizontal",
        screens: 2,
        split: "horizontal",
        resizable: true,
      } as any

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

    it("should render in thumbnails view mode", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      
      const mockTemplate = {
        id: "grid-2x2",
        screens: 4,
        split: "grid",
        resizable: false,
      } as any

      const mockProps = {
        item: mockTemplate,
        size: { width: 120, height: 80 },
        viewMode: "thumbnails" as const,
        onClick: vi.fn(),
        onDragStart: vi.fn(),
        isSelected: false,
        isFavorite: false,
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      expect(() => <PreviewComponent {...mockProps} />).not.toThrow()
    })

    it("should handle template with single screen correctly", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      
      const singleScreenTemplate = {
        id: "single",
        screens: 1,
        split: "none",
        resizable: false,
      } as any

      const mockProps = {
        item: singleScreenTemplate,
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
  })

  describe("isFavorite", () => {
    it("should check if template is favorite", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })
      
      const testTemplate = {
        id: "split-horizontal",
        screens: 2,
        split: "horizontal",
        resizable: true,
      } as any

      expect(typeof result.current.isFavorite).toBe("function")
      expect(result.current.isFavorite(testTemplate)).toBe(false)
    })
  })

  describe("favoriteType", () => {
    it("should be 'template'", () => {
      const { result } = renderHook(() => useTemplatesAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("template")
    })
  })
})
