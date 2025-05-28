/**
 * Тесты для хука useChat
 */

import React from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useChat } from "../../hooks/use-chat"

// Мокаем модуль chat-provider
vi.mock("../../services/chat-provider", () => {
  const mockChatContext = {
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

  return {
    ChatContext: React.createContext(mockChatContext),
    ChatContextType: {},
    ChatProvider: ({ children }: { children: React.ReactNode }) => children,
  }
})

describe("useChat", () => {
  describe("Hook Initialization", () => {
    it("should be defined and exportable", () => {
      expect(useChat).toBeDefined()
      expect(typeof useChat).toBe("function")
    })

    it("should return chat context when used inside provider", () => {
      const { result } = renderHook(() => useChat())

      expect(result.current).toBeDefined()
      expect(result.current).toHaveProperty("chatMessages")
      expect(result.current).toHaveProperty("selectedAgentId")
      expect(result.current).toHaveProperty("isProcessing")
      expect(result.current).toHaveProperty("error")
      expect(result.current).toHaveProperty("sendChatMessage")
      expect(result.current).toHaveProperty("receiveChatMessage")
      expect(result.current).toHaveProperty("selectAgent")
      expect(result.current).toHaveProperty("setProcessing")
      expect(result.current).toHaveProperty("setError")
      expect(result.current).toHaveProperty("clearMessages")
      expect(result.current).toHaveProperty("removeMessage")
    })
  })

  describe("Default State", () => {
    it("should return default chat state", () => {
      const { result } = renderHook(() => useChat())

      expect(result.current.chatMessages).toEqual([])
      expect(result.current.selectedAgentId).toBe("openai")
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe("Action Methods", () => {
    it("should provide all required action methods", () => {
      const { result } = renderHook(() => useChat())

      expect(typeof result.current.sendChatMessage).toBe("function")
      expect(typeof result.current.receiveChatMessage).toBe("function")
      expect(typeof result.current.selectAgent).toBe("function")
      expect(typeof result.current.setProcessing).toBe("function")
      expect(typeof result.current.setError).toBe("function")
      expect(typeof result.current.clearMessages).toBe("function")
      expect(typeof result.current.removeMessage).toBe("function")
    })

    it("should call action methods without errors", () => {
      const { result } = renderHook(() => useChat())

      expect(() => {
        result.current.sendChatMessage("Test message")
        result.current.receiveChatMessage("Response message")
        result.current.selectAgent("claude")
        result.current.setProcessing(true)
        result.current.setError("Test error")
        result.current.clearMessages()
        result.current.removeMessage("message-id")
      }).not.toThrow()
    })
  })

  describe("Error Handling", () => {
    it("should handle invalid parameters gracefully", () => {
      const { result } = renderHook(() => useChat())

      expect(() => {
        result.current.sendChatMessage("")
        result.current.receiveChatMessage("")
        result.current.selectAgent("")
        result.current.removeMessage("")
      }).not.toThrow()
    })
  })
})
