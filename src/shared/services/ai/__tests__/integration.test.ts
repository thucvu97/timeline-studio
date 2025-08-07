import { beforeEach, describe, expect, it } from "vitest"
import { createMockDIContainer, setupMockAIServices } from "../__mocks__"
import { getAIContainer } from "../di-container"

describe("AI Services Integration", () => {
  describe("Real Container Integration", () => {
    let container: any

    beforeEach(() => {
      // Используем реальный контейнер
      container = getAIContainer()
    })

    it("should initialize with all core services", async () => {
      await container.initialize()

      // Проверяем наличие основных сервисов
      expect(container.has("UnifiedAIService")).toBe(true)
      expect(container.has("AIProviderFactory")).toBe(true)
      expect(container.has("ModelManager")).toBe(true)
      expect(container.has("FFmpegService")).toBe(true)
      expect(container.has("VisionService")).toBe(true)
      expect(container.has("ContentAnalysisService")).toBe(true)
    })

    it("should resolve unified AI service with dependencies", async () => {
      await container.initialize()

      const unifiedService = await container.resolve("UnifiedAIService")

      expect(unifiedService).toBeDefined()
      expect(unifiedService.sendRequest).toBeDefined()
      expect(unifiedService.getAvailableModels).toBeDefined()
    })
  })

  describe("Mock Container Integration", () => {
    let mockServices: any

    beforeEach(async () => {
      // Используем мок контейнер
      mockServices = await setupMockAIServices()
    })

    it("should setup all mock services", () => {
      expect(mockServices.container).toBeDefined()
      expect(mockServices.aiService).toBeDefined()
      expect(mockServices.ffmpeg).toBeDefined()
      expect(mockServices.vision).toBeDefined()
      expect(mockServices.contentAnalysis).toBeDefined()
    })

    it("should handle AI requests through mock services", async () => {
      const { aiService } = mockServices

      const response = await aiService.sendRequest("claude-4-sonnet-latest", [
        { role: "user", content: "Test message" },
      ])

      expect(response).toBeDefined()
      expect(response.content).toContain("Mock response")
    })

    it("should analyze media through mock services", async () => {
      const { contentAnalysis } = mockServices

      const result = await contentAnalysis.analyzeContent({
        id: "test",
        path: "/test/video.mp4",
        filename: "video.mp4",
        size: 1000000,
        type: "video",
      })

      expect(result).toBeDefined()
      expect(result.video).toBeDefined()
      expect(result.audio).toBeDefined()
      expect(result.scenes).toBeDefined()
    })
  })

  describe("End-to-End Workflow", () => {
    it("should complete full analysis workflow with mocks", async () => {
      const mockServices = await setupMockAIServices()
      const { aiService, contentAnalysis } = mockServices

      // Step 1: Анализ медиа файла
      const mediaFile = {
        id: "workflow-test",
        path: "/workflow/test.mp4",
        filename: "test.mp4",
        size: 5000000,
        type: "video" as const,
      }

      const analysisResult = await contentAnalysis.analyzeContent(mediaFile)

      expect(analysisResult.video.duration).toBe(120)
      expect(analysisResult.scenes.length).toBeGreaterThan(0)

      // Step 2: Генерация описания через AI
      const aiResponse = await aiService.sendRequest("claude-4-sonnet-latest", [
        {
          role: "user",
          content: `Analyze this video: ${JSON.stringify({
            duration: analysisResult.video.duration,
            scenes: analysisResult.scenes.length,
            quality: analysisResult.video.quality,
          })}`,
        },
      ])

      expect(aiResponse.content).toBeDefined()

      // Step 3: Проверка результатов
      expect(analysisResult.summary).toBeDefined()
      expect(analysisResult.tags).toBeInstanceOf(Array)
    })
  })

  describe("Dependency Injection Patterns", () => {
    it("should support service decoration", async () => {
      const container = createMockDIContainer()

      // Регистрируем базовый сервис
      container.registerSingleton("LogService", () => ({
        log: (message: string) => message,
      }))

      // Регистрируем декорированный сервис
      container.registerSingleton(
        "TimestampedLogService",
        (logger: any) => ({
          log: (message: string) => {
            const timestamp = new Date().toISOString()
            return logger.log(`[${timestamp}] ${message}`)
          },
        }),
        ["LogService"],
      )

      const timestampedLogger = await container.resolve("TimestampedLogService")
      const result = timestampedLogger.log("Test message")

      expect(result).toMatch(/\[\d{4}-\d{2}-\d{2}T.*\] Test message/)
    })

    it("should support service composition", async () => {
      const container = createMockDIContainer()

      // Регистрируем компоненты
      container.registerSingleton("VideoAnalyzer", () => ({
        analyze: () => ({ type: "video", quality: 85 }),
      }))

      container.registerSingleton("AudioAnalyzer", () => ({
        analyze: () => ({ type: "audio", quality: 90 }),
      }))

      // Композитный сервис
      container.registerSingleton(
        "MediaAnalyzer",
        (video: any, audio: any) => ({
          analyzeMedia: () => ({
            video: video.analyze(),
            audio: audio.analyze(),
            overall: (video.analyze().quality + audio.analyze().quality) / 2,
          }),
        }),
        ["VideoAnalyzer", "AudioAnalyzer"],
      )

      const mediaAnalyzer = await container.resolve("MediaAnalyzer")
      const result = mediaAnalyzer.analyzeMedia()

      expect(result.video.quality).toBe(85)
      expect(result.audio.quality).toBe(90)
      expect(result.overall).toBe(87.5)
    })
  })

  describe("Error Scenarios", () => {
    it("should handle provider failures gracefully", async () => {
      const container = createMockDIContainer()

      // Регистрируем провайдера с ошибкой
      container.registerSingleton("FailingProvider", () => ({
        sendRequest: async () => {
          throw new Error("Provider unavailable")
        },
      }))

      // Регистрируем fallback провайдера
      container.registerSingleton("FallbackProvider", () => ({
        sendRequest: async () => ({ content: "Fallback response" }),
      }))

      // Сервис с fallback логикой
      container.registerSingleton(
        "ResilientService",
        (primary: any, fallback: any) => ({
          request: async () => {
            try {
              return await primary.sendRequest()
            } catch (error) {
              return await fallback.sendRequest()
            }
          },
        }),
        ["FailingProvider", "FallbackProvider"],
      )

      const service = await container.resolve("ResilientService")
      const response = await service.request()

      expect(response.content).toBe("Fallback response")
    })
  })

  describe("Performance", () => {
    it("should resolve dependencies efficiently", async () => {
      const container = createMockDIContainer()

      // Создаем граф зависимостей
      for (let i = 0; i < 10; i++) {
        container.registerSingleton(`Service${i}`, () => ({
          id: i,
          value: Math.random(),
        }))
      }

      // Сервис, зависящий от всех
      container.registerSingleton(
        "CompositeService",
        (...deps: any[]) => ({
          dependencies: deps,
        }),
        Array.from({ length: 10 }, (_, i) => `Service${i}`),
      )

      const startTime = performance.now()
      const composite = await container.resolve("CompositeService")
      const endTime = performance.now()

      expect(composite.dependencies).toHaveLength(10)
      expect(endTime - startTime).toBeLessThan(100) // Должно быть быстро
    })
  })
})
