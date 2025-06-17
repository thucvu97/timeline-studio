import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/test-utils"

import { CacheStatisticsModal } from "../cache-statistics-modal"

// Мокаем хук useCacheStats
vi.mock("../../hooks/use-cache-stats", () => ({
  useCacheStats: vi.fn(() => ({
    stats: {
      hit_ratio: 0.75,
      preview_hits: 150,
      preview_misses: 50,
      preview_hit_ratio: 0.75,
      metadata_hits: 200,
      metadata_misses: 100,
      metadata_hit_ratio: 0.67,
      memory_usage: {
        total_bytes: 52428800, // 50 MB
        preview_bytes: 31457280, // 30 MB
        metadata_bytes: 20971520, // 20 MB
      },
    },
    isLoading: false,
    error: null,
    refreshStats: vi.fn(),
    clearPreviewCache: vi.fn(),
    clearAllCache: vi.fn(),
  })),
  formatCacheRatio: vi.fn((ratio) => `${(ratio * 100).toFixed(1)}%`),
}))

describe("CacheStatisticsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен отображать общую эффективность кэша", () => {
    renderWithProviders(<CacheStatisticsModal />)
    
    expect(screen.getByText("videoCompiler.cache.overallEfficiency")).toBeInTheDocument()
    expect(screen.getAllByText("75.0%")).toHaveLength(2) // overall and preview efficiency
  })

  it("должен отображать статистику превью", () => {
    renderWithProviders(<CacheStatisticsModal />)
    
    // Заголовок
    expect(screen.getByText("videoCompiler.cache.preview")).toBeInTheDocument()
    
    // Статистика
    expect(screen.getByText("150")).toBeInTheDocument() // hits
    expect(screen.getByText("50")).toBeInTheDocument() // misses
    expect(screen.getAllByText("75.0%")).toHaveLength(2) // overall and preview efficiency
  })

  it("должен отображать статистику метаданных", () => {
    renderWithProviders(<CacheStatisticsModal />)
    
    // Заголовок
    expect(screen.getByText("videoCompiler.cache.metadata")).toBeInTheDocument()
    
    // Статистика
    expect(screen.getByText("200")).toBeInTheDocument() // hits
    expect(screen.getByText("100")).toBeInTheDocument() // misses
    expect(screen.getByText("50.0 MB")).toBeInTheDocument() // memory usage
  })

  it("должен отображать прогресс бар для hit rate", () => {
    renderWithProviders(<CacheStatisticsModal />)
    
    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute("aria-valuenow", "75")
  })

  it("должен очищать кэш превью при подтверждении", async () => {
    const { useCacheStats } = await import("../../hooks/use-cache-stats")
    const mockUseCacheStats = vi.mocked(useCacheStats)
    const mockClearPreviewCache = vi.fn()
    
    mockUseCacheStats.mockReturnValue({
      stats: {
        hit_ratio: 0.75,
        preview_hits: 150,
        preview_misses: 50,
        preview_hit_ratio: 0.75,
        metadata_hits: 200,
        metadata_misses: 100,
        metadata_hit_ratio: 0.67,
        memory_usage: {
          total_bytes: 52428800,
          preview_bytes: 31457280,
          metadata_bytes: 20971520,
        },
      },
      isLoading: false,
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: mockClearPreviewCache,
      clearAllCache: vi.fn(),
    })
    
    renderWithProviders(<CacheStatisticsModal />)
    
    const clearPreviewButton = screen.getByText("videoCompiler.cache.clearPreview")
    
    // Мокаем window.confirm
    window.confirm = vi.fn().mockReturnValue(true)
    
    await act(async () => {
      fireEvent.click(clearPreviewButton)
    })
    
    expect(window.confirm).toHaveBeenCalledWith("videoCompiler.cache.confirmClearPreview")
    expect(mockClearPreviewCache).toHaveBeenCalled()
  })

  it("не должен очищать кэш при отмене", async () => {
    const { useCacheStats } = await import("../../hooks/use-cache-stats")
    const mockUseCacheStats = vi.mocked(useCacheStats)
    const mockClearPreviewCache = vi.fn()
    
    mockUseCacheStats.mockReturnValue({
      stats: {
        hit_ratio: 0.75,
        preview_hits: 150,
        preview_misses: 50,
        preview_hit_ratio: 0.75,
        metadata_hits: 200,
        metadata_misses: 100,
        metadata_hit_ratio: 0.67,
        memory_usage: null,
      },
      isLoading: false,
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: mockClearPreviewCache,
      clearAllCache: vi.fn(),
    })
    
    renderWithProviders(<CacheStatisticsModal />)
    
    const clearPreviewButton = screen.getByText("videoCompiler.cache.clearPreview")
    
    // Мокаем window.confirm для отмены
    window.confirm = vi.fn().mockReturnValue(false)
    
    await act(async () => {
      fireEvent.click(clearPreviewButton)
    })
    
    expect(window.confirm).toHaveBeenCalled()
    expect(mockClearPreviewCache).not.toHaveBeenCalled()
  })

  it("должен обновлять статистику при клике на refresh", async () => {
    const { useCacheStats } = await import("../../hooks/use-cache-stats")
    const mockUseCacheStats = vi.mocked(useCacheStats)
    const mockRefreshStats = vi.fn()
    
    mockUseCacheStats.mockReturnValue({
      stats: {
        hit_ratio: 0.75,
        preview_hits: 150,
        preview_misses: 50,
        preview_hit_ratio: 0.75,
        metadata_hits: 200,
        metadata_misses: 100,
        metadata_hit_ratio: 0.67,
        memory_usage: null,
      },
      isLoading: false,
      error: null,
      refreshStats: mockRefreshStats,
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })
    
    renderWithProviders(<CacheStatisticsModal />)
    
    const refreshButton = screen.getByText("videoCompiler.cache.refresh")
    
    await act(async () => {
      fireEvent.click(refreshButton)
    })
    
    expect(mockRefreshStats).toHaveBeenCalled()
  })

  it("должен отображать состояние загрузки", async () => {
    const { useCacheStats } = await import("../../hooks/use-cache-stats")
    const mockUseCacheStats = vi.mocked(useCacheStats)
    
    mockUseCacheStats.mockReturnValue({
      stats: null,
      isLoading: true,
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })
    
    renderWithProviders(<CacheStatisticsModal />)
    
    // Должен показывать спиннер
    expect(screen.getByTestId("loader2-icon")).toBeInTheDocument()
  })

  it("должен отображать ошибку", async () => {
    const { useCacheStats } = await import("../../hooks/use-cache-stats")
    const mockUseCacheStats = vi.mocked(useCacheStats)
    
    mockUseCacheStats.mockReturnValue({
      stats: null,
      isLoading: false,
      error: "Failed to load cache statistics",
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })
    
    renderWithProviders(<CacheStatisticsModal />)
    
    expect(screen.getByText("Failed to load cache statistics")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.cache.retry")).toBeInTheDocument()
  })

  it("должен отображать сообщение когда нет данных", async () => {
    const { useCacheStats } = await import("../../hooks/use-cache-stats")
    const mockUseCacheStats = vi.mocked(useCacheStats)
    
    mockUseCacheStats.mockReturnValue({
      stats: null,
      isLoading: false,
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })
    
    renderWithProviders(<CacheStatisticsModal />)
    
    expect(screen.getByText("videoCompiler.cache.noData")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.cache.loadData")).toBeInTheDocument()
  })

  it("должен применять правильные стили для эффективности кэша", async () => {
    const { useCacheStats } = await import("../../hooks/use-cache-stats")
    const mockUseCacheStats = vi.mocked(useCacheStats)
    
    mockUseCacheStats.mockReturnValue({
      stats: {
        hit_ratio: 0.75,
        preview_hits: 150,
        preview_misses: 50,
        preview_hit_ratio: 0.75,
        metadata_hits: 200,
        metadata_misses: 100,
        metadata_hit_ratio: 0.67,
        memory_usage: {
          total_bytes: 52428800,
          preview_bytes: 31457280,
          metadata_bytes: 20971520,
        },
      },
      isLoading: false,
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })
    
    renderWithProviders(<CacheStatisticsModal />)
    
    // Находим badge с эффективностью превью (75%)
    const efficiencyBadges = screen.getAllByText("75.0%")
    const previewEfficiencyBadge = efficiencyBadges[1] // второй - это эффективность превью
    
    // Должен иметь зеленый цвет для высокой эффективности (>70%)
    expect(previewEfficiencyBadge).toHaveClass("border-green-600")
  })

  it("должен отключать кнопку refresh во время загрузки", async () => {
    const { useCacheStats } = await import("../../hooks/use-cache-stats")
    const mockUseCacheStats = vi.mocked(useCacheStats)
    
    mockUseCacheStats.mockReturnValue({
      stats: {
        hit_ratio: 0.75,
        preview_hits: 150,
        preview_misses: 50,
        preview_hit_ratio: 0.75,
        metadata_hits: 200,
        metadata_misses: 100,
        metadata_hit_ratio: 0.67,
        memory_usage: null,
      },
      isLoading: true, // Загрузка в процессе
      error: null,
      refreshStats: vi.fn(),
      clearPreviewCache: vi.fn(),
      clearAllCache: vi.fn(),
    })
    
    renderWithProviders(<CacheStatisticsModal />)
    
    const refreshButton = screen.getByText("videoCompiler.cache.refresh")
    expect(refreshButton).toBeDisabled()
  })
})