import { beforeEach, describe, expect, it, vi } from "vitest"

import { useFavorites } from "@/features/app-state"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { VideoFilter } from "@/features/filters/types/filters"
import { useProjectSettings } from "@/features/project-settings"
import { renderWithBase, screen } from "@/test/test-utils"

import { FilterList } from "../../components/filter-list"
import { useFilters } from "../../hooks/use-filters"

// Mock external dependencies
vi.mock("@/features/app-state", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/app-state")>()
  return {
    ...actual,
    useFavorites: vi.fn(),
  }
})

vi.mock("@/features/browser/services/browser-state-provider", () => ({
  useBrowserState: vi.fn(),
  PREVIEW_SIZES: [100, 150, 200, 250],
}))

vi.mock("@/features/project-settings", () => ({
  useProjectSettings: vi.fn(),
}))

vi.mock("../../hooks/use-filters", () => ({
  useFilters: vi.fn(),
}))

vi.mock("../../components/filter-preview", () => ({
  FilterPreview: ({ filter, onClick, size, previewWidth, previewHeight }: any) => (
    <div
      data-testid={`filter-preview-${filter.id}`}
      data-size={size}
      data-width={previewWidth}
      data-height={previewHeight}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {filter.name}
    </div>
  ),
}))

vi.mock("@/features/browser/components/content-group", () => ({
  ContentGroup: ({ title, items, renderItem }: any) => (
    <div data-testid="content-group" data-title={title}>
      <div data-testid="content-group-title">{title}</div>
      <div data-testid="content-group-items">
        {items.map((item: any, index: number) => (
          <div key={item.id || index} data-testid={`content-item-${item.id || index}`}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  ),
}))

vi.mock("@/features/browser/components/no-files", () => ({
  NoFiles: ({ type }: { type: string }) => (
    <div data-testid="no-files" data-type={type}>
      No files found
    </div>
  ),
}))

describe("FilterList", () => {
  const mockFilters: VideoFilter[] = [
    {
      id: "brightness-1",
      name: "Brightness Filter",
      category: "color-correction",
      complexity: "basic",
      tags: ["professional", "standard"],
      description: {
        en: "Brightness filter",
      },
      labels: {
        en: "Brightness",
        ru: "Яркость",
      },
      params: {
        brightness: 0.2,
        contrast: 1.1,
      },
    },
    {
      id: "contrast-1",
      name: "Contrast Filter",
      category: "color-correction",
      complexity: "intermediate",
      tags: ["professional"],
      description: {
        en: "Contrast filter",
      },
      labels: {
        en: "Contrast",
        ru: "Контрастность",
      },
      params: {
        contrast: 1.3,
      },
    },
    {
      id: "vintage-1",
      name: "Vintage Filter",
      category: "artistic",
      complexity: "advanced",
      tags: ["vintage", "warm"],
      description: {
        en: "Vintage filter",
      },
      labels: {
        en: "Vintage",
        ru: "Винтаж",
      },
      params: {
        saturation: 0.8,
        temperature: 10,
      },
    },
  ]

  // Setup default mocks
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useFilters).mockReturnValue({
      filters: [],
      loading: false,
      error: null,
    })

    vi.mocked(useFavorites).mockReturnValue({
      isItemFavorite: vi.fn(() => false),
    } as any)

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc" as const,
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 1,
      },
    } as any)

    vi.mocked(useProjectSettings).mockReturnValue({
      settings: {
        aspectRatio: {
          value: { width: 16, height: 9 },
        },
      },
    } as any)
  })

  it("should render loading state", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: [],
      loading: true,
      error: null,
    })

    renderWithBase(<FilterList />)

    expect(screen.getByText("common.loading")).toBeInTheDocument()
  })

  it("should render error state", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: [],
      loading: false,
      error: "Failed to load filters",
    })

    renderWithBase(<FilterList />)

    expect(screen.getByText("Failed to load filters")).toBeInTheDocument()
  })

  it("should render no files message when no filters", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: [],
      loading: false,
      error: null,
    })

    renderWithBase(<FilterList />)

    expect(screen.getByTestId("no-files")).toBeInTheDocument()
    expect(screen.getByTestId("no-files")).toHaveAttribute("data-type", "filters")
  })

  it("should render filters when available", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    renderWithBase(<FilterList />)

    expect(screen.getByTestId("content-group")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-brightness-1")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-contrast-1")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-vintage-1")).toBeInTheDocument()
  })

  it("should filter by search query", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "brightness",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc" as const,
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 1,
      },
    } as any)

    renderWithBase(<FilterList />)

    expect(screen.getByTestId("filter-preview-brightness-1")).toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-contrast-1")).not.toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-vintage-1")).not.toBeInTheDocument()
  })

  it("should filter by complexity", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc" as const,
        groupBy: "none",
        filterType: "basic",
        previewSizeIndex: 1,
      },
    } as any)

    renderWithBase(<FilterList />)

    expect(screen.getByTestId("filter-preview-brightness-1")).toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-contrast-1")).not.toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-vintage-1")).not.toBeInTheDocument()
  })

  it("should filter by category", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc" as const,
        groupBy: "none",
        filterType: "artistic",
        previewSizeIndex: 1,
      },
    } as any)

    renderWithBase(<FilterList />)

    expect(screen.queryByTestId("filter-preview-brightness-1")).not.toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-contrast-1")).not.toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-vintage-1")).toBeInTheDocument()
  })

  it("should show only favorites when enabled", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: true,
        sortBy: "name",
        sortOrder: "asc" as const,
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 1,
      },
    } as any)

    vi.mocked(useFavorites).mockReturnValue({
      isItemFavorite: vi.fn((filter) => filter.id === "brightness-1"),
    } as any)

    renderWithBase(<FilterList />)

    expect(screen.getByTestId("filter-preview-brightness-1")).toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-contrast-1")).not.toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-vintage-1")).not.toBeInTheDocument()
  })

  it("should sort filters by name", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "desc" as const,
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 1,
      },
    } as any)

    renderWithBase(<FilterList />)

    const items = screen.getAllByTestId(/^content-item-/)
    expect(items[0]).toHaveTextContent("Vintage Filter")
    expect(items[1]).toHaveTextContent("Contrast Filter")
    expect(items[2]).toHaveTextContent("Brightness Filter")
  })

  it("should sort filters by complexity", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "complexity",
        sortOrder: "asc" as const,
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 1,
      },
    } as any)

    renderWithBase(<FilterList />)

    const items = screen.getAllByTestId(/^content-item-/)
    expect(items[0]).toHaveTextContent("Brightness Filter") // basic
    expect(items[1]).toHaveTextContent("Contrast Filter") // intermediate
    expect(items[2]).toHaveTextContent("Vintage Filter") // advanced
  })

  it("should group filters by category", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc" as const,
        groupBy: "category",
        filterType: "all",
        previewSizeIndex: 1,
      },
    } as any)

    renderWithBase(<FilterList />)

    const groups = screen.getAllByTestId("content-group")
    expect(groups.length).toBeGreaterThan(1)
  })

  it("should group filters by complexity", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc" as const,
        groupBy: "complexity",
        filterType: "all",
        previewSizeIndex: 1,
      },
    } as any)

    renderWithBase(<FilterList />)

    const groups = screen.getAllByTestId("content-group")
    expect(groups.length).toBeGreaterThan(1)
  })

  it("should calculate correct preview dimensions for 16:9 aspect ratio", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: [mockFilters[0]],
      loading: false,
      error: null,
    })

    renderWithBase(<FilterList />)

    const preview = screen.getByTestId("filter-preview-brightness-1")
    expect(preview).toHaveAttribute("data-width", "150")
    expect(preview).toHaveAttribute("data-height", "84") // 150 / (16/9) = 84.375 → 84
  })

  it("should calculate correct preview dimensions for vertical aspect ratio", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: [mockFilters[0]],
      loading: false,
      error: null,
    })

    vi.mocked(useProjectSettings).mockReturnValue({
      settings: {
        aspectRatio: {
          value: { width: 9, height: 16 },
        },
      },
    } as any)

    renderWithBase(<FilterList />)

    const preview = screen.getByTestId("filter-preview-brightness-1")
    expect(preview).toHaveAttribute("data-width", "84") // 150 * (9/16) = 84.375 → 84
    expect(preview).toHaveAttribute("data-height", "150")
  })

  it("should show no favorites message when no favorites found", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: mockFilters,
      loading: false,
      error: null,
    })

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: true,
        sortBy: "name",
        sortOrder: "asc" as const,
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 1,
      },
    } as any)

    renderWithBase(<FilterList />)

    expect(screen.getByText("browser.media.noFavorites")).toBeInTheDocument()
  })

  it("should handle filter click", () => {
    vi.mocked(useFilters).mockReturnValue({
      filters: [mockFilters[0]],
      loading: false,
      error: null,
    })

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    renderWithBase(<FilterList />)

    const preview = screen.getByTestId("filter-preview-brightness-1")
    preview.click()

    expect(consoleSpy).toHaveBeenCalledWith("Applying filter:", "Brightness Filter", mockFilters[0].params)
    consoleSpy.mockRestore()
  })
})
