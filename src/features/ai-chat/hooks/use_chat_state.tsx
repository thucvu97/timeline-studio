import { ChatContextType } from "../services"
import { useChat } from "./use-chat"

/**
 * Хук для получения только состояния чата (без действий)
 * Полезен для компонентов, которые только читают состояние
 *
 * @returns Состояние чата
 */
export function useChatState(): Pick<ChatContextType, "chatMessages" | "selectedAgentId" | "isProcessing" | "error"> {
  const { chatMessages, selectedAgentId, isProcessing, error } = useChat()

  return {
    chatMessages,
    selectedAgentId,
    isProcessing,
    error,
  }
}
