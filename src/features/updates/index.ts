/**
 * Updates Feature - система автоматических обновлений приложения
 * Экспорт всех компонентов, хуков и сервисов для работы с обновлениями
 */

// Сервисы
export { UpdateService, updateService } from './services/update-service'
export { updateMachine } from './services/update-machine'

// Хуки
export { useUpdateManager, useUpdateAvailability } from './hooks/use-update-manager'

// Компоненты
export { UpdateNotification } from './components/update-notification'
export { UpdateManager, InlineUpdateManager } from './components/update-manager'
export { 
  UpdateStatusIndicator, 
  UpdateIconIndicator, 
  UpdateTextIndicator 
} from './components/update-status-indicator'
export { UpdateSettings, CompactUpdateSettings } from './components/update-settings'

// Типы
export type {
  UpdateInfo,
  UpdateCheckResult,
  UpdateProgress,
  UpdateStatus,
  UpdateEventPayload,
} from './services/update-service'

export type {
  UpdateMachineEvent,
  UpdateMachineContext,
  UpdateMachine,
  UpdateMachineActor,
} from './services/update-machine'

export type {
  UseUpdateManagerReturn,
} from './hooks/use-update-manager'