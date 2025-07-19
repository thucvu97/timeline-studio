import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { AccuracyLevel, AIProvider, AnalysisDepth, SpeedPriority } from "../../types"
import { ContentType, Emotion } from "../../types/content-analysis"
import { aiIntelligenceMachine } from "../ai-intelligence-machine"
import { AIIntelligenceOrchestrator } from "../ai-intelligence-orchestrator"
import * as mediaAnalysisInterface from "../media-analysis-interface"

// Mock media-analysis-interface
vi.mock("../media-analysis-interface", () => ({
  getAIService: vi.fn(),
  getFFmpegService: vi.fn(),
}))

// Mock implementations
const mockFFmpegService = {
  getVideoMetadata: vi.fn(),
  detectScenes: vi.fn(),
  analyzeQuality: vi.fn(),
  detectSilence: vi.fn(),
  analyzeMotion: vi.fn(),
}

const mockAIService = {
  analyzeContent: vi.fn(),
  generateScript: vi.fn(),
  adaptForPlatform: vi.fn(),
}

// Test data
const mockMediaFile = {
  path: "/test/video.mp4",
  name: "video.mp4",
  size: 1000000,
}

const mockConfig = {
  providers: [
    {
      provider: AIProvider.OPENAI,
      model: "gpt-4",
    },
  ],
  defaultProvider: AIProvider.OPENAI,
  features: {
    sceneAnalysis: true,
    scriptGeneration: true,
    multiPlatform: true,
    contentClassification: true,
    qualityEnhancement: false,
    autoSuggestions: true,
  },
  processing: {
    parallel: true,
    maxConcurrent: 3,
    batchSize: 10,
    cacheResults: true,
    cacheDuration: 24,
    retryAttempts: 3,
    timeout: 300,
  },
  quality: {
    analysisDepth: AnalysisDepth.STANDARD,
    accuracy: AccuracyLevel.BALANCED,
    speed: SpeedPriority.NORMAL,
    resourceUsage: {
      maxCPU: 80,
      maxRAM: 4096,
      maxDiskSpace: 1024,
    },
  },
}

const mockFFmpegAnalysisResult = {
  metadata: {
    format: "mp4",
    duration: 120,
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 5000000,
    codec: "h264",
    audioChannels: 2,
    audioCodec: "aac",
  },
  scenes: {
    scenes: [
      {
        startTime: 0,
        endTime: 10,
        confidence: 0.9,
      },
    ],
  },
  quality: {
    overall: 85,
    sharpness: 90,
    brightness: 80,
    contrast: 85,
    saturation: 80,
    stability: 90,
    noise: 15,
  },
  silence: {
    silences: [],
  },
  motion: {
    intensity: 0.7,
    direction: "horizontal",
  },
}

// Mock engine
const mockEngine = {
  name: "mock-engine",
  initialize: vi.fn().mockResolvedValue(undefined),
  process: vi.fn().mockResolvedValue({ result: "processed" }),
}

