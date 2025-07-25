/**
 * Типы для стилистических шаблонов
 */

export interface StyleTemplate {
  id: string
  name: {
    ru: string
    en: string
  }
  category: "intro" | "outro" | "lower-third" | "title" | "transition" | "overlay"
  style: "modern" | "vintage" | "minimal" | "corporate" | "creative" | "cinematic"
  aspectRatio: "16:9" | "9:16" | "1:1"
  duration: number // Длительность в секундах
  hasText: boolean // Есть ли текстовые элементы
  hasAnimation: boolean // Есть ли анимация
  thumbnail?: string // Превью изображение
  previewVideo?: string // Превью видео
  tags?: {
    ru: string[]
    en: string[]
  }
  elements: TemplateElement[]
  description?: {
    ru: string
    en: string
  }
}

export interface TemplateElement {
  id: string
  type: "text" | "shape" | "image" | "video" | "animation" | "particle"
  name: {
    ru: string
    en: string
  }
  position: {
    x: number // В процентах от 0 до 100
    y: number // В процентах от 0 до 100
  }
  size: {
    width: number // В процентах от 0 до 100
    height: number // В процентах от 0 до 100
  }
  timing: {
    start: number // Время начала в секундах
    end: number // Время окончания в секундах
  }
  properties: ElementProperties
  animations?: Animation[]
}

export interface ElementProperties {
  // Общие свойства
  opacity?: number
  rotation?: number
  scale?: number

  // Для текста
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  textAlign?: "left" | "center" | "right"
  fontWeight?: "normal" | "bold" | "light"

  // Для фигур
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number

  // Для изображений/видео
  src?: string
  objectFit?: "contain" | "cover" | "fill"

  // Дополнительные свойства
  [key: string]: any
}

export interface Animation {
  id: string
  type: "fadeIn" | "fadeOut" | "slideIn" | "slideOut" | "scaleIn" | "scaleOut" | "bounce" | "shake"
  duration: number // Длительность анимации в секундах
  delay?: number // Задержка перед началом
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  direction?: "left" | "right" | "up" | "down"
  properties?: Record<string, any>
}

export interface StyleTemplateCategory {
  id: string
  name: {
    ru: string
    en: string
  }
  description: {
    ru: string
    en: string
  }
  icon?: string
  templates: StyleTemplate[]
}

// Типы для фильтрации и сортировки
export interface StyleTemplateFilter {
  category?: string
  style?: string
  aspectRatio?: string
  hasText?: boolean
  hasAnimation?: boolean
  duration?: {
    min?: number
    max?: number
  }
}

export type StyleTemplateSortBy = "name" | "duration" | "category" | "style" | "recent"
export type StyleTemplateSortField = "name" | "duration" | "category" | "style"
export type StyleTemplateSortOrder = "asc" | "desc"
