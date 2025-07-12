import React, { createContext } from "react"

import { useActor } from "@xstate/react"

import { chatMachine } from "./chat-machine"
import { chatStorageService } from "./chat-storage-service"
import { ChatListItem, ChatMessage } from "../types/chat"

// Интерфейс контекста провайдера чата
export interface ChatContextType {
  // Состояние
  chatMessages: ChatMessage[]
  selectedAgentId: string | null
  isProcessing: boolean
  error: string | null
  currentSessionId: string | null
  sessions: ChatListItem[]
  isCreatingNewChat: boolean

  // Действия
  sendChatMessage: (message: string) => void
  receiveChatMessage: (message: ChatMessage) => void
  selectAgent: (agentId: string) => void
  setProcessing: (isProcessing: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
  removeMessage: (messageId: string) => void
  createNewChat: () => void
  switchSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => void
  updateSessions: (sessions: ChatListItem[]) => void

  // Timeline AI события
  sendTimelineEvent: (event: any) => void
}

// Создаем контекст
export const ChatContext = createContext<ChatContextType | null>(null)

// Интерфейс пропсов провайдера
interface ChatProviderProps {
  children: React.ReactNode
  value?: ChatContextType // Для тестирования
}

/**
 * Провайдер для управления состоянием чата
 *
 * Использует XState машину состояний для управления:
 * - Сообщениями чата
 * - Выбранным агентом (моделью ИИ)
 * - Состоянием обработки
 * - Ошибками
 */
export function ChatProvider({ children, value }: ChatProviderProps) {
  const [state, send] = useActor(chatMachine)

  // Извлекаем данные из состояния машины
  const { chatMessages, selectedAgentId, isProcessing, error, currentSessionId, sessions, isCreatingNewChat } =
    state.context

  // Создаем функции для отправки событий
  const sendChatMessage = (message: string) => {
    send({ type: "SEND_CHAT_MESSAGE", message })
  }

  const receiveChatMessage = (message: ChatMessage) => {
    send({ type: "RECEIVE_CHAT_MESSAGE", message })
  }

  const selectAgent = (agentId: string) => {
    send({ type: "SELECT_AGENT", agentId })
  }

  const setProcessing = (isProcessing: boolean) => {
    send({ type: "SET_PROCESSING", isProcessing })
  }

  const setError = (error: string | null) => {
    send({ type: "SET_ERROR", error })
  }

  const clearMessages = () => {
    send({ type: "CLEAR_MESSAGES" })
  }

  const removeMessage = (messageId: string) => {
    send({ type: "REMOVE_MESSAGE", messageId })
  }

  const createNewChat = async () => {
    send({ type: "CREATE_NEW_CHAT" })

    // Симуляция создания чата
    setTimeout(async () => {
      const newSession: ChatListItem = {
        id: `session-${Date.now()}`,
        title: "составь план рефакторинга",
        lastMessageAt: new Date(),
        messageCount: 0,
      }

      await chatStorageService.createSession(newSession.title)
      send({ type: "NEW_CHAT_CREATED", session: newSession })
    }, 1500)
  }

  const switchSession = async (sessionId: string) => {
    send({ type: "SWITCH_SESSION", sessionId })

    // Загружаем сообщения для выбранной сессии
    try {
      const session = await chatStorageService.getSession(sessionId)
      if (session) {
        // Загружаем все сообщения сразу
        send({ type: "LOAD_SESSION_MESSAGES", messages: session.messages })
      }
    } catch (error) {
      console.error("Failed to load session messages:", error)
      send({ type: "SET_ERROR", error: "Не удалось загрузить сообщения сессии" })
    }
  }

  const deleteSession = (sessionId: string) => {
    send({ type: "DELETE_SESSION", sessionId })
  }

  const updateSessions = (sessions: ChatListItem[]) => {
    send({ type: "UPDATE_SESSIONS", sessions })
  }

  const sendTimelineEvent = (event: any) => {
    send(event)
  }

  // Создаем значение контекста
  const contextValue: ChatContextType = {
    // Состояние
    chatMessages,
    selectedAgentId,
    isProcessing,
    error,
    currentSessionId,
    sessions,
    isCreatingNewChat,

    // Действия
    sendChatMessage,
    receiveChatMessage,
    selectAgent,
    setProcessing,
    setError,
    clearMessages,
    removeMessage,
    createNewChat,
    switchSession,
    deleteSession,
    updateSessions,
    sendTimelineEvent,
  }

  // Используем переданное значение для тестов или реальное значение
  return <ChatContext.Provider value={value || contextValue}>{children}</ChatContext.Provider>
}
