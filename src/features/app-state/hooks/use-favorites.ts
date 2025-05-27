import { useAppSettings } from "./use-app-settings"

/**
 * Хук для доступа к избранным элементам
 * Предоставляет методы для управления избранными элементами
 *
 * @returns Объект с данными и методами для работы с избранными
 */
export function useFavorites() {
  const { getFavorites, updateFavorites, addToFavorites, removeFromFavorites } = useAppSettings()

  return {
    favorites: getFavorites(),
    updateFavorites,
    addToFavorites,
    removeFromFavorites,
  }
}
