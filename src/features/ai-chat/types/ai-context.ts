/**
 * Типы для AI контекста Timeline Studio
 * 
 * Определяет структуры данных для передачи контекста между
 * различными компонентами приложения и AI агентом
 */

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import { ResourceType } from "@/features/resources/types"
import { StyleTemplate } from "@/features/style-templates/types/style-template"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { TimelineClip, TimelineProject, TimelineSection, TimelineTrack } from "@/features/timeline/types"
import { Transition } from "@/features/transitions/types/transitions"

// ============================================================================
// CORE AI CONTEXT TYPES
// ============================================================================

/**
 * Полный контекст Timeline Studio для AI агента
 */
export interface TimelineStudioContext {
  // Состояние ресурсов
  resources: ResourcesContext
  
  // Состояние медиа браузера
  browser: BrowserContext
  
  // Состояние видеоплеера
  player: PlayerContext
  
  // Состояние таймлайна
  timeline: TimelineContext
  
  // Пользовательские предпочтения
  userPreferences: UserPreferencesContext
}

/**
 * Контекст ресурсов проекта
 */
export interface ResourcesContext {
  // Доступные ресурсы в пуле
  availableResources: {
    media: MediaFile[]
    effects: VideoEffect[]
    filters: VideoFilter[]
    transitions: Transition[]
    templates: MediaTemplate[]
    styleTemplates: StyleTemplate[]
    music: MediaFile[]
  }
  
  // Статистика ресурсов
  stats: {
    totalMedia: number
    totalDuration: number
    totalSize: number
    resourceTypes: Record<ResourceType, number>
  }
  
  // Последние добавленные ресурсы
  recentlyAdded: Array<{
    resourceId: string
    resourceType: ResourceType
    addedAt: Date
    reason?: string
  }>
}

/**
 * Контекст медиа браузера
 */
export interface BrowserContext {
  // Активная вкладка
  activeTab: string
  
  // Доступные медиафайлы в браузере
  availableMedia: MediaFile[]
  
  // Текущие фильтры и поиск
  currentFilters: {
    searchQuery: string
    filterType: string
    sortBy: string
    sortOrder: "asc" | "desc"
    dateRange?: {
      start: Date
      end: Date
    }
  }
  
  // Избранные файлы
  favoriteFiles: string[]
}

/**
 * Контекст видеоплеера
 */
export interface PlayerContext {
  // Текущее видео
  currentVideo: MediaFile | null
  
  // Состояние воспроизведения
  playbackState: {
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
  }
  
  // Применяемые эффекты в превью
  previewEffects: Array<{
    effectId: string
    params: Record<string, any>
  }>
  
  // Применяемые фильтры в превью
  previewFilters: Array<{
    filterId: string
    params: Record<string, any>
  }>
  
  // Применяемый шаблон
  previewTemplate: {
    templateId: string
    files: MediaFile[]
  } | null
}

/**
 * Контекст таймлайна
 */
export interface TimelineContext {
  // Текущий проект
  currentProject: TimelineProject | null
  
  // Статистика проекта
  projectStats: {
    totalDuration: number
    totalClips: number
    totalTracks: number
    totalSections: number
    usedResources: Record<ResourceType, number>
  }
  
  // Последние изменения
  recentChanges: Array<{
    action: string
    timestamp: Date
    description: string
    affectedElements: string[]
  }>
  
  // Проблемы и предупреждения
  issues: Array<{
    type: "warning" | "error" | "suggestion"
    message: string
    elementId?: string
    severity: "low" | "medium" | "high"
  }>
}

/**
 * Пользовательские предпочтения для AI
 */
export interface UserPreferencesContext {
  // Предпочтительные настройки проекта
  defaultProjectSettings: {
    resolution: { width: number; height: number }
    fps: number
    aspectRatio: string
  }
  
  // Предпочтения по типам контента
  contentPreferences: {
    preferredTransitionDuration: number
    autoApplyColorCorrection: boolean
    autoBalanceAudio: boolean
    preferredTrackTypes: string[]
  }
  
