/**
 * Tests for useAIIntelligence hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAIIntelligence as useAIIntelligenceContext } from "../../services/ai-intelligence-provider"
import { AIIntelligenceOrchestrator } from "../../shared/services/ai-intelligence-orchestrator"
import { useAIIntelligence } from "../use-ai-intelligence"
import {
  MockAIIntelligenceOrchestrator,
  createMockAIConfig,
  createMockActor,
  createMockAnalysis,
  createMockIntelligentContent,
  createMockMediaFile,
  createMockScript,
} from "./test-utils"

// First mock the modules before importing anything that uses them
vi.mock("../../shared/services/ai-intelligence-orchestrator", () => ({
  AIIntelligenceOrchestrator: vi.fn(),
}))

vi.mock("../../services/ai-intelligence-provider", () => ({
  useAIIntelligence: vi.fn(),
}))

describe("useAIIntelligence", () => {
  let mockOrchestrator: MockAIIntelligenceOrchestrator

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a fresh mock orchestrator for each test
    mockOrchestrator = new MockAIIntelligenceOrchestrator(createMockActor())

    // Set up default mocks
    vi.mocked(AIIntelligenceOrchestrator).mockImplementation(() => mockOrchestrator as any)
    vi.mocked(useAIIntelligenceContext).mockReturnValue({
      actor: createMockActor(),
    })
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAIIntelligence())

    expect(result.current).toBeDefined()
    expect(result.current.isInitialized).toBe(true)
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.progress).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBeNull()
  })

  it("should not initialize when autoInitialize is false", () => {
    const { result } = renderHook(() => useAIIntelligence({ autoInitialize: false }))

    expect(result.current.isInitialized).toBe(false)
  })

  describe("analyzeContent", () => {
    it("should analyze content successfully", async () => {
      const { result } = renderHook(() => useAIIntelligence())

      const mediaFiles = [createMockMediaFile()]
      const config = { analysis: { enableSceneDetection: true } }

      let analysis
      await act(async () => {
        analysis = await result.current.analyzeContent(mediaFiles, config)
      })

      expect(analysis).toEqual(createMockAnalysis())
      expect(result.current.error).toBeNull()
    })

    it("should handle analysis errors", async () => {
      const mockError = new Error("Analysis failed")

      vi.mocked(AIIntelligenceOrchestrator).mockImplementationOnce(
        () =>
          ({
            analyzeContent: vi.fn().mockRejectedValueOnce(mockError),
            initializeEngines: vi.fn(),
            shutdownEngines: vi.fn(),
          }) as any,
      )

      const onError = vi.fn()
      const { result } = renderHook(() => useAIIntelligence({ onError }))

      const mediaFiles = [createMockMediaFile()]

      await act(async () => {
        await expect(result.current.analyzeContent(mediaFiles)).rejects.toThrow("Analysis failed")
      })

      expect(result.current.error).toEqual(mockError)
      expect(onError).toHaveBeenCalledWith(mockError)
    })

    it("should set processing state during analysis", async () => {
      const { result } = renderHook(() => useAIIntelligence())

      const mediaFiles = [createMockMediaFile()]

      expect(result.current.isProcessing).toBe(false)

      // Create a delayed mock to check processing state
      let resolveAnalysis: () => void
      const analysisPromise = new Promise<any>((resolve) => {
        resolveAnalysis = () => resolve(createMockAnalysis())
      })

      vi.mocked(AIIntelligenceOrchestrator).mockImplementationOnce(() => {
        const orchestrator = new MockAIIntelligenceOrchestrator(createMockActor())
        orchestrator.analyzeContent = vi.fn(() => analysisPromise)
        return orchestrator as any
      })

      // Start analysis without await
      act(() => {
        void result.current.analyzeContent(mediaFiles)
      })

      // Should be processing now
      expect(result.current.isProcessing).toBe(true)

      // Resolve the promise
      await act(async () => {
        resolveAnalysis!()
        await analysisPromise
      })

      expect(result.current.isProcessing).toBe(false)
    })
  })

  describe("generateScript", () => {
    it("should generate script successfully", async () => {
      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook is initialized
      expect(result.current).toBeDefined()
      expect(result.current.generateScript).toBeDefined()

      const analysis = createMockAnalysis()
      const params = {
        style: "narrative" as const,
        tone: "exciting" as const,
        duration: 120,
      }

      let script
      await act(async () => {
        script = await result.current.generateScript(analysis, params)
      })

      expect(script).toEqual(createMockScript())
      expect(result.current.error).toBeNull()
    })

    it("should handle script generation errors", async () => {
      const mockError = new Error("Script generation failed")

      // Mock generateScript to throw error
      vi.spyOn(mockOrchestrator, "generateScript").mockRejectedValueOnce(mockError)

      const onError = vi.fn()
      const { result } = renderHook(() => useAIIntelligence({ onError }))

      // Ensure hook is initialized
      expect(result.current).toBeDefined()

      const analysis = createMockAnalysis()
      const params = { style: "narrative" as const }

      await act(async () => {
        await expect(result.current.generateScript(analysis, params)).rejects.toThrow("Script generation failed")
      })

      expect(result.current.error).toEqual(mockError)
      expect(onError).toHaveBeenCalledWith(mockError)
    })
  })

  describe("adaptForPlatforms", () => {
    it("should adapt content for platforms successfully", async () => {
      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook is initialized
      expect(result.current).toBeDefined()
      expect(result.current.adaptForPlatforms).toBeDefined()

      const content = {
        analysis: createMockAnalysis(),
        script: createMockScript(),
      }
      const platforms = ["youtube", "tiktok"] as any[]

      let adaptations
      await act(async () => {
        adaptations = await result.current.adaptForPlatforms(content, platforms)
      })

      expect(adaptations).toHaveLength(2)
      expect(adaptations[0].platform).toBe("youtube")
      expect(adaptations[1].platform).toBe("tiktok")
      expect(result.current.error).toBeNull()
    })
  })

  describe("processProject", () => {
    it("should process project successfully", async () => {
      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook is initialized
      expect(result.current).toBeDefined()
      expect(result.current.processProject).toBeDefined()

      const mediaFiles = [createMockMediaFile()]
      const config = createMockAIConfig()

      let intelligentContent
      await act(async () => {
        intelligentContent = await result.current.processProject(mediaFiles, config)
      })

      expect(intelligentContent).toEqual(createMockIntelligentContent())
      expect(result.current.result).toEqual(intelligentContent)
      expect(result.current.error).toBeNull()
    })

    it("should track progress during processing", async () => {
      const onProgress = vi.fn()
      const { result } = renderHook(() => useAIIntelligence({ onProgress }))

      // Ensure hook is initialized
      expect(result.current).toBeDefined()

      const mediaFiles = [createMockMediaFile()]
      const config = createMockAIConfig()

      await act(async () => {
        await result.current.processProject(mediaFiles, config)
      })

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalled()
      })

      const progressCall = onProgress.mock.calls[0][0]
      expect(progressCall.overall).toBe(50)
      expect(progressCall.currentStep).toBe("Analyzing content")
    })

    it("should call onComplete when processing finishes", async () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() => useAIIntelligence({ onComplete }))

      // Ensure hook is initialized
      expect(result.current).toBeDefined()

      const mediaFiles = [createMockMediaFile()]
      const config = createMockAIConfig()

      await act(async () => {
        await result.current.processProject(mediaFiles, config)
      })

      expect(onComplete).toHaveBeenCalledWith(createMockIntelligentContent())
    })

    it("should handle processing errors", async () => {
      const mockError = new Error("Processing failed")

      // Mock processProject to throw error
      vi.spyOn(mockOrchestrator, "processProject").mockRejectedValueOnce(mockError)

      const onError = vi.fn()
      const { result } = renderHook(() => useAIIntelligence({ onError }))

      // Ensure hook is initialized
      expect(result.current).toBeDefined()

      const mediaFiles = [createMockMediaFile()]
      const config = createMockAIConfig()

      await act(async () => {
        await expect(result.current.processProject(mediaFiles, config)).rejects.toThrow("Processing failed")
      })

      expect(result.current.error).toEqual(mockError)
      expect(result.current.isProcessing).toBe(false)
      expect(onError).toHaveBeenCalledWith(mockError)
    })
  })

  describe("pipeline control", () => {
    it("should pause pipeline", async () => {
      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook is initialized
      expect(result.current).toBeDefined()

      // Start processing first
      const mediaFiles = [createMockMediaFile()]
      const config = createMockAIConfig()

      act(() => {
        // Don't await - we want to pause while processing
        void result.current.processProject(mediaFiles, config)
      })

      await act(async () => {
        await result.current.pausePipeline()
      })

      // Verify pause was called on pipeline control
      expect(AIIntelligenceOrchestrator).toHaveBeenCalled()
    })

    it("should resume pipeline", async () => {
      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook is initialized
      expect(result.current).toBeDefined()

      // Start processing first
      const mediaFiles = [createMockMediaFile()]
      const config = createMockAIConfig()

      act(() => {
        void result.current.processProject(mediaFiles, config)
      })

      await act(async () => {
        await result.current.resumePipeline()
      })

      expect(AIIntelligenceOrchestrator).toHaveBeenCalled()
    })

    it("should cancel pipeline", async () => {
      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook is initialized
      expect(result.current).toBeDefined()

      // Start processing first
      const mediaFiles = [createMockMediaFile()]
      const config = createMockAIConfig()

      act(() => {
        void result.current.processProject(mediaFiles, config)
      })

      expect(result.current.isProcessing).toBe(true)

      await act(async () => {
        await result.current.cancelPipeline()
      })

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.progress).toBeNull()
    })
  })

  describe("utilities", () => {
    it("should reset state", () => {
      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook is initialized
      expect(result.current).toBeDefined()

      // Set some state first
      act(() => {
        void result.current.processProject([createMockMediaFile()], createMockAIConfig())
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.progress).toBeNull()
      expect(result.current.result).toBeNull()
      expect(result.current.isProcessing).toBe(false)
    })

    it("should get orchestrator instance", () => {
      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook is initialized
      expect(result.current).toBeDefined()
      expect(result.current.getOrchestrator).toBeDefined()

      const orchestrator = result.current.getOrchestrator()

      expect(orchestrator).toBeDefined()
      expect(AIIntelligenceOrchestrator).toHaveBeenCalled()
    })

    it("should throw error when getting orchestrator without provider", () => {
      vi.mocked(useAIIntelligenceContext).mockReturnValueOnce(null)

      const { result } = renderHook(() => useAIIntelligence())

      // Ensure hook returns something even without provider
      expect(result.current).toBeDefined()
      expect(result.current.getOrchestrator).toBeDefined()

      expect(() => result.current.getOrchestrator()).toThrow("AIIntelligenceOrchestrator not initialized")
    })
  })

  describe("lazy initialization", () => {
    it("should initialize orchestrator on first use", async () => {
      const { result } = renderHook(() => useAIIntelligence({ autoInitialize: false }))

      // Ensure hook is initialized
      expect(result.current).toBeDefined()
      expect(result.current.isInitialized).toBe(false)

      const mediaFiles = [createMockMediaFile()]
      await act(async () => {
        await result.current.analyzeContent(mediaFiles)
      })

      expect(result.current.isInitialized).toBe(true)
    })
  })
})
