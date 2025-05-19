/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { assign, createMachine, fromPromise } from "xstate"

import { userSettingsDbService } from "../media-studio/indexed-db-service"

export const PREVIEW_SIZES = [
  60, 80, 100, 125, 150, 200, 250, 300, 400, 500,
] as const
export const DEFAULT_SIZE = 100
export const MIN_SIZE = 60

// Допустимые значения для активного таба
export const BROWSER_TABS = [
  "media",
  "music",
  "transitions",
  "effects",
  "filters",
  "templates",
] as const
export const DEFAULT_TAB = "media"

// Допустимые значения для макета
export const LAYOUTS = ["default", "options", "vertical", "dual"] as const
export const DEFAULT_LAYOUT = "default"

export type PreviewSize = (typeof PREVIEW_SIZES)[number]
export type BrowserTab = (typeof BROWSER_TABS)[number]
export type LayoutMode = (typeof LAYOUTS)[number]

export interface UserSettingsContext {
  previewSizes: Record<"MEDIA" | "TRANSITIONS" | "TEMPLATES", PreviewSize>
  activeTab: BrowserTab
  layoutMode: LayoutMode
  screenshotsPath: string
  playerScreenshotsPath: string
  openAiApiKey: string
  claudeApiKey: string
  isLoaded: boolean
}

const initialContext: UserSettingsContext = {
  previewSizes: {
    MEDIA: DEFAULT_SIZE,
    TRANSITIONS: DEFAULT_SIZE,
    TEMPLATES: DEFAULT_SIZE,
  },
  activeTab: DEFAULT_TAB,
  layoutMode: DEFAULT_LAYOUT,
  screenshotsPath: "public/screenshots",
  playerScreenshotsPath: "public/media",
  openAiApiKey: "",
  claudeApiKey: "",
  isLoaded: false,
}

interface UpdatePreviewSizeEvent {
  type: "UPDATE_PREVIEW_SIZE"
  key: "MEDIA" | "TRANSITIONS" | "TEMPLATES"
  size: PreviewSize
}
interface UpdateActiveTabEvent {
  type: "UPDATE_ACTIVE_TAB"
  tab: BrowserTab
}
interface UpdateLayoutEvent {
  type: "UPDATE_LAYOUT"
  layoutMode: LayoutMode
}
interface UpdateScreenshotsPathEvent {
  type: "UPDATE_SCREENSHOTS_PATH"
  path: string
}

interface UpdateAllSettingsEvent {
  type: "UPDATE_ALL"
  settings: Partial<UserSettingsContext>
}

interface UpdatePlayerScreenshotsPathEvent {
  type: "UPDATE_PLAYER_SCREENSHOTS_PATH"
  path: string
}

interface UpdateOpenAiApiKeyEvent {
  type: "UPDATE_OPENAI_API_KEY"
  apiKey: string
}

interface UpdateClaudeApiKeyEvent {
  type: "UPDATE_CLAUDE_API_KEY"
  apiKey: string
}

interface LoadUserSettingsEvent {
  type: "LOAD_SETTINGS"
  settings: Partial<UserSettingsContext>
}

interface UserSettingsLoadedEvent {
  type: "SETTINGS_LOADED"
  previewSizes: Record<"MEDIA" | "TRANSITIONS" | "TEMPLATES", PreviewSize>
  activeTab: BrowserTab
  layoutMode: LayoutMode
  screenshotsPath: string
  playerScreenshotsPath: string
  openAiApiKey: string
  claudeApiKey: string
}

export type UserSettingsEvent =
  | LoadUserSettingsEvent
  | UpdatePreviewSizeEvent
  | UpdateActiveTabEvent
  | UpdateLayoutEvent
  | UpdateScreenshotsPathEvent
  | UpdatePlayerScreenshotsPathEvent
  | UpdateOpenAiApiKeyEvent
  | UpdateClaudeApiKeyEvent
  | UpdateAllSettingsEvent

// Функция для загрузки состояния таймлайна из IndexedDB
const loadTimelineState = fromPromise(async () => {
  try {
    // Загружаем состояние из IndexedDB
    const state = await userSettingsDbService.loadTimelineState()
    if (state && Object.keys(state).length > 0) {
      console.log(
        `[userSettingsMachine] Состояние настроек загружено из IndexedDB`,
      )
      return state
    }
    console.log(
      "[userSettingsMachine] В IndexedDB нет сохраненного состояния настроек",
    )
    return null
  } catch (error) {
    console.error(
      "[userSettingsMachine] Ошибка при загрузке состояния настроек:",
      error,
    )
    return null
  }
})

export const userSettingsMachine = createMachine(
  {
    id: "user-settings-v2", // Изменяем ID, чтобы сбросить кэш
    initial: "loading",
    context: initialContext,
    states: {
      loading: {
        invoke: {
          src: loadTimelineState,
          onDone: {
            target: "idle",
            actions: [
              assign(({ event }) => {
                const loadedState = event.output
                if (loadedState) {
                  console.log(
                    "[timelineMachine] Восстанавливаем состояние из IndexedDB",
                  )
                  return {
                    ...initialContext,
                    ...loadedState,
                  }
                }
                return initialContext
              }),
            ],
          },
          onError: {
            target: "idle",
            actions: [
              ({ event }) => {
                if (event && event.error) {
                  console.error(
                    "[timelineMachine] Ошибка при загрузке состояния:",
                    event.error,
                  )
                } else {
                  console.error(
                    "[timelineMachine] Неизвестная ошибка при загрузке состояния",
                  )
                }
              },
            ],
          },
        },
      },
      idle: {
        entry: () => {
          console.log("UserSettingsMachine entered idle state")
        },
        // Используем вложенные состояния, чтобы машина не останавливалась
        initial: "ready",
        states: {
          ready: {},
        },
        on: {
          UPDATE_ALL: {
            actions: ["updateAllSettings"],
            // Не указываем target, чтобы это был внутренний переход
          },
          UPDATE_PREVIEW_SIZE: {
            actions: ["updatePreviewSize", "saveToDb"],
          },
          UPDATE_ACTIVE_TAB: {
            actions: ["updateActiveTab", "saveToDb"],
          },
          UPDATE_LAYOUT: {
            actions: ["updateLayout", "saveToDb"],
          },
          UPDATE_SCREENSHOTS_PATH: {
            actions: ["updateScreenshotsPath", "saveToDb"],
          },
          UPDATE_PLAYER_SCREENSHOTS_PATH: {
            actions: ["updatePlayerScreenshotsPath", "saveToDb"],
          },
          UPDATE_OPENAI_API_KEY: {
            actions: ["updateOpenAiApiKey", "saveToDb"],
          },
          UPDATE_CLAUDE_API_KEY: {
            actions: ["updateClaudeApiKey", "saveToDb"],
          },
        },
      },
    },
  },
  {
    actions: {
      updateAllSettings: assign(({ context, event }) => {
        const typedEvent = event as UpdateAllSettingsEvent
        console.log("Updating all settings:", typedEvent.settings)
        // Возвращаем обновленный контекст
        return {
          ...context,
          ...typedEvent.settings,
        }
      }),

      // Метод для обновления размера превью
      updatePreviewSize: assign(({ context, event }) => {
        const typedEvent = event as UpdatePreviewSizeEvent
        console.log("Updating preview size:", typedEvent.key, typedEvent.size)

        const newPreviewSizes = {
          ...context.previewSizes,
        }
        newPreviewSizes[typedEvent.key] = typedEvent.size

        return {
          ...context,
          previewSizes: newPreviewSizes,
        }
      }),

      // Метод для обновления активной вкладки
      updateActiveTab: assign(({ context, event }) => {
        const typedEvent = event as UpdateActiveTabEvent
        console.log("Updating active tab:", typedEvent.tab)

        return {
          ...context,
          activeTab: typedEvent.tab,
        }
      }),

      // Метод для обновления режима макета
      updateLayout: assign(({ context, event }) => {
        const typedEvent = event as UpdateLayoutEvent
        console.log("Updating layout mode:", typedEvent.layoutMode)

        return {
          ...context,
          layoutMode: typedEvent.layoutMode,
        }
      }),

      updatePlayerScreenshotsPath: assign(({ context, event }) => {
        const typedEvent = event as UpdatePlayerScreenshotsPathEvent
        console.log("Updating player screenshots path:", typedEvent.path)

        return {
          ...context,
          playerScreenshotsPath: typedEvent.path,
        }
      }),

      updateScreenshotsPath: assign(({ context, event }) => {
        const typedEvent = event as UpdateScreenshotsPathEvent
        console.log("Updating screenshots path:", typedEvent.path)

        return {
          ...context,
          screenshotsPath: typedEvent.path,
        }
      }),

      updateOpenAiApiKey: assign(({ context, event }) => {
        const typedEvent = event as UpdateOpenAiApiKeyEvent
        console.log(
          "Updating OpenAI API key:",
          typedEvent.apiKey ? "***" : "(empty)",
        )

        return {
          ...context,
          openAiApiKey: typedEvent.apiKey,
        }
      }),

      updateClaudeApiKey: assign(({ context, event }) => {
        const typedEvent = event as UpdateClaudeApiKeyEvent
        console.log(
          "Updating Claude API key:",
          typedEvent.apiKey ? "***" : "(empty)",
        )

        return {
          ...context,
          claudeApiKey: typedEvent.apiKey,
        }
      }),

      saveToDb: ({ context }) => {
        console.log("Saving settings to IndexedDB")
        userSettingsDbService
          .saveState(context)
          .then(() => {
            console.log("User Settings saved to IndexedDB: ", context)
          })
          .catch((error: unknown) => {
            console.error("Error saving settings to IndexedDB: ", error)
          })
      },
    },
  },
)
