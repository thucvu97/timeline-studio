/**
 * @deprecated
 * Chat session types have been moved to @domains/ai-services/types/chat.ts
 *
 * Import from the new location:
 * import type { ChatSession, ChatMessage, AgentId } from '@domains/ai-services/types/chat'
 */

// Re-export ALL chat types from the new domain location for backward compatibility
export type {
  Agent,
  AgentId,
  AIService,
  ChatListItem,
  ChatMessage,
  ChatSession,
  ChatStorageService,
  ChatTimelineContext,
} from "../../../domains/ai-services/types/chat"
