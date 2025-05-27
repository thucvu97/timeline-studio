import { useContext } from "react"

import { UserSettingsContext, UserSettingsContextValue } from "../services/user-settings-provider"

/**
 * Хук для доступа к пользовательским настройкам
 * Предоставляет доступ к текущим настройкам и методам для их изменения
 *
 * @returns {UserSettingsContextValue} Объект с настройками и методами для их изменения
 * @throws {Error} Если хук используется вне компонента UserSettingsProvider
 */
export function useUserSettings(): UserSettingsContextValue {
  // Получаем значение контекста
  const context = useContext(UserSettingsContext)

  // Проверяем, что хук используется внутри провайдера
  if (!context) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider")
  }

  // Возвращаем значение контекста
  return context
}
