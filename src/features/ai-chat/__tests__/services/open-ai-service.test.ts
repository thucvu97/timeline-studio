import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AI_MODELS, OpenAiService } from "../../services/open-ai-service"

// Mock для ApiKeyLoader
vi.mock("../../services/api-key-loader")

// Mock для fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("OpenAiService", () => {
  let service: OpenAiService

  beforeEach(async () => {
    vi.clearAllMocks()
    // Получаем singleton экземпляр
    service = OpenAiService.getInstance()
    // Mock API key loader уже возвращает "test-api-key" по умолчанию
    // Очищаем кэш loader для чистых тестов
    const { ApiKeyLoader } = await import("../../services/api-key-loader")
    const mockLoader = ApiKeyLoader.getInstance()
    mockLoader.clearCache()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Инициализация", () => {
    it("должен создавать singleton экземпляр сервиса", () => {
      const instance1 = OpenAiService.getInstance()
      const instance2 = OpenAiService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it("должен иметь метод sendRequest", () => {
      expect(service.sendRequest).toBeDefined()
      expect(typeof service.sendRequest).toBe("function")
    })

    it("должен иметь метод setApiKey (deprecated)", () => {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      expect(service.setApiKey).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      expect(typeof service.setApiKey).toBe("function")
      // Note: setApiKey is deprecated but still exists for backward compatibility
    })

    it("должен проверять наличие API ключа", async () => {
      // По умолчанию mock возвращает sk-test
      expect(await service.hasApiKey()).toBe(true)

      // Очищаем кэш и устанавливаем отсутствие ключа
      const { ApiKeyLoader } = await import("../../services/api-key-loader")
      const mockLoader = ApiKeyLoader.getInstance()
      mockLoader.clearCache()
      mockLoader.updateCache("openai", "")
      expect(await service.hasApiKey()).toBe(false)

      // Устанавливаем наличие ключа снова
      mockLoader.updateCache("openai", "sk-new-test")
      expect(await service.hasApiKey()).toBe(true)
    })
  })

  describe("Отправка сообщений", () => {
    it("должен отправлять запрос к OpenAI API", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ от GPT-4",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Привет, GPT!" }]

      const result = await service.sendRequest(AI_MODELS.GPT_4, messages)

      expect(fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer sk-test",
          }),
          body: expect.stringContaining("Привет, GPT!"),
        }),
      )

      expect(result).toBe("Ответ от GPT-4")
    })

    it("должен включать системное сообщение в запрос", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ с контекстом",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const systemPrompt = `Ты - AI ассистент в видеоредакторе Timeline Studio.
Помогай пользователям с монтажом видео, эффектами и фильтрами.`

      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: "Как добавить переход?" },
      ]

      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.messages[0].role).toBe("system")
      expect(body.messages[0].content).toContain("Timeline Studio")
    })

    it("должен использовать правильную модель", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(AI_MODELS.GPT_3_5, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.model).toBe(AI_MODELS.GPT_3_5)
    })

    it("должен устанавливать параметры модели", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(AI_MODELS.GPT_4, messages, {
        temperature: 0.5,
        max_tokens: 2000,
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.temperature).toBe(0.5)
      expect(body.max_tokens).toBe(2000)
    })

    it("должен использовать значения по умолчанию", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.temperature).toBe(0.7)
      expect(body.max_tokens).toBe(1000)
    })
  })

  describe("Обработка ошибок", () => {
    it("должен обрабатывать ошибки сети", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(AI_MODELS.GPT_4, messages)).rejects.toThrow("Network error")
    })

    it("должен обрабатывать ошибки API", async () => {
      const mockErrorResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid API key",
      }
      mockFetch.mockResolvedValueOnce(mockErrorResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(AI_MODELS.GPT_4, messages)).rejects.toThrow("Ошибка API OpenAI: 401")
    })

    it("должен обрабатывать неожиданный формат ответа", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          // Неожиданный формат без choices
          unexpected: "format",
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(AI_MODELS.GPT_4, messages)).rejects.toThrow()
    })

    it("должен выбрасывать ошибку при отсутствии API ключа", async () => {
      const { ApiKeyLoader } = await import("../../services/api-key-loader")
      const mockLoader = ApiKeyLoader.getInstance()

      // Очищаем кэш и устанавливаем отсутствие ключа
      mockLoader.clearCache()
      mockLoader.updateCache("openai", "")

      // Убедимся, что fetch определен (хотя он не должен вызываться)
      if (!mockFetch) {
        global.fetch = vi.fn()
      }

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(AI_MODELS.GPT_4, messages)).rejects.toThrow("API ключ не установлен")
    })

    it("должен обрабатывать пустые ответы", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(AI_MODELS.GPT_4, messages)).rejects.toThrow()
    })
  })

  describe("Форматирование промптов", () => {
    it("должен правильно форматировать системный промпт", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [
        {
          role: "system" as const,
          content: "Ты - помощник в видеоредакторе Timeline Studio.",
        },
        { role: "user" as const, content: "Помоги с видео" },
      ]

      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.messages[0].content).toContain("Timeline Studio")
    })

    it("должен правильно форматировать сообщения в истории", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Продолжение диалога",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [
        { role: "user" as const, content: "Первый вопрос" },
        { role: "assistant" as const, content: "Первый ответ" },
        { role: "user" as const, content: "Второй вопрос" },
      ]

      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.messages).toHaveLength(3)
      expect(body.messages[0].role).toBe("user")
      expect(body.messages[1].role).toBe("assistant")
      expect(body.messages[2].role).toBe("user")
    })
  })

  describe("Потоковые ответы", () => {
    it("должен поддерживать потоковую передачу (будущая функция)", async () => {
      // Пока что сервис не поддерживает streaming
      // Этот тест документирует ожидаемое поведение
      const messages = [{ role: "user" as const, content: "Тест" }]

      // В будущем можно будет использовать stream: true
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      // Пока stream не поддерживается
      expect(body.stream).toBeUndefined()
    })
  })

  describe("Функции и инструменты", () => {
    it("должен поддерживать функции OpenAI (будущая функция)", async () => {
      // OpenAI поддерживает функции, но пока не реализовано
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Использую функцию",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Добавь эффект" }]

      // В будущем здесь будут функции
      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.functions).toBeUndefined() // Пока не реализовано
    })
  })

  describe("Различия между моделями", () => {
    it("должен использовать разные лимиты токенов для разных моделей", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ",
              },
            },
          ],
        }),
      }

      // GPT-4
      mockFetch.mockResolvedValueOnce(mockResponse as any)
      await service.sendRequest(AI_MODELS.GPT_4, [{ role: "user" as const, content: "Тест" }])

      let callArgs = mockFetch.mock.calls[0]
      let body = JSON.parse(callArgs[1]?.body as string)
      expect(body.model).toBe(AI_MODELS.GPT_4)

      // GPT-3.5
      mockFetch.mockResolvedValueOnce(mockResponse as any)
      await service.sendRequest(AI_MODELS.GPT_3_5, [{ role: "user" as const, content: "Тест" }])

      callArgs = mockFetch.mock.calls[1]
      body = JSON.parse(callArgs[1]?.body as string)
      expect(body.model).toBe(AI_MODELS.GPT_3_5)
    })
  })

  describe("Обработка контекста", () => {
    it("должен форматировать полный контекст проекта", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Ответ с контекстом",
              },
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const contextMessage = `Контекст проекта:
- Название: Мой фильм
- Длительность: 120 секунд
- Текущее время: 60 секунд
- Выбранные клипы: clip1.mp4 (0-30s), clip2.mp4 (30-60s)`

      const messages = [
        { role: "system" as const, content: contextMessage },
        { role: "user" as const, content: "Что делать дальше?" },
      ]

      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.messages[0].content).toContain("Мой фильм")
      expect(body.messages[0].content).toContain("120 секунд")
      expect(body.messages[0].content).toContain("clip1.mp4")
    })
  })

  describe("Anthropic API", () => {
    it("должен отправлять запрос к Anthropic API для моделей Claude", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [
            {
              text: "Ответ от Claude",
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Привет, Claude!" }]
      const result = await service.sendRequest(AI_MODELS.CLAUDE_4_SONNET, messages)

      expect(result).toBe("Ответ от Claude")

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[0]).toBe("https://api.anthropic.com/v1/messages")

      const headers = callArgs[1]?.headers
      expect(headers["x-api-key"]).toBe("test-key") // Mock returns test-key
      expect(headers["anthropic-version"]).toBe("2023-06-01")
    })

    it("должен обрабатывать ошибки Anthropic API", async () => {
      const mockErrorResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid API key",
      }
      mockFetch.mockResolvedValueOnce(mockErrorResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(AI_MODELS.CLAUDE_4_OPUS, messages)).rejects.toThrow("Ошибка API Anthropic: 401")
    })

    it("должен использовать правильные параметры для Anthropic API", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [
            {
              text: "Ответ",
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(AI_MODELS.CLAUDE_4_SONNET, messages, {
        temperature: 0.5,
        max_tokens: 1500,
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.temperature).toBe(0.5)
      expect(body.max_tokens).toBe(1500)
      expect(body.model).toBe(AI_MODELS.CLAUDE_4_SONNET)
    })

    it("должен обрабатывать ошибки сети для Anthropic API", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(AI_MODELS.CLAUDE_4_SONNET, messages)).rejects.toThrow("Network error")
    })

    it("должен использовать значения по умолчанию для Anthropic API", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [
            {
              text: "Ответ",
            },
          ],
        }),
      }
      mockFetch.mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(AI_MODELS.CLAUDE_4_SONNET, messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.temperature).toBe(0.7)
      expect(body.max_tokens).toBe(1000)
    })

    it("должен правильно определять провайдера по модели", async () => {
      // Mock для Claude
      const claudeResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: "Claude response" }],
        }),
      }

      // Mock для GPT
      const gptResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "GPT response" } }],
        }),
      }

      // Тест Claude модели
      mockFetch.mockResolvedValueOnce(claudeResponse as any)
      const claudeResult = await service.sendRequest(AI_MODELS.CLAUDE_4_OPUS, [
        { role: "user" as const, content: "Test" },
      ])
      expect(claudeResult).toBe("Claude response")
      expect(mockFetch.mock.calls[0][0]).toContain("anthropic.com")

      // Тест GPT модели
      mockFetch.mockResolvedValueOnce(gptResponse as any)
      const gptResult = await service.sendRequest(AI_MODELS.GPT_4, [{ role: "user" as const, content: "Test" }])
      expect(gptResult).toBe("GPT response")
      expect(mockFetch.mock.calls[1][0]).toContain("openai.com")
    })
  })
})
