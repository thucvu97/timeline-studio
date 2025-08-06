/**
 * Новый рефакторированный UnifiedAIService
 * Использует отдельные сервисы для лучшей архитектуры (< 300 строк)
 */

import { contentIntelligenceTools } from "../tools/content-intelligence-tools"
import { personIdentificationTools } from "../tools/person-identification-tools"
import type { AiMessage } from "../types/ai-message"
import type { StreamingOptions } from "../types/streaming"
import { AIResponseProcessor, type ProcessingOptions, type UnifiedResponse } from "./ai-response-processor"
import { ContentIntelligenceService, type AIServiceInterface, type MediaInput, type UnifiedContentAnalysis } from "./content-intelligence-service"
import { ModelConfigurationManager, type AIProvider, type ModelConfig } from "./model-configuration-manager"
import { ProviderManager } from "./provider-manager"

// Реэкспортируем типы для обратной совместимости
export type { AIProvider, ModelConfig } from "./model-configuration-manager"
export type { UnifiedResponse } from "./ai-response-processor"
export type { MediaInput, UnifiedContentAnalysis } from "./content-intelligence-service"

// Опции для запроса
export interface UnifiedRequestOptions {
  temperature?: number
  maxTokens?: number
  fallbackModels?: string[]
  timeout?: number
  retryAttempts?: number
}

// Обратная совместимость для UNIFIED_MODELS
export const UNIFIED_MODELS: Record<string, ModelConfig> = {}

/**
 * Рефакторированный UnifiedAIService - основная точка входа для всех AI операций
 */
export class UnifiedAIService {
  private static instance: UnifiedAIService
  
  // Компоненты архитектуры
  private modelManager: ModelConfigurationManager
  private providerManager: ProviderManager
  private responseProcessor: AIResponseProcessor
  private contentIntelligenceService: ContentIntelligenceService
  