  // История команд AI
  aiCommandHistory: Array<{
    command: string
    timestamp: Date
    success: boolean
    result?: string
  }>
}

// ============================================================================
// AI TOOL INPUT/OUTPUT TYPES
// ============================================================================

/**
 * Базовый интерфейс для результата выполнения AI инструмента
 */
export interface AIToolResult {
  success: boolean
  message: string
  data?: any
  errors?: string[]
  warnings?: string[]
}

/**
 * Критерии для анализа медиафайлов
 */
export interface MediaAnalysisCriteria {
  dateRange?: {
    start: Date
    end: Date
  }
  fileTypes?: ("video" | "audio" | "image")[]
  minDuration?: number
  maxDuration?: number
  minSize?: number
  maxSize?: number
  includeFavorites?: boolean
  searchQuery?: string
}

/**
 * Критерии для добавления ресурсов
 */
export interface ResourceAdditionCriteria {
  resourceType: ResourceType
  selectionMethod: "all" | "filtered" | "manual" | "smart"
  filters?: MediaAnalysisCriteria
  maxCount?: number
  reason: string
  autoApply?: boolean
}

/**
 * Настройки для создания проекта
 */
export interface ProjectCreationSettings {
  name: string
  description?: string
  settings: {
    resolution: { width: number; height: number }
    fps: number
    aspectRatio: string
    duration?: number
  }
  autoCreateSections?: boolean
  sectionStrategy?: "by-date" | "by-location" | "by-duration" | "manual"
}

/**
 * Стратегии размещения клипов
 */
export interface ClipPlacementStrategy {
  method: "chronological" | "manual" | "smart-gaps" | "overlay" | "story-driven"
  trackAssignment: "auto" | "by-type" | "manual"
  gapHandling: "remove" | "keep" | "fill-with-transitions"
  overlapHandling: "prevent" | "allow" | "auto-split"
  timing: {
    defaultClipDuration?: number
    transitionDuration?: number
    paddingBetweenClips?: number
  }
}

/**
 * Типы автоматических улучшений
 */
export type EnhancementType = 
  | "transitions"
  | "color-correction" 
  | "audio-balance"
  | "stabilization"
  | "noise-reduction"
  | "auto-cut"
  | "scene-detection"
  | "music-sync"

/**
 * Настройки для применения улучшений
 */
export interface EnhancementSettings {
  types: EnhancementType[]
  intensity: "subtle" | "moderate" | "strong"
  applyToExisting: boolean
  previewFirst: boolean
  targetElements?: {
    sectionIds?: string[]
    trackIds?: string[]
    clipIds?: string[]
  }
}

/**
 * Результат анализа контента для создания истории
 */
export interface ContentStoryAnalysis {
  suggestedStructure: {
    intro: {
      duration: number
      suggestedClips: string[]
      suggestedEffects: string[]
    }
    mainContent: Array<{
      title: string
      duration: number
      suggestedClips: string[]
      keyMoments: number[]
    }>
    outro: {
      duration: number
      suggestedClips: string[]
      suggestedEffects: string[]
    }
  }
  
  suggestedMusic: {
    mood: string
    tempo: "slow" | "medium" | "fast"
    genreRecommendations: string[]
  }
  
  detectedThemes: string[]
  keyMoments: Array<{
    timestamp: number
    importance: "low" | "medium" | "high"
    description: string
    suggestedTreatment: string
  }>
}

// ============================================================================
// AI COMMAND TYPES
// ============================================================================

/**
 * Типы AI команд
 */
export type AICommandType =
  | "analyze-media"
  | "add-resources" 
  | "create-timeline"
  | "place-clips"
  | "apply-enhancements"
  | "suggest-improvements"
  | "export-project"

/**
 * Базовый интерфейс для AI команды
 */
export interface AICommand {
  type: AICommandType
  params: Record<string, any>
  context: Partial<TimelineStudioContext>
  userPrompt: string
  timestamp: Date
}

/**
 * Результат выполнения AI команды
 */
export interface AICommandResult {
  command: AICommand
  success: boolean
  result: AIToolResult
  executionTime: number
  changedElements: string[]
  nextSuggestedActions: string[]
}