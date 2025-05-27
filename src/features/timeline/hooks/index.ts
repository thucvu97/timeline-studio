/**
 * Timeline Hooks
 *
 * Экспорт всех хуков для работы с Timeline
 */

export { useTracks } from "./use-tracks";
export type { UseTracksReturn } from "./use-tracks";

export { useClips } from "./use-clips";
export type { UseClipsReturn } from "./use-clips";

export { useTimelineSelection } from "./use-timeline-selection";
export type { UseTimelineSelectionReturn } from "./use-timeline-selection";

export { useTimelineActions } from "./use-timeline-actions";
export type { UseTimelineActionsReturn } from "./use-timeline-actions";

// Основной хук экспортируется из провайдера
export { useTimeline } from "../timeline-provider";
export type { TimelineContextValue } from "../timeline-provider";
