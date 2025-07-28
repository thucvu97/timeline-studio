/**
 * Мультикамерный модуль
 * Экспорт всех публичных API
 */

// Компоненты
export { AngleViewer } from "./components/angle-viewer"
export { SyncControls } from "./components/sync-controls"
export { CameraSelector, MulticamIndicator } from "./components"

// Хуки
export { useMulticam } from "./hooks/use-multicam"
export { useMulticamShortcuts } from "./hooks/use-multicam-shortcuts"
export { useCameraSync } from "./hooks/use-camera-sync"
export type { UseMulticamReturn, MulticamAngle, MulticamState } from "./hooks/use-multicam"
export type { UseCameraSyncReturn, UseCameraSyncProps } from "./hooks/use-camera-sync"

// Сервисы
export { multicamManager } from "./services/multicam-manager"
export * from "./services/timecode-sync"

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

export type {
  TimecodeInfo,
  SyncResult
} from "./services/timecode-sync"