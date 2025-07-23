/**
 * Chat Provider V2
 *
 * Гибридная архитектура: UI локально, история чата через backend
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { ProjectState } from "@/features/app-state/types/unified-project"

// Базовые типы для чата
interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  timestamp: Date
  metadata?: Record<string, any>
}

interface ChatSession {
  id: string
  name: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

interface ChatContextTypeV2 {
  // Текущая сессия (локальное состояние)
  currentSession: ChatSession | null
  isLoading: boolean
  error: string | null

  // История сессий (backend)
  sessions: ChatSession[]

  // UI состояние (локальное)
  isOpen: boolean
  inputText: string
  isStreaming: boolean

  // Действия для сессий (backend)
  createSession: (name?: string) => Promise<ChatSession>
  deleteSession: (sessionId: string) => Promise<void>
  switchToSession: (sessionId: string) => Promise<void>

  // Действия для сообщений (backend)
  sendMessage: (content: string) => Promise<void>
  clearCurrentSession: () => Promise<void>

  // UI действия (локальные)
  setIsOpen: (isOpen: boolean) => void
  setInputText: (text: string) => void
  setIsStreaming: (isStreaming: boolean) => void
}

const ChatContextV2 = createContext<ChatContextTypeV2 | undefined>(undefined)

interface ChatProviderV2Props {
  children: React.ReactNode
}

export function ChatProviderV2({ children }: ChatProviderV2Props) {
  const [backendSync] = useState(() => getBackendSync())
  const [backendState, setBackendState] = useState<ProjectState | null>(null)

  // Backend состояние
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI состояние (локальное)
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  // Подписка на backend состояние
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBackendState(state)
      setError(null)

      // Извлекаем сессии чата из состояния проекта
      // Пока backend не поддерживает чат, используем заглушку
      if (state.project?.metadata?.chatSessions) {
        setSessions(state.project.metadata.chatSessions)
      }
    })

    return unsubscribe
  }, [backendSync])

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: any) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        console.error("Chat command failed:", err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Действия для сессий
  const createSession = useCallback(async (name?: string): Promise<ChatSession> => {
    const sessionName = name || `Чат ${new Date().toLocaleString()}`

    // Пока backend не поддерживает чат, создаем локально
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      name: sessionName,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setSessions((prev) => [...prev, newSession])
    setCurrentSession(newSession)

    console.warn("Chat sessions not yet integrated with backend")
    return newSession

    // В будущем это будет:
    // return await executeCommand({
    //   type: 'CreateChatSession',
    //   params: { name: sessionName }
    // })
  }, [])

  const deleteSession = useCallback(
    async (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))

      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
      }

      console.warn("Chat session deletion not yet integrated with backend")

      // В будущем это будет:
      // await executeCommand({
      //   type: 'DeleteChatSession',
      //   params: { sessionId }
      // })
    },
    [currentSession],
  )

  const switchToSession = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId)
      if (session) {
        setCurrentSession(session)
      }
    },
    [sessions],
  )

  // Действия для сообщений
  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSession) {
        // Создаем новую сессию если её нет
        const newSession = await createSession()
        setCurrentSession(newSession)
      }

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content,
        role: "user",
        timestamp: new Date(),
      }

      // Добавляем сообщение пользователя
      setCurrentSession((prev) => {
        if (!prev) return prev
        const updatedSession = {
          ...prev,
          messages: [...prev.messages, userMessage],
          updatedAt: new Date(),
        }

        // Обновляем в списке сессий
        setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

        return updatedSession
      })

      // Симулируем ответ AI (пока нет интеграции с backend)
      setIsStreaming(true)

      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          content: `Это ответ на ваше сообщение: "${content}"`,
          role: "assistant",
          timestamp: new Date(),
        }

        setCurrentSession((prev) => {
          if (!prev) return prev
          const updatedSession = {
            ...prev,
            messages: [...prev.messages, aiMessage],
            updatedAt: new Date(),
          }

          setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

          return updatedSession
        })

        setIsStreaming(false)
      }, 1000)

      console.warn("Chat AI integration not yet implemented in backend")

      // В будущем это будет:
      // await executeCommand({
      //   type: 'SendChatMessage',
      //   params: { sessionId: currentSession.id, content }
      // })
    },
    [currentSession, createSession],
  )

  const clearCurrentSession = useCallback(async () => {
    if (!currentSession) return

    setCurrentSession((prev) => {
      if (!prev) return prev
      const clearedSession = {
        ...prev,
        messages: [],
        updatedAt: new Date(),
      }

      setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? clearedSession : s)))

      return clearedSession
    })

    console.warn("Chat session clearing not yet integrated with backend")

    // В будущем это будет:
    // await executeCommand({
    //   type: 'ClearChatSession',
    //   params: { sessionId: currentSession.id }
    // })
  }, [currentSession])

  // Контекстное значение
  const contextValue: ChatContextTypeV2 = {
    // Текущая сессия
    currentSession,
    isLoading,
    error,

    // История сессий
    sessions,

    // UI состояние
    isOpen,
    inputText,
    isStreaming,

    // Действия для сессий
    createSession,
    deleteSession,
    switchToSession,

    // Действия для сообщений
    sendMessage,
    clearCurrentSession,

    // UI действия
    setIsOpen,
    setInputText,
    setIsStreaming,
  }

  return <ChatContextV2.Provider value={contextValue}>{children}</ChatContextV2.Provider>
}

export function useChatV2(): ChatContextTypeV2 {
  const context = useContext(ChatContextV2)

  if (!context) {
    throw new Error("useChatV2 must be used within ChatProviderV2")
  }

  return context
}

// Экспорт типов
export type { ChatContextTypeV2 }

// Экспорт для обратной совместимости
export { ChatProviderV2 as ChatProvider }
export { useChatV2 as useChat }

// Экспорт контекста для типизации
export { ChatContextV2 as ChatContext }
