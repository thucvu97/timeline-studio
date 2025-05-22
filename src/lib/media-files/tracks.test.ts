import { beforeEach, describe, expect, it, vi } from "vitest"

import * as i18nConstants from "@/i18n/constants"
import type { MediaFile, Track } from "@/types/media"

import * as videoModule from "../video"
import * as audioTracksModule from "./audio-tracks"
import { createTracksFromFiles } from "./tracks"
import * as tracksUtilsModule from "./tracks-utils"
import * as videoTracksModule from "./video-tracks"

describe("createTracksFromFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Мокируем зависимости
    vi.spyOn(videoModule, "calculateTimeRanges").mockReturnValue([])
    vi.spyOn(audioTracksModule, "processAudioFiles").mockImplementation(() => {})
    vi.spyOn(videoTracksModule, "processVideoFiles").mockImplementation(() => {})
    vi.spyOn(tracksUtilsModule, "updateSectorTimeRange").mockImplementation((sector) => {
      // Простая реализация для тестов
      if (sector.tracks.length > 0) {
        const allVideos = sector.tracks.flatMap((track) => track.videos ?? [])
        if (allVideos.length > 0) {
          sector.startTime = Math.min(...allVideos.map((video) => video.startTime ?? 0))
          sector.endTime = Math.max(...allVideos.map((video) => (video.startTime ?? 0) + (video.duration ?? 0)))
        }
      }
    })

    // Мокируем formatDateByLanguage для тестов
    vi.spyOn(i18nConstants, "formatDateByLanguage").mockImplementation(
      (date: Date) => date.toISOString().split("T")[0], // Возвращаем дату в формате YYYY-MM-DD
    )

    // Мокируем console.log, чтобы не засорять вывод тестов
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  it("должен создавать секторы из видеофайлов", () => {
    // Создаем тестовые медиафайлы
    const videoFiles: MediaFile[] = [
      {
        path: "video1.mp4",
        name: "video1.mp4",
        startTime: 1609459200, // 2021-01-01
        duration: 60,
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        },
      },
      {
        path: "video2.mp4",
        name: "video2.mp4",
        startTime: 1609545600, // 2021-01-02
        duration: 120,
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        },
      },
    ]

    // Вызываем функцию
    const sectors = createTracksFromFiles(videoFiles)

    // Проверяем результаты
    expect(sectors).toHaveLength(2) // Должно быть создано 2 сектора (по одному на каждый день)

    // Проверяем, что processVideoFiles был вызван для каждого дня
    expect(videoTracksModule.processVideoFiles).toHaveBeenCalledTimes(2)

    // Проверяем, что processAudioFiles был вызван один раз
    expect(audioTracksModule.processAudioFiles).toHaveBeenCalledTimes(1)
  })

  it("должен использовать существующие треки, если они предоставлены", () => {
    // Создаем тестовые медиафайлы
    const videoFile: MediaFile = {
      path: "video1.mp4",
      name: "video1.mp4",
      startTime: 1609459200, // 2021-01-01
      duration: 60,
      probeData: {
        streams: [{ codec_type: "video" }, { codec_type: "audio" }],
      },
    }

    // Создаем существующий трек
    const existingTrack: Track = {
      id: "track1",
      name: "Track 1",
      type: "video",
      videos: [
        {
          path: "existing.mp4",
          name: "existing.mp4",
          startTime: 1609459200, // 2021-01-01
          duration: 30,
          probeData: {
            streams: [{ codec_type: "video" }, { codec_type: "audio" }],
          },
        },
      ],
    }

    // Вызываем функцию с существующими треками
    const sectors = createTracksFromFiles([videoFile], [existingTrack])

    // Проверяем результаты
    expect(sectors).toHaveLength(1) // Должен быть создан 1 сектор

    // Проверяем, что processVideoFiles был вызван с правильными параметрами
    expect(videoTracksModule.processVideoFiles).toHaveBeenCalledWith(
      expect.arrayContaining([videoFile]),
      expect.any(Object),
      expect.arrayContaining([existingTrack]),
    )
  })

  it("должен корректно обрабатывать аудиофайлы", () => {
    // Создаем тестовые медиафайлы
    const audioFile: MediaFile = {
      path: "audio1.mp3",
      name: "audio1.mp3",
      startTime: 1609459200, // 2021-01-01
      duration: 60,
      probeData: {
        streams: [{ codec_type: "audio" }],
      },
    }

    // Вызываем функцию
    createTracksFromFiles([audioFile])

    // Проверяем, что processAudioFiles был вызван с правильными параметрами
    expect(audioTracksModule.processAudioFiles).toHaveBeenCalledWith(
      expect.arrayContaining([audioFile]),
      expect.any(Array),
      expect.any(Object),
      expect.any(String),
    )
  })
})
