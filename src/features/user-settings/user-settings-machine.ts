/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { assign, createMachine } from "xstate"

export const PREVIEW_SIZES = [
  60, 80, 100, 125, 150, 200, 250, 300, 400,
] as const
export const DEFAULT_SIZE = 100
export const MIN_SIZE = 60

export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
  TEMPLATES: "timeline-templates-preview-size",
  ACTIVE_TAB: "browser-active-tab",
  LAYOUT: "app-layout-mode",
  VOLUME: "player-volume",
  SCREENSHOTS_PATH: "screenshots-save-path",
  PREVIEW_CLICK_BEHAVIOR: "preview-click-behavior",
  AI_API_KEY: "ai-api-key",
} as const

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
export type StorageKey = keyof typeof STORAGE_KEYS

export interface UserSettingsContext {
  previewSizes: Record<"MEDIA" | "TRANSITIONS" | "TEMPLATES", PreviewSize>
  activeTab: BrowserTab
  layoutMode: LayoutMode
  screenshotsPath: string
  aiApiKey: string
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
  aiApiKey: "",
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
  aiApiKey: string
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
interface UpdateAiApiKeyEvent {
  type: "UPDATE_AI_API_KEY"
  apiKey: string
}

interface UpdateAllSettingsEvent {
  type: "UPDATE_ALL_SETTINGS"
  settings: Partial<UserSettingsContext>
}

export type UserSettingsEvent =
  | LoadUserSettingsEvent
  | UserSettingsLoadedEvent
  | UpdatePreviewSizeEvent
  | UpdateActiveTabEvent
  | UpdateLayoutEvent
  | UpdateScreenshotsPathEvent
  | UpdateAiApiKeyEvent
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
        },
      },
    },
  },
  {
    actions: {
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
        screenshotsPath: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.screenshotsPath ?? "public/screenshots"
        },
        aiApiKey: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.aiApiKey ?? ""
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
    },
  },
)
