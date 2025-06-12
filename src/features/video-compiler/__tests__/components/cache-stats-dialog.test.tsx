import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CacheStatsDialog } from "../../components/cache-stats-dialog"
import * as useCacheStatsModule from "../../hooks/use-cache-stats"
import { CacheStatsWithRatios } from "../../hooks/use-cache-stats"
import { CacheStats } from "../../types/cache"

// Mock translations
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    }),
    Trans: ({ children }: any) => children,
  }
})

// Мокаем хук useCacheStats
vi.mock("../../hooks/use-cache-stats", () => ({
  useCacheStats: vi.fn(),
  formatCacheRatio: vi.fn((ratio: number) => `${(ratio * 100).toFixed(1)}%`),
  formatCacheSize: vi.fn((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }),
}))

// Мокаем sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

describe("CacheStatsDialog", () => {
  const mockCacheStats: CacheStatsWithRatios = {
    total_entries: 235,
    preview_hits: 120,
    preview_misses: 30,
    metadata_hits: 60,
    metadata_misses: 15,
    memory_usage: {
      preview_bytes: 512 * 1024 * 1024,
      metadata_bytes: 64 * 1024 * 1024,
      render_bytes: 448 * 1024 * 1024,
      total_bytes: 1024 * 1024 * 1024,
    },
    cache_size_mb: 1024,
    hit_ratio: 0.8,
    preview_hit_ratio: 0.8,
  }

  const mockUseCacheStats = {
    stats: mockCacheStats,
    isLoading: false,
    error: null,
    refreshStats: vi.fn(),
    clearPreviewCache: vi.fn(),
    clearAllCache: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCacheStatsModule.useCacheStats).mockReturnValue(mockUseCacheStats)
    // Mock window.confirm
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render dialog with cache statistics", () => {
    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText("videoCompiler.cache.statistics")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.cache.management")).toBeInTheDocument()
  })

  it("should not render when closed", () => {
    render(<CacheStatsDialog open={false} onOpenChange={vi.fn()} />)

    expect(screen.queryByText("videoCompiler.cache.statsTitle")).not.toBeInTheDocument()
  })

  it("should show loading state", () => {
    vi.mocked(useCacheStatsModule.useCacheStats).mockReturnValue({
      ...mockUseCacheStats,
      isLoading: true,
      stats: null,
    })

    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    const loaders = screen.getAllByTestId("loader2-icon")
    expect(loaders.length).toBeGreaterThan(0)
  })

  it("should show error state", () => {
    const errorMessage = "Failed to load cache stats"
    vi.mocked(useCacheStatsModule.useCacheStats).mockReturnValue({
      ...mockUseCacheStats,
      error: errorMessage,
      stats: null,
    })

    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.cache.retry")).toBeInTheDocument()
  })

  it("should display total cache size", () => {
    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    // Total memory is shown in metadata section
    expect(screen.getByText(/videoCompiler.cache.memory/)).toBeInTheDocument()
    expect(screen.getByText("1024.0 MB")).toBeInTheDocument()
  })

  it("should display cache breakdown", () => {
    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText("videoCompiler.cache.preview")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.cache.metadata")).toBeInTheDocument()
  })

  it("should display cache efficiency metrics", () => {
    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText("videoCompiler.cache.overallEfficiency")).toBeInTheDocument()
    expect(screen.getByText(/videoCompiler.cache.hitRate/)).toBeInTheDocument()
  })

  it("should refresh stats when refresh button clicked", async () => {
    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    const refreshButton = screen.getByText("videoCompiler.cache.refresh")
    fireEvent.click(refreshButton)

    expect(mockUseCacheStats.refreshStats).toHaveBeenCalled()
  })

  it("should clear all cache when clear all button clicked", async () => {
    const mockOnOpenChange = vi.fn()
    render(<CacheStatsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const clearAllButton = screen.getByText("videoCompiler.cache.clearAll")
    fireEvent.click(clearAllButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith("videoCompiler.cache.confirmClearAll")
      expect(mockUseCacheStats.clearAllCache).toHaveBeenCalled()
    })
  })

  it("should clear preview cache", async () => {
    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    const clearPreviewButton = screen.getByText("videoCompiler.cache.clearPreview")
    fireEvent.click(clearPreviewButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith("videoCompiler.cache.confirmClearPreview")
      expect(mockUseCacheStats.clearPreviewCache).toHaveBeenCalled()
    })
  })

  it("should handle cancel clear all operation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false)

    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    const clearAllButton = screen.getByText("videoCompiler.cache.clearAll")
    fireEvent.click(clearAllButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith("videoCompiler.cache.confirmClearAll")
      expect(mockUseCacheStats.clearAllCache).not.toHaveBeenCalled()
    })
  })

  it("should show progress bars for cache breakdown", () => {
    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    const progressBars = screen.getAllByRole("progressbar")
    expect(progressBars).toHaveLength(1) // Only overall efficiency progress bar
  })

  it("should handle stats with no hits", () => {
    const emptyStats: CacheStatsWithRatios = {
      ...mockCacheStats,
      preview_hits: 0,
      metadata_hits: 0,
      hit_ratio: 0,
      preview_hit_ratio: 0,
    }

    vi.mocked(useCacheStatsModule.useCacheStats).mockReturnValue({
      ...mockUseCacheStats,
      stats: emptyStats,
    })

    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    // There are multiple 0.0% badges, check overall hit rate
    const hitRateBadges = screen.getAllByText("0.0%")
    expect(hitRateBadges.length).toBeGreaterThan(0)
  })

  it("should handle empty cache stats", () => {
    const emptyStats: CacheStatsWithRatios = {
      total_entries: 0,
      preview_hits: 0,
      preview_misses: 0,
      metadata_hits: 0,
      metadata_misses: 0,
      memory_usage: {
        preview_bytes: 0,
        metadata_bytes: 0,
        render_bytes: 0,
        total_bytes: 0,
      },
      cache_size_mb: 0,
      hit_ratio: 0,
      preview_hit_ratio: 0,
    }

    vi.mocked(useCacheStatsModule.useCacheStats).mockReturnValue({
      ...mockUseCacheStats,
      stats: emptyStats,
    })

    render(<CacheStatsDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText("0 MB")).toBeInTheDocument()
  })

  it("should close dialog when close button clicked", () => {
    const mockOnOpenChange = vi.fn()
    render(<CacheStatsDialog open={true} onOpenChange={mockOnOpenChange} />)

    const closeButton = screen.getByText("videoCompiler.cache.close")
    fireEvent.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
