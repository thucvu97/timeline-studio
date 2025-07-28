/**
 * Мультикамерный модуль
 * Экспорт всех публичных API
 */

// Компоненты
export { AngleViewer, CameraSelector, MulticamIndicator } from "./components"

// Хуки
export { useMulticam } from "./hooks/use-multicam"
export { useMulticamShortcuts } from "./hooks/use-multicam-shortcuts"
export type { UseMulticamReturn, MulticamAngle, MulticamState } from "./hooks/use-multicam"

// Сервисы
export { multicamManager } from "./services/multicam-manager"

// Типы
export type {
  SyncMethod,
  SyncPoint,
  MulticamConfig,
  CameraSwitchEvent,
  SyncAnalysisResult,
  MulticamDisplaySettings,
  MulticamPlaybackState,
  MulticamCommand,
} from "./types/multicam"