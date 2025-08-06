/**
 * Updates Feature - система автоматических обновлений приложения
 * Экспорт всех компонентов, хуков и сервисов для работы с обновлениями
 */

export { InlineUpdateManager, UpdateManager } from "./components/update-manager"
// Компоненты
export { UpdateNotification } from "./components/update-notification"
export { CompactUpdateSettings, UpdateSettings } from "./components/update-settings"
export {
  UpdateIconIndicator,
  UpdateStatusIndicator,
  UpdateTextIndicator,
} from "./components/update-status-indicator"
export type { UseUpdateManagerReturn } from "./hooks/use-update-manager"
// Хуки
export { useUpdateAvailability, useUpdateManager } from "./hooks/use-update-manager"
export type { UpdateMachine, UpdateMachineActor } from "./services/update-machine"
export { updateMachine } from "./services/update-machine"
// Сервисы
export { UpdateService, updateService } from "./services/update-service"
// Типы
export type {
  AutoCheckSettings,
  UpdateAvailability,
  UpdateCheckResult,
  UpdateEventPayload,
  UpdateInfo,
  UpdateMachineContext,
  UpdateMachineEvent,
  UpdateProgress,
  UpdateProgressWithPercentage,
  UpdateStatus,
} from "./types"
