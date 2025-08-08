/**
 * Hook для работы с обновлениями приложения
 */

import { useCallback, useEffect, useState } from "react"
import type { UpdateStatus } from "@/features/updates/types"
import { getSystemIntegrationOrchestrator } from "../services/system-integration-orchestrator"

export function useUpdates() {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())
  const [updateState, setUpdateState] = useState(() => orchestrator.getUpdateState())

  // Подписка на изменения состояния
  useEffect(() => {
    const subscription = orchestrator.subscribeToUpdates((state) => {
      setUpdateState(state)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [orchestrator])

  // Проверка обновлений
  const checkForUpdates = useCallback(() => {
    orchestrator.checkForUpdates()
  }, [orchestrator])

  // Загрузка обновления
  const downloadUpdate = useCallback(() => {
    orchestrator.downloadUpdate()
  }, [orchestrator])

  // Установка обновления
  const installUpdate = useCallback(() => {
    orchestrator.installUpdate()
  }, [orchestrator])

  // Отклонение обновления
  const dismissUpdate = useCallback(() => {
    orchestrator.dismissUpdate()
  }, [orchestrator])

  // Управление автообновлением
  const enableAutoUpdate = useCallback(
    (intervalMinutes = 60) => {
      orchestrator.enableAutoUpdate(intervalMinutes)
    },
    [orchestrator],
  )

  const disableAutoUpdate = useCallback(() => {
    orchestrator.disableAutoUpdate()
  }, [orchestrator])

  // Извлечение данных из состояния
  const context = updateState.context
  const status = updateState.value as UpdateStatus

  return {
    // Состояние
    status,
    currentVersion: context.currentVersion,
    availableUpdate: context.availableUpdate,
    error: context.error,
    progress: context.progress,
    autoCheckEnabled: context.autoCheckEnabled,
    autoCheckInterval: context.autoCheckInterval,
    lastCheckTime: context.lastCheckTime,

    // Действия
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissUpdate,
    enableAutoUpdate,
    disableAutoUpdate,

    // Удобные геттеры
    hasUpdate: !!context.availableUpdate,
    isChecking: status === "checking",
    isDownloading: status === "downloading",
    isInstalling: status === "installing",
    isReady: status === "readyToInstall",
    hasError: status === "error",
  }
}
