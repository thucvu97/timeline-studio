import { createContext, useContext, useEffect } from "react"

import { useMachine } from "@xstate/react"

import { userSettingsDbService } from "@/features/media-studio/indexed-db-service"

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
  handlePlayerScreenshotsPathChange: (value: string) => void
  handleAiApiKeyChange: (value: string) => void
  handleClaudeApiKeyChange: (value: string) => void
}

export const UserSettingsContext = createContext<
  UserSettingsContextValue | undefined
>(undefined)

export function UserSettingsProvider({
  children,
}: { children: React.ReactNode }) {
  console.log("UserSettingsProvider rendering")

  // Используем useState для отслеживания изменений состояния
  const [state, send] = useMachine(userSettingsMachine)

  console.log("UserSettingsProvider state:", state.context)
  console.log("UserSettingsProvider state status:", state.status)

  useEffect(() => {
    console.log("Saving settings to IndexedDB")
    userSettingsDbService
      .saveState(state.context)
      .then(() => {
        console.log("User Settings saved to IndexedDB: ", state.context)
      })
      .catch((error: unknown) => {
        console.error("Error saving settings to IndexedDB: ", error)
      })
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
        console.log("Updating layoutMode:", value)
        send({
          type: "UPDATE_LAYOUT",
          layoutMode: value,
        })
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
