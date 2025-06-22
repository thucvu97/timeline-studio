import { ApiKeyLoader } from "./api-key-loader"
import { AiMessage } from "../types/ai-message"

// Интерфейс для запроса к API
interface OpenAiApiRequest {
  model: string
  messages: AiMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

// Интерфейс для ответа от API
interface OpenAiApiResponse {
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

// Доступные модели
export const AI_MODELS = {
  CLAUDE_4_SONNET: "claude-4-sonnet",
  CLAUDE_4_OPUS: "claude-4-opus",
  GPT_4: "gpt-4",
  GPT_4O: "gpt-4o",
  GPT_3_5: "gpt-3.5-turbo",
  O3: "o3",
}

// Базовые URL для API
const API_URLS = {
  ANTHROPIC: "https://api.anthropic.com/v1/messages",
  OPENAI: "https://api.openai.com/v1/chat/completions",
}

/**
 * Класс для работы с API ИИ
 */
export class OpenAiService {
  private static instance: OpenAiService
  private apiKeyLoader: ApiKeyLoader

  private constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): OpenAiService {
    if (!OpenAiService.instance) {
      OpenAiService.instance = new OpenAiService()
    }
    return OpenAiService.instance
  }

  /**
   * Установить API ключ
   * @param apiKey Новый API ключ
   * @deprecated Используйте API Keys Management вместо прямой установки ключа
   */
  public setApiKey(apiKey: string): void {
    // Определяем тип ключа по префиксу
    const keyType = apiKey.startsWith("sk-ant-") ? "claude" : "openai"
    this.apiKeyLoader.updateCache(keyType, apiKey)
    console.log("AI API key updated:", apiKey ? "***" : "(empty)")
  }

  /**
   * Проверить, установлен ли API ключ
   * @param model Модель для проверки (опционально)
   */
  public async hasApiKey(model?: string): Promise<boolean> {
    const keyType = model?.startsWith("claude") ? "claude" : "openai"
    const apiKey = await this.apiKeyLoader.getApiKey(keyType)
    return !!apiKey
  }

  /**
   * Определить провайдера API по модели
   * @param model Модель ИИ
   */
  private getProviderByModel(model: string): "anthropic" | "openai" {
    if (model.startsWith("claude")) {
      return "anthropic"
    }
    return "openai"
  }

  /**
   * Отправить запрос к API ИИ
   * @param model Модель ИИ
   * @param messages Сообщения для отправки
   * @param options Дополнительные опции
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: { temperature?: number; max_tokens?: number } = {},
  ): Promise<string> {
    const provider = this.getProviderByModel(model)
    const apiKey = await this.apiKeyLoader.getApiKey(provider === "anthropic" ? "claude" : "openai")

    if (!apiKey) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    if (provider === "anthropic") {
      return this.sendAnthropicRequest(model, messages, options, apiKey)
    }
    return this.sendOpenAIRequest(model, messages, options, apiKey)
  }

  /**
   * Отправить запрос к API Anthropic (Claude)
   */
  private async sendAnthropicRequest(
    model: string,
    messages: AiMessage[],
    options: { temperature?: number; max_tokens?: number },
    apiKey: string,
  ): Promise<string> {
    try {
      const response = await fetch(API_URLS.ANTHROPIC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка API Anthropic: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data.content[0].text
    } catch (error) {
      console.error("Ошибка при отправке запроса к API Anthropic:", error)
      throw error
    }
  }

  /**
   * Отправить запрос к API OpenAI (GPT)
   */
  private async sendOpenAIRequest(
    model: string,
    messages: AiMessage[],
    options: { temperature?: number; max_tokens?: number },
    apiKey: string,
  ): Promise<string> {
    try {
      const response = await fetch(API_URLS.OPENAI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка API OpenAI: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error("Ошибка при отправке запроса к API OpenAI:", error)
      throw error
    }
  }
}
