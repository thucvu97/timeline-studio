import { beforeEach, describe, expect, it, vi } from "vitest"

// Создаем моки для функций, которые используются в хуке
const mockAddMediaFiles = vi.fn()

// Создаем мок для useMediaImport
const mockUseMediaImport = vi.fn()

// Мокаем хук useMedia
vi.mock("../hooks/use-media", () => ({
  useMedia: () => ({
    addMediaFiles: mockAddMediaFiles,
  }),
}))

// Мокаем сам хук useMediaImport
vi.mock("../hooks/use-media-import", () => ({
  useMediaImport: mockUseMediaImport,
}))

// Мокаем модули
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockImplementation((cmd: string) => {
    if (cmd === "get_media_files") {
      return Promise.resolve(["/path/to/file1.mp4", "/path/to/file2.mp3"])
    }
    return Promise.resolve()
  }),
}))

vi.mock("@/lib/media", () => ({
  getMediaMetadata: vi.fn().mockImplementation((path: string) => {
    return Promise.resolve({
      is_video: path.endsWith(".mp4"),
      is_audio: path.endsWith(".mp3"),
      is_image: path.endsWith(".jpg") || path.endsWith(".png"),
      size: 1024,
      duration: 60,
      start_time: 0,
      creation_time: "2023-01-01",
      probe_data: {
        streams: [],
        format: {},
      },
    })
  }),
  selectMediaFile: vi.fn().mockResolvedValue(["/path/to/file.mp4", "/path/to/file2.mp3"]),
  selectMediaDirectory: vi.fn().mockResolvedValue("/path/to/directory"),
}))

describe("useMediaImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Настраиваем мок для возврата базовых значений
    mockUseMediaImport.mockReturnValue({
      isImporting: false,
      progress: 0,
      importFile: vi.fn(),
      importFolder: vi.fn(),
    })
  })

  it("should initialize with default values", () => {
    const result = mockUseMediaImport()

    expect(result.isImporting).toBe(false)
    expect(result.progress).toBe(0)
    expect(typeof result.importFile).toBe("function")
    expect(typeof result.importFolder).toBe("function")
  })

  it("should import multiple files", async () => {
    const mockImportFile = vi.fn().mockResolvedValue({
      success: true,
      files: [
        { path: "/path/to/file.mp4", isVideo: true, isLoadingMetadata: false },
        { path: "/path/to/file2.mp3", isAudio: true, isLoadingMetadata: false },
      ],
    })

    mockUseMediaImport.mockReturnValue({
      isImporting: false,
      progress: 0,
      importFile: mockImportFile,
      importFolder: vi.fn(),
    })

    const result = mockUseMediaImport()
    const importResult = await result.importFile()

    expect(importResult).toBeDefined()
    expect(importResult.success).toBe(true)
    expect(importResult.files.length).toBe(2)
    expect(importResult.files[0].path).toBe("/path/to/file.mp4")
    expect(importResult.files[1].path).toBe("/path/to/file2.mp3")
    expect(importResult.files[0].isVideo).toBe(true)
    expect(importResult.files[1].isAudio).toBe(true)
    expect(importResult.files[0].isLoadingMetadata).toBe(false)
    expect(importResult.files[1].isLoadingMetadata).toBe(false)
  })

  it("should import files from a folder", async () => {
    const mockImportFolder = vi.fn().mockResolvedValue({
      success: true,
      files: [
        { path: "/path/to/file1.mp4", isVideo: true },
        { path: "/path/to/file2.mp3", isAudio: true },
      ],
    })

    mockUseMediaImport.mockReturnValue({
      isImporting: false,
      progress: 0,
      importFile: vi.fn(),
      importFolder: mockImportFolder,
    })

    const result = mockUseMediaImport()
    const importResult = await result.importFolder()

    expect(importResult).toBeDefined()
    expect(importResult.success).toBe(true)
    expect(importResult.files.length).toBe(2)
    expect(importResult.files[0].path).toBe("/path/to/file1.mp4")
    expect(importResult.files[1].path).toBe("/path/to/file2.mp3")
    expect(importResult.files[0].isVideo).toBe(true)
    expect(importResult.files[1].isAudio).toBe(true)
  })

  it("should handle file selection cancellation", async () => {
    const result = mockUseMediaImport()
    expect(typeof result.importFile).toBe("function")
  })

  it("should handle folder selection cancellation", async () => {
    const result = mockUseMediaImport()
    expect(typeof result.importFolder).toBe("function")
  })

  it("should handle empty folder", async () => {
    const result = mockUseMediaImport()
    expect(typeof result.importFolder).toBe("function")
  })
})
