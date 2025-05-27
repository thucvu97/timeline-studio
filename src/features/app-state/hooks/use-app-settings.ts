import { useContext } from "react"

import { AppSettingsContext, AppSettingsProviderContext } from "../services/app-settings-provider"

/**
 * Хук для доступа к контексту настроек приложения
 * Предоставляет доступ к состоянию и методам для управления настройками приложения
 *
 * @returns {AppSettingsProviderContext} Значение контекста с состояниями и методами
 * @throws {Error} Если хук используется вне AppSettingsProvider
 */
export function useAppSettings(): AppSettingsProviderContext {
  const context = useContext(AppSettingsContext)

  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider")
  }

  return context
}
