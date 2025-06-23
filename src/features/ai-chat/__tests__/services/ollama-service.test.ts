import { beforeEach, describe, expect, it, vi } from "vitest"

import { OllamaService, OLLAMA_MODELS } from "../../services/ollama-service"
import { AiMessage } from "../../types/ai-message"
import { StreamingOptions } from "../../types/streaming"

// Mock fetch globally
global.fetch = vi.fn()

describe("OllamaService", () => {
  let service: OllamaService
  const defaultBaseUrl = "http://localhost:11434"

  const mockMessages: AiMessage[] = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" },
  ]

  const mockApiResponse = {
    model: "llama2",
    created_at: "2023-12-01T00:00:00Z",
    message: {
      role: "assistant",
      content: "I'm doing well, thank you! How can I help you today?",
    },
    done: true,
    total_duration: 1234567890,
    load_duration: 123456789,
    prompt_eval_count: 10,
    prompt_eval_duration: 12345678,
    eval_count: 15,
    eval_duration: 23456789,
  }

  const mockModelsList = {
    models: [
      {
        name: "llama2:latest",
        modified_at: "2023-12-01T00:00:00Z",
        size: 3826793472,
        digest: "abc123",
        details: {
          format: "gguf",
          family: "llama",
          parameter_size: "7B",
          quantization_level: "Q4_0",
        },
      },
      {
        name: "mistral:latest",
        modified_at: "2023-12-01T00:00:00Z",
        size: 4404020224,
        digest: "def456",
        details: {
          format: "gguf",
          family: "mistral",
          parameter_size: "7B",
          quantization_level: "Q4_0",
        },
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset singleton instance
    // @ts-expect-error - accessing private property for testing
    OllamaService.instance = undefined

    service = OllamaService.getInstance()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = OllamaService.getInstance()
      const instance2 = OllamaService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it("should accept custom base URL on first instantiation", () => {
      // @ts-expect-error - accessing private property for testing
      OllamaService.instance = undefined
      const customUrl = "http://custom-server:11434"
      const instance = OllamaService.getInstance(customUrl)
      expect(instance.getBaseUrl()).toBe(customUrl)
    })
  })

  describe("setBaseUrl and getBaseUrl", () => {
    it("should update base URL", () => {
      const newUrl = "http://remote-server:11434"
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      service.setBaseUrl(newUrl)

      expect(service.getBaseUrl()).toBe(newUrl)
      expect(consoleSpy).toHaveBeenCalledWith("Ollama base URL updated:", newUrl)

      consoleSpy.mockRestore()
    })

    it("should use default base URL if not set", () => {
      expect(service.getBaseUrl()).toBe(defaultBaseUrl)
    })
  })

  describe("isAvailable", () => {
    it("should return true when server is available", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response)

      const result = await service.isAvailable()

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(`${defaultBaseUrl}/api/tags`, {
        method: "GET",
      })
    })

    it("should return false when server is not available", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error("Connection refused"))

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const result = await service.isAvailable()

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith("Ollama server is not available:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should return false when server returns error", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      const result = await service.isAvailable()

      expect(result).toBe(false)
    })
  })

  describe("getInstalledModels", () => {
    it("should return list of installed models", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockModelsList,
      } as Response)

      const models = await service.getInstalledModels()

      expect(models).toHaveLength(2)
      expect(models[0].name).toBe("llama2:latest")
      expect(models[1].name).toBe("mistral:latest")
      expect(mockFetch).toHaveBeenCalledWith(`${defaultBaseUrl}/api/tags`, {
        method: "GET",
      })
    })

    it("should handle API errors", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      await expect(service.getInstalledModels()).rejects.toThrow("Ошибка Ollama API: 500")
    })

    it("should handle network errors", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error("Network error"))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(service.getInstalledModels()).rejects.toThrow("Network error")

      expect(consoleSpy).toHaveBeenCalledWith(
        "Ошибка при получении списка моделей Ollama:",
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it("should return empty array if no models in response", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response)

      const models = await service.getInstalledModels()

      expect(models).toEqual([])
    })
  })

  describe("sendRequest", () => {
    it("should send request with default options", async () => {
      const mockFetch = vi.mocked(fetch)
      // First call to isAvailable
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)
      // Second call to sendRequest
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      const result = await service.sendRequest(OLLAMA_MODELS.LLAMA2, mockMessages)

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenNthCalledWith(2, `${defaultBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODELS.LLAMA2,
          messages: mockMessages,
          stream: false,
          options: {
            temperature: 0.7,
            top_k: 40,
            top_p: 0.9,
            repeat_penalty: 1.1,
            num_ctx: 2048,
          },
        }),
      })

      expect(result).toBe(mockApiResponse.message.content)
    })

    it("should send request with custom options", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      const customOptions = {
        temperature: 0.9,
        top_k: 50,
        top_p: 0.95,
        repeat_penalty: 1.2,
        num_ctx: 4096,
      }

      await service.sendRequest(OLLAMA_MODELS.MISTRAL, mockMessages, customOptions)

      const secondCall = mockFetch.mock.calls[1]
      const requestBody = JSON.parse(secondCall[1]?.body as string)

      expect(requestBody.options).toEqual(customOptions)
    })

    it("should throw error when server is not available", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
      } as Response)

      await expect(
        service.sendRequest(OLLAMA_MODELS.LLAMA2, mockMessages)
      ).rejects.toThrow("Ollama сервер недоступен. Убедитесь, что Ollama запущен на http://localhost:11434")
    })

    it("should handle API errors", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Model not found",
      } as Response)

      await expect(
        service.sendRequest("unknown-model", mockMessages)
      ).rejects.toThrow("Ошибка Ollama API: 404 Model not found")
    })

    it("should handle network errors", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(
        service.sendRequest(OLLAMA_MODELS.LLAMA2, mockMessages)
      ).rejects.toThrow("Network error")

      expect(consoleSpy).toHaveBeenCalledWith(
        "Ошибка при отправке запроса к Ollama API:",
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

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

  describe("sendStreamingRequest", () => {

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
        '{"model":"llama2","created_at":"2023-12-01T00:00:00Z","message":{"role":"assistant","content":"Hello"},"done":false}\n',
        '{"model":"llama2","created_at":"2023-12-01T00:00:00Z","message":{"role":"assistant","content":" world"},"done":false}\n',
        '{"model":"llama2","created_at":"2023-12-01T00:00:00Z","message":{"role":"assistant","content":"!"},"done":true}\n',
      ]

      const mockReader = createMockReader(chunks)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response) // isAvailable
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as Response)

      await service.sendStreamingRequest(
        OLLAMA_MODELS.LLAMA2,
        mockMessages,
        streamingOptions
      )

      expect(onContent).toHaveBeenCalledWith("Hello")
      expect(onContent).toHaveBeenCalledWith(" world")
      expect(onContent).toHaveBeenCalledWith("!")
      expect(onComplete).toHaveBeenCalledWith("Hello world!")
      expect(onError).not.toHaveBeenCalled()
      expect(mockReader.releaseLock).toHaveBeenCalled()
    })

    it("should handle server unavailable error", async () => {
      const onError = vi.fn()
      const streamingOptions: StreamingOptions = { onError }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({ ok: false } as Response)

      await expect(
        service.sendStreamingRequest(OLLAMA_MODELS.LLAMA2, mockMessages, streamingOptions)
      ).rejects.toThrow("Ollama сервер недоступен")

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it("should handle API errors in streaming", async () => {
      const onError = vi.fn()
      const streamingOptions: StreamingOptions = { onError }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal server error",
      } as Response)

      await expect(
        service.sendStreamingRequest(OLLAMA_MODELS.LLAMA2, mockMessages, streamingOptions)
      ).rejects.toThrow("Ошибка Ollama API: 500 Internal server error")

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it("should handle missing response body", async () => {
      const onError = vi.fn()
      const streamingOptions: StreamingOptions = { onError }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      } as Response)

      await expect(
        service.sendStreamingRequest(OLLAMA_MODELS.LLAMA2, mockMessages, streamingOptions)
      ).rejects.toThrow("Не удалось получить поток данных")

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it("should handle parse errors in streaming chunks", async () => {
      const onContent = vi.fn()
      const onComplete = vi.fn()
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const chunks = [
        'invalid json\n',
        '{"model":"llama2","created_at":"2023-12-01T00:00:00Z","message":{"role":"assistant","content":"Valid"},"done":false}\n',
        '{"model":"llama2","created_at":"2023-12-01T00:00:00Z","message":{},"done":true}\n',
      ]

      const mockReader = createMockReader(chunks)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as Response)

      await service.sendStreamingRequest(OLLAMA_MODELS.LLAMA2, mockMessages, {
        onContent,
        onComplete,
      })

      expect(consoleSpy).toHaveBeenCalledWith("Ошибка парсинга Ollama события:", expect.any(Error))
      expect(onContent).toHaveBeenCalledWith("Valid")
      expect(onComplete).toHaveBeenCalledWith("Valid")

      consoleSpy.mockRestore()
    })

    it("should handle abort signal", async () => {
      const controller = new AbortController()
      const onError = vi.fn()

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"))

      await expect(
        service.sendStreamingRequest(OLLAMA_MODELS.LLAMA2, mockMessages, {
          signal: controller.signal,
          onError,
        })
      ).rejects.toThrow("Aborted")

      expect(onError).toHaveBeenCalledWith(expect.any(DOMException))
    })

    it("should handle empty lines in stream", async () => {
      const onComplete = vi.fn()

      const chunks = [
        '\n\n{"model":"llama2","created_at":"2023-12-01T00:00:00Z","message":{"role":"assistant","content":"Test"},"done":true}\n\n',
      ]

      const mockReader = createMockReader(chunks)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as Response)

      await service.sendStreamingRequest(OLLAMA_MODELS.LLAMA2, mockMessages, {
        onComplete,
      })

      expect(onComplete).toHaveBeenCalledWith("Test")
    })

    it("should use custom options in streaming", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => createMockReader(['{"done":true}']),
        },
      } as Response)

      const customOptions = {
        temperature: 0.5,
        top_k: 30,
        top_p: 0.8,
        repeat_penalty: 1.0,
        num_ctx: 1024,
      }

      await service.sendStreamingRequest(OLLAMA_MODELS.CODELLAMA, mockMessages, customOptions)

      const secondCall = mockFetch.mock.calls[1]
      const requestBody = JSON.parse(secondCall[1]?.body as string)

      expect(requestBody.stream).toBe(true)
      expect(requestBody.options).toEqual(customOptions)
    })
  })

  describe("pullModel", () => {
    it("should send pull request for model", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response)

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await service.pullModel(OLLAMA_MODELS.MISTRAL)

      expect(mockFetch).toHaveBeenCalledWith(`${defaultBaseUrl}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: OLLAMA_MODELS.MISTRAL }),
      })

      expect(consoleSpy).toHaveBeenCalledWith(`Начато скачивание модели: ${OLLAMA_MODELS.MISTRAL}`)

      consoleSpy.mockRestore()
    })

    it("should handle pull errors", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
      } as Response)

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(service.pullModel("invalid-model")).rejects.toThrow(
        "Ошибка при скачивании модели: 400"
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        "Ошибка при скачивании модели Ollama:",
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it("should handle network errors during pull", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error("Network error"))

      await expect(service.pullModel(OLLAMA_MODELS.LLAMA2)).rejects.toThrow("Network error")
    })
  })

  describe("getAvailableModels", () => {
    it("should return list of available models", () => {
      const models = service.getAvailableModels()

      expect(models).toHaveLength(8)
      expect(models[0]).toEqual({
        id: OLLAMA_MODELS.LLAMA2,
        name: "Llama 2 (7B)",
        description: "Базовая модель Meta Llama 2 с 7 миллиардами параметров",
        size: "3.8GB",
      })

      expect(models.find(m => m.id === OLLAMA_MODELS.MISTRAL)).toEqual({
        id: OLLAMA_MODELS.MISTRAL,
        name: "Mistral (7B)",
        description: "Высокопроизводительная модель от Mistral AI",
        size: "4.1GB",
      })

      expect(models.find(m => m.id === OLLAMA_MODELS.CODELLAMA_13B)).toEqual({
        id: OLLAMA_MODELS.CODELLAMA_13B,
        name: "Code Llama (13B)",
        description: "Улучшенная модель для программирования",
        size: "7.3GB",
      })
    })

    it("should include all defined models", () => {
      const models = service.getAvailableModels()
      const modelIds = models.map(m => m.id)

      expect(modelIds).toContain(OLLAMA_MODELS.LLAMA2)
      expect(modelIds).toContain(OLLAMA_MODELS.LLAMA2_13B)
      expect(modelIds).toContain(OLLAMA_MODELS.MISTRAL)
      expect(modelIds).toContain(OLLAMA_MODELS.CODELLAMA)
      expect(modelIds).toContain(OLLAMA_MODELS.CODELLAMA_13B)
      expect(modelIds).toContain(OLLAMA_MODELS.VICUNA)
      expect(modelIds).toContain(OLLAMA_MODELS.ORCA_MINI)
      expect(modelIds).toContain(OLLAMA_MODELS.NEURAL_CHAT)
    })
  })

  describe("edge cases", () => {
    it("should handle custom base URL with trailing slash", () => {
      service.setBaseUrl("http://localhost:11434/")
      expect(service.getBaseUrl()).toBe("http://localhost:11434/")
    })

    it("should handle empty messages array", async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      await service.sendRequest(OLLAMA_MODELS.LLAMA2, [])

      const secondCall = mockFetch.mock.calls[1]
      const requestBody = JSON.parse(secondCall[1]?.body as string)

      expect(requestBody.messages).toEqual([])
    })

    it("should handle streaming with no content in messages", async () => {
      const onComplete = vi.fn()

      const chunks = [
        '{"model":"llama2","created_at":"2023-12-01T00:00:00Z","done":true}\n',
      ]

      const mockReader = createMockReader(chunks)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as Response)

      await service.sendStreamingRequest(OLLAMA_MODELS.LLAMA2, mockMessages, {
        onComplete,
      })

      expect(onComplete).toHaveBeenCalledWith("")
    })
  })
})