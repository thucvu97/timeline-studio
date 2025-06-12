import React from "react"

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useChatState } from "../../hooks/use-chat-state"
import { ChatProvider } from "../../services/chat-provider"

// Mock для useChat
const mockChatState = {
  chatMessages: [
    {
      id: "1",
      role: "user" as const,
      content: "Как добавить переход между клипами?",
      timestamp: new Date("2024-01-01T10:00:00"),
    },
    {
      id: "2",
      role: "assistant" as const,
      content: "Для добавления перехода выберите два клипа и используйте панель переходов.",
      timestamp: new Date("2024-01-01T10:00:30"),
    },
  ],
  selectedAgentId: "claude-4-sonnet",
  isProcessing: false,
  error: null,
}

const mockUseChat = vi.fn()
vi.mock("../../hooks/use-chat", () => ({
  useChat: () => mockUseChat(),
}))

// Wrapper для тестов
const wrapper = ({ children }: { children: React.ReactNode }) => <ChatProvider>{children}</ChatProvider>

describe("useChatState", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Устанавливаем возвращаемое значение для useChat
    mockUseChat.mockReturnValue({
      ...mockChatState,
      sendChatMessage: vi.fn(),
      receiveChatMessage: vi.fn(),
      selectAgent: vi.fn(),
      setProcessing: vi.fn(),
      setError: vi.fn(),
      clearMessages: vi.fn(),
      removeMessage: vi.fn(),
    })
  })

  describe("Основная функциональность", () => {
    it("должен быть определен и экспортируем", () => {
      expect(useChatState).toBeDefined()
      expect(typeof useChatState).toBe("function")
    })

    it("должен возвращать только состояние без действий", () => {
      const { result } = renderHook(() => useChatState(), { wrapper })

      // Проверяем, что возвращается только состояние
      expect(result.current).toHaveProperty("chatMessages")
      expect(result.current).toHaveProperty("selectedAgentId")
      expect(result.current).toHaveProperty("isProcessing")
      expect(result.current).toHaveProperty("error")

      // Проверяем, что действия НЕ возвращаются
      expect(result.current).not.toHaveProperty("sendChatMessage")
      expect(result.current).not.toHaveProperty("receiveChatMessage")
      expect(result.current).not.toHaveProperty("selectAgent")
      expect(result.current).not.toHaveProperty("setProcessing")
      expect(result.current).not.toHaveProperty("setError")
      expect(result.current).not.toHaveProperty("clearMessages")
      expect(result.current).not.toHaveProperty("removeMessage")
    })

    it("должен возвращать актуальное состояние", () => {
      const { result } = renderHook(() => useChatState(), { wrapper })

      expect(result.current.chatMessages).toHaveLength(2)
      expect(result.current.chatMessages[0].content).toBe("Как добавить переход между клипами?")
      expect(result.current.chatMessages[1].role).toBe("assistant")
      expect(result.current.selectedAgentId).toBe("claude-4-sonnet")
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe("Типизация состояния", () => {
    it("должен правильно типизировать сообщения", () => {
      const { result } = renderHook(() => useChatState(), { wrapper })

      const message = result.current.chatMessages[0]
      expect(message).toMatchObject({
        id: expect.any(String),
        role: expect.stringMatching(/^(user|assistant)$/),
        content: expect.any(String),
        timestamp: expect.any(Date),
      })
    })

    it("должен правильно типизировать selectedAgentId", () => {
      const { result } = renderHook(() => useChatState(), { wrapper })

      expect(typeof result.current.selectedAgentId).toBe("string")
      expect(result.current.selectedAgentId).toMatch(/^(claude-4-opus|claude-4-sonnet|gpt-4|gpt-4o|gpt-3.5-turbo|o3)$/)
    })
  })

  describe("Обновление состояния", () => {
    it("должен реагировать на изменения состояния", () => {
      const { result, rerender } = renderHook(() => useChatState(), { wrapper })

      expect(result.current.isProcessing).toBe(false)

      // Обновляем состояние
      mockUseChat.mockReturnValue({
        ...mockChatState,
        isProcessing: true,
        sendChatMessage: vi.fn(),
        receiveChatMessage: vi.fn(),
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })

      rerender()

      expect(result.current.isProcessing).toBe(true)
    })

    it("должен отражать новые сообщения", () => {
      const { result, rerender } = renderHook(() => useChatState(), { wrapper })

      expect(result.current.chatMessages).toHaveLength(2)

      // Добавляем новое сообщение
      const updatedMessages = [
        ...mockChatState.chatMessages,
        {
          id: "3",
          role: "user" as const,
          content: "Спасибо за помощь!",
          timestamp: new Date("2024-01-01T10:01:00"),
        },
      ]

      mockUseChat.mockReturnValue({
        ...mockChatState,
        chatMessages: updatedMessages,
        sendChatMessage: vi.fn(),
        receiveChatMessage: vi.fn(),
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })

      rerender()

      expect(result.current.chatMessages).toHaveLength(3)
      expect(result.current.chatMessages[2].content).toBe("Спасибо за помощь!")
    })

    it("должен отражать состояние ошибки", () => {
      const { result, rerender } = renderHook(() => useChatState(), { wrapper })

      expect(result.current.error).toBe(null)

      // Устанавливаем ошибку
      mockUseChat.mockReturnValue({
        ...mockChatState,
        error: "Ошибка подключения к API",
        sendChatMessage: vi.fn(),
        receiveChatMessage: vi.fn(),
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })

      rerender()

      expect(result.current.error).toBe("Ошибка подключения к API")
    })

    it("должен отражать смену агента", () => {
      const { result, rerender } = renderHook(() => useChatState(), { wrapper })

      expect(result.current.selectedAgentId).toBe("claude-4-sonnet")

      // Меняем агента
      mockUseChat.mockReturnValue({
        ...mockChatState,
        selectedAgentId: "gpt-4",
        sendChatMessage: vi.fn(),
        receiveChatMessage: vi.fn(),
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })

      rerender()

      expect(result.current.selectedAgentId).toBe("gpt-4")
    })
  })

  describe("Производительность", () => {
    it("не должен вызывать лишних рендеров", () => {
      let renderCount = 0
      const { rerender } = renderHook(
        () => {
          renderCount++
          return useChatState()
        },
        { wrapper },
      )

      expect(renderCount).toBe(1)

      // Обновляем только действия (не состояние)
      mockUseChat.mockReturnValue({
        ...mockChatState,
        sendChatMessage: vi.fn(), // новая функция
        receiveChatMessage: vi.fn(), // новая функция
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })

      rerender()

      // Должен перерендериться из-за rerender
      expect(renderCount).toBe(2)
    })
  })

  describe("Пустое состояние", () => {
    it("должен корректно обрабатывать пустой список сообщений", () => {
      mockUseChat.mockReturnValue({
        chatMessages: [],
        selectedAgentId: "claude-4-sonnet",
        isProcessing: false,
        error: null,
        sendChatMessage: vi.fn(),
        receiveChatMessage: vi.fn(),
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })

      const { result } = renderHook(() => useChatState(), { wrapper })

      expect(result.current.chatMessages).toEqual([])
      expect(result.current.chatMessages).toHaveLength(0)
    })

    it("должен корректно обрабатывать различные состояния ошибок", () => {
      // Строковая ошибка
      mockUseChat.mockReturnValue({
        ...mockChatState,
        error: "Текстовая ошибка",
        sendChatMessage: vi.fn(),
        receiveChatMessage: vi.fn(),
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })

      const { result } = renderHook(() => useChatState(), { wrapper })
      expect(result.current.error).toBe("Текстовая ошибка")
    })
  })

  describe("Сложные сценарии", () => {
    it("должен отражать последовательность изменений состояния", () => {
      const { result, rerender } = renderHook(() => useChatState(), { wrapper })

      // Начальное состояние
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.chatMessages).toHaveLength(2)

      // Этап 1: Начинаем обработку
      mockUseChat.mockReturnValue({
        ...mockChatState,
        isProcessing: true,
        sendChatMessage: vi.fn(),
        receiveChatMessage: vi.fn(),
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })
      rerender()
      expect(result.current.isProcessing).toBe(true)

      // Этап 2: Получаем ответ
      const newMessages = [
        ...mockChatState.chatMessages,
        {
          id: "3",
          role: "assistant" as const,
          content: "Обработка завершена",
          timestamp: new Date(),
        },
      ]
      mockUseChat.mockReturnValue({
        chatMessages: newMessages,
        selectedAgentId: "claude-4-sonnet",
        isProcessing: false,
        error: null,
        sendChatMessage: vi.fn(),
        receiveChatMessage: vi.fn(),
        selectAgent: vi.fn(),
        setProcessing: vi.fn(),
        setError: vi.fn(),
        clearMessages: vi.fn(),
        removeMessage: vi.fn(),
      })
      rerender()
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.chatMessages).toHaveLength(3)
    })
  })
})
