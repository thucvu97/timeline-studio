import { useContext } from "react"

import { ChatContext, ChatContextType } from "../services/chat-provider"

/**
 * Хук для использования контекста чата
 *
 * @returns Контекст чата с состоянием и действиями
 * @throws Ошибка, если хук используется вне ChatProvider
 */
export function useChat(): ChatContextType {
  const context = useContext(ChatContext)

  if (!context) {
    throw new Error("useChat должен использоваться внутри ChatProvider")
  }

  return context
}
