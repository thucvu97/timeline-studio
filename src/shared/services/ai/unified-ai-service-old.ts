/**
 * Unified AI Service
 * Единый интерфейс для работы со всеми AI провайдерами
 */

import type {
  AIProviderFactory,
  AiMessage,
  AiRequestOptions,
  AiResponse,
  IAIProvider,
  IUnifiedAIService,
  ModelConfig,
  ModelManager,
  StreamingOptions,
} from "./providers/interfaces"

interface CacheEntry {
  response: AiResponse
  timestamp: number
  ttl: number
}

export class UnifiedAIService implements IUnifiedAIService {
  private cache = new Map<string, CacheEntry>()
  private requestCounts = new Map<string, number>()
  private readonly CACHE_TTL = 600000 // 10 минут
  private readonly MAX_CACHE_SIZE = 1000

  constructor(
    private providerFactory: AIProviderFactory,
    private modelManager: ModelManager,
  ) {}

  async sendRequest(model: string, messages: AiMessage[], options: AiRequestOptions = {}): Promise<AiResponse> {
    // Проверяем кэш если включено кэширование
    if (options.enableCache !== false) {
      const cacheKey = this.getCacheKey(model, messages, options)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Получаем провайдер для модели
    const provider = await this.getProviderForModel(model)

    // Проверяем доступность модели
    const isAvailable = await this.isModelAvailable(model)
    if (!isAvailable) {
      throw new Error(`Model ${model} is not available`)
    }

    try {
      // Отправляем запрос
      const response = await provider.sendRequest(model, messages, options)

      // Обновляем статистику
      this.updateRequestCount(model)

      // Кэшируем результат если включено кэширование
      if (options.enableCache !== false) {
        const cacheKey = this.getCacheKey(model, messages, options)
        this.setToCache(cacheKey, response, options.cacheTTL || this.CACHE_TTL)
      }

      return response
    } catch (error) {
      console.error(`AI request failed for model ${model}:`, error)
      throw error
    }
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: AiRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    // Получаем провайдер для модели
    const provider = await this.getProviderForModel(model)

    // Проверяем доступность модели
    const isAvailable = await this.isModelAvailable(model)
    if (!isAvailable) {
      if (options.onError) {
        options.onError(new Error(`Model ${model} is not available`))
        return
      }
      throw new Error(`Model ${model} is not available`)
    }

    try {
      // Отправляем потоковый запрос
      await provider.sendStreamingRequest(model, messages, options)

      // Обновляем статистику
      this.updateRequestCount(model)
    } catch (error) {
      console.error(`AI streaming request failed for model ${model}:`, error)
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error("Unknown error"))
      } else {
        throw error
      }
    }
  }

  async getAvailableModels(): Promise<ModelConfig[]> {
    return await this.modelManager.getAvailableModels()
  }

  async getBestModelForTask(task: string, options?: any): Promise<ModelConfig | null> {
    return await this.modelManager.getBestModelForTask(task as any, options)
  }

  async getProviderStatuses(): Promise<Record<string, boolean>> {
    const providers = ["claude", "openai", "deepseek", "ollama"]
    const statuses: Record<string, boolean> = {}

    await Promise.all(
      providers.map(async (provider) => {
        try {
          statuses[provider] = await this.providerFactory.isProviderAvailable(provider)
        } catch {
          statuses[provider] = false
        }
      }),
    )

    return statuses
  }

  // Утилиты для работы с кэшем
  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalRequests: number
  } {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0)
    const cacheHits = this.cache.size > 0 ? Math.floor(totalRequests * 0.15) : 0 // Примерная оценка

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      totalRequests,
    }
  }

  // Дополнительные методы
  async getModelInfo(model: string): Promise<ModelConfig | null> {
    const models = await this.getAvailableModels()
    return models.find((m) => m.model === model) || null
  }

  async isModelAvailable(model: string): Promise<boolean> {
    return await this.modelManager.isModelAvailable(model)
  }

  async estimateTokens(text: string, model?: string): Promise<number> {
    if (model) {
      const provider = await this.getProviderForModel(model)
      if (provider.estimateTokens) {
        return provider.estimateTokens(text)
      }
    }

    // Fallback: общая оценка ~4 символа на токен
    return Math.ceil(text.length / 4)
  }

  async getModelLimits(model: string): Promise<{ maxTokens: number; maxRequestsPerMinute?: number }> {
    const provider = await this.getProviderForModel(model)
    const maxTokens = provider.getMaxTokens?.(model) || 4096

    // TODO: Добавить информацию о rate limits для каждого провайдера
    const rateLimits: Record<string, number> = {
      "gpt-4o": 500,
      "gpt-4-turbo": 500,
      "claude-4-sonnet-latest": 1000,
      "claude-3-5-sonnet-20241022": 1000,
    }

    return {
      maxTokens,
      maxRequestsPerMinute: rateLimits[model],
    }
  }

  // Приватные методы
  private async getProviderForModel(model: string): Promise<IAIProvider> {
    const provider = this.providerFactory.getProviderByModel(model)
    if (!provider) {
      throw new Error(`No provider found for model: ${model}`)
    }
    return provider
  }

  private getCacheKey(model: string, messages: AiMessage[], options: AiRequestOptions): string {
    const key = JSON.stringify({
      model,
      messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      systemPrompt: options.systemPrompt,
    })
    return this.hashString(key)
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash &= hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  private getFromCache(key: string): AiResponse | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.response
  }

  private setToCache(key: string, response: AiResponse, ttl: number): void {
    // Очищаем кэш если он переполнен
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2))
      for (const oldKey of oldestKeys) {
        this.cache.delete(oldKey)
      }
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl,
    })
  }

  private updateRequestCount(model: string): void {
    const count = this.requestCounts.get(model) || 0
    this.requestCounts.set(model, count + 1)
  }
}

// Расширяем интерфейс AiRequestOptions для кэширования
declare module "./interfaces" {
  interface AiRequestOptions {
    enableCache?: boolean
    cacheTTL?: number
  }
}
