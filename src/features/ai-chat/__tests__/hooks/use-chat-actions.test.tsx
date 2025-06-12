import React from "react"

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useChatActions } from "../../hooks/use-chat-actions"
import { ChatProvider } from "../../services/chat-provider"

// Mock для useChat
const mockChatActions = {
  sendChatMessage: vi.fn(),
  receiveChatMessage: vi.fn(),
  selectAgent: vi.fn(),
  setProcessing: vi.fn(),
  setError: vi.fn(),
  clearMessages: vi.fn(),
  removeMessage: vi.fn(),
}

const mockUseChat = vi.fn()
vi.mock("../../hooks/use-chat", () => ({
  useChat: () => mockUseChat(),
}))

// Wrapper для тестов
const wrapper = ({ children }: { children: React.ReactNode }) => <ChatProvider>{children}</ChatProvider>

describe("useChatActions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Устанавливаем возвращаемое значение для useChat
    mockUseChat.mockReturnValue({
      ...mockChatActions,
      chatMessages: [],
      selectedAgentId: "claude-4-sonnet",
      isProcessing: false,
      error: null,
    })
  })

  describe("Основная функциональность", () => {
    it("должен быть определен и экспортируем", () => {
      expect(useChatActions).toBeDefined()
      expect(typeof useChatActions).toBe("function")
    })

    it("должен возвращать только действия без состояния", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      // Проверяем, что возвращаются только действия
      expect(result.current).toHaveProperty("sendChatMessage")
      expect(result.current).toHaveProperty("receiveChatMessage")
      expect(result.current).toHaveProperty("selectAgent")
      expect(result.current).toHaveProperty("setProcessing")
      expect(result.current).toHaveProperty("setError")
      expect(result.current).toHaveProperty("clearMessages")
      expect(result.current).toHaveProperty("removeMessage")

      // Проверяем, что состояние НЕ возвращается
      expect(result.current).not.toHaveProperty("chatMessages")
      expect(result.current).not.toHaveProperty("selectedAgentId")
      expect(result.current).not.toHaveProperty("isProcessing")
      expect(result.current).not.toHaveProperty("error")
    })

    it("должен возвращать рабочие функции", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      // Все возвращаемые значения должны быть функциями
      expect(typeof result.current.sendChatMessage).toBe("function")
      expect(typeof result.current.receiveChatMessage).toBe("function")
      expect(typeof result.current.selectAgent).toBe("function")
      expect(typeof result.current.setProcessing).toBe("function")
      expect(typeof result.current.setError).toBe("function")
      expect(typeof result.current.clearMessages).toBe("function")
      expect(typeof result.current.removeMessage).toBe("function")
    })
  })

  describe("Вызов действий", () => {
    it("должен вызывать sendChatMessage с правильными параметрами", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      act(() => {
        result.current.sendChatMessage("Тестовое сообщение")
      })

      expect(mockChatActions.sendChatMessage).toHaveBeenCalledTimes(1)
      expect(mockChatActions.sendChatMessage).toHaveBeenCalledWith("Тестовое сообщение")
    })

    it("должен вызывать receiveChatMessage с правильными параметрами", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      act(() => {
        result.current.receiveChatMessage("Ответ от ИИ")
      })

      expect(mockChatActions.receiveChatMessage).toHaveBeenCalledTimes(1)
      expect(mockChatActions.receiveChatMessage).toHaveBeenCalledWith("Ответ от ИИ")
    })

    it("должен вызывать selectAgent с правильными параметрами", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      act(() => {
        result.current.selectAgent("gpt-4")
      })

      expect(mockChatActions.selectAgent).toHaveBeenCalledTimes(1)
      expect(mockChatActions.selectAgent).toHaveBeenCalledWith("gpt-4")
    })

    it("должен вызывать setProcessing с правильными параметрами", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      act(() => {
        result.current.setProcessing(true)
      })

      expect(mockChatActions.setProcessing).toHaveBeenCalledTimes(1)
      expect(mockChatActions.setProcessing).toHaveBeenCalledWith(true)
    })

    it("должен вызывать setError с правильными параметрами", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      act(() => {
        result.current.setError("Ошибка API")
      })

      expect(mockChatActions.setError).toHaveBeenCalledTimes(1)
      expect(mockChatActions.setError).toHaveBeenCalledWith("Ошибка API")
    })

    it("должен вызывать clearMessages", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      act(() => {
        result.current.clearMessages()
      })

      expect(mockChatActions.clearMessages).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать removeMessage с правильными параметрами", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      act(() => {
        result.current.removeMessage("message-123")
      })

      expect(mockChatActions.removeMessage).toHaveBeenCalledTimes(1)
      expect(mockChatActions.removeMessage).toHaveBeenCalledWith("message-123")
    })
  })

  describe("Множественные вызовы", () => {
    it("должен поддерживать множественные вызовы действий", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      act(() => {
        result.current.sendChatMessage("Сообщение 1")
        result.current.sendChatMessage("Сообщение 2")
        result.current.receiveChatMessage("Ответ 1")
        result.current.receiveChatMessage("Ответ 2")
      })

      expect(mockChatActions.sendChatMessage).toHaveBeenCalledTimes(2)
      expect(mockChatActions.receiveChatMessage).toHaveBeenCalledTimes(2)
    })

    it("должен поддерживать комплексные сценарии использования", () => {
      const { result } = renderHook(() => useChatActions(), { wrapper })

      // Симулируем типичный поток работы
      act(() => {
        result.current.setProcessing(true)
        result.current.sendChatMessage("Как добавить эффект?")
      })

      expect(mockChatActions.setProcessing).toHaveBeenCalledWith(true)
      expect(mockChatActions.sendChatMessage).toHaveBeenCalledWith("Как добавить эффект?")

      // Получаем ответ
      act(() => {
        result.current.receiveChatMessage("Вот как добавить эффект...")
        result.current.setProcessing(false)
      })

      expect(mockChatActions.receiveChatMessage).toHaveBeenCalledWith("Вот как добавить эффект...")
      expect(mockChatActions.setProcessing).toHaveBeenCalledWith(false)
    })
  })

  describe("Стабильность ссылок", () => {
    it("должен сохранять стабильные ссылки на функции между рендерами", () => {
      const { result, rerender } = renderHook(() => useChatActions(), { wrapper })

      const firstRender = { ...result.current }

      // Перерендериваем
      rerender()

      const secondRender = { ...result.current }

      // Функции должны оставаться теми же
      expect(firstRender.sendChatMessage).toBe(secondRender.sendChatMessage)
      expect(firstRender.receiveChatMessage).toBe(secondRender.receiveChatMessage)
      expect(firstRender.selectAgent).toBe(secondRender.selectAgent)
      expect(firstRender.setProcessing).toBe(secondRender.setProcessing)
      expect(firstRender.setError).toBe(secondRender.setError)
      expect(firstRender.clearMessages).toBe(secondRender.clearMessages)
      expect(firstRender.removeMessage).toBe(secondRender.removeMessage)
    })
  })

  describe("Изоляция от состояния", () => {
    it("не должен перерендериваться при изменении состояния", () => {
      let renderCount = 0
      const { rerender } = renderHook(
        () => {
          renderCount++
          return useChatActions()
        },
        { wrapper },
      )

      expect(renderCount).toBe(1)

      // Обновляем возвращаемое значение useChat с новым состоянием
      mockUseChat.mockReturnValue({
        ...mockChatActions,
        chatMessages: [{ id: "1", role: "user", content: "Новое сообщение" }],
        selectedAgentId: "gpt-4",
        isProcessing: true,
        error: "Ошибка",
      })

      rerender()

      // Хук должен перерендериться только из-за rerender, а не из-за изменения состояния
      expect(renderCount).toBe(2)
    })
  })

  describe("Обработка ошибок", () => {
    it("должен корректно передавать ошибки из действий", () => {
      // Создаем действие, которое выбрасывает ошибку
      const errorAction = vi.fn().mockImplementation(() => {
        throw new Error("Тестовая ошибка")
      })

      mockUseChat.mockReturnValue({
        ...mockChatActions,
        sendChatMessage: errorAction,
        chatMessages: [],
        selectedAgentId: "claude-4-sonnet",
        isProcessing: false,
        error: null,
      })

      const { result } = renderHook(() => useChatActions(), { wrapper })

      expect(() => {
        act(() => {
          result.current.sendChatMessage("Сообщение")
        })
      }).toThrow("Тестовая ошибка")
    })
  })
})
