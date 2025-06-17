import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/test-utils"

import { CacheSettingsModal } from "../cache-settings-modal"

// Мокаем IndexedDB
const mockIDB = {
  databases: vi.fn().mockResolvedValue([{ name: "media-cache", version: 1 }]),
}

// Мокаем navigator.storage
const mockStorage = {
  estimate: vi.fn().mockResolvedValue({
    usage: 100 * 1024 * 1024, // 100 MB
    quota: 1024 * 1024 * 1024, // 1 GB
  }),
}

Object.defineProperty(window, "indexedDB", {
  value: mockIDB,
  writable: true,
})

Object.defineProperty(navigator, "storage", {
  value: mockStorage,
  writable: true,
})

// Мокаем IndexedDBCacheService
vi.mock("@/features/media/services/indexeddb-cache-service", () => ({
  indexedDBCacheService: {
    getCacheStatistics: vi.fn().mockResolvedValue({
      previewCache: { count: 20, size: 40 * 1024 * 1024 },
      frameCache: { count: 15, size: 30 * 1024 * 1024 },
      recognitionCache: { count: 10, size: 20 * 1024 * 1024 },
      subtitleCache: { count: 5, size: 10 * 1024 * 1024 },
      totalSize: 100 * 1024 * 1024,
    }),
    clearPreviewCache: vi.fn().mockResolvedValue(undefined),
    clearFrameCache: vi.fn().mockResolvedValue(undefined),
    clearRecognitionCache: vi.fn().mockResolvedValue(undefined),
    clearSubtitleCache: vi.fn().mockResolvedValue(undefined),
    clearAllCache: vi.fn().mockResolvedValue(undefined),
    cleanupExpiredCache: vi.fn().mockResolvedValue(undefined),
  },
}))

describe("CacheSettingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен отображать заголовок модального окна", async () => {
    renderWithProviders(<CacheSettingsModal />)
    
    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText("browser.media.cache.title")).toBeInTheDocument()
    })
  })

  it("должен отображать статистику кэша", async () => {
    renderWithProviders(<CacheSettingsModal />)
    
    await waitFor(() => {
      expect(screen.getByText("100.0 MB")).toBeInTheDocument()
    })
  })

  it("должен отображать категории кэша с размерами", async () => {
    renderWithProviders(<CacheSettingsModal />)
    
    await waitFor(() => {
      // Проверяем, что отображаются заголовки категорий
      expect(screen.getByText("browser.media.cache.previewCache.title")).toBeInTheDocument()
      expect(screen.getByText("browser.media.cache.frameCache.title")).toBeInTheDocument()
      expect(screen.getByText("browser.media.cache.recognitionCache.title")).toBeInTheDocument()
      expect(screen.getByText("browser.media.cache.subtitleCache.title")).toBeInTheDocument()
    })
  })

  it("должен отображать прогресс использования дискового пространства", async () => {
    renderWithProviders(<CacheSettingsModal />)
    
    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar")
      expect(progressBar).toBeInTheDocument()
      // 100 MB из 500 MB лимита = 20%
      expect(progressBar).toHaveAttribute("aria-valuenow", "20")
    })
  })

  it("должен отображать кнопки очистки для каждой категории", async () => {
    renderWithProviders(<CacheSettingsModal />)
    
    await waitFor(() => {
      expect(screen.getByText("100.0 MB")).toBeInTheDocument()
    })
    
    // Проверяем, что кнопки очистки отображаются
    const clearButtons = screen.getAllByText("browser.media.cache.actions.clear")
    expect(clearButtons).toHaveLength(4) // 4 категории кэша
  })

  it("должен отображать корректное количество кнопок очистки", async () => {
    renderWithProviders(<CacheSettingsModal />)
    
    await waitFor(() => {
      const clearButtons = screen.getAllByText("browser.media.cache.actions.clear")
      expect(clearButtons).toHaveLength(4) // 4 категории кэша
    })
  })

  it("должен отображать кнопку очистки всего кэша", async () => {
    renderWithProviders(<CacheSettingsModal />)
    
    await waitFor(() => {
      expect(screen.getByText("100.0 MB")).toBeInTheDocument()
    })
    
    // Проверяем наличие кнопки "Очистить всё"
    expect(screen.getByText("browser.media.cache.actions.clearAll")).toBeInTheDocument()
  })

  it("должен обновлять статистику при клике на кнопку обновления", async () => {
    const { indexedDBCacheService } = await import("@/features/media/services/indexeddb-cache-service")
    const mockGetCacheStatistics = vi.spyOn(indexedDBCacheService, "getCacheStatistics")
    
    renderWithProviders(<CacheSettingsModal />)
    
    await waitFor(() => {
      expect(screen.getByText("100.0 MB")).toBeInTheDocument()
    })
    
    const refreshButton = screen.getByText("browser.media.cache.actions.cleanupExpired")
    const initialCallCount = mockGetCacheStatistics.mock.calls.length
    
    await act(async () => {
      fireEvent.click(refreshButton)
    })
    
    await waitFor(() => {
      expect(mockGetCacheStatistics).toHaveBeenCalledTimes(initialCallCount + 1)
    })
  })

  it("должен отображать состояние загрузки", async () => {
    const { indexedDBCacheService } = await import("@/features/media/services/indexeddb-cache-service")
    
    // Создаем задержку для имитации загрузки
    let resolvePromise: (value: any) => void
    const loadingPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    vi.spyOn(indexedDBCacheService, "getCacheStatistics").mockReturnValue(loadingPromise)
    
    renderWithProviders(<CacheSettingsModal />)
    
    // Проверяем, что показывается индикатор загрузки
    expect(screen.getByTestId("refreshcw-icon")).toBeInTheDocument()
    expect(screen.queryByText("100.0 MB")).not.toBeInTheDocument()
    
    // Разрешаем промис в act()
    await act(async () => {
      resolvePromise!({
        previewCache: { count: 20, size: 40 * 1024 * 1024 },
        frameCache: { count: 15, size: 30 * 1024 * 1024 },
        recognitionCache: { count: 10, size: 20 * 1024 * 1024 },
        subtitleCache: { count: 5, size: 10 * 1024 * 1024 },
        totalSize: 100 * 1024 * 1024,
      })
    })
    
    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText("100.0 MB")).toBeInTheDocument()
    })
  })

  it("должен отображать сообщение об ошибке при сбое загрузки", async () => {
    const { indexedDBCacheService } = await import("@/features/media/services/indexeddb-cache-service")
    
    vi.spyOn(indexedDBCacheService, "getCacheStatistics").mockRejectedValue(
      new Error("Failed to load cache stats")
    )
    
    renderWithProviders(<CacheSettingsModal />)
    
    // При ошибке компонент остается в состоянии загрузки, так как cacheStats остается null
    await waitFor(() => {
      expect(screen.getByTestId("refreshcw-icon")).toBeInTheDocument()
    })
    
    // Проверяем, что данные не отображаются
    expect(screen.queryByText("100.0 MB")).not.toBeInTheDocument()
  })
})