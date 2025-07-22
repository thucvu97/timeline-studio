import { useCallback, useEffect } from "react"

import { BrowserStateAccess } from "@/features/ai-chat/tools/browser/types"
import { setBrowserStateAccess } from "@/features/ai-chat/tools/browser/utils/helpers"
import { useAppSettings } from "@/features/app-state/hooks"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { MediaFile } from "@/features/media/types/media"

/**
 * Хук для интеграции Browser с AI функциональностью
 * Предоставляет доступ к состоянию браузера для AI инструментов
 */
export function useBrowserAIIntegration() {
  const browserState = useBrowserState()
  const { state } = useAppSettings()

  // Получаем медиафайлы из app state
  const mediaFiles = state.context.mediaFiles.allFiles || []
  const isLoading = state.context.mediaFiles.isLoading

  // Функция для получения файлов из текущей вкладки
  const getTabFiles = useCallback((): MediaFile[] => {
    const { activeTab } = browserState

    // Фильтруем файлы в зависимости от активной вкладки
    switch (activeTab) {
      case "media":
        return mediaFiles.filter((file: MediaFile) => file.isVideo || file.isImage)
      case "music":
        return mediaFiles.filter((file: MediaFile) => file.isAudio)
      default:
        // Для остальных вкладок возвращаем пустой массив
        // так как они не связаны с медиафайлами
        return []
    }
  }, [browserState.activeTab, mediaFiles])

  // Функция для получения выбранных файлов
  const getSelectedFiles = useCallback((): MediaFile[] => {
    // В текущей реализации нет выбора файлов
    // Возвращаем пустой массив
    return []
  }, [])

  // Функция для получения файлов с фильтрами
  const getFilteredFiles = useCallback((): MediaFile[] => {
    const tabFiles = getTabFiles()
    const { currentTabSettings } = browserState

    let filtered = [...tabFiles]

    // Применяем поиск
    if (currentTabSettings.searchQuery) {
      const query = currentTabSettings.searchQuery.toLowerCase()
      filtered = filtered.filter((file) => file.name.toLowerCase().includes(query))
    }

    // Применяем фильтр по избранным
    if (currentTabSettings.showFavoritesOnly) {
      // В текущей реализации нет функционала избранного
      // Оставляем как есть
    }

    // Применяем сортировку
    filtered.sort((a, b) => {
      const { sortBy, sortOrder } = currentTabSettings
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "date":
          comparison = (a.lastModified || 0) - (b.lastModified || 0)
          break
        case "size":
          comparison = (a.size || 0) - (b.size || 0)
          break
        case "duration":
          comparison = (a.duration || 0) - (b.duration || 0)
          break
        default:
          // По умолчанию сортируем по имени
          comparison = a.name.localeCompare(b.name)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [getTabFiles, browserState])

  // Эффект для установки доступа к состоянию браузера
  useEffect(() => {
    const browserAccess: BrowserStateAccess = {
      getCurrentTab: () => browserState.activeTab,
      getFiles: (tab?: any) => {
        if (tab) {
          // Фильтруем файлы для конкретной вкладки
          switch (tab) {
            case "media":
              return mediaFiles.filter((file: MediaFile) => file.isVideo || file.isImage)
            case "music":
              return mediaFiles.filter((file: MediaFile) => file.isAudio)
            default:
              return []
          }
        }
        return getTabFiles()
      },
      getSelectedFiles,
      getFilters: () => browserState.currentTabSettings,
      setFilters: (filters: any) => {
        // Применяем фильтры к текущей вкладке
        if (filters.searchQuery !== undefined) {
          browserState.setSearchQuery(filters.searchQuery)
        }
        if (filters.sortBy && filters.sortOrder) {
          browserState.setSort(filters.sortBy, filters.sortOrder)
        }
      },
      selectFiles: (_fileIds: string[]) => {
        // В текущей реализации нет функции выбора файлов
        console.warn("selectFiles not implemented yet")
      },
      deselectFiles: (_fileIds: string[]) => {
        // В текущей реализации нет функции выбора файлов
        console.warn("deselectFiles not implemented yet")
      },
      searchFiles: (query: string) => {
        const filtered = getTabFiles().filter((file: MediaFile) =>
          file.name.toLowerCase().includes(query.toLowerCase()),
        )
        return filtered
      },
      getFileGroups: (groupBy: string) => {
        // Группировка файлов
        const files = getTabFiles()
        const groups: Record<string, MediaFile[]> = {}

        files.forEach((file: MediaFile) => {
          let groupKey = ""
          switch (groupBy) {
            case "type":
              groupKey = file.isVideo ? "video" : file.isAudio ? "audio" : file.isImage ? "image" : "other"
              break
            case "date":
              const date = new Date(file.createdAt || file.updatedAt || Date.now())
              groupKey = date.toISOString().split("T")[0]
              break
            default:
              groupKey = "all"
          }

          if (!groups[groupKey]) {
            groups[groupKey] = []
          }
          groups[groupKey].push(file)
        })

        return Object.entries(groups).map(([key, files]) => ({
          id: key,
          name: key,
          files,
          count: files.length,
        }))
      },
      getBrowserStats: () => {
        const files = getTabFiles()
        const filesByType: Record<string, number> = {}
        let totalSize = 0

        files.forEach((file: MediaFile) => {
          const type = file.isVideo ? "video" : file.isAudio ? "audio" : file.isImage ? "image" : "other"
          filesByType[type] = (filesByType[type] || 0) + 1
          totalSize += file.size || 0
        })

        return {
          totalFiles: files.length,
          selectedFiles: 0, // В текущей реализации нет выбора файлов
          filesByType,
          totalSize,
        }
      },
    }

    // Устанавливаем доступ для AI инструментов
    setBrowserStateAccess(browserAccess)

    // Очищаем при размонтировании
    return () => {
      setBrowserStateAccess(null)
    }
  }, [browserState, mediaFiles, isLoading, getTabFiles, getSelectedFiles, getFilteredFiles])

  return {
    isReady: !isLoading && mediaFiles.length > 0,
    filesCount: mediaFiles.length,
    activeTab: browserState.activeTab,
  }
}
