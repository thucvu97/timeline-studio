/**
 * Mock DI Container for testing
 * Предоставляет упрощенную версию DI контейнера для тестов
 */

import { AIDIContainer } from "../di-container"
import type { IUnifiedAIService } from "../providers/interfaces"
import { MockContentAnalysisService, MockFFmpegService, MockVisionService } from "./analysis"
import { MockAIProvider, MockAIProviderFactory, MockModelManager } from "./providers"
import { MockUnifiedAIService } from "./unified-service"

/**
 * Создает мок DI контейнер с предустановленными сервисами
 */
export function createMockDIContainer(): AIDIContainer {
  const container = AIDIContainer.createTestInstance()

  // Регистрируем базовые мок сервисы

  // AI Provider Factory
  container.registerSingleton("AIProviderFactory", () => new MockAIProviderFactory())

  // Model Manager
  container.registerSingleton("ModelManager", () => new MockModelManager())

  // AI Providers
  container.registerSingleton(
    "ClaudeProvider",
    () => new MockAIProvider("claude", ["claude-3-opus", "claude-3-sonnet"]),
  )

  container.registerSingleton("OpenAIProvider", () => new MockAIProvider("openai", ["gpt-4", "gpt-3.5-turbo"]))

  // Analysis Services
  container.registerSingleton("FFmpegService", () => new MockFFmpegService())

  container.registerSingleton("VisionService", () => new MockVisionService())

  container.registerSingleton("ContentAnalysisService", () => new MockContentAnalysisService())

  // Unified AI Service
  container.registerSingleton("UnifiedAIService", async () => {
    const factory = await container.resolve<MockAIProviderFactory>("AIProviderFactory")
    const modelManager = await container.resolve<MockModelManager>("ModelManager")
    const ffmpeg = await container.resolve<MockFFmpegService>("FFmpegService")
    const vision = await container.resolve<MockVisionService>("VisionService")
    const contentAnalysis = await container.resolve<MockContentAnalysisService>("ContentAnalysisService")

    return new MockUnifiedAIService({
      providerFactory: factory,
      modelManager,
      ffmpegService: ffmpeg,
      visionService: vision,
      contentAnalysisService: contentAnalysis,
    })
  }, ["AIProviderFactory", "ModelManager", "FFmpegService", "VisionService", "ContentAnalysisService"])

  return container
}

/**
 * Helper для быстрой установки моков в тестах
 */
export async function setupMockAIServices() {
  const container = createMockDIContainer()
  await container.initialize()

  return {
    container,
    aiService: await container.resolve<IUnifiedAIService>("UnifiedAIService"),
    ffmpeg: await container.resolve<MockFFmpegService>("FFmpegService"),
    vision: await container.resolve<MockVisionService>("VisionService"),
    contentAnalysis: await container.resolve<MockContentAnalysisService>("ContentAnalysisService"),
  }
}

/**
 * Очистка моков после тестов
 */
export function cleanupMockAIServices() {
  // Контейнер автоматически очищается при создании нового
  // Но можно добавить дополнительную логику если нужно
}
