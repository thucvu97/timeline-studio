import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { filterFiles, sortFiles } from "../../utils/music-utils"

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Создаем моковые медиафайлы для тестов
const mockMediaFiles: MediaFile[] = [
  {
    id: "1",
    name: "test1.mp3",
    path: "/test/test1.mp3",
    type: "audio",
    probeData: {
      format: {
        duration: 120,
        size: 1000,
        tags: {
          title: "Test Song 1",
          artist: "Test Artist 1",
          genre: "Rock",
          date: "2021-01-01",
        },
      },
    },
  },
  {
    id: "2",
    name: "test2.wav",
    path: "/test/test2.wav",
    type: "audio",
    probeData: {
      format: {
        duration: 180,
        size: 2000,
        tags: {
          title: "Test Song 2",
          artist: "Test Artist 2",
          genre: "Pop",
          date: "2022-01-01",
        },
      },
    },
  },
  {
    id: "3",
    name: "test3.mp3",
    path: "/test/test3.mp3",
    type: "audio",
    probeData: {
      format: {
        duration: 90,
        size: 500,
        tags: {
          title: "Another Test",
          artist: "Test Artist 1",
          genre: "Jazz",
          date: "2020-01-01",
        },
      },
    },
  },
]

// Создаем мок для медиаконтекста
const mockMediaContext = {
  isItemFavorite: vi.fn((file) => file.id === "1"),
}

