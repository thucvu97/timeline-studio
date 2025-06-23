/**
 * Специализированный сервис для работы с DeepSeek API
 */

import { ApiKeyLoader } from "./api-key-loader"
import { AiMessage } from "../types/ai-message"
import { StreamingOptions, StreamingRequest } from "../types/streaming"

// Доступные модели DeepSeek
export const DEEPSEEK_MODELS = {
  DEEPSEEK_R1: "deepseek-r1",
  DEEPSEEK_CHAT: "deepseek-chat",
  DEEPSEEK_CODER: "deepseek-coder",
}

// Интерфейс для запроса к DeepSeek API
interface DeepSeekApiRequest {
  model: string
  messages: AiMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
  presence_penalty?: number
  frequency_penalty?: number
}

// Интерфейс для ответа от DeepSeek API
interface DeepSeekApiResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Интерфейс для потоковых событий DeepSeek
interface DeepSeekStreamingEvent {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }[]
}

/**
 * Класс для работы с DeepSeek API
 */
export class DeepSeekService {
  private static instance: DeepSeekService
  private apiUrl = "https://api.deepseek.com/v1/chat/completions"
  private apiKeyLoader: ApiKeyLoader

  private constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): DeepSeekService {
    if (!DeepSeekService.instance) {
      DeepSeekService.instance = new DeepSeekService()
    }
    return DeepSeekService.instance
  }

  /**
   * Установить API ключ
   * @param apiKey Новый API ключ
   * @deprecated Используйте API Keys Management вместо прямой установки ключа
   */
  public setApiKey(apiKey: string): void {
    // Обновляем кэш загрузчика
    this.apiKeyLoader.updateCache("deepseek", apiKey)
    console.log("DeepSeek API key updated:", apiKey ? "***" : "(empty)")
  }

  /**
   * Проверить, установлен ли API ключ
   */
  public async hasApiKey(): Promise<boolean> {
    const apiKey = await this.apiKeyLoader.getApiKey("deepseek")
    return !!apiKey
  }

  /**
   * Отправить запрос к DeepSeek API
   * @param model Модель DeepSeek
   * @param messages Сообщения для отправки
   * @param options Дополнительные опции
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: {
      temperature?: number
      max_tokens?: number
      top_p?: number
      presence_penalty?: number
      frequency_penalty?: number
    } = {},
  ): Promise<string> {
    const apiKey = await this.apiKeyLoader.getApiKey("deepseek")
    if (!apiKey) {
      throw new Error("DeepSeek API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    try {
      const requestBody: DeepSeekApiRequest = {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        top_p: options.top_p || 1.0,
        presence_penalty: options.presence_penalty || 0.0,
        frequency_penalty: options.frequency_penalty || 0.0,
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка DeepSeek API: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as DeepSeekApiResponse
      return data.choices[0].message.content
    } catch (error) {
      console.error("Ошибка при отправке запроса к DeepSeek API:", error)
      throw error
    }
  }

  /**
   * Отправить потоковый запрос к DeepSeek API
   * @param model Модель DeepSeek
   * @param messages Сообщения для отправки
   * @param options Опции для потокового запроса
   */
  public async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: {
      temperature?: number
      max_tokens?: number
      top_p?: number
      presence_penalty?: number
      frequency_penalty?: number
    } & StreamingOptions = {},
  ): Promise<void> {
    const apiKey = await this.apiKeyLoader.getApiKey("deepseek")
    if (!apiKey) {
      const error = new Error("DeepSeek API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
      options.onError?.(error)
      throw error
    }

    try {
      const requestBody: DeepSeekApiRequest = {
        model,
        messages,
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        top_p: options.top_p || 1.0,
        presence_penalty: options.presence_penalty || 0.0,
        frequency_penalty: options.frequency_penalty || 0.0,
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Ошибка DeepSeek API: ${response.status} ${errorText}`)
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
                const event: DeepSeekStreamingEvent = JSON.parse(data)

                const content = event.choices[0]?.delta?.content
                if (content) {
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
      console.error("Ошибка при отправке потокового запроса к DeepSeek API:", error)
      options.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Получить информацию о доступных моделях
   */
  public getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: DEEPSEEK_MODELS.DEEPSEEK_R1,
        name: "DeepSeek R1",
        description: "Последняя модель DeepSeek с улучшенными возможностями рассуждения",
      },
      {
        id: DEEPSEEK_MODELS.DEEPSEEK_CHAT,
        name: "DeepSeek Chat",
        description: "Базовая модель DeepSeek для общения",
      },
      {
        id: DEEPSEEK_MODELS.DEEPSEEK_CODER,
        name: "DeepSeek Coder",
        description: "Специализированная модель для программирования",
      },
    ]
  }
}