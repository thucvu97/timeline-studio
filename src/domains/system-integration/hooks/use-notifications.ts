/**
 * Hook для работы с системными уведомлениями
 */

import { useCallback, useEffect, useState } from "react"
import { getSystemIntegrationOrchestrator } from "../services/system-integration-orchestrator"
import type { NotificationAction, SystemNotification } from "../types"

export function useNotifications() {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => orchestrator.getNotifications())

  // Периодическое обновление списка уведомлений
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(orchestrator.getNotifications())
    }, 100) // Обновляем каждые 100ms

    return () => {
      clearInterval(interval)
    }
  }, [orchestrator])

  // Показать уведомление
  const showNotification = useCallback(
    (
      type: SystemNotification["type"],
      title: string,
      message: string,
      options?: {
        duration?: number
        actions?: NotificationAction[]
      },
    ) => {
      return orchestrator.showNotification({
        type,
        title,
        message,
        duration: options?.duration,
        actions: options?.actions,
      })
    },
    [orchestrator],
  )

  // Удобные методы для разных типов уведомлений
  const showInfo = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification("info", title, message, { duration })
    },
    [showNotification],
  )

  const showSuccess = useCallback(
    (title: string, message: string, duration = 3000) => {
      return showNotification("success", title, message, { duration })
    },
    [showNotification],
  )

  const showWarning = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification("warning", title, message, { duration })
    },
    [showNotification],
  )

  const showError = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification("error", title, message, { duration })
    },
    [showNotification],
  )

  // Закрыть уведомление
  const dismissNotification = useCallback(
    (id: string) => {
      orchestrator.dismissNotification(id)
    },
    [orchestrator],
  )

  // Очистить все уведомления
  const clearNotifications = useCallback(() => {
    orchestrator.clearNotifications()
  }, [orchestrator])

  return {
    // Состояние
    notifications,
    hasNotifications: notifications.length > 0,

    // Общие методы
    showNotification,
    dismissNotification,
    clearNotifications,

    // Удобные методы
    showInfo,
    showSuccess,
    showWarning,
    showError,
  }
}
