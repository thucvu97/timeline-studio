import i18next from "i18next"
import { assign, createMachine, fromPromise } from "xstate"

import { MediaFile } from "@/features/media"
import { DEFAULT_CONTENT_SIZES } from "@/features/media/utils/preview-sizes"
import { UserSettingsContextType } from "@/features/user-settings/services/user-settings-machine"

import { AppSettings, FavoritesType, storeService } from "./store-service"

/**
 * Функция для получения локализованного названия проекта по умолчанию
 * @returns {string} Локализованное название проекта
 */
const getDefaultProjectName = (): string => {
  // Проверяем, доступен ли i18next
  if (typeof i18next !== "undefined" && i18next.isInitialized) {
    // eslint-disable-next-line import/no-named-as-default-member
    return i18next.t("project.untitledProject", { number: 1 })
  }

  return "Untitled Project"
}

/**
 * Интерфейс контекста машины состояний настроек приложения
 */
export interface AppSettingsContextType {
  // Пользовательские настройки
  userSettings: UserSettingsContextType

  // Последние открытые проекты
  recentProjects: {
    path: string
    name: string
    lastOpened: number
  }[]

  // Информация о текущем открытом проекте
  currentProject: {
    path: string | null
    name: string
    isDirty: boolean
    isNew: boolean
    // Настройки проекта не хранятся здесь, они хранятся в файле проекта
    // и управляются через ProjectSettingsProvider
  }

  // Избранные элементы
  favorites: FavoritesType

  // Медиа файлы
  mediaFiles: {
    allFiles: MediaFile[]
    error: string | null
    isLoading: boolean
  }

  musicFiles: {
    allFiles: MediaFile[]
    error: string | null
    isLoading: boolean
  }

  // Состояние загрузки
  isLoading: boolean

  // Ошибка
  error: string | null
}

/**
 * Типы событий для машины состояний настроек приложения
 */
export type AppSettingsEvent =
  | { type: "UPDATE_USER_SETTINGS"; settings: Partial<UserSettingsContextType> }
  | { type: "ADD_RECENT_PROJECT"; path: string; name: string }
  | { type: "REMOVE_RECENT_PROJECT"; path: string }
  | { type: "CLEAR_RECENT_PROJECTS" }
  | { type: "UPDATE_FAVORITES"; favorites: Partial<FavoritesType> }
  | { type: "ADD_TO_FAVORITES"; itemType: keyof FavoritesType; item: any }
  | {
      type: "REMOVE_FROM_FAVORITES"
      itemType: keyof FavoritesType
      itemId: string
    }
  | { type: "RELOAD_SETTINGS" }
  | { type: "CREATE_NEW_PROJECT"; name?: string }
  | { type: "OPEN_PROJECT"; path: string; name: string }
  | { type: "SAVE_PROJECT"; path: string; name: string }
  | { type: "SET_PROJECT_DIRTY"; isDirty: boolean }
  | { type: "UPDATE_MEDIA_FILES"; files: any[] }
  | { type: "UPDATE_MUSIC_FILES"; files: any[] }

/**
 * Обеспечивает, что медиафайлы имеют правильное состояние загрузки метаданных
 */
function ensureMediaFilesHaveMetadataState(files: any[]): any[] {
  return files.map((file) => ({
    ...file,
    // Если файл имеет probeData, значит метаданные загружены
    isLoadingMetadata: file.isLoadingMetadata ?? false,
    // Обеспечиваем наличие probeData
    probeData: file.probeData || { streams: [], format: {} },
  }))
}

/**
 * Загрузка настроек из хранилища
 */
const loadSettings = fromPromise(async () => {
  try {
    // Создаем промис с таймаутом
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Settings loading timeout")), 5000)
    })

    // Загружаем настройки с таймаутом
    const loadPromise = (async () => {
      // Инициализируем хранилище
      await storeService.initialize()

      // Получаем настройки
      const settings = await storeService.getSettings()

      if (settings) {
        console.log("[AppSettingsMachine] Loaded settings from storage")
        console.log(`[AppSettingsMachine] Media files count: ${settings.mediaFiles?.allFiles?.length || 0}`)
        console.log(`[AppSettingsMachine] Music files count: ${settings.musicFiles?.allFiles?.length || 0}`)

        // Обеспечиваем правильное состояние метаданных для медиафайлов
        if (settings.mediaFiles?.allFiles) {
          settings.mediaFiles.allFiles = ensureMediaFilesHaveMetadataState(settings.mediaFiles.allFiles)
        }
        if (settings.musicFiles?.allFiles) {
          settings.musicFiles.allFiles = ensureMediaFilesHaveMetadataState(settings.musicFiles.allFiles)
        }

        return settings
      }

      // Если настроек нет, возвращаем настройки по умолчанию
      console.log("[AppSettingsMachine] No settings found, using defaults")
      return getDefaultSettings()
    })()

    // Ждем либо загрузку настроек, либо таймаут
    return await Promise.race([loadPromise, timeoutPromise])
  } catch (error) {
    console.error("[AppSettingsMachine] Error loading settings:", error)
    // Возвращаем настройки по умолчанию вместо выброса ошибки
    return getDefaultSettings()
  }
})

