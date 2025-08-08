/**
 * Video Editing Domain
 *
 * Домен для управления редактированием видео
 */

// Экспорт типов машин
// Экспорт типов контекста и событий
export type { PlayerContext, PlayerEvent, PlayerMachine } from "./machines/player-machine"
// Экспорт машин
export { playerMachine } from "./machines/player-machine"
export type {
  TimelineExtendedContext,
  TimelineExtendedEvent,
  TimelineExtendedMachine,
} from "./machines/timeline-extended-machine"
export { timelineExtendedMachine } from "./machines/timeline-extended-machine"
export type { TimelineContext, TimelineEvent, TimelineMachine } from "./machines/timeline-machine"
export { timelineMachine } from "./machines/timeline-machine"
// Экспорт провайдеров
export {
  TimelineClipsProvider,
  TimelineEffectsProvider,
  TimelinePlaybackProvider,
  TimelineProjectProvider,
  TimelineProvider,
  TimelineSelectionProvider,
  TimelineTracksProvider,
  useTimelineClips,
  useTimelineEffects,
  useTimelinePlayback,
  useTimelineProject,
  useTimelineSelection,
  useTimelineTracks,
} from "./providers/timeline-providers"
// Экспорт оркестратора
export {
  getPlayerActor,
  getTimelineActor,
  getTimelineUIActor,
  getVideoEditingOrchestrator,
  VideoEditingOrchestrator,
} from "./services/video-editing-orchestrator"

// Экспорт типов
export * from "./types"
