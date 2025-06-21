import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CacheStatistics, IndexedDBCacheService } from "../../services/indexeddb-cache-service"

// Mock idb-keyval
vi.mock("idb-keyval", () => {
  const mockGet = vi.fn()
  const mockSet = vi.fn()
  const mockDel = vi.fn()
  const mockEntries = vi.fn()
  const mockClear = vi.fn()
  const mockCreateStore = vi.fn()

  return {
    get: mockGet,
    set: mockSet,
    del: mockDel,
    entries: mockEntries,
    clear: mockClear,
    createStore: mockCreateStore,
  }
})

const mockGet = vi.mocked((await import("idb-keyval")).get)
const mockSet = vi.mocked((await import("idb-keyval")).set)
const mockDel = vi.mocked((await import("idb-keyval")).del)
const mockEntries = vi.mocked((await import("idb-keyval")).entries)
const mockClear = vi.mocked((await import("idb-keyval")).clear)
const mockCreateStore = vi.mocked((await import("idb-keyval")).createStore)

describe("IndexedDBCacheService", () => {
  let service: IndexedDBCacheService

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset singleton instance
    ;(IndexedDBCacheService as any).instance = null

    // Mock store creation
    mockCreateStore.mockReturnValue({})

    service = IndexedDBCacheService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = IndexedDBCacheService.getInstance()
      const instance2 = IndexedDBCacheService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("should create separate stores for different data types", () => {
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-preview-cache", "preview-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-frame-cache", "frame-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-recognition-cache", "recognition-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-subtitle-cache", "subtitle-store")
      expect(mockCreateStore).toHaveBeenCalledTimes(4)
    })
  })

  describe("Preview Cache", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should cache preview successfully", async () => {
      const fileId = "test-file-123"
      const thumbnail = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAA..."

      await service.cachePreview(fileId, thumbnail)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          thumbnail,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.any(Object),
      )
    })

    it("should retrieve cached preview", async () => {
      const fileId = "test-file-123"
      const thumbnail = "data:image/jpeg;base64,cached-thumbnail"
      const mockCached = {
        fileId,
        thumbnail,
        timestamp: Date.now(),
        size: 1000,
      }

      mockGet.mockResolvedValue(mockCached)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBe(thumbnail)
      expect(mockGet).toHaveBeenCalledWith(fileId, expect.any(Object))
    })

    it("should return null for non-existent preview", async () => {
      const fileId = "non-existent-file"
      mockGet.mockResolvedValue(null)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBe(null)
    })

    it("should remove expired preview and return null", async () => {
      const fileId = "expired-file"
      const expiredCached = {
        fileId,
        thumbnail: "expired-thumbnail",
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
        size: 1000,
      }

      mockGet.mockResolvedValue(expiredCached)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBe(null)
      expect(mockDel).toHaveBeenCalledWith(fileId, expect.any(Object))
    })
  })

  describe("Timeline Frames Cache", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should cache timeline frames successfully", async () => {
      const fileId = "video-123"
      const frames = [
        {
          time: 0,
          thumbnail: "frame1-data",
          video_time: 0,
          section_id: "section1",
          segment_id: "segment1",
        },
        {
          time: 1000,
          thumbnail: "frame2-data",
          video_time: 1,
          section_id: "section1",
          segment_id: "segment1",
        },
      ]

      await service.cacheTimelineFrames(fileId, frames)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.any(Object),
      )
    })

    it("should retrieve cached timeline frames", async () => {
      const fileId = "video-123"
      const frames = [
        {
          time: 0,
          thumbnail: "frame1-data",
          video_time: 0,
          section_id: "section1",
          segment_id: "segment1",
        },
      ]
      const mockCached = {
        fileId,
        frames,
        timestamp: Date.now(),
        size: 2000,
      }

      mockGet.mockResolvedValue(mockCached)

      const result = await service.getCachedTimelineFrames(fileId)

      expect(result).toEqual(frames)
      expect(mockGet).toHaveBeenCalledWith(fileId, expect.any(Object))
    })

    it("should handle expired timeline frames", async () => {
      const fileId = "expired-video"
      const expiredCached = {
        fileId,
        frames: [],
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
        size: 1000,
      }

      mockGet.mockResolvedValue(expiredCached)

      const result = await service.getCachedTimelineFrames(fileId)

      expect(result).toBe(null)
      expect(mockDel).toHaveBeenCalledWith(fileId, expect.any(Object))
    })
  })

  describe("Recognition Cache", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should cache recognition frames successfully", async () => {
      const fileId = "recognition-123"
      const frames = [
        {
          time: 0,
          objects: [
            {
              class_name: "person",
              confidence: 0.95,
              bbox: { x: 10, y: 20, width: 100, height: 200 },
            },
          ],
          video_time: 0,
          section_id: "section1",
          segment_id: "segment1",
        },
      ]

      await service.cacheRecognitionFrames(fileId, frames)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.any(Object),
      )
    })

    it("should retrieve cached recognition frames", async () => {
      const fileId = "recognition-123"
      const frames = [
        {
          time: 0,
          objects: [],
          video_time: 0,
          section_id: "section1",
          segment_id: "segment1",
        },
      ]
      const mockCached = {
        fileId,
        frames,
        timestamp: Date.now(),
        size: 1500,
      }

      mockGet.mockResolvedValue(mockCached)

      const result = await service.getCachedRecognitionFrames(fileId)

      expect(result).toEqual(frames)
    })
  })

  describe("Subtitle Cache", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should cache subtitle frames successfully", async () => {
      const fileId = "subtitle-123"
      const frames = [
        {
          time: 0,
          text: "Hello, world!",
          video_time: 0,
          section_id: "section1",
          segment_id: "segment1",
        },
      ]

      await service.cacheSubtitleFrames(fileId, frames)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.any(Object),
      )
    })

    it("should retrieve cached subtitle frames", async () => {
      const fileId = "subtitle-123"
      const frames = [
        {
          time: 0,
          text: "Cached subtitle",
          video_time: 0,
          section_id: "section1",
          segment_id: "segment1",
        },
      ]
      const mockCached = {
        fileId,
        frames,
        timestamp: Date.now(),
        size: 800,
      }

      mockGet.mockResolvedValue(mockCached)

      const result = await service.getCachedSubtitleFrames(fileId)

      expect(result).toEqual(frames)
    })
  })

  describe("Cache Statistics", () => {
    it("should calculate cache statistics correctly", async () => {
      const mockPreviewEntries = [
        ["file1", { fileId: "file1", thumbnail: "data1", timestamp: Date.now(), size: 1000 }],
        ["file2", { fileId: "file2", thumbnail: "data2", timestamp: Date.now(), size: 1500 }],
      ]
      const mockFrameEntries = [["video1", { fileId: "video1", frames: [], timestamp: Date.now(), size: 2000 }]]
      const mockRecognitionEntries = [["recog1", { fileId: "recog1", frames: [], timestamp: Date.now(), size: 3000 }]]
      const mockSubtitleEntries = [["sub1", { fileId: "sub1", frames: [], timestamp: Date.now(), size: 500 }]]

      mockEntries
        .mockResolvedValueOnce(mockPreviewEntries)
        .mockResolvedValueOnce(mockFrameEntries)
        .mockResolvedValueOnce(mockRecognitionEntries)
        .mockResolvedValueOnce(mockSubtitleEntries)

      const stats = await service.getCacheStatistics()

      expect(stats).toEqual({
        previewCache: { count: 2, size: 2500 },
        frameCache: { count: 1, size: 2000 },
        recognitionCache: { count: 1, size: 3000 },
        subtitleCache: { count: 1, size: 500 },
        totalSize: 8000,
      })
    })

    it("should handle empty cache statistics", async () => {
      mockEntries.mockResolvedValue([])

      const stats = await service.getCacheStatistics()

      expect(stats).toEqual({
        previewCache: { count: 0, size: 0 },
        frameCache: { count: 0, size: 0 },
        recognitionCache: { count: 0, size: 0 },
        subtitleCache: { count: 0, size: 0 },
        totalSize: 0,
      })
    })
  })

  describe("Cache Cleanup", () => {
    beforeEach(() => {
      mockClear.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should clear individual cache types", async () => {
      await service.clearPreviewCache()
      expect(mockClear).toHaveBeenCalledWith(expect.any(Object))

      await service.clearFrameCache()
      expect(mockClear).toHaveBeenCalledWith(expect.any(Object))

      await service.clearRecognitionCache()
      expect(mockClear).toHaveBeenCalledWith(expect.any(Object))

      await service.clearSubtitleCache()
      expect(mockClear).toHaveBeenCalledWith(expect.any(Object))
    })

    it("should clear all cache types", async () => {
      await service.clearAllCache()

      expect(mockClear).toHaveBeenCalledTimes(4)
    })

    it("should cleanup expired cache entries", async () => {
      const now = Date.now()
      const expiredTime = now - 31 * 24 * 60 * 60 * 1000 // 31 days ago
      const validTime = now - 1 * 24 * 60 * 60 * 1000 // 1 day ago

      const mockExpiredEntries = [
        ["expired1", { fileId: "expired1", thumbnail: "data", timestamp: expiredTime, size: 1000 }],
        ["valid1", { fileId: "valid1", thumbnail: "data", timestamp: validTime, size: 1000 }],
      ]

      mockEntries.mockResolvedValue(mockExpiredEntries)

      await service.cleanupExpiredCache()

      expect(mockDel).toHaveBeenCalledWith("expired1", expect.any(Object))
      expect(mockDel).not.toHaveBeenCalledWith("valid1", expect.any(Object))
    })
  })

  describe("Size Estimation", () => {
    it("should estimate string size correctly", () => {
      // Access private method through type assertion
      const estimateStringSize = (service as any).estimateStringSize.bind(service)

      // Mock Blob constructor
      global.Blob = vi.fn().mockImplementation((content) => ({
        size: content[0].length,
      })) as any

      const size = estimateStringSize("hello")
      expect(size).toBe(5)
    })

    it("should estimate object size correctly", () => {
      const estimateObjectSize = (service as any).estimateObjectSize.bind(service)

      global.Blob = vi.fn().mockImplementation((content) => ({
        size: content[0].length,
      })) as any

      const obj = { name: "test", value: 123 }
      const size = estimateObjectSize(obj)

      expect(size).toBeGreaterThan(0)
      expect(typeof size).toBe("number")
    })
  })

  describe("Cache Size Management", () => {
    it("should trigger cleanup when cache size exceeds limit", async () => {
      // Mock large cache size
      const largeCacheStats: CacheStatistics = {
        previewCache: { count: 100, size: 200 * 1024 * 1024 }, // 200MB
        frameCache: { count: 50, size: 200 * 1024 * 1024 }, // 200MB
        recognitionCache: { count: 30, size: 150 * 1024 * 1024 }, // 150MB
        subtitleCache: { count: 20, size: 50 * 1024 * 1024 }, // 50MB
        totalSize: 600 * 1024 * 1024, // 600MB (exceeds 500MB limit)
      }

      // Mock statistics call
      vi.spyOn(service, "getCacheStatistics").mockResolvedValue(largeCacheStats)

      // Mock entries for cleanup
      const oldEntries = [
        ["old1", { fileId: "old1", timestamp: Date.now() - 10000, size: 100 * 1024 * 1024 }],
        ["old2", { fileId: "old2", timestamp: Date.now() - 20000, size: 100 * 1024 * 1024 }],
      ]
      mockEntries.mockResolvedValue(oldEntries)

      // This should trigger cleanup internally
      await service.cachePreview("new-file", "small-thumbnail")

      expect(mockDel).toHaveBeenCalled()
    })

    it("should remove oldest entries first during cleanup", async () => {
      const removeOldestEntries = (service as any).removeOldestEntries.bind(service)

      const oldTime = Date.now() - 20000
      const newTime = Date.now() - 10000

      // Mock entries for preview store (first call)
      const previewEntries = [["old", { fileId: "old", timestamp: oldTime, size: 1000 }]]

      // Mock entries for frame store (second call)
      const frameEntries = [["new", { fileId: "new", timestamp: newTime, size: 1000 }]]

      // Mock the entries call for each store in order
      mockEntries
        .mockResolvedValueOnce(previewEntries) // preview store
        .mockResolvedValueOnce(frameEntries) // frame store
        .mockResolvedValueOnce([]) // recognition store
        .mockResolvedValueOnce([]) // subtitle store

      await removeOldestEntries(1500) // Need to free 1500 bytes

      // Should delete oldest entry first (from preview store), then newest (from frame store)
      expect(mockDel).toHaveBeenCalledWith("old", expect.any(Object))
      expect(mockDel).toHaveBeenCalledWith("new", expect.any(Object))
      expect(mockDel).toHaveBeenCalledTimes(2) // Both entries deleted to free 2000 bytes (>= 1500)
    })
  })

  describe("Error Handling", () => {
    it("should handle IndexedDB errors gracefully", async () => {
      const error = new Error("IndexedDB error")
      mockGet.mockRejectedValue(error)

      await expect(service.getCachedPreview("test")).rejects.toThrow("IndexedDB error")
    })

    it("should handle set operation errors", async () => {
      const error = new Error("Storage quota exceeded")
      mockSet.mockRejectedValue(error)

      await expect(service.cachePreview("test", "data")).rejects.toThrow("Storage quota exceeded")
    })

    it("should handle cleanup errors gracefully", async () => {
      mockEntries.mockRejectedValue(new Error("Entries error"))

      // Should not throw
      await expect(service.getCacheStatistics()).rejects.toThrow("Entries error")
    })
  })
})
