import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { selectMediaDirectory, selectMediaFile } from "@/features/media"
import { ProvidersWrapper } from "@/test/test-utils"

import { useMediaImport } from "../../hooks/use-media-import"

// Импорты для моков

// Мокаем зависимости
const mockUpdateMediaFiles = vi.fn()
const mockSetProjectDirty = vi.fn()

vi.mock("@/features/app-state", () => ({
  useAppSettings: vi.fn(() => ({
    updateMediaFiles: mockUpdateMediaFiles,
  })),
}))

vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: vi.fn(() => ({
    currentProject: { path: "/test/project" },
    setProjectDirty: mockSetProjectDirty,
  })),
}))

vi.mock("../../hooks/use-media-preview", () => ({
  useMediaPreview: vi.fn(() => ({
    generateThumbnail: vi.fn().mockResolvedValue("thumbnail-data"),
  })),
}))

vi.mock("../../hooks/use-media-processor", () => ({
  useMediaProcessor: vi.fn((options) => ({
    scanFolder: vi.fn().mockResolvedValue([]),
    scanFolderWithThumbnails: vi.fn().mockImplementation((_dir) => {
      // Возвращаем пустой массив файлов для простоты теста
      return Promise.resolve([])
    }),
    processFiles: vi.fn().mockImplementation(async (files) => {
      // Симулируем обработку файлов с задержкой
      await new Promise((resolve) => setTimeout(resolve, 50)) // Небольшая задержка

      files.forEach((file) => {
        options.onFilesDiscovered?.([{ path: file, size: 1024 }])
        options.onMetadataReady?.(file, {
          id: file,
          name: file.split("/").pop(),
          path: file,
          isVideo: file.endsWith(".mp4"),
          isAudio: file.endsWith(".mp3"),
          isImage: file.endsWith(".jpg"),
          size: 1024,
          duration: 60,
          isLoadingMetadata: false,
        })
      })
      return files.map((f) => ({ id: f, path: f }))
    }),
  })),
}))

vi.mock("@/features/media", () => ({
  selectMediaFile: vi.fn(),
  selectMediaDirectory: vi.fn(),
}))

// Мокаем модули
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@/lib/media", () => ({
  getMediaMetadata: vi.fn(),
  selectMediaFile: vi.fn(),
  selectMediaDirectory: vi.fn(),
}))

vi.mock("../../utils/saved-media-utils", () => ({
  convertToSavedMediaFile: vi.fn().mockResolvedValue({}),
}))

const mockSelectMediaFile = vi.mocked(selectMediaFile)
const mockSelectMediaDirectory = vi.mocked(selectMediaDirectory)

describe("useMediaImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useMediaImport(), {
      wrapper: ProvidersWrapper,
    })

    expect(result.current.isImporting).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(typeof result.current.importFile).toBe("function")
    expect(typeof result.current.importFolder).toBe("function")
  })

  it("should import multiple files", async () => {
    const mockFiles = ["/path/to/file1.mp4", "/path/to/file2.mp3"]

    mockSelectMediaFile.mockResolvedValue(mockFiles)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: ProvidersWrapper,
    })

    const importResult = await result.current.importFile()

    // Проверяем результат
    expect(importResult).toBeDefined()
    expect(importResult.success).toBe(true)
    expect(importResult.files).toHaveLength(2)

    // Проверяем первый файл - будет базовая информация
    expect(importResult.files[0]).toMatchObject({
      path: mockFiles[0],
      name: "file1.mp4",
      isVideo: true,
      isAudio: false,
      isImage: false,
      isLoadingMetadata: true,
    })

    // Проверяем второй файл
    expect(importResult.files[1]).toMatchObject({
      path: mockFiles[1],
      name: "file2.mp3",
      isVideo: false,
      isAudio: true,
      isImage: false,
      isLoadingMetadata: true,
    })

    // Проверяем, что файлы были добавлены
    expect(mockUpdateMediaFiles).toHaveBeenCalled()
  })

  it("should import files from a folder", async () => {
    const mockDirectory = "/path/to/directory"

    mockSelectMediaDirectory.mockResolvedValue(mockDirectory)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: ProvidersWrapper,
    })

    const importResult = await result.current.importFolder()

    // Проверяем результат
    expect(importResult).toBeDefined()
    expect(importResult.success).toBe(true)
    expect(importResult.message).toContain("Сканирование папки начато")
  })

  it("should handle file selection cancellation", async () => {
    mockSelectMediaFile.mockResolvedValue(null)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: ProvidersWrapper,
    })

    const importResult = await result.current.importFile()

    expect(importResult.success).toBe(false)
    expect(importResult.message).toContain("Файлы не выбраны")
    expect(mockUpdateMediaFiles).not.toHaveBeenCalled()
  })

  it("should handle folder selection cancellation", async () => {
    mockSelectMediaDirectory.mockResolvedValue(null)

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: ProvidersWrapper,
    })

    const importResult = await result.current.importFolder()

    expect(importResult.success).toBe(false)
    expect(importResult.message).toContain("Директория не выбрана")
  })

  it("should update progress during import", async () => {
    const mockFiles = Array.from({ length: 10 }, (_, i) => `/path/to/file${i}.mp4`)

    // Создаем мок с задержкой для selectMediaFile
    mockSelectMediaFile.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockFiles), 10)
      })
    })

    const { result } = renderHook(() => useMediaImport(), {
      wrapper: ProvidersWrapper,
    })

    // Проверяем начальное состояние
    expect(result.current.isImporting).toBe(false)
    expect(result.current.progress).toBe(0)

    // Запускаем импорт
    const importPromise = result.current.importFile()

    // Ждем, пока состояние isImporting станет true
    await waitFor(() => {
      expect(result.current.isImporting).toBe(true)
    })

    // Ждем завершения импорта
    const importResult = await importPromise

    // Проверяем, что импорт завершен
    await waitFor(() => {
      expect(result.current.isImporting).toBe(false)
    })
    expect(result.current.progress).toBe(0)
    expect(importResult.files).toHaveLength(10)
  })
})
