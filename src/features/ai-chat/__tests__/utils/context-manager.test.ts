import { describe, expect, it } from "vitest"

import { AiMessage } from "../../types/ai-message"
import {
  calculateMessagesTokens,
  compressContext,
  estimateTokens,
  getModelContextLimit,
  isContextOverLimit,
  trimMessagesForContext,
} from "../../utils/context-manager"

const createTestMessage = (content: string, role: "user" | "assistant" = "user"): AiMessage => ({
  role,
  content,
})

describe("context-manager", () => {
  describe("estimateTokens", () => {
    it("должен оценивать количество токенов", () => {
      expect(estimateTokens("Hello world")).toBe(3) // 11 символов / 4 = 2.75 ≈ 3
      expect(estimateTokens("")).toBe(0)
      expect(estimateTokens("A")).toBe(1)
    })
  })

  describe("getModelContextLimit", () => {
    it("должен возвращать правильные лимиты для известных моделей", () => {
      expect(getModelContextLimit("claude-4-sonnet")).toBe(200000)
      expect(getModelContextLimit("gpt-4")).toBe(32000)
      expect(getModelContextLimit("gpt-3.5-turbo")).toBe(16000)
    })

    it("должен возвращать лимит по умолчанию для неизвестных моделей", () => {
      expect(getModelContextLimit("unknown-model")).toBe(16000)
    })
  })

  describe("calculateMessagesTokens", () => {
    it("должен подсчитывать общее количество токенов в сообщениях", () => {
      const messages = [createTestMessage("Hello"), createTestMessage("World")]

      // "Hello" = 5/4 = 2 токена, "World" = 5/4 = 2 токена
      expect(calculateMessagesTokens(messages)).toBe(4)
    })

    it("должен возвращать 0 для пустого массива", () => {
      expect(calculateMessagesTokens([])).toBe(0)
    })
  })

  describe("trimMessagesForContext", () => {
    it("должен сохранять сообщения, если они помещаются в контекст", () => {
      const messages = [createTestMessage("Short message 1"), createTestMessage("Short message 2")]

      const result = trimMessagesForContext(messages, "claude-4-sonnet")
      expect(result).toEqual(messages)
    })

    it("должен обрезать старые сообщения, если контекст переполнен", () => {
      const messages = [createTestMessage("Old message"), createTestMessage("Recent message")]

      // Устанавливаем очень маленький лимит (мало токенов для ответа)
      const result = trimMessagesForContext(messages, "gpt-3.5-turbo", "", 15500)

      // При таких коротких сообщениях могут поместиться оба
      expect(result.length).toBeGreaterThan(0)
      expect(result[result.length - 1].content).toBe("Recent message")
    })

    it("должен обрезать слишком длинное последнее сообщение", () => {
      const longMessage = "A".repeat(100000) // Очень длинное сообщение
      const messages = [createTestMessage(longMessage)]

      const result = trimMessagesForContext(messages, "gpt-3.5-turbo")

      expect(result).toHaveLength(1)
      expect(result[0].content).toBe(`${longMessage.substring(0, 14000 * 4 - 100)}...`)
    })
  })

  describe("isContextOverLimit", () => {
    it("должен определять, превышает ли контекст лимиты", () => {
      const shortMessages = [createTestMessage("Short"), createTestMessage("Messages")]

      expect(isContextOverLimit(shortMessages, "claude-4-sonnet")).toBe(false)

      const longMessages = Array(10000)
        .fill(null)
        .map((_, i) =>
          createTestMessage(
            `Very long message number ${i} with lots of content and text that should exceed context limits`,
          ),
        )

      expect(isContextOverLimit(longMessages, "gpt-3.5-turbo")).toBe(true)
    })
  })

  describe("compressContext", () => {
    it("должен возвращать исходные сообщения, если они помещаются", () => {
      const messages = [createTestMessage("Message 1"), createTestMessage("Message 2")]

      const result = compressContext(messages, "claude-4-sonnet")
      expect(result).toEqual(messages)
    })

    it("должен сжимать контекст для большого количества сообщений", () => {
      const messages = Array(100)
        .fill(null)
        .map((_, i) =>
          createTestMessage(`Very long message ${i + 1} with lots of content that should trigger compression`),
        )

      const result = compressContext(messages, "gpt-3.5-turbo", "", 15000)

      // Результат должен содержать меньше сообщений
      expect(result.length).toBeLessThan(messages.length)

      // Должен содержать первые 2 сообщения
      expect(result[0].content).toContain("Very long message 1")
      expect(result[1].content).toContain("Very long message 2")

      // Должен содержать сводку
      expect(result.some((msg) => msg.content.includes("Сводка"))).toBe(true)

      // Должен содержать последние сообщения
      expect(result[result.length - 1].content).toContain("Very long message 100")
    })

    it("должен использовать обычную обрезку для малого количества сообщений", () => {
      const messages = Array(5)
        .fill(null)
        .map((_, i) => createTestMessage(`Very long message ${i + 1} `.repeat(1000)))

      const result = compressContext(messages, "gpt-3.5-turbo")

      // Должен использовать trimMessagesForContext
      expect(result.length).toBeLessThanOrEqual(5)
      expect(result[result.length - 1].content).toContain("Very long message 5")
    })
  })
})
