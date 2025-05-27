import { assign, createMachine } from "xstate"

import { MediaFile } from "@/features/media/types/media"

export interface FavoritesType {
  [key: string]: any[]
  media: MediaFile[]
  audio: MediaFile[]
  transition: any[]
  effect: any[]
  template: any[]
  filter: any[]
  subtitle: any[]
}

export interface MediaContextType {
  allMediaFiles: MediaFile[]
  error: string | null
  isLoading: boolean
  favorites: FavoritesType
}

export type MediaEventType =
  | { type: "INCLUDE_FILES"; files: MediaFile[] }
  | { type: "REMOVE_FILE"; path: string }
  | { type: "CLEAR_FILES" }
  | { type: "setAllMediaFiles"; files: MediaFile[] }
  | { type: "addMediaFiles"; files: MediaFile[] }
  | { type: "removeMediaFiles"; files: MediaFile[] }
  | { type: "setIncludedFiles"; files: MediaFile[] }
  | { type: "setUnavailableFiles"; files: MediaFile[] }
  | { type: "setLoading"; loading: boolean }
  | { type: "FETCH_MEDIA" }
  | { type: "RELOAD" }
  | { type: "ADD_TO_FAVORITES"; item: any; itemType: string }
  | { type: "REMOVE_FROM_FAVORITES"; item: any; itemType: string }
  | { type: "CLEAR_FAVORITES"; itemType?: string }

// Медиафайлы будут добавляться пользователем, начинаем с пустого массива

