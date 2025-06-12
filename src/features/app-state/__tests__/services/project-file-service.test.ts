import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SavedMediaFile, SavedMusicFile } from "@/features/media/types/saved-media"
import { ProjectFile } from "@/features/project-settings/types/project"

import { ProjectFileService } from "../../services/project-file-service"

// Мокаем Tauri FS
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}))

describe("ProjectFileService", () => {
  const mockProjectPath = "/path/to/project.tlsp"

  const mockProjectFile: ProjectFile = {
    settings: {
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкранный",
        description: "YouTube",
        value: { width: 1920, height: 1080, name: "16:9" },
      },
      resolution: "1920x1080",
      frameRate: "30",
      colorSpace: "sdr",
    },
    mediaLibrary: {
      mediaFiles: [
        {
          id: "1",
          originalPath: "/path/to/video.mp4",
          name: "video.mp4",
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
      ],
      musicFiles: [
        {
          id: "2",
          originalPath: "/path/to/music.mp3",
          name: "music.mp3",
          size: 500000,
          isVideo: false,
          isAudio: true,
          isImage: false,
          duration: 180,
        },
      ],
      lastUpdated: Date.now(),
      version: "1.0.0",
    },
    browserState: {
      media: {
        viewMode: "grid",
        sortBy: "name",
        sortOrder: "asc",
        searchQuery: "",
        filterType: "all",
        groupBy: "none",
      },
      music: {
        viewMode: "list",
        sortBy: "name",
        sortOrder: "asc",
        searchQuery: "",
        filterType: "all",
        groupBy: "none",
        showFavoritesOnly: false,
      },
    },
    projectFavorites: {
      mediaFiles: [],
      musicFiles: [],
    },
    meta: {
      version: "1.0.0",
      createdAt: Date.now(),
      lastModified: Date.now(),
      originalPlatform: "unknown",
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("loadProject", () => {
    it("должен успешно загружать проект из файла", async () => {
      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(mockProjectFile))

      const project = await ProjectFileService.loadProject(mockProjectPath)

      expect(project).toEqual(mockProjectFile)
      expect(readTextFile).toHaveBeenCalledWith(mockProjectPath)
    })

    it("должен выбрасывать ошибку при невалидном JSON", async () => {
      vi.mocked(readTextFile).mockResolvedValue("invalid json")

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow()
    })

    it("должен выбрасывать ошибку при отсутствии обязательных полей", async () => {
      const invalidProject = { ...mockProjectFile }
      // @ts-expect-error - намеренно удаляем обязательное поле
      invalidProject.settings = undefined

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(invalidProject))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid project structure: missing settings",
      )
    })

    it("должен выбрасывать ошибку при неподдерживаемой версии", async () => {
      const unsupportedProject = {
        ...mockProjectFile,
        meta: { ...mockProjectFile.meta, version: "2.0.0" },
      }

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(unsupportedProject))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Unsupported project version: 2.0.0",
      )
    })

    it("должен валидировать медиабиблиотеку", async () => {
      const projectWithInvalidMedia = {
        ...mockProjectFile,
        mediaLibrary: {
          ...mockProjectFile.mediaLibrary,
          mediaFiles: "not an array",
        },
      }

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(projectWithInvalidMedia))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid media library: mediaFiles must be an array",
      )
    })

    it("должен валидировать медиафайлы", async () => {
      const projectWithInvalidFile = {
        ...mockProjectFile,
        mediaLibrary: {
          ...mockProjectFile.mediaLibrary,
          mediaFiles: [
            {
              id: "1",
              // отсутствует обязательное поле originalPath
              name: "video.mp4",
              size: 1000000,
              isVideo: true,
              isAudio: false,
              isImage: false,
            },
          ],
        },
      }

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(projectWithInvalidFile))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid saved media file: missing field originalPath",
      )
    })
  })

  describe("saveProject", () => {
    it("должен сохранять проект с обновленными метаданными", async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      await ProjectFileService.saveProject(mockProjectPath, mockProjectFile)

      const expectedProject = {
        ...mockProjectFile,
        meta: {
          ...mockProjectFile.meta,
          lastModified: now,
        },
      }

      expect(writeTextFile).toHaveBeenCalledWith(mockProjectPath, JSON.stringify(expectedProject, null, 2))

      vi.useRealTimers()
    })

    it("должен выбрасывать ошибку при неудачном сохранении", async () => {
      vi.mocked(writeTextFile).mockRejectedValue(new Error("Write failed"))

      await expect(ProjectFileService.saveProject(mockProjectPath, mockProjectFile)).rejects.toThrow(
        "Failed to save project: Error: Write failed",
      )
    })
  })

  describe("createNewProject", () => {
    it("должен создавать новый проект с базовой структурой", () => {
      const project = ProjectFileService.createNewProject("Новый проект")

      expect(project.settings).toBeDefined()
      expect(project.mediaLibrary).toBeDefined()
      expect(project.browserState).toBeDefined()
      expect(project.projectFavorites).toBeDefined()
      expect(project.meta).toBeDefined()
      expect(project.meta.version).toBe("1.0.0")
    })

    it("должен устанавливать корректные значения по умолчанию", () => {
      const project = ProjectFileService.createNewProject("Тестовый проект")

      expect(project.settings.aspectRatio.value).toEqual({ width: 1920, height: 1080, name: "16:9" })
      expect(project.settings.frameRate).toBe("30")
      expect(project.mediaLibrary.mediaFiles).toEqual([])
      expect(project.mediaLibrary.musicFiles).toEqual([])
    })
  })

  describe("updateMediaLibrary", () => {
    it("должен обновлять медиабиблиотеку проекта", () => {
      const newMediaFiles: SavedMediaFile[] = [
        {
          id: "3",
          originalPath: "/path/to/new-video.mp4",
          name: "new-video.mp4",
          size: 2000000,
          isVideo: true,
          isAudio: false,
          isImage: false,
          duration: 240,
        },
      ]

      const newMusicFiles: SavedMusicFile[] = []

      const updatedProject = ProjectFileService.updateMediaLibrary(mockProjectFile, newMediaFiles, newMusicFiles)

      expect(updatedProject.mediaLibrary.mediaFiles).toEqual(newMediaFiles)
      expect(updatedProject.mediaLibrary.musicFiles).toEqual(newMusicFiles)
      expect(updatedProject.mediaLibrary.lastUpdated).toBeGreaterThan(0)
    })

    it("должен сохранять версию медиабиблиотеки", () => {
      const updatedProject = ProjectFileService.updateMediaLibrary(mockProjectFile, [], [])

      expect(updatedProject.mediaLibrary.version).toBe("1.0.0")
    })
  })

  describe("updateBrowserState", () => {
    it("должен обновлять состояние браузера", () => {
      const newBrowserState = {
        ...mockProjectFile.browserState,
        media: {
          ...mockProjectFile.browserState.media,
          viewMode: "list" as const,
          sortBy: "size" as const,
        },
      }

      const updatedProject = ProjectFileService.updateBrowserState(mockProjectFile, newBrowserState)

      expect(updatedProject.browserState).toEqual(newBrowserState)
    })
  })

  describe("updateProjectFavorites", () => {
    it("должен обновлять избранные файлы проекта", () => {
      const newFavorites = {
        mediaFiles: ["file1", "file2"],
        musicFiles: ["music1"],
      }

      const updatedProject = ProjectFileService.updateProjectFavorites(mockProjectFile, newFavorites)

      expect(updatedProject.projectFavorites).toEqual(newFavorites)
    })
  })

  describe("getProjectStats", () => {
    it("должен возвращать статистику проекта", () => {
      const stats = ProjectFileService.getProjectStats(mockProjectFile)

      expect(stats.totalMediaFiles).toBe(1)
      expect(stats.totalMusicFiles).toBe(1)
      expect(stats.totalSize).toBe(1500000)
      expect(stats.lastModified).toBe(mockProjectFile.meta.lastModified)
    })

    it("должен корректно обрабатывать проект без медиабиблиотеки", () => {
      const projectWithoutMedia = {
        ...mockProjectFile,
        mediaLibrary: undefined,
      }

      const stats = ProjectFileService.getProjectStats(projectWithoutMedia as any)

      expect(stats.totalMediaFiles).toBe(0)
      expect(stats.totalMusicFiles).toBe(0)
      expect(stats.totalSize).toBe(0)
    })
  })

  describe("hasUnsavedChanges", () => {
    it("должен определять наличие несохраненных изменений", () => {
      const currentMediaFiles = [
        ...mockProjectFile.mediaLibrary.mediaFiles,
        {
          id: "3",
          originalPath: "/path/to/new.mp4",
          name: "new.mp4",
          size: 1000,
          isVideo: true,
          isAudio: false,
          isImage: false,
        },
      ]

      const hasChanges = ProjectFileService.hasUnsavedChanges(
        mockProjectFile,
        currentMediaFiles,
        mockProjectFile.mediaLibrary.musicFiles,
      )

      expect(hasChanges).toBe(true)
    })

    it("должен возвращать false при отсутствии изменений", () => {
      const hasChanges = ProjectFileService.hasUnsavedChanges(
        mockProjectFile,
        mockProjectFile.mediaLibrary.mediaFiles,
        mockProjectFile.mediaLibrary.musicFiles,
      )

      expect(hasChanges).toBe(false)
    })

    it("должен определять изменения в количестве файлов", () => {
      const hasChanges = ProjectFileService.hasUnsavedChanges(
        mockProjectFile,
        [],
        mockProjectFile.mediaLibrary.musicFiles,
      )

      expect(hasChanges).toBe(true)
    })

    it("должен корректно обрабатывать проект без медиабиблиотеки", () => {
      const projectWithoutMedia = {
        ...mockProjectFile,
        mediaLibrary: undefined,
      }

      const hasChanges = ProjectFileService.hasUnsavedChanges(projectWithoutMedia as any, [], [])

      expect(hasChanges).toBe(false)
    })
  })

  describe("migrateProject", () => {
    it("должен возвращать проект без изменений (пока нет миграций)", () => {
      const migratedProject = ProjectFileService.migrateProject(mockProjectFile)

      expect(migratedProject).toEqual(mockProjectFile)
    })
  })

  describe("валидация", () => {
    it("должен валидировать пустой ID медиафайла", async () => {
      const projectWithEmptyId = {
        ...mockProjectFile,
        mediaLibrary: {
          ...mockProjectFile.mediaLibrary,
          mediaFiles: [
            {
              id: "",
              originalPath: "/path/to/file.mp4",
              name: "file.mp4",
              size: 1000,
              isVideo: true,
              isAudio: false,
              isImage: false,
            },
          ],
        },
      }

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(projectWithEmptyId))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid saved media file: id must be a non-empty string",
      )
    })

    it("должен валидировать пустой originalPath медиафайла", async () => {
      const projectWithEmptyPath = {
        ...mockProjectFile,
        mediaLibrary: {
          ...mockProjectFile.mediaLibrary,
          mediaFiles: [
            {
              id: "1",
              originalPath: "",
              name: "file.mp4",
              size: 1000,
              isVideo: true,
              isAudio: false,
              isImage: false,
            },
          ],
        },
      }

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(projectWithEmptyPath))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid saved media file: originalPath must be a non-empty string",
      )
    })

    it("должен проверять тип проекта", async () => {
      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(null))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid project structure: not an object",
      )
    })

    it("должен проверять отсутствие meta", async () => {
      const projectWithoutMeta = { ...mockProjectFile }
      // @ts-expect-error - намеренно удаляем обязательное поле
      projectWithoutMeta.meta = undefined

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(projectWithoutMeta))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid project structure: missing meta",
      )
    })

    it("должен валидировать музыкальные файлы", async () => {
      const projectWithInvalidMusic = {
        ...mockProjectFile,
        mediaLibrary: {
          ...mockProjectFile.mediaLibrary,
          musicFiles: [
            {
              id: "1",
              // отсутствует обязательное поле name
              originalPath: "/path/to/music.mp3",
              size: 1000,
              isVideo: false,
              isAudio: true,
              isImage: false,
            },
          ],
        },
      }

      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(projectWithInvalidMusic))

      await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
        "Invalid saved media file: missing field name",
      )
    })
  })
})
