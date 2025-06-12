import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useMusicFiles } from "../../hooks/use-music-files"

// Мокаем useAppSettings
const mockMusicFiles = [
  {
    id: "music1",
    originalPath: "/path/to/song1.mp3",
    name: "song1.mp3",
    size: 3000000,
    isVideo: false,
    isAudio: true,
    isImage: false,
    duration: 210,
    artist: "Artist 1",
    album: "Album 1",
    title: "Song 1",
  },
  {
    id: "music2",
    originalPath: "/path/to/song2.wav",
    name: "song2.wav",
    size: 10000000,
    isVideo: false,
    isAudio: true,
    isImage: false,
    duration: 180,
    artist: "Artist 2",
    album: "Album 2",
    title: "Song 2",
  },
  {
    id: "music3",
    originalPath: "/path/to/background.flac",
    name: "background.flac",
    size: 20000000,
    isVideo: false,
    isAudio: true,
    isImage: false,
    duration: 300,
  },
]

const mockAppSettings = {
  getMusicFiles: vi.fn(() => mockMusicFiles),
  updateMusicFiles: vi.fn(),
}

vi.mock("../../hooks/use-app-settings", () => ({
  useAppSettings: () => mockAppSettings,
}))

describe("useMusicFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен возвращать список музыкальных файлов", () => {
    const { result } = renderHook(() => useMusicFiles())

    expect(result.current.musicFiles).toEqual(mockMusicFiles)
    expect(mockAppSettings.getMusicFiles).toHaveBeenCalled()
  })

  it("должен предоставлять метод обновления музыкальных файлов", () => {
    const { result } = renderHook(() => useMusicFiles())

    const newMusicFiles = [
      ...mockMusicFiles,
      {
        id: "music4",
        originalPath: "/path/to/song3.mp3",
        name: "song3.mp3",
        size: 4000000,
        isVideo: false,
        isAudio: true,
        isImage: false,
        duration: 240,
        artist: "Artist 3",
        title: "Song 3",
      },
    ]

    act(() => {
      result.current.updateMusicFiles(newMusicFiles)
    })

    expect(mockAppSettings.updateMusicFiles).toHaveBeenCalledWith(newMusicFiles)
  })

  it("должен корректно работать с пустым списком", () => {
    mockAppSettings.getMusicFiles.mockReturnValue([])

    const { result } = renderHook(() => useMusicFiles())

    expect(result.current.musicFiles).toEqual([])
  })

  it("должен обновляться при изменении списка файлов", () => {
    const files1 = [mockMusicFiles[0]]
    const files2 = [mockMusicFiles[0], mockMusicFiles[1]]

    mockAppSettings.getMusicFiles.mockReturnValue(files1)

    const { result, rerender } = renderHook(() => useMusicFiles())

    expect(result.current.musicFiles).toHaveLength(1)

    // Меняем возвращаемое значение
    mockAppSettings.getMusicFiles.mockReturnValue(files2)

    // Перерендериваем хук
    rerender()

    expect(result.current.musicFiles).toHaveLength(2)
  })

  it("должен корректно обрабатывать файлы с метаданными и без", () => {
    // Восстанавливаем оригинальный мок с файлами
    mockAppSettings.getMusicFiles.mockReturnValue(mockMusicFiles)
    
    const { result } = renderHook(() => useMusicFiles())

    const filesWithMetadata = result.current.musicFiles.filter((f) => f.artist && f.title)
    const filesWithoutMetadata = result.current.musicFiles.filter((f) => !f.artist || !f.title)

    expect(filesWithMetadata).toHaveLength(2)
    expect(filesWithoutMetadata).toHaveLength(1)
  })

  it("должен сохранять ссылочную целостность методов при перерендере", () => {
    const { result, rerender } = renderHook(() => useMusicFiles())

    const updateMethod1 = result.current.updateMusicFiles

    rerender()

    const updateMethod2 = result.current.updateMusicFiles

    expect(updateMethod1).toBe(updateMethod2)
  })

  it("должен корректно обрабатывать удаление файлов", () => {
    const { result } = renderHook(() => useMusicFiles())

    const updatedFiles = mockMusicFiles.filter((f) => f.id !== "music2")

    act(() => {
      result.current.updateMusicFiles(updatedFiles)
    })

    expect(mockAppSettings.updateMusicFiles).toHaveBeenCalledWith(updatedFiles)
    expect(updatedFiles).toHaveLength(2)
  })

  it("должен корректно обрабатывать обновление метаданных файла", () => {
    const { result } = renderHook(() => useMusicFiles())

    const updatedFiles = mockMusicFiles.map((file) =>
      file.id === "music3"
        ? { ...file, artist: "Background Artist", title: "Background Music" }
        : file
    )

    act(() => {
      result.current.updateMusicFiles(updatedFiles)
    })

    expect(mockAppSettings.updateMusicFiles).toHaveBeenCalledWith(updatedFiles)
    expect(updatedFiles.find((f) => f.id === "music3")).toHaveProperty("artist", "Background Artist")
  })
})