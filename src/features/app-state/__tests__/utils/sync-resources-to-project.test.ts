/**
 * Tests for sync-resources-to-project.ts
 * Comprehensive testing of resource synchronization utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"
import { MediaPoolItem } from "@/features/media/types/media-pool"
import { convertMediaFileToPoolItem } from "@/features/media/utils/media-pool-utils"
import { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"
import { MediaResource, MusicResource } from "@/features/resources/types"

import { getResourcesFromStorage, syncResourcesToProject } from "../../utils/sync-resources-to-project"

// Mock dependencies
vi.mock("@/features/media/utils/media-pool-utils", () => ({
  convertMediaFileToPoolItem: vi.fn(),
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
})

describe("sync-resources-to-project", () => {
  const mockMediaFile: MediaFile = {
    id: "media-1",
    name: "test-video.mp4",
    path: "/path/to/test-video.mp4",
    size: 1000000,
    type: "video",
    mimeType: "video/mp4",
    lastModified: new Date("2023-01-01"),
    isOffline: false,
    metadata: {
      duration: 30,
      width: 1920,
      height: 1080,
      fps: 30,
      fileSize: 1000000,
    },
  }

  const mockMusicFile: MediaFile = {
    id: "music-1",
    name: "background-music.mp3",
    path: "/path/to/background-music.mp3",
    size: 500000,
    type: "audio",
    mimeType: "audio/mp3",
    lastModified: new Date("2023-01-01"),
    isOffline: false,
    metadata: {
      duration: 120,
      fileSize: 500000,
    },
  }

  const mockMediaPoolItem: MediaPoolItem = {
    id: "pool-item-1",
    type: "video",
    name: "test-video.mp4",
    source: {
      path: "/path/to/test-video.mp4",
      relativePath: "test-video.mp4",
      hash: "abc123",
    },
    status: "online",
    binId: "root",
    metadata: {
      duration: 30,
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
      fileSize: 1000000,
      codec: "h264",
      bitRate: 5000000,
      createdDate: new Date("2023-01-01"),
      modifiedDate: new Date("2023-01-01"),
      importedDate: new Date("2023-01-01"),
    },
    usage: {
      sequences: [],
      count: 0,
    },
    tags: [],
  }

  const mockMusicPoolItem: MediaPoolItem = {
    id: "pool-item-2",
    type: "audio",
    name: "background-music.mp3",
    source: {
      path: "/path/to/background-music.mp3",
      relativePath: "background-music.mp3",
      hash: "def456",
    },
    status: "online",
    binId: "music",
    metadata: {
      duration: 120,
      fileSize: 500000,
      codec: "mp3",
      bitrate: 128000,
    },
    usageCount: 0,
    addedAt: new Date("2023-01-01"),
  }

  const createMockProject = (): TimelineStudioProject => ({
    metadata: {
      id: "project-1",
      name: "Test Project",
      version: "1.0.0",
      created: new Date("2023-01-01"),
      modified: new Date("2023-01-01"),
      platform: "macos",
      appVersion: "1.0.0",
    },
    settings: {
      video: {
        resolution: { width: 1920, height: 1080 },
        frameRate: { numerator: 30, denominator: 1 },
        aspectRatio: { numerator: 16, denominator: 9 },
        colorSpace: "Rec. 709",
        pixelAspectRatio: { numerator: 1, denominator: 1 },
      },
      audio: {
        sampleRate: 48000,
        channels: 2,
        bitDepth: 24,
      },
      folders: {
        media: "/project/media",
        exports: "/project/exports",
        cache: "/project/cache",
        proxies: "/project/proxies",
      },
    },
    mediaPool: {
      items: new Map(),
      bins: new Map([["root", { id: "root", name: "Root", parentId: null, children: [], items: [] }]]),
      stats: {
        totalItems: 0,
        totalSize: 0,
        onlineItems: 0,
        offlineItems: 0,
        proxyItems: 0,
        unusedItems: 0,
      },
    },
    sequences: new Map(),
    export: {
      lastSettings: {
        format: "mp4",
        codec: "h264",
        quality: "high",
        resolution: { width: 1920, height: 1080 },
        frameRate: { numerator: 30, denominator: 1 },
        bitrate: 10000000,
        audioCodec: "aac",
        audioSampleRate: 48000,
      },
      history: [],
    },
  })

  const mockMediaResource: MediaResource = {
    id: "resource-1",
    type: "media",
    name: "Test Video",
    resourceId: "media-1",
    addedAt: Date.now(),
    file: mockMediaFile,
  }

  const mockMusicResource: MusicResource = {
    id: "resource-2",
    type: "music",
    name: "Background Music",
    resourceId: "music-1",
    addedAt: Date.now(),
    file: mockMusicFile,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe("syncResourcesToProject", () => {
    it("should sync media and music resources to project", () => {
      const project = createMockProject()
      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      expect(result).not.toBe(project) // Should return a new object
      expect(result.mediaPool.items.size).toBe(2)
      expect(result.mediaPool.items.has("pool-item-1")).toBe(true)
      expect(result.mediaPool.items.has("pool-item-2")).toBe(true)
    })

    it("should update existing items when syncing resources with same ID", () => {
      const project = createMockProject()
      const existingItem = { ...mockMediaPoolItem, id: "pool-item-1", name: "old-name.mp4" }
      project.mediaPool.items.set("pool-item-1", existingItem)

      const updatedItem = { ...mockMediaPoolItem, id: "pool-item-1", name: "new-name.mp4" }
      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce(updatedItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [])

      // Should update the existing item
      expect(result.mediaPool.items.size).toBe(1)
      expect(result.mediaPool.items.has("pool-item-1")).toBe(true)
      expect(result.mediaPool.items.get("pool-item-1")?.name).toBe("new-name.mp4")
    })

    it("should remove items that are not in localStorage resources", () => {
      const project = createMockProject()
      const existingItem1 = { ...mockMediaPoolItem, id: "existing-1" }
      const existingItem2 = { ...mockMediaPoolItem, id: "existing-2" }
      project.mediaPool.items.set("existing-1", existingItem1)
      project.mediaPool.items.set("existing-2", existingItem2)

      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce({ ...mockMediaPoolItem, id: "existing-1" })

      // Only pass resource for existing-1, not existing-2
      const result = syncResourcesToProject(project, [mockMediaResource], [])

      // Should only have the item that was in resources
      expect(result.mediaPool.items.size).toBe(1)
      expect(result.mediaPool.items.has("existing-1")).toBe(true)
      expect(result.mediaPool.items.has("existing-2")).toBe(false)
    })

    it("should call convertMediaFileToPoolItem with correct parameters", () => {
      const project = createMockProject()
      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      expect(convertMediaFileToPoolItem).toHaveBeenCalledWith(mockMediaFile)
      expect(convertMediaFileToPoolItem).toHaveBeenCalledWith(mockMusicFile, "music")
    })

    it("should skip resources without files", () => {
      const project = createMockProject()
      const resourceWithoutFile = {
        ...mockMediaResource,
        file: undefined as any,
      }

      const result = syncResourcesToProject(project, [resourceWithoutFile], [])

      expect(result.mediaPool.items.size).toBe(0)
      expect(convertMediaFileToPoolItem).not.toHaveBeenCalled()
    })

    it("should update media pool statistics correctly", () => {
      const project = createMockProject()
      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      expect(result.mediaPool.stats).toEqual({
        totalItems: 2,
        totalSize: 1500000, // 1000000 + 500000
        onlineItems: 2, // Both items are online
        offlineItems: 0,
        proxyItems: 0,
        unusedItems: 2, // All items are initially unused
      })
    })

    it("should handle offline items in statistics", () => {
      const project = createMockProject()
      const offlinePoolItem = {
        ...mockMediaPoolItem,
        status: "offline" as const,
      }
      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce(offlinePoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [])

      expect(result.mediaPool.stats.onlineItems).toBe(0)
      expect(result.mediaPool.stats.offlineItems).toBe(1)
    })

    it("should handle missing items in statistics", () => {
      const project = createMockProject()
      const missingPoolItem = {
        ...mockMediaPoolItem,
        status: "missing" as const,
      }
      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce(missingPoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [])

      expect(result.mediaPool.stats.onlineItems).toBe(0)
      expect(result.mediaPool.stats.offlineItems).toBe(1)
    })

    it("should update project modified date", () => {
      const project = createMockProject()
      const originalModified = project.metadata.modified

      // Mock Date.now to return a specific time
      const mockDate = new Date("2023-12-01")
      vi.spyOn(global, "Date").mockImplementation(() => mockDate as any)

      const result = syncResourcesToProject(project, [], [])

      expect(result.metadata.modified).toEqual(mockDate)
      expect(result.metadata.modified).not.toEqual(originalModified)

      vi.restoreAllMocks()
    })

    it("should handle empty resources arrays", () => {
      const project = createMockProject()
      const result = syncResourcesToProject(project, [], [])

      expect(result.mediaPool.items.size).toBe(0)
      expect(result.mediaPool.stats.totalItems).toBe(0)
      expect(result.mediaPool.stats.totalSize).toBe(0)
      expect(convertMediaFileToPoolItem).not.toHaveBeenCalled()
    })

    it("should preserve other project properties", () => {
      const project = createMockProject()
      const result = syncResourcesToProject(project, [], [])

      expect(result.metadata.id).toBe(project.metadata.id)
      expect(result.metadata.name).toBe(project.metadata.name)
      expect(result.settings).toEqual(project.settings)
      expect(result.sequences).toBe(project.sequences)
      expect(result.export).toBe(project.export)
    })
  })

  describe("getResourcesFromStorage", () => {
    it("should return empty arrays when localStorage is not available", () => {
      // Mock window as undefined (server-side)
      const originalWindow = global.window
      // @ts-expect-error - intentionally setting to undefined for test
      delete global.window

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })

      // Restore window
      global.window = originalWindow
    })

    it("should return empty arrays when localStorage.getItem returns null", () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("timeline-studio-resources")
    })

    it("should parse and return stored resources", () => {
      const storedData = {
        mediaResources: [mockMediaResource],
        musicResources: [mockMusicResource],
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = getResourcesFromStorage()

      expect(result.mediaResources).toHaveLength(1)
      expect(result.musicResources).toHaveLength(1)
      expect(result.mediaResources[0].id).toBe(mockMediaResource.id)
      expect(result.musicResources[0].id).toBe(mockMusicResource.id)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("timeline-studio-resources")
    })

    it("should handle missing mediaResources in stored data", () => {
      const storedData = {
        musicResources: [mockMusicResource],
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = getResourcesFromStorage()

      expect(result.mediaResources).toHaveLength(0)
      expect(result.musicResources).toHaveLength(1)
      expect(result.musicResources[0].id).toBe(mockMusicResource.id)
    })

    it("should handle missing musicResources in stored data", () => {
      const storedData = {
        mediaResources: [mockMediaResource],
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = getResourcesFromStorage()

      expect(result.mediaResources).toHaveLength(1)
      expect(result.musicResources).toHaveLength(0)
      expect(result.mediaResources[0].id).toBe(mockMediaResource.id)
    })

    it("should handle invalid JSON in localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json{")
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get resources from localStorage:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should handle localStorage.getItem throwing an error", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error")
      })
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get resources from localStorage:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should handle empty stored data", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({}))

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
    })

    it("should handle null values in stored data", () => {
      const storedData = {
        mediaResources: null,
        musicResources: null,
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = getResourcesFromStorage()

      expect(result).toEqual({
        mediaResources: [],
        musicResources: [],
      })
    })
  })

  describe("integration scenarios", () => {
    it("should handle complete sync workflow", () => {
      const project = createMockProject()

      // Setup localStorage with resources
      const storedData = {
        mediaResources: [mockMediaResource],
        musicResources: [mockMusicResource],
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      // Get resources from storage
      const resources = getResourcesFromStorage()

      // Sync to project
      const result = syncResourcesToProject(project, resources.mediaResources, resources.musicResources)

      expect(result.mediaPool.items.size).toBe(2)
      expect(result.mediaPool.stats.totalItems).toBe(2)
      expect(result.metadata.modified).toBeInstanceOf(Date)
    })

    it("should handle large number of resources efficiently", () => {
      const project = createMockProject()
      const manyMediaResources = Array.from({ length: 50 }, (_, i) => ({
        ...mockMediaResource,
        id: `resource-${i}`,
        resourceId: `media-${i}`,
        file: {
          ...mockMediaFile,
          id: `media-${i}`,
        },
      }))

      // Mock to return different items for each call
      manyMediaResources.forEach((_, i) => {
        vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce({
          ...mockMediaPoolItem,
          id: `pool-item-${i}`,
        })
      })

      const result = syncResourcesToProject(project, manyMediaResources, [])

      expect(result.mediaPool.items.size).toBe(50)
      expect(result.mediaPool.stats.totalItems).toBe(50)
      expect(convertMediaFileToPoolItem).toHaveBeenCalledTimes(50)
    })

    it("should maintain data integrity during sync", () => {
      const project = createMockProject()

      vi.mocked(convertMediaFileToPoolItem)
        .mockReturnValueOnce(mockMediaPoolItem)
        .mockReturnValueOnce(mockMusicPoolItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      // Verify that the original project wasn't mutated
      expect(project.mediaPool.items.size).toBe(0)
      expect(project.metadata.modified).not.toEqual(result.metadata.modified)

      // Verify that the result has correct structure
      expect(result.mediaPool.items instanceof Map).toBe(true)
      expect(result.mediaPool.bins instanceof Map).toBe(true)
      expect(result.sequences instanceof Map).toBe(true)
    })

    it("should handle mixed online and offline resources", () => {
      const project = createMockProject()
      const onlineItem = { ...mockMediaPoolItem, status: "online" as const }
      const offlineItem = { ...mockMusicPoolItem, status: "offline" as const }

      vi.mocked(convertMediaFileToPoolItem).mockReturnValueOnce(onlineItem).mockReturnValueOnce(offlineItem)

      const result = syncResourcesToProject(project, [mockMediaResource], [mockMusicResource])

      expect(result.mediaPool.stats.onlineItems).toBe(1)
      expect(result.mediaPool.stats.offlineItems).toBe(1)
      expect(result.mediaPool.stats.totalItems).toBe(2)
    })
  })
})
