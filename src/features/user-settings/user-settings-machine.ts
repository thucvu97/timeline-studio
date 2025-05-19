/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { assign, createMachine } from "xstate"

export const PREVIEW_SIZES = [
  60, 80, 100, 125, 150, 200, 250, 300, 400,
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
  playerScreenshotsPath: "public/screenshots",
  openAiApiKey: "",
  claudeApiKey: "",
  isLoaded: false,
}

interface LoadUserSettingsEvent {
  type: "LOAD_SETTINGS"
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
  type: "UPDATE_ALL_SETTINGS"
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

export type UserSettingsEvent =
  | LoadUserSettingsEvent
  | UserSettingsLoadedEvent
  | UpdatePreviewSizeEvent
  | UpdateActiveTabEvent
  | UpdateLayoutEvent
  | UpdateScreenshotsPathEvent
  | UpdatePlayerScreenshotsPathEvent
  | UpdateOpenAiApiKeyEvent
  | UpdateClaudeApiKeyEvent
  | UpdateAllSettingsEvent

export const userSettingsMachine = createMachine(
  {
    id: "userSettings",
    initial: "loading",
    context: initialContext,
    states: {
      loading: {
        entry: ["loadSettings"],
        on: {
          SETTINGS_LOADED: {
            target: "idle",
            actions: ["updateSettings"],
          },
        },
      },
      idle: {
        entry: () => {
          console.log("UserSettingsMachine entered idle state")
        },
        on: {
          UPDATE_ALL_SETTINGS: {
            actions: ["updateAllSettings"],
          },
          UPDATE_PREVIEW_SIZE: {
            actions: ["updatePreviewSize"],
          },
          UPDATE_ACTIVE_TAB: {
            actions: ["updateActiveTab"],
          },
          UPDATE_LAYOUT: {
            actions: ["updateLayout"],
          },
          UPDATE_SCREENSHOTS_PATH: {
            actions: ["updateScreenshotsPath"],
          },
          UPDATE_PLAYER_SCREENSHOTS_PATH: {
            actions: ["updatePlayerScreenshotsPath"],
          },
          UPDATE_OPENAI_API_KEY: {
            actions: ["updateOpenAiApiKey"],
          },
          UPDATE_CLAUDE_API_KEY: {
            actions: ["updateClaudeApiKey"],
          },
        },
      },
    },
  },
  {
    actions: {
      // Действие для загрузки настроек из IndexedDB
      // Это действие вызывается при входе в состояние "loading"
      // Но фактическая загрузка происходит в компоненте UserSettingsProvider
      loadSettings: () => {
        console.log("Loading settings action called")
      },

      updateSettings: assign({
        previewSizes: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.previewSizes
        },
        activeTab: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.activeTab
        },
        layoutMode: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.layoutMode ?? DEFAULT_LAYOUT
        },
        playerScreenshotsPath: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.playerScreenshotsPath ?? "public/media"
        },
        screenshotsPath: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.screenshotsPath ?? "public/screenshots"
        },
        openAiApiKey: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.openAiApiKey ?? ""
        },
        claudeApiKey: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.claudeApiKey ?? ""
        },
        isLoaded: (_) => true,
      }),

      // Метод для обновления всех настроек сразу
      updateAllSettings: assign((context, event) => {
        const typedEvent = event as UpdateAllSettingsEvent
        console.log("Updating all settings:", typedEvent.settings)

        // Возвращаем обновленный контекст
        return {
          ...context,
          ...typedEvent.settings,
        }
      }),

      // Метод для обновления размера превью
      updatePreviewSize: assign((context, event) => {
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
      updateActiveTab: assign((context, event) => {
        const typedEvent = event as UpdateActiveTabEvent
        console.log("Updating active tab:", typedEvent.tab)

        return {
          ...context,
          activeTab: typedEvent.tab,
        }
      }),

      // Метод для обновления режима макета
      updateLayout: assign((context, event) => {
        const typedEvent = event as UpdateLayoutEvent
        console.log("Updating layout mode:", typedEvent.layoutMode)

        return {
          ...context,
          layoutMode: typedEvent.layoutMode,
        }
      }),

      updatePlayerScreenshotsPath: assign((context, event) => {
        const typedEvent = event as UpdatePlayerScreenshotsPathEvent
        console.log("Updating player screenshots path:", typedEvent.path)

        return {
          ...context,
          playerScreenshotsPath: typedEvent.path,
        }
      }),

      updateScreenshotsPath: assign((context, event) => {
        const typedEvent = event as UpdateScreenshotsPathEvent
        console.log("Updating screenshots path:", typedEvent.path)

        return {
          ...context,
          screenshotsPath: typedEvent.path,
        }
      }),

      updateOpenAiApiKey: assign((context, event) => {
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

      updateClaudeApiKey: assign((context, event) => {
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
    },
  },
)
