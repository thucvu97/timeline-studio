/**
 * Timeline Architecture - Архитектура данных Timeline
 *
 * Принципы:
 * 1. Четкая иерархия: Project -> Section -> Track -> Clip
 * 2. Разделение бизнес-логики и UI состояния
 * 3. Единообразие типов и идентификаторов
 * 4. Поддержка всех видов контента (видео, аудио, изображения, титры)
 * 5. Интеграция с системой ресурсов (эффекты, фильтры, переходы)
 */

import { MediaFile } from "@/features/media/types/media"

// Временные типы для ресурсов (будут заменены на реальные)
interface Effect {
  id: string
  name: string
  [key: string]: any
}

interface Filter {
  id: string
  name: string
  [key: string]: any
}

interface Transition {
  id: string
  name: string
  [key: string]: any
}

// ============================================================================
// CORE TIMELINE TYPES
// ============================================================================

/**
 * Проект Timeline - корневой объект
 */
export interface TimelineProject {
  id: string
  name: string
  description?: string

  // Временные параметры
  duration: number // Общая длительность проекта в секундах
  fps: number // Частота кадров проекта
  sampleRate: number // Частота дискретизации аудио

  // Структура проекта
  sections: TimelineSection[]
  globalTracks: TimelineTrack[] // Глобальные треки (музыка, титры)

  // Настройки
  settings: ProjectSettings

  // Метаданные
  createdAt: Date
  updatedAt: Date
  version: string
}

/**
 * Секция Timeline - группа треков по времени/дате
 */
export interface TimelineSection {
  id: string
  index: number
  name: string

  // Временные границы
  startTime: number // Начало секции в проекте (секунды)
  endTime: number // Конец секции в проекте (секунды)
  duration: number // Длительность секции

  // Реальное время (для синхронизации с датами съемки)
  realStartTime?: Date
  realEndTime?: Date

  // Треки в секции
  tracks: TimelineTrack[]

  // Настройки секции
  isCollapsed: boolean
  color?: string
  tags?: string[]
}

/**
 * Трек Timeline - контейнер для клипов одного типа
 */
export interface TimelineTrack {
  id: string
  name: string
  type: TrackType

  // Иерархия
  sectionId?: string // null для глобальных треков
  parentTrackId?: string // Для вложенных треков
  order: number // Порядок отображения

  // Клипы на треке
  clips: TimelineClip[]

  // Настройки трека
  isLocked: boolean
  isMuted: boolean
  isHidden: boolean
  isSolo: boolean

  // Аудио настройки
  volume: number // 0-1
  pan: number // -1 (левый) до 1 (правый)

  // Визуальные настройки
  height: number // Высота трека в пикселях
  color?: string

  // Ресурсы трека (применяются ко всем клипам)
  trackEffects: AppliedEffect[]
  trackFilters: AppliedFilter[]
}

/**
 * Клип Timeline - отдельный медиа-элемент на треке
 */
export interface TimelineClip {
  id: string
  name: string

  // Связь с медиафайлом
  mediaId: string
  mediaFile?: MediaFile // Опциональная ссылка для удобства

  // Позиция на треке
  trackId: string
  startTime: number // Начало клипа на треке (секунды)
  duration: number // Длительность клипа

  // Обрезка исходного медиа
  mediaStartTime: number // Начало в исходном файле
  mediaEndTime: number // Конец в исходном файле

  // Настройки клипа
  volume: number // 0-1
  speed: number // Скорость воспроизведения (1.0 = нормальная)
  isReversed: boolean

  // Визуальные настройки (для видео)
  position?: ClipPosition
  opacity: number // 0-1

  // Ресурсы клипа
  effects: AppliedEffect[]
  filters: AppliedFilter[]
  transitions: AppliedTransition[]

  // Состояние
  isSelected: boolean
  isLocked: boolean

  // Метаданные
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export type TrackType =
  | "video"
  | "audio"
  | "image"
  | "title"
  | "subtitle"
  | "music"
  | "voiceover"
  | "sfx" // Sound effects
  | "ambient" // Ambient audio

export interface ClipPosition {
  x: number // 0-1 (относительно размера кадра)
  y: number // 0-1
  width: number // 0-1
  height: number // 0-1
  rotation: number // Градусы
  scaleX: number // Масштаб по X
  scaleY: number // Масштаб по Y
}

export interface ProjectSettings {
  // Видео настройки
  resolution: {
    width: number
    height: number
  }
  fps: number
  aspectRatio: string

  // Аудио настройки
  sampleRate: number
  channels: number
  bitDepth: number

  // Timeline настройки
  timeFormat: "timecode" | "seconds" | "frames"
  snapToGrid: boolean
  gridSize: number // В секундах

  // Автосохранение
  autoSave: boolean
  autoSaveInterval: number // В секундах
}

// ============================================================================
// APPLIED RESOURCES TYPES
// ============================================================================

export interface AppliedEffect {
  id: string
  effectId: string // ID из системы эффектов
  effect?: Effect // Опциональная ссылка

  // Временные параметры
  startTime?: number // Относительно клипа/трека
  duration?: number

  // Параметры эффекта
  params: Record<string, any>

  // Состояние
  isEnabled: boolean
  order: number
}

export interface AppliedFilter {
  id: string
  filterId: string
  filter?: Filter

  startTime?: number
  duration?: number

  params: Record<string, any>
  isEnabled: boolean
  order: number
}

export interface AppliedTransition {
  id: string
  transitionId: string
  transition?: Transition

  // Переходы всегда имеют длительность
  duration: number

  // Тип перехода
  type: "in" | "out" | "cross" // Вход, выход, кроссфейд

  params: Record<string, any>
  isEnabled: boolean
}

// ============================================================================
// UI STATE TYPES (отдельно от бизнес-логики)
// ============================================================================

export interface TimelineUIState {
  // Временная шкала
  currentTime: number
  playheadPosition: number

  // Масштаб и прокрутка
  timeScale: number // Пикселей на секунду
  scrollPosition: {
    x: number // Горизонтальная прокрутка
    y: number // Вертикальная прокрутка
  }

  // Выделение
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]

  // Режимы
  editMode: "select" | "cut" | "trim" | "move"
  snapMode: "none" | "grid" | "clips" | "markers"

  // Видимость
  visibleTrackTypes: TrackType[]
  collapsedSectionIds: string[]

  // Буфер обмена
  clipboard: {
    clips: TimelineClip[]
    tracks: TimelineTrack[]
  }

  // История
  history: TimelineHistoryEntry[]
  historyIndex: number
  maxHistorySize: number
}

export interface TimelineHistoryEntry {
  id: string
  action: string
  timestamp: Date
  data: any // Сериализованное состояние
  description: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TimelineMarker {
  id: string
  time: number
  name: string
  color?: string
  type: "chapter" | "beat" | "sync" | "custom"
}

export interface TimelineKeyframe {
  id: string
  time: number
  property: string
  value: any
  interpolation: "linear" | "ease" | "ease-in" | "ease-out" | "bezier"
}
