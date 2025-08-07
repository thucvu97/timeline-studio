/**
 * Model Manager
 * Управление моделями и их конфигурациями
 */

import type { AIProviderFactory, ModelConfig, ModelManager } from "./providers/interfaces"

export class ModelManagerImpl implements ModelManager {
  private availableModels: ModelConfig[] = []
  private modelCache: Map<string, ModelConfig> = new Map()
  private lastUpdate: number = 0
  private readonly CACHE_TTL = 300000 // 5 минут

  constructor(private providerFactory: AIProviderFactory) {}

  async getAvailableModels(): Promise<ModelConfig[]> {
    const now = Date.now()

    // Проверяем кэш
    if (this.availableModels.length > 0 && now - this.lastUpdate < this.CACHE_TTL) {
      return this.availableModels
    }

    // Обновляем список моделей
    await this.refreshModels()
    return this.availableModels
  }

  private async refreshModels(): Promise<void> {
    const models: ModelConfig[] = []

    // Claude модели
    try {
      const claudeProvider = this.providerFactory.createClaudeProvider()
      if (await claudeProvider.isAvailable()) {
        const claudeModels = await claudeProvider.getAvailableModels()
        for (const model of claudeModels) {
          models.push({
            provider: "claude",
            model: model,
            displayName: this.getDisplayName("claude", model),
            maxTokens: claudeProvider.getMaxTokens?.(model) || 200000,
            supportTools: true,
            supportStreaming: true,
            supportVision: true,
            apiKeyRequired: true,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load Claude models:", error)
    }

    // OpenAI модели
    try {
      const openaiProvider = this.providerFactory.createOpenAIProvider()
      if (await openaiProvider.isAvailable()) {
        const openaiModels = await openaiProvider.getAvailableModels()
        for (const model of openaiModels) {
          models.push({
            provider: "openai",
            model: model,
            displayName: this.getDisplayName("openai", model),
            maxTokens: openaiProvider.getMaxTokens?.(model) || 128000,
            supportTools: this.supportsTools("openai", model),
            supportStreaming: true,
            supportVision: this.supportsVision("openai", model),
            apiKeyRequired: true,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load OpenAI models:", error)
    }

    // DeepSeek модели
    try {
      const deepseekProvider = this.providerFactory.createDeepSeekProvider()
      if (await deepseekProvider.isAvailable()) {
        const deepseekModels = await deepseekProvider.getAvailableModels()
        for (const model of deepseekModels) {
          models.push({
            provider: "deepseek",
            model: model,
            displayName: this.getDisplayName("deepseek", model),
            maxTokens: deepseekProvider.getMaxTokens?.(model) || 32768,
            supportTools: false,
            supportStreaming: true,
            supportVision: false,
            apiKeyRequired: true,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load DeepSeek models:", error)
    }

    // Ollama модели
    try {
      const ollamaProvider = this.providerFactory.createOllamaProvider()
      if (await ollamaProvider.isAvailable()) {
        const ollamaModels = await ollamaProvider.getAvailableModels()
        for (const model of ollamaModels) {
          models.push({
            provider: "ollama",
            model: model,
            displayName: this.getDisplayName("ollama", model),
            maxTokens: ollamaProvider.getMaxTokens?.(model) || 4096,
            supportTools: false,
            supportStreaming: true,
            supportVision: false,
            apiKeyRequired: false,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load Ollama models:", error)
    }

    // Обновляем кэш
    this.availableModels = models
    this.modelCache.clear()
    for (const model of models) {
      this.modelCache.set(model.model, model)
    }
    this.lastUpdate = Date.now()

    console.log(`Loaded ${models.length} AI models from ${new Set(models.map((m) => m.provider)).size} providers`)
  }

  getProviderByModel(model: string): string {
    const modelConfig = this.modelCache.get(model)
    if (modelConfig) {
      return modelConfig.provider
    }

    // Fallback: определяем провайдер по имени модели
    if (model.includes("claude")) return "claude"
    if (model.includes("gpt") || model.includes("o1")) return "openai"
    if (model.includes("deepseek")) return "deepseek"
    if (model.includes("llama") || model.includes("mistral") || model.includes("qwen")) return "ollama"

    throw new Error(`Unknown provider for model: ${model}`)
  }

  async isModelAvailable(model: string): Promise<boolean> {
    const models = await this.getAvailableModels()
    return models.some((m) => m.model === model)
  }

  async getBestModelForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options: {
      preferLocal?: boolean
      maxTokens?: number
      requiresStreaming?: boolean
      requiresTools?: boolean
    } = {},
  ): Promise<ModelConfig | null> {
    const availableModels = await this.getAvailableModels()

    // Фильтруем модели по требованиям
    let candidates = availableModels.filter((model) => {
      // Проверяем требования
      if (options.requiresStreaming && !model.supportStreaming) return false
      if (options.requiresTools && !model.supportTools) return false
      if (options.maxTokens && model.maxTokens && model.maxTokens < options.maxTokens) return false
      if (options.preferLocal && model.apiKeyRequired) return false

      return true
    })

    if (candidates.length === 0) {
      return null
    }

    // Выбираем лучшую модель для конкретной задачи
    candidates = this.rankModelsForTask(candidates, task)

    return candidates[0] || null
  }

  private rankModelsForTask(models: ModelConfig[], task: string): ModelConfig[] {
    const taskPreferences: Record<string, { providers: string[]; models: string[] }> = {
      analysis: {
        providers: ["claude", "gpt-4o", "gpt-4-turbo"],
        models: ["claude-4-sonnet-latest", "gpt-4o", "claude-3-5-sonnet-20241022"],
      },
      generation: {
        providers: ["claude", "openai", "deepseek"],
        models: ["claude-4-opus-latest", "gpt-4o", "claude-4-sonnet-latest"],
      },
      chat: {
        providers: ["claude", "openai", "ollama"],
        models: ["claude-3-5-sonnet-20241022", "gpt-4o-mini", "llama3.2"],
      },
      code: {
        providers: ["deepseek", "claude", "openai"],
        models: ["deepseek-coder", "claude-4-sonnet-latest", "gpt-4o"],
      },
    }

    const preferences = taskPreferences[task] || taskPreferences.chat

    return models.sort((a, b) => {
      // Приоритет по конкретным моделям
      const aModelPriority = preferences.models.indexOf(a.model)
      const bModelPriority = preferences.models.indexOf(b.model)

      if (aModelPriority !== -1 && bModelPriority !== -1) {
        return aModelPriority - bModelPriority
      }
      if (aModelPriority !== -1) return -1
      if (bModelPriority !== -1) return 1

      // Приоритет по провайдерам
      const aProviderPriority = preferences.providers.indexOf(a.provider)
      const bProviderPriority = preferences.providers.indexOf(b.provider)

      if (aProviderPriority !== -1 && bProviderPriority !== -1) {
        return aProviderPriority - bProviderPriority
      }
      if (aProviderPriority !== -1) return -1
      if (bProviderPriority !== -1) return 1

      // По количеству токенов (больше лучше)
      const aTokens = a.maxTokens || 0
      const bTokens = b.maxTokens || 0
      return bTokens - aTokens
    })
  }

  private getDisplayName(provider: string, model: string): string {
    const displayNames: Record<string, Record<string, string>> = {
      claude: {
        "claude-4-sonnet-latest": "Claude 4 Sonnet",
        "claude-4-opus-latest": "Claude 4 Opus",
        "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
        "claude-3-haiku-20240307": "Claude 3 Haiku",
      },
      openai: {
        "gpt-4o": "GPT-4o",
        "gpt-4o-mini": "GPT-4o Mini",
        "gpt-4-turbo": "GPT-4 Turbo",
        "gpt-3.5-turbo": "GPT-3.5 Turbo",
        "gpt-5": "GPT-5 (Preview)",
      },
      deepseek: {
        "deepseek-chat": "DeepSeek Chat",
        "deepseek-coder": "DeepSeek Coder",
        "deepseek-reasoner": "DeepSeek Reasoner",
        "deepseek-v3": "DeepSeek V3",
      },
      ollama: {
        "llama3.2": "Llama 3.2",
        "llama3.1": "Llama 3.1",
        codellama: "Code Llama",
        mistral: "Mistral",
        "qwen2.5": "Qwen 2.5",
      },
    }

    return displayNames[provider]?.[model] || model
  }

  private supportsTools(provider: string, model: string): boolean {
    if (provider === "openai") {
      return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-5"].includes(model)
    }
    if (provider === "claude") {
      return true // Все новые Claude модели поддерживают tools
    }
    return false
  }

  private supportsVision(provider: string, model: string): boolean {
    if (provider === "openai") {
      return ["gpt-4o", "gpt-4-vision-preview", "gpt-5"].includes(model)
    }
    if (provider === "claude") {
      return true // Все новые Claude модели поддерживают vision
    }
    return false
  }

  // Дополнительные утилиты
  getModelConfig(model: string): ModelConfig | null {
    return this.modelCache.get(model) || null
  }

  getModelsByProvider(provider: string): ModelConfig[] {
    return this.availableModels.filter((model) => model.provider === provider)
  }

  clearCache(): void {
    this.availableModels = []
    this.modelCache.clear()
    this.lastUpdate = 0
  }
}
