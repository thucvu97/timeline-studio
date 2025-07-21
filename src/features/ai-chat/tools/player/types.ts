/**
 * Типы для Player AI инструментов
 */

import { MediaFile } from "@/features/media/types/media"

/**
 * Интерфейс для текущего медиа в плеере
 */
export interface CurrentMedia extends MediaFile {
  activeEffects?: string[]
  activeFilters?: string[]
  playbackPosition?: number
  type?: string
}

/**
 * Состояние плеера
 */
export interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackSpeed: number
  loop: boolean
  muted: boolean
}

/**
 * Результат выполнения Player инструмента
 */
export interface PlayerToolResult {
  success: boolean
  message: string
  data?: any
  errors?: string[]
  warnings?: string[]
}

/**
 * Параметры для анализа медиа
 */
export interface MediaAnalysisParams {
  includeMetadata: boolean
  includeQualityMetrics: boolean
  includeFormatInfo: boolean
  includeAudioInfo: boolean
  includeVideoInfo: boolean
}

/**
 * Параметры для управления воспроизведением
 */
export interface PlaybackControlParams {
  action: "play" | "pause" | "stop" | "seek" | "volume" | "speed"
  value?: number
  position?: number
}

/**
 * Параметры для применения эффектов
 */
export interface EffectApplicationParams {
  effectId: string
  parameters: Record<string, any>
  intensity?: number
  duration?: number
  startTime?: number
  endTime?: number
}

/**
 * Параметры для генерации превью
 */
export interface PreviewGenerationParams {
  frameTime?: number
  width?: number
  height?: number
  format?: "jpg" | "png" | "webp"
  quality?: number
}

/**
 * Параметры для применения превью эффектов
 */
export interface PreviewEffectsParams {
  effects: EffectApplicationParams[]
  replace?: boolean
}

/**
 * Параметры для применения превью фильтров
 */
export interface PreviewFiltersParams {
  filters: EffectApplicationParams[]
  replace?: boolean
}

/**
 * Интерфейс для доступа к состоянию плеера
 */
export interface PlayerStateAccess {
  getPlayerState: () => any
  getCurrentMedia: () => MediaFile | null
  getPlaybackStatus: () => any
  getAppliedEffects: () => any
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  applyEffect: (effect: any) => void
  removeEffect: (effectId: string) => void
  applyFilter: (filter: any) => void
  removeFilter: (filterId: string) => void
  applyTemplate: (template: any, files: MediaFile[]) => void
  clearTemplate: () => void
  setMedia: (media: MediaFile) => void
  analyzeMediaQuality: () => any
  getPlayerStats: () => any
}
