import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useMediaFiles } from "../../hooks/use-media-files"

// Мокаем useAppSettings
const mockMediaFiles = [
  {
    id: "file1",
    originalPath: "/path/to/video1.mp4",
    name: "video1.mp4",
    size: 1000000,
    isVideo: true,
    isAudio: false,
    isImage: false,
    duration: 120,
    metadata: {
      width: 1920,
      height: 1080,
      frameRate: 30,
    },
  },
  {
    id: "file2",
    originalPath: "/path/to/audio1.mp3",
    name: "audio1.mp3",
    size: 500000,
    isVideo: false,
    isAudio: true,
    isImage: false,
    duration: 180,
  },
  {
    id: "file3",
    originalPath: "/path/to/image1.jpg",
    name: "image1.jpg",
    size: 200000,
    isVideo: false,
    isAudio: false,
    isImage: true,
  },
]

const mockAppSettings = {
  getMediaFiles: vi.fn(() => mockMediaFiles),
  updateMediaFiles: vi.fn(),
}

vi.mock("../../hooks/use-app-settings", () => ({
  useAppSettings: () => mockAppSettings,
}))

describe("useMediaFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен возвращать список медиа-файлов", () => {
    const { result } = renderHook(() => useMediaFiles())

    expect(result.current.mediaFiles).toEqual(mockMediaFiles)
    expect(mockAppSettings.getMediaFiles).toHaveBeenCalled()
  })

  it("должен предоставлять метод обновления медиа-файлов", () => {
    const { result } = renderHook(() => useMediaFiles())

    const newMediaFiles = [
      ...mockMediaFiles,
      {
        id: "file4",
        originalPath: "/path/to/video2.mp4",
        name: "video2.mp4",
        size: 2000000,
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 240,
      },
    ]

    act(() => {
      result.current.updateMediaFiles(newMediaFiles)
    })

    expect(mockAppSettings.updateMediaFiles).toHaveBeenCalledWith(newMediaFiles)
  })

  it("должен корректно работать с пустым списком", () => {
    mockAppSettings.getMediaFiles.mockReturnValue([])

    const { result } = renderHook(() => useMediaFiles())

    expect(result.current.mediaFiles).toEqual([])
  })

  it("должен обновляться при изменении списка файлов", () => {
    const files1 = [mockMediaFiles[0]]
    const files2 = [mockMediaFiles[0], mockMediaFiles[1]]

    mockAppSettings.getMediaFiles.mockReturnValue(files1)

    const { result, rerender } = renderHook(() => useMediaFiles())

    expect(result.current.mediaFiles).toHaveLength(1)

    // Меняем возвращаемое значение
    mockAppSettings.getMediaFiles.mockReturnValue(files2)

    // Перерендериваем хук
    rerender()

    expect(result.current.mediaFiles).toHaveLength(2)
  })

  it("должен корректно обрабатывать различные типы медиа-файлов", () => {
    // Восстанавливаем оригинальный мок с файлами разных типов
    mockAppSettings.getMediaFiles.mockReturnValue(mockMediaFiles)

    const { result } = renderHook(() => useMediaFiles())

    const videoFiles = result.current.mediaFiles.filter((f) => f.isVideo)
    const audioFiles = result.current.mediaFiles.filter((f) => f.isAudio)
    const imageFiles = result.current.mediaFiles.filter((f) => f.isImage)

    expect(videoFiles).toHaveLength(1)
    expect(audioFiles).toHaveLength(1)
    expect(imageFiles).toHaveLength(1)
  })

  it("должен сохранять ссылочную целостность методов при перерендере", () => {
    const { result, rerender } = renderHook(() => useMediaFiles())

    const updateMethod1 = result.current.updateMediaFiles

    rerender()

    const updateMethod2 = result.current.updateMediaFiles

    expect(updateMethod1).toBe(updateMethod2)
  })
})
