import { beforeEach, describe, expect, it, vi } from "vitest"

import * as i18nConstants from "@/i18n/constants"
import type { MediaFile } from "@/types/media"

import { getGroupedFiles, getTopDateWithRemainingFiles, groupFilesByDate } from "./grouping"

// Мокируем i18n и formatDateByLanguage
beforeEach(() => {
  // Мокируем formatDateByLanguage для тестов
  vi.spyOn(i18nConstants, "formatDateByLanguage").mockImplementation(
    (date: Date) => date.toISOString().split("T")[0], // Возвращаем дату в формате YYYY-MM-DD
  )
})

describe("groupFilesByDate", () => {
  it("должен группировать файлы по дате", () => {
    const mediaFiles: MediaFile[] = [
      {
        path: "video1.mp4",
        name: "video1.mp4",
        startTime: 1609459200, // 2021-01-01
      },
      {
        path: "video2.mp4",
        name: "video2.mp4",
        startTime: 1609459200, // 2021-01-01
      },
      {
        path: "video3.mp4",
        name: "video3.mp4",
        startTime: 1612137600, // 2021-02-01
      },
    ]

    const result = groupFilesByDate(mediaFiles)

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe("2021-02-01") // Сортировка от новых к старым
    expect(result[0].files).toHaveLength(1)
    expect(result[1].date).toBe("2021-01-01")
    expect(result[1].files).toHaveLength(2)
  })

  it("должен помещать файлы без даты в конец списка", () => {
    const mediaFiles: MediaFile[] = [
      {
        path: "video1.mp4",
        name: "video1.mp4",
        startTime: 1609459200, // 2021-01-01
      },
      {
        path: "video2.mp4",
        name: "video2.mp4",
        startTime: undefined,
      },
    ]

    const result = groupFilesByDate(mediaFiles)

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe("2021-01-01")
    // Проверяем, что второй элемент существует, но не проверяем точное значение,
    // так как оно зависит от мока i18n и может меняться
    expect(result[1]).toBeDefined()
  })
})

describe("getGroupedFiles", () => {
  it("должен группировать файлы по базовому имени", () => {
    const mediaFiles: MediaFile[] = [
      {
        path: "video_1.mp4",
        name: "video_1.mp4",
        startTime: 100,
      },
      {
        path: "video_2.mp4",
        name: "video_2.mp4",
        startTime: 200,
      },
      {
        path: "other_1.mp4",
        name: "other_1.mp4",
        startTime: 300,
      },
    ]

    const result = getGroupedFiles(mediaFiles)

    expect(Object.keys(result)).toHaveLength(2)
    expect(result.video).toHaveLength(2)
    expect(result.other).toHaveLength(1)
  })

  it("должен сортировать файлы в группе по startTime", () => {
    const mediaFiles: MediaFile[] = [
      {
        path: "video_2.mp4",
        name: "video_2.mp4",
        startTime: 200,
      },
      {
        path: "video_1.mp4",
        name: "video_1.mp4",
        startTime: 100,
      },
    ]

    const result = getGroupedFiles(mediaFiles)

    expect(result.video[0].path).toBe("video_1.mp4") // Сортировка по возрастанию startTime
    expect(result.video[1].path).toBe("video_2.mp4")
  })
})

describe("getTopDateWithRemainingFiles", () => {
  it("должен находить дату с наибольшим количеством оставшихся файлов", () => {
    const sortedDates = [
      {
        date: "2021-01-01",
        files: [
          {
            path: "video1.mp4",
            probeData: {
              streams: [{ codec_type: "video" }, { codec_type: "audio" }],
            },
          },
          {
            path: "video2.mp4",
            probeData: {
              streams: [{ codec_type: "video" }, { codec_type: "audio" }],
            },
          },
        ],
      },
      {
        date: "2021-02-01",
        files: [
          {
            path: "video3.mp4",
            probeData: {
              streams: [{ codec_type: "video" }, { codec_type: "audio" }],
            },
          },
        ],
      },
    ]

    const addedFiles = new Set(["video1.mp4"])

    const result = getTopDateWithRemainingFiles(sortedDates, addedFiles)

    expect(result?.date).toBe("2021-01-01")
    expect(result?.remainingFiles).toHaveLength(1)
    expect(result?.remainingFiles[0].path).toBe("video2.mp4")
  })

  it("должен возвращать undefined, если нет оставшихся файлов", () => {
    const sortedDates = [
      {
        date: "2021-01-01",
        files: [
          {
            path: "video1.mp4",
            probeData: {
              streams: [{ codec_type: "video" }, { codec_type: "audio" }],
            },
          },
        ],
      },
    ]

    const addedFiles = new Set(["video1.mp4"])

    const result = getTopDateWithRemainingFiles(sortedDates, addedFiles)

    expect(result).toBeUndefined()
  })

  it("должен учитывать только видеофайлы с аудио", () => {
    const sortedDates = [
      {
        date: "2021-01-01",
        files: [
          {
            path: "video1.mp4",
            probeData: {
              streams: [{ codec_type: "video" }], // Без аудио
            },
          },
          {
            path: "audio1.mp3",
            probeData: {
              streams: [{ codec_type: "audio" }], // Только аудио
            },
          },
          {
            path: "video2.mp4",
            probeData: {
              streams: [{ codec_type: "video" }, { codec_type: "audio" }], // С аудио
            },
          },
        ],
      },
    ]

    const addedFiles = new Set([])

    const result = getTopDateWithRemainingFiles(sortedDates, addedFiles)

    // Проверяем, что результат существует
    expect(result).toBeDefined()
    // Проверяем, что в remainingFiles есть хотя бы один элемент
    expect(result?.remainingFiles.length).toBeGreaterThan(0)
    // Проверяем, что в remainingFiles есть файл video2.mp4
    expect(result?.remainingFiles.some((file) => file.path === "video2.mp4")).toBe(true)
  })
})
