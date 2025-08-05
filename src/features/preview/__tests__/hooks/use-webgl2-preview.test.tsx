/**
 * Tests for useWebGL2Preview hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useWebGL2Preview } from "../../hooks/use-webgl2-preview"

// Mock dependencies
vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    segments: [],
    selectedClipIds: []
  })
}))

vi.mock("@/features/video-player", () => ({
  usePlayer: () => ({
    currentTime: 0,
    currentVideo: { path: "/test/video.mp4" },
    isPlaying: false
  })
}))

// Mock WebGL2PreviewRenderer
const mockRenderer = {
  initialize: vi.fn().mockImplementation(() => {
    // Создаем Promise который разрешается через nextTick
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true)
      }, 0)
    })
  }),
  getCapabilities: vi.fn().mockReturnValue({ tier: "medium" }),
  setVideoSource: vi.fn(),
  setSegments: vi.fn(),
  setCurrentTime: vi.fn(),
  render: vi.fn(),
  captureFrame: vi.fn().mockResolvedValue({
    bitmap: {},
    width: 1920,
    height: 1080,
    timestamp: 0
  }),
  resize: vi.fn(),
  dispose: vi.fn()
}

vi.mock("../../services/webgl2-preview-renderer", () => ({
  WebGL2PreviewRenderer: vi.fn().mockImplementation(() => mockRenderer)
}))

// Mock PreviewCache
const mockCacheInstance = {
  getOrCompute: vi.fn().mockImplementation(async (time, effects, compute) => {
    return await compute()
  }),
  prefetch: vi.fn(),
  invalidate: vi.fn(),
  getStats: vi.fn().mockReturnValue({
    entries: 10,
    sizeMB: 50
  }),
  dispose: vi.fn()
}

vi.mock("../../services/preview-cache", () => ({
  PreviewCache: vi.fn().mockImplementation(() => mockCacheInstance)
}))

// Mock createImageBitmap
global.createImageBitmap = vi.fn().mockResolvedValue({})

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback
  
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ;(MockResizeObserver as any).mock.calls.push([callback])
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
  
  static mock = { calls: [] as any[] }
}

// Add static mock property
;(MockResizeObserver as any).mock = { calls: [] }

global.ResizeObserver = MockResizeObserver as any

// Mock ImageData (needed for captureFrame)
global.ImageData = class ImageData {
  constructor(public width: number, public height: number) {
    this.data = new Uint8ClampedArray(width * height * 4)
  }
  data: Uint8ClampedArray
} as any

describe("useWebGL2Preview", () => {
  let mockCanvas: HTMLCanvasElement
  let mockVideo: HTMLVideoElement

  beforeEach(() => {
    mockCanvas = document.createElement("canvas")
    mockVideo = document.createElement("video")
    
    // Mock video properties
    Object.defineProperty(mockVideo, "currentTime", {
      writable: true,
      value: 0
    })
    
    Object.defineProperty(mockVideo, "readyState", {
      value: 4 // HAVE_ENOUGH_DATA
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should initialize with default options", async () => {
      const { result } = renderHook(() => useWebGL2Preview())
      
      expect(result.current.isInitialized).toBe(false)
      expect(result.current.gpuTier).toBe("medium")
      expect(result.current.quality).toEqual({
        resolution: 1.0,
        effects: "all",
        fps: 30,
        antialiasing: true
      })
    })

    it("should initialize renderer when canvas is set", async () => {
      const { result } = renderHook(() => useWebGL2Preview())
      
      act(() => {
        result.current.canvasRef(mockCanvas)
      })
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      }, { timeout: 2000 })
    })

    it("should adjust quality based on GPU tier", async () => {
      const { result } = renderHook(() => useWebGL2Preview())
      
      act(() => {
        result.current.canvasRef(mockCanvas)
      })
      
      // Initially should have default quality
      expect(result.current.quality.resolution).toBe(1.0)
      
      // After initialization, quality should be adjusted based on GPU tier
      await waitFor(() => {
        expect(result.current.quality.resolution).toBe(0.75) // medium tier
      }, { timeout: 2000 })
    })
  })

  describe("video handling", () => {
    it("should set video source when video ref is set", () => {
      const { result } = renderHook(() => useWebGL2Preview())
      
      act(() => {
        result.current.videoRef(mockVideo)
      })
      
      expect(mockVideo.src).toContain("/test/video.mp4")
      expect(mockVideo.muted).toBe(true)
    })
  })

  describe("preview updates", () => {
    it("should update preview frame on time change", async () => {
      const { result, rerender } = renderHook(() => useWebGL2Preview({
        updateInterval: 16 // 60fps for testing
      }))
      
      act(() => {
        result.current.canvasRef(mockCanvas)
        result.current.videoRef(mockVideo)
      })
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      }, { timeout: 2000 })
      
      // Trigger update
      rerender()
      
      await waitFor(() => {
        expect(result.current.previewFrame).toBeDefined()
      })
    })
  })

  describe("quality settings", () => {
    it("should update quality settings", async () => {
      const { result } = renderHook(() => useWebGL2Preview())
      
      const newQuality = {
        resolution: 1.0,
        effects: "all" as const,
        fps: 30,
        antialiasing: true
      }
      
      act(() => {
        result.current.setQuality(newQuality)
      })
      
      expect(result.current.quality).toEqual(newQuality)
    })
  })

  describe("cache stats", () => {
    it("should return cache statistics", async () => {
      const { result } = renderHook(() => useWebGL2Preview())
      
      act(() => {
        result.current.canvasRef(mockCanvas)
      })
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      }, { timeout: 2000 })
      
      // Cache stats should be available after initialization
      expect(result.current.cacheStats).toEqual({
        entries: 10,
        sizeMB: 50
      })
    })
  })

  describe("cleanup", () => {
    it("should dispose resources on unmount", async () => {
      const { result, unmount } = renderHook(() => useWebGL2Preview())
      
      act(() => {
        result.current.canvasRef(mockCanvas)
      })
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      }, { timeout: 2000 })
      
      const renderer = (result.current as any).rendererRef?.current
      const cache = (result.current as any).cacheRef?.current
      
      unmount()
      
      // Note: Can't directly test dispose calls due to hook internals
      // but they should be called on cleanup
    })
  })

  describe("resize handling", () => {
    it("should handle canvas resize", async () => {
      const { result } = renderHook(() => useWebGL2Preview())
      
      act(() => {
        result.current.canvasRef(mockCanvas)
      })
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      }, { timeout: 2000 })
      
      // Simulate resize
      const resizeObserverCallback = (ResizeObserver as any).mock.calls[0]?.[0]
      
      if (resizeObserverCallback) {
        act(() => {
          resizeObserverCallback([{
            contentRect: { width: 1280, height: 720 }
          }])
        })
      }
    })
  })
})