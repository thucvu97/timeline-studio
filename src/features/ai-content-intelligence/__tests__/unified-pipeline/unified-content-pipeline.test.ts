import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockDIContainer } from "@/shared/services/ai/__mocks__"
import type { MediaFile } from "@/shared/services/ai/analysis/interfaces"
import { UnifiedContentPipeline } from "../../unified-pipeline/unified-content-pipeline"

// Мокируем shared services
vi.mock("@/shared/services/ai", async () => {
  const mocks = await import("@/shared/services/ai/__mocks__")
  return {
    getAIContainer: () => mocks.createMockDIContainer(),
  }
})

// Мокируем engine factory
vi.mock("../../factories/engine-factory", () => ({
  getEngineFactory: vi.fn(() => ({
    createAllEngines: vi.fn(async () => ({
      sceneEngine: {
        analyzeScenes: vi.fn(async (mediaFile: any, options: any) => [
          {
            id: "scene-1",
            start: 0,
            end: 10,
            type: "intro",
            confidence: 0.95,
            qualityScore: 8,
            description: "Opening scene",
          },
          {
            id: "scene-2",
            start: 10,
            end: 30,
            type: "main",
            confidence: 0.92,
            qualityScore: 7,
            description: "Main content",
          },
        ]),
      },
      classificationEngine: {
        classifyContent: vi.fn(async (mediaFile: any, scenes: any, options: any) => ({
          genre: "documentary",
          style: "educational",
          emotion: "neutral",
          audience: "general",
          technicalQuality: "good",
          contentRating: "G",
          confidence: {
            genre: 0.95,
            style: 0.9,
          },
          platformSuitability: {
            youtube: { score: 0.9, reasons: ["Good length"] },
            instagram: { score: 0.7, reasons: ["Too long"] },
          },
          accessibilityScore: {
            overallScore: 8,
            hasSubtitles: false,
            hasAudioDescription: false,
          },
        })),
      },
    })),
  })),
}))

// Мокируем AI service
const mockAIService = {
  sendRequest: vi.fn(async (model: string, messages: any[], options?: any) => ({
    content: JSON.stringify({
      title: "Generated Script",
      scenes: [
        { title: "Scene 1", description: "Opening" },
        { title: "Scene 2", description: "Main content" },
      ],
      metadata: { duration: 30 },
    }),
  })),
}

describe("UnifiedContentPipeline", () => {
  let pipeline: UnifiedContentPipeline

  beforeEach(() => {
    vi.clearAllMocks()
    pipeline = new UnifiedContentPipeline()

    // Внедряем мок AI сервиса
    ;(pipeline as any).aiService = mockAIService
  })

  describe("Initialization", () => {
    it("should create pipeline instance", () => {
      expect(pipeline).toBeDefined()
      expect(pipeline.processContent).toBeDefined()
      expect(pipeline.getPipelineStatus).toBeDefined()
    })
  })

  describe("processContent", () => {
    it("should process media files and return pipeline ID", async () => {
      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles)

      expect(pipelineId).toBeDefined()
      expect(pipelineId).toMatch(/^pipeline_\d+_/)
    })

    it("should use custom configuration", async () => {
      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const config = {
        sceneAnalysis: {
          enabled: true,
          sensitivity: 0.8,
          minSceneDuration: 1.5,
        },
        contentClassification: {
          enabled: false,
        },
        general: {
          parallel: false,
          timeout: 60000,
        },
      }

      const pipelineId = await pipeline.processContent(mediaFiles, config)
      const status = pipeline.getPipelineStatus(pipelineId)

      expect(status).toBeDefined()
      expect(status?.status).toBe("running")
    })
  })

  describe("Pipeline stages", () => {
    it("should execute scene analysis stage", async () => {
      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles, {
        sceneAnalysis: { enabled: true },
        contentClassification: { enabled: false },
        scriptGeneration: { enabled: false },
        platformAdaptation: { enabled: false },
      })

      // Ждем завершения
      await new Promise((resolve) => setTimeout(resolve, 100))

      const status = pipeline.getPipelineStatus(pipelineId)
      expect(status?.completedStages).toContain("scene_analysis")
    })

    it("should execute content classification stage", async () => {
      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles, {
        sceneAnalysis: { enabled: true },
        contentClassification: { enabled: true },
        scriptGeneration: { enabled: false },
        platformAdaptation: { enabled: false },
      })

      // Ждем завершения
      await new Promise((resolve) => setTimeout(resolve, 100))

      const status = pipeline.getPipelineStatus(pipelineId)
      expect(status?.completedStages).toContain("content_classification")
    })

    it("should execute script generation stage", async () => {
      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles, {
        sceneAnalysis: { enabled: true },
        contentClassification: { enabled: true },
        scriptGeneration: {
          enabled: true,
          style: "documentary",
          tone: "professional",
        },
        platformAdaptation: { enabled: false },
      })

      // Ждем завершения
      await new Promise((resolve) => setTimeout(resolve, 100))

      const status = pipeline.getPipelineStatus(pipelineId)
      expect(status?.completedStages).toContain("script_generation")
    })
  })

  describe("Event handling", () => {
    it("should emit pipeline events", async () => {
      const events: any[] = []
      pipeline.addEventListener((event) => events.push(event))

      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles)

      // Ждем некоторые события
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(events).toContainEqual(expect.objectContaining({ type: "started", pipelineId }))
      expect(events).toContainEqual(expect.objectContaining({ type: "stage_completed" }))
    })

    it("should handle errors and emit error events", async () => {
      const events: any[] = []
      pipeline.addEventListener((event) => events.push(event))

      // Настраиваем мок для возврата ошибки
      mockAIService.sendRequest.mockRejectedValueOnce(new Error("AI service error"))

      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles, {
        scriptGeneration: { enabled: true },
      })

      // Ждем обработку ошибки
      await new Promise((resolve) => setTimeout(resolve, 100))

      const errorEvent = events.find((e) => e.type === "error")
      expect(errorEvent).toBeDefined()
      expect(errorEvent?.error).toContain("AI service error")
    })
  })

  describe("Pipeline management", () => {
    it("should cancel running pipeline", async () => {
      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles)

      // Отменяем pipeline
      const cancelled = pipeline.cancelPipeline(pipelineId)
      expect(cancelled).toBe(true)

      const status = pipeline.getPipelineStatus(pipelineId)
      expect(status?.status).toBe("cancelled")
    })

    it("should not cancel completed pipeline", async () => {
      const mediaFiles: MediaFile[] = [
        {
          id: "file-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          size: 1000000,
          type: "video",
        },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles, {
        sceneAnalysis: { enabled: false },
        contentClassification: { enabled: false },
      })

      // Ждем завершения
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Пытаемся отменить завершенный pipeline
      const cancelled = pipeline.cancelPipeline(pipelineId)
      expect(cancelled).toBe(false)
    })

    it("should clear completed pipelines", async () => {
      // Создаем несколько pipelines
      const pipelineIds = []
      for (let i = 0; i < 3; i++) {
        const id = await pipeline.processContent([
          {
            id: `file-${i}`,
            path: `/test/video${i}.mp4`,
            filename: `video${i}.mp4`,
            size: 1000000,
            type: "video",
          },
        ])
        pipelineIds.push(id)
      }

      // Ждем завершения
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Очищаем завершенные
      pipeline.clearCompleted()

      // Проверяем, что завершенные pipelines удалены
      pipelineIds.forEach((id) => {
        const status = pipeline.getPipelineStatus(id)
        expect(status).toBeUndefined()
      })
    })

    it("should count active pipelines", async () => {
      // Изначально нет активных
      expect(pipeline.getActiveCount()).toBe(0)

      // Запускаем несколько длительных pipelines
      for (let i = 0; i < 3; i++) {
        await pipeline.processContent(
          [
            {
              id: `file-${i}`,
              path: `/test/video${i}.mp4`,
              filename: `video${i}.mp4`,
              size: 1000000,
              type: "video",
            },
          ],
          {
            general: { timeout: 10000 }, // Длительный таймаут
          },
        )
      }

      // Должно быть 3 активных
      expect(pipeline.getActiveCount()).toBe(3)
    })
  })

  describe("Parallel processing", () => {
    it("should process files in parallel", async () => {
      const mediaFiles: MediaFile[] = [
        { id: "1", path: "/1.mp4", filename: "1.mp4", size: 1000, type: "video" },
        { id: "2", path: "/2.mp4", filename: "2.mp4", size: 1000, type: "video" },
        { id: "3", path: "/3.mp4", filename: "3.mp4", size: 1000, type: "video" },
      ]

      const startTime = Date.now()

      const pipelineId = await pipeline.processContent(mediaFiles, {
        general: {
          parallel: true,
          maxConcurrent: 3,
        },
      })

      // Ждем завершения
      await new Promise((resolve) => setTimeout(resolve, 200))

      const endTime = Date.now()
      const duration = endTime - startTime

      // При параллельной обработке должно быть быстрее
      expect(duration).toBeLessThan(500)

      const status = pipeline.getPipelineStatus(pipelineId)
      expect(status?.status).toBe("completed")
    })

    it("should process files sequentially", async () => {
      const mediaFiles: MediaFile[] = [
        { id: "1", path: "/1.mp4", filename: "1.mp4", size: 1000, type: "video" },
        { id: "2", path: "/2.mp4", filename: "2.mp4", size: 1000, type: "video" },
      ]

      const pipelineId = await pipeline.processContent(mediaFiles, {
        general: {
          parallel: false,
        },
      })

      // Ждем завершения
      await new Promise((resolve) => setTimeout(resolve, 200))

      const status = pipeline.getPipelineStatus(pipelineId)
      expect(status?.status).toBe("completed")
    })
  })
})
