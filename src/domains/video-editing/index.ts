/**
 * Video Editing Domain
 *
 * Домен для управления редактированием видео
 */

export type { PlayerMachine } from "./machines/player-machine"
export { playerMachine } from "./machines/player-machine"
// Экспорт типов машин
export type { TimelineMachine } from "./machines/timeline-machine"
// Экспорт машин
export { timelineMachine } from "./machines/timeline-machine"
// Экспорт оркестратора
export {
  getVideoEditingOrchestrator,
  resetVideoEditingOrchestrator,
  VideoEditingOrchestrator,
} from "./services/video-editing-orchestrator"
// Экспорт типов
export * from "./types"