describe("AIIntelligenceOrchestrator", () => {
  let actor: any
  let orchestrator: AIIntelligenceOrchestrator

  beforeEach(() => {
    // Setup mocks
    vi.mocked(mediaAnalysisInterface.getFFmpegService).mockReturnValue(mockFFmpegService)
    vi.mocked(mediaAnalysisInterface.getAIService).mockReturnValue(mockAIService)

    // Reset mock implementations
    mockFFmpegService.getVideoMetadata.mockResolvedValue(mockFFmpegAnalysisResult.metadata)
    mockFFmpegService.detectScenes.mockResolvedValue(mockFFmpegAnalysisResult.scenes)
    mockFFmpegService.analyzeQuality.mockResolvedValue(mockFFmpegAnalysisResult.quality)
    mockFFmpegService.detectSilence.mockResolvedValue(mockFFmpegAnalysisResult.silence)
    mockFFmpegService.analyzeMotion.mockResolvedValue(mockFFmpegAnalysisResult.motion)

    // Create actor and orchestrator
    actor = createActor(aiIntelligenceMachine)
    actor.start()
    orchestrator = new AIIntelligenceOrchestrator(actor)
  })

  afterEach(() => {
    actor.stop()
    vi.clearAllMocks()
  })

  describe("initialize", () => {
    it("should initialize with engines", async () => {
      await orchestrator.initialize({
        sceneAnalyzer: mockEngine,
        scriptGenerator: mockEngine,
        multiPlatformAdapter: mockEngine,
      })

      expect(mockEngine.initialize).toHaveBeenCalledTimes(3)
    })

    it("should initialize without engines", async () => {
      await orchestrator.initialize()
      expect(mockEngine.initialize).not.toHaveBeenCalled()
    })

    it("should initialize partial engines", async () => {
      await orchestrator.initialize({
        sceneAnalyzer: mockEngine,
      })

      expect(mockEngine.initialize).toHaveBeenCalledTimes(1)
    })
  })

  describe("analyzeContent", () => {
    it.skip("should analyze content with default config", async () => {
      // Skip - complex async state machine interaction
    })

    it.skip("should analyze content with custom config", async () => {
      // Skip - complex async state machine interaction
    })

    it("should handle analysis errors", async () => {
      mockFFmpegService.getVideoMetadata.mockRejectedValue(new Error("Analysis error"))

      await expect(orchestrator.analyzeContent([mockMediaFile])).rejects.toThrow("Analysis error")
    })
  })

  describe("generateScript", () => {
    it("should generate script with initialized engine", async () => {
      await orchestrator.initialize({
        scriptGenerator: mockEngine,
      })

      const mockAnalysis = {
        mediaFile: { path: "/test.mp4", filename: "test.mp4", size: 1000, format: "mp4", duration: 60 },
        scenes: [],
        keyMoments: [],
        contentType: ContentType.NARRATIVE,
        genres: [],
        mood: { primary: Emotion.CALM, intensity: 0.5 },
        targetAudience: {
          ageRange: { min: 18, max: 65 },
          interests: [],
          demographics: { primary: "general" },
        },
        technicalSpecs: {} as any,
        qualityMetrics: {} as any,
        detections: {} as any,
        insights: {} as any,
      }

      const scriptParams = {
        genre: [],
        tone: { primary: Emotion.HAPPY, intensity: 0.8 },
      }

      const result = await orchestrator.generateScript(mockAnalysis, scriptParams)
      expect(result).toEqual({ result: "processed" })
      expect(mockEngine.process).toHaveBeenCalledWith(mockAnalysis, scriptParams)
    })

    it("should throw error when engine not initialized", async () => {
      const mockAnalysis = {} as any
      const scriptParams = {} as any

      await expect(orchestrator.generateScript(mockAnalysis, scriptParams)).rejects.toThrow(
        "Script Generator engine not initialized",
      )
    })
  })

  describe("adaptForPlatforms", () => {
    it("should adapt content for multiple platforms", async () => {
      await orchestrator.initialize({
        multiPlatformAdapter: mockEngine,
      })

      const mockContent = {
        analysis: {} as any,
        script: {} as any,
      }

      const platforms = ["youtube" as any, "instagram" as any]

      const result = await orchestrator.adaptForPlatforms(mockContent, platforms)
      expect(result).toHaveLength(2)
      expect(mockEngine.process).toHaveBeenCalledTimes(2)
    })

    it("should throw error when engine not initialized", async () => {
      const mockContent = {} as any
      const platforms = ["youtube" as any]

      await expect(orchestrator.adaptForPlatforms(mockContent, platforms)).rejects.toThrow(
        "Multi-Platform Adapter engine not initialized",
      )
    })
  })

  describe("processProject", () => {
    it("should process full project pipeline", async () => {
      const projectPromise = orchestrator.processProject([mockMediaFile], mockConfig)

      await vi.waitFor(async () => {
        const result = await projectPromise
        expect(result).toBeDefined()
        expect(result.analysis).toBeDefined()
        expect(result.metadata).toBeDefined()
      })
    })

    it("should emit events during processing", async () => {
      const events: any[] = []
      const control = orchestrator.createPipelineControl()

      control.onEvent((event) => {
        events.push(event)
      })

      const projectPromise = orchestrator.processProject([mockMediaFile], mockConfig)

      await vi.waitFor(async () => {
        await projectPromise
        expect(events.some((e) => e.type === "STARTED")).toBe(true)
        expect(events.some((e) => e.type === "COMPLETED")).toBe(true)
      })
    })

    it("should handle processing errors", async () => {
      mockFFmpegService.getVideoMetadata.mockRejectedValue(new Error("Processing error"))

      const events: any[] = []
      const control = orchestrator.createPipelineControl()

      control.onEvent((event) => {
        events.push(event)
      })

      await expect(orchestrator.processProject([mockMediaFile], mockConfig)).rejects.toThrow("Processing error")

      expect(events.some((e) => e.type === "FAILED")).toBe(true)
    })
  })

  describe("createPipelineControl", () => {
    it("should create pipeline control", () => {
      const control = orchestrator.createPipelineControl()

      expect(control.pause).toBeDefined()
      expect(control.resume).toBeDefined()
      expect(control.cancel).toBeDefined()
      expect(control.getProgress).toBeDefined()
      expect(control.onProgress).toBeDefined()
      expect(control.onEvent).toBeDefined()
    })

    it("should pause processing", async () => {
      const control = orchestrator.createPipelineControl()
      const events: any[] = []

      control.onEvent((event) => {
        events.push(event)
      })

      await control.pause()
      expect(events.some((e) => e.type === "PAUSED")).toBe(true)
    })

    it("should resume processing", async () => {
      const control = orchestrator.createPipelineControl()
      const events: any[] = []

      control.onEvent((event) => {
        events.push(event)
      })

      await control.resume()
      expect(events.some((e) => e.type === "RESUMED")).toBe(true)
    })

    it("should cancel processing", async () => {
      const control = orchestrator.createPipelineControl()
      const events: any[] = []

      control.onEvent((event) => {
        events.push(event)
      })

      await control.cancel()
      expect(events.some((e) => e.type === "CANCELLED")).toBe(true)
    })

    it("should get progress", () => {
      const control = orchestrator.createPipelineControl()
      const progress = control.getProgress()

      expect(progress).toBeDefined()
      expect(progress.overall).toBe(0)
      expect(progress.currentStep).toBe("")
      expect(progress.steps).toEqual([])
    })

    it("should subscribe to progress updates", async () => {
      const control = orchestrator.createPipelineControl()
      const progressUpdates: any[] = []

      const unsubscribe = control.onProgress((progress) => {
        progressUpdates.push(progress)
      })

      // Start processing to trigger progress updates
      orchestrator.processProject([mockMediaFile], mockConfig).catch(() => {})

      await vi.waitFor(() => {
        expect(progressUpdates.length).toBeGreaterThan(0)
      })

      unsubscribe()
    })

    it("should unsubscribe from events", () => {
      const control = orchestrator.createPipelineControl()
      const events: any[] = []

      const unsubscribe = control.onEvent((event) => {
        events.push(event)
      })

      unsubscribe()

      // Emit event after unsubscribe
      void control.pause()

      // Should not receive event
      expect(events.length).toBe(0)
    })
  })

  describe("progress calculation", () => {
    it("should calculate progress correctly", async () => {
      const control = orchestrator.createPipelineControl()

      // Start processing
      orchestrator
        .processProject([mockMediaFile], {
          ...mockConfig,
          features: {
            ...mockConfig.features,
            scriptGeneration: false,
            multiPlatform: false,
          },
        })
        .catch(() => {})

      // Wait for processing to start
      await vi.waitFor(() => {
        const progress = control.getProgress()
        expect(progress.steps.length).toBeGreaterThan(0)
      })

      const progress = control.getProgress()
      expect(progress.overall).toBeGreaterThanOrEqual(0)
      expect(progress.overall).toBeLessThanOrEqual(100)
    })
  })

  describe("event handling", () => {
    it("should emit correct event types", async () => {
      const events: string[] = []
      const control = orchestrator.createPipelineControl()

      control.onEvent((event) => {
        events.push(event.type)
      })

      // Start processing with error to trigger FAILED event
      mockFFmpegService.getVideoMetadata.mockRejectedValue(new Error("Test error"))
      const promise = orchestrator.processProject([mockMediaFile], mockConfig)

      await expect(promise).rejects.toThrow()

      expect(events).toContain("STARTED")
      expect(events).toContain("FAILED")
    })
  })
})