describe("music-utils", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  describe("sortFiles", () => {
    it("should sort files by name in ascending order", () => {
      const sorted = sortFiles(mockMediaFiles, "name", "asc")
      expect(sorted[0].name).toBe("test1.mp3")
      expect(sorted[1].name).toBe("test2.wav")
      expect(sorted[2].name).toBe("test3.mp3")
    })

    it("should sort files by name in descending order", () => {
      const sorted = sortFiles(mockMediaFiles, "name", "desc")
      expect(sorted[0].name).toBe("test3.mp3")
      expect(sorted[1].name).toBe("test2.wav")
      expect(sorted[2].name).toBe("test1.mp3")
    })

    it("should sort files by title in ascending order", () => {
      const sorted = sortFiles(mockMediaFiles, "title", "asc")
      expect(sorted[0].probeData.format.tags.title).toBe("Another Test")
      expect(sorted[1].probeData.format.tags.title).toBe("Test Song 1")
      expect(sorted[2].probeData.format.tags.title).toBe("Test Song 2")
    })

    it("should sort files by title in descending order", () => {
      const sorted = sortFiles(mockMediaFiles, "title", "desc")
      expect(sorted[0].probeData.format.tags.title).toBe("Test Song 2")
      expect(sorted[1].probeData.format.tags.title).toBe("Test Song 1")
      expect(sorted[2].probeData.format.tags.title).toBe("Another Test")
    })

    it("should sort files by artist in ascending order", () => {
      const sorted = sortFiles(mockMediaFiles, "artist", "asc")
      expect(sorted[0].probeData.format.tags.artist).toBe("Test Artist 1")
      expect(sorted[1].probeData.format.tags.artist).toBe("Test Artist 1")
      expect(sorted[2].probeData.format.tags.artist).toBe("Test Artist 2")
    })

    it("should sort files by date in ascending order", () => {
      const sorted = sortFiles(mockMediaFiles, "date", "asc")
      expect(sorted[0].probeData.format.tags.date).toBe("2020-01-01")
      expect(sorted[1].probeData.format.tags.date).toBe("2021-01-01")
      expect(sorted[2].probeData.format.tags.date).toBe("2022-01-01")
    })

    it("should sort files by duration in ascending order", () => {
      const sorted = sortFiles(mockMediaFiles, "duration", "asc")
      expect(sorted[0].probeData.format.duration).toBe(90)
      expect(sorted[1].probeData.format.duration).toBe(120)
      expect(sorted[2].probeData.format.duration).toBe(180)
    })

    it("should sort files by size in ascending order", () => {
      const sorted = sortFiles(mockMediaFiles, "size", "asc")
      expect(sorted[0].probeData.format.size).toBe(500)
      expect(sorted[1].probeData.format.size).toBe(1000)
      expect(sorted[2].probeData.format.size).toBe(2000)
    })

    it("should sort files by genre in ascending order", () => {
      const sorted = sortFiles(mockMediaFiles, "genre", "asc")
      expect(sorted[0].probeData.format.tags.genre).toBe("Jazz")
      expect(sorted[1].probeData.format.tags.genre).toBe("Pop")
      expect(sorted[2].probeData.format.tags.genre).toBe("Rock")
    })

    it("should handle missing properties gracefully", () => {
      const filesWithMissingProps = [
        ...mockMediaFiles,
        {
          id: "4",
          name: "test4.mp3",
          path: "/test/test4.mp3",
          type: "audio",
          probeData: {
            format: {
              // Отсутствуют некоторые свойства
            },
          },
        },
      ]

      // Не должно выбрасывать ошибку
      expect(() => sortFiles(filesWithMissingProps, "title", "asc")).not.toThrow()
      expect(() => sortFiles(filesWithMissingProps, "artist", "asc")).not.toThrow()
      expect(() => sortFiles(filesWithMissingProps, "date", "asc")).not.toThrow()
      expect(() => sortFiles(filesWithMissingProps, "duration", "asc")).not.toThrow()
      expect(() => sortFiles(filesWithMissingProps, "size", "asc")).not.toThrow()
      expect(() => sortFiles(filesWithMissingProps, "genre", "asc")).not.toThrow()
    })
  })

  describe("filterFiles", () => {
    it("should filter files by extension", () => {
      const filtered = filterFiles(mockMediaFiles, "", "mp3")
      expect(filtered.length).toBe(2)
      expect(filtered[0].name).toBe("test1.mp3")
      expect(filtered[1].name).toBe("test3.mp3")
    })

    it("should filter files by search query in name", () => {
      const filtered = filterFiles(mockMediaFiles, "test1", "all")
      expect(filtered.length).toBe(1)
      expect(filtered[0].name).toBe("test1.mp3")
    })

    it("should filter files by search query in title", () => {
      const filtered = filterFiles(mockMediaFiles, "Another", "all")
      expect(filtered.length).toBe(1)
      expect(filtered[0].probeData.format.tags.title).toBe("Another Test")
    })

    it("should filter files by search query in artist", () => {
      const filtered = filterFiles(mockMediaFiles, "Artist 2", "all")
      expect(filtered.length).toBe(1)
      expect(filtered[0].probeData.format.tags.artist).toBe("Test Artist 2")
    })

    it("should filter files by search query in genre", () => {
      const filtered = filterFiles(mockMediaFiles, "Jazz", "all")
      expect(filtered.length).toBe(1)
      expect(filtered[0].probeData.format.tags.genre).toBe("Jazz")
    })

    it("should filter files by favorites", () => {
      const filtered = filterFiles(mockMediaFiles, "", "all", true, mockMediaContext)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe("1")
    })

    it("should combine multiple filters", () => {
      // Фильтрация по расширению и поисковому запросу
      const filtered = filterFiles(mockMediaFiles, "Test", "mp3")
      expect(filtered.length).toBe(2)
      expect(filtered[0].name).toBe("test1.mp3")
      expect(filtered[1].name).toBe("test3.mp3")

      // Фильтрация по расширению, поисковому запросу и избранному
      const filteredWithFavorites = filterFiles(mockMediaFiles, "Test", "mp3", true, mockMediaContext)
      expect(filteredWithFavorites.length).toBe(1)
      expect(filteredWithFavorites[0].id).toBe("1")
    })

    it("should handle empty search query", () => {
      const filtered = filterFiles(mockMediaFiles, "", "all")
      expect(filtered.length).toBe(3)
    })

    it("should handle empty files array", () => {
      const filtered = filterFiles([], "test", "all")
      expect(filtered.length).toBe(0)
    })

    it("should handle missing properties gracefully", () => {
      const filesWithMissingProps = [
        ...mockMediaFiles,
        {
          id: "4",
          name: "test4.mp3",
          path: "/test/test4.mp3",
          type: "audio",
          probeData: {
            format: {
              // Отсутствуют некоторые свойства
            },
          },
        },
      ]

      // Не должно выбрасывать ошибку
      expect(() => filterFiles(filesWithMissingProps, "test", "all")).not.toThrow()
    })

    it("should be case insensitive for search queries", () => {
      const filtered = filterFiles(mockMediaFiles, "ARTIST", "all")
      expect(filtered.length).toBe(3) // Все файлы содержат "Artist" в названии исполнителя
    })

    it("should filter by multiple file extensions", () => {
      const filteredMp3 = filterFiles(mockMediaFiles, "", "mp3")
      const filteredWav = filterFiles(mockMediaFiles, "", "wav")

      expect(filteredMp3.length).toBe(2)
      expect(filteredWav.length).toBe(1)
      expect(filteredWav[0].name).toBe("test2.wav")
    })

    it("should handle special characters in search", () => {
      const filesWithSpecialChars = [
        ...mockMediaFiles,
        {
          id: "5",
          name: "test-file_with@special#chars.mp3",
          path: "/test/test-file_with@special#chars.mp3",
          type: "audio",
          probeData: {
            format: {
              tags: {
                title: "Song with (special) chars!",
                artist: "Artist & Band",
              },
            },
          },
        },
      ]

      const filtered = filterFiles(filesWithSpecialChars, "special", "all")
      expect(filtered.length).toBe(1)
      expect(filtered[0].name).toBe("test-file_with@special#chars.mp3")
    })
  })

  describe("edge cases and performance", () => {
    it("should handle large arrays efficiently", () => {
      // Создаем большой массив файлов
      const largeFileArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `test${i}.mp3`,
        path: `/test/test${i}.mp3`,
        type: "audio" as const,
        probeData: {
          format: {
            duration: 120 + i,
            size: 1000 + i,
            tags: {
              title: `Test Song ${i}`,
              artist: `Test Artist ${i % 10}`,
              genre: ["Rock", "Pop", "Jazz"][i % 3],
            },
          },
        },
      }))

      const start = performance.now()
      const sorted = sortFiles(largeFileArray, "name", "asc")
      const filtered = filterFiles(sorted, "Test", "all")
      const end = performance.now()

      expect(sorted.length).toBe(1000)
      expect(filtered.length).toBe(1000)
      expect(end - start).toBeLessThan(100) // Должно выполняться быстро
    })

    it("should handle null and undefined values", () => {
      const filesWithNulls = [
        {
          id: "null-test",
          name: "test-null.mp3",
          path: "/test/test-null.mp3",
          type: "audio" as const,
          probeData: {
            format: {
              duration: null,
              size: undefined,
              tags: {
                title: null,
                artist: undefined,
                genre: "",
              },
            },
          },
        },
      ]

      expect(() => sortFiles(filesWithNulls, "title", "asc")).not.toThrow()
      expect(() => sortFiles(filesWithNulls, "duration", "asc")).not.toThrow()
      expect(() => filterFiles(filesWithNulls, "test", "all")).not.toThrow()
    })

    it("should maintain original array immutability", () => {
      const originalFiles = [...mockMediaFiles]
      const sorted = sortFiles(mockMediaFiles, "name", "desc")
      const filtered = filterFiles(mockMediaFiles, "test", "all")

      // Проверяем, что оригинальный массив не изменился
      expect(mockMediaFiles).toEqual(originalFiles)
      expect(sorted).not.toBe(mockMediaFiles)
      expect(filtered).not.toBe(mockMediaFiles)
    })
  })
})
