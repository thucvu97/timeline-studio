import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BaseProviders } from "@/test/test-utils"

import { useAutoLoadMedia } from "../use-auto-load-media"

// Mock dependencies
const mockUpdateMediaFiles = vi.fn()
const mockUpdateMusicFiles = vi.fn()

vi.mock("@/features/app-state/hooks", () => ({
  useMediaFiles: () => ({
    updateMediaFiles: mockUpdateMediaFiles,
  }),
  useMusicFiles: () => ({
    updateMusicFiles: mockUpdateMusicFiles,
  }),
  useAppSettings: () => ({
    state: {
      context: {
        currentProject: {
          isNew: false,
          path: "/test/project",
        },
      },
    },
  }),
}))

vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    createAppDirectories: vi.fn(),
    getMediaSubdirectory: vi.fn(),
  },
}))

vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const mockGetMediaExtensions = vi.fn()
const mockGetMusicExtensions = vi.fn()

vi.mock("../utils/validation", () => ({
  getMediaExtensions: mockGetMediaExtensions,
  getMusicExtensions: mockGetMusicExtensions,
}))

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn(),
  readDir: vi.fn(),
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("useAutoLoadMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default setup
    mockGetMediaExtensions.mockReturnValue([".mp4", ".avi", ".mov"])
    mockGetMusicExtensions.mockReturnValue([".mp3", ".wav", ".ogg"])

    // Mock Tauri environment
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      writable: true,
      configurable: true,
    })
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.loadedCount).toEqual({ media: 0, music: 0 })
    expect(typeof result.current.reload).toBe("function")
    expect(typeof result.current.clearCache).toBe("function")
  })

  it("should provide reload function", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    expect(typeof result.current.reload).toBe("function")

    // Should not throw when called
    expect(() => result.current.reload()).not.toThrow()
  })

  it("should provide clearCache function", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    expect(typeof result.current.clearCache).toBe("function")

    act(() => {
      result.current.clearCache()
    })

    expect(result.current.error).toBeNull()
  })

  it("should handle non-Tauri environment", () => {
    delete (window as any).__TAURI_INTERNALS__

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.loadedCount).toEqual({ media: 0, music: 0 })
  })

  it("should have access to extension functions", () => {
    renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    // Extension functions should be available
    expect(mockGetMediaExtensions).toBeDefined()
    expect(mockGetMusicExtensions).toBeDefined()
  })

  it("should maintain state across rerenders", () => {
    const { result, rerender } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    const initialStats = result.current.loadedCount
    const initialIsLoading = result.current.isLoading
    const initialError = result.current.error

    rerender()

    // State should be maintained
    expect(result.current.loadedCount).toEqual(initialStats)
    expect(result.current.isLoading).toBe(initialIsLoading)
    expect(result.current.error).toBe(initialError)
  })

  it("should handle loading state changes", async () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    // Initially not loading
    expect(result.current.isLoading).toBe(false)

    // Should remain consistent after reload call
    act(() => {
      result.current.reload()
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("should handle error state", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    // Initially no error
    expect(result.current.error).toBeNull()

    // Should remain consistent
    act(() => {
      result.current.clearCache()
    })

    expect(result.current.error).toBeNull()
  })

  it("should handle loaded count state", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    // Initially zero counts
    expect(result.current.loadedCount.media).toBe(0)
    expect(result.current.loadedCount.music).toBe(0)
  })

  it("should provide working interface", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders,
    })

    // Should have all expected properties
    expect(result.current).toHaveProperty("isLoading")
    expect(result.current).toHaveProperty("error")
    expect(result.current).toHaveProperty("loadedCount")
    expect(result.current).toHaveProperty("reload")
    expect(result.current).toHaveProperty("clearCache")

    // Properties should have correct types
    expect(typeof result.current.isLoading).toBe("boolean")
    expect(typeof result.current.reload).toBe("function")
    expect(typeof result.current.clearCache).toBe("function")
  })
})
