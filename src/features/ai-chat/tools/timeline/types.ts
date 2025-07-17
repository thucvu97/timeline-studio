/**
 * Общие типы для Timeline AI инструментов
 */

import type { TimelineClip, TimelineProject, TimelineSection, TimelineTrack } from "@/features/timeline/types"

/**
 * Типы для функций обратного вызова в reduce операциях
 */
export type ReducerCallback<T, R> = (acc: T, curr: R) => T
export type SectionReducer = ReducerCallback<number, TimelineSection>
export type TrackReducer = ReducerCallback<number, TimelineTrack>
export type ClipReducer = ReducerCallback<number, TimelineClip>

/**
 * Типы событий таймлайна, которые могут генерировать инструменты
 */
export type TimelineToolEvent =
  | { type: "PROJECT_CREATED"; projectId: string; settings: any }
  | { type: "SECTIONS_CREATED"; sectionIds: string[]; strategy: string }
  | { type: "TRACKS_CREATED"; trackIds: string[]; configuration: any }
  | { type: "CLIPS_PLACED"; clipIds: string[]; strategy: any }
  | {
      type: "ENHANCEMENTS_APPLIED"
      enhancements: string[]
      targetElements: any
    }
  | { type: "SCENES_DETECTED"; clipId: string; scenes: any[] }
  | { type: "TIMELINE_ANALYZED"; analysis: any }

/**
 * Результат выполнения инструмента таймлайна
 */
export interface TimelineToolResult {
  success: boolean
  message: string
  data?: {
    projectId?: string
    createdElements?: string[]
    analysis?: any
    suggestions?: string[]
    modifications?: any[]
    exportData?: any
  }
  errors?: string[]
  warnings?: string[]
  nextActions?: string[]
}

/**
 * Интерфейс для доступа к состоянию Timeline
 */
export interface TimelineStateAccess {
  getCurrentProject: () => TimelineProject | null
  createProject: (project: TimelineProject) => Promise<void>
  updateProject: (updates: Partial<TimelineProject>) => Promise<void>
  createSection: (section: Omit<TimelineSection, "id">) => Promise<TimelineSection>
  createTrack: (track: Omit<TimelineTrack, "id">) => Promise<TimelineTrack>
  addClip: (clip: Omit<TimelineClip, "id">) => Promise<TimelineClip>
  getProjectStats: () => {
    totalDuration: number
    totalClips: number
    totalTracks: number
    totalSections: number
  }
  sendTimelineCommand: (command: string, params?: any) => Promise<void>
}

// Глобальная переменная для доступа к состоянию timeline
let timelineStateAccess: TimelineStateAccess | null = null

/**
 * Устанавливает доступ к состоянию timeline
 */
export function setTimelineStateAccess(access: TimelineStateAccess) {
  timelineStateAccess = access
}

/**
 * Получает доступ к состоянию timeline
 */
export function getTimelineStateAccess(): TimelineStateAccess | null {
  return timelineStateAccess
}