/**
 * Получение настроек по умолчанию
 */
function getDefaultSettings(): AppSettings {
  return {
    userSettings: {
      previewSizes: DEFAULT_CONTENT_SIZES,
      activeTab: "media",
      layoutMode: "default",
      screenshotsPath: "",
      playerScreenshotsPath: "",
      playerVolume: 100, // Громкость плеера по умолчанию (100%)
      openAiApiKey: "",
      claudeApiKey: "",
      youtubeClientId: "",
      youtubeClientSecret: "",
      tiktokClientId: "",
      tiktokClientSecret: "",
      vimeoClientId: "",
      vimeoClientSecret: "",
      vimeoAccessToken: "",
      telegramBotToken: "",
      telegramChatId: "",
      codecovToken: "",
      tauriAnalyticsKey: "",
      gpuAccelerationEnabled: true,
      preferredGpuEncoder: "auto",
      maxConcurrentJobs: 2,
      renderQuality: "high",
      backgroundRenderingEnabled: true,
      renderDelay: 0,
      proxyEnabled: false,
      proxyType: "http",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      apiKeysStatus: {},
      autoSaveEnabled: true,
      autoSaveInterval: 60,
      isBrowserVisible: true,
      isOptionsVisible: true,
      isTimelineVisible: true,
      isLoaded: true,
    },
    recentProjects: [],
    currentProject: {
      path: null,
      name: "Untitled Project",
      isDirty: false,
      isNew: true,
    },
    mediaFiles: {
      allFiles: [],
      error: null,
      isLoading: false,
    },
    musicFiles: {
      allFiles: [],
      error: null,
      isLoading: false,
    },
    favorites: {
      media: [],
      music: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
      styleTemplate: [],
    },
    meta: {
      lastUpdated: Date.now(),
      version: "1.0.0",
    },
  }
}

/**
 * Машина состояний для настроек приложения
 */
export const appSettingsMachine = createMachine({
  id: "appSettings",
  initial: "loading",

  // Контекст машины состояний
  context: {
    userSettings: {
      previewSizes: {
        MEDIA: 200,
        TRANSITIONS: 200,
        TEMPLATES: 200,
        EFFECTS: 200,
        FILTERS: 200,
        SUBTITLES: 200,
        STYLE_TEMPLATES: 200,
        MUSIC: 125,
      },
      activeTab: "media",
      layoutMode: "default",
      screenshotsPath: "",
      playerScreenshotsPath: "",
      playerVolume: 80,
      openAiApiKey: "",
      claudeApiKey: "",
      youtubeClientId: "",
      youtubeClientSecret: "",
      tiktokClientId: "",
      tiktokClientSecret: "",
      vimeoClientId: "",
      vimeoClientSecret: "",
      vimeoAccessToken: "",
      telegramBotToken: "",
      telegramChatId: "",
      codecovToken: "",
      tauriAnalyticsKey: "",
      gpuAccelerationEnabled: true,
      preferredGpuEncoder: "auto",
      maxConcurrentJobs: 2,
      renderQuality: "high",
      backgroundRenderingEnabled: true,
      renderDelay: 0,
      proxyEnabled: false,
      proxyType: "http",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      apiKeysStatus: {},
      autoSaveEnabled: true,
      autoSaveInterval: 60,
      isBrowserVisible: true,
      isOptionsVisible: true,
      isTimelineVisible: true,
      isLoaded: false,
    },
    recentProjects: [],
    currentProject: {
      path: null,
      name: "Untitled Project",
      isDirty: false,
      isNew: true,
    },
    mediaFiles: {
      allFiles: [],
      error: null,
      isLoading: false,
    },
    musicFiles: {
      allFiles: [],
      error: null,
      isLoading: false,
    },
    favorites: {
      media: [],
      music: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
      styleTemplate: [],
    },
    isLoading: false,
    error: null,
  } as AppSettingsContextType,

  // Типы для TypeScript
  types: {
    context: {} as AppSettingsContextType,
    events: {} as AppSettingsEvent,
  },

  // Состояния машины
  states: {
    // Загрузка настроек
    loading: {
      entry: () => {
        console.log("[AppSettingsMachine] Entering loading state")
      },
      invoke: {
        src: loadSettings,
        onDone: {
          target: "idle",
          actions: [
            () => {
              console.log("[AppSettingsMachine] Settings loaded successfully, transitioning to idle")
            },
            assign({
              userSettings: ({ event }) => event.output.userSettings,
              recentProjects: ({ event }) => event.output.recentProjects || [],
              favorites: ({ event }) => event.output.favorites,
              mediaFiles: ({ event }) => event.output.mediaFiles || { allFiles: [], error: null, isLoading: false },
              musicFiles: ({ event }) => event.output.musicFiles || { allFiles: [], error: null, isLoading: false },
              isLoading: false,
              error: null,
            }),
          ],
        },
        onError: {
          target: "error",
          actions: [
            ({ event }) => {
              console.error("[AppSettingsMachine] Error loading settings:", event.error)
            },
            assign({
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              error: ({ event }) => `Error loading settings: ${event.error}`,
              isLoading: false,
            }),
          ],
        },
      },
    },

    // Ошибка загрузки настроек
    error: {
      entry: () => {
        console.log("[AppSettingsMachine] Entering error state")
      },
      on: {
        RELOAD_SETTINGS: "loading",
      },
    },

    // Ожидание событий
    idle: {
      entry: () => {
        console.log("[AppSettingsMachine] Entering idle state")
      },
      on: {
        // Обновление пользовательских настроек
        UPDATE_USER_SETTINGS: {
          actions: [
            // Обновляем настройки в контексте
            assign({
              userSettings: ({ context, event }) => ({
                ...context.userSettings,
                ...event.settings,
              }),
            }),
            // Сохраняем настройки в хранилище
            ({ context }) => {
              void storeService.saveUserSettings(context.userSettings)
            },
          ],
        },

        // Добавление проекта в список последних открытых
        ADD_RECENT_PROJECT: {
          actions: [
            // Обновляем список в контексте
            assign({
              recentProjects: ({ context, event }) => {
                // Фильтруем список, чтобы удалить проект с таким же путем, если он уже есть
                const filteredProjects = context.recentProjects.filter((p) => p.path !== event.path)

                // Добавляем проект в начало списка
                return [
                  {
                    path: event.path,
                    name: event.name,
                    lastOpened: Date.now(),
                  },
                  ...filteredProjects,
                ].slice(0, 10) // Ограничиваем список 10 последними проектами
              },
            }),
            // Сохраняем список в хранилище
            ({ context }) => {
              void storeService.addRecentProject(context.recentProjects[0].path, context.recentProjects[0].name)
            },
          ],
        },

        // Удаление проекта из списка последних открытых
        REMOVE_RECENT_PROJECT: {
          actions: assign({
            recentProjects: ({ context, event }) => context.recentProjects.filter((p) => p.path !== event.path),
          }),
        },

        // Очистка списка последних открытых проектов
        CLEAR_RECENT_PROJECTS: {
          actions: assign({
            recentProjects: [],
          }),
        },

        // Обновление избранных элементов
        UPDATE_FAVORITES: {
          actions: [
            // Обновляем избранные в контексте
            assign({
              favorites: ({ context, event }) => {
                const updatedFavorites = {
                  ...context.favorites,
                }

                // Обновляем каждый тип избранных элементов
                Object.keys(event.favorites).forEach((key) => {
                  const typedKey = key as keyof FavoritesType
                  if (event.favorites[typedKey] !== undefined) {
                    updatedFavorites[typedKey] = event.favorites[typedKey]
                  }
                })

                return updatedFavorites
              },
            }),
            // Сохраняем избранные в хранилище
            ({ context }) => {
              void storeService.saveFavorites(context.favorites)
            },
          ],
        },

        // Добавление элемента в избранное
        ADD_TO_FAVORITES: {
          actions: [
            // Обновляем избранные в контексте
            assign({
              favorites: ({ context, event }) => {
                const updatedFavorites = { ...context.favorites }
                // Проверяем, существует ли массив для данного типа
                if (!updatedFavorites[event.itemType]) {
                  updatedFavorites[event.itemType] = []
                }
                updatedFavorites[event.itemType] = [...updatedFavorites[event.itemType], event.item]
                return updatedFavorites
              },
            }),
            // Сохраняем избранные в хранилище
            ({ context }) => {
              void storeService.saveFavorites(context.favorites)
            },
          ],
        },

        // Удаление элемента из избранного
        REMOVE_FROM_FAVORITES: {
          actions: [
            // Обновляем избранные в контексте
            assign({
              favorites: ({ context, event }) => {
                const updatedFavorites = { ...context.favorites }
                updatedFavorites[event.itemType] = updatedFavorites[event.itemType].filter(
                  (item: any) => item.id !== event.itemId,
                )
                return updatedFavorites
              },
            }),
            // Сохраняем избранные в хранилище
            ({ context }) => {
              void storeService.saveFavorites(context.favorites)
            },
          ],
        },

        // Перезагрузка настроек
        RELOAD_SETTINGS: "loading",

        // Создание нового проекта
        CREATE_NEW_PROJECT: {
          actions: [
            assign({
              currentProject: ({ event }) => ({
                path: null,
                // Используем переданное имя или имя по умолчанию
                name: event.name ?? getDefaultProjectName(),
                isDirty: false,
                isNew: true,
              }),
            }),
            ({ context }) => {
              void storeService.saveSettings({
                ...context,
                currentProject: {
                  path: null,
                  name: context.currentProject.name,
                  isDirty: false,
                  isNew: true,
                },
              } as any)
            },
          ],
        },

        // Открытие существующего проекта
        OPEN_PROJECT: {
          actions: [
            assign({
              currentProject: ({ event }) => ({
                path: event.path,
                name: event.name,
                isDirty: false,
                isNew: false,
              }),
            }),
            // Добавляем проект в список последних открытых
            assign({
              recentProjects: ({ context, event }) => {
                // Фильтруем список, чтобы удалить проект с таким же путем, если он уже есть
                const filteredProjects = context.recentProjects.filter((p) => p.path !== event.path)

                // Добавляем проект в начало списка
                return [
                  {
                    path: event.path,
                    name: event.name,
                    lastOpened: Date.now(),
                  },
                  ...filteredProjects,
                ].slice(0, 10) // Ограничиваем список 10 последними проектами
              },
            }),
            ({ context }) => {
              void storeService.saveSettings(context as any)
            },
          ],
        },

        // Сохранение проекта
        SAVE_PROJECT: {
          actions: [
            assign({
              currentProject: ({ context, event }) => ({
                ...context.currentProject,
                path: event.path,
                name: event.name || context.currentProject.name,
                isDirty: false,
                isNew: false,
              }),
            }),
            ({ context }) => {
              void storeService.saveSettings(context as any)
            },
          ],
        },

        // Установка флага "грязного" проекта (несохраненные изменения)
        SET_PROJECT_DIRTY: {
          actions: [
            assign({
              currentProject: ({ context, event }) => ({
                ...context.currentProject,
                isDirty: event.isDirty,
              }),
            }),
            // Сохраняем состояние в хранилище
            ({ context }) => {
              void storeService.saveSettings(context as any)
            },
          ],
        },

        // Обновление медиа-файлов
        UPDATE_MEDIA_FILES: {
          actions: [
            assign({
              mediaFiles: ({ context, event }) => {
                console.log(`[AppSettingsMachine] Updating media files. New files: ${event.files.length}`)

                // Создаем Map для быстрого поиска существующих файлов по id
                const existingFilesMap = new Map(context.mediaFiles.allFiles.map((file: any) => [file.id, file]))

                // Обновляем существующие файлы или добавляем новые
                event.files.forEach((file: any) => {
                  existingFilesMap.set(file.id, file)
                })

                // Преобразуем обратно в массив и обеспечиваем правильное состояние метаданных
                const updatedFiles = ensureMediaFilesHaveMetadataState(Array.from(existingFilesMap.values()))

                console.log(`[AppSettingsMachine] Total media files after update: ${updatedFiles.length}`)

                return {
                  ...context.mediaFiles,
                  allFiles: updatedFiles,
                  isLoading: false,
                  error: null,
                }
              },
            }),
            ({ context }) => {
              void storeService.saveSettings(context as any)
            },
          ],
        },
        // Обновление музыкальных файлов
        UPDATE_MUSIC_FILES: {
          actions: [
            assign({
              musicFiles: ({ context, event }) => {
                // Создаем Map для быстрого поиска существующих файлов по id
                const existingFilesMap = new Map(context.musicFiles.allFiles.map((file: any) => [file.id, file]))

                // Обновляем существующие файлы или добавляем новые
                event.files.forEach((file: any) => {
                  existingFilesMap.set(file.id, file)
                })

                // Преобразуем обратно в массив и обеспечиваем правильное состояние метаданных
                const updatedFiles = ensureMediaFilesHaveMetadataState(Array.from(existingFilesMap.values()))

                return {
                  ...context.musicFiles,
                  allFiles: updatedFiles,
                  isLoading: false,
                  error: null,
                }
              },
            }),
            ({ context }) => {
              void storeService.saveSettings(context as any)
            },
          ],
        },
      },
    },
  },
})
