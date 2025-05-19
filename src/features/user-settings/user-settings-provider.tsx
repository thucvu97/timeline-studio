import { createContext, useContext, useEffect } from "react"

import { useMachine } from "@xstate/react"

import { timelineIndexedDBService } from "@/features/media-studio/indexed-db-service"

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

export function UserSettingsProvider({
  children,
}: { children: React.ReactNode }) {
  console.log("UserSettingsProvider rendering")
  const [state, send] = useMachine(userSettingsMachine)

  console.log("UserSettingsProvider state:", state.context)

  // Загружаем настройки из IndexedDB при монтировании компонента
  useEffect(() => {
    console.log("UserSettingsProvider: Loading settings from IndexedDB")

    // Загружаем настройки из IndexedDB
    timelineIndexedDBService.loadTimelineState()
      .then((savedSettings) => {
        console.log("Settings from IndexedDB:", savedSettings)

        if (savedSettings && typeof savedSettings === "object" && Object.keys(savedSettings).length > 0) {
          // Обновляем контекст машины состояний
          send({
            type: "UPDATE_ALL_SETTINGS",
            settings: {
              ...savedSettings,
              isLoaded: true, // Устанавливаем isLoaded в true
            },
          })
          console.log("Settings loaded from IndexedDB and applied to state machine")
        } else {
          // Если настройки не найдены, просто устанавливаем isLoaded в true
          send({
            type: "UPDATE_ALL_SETTINGS",
            settings: {
              ...state.context,
              isLoaded: true, // Устанавливаем isLoaded в true
            },
          })
          console.log("No settings found in IndexedDB, isLoaded set to true")
        }
      })
      .catch((error: unknown) => {
        console.error("Error loading settings from IndexedDB:", error)

        // В случае ошибки просто устанавливаем isLoaded в true
        send({
          type: "UPDATE_ALL_SETTINGS",
          settings: {
            ...state.context,
            isLoaded: true, // Устанавливаем isLoaded в true
          },
        })
        console.log("Error loading settings, isLoaded set to true")
      })
  }, [send, state.context])

  // Логируем каждое изменение состояния и сохраняем в IndexedDB
  useEffect(() => {
    console.log("UserSettingsProvider: state updated", state.context)

    // Сохраняем настройки в IndexedDB при изменении состояния
    if (state.context.isLoaded) {
      timelineIndexedDBService
        .saveTimelineState(state.context)
        .then(() => {
          console.log("Settings saved to IndexedDB")
        })
        .catch((error: unknown) => {
          console.error("Error saving settings to IndexedDB:", error)
        })
    }
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
        // Создаем обновленный контекст
        const updatedContext = {
          ...state.context,
          layoutMode: value,
          isLoaded: true,
        }

        // Обновляем все настройки сразу, включая layoutMode
        send({
          type: "UPDATE_ALL_SETTINGS",
          settings: updatedContext,
        })

        // Также отправляем событие UPDATE_LAYOUT для совместимости
        send({
          type: "UPDATE_LAYOUT",
          layoutMode: value,
        })

        console.log("Layout mode updated:", value)
        console.log(
          "Current context after update (state.context):",
          state.context,
        )
        console.log("Updated context (local variable):", updatedContext)

        // Сохраняем настройки в IndexedDB
        timelineIndexedDBService
          .saveTimelineState(updatedContext)
          .then(() => {
            console.log(
              "Settings with new layoutMode saved to IndexedDB:",
              value,
            )
          })
          .catch((error: unknown) => {
            console.error(
              "Error saving settings with new layoutMode to IndexedDB:",
              error,
            )
          })

        // Вызываем событие resize, чтобы компоненты перерисовались
        setTimeout(() => {
          if (typeof window !== "undefined") {
            console.log("Dispatching resize event to force rerender")
            window.dispatchEvent(new Event("resize"))
          }
        }, 50)
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
