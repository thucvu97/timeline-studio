import { useCallback } from "react"

import { useAutoLoadMedia } from "./use-auto-load-media"
import { useAutoLoadResources } from "./use-auto-load-resources"

/**
 * Структура для автозагрузки пользовательских данных
 */
interface UserDataSummary {
  media: number
  music: number
  effects: number
  transitions: number
  filters: number
  subtitles: number
  styleTemplates: number
}

/**
 * Оптимизированный хук для автоматической загрузки пользовательских данных
 * Использует разделенные хуки для медиа и ресурсов с debouncing и кэшированием
 */

export function useAutoLoadUserData() {
  // Используем оптимизированные хуки для разных типов ресурсов
  const mediaHook = useAutoLoadMedia()
  const resourcesHook = useAutoLoadResources()

  // Объединяем состояние загрузки
  const isLoading = mediaHook.isLoading || resourcesHook.isLoading
  const error = mediaHook.error || resourcesHook.error

  // Создаем объединенную статистику
  const loadedData: UserDataSummary = {
    media: mediaHook.loadedCount.media,
    music: mediaHook.loadedCount.music,
    effects: resourcesHook.loadedStats.effects,
    transitions: resourcesHook.loadedStats.transitions,
    filters: resourcesHook.loadedStats.filters,
    subtitles: resourcesHook.loadedStats.subtitles,
    styleTemplates: resourcesHook.loadedStats.styleTemplates,
  }

  // Объединенная функция перезагрузки
  const reload = useCallback(async () => {
    await Promise.all([mediaHook.reload(), resourcesHook.reload()])
  }, [mediaHook.reload, resourcesHook.reload])

  // Объединенная функция очистки кэша
  const clearCache = useCallback(() => {
    mediaHook.clearCache()
    resourcesHook.clearCache()
  }, [mediaHook.clearCache, resourcesHook.clearCache])

  return {
    isLoading,
    loadedData,
    error,
    reload,
    clearCache,
  }
}
