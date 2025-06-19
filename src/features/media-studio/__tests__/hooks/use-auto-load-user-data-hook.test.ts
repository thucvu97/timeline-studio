import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAutoLoadUserData } from "../../hooks/use-auto-load-user-data"

// Mock dependencies
const mockUpdateMediaFiles = vi.fn()
const mockUpdateMusicFiles = vi.fn()
const mockAddEffect = vi.fn()
const mockAddFilter = vi.fn()
const mockAddTransition = vi.fn()
const mockAddSubtitle = vi.fn()
const mockAddStyleTemplate = vi.fn()

vi.mock("@/features/app-state/hooks", () => ({
  useMediaFiles: () => ({
    updateMediaFiles: mockUpdateMediaFiles,
  }),
  useMusicFiles: () => ({
    updateMusicFiles: mockUpdateMusicFiles,
  }),
}))

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addEffect: mockAddEffect,
    addFilter: mockAddFilter,
    addTransition: mockAddTransition,
    addSubtitle: mockAddSubtitle,
    addStyleTemplate: mockAddStyleTemplate,
  }),
}))

vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    createAppDirectories: vi.fn().mockResolvedValue({
      media_dir: "/app/media",
      projects_dir: "/app/projects",
    }),
    getAppDirectories: vi.fn().mockResolvedValue({
      media_dir: "/app/media",
      projects_dir: "/app/projects",
    }),
    getMediaSubdirectory: vi.fn((type: string) => `/app/media/${type}`),
  },
}))

describe("useAutoLoadUserData Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.__TAURI_INTERNALS__ if window exists
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      ;(window as any).__TAURI_INTERNALS__ = undefined
    }
  })

  describe("Basic Hook Functionality", () => {
    it("should return loading state and functions", () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current).toHaveProperty("isLoading")
      expect(result.current).toHaveProperty("loadedData")
      expect(result.current).toHaveProperty("error")
      expect(result.current).toHaveProperty("reload")
      expect(result.current).toHaveProperty("clearCache")

      expect(typeof result.current.reload).toBe("function")
      expect(typeof result.current.clearCache).toBe("function")
    })

    it("should initialize with empty loaded data", () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.loadedData).toEqual({
        media: [],
        music: [],
        effects: [],
        transitions: [],
        filters: [],
        subtitles: [],
        templates: [],
        styleTemplates: [],
      })
    })

    it("should complete loading in web environment", async () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe("Reload Functionality", () => {
    it("should trigger reload when reload function is called", async () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify initial state
      const initialLoadTime = Date.now()

      // Call reload
      const reloadPromise = result.current.reload()

      // The reload function clears cache and re-runs autoLoadUserData
      await reloadPromise

      // After reload completes, loading should be false again
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify reload function returns a promise
      expect(reloadPromise).toBeInstanceOf(Promise)
    })
  })

  describe("Cache Management", () => {
    it("should clear cache without errors", async () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should not throw
      expect(() => result.current.clearCache()).not.toThrow()
    })
  })

  describe("Window Environment Handling", () => {
    it("should handle when Tauri is not available", async () => {
      // Save original __TAURI_INTERNALS__
      const originalTauri = ((window as any).__TAURI_INTERNALS__(
        // Remove Tauri
        window as any,
      ).__TAURI_INTERNALS__ = undefined)

      const { result } = renderHook(() => useAutoLoadUserData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe(null)
      // In non-Tauri environment, it should work as web browser
      expect(result.current.loadedData.media).toHaveLength(0)

      // Restore Tauri
      if (originalTauri) {
        ;(window as any).__TAURI_INTERNALS__ = originalTauri
      }
    })
  })

  describe("SSR Compatibility", () => {
    it("should handle server-side rendering by checking window existence", () => {
      // The hook should check for window existence before using Tauri APIs
      // We'll verify the hook's behavior when window.__TAURI_INTERNALS__ is undefined

      // First, ensure window exists (required by React Testing Library)
      expect(typeof window).toBe("object")

      // Remove Tauri to simulate non-Tauri environment (like SSR)
      const originalTauri = ((window as any).__TAURI_INTERNALS__(window as any).__TAURI_INTERNALS__ = undefined)

      // The hook should work without Tauri
      const { result } = renderHook(() => useAutoLoadUserData())

      // In SSR/non-Tauri environment, it should:
      // 1. Start with loading state
      expect(result.current.isLoading).toBe(true)

      // 2. Have no errors
      expect(result.current.error).toBe(null)

      // 3. Have the correct function exports
      expect(typeof result.current.reload).toBe("function")
      expect(typeof result.current.clearCache).toBe("function")

      // Restore Tauri if it existed
      if (originalTauri) {
        ;(window as any).__TAURI_INTERNALS__ = originalTauri
      }
    })
  })
})
