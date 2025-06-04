import { useCallback } from "react"

import { useAppSettings } from "./use-app-settings"

/**
 * Хук для доступа к избранным элементам
 * Предоставляет методы для управления избранными элементами
 *
 * @returns Объект с данными и методами для работы с избранными
 */
export function useFavorites() {
  const { getFavorites, updateFavorites, addToFavorites, removeFromFavorites } = useAppSettings()

  const favorites = getFavorites()

  const isItemFavorite = useCallback(
    (item: any, type: string) => {
      return favorites[type]?.some((f) => f.id === item.id)
    },
    [favorites],
  )

  return {
    favorites,
    updateFavorites,
    addToFavorites,
    removeFromFavorites,
    isItemFavorite,
  }
}
