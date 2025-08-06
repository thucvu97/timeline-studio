/**
 * Timeline Providers - модульная система управления состоянием Timeline
 * 
 * Архитектура:
 * - TimelineProvider - главный композитный провайдер
 * - Дочерние провайдеры по функциональности
 * - Типизированные контексты и хуки
 */

// Главный провайдер и все хуки
export {
  TimelineProvider,
  useTimelineProject,
  useTimelinePlayback,
  useTimelineTracks,
  useTimelineClips,
  useTimelineSelection,
  useTimelineEffects,
} from "./timeline-provider"

// Индивидуальные провайдеры (для тестирования)
export { TimelineProjectProvider } from "./timeline-project-provider"
export { TimelinePlaybackProvider } from "./timeline-playback-provider"
export { TimelineTracksProvider } from "./timeline-tracks-provider"
export { TimelineClipsProvider } from "./timeline-clips-provider"
export { TimelineSelectionProvider } from "./timeline-selection-provider"
export { TimelineEffectsProvider } from "./timeline-effects-provider"

// Типы
export type {
  TimelineProjectContextType,
  TimelinePlaybackContextType,
  TimelineTracksContextType,
  TimelineClipsContextType,
  TimelineSelectionContextType,
  TimelineEffectsContextType,
  BackendIntegration,
} from "./types"