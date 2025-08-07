/**
 * Mock Unified AI Service for testing
 */

import type {
  ContentAnalysisResult,
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaFile,
} from "../analysis/interfaces"
import type {
  AiMessage,
  AiRequestOptions,
  AiResponse,
  IAIProvider,
  IAIProviderFactory,
  IModelManager,
  IUnifiedAIService,
  ModelConfig,
  StreamingOptions,
} from "../providers/interfaces"

export interface MockUnifiedAIServiceConfig {
  providerFactory?: IAIProviderFactory
  modelManager?: IModelManager
  ffmpegService?: IFFmpegAnalysisService
  visionService?: IVisionService
  contentAnalysisService?: IContentAnalysisService
  defaultProvider?: string
  fallbackProviders?: string[]
}

export class MockUnifiedAIService implements IUnifiedAIService {
  private providers = new Map<string, IAIProvider>()

  constructor(private config: MockUnifiedAIServiceConfig = {}) {}

  async sendRequest(model: string, messages: AiMessage[], options?: AiRequestOptions): Promise<AiResponse> {
    // Определяем провайдера из модели
    const providerName = this.getProviderForModel(model)
    let provider = this.providers.get(providerName)

    if (!provider && this.config.providerFactory) {
      provider = await this.config.providerFactory.createProvider(providerName)
      this.providers.set(providerName, provider)
    }

    if (!provider) {
      throw new Error(`Provider not found for model: ${model}`)
    }

    return provider.sendRequest(model, messages, options)
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options?: AiRequestOptions & StreamingOptions,
  ): Promise<void> {
    const providerName = this.getProviderForModel(model)
    let provider = this.providers.get(providerName)

    if (!provider && this.config.providerFactory) {
      provider = await this.config.providerFactory.createProvider(providerName)
      this.providers.set(providerName, provider)
    }

    if (!provider) {
      throw new Error(`Streaming not supported for model: ${model}`)
    }

    return provider.sendStreamingRequest(model, messages, options)
  }

  async analyzeMedia(file: MediaFile): Promise<ContentAnalysisResult> {
    if (!this.config.contentAnalysisService) {
      throw new Error("Content analysis service not configured")
    }

    return this.config.contentAnalysisService.analyzeContent(file)
  }

  async analyzeImage(imagePath: string): Promise<any> {
    if (!this.config.visionService) {
      throw new Error("Vision service not configured")
    }

    return this.config.visionService.analyzeFrame(imagePath)
  }

  async getAvailableModels(): Promise<ModelConfig[]> {
    if (!this.config.modelManager) return []
    return this.config.modelManager.getAllModels()
  }

  getModelInfo(modelId: string): any {
    if (!this.config.modelManager) return null
    return this.config.modelManager.getModel(modelId)
  }

  async switchProvider(provider: string): Promise<void> {
    this.config.defaultProvider = provider
  }

  getCurrentProvider(): string {
    return this.config.defaultProvider || "mock"
  }

  async initialize(): Promise<void> {
    // Mock is always initialized
  }

  isInitialized(): boolean {
    return true
  }

  async getBestModelForTask(_task: string, _options?: any): Promise<ModelConfig | null> {
    const models = await this.getAvailableModels()
    if (models.length === 0) return null
    return models[0] // Просто возвращаем первую доступную модель
  }

  async getProviderStatuses(): Promise<Record<string, boolean>> {
    return {
      mock: true,
      claude: false,
      openai: false,
      local: false,
    }
  }

  clearCache(): void {
    // Mock implementation
  }

  getCacheStats(): any {
    return {
      size: 0,
      hits: 0,
      misses: 0,
    }
  }

  // Helper methods
  private getProviderForModel(model: string): string {
    if (model.includes("claude")) return "claude"
    if (model.includes("gpt")) return "openai"
    if (model.includes("llama") || model.includes("mistral")) return "local"
    return this.config.defaultProvider || "mock"
  }
}

/**
 * Создает мок unified service с предустановленным поведением
 */
export function createMockUnifiedService(
  behavior: { responses?: Record<string, any>; errors?: Record<string, string>; streamingEnabled?: boolean } = {},
): MockUnifiedAIService {
  const service = new MockUnifiedAIService()

  // Override sendRequest для кастомного поведения
  const originalSendRequest = service.sendRequest.bind(service)
  service.sendRequest = async (model, messages, options) => {
    const lastMessage = messages[messages.length - 1]?.content || ""

    // Проверяем ошибки
    if (behavior.errors) {
      for (const [pattern, error] of Object.entries(behavior.errors)) {
        if (lastMessage.includes(pattern)) {
          throw new Error(error)
        }
      }
    }

    // Проверяем кастомные ответы
    if (behavior.responses) {
      for (const [pattern, response] of Object.entries(behavior.responses)) {
        if (lastMessage.includes(pattern)) {
          return {
            content: typeof response === "object" ? JSON.stringify(response) : response,
            model,
            provider: "mock",
          }
        }
      }
    }

    // Fallback к оригинальному поведению
    return originalSendRequest(model, messages, options)
  }

  if (behavior.streamingEnabled === false) {
    service.sendStreamingRequest = async () => {
      throw new Error("Streaming not supported")
    }
  }

  return service
}
