import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePrerender, usePrerenderCache } from "../../hooks/use-prerender"
import * as videoCompilerService from "../../services/video-compiler-service"

// Мокаем зависимости
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => (params ? `${key}: ${JSON.stringify(params)}` : key),
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: vi.fn(),
}))

vi.mock("@/features/timeline/utils/timeline-to-project", () => ({
  timelineToProjectSchema: vi.fn((project) => ({
    ...project,
    version: "1.0.0",
  })),
}))

vi.mock("@/features/export/utils/project-schema-builder", () => ({
  ProjectSchemaBuilder: {
    createForPreview: vi.fn((project) => ({
      ...project,
      version: "1.0.0",
      settings: {
        preview: {
          resolution: [1280, 720],
          fps: 30,
          quality: 75,
        },
        export: {
          format: "Mp4",
          quality: 85,
          video_bitrate: 8000,
          audio_bitrate: 192,
          hardware_acceleration: true,
          ffmpeg_args: [],
        },
        custom: {},
      },
    })),
  },
}))

vi.mock("../../services/video-compiler-service", () => ({
  prerenderSegment: vi.fn(),
  getPrerenderCacheInfo: vi.fn(),
  clearPrerenderCache: vi.fn(),
}))

describe("usePrerender", () => {
  let mockUseTimeline: any
  let mockToast: any

  const mockProject = {
    id: "test-project",
    name: "Test Project",
    tracks: [],
    clips: [],
  }

  const mockPrerenderResult = {
    filePath: "/tmp/prerender/segment_001.mp4",
    duration: 10.5,
    fileSize: 5242880, // 5MB
    renderTimeMs: 2500,
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    const { useTimeline } = vi.mocked(await import("@/features/timeline/hooks/use-timeline"))
    mockUseTimeline = vi.mocked(useTimeline)
    mockUseTimeline.mockReturnValue({ project: mockProject })

    const { toast } = await import("sonner")
    mockToast = vi.mocked(toast)
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => usePrerender())

    expect(result.current.isRendering).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.currentResult).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it("should prerender segment successfully", async () => {
    vi.mocked(videoCompilerService.prerenderSegment).mockResolvedValueOnce(mockPrerenderResult)

    const { result } = renderHook(() => usePrerender())

    const prerenderResult = await act(async () => {
      return result.current.prerender(0, 10.5, true, 75)
    })

    expect(prerenderResult).toEqual(mockPrerenderResult)
    expect(result.current.isRendering).toBe(false)
    expect(result.current.progress).toBe(100)
    expect(result.current.currentResult).toEqual(mockPrerenderResult)
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining("videoCompiler.prerender.completed"))
  })

  it("should handle prerender error", async () => {
    const errorMessage = "Failed to prerender"
    vi.mocked(videoCompilerService.prerenderSegment).mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => usePrerender())

    const prerenderResult = await act(async () => {
      return result.current.prerender(0, 10.5)
    })

    expect(prerenderResult).toBeNull()
    expect(result.current.isRendering).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBe(errorMessage)
    expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining("videoCompiler.prerender.error"))
  })

  it("should use default options when not provided", async () => {
    vi.mocked(videoCompilerService.prerenderSegment).mockResolvedValueOnce(mockPrerenderResult)

    const { result } = renderHook(() => usePrerender())

    await act(async () => {
      await result.current.prerender(0, 10.5)
    })

    expect(videoCompilerService.prerenderSegment).toHaveBeenCalledWith({
      projectSchema: expect.objectContaining({ version: "1.0.0" }),
      startTime: 0,
      endTime: 10.5,
      applyEffects: true,
      quality: 75,
    })
  })

  it("should show loading state during prerender", async () => {
    let resolvePrerender: any
    const prerenderPromise = new Promise((resolve) => {
      resolvePrerender = resolve
    })
    vi.mocked(videoCompilerService.prerenderSegment).mockReturnValueOnce(prerenderPromise as any)

    const { result } = renderHook(() => usePrerender())

    act(() => {
      void result.current.prerender(0, 10.5)
    })

    expect(result.current.isRendering).toBe(true)
    expect(result.current.progress).toBe(0)

    await act(async () => {
      resolvePrerender(mockPrerenderResult)
      await prerenderPromise
    })

    expect(result.current.isRendering).toBe(false)
    expect(result.current.progress).toBe(100)
  })

  it("should clear result", () => {
    const { result } = renderHook(() => usePrerender())

    // Set some state first
    act(() => {
      result.current.clearResult()
    })

    expect(result.current.currentResult).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it("should handle concurrent prerender requests", async () => {
    vi.mocked(videoCompilerService.prerenderSegment).mockResolvedValue(mockPrerenderResult)

    const { result } = renderHook(() => usePrerender())

    // Start multiple prerenders
    const promises = await act(async () => {
      return Promise.all([result.current.prerender(0, 5), result.current.prerender(5, 10)])
    })

    expect(promises).toHaveLength(2)
    expect(videoCompilerService.prerenderSegment).toHaveBeenCalledTimes(2)
  })

  it("should show toast notifications", async () => {
    vi.mocked(videoCompilerService.prerenderSegment).mockResolvedValueOnce(mockPrerenderResult)

    const { result } = renderHook(() => usePrerender())

    await act(async () => {
      await result.current.prerender(0, 10.5)
    })

    expect(mockToast.success).toHaveBeenCalled()
  })

  it("should handle different segment configurations", async () => {
    vi.mocked(videoCompilerService.prerenderSegment).mockResolvedValue(mockPrerenderResult)

    const { result } = renderHook(() => usePrerender())

    // Test with effects disabled
    await act(async () => {
      await result.current.prerender(0, 5, false, 90)
    })

    expect(videoCompilerService.prerenderSegment).toHaveBeenCalledWith({
      projectSchema: expect.anything(),
      startTime: 0,
      endTime: 5,
      applyEffects: false,
      quality: 90,
    })
  })

  it("should reset error on new prerender", async () => {
    // First, trigger an error
    vi.mocked(videoCompilerService.prerenderSegment).mockRejectedValueOnce(new Error("Error"))

    const { result } = renderHook(() => usePrerender())

    await act(async () => {
      await result.current.prerender(0, 10.5)
    })

    expect(result.current.error).toBeDefined()

    // Then, successful prerender
    vi.mocked(videoCompilerService.prerenderSegment).mockResolvedValueOnce(mockPrerenderResult)

    await act(async () => {
      await result.current.prerender(0, 10.5)
    })

    expect(result.current.error).toBeUndefined()
  })

  it("should validate time range", async () => {
    const { result } = renderHook(() => usePrerender())

    // Invalid time range
    const resultInvalid = await act(async () => {
      return result.current.prerender(10, 5)
    })

    expect(resultInvalid).toBeNull()
    expect(mockToast.error).toHaveBeenCalledWith("videoCompiler.prerender.invalidTimeRange")
  })

  it("should validate duration limit", async () => {
    const { result } = renderHook(() => usePrerender())

    // Duration > 60 seconds
    const resultTooLong = await act(async () => {
      return result.current.prerender(0, 65)
    })

    expect(resultTooLong).toBeNull()
    expect(mockToast.error).toHaveBeenCalledWith("videoCompiler.prerender.limitExceeded")
  })

  it("should handle missing project", async () => {
    mockUseTimeline.mockReturnValue({ project: null })

    const { result } = renderHook(() => usePrerender())

    const resultNoProject = await act(async () => {
      return result.current.prerender(0, 10)
    })

    expect(resultNoProject).toBeNull()
    expect(mockToast.error).toHaveBeenCalledWith("videoCompiler.prerender.projectNotLoaded")
  })
})

