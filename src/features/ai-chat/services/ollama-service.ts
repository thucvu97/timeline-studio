/**
 * Сервис для работы с локальными AI моделями через Ollama
 */

import { AiMessage } from "../types/ai-message"
import { StreamingOptions } from "../types/streaming"

// Популярные модели Ollama
export const OLLAMA_MODELS = {
  LLAMA2: "llama2",
  LLAMA2_13B: "llama2:13b",
  LLAMA2_70B: "llama2:70b",
  MISTRAL: "mistral",
  MISTRAL_7B: "mistral:7b",
  CODELLAMA: "codellama",
  CODELLAMA_13B: "codellama:13b",
  VICUNA: "vicuna",
  ORCA_MINI: "orca-mini",
  DOLPHIN_MIXTRAL: "dolphin-mixtral",
  NEURAL_CHAT: "neural-chat",
}

// Интерфейс для запроса к Ollama API
interface OllamaApiRequest {
  model: string
  messages: AiMessage[]
  stream?: boolean
  options?: {
    temperature?: number
    top_k?: number
    top_p?: number
    repeat_penalty?: number
    num_ctx?: number
  }
}

// Интерфейс для ответа от Ollama API
interface OllamaApiResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

// Интерфейс для потоковых событий Ollama
interface OllamaStreamingEvent {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
}

// Интерфейс для информации о модели
interface OllamaModelInfo {
  name: string
  modified_at: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families?: string[]
    parameter_size: string
    quantization_level: string
  }
}

/**
 * Класс для работы с Ollama API
 */
export class OllamaService {
  private static instance: OllamaService
  private defaultBaseUrl = "http://localhost:11434"
  private baseUrl: string

  private constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.defaultBaseUrl
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(baseUrl?: string): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService(baseUrl)
    }
    return OllamaService.instance
  }

  /**
   * Установить базовый URL для Ollama API
   * @param url Новый базовый URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url
    console.log("Ollama base URL updated:", url)
  }

  /**
   * Получить текущий базовый URL
   */
  public getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Проверить, доступен ли Ollama сервер
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      })
      return response.ok
    } catch (error) {
      console.warn("Ollama server is not available:", error)
      return false
    }
  }

  /**
   * Получить список установленных моделей
   */
  public async getInstalledModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error(`Ошибка Ollama API: ${response.status}`)
      }

      const data = await response.json()
      return data.models || []
    } catch (error) {
      console.error("Ошибка при получении списка моделей Ollama:", error)
      throw error
    }
  }

  /**
   * Отправить запрос к Ollama API
   * @param model Название модели
   * @param messages Сообщения для отправки
   * @param options Дополнительные опции
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: {
      temperature?: number
      top_k?: number
      top_p?: number
      repeat_penalty?: number
      num_ctx?: number
    } = {},
  ): Promise<string> {
    if (!(await this.isAvailable())) {
      throw new Error(`Ollama сервер недоступен. Убедитесь, что Ollama запущен на ${this.baseUrl}`)
    }

    try {
      const requestBody: OllamaApiRequest = {
        model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_k: options.top_k || 40,
          top_p: options.top_p || 0.9,
          repeat_penalty: options.repeat_penalty || 1.1,
          num_ctx: options.num_ctx || 2048,
        },
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка Ollama API: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as OllamaApiResponse
      return data.message.content
    } catch (error) {
      console.error("Ошибка при отправке запроса к Ollama API:", error)
      throw error
    }
  }

  /**
   * Отправить потоковый запрос к Ollama API
   * @param model Название модели
   * @param messages Сообщения для отправки
   * @param options Опции для потокового запроса
   */
  public async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: {
      temperature?: number
      top_k?: number
      top_p?: number
      repeat_penalty?: number
      num_ctx?: number
    } & StreamingOptions = {},
  ): Promise<void> {
    if (!(await this.isAvailable())) {
      const error = new Error(`Ollama сервер недоступен. Убедитесь, что Ollama запущен на ${this.baseUrl}`)
      options.onError?.(error)
      throw error
    }

    try {
      const requestBody: OllamaApiRequest = {
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          top_k: options.top_k || 40,
          top_p: options.top_p || 0.9,
          repeat_penalty: options.repeat_penalty || 1.1,
          num_ctx: options.num_ctx || 2048,
        },
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Ошибка Ollama API: ${response.status} ${errorText}`)
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
          const lines = chunk.split("\n").filter((line) => line.trim())

          for (const line of lines) {
            try {
              const event: OllamaStreamingEvent = JSON.parse(line)

              const content = event.message?.content
              if (content) {
                fullContent += content
                options.onContent?.(content)
              }

              if (event.done) {
                options.onComplete?.(fullContent)
                return
              }
            } catch (parseError) {
              // Игнорируем ошибки парсинга отдельных событий
              console.warn("Ошибка парсинга Ollama события:", parseError)
            }
          }
        }

        options.onComplete?.(fullContent)
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error("Ошибка при отправке потокового запроса к Ollama API:", error)
      options.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Скачать модель (если она не установлена)
   * @param modelName Название модели для скачивания
   */
  public async pullModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: modelName }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка при скачивании модели: ${response.status}`)
      }

      // Модель скачивается в фоновом режиме
      console.log(`Начато скачивание модели: ${modelName}`)
    } catch (error) {
      console.error("Ошибка при скачивании модели Ollama:", error)
      throw error
    }
  }

  /**
   * Получить информацию о доступных моделях для скачивания
   */
  public getAvailableModels(): Array<{ id: string; name: string; description: string; size: string }> {
    return [
      {
        id: OLLAMA_MODELS.LLAMA2,
        name: "Llama 2 (7B)",
        description: "Базовая модель Meta Llama 2 с 7 миллиардами параметров",
        size: "3.8GB",
      },
      {
        id: OLLAMA_MODELS.LLAMA2_13B,
        name: "Llama 2 (13B)",
        description: "Улучшенная модель Meta Llama 2 с 13 миллиардами параметров",
        size: "7.3GB",
      },
      {
        id: OLLAMA_MODELS.MISTRAL,
        name: "Mistral (7B)",
        description: "Высокопроизводительная модель от Mistral AI",
        size: "4.1GB",
      },
      {
        id: OLLAMA_MODELS.CODELLAMA,
        name: "Code Llama (7B)",
        description: "Специализированная модель для программирования",
        size: "3.8GB",
      },
      {
        id: OLLAMA_MODELS.CODELLAMA_13B,
        name: "Code Llama (13B)",
        description: "Улучшенная модель для программирования",
        size: "7.3GB",
      },
      {
        id: OLLAMA_MODELS.VICUNA,
        name: "Vicuna (7B)",
        description: "Модель с улучшенными разговорными способностями",
        size: "3.8GB",
      },
      {
        id: OLLAMA_MODELS.ORCA_MINI,
        name: "Orca Mini (3B)",
        description: "Компактная и быстрая модель",
        size: "1.9GB",
      },
      {
        id: OLLAMA_MODELS.NEURAL_CHAT,
        name: "Neural Chat (7B)",
        description: "Модель оптимизированная для чата",
        size: "4.1GB",
      },
    ]
  }
}
