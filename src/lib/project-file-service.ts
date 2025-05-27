import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"

import { ProjectFile } from "@/types/project"
import { SavedMediaFile, SavedMusicFile } from "@/types/saved-media"

/**
 * Сервис для работы с файлами проектов (.tlsp)
 * Обеспечивает сохранение и загрузку проектов с медиабиблиотекой
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ProjectFileService {
  /**
   * Загружает проект из файла
   */
  static async loadProject(projectPath: string): Promise<ProjectFile> {
    try {
      const content = await readTextFile(projectPath)
      const projectData = JSON.parse(content) as ProjectFile

      // Валидируем структуру проекта
      ProjectFileService.validateProjectStructure(projectData)

      return projectData
    } catch (error) {
      console.error(`Error loading project from ${projectPath}:`, error)
      throw new Error(`Failed to load project: ${String(error)}`)
    }
  }

  /**
   * Сохраняет проект в файл
   */
  static async saveProject(projectPath: string, projectData: ProjectFile): Promise<void> {
    try {
      // Обновляем метаданные перед сохранением
      const updatedProject: ProjectFile = {
        ...projectData,
        meta: {
          ...projectData.meta,
          lastModified: Date.now(),
        },
      }

      const content = JSON.stringify(updatedProject, null, 2)
      await writeTextFile(projectPath, content)

      console.log(`Project saved to ${projectPath}`)
    } catch (error) {
      console.error(`Error saving project to ${projectPath}:`, error)
      throw new Error(`Failed to save project: ${String(error)}`)
    }
  }

  /**
   * Создает новый проект с базовой структурой
   */
  static createNewProject(_name: string): ProjectFile {
    return {
      settings: {
        aspectRatio: {
          label: "16:9",
          textLabel: "Широкоэкранный",
          description: "YouTube",
          value: {
            width: 1920,
            height: 1080,
            name: "16:9",
          },
        },
        resolution: "1920x1080",
        frameRate: "30",
        colorSpace: "sdr",
      },
      mediaLibrary: {
        mediaFiles: [],
        musicFiles: [],
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
  }

  /**
   * Обновляет медиабиблиотеку в проекте
   */
  static updateMediaLibrary(
    project: ProjectFile,
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
  ): ProjectFile {
    return {
      ...project,
      mediaLibrary: {
        mediaFiles,
        musicFiles,
        lastUpdated: Date.now(),
        version: project.mediaLibrary?.version || "1.0.0",
      },
    }
  }

  /**
   * Обновляет состояние браузера в проекте
   */
  static updateBrowserState(project: ProjectFile, browserState: ProjectFile["browserState"]): ProjectFile {
    return {
      ...project,
      browserState,
    }
  }

  /**
   * Обновляет избранные файлы в проекте
   */
  static updateProjectFavorites(project: ProjectFile, favorites: ProjectFile["projectFavorites"]): ProjectFile {
    return {
      ...project,
      projectFavorites: favorites,
    }
  }

  /**
   * Валидирует структуру загруженного проекта
   */
  private static validateProjectStructure(project: any): void {
    if (!project || typeof project !== "object") {
      throw new Error("Invalid project structure: not an object")
    }

    // Проверяем обязательные поля
    if (!project.settings) {
      throw new Error("Invalid project structure: missing settings")
    }

    if (!project.meta) {
      throw new Error("Invalid project structure: missing meta")
    }

    // Проверяем версию проекта
    if (project.meta.version && !ProjectFileService.isVersionSupported(project.meta.version)) {
      throw new Error(`Unsupported project version: ${project.meta.version}`)
    }

    // Если есть медиабиблиотека, валидируем её
    if (project.mediaLibrary) {
      ProjectFileService.validateMediaLibrary(project.mediaLibrary)
    }
  }

  /**
   * Проверяет, поддерживается ли версия проекта
   */
  private static isVersionSupported(version: string): boolean {
    const supportedVersions = ["1.0.0"]
    return supportedVersions.includes(version)
  }

  /**
   * Валидирует структуру медиабиблиотеки
   */
  private static validateMediaLibrary(mediaLibrary: any): void {
    if (!Array.isArray(mediaLibrary.mediaFiles)) {
      throw new Error("Invalid media library: mediaFiles must be an array")
    }

    if (!Array.isArray(mediaLibrary.musicFiles)) {
      throw new Error("Invalid media library: musicFiles must be an array")
    }

    // Валидируем каждый медиафайл
    for (const file of mediaLibrary.mediaFiles) {
      ProjectFileService.validateSavedMediaFile(file)
    }

    for (const file of mediaLibrary.musicFiles) {
      ProjectFileService.validateSavedMediaFile(file)
    }
  }

  /**
   * Валидирует структуру сохраненного медиафайла
   */
  private static validateSavedMediaFile(file: any): void {
    const requiredFields = ["id", "originalPath", "name", "size", "isVideo", "isAudio", "isImage"]

    for (const field of requiredFields) {
      if (!(field in file)) {
        throw new Error(`Invalid saved media file: missing field ${field}`)
      }
    }

    if (typeof file.id !== "string" || file.id.length === 0) {
      throw new Error("Invalid saved media file: id must be a non-empty string")
    }

    if (typeof file.originalPath !== "string" || file.originalPath.length === 0) {
      throw new Error("Invalid saved media file: originalPath must be a non-empty string")
    }
  }

  /**
   * Мигрирует проект к новой версии (если необходимо)
   */
  static migrateProject(project: ProjectFile): ProjectFile {
    // В будущем здесь будет логика миграции между версиями
    return project
  }

  /**
   * Получает статистику проекта
   */
  static getProjectStats(project: ProjectFile): {
    totalMediaFiles: number
    totalMusicFiles: number
    totalSize: number
    lastModified: number
  } {
    const mediaFiles = project.mediaLibrary?.mediaFiles || []
    const musicFiles = project.mediaLibrary?.musicFiles || []

    const totalSize = [...mediaFiles, ...musicFiles].reduce((sum, file) => sum + file.size, 0)

    return {
      totalMediaFiles: mediaFiles.length,
      totalMusicFiles: musicFiles.length,
      totalSize,
      lastModified: project.meta.lastModified,
    }
  }

  /**
   * Проверяет, есть ли несохраненные изменения в проекте
   */
  static hasUnsavedChanges(
    project: ProjectFile,
    currentMediaFiles: SavedMediaFile[],
    currentMusicFiles: SavedMusicFile[],
  ): boolean {
    const savedMediaFiles = project.mediaLibrary?.mediaFiles || []
    const savedMusicFiles = project.mediaLibrary?.musicFiles || []

    // Сравниваем количество файлов
    if (savedMediaFiles.length !== currentMediaFiles.length || savedMusicFiles.length !== currentMusicFiles.length) {
      return true
    }

    // Сравниваем ID файлов
    const savedMediaIds = new Set(savedMediaFiles.map((f) => f.id))
    const currentMediaIds = new Set(currentMediaFiles.map((f) => f.id))

    const savedMusicIds = new Set(savedMusicFiles.map((f) => f.id))
    const currentMusicIds = new Set(currentMusicFiles.map((f) => f.id))

    // Проверяем, есть ли различия в наборах ID
    for (const id of currentMediaIds) {
      if (!savedMediaIds.has(id)) return true
    }

    for (const id of currentMusicIds) {
      if (!savedMusicIds.has(id)) return true
    }

    return false
  }
}
