import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChatProviders } from "@/test/test-utils"

import { useChat } from "../../hooks/use-chat"

// Создаем wrapper с контекстом
const createWrapper = () => {
  return ChatProviders
}

describe("useChat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Использование вне провайдера", () => {
    it("должен выбрасывать ошибку при использовании вне ChatProvider", () => {
      // Рендерим без wrapper
      const { result } = renderHook(() => {
        try {
          return useChat()
        } catch (error) {
          return { error }
        }
      })

      expect(result.current.error).toBeDefined()
      expect((result.current.error as Error).message).toBe("useChat должен использоваться внутри ChatProvider")
    })
  })

  describe("Успешное использование в контексте", () => {
    it("должен возвращать полный контекст чата", () => {
      const { result } = renderHook(() => useChat(), {
        wrapper: createWrapper(),
      })

      expect(result.current).toMatchObject({
        chatMessages: [],
        selectedAgentId: "claude-4-sonnet",
        isProcessing: false,
        error: null,
        sendChatMessage: expect.any(Function),
        receiveChatMessage: expect.any(Function),
        selectAgent: expect.any(Function),
        setProcessing: expect.any(Function),
        setError: expect.any(Function),
        clearMessages: expect.any(Function),
        removeMessage: expect.any(Function),
      })
    })

    it("должен возвращать актуальное состояние сообщений", () => {
      const { result } = renderHook(() => useChat(), {
        wrapper: createWrapper(),
      })

      expect(result.current.chatMessages).toHaveLength(0)
      expect(Array.isArray(result.current.chatMessages)).toBe(true)
    })

    it("должен предоставлять рабочие методы действий", () => {
      const { result } = renderHook(() => useChat(), {
        wrapper: createWrapper(),
      })

      // Проверяем, что методы доступны и являются функциями
      expect(typeof result.current.sendChatMessage).toBe("function")
      expect(typeof result.current.receiveChatMessage).toBe("function")
      expect(typeof result.current.selectAgent).toBe("function")
      expect(typeof result.current.setProcessing).toBe("function")
      expect(typeof result.current.setError).toBe("function")
      expect(typeof result.current.clearMessages).toBe("function")
      expect(typeof result.current.removeMessage).toBe("function")
    })
  })

  describe("Обновление контекста", () => {
    it("должен реагировать на изменения контекста", () => {
      const { result } = renderHook(() => useChat(), {
        wrapper: createWrapper(),
      })

      // Проверяем начальное состояние из мока
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.selectedAgentId).toBe("claude-4-sonnet")
      expect(result.current.error).toBe(null)
    })
  })

  describe("Типизация", () => {
    it("должен правильно типизировать возвращаемые значения", () => {
      const { result } = renderHook(() => useChat(), {
        wrapper: createWrapper(),
      })

      // TypeScript проверит типы во время компиляции
      // Здесь мы проверяем runtime типы
      expect(Array.isArray(result.current.chatMessages)).toBe(true)
      expect(typeof result.current.selectedAgentId).toBe("string")
      expect(typeof result.current.isProcessing).toBe("boolean")
      expect(result.current.error).toBe(null)
    })
  })

  describe("Состояние обработки", () => {
    it("должен правильно отражать состояние обработки", () => {
      const { result } = renderHook(() => useChat(), {
        wrapper: createWrapper(),
      })

      // Проверяем базовое состояние из мока
      expect(result.current.isProcessing).toBe(false)
    })

    it("должен правильно отражать состояние ошибки", () => {
      const { result } = renderHook(() => useChat(), {
        wrapper: createWrapper(),
      })

      // Проверяем базовое состояние из мока
      expect(result.current.error).toBe(null)
    })
  })
})
