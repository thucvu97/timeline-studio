import { ReactNode } from "react"

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppSettingsProvider } from "@/features/app-state"
import { I18nProvider } from "@/i18n/services/i18n-provider"

import { useMusicImport } from "../../hooks/use-music-import"

// Test wrapper with required providers
const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider>
    <AppSettingsProvider>{children}</AppSettingsProvider>
  </I18nProvider>
)

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Mock media utilities
vi.mock("@/features/media", () => ({
  selectAudioFile: vi.fn(),
  selectMediaDirectory: vi.fn(),
  getMediaMetadata: vi.fn(),
  convertToSavedMusicFile: vi.fn(),
}))

// Mock app state hooks
vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: vi.fn(() => ({
    currentProject: { path: null, name: null },
    setProjectDirty: vi.fn(),
    saveProject: vi.fn(),
  })),
}))

vi.mock("@/features/app-state/hooks/use-music-files", () => ({
  useMusicFiles: vi.fn(() => ({
    updateMusicFiles: vi.fn(),
  })),
}))

describe("useMusicImport - Simplified Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Hook initialization", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useMusicImport(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current.isImporting).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(typeof result.current.importFile).toBe("function")
      expect(typeof result.current.importDirectory).toBe("function")
    })
  })

  describe("importFile basic functionality", () => {
    it("should return correct result when files are selected", async () => {
      const { selectAudioFile } = vi.mocked(await import("@/features/media"))
      selectAudioFile.mockResolvedValue(["/test/file1.mp3", "/test/file2.mp3"])

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      const importResult = await result.current.importFile()

      expect(selectAudioFile).toHaveBeenCalled()
      expect(importResult.success).toBe(true)
      expect(importResult.files).toHaveLength(2)
      expect(importResult.message).toContain("Успешно импортировано 2 музыкальных файлов")
    })

    it("should handle no files selected", async () => {
      const { selectAudioFile } = vi.mocked(await import("@/features/media"))
      selectAudioFile.mockResolvedValue(null)

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      const importResult = await result.current.importFile()

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("Файлы не выбраны")
      expect(importResult.files).toHaveLength(0)
    })

    it("should handle import errors", async () => {
      const { selectAudioFile } = vi.mocked(await import("@/features/media"))
      selectAudioFile.mockRejectedValue(new Error("Test error"))

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      const importResult = await result.current.importFile()

      expect(importResult.success).toBe(false)
      expect(importResult.message).toContain("Ошибка при импорте")
    })
  })

  describe("importDirectory basic functionality", () => {
    it("should filter audio files from directory", async () => {
      const { selectMediaDirectory } = vi.mocked(await import("@/features/media"))
      const { invoke } = vi.mocked(await import("@tauri-apps/api/core"))

      selectMediaDirectory.mockResolvedValue("/test/music")
      invoke.mockResolvedValue([
        "/test/music/song.mp3",
        "/test/music/track.wav",
        "/test/music/video.mp4", // Should be filtered out
        "/test/music/audio.flac",
      ])

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      const importResult = await result.current.importDirectory()

      expect(selectMediaDirectory).toHaveBeenCalled()
      expect(invoke).toHaveBeenCalledWith("get_media_files", { directory: "/test/music" })
      expect(importResult.success).toBe(true)
      expect(importResult.files).toHaveLength(3) // Only audio files
      expect(importResult.message).toContain("Успешно импортировано 3 музыкальных файлов")
    })

    it("should handle no directory selected", async () => {
      const { selectMediaDirectory } = vi.mocked(await import("@/features/media"))
      selectMediaDirectory.mockResolvedValue(null)

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      const importResult = await result.current.importDirectory()

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("Директория не выбрана")
    })

    it("should handle directory with no audio files", async () => {
      const { selectMediaDirectory } = vi.mocked(await import("@/features/media"))
      const { invoke } = vi.mocked(await import("@tauri-apps/api/core"))

      selectMediaDirectory.mockResolvedValue("/test/videos")
      invoke.mockResolvedValue(["/test/videos/video1.mp4", "/test/videos/video2.avi"])

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      const importResult = await result.current.importDirectory()

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("В выбранной директории нет аудиофайлов")
    })
  })

  describe("File creation", () => {
    it("should create proper MediaFile objects", async () => {
      const { selectAudioFile } = vi.mocked(await import("@/features/media"))
      const { useMusicFiles } = vi.mocked(await import("@/features/app-state/hooks/use-music-files"))

      const mockUpdateMusicFiles = vi.fn()
      useMusicFiles.mockReturnValue({
        updateMusicFiles: mockUpdateMusicFiles,
      } as any)

      selectAudioFile.mockResolvedValue(["/test/song.mp3"])

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      await result.current.importFile()

      expect(mockUpdateMusicFiles).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "/test/song.mp3",
          name: "song.mp3",
          path: "/test/song.mp3",
          isAudio: true,
          isVideo: false,
          isImage: false,
          isLoadingMetadata: true,
        }),
      ])
    })

    it("should detect audio file types correctly", async () => {
      const { selectAudioFile } = vi.mocked(await import("@/features/media"))
      const { useMusicFiles } = vi.mocked(await import("@/features/app-state/hooks/use-music-files"))

      const mockUpdateMusicFiles = vi.fn()
      useMusicFiles.mockReturnValue({
        updateMusicFiles: mockUpdateMusicFiles,
      } as any)

      const audioFiles = [
        "/test/file.mp3",
        "/test/file.wav",
        "/test/file.flac",
        "/test/file.aac",
        "/test/file.m4a",
        "/test/file.ogg",
        "/test/file.wma",
      ]

      selectAudioFile.mockResolvedValue(audioFiles)

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      await result.current.importFile()

      const createdFiles = mockUpdateMusicFiles.mock.calls[0][0]
      expect(createdFiles).toHaveLength(7)
      expect(createdFiles.every((f: any) => f.isAudio === true)).toBe(true)
    })
  })

  describe("Project integration", () => {
    it("should attempt to save files when project is open", async () => {
      const { selectAudioFile, convertToSavedMusicFile } = vi.mocked(await import("@/features/media"))
      const { useCurrentProject } = vi.mocked(await import("@/features/app-state/hooks/use-current-project"))

      const mockSaveProject = vi.fn()
      const mockSetProjectDirty = vi.fn()

      useCurrentProject.mockReturnValue({
        currentProject: {
          path: "/project/path",
          name: "Test Project",
        },
        setProjectDirty: mockSetProjectDirty,
        saveProject: mockSaveProject,
      } as any)

      selectAudioFile.mockResolvedValue(["/test/song.mp3"])
      convertToSavedMusicFile.mockResolvedValue({
        id: "1",
        name: "song.mp3",
        relativePath: "music/song.mp3",
      } as any)

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      await result.current.importFile()

      expect(convertToSavedMusicFile).toHaveBeenCalled()
      expect(mockSaveProject).toHaveBeenCalledWith("Test Project")
      expect(mockSetProjectDirty).toHaveBeenCalledWith(true)
    })

    it("should not save when no project is open", async () => {
      const { selectAudioFile } = vi.mocked(await import("@/features/media"))
      const { useCurrentProject } = vi.mocked(await import("@/features/app-state/hooks/use-current-project"))

      const mockSaveProject = vi.fn()

      useCurrentProject.mockReturnValue({
        currentProject: {
          path: null,
          name: null,
        },
        setProjectDirty: vi.fn(),
        saveProject: mockSaveProject,
      } as any)

      selectAudioFile.mockResolvedValue(["/test/song.mp3"])

      const { result } = renderHook(() => useMusicImport(), { wrapper })

      await result.current.importFile()

      expect(mockSaveProject).not.toHaveBeenCalled()
    })
  })
})
