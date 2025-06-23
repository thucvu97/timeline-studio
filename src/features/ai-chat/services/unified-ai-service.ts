/**
 * Унифицированный сервис для работы со всеми AI провайдерами
 * Обеспечивает единую точку входа, fallback и балансировку нагрузки
 */

import { CLAUDE_MODELS, ClaudeService } from "./claude-service"
import { DEEPSEEK_MODELS, DeepSeekService } from "./deepseek-service"
import { OllamaService } from "./ollama-service"
import { AI_MODELS, OpenAiService } from "./open-ai-service"
import { AiMessage } from "../types/ai-message"
import { StreamingOptions } from "../types/streaming"

// Типы AI провайдеров
export type AIProvider = "claude" | "openai" | "deepseek" | "ollama"

// Конфигурация модели
export interface ModelConfig {
  id: string
  name: string
  provider: AIProvider
  isLocal: boolean
  supportsStreaming: boolean
  supportsTools: boolean
  maxTokens: number
  description?: string
}

// Все доступные модели
export const UNIFIED_MODELS: Record<string, ModelConfig> = {
  // Claude модели
  [CLAUDE_MODELS.CLAUDE_4_SONNET]: {
    id: CLAUDE_MODELS.CLAUDE_4_SONNET,
    name: "Claude 4 Sonnet",
    provider: "claude",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: true,
    maxTokens: 200000,
    description: "Самая производительная модель Claude",
  },
  [CLAUDE_MODELS.CLAUDE_4_OPUS]: {
    id: CLAUDE_MODELS.CLAUDE_4_OPUS,
    name: "Claude 4 Opus",
    provider: "claude",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: true,
    maxTokens: 200000,
    description: "Премиум модель Claude с максимальными возможностями",
  },

  // OpenAI модели
  [AI_MODELS.GPT_4]: {
    id: AI_MODELS.GPT_4,
    name: "GPT-4",
    provider: "openai",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 8192,
    description: "Мощная модель OpenAI GPT-4",
  },
  [AI_MODELS.GPT_4O]: {
    id: AI_MODELS.GPT_4O,
    name: "GPT-4o",
    provider: "openai",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 128000,
    description: "Мультимодальная модель GPT-4 Omni",
  },
  [AI_MODELS.GPT_3_5]: {
    id: AI_MODELS.GPT_3_5,
    name: "GPT-3.5 Turbo",
    provider: "openai",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 16385,
    description: "Быстрая и экономичная модель",
  },
  [AI_MODELS.O3]: {
    id: AI_MODELS.O3,
    name: "o3",
    provider: "openai",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 128000,
    description: "Новейшая модель OpenAI o3",
  },

  // DeepSeek модели
  [DEEPSEEK_MODELS.DEEPSEEK_R1]: {
    id: DEEPSEEK_MODELS.DEEPSEEK_R1,
    name: "DeepSeek R1",
    provider: "deepseek",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 65536,
    description: "Последняя модель DeepSeek с улучшенными возможностями рассуждения",
  },
  [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: {
    id: DEEPSEEK_MODELS.DEEPSEEK_CHAT,
    name: "DeepSeek Chat",
    provider: "deepseek",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 32768,
    description: "Базовая модель DeepSeek для общения",
  },
  [DEEPSEEK_MODELS.DEEPSEEK_CODER]: {
    id: DEEPSEEK_MODELS.DEEPSEEK_CODER,
    name: "DeepSeek Coder",
    provider: "deepseek",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 32768,
    description: "Специализированная модель для программирования",
  },

  // Ollama модели (будут добавлены динамически)
}

// Опции для запроса
export interface UnifiedRequestOptions {
  temperature?: number
  maxTokens?: number
  fallbackModels?: string[]
  timeout?: number
  retryAttempts?: number
}

// Результат запроса
export interface UnifiedResponse {
  content: string
  model: string
  provider: AIProvider
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  responseTime: number
}

/**
 * Унифицированный сервис для работы со всеми AI провайдерами
 */
export class UnifiedAIService {
  private static instance: UnifiedAIService
  private claudeService: ClaudeService
  private openAiService: OpenAiService
  private deepSeekService: DeepSeekService
  private ollamaService: OllamaService
  private responseCache = new Map<string, { response: UnifiedResponse; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5 минут

  private constructor() {
    this.claudeService = ClaudeService.getInstance()
    this.openAiService = OpenAiService.getInstance()
    this.deepSeekService = DeepSeekService.getInstance()
    this.ollamaService = OllamaService.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService()
    }
    return UnifiedAIService.instance
  }

  /**
   * Получить провайдера по модели
   */
  private getProviderByModel(model: string): AIProvider {
    const modelConfig = UNIFIED_MODELS[model]
    if (modelConfig) {
      return modelConfig.provider
    }

    // Fallback определение по префиксу
    if (model.startsWith("claude")) return "claude"
    if (model.startsWith("gpt") || model.startsWith("o3")) return "openai"
    if (model.startsWith("deepseek")) return "deepseek"
    return "ollama" // По умолчанию считаем локальной моделью
  }

  /**
   * Проверить доступность модели
   */
  public async isModelAvailable(model: string): Promise<boolean> {
    const provider = this.getProviderByModel(model)

    try {
      switch (provider) {
        case "claude":
          return await this.claudeService.hasApiKey()
        case "openai":
          return await this.openAiService.hasApiKey(model)
        case "deepseek":
          return await this.deepSeekService.hasApiKey()
        case "ollama":
          return await this.ollamaService.isAvailable()
        default:
          return false
      }
    } catch (error) {
      console.warn(`Ошибка проверки доступности модели ${model}:`, error)
      return false
    }
  }

  /**
   * Получить доступные модели
   */
  public async getAvailableModels(): Promise<ModelConfig[]> {
    const models: ModelConfig[] = []

    // Добавляем статические модели из конфигурации
    for (const modelConfig of Object.values(UNIFIED_MODELS)) {
      if (await this.isModelAvailable(modelConfig.id)) {
        models.push(modelConfig)
      }
    }

    // Добавляем динамические модели Ollama
    try {
      if (await this.ollamaService.isAvailable()) {
        const ollamaModels = await this.ollamaService.getInstalledModels()
        for (const model of ollamaModels) {
          models.push({
            id: model.name,
            name: model.name,
            provider: "ollama",
            isLocal: true,
            supportsStreaming: true,
            supportsTools: false,
            maxTokens: 2048,
            description: `Локальная модель Ollama (${model.details.parameter_size})`,
          })
        }
      }
    } catch (error) {
      console.warn("Ошибка получения Ollama моделей:", error)
    }

    return models
  }

  /**
   * Создать ключ кэша
   */
  private createCacheKey(model: string, messages: AiMessage[], options: UnifiedRequestOptions): string {
    const content = messages.map((m) => `${m.role}:${m.content}`).join("|")
    const opts = JSON.stringify({ model, temperature: options.temperature, maxTokens: options.maxTokens })
    return btoa(content + opts).slice(0, 50) // Ограничиваем длину ключа
  }

  /**
   * Получить ответ из кэша
   */
  private getCachedResponse(cacheKey: string): UnifiedResponse | null {
    const cached = this.responseCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.response
    }
    return null
  }

  /**
   * Сохранить ответ в кэш
   */
  private setCachedResponse(cacheKey: string, response: UnifiedResponse): void {
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    })

    // Очистка старых записей
    if (this.responseCache.size > 100) {
      const oldestKey = Array.from(this.responseCache.keys())[0]
      this.responseCache.delete(oldestKey)
    }
  }

  /**
   * Отправить запрос с автоматическим fallback
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: UnifiedRequestOptions = {},
  ): Promise<UnifiedResponse> {
    const startTime = Date.now()
    const cacheKey = this.createCacheKey(model, messages, options)

    // Проверяем кэш
    const cached = this.getCachedResponse(cacheKey)
    if (cached) {
      return { ...cached, responseTime: Date.now() - startTime }
    }

    const modelsToTry = [model, ...(options.fallbackModels || [])]
    const maxRetries = options.retryAttempts || 1

    for (const currentModel of modelsToTry) {
      const provider = this.getProviderByModel(currentModel)

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          let content: string
          const requestStartTime = Date.now()

          switch (provider) {
            case "claude":
              content = await this.claudeService.sendRequest(currentModel, messages, {
                temperature: options.temperature,
                max_tokens: options.maxTokens,
              })
              break

            case "openai":
              content = await this.openAiService.sendRequest(currentModel, messages, {
                temperature: options.temperature,
                max_tokens: options.maxTokens,
              })
              break

            case "deepseek":
              content = await this.deepSeekService.sendRequest(currentModel, messages, {
                temperature: options.temperature,
                max_tokens: options.maxTokens,
              })
              break

            case "ollama":
              content = await this.ollamaService.sendRequest(currentModel, messages, {
                temperature: options.temperature,
                num_ctx: options.maxTokens,
              })
              break

            default:
              throw new Error(`Неподдерживаемый провайдер: ${provider}`)
          }

          const response: UnifiedResponse = {
            content,
            model: currentModel,
            provider,
            responseTime: Date.now() - requestStartTime,
          }

          // Сохраняем в кэш
          this.setCachedResponse(cacheKey, response)

          return response
        } catch (error) {
          console.warn(`Ошибка запроса к ${currentModel} (попытка ${attempt + 1}):`, error)

          // Если это последняя попытка для последней модели, выбрасываем ошибку
          if (currentModel === modelsToTry[modelsToTry.length - 1] && attempt === maxRetries - 1) {
            throw error
          }

          // Ждем перед повторной попыткой
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
          }
        }
      }
    }

    throw new Error("Все модели недоступны")
  }

  /**
   * Отправить потоковый запрос
   */
  public async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: UnifiedRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    const provider = this.getProviderByModel(model)

    try {
      switch (provider) {
        case "claude":
          await this.claudeService.sendStreamingRequest(model, messages, {
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            onContent: options.onContent,
            onComplete: options.onComplete,
            onError: options.onError,
            signal: options.signal,
          })
          break

        case "openai":
          await this.openAiService.sendStreamingRequest(model, messages, {
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            onContent: options.onContent,
            onComplete: options.onComplete,
            onError: options.onError,
            signal: options.signal,
          })
          break

        case "deepseek":
          await this.deepSeekService.sendStreamingRequest(model, messages, {
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            onContent: options.onContent,
            onComplete: options.onComplete,
            onError: options.onError,
            signal: options.signal,
          })
          break

        case "ollama":
          await this.ollamaService.sendStreamingRequest(model, messages, {
            temperature: options.temperature,
            num_ctx: options.maxTokens,
            onContent: options.onContent,
            onComplete: options.onComplete,
            onError: options.onError,
            signal: options.signal,
          })
          break

        default:
          throw new Error(`Неподдерживаемый провайдер для потокового запроса: ${provider}`)
      }
    } catch (error) {
      options.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Очистить кэш ответов
   */
  public clearCache(): void {
    this.responseCache.clear()
  }

  /**
   * Получить статистику использования кэша
   */
  public getCacheStats(): { size: number; timeout: number } {
    return {
      size: this.responseCache.size,
      timeout: this.cacheTimeout,
    }
  }
}