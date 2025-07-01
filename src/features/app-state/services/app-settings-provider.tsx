import { ReactNode, createContext, useEffect } from "react"

import { appDataDir, basename, join } from "@tauri-apps/api/path"
import { open, save } from "@tauri-apps/plugin-dialog"
import { useMachine } from "@xstate/react"

import { MissingFilesDialog } from "@/features/app-state/components/missing-files-dialog"
import { appDirectoriesService } from "@/features/app-state/services/app-directories-service"
import { ProjectFileService } from "@/features/app-state/services/project-file-service"
import { TimelineStudioProjectService } from "@/features/app-state/services/timeline-studio-project-service"
import { getResourcesFromStorage, syncResourcesToProject } from "@/features/app-state/utils/sync-resources-to-project"
import { useMediaRestoration } from "@/features/media/hooks/use-media-restoration"
import { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"
import { UserSettingsContextType } from "@/features/user-settings"

import { AppSettingsContextType, appSettingsMachine } from "./app-settings-machine"
import { FavoritesType } from "./store-service"

/**
 * Интерфейс контекста провайдера настроек приложения
 */
export interface AppSettingsProviderContext {
  // Состояние машины
  state: {
    context: AppSettingsContextType
    matches: (value: string) => boolean
    can: (event: { type: string }) => boolean
  }

  // Методы для работы с настройками
  updateUserSettings: (settings: Partial<UserSettingsContextType>) => void
  reloadSettings: () => void

  addRecentProject: (path: string, name: string) => void
  removeRecentProject: (path: string) => void
  clearRecentProjects: () => void

  updateFavorites: (favorites: Partial<FavoritesType>) => void
  addToFavorites: (itemType: keyof FavoritesType, item: any) => void
  removeFromFavorites: (itemType: keyof FavoritesType, itemId: string) => void

  // Методы для работы с проектами
  createNewProject: (name?: string) => void
  createTempProject: () => Promise<void>
  loadOrCreateTempProject: () => Promise<void>
  openProject: () => Promise<{ path: string; name: string } | null>
  saveProject: (name: string) => Promise<{ path: string; name: string } | null>
  setProjectDirty: (isDirty: boolean) => void

  updateMediaFiles: (files: any[]) => void
  updateMusicFiles: (files: any[]) => void // Опционально, если нужно обновлять музыкальные файлы

  // Геттеры для удобного доступа к данным
  getUserSettings: () => UserSettingsContextType
  getRecentProjects: () => AppSettingsContextType["recentProjects"]
  getFavorites: () => FavoritesType
  getCurrentProject: () => AppSettingsContextType["currentProject"]
  getMediaFiles: () => AppSettingsContextType["mediaFiles"]
  getMusicFiles: () => AppSettingsContextType["musicFiles"]
  isLoading: () => boolean
  getError: () => string | null
  isTempProject: () => boolean
}

// Создаем контекст
export const AppSettingsContext = createContext<AppSettingsProviderContext | undefined>(undefined)

/**
 * Провайдер настроек приложения
 */
export function AppSettingsProvider({ children }: { children: ReactNode }) {
  // Используем машину состояний
  const [state, send] = useMachine(appSettingsMachine)

  // Хук для восстановления медиафайлов
  const {
    restoreProjectMedia,
    handleMissingFilesResolution,
    cancelMissingFilesDialog,
    showMissingFilesDialog,
    getMissingFiles,
  } = useMediaRestoration()

  // Автоматически создаем или загружаем временный проект при старте
  useEffect(() => {
    if (!state.context.isLoading && !state.context.currentProject.path && state.context.currentProject.isNew) {
      // Если нет открытого проекта и у нас стандартный новый проект, создаем временный проект
      loadOrCreateTempProject().catch((error: unknown) => {
        console.error("Failed to load or create temp project:", error)
        // Fallback: оставляем как есть (новый проект) - не создаем временный проект
      })
    }
  }, [state.context.isLoading, state.context.currentProject.path, state.context.currentProject.isNew, send])

  // Методы для работы с настройками
  const updateUserSettings = (settings: Partial<UserSettingsContextType>) => {
    send({ type: "UPDATE_USER_SETTINGS", settings })
  }

  const addRecentProject = (path: string, name: string) => {
    send({ type: "ADD_RECENT_PROJECT", path, name })
  }

  const removeRecentProject = (path: string) => {
    send({ type: "REMOVE_RECENT_PROJECT", path })
  }

  const clearRecentProjects = () => {
    send({ type: "CLEAR_RECENT_PROJECTS" })
  }

  const updateFavorites = (favorites: Partial<FavoritesType>) => {
    send({ type: "UPDATE_FAVORITES", favorites })
  }

  const addToFavorites = (itemType: keyof FavoritesType, item: any) => {
    send({ type: "ADD_TO_FAVORITES", itemType, item })
  }

  const removeFromFavorites = (itemType: keyof FavoritesType, itemId: string) => {
    send({ type: "REMOVE_FROM_FAVORITES", itemType, itemId })
  }

  const reloadSettings = () => {
    send({ type: "RELOAD_SETTINGS" })
  }

  // Константы для временного проекта
  const TEMP_PROJECT_NAME = "Untitled Project"
  const TEMP_PROJECT_FILENAME = "temp_project.tlsp"

  // Методы для работы с проектами
  const createNewProject = (name?: string) => {
    send({ type: "CREATE_NEW_PROJECT", name })
  }

  const createTempProject = async () => {
    try {
      const projectService = TimelineStudioProjectService.getInstance()
      const directories = await appDirectoriesService.getAppDirectories()

      // Создаем новый проект v2
      const project = await projectService.createProject(TEMP_PROJECT_NAME)

      // Формируем путь к временному файлу в папке бэкапов
      const tempPath = await join(directories.backup_dir, TEMP_PROJECT_FILENAME)

      // Сохраняем проект
      await projectService.saveProject(project, tempPath)

      console.log(`Temporary project created at: ${tempPath}`)

      // Обновляем состояние
      send({
        type: "OPEN_PROJECT",
        path: tempPath,
        name: TEMP_PROJECT_NAME,
      })

      // Отмечаем как dirty чтобы пользователь знал что нужно сохранить
      // Используем skipAutoSave=true чтобы избежать конфликта при создании
      setProjectDirty(true, true)
    } catch (error) {
      console.error("Failed to create temp project:", error)
      throw error
    }
  }

  const loadOrCreateTempProject = async () => {
    try {
      const projectService = TimelineStudioProjectService.getInstance()
      const directories = await appDirectoriesService.getAppDirectories()
      const tempPath = await join(directories.backup_dir, TEMP_PROJECT_FILENAME)

      try {
        // Пытаемся загрузить существующий временный проект
        const project = await projectService.openProject(tempPath)

        console.log(`Loaded existing temp project from: ${tempPath}`)

        // Синхронизируем ресурсы из проекта в localStorage
        // чтобы они отобразились в UI
        if (project.mediaPool && project.mediaPool.items.size > 0) {
          const mediaResources: any[] = []
          const musicResources: any[] = []

          project.mediaPool.items.forEach((item) => {
            const resource = {
              id: item.id,
              type: "media",
              name: item.name,
              resourceId: item.id,
              file: {
                id: item.id,
                name: item.name,
                path: item.source.path,
                size: item.metadata.fileSize,
                type: item.type,
                isVideo: item.type === "video",
                isAudio: item.type === "audio",
                isImage: item.type === "image",
              },
              addedAt: item.metadata.importedDate.getTime(),
            }

            if (item.binId === "music") {
              musicResources.push(resource)
            } else {
              mediaResources.push(resource)
            }
          })

          // Сохраняем в localStorage для синхронизации с UI
          const resourcesData = {
            resources: [...mediaResources, ...musicResources],
            mediaResources,
            musicResources,
            subtitleResources: [],
            effectResources: [],
            filterResources: [],
            transitionResources: [],
            templateResources: [],
            styleTemplateResources: [],
          }
          localStorage.setItem("timeline-studio-resources", JSON.stringify(resourcesData))

          console.log(
            `Loaded ${mediaResources.length} media and ${musicResources.length} music resources from temp project`,
          )
        }

        // Обновляем состояние
        send({
          type: "OPEN_PROJECT",
          path: tempPath,
          name: project.metadata.name,
        })

        // Отмечаем как dirty
        // Используем skipAutoSave=true чтобы избежать конфликта при загрузке
        setProjectDirty(true, true)
      } catch (loadError) {
        console.log("No existing temp project found, creating new one")
        // Если не удалось загрузить, создаем новый
        await createTempProject()
      }
    } catch (error) {
      console.error("Failed to load or create temp project:", error)
      throw error
    }
  }

  const openProject = async () => {
    try {
      // Получаем директорию данных приложения
      const appDir = await appDataDir().catch(() => null)

      // Открываем диалог выбора файла
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Timeline Studio Project v2",
            extensions: ["tlsp"],
          },
          {
            name: "Timeline Studio Project (Legacy)",
            extensions: ["tls"],
          },
        ],
        // Если директория приложения доступна, используем её как начальную директорию
        defaultPath: appDir ?? undefined,
      })

      // Если пользователь отменил выбор, возвращаемся
      if (selected === null) {
        return null
      }

      // Получаем путь к файлу
      const path = selected

      // Получаем имя файла из пути
      const name = await basename(path)

      try {
        // Определяем тип проекта по расширению
        const isV2Project = path.endsWith(".tlsp")

        if (isV2Project) {
          // Загружаем v2 проект
          const projectService = TimelineStudioProjectService.getInstance()
          const project = await projectService.openProject(path)

          // Отправляем событие в машину состояний
          send({
            type: "OPEN_PROJECT",
            path,
            name: project.metadata.name,
          })

          console.log(`Opened v2 project: ${project.metadata.name}`)
          return { path, name: project.metadata.name, project }
        }
        // Загружаем legacy проект
        const projectData = await ProjectFileService.loadProject(path)

        // Отправляем событие в машину состояний
        send({
          type: "OPEN_PROJECT",
          path,
          name,
        })

        // Восстанавливаем медиафайлы проекта (только для legacy)
        if ((projectData as any).mediaPool) {
          try {
            const restorationResult = await restoreProjectMedia(
              (projectData as any).mediaPool.mediaFiles || [],
              (projectData as any).mediaPool.musicFiles || [],
              path,
              { showDialog: true },
            )

            console.log("Медиафайлы восстановлены:", restorationResult.result.stats)

            updateMediaFiles(restorationResult.restoredMedia)
            updateMusicFiles(restorationResult.restoredMusic)
          } catch (restorationError) {
            console.error("Ошибка при восстановлении медиафайлов:", restorationError)
          }
        }

        return { path, name, projectData }
      } catch (projectError) {
        console.error("Failed to load project data:", projectError)

        // Отправляем событие без данных проекта (для совместимости)
        send({ type: "OPEN_PROJECT", path, name })

        // Показываем предупреждение пользователю
        console.warn(`Проект открыт, но не удалось загрузить данные: ${String(projectError)}`)

        return { path, name, error: String(projectError) }
      }
    } catch (error) {
      console.error("[openProject] Error opening project:", error)
      throw error
    }
  }

  const saveProject = async (name: string) => {
    try {
      const currentProject = getCurrentProject()

      // Если у проекта уже есть путь и это НЕ временный проект, сохраняем по этому пути
      if (currentProject.path && !currentProject.path.includes(TEMP_PROJECT_FILENAME)) {
        try {
          // Для v2 проектов используем новый сервис
          const projectService = TimelineStudioProjectService.getInstance()

          // Загружаем текущий проект
          const project = await projectService.openProject(currentProject.path)

          // Обновляем имя если изменилось
          if (project.metadata.name !== name) {
            project.metadata.name = name
            project.metadata.modified = new Date()
          }

          // Сохраняем проект
          await projectService.saveProject(project, currentProject.path)

          // Отправляем событие в машину состояний (очищает dirty флаг)
          send({ type: "SAVE_PROJECT", path: currentProject.path, name })
          return { path: currentProject.path, name }
        } catch (saveError) {
          console.error("Failed to save project:", saveError)
          throw new Error(`Не удалось сохранить проект: ${String(saveError)}`)
        }
      }

      // Получаем директорию данных приложения
      const appDir = await appDataDir().catch(() => null)

      // Формируем путь к файлу по умолчанию (новый формат .tlsp)
      const defaultFilePath = appDir ? await join(appDir, `${name}.tlsp`) : `${name}.tlsp`

      // Открываем диалог сохранения файла
      const path = await save({
        filters: [
          {
            name: "Timeline Studio Project v2",
            extensions: ["tlsp"],
          },
          {
            name: "Timeline Studio Project (Legacy)",
            extensions: ["tls"],
          },
        ],
        defaultPath: defaultFilePath,
      })

      // Если пользователь отменил выбор, возвращаемся
      if (path === null) {
        return null
      }

      try {
        const projectService = TimelineStudioProjectService.getInstance()

        // Если есть временный проект, берем его данные
        let project: TimelineStudioProject
        if (currentProject.path && currentProject.path.includes(TEMP_PROJECT_FILENAME)) {
          // Загружаем существующий временный проект
          project = await projectService.openProject(currentProject.path)
          // Обновляем имя и метаданные
          project.metadata.name = name
          project.metadata.modified = new Date()
        } else {
          // Создаем новый проект
          project = await projectService.createProject(name)
        }

        // Сохраняем проект в новый файл
        await projectService.saveProject(project, path)

        // Отправляем событие в машину состояний (очищает dirty флаг)
        send({ type: "SAVE_PROJECT", path, name })

        return { path, name }
      } catch (saveError) {
        console.error("Failed to save new project:", saveError)
        throw new Error(`Не удалось сохранить новый проект: ${String(saveError)}`)
      }
    } catch (error) {
      console.error("[saveProject] Error saving project:", error)
      throw error
    }
  }

  const setProjectDirty = (isDirty: boolean, skipAutoSave = false) => {
    send({ type: "SET_PROJECT_DIRTY", isDirty })

    // Автоматически сохраняем временный проект при изменениях
    // skipAutoSave используется при инициализации проекта чтобы избежать конфликтов
    if (isDirty && !skipAutoSave) {
      autoSaveTempProject().catch((error: unknown) => {
        console.warn("Failed to auto-save temp project:", error)
      })
    }
  }

  const autoSaveTempProject = async () => {
    try {
      const currentProject = getCurrentProject()

      // Проверяем, что это временный проект
      if (currentProject.path && currentProject.path.includes(TEMP_PROJECT_FILENAME)) {
        console.log("Auto-saving temp project...")

        const projectService = TimelineStudioProjectService.getInstance()

        // Загружаем текущий проект
        const project = await projectService.openProject(currentProject.path)

        // Получаем ресурсы из localStorage
        const { mediaResources, musicResources } = getResourcesFromStorage()

        // Синхронизируем ресурсы с проектом
        const updatedProject = syncResourcesToProject(project, mediaResources, musicResources)

        // Сохраняем обновленный проект
        await projectService.saveProject(updatedProject, currentProject.path)

        console.log(`Temp project auto-saved with ${updatedProject.mediaPool.items.size} media items`)
      }
    } catch (error) {
      console.error("Failed to auto-save temp project:", error)
      // Не выбрасываем ошибку дальше, чтобы не прерывать работу приложения
    }
  }

  const updateMediaFiles = (files: any[]) => {
    send({ type: "UPDATE_MEDIA_FILES", files })
  }

  const updateMusicFiles = (files: any[]) => {
    send({ type: "UPDATE_MUSIC_FILES", files })
  }

  // Геттеры для удобного доступа к данным
  const getUserSettings = () => state.context.userSettings
  const getRecentProjects = () => state.context.recentProjects
  const getFavorites = () => state.context.favorites
  const getCurrentProject = () => state.context.currentProject
  const getMediaFiles = () => state.context.mediaFiles
  const getMusicFiles = () => state.context.musicFiles
  const isLoading = () => state.context.isLoading
  const getError = () => state.context.error
  const isTempProject = () => {
    const currentProject = getCurrentProject()
    return currentProject.path ? currentProject.path.includes(TEMP_PROJECT_FILENAME) : false
  }

  // Значение контекста
  const value: AppSettingsProviderContext = {
    state: {
      context: state.context,
      matches: (value: string) => state.matches(value),
      can: (event: { type: string }) => state.can(event as any),
    },
    updateUserSettings,
    addRecentProject,
    removeRecentProject,
    clearRecentProjects,
    updateFavorites,
    addToFavorites,
    removeFromFavorites,
    reloadSettings,
    createNewProject,
    createTempProject,
    loadOrCreateTempProject,
    openProject,
    saveProject,
    setProjectDirty,
    updateMediaFiles,
    updateMusicFiles,
    getUserSettings,
    getRecentProjects,
    getFavorites,
    getCurrentProject,
    getMediaFiles,
    getMusicFiles,
    isLoading,
    getError,
    isTempProject,
  }

  return (
    <AppSettingsContext.Provider value={value}>
      {children}

      {/* Диалог для обработки отсутствующих медиафайлов */}
      <MissingFilesDialog
        open={showMissingFilesDialog}
        onOpenChange={cancelMissingFilesDialog}
        missingFiles={getMissingFiles()}
        onResolve={handleMissingFilesResolution}
      />
    </AppSettingsContext.Provider>
  )
}
