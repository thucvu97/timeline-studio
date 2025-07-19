/**
 * Типы для функции Split Edit
 */

export interface SplitEditConfig {
  /** Включены ли split edits */
  enabled: boolean
  /** Активные split edits */
  activeEdits: SplitEdit[]
  /** Позиция для предварительного просмотра */
  previewPosition?: number
  /** Тип инструмента */
  tool: "razor" | "select" | "slip" | "slide"
}

export interface SplitEdit {
  /** Уникальный ID split edit */
  id: string
  /** ID видео клипа */
  videoClipId: string
  /** ID аудио клипа */
  audioClipId: string
  /** Позиция split */
  position: number
  /** Тип split edit */
  type: "L-cut" | "J-cut" | "split-at-playhead"
  /** Создан ли split edit */
  isActive: boolean
  /** Время создания */
  createdAt: Date
  /** Время обновления */
  updatedAt: Date
}

export interface SplitEditOperation {
  /** Тип операции */
  type: "create" | "remove" | "adjust"
  /** ID клипа */
  clipId: string
  /** Позиция для split */
  position: number
  /** Тип split edit */
  splitType: "L-cut" | "J-cut" | "split-at-playhead"
  /** Дополнительные параметры */
  options?: {
    /** Отступ для L-cut/J-cut */
    offset?: number
    /** Синхронизировать с другими треками */
    syncTracks?: boolean
    /** Использовать магнитное притяжение */
    magneticSnap?: boolean
  }
}

export interface SplitEditVisual {
  /** Показать предварительный просмотр */
  showPreview: boolean
  /** Позиция предварительного просмотра */
  previewPosition: number
  /** Тип операции */
  operationType: "L-cut" | "J-cut" | "split-at-playhead"
  /** Цвет индикатора */
  indicatorColor: string
  /** Прозрачность индикатора */
  indicatorOpacity: number
}

export interface SplitEditToolSettings {
  /** Магнитное притяжение */
  magneticSnap: boolean
  /** Дистанция магнитного притяжения */
  snapDistance: number
  /** Автоматическое выравнивание */
  autoAlign: boolean
  /** Показать направляющие */
  showGuides: boolean
  /** Синхронизировать треки */
  syncTracks: boolean
  /** Режим split edit */
  mode: "normal" | "ripple" | "roll"
}

/**
 * Создает новый split edit
 */
export function createSplitEdit(
  videoClipId: string,
  audioClipId: string,
  position: number,
  type: "L-cut" | "J-cut" | "split-at-playhead",
): SplitEdit {
  return {
    id: `split-edit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    videoClipId,
    audioClipId,
    position,
    type,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Создает настройки split edit по умолчанию
 */
export function createDefaultSplitEditSettings(): SplitEditToolSettings {
  return {
    magneticSnap: true,
    snapDistance: 10,
    autoAlign: true,
    showGuides: true,
    syncTracks: true,
    mode: "normal",
  }
}

/**
 * Создает конфигурацию split edit по умолчанию
 */
export function createDefaultSplitEditConfig(): SplitEditConfig {
  return {
    enabled: false,
    activeEdits: [],
    previewPosition: undefined,
    tool: "razor",
  }
}

/**
 * Проверяет, может ли быть выполнен split edit
 */
export function canPerformSplitEdit(videoClipId: string, audioClipId: string, position: number, clips: any[]): boolean {
  // Проверяем, что клипы существуют
  const videoClip = clips.find((c) => c.id === videoClipId)
  const audioClip = clips.find((c) => c.id === audioClipId)

  if (!videoClip || !audioClip) return false

  // Проверяем, что позиция в пределах клипов
  const videoStart = videoClip.startTime
  const videoEnd = videoClip.startTime + videoClip.duration
  const audioStart = audioClip.startTime
  const audioEnd = audioClip.startTime + audioClip.duration

  return position >= videoStart && position <= videoEnd && position >= audioStart && position <= audioEnd
}

/**
 * Вычисляет параметры для L-cut
 */
export function calculateLCutParams(
  _videoClip: any,
  _audioClip: any,
  position: number,
): { newVideoStart: number; newAudioEnd: number } {
  return {
    newVideoStart: position,
    newAudioEnd: position,
  }
}

/**
 * Вычисляет параметры для J-cut
 */
export function calculateJCutParams(
  _videoClip: any,
  _audioClip: any,
  position: number,
): { newVideoEnd: number; newAudioStart: number } {
  return {
    newVideoEnd: position,
    newAudioStart: position,
  }
}

/**
 * Получает все split edits для клипа
 */
export function getSplitEditsForClip(clipId: string, splitEdits: SplitEdit[]): SplitEdit[] {
  return splitEdits.filter((edit) => edit.videoClipId === clipId || edit.audioClipId === clipId)
}

/**
 * Удаляет split edit
 */
export function removeSplitEdit(splitEditId: string, splitEdits: SplitEdit[]): SplitEdit[] {
  return splitEdits.filter((edit) => edit.id !== splitEditId)
}

/**
 * Обновляет split edit
 */
export function updateSplitEdit(
  splitEditId: string,
  updates: Partial<SplitEdit>,
  splitEdits: SplitEdit[],
): SplitEdit[] {
  return splitEdits.map((edit) => (edit.id === splitEditId ? { ...edit, ...updates, updatedAt: new Date() } : edit))
}
