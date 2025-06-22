/**
 * AI Chat Feature Exports
 * 
 * Экспортирует все основные компоненты и хуки для AI чата
 */

// Основные компоненты и хуки
export * from "./components"
export * from "./hooks"
export * from "./services"

// Timeline AI интеграция
export { useTimelineAI, useTimelineAIQuick } from "./hooks/use-timeline-ai"
export { TimelineAIService } from "./services/timeline-ai-service"

// Типы для AI контекста
export type { 
  TimelineStudioContext,
  ResourcesContext, 
  BrowserContext as AIBrowserContext,
  PlayerContext as AIPlayerContext,
  TimelineContext as AITimelineContext,
  AICommand,
  AICommandResult,
  AIToolResult
} from "./types/ai-context"

// Инструменты Claude
export { resourceTools } from "./tools/resource-tools"
export { browserTools } from "./tools/browser-tools"
export { playerTools } from "./tools/player-tools"
export { timelineTools } from "./tools/timeline-tools"
