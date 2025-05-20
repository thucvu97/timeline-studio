import { describe, expect, it } from "vitest"

import type { MediaFile, Track } from "@/types/media"

import { updateSectorTimeRange } from "./tracks-utils"

import type { Sector } from "./types"

describe("updateSectorTimeRange", () => {
  it("должен обновлять временной диапазон сектора на основе видео на дорожках", () => {
    // Создаем тестовые медиафайлы
    const video1: MediaFile = {
      path: "video1.mp4",
      startTime: 10,
      duration: 20,
    }

    const video2: MediaFile = {
      path: "video2.mp4",
      startTime: 5,
      duration: 15,
    }

    const video3: MediaFile = {
      path: "video3.mp4",
      startTime: 30,
      duration: 10,
    }

    // Создаем тестовые дорожки
    const track1: Track = {
      id: "track1",
      name: "Track 1",
      type: "video",
      videos: [video1],
    }

    const track2: Track = {
      id: "track2",
      name: "Track 2",
      type: "video",
      videos: [video2, video3],
    }

    // Создаем тестовый сектор
    const sector: Sector = {
      id: "sector1",
      name: "Sector 1",
      tracks: [track1, track2],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
    }

    // Вызываем функцию обновления
    updateSectorTimeRange(sector)

    // Проверяем результаты
    // Минимальное startTime должно быть 5 (из video2)
    expect(sector.startTime).toBe(5)
    // Максимальное endTime должно быть 40 (из video3: startTime 30 + duration 10)
    expect(sector.endTime).toBe(40)
  })

  it("не должен изменять сектор, если нет дорожек", () => {
    const sector: Sector = {
      id: "sector1",
      name: "Sector 1",
      tracks: [],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
    }

    updateSectorTimeRange(sector)

    expect(sector.startTime).toBe(0)
    expect(sector.endTime).toBe(0)
  })

  it("не должен изменять сектор, если нет видео на дорожках", () => {
    const track: Track = {
      id: "track1",
      name: "Track 1",
      type: "video",
      videos: [],
    }

    const sector: Sector = {
      id: "sector1",
      name: "Sector 1",
      tracks: [track],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
    }

    updateSectorTimeRange(sector)

    expect(sector.startTime).toBe(0)
    expect(sector.endTime).toBe(0)
  })

  it("должен корректно обрабатывать undefined значения в startTime и duration", () => {
    // Создаем тестовые медиафайлы с undefined значениями
    const video1: MediaFile = {
      path: "video1.mp4",
      startTime: undefined,
      duration: 20,
    }

    const video2: MediaFile = {
      path: "video2.mp4",
      startTime: 5,
      duration: undefined,
    }

    // Создаем тестовую дорожку
    const track: Track = {
      id: "track1",
      name: "Track 1",
      type: "video",
      videos: [video1, video2],
    }

    // Создаем тестовый сектор
    const sector: Sector = {
      id: "sector1",
      name: "Sector 1",
      tracks: [track],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
    }

    // Вызываем функцию обновления
    updateSectorTimeRange(sector)

    // Проверяем результаты
    // Для undefined startTime должно использоваться значение 0
    // Для undefined duration должно использоваться значение 0
    expect(sector.startTime).toBe(0)
    expect(sector.endTime).toBe(20) // 0 + 20 для video1
  })
})
