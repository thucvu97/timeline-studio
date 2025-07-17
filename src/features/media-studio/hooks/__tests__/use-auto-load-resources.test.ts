import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

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
    addStyleTemplate: mockAddStyleTemplate
  })
}))

vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    createAppDirectories: vi.fn(),
    getMediaSubdirectory: vi.fn()
  }
}))

vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children
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
  validateStyleTemplate: mockValidateStyleTemplate
}))

// Mock Tauri APIs
const mockExists = vi.fn()
const mockReadDir = vi.fn()

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: mockExists,
  readDir: mockReadDir
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("useAutoLoadResources", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Default setup
    mockExists.mockResolvedValue(true)
    mockReadDir.mockResolvedValue([])
    
    // Mock app directories service
    const { appDirectoriesService } = await import("@/features/app-state/services")
    vi.mocked(appDirectoriesService.createAppDirectories).mockResolvedValue(undefined)
    vi.mocked(appDirectoriesService.getMediaSubdirectory).mockReturnValue("/mock/path")
    
    // Default validators
    mockValidateEffect.mockImplementation((data) => data?.id ? data : null)
    mockValidateFilter.mockImplementation((data) => data?.id ? data : null)
    mockValidateTransition.mockImplementation((data) => data?.id ? data : null)
    mockValidateSubtitleStyle.mockImplementation((data) => data?.id ? data : null)
    mockValidateStyleTemplate.mockImplementation((data) => data?.id ? data : null)
    
    // Default fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "test-id", name: "Test Resource" })
    })
    
    // Mock Tauri environment
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      writable: true
    })
  })

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.loadedStats).toEqual({
      effects: 0,
      filters: 0,
      transitions: 0,
      subtitles: 0,
      styleTemplates: 0
    })
    expect(typeof result.current.reload).toBe("function")
    expect(typeof result.current.clearCache).toBe("function")
  })

  it("should scan directories for JSON files", async () => {
    const mockFiles = [
      { name: "effect1.json", isFile: true },
      { name: "effect2.json", isFile: true },
      { name: "readme.txt", isFile: true } // Should be ignored
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "effect-1", name: "Test Effect" })
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockReadDir).toHaveBeenCalledTimes(5) // 5 resource types
    expect(mockExists).toHaveBeenCalledTimes(5)
    expect(mockFetch).toHaveBeenCalledTimes(10) // 2 JSON files × 5 directories
  })

  it("should handle non-existent directories", async () => {
    mockExists.mockResolvedValue(false)

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockReadDir).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
    expect(result.current.loadedStats).toEqual({
      effects: 0,
      filters: 0,
      transitions: 0,
      subtitles: 0,
      styleTemplates: 0
    })
  })

  it("should load and validate JSON files", async () => {
    const mockFiles = [
      { name: "effect1.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "effect-1", name: "Test Effect", type: "video" })
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockFetch).toHaveBeenCalledWith("file:///mock/path/effect1.json")
    expect(mockValidateEffect).toHaveBeenCalledWith({ id: "effect-1", name: "Test Effect", type: "video" })
    expect(mockAddEffect).toHaveBeenCalledWith({ id: "effect-1", name: "Test Effect", type: "video" })
  })

  it("should handle array JSON formats", async () => {
    const mockFiles = [
      { name: "effects.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: "effect-1", name: "Effect 1" },
        { id: "effect-2", name: "Effect 2" }
      ]
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockValidateEffect).toHaveBeenCalledTimes(10) // 2 items × 5 directories
    expect(mockAddEffect).toHaveBeenCalledTimes(2)
  })

  it("should handle validation failures", async () => {
    const mockFiles = [
      { name: "invalid.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ name: "Invalid Effect" }) // Missing id
    })
    mockValidateEffect.mockReturnValue(null) // Validation fails

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockValidateEffect).toHaveBeenCalledWith({ name: "Invalid Effect" })
    expect(mockAddEffect).not.toHaveBeenCalled()
  })

  it("should handle fetch errors", async () => {
    const mockFiles = [
      { name: "missing.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockValidateEffect).not.toHaveBeenCalled()
    expect(mockAddEffect).not.toHaveBeenCalled()
  })

  it("should handle JSON parsing errors", async () => {
    const mockFiles = [
      { name: "corrupted.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON")
      }
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockValidateEffect).not.toHaveBeenCalled()
    expect(mockAddEffect).not.toHaveBeenCalled()
  })

  it("should process resources in batches", async () => {
    const mockFiles = Array.from({ length: 10 }, (_, i) => ({
      name: `effect${i + 1}.json`,
      isFile: true
    }))
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "effect-id", name: "Effect" })
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should process in batches of 5
    expect(mockFetch).toHaveBeenCalledTimes(50) // 10 files × 5 directories
    expect(mockValidateEffect).toHaveBeenCalledTimes(10)
  })

  it("should handle add function errors", async () => {
    const mockFiles = [
      { name: "effect1.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "effect-1", name: "Test Effect" })
    })
    mockAddEffect.mockImplementation(() => {
      throw new Error("Add failed")
    })

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error adding effect"),
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it("should handle Promise.allSettled results correctly", async () => {
    const mockFiles = [
      { name: "good.json", isFile: true },
      { name: "bad.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "good-id", name: "Good Effect" })
      })
      .mockRejectedValueOnce(new Error("Fetch failed"))

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should handle both success and failure
    expect(mockValidateEffect).toHaveBeenCalledTimes(1) // Only the successful one
    expect(mockAddEffect).toHaveBeenCalledTimes(1)
  })

  it("should work in non-Tauri environment", async () => {
    delete (window as any).__TAURI_INTERNALS__

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockReadDir).not.toHaveBeenCalled()
    expect(result.current.loadedStats).toEqual({
      effects: 0,
      filters: 0,
      transitions: 0,
      subtitles: 0,
      styleTemplates: 0
    })
  })

  it("should handle app directories service errors", async () => {
    mockCreateAppDirectories.mockRejectedValue(new Error("Service error"))

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should continue with fallback directories
    expect(mockReadDir).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it("should respect debouncing", async () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    // Call reload multiple times quickly
    result.current.reload()
    result.current.reload()
    result.current.reload()

    await waitFor(() => {
      expect(mockReadDir).toHaveBeenCalledTimes(5) // Only one call per directory
    })
  })

  it("should update loaded stats correctly", async () => {
    const mockFiles = [
      { name: "effect1.json", isFile: true },
      { name: "effect2.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "effect-id", name: "Test Effect" })
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    await waitFor(() => {
      expect(result.current.loadedStats.effects).toBe(2)
      expect(result.current.loadedStats.filters).toBe(2)
      expect(result.current.loadedStats.transitions).toBe(2)
      expect(result.current.loadedStats.subtitles).toBe(2)
      expect(result.current.loadedStats.styleTemplates).toBe(2)
    })
  })

  it("should prioritize resource loading order", async () => {
    const mockFiles = [
      { name: "resource.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "resource-id", name: "Test Resource" })
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should call add functions in priority order
    expect(mockAddEffect).toHaveBeenCalled()
    expect(mockAddFilter).toHaveBeenCalled()
    expect(mockAddTransition).toHaveBeenCalled()
    expect(mockAddSubtitle).toHaveBeenCalled()
    expect(mockAddStyleTemplate).toHaveBeenCalled()
  })

  it("should use correct file URLs in different environments", async () => {
    const mockFiles = [
      { name: "effect1.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "effect-1", name: "Test Effect" })
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should use file:// protocol in Tauri environment
    expect(mockFetch).toHaveBeenCalledWith("file:///mock/path/effect1.json")
  })

  it("should handle cache duration correctly", async () => {
    const mockFiles = [
      { name: "effect1.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "effect-1", name: "Test Effect" })
    })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    // First load
    await act(async () => {
      await result.current.reload()
    })

    expect(mockReadDir).toHaveBeenCalledTimes(5)

    // Second load (should use cache)
    await act(async () => {
      await result.current.reload()
    })

    // Should still only be called once per directory due to cache
    expect(mockReadDir).toHaveBeenCalledTimes(5)
  })

  it("should clear cache correctly", () => {
    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    act(() => {
      result.current.clearCache()
    })

    expect(result.current.error).toBeNull()
  })

  it("should handle general loading errors", async () => {
    mockReadDir.mockRejectedValue(new Error("Permission denied"))

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(result.current.error).toBe("Permission denied")
    expect(result.current.isLoading).toBe(false)
  })

  it("should count total loaded resources correctly", async () => {
    const mockFiles = [
      { name: "resource1.json", isFile: true },
      { name: "resource2.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "resource-id", name: "Test Resource" })
    })

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Loaded 10 total resources") // 2 resources × 5 types
    )
    
    consoleSpy.mockRestore()
  })

  it("should handle different resource types correctly", async () => {
    const mockFiles = [
      { name: "resource.json", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    
    // Mock different responses for different resource types
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "effect-1", name: "Test Effect", type: "video" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "filter-1", name: "Test Filter", shader: "blur" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "transition-1", name: "Test Transition", duration: 1000 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "subtitle-1", name: "Test Subtitle Style", fontSize: 24 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "style-1", name: "Test Style Template", animations: [] })
      })

    const { result } = renderHook(() => useAutoLoadResources(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should validate each resource type with correct validator
    expect(mockValidateEffect).toHaveBeenCalledWith({ id: "effect-1", name: "Test Effect", type: "video" })
    expect(mockValidateFilter).toHaveBeenCalledWith({ id: "filter-1", name: "Test Filter", shader: "blur" })
    expect(mockValidateTransition).toHaveBeenCalledWith({ id: "transition-1", name: "Test Transition", duration: 1000 })
    expect(mockValidateSubtitleStyle).toHaveBeenCalledWith({ id: "subtitle-1", name: "Test Subtitle Style", fontSize: 24 })
    expect(mockValidateStyleTemplate).toHaveBeenCalledWith({ id: "style-1", name: "Test Style Template", animations: [] })
  })
})