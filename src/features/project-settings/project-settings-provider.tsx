import { createContext, useContext, useMemo } from "react"

import { useMachine } from "@xstate/react"

import type { ProjectSettings } from "@/types/project"

import { projectMachine } from "./project-settings-machine"

interface ProjectProviderProps {
  children: React.ReactNode
}

interface ProjectContextType {
  settings: ProjectSettings
  updateSettings: (settings: ProjectSettings) => void
  resetSettings: () => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectSettingsProvider({ children }: ProjectProviderProps) {
  const [state, send] = useMachine(projectMachine)

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
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  )
}

export function useProjectSettings(): ProjectContextType {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider")
  }
  return context
}
