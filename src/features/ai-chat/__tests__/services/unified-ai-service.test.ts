import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockDIContainer } from "@/shared/services/ai/__mocks__"
import { ContentIntelligenceService } from "../../services/content-intelligence-service"
import { UnifiedAIService } from "../../services/unified-ai-service"
import type { AiMessage } from "../../types/ai-message"

// Мокируем shared services
vi.mock("@/shared/services/ai", async () => {
  const mocks = await import("@/shared/services/ai/__mocks__")
  return {
    getAIContainer: () => mocks.createMockDIContainer(),
  }
})

// Мокируем model-configuration-manager
vi.mock("../../services/model-configuration-manager", () => ({
  ModelConfigurationManager: {
    create: vi.fn(() => ({
      getAllModels: vi.fn(() => [
        { id: "claude-4-sonnet-latest", name: "Claude 4 Sonnet", provider: "claude" },
        { id: "gpt-4", name: "GPT-4", provider: "openai" },
      ]),
      getModel: vi.fn((id: string) => ({
        id,
        name: id,
        provider: id.includes("claude") ? "claude" : "openai",
      })),
      getDefaultModel: vi.fn(() => ({
        id: "claude-4-sonnet-latest",
        name: "Claude 4 Sonnet",
        provider: "claude",
      })),
    })),
  },
}))

// Мокируем provider-manager
vi.mock("../../services/provider-manager", () => ({
  ProviderManager: {
    getInstance: vi.fn(() => ({
      isAvailable: vi.fn(() => true),
      sendRequest: vi.fn(async (_model: string, messages: any[]) => ({
        content: `Mock response for: ${messages[messages.length - 1]?.content || ""}`,
      })),
      streamRequest: vi.fn(),
    })),
  },
}))

// Мокируем ai-response-processor
vi.mock("../../services/ai-response-processor", () => ({
  AIResponseProcessor: {
    getInstance: vi.fn(() => ({
      processResponse: vi.fn((response: any) => ({
        text: response.content,
        processedData: null,
        confidence: 0.95,
      })),
    })),
  },
}))

// Мокируем content-intelligence-service
vi.mock("../../services/content-intelligence-service", () => ({
  ContentIntelligenceService: {
    getInstance: vi.fn(() => ({
      analyzeContent: vi.fn(async () => ({
        classification: { genre: "documentary", style: "educational" },
        script: null,
        adaptations: [],
      })),
    })),
  },
}))

describe("UnifiedAIService", () => {
  let service: UnifiedAIService
  let mockContainer: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Настраиваем мок контейнер
    mockContainer = createMockDIContainer()
    await mockContainer.initialize()

    // Получаем экземпляр сервиса
    service = UnifiedAIService.getInstance()

    // Ждем инициализации сервиса более надежно
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // Проверяем, что основные методы доступны
    if (!service.sendRequest || !service.getAvailableModels) {
      console.warn("Service methods not available yet, waiting more...")
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  })

  describe("Initialization", () => {
    it("should create singleton instance", () => {
      const instance1 = service
      const instance2 = UnifiedAIService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it("should initialize all required services", async () => {
      expect(service).toBeDefined()
      // Проверяем, что сервисы инициализированы
      const models = await service.getAvailableModels()
      expect(models).toBeDefined()
      expect(models.length).toBeGreaterThan(0)
    })
  })

  describe("sendRequest", () => {
    it("should send request to AI provider", async () => {
      const messages: AiMessage[] = [{ role: "user", content: "Test message" }]

      const response = await service.sendRequest("claude-4-sonnet-latest", messages)

      expect(response).toBeDefined()
      expect(response.content).toContain("Mock response for: Test message")
    })

    it("should handle content analysis requests", async () => {
      const messages: AiMessage[] = [{ role: "user", content: "analyze this video" }]

      const response = await service.sendRequest("claude-4-sonnet-latest", messages)

      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
    })

    it("should use fallback models if primary fails", async () => {
      const messages: AiMessage[] = [{ role: "user", content: "Test with fallback" }]

      const response = await service.sendRequest("claude-4-sonnet-latest", messages, { fallbackModels: ["gpt-4"] })

      expect(response).toBeDefined()
    })
  })

  describe("analyzeMedia", () => {
    it("should analyze media file", async () => {
      const mediaFile = {
        id: "test-file",
        path: "/test/video.mp4",
        filename: "video.mp4",
        size: 1000000,
        type: "video",
      }

      // analyzeContent теперь часть ContentIntelligenceService
      const mockAiService = {
        sendRequest: vi.fn().mockResolvedValue({ content: "Mock AI response" }),
      }
      const contentService = ContentIntelligenceService.create(mockAiService)
      const analysis = await contentService.analyzeContentIntelligence([mediaFile as any])

      expect(analysis).toBeDefined()
      expect(analysis.length).toBeGreaterThan(0)
      // Проверяем первый результат
      const firstResult = analysis[0]
      expect(firstResult).toBeDefined()
    })
  })

  describe("getAvailableModels", () => {
    it("should return available AI models", async () => {
      const models = await service.getAvailableModels()

      expect(models).toBeInstanceOf(Array)
      expect(models.length).toBeGreaterThan(0)
      expect(models[0]).toHaveProperty("id")
      expect(models[0]).toHaveProperty("name")
      expect(models[0]).toHaveProperty("provider")
    })
  })

  describe("provider management", () => {
    it("should use provider based on model", async () => {
      // Просто используем модель от другого провайдера
      const response = await service.sendRequest("gpt-4", [{ role: "user", content: "Test with openai" }])

      expect(response).toBeDefined()
      expect(response.provider).toBe("openai")
    })
  })

  describe("Cache functionality", () => {
    it("should cache responses", async () => {
      const messages: AiMessage[] = [{ role: "user", content: "Cacheable request" }]

      // Первый запрос
      const response1 = await service.sendRequest("claude-4-sonnet-latest", messages)

      // Второй запрос (должен вернуть из кэша)
      const response2 = await service.sendRequest("claude-4-sonnet-latest", messages)

      expect(response1.content).toBe(response2.content)
    })

    it("should clear cache", async () => {
      const messages: AiMessage[] = [{ role: "user", content: "Test cache clear" }]

      await service.sendRequest("claude-4-sonnet-latest", messages)
      service.clearCache()

      // После очистки кэша новый запрос должен быть выполнен
      const response = await service.sendRequest("claude-4-sonnet-latest", messages)
      expect(response).toBeDefined()
    })
  })

  describe("Error handling", () => {
    it("should handle provider errors gracefully", async () => {
      const messages: AiMessage[] = [
        { role: "user", content: "error" }, // Триггерит ошибку в моке
      ]

      await expect(service.sendRequest("claude-4-sonnet-latest", messages)).rejects.toThrow()
    })
  })
})
