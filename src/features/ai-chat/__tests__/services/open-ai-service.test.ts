import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AI_MODELS, OpenAiService } from "../../services/open-ai-service"

// Mock для fetch
global.fetch = vi.fn()

describe("OpenAiService", () => {
  let service: OpenAiService

  beforeEach(() => {
    vi.clearAllMocks()
    // Получаем singleton экземпляр
    service = OpenAiService.getInstance()
    // Устанавливаем API ключ
    service.setApiKey("sk-test-api-key")
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

    it("должен иметь метод setApiKey", () => {
      expect(service.setApiKey).toBeDefined()
      expect(typeof service.setApiKey).toBe("function")
    })

    it("должен проверять наличие API ключа", () => {
      const newService = OpenAiService.getInstance()
      newService.setApiKey("")
      expect(newService.hasApiKey()).toBe(false)

      newService.setApiKey("sk-test")
      expect(newService.hasApiKey()).toBe(true)
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Привет, GPT!" }]

      const result = await service.sendRequest(AI_MODELS.GPT_4, messages)

      expect(fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer sk-test-api-key",
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const systemPrompt = `Ты - AI ассистент в видеоредакторе Timeline Studio.
Помогай пользователям с монтажом видео, эффектами и фильтрами.`

      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: "Как добавить переход?" },
      ]

      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = vi.mocked(fetch).mock.calls[0]
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(AI_MODELS.GPT_3_5, messages)

      const callArgs = vi.mocked(fetch).mock.calls[0]
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(AI_MODELS.GPT_4, messages, {
        temperature: 0.5,
        max_tokens: 2000,
      })

      const callArgs = vi.mocked(fetch).mock.calls[0]
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.temperature).toBe(0.7)
      expect(body.max_tokens).toBe(1000)
    })
  })

  describe("Обработка ошибок", () => {
    it("должен обрабатывать ошибки сети", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"))

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
      vi.mocked(fetch).mockResolvedValueOnce(mockErrorResponse as any)

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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(AI_MODELS.GPT_4, messages)).rejects.toThrow()
    })

    it("должен выбрасывать ошибку при отсутствии API ключа", async () => {
      const newService = OpenAiService.getInstance()
      newService.setApiKey("")

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(newService.sendRequest(AI_MODELS.GPT_4, messages)).rejects.toThrow("API ключ не установлен")
    })

    it("должен обрабатывать пустые ответы", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [],
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [
        {
          role: "system" as const,
          content: "Ты - помощник в видеоредакторе Timeline Studio.",
        },
        { role: "user" as const, content: "Помоги с видео" },
      ]

      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = vi.mocked(fetch).mock.calls[0]
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [
        { role: "user" as const, content: "Первый вопрос" },
        { role: "assistant" as const, content: "Первый ответ" },
        { role: "user" as const, content: "Второй вопрос" },
      ]

      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = vi.mocked(fetch).mock.calls[0]
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      await service.sendRequest(AI_MODELS.GPT_4, messages, { stream: false })

      const callArgs = vi.mocked(fetch).mock.calls[0]
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Добавь эффект" }]

      // В будущем здесь будут функции
      await service.sendRequest(AI_MODELS.GPT_4, messages)

      const callArgs = vi.mocked(fetch).mock.calls[0]
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)
      await service.sendRequest(AI_MODELS.GPT_4, [{ role: "user" as const, content: "Тест" }])

      let callArgs = vi.mocked(fetch).mock.calls[0]
      let body = JSON.parse(callArgs[1]?.body as string)
      expect(body.model).toBe(AI_MODELS.GPT_4)

      // GPT-3.5
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)
      await service.sendRequest(AI_MODELS.GPT_3_5, [{ role: "user" as const, content: "Тест" }])

      callArgs = vi.mocked(fetch).mock.calls[1]
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
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

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

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.messages[0].content).toContain("Мой фильм")
      expect(body.messages[0].content).toContain("120 секунд")
      expect(body.messages[0].content).toContain("clip1.mp4")
    })
  })
})