describe("usePrerenderCache", () => {
  const mockCacheInfo = {
    files: [
      {
        path: "/tmp/cache/segment1.mp4",
        startTime: 0,
        endTime: 5,
        size: 1024 * 1024, // 1MB
        lastUsed: Date.now(),
        hash: "hash1",
      },
      {
        path: "/tmp/cache/segment2.mp4",
        startTime: 5,
        endTime: 10,
        size: 2 * 1024 * 1024, // 2MB
        lastUsed: Date.now(),
        hash: "hash2",
      },
    ],
    totalSize: 3 * 1024 * 1024, // 3MB
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(videoCompilerService.getPrerenderCacheInfo).mockResolvedValue(mockCacheInfo)
  })

  it("should load cache info on mount", async () => {
    const { result } = renderHook(() => usePrerenderCache())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.cacheFiles).toEqual(mockCacheInfo.files)
      expect(result.current.totalCacheSize).toBe(mockCacheInfo.totalSize)
    })
  })

  it("should check if segment is in cache", async () => {
    const { result } = renderHook(() => usePrerenderCache())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasInCache(0, 5, true)).toBe(true)
    expect(result.current.hasInCache(2, 7, true)).toBe(false)
  })

  it("should get segment from cache", async () => {
    const { result } = renderHook(() => usePrerenderCache())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const cached = result.current.getFromCache(0, 5, true)
    expect(cached).toEqual({
      filePath: "/tmp/cache/segment1.mp4",
      duration: 5,
      fileSize: 1024 * 1024,
      renderTimeMs: 0,
    })

    const notCached = result.current.getFromCache(10, 15, true)
    expect(notCached).toBeUndefined()
  })

  it("should clear cache", async () => {
    const deletedSize = 3 * 1024 * 1024
    vi.mocked(videoCompilerService.clearPrerenderCache).mockResolvedValueOnce(deletedSize)

    const { result } = renderHook(() => usePrerenderCache())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.clearCache()
    })

    expect(videoCompilerService.clearPrerenderCache).toHaveBeenCalled()
    expect(result.current.cacheFiles).toEqual([])
    expect(result.current.totalCacheSize).toBe(0)
  })

  it("should add to cache (reload cache info)", async () => {
    const { result } = renderHook(() => usePrerenderCache())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Mock updated cache info
    const updatedCacheInfo = {
      ...mockCacheInfo,
      files: [
        ...mockCacheInfo.files,
        {
          path: "/tmp/cache/segment3.mp4",
          startTime: 10,
          endTime: 15,
          size: 1024 * 1024,
          lastUsed: Date.now(),
          hash: "hash3",
        },
      ],
      totalSize: 4 * 1024 * 1024,
    }
    vi.mocked(videoCompilerService.getPrerenderCacheInfo).mockResolvedValueOnce(updatedCacheInfo)

    await act(async () => {
      await result.current.addToCache(10, 15, true, {
        filePath: "/tmp/cache/segment3.mp4",
        duration: 5,
        fileSize: 1024 * 1024,
        renderTimeMs: 1000,
      })
    })

    expect(result.current.cacheFiles).toHaveLength(3)
    expect(result.current.totalCacheSize).toBe(4 * 1024 * 1024)
  })
})
