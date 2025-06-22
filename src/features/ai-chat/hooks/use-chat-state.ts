import { useChat } from "./use-chat"
import { ChatContextType } from "../services/chat-provider"

/**
 * Хук для доступа только к состоянию чата (без методов)
 * @returns Только состояние чата
 */
export function useChatState(): Pick<
  ChatContextType,
  "chatMessages" | "selectedAgentId" | "isProcessing" | "error" | "currentSessionId" | "sessions" | "isCreatingNewChat"
  > {
  const { chatMessages, selectedAgentId, isProcessing, error, currentSessionId, sessions, isCreatingNewChat } =
    useChat()

  return {
    chatMessages,
    selectedAgentId,
    isProcessing,
    error,
    currentSessionId,
    sessions,
    isCreatingNewChat,
  }
}
