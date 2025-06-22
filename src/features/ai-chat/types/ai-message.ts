/**
 * Общий тип для сообщений AI
 */
export interface AiMessage {
  role: "user" | "assistant" | "system"
  content: string
}
