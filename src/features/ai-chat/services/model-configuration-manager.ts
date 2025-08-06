/**
 * Менеджер конфигурации моделей AI
 * Извлечен из UnifiedAIService для улучшения архитектуры
 */

import { CLAUDE_MODELS } from "./claude-service"
import { DEEPSEEK_MODELS } from "./deepseek-service"
import { AI_MODELS } from "./open-ai-service"

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

// Интерфейс для проверки доступности провайдеров
export interface ProviderAvailabilityChecker {
  isClaudeAvailable(): Promise<boolean>
  isOpenAIAvailable(model: string): Promise<boolean>
  isDeepSeekAvailable(): Promise<boolean>
  isOllamaAvailable(): Promise<boolean>
  getOllamaModels(): Promise<Array<{ name: string; details: { parameter_size: string } }>>
}

/**
 * Менеджер конфигурации моделей AI
 */
export class ModelConfigurationManager {
  private static instance: ModelConfigurationManager
  private availabilityChecker: ProviderAvailabilityChecker
  private _modelsCache: ModelConfig[] | null = null
  private _cacheExpiry: number = 0
  private cacheTimeout = 5 * 60 * 1000 // 5 минут

  // Статические модели
  private static readonly STATIC_MODELS: Record<string, ModelConfig> = {
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
  }

  private constructor(availabilityChecker: ProviderAvailabilityChecker) {
    this.availabilityChecker = availabilityChecker
  }

  /**
   * Создать экземпляр менеджера
   */
  public static create(availabilityChecker: ProviderAvailabilityChecker): ModelConfigurationManager {
    return new ModelConfigurationManager(availabilityChecker)
  }

  /**
   * Получить все статические модели
   */
  public getStaticModels(): Record<string, ModelConfig> {
    return { ...ModelConfigurationManager.STATIC_MODELS }
  }

  /**
   * Получить провайдера по модели
   */
  public getProviderByModel(model: string): AIProvider {
    const modelConfig = ModelConfigurationManager.STATIC_MODELS[model]
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
   * Получить конфигурацию модели
   */
  public getModelConfig(model: string): ModelConfig | null {
    return ModelConfigurationManager.STATIC_MODELS[model] || null
  }

  /**
   * Проверить доступность модели
   */
  public async isModelAvailable(model: string): Promise<boolean> {
    const provider = this.getProviderByModel(model)

    try {
      switch (provider) {
        case "claude":
          return await this.availabilityChecker.isClaudeAvailable()
        case "openai":
          return await this.availabilityChecker.isOpenAIAvailable(model)
        case "deepseek":
          return await this.availabilityChecker.isDeepSeekAvailable()
        case "ollama":
          return await this.availabilityChecker.isOllamaAvailable()
        default:
          return false
      }
    } catch (error) {
      console.warn(`Ошибка проверки доступности модели ${model}:`, error)
      return false
    }
  }

  /**
   * Получить доступные модели (с кэшированием)
   */
  public async getAvailableModels(forceRefresh = false): Promise<ModelConfig[]> {
    // Проверяем кэш
    if (!forceRefresh && this._modelsCache && Date.now() < this._cacheExpiry) {
      return this._modelsCache
    }

    const models: ModelConfig[] = []

    // Добавляем статические модели из конфигурации
    for (const modelConfig of Object.values(ModelConfigurationManager.STATIC_MODELS)) {
      if (await this.isModelAvailable(modelConfig.id)) {
        models.push(modelConfig)
      }
    }

    // Добавляем динамические модели Ollama
    try {
      if (await this.availabilityChecker.isOllamaAvailable()) {
        const ollamaModels = await this.availabilityChecker.getOllamaModels()
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

    // Кэшируем результат
    this._modelsCache = models
    this._cacheExpiry = Date.now() + this.cacheTimeout

    return models
  }

  /**
   * Получить модели по провайдеру
   */
  public async getModelsByProvider(provider: AIProvider, forceRefresh = false): Promise<ModelConfig[]> {
    const allModels = await this.getAvailableModels(forceRefresh)
    return allModels.filter(model => model.provider === provider)
  }

  /**
   * Получить лучшую доступную модель для задачи
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
    const availableModels = await this.getAvailableModels()
    
    // Фильтруем по требованиям
    let candidates = availableModels.filter(model => {
      if (options.preferLocal !== undefined && model.isLocal !== options.preferLocal) {
        return false
      }
      if (options.maxTokens && model.maxTokens < options.maxTokens) {
        return false
      }
      if (options.requiresStreaming && !model.supportsStreaming) {
        return false
      }
      if (options.requiresTools && !model.supportsTools) {
        return false
      }
      return true
    })

    if (candidates.length === 0) {
      return null
    }

    // Сортируем по предпочтениям для разных задач
    switch (task) {
      case "analysis":
        // Для анализа предпочитаем Claude 4 Sonnet
        candidates.sort((a, b) => {
          if (a.id === CLAUDE_MODELS.CLAUDE_4_SONNET) return -1
          if (b.id === CLAUDE_MODELS.CLAUDE_4_SONNET) return 1
          if (a.provider === "claude") return -1
          if (b.provider === "claude") return 1
          return b.maxTokens - a.maxTokens
        })
        break
      
      case "generation":
        // Для генерации предпочитаем Claude 4 Opus
        candidates.sort((a, b) => {
          if (a.id === CLAUDE_MODELS.CLAUDE_4_OPUS) return -1
          if (b.id === CLAUDE_MODELS.CLAUDE_4_OPUS) return 1
          if (a.provider === "claude") return -1
          if (b.provider === "claude") return 1
          return b.maxTokens - a.maxTokens
        })
        break

      case "code":
        // Для кода предпочитаем DeepSeek Coder или Claude
        candidates.sort((a, b) => {
          if (a.id === DEEPSEEK_MODELS.DEEPSEEK_CODER) return -1
          if (b.id === DEEPSEEK_MODELS.DEEPSEEK_CODER) return 1
          if (a.provider === "deepseek") return -1
          if (b.provider === "deepseek") return 1
          if (a.provider === "claude") return -1
          if (b.provider === "claude") return 1
          return b.maxTokens - a.maxTokens
        })
        break

      case "chat":
      default:
        // Для чата сортируем по мощности
        candidates.sort((a, b) => {
          return b.maxTokens - a.maxTokens
        })
        break
    }

    return candidates[0]
  }

  /**
   * Очистить кэш моделей
   */
  public clearCache(): void {
    this._modelsCache = null
    this._cacheExpiry = 0
  }

  /**
   * Получить статистику кэша
   */
  public getCacheStats(): { 
    isCached: boolean
    modelsCount: number
    cacheExpiry: number
    timeToExpiry: number
  } {
    const now = Date.now()
    return {
      isCached: this._modelsCache !== null && now < this._cacheExpiry,
      modelsCount: this._modelsCache?.length || 0,
      cacheExpiry: this._cacheExpiry,
      timeToExpiry: Math.max(0, this._cacheExpiry - now)
    }
  }

  /**
   * Валидировать модель
   */
  public validateModel(model: string): {
    isValid: boolean
    provider: AIProvider
    config: ModelConfig | null
    errors: string[]
  } {
    const errors: string[] = []
    const provider = this.getProviderByModel(model)
    const config = this.getModelConfig(model)

    if (!provider) {
      errors.push(`Неизвестный провайдер для модели ${model}`)
    }

    if (!config && provider !== "ollama") {
      errors.push(`Конфигурация не найдена для модели ${model}`)
    }

    return {
      isValid: errors.length === 0,
      provider,
      config,
      errors
    }
  }
}