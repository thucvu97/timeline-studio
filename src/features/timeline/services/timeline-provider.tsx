/**
 * Timeline Provider - алиас для обратной совместимости
 *
 * Этот файл предоставляет алиас на новую модульную архитектуру
 * для старых импортов, обеспечивая обратную совместимость
 */

// Реэкспорт всех хуков
export {
  useTimelineClips,
  useTimelineEffects,
  useTimelinePlayback,
  useTimelineProject,
  useTimelineSelection,
  useTimelineTracks,
} from "./providers"
// Реэкспорт главного провайдера
export { TimelineProvider } from "./providers/timeline-provider"

// Для совместимости со старым кодом
export const TimelineContext = null // Deprecated: используйте отдельные хуки
export type TimelineContextType = any // Deprecated: используйте отдельные типы провайдеров
