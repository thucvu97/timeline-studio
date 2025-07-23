/**
 * Project Settings Provider V2
 *
 * Новая версия с синхронизацией через backend
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { ProjectState } from "@/types/generated/tauri-bindings"

import { DEFAULT_PROJECT_SETTINGS, ProjectSettings } from "../types/project"

interface ProjectSettingsContextTypeV2 {
  // Настройки проекта (синхронизированы с backend)
  settings: ProjectSettings

  // Состояние
  isLoading: boolean
  error: string | null

  // Действия (backend команды)
  updateSettings: (settings: Partial<ProjectSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

const ProjectSettingsContextV2 = createContext<ProjectSettingsContextTypeV2 | undefined>(undefined)

interface ProjectSettingsProviderV2Props {
  children: React.ReactNode
}

export function ProjectSettingsProviderV2({ children }: ProjectSettingsProviderV2Props) {
  const [backendSync] = useState(() => getBackendSync())
  const [backendState, setBackendState] = useState<ProjectState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Подписка на backend состояние
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBackendState(state)
      setError(null)
    })

    return unsubscribe
  }, [backendSync])

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: any) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        console.error("Project settings command failed:", err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Действия
  const updateSettings = useCallback(
    async (_newSettings: Partial<ProjectSettings>) => {
      // Пока backend не имеет команды для обновления настроек проекта,
      // используем общую команду обновления проекта
      console.warn("Project settings update not yet implemented in backend")

      // В будущем это будет:
      // await executeCommand({
      //   type: 'UpdateProjectSettings',
      //   params: { settings: newSettings }
      // })
    },
    [executeCommand],
  )

  const resetSettings = useCallback(async () => {
    await updateSettings(DEFAULT_PROJECT_SETTINGS)
  }, [updateSettings])

  // Извлекаем настройки из backend состояния
  const settings: ProjectSettings = backendState?.project?.settings || DEFAULT_PROJECT_SETTINGS

  // Контекстное значение
  const contextValue: ProjectSettingsContextTypeV2 = {
    // Настройки
    settings,

    // Состояние
    isLoading,
    error,

    // Действия
    updateSettings,
    resetSettings,
  }

  return <ProjectSettingsContextV2.Provider value={contextValue}>{children}</ProjectSettingsContextV2.Provider>
}

export function useProjectSettingsV2(): ProjectSettingsContextTypeV2 {
  const context = useContext(ProjectSettingsContextV2)

  if (!context) {
    throw new Error("useProjectSettingsV2 must be used within ProjectSettingsProviderV2")
  }

  return context
}

// Экспорт типов
export type { ProjectSettingsContextTypeV2 }
export type { ProjectSettingsContextTypeV2 as ProjectSettingsProviderType }

// Экспорт для обратной совместимости
export { ProjectSettingsProviderV2 as ProjectSettingsProvider }
export { ProjectSettingsContextV2 as ProjectSettingsContext }