  // Кэширование
  private responseCache = new Map<string, { response: UnifiedResponse; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5 минут

  private constructor() {
    this.initializeServices()
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
   * Инициализация всех сервисов
   */
  private async initializeServices(): Promise<void> {
    // Получаем доступные сервисы
    const { ClaudeService } = await import("./claude-service")
    const { OpenAiService } = await import("./open-ai-service")
    const { DeepSeekService } = await import("./deepseek-service")
    const { OllamaService } = await import("./ollama-service")

    // Создаем адаптер для проверки доступности провайдеров
    const availabilityChecker = {
      isClaudeAvailable: () => ClaudeService.getInstance().hasApiKey(),
      isOpenAIAvailable: (model: string) => OpenAiService.getInstance().hasApiKey(model),
      isDeepSeekAvailable: () => DeepSeekService.getInstance().hasApiKey(),
      isOllamaAvailable: () => OllamaService.getInstance().isAvailable(),
      getOllamaModels: () => OllamaService.getInstance().getInstalledModels()
    }
    
    // Инициализируем сервисы
    this.modelManager = ModelConfigurationManager.create(availabilityChecker)
    this.providerManager = ProviderManager.getInstance()
    this.responseProcessor = AIResponseProcessor.getInstance()
    
    // Создаем адаптер для AI сервиса в ContentIntelligenceService
    const aiServiceAdapter: AIServiceInterface = {
      sendRequest: this.sendRequest.bind(this)
    }
    this.contentIntelligenceService = ContentIntelligenceService.create(aiServiceAdapter)
  }

  // ===================
  // ОСНОВНЫЕ API МЕТОДЫ
  // ===================

  /**
   * Отправить запрос с автоматическим fallback и обработкой ошибок
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
      const provider = this.modelManager.getProviderByModel(currentModel)

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const providerResponse = await this.providerManager.sendRequest(
            provider,
            currentModel,
            messages,
            {
              temperature: options.temperature,
              maxTokens: options.maxTokens,
              timeout: options.timeout,
            }
          )

          const response: UnifiedResponse = {
            content: providerResponse.content,
            model: currentModel,
            provider: providerResponse.provider,
            usage: providerResponse.usage,
            responseTime: Date.now() - startTime,
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
    const provider = this.modelManager.getProviderByModel(model)
    
    return this.providerManager.sendStreamingRequest(
      provider,
      model,
      messages,
      {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        timeout: options.timeout,
        onContent: options.onContent,
        onComplete: options.onComplete,
        onError: options.onError,
        signal: options.signal,
      }
    )
  }

  /**
   * Обработать ответ AI с форматированием и валидацией
   */
  public async processResponse(
    response: UnifiedResponse,
    options: ProcessingOptions = {}
  ) {
    return this.responseProcessor.processResponse(response, options)
  }

  // ============================
  // МОДЕЛИ И ПРОВАЙДЕРЫ
  // ============================

  /**
   * Получить доступные модели
   */
  public async getAvailableModels(): Promise<ModelConfig[]> {
    return this.modelManager.getAvailableModels()
  }

  /**
   * Проверить доступность модели
   */
  public async isModelAvailable(model: string): Promise<boolean> {
    return this.modelManager.isModelAvailable(model)
  }

  /**
   * Получить лучшую модель для задачи
   */
  public async getBestModelForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options: {
      preferLocal?: boolean
      maxTokens?: number
      requiresStreaming?: boolean
      requiresTools?: boolean
    } = {}
  ): Promise<ModelConfig | null> {
    return this.modelManager.getBestModelForTask(task, options)
  }

  /**
   * Получить статус всех провайдеров
   */
  public async getProviderStatuses() {
    return this.providerManager.getAllProviderStatuses()
  }

  // ============================
  // CONTENT INTELLIGENCE
  // ============================

  /**
   * Полный анализ контента (Content Intelligence)
   */
  public async analyzeContentIntelligence(
    mediaFiles: MediaInput[],
    options: {
      analysisDepth?: "quick" | "normal" | "deep"
      targetPlatforms?: string[]
      languages?: string[]
      enablePersonTracking?: boolean
      generateScript?: boolean
    } = {},
  ): Promise<UnifiedContentAnalysis[]> {
    return this.contentIntelligenceService.analyzeContentIntelligence(mediaFiles, options)
  }

  // ============================
  // ИНСТРУМЕНТЫ
  // ============================

  /**
   * Получить все доступные Content Intelligence инструменты
   */
  public getContentIntelligenceTools() {
    return contentIntelligenceTools
  }

  /**
   * Получить все доступные Person Identification инструменты
   */
  public getPersonIdentificationTools() {
    return personIdentificationTools
  }

  /**
   * Получить все AI инструменты
   */
  public getAllAITools() {
    return [...contentIntelligenceTools, ...personIdentificationTools]
  }

  // ============================
  // КЭШИРОВАНИЕ И УТИЛИТЫ
  // ============================

  /**
   * Очистить кэш ответов
   */
  public clearCache(): void {
    this.responseCache.clear()
    this.modelManager.clearCache()
    this.providerManager.clearStatusCache()
  }

  /**
   * Получить статистику использования кэша
   */
  public getCacheStats() {
    return {
      responses: {
        size: this.responseCache.size,
        timeout: this.cacheTimeout,
      },
      models: this.modelManager.getCacheStats(),
      providers: this.providerManager.getCacheStats()
    }
  }

  // ============================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ============================

  /**
   * Создать ключ кэша
   */
  private createCacheKey(model: string, messages: AiMessage[], options: UnifiedRequestOptions): string {
    const content = messages.map((m) => `${m.role}:${m.content}`).join("|")
    const opts = JSON.stringify({ model, temperature: options.temperature, maxTokens: options.maxTokens })
    return btoa(content + opts).slice(0, 50)
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
}

// Обратная совместимость - функция для получения статических моделей
export function getUnifiedModels(): Record<string, ModelConfig> {
  const service = UnifiedAIService.getInstance()
  return {} // Пока пустой объект для обратной совместимости
}