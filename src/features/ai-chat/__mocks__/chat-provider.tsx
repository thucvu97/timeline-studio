import React from "react"

import { vi } from "vitest"

import { ChatContextType } from "../services/chat-provider"

export const mockChatContext: ChatContextType = {
  chatMessages: [],
  selectedAgentId: "openai",
  isProcessing: false,
  error: null,
  sendChatMessage: vi.fn(),
  receiveChatMessage: vi.fn(),
  selectAgent: vi.fn(),
  setProcessing: vi.fn(),
  setError: vi.fn(),
  clearMessages: vi.fn(),
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

// Re-export the types
export type { ChatContextType }
