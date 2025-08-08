/**
 * Project Management Domain Provider
 *
 * Предоставляет контекст для работы с Project Management доменом
 */

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  getProjectManagementOrchestrator,
  type ProjectManagementOrchestrator,
} from "../services/project-management-orchestrator"

interface ProjectManagementContextValue {
  orchestrator: ProjectManagementOrchestrator
}

const ProjectManagementContext = createContext<ProjectManagementContextValue | null>(null)

interface ProjectManagementProviderProps {
  children: React.ReactNode
}

export function ProjectManagementProvider({ children }: ProjectManagementProviderProps) {
  const [orchestrator] = useState(() => getProjectManagementOrchestrator())

  useEffect(() => {
    console.log("[Project Management Provider] Initialized")

    return () => {
      console.log("[Project Management Provider] Cleanup")
    }
  }, [])

  const value: ProjectManagementContextValue = {
    orchestrator,
  }

  return <ProjectManagementContext.Provider value={value}>{children}</ProjectManagementContext.Provider>
}

/**
 * Hook для доступа к Project Management контексту
 */
export function useProjectManagementContext() {
  const context = useContext(ProjectManagementContext)

  if (!context) {
    throw new Error("useProjectManagementContext must be used within ProjectManagementProvider")
  }

  return context
}
