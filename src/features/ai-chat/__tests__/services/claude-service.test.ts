import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CLAUDE_MODELS, ClaudeService } from "../../components/claude-service"

// Mock для fetch
global.fetch = vi.fn()

describe("ClaudeService", () => {
  let service: ClaudeService

  beforeEach(() => {
    vi.clearAllMocks()
    // Получаем singleton экземпляр
    service = ClaudeService.getInstance()
    // Устанавливаем API ключ
    service.setApiKey("test-api-key")
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Инициализация", () => {
    it("должен создавать singleton экземпляр сервиса", () => {
      const instance1 = ClaudeService.getInstance()
      const instance2 = ClaudeService.getInstance()
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
      const newService = ClaudeService.getInstance()
      newService.setApiKey("")
      expect(newService.hasApiKey()).toBe(false)

      newService.setApiKey("test-key")
      expect(newService.hasApiKey()).toBe(true)
    })
  })

  describe("Отправка сообщений", () => {
    it("должен отправлять запрос к Claude API", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: "Ответ от Claude" }],
          role: "assistant",
          model: CLAUDE_MODELS.CLAUDE_4_SONNET,
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Привет, Claude!" }]

      const result = await service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages)

      expect(fetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-api-key": "test-api-key",
            "anthropic-version": "2023-06-01",
          }),
          body: expect.stringContaining("Привет, Claude!"),
        }),
      )

      expect(result).toBe("Ответ от Claude")
    })

    it("должен включать системное сообщение в запрос", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: "Ответ с контекстом" }],
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Как обрезать клип?" }]

      const systemPrompt = `Ты - AI ассистент в видеоредакторе Timeline Studio.
Помогай пользователям с монтажом видео, эффектами и фильтрами.`

      await service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages, {
        system: systemPrompt,
      })

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.system).toContain("Timeline Studio")
      expect(body.system).toContain("видеоредактор")
    })

    it("должен использовать правильную модель", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: "Ответ" }],
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(CLAUDE_MODELS.CLAUDE_4_OPUS, messages)

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.model).toBe(CLAUDE_MODELS.CLAUDE_4_OPUS)
    })

    it("должен устанавливать параметры модели", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: "Ответ" }],
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages, {
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
          content: [{ text: "Ответ" }],
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages)

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
      await expect(service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages)).rejects.toThrow("Network error")
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
      await expect(service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages)).rejects.toThrow(
        "Ошибка Claude API: 401",
      )
    })

    it("должен обрабатывать неожиданный формат ответа", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          // Неожиданный формат без content
          unexpected: "format",
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages)).rejects.toThrow()
    })

    it("должен выбрасывать ошибку при отсутствии API ключа", async () => {
      const newService = ClaudeService.getInstance()
      newService.setApiKey("")

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(newService.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages)).rejects.toThrow(
        "API ключ не установлен",
      )
    })

    it("должен обрабатывать пустые ответы", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [],
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Тест" }]
      await expect(service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages)).rejects.toThrow(
        "Cannot read properties of undefined",
      )
    })
  })

  describe("Управление инструментами", () => {
    it("должен включать инструменты в запрос", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: "Использую инструмент" }],
          tool_use: {
            id: "tool-1",
            name: "add_effect",
            input: { effect: "blur", intensity: 0.5 },
          },
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const tools = [
        {
          name: "add_effect",
          description: "Добавить эффект к видео",
          input_schema: {
            type: "object",
            properties: {
              effect: { type: "string" },
              intensity: { type: "number" },
            },
            required: ["effect"],
          },
        },
      ]

      const messages = [{ role: "user" as const, content: "Добавь эффект размытия" }]
      await service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages, { tools })

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.tools).toEqual(tools)
      expect(body.tool_choice).toBe("auto")
    })

    it("должен поддерживать явный выбор инструмента", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: "Использую указанный инструмент" }],
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const tools = [
        {
          name: "specific_tool",
          description: "Конкретный инструмент",
          input_schema: { type: "object", properties: {} },
        },
      ]

      const messages = [{ role: "user" as const, content: "Используй specific_tool" }]
      await service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages, {
        tools,
        tool_choice: { name: "specific_tool" },
      })

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.tool_choice).toEqual({ name: "specific_tool" })
    })
  })

  describe("Обработка ответов с инструментами", () => {
    it("должен обрабатывать ответ с вызовом инструмента", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: "Сейчас добавлю эффект" }],
          tool_use: {
            id: "tool-use-1",
            name: "add_blur_effect",
            input: {
              clipId: "clip-1",
              intensity: 0.8,
            },
          },
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const messages = [{ role: "user" as const, content: "Добавь размытие" }]
      const response = await service.sendRequest(CLAUDE_MODELS.CLAUDE_4_SONNET, messages)

      // Проверяем, что метод возвращает информацию об использованном инструменте
      expect(response).toContain("[Использован инструмент: add_blur_effect]")
      expect(response).toContain("clipId")
      expect(response).toContain("intensity")

      // В будущем можно добавить обработку tool_use для выполнения действий
    })
  })
})
