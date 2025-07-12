/**
 * AI Chat Feature Exports
 *
 * Экспортирует все основные компоненты и хуки для AI чата
 */

// Основные компоненты и хуки
export * from "./components"
export * from "./hooks"
// Timeline AI интеграция
export { useTimelineAI, useTimelineAIQuick } from "./hooks/use-timeline-ai"
export * from "./services"
export { TimelineAIService } from "./services/timeline-ai-service"
export { browserTools } from "./tools/browser-tools"
export { playerTools } from "./tools/player-tools"
// Инструменты Claude
export { resourceTools } from "./tools/resource-tools"
export { timelineTools } from "./tools/timeline-tools"
// Типы для AI контекста
export type {
  AIBrowserContext,
  AICommand,
  AICommandResult,
  AIPlayerContext,
  AIResourcesContext,
  AITimelineContext,
  AIToolResult,
  TimelineStudioContext,
} from "./types/ai-context"
