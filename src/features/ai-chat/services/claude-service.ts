/**
 * Специализированный сервис для работы с Claude API
 */

import { ApiKeyLoader } from "./api-key-loader"
import { AiMessage } from "../types/ai-message"
import { ClaudeStreamingEvent, StreamingOptions, StreamingRequest } from "../types/streaming"

// Доступные модели Claude
export const CLAUDE_MODELS = {
  CLAUDE_4_SONNET: "claude-4-sonnet",
  CLAUDE_4_OPUS: "claude-4-opus",
}

// Интерфейс для инструмента Claude
export interface ClaudeTool {
  name: string
  description: string
  input_schema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

// Интерфейс для вызова инструмента
export interface ClaudeToolUse {
  name: string
  input: Record<string, any>
}

// Интерфейс для запроса к Claude API
interface ClaudeApiRequest {
  model: string
  messages: AiMessage[]
  system?: string
  temperature?: number
  max_tokens?: number
  tools?: ClaudeTool[]
  tool_choice?: "auto" | "any" | { name: string }
}

// Интерфейс для ответа от Claude API
interface ClaudeApiResponse {
  id: string
  type: string
  role: string
  content: {
    type: string
    text: string
  }[]
  model: string
  stop_reason: string
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
  }
  tool_use?: {
    id: string
    name: string
    input: Record<string, any>
  }
}

/**
 * Класс для работы с Claude API
 */
export class ClaudeService {
  private static instance: ClaudeService
  private apiUrl = "https://api.anthropic.com/v1/messages"
  private apiVersion = "2023-06-01"
  private apiKeyLoader: ApiKeyLoader

  private constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService()
    }
    return ClaudeService.instance
  }

  /**
   * Установить API ключ
   * @param apiKey Новый API ключ
   * @deprecated Используйте API Keys Management вместо прямой установки ключа
   */
  public setApiKey(apiKey: string): void {
    // Обновляем кэш загрузчика
    this.apiKeyLoader.updateCache("claude", apiKey)
    console.log("Claude API key updated:", apiKey ? "***" : "(empty)")
  }

  /**
   * Проверить, установлен ли API ключ
   */
  public async hasApiKey(): Promise<boolean> {
    const apiKey = await this.apiKeyLoader.getApiKey("claude")
    return !!apiKey
  }

  /**
   * Отправить запрос к Claude API
   * @param model Модель Claude
   * @param messages Сообщения для отправки
   * @param options Дополнительные опции
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: {
      system?: string
      temperature?: number
      max_tokens?: number
      tools?: ClaudeTool[]
      tool_choice?: "auto" | "any" | { name: string }
    } = {},
  ): Promise<string> {
    const apiKey = await this.apiKeyLoader.getApiKey("claude")
    if (!apiKey) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    try {
      const requestBody: ClaudeApiRequest = {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      }

      // Добавляем системное сообщение, если оно есть
      if (options.system) {
        requestBody.system = options.system
      }

      // Добавляем инструменты, если они есть
      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools
        requestBody.tool_choice = options.tool_choice || "auto"
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка Claude API: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as ClaudeApiResponse

      // Проверяем, использовал ли Claude инструмент
      if (data.tool_use) {
        return `[Использован инструмент: ${data.tool_use.name}]\n\nВходные данные: ${JSON.stringify(data.tool_use.input, null, 2)}`
      }

      // Возвращаем текст ответа
      return data.content[0].text
    } catch (error) {
      console.error("Ошибка при отправке запроса к Claude API:", error)
      throw error
    }
  }

  /**
   * Отправить запрос к Claude API с поддержкой инструментов
   * @param model Модель Claude
   * @param messages Сообщения для отправки
   * @param tools Инструменты для использования
   * @param options Дополнительные опции
   */
  public async sendRequestWithTools(
    model: string,
    messages: AiMessage[],
    tools: ClaudeTool[],
    options: {
      system?: string
      temperature?: number
      max_tokens?: number
      tool_choice?: "auto" | "any" | { name: string }
    } = {},
  ): Promise<{ text: string; tool_use?: ClaudeToolUse }> {
    const apiKey = await this.apiKeyLoader.getApiKey("claude")
    if (!apiKey) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    try {
      const requestBody: ClaudeApiRequest = {
        model,
        messages,
        tools,
        tool_choice: options.tool_choice || "auto",
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      }

      // Добавляем системное сообщение, если оно есть
      if (options.system) {
        requestBody.system = options.system
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка Claude API: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as ClaudeApiResponse

      // Проверяем, использовал ли Claude инструмент
      if (data.tool_use) {
        return {
          text: data.content[0].text,
          tool_use: {
            name: data.tool_use.name,
            input: data.tool_use.input,
          },
        }
      }

      // Возвращаем только текст ответа, если инструмент не использовался
      return { text: data.content[0].text }
    } catch (error) {
      console.error("Ошибка при отправке запроса к Claude API с инструментами:", error)
      throw error
    }
  }

  /**
   * Отправить потоковый запрос к Claude API
   * @param model Модель Claude
   * @param messages Сообщения для отправки
   * @param options Опции для потокового запроса
   */
  public async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: {
      system?: string
      temperature?: number
      max_tokens?: number
    } & StreamingOptions = {},
  ): Promise<void> {
    const apiKey = await this.apiKeyLoader.getApiKey("claude")
    if (!apiKey) {
      const error = new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
      options.onError?.(error)
      throw error
    }

    try {
      const requestBody: StreamingRequest = {
        model,
        messages,
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
      }

      // Добавляем системное сообщение, если оно есть
      if (options.system) {
        requestBody.system = options.system
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Ошибка Claude API: ${response.status} ${errorText}`)
        options.onError?.(error)
        throw error
      }

      const reader = response.body?.getReader()
      if (!reader) {
        const error = new Error("Не удалось получить поток данных")
        options.onError?.(error)
        throw error
      }

      const decoder = new TextDecoder()
      let fullContent = ""

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()

              if (data === "[DONE]") {
                options.onComplete?.(fullContent)
                return
              }

              try {
                const event: ClaudeStreamingEvent = JSON.parse(data)

                if (event.type === "content_block_delta" && event.delta?.text) {
                  const content = event.delta.text
                  fullContent += content
                  options.onContent?.(content)
                }
              } catch (parseError) {
                // Игнорируем ошибки парсинга отдельных событий
                console.warn("Ошибка парсинга SSE события:", parseError)
              }
            }
          }
        }

        options.onComplete?.(fullContent)
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error("Ошибка при отправке потокового запроса к Claude API:", error)
      options.onError?.(error as Error)
      throw error
    }
  }
}
