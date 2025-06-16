import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useCacheStatistics } from "@/features/media/hooks/use-cache-statistics"
import { CacheStatistics } from "@/features/media/services/indexeddb-cache-service"

// Мокаем indexedDBCacheService
vi.mock("@/features/media/services/indexeddb-cache-service", () => ({
  indexedDBCacheService: {
    getCacheStatistics: vi.fn(),
  },
}))

describe("useCacheStatistics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should load statistics on mount", async () => {
    const mockStatistics: CacheStatistics = {
      totalEntries: 100,
      totalSize: 1024 * 1024 * 50, // 50MB
      categories: {
        thumbnails: { count: 50, size: 1024 * 1024 * 10 },
        metadata: { count: 30, size: 1024 * 1024 * 5 },
        preview: { count: 20, size: 1024 * 1024 * 35 },
      },
      oldestEntry: new Date("2023-01-01").getTime(),
      newestEntry: new Date("2023-12-31").getTime(),
    }

    const { indexedDBCacheService } = await import("../../services/indexeddb-cache-service")
    vi.mocked(indexedDBCacheService.getCacheStatistics).mockResolvedValue(mockStatistics)

    const { result } = renderHook(() => useCacheStatistics())

    // Изначально должно быть состояние загрузки
    expect(result.current.isLoading).toBe(true)
    expect(result.current.statistics).toBeNull()
    expect(result.current.error).toBeNull()

    // Ждем загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.statistics).toEqual(mockStatistics)
    expect(result.current.error).toBeNull()
    expect(indexedDBCacheService.getCacheStatistics).toHaveBeenCalledOnce()
  })

  it("should handle errors during loading", async () => {
    const mockError = new Error("Database error")
    
    const { indexedDBCacheService } = await import("../../services/indexeddb-cache-service")
    vi.mocked(indexedDBCacheService.getCacheStatistics).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCacheStatistics())

    // Ждем обработки ошибки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.statistics).toBeNull()
    expect(result.current.error).toBe("Database error")
  })

  it("should handle non-Error exceptions", async () => {
    const { indexedDBCacheService } = await import("../../services/indexeddb-cache-service")
    vi.mocked(indexedDBCacheService.getCacheStatistics).mockRejectedValue("String error")

    const { result } = renderHook(() => useCacheStatistics())

    // Ждем обработки ошибки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.statistics).toBeNull()
    expect(result.current.error).toBe("Failed to load cache statistics")
  })

  it("should refetch statistics", async () => {
    const mockStatistics1: CacheStatistics = {
      totalEntries: 50,
      totalSize: 1024 * 1024 * 25,
      categories: {
        thumbnails: { count: 25, size: 1024 * 1024 * 5 },
        metadata: { count: 15, size: 1024 * 1024 * 3 },
        preview: { count: 10, size: 1024 * 1024 * 17 },
      },
      oldestEntry: new Date("2023-01-01").getTime(),
      newestEntry: new Date("2023-06-30").getTime(),
    }

    const mockStatistics2: CacheStatistics = {
      totalEntries: 100,
      totalSize: 1024 * 1024 * 50,
      categories: {
        thumbnails: { count: 50, size: 1024 * 1024 * 10 },
        metadata: { count: 30, size: 1024 * 1024 * 5 },
        preview: { count: 20, size: 1024 * 1024 * 35 },
      },
      oldestEntry: new Date("2023-01-01").getTime(),
      newestEntry: new Date("2023-12-31").getTime(),
    }

    const { indexedDBCacheService } = await import("../../services/indexeddb-cache-service")
    vi.mocked(indexedDBCacheService.getCacheStatistics)
      .mockResolvedValueOnce(mockStatistics1)
      .mockResolvedValueOnce(mockStatistics2)

    const { result } = renderHook(() => useCacheStatistics())

    // Ждем первой загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.statistics).toEqual(mockStatistics1)

    // Вызываем refetch
    act(() => {
      void result.current.refetch()
    })

    // Должно перейти в состояние загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    // Ждем завершения загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.statistics).toEqual(mockStatistics2)
    expect(indexedDBCacheService.getCacheStatistics).toHaveBeenCalledTimes(2)
  })

  it("should clear error on successful refetch", async () => {
    const mockError = new Error("Database error")
    const mockStatistics: CacheStatistics = {
      totalEntries: 10,
      totalSize: 1024 * 1024,
      categories: {
        thumbnails: { count: 5, size: 512 * 1024 },
        metadata: { count: 3, size: 256 * 1024 },
        preview: { count: 2, size: 256 * 1024 },
      },
      oldestEntry: Date.now() - 86400000,
      newestEntry: Date.now(),
    }

    const { indexedDBCacheService } = await import("../../services/indexeddb-cache-service")
    vi.mocked(indexedDBCacheService.getCacheStatistics)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockStatistics)

    const { result } = renderHook(() => useCacheStatistics())

    // Ждем первой загрузки с ошибкой
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Database error")
    expect(result.current.statistics).toBeNull()

    // Вызываем refetch
    act(() => {
      void result.current.refetch()
    })

    // Ждем успешной загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    expect(result.current.statistics).toEqual(mockStatistics)
    expect(result.current.error).toBeNull()
  })

  it("should handle empty statistics", async () => {
    const mockEmptyStatistics: CacheStatistics = {
      totalEntries: 0,
      totalSize: 0,
      categories: {
        thumbnails: { count: 0, size: 0 },
        metadata: { count: 0, size: 0 },
        preview: { count: 0, size: 0 },
      },
      oldestEntry: 0,
      newestEntry: 0,
    }

    const { indexedDBCacheService } = await import("../../services/indexeddb-cache-service")
    vi.mocked(indexedDBCacheService.getCacheStatistics).mockResolvedValue(mockEmptyStatistics)

    const { result } = renderHook(() => useCacheStatistics())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.statistics).toEqual(mockEmptyStatistics)
    expect(result.current.error).toBeNull()
  })

  it("should not update state after unmount", async () => {
    const mockStatistics: CacheStatistics = {
      totalEntries: 10,
      totalSize: 1024 * 1024,
      categories: {
        thumbnails: { count: 5, size: 512 * 1024 },
        metadata: { count: 3, size: 256 * 1024 },
        preview: { count: 2, size: 256 * 1024 },
      },
      oldestEntry: Date.now() - 86400000,
      newestEntry: Date.now(),
    }

    const { indexedDBCacheService } = await import("../../services/indexeddb-cache-service")
    
    // Создаем задержку для симуляции медленной загрузки
    vi.mocked(indexedDBCacheService.getCacheStatistics).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockStatistics), 100))
    )

    const { result, unmount } = renderHook(() => useCacheStatistics())

    // Размонтируем компонент до завершения загрузки
    unmount()

    // Ждем некоторое время
    await new Promise(resolve => setTimeout(resolve, 150))

    // Проверяем, что состояние не изменилось после размонтирования
    expect(result.current.isLoading).toBe(true)
    expect(result.current.statistics).toBeNull()
  })
})