import i18next from "i18next"
import { assign, createMachine } from "xstate"

import { DEFAULT_PROJECT_SETTINGS, ProjectSettings } from "@/types/project"

// Key for storing project settings in localStorage
const PROJECT_SETTINGS_STORAGE_KEY = "timeline-studio-project-settings"

// Function to load settings from localStorage
const loadSavedSettings = (): ProjectSettings | null => {
  if (typeof window === "undefined") return null

  try {
    const savedSettings = localStorage.getItem(PROJECT_SETTINGS_STORAGE_KEY)
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
  } catch (error) {
    console.error(
      "[projectSettingsMachine] Error loading settings from localStorage:",
      error,
    )
  }

  return null
}

// Function to save settings to localStorage
const saveSettings = (settings: ProjectSettings): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(PROJECT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error(
      "[projectSettingsMachine] Error saving settings to localStorage:",
      error,
    )
  }
}

export interface ProjectSettingsContext {
  settings: ProjectSettings
}

export interface ProjectSettingsContextEvents {
  updateSettings: (settings: ProjectSettings) => void
  resetSettings: () => void
}

const savedSettings = loadSavedSettings()

export const initialProjectContext: ProjectSettingsContext = {
  settings: savedSettings ?? DEFAULT_PROJECT_SETTINGS,
}

interface UpdateSettingsEvent {
  type: "UPDATE_SETTINGS"
  settings: Partial<ProjectSettings>
}

interface ResetSettingsEvent {
  type: "RESET_SETTINGS"
}

type ProjectSettingsEvent = UpdateSettingsEvent | ResetSettingsEvent

export const projectSettingsMachine = createMachine({
  id: "project",
  initial: "idle",
  context: initialProjectContext,
  types: {
    context: {} as ProjectSettingsContext,
    events: {} as ProjectSettingsEvent,
  },
  states: {
    idle: {
      on: {
        UPDATE_SETTINGS: {
          actions: [
            assign(({ context, event }) => {
              const newSettings = {
                ...context.settings,
                ...(event as any).settings,
              }

              // Save settings to localStorage
              saveSettings(newSettings)

              return {
                settings: newSettings,
              }
            }),
          ],
        },
        RESET_SETTINGS: {
          actions: [
            assign({
              settings: DEFAULT_PROJECT_SETTINGS,
            }),
            () => {
              // Clear saved settings from localStorage
              if (typeof window !== "undefined") {
                localStorage.removeItem(PROJECT_SETTINGS_STORAGE_KEY)
              }
            },
          ],
        },
      },
    },
  },
})
