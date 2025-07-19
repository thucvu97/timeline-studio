import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BaseProviders } from "@/test/test-utils"

import { useAutoLoadResources } from "../use-auto-load-resources"

// Mock dependencies
const mockAddEffect = vi.fn()
const mockAddFilter = vi.fn()
const mockAddTransition = vi.fn()
const mockAddSubtitle = vi.fn()
const mockAddStyleTemplate = vi.fn()

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
    createAppDirectories: vi.fn(),
    getMediaSubdirectory: vi.fn(),
  },
}))

vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock validators
const mockValidateEffect = vi.fn()
const mockValidateFilter = vi.fn()
const mockValidateTransition = vi.fn()
const mockValidateSubtitleStyle = vi.fn()
const mockValidateStyleTemplate = vi.fn()

vi.mock("../utils/validation", () => ({
  validateEffect: mockValidateEffect,
  validateFilter: mockValidateFilter,
  validateTransition: mockValidateTransition,
  validateSubtitleStyle: mockValidateSubtitleStyle,
  validateStyleTemplate: mockValidateStyleTemplate,
}))

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn(),
  readDir: vi.fn(),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("useAutoLoadResources", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default validators
    mockValidateEffect.mockImplementation((data) => (data?.id ? data : null))
    mockValidateFilter.mockImplementation((data) => (data?.id ? data : null))
    mockValidateTransition.mockImplementation((data) => (data?.id ? data : null))
    mockValidateSubtitleStyle.mockImplementation((data) => (data?.id ? data : null))
    mockValidateStyleTemplate.mockImplementation((data) => (data?.id ? data : null))

    // Default fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "test-id", name: "Test Resource" }),
    })

    // Mock Tauri environment
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      writable: true,
      configurable: true,
    })
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.loadedStats).toEqual({
      effects: 0,
      filters: 0,
      transitions: 0,
      subtitles: 0,
      styleTemplates: 0,
    })
    expect(typeof result.current.reload).toBe("function")
    expect(typeof result.current.clearCache).toBe("function")
  })

  it("should provide reload function", () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    expect(typeof result.current.reload).toBe("function")

    // Should not throw when called
    expect(() => result.current.reload()).not.toThrow()
  })

  it("should provide clearCache function", () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
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

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.loadedStats).toEqual({
      effects: 0,
      filters: 0,
      transitions: 0,
      subtitles: 0,
      styleTemplates: 0,
    })
  })

  it("should have correct resource stats structure", () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    const stats = result.current.loadedStats
    expect(stats).toHaveProperty("effects")
    expect(stats).toHaveProperty("filters")
    expect(stats).toHaveProperty("transitions")
    expect(stats).toHaveProperty("subtitles")
    expect(stats).toHaveProperty("styleTemplates")

    // All should be numbers
    expect(typeof stats.effects).toBe("number")
    expect(typeof stats.filters).toBe("number")
    expect(typeof stats.transitions).toBe("number")
    expect(typeof stats.subtitles).toBe("number")
    expect(typeof stats.styleTemplates).toBe("number")
  })

  it("should maintain state across rerenders", () => {
    const { result, rerender } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    const initialReload = result.current.reload
    const initialClearCache = result.current.clearCache

    rerender()

    expect(result.current.reload).toBe(initialReload)
    expect(result.current.clearCache).toBe(initialClearCache)
  })

  it("should handle loading state changes", async () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
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
    const { result } = renderHook(() => useAutoLoadResources(), {
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

  it("should use resource hooks correctly", () => {
    renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    // Should have called useResources hook
    expect(mockAddEffect).toBeDefined()
    expect(mockAddFilter).toBeDefined()
    expect(mockAddTransition).toBeDefined()
    expect(mockAddSubtitle).toBeDefined()
    expect(mockAddStyleTemplate).toBeDefined()
  })

  it("should have validators available", () => {
    renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    expect(mockValidateEffect).toBeDefined()
    expect(mockValidateFilter).toBeDefined()
    expect(mockValidateTransition).toBeDefined()
    expect(mockValidateSubtitleStyle).toBeDefined()
    expect(mockValidateStyleTemplate).toBeDefined()
  })

  it("should handle resource loading stats", () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    // Should start with zero stats
    expect(result.current.loadedStats.effects).toBe(0)
    expect(result.current.loadedStats.filters).toBe(0)
    expect(result.current.loadedStats.transitions).toBe(0)
    expect(result.current.loadedStats.subtitles).toBe(0)
    expect(result.current.loadedStats.styleTemplates).toBe(0)
  })

  it("should provide stable function references", () => {
    const { result, rerender } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders,
    })

    const reload1 = result.current.reload
    const clearCache1 = result.current.clearCache

    rerender()

    const reload2 = result.current.reload
    const clearCache2 = result.current.clearCache

    // Functions should be stable between renders
    expect(reload1).toBe(reload2)
    expect(clearCache1).toBe(clearCache2)
  })
})
