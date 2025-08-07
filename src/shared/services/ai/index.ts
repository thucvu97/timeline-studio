/**
 * Shared AI Services
 * Единая точка входа для всех AI сервисов Timeline Studio
 */

export { ContentAnalysisService } from "./analysis/content"
export * from "./analysis/factory"
// Экспорт анализ сервисов
export { FFmpegAdapter } from "./analysis/ffmpeg"
// Экспорт интерфейсов анализа
export * from "./analysis/interfaces"
export { VisionAdapter } from "./analysis/vision"
// Экспорт DI контейнера и сервисов
export { AIDIContainer, getAIContainer, getAIContainerSafe, initializeAIServices } from "./di-container"
export { ModelManagerImpl } from "./model-manager"
// Экспорт интерфейсов оркестрации
export * from "./orchestration/interfaces"
// Экспорт конкретных провайдеров
export { CLAUDE_MODELS, ClaudeProvider } from "./providers/claude"
export { DEEPSEEK_MODELS, DeepSeekProvider } from "./providers/deepseek"
// Экспорт фабрик
export * from "./providers/factory"
// Экспорт интерфейсов провайдеров
export * from "./providers/interfaces"
export { OLLAMA_MODELS, OllamaProvider } from "./providers/ollama"
export { OPENAI_MODELS, OpenAIProvider } from "./providers/openai"
// Экспорт для обратной совместимости
export {
  EnhancedUnifiedAIService,
  EnhancedUnifiedAIService as UnifiedAIService,
  UnifiedRequestOptions,
  UnifiedResponse,
} from "./unified-ai-service"

// Типы конфигурации
export interface AIServiceConfig {
  providers: {
    claude?: {
      apiKey?: string
      defaultModel?: string
    }
    openai?: {
      apiKey?: string
      defaultModel?: string
    }
    deepseek?: {
      apiKey?: string
      defaultModel?: string
    }
    ollama?: {
      baseUrl?: string
      defaultModel?: string
    }
  }
  analysis: {
    ffmpegPath?: string
    onnxRuntimePath?: string
    cacheDirectory?: string
    maxConcurrency?: number
  }
  orchestration: {
    enableWorkflows?: boolean
    enableStateMachines?: boolean
    maxPipelineSteps?: number
  }
}

// Главная фабрика для создания всех AI сервисов
export interface AIServiceFactory {
  // Фабрики компонентов
  providers: AIProviderFactory
  analysis: MediaAnalysisFactory
  orchestration: OrchestrationFactory

  // Конфигурация
  configure(config: AIServiceConfig): void
  getConfig(): AIServiceConfig

  // Инициализация
  initialize(): Promise<void>
  isInitialized(): boolean

  // Очистка ресурсов
  dispose(): Promise<void>
}

import type {
  ContentAnalysisResult,
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaAnalysisFactory,
  MediaFile,
  VideoMetadata,
} from "./analysis/interfaces"
import type {
  IAIOrchestrator,
  IStateMachine,
  IWorkflowEngine,
  OrchestrationFactory,
  PipelineProgress,
  WorkflowDefinition,
} from "./orchestration/interfaces"
// Импорт переэкспорт для обратной совместимости
import type {
  AIProviderFactory,
  AiMessage,
  AiRequestOptions,
  AiResponse,
  IAIProvider,
  IUnifiedAIService,
  ModelConfig,
} from "./providers/interfaces"

export type {
  AIProviderFactory,
  MediaAnalysisFactory,
  OrchestrationFactory,
  ModelConfig,
  IAIProvider,
  IUnifiedAIService,
  IFFmpegAnalysisService,
  IVisionService,
  IContentAnalysisService,
  IWorkflowEngine,
  IAIOrchestrator,
  IStateMachine,
  AiMessage,
  AiResponse,
  AiRequestOptions,
  MediaFile,
  VideoMetadata,
  ContentAnalysisResult,
  WorkflowDefinition,
  PipelineProgress,
}
