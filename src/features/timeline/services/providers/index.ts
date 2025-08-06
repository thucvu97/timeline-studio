/**
 * Timeline Providers - модульная система управления состоянием Timeline
 *
 * Архитектура:
 * - TimelineProvider - главный композитный провайдер
 * - Дочерние провайдеры по функциональности
 * - Типизированные контексты и хуки
 */

export { TimelineClipsProvider } from "./timeline-clips-provider"
export { TimelineEffectsProvider } from "./timeline-effects-provider"
export { TimelinePlaybackProvider } from "./timeline-playback-provider"
// Индивидуальные провайдеры (для тестирования)
export { TimelineProjectProvider } from "./timeline-project-provider"
// Главный провайдер и все хуки
export {
  TimelineProvider,
  useTimelineClips,
  useTimelineEffects,
  useTimelinePlayback,
  useTimelineProject,
  useTimelineSelection,
  useTimelineTracks,
} from "./timeline-provider"
export { TimelineSelectionProvider } from "./timeline-selection-provider"
export { TimelineTracksProvider } from "./timeline-tracks-provider"

// Типы
export type {
  BackendIntegration,
  TimelineClipsContextType,
  TimelineEffectsContextType,
  TimelinePlaybackContextType,
  TimelineProjectContextType,
  TimelineSelectionContextType,
  TimelineTracksContextType,
} from "./types"
