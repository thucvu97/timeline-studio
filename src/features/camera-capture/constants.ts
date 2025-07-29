import { RecordingFormat, RecordingQuality } from "./types"

/**
 * Константы для модуля camera-capture
 */

/**
 * Поддерживаемые форматы записи видео
 */
export const SUPPORTED_VIDEO_FORMATS: RecordingFormat[] = [
  {
    mimeType: "video/webm;codecs=vp8,opus",
    extension: "webm", 
    label: "WebM (VP8/Opus)",
    isSupported: typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus"),
  },
  {
    mimeType: "video/webm;codecs=vp9,opus",
    extension: "webm",
    label: "WebM (VP9/Opus)",
    isSupported: typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus"),
  },
  {
    mimeType: "video/webm",
    extension: "webm",
    label: "WebM",
    isSupported: typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm"),
  },
  {
    mimeType: "video/mp4;codecs=h264",
    extension: "mp4",
    label: "MP4 (H.264)",
    isSupported: typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/mp4;codecs=h264"),
  },
  {
    mimeType: "video/mp4",
    extension: "mp4", 
    label: "MP4",
    isSupported: typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/mp4"),
  },
]

/**
 * Настройки качества записи
 */
export const RECORDING_QUALITY_PRESETS: Record<string, RecordingQuality> = {
  low: {
    videoBitsPerSecond: 2500000, // 2.5 Mbps
    audioBitsPerSecond: 128000,  // 128 kbps
  },
  medium: {
    videoBitsPerSecond: 5000000, // 5 Mbps
    audioBitsPerSecond: 192000,  // 192 kbps
  },
  high: {
    videoBitsPerSecond: 8000000, // 8 Mbps
    audioBitsPerSecond: 256000,  // 256 kbps
  },
  ultraHigh: {
    videoBitsPerSecond: 15000000, // 15 Mbps
    audioBitsPerSecond: 320000,   // 320 kbps
  },
}

/**
 * Стандартные разрешения для записи камеры
 */
export const CAMERA_RESOLUTIONS = [
  { width: 640, height: 480, label: "480p (SD)" },
  { width: 1280, height: 720, label: "720p (HD)" },
  { width: 1920, height: 1080, label: "1080p (Full HD)" },
  { width: 2560, height: 1440, label: "1440p (2K)" },
  { width: 3840, height: 2160, label: "2160p (4K)" },
] as const

/**
 * Стандартные частоты кадров
 */
export const FRAME_RATES = [15, 24, 30, 60] as const

/**
 * Максимальное время записи (в миллисекундах)
 */
export const MAX_RECORDING_DURATION = 3600000 // 1 час

/**
 * Минимальное время записи (в миллисекундах) 
 */
export const MIN_RECORDING_DURATION = 1000 // 1 секунда

/**
 * Настройки обратного отсчёта (в секундах)
 */
export const COUNTDOWN_OPTIONS = [0, 3, 5, 10] as const

/**
 * Размер буфера для MediaRecorder (в килобайтах)
 */
export const MEDIA_RECORDER_BUFFER_SIZE = 1024 // 1MB

/**
 * Интервал обновления времени записи (в миллисекундах)
 */
export const RECORDING_TIME_UPDATE_INTERVAL = 100

/**
 * Стандартные настройки для записи экрана
 */
export const SCREEN_CAPTURE_DEFAULTS = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 }, 
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
} as const

/**
 * Стандартные настройки для записи камеры
 */
export const CAMERA_CAPTURE_DEFAULTS = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
} as const

/**
 * Сообщения об ошибках камеры
 */
export const CAMERA_ERROR_MESSAGES = {
  NotAllowedError: "Доступ к камере запрещён. Проверьте разрешения в браузере.",
  NotFoundError: "Камера не найдена. Подключите камеру и попробуйте снова.",
  NotReadableError: "Камера используется другим приложением.",
  OverconstrainedError: "Камера не поддерживает запрошенные настройки.",
  SecurityError: "Безопасность браузера блокирует доступ к камере.",
  AbortError: "Доступ к камере был прерван.",
  UnknownError: "Неизвестная ошибка камеры.",
} as const

/**
 * Директория для сохранения записей
 */
export const RECORDINGS_DIRECTORY = "recordings"

/**
 * Префикс для имён файлов записей
 */
export const RECORDING_FILENAME_PREFIX = "camera_recording"

/**
 * Максимальный размер файла записи (в байтах) - 2GB
 */
export const MAX_RECORDING_FILE_SIZE = 2 * 1024 * 1024 * 1024