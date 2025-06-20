import { ChatContextType } from "../services/chat-provider"
import { useChat } from "./use-chat"

/**
 * Хук для доступа только к состоянию чата (без методов)
 * @returns Только состояние чата
 */
export function useChatState(): Pick<ChatContextType, "chatMessages" | "selectedAgentId" | "isProcessing" | "error"> {
  const { chatMessages, selectedAgentId, isProcessing, error } = useChat()
  return { chatMessages, selectedAgentId, isProcessing, error }
}
