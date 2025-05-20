import { describe, expect, it } from "vitest"

import type { MediaFile } from "@/types/media"

import {
  doTimeRangesOverlap,
  getFileType,
  getRemainingMediaCounts,
  hasAudioStream,
  isHorizontalVideo,
} from "./utils"

describe("hasAudioStream", () => {
  it("должен вернуть true, если файл содержит аудиопоток", () => {
    const file: MediaFile = {
      path: "test.mp4",
      probeData: {
        streams: [{ codec_type: "video" }, { codec_type: "audio" }],
      },
    }
    expect(hasAudioStream(file)).toBe(true)
  })

  it("должен вернуть false, если файл не содержит аудиопоток", () => {
    const file: MediaFile = {
      path: "test.mp4",
      probeData: {
        streams: [{ codec_type: "video" }],
      },
    }
    expect(hasAudioStream(file)).toBe(false)
  })

  it("должен вернуть false, если probeData отсутствует", () => {
    const file: MediaFile = {
      path: "test.mp4",
    }
    expect(hasAudioStream(file)).toBe(false)
  })
})

describe("getFileType", () => {
  it("должен вернуть 'image', если файл является изображением", () => {
    const file: MediaFile = {
      path: "test.jpg",
      isImage: true,
    }
    expect(getFileType(file)).toBe("image")
  })

  it("должен вернуть 'video', если файл содержит видеопоток", () => {
    const file: MediaFile = {
      path: "test.mp4",
      probeData: {
        streams: [{ codec_type: "video" }],
      },
    }
    expect(getFileType(file)).toBe("video")
  })

  it("должен вернуть 'audio', если файл не содержит видеопоток и не является изображением", () => {
    const file: MediaFile = {
      path: "test.mp3",
      probeData: {
        streams: [{ codec_type: "audio" }],
      },
    }
    expect(getFileType(file)).toBe("audio")
  })
})

describe("getRemainingMediaCounts", () => {
  it("должен правильно подсчитывать оставшиеся видео и аудио файлы", () => {
    const mediaFiles: MediaFile[] = [
      {
        path: "video1.mp4",
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        },
      },
      {
        path: "audio1.mp3",
        probeData: {
          streams: [{ codec_type: "audio" }],
        },
      },
      {
        path: "video2.mp4",
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        },
      },
    ]

    const addedFiles = new Set(["video1.mp4"])

    const result = getRemainingMediaCounts(mediaFiles, addedFiles)

    expect(result.remainingVideoCount).toBe(1) // video2.mp4
    expect(result.remainingAudioCount).toBe(1) // audio1.mp3
    expect(result.allFilesAdded).toBe(false)
  })

  it("должен вернуть allFilesAdded=true, если все файлы с аудио добавлены", () => {
    const mediaFiles: MediaFile[] = [
      {
        path: "video1.mp4",
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        },
      },
      {
        path: "audio1.mp3",
        probeData: {
          streams: [{ codec_type: "audio" }],
        },
      },
    ]

    const addedFiles = new Set(["video1.mp4", "audio1.mp3"])

    const result = getRemainingMediaCounts(mediaFiles, addedFiles)

    expect(result.remainingVideoCount).toBe(0)
    expect(result.remainingAudioCount).toBe(0)
    expect(result.allFilesAdded).toBe(true)
  })

  it("должен вернуть allFilesAdded=false, если массив медиафайлов пуст", () => {
    const result = getRemainingMediaCounts([], new Set())

    expect(result.remainingVideoCount).toBe(0)
    expect(result.remainingAudioCount).toBe(0)
    expect(result.allFilesAdded).toBe(false)
  })
})

describe("isHorizontalVideo", () => {
  it("должен вернуть true, если ширина больше высоты без поворота", () => {
    expect(isHorizontalVideo(1920, 1080)).toBe(true)
  })

  it("должен вернуть false, если ширина меньше высоты без поворота", () => {
    expect(isHorizontalVideo(1080, 1920)).toBe(false)
  })

  it("должен учитывать поворот на 90 градусов", () => {
    expect(isHorizontalVideo(1080, 1920, 90)).toBe(true)
  })

  it("должен учитывать поворот на -90 градусов", () => {
    expect(isHorizontalVideo(1080, 1920, -90)).toBe(true)
  })

  it("должен учитывать поворот на 270 градусов", () => {
    expect(isHorizontalVideo(1080, 1920, 270)).toBe(true)
  })
})

describe("doTimeRangesOverlap", () => {
  it("должен вернуть true, если временные интервалы пересекаются", () => {
    expect(doTimeRangesOverlap(10, 20, 15, 25)).toBe(true)
  })

  it("должен вернуть true, если один интервал полностью содержится в другом", () => {
    expect(doTimeRangesOverlap(10, 30, 15, 25)).toBe(true)
  })

  it("должен вернуть false, если интервалы не пересекаются", () => {
    expect(doTimeRangesOverlap(10, 20, 21, 30)).toBe(false)
  })

  it("должен вернуть false, если конец первого интервала совпадает с началом второго (с учетом зазора)", () => {
    expect(doTimeRangesOverlap(10, 20, 20, 30)).toBe(false)
  })

  it("должен вернуть false, если конец второго интервала совпадает с началом первого (с учетом зазора)", () => {
    expect(doTimeRangesOverlap(20, 30, 10, 20)).toBe(false)
  })
})
