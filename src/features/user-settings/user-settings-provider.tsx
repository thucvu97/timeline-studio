import { createContext, useContext, useEffect } from "react"

import { useMachine } from "@xstate/react"

import { storageService } from "@/features/media-studio/storage-service"

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
  handleClaudeApiKeyChange: (value: string) => void
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

    // Проверяем значение layoutMode в localStorage для отладки
    const debugLayoutMode = localStorage.getItem("debug-layout-mode")
    console.log("Debug: layout mode in localStorage:", debugLayoutMode)

    try {
      // Загружаем настройки из localStorage с помощью StorageService
      const savedSettings = storageService.get(USER_SETTINGS_STORAGE_KEY, {})
      console.log("Settings from StorageService:", savedSettings)

      if (
        typeof savedSettings === "object" &&
        Object.keys(savedSettings).length > 0
      ) {
        // Обновляем контекст машины состояний
        send({
          type: "UPDATE_ALL_SETTINGS",
          settings: {
            ...savedSettings,
            isLoaded: true, // Устанавливаем isLoaded в true
          },
        })
        console.log(
          "Settings loaded from localStorage and applied to state machine",
        )
        console.log(
          "Debug: layoutMode after loading settings:",
          (savedSettings as any).layoutMode,
        )
      } else {
        console.log("No settings found in localStorage or empty object")
      }
    } catch (error) {
      console.error("Error loading settings from localStorage:", error)
    }
  }, [send])

  // Логируем каждое изменение состояния и сохраняем в localStorage
  useEffect(() => {
    console.log("UserSettingsProvider: state updated", state.context)

  }, [state.context])

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
        send({
          type: "UPDATE_ACTIVE_TAB",
          tab: value as BrowserTab,
        })
        console.log("Active tab updated:", value)
      } else {
        console.error("Invalid tab value:", value)
      }
    },

    handleLayoutChange: (value: LayoutMode) => {
      console.log("Layout change requested:", value)
      console.log("Current layoutMode before update:", state.context.layoutMode)

      // Проверяем, что значение является допустимым LayoutMode
      if (["default", "options", "vertical", "dual"].includes(value)) {
        // Сохраняем значение напрямую в localStorage для отладки
        try {
          localStorage.setItem("debug-layout-mode", value)
          console.log("Debug: layout mode saved to localStorage:", value)
        } catch (error) {
          console.error("Error saving layout mode to localStorage:", error)
        }

        send({
          type: "UPDATE_LAYOUT",
          layoutMode: value,
        })
        console.log("Layout mode updated:", value)
      } else {
        console.error("Invalid layout value:", value)
      }
    },

    handlePlayerScreenshotsPathChange: (value: string) => {
      console.log("Player screenshots path change requested:", value)
      send({
        type: "UPDATE_PLAYER_SCREENSHOTS_PATH",
        path: value,
      })
      console.log("Player screenshots path updated:", value)
    },

    handleScreenshotsPathChange: (value: string) => {
      console.log("Screenshots path change requested:", value)
      send({
        type: "UPDATE_SCREENSHOTS_PATH",
        path: value,
      })
      console.log("Screenshots path updated:", value)
    },

    handleAiApiKeyChange: (value: string) => {
      console.log("AI API key change requested:", value ? "***" : "(empty)")
      send({
        type: "UPDATE_OPENAI_API_KEY",
        apiKey: value,
      })
      console.log("AI API key updated")
    },

    handleClaudeApiKeyChange: (value: string) => {
      console.log("Claude API key change requested:", value ? "***" : "(empty)")
      send({
        type: "UPDATE_CLAUDE_API_KEY",
        apiKey: value,
      })
      console.log("Claude API key updated")
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
