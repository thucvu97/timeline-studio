/**
 * Dependency Injection Container
 * Централизованный контейнер для всех AI сервисов
 */

import { createMediaAnalysisFactory } from "./analysis/factory"
import { ModelManagerImpl } from "./model-manager"
import { createAIProviderFactory } from "./providers/factory"
import type {
  AIProviderFactory,
  AIServiceConfig,
  IAIProvider,
  IUnifiedAIService,
  MediaAnalysisFactory,
  ModelConfig,
  ModelManager,
  OrchestrationFactory,
} from "./providers/interfaces"
import { EnhancedUnifiedAIService } from "./unified-ai-service"

export class AIDIContainer {
  private static instance: AIDIContainer | null = null

  private config: AIServiceConfig | null = null
  private providerFactory: AIProviderFactory | null = null
  private analysisFactory: MediaAnalysisFactory | null = null
  private orchestrationFactory: OrchestrationFactory | null = null
  private unifiedService: IUnifiedAIService | null = null
  private modelManager: ModelManager | null = null

  private initialized = false

  private constructor() {}

  static getInstance(): AIDIContainer {
    if (!AIDIContainer.instance) {
      AIDIContainer.instance = new AIDIContainer()
    }
    return AIDIContainer.instance
  }

  // Конфигурация
  configure(config: AIServiceConfig): void {
    this.config = config
    this.initialized = false // Требует повторной инициализации
  }

  getConfig(): AIServiceConfig {
    if (!this.config) {
      throw new Error("AI Service not configured. Call configure() first.")
    }
    return this.config
  }

  // Инициализация
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (!this.config) {
      // Используем конфигурацию по умолчанию
      this.config = this.getDefaultConfig()
    }

    // Создаем фабрики
    this.providerFactory = createAIProviderFactory()
    this.analysisFactory = createMediaAnalysisFactory()

    // Создаем менеджер моделей
    this.modelManager = new ModelManagerImpl(this.providerFactory)

    // Создаем унифицированный сервис
    this.unifiedService = EnhancedUnifiedAIService.getInstance({
      providerFactory: this.providerFactory,
      modelManager: this.modelManager,
    })

    // Инициализируем компоненты
    await this.initializeComponents()

    this.initialized = true
  }

  private async initializeComponents(): Promise<void> {
    // Проверяем доступность провайдеров
    const availableProviders = await this.providerFactory!.getAvailableProviders()
    console.log("Available AI providers:", availableProviders)

    // Проверяем доступность анализ сервисов
    const analysisServices = await this.analysisFactory!.getAvailableServices()
    console.log("Available analysis services:", analysisServices)

    // Инициализируем модели
    await this.modelManager!.getAvailableModels()
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // Получение сервисов
  getProviderFactory(): AIProviderFactory {
    this.ensureInitialized()
    return this.providerFactory!
  }

  getAnalysisFactory(): MediaAnalysisFactory {
    this.ensureInitialized()
    return this.analysisFactory!
  }

  getOrchestrationFactory(): OrchestrationFactory {
    this.ensureInitialized()
    if (!this.orchestrationFactory) {
      throw new Error("Orchestration factory not implemented yet")
    }
    return this.orchestrationFactory!
  }

  getUnifiedAIService(): IUnifiedAIService {
    this.ensureInitialized()
    return this.unifiedService!
  }

  getModelManager(): ModelManager {
    this.ensureInitialized()
    return this.modelManager!
  }

  // Получение конкретных провайдеров
  getClaudeProvider(): IAIProvider {
    return this.getProviderFactory().createClaudeProvider()
  }

  getOpenAIProvider(): IAIProvider {
    return this.getProviderFactory().createOpenAIProvider()
  }

  getDeepSeekProvider(): IAIProvider {
    return this.getProviderFactory().createDeepSeekProvider()
  }

  getOllamaProvider(baseUrl?: string): IAIProvider {
    return this.getProviderFactory().createOllamaProvider(baseUrl)
  }

  // Утилиты
  async getProviderStatus(): Promise<Record<string, boolean>> {
    this.ensureInitialized()

    const providers = ["claude", "openai", "deepseek", "ollama"]
    const statuses: Record<string, boolean> = {}

    await Promise.all(
      providers.map(async (provider) => {
        try {
          statuses[provider] = await this.providerFactory!.isProviderAvailable(provider)
        } catch {
          statuses[provider] = false
        }
      }),
    )

    return statuses
  }

  async getBestModelForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options?: any,
  ): Promise<ModelConfig | null> {
    this.ensureInitialized()
    return await this.modelManager!.getBestModelForTask(task, options)
  }

  // Очистка ресурсов
  async dispose(): Promise<void> {
    if (this.unifiedService) {
      this.unifiedService.clearCache()
    }

    if (this.analysisFactory) {
      this.analysisFactory.dispose?.()
    }

    if (this.providerFactory) {
      this.providerFactory.dispose?.()
    }

    this.providerFactory = null
    this.analysisFactory = null
    this.orchestrationFactory = null
    this.unifiedService = null
    this.modelManager = null
    this.initialized = false
  }

  // Приватные методы
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("AI Service not initialized. Call initialize() first.")
    }
  }

  private getDefaultConfig(): AIServiceConfig {
    return {
      providers: {
        claude: {
          defaultModel: "claude-3-5-sonnet-20241022",
        },
        openai: {
          defaultModel: "gpt-4o",
        },
        deepseek: {
          defaultModel: "deepseek-chat",
        },
        ollama: {
          baseUrl: "http://localhost:11434",
          defaultModel: "llama3.2",
        },
      },
      analysis: {
        maxConcurrency: 4,
        cacheDirectory: "/tmp/ai-analysis-cache",
      },
      orchestration: {
        enableWorkflows: true,
        enableStateMachines: true,
        maxPipelineSteps: 10,
      },
    }
  }

  // Статические методы для удобства
  static async createAndInitialize(config?: AIServiceConfig): Promise<AIDIContainer> {
    const container = AIDIContainer.getInstance()

    if (config) {
      container.configure(config)
    }

    await container.initialize()
    return container
  }

  static getInstanceSafe(): AIDIContainer | null {
    return AIDIContainer.instance
  }
}

// Глобальные функции для удобства
export async function initializeAIServices(config?: AIServiceConfig): Promise<AIDIContainer> {
  return await AIDIContainer.createAndInitialize(config)
}

export function getAIContainer(): AIDIContainer {
  const container = AIDIContainer.getInstanceSafe()
  if (!container) {
    throw new Error("AI Services not initialized. Call initializeAIServices() first.")
  }
  return container
}

export function getAIContainerSafe(): AIDIContainer | null {
  return AIDIContainer.getInstanceSafe()
}
