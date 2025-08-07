/**
 * Интерфейсы для AI провайдеров
 * Обеспечивают единый API для всех провайдеров и возможность dependency injection
 */

// Базовые типы для AI провайдеров
export interface AiMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AiResponse {
  content: string
  model: string
  provider: string
  finishReason?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AiRequestOptions {
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
  timeout?: number
  tools?: any[]
  systemPrompt?: string
  stop?: string | string[]
}

// Интерфейс для AI провайдера
export interface IAIProvider {
  name: string
  models: string[]

  // Основные методы
  sendRequest(model: string, messages: AiMessage[], options?: AiRequestOptions): Promise<AiResponse>
  sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options?: AiRequestOptions & StreamingOptions,
  ): Promise<void>

  // Управление состоянием
  isAvailable(): Promise<boolean>
  getAvailableModels(): Promise<string[]>
  validateApiKey?(): Promise<boolean>

  // Утилиты
  estimateTokens?(text: string): number
  getMaxTokens?(model: string): number
}

// Потоковый запрос
export interface StreamingOptions {
  onContent?: (content: string) => void
  onComplete?: (response: AiResponse) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

// Конфигурация модели
export interface ModelConfig {
  provider: string
  model: string
  displayName?: string
  maxTokens?: number
  supportTools?: boolean
  supportStreaming?: boolean
  supportVision?: boolean
  apiKeyRequired?: boolean
}

// Фабрика AI провайдеров
export interface AIProviderFactory {
  createClaudeProvider(): IAIProvider
  createOpenAIProvider(): IAIProvider
  createDeepSeekProvider(): IAIProvider
  createOllamaProvider(): IAIProvider

  // Утилиты
  getAvailableProviders(): Promise<string[]>
  getProviderByModel(model: string): IAIProvider | null
  isProviderAvailable(provider: string): Promise<boolean>
}

// Менеджер моделей
export interface ModelManager {
  getAvailableModels(): Promise<ModelConfig[]>
  getProviderByModel(model: string): string
  isModelAvailable(model: string): Promise<boolean>

  getBestModelForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options?: {
      preferLocal?: boolean
      maxTokens?: number
      requiresStreaming?: boolean
      requiresTools?: boolean
    },
  ): Promise<ModelConfig | null>
}

// Унифицированный AI сервис
export interface IUnifiedAIService {
  // Основные методы
  sendRequest(model: string, messages: AiMessage[], options?: AiRequestOptions): Promise<AiResponse>
  sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options?: AiRequestOptions & StreamingOptions,
  ): Promise<void>

  // Модели
  getAvailableModels(): Promise<ModelConfig[]>
  getBestModelForTask(task: string, options?: any): Promise<ModelConfig | null>

  // Провайдеры
  getProviderStatuses(): Promise<Record<string, boolean>>

  // Утилиты
  clearCache(): void
  getCacheStats(): any
}
