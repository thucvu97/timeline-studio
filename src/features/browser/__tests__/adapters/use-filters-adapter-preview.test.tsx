import "./browser-adapter-mocks" // Импортируем моки первыми

import React from "react"
import { render, screen } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useFiltersAdapter } from "../../adapters/use-filters-adapter"
import type { VideoFilter, FilterCategory } from "@/features/filters/types/filters"

// Мокаем FilterPreview компонент
vi.mock("@/features/filters/components/filter-preview", () => ({
  FilterPreview: ({ filter, onClick, size, previewWidth, previewHeight }: any) => (
    <div 
      data-testid="filter-preview" 
      onClick={onClick}
      style={{ width: previewWidth || size, height: previewHeight || size }}
    >
      {filter.name}
    </div>
  ),
}))

// Мокаем useFilters хук
vi.mock("@/features/filters/hooks/use-filters", () => ({
  useFilters: vi.fn(() => ({
    filters: [],
    loading: false,
    error: null,
  })),
}))

describe("useFiltersAdapter - PreviewComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockFilter: VideoFilter = {
    id: "test-filter",
    name: "Тестовый фильтр",
    description: { en: "Test filter", ru: "Тестовый фильтр" },
    category: "color-correction" as FilterCategory,
    complexity: "basic",
    labels: { ru: "Тестовый", en: "Test" },
    tags: ["test"],
    params: { brightness: 0.5, contrast: 1.2, saturation: 0.8, hue: 45, temperature: 10, tint: -5 },
  }

  describe("list mode", () => {
    it("should render filter in list mode", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const onClick = vi.fn()

      render(
        <PreviewComponent
          item={mockFilter}
          size="small"
          viewMode="list"
          onClick={onClick}
        />
      )

      // Check name
      expect(screen.getByText("Тестовый")).toBeInTheDocument()
      
      // Check description
      expect(screen.getByText("Test filter")).toBeInTheDocument()
      
      // Check category
      expect(screen.getByText("color-correction")).toBeInTheDocument()
      
      // Check complexity
      expect(screen.getByText("basic")).toBeInTheDocument()
    })

    it("should handle click in list mode", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const onClick = vi.fn()

      render(
        <PreviewComponent
          item={mockFilter}
          size="small"
          viewMode="list"
          onClick={onClick}
        />
      )

      const container = screen.getByText("Тестовый").closest('.flex')
      container?.click()

      expect(onClick).toHaveBeenCalledWith(mockFilter)
    })

    it("should handle drag start in list mode", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const onDragStart = vi.fn()

      const { container } = render(
        <PreviewComponent
          item={mockFilter}
          size="small"
          viewMode="list"
          onDragStart={onDragStart}
        />
      )

      const draggableElement = container.querySelector('[draggable="true"]')
      expect(draggableElement).toBeInTheDocument()
    })

    it("should handle filter without labels", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const filterWithoutLabels = { ...mockFilter, labels: undefined }

      render(
        <PreviewComponent
          item={filterWithoutLabels}
          size="small"
          viewMode="list"
        />
      )

      // Should show name instead of label
      expect(screen.getByText("Тестовый фильтр")).toBeInTheDocument()
    })

    it("should handle filter without description", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const filterWithoutDescription = { ...mockFilter, description: undefined }

      render(
        <PreviewComponent
          item={filterWithoutDescription}
          size="small"
          viewMode="list"
        />
      )

      // Should have empty description
      const descriptionElement = screen.getByText("Тестовый").closest('.flex-1')?.querySelector('.text-muted-foreground')
      expect(descriptionElement?.textContent).toBe("")
    })

    it("should apply correct filter styles to video element", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      const { container } = render(
        <PreviewComponent
          item={mockFilter}
          size="small"
          viewMode="list"
        />
      )

      const video = container.querySelector('video')
      expect(video).toHaveAttribute('src', '/t1.mp4')
      expect(video).toBeTruthy()
      expect(video?.muted).toBe(true)
      expect(video?.getAttribute('preload')).toBe('metadata')
      
      // Check filter style
      const filterStyle = video?.style.filter
      expect(filterStyle).toContain('brightness')
      expect(filterStyle).toContain('contrast')
      expect(filterStyle).toContain('saturate')
      expect(filterStyle).toContain('hue-rotate')
      expect(filterStyle).toContain('sepia') // positive temperature
    })

    it("should handle negative temperature", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const filterWithNegativeTemp = { ...mockFilter, params: { temperature: -20 } }

      const { container } = render(
        <PreviewComponent
          item={filterWithNegativeTemp}
          size="small"
          viewMode="list"
        />
      )

      const video = container.querySelector('video')
      const filterStyle = video?.style.filter
      expect(filterStyle).toContain('hue-rotate(-40deg)') // temperature * 2
    })

    it("should handle zero brightness", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const filterWithZeroBrightness = { ...mockFilter, params: { brightness: -1 } }

      const { container } = render(
        <PreviewComponent
          item={filterWithZeroBrightness}
          size="small"
          viewMode="list"
        />
      )

      const video = container.querySelector('video')
      const filterStyle = video?.style.filter
      expect(filterStyle).toContain('brightness(0)') // Math.max(0, 1 + (-1))
    })
  })

  describe("thumbnails mode", () => {
    it("should render filter in thumbnails mode", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const onClick = vi.fn()

      render(
        <PreviewComponent
          item={mockFilter}
          size="medium"
          viewMode="thumbnails"
          onClick={onClick}
        />
      )

      const preview = screen.getByTestId("filter-preview")
      expect(preview).toBeInTheDocument()
      expect(preview).toHaveStyle({ width: "medium", height: "medium" })
      expect(preview.textContent).toBe("Тестовый фильтр")
    })

    it("should handle size object in thumbnails mode", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      render(
        <PreviewComponent
          item={mockFilter}
          size={{ width: 200, height: 150 }}
          viewMode="thumbnails"
        />
      )

      const preview = screen.getByTestId("filter-preview")
      expect(preview).toHaveStyle({ width: "200px", height: "150px" })
    })

    it("should handle numeric size in thumbnails mode", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      render(
        <PreviewComponent
          item={mockFilter}
          size={100}
          viewMode="thumbnails"
        />
      )

      const preview = screen.getByTestId("filter-preview")
      expect(preview).toHaveStyle({ width: "100px", height: "100px" })
    })

    it("should handle click in thumbnails mode", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const onClick = vi.fn()

      render(
        <PreviewComponent
          item={mockFilter}
          size="medium"
          viewMode="thumbnails"
          onClick={onClick}
        />
      )

      const preview = screen.getByTestId("filter-preview")
      preview.click()

      expect(onClick).toHaveBeenCalledWith(mockFilter)
    })

    it("should handle drag start in thumbnails mode", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const onDragStart = vi.fn()

      const { container } = render(
        <PreviewComponent
          item={mockFilter}
          size="medium"
          viewMode="thumbnails"
          onDragStart={onDragStart}
        />
      )

      const draggableElement = container.querySelector('[draggable="true"]')
      expect(draggableElement).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("should handle filter with empty params", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const filterWithEmptyParams = { ...mockFilter, params: {} }

      const { container } = render(
        <PreviewComponent
          item={filterWithEmptyParams}
          size="small"
          viewMode="list"
        />
      )

      const video = container.querySelector('video')
      expect(video?.style.filter).toBe("")
    })

    it("should handle filter with undefined params", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const filterWithUndefinedParams = { ...mockFilter, params: undefined as any }

      const { container } = render(
        <PreviewComponent
          item={filterWithUndefinedParams}
          size="small"
          viewMode="list"
        />
      )

      const video = container.querySelector('video')
      expect(video?.style.filter).toBe("")
    })

    it("should handle all optional props", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent
      const allHandlers = {
        onClick: vi.fn(),
        onDragStart: vi.fn(),
        onToggleFavorite: vi.fn(),
        onAddToTimeline: vi.fn(),
      }

      render(
        <PreviewComponent
          item={mockFilter}
          size="small"
          viewMode="list"
          isSelected={true}
          isFavorite={true}
          {...allHandlers}
        />
      )

      // Component should render without errors
      expect(screen.getByText("Тестовый")).toBeInTheDocument()
    })
  })
})