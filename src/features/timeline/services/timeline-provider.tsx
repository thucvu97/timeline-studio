/**
 * Timeline Provider - алиас для обратной совместимости
 * 
 * Этот файл предоставляет алиас на новую модульную архитектуру
 * для старых импортов, обеспечивая обратную совместимость
 */

// Реэкспорт главного провайдера
export { TimelineProvider } from "./providers/timeline-provider"

// Реэкспорт всех хуков
export { 
  useTimelineProject,
  useTimelinePlayback,
  useTimelineTracks,
  useTimelineClips,
  useTimelineSelection,
  useTimelineEffects,
} from "./providers"

// Для совместимости со старым кодом
export const TimelineContext = null // Deprecated: используйте отдельные хуки
export type TimelineContextType = any // Deprecated: используйте отдельные типы провайдеров