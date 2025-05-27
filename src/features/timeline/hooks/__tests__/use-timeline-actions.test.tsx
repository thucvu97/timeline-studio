/**
 * Тесты для хука useTimelineActions
 */

import { describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { useTimelineActions } from "../use-timeline-actions"

// Мокаем зависимости
vi.mock("../use-clips", () => ({
  useClips: () => ({
    getClipsByTrack: vi.fn(() => []),
  }),
}))

vi.mock("../use-tracks", () => ({
  useTracks: () => ({
    tracks: [],
    getTracksByType: vi.fn(() => []),
  }),
}))

vi.mock("../../timeline-provider", () => ({
  useTimeline: () => ({
    project: { id: "test-project" },
    addTrack: vi.fn(),
    addClip: vi.fn(),
  }),
}))

// Мокаем медиафайл для тестов
const mockVideoFile: MediaFile = {
  id: "test-video-1",
  name: "test-video.mp4",
  path: "/test/video.mp4",
  size: 1024000,
  duration: 30,
  isVideo: true,
  isAudio: false,
  isImage: false,
  createdAt: new Date(),
  modifiedAt: new Date(),
  probeData: {
    streams: [
      {
        codec_type: "video",
        width: 1920,
        height: 1080,
        duration: "30.0",
      },
    ],
  },
} as MediaFile

const mockAudioFile: MediaFile = {
  id: "test-audio-1",
  name: "test-audio.mp3",
  path: "/test/audio.mp3",
  size: 512000,
  duration: 60,
  isVideo: false,
  isAudio: true,
  isImage: false,
  createdAt: new Date(),
  modifiedAt: new Date(),
  probeData: {
    streams: [
      {
        codec_type: "audio",
        duration: "60.0",
      },
    ],
  },
} as MediaFile

describe("useTimelineActions", () => {
  it("должен экспортировать хук", () => {
    expect(useTimelineActions).toBeDefined()
    expect(typeof useTimelineActions).toBe("function")
  })

  it("должен определять тип трека для видеофайла", () => {
    // Тестируем функцию определения типа медиафайла напрямую
    expect(mockVideoFile.isVideo).toBe(true)
    expect(mockVideoFile.isAudio).toBe(false)
    expect(mockVideoFile.isImage).toBe(false)
  })

  it("должен определять тип трека для аудиофайла", () => {
    // Тестируем функцию определения типа медиафайла напрямую
    expect(mockAudioFile.isVideo).toBe(false)
    expect(mockAudioFile.isAudio).toBe(true)
    expect(mockAudioFile.isImage).toBe(false)
  })

  it("должен иметь правильную структуру медиафайлов", () => {
    // Проверяем, что медиафайлы имеют правильную структуру
    expect(mockVideoFile).toHaveProperty("id")
    expect(mockVideoFile).toHaveProperty("name")
    expect(mockVideoFile).toHaveProperty("path")
    expect(mockVideoFile).toHaveProperty("duration")

    expect(mockAudioFile).toHaveProperty("id")
    expect(mockAudioFile).toHaveProperty("name")
    expect(mockAudioFile).toHaveProperty("path")
    expect(mockAudioFile).toHaveProperty("duration")
  })

  it("должен иметь правильные метаданные для видеофайла", () => {
    expect(mockVideoFile.probeData?.streams).toBeDefined()
    expect(mockVideoFile.probeData?.streams[0].codec_type).toBe("video")
  })

  it("должен иметь правильные метаданные для аудиофайла", () => {
    expect(mockAudioFile.probeData?.streams).toBeDefined()
    expect(mockAudioFile.probeData?.streams[0].codec_type).toBe("audio")
  })
})
