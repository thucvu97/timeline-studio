import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiKeyLoader } from "../../services/api-key-loader"
import { DEEPSEEK_MODELS, DeepSeekService } from "../../services/deepseek-service"
import { AiMessage } from "../../types/ai-message"
import { StreamingOptions } from "../../types/streaming"

// Mock dependencies
vi.mock("../../services/api-key-loader", () => ({
  ApiKeyLoader: {
    getInstance: vi.fn(),
  },
}))

// Mock fetch globally
global.fetch = vi.fn()

// Helper function to create mock stream reader
const createMockReader = (chunks: string[]) => {
  let index = 0
  return {
    read: vi.fn().mockImplementation(async () => {
      if (index >= chunks.length) {
        return { done: true, value: undefined }
      }
      const encoder = new TextEncoder()
      const value = encoder.encode(chunks[index])
      index++
      return { done: false, value }
    }),
    releaseLock: vi.fn(),
  }
}

describe("DeepSeekService", () => {
  let service: DeepSeekService
  let mockApiKeyLoader: ApiKeyLoader

  const mockApiKey = "test-deepseek-api-key"
  const mockMessages: AiMessage[] = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" },
  ]

  const mockApiResponse = {
    id: "chatcmpl-123",
    object: "chat.completion",
    created: 1677649420,
    model: "deepseek-chat",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "I'm doing well, thank you! How can I help you today?",
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 15,
      total_tokens: 25,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset singleton instance
    // @ts-expect-error - accessing private property for testing
    DeepSeekService.instance = undefined

    // Setup mock ApiKeyLoader
    mockApiKeyLoader = {
      getInstance: vi.fn(),
      getApiKey: vi.fn(),
      updateCache: vi.fn(),
    } as any

    // Setup default return value
    vi.mocked(mockApiKeyLoader.getApiKey).mockResolvedValue(mockApiKey)

    vi.mocked(ApiKeyLoader.getInstance).mockReturnValue(mockApiKeyLoader)

    service = DeepSeekService.getInstance()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = DeepSeekService.getInstance()
      const instance2 = DeepSeekService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("API key management", () => {
    it("should use API key loader for key management", () => {
      // Test that the service properly integrates with ApiKeyLoader
      expect(mockApiKeyLoader.updateCache).toBeDefined()
      expect(mockApiKeyLoader.getApiKey).toBeDefined()

      // Verify service uses the loader instance
      expect(vi.mocked(ApiKeyLoader.getInstance)).toHaveBeenCalled()
    })

    it("should handle API key updates through loader", () => {
      const newApiKey = "new-api-key"

      // Simulate updating API key through the loader
      mockApiKeyLoader.updateCache("deepseek", newApiKey)

      expect(mockApiKeyLoader.updateCache).toHaveBeenCalledWith("deepseek", newApiKey)
    })
  })

  describe("hasApiKey", () => {
    it("should return true when API key exists", async () => {
      vi.mocked(mockApiKeyLoader.getApiKey).mockResolvedValue(mockApiKey)

      const result = await service.hasApiKey()

      expect(result).toBe(true)
      expect(mockApiKeyLoader.getApiKey).toHaveBeenCalledWith("deepseek")
    })

    it("should return false when API key is empty", async () => {
      vi.mocked(mockApiKeyLoader.getApiKey).mockResolvedValue("")

      const result = await service.hasApiKey()

      expect(result).toBe(false)
    })

    it("should return false when API key is null", async () => {
      vi.mocked(mockApiKeyLoader.getApiKey).mockResolvedValue(null)

      const result = await service.hasApiKey()

      expect(result).toBe(false)
    })
  })

  describe("sendRequest", () => {
    it("should send request with default options", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as unknown as Response)

      const result = await service.sendRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages)

      expect(mockFetch).toHaveBeenCalledWith("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockApiKey}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODELS.DEEPSEEK_CHAT,
          messages: mockMessages,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1.0,
          presence_penalty: 0.0,
          frequency_penalty: 0.0,
        }),
      })

      expect(result).toBe(mockApiResponse.choices[0].message.content)
    })

    it("should send request with custom options", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as unknown as Response)

      const customOptions = {
        temperature: 0.9,
        max_tokens: 2000,
        top_p: 0.95,
        presence_penalty: 0.5,
        frequency_penalty: 0.5,
      }

      await service.sendRequest(DEEPSEEK_MODELS.DEEPSEEK_CODER, mockMessages, customOptions)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"temperature":0.9'),
        }),
      )
    })

    it("should throw error when API key is not set", async () => {
      vi.mocked(mockApiKeyLoader.getApiKey).mockResolvedValue(null)

      await expect(service.sendRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages)).rejects.toThrow(
        "DeepSeek API ключ не установлен",
      )
    })

    it("should handle API errors", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as unknown as Response)

      await expect(service.sendRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages)).rejects.toThrow(
        "Ошибка DeepSeek API: 401 Unauthorized",
      )
    })

    it("should handle network errors", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error("Network error"))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(service.sendRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages)).rejects.toThrow("Network error")

      expect(consoleSpy).toHaveBeenCalledWith("Ошибка при отправке запроса к DeepSeek API:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("sendStreamingRequest", () => {
    const createMockReader = (chunks: string[]) => {
      let index = 0
      return {
        read: vi.fn().mockImplementation(async () => {
          if (index >= chunks.length) {
            return { done: true, value: undefined }
          }
          const encoder = new TextEncoder()
          const value = encoder.encode(chunks[index])
          index++
          return { done: false, value }
        }),
        releaseLock: vi.fn(),
      }
    }

    it("should handle streaming response", async () => {
      const onContent = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const streamingOptions: StreamingOptions = {
        onContent,
        onComplete,
        onError,
      }

      const chunks = [
        'data: {"id":"1","object":"chat.completion.chunk","created":1234567890,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n',
        'data: {"id":"1","object":"chat.completion.chunk","created":1234567890,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}\n',
        "data: [DONE]\n",
      ]

      const mockReader = createMockReader(chunks)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response)

      await service.sendStreamingRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages, streamingOptions)

      expect(onContent).toHaveBeenCalledWith("Hello")
      expect(onContent).toHaveBeenCalledWith(" world")
      expect(onComplete).toHaveBeenCalledWith("Hello world")
      expect(onError).not.toHaveBeenCalled()
      expect(mockReader.releaseLock).toHaveBeenCalled()
    })

    it("should handle API errors in streaming", async () => {
      const onError = vi.fn()
      const streamingOptions: StreamingOptions = { onError }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      } as unknown as Response)

      await expect(
        service.sendStreamingRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages, streamingOptions),
      ).rejects.toThrow("Ошибка DeepSeek API: 429 Rate limit exceeded")

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it("should handle missing API key in streaming", async () => {
      vi.mocked(mockApiKeyLoader.getApiKey).mockResolvedValue(null)
      const onError = vi.fn()
      const streamingOptions: StreamingOptions = { onError }

      await expect(
        service.sendStreamingRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages, streamingOptions),
      ).rejects.toThrow("DeepSeek API ключ не установлен")

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it("should handle missing response body", async () => {
      const onError = vi.fn()
      const streamingOptions: StreamingOptions = { onError }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      } as unknown as Response)

      await expect(
        service.sendStreamingRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages, streamingOptions),
      ).rejects.toThrow("Не удалось получить поток данных")

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it("should handle parse errors in streaming chunks", async () => {
      const onContent = vi.fn()
      const onComplete = vi.fn()
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const chunks = [
        'data: {"valid":"json"}\n',
        "data: invalid json\n",
        'data: {"id":"1","object":"chat.completion.chunk","created":1234567890,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n',
        "data: [DONE]\n",
      ]

      const mockReader = createMockReader(chunks)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response)

      await service.sendStreamingRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages, {
        onContent,
        onComplete,
      })

      expect(consoleSpy).toHaveBeenCalledWith("Ошибка парсинга SSE события:", expect.any(Error))
      expect(onContent).toHaveBeenCalledWith("Hello")
      expect(onComplete).toHaveBeenCalledWith("Hello")

      consoleSpy.mockRestore()
    })

    it("should handle abort signal", async () => {
      const controller = new AbortController()
      const onError = vi.fn()

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"))

      await expect(
        service.sendStreamingRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages, {
          signal: controller.signal,
          onError,
        }),
      ).rejects.toThrow("Aborted")

      expect(onError).toHaveBeenCalledWith(expect.any(DOMException))
    })
  })

  describe("getAvailableModels", () => {
    it("should return all available models", () => {
      const models = service.getAvailableModels()

      expect(models).toHaveLength(3)
      expect(models).toContainEqual({
        id: DEEPSEEK_MODELS.DEEPSEEK_R1,
        name: "DeepSeek R1",
        description: "Последняя модель DeepSeek с улучшенными возможностями рассуждения",
      })
      expect(models).toContainEqual({
        id: DEEPSEEK_MODELS.DEEPSEEK_CHAT,
        name: "DeepSeek Chat",
        description: "Базовая модель DeepSeek для общения",
      })
      expect(models).toContainEqual({
        id: DEEPSEEK_MODELS.DEEPSEEK_CODER,
        name: "DeepSeek Coder",
        description: "Специализированная модель для программирования",
      })
    })
  })

  describe("streaming edge cases", () => {
    it("should handle empty chunks", async () => {
      const onComplete = vi.fn()
      const chunks = ["", "data: [DONE]\n"]

      const mockReader = createMockReader(chunks)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response)

      await service.sendStreamingRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages, {
        onComplete,
      })

      expect(onComplete).toHaveBeenCalledWith("")
    })

    it("should handle chunks without newlines", async () => {
      const onContent = vi.fn()
      const onComplete = vi.fn()

      const chunks = [
        'data: {"id":"1","object":"chat.completion.chunk","created":1234567890,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"Test"},"finish_reason":null}]}\n\ndata: [DONE]\n\n',
      ]

      const mockReader = createMockReader(chunks)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response)

      await service.sendStreamingRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, mockMessages, {
        onContent,
        onComplete,
      })

      expect(onContent).toHaveBeenCalledWith("Test")
      expect(onComplete).toHaveBeenCalledWith("Test")
    })
  })
})