export const mediaMachine = createMachine({
  id: "media",
  initial: "idle",
  context: {
    allMediaFiles: [],
    error: null,
    isLoading: false,
    favorites: {
      media: [],
      audio: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
    },
  } as MediaContextType,
  states: {
    idle: {
      on: {
        FETCH_MEDIA: "loading",
      },
    },
    loading: {
      entry: [
        assign({ isLoading: true, error: null }),
        // Сразу переходим в состояние loaded с пустым массивом
        assign({
          allMediaFiles: () => [],
          isLoading: false,
        }),
      ],
      always: { target: "loaded" },
    },
    loaded: {
      on: {
        INCLUDE_FILES: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                return context.allMediaFiles.map((file) => {
                  const isInEventFiles = event.files.some((f: MediaFile) => f.path === file.path)
                  if (isInEventFiles) {
                    return {
                      ...file,
                      isIncluded: true,
                      lastCheckedAt: Date.now(), // Обновляем временную метку
                    }
                  }
                  return file
                })
              },
            }),
          ],
        },
        REMOVE_FILE: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                return context.allMediaFiles.map((file) => {
                  if (file.path === event.path) {
                    return {
                      ...file,
                      isIncluded: false,
                      lastCheckedAt: Date.now(), // Обновляем временную метку
                    }
                  }
                  return file
                })
              },
            }),
          ],
        },
        CLEAR_FILES: {
          actions: [
            assign({
              allMediaFiles: ({ context }) => {
                const now = Date.now()
                return context.allMediaFiles.map((file) => {
                  return {
                    ...file,
                    isIncluded: false,
                    lastCheckedAt: now, // Обновляем временную метку
                  }
                })
              },
            }),
          ],
        },
        setAllMediaFiles: {
          actions: [
            assign({
              allMediaFiles: ({ event }) => event.files,
            }),
          ],
        },
        addMediaFiles: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                // Получаем новые файлы из события
                const newFiles = event.files ?? []

                if (newFiles.length === 0) {
                  return [...context.allMediaFiles]
                }

                // Создаем карту существующих файлов для быстрого доступа
                const existingFilesMap = new Map(context.allMediaFiles.map((file: MediaFile) => [file.path, file]))

                // Разделяем новые файлы на те, которые нужно обновить, и те, которые нужно добавить
                const filesToUpdate: MediaFile[] = []
                const filesToAdd: MediaFile[] = []

                newFiles.forEach((file: MediaFile) => {
                  if (existingFilesMap.has(file.path)) {
                    filesToUpdate.push(file)
                  } else {
                    filesToAdd.push(file)
                  }
                })

                console.log(`Файлов для обновления: ${filesToUpdate.length}, для добавления: ${filesToAdd.length}`)

                // Если нет новых файлов и нет файлов для обновления, возвращаем текущий массив
                if (filesToAdd.length === 0 && filesToUpdate.length === 0) {
                  console.log("Нет файлов для добавления или обновления")
                  return [...context.allMediaFiles]
                }

                // Обновляем существующие файлы
                const updatedFiles = context.allMediaFiles.map((file: MediaFile) => {
                  // Ищем файл для обновления с тем же путем
                  const updateFile = filesToUpdate.find((f) => f.path === file.path)

                  if (updateFile) {
                    // Проверяем, что probeData существует и содержит все необходимые поля
                    const probeData = updateFile.probeData
                      ? {
                          streams: updateFile.probeData.streams,
                          format: updateFile.probeData.format,
                        }
                      : file.probeData // Сохраняем существующие probeData, если новых нет

                    // Обновляем файл, сохраняя существующие свойства
                    return {
                      ...file,
                      ...updateFile,
                      lastCheckedAt: Date.now(),
                      probeData,
                      // Важно: сохраняем флаг isIncluded из существующего файла
                      isIncluded: !!file.isIncluded,
                      // Обновляем флаг загрузки метаданных
                      // Если в обновленном файле флаг isLoadingMetadata равен false, то устанавливаем его в false
                      // Это гарантирует, что если метаданные были загружены, то флаг будет сброшен
                      isLoadingMetadata:
                        updateFile.isLoadingMetadata === false ? false : (file.isLoadingMetadata ?? true),
                    }
                  }

                  return file
                })

                // Если нет новых файлов для добавления, возвращаем только обновленные
                if (filesToAdd.length === 0) {
                  console.log("Обновлены существующие файлы")
                  return updatedFiles
                }

                // Добавляем метку времени и флаг isIncluded к новым файлам
                const now = Date.now()
                const newFilesWithMetadata = filesToAdd.map((file: MediaFile) => {
                  // Проверяем, что probeData существует и содержит все необходимые поля
                  const probeData = file.probeData
                    ? {
                        streams: file.probeData.streams,
                        format: file.probeData.format,
                      }
                    : undefined

                  return {
                    ...file,
                    lastCheckedAt: now,
                    isIncluded: false, // По умолчанию файлы не включены в таймлайн
                    probeData, // Сохраняем probeData для отображения
                    // Сохраняем флаг загрузки метаданных (если он есть)
                    isLoadingMetadata: file.isLoadingMetadata ?? false,
                  }
                })

                console.log(`Добавлено ${newFilesWithMetadata.length} новых файлов`)

                // Объединяем обновленные и новые файлы
                return [...updatedFiles, ...newFilesWithMetadata]
              },
            }),
          ],
        },
        removeMediaFiles: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) =>
                context.allMediaFiles.filter((f) => !event.files.some((e: MediaFile) => e.path === f.path)),
            }),
          ],
        },
        setIncludedFiles: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                const now = Date.now()
                return context.allMediaFiles.map((file) => {
                  const isInEventFiles = event.files.some((f: MediaFile) => f.path === file.path)
                  return {
                    ...file,
                    isIncluded: isInEventFiles,
                    lastCheckedAt: now, // Обновляем временную метку
                  }
                })
              },
            }),
          ],
        },
        setUnavailableFiles: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                const now = Date.now()
                return context.allMediaFiles.map((file) => {
                  const isInEventFiles = event.files.some((f: MediaFile) => f.path === file.path)
                  if (isInEventFiles) {
                    return {
                      ...file,
                      isUnavailable: true,
                      lastCheckedAt: now, // Обновляем временную метку
                    }
                  }
                  return file
                })
              },
            }),
          ],
        },
        setLoading: {
          actions: assign({
            isLoading: ({ event }) => event.loading,
          }),
        },
        ADD_TO_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const { item, itemType } = event
              const currentFavorites = { ...context.favorites }

              // Создаем массив, если его еще нет
              if (!currentFavorites[itemType]) {
                currentFavorites[itemType] = []
              }

              // Проверяем, есть ли уже такой элемент в избранном
              const isAlreadyFavorite = currentFavorites[itemType].some((favItem: any) => favItem.id === item.id)

              // Если элемента еще нет в избранном, добавляем его
              if (!isAlreadyFavorite) {
                currentFavorites[itemType] = [...currentFavorites[itemType], item]
              }

              return currentFavorites
            },
          }),
        },
        REMOVE_FROM_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const { item, itemType } = event
              const currentFavorites = { ...context.favorites }

              // Если массив существует, удаляем элемент
              if (currentFavorites[itemType]) {
                currentFavorites[itemType] = currentFavorites[itemType].filter((favItem: any) => favItem.id !== item.id)
              }

              return currentFavorites
            },
          }),
        },
        CLEAR_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const currentFavorites = { ...context.favorites }

              // Если указан тип, очищаем только его
              if (event.itemType) {
                currentFavorites[event.itemType] = []
              } else {
                // Иначе очищаем все типы
                Object.keys(currentFavorites).forEach((key) => {
                  currentFavorites[key] = []
                })
              }

              return currentFavorites
            },
          }),
        },
        RELOAD: "loading",
      },
    },
    error: {
      on: {
        // Повторная загрузка данных
        RELOAD: "loading",

        // Обработка событий даже в состоянии ошибки
        ADD_TO_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const { item, itemType } = event
              const currentFavorites = { ...context.favorites }

              // Создаем массив, если его еще нет
              if (!currentFavorites[itemType]) {
                currentFavorites[itemType] = []
              }

              // Проверяем, есть ли уже такой элемент в избранном
              const isAlreadyFavorite = currentFavorites[itemType].some((favItem: any) => favItem.id === item.id)

              // Если элемента еще нет в избранном, добавляем его
              if (!isAlreadyFavorite) {
                currentFavorites[itemType] = [...currentFavorites[itemType], item]
              }

              return currentFavorites
            },
          }),
        },

        REMOVE_FROM_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const { item, itemType } = event
              const currentFavorites = { ...context.favorites }

              // Если массив существует, удаляем элемент
              if (currentFavorites[itemType]) {
                currentFavorites[itemType] = currentFavorites[itemType].filter((favItem: any) => favItem.id !== item.id)
              }

              return currentFavorites
            },
          }),
        },

        CLEAR_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const currentFavorites = { ...context.favorites }

              // Если указан тип, очищаем только его
              if (event.itemType) {
                currentFavorites[event.itemType] = []
              } else {
                // Иначе очищаем все типы
                Object.keys(currentFavorites).forEach((key) => {
                  currentFavorites[key] = []
                })
              }

              return currentFavorites
            },
          }),
        },

        // Обработка событий для работы с файлами (даже если массив пустой)
        INCLUDE_FILES: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                return context.allMediaFiles.map((file) => {
                  const isInEventFiles = event.files.some((f: MediaFile) => f.path === file.path)
                  if (isInEventFiles) {
                    return {
                      ...file,
                      isIncluded: true,
                      lastCheckedAt: Date.now(),
                    }
                  }
                  return file
                })
              },
            }),
          ],
        },

        REMOVE_FILE: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                return context.allMediaFiles.map((file) => {
                  if (file.path === event.path) {
                    return {
                      ...file,
                      isIncluded: false,
                      lastCheckedAt: Date.now(),
                    }
                  }
                  return file
                })
              },
            }),
          ],
        },

        CLEAR_FILES: {
          actions: [
            assign({
              allMediaFiles: ({ context }) => {
                const now = Date.now()
                return context.allMediaFiles.map((file) => {
                  return {
                    ...file,
                    isIncluded: false,
                    lastCheckedAt: now,
                  }
                })
              },
            }),
          ],
        },

        setAllMediaFiles: {
          actions: [
            assign({
              allMediaFiles: ({ event }) => event.files,
            }),
          ],
        },
      },
    },
  },
})
