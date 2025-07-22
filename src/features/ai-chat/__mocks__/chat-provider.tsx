import React from "react"

import { vi } from "vitest"

import { ChatContextTypeV2 } from "../services/chat-provider"
import { ChatListItem } from "../types/chat"

export const mockChatContext: ChatContextTypeV2 = {
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
  createNewChat: (): void => {
    throw new Error("Function not implemented.")
  },
  switchSession: (_sessionId: string): Promise<void> => {
    throw new Error("Function not implemented.")
  },
  deleteSession: (_sessionId: string): void => {
    throw new Error("Function not implemented.")
  },
  updateSessions: (_sessions: ChatListItem[]): void => {
    throw new Error("Function not implemented.")
  },
  sendTimelineEvent: (_event: any): void => {
    throw new Error("Function not implemented.")
  },
}

// Creating context with null as default value
export const ChatContext = React.createContext<ChatContextTypeV2 | null>(null)

// Create a hook that always returns the mock context
export const useChat = () => mockChatContext

// Provider component that provides the mock context
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ChatContext.Provider value={mockChatContext}>{children}</ChatContext.Provider>
}
