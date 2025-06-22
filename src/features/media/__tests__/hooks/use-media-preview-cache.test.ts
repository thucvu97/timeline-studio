import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMediaPreview } from "../../hooks/use-media-preview"
import { indexedDBCacheService } from "../../services/indexeddb-cache-service"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Mock IndexedDB cache service
vi.mock("../../services/indexeddb-cache-service", () => ({
  indexedDBCacheService: {
    getCachedPreview: vi.fn(),
    cachePreview: vi.fn(),
    deletePreview: vi.fn(),
    clearPreviewCache: vi.fn(),
  },
}))

const { invoke } = await import("@tauri-apps/api/core")
const mockInvoke = vi.mocked(invoke)

describe("useMediaPreview with IndexedDB cache", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getPreviewData", () => {
    it("should return cached preview from IndexedDB if available", async () => {
      const fileId = "test-file-123"
      const cachedThumbnail = "cached-base64-data"

      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue(cachedThumbnail)

      const { result } = renderHook(() => useMediaPreview())

      const data = await act(async () => {
        return result.current.getPreviewData(fileId)
      })

      expect(indexedDBCacheService.getCachedPreview).toHaveBeenCalledWith(fileId)
      expect(mockInvoke).not.toHaveBeenCalled() // Should not call backend
      expect(data).toEqual({
        file_id: fileId,
        file_path: "",
        browser_thumbnail: {
          path: "",
          base64_data: cachedThumbnail,
          timestamp: 0,
          width: 0,
          height: 0,
        },
        last_updated: expect.any(String),
        timeline_previews: [],
        recognition_frames: [],
      })
    })

    it("should fetch from backend and cache if not in IndexedDB", async () => {
      const fileId = "test-file-456"
      const backendData = {
        file_id: fileId,
        file_path: "/path/to/file.mp4",
        browser_thumbnail: {
          path: "/cache/thumb.jpg",
          base64_data: "backend-base64-data",
          timestamp: 1234567890,
          width: 320,
          height: 180,
        },
        timeline_previews: [],
        recognition_frames: [],
      }

      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue(null)
      mockInvoke.mockResolvedValue(backendData)

      const { result } = renderHook(() => useMediaPreview())

      const data = await act(async () => {
        return result.current.getPreviewData(fileId)
      })

      expect(indexedDBCacheService.getCachedPreview).toHaveBeenCalledWith(fileId)
      expect(mockInvoke).toHaveBeenCalledWith("get_media_preview_data", { fileId })
      expect(indexedDBCacheService.cachePreview).toHaveBeenCalledWith(fileId, "backend-base64-data")
      expect(data).toEqual(backendData)
    })

    it("should handle backend errors gracefully", async () => {
      const fileId = "test-file-789"
      const errorMsg = "Failed to fetch preview"

      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue(null)
      mockInvoke.mockRejectedValue(new Error(errorMsg))

      const onError = vi.fn()
      const { result } = renderHook(() => useMediaPreview({ onError }))

      const data = await act(async () => {
        return result.current.getPreviewData(fileId)
      })

      expect(data).toBeNull()
      expect(result.current.error).toBe(errorMsg)
      expect(onError).toHaveBeenCalledWith(errorMsg)
    })
  })

  describe("generateThumbnail", () => {
    it("should cache generated thumbnail", async () => {
      const fileId = "test-file-gen"
      const thumbnailData = {
        path: "/cache/generated.jpg",
        base64_data: "generated-base64-data",
        timestamp: 0,
        width: 160,
        height: 90,
      }

      mockInvoke.mockResolvedValue(thumbnailData)

      const { result } = renderHook(() => useMediaPreview())

      const thumbnail = await act(async () => {
        return result.current.generateThumbnail(fileId, "/path/to/file.mp4", 160, 90)
      })

      expect(mockInvoke).toHaveBeenCalledWith("generate_media_thumbnail", {
        fileId,
        filePath: "/path/to/file.mp4",
        width: 160,
        height: 90,
        timestamp: 0,
      })
      expect(indexedDBCacheService.cachePreview).toHaveBeenCalledWith(fileId, "generated-base64-data")
      expect(thumbnail).toEqual(thumbnailData)
    })

    it("should notify callback when thumbnail is generated", async () => {
      const fileId = "test-file-callback"
      const thumbnailData = {
        path: "/cache/generated.jpg",
        base64_data: "generated-base64-data",
        timestamp: 0,
        width: 160,
        height: 90,
      }

      mockInvoke.mockResolvedValue(thumbnailData)
      const onThumbnailGenerated = vi.fn()

      const { result } = renderHook(() => useMediaPreview({ onThumbnailGenerated }))

      await act(async () => {
        await result.current.generateThumbnail(fileId, "/path/to/file.mp4", 160, 90)
      })

      expect(onThumbnailGenerated).toHaveBeenCalledWith(fileId, thumbnailData)
    })
  })

  describe("clearPreviewData", () => {
    it("should clear preview from backend and IndexedDB", async () => {
      const fileId = "test-file-clear"

      mockInvoke.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaPreview())

      const success = await act(async () => {
        return result.current.clearPreviewData(fileId)
      })

      expect(mockInvoke).toHaveBeenCalledWith("clear_media_preview_data", { fileId })
      expect(indexedDBCacheService.deletePreview).toHaveBeenCalledWith(fileId)
      expect(success).toBe(true)
    })

    it("should handle clear errors", async () => {
      const fileId = "test-file-clear-error"
      const errorMsg = "Failed to clear"

      mockInvoke.mockRejectedValue(new Error(errorMsg))

      const { result } = renderHook(() => useMediaPreview())

      const success = await act(async () => {
        return result.current.clearPreviewData(fileId)
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe(errorMsg)
    })
  })

  describe("caching behavior", () => {
    it("should not cache if thumbnail has no base64 data", async () => {
      const fileId = "test-no-base64"
      const thumbnailData = {
        path: "/cache/generated.jpg",
        base64_data: null, // No base64 data
        timestamp: 0,
        width: 160,
        height: 90,
      }

      mockInvoke.mockResolvedValue(thumbnailData)

      const { result } = renderHook(() => useMediaPreview())

      await act(async () => {
        await result.current.generateThumbnail(fileId, "/path/to/file.mp4", 160, 90)
      })

      expect(indexedDBCacheService.cachePreview).not.toHaveBeenCalled()
    })

    it("should log cache hits and misses", async () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const fileId = "test-logging"

      // Cache hit
      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue("cached-data")
      const { result } = renderHook(() => useMediaPreview())

      await act(async () => {
        await result.current.getPreviewData(fileId)
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[useMediaPreview] Preview found in IndexedDB cache for file: ${fileId}`,
      )

      // Cache miss and save
      vi.mocked(indexedDBCacheService.getCachedPreview).mockResolvedValue(null)
      mockInvoke.mockResolvedValue({
        file_id: fileId,
        browser_thumbnail: { base64_data: "new-data" },
      })

      await act(async () => {
        await result.current.getPreviewData(fileId)
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(`[useMediaPreview] Preview cached in IndexedDB for file: ${fileId}`)

      consoleLogSpy.mockRestore()
    })
  })
})
