/**
 * Типы для системы настроек отображения
 */

/**
 * Размеры превью для разных типов контента
 */
export type PreviewSize = "small" | "medium" | "large" | "xlarge"

/**
 * Плотность отображения элементов
 */
export type DisplayDensity = "compact" | "comfortable" | "spacious"

/**
 * Тип макета для отображения
 */
export type LayoutType = "grid" | "list" | "masonry"

/**
 * Тип контента для настроек
 */
export type ContentType =
  | "templates"
  | "styleTemplates"
  | "media"
  | "effects"
  | "filters"
  | "transitions"
  | "subtitles"
  | "music"

/**
 * Настройки размеров превью
 */
export interface PreviewSizeSettings {
  small: number // 80px
  medium: number // 120px
  large: number // 160px
  xlarge: number // 240px
}

/**
 * Адаптивные точки останова
 */
export interface ResponsiveBreakpoints {
  mobile: number // 768px
  tablet: number // 1024px
  desktop: number // 1440px
}

/**
 * Настройки для конкретного типа контента
 */
export interface ContentSettings {
  defaultSize: PreviewSize
  layout: LayoutType
  showLabels: boolean
  showMetadata: boolean
  gridColumns: "auto" | number
  enableHover: boolean
  enableSelection: boolean
  enableDragDrop: boolean
}

/**
 * Настройки экрана и отображения
 */
export interface ScreenSettings {
  density: DisplayDensity
  responsiveBreakpoints: ResponsiveBreakpoints
  enableAnimations: boolean
  enableTransitions: boolean
  enableVirtualization: boolean
  maxItemsPerPage: number
}

/**
 * Настройки производительности
 */
export interface PerformanceSettings {
  enableLazyLoading: boolean
  enablePreviewCaching: boolean
  preloadDistance: number // количество элементов для предзагрузки
  cacheSize: number // максимальный размер кэша в MB
  enableWebWorkers: boolean
}

/**
 * Основной интерфейс настроек отображения
 */
export interface DisplaySettings {
  // Базовые размеры превью
  previewSizes: PreviewSizeSettings

  // Настройки для разных типов контента
  contentSettings: Record<ContentType, ContentSettings>

  // Настройки экрана
  screenSettings: ScreenSettings

  // Настройки производительности
  performanceSettings: PerformanceSettings

  // Версия настроек для миграции
  version: string
}

/**
 * Контекст настроек отображения
 */
export interface DisplaySettingsContext {
  settings: DisplaySettings

  // Методы для обновления настроек
  updatePreviewSize: (contentType: ContentType, size: PreviewSize) => void
  updateLayout: (contentType: ContentType, layout: LayoutType) => void
  updateDensity: (density: DisplayDensity) => void
  updateContentSettings: (contentType: ContentType, settings: Partial<ContentSettings>) => void
  updateScreenSettings: (settings: Partial<ScreenSettings>) => void
  updatePerformanceSettings: (settings: Partial<PerformanceSettings>) => void

  // Методы для получения настроек
  getContentSettings: (contentType: ContentType) => ContentSettings
  getPreviewSize: (contentType: ContentType) => number
  getGridColumns: (contentType: ContentType, containerWidth: number) => number

  // Методы для адаптивности
  getCurrentBreakpoint: () => "mobile" | "tablet" | "desktop"
  isResponsiveMode: () => boolean

  // Методы для сброса настроек
  resetContentSettings: (contentType: ContentType) => void
  resetAllSettings: () => void
}

/**
 * События для машины состояний
 */
export type DisplaySettingsEvent =
  | { type: "UPDATE_PREVIEW_SIZE"; contentType: ContentType; size: PreviewSize }
  | { type: "UPDATE_LAYOUT"; contentType: ContentType; layout: LayoutType }
  | { type: "UPDATE_DENSITY"; density: DisplayDensity }
  | {
      type: "UPDATE_CONTENT_SETTINGS"
      contentType: ContentType
      settings: Partial<ContentSettings>
    }
  | { type: "UPDATE_SCREEN_SETTINGS"; settings: Partial<ScreenSettings> }
  | {
      type: "UPDATE_PERFORMANCE_SETTINGS"
      settings: Partial<PerformanceSettings>
    }
  | { type: "RESET_CONTENT_SETTINGS"; contentType: ContentType }
  | { type: "RESET_ALL_SETTINGS" }
  | { type: "LOAD_SETTINGS"; settings: DisplaySettings }
  | { type: "SAVE_SETTINGS" }

/**
 * Состояние машины настроек отображения
 */
export interface DisplaySettingsState {
  value: "idle" | "loading" | "saving" | "error"
  context: DisplaySettings
}

/**
 * Настройки по умолчанию
 */
export const DEFAULT_PREVIEW_SIZES: PreviewSizeSettings = {
  small: 80,
  medium: 120,
  large: 160,
  xlarge: 240,
}

export const DEFAULT_RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
}

export const DEFAULT_CONTENT_SETTINGS: ContentSettings = {
  defaultSize: "medium",
  layout: "grid",
  showLabels: true,
  showMetadata: false,
  gridColumns: "auto",
  enableHover: true,
  enableSelection: true,
  enableDragDrop: false,
}

export const DEFAULT_SCREEN_SETTINGS: ScreenSettings = {
  density: "comfortable",
  responsiveBreakpoints: DEFAULT_RESPONSIVE_BREAKPOINTS,
  enableAnimations: true,
  enableTransitions: true,
  enableVirtualization: true,
  maxItemsPerPage: 100,
}

export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  enableLazyLoading: true,
  enablePreviewCaching: true,
  preloadDistance: 5,
  cacheSize: 50, // 50MB
  enableWebWorkers: false,
}

/**
 * Специфичные настройки для разных типов контента
 */
export const CONTENT_TYPE_OVERRIDES: Partial<Record<ContentType, Partial<ContentSettings>>> = {
  templates: {
    defaultSize: "large",
    showLabels: true,
    showMetadata: true,
    gridColumns: "auto",
  },
  styleTemplates: {
    defaultSize: "medium",
    showLabels: true,
    showMetadata: false,
    gridColumns: "auto",
  },
  media: {
    defaultSize: "medium",
    layout: "grid",
    showLabels: false,
    showMetadata: true,
    enableDragDrop: true,
  },
  music: {
    defaultSize: "small",
    layout: "list",
    showLabels: true,
    showMetadata: true,
    gridColumns: 1,
  },
  effects: {
    defaultSize: "medium",
    showLabels: true,
    showMetadata: false,
  },
  filters: {
    defaultSize: "medium",
    showLabels: true,
    showMetadata: false,
  },
  transitions: {
    defaultSize: "medium",
    showLabels: true,
    showMetadata: false,
  },
  subtitles: {
    defaultSize: "large",
    showLabels: true,
    showMetadata: true,
  },
}
