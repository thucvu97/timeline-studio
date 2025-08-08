/**
 * Hook для работы с пользовательскими настройками
 */

import { useCallback, useEffect, useState } from "react"
import type { UserSettingsContextType } from "../machines/user-settings-machine"
import { getProjectManagementOrchestrator } from "../services/project-management-orchestrator"

export function useUserSettings() {
  const [orchestrator] = useState(() => getProjectManagementOrchestrator())
  const [settings, setSettings] = useState<UserSettingsContextType>(() => orchestrator.getUserSettings())

  // Подписка на изменения настроек
  useEffect(() => {
    const subscription = orchestrator.subscribeToUserSettings((newSettings) => {
      setSettings(newSettings)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [orchestrator])

  // Обновление отдельных настроек
  const updateLayoutMode = useCallback(
    (layoutMode: UserSettingsContextType["layoutMode"]) => {
      orchestrator.updateUserSettings({ layoutMode })
    },
    [orchestrator],
  )

  const updateActiveTab = useCallback(
    (activeTab: UserSettingsContextType["activeTab"]) => {
      orchestrator.updateUserSettings({ activeTab })
    },
    [orchestrator],
  )

  const updateOpenAiApiKey = useCallback(
    (openAiApiKey: string) => {
      orchestrator.updateUserSettings({ openAiApiKey })
    },
    [orchestrator],
  )

  const updateClaudeApiKey = useCallback(
    (claudeApiKey: string) => {
      orchestrator.updateUserSettings({ claudeApiKey })
    },
    [orchestrator],
  )

  const updateGpuAcceleration = useCallback(
    (gpuAccelerationEnabled: boolean) => {
      orchestrator.updateUserSettings({ gpuAccelerationEnabled })
    },
    [orchestrator],
  )

  const updateAutoSave = useCallback(
    (autoSaveEnabled: boolean) => {
      orchestrator.updateUserSettings({ autoSaveEnabled })
    },
    [orchestrator],
  )

  const updateAutoSaveInterval = useCallback(
    (autoSaveInterval: number) => {
      orchestrator.updateUserSettings({ autoSaveInterval })
    },
    [orchestrator],
  )

  const updatePlayerVolume = useCallback(
    (playerVolume: number) => {
      orchestrator.updateUserSettings({ playerVolume })
    },
    [orchestrator],
  )

  const updateScreenshotsPath = useCallback(
    (screenshotsPath: string) => {
      orchestrator.updateUserSettings({ screenshotsPath })
    },
    [orchestrator],
  )

  const updatePlayerScreenshotsPath = useCallback(
    (playerScreenshotsPath: string) => {
      orchestrator.updateUserSettings({ playerScreenshotsPath })
    },
    [orchestrator],
  )

  // Пакетное обновление настроек
  const updateSettings = useCallback(
    (updates: Partial<UserSettingsContextType>) => {
      orchestrator.updateUserSettings(updates)
    },
    [orchestrator],
  )

  return {
    // Все настройки
    ...settings,

    // Методы обновления
    updateLayoutMode,
    updateActiveTab,
    updateOpenAiApiKey,
    updateClaudeApiKey,
    updateGpuAcceleration,
    updateAutoSave,
    updateAutoSaveInterval,
    updatePlayerVolume,
    updateScreenshotsPath,
    updatePlayerScreenshotsPath,
    updateSettings,

    // Удобные геттеры
    hasOpenAiApiKey: !!settings.openAiApiKey,
    hasClaudeApiKey: !!settings.claudeApiKey,
    isGpuEnabled: settings.gpuAccelerationEnabled,
    isAutoSaveOn: settings.autoSaveEnabled,
  }
}
