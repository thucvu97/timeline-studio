import { vi } from "vitest"

import { ChatMessage } from "../types/chat"

export interface ChatMachineContext {
  chatMessages: ChatMessage[]
  selectedAgentId: string | null
  isProcessing: boolean
  error: string | null
}

const initialContext: ChatMachineContext = {
  chatMessages: [],
  selectedAgentId: "openai",
  isProcessing: false,
  error: null,
}

export const chatMachine = {
  initial: "idle",
  context: { ...initialContext },
  transition: vi.fn().mockImplementation((state, event) => {
    switch (event.type) {
      case "SEND_CHAT_MESSAGE":
        return {
          ...state,
          context: {
            ...state.context,
            chatMessages: [...state.context.chatMessages, { id: "test-id", content: event.message, role: "user" }],
          },
        }
      case "RECEIVE_CHAT_MESSAGE":
        return {
          ...state,
          context: {
            ...state.context,
            chatMessages: [...state.context.chatMessages, event.message],
          },
        }
      case "SELECT_AGENT":
        return {
          ...state,
          context: {
            ...state.context,
            selectedAgentId: event.agentId,
          },
        }
      case "SET_PROCESSING":
        return {
          ...state,
          context: {
            ...state.context,
            isProcessing: event.isProcessing,
          },
        }
      case "SET_ERROR":
        return {
          ...state,
          context: {
            ...state.context,
            error: event.error,
          },
        }
      case "CLEAR_MESSAGES":
        return {
          ...state,
          context: {
            ...state.context,
            chatMessages: [],
          },
        }
      case "REMOVE_MESSAGE":
        return {
          ...state,
          context: {
            ...state.context,
            chatMessages: state.context.chatMessages.filter((msg: ChatMessage) => msg.id !== event.messageId),
          },
        }
      default:
        return state
    }
  }),
}
