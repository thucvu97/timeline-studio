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
  screenshotsPath: string
  aiApiKey: string
  handleTabChange: (value: string) => void
  handleLayoutChange: (value: LayoutMode) => void
  handleScreenshotsPathChange: (value: string) => void
  handleAiApiKeyChange: (value: string) => void
}

export const UserSettingsContext = createContext<
  UserSettingsContextValue | undefined
>(undefined)

export function UserSettingsProvider({
  children,
}: { children: React.ReactNode }) {
  console.log("UserSettingsProvider rendering")
  const [state, send] = useMachine(userSettingsMachine)

  console.log("UserSettingsProvider state:", state.context)

  // Логируем каждое изменение состояния
  useEffect(() => {
    console.log("UserSettingsProvider: state updated", state.context)
  }, [state])

  const value = {
    activeTab: state.context.activeTab,
    layoutMode: state.context.layoutMode,
    screenshotsPath: state.context.screenshotsPath,
    aiApiKey: state.context.aiApiKey,
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
        send({ type: "UPDATE_ACTIVE_TAB", tab: value as BrowserTab })
      } else {
        console.error("Invalid tab value:", value)
      }
    },
    handleLayoutChange: (value: LayoutMode) => {
      console.log("Layout change requested:", value)
      console.log("Current layoutMode before update:", state.context.layoutMode)

      // Проверяем, что значение является допустимым LayoutMode
      if (["default", "options", "vertical", "dual"].includes(value)) {
        // Отправляем событие в машину состояний
        send({ type: "UPDATE_LAYOUT", layoutMode: value })
        console.log("UPDATE_LAYOUT event sent with layoutMode:", value)
      } else {
        console.error("Invalid layout value:", value)
      }
    },
    handleScreenshotsPathChange: (value: string) => {
      console.log("Screenshots path change requested:", value)
      send({ type: "UPDATE_SCREENSHOTS_PATH", path: value })
      console.log("UPDATE_SCREENSHOTS_PATH event sent with path:", value)
    },

    handleAiApiKeyChange: (value: string) => {
      console.log("AI API key change requested:", value ? "***" : "(empty)")
      send({ type: "UPDATE_AI_API_KEY", apiKey: value })
      console.log("UPDATE_AI_API_KEY event sent")
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
