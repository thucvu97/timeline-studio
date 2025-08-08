import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Actor } from "xstate"
import type { aiIntelligenceMachine } from "../../../shared/services/ai-intelligence-machine"
import { AIIntelligenceOrchestrator } from "../../../shared/services/ai-intelligence-orchestrator"
import { AIProvider, ProcessingStatus } from "../../../shared/types"

// Мокируем shared services
vi.mock("@/shared/services/ai", async () => {
  const mocks = await import("@/shared/services/ai/__mocks__")
  return {
    getAIContainer: () => mocks.createMockDIContainer(),
  }
})

// Мокируем engine factory
vi.mock("../../../factories/engine-factory", () => ({
  getEngineFactory: vi.fn(() => ({
    createAllEngines: vi.fn(async () => ({
      sceneEngine: {
        analyzeScenes: vi.fn(async (_mediaFile: any, _options: any) => [
          {
            id: "scene-1",
            start: 0,
            end: 10,
            type: "intro",
            confidence: 0.95,
            qualityScore: 8,
          },
          {
            id: "scene-2",
            start: 10,
            end: 20,
            type: "main",
            confidence: 0.92,
            qualityScore: 7,
          },
        ]),
      },
      scriptEngine: {
        generateScript: vi.fn(async (_data: any, params: any) => ({
          title: "Generated Script",
          scenes: [
            { id: "1", content: "Scene 1" },
            { id: "2", content: "Scene 2" },
          ],
          metadata: { style: params.style || "documentary" },
        })),
      },
    })),
  })),
}))

// Мок для Actor
class MockActor implements Partial<Actor<any>> {
  public state: any = { matches: () => false, context: { steps: [], errors: [] } }
  private subscribers: Array<(snapshot: any) => void> = []

  subscribe(observer: any): any {
    if (typeof observer === 'function') {
      this.subscribers.push(observer)
      return { unsubscribe: () => {} }
    }
    // Handle Observer object
    return { unsubscribe: () => {} }
  }

  send(event: any) {
    // Симулируем обработку событий
    if (event.type === "START_ANALYSIS") {
      setTimeout(() => {
        this.state = {
          matches: (state: string) => state === "analysisComplete",
          context: {
            ...this.state.context,
            analysis: {
              scenes: [{ id: "1", start: 0, end: 10 }],
              quality: { overall: 85 },
            },
          },
        }
        this.notifySubscribers()
      }, 10)
    }
  }

  getSnapshot() {
    return this.state
  }

  stop(): any {
    // Return this to satisfy type requirement
    return this
  }

  public notifySubscribers() {
    this.subscribers.forEach((sub) => sub(this.state))
  }
}

