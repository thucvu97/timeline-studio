import { createContext, useContext, useEffect } from "react"

import { useMachine } from "@xstate/react"

import {
  BrowserTab,
  LayoutMode,
  userSettingsMachine,
} from "./user-settings-machine"

interface UserSettingsContextValue {
  activeTab: BrowserTab
  layoutMode: LayoutMode
  playerScreenshotsPath: string
  screenshotsPath: string
  openAiApiKey: string
  claudeApiKey: string

  handleTabChange: (value: string) => void
  handleLayoutChange: (value: LayoutMode) => void
  handleScreenshotsPathChange: (value: string) => void
  handleAiApiKeyChange: (value: string) => void
}

export const UserSettingsContext = createContext<
  UserSettingsContextValue | undefined
>(undefined)

// Ключ для хранения всех настроек пользователя в localStorage
const USER_SETTINGS_STORAGE_KEY = "timeline-studio-user-settings"

export function UserSettingsProvider({
  children,
}: { children: React.ReactNode }) {
  console.log("UserSettingsProvider rendering")
  const [state, send] = useMachine(userSettingsMachine)

  console.log("UserSettingsProvider state:", state.context)

  // Загружаем настройки из localStorage при монтировании компонента
  useEffect(() => {
    console.log("UserSettingsProvider: Loading settings from localStorage")

    try {
      // Загружаем настройки из localStorage
      const savedSettingsJson = localStorage.getItem(USER_SETTINGS_STORAGE_KEY)
      console.log("Settings from localStorage:", savedSettingsJson)

      if (savedSettingsJson) {
        try {
          // Пытаемся распарсить как JSON
          const parsedSettings = JSON.parse(savedSettingsJson)
          console.log("Parsed settings from localStorage:", parsedSettings)

          // Если это объект, используем его как полные настройки
          if (typeof parsedSettings === 'object' && parsedSettings !== null) {
            // Обновляем контекст машины состояний
            send({
              type: "UPDATE_ALL_SETTINGS",
              settings: parsedSettings
            })
            console.log("Settings loaded from localStorage and applied to state machine")
          } else {
            console.log("Invalid settings format in localStorage")
          }
        } catch (e) {
          // Если не удалось распарсить как JSON, используем как строку пути
          console.log("Using value as string:", savedSettingsJson)
          send({
            type: "UPDATE_ALL_SETTINGS",
            settings: { screenshotsPath: savedSettingsJson }
          })
        }
      } else {
        console.log("No settings found in localStorage")
      }
    } catch (error) {
      console.error("Error loading settings from localStorage:", error)
    }
  }, [send])

  // Логируем каждое изменение состояния и сохраняем в localStorage
  useEffect(() => {
    console.log("UserSettingsProvider: state updated", state.context)

    // Сохраняем все настройки в localStorage
    if (state.context.isLoaded) {
      try {
        // Сохраняем настройки напрямую в localStorage
        localStorage.setItem(
          USER_SETTINGS_STORAGE_KEY,
          JSON.stringify(state.context),
        )
        console.log("All settings saved to localStorage on state change")
      } catch (error) {
        console.error(
          "Error saving settings to localStorage on state change:",
          error,
        )
      }
    }
  }, [state])

  const value = {
    activeTab: state.context.activeTab,
    layoutMode: state.context.layoutMode,
    screenshotsPath: state.context.screenshotsPath,
    playerScreenshotsPath: state.context.playerScreenshotsPath,
    openAiApiKey: state.context.openAiApiKey,
    claudeApiKey: state.context.claudeApiKey,

    handleTabChange: (value: string) => {
      console.log("Tab change requested:", value)
      // Проверяем, что значение является допустимым BrowserTab
      if (
        [
          "media",
          "music",
          "transitions",
          "effects",
          "filters",
          "templates",
        ].includes(value)
      ) {
        // Обновляем контекст машины состояний
        send({
          type: "UPDATE_ALL_SETTINGS",
          settings: { activeTab: value as BrowserTab },
        })

        // Сохраняем настройки в localStorage
        const updatedSettings = {
          ...state.context,
          activeTab: value as BrowserTab,
        }
        localStorage.setItem(
          USER_SETTINGS_STORAGE_KEY,
          JSON.stringify(updatedSettings),
        )

        console.log("Active tab updated and saved:", value)
      } else {
        console.error("Invalid tab value:", value)
      }
    },
    handleLayoutChange: (value: LayoutMode) => {
      console.log("Layout change requested:", value)
      console.log("Current layoutMode before update:", state.context.layoutMode)

      // Проверяем, что значение является допустимым LayoutMode
      if (["default", "options", "vertical", "dual"].includes(value)) {
        // Обновляем контекст машины состояний
        send({ type: "UPDATE_ALL_SETTINGS", settings: { layoutMode: value } })

        // Сохраняем настройки в localStorage
        const updatedSettings = {
          ...state.context,
          layoutMode: value,
        }
        localStorage.setItem(
          USER_SETTINGS_STORAGE_KEY,
          JSON.stringify(updatedSettings),
        )

        console.log("Layout mode updated and saved:", value)
      } else {
        console.error("Invalid layout value:", value)
      }
    },
    handleScreenshotsPathChange: (value: string) => {
      console.log("Screenshots path change requested:", value)

      // Обновляем контекст машины состояний
      send({
        type: "UPDATE_ALL_SETTINGS",
        settings: { screenshotsPath: value },
      })

      // Сохраняем настройки в localStorage напрямую
      try {
        // Получаем текущие настройки из localStorage
        const currentSettingsJson = localStorage.getItem(
          USER_SETTINGS_STORAGE_KEY,
        )
        let currentSettings = {}

        if (currentSettingsJson) {
          currentSettings = JSON.parse(currentSettingsJson)
        }

        // Обновляем путь скриншотов
        const updatedSettings = {
          ...currentSettings,
          screenshotsPath: value,
        }

        // Сохраняем обновленные настройки
        localStorage.setItem(
          USER_SETTINGS_STORAGE_KEY,
          JSON.stringify(updatedSettings),
        )

        console.log("Screenshots path directly saved to localStorage:", value)
        console.log("Updated settings in localStorage:", updatedSettings)
      } catch (error) {
        console.error(
          "Error directly saving screenshots path to localStorage:",
          error,
        )
      }
    },

    handleAiApiKeyChange: (value: string) => {
      console.log("AI API key change requested:", value ? "***" : "(empty)")

      // Обновляем контекст машины состояний
      send({ type: "UPDATE_ALL_SETTINGS", settings: { aiApiKey: value } })

      // Сохраняем настройки в localStorage напрямую
      try {
        // Получаем текущие настройки из localStorage
        const currentSettingsJson = localStorage.getItem(
          USER_SETTINGS_STORAGE_KEY,
        )
        let currentSettings = {}

        if (currentSettingsJson) {
          currentSettings = JSON.parse(currentSettingsJson)
        }

        // Обновляем API ключ
        const updatedSettings = {
          ...currentSettings,
          aiApiKey: value,
        }

        // Сохраняем обновленные настройки
        localStorage.setItem(
          USER_SETTINGS_STORAGE_KEY,
          JSON.stringify(updatedSettings),
        )

        console.log("AI API key directly saved to localStorage")
      } catch (error) {
        console.error(
          "Error directly saving AI API key to localStorage:",
          error,
        )
      }
    },
  }

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error(
      "useUserSettings must be used within a UserSettingsProvider",
    )
  }
  return context
}
