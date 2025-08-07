/**
 * Типы для медиа шаблонов
 */

export interface MediaTemplate {
  id: string
  name: string
  category: string
  duration: number
  tracks: TemplateTrack[]
}

export interface TemplateTrack {
  id: string
  type: "video" | "audio" | "image" | "subtitle"
  clips: TemplateClip[]
}

export interface TemplateClip {
  id: string
  startTime: number
  duration: number
  resourcePath?: string
  effects?: any[]
  filters?: any[]
}

// Реэкспорт из основного файла
export * from "./templates"
