import { createContext, useContext, useMemo } from "react"

import { useMachine } from "@xstate/react"

import type { ProjectSettings } from "@/types/project"

import { projectSettingsMachine } from "./project-settings-machine"

interface ProjectProviderProps {
  children: React.ReactNode
}

interface ProjectSettingsContextType {
  settings: ProjectSettings
  updateSettings: (settings: ProjectSettings) => void
  resetSettings: () => void
}

const ProjectSettingsContext = createContext<
  ProjectSettingsContextType | undefined
>(undefined)

export function ProjectSettingsProvider({ children }: ProjectProviderProps) {
  const [state, send] = useMachine(projectSettingsMachine)

  const value = useMemo(
    () => ({
      ...state.context,
      updateSettings: (settings: ProjectSettings) =>
        send({ type: "UPDATE_SETTINGS", settings }),
      resetSettings: () => send({ type: "RESET_SETTINGS" }),
    }),
    [state.context, send],
  )

  return (
    <ProjectSettingsContext.Provider value={value}>
      {children}
    </ProjectSettingsContext.Provider>
  )
}

export function useProjectSettings(): ProjectSettingsContextType {
  const context = useContext(ProjectSettingsContext)
  if (!context) {
    throw new Error(
      "useProjectSettingsContext must be used within a ProjectProvider",
    )
  }
  return context
}
