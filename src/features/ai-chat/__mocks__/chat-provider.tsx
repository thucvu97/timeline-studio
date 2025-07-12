import React from "react"

import { vi } from "vitest"

import { ChatContextType } from "../services/chat-provider"
import { ChatListItem } from "../types/chat"

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
  currentSessionId: null,
  sessions: [],
  isCreatingNewChat: false,
  createNewChat: function (): void {
    throw new Error("Function not implemented.")
  },
  switchSession: function (sessionId: string): Promise<void> {
    throw new Error("Function not implemented.")
  },
  deleteSession: function (sessionId: string): void {
    throw new Error("Function not implemented.")
  },
  updateSessions: function (sessions: ChatListItem[]): void {
    throw new Error("Function not implemented.")
  },
  sendTimelineEvent: function (event: any): void {
    throw new Error("Function not implemented.")
  }
}

// Creating context with null as default value
export const ChatContext = React.createContext<ChatContextType | null>(null)

// Create a hook that always returns the mock context
export const useChat = () => mockChatContext

// Provider component that provides the mock context
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ChatContext.Provider value={mockChatContext}>{children}</ChatContext.Provider>
}
