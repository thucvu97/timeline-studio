import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile, Track } from "@/types/media"

import * as videoModule from "../video"
import { Sector } from "./types"
import * as utilsModule from "./utils"
import { processVideoFiles } from "./video-tracks"

// Мокируем nanoid для предсказуемых результатов
vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("test-id-123456"),
}))

describe("processVideoFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Мокируем calculateTimeRanges
    vi.spyOn(videoModule, "calculateTimeRanges").mockReturnValue([])

    // Мокируем doTimeRangesOverlap
    vi.spyOn(utilsModule, "doTimeRangesOverlap").mockImplementation((start1, end1, start2, end2) => {
      // Простая реализация для тестов
      return start1 < end2 && start2 < end1
    })

    // Мокируем console.log, чтобы не засорять вывод тестов
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  it("должен добавлять видеофайлы на новые дорожки, если нет существующих", () => {
    // Создаем тестовые медиафайлы
    const videoFile: MediaFile = {
      path: "video1.mp4",
      name: "video1.mp4",
      startTime: 100,
      duration: 60,
      probeData: {
        streams: [{ codec_type: "video", width: 1920, height: 1080 }, { codec_type: "audio" }],
      },
    }

    // Создаем тестовый сектор
    const sector: Sector = {
      id: "sector1",
      name: "Sector 1",
      tracks: [],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
    }

    // Вызываем функцию
    processVideoFiles([videoFile], sector, [])

    // Проверяем результаты
    expect(sector.tracks).toHaveLength(1)
    expect(sector.tracks[0].type).toBe("video")
    expect(sector.tracks[0].videos).toHaveLength(1)
    expect(sector.tracks[0].videos?.[0].path).toBe("video1.mp4")
    expect(sector.tracks[0].startTime).toBe(100)
    expect(sector.tracks[0].endTime).toBe(160) // startTime + duration
    expect(sector.tracks[0].cameraId).toBe("1920x1080")
  })

  it("должен добавлять видеофайлы на существующие дорожки, если нет временного перекрытия", () => {
    // Создаем тестовые медиафайлы
    const videoFile1: MediaFile = {
      path: "video1.mp4",
      name: "video1.mp4",
      startTime: 100,
      duration: 60,
      probeData: {
        streams: [{ codec_type: "video", width: 1920, height: 1080 }, { codec_type: "audio" }],
      },
    }

    const videoFile2: MediaFile = {
      path: "video2.mp4",
      name: "video2.mp4",
      startTime: 200, // После окончания первого видео
      duration: 60,
      probeData: {
        streams: [{ codec_type: "video", width: 1920, height: 1080 }, { codec_type: "audio" }],
      },
    }

    // Создаем тестовый сектор с одной дорожкой
    const sector: Sector = {
      id: "sector1",
      name: "Sector 1",
      tracks: [
        {
          id: "track1",
          name: "Camera 1",
          type: "video",
          videos: [videoFile1],
          startTime: 100,
          endTime: 160,
          combinedDuration: 60,
          timeRanges: [],
          index: 1,
        },
      ],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
    }

    // Мокируем doTimeRangesOverlap для этого теста
    vi.spyOn(utilsModule, "doTimeRangesOverlap").mockReturnValue(false)

    // Вызываем функцию
    processVideoFiles([videoFile2], sector, [])

    // Проверяем результаты
    expect(sector.tracks).toHaveLength(1) // Все еще одна дорожка
    expect(sector.tracks[0].videos).toHaveLength(2) // Но теперь с двумя видео
    expect(sector.tracks[0].videos?.[1].path).toBe("video2.mp4")
    expect(sector.tracks[0].startTime).toBe(100)
    expect(sector.tracks[0].endTime).toBe(260) // Новое endTime
    expect(sector.tracks[0].combinedDuration).toBe(120) // Сумма длительностей
  })

  it("должен создавать новую дорожку, если есть временное перекрытие", () => {
    // Создаем тестовые медиафайлы
    const videoFile1: MediaFile = {
      path: "video1.mp4",
      name: "video1.mp4",
      startTime: 100,
      duration: 60,
      probeData: {
        streams: [{ codec_type: "video", width: 1920, height: 1080 }, { codec_type: "audio" }],
      },
    }

    const videoFile2: MediaFile = {
      path: "video2.mp4",
      name: "video2.mp4",
      startTime: 150, // Перекрывается с первым видео
      duration: 60,
      probeData: {
        streams: [
          { codec_type: "video", width: 1280, height: 720 }, // Другое разрешение
          { codec_type: "audio" },
        ],
      },
    }

    // Создаем тестовый сектор с одной дорожкой
    const sector: Sector = {
      id: "sector1",
      name: "Sector 1",
      tracks: [
        {
          id: "track1",
          name: "Camera 1",
          type: "video",
          videos: [videoFile1],
          startTime: 100,
          endTime: 160,
          combinedDuration: 60,
          timeRanges: [],
          index: 1,
        },
      ],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
    }

    // Мокируем doTimeRangesOverlap для этого теста
    vi.spyOn(utilsModule, "doTimeRangesOverlap").mockReturnValue(true)

    // Вызываем функцию
    processVideoFiles([videoFile2], sector, [])

    // Проверяем результаты
    expect(sector.tracks).toHaveLength(2) // Теперь две дорожки
    expect(sector.tracks[1].videos).toHaveLength(1) // Новая дорожка с одним видео
    expect(sector.tracks[1].videos?.[0].path).toBe("video2.mp4")
    expect(sector.tracks[1].startTime).toBe(150)
    expect(sector.tracks[1].endTime).toBe(210)
    expect(sector.tracks[1].cameraId).toBe("1280x720")
  })

  it("должен использовать существующие дорожки из existingDayTracks", () => {
    // Создаем тестовый медиафайл
    const videoFile: MediaFile = {
      path: "video1.mp4",
      name: "video1.mp4",
      startTime: 100,
      duration: 60,
      probeData: {
        streams: [{ codec_type: "video", width: 1920, height: 1080 }, { codec_type: "audio" }],
      },
    }

    // Создаем существующую дорожку
    const existingTrack: Track = {
      id: "existing-track",
      name: "Camera 1",
      type: "video",
      videos: [],
      startTime: 0,
      endTime: 0,
      combinedDuration: 0,
      timeRanges: [],
      index: 1,
    }

    // Создаем тестовый сектор
    const sector: Sector = {
      id: "sector1",
      name: "Sector 1",
      tracks: [],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
    }

    // Вызываем функцию
    processVideoFiles([videoFile], sector, [existingTrack])

    // Проверяем результаты
    expect(sector.tracks).toHaveLength(1)
    expect(sector.tracks[0].id).toBe("existing-track") // Используется существующая дорожка
    expect(sector.tracks[0].videos).toHaveLength(1)
    expect(sector.tracks[0].videos?.[0].path).toBe("video1.mp4")
  })
})