describe("AIIntelligenceOrchestrator", () => {
  let orchestrator: AIIntelligenceOrchestrator
  let mockActor: MockActor

  beforeEach(async () => {
    vi.clearAllMocks()

    // Создаем мок актора
    mockActor = new MockActor()

    // Создаем оркестратор с мок актором
    orchestrator = new AIIntelligenceOrchestrator(mockActor as any)

    // Инициализируем с движками
    await orchestrator.initialize()
  })

  describe("Initialization", () => {
    it("should initialize with engines", async () => {
      const newOrchestrator = new AIIntelligenceOrchestrator(mockActor as any)
      await newOrchestrator.initialize()

      // Проверяем, что движки загружены
      expect(vi.mocked(await import("../../../factories/engine-factory")).getEngineFactory).toHaveBeenCalled()
    })

    it("should work without explicit engines", async () => {
      const newOrchestrator = new AIIntelligenceOrchestrator(mockActor as any)
      await newOrchestrator.initialize()

      // Должен загрузить движки через DI
      expect(newOrchestrator).toBeDefined()
    })
  })

  describe("analyzeContent", () => {
    it("should analyze media files", async () => {
      const mediaFiles = [
        { path: "/test/video1.mp4", name: "video1.mp4" },
        { path: "/test/video2.mp4", name: "video2.mp4" },
      ]

      const config = {
        features: {
          sceneAnalysis: true,
          contentClassification: true,
        },
      }

      const result = await orchestrator.analyzeContent(mediaFiles, config)

      expect(result).toBeDefined()
      expect(result.scenes).toBeDefined()
      expect(result.quality).toBeDefined()
    })

    it("should handle analysis errors", async () => {
      // Модифицируем мок для возврата ошибки
      mockActor.send = (event: any) => {
        if (event.type === "START_ANALYSIS") {
          setTimeout(() => {
            mockActor.state = {
              matches: (state: string) => state === "error",
              context: {
                errors: [{ message: "Analysis failed" }],
              },
            }
            mockActor.notifySubscribers()
          }, 10)
        }
      }

      const mediaFiles = [{ path: "/test/error.mp4", name: "error.mp4" }]

      await expect(orchestrator.analyzeContent(mediaFiles)).rejects.toThrow("Analysis failed")
    })
  })

  describe("generateScript", () => {
    it("should generate script from analysis", async () => {
      const analysis = {
        scenes: [{ id: "1", content: "Scene 1" }],
        metadata: { duration: 60 },
      }

      const params = {
        style: "documentary",
        tone: "professional",
      }

      const result = await orchestrator.generateScript(analysis as any, params)

      expect(result).toBeDefined()
      expect(result.title).toBe("Generated Script")
      expect(result.scenes).toHaveLength(2)
    })

    it("should throw error if script generator not initialized", async () => {
      // Создаем новый оркестратор без инициализации
      const newOrchestrator = new AIIntelligenceOrchestrator(mockActor as any)

      await expect(newOrchestrator.generateScript({} as any, {})).rejects.toThrow(
        "Script Generator engine not initialized",
      )
    })
  })

  describe("adaptForPlatforms", () => {
    it("should adapt content for multiple platforms", async () => {
      const content = {
        analysis: { scenes: [] },
        script: { title: "Test" },
      }

      const platforms = ["youtube", "instagram", "tiktok"]

      // Инициализируем с мок адаптером
      await orchestrator.initialize({
        multiPlatformAdapter: {
          name: "MultiPlatformAdapter",
          initialize: async () => {},
          process: async (_content: any, config: any) => ({
            platform: config.platformId,
            adaptedContent: `Adapted for ${config.platformId}`,
          }),
        },
      })

      const results = await orchestrator.adaptForPlatforms(content, platforms)

      expect(results).toHaveLength(3)
      expect(results[0].platform).toBe("youtube")
    })

    it("should throw error if adapter not initialized", async () => {
      const content = { analysis: {}, script: {} }

      await expect(orchestrator.adaptForPlatforms(content, ["youtube"])).rejects.toThrow(
        "Multi-Platform Adapter engine not initialized",
      )
    })
  })

  describe("processProject", () => {
    it("should process full project pipeline", async () => {
      // Настраиваем мок для полного процесса
      mockActor.send = (event: any) => {
        if (event.type === "START_ANALYSIS") {
          setTimeout(() => {
            // Симулируем прогресс
            mockActor.state = {
              matches: (_state: string) => false,
              context: {
                progress: 50,
                currentStep: "analyzing",
                steps: [{ name: "analysis", status: ProcessingStatus.RUNNING }],
              },
            }
            mockActor.notifySubscribers()

            // Завершаем процесс
            setTimeout(() => {
              mockActor.state = {
                matches: (state: string) => state === "complete",
                context: {
                  result: {
                    id: "result-1",
                    analysis: { quality: 90 },
                    script: { title: "Processed" },
                    adaptations: [],
                  },
                },
              }
              mockActor.notifySubscribers()
            }, 10)
          }, 10)
        }
      }

      const mediaFiles = [{ path: "/test/video.mp4", name: "video.mp4" }]
      const config = {
        providers: [{ provider: AIProvider.OPENAI, model: "gpt-4" }],
        defaultProvider: AIProvider.OPENAI,
        features: {
          sceneAnalysis: true,
          scriptGeneration: true,
          multiPlatform: false,
        },
        processing: { parallel: true },
        quality: { analysisDepth: "STANDARD" as any },
      }

      const progressUpdates: any[] = []
      const eventUpdates: any[] = []

      // Создаем контрол
      const control = orchestrator.createPipelineControl()
      control.onProgress((progress: any) => progressUpdates.push(progress))
      control.onEvent((event: any) => eventUpdates.push(event))

      const result = await orchestrator.processProject(mediaFiles, config)

      expect(result).toBeDefined()
      expect(result.id).toBe("result-1")
      expect(eventUpdates).toContainEqual(expect.objectContaining({ type: "STARTED" }))
      expect(eventUpdates).toContainEqual(expect.objectContaining({ type: "COMPLETED" }))
    })

    it("should handle cancellation", async () => {
      mockActor.send = (event: any) => {
        if (event.type === "CANCEL") {
          setTimeout(() => {
            mockActor.state = {
              matches: (state: string) => state === "cancelled",
              context: { errors: [] },
            }
            mockActor.notifySubscribers()
          }, 10)
        }
      }

      const control = orchestrator.createPipelineControl()

      const projectPromise = orchestrator.processProject([{ path: "/test/video.mp4", name: "video.mp4" }], {} as any)

      // Отменяем через небольшую задержку
      setTimeout(() => control.cancel(), 5)

      await expect(projectPromise).rejects.toThrow()
    })
  })

  describe("Pipeline control", () => {
    it("should create pipeline control", () => {
      const control = orchestrator.createPipelineControl()

      expect(control).toBeDefined()
      expect(control.pause).toBeDefined()
      expect(control.resume).toBeDefined()
      expect(control.cancel).toBeDefined()
      expect(control.getProgress).toBeDefined()
      expect(control.onProgress).toBeDefined()
      expect(control.onEvent).toBeDefined()
    })

    it("should handle pause and resume", async () => {
      const control = orchestrator.createPipelineControl()
      const events: any[] = []

      control.onEvent((event) => events.push(event))

      await control.pause()
      expect(events).toContainEqual(expect.objectContaining({ type: "PAUSED" }))

      await control.resume()
      expect(events).toContainEqual(expect.objectContaining({ type: "RESUMED" }))
    })

    it("should get current progress", () => {
      const control = orchestrator.createPipelineControl()
      const progress = control.getProgress()

      expect(progress).toBeDefined()
      expect(progress.overall).toBe(0)
      expect(progress.currentStep).toBe("")
      expect(progress.steps).toEqual([])
    })
  })
})
