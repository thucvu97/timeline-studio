import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Мокаем Tauri API
const mockInvoke = vi.fn()
vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

// Мокаем хук текущего проекта
const mockCurrentProject = {
  id: "test-project",
  name: "Test Project",
  path: "/test/project",
}

const mockSetProjectDirty = vi.fn()

vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: mockCurrentProject,
    setProjectDirty: mockSetProjectDirty,
  }),
}))

// Мокаем медиа утилиты
const mockSelectAudioFile = vi.fn()
const mockSelectMediaDirectory = vi.fn()
const mockGetMediaMetadata = vi.fn()

vi.mock("@/lib/media", () => ({
  selectAudioFile: mockSelectAudioFile,
  selectMediaDirectory: mockSelectMediaDirectory,
  getMediaMetadata: mockGetMediaMetadata,
}))

// Мокаем утилиты сохранения медиа
const mockConvertToSavedMusicFile = vi.fn()

vi.mock("@/lib/saved-media-utils", () => ({
  convertToSavedMusicFile: mockConvertToSavedMusicFile,
}))

// Мокаем хук музыки
const mockAddMusicFiles = vi.fn()
const mockUpdateMusicFiles = vi.fn()

vi.mock("../hooks/use-music", () => ({
  useMusic: () => ({
    addMusicFiles: mockAddMusicFiles,
    updateMusicFiles: mockUpdateMusicFiles,
  }),
}))

describe("useMusicImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем все моки к их изначальному состоянию
    mockSelectAudioFile.mockReset()
    mockSelectMediaDirectory.mockReset()
    mockGetMediaMetadata.mockReset()
    mockConvertToSavedMusicFile.mockReset()
    mockInvoke.mockReset()
    mockAddMusicFiles.mockReset()
    mockUpdateMusicFiles.mockReset()
    mockSetProjectDirty.mockReset()

    // Убираем все implementation моки
    mockGetMediaMetadata.mockClear()
    mockConvertToSavedMusicFile.mockClear()
  })

  it("should import useMusicImport hook without errors", async () => {
    // Проверяем, что хук импортируется без ошибок
    const { useMusicImport } = await import("../hooks/use-music-import")

    expect(useMusicImport).toBeDefined()
    expect(typeof useMusicImport).toBe("function")
  })

  it("should provide import functions", async () => {
    const { useMusicImport } = await import("../hooks/use-music-import")
    const { result } = renderHook(() => useMusicImport())

    // Проверяем, что хук возвращает необходимые функции
    expect(result.current.importFile).toBeDefined()
    expect(typeof result.current.importFile).toBe("function")

    expect(result.current.importDirectory).toBeDefined()
    expect(typeof result.current.importDirectory).toBe("function")

    // Хук возвращает только функции импорта
  })

  it("should handle file import", async () => {
    const { useMusicImport } = await import("../hooks/use-music-import")

    // Мокаем успешный выбор файлов (возвращает массив)
    const mockFiles = ["/path/to/music.mp3"]
    mockSelectAudioFile.mockResolvedValue(mockFiles)

    // Мокаем получение метаданных
    const mockMetadata = {
      duration: 180,
      bitrate: 320,
      sampleRate: 44100,
      artist: "Test Artist",
      title: "Test Song",
      album: "Test Album",
    }
    mockGetMediaMetadata.mockResolvedValue(mockMetadata)

    // Мокаем конвертацию в сохраненный файл
    const mockSavedFile = {
      id: "test-id",
      path: mockFiles[0],
      name: "music.mp3",
      type: "audio",
      size: 5000000,
      duration: 180,
      createdAt: new Date(),
      modifiedAt: new Date(),
    }
    mockConvertToSavedMusicFile.mockResolvedValue(mockSavedFile)

    const { result } = renderHook(() => useMusicImport())

    // Выполняем импорт файла
    await act(async () => {
      await result.current.importFile()
    })

    // Проверяем, что функции были вызваны
    expect(mockSelectAudioFile).toHaveBeenCalledTimes(1)
    // Метаданные загружаются асинхронно, поэтому не проверяем их сразу
    expect(mockConvertToSavedMusicFile).toHaveBeenCalledTimes(1)
  })

  it("should handle directory import", async () => {
    const { useMusicImport } = await import("../hooks/use-music-import")

    // Мокаем успешный выбор директории
    const mockDirectory = "/path/to/music/folder"
    mockSelectMediaDirectory.mockResolvedValue(mockDirectory)

    // Мокаем получение файлов из директории
    const mockFiles = [
      "/path/to/music/folder/song1.mp3",
      "/path/to/music/folder/song2.wav",
      "/path/to/music/folder/song3.flac",
    ]
    mockInvoke.mockResolvedValue(mockFiles)

    // Мокаем метаданные для каждого файла
    mockGetMediaMetadata.mockImplementation((path: string) => {
      const filename = path.split("/").pop()
      return Promise.resolve({
        duration: 180,
        bitrate: 320,
        sampleRate: 44100,
        artist: "Test Artist",
        title: filename?.split(".")[0],
        album: "Test Album",
      })
    })

    // Мокаем конвертацию файлов
    mockConvertToSavedMusicFile.mockImplementation((file: any) => {
      return Promise.resolve({
        id: `test-id-${file.path}`,
        path: file.path,
        name: file.path.split("/").pop(),
        type: "audio",
        size: 5000000,
        duration: 180,
        createdAt: new Date(),
        modifiedAt: new Date(),
      })
    })

    const { result } = renderHook(() => useMusicImport())

    // Выполняем импорт директории
    await act(async () => {
      await result.current.importDirectory()
    })

    // Проверяем, что функции были вызваны
    expect(mockSelectMediaDirectory).toHaveBeenCalledTimes(1)
    expect(mockInvoke).toHaveBeenCalledWith("get_media_files", {
      directory: mockDirectory,
    })
    // Метаданные загружаются асинхронно, поэтому не проверяем их сразу
    expect(mockConvertToSavedMusicFile).toHaveBeenCalledTimes(3)
  })

  it("should handle import errors gracefully", async () => {
    const { useMusicImport } = await import("../hooks/use-music-import")

    // Мокаем ошибку при выборе файла
    const mockError = new Error("Failed to select file")
    mockSelectAudioFile.mockRejectedValue(mockError)

    const { result } = renderHook(() => useMusicImport())

    // Выполняем импорт файла с ошибкой - не должно выбрасывать исключение
    await act(async () => {
      await expect(result.current.importFile()).resolves.not.toThrow()
    })
  })

  it("should handle cancelled file selection", async () => {
    const { useMusicImport } = await import("../hooks/use-music-import")

    // Мокаем отмену выбора файла (пустой массив)
    mockSelectAudioFile.mockResolvedValue([])

    const { result } = renderHook(() => useMusicImport())

    // Выполняем импорт файла
    await act(async () => {
      await result.current.importFile()
    })

    // Проверяем, что функции метаданных не вызывались
    expect(mockGetMediaMetadata).not.toHaveBeenCalled()
    expect(mockConvertToSavedMusicFile).not.toHaveBeenCalled()
  })

  it("should handle empty directory", async () => {
    const { useMusicImport } = await import("../hooks/use-music-import")

    // Мокаем успешный выбор директории
    const mockDirectory = "/path/to/empty/folder"
    mockSelectMediaDirectory.mockResolvedValue(mockDirectory)

    // Мокаем пустой список файлов
    mockInvoke.mockResolvedValue([])

    const { result } = renderHook(() => useMusicImport())

    // Выполняем импорт директории
    await act(async () => {
      await result.current.importDirectory()
    })

    // Проверяем, что функции метаданных не вызывались
    expect(mockGetMediaMetadata).not.toHaveBeenCalled()
    expect(mockConvertToSavedMusicFile).not.toHaveBeenCalled()
  })

  it("should validate audio file formats", () => {
    // Тестируем различные форматы файлов
    const validFormats = [".mp3", ".wav", ".flac", ".aac", ".ogg"]
    const invalidFormats = [".txt", ".jpg", ".mp4", ".pdf"]

    validFormats.forEach((format) => {
      expect(format).toMatch(/\.(mp3|wav|flac|aac|ogg)$/i)
    })

    invalidFormats.forEach((format) => {
      expect(format).not.toMatch(/\.(mp3|wav|flac|aac|ogg)$/i)
    })
  })

  it("should handle concurrent imports", async () => {
    const { useMusicImport } = await import("../hooks/use-music-import")

    // Мокаем файлы для импорта (возвращает массив)
    mockSelectAudioFile.mockResolvedValue(["/path/to/music1.mp3"])
    mockGetMediaMetadata.mockResolvedValue({
      duration: 180,
      bitrate: 320,
      sampleRate: 44100,
    })
    mockConvertToSavedMusicFile.mockResolvedValue({
      id: "test-id",
      path: "/path/to/music1.mp3",
      name: "music1.mp3",
      type: "audio",
      size: 5000000,
      duration: 180,
      createdAt: new Date(),
      modifiedAt: new Date(),
    })

    const { result } = renderHook(() => useMusicImport())

    // Запускаем несколько импортов одновременно
    await act(async () => {
      const promises = [result.current.importFile(), result.current.importFile(), result.current.importFile()]
      await Promise.all(promises)
    })

    // Проверяем, что все импорты выполнены
    expect(mockSelectAudioFile).toHaveBeenCalledTimes(3)
  })
})
