import React from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { createMockMediaFile } from "./test-utils"
import { MediaAdapter } from "../../adapters/media-adapter"

// Мокаем зависимости
vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useAppSettings: vi.fn(() => ({
    isLoading: false,
    getError: vi.fn(() => null),
    state: {
      context: {
        mediaFiles: {
          allFiles: [
            createMockMediaFile({
              id: "test-1",
              name: "test-video.mp4",
              path: "/test/video.mp4",
              extension: ".mp4",
              size: 1024000,
              createdAt: "2024-01-01T00:00:00Z",
              startTime: 0,
              probeData: {
                streams: [{ codec_type: "video" }],
                format: { duration: 120.5 },
              },
            }),
            createMockMediaFile({
              id: "test-2",
              name: "test-image.jpg",
              path: "/test/image.jpg",
              extension: ".jpg",
              size: 512000,
              createdAt: "2024-01-02T00:00:00Z",
              startTime: 0,
              isImage: true,
            }),
          ],
        },
      },
    },
  })),
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
}))

vi.mock("@/features/media", () => ({
  getFileType: vi.fn((file) => (file.extension === ".mp4" ? "video" : "image")),
}))

vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key) => key),
    language: "ru",
  },
}))

describe("MediaAdapter", () => {
  describe("useData", () => {
    it("should return media files data", () => {
      const { result } = renderHook(() => MediaAdapter.useData())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.items).toHaveLength(2)
      expect(result.current.items[0].name).toBe("test-video.mp4")
      expect(result.current.items[1].name).toBe("test-image.jpg")
    })
  })

  describe("getSortValue", () => {
    it("should sort by different fields correctly", () => {
      const testFile = createMockMediaFile({
        name: "test.mp4",
        size: 1024,
        createdAt: "2024-01-01T00:00:00Z",
        duration: 60,
        startTime: 0,
        probeData: {
          streams: [],
          format: { duration: 60 },
        },
      })

      expect(MediaAdapter.getSortValue(testFile, "name")).toBe("test.mp4")
      expect(MediaAdapter.getSortValue(testFile, "size")).toBe(1024)
      expect(MediaAdapter.getSortValue(testFile, "duration")).toBe(60)
      expect(MediaAdapter.getSortValue(testFile, "unknown")).toBe(0) // Returns startTime for unknown
    })

    it("should handle missing duration data", () => {
      const testFile = createMockMediaFile({
        duration: undefined,
        probeData: undefined,
        startTime: 0,
      })
      expect(MediaAdapter.getSortValue(testFile, "duration")).toBe(0)
    })
  })

  describe("getSearchableText", () => {
    it("should return searchable text array", () => {
      const testFile = createMockMediaFile({
        name: "test-video.mp4",
        startTime: 0,
        probeData: {
          streams: [],
          format: {
            tags: {
              title: "Test Title",
              artist: "Test Artist",
              album: "Test Album",
            },
          },
        },
      })

      const searchableText = MediaAdapter.getSearchableText(testFile)
      expect(searchableText).toEqual(["test-video.mp4", "Test Title", "Test Artist", "Test Album"])
    })

    it("should filter out empty values", () => {
      const testFile = createMockMediaFile({
        name: "test.mp4",
        probeData: undefined,
        startTime: 0,
      })

      const searchableText = MediaAdapter.getSearchableText(testFile)
      expect(searchableText).toEqual(["test.mp4"])
    })
  })

  describe("getGroupValue", () => {
    const testFile = {
      id: "test",
      name: "test.mp4",
      path: "/test.mp4",
      extension: ".mp4",
      size: 1024,
      createdAt: "2024-01-01T00:00:00Z",
      startTime: 0,
      duration: 120,
      probeData: {
        streams: [],
        format: { duration: 120 },
      },
    }

    it("should group by type", () => {
      const group = MediaAdapter.getGroupValue(testFile, "type")
      expect(group).toBe("browser.media.video") // i18n key, not translated
    })

    it("should group by date", () => {
      const group = MediaAdapter.getGroupValue(testFile, "date")
      expect(group).toBe("Без даты") // startTime is 0, so no date
    })

    it("should group by duration", () => {
      const group = MediaAdapter.getGroupValue(testFile, "duration")
      expect(group).toBe("1-3 минуты") // 120 seconds = 2 minutes
    })

    it("should return empty string for unknown group type", () => {
      const group = MediaAdapter.getGroupValue(testFile, "unknown")
      expect(group).toBe("") // Default case returns empty string
    })
  })

  describe("matchesFilter", () => {
    const videoFile = createMockMediaFile({
      name: "test.mp4",
      extension: ".mp4",
      isVideo: true,
      startTime: 0,
      probeData: {
        streams: [{ codec_type: "video" }],
        format: {},
      },
    })

    const imageFile = createMockMediaFile({
      name: "test.jpg",
      extension: ".jpg",
      isImage: true,
      startTime: 0,
      probeData: {
        streams: [],
        format: {},
      },
    })

    it("should match video filter", () => {
      expect(MediaAdapter.matchesFilter?.(videoFile, "video")).toBe(true) // Video file matches video filter
      expect(MediaAdapter.matchesFilter?.(imageFile, "video")).toBe(false)
    })

    it("should match image filter", () => {
      expect(MediaAdapter.matchesFilter?.(imageFile, "image")).toBe(true) // Image file matches image filter
      expect(MediaAdapter.matchesFilter?.(videoFile, "image")).toBe(false)
    })

    it("should return false for unknown filter", () => {
      expect(MediaAdapter.matchesFilter?.(videoFile, "unknown")).toBe(false) // Unknown filter returns false
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      expect(MediaAdapter.PreviewComponent).toBeDefined()
    })
  })

  describe("favoriteType", () => {
    it("should be 'media'", () => {
      expect(MediaAdapter.favoriteType).toBe("media")
    })
  })
})
