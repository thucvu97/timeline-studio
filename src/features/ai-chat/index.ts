/**
 * AI Chat Feature Exports
 *
 * Экспортирует все основные компоненты и хуки для AI чата
 */

// Основные компоненты
export * from "./components"

// Хуки - экспортируем все кроме useChat (конфликт с services)
export * from "./hooks/use-chat-actions"
export * from "./hooks/use-chat-state"
export * from "./hooks/use-resources-ai-integration"
export * from "./hooks/use-safe-timeline"
export * from "./hooks/use-timeline-ai"

// Сервисы и провайдеры (включая основной useChat)
export * from "./services/chat-machine"
export * from "./services/unified-ai-service"
export * from "./services/whisper-service"

// Инструменты
export type { AIToolResult } from "./tools/base-ai-tool"

// Все типы
export * from "./types/ai-context"
export * from "./types/ai-message"
// Note: chat types are now in @domains/ai-services/types/chat
// They are re-exported from ./types/chat for backward compatibility
export type { AgentId, ChatMessage, ChatSession } from "./types/chat"
export * from "./types/streaming"

// Утилиты
export * from "./utils/context-manager"
export * from "./utils/timeline-context"
