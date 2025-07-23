import React from "react"

import { vi } from "vitest"

import { ChatContextType } from "../services/chat-provider"

export const mockChatContext: ChatContextType = {
  // Текущая сессия (локальное состояние)
  currentSession: null,
  isLoading: false,
  error: null,

  // История сессий (backend)
  sessions: [],

  // UI состояние (локальное)
  isOpen: false,
  inputText: "",
  isStreaming: false,

  // Действия для сессий (backend)
  createSession: vi.fn(async () => ({
    id: "test-session",
    name: "Test Session",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  switchToSession: vi.fn(),
  deleteSession: vi.fn(),

  // Действия для сообщений (backend)
  sendMessage: vi.fn(),
  clearCurrentSession: vi.fn(),

  // UI действия (локальные)
  setIsOpen: vi.fn(),
  setInputText: vi.fn(),
  setIsStreaming: vi.fn(),

  // Обратная совместимость со старым интерфейсом
  chatMessages: [],
  sendChatMessage: vi.fn(),
  receiveChatMessage: vi.fn(),
  selectedAgentId: "openai",
  selectAgent: vi.fn(),
  isProcessing: false,
  setProcessing: vi.fn(),
  currentSessionId: null,
  isCreatingNewChat: false,
  createNewChat: vi.fn(),
  switchSession: vi.fn(),
  updateSessions: vi.fn(),
  clearMessages: vi.fn(),
  setError: vi.fn(),
  removeMessage: vi.fn(),
}

// Creating context with null as default value
export const ChatContext = React.createContext<ChatContextType | null>(null)

// Create a hook that always returns the mock context
export const useChat = () => mockChatContext

// Provider component that provides the mock context
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ChatContext.Provider value={mockChatContext}>{children}</ChatContext.Provider>
}
