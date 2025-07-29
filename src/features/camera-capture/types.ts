/**
 * Общие типы для модуля camera-capture
 */

/**
 * Интерфейс для описания устройства захвата (камера или микрофон)
 */
export interface CaptureDevice {
  deviceId: string
  label: string
}

/**
 * Настройки для записи видео
 */
export interface RecordingConstraints {
  video: {
    deviceId?: { exact: string }
    width?: { ideal: number }
    height?: { ideal: number }
    frameRate?: { ideal: number }
  }
  audio?:
    | {
        deviceId?: { exact: string }
        echoCancellation?: boolean
        noiseSuppression?: boolean
        autoGainControl?: boolean
      }
    | false
}

/**
 * Настройки для записи экрана
 */
export interface ScreenCaptureConstraints {
  video: {
    width?: { ideal: number }
    height?: { ideal: number }
    frameRate?: { ideal: number }
  }
  audio?: boolean
  preferCurrentTab?: boolean
}

/**
 * Статус разрешения на доступ к камере/микрофону
 */
export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown"

/**
 * Состояние записи
 */
export type RecordingState = "idle" | "countdown" | "recording" | "stopping"

/**
 * Режим захвата
 */
export type CaptureMode = "camera" | "screen"

/**
 * Поддерживаемые форматы записи
 */
export interface RecordingFormat {
  mimeType: string
  extension: string
  label: string
  isSupported: boolean
}

/**
 * Настройки качества записи
 */
export interface RecordingQuality {
  videoBitsPerSecond?: number
  audioBitsPerSecond?: number
}

/**
 * Возможности устройства
 */
export interface DeviceCapabilities {
  width?: {
    min: number
    max: number
  }
  height?: {
    min: number
    max: number
  }
  frameRate?: {
    min: number
    max: number
  }
}

/**
 * Ошибки камеры
 */
export type CameraError =
  | "NotAllowedError"
  | "NotFoundError"
  | "NotReadableError"
  | "OverconstrainedError"
  | "SecurityError"
  | "AbortError"
  | "UnknownError"

/**
 * Информация об ошибке камеры
 */
export interface CameraErrorInfo {
  type: CameraError
  message: string
  originalError?: Error
}
