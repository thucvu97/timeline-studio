/**
 * @vitest-environment jsdom
 *
 * Тесты для утилит расчета drag-drop операций в Timeline
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { SnapMode } from "../../types"
import {
  calculateTimelinePosition,
  canDropOnTrack,
  findInsertionPoint,
  getTrackTypeForMediaFile,
  snapToGrid,
} from "../drag-calculations"

// Моки для отсутствующих функций
vi.mock("../../hooks/use-clips", () => ({
  useClips: () => ({ clips: [] }),
}))

describe("drag-calculations утилиты", () => {
  describe("calculateTimelinePosition", () => {
    it("правильно рассчитывает позицию времени при базовом timeScale", () => {
      const mouseX = 200
      const rect = { left: 100, width: 400 } as DOMRect
      const scrollLeft = 0
      const timeScale = 1 // 1 пиксель = 1 секунда

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      // mouseX(200) - rect.left(100) = 100 пикселей = 100 секунд при timeScale 1
      expect(result).toBe(100)
    })

    it("правильно рассчитывает позицию с увеличенным timeScale", () => {
      const mouseX = 300
      const rect = { left: 50, width: 500 } as DOMRect
      const scrollLeft = 0
      const timeScale = 2 // 1 пиксель = 2 секунды

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      // mouseX(300) - rect.left(50) = 250 пикселей / timeScale(2) = 125 секунд
      expect(result).toBe(125)
    })

    it("правильно рассчитывает позицию с уменьшенным timeScale", () => {
      const mouseX = 150
      const rect = { left: 50, width: 200 } as DOMRect
      const scrollLeft = 0
      const timeScale = 0.5 // 1 пиксель = 0.5 секунды

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      // mouseX(150) - rect.left(50) = 100 пикселей / timeScale(0.5) = 200 секунд
      expect(result).toBe(200)
    })

    it("учитывает горизонтальную прокрутку", () => {
      const mouseX = 200
      const rect = { left: 100, width: 400 } as DOMRect
      const scrollLeft = 50
      const timeScale = 1

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      // mouseX(200) - rect.left(100) + scrollLeft(50) = 150 секунд
      expect(result).toBe(150)
    })

    it("возвращает 0 для отрицательных позиций", () => {
      const mouseX = 50 // левее rect.left
      const rect = { left: 100, width: 400 } as DOMRect
      const scrollLeft = 0
      const timeScale = 1

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      expect(result).toBe(0)
    })

    it("обрабатывает экстремальные значения timeScale", () => {
      const mouseX = 200
      const rect = { left: 100, width: 400 } as DOMRect
      const scrollLeft = 0

      // Очень большой timeScale
      const resultBig = calculateTimelinePosition(mouseX, rect, scrollLeft, 10)
      expect(resultBig).toBe(10) // 100px / 10 = 10 секунд

      // Очень маленький timeScale
      const resultSmall = calculateTimelinePosition(mouseX, rect, scrollLeft, 0.1)
      expect(resultSmall).toBe(1000) // 100px / 0.1 = 1000 секунд
    })

    it("корректно работает с нулевой шириной контейнера", () => {
      const mouseX = 200
      const rect = { left: 100, width: 0 } as DOMRect
      const scrollLeft = 0
      const timeScale = 1

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      expect(result).toBe(100) // mouseX - rect.left
    })
  })

  describe("snapToGrid", () => {
    it("возвращает исходную позицию при режиме 'none'", () => {
      const position = 123.456
      const result = snapToGrid(position, "none" as SnapMode)

      expect(result).toBe(position)
    })

    it("привязывает к сетке при режиме 'grid'", () => {
      // Тест с интервалом 1 секунда (по умолчанию)
      expect(snapToGrid(1.3, "grid" as SnapMode)).toBe(1)
      expect(snapToGrid(1.7, "grid" as SnapMode)).toBe(2)
      expect(snapToGrid(0.4, "grid" as SnapMode)).toBe(0)
      expect(snapToGrid(0.6, "grid" as SnapMode)).toBe(1)
    })

    it("корректно округляет к ближайшему целому числу", () => {
      expect(snapToGrid(2.49, "grid" as SnapMode)).toBe(2)
      expect(snapToGrid(2.51, "grid" as SnapMode)).toBe(3)
      expect(snapToGrid(0.49, "grid" as SnapMode)).toBe(0)
      expect(snapToGrid(0.51, "grid" as SnapMode)).toBe(1)
    })

    it("обрабатывает отрицательные значения", () => {
      expect(snapToGrid(-0.3, "grid" as SnapMode)).toBe(-0)
      expect(snapToGrid(-1.7, "grid" as SnapMode)).toBe(-2)
    })

    it("возвращает исходную позицию для нереализованных режимов", () => {
      const position = 123.456

      // Эти режимы пока не реализованы (TODO в коде)
      expect(snapToGrid(position, "clips" as SnapMode)).toBe(position)
      expect(snapToGrid(position, "markers" as SnapMode)).toBe(position)
    })

    it("обрабатывает большие значения времени", () => {
      expect(snapToGrid(3599.7, "grid" as SnapMode)).toBe(3600) // ~1 час
      expect(snapToGrid(7200.2, "grid" as SnapMode)).toBe(7200) // 2 часа
    })
  })

  describe("canDropOnTrack", () => {
    const createMockMediaFile = (overrides = {}) => ({
      name: "test-file",
      path: "/path/to/file",
      duration: 10,
      isVideo: false,
      isAudio: false,
      isImage: false,
      ...overrides,
    })

    it("разрешает видеофайлы на video треки", () => {
      const videoFile = createMockMediaFile({ isVideo: true })
      expect(canDropOnTrack(videoFile, "video")).toBe(true)
    })

    it("разрешает аудиофайлы на audio треки", () => {
      const audioFile = createMockMediaFile({ isAudio: true })
      expect(canDropOnTrack(audioFile, "audio")).toBe(true)
    })

    it("разрешает аудиофайлы на music треки", () => {
      const audioFile = createMockMediaFile({ isAudio: true })
      expect(canDropOnTrack(audioFile, "music")).toBe(true)
    })

    it("разрешает изображения на video треки", () => {
      const imageFile = createMockMediaFile({ isImage: true })
      expect(canDropOnTrack(imageFile, "video")).toBe(true)
    })

    it("не разрешает изображения на image треки (изображения идут на video треки)", () => {
      const imageFile = createMockMediaFile({ isImage: true })
      expect(canDropOnTrack(imageFile, "image")).toBe(false)
    })

    it("запрещает несовместимые комбинации", () => {
      const videoFile = createMockMediaFile({ isVideo: true })
      const audioFile = createMockMediaFile({ isAudio: true })
      const imageFile = createMockMediaFile({ isImage: true })

      // Видео не может на аудио треки
      expect(canDropOnTrack(videoFile, "audio")).toBe(false)
      expect(canDropOnTrack(videoFile, "music")).toBe(false)

      // Аудио не может на video треки
      expect(canDropOnTrack(audioFile, "video")).toBe(false)
      expect(canDropOnTrack(audioFile, "image")).toBe(false)

      // Изображения не могут на аудио треки
      expect(canDropOnTrack(imageFile, "audio")).toBe(false)
      expect(canDropOnTrack(imageFile, "music")).toBe(false)
    })

    it("обрабатывает файлы без определенного типа", () => {
      const unknownFile = createMockMediaFile() // все флаги false

      // Неопределенные файлы не разрешены ни на каких треках
      expect(canDropOnTrack(unknownFile, "video")).toBe(false)
      expect(canDropOnTrack(unknownFile, "audio")).toBe(false)
      expect(canDropOnTrack(unknownFile, "music")).toBe(false)
      expect(canDropOnTrack(unknownFile, "image")).toBe(false)
    })

    it("обрабатывает файлы с множественными типами", () => {
      const multiFile = createMockMediaFile({
        isVideo: true,
        isAudio: true,
      })

      // Файл с видео и аудио может быть на video треках
      expect(canDropOnTrack(multiFile, "video")).toBe(true)
      // Но также может быть на аудио треках (приоритет аудио в логике)
      expect(canDropOnTrack(multiFile, "audio")).toBe(true)
      expect(canDropOnTrack(multiFile, "music")).toBe(true)
    })

    it("обрабатывает неизвестные типы треков", () => {
      const videoFile = createMockMediaFile({ isVideo: true })

      // @ts-expect-error тестируем неизвестный тип трека
      expect(canDropOnTrack(videoFile, "unknown")).toBe(false)
    })
  })

  describe("getTrackTypeForMediaFile", () => {
    const createMockMediaFile = (overrides = {}) => ({
      name: "test-file",
      path: "/path/to/file",
      duration: 10,
      isVideo: false,
      isAudio: false,
      isImage: false,
      probeData: null,
      ...overrides,
    })

    it("возвращает 'video' для видеофайлов", () => {
      const videoFile = createMockMediaFile({ isVideo: true })
      expect(getTrackTypeForMediaFile(videoFile)).toBe("video")
    })

    it("возвращает 'audio' для аудиофайлов", () => {
      const audioFile = createMockMediaFile({ isAudio: true })
      expect(getTrackTypeForMediaFile(audioFile)).toBe("audio")
    })

    it("возвращает 'video' для изображений (изображения отображаются на video треках)", () => {
      const imageFile = createMockMediaFile({ isImage: true })
      expect(getTrackTypeForMediaFile(imageFile)).toBe("video")
    })

    it("определяет приоритет при множественных типах", () => {
      // Видео имеет приоритет над аудио
      const videoAudioFile = createMockMediaFile({
        isVideo: true,
        isAudio: true,
      })
      expect(getTrackTypeForMediaFile(videoAudioFile)).toBe("video")

      // Видео имеет приоритет над изображением
      const videoImageFile = createMockMediaFile({
        isVideo: true,
        isImage: true,
      })
      expect(getTrackTypeForMediaFile(videoImageFile)).toBe("video")

      // Аудио имеет приоритет над изображением
      const audioImageFile = createMockMediaFile({
        isAudio: true,
        isImage: true,
      })
      expect(getTrackTypeForMediaFile(audioImageFile)).toBe("audio")
    })

    it("анализирует probeData при отсутствии флагов", () => {
      const fileWithProbeData = createMockMediaFile({
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        },
      })

      // Должен вернуть video так как есть видео стрим
      expect(getTrackTypeForMediaFile(fileWithProbeData)).toBe("video")
    })

    it("анализирует только аудио в probeData", () => {
      const fileWithAudioProbe = createMockMediaFile({
        probeData: {
          streams: [{ codec_type: "audio" }],
        },
      })

      expect(getTrackTypeForMediaFile(fileWithAudioProbe)).toBe("audio")
    })

    it("возвращает 'video' по умолчанию для неопределенных типов", () => {
      const unknownFile = createMockMediaFile()
      expect(getTrackTypeForMediaFile(unknownFile)).toBe("video")

      const fileWithEmptyProbe = createMockMediaFile({
        probeData: { streams: [] },
      })
      expect(getTrackTypeForMediaFile(fileWithEmptyProbe)).toBe("video")

      const fileWithUnknownProbe = createMockMediaFile({
        probeData: {
          streams: [{ codec_type: "subtitle" }, { codec_type: "data" }],
        },
      })
      expect(getTrackTypeForMediaFile(fileWithUnknownProbe)).toBe("video")
    })

    it("обрабатывает поврежденные данные probeData", () => {
      const fileWithBadProbe = createMockMediaFile({
        probeData: {
          streams: null, // поврежденные данные
        },
      })

      expect(getTrackTypeForMediaFile(fileWithBadProbe)).toBe("video")

      const fileWithMissingProbe = createMockMediaFile({
        probeData: {}, // отсутствует streams
      })

      expect(getTrackTypeForMediaFile(fileWithMissingProbe)).toBe("video")
    })
  })

  describe("findInsertionPoint", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("возвращает targetTime при базовом использовании", () => {
      const targetTime = 42.5
      const trackId = "track-1"
      const duration = 10

      const result = findInsertionPoint(targetTime, trackId, duration)

      // Пока функция просто возвращает targetTime (TODO в коде)
      expect(result).toBe(targetTime)
    })

    it("обрабатывает различные значения времени", () => {
      const trackId = "track-1"
      const duration = 5

      expect(findInsertionPoint(0, trackId, duration)).toBe(0)
      expect(findInsertionPoint(100.7, trackId, duration)).toBe(100.7)
      expect(findInsertionPoint(-5, trackId, duration)).toBe(0) // отрицательные значения становятся 0
    })

    it("обрабатывает различные длительности", () => {
      const targetTime = 10
      const trackId = "track-1"

      expect(findInsertionPoint(targetTime, trackId, 0)).toBe(targetTime)
      expect(findInsertionPoint(targetTime, trackId, 1000)).toBe(targetTime)
    })

    it("обрабатывает различные trackId", () => {
      const targetTime = 20
      const duration = 15

      expect(findInsertionPoint(targetTime, "video-track", duration)).toBe(targetTime)
      expect(findInsertionPoint(targetTime, "audio-track", duration)).toBe(targetTime)
      expect(findInsertionPoint(targetTime, "", duration)).toBe(targetTime)
    })
  })
})
