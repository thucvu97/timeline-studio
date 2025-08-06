/**
 * Tests for useContentPipeline hook
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PipelineConfig, StepType } from "../../shared/types"
import { useAIIntelligence } from "../use-ai-intelligence"
import { useContentPipeline } from "../use-content-pipeline"
import { createMockIntelligentContent, createMockMediaFile, createMockProgress } from "./test-utils"

// First mock modules before importing
vi.mock("../use-ai-intelligence", () => ({
  useAIIntelligence: vi.fn(),
}))

// Mock useAIIntelligence hook
const mockProcessProject = vi.fn()
const mockPausePipeline = vi.fn()
const mockResumePipeline = vi.fn()
const mockCancelPipeline = vi.fn()
const mockReset = vi.fn()

const mockAIIntelligenceReturn = {
  isInitialized: true,
  isProcessing: false,
  progress: null,
  error: null,
  result: null,
  processProject: mockProcessProject,
  pausePipeline: mockPausePipeline,
  resumePipeline: mockResumePipeline,
  cancelPipeline: mockCancelPipeline,
  reset: mockReset,
  analyzeContent: vi.fn(),
  generateScript: vi.fn(),
  adaptForPlatforms: vi.fn(),
  getOrchestrator: vi.fn(),
}

describe("useContentPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProcessProject.mockResolvedValue(createMockIntelligentContent())
    vi.mocked(useAIIntelligence).mockReturnValue(mockAIIntelligenceReturn)
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useContentPipeline())

    expect(result.current.isRunning).toBe(false)
    expect(result.current.isPaused).toBe(false)
    expect(result.current.progress).toBeNull()
    expect(result.current.currentStep).toBeNull()
    expect(result.current.results).toEqual([])
    expect(result.current.errors).toEqual([])
  })

  it("should initialize with custom config", () => {
    const customConfig = {
      autoPause: true,
      maxConcurrent: 5,
      retryOnError: false,
    }

    const { result } = renderHook(() => useContentPipeline({ config: customConfig as any }))

    expect(result.current.isRunning).toBe(false)
    // Config is stored internally
  })

  describe("pipeline configuration conversion", () => {
    it("should convert PipelineConfig with analysis step to AIConfig", async () => {
      const { result } = renderHook(() => useContentPipeline())

      const pipelineConfig: PipelineConfig = {
        name: "Analysis Pipeline",
        description: "Test pipeline for analysis",
        steps: [
          {
            id: "analyze",
            type: "analyze" as StepType,
            config: { depth: "detailed" },
          },
        ],
        outputs: [
          {
            type: "analysis_report" as any,
            format: "json",
            destination: "output/",
          },
        ],
      }

      const mediaFiles = [createMockMediaFile()]

      await act(async () => {
        await result.current.startPipeline(mediaFiles, pipelineConfig)
      })

      expect(mockProcessProject).toHaveBeenCalledWith(
        mediaFiles,
        expect.objectContaining({
          features: expect.objectContaining({
            sceneAnalysis: true,
            scriptGeneration: false,
            multiPlatform: false,
            contentClassification: false,
            qualityEnhancement: false,
            autoSuggestions: true,
          }),
          quality: expect.objectContaining({
            analysisDepth: "detailed",
          }),
        }),
      )
    })

    it("should convert PipelineConfig with multiple steps to AIConfig", async () => {
      const { result } = renderHook(() => useContentPipeline())

      const pipelineConfig: PipelineConfig = {
        name: "Full Pipeline",
        steps: [
          {
            id: "analyze",
            type: "analyze" as StepType,
            config: { depth: "comprehensive" },
          },
          {
            id: "generate",
            type: "generate" as StepType,
            config: { scriptParams: { style: "narrative" } },
          },
          {
            id: "adapt",
            type: "adapt" as StepType,
            config: { platforms: ["youtube", "tiktok"] },
          },
          {
            id: "classify",
            type: "classify" as StepType,
            config: {},
          },
          {
            id: "enhance",
            type: "enhance" as StepType,
            config: { accuracy: "maximum" },
          },
        ],
        outputs: [],
      }

      const mediaFiles = [createMockMediaFile()]

      await act(async () => {
        await result.current.startPipeline(mediaFiles, pipelineConfig)
      })

      expect(mockProcessProject).toHaveBeenCalledWith(
        mediaFiles,
        expect.objectContaining({
          features: expect.objectContaining({
            sceneAnalysis: true,
            scriptGeneration: true,
            multiPlatform: true,
            contentClassification: true,
            qualityEnhancement: true,
            autoSuggestions: true,
          }),
          quality: expect.objectContaining({
            analysisDepth: "comprehensive",
            accuracy: "maximum",
            speed: "quality", // Should be set to quality for many steps
          }),
          platforms: ["youtube", "tiktok"],
          processing: expect.objectContaining({
            maxConcurrent: 5, // Increased for large pipeline
            batchSize: 15,
          }),
        }),
      )
    })

    it("should handle pipeline with language steps", async () => {
      const { result } = renderHook(() => useContentPipeline())

      const pipelineConfig: PipelineConfig = {
        name: "Multi-language Pipeline",
        steps: [
          {
            id: "analyze",
            type: "analyze" as StepType,
            config: { language: "en" },
          },
          {
            id: "generate",
            type: "generate" as StepType,
            config: { language: "ru" },
          },
        ],
        outputs: [],
      }

      const mediaFiles = [createMockMediaFile()]

      await act(async () => {
        await result.current.startPipeline(mediaFiles, pipelineConfig)
      })

      expect(mockProcessProject).toHaveBeenCalledWith(
        mediaFiles,
        expect.objectContaining({
          languages: expect.objectContaining({
            source: "auto",
            targets: ["en", "ru"],
            autoDetect: true,
            preserveOriginal: true,
          }),
        }),
      )
    })

    it("should convert empty pipeline config", async () => {
      const { result } = renderHook(() => useContentPipeline())

      const pipelineConfig: PipelineConfig = {
        name: "Empty Pipeline",
        steps: [],
        outputs: [],
      }

      const mediaFiles = [createMockMediaFile()]

      await act(async () => {
        await result.current.startPipeline(mediaFiles, pipelineConfig)
      })

      expect(mockProcessProject).toHaveBeenCalledWith(
        mediaFiles,
        expect.objectContaining({
          features: expect.objectContaining({
            sceneAnalysis: false,
            scriptGeneration: false,
            multiPlatform: false,
            contentClassification: false,
            qualityEnhancement: false,
            autoSuggestions: true,
          }),
          quality: expect.objectContaining({
            speed: "fast", // Fast for simple pipeline
          }),
        }),
      )
    })

    it("should optimize settings for large pipelines", async () => {
      const { result } = renderHook(() => useContentPipeline())

      // Pipeline with more than 5 steps
      const pipelineConfig: PipelineConfig = {
        name: "Large Pipeline",
        steps: Array.from({ length: 7 }, (_, i) => ({
          id: `step-${i}`,
          type: "analyze" as StepType,
          config: {},
        })),
        outputs: [],
      }

      const mediaFiles = [createMockMediaFile()]

      await act(async () => {
        await result.current.startPipeline(mediaFiles, pipelineConfig)
      })

      expect(mockProcessProject).toHaveBeenCalledWith(
        mediaFiles,
        expect.objectContaining({
          processing: expect.objectContaining({
            maxConcurrent: 5,
            batchSize: 15,
          }),
          quality: expect.objectContaining({
            speed: "quality",
          }),
        }),
      )
    })
  })

  describe("pipeline processing", () => {
    it("should start pipeline successfully", async () => {
      const { result } = renderHook(() => useContentPipeline())

      const mediaFiles = [createMockMediaFile()]
      const config: PipelineConfig = {
        name: "Test",
        steps: [
          {
            id: "analyze",
            type: "analyze" as StepType,
            config: {},
          },
        ],
        outputs: [],
      }

      await act(async () => {
        await result.current.startPipeline(mediaFiles, config)
      })

      expect(mockProcessProject).toHaveBeenCalledWith(mediaFiles, expect.any(Object))
      expect(result.current.results).toHaveLength(1)
      expect(result.current.results[0]).toEqual(createMockIntelligentContent())
      expect(result.current.isRunning).toBe(false)
    })

    it("should handle pipeline errors", async () => {
      const mockError = new Error("Pipeline failed")
      mockProcessProject.mockRejectedValueOnce(mockError)

      const onEvent = vi.fn()
      const { result } = renderHook(() => useContentPipeline({ onEvent }))

      const mediaFiles = [createMockMediaFile()]
      const config: PipelineConfig = {
        name: "Test Pipeline",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }

      await act(async () => {
        await expect(result.current.startPipeline(mediaFiles, config)).rejects.toThrow("Pipeline failed")
      })

      expect(result.current.errors).toContain(mockError)
      expect(result.current.isRunning).toBe(false)
    })

    it("should update state during processing", async () => {
      const { result } = renderHook(() => useContentPipeline())

      const mediaFiles = [createMockMediaFile()]
      const config: PipelineConfig = {
        name: "Test Pipeline",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }

      expect(result.current.isRunning).toBe(false)

      // Create a delayed mock to check running state
      let resolveProcess: () => void
      const processPromise = new Promise<any>((resolve) => {
        resolveProcess = () => resolve(createMockIntelligentContent())
      })

      mockProcessProject.mockReturnValueOnce(processPromise)

      // Start processing without await
      act(() => {
        void result.current.startPipeline(mediaFiles, config)
      })

      // Should be running now
      expect(result.current.isRunning).toBe(true)

      // Resolve the promise
      await act(async () => {
        resolveProcess!()
        await processPromise
      })

      expect(result.current.isRunning).toBe(false)
    })
  })

  describe("batch processing", () => {
    it("should process batch successfully", async () => {
      const defaultConfig: PipelineConfig = {
        name: "Default",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }

      const { result } = renderHook(() => useContentPipeline({ config: defaultConfig }))

      const batch = [
        { id: "1", mediaFiles: ["/path/to/video1.mp4"] },
        { id: "2", mediaFiles: ["/path/to/video2.mp4"] },
      ]

      const config = {
        items: batch,
        parallel: true,
        maxConcurrent: 2,
        continueOnError: true,
      }

      await act(async () => {
        await result.current.processBatch(config)
      })

      expect(mockProcessProject).toHaveBeenCalledTimes(2)
      expect(result.current.results).toHaveLength(2)
      expect(result.current.isRunning).toBe(false)
    })

    it("should track batch progress", async () => {
      const onBatchProgress = vi.fn()
      const defaultConfig: PipelineConfig = {
        name: "Default",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }

      const { result } = renderHook(() => useContentPipeline({ onBatchProgress, config: defaultConfig }))

      const batch = [
        { id: "1", mediaFiles: ["/path/to/video1.mp4"] },
        { id: "2", mediaFiles: ["/path/to/video2.mp4"] },
      ]

      const config = {
        items: batch,
        parallel: false, // Sequential to ensure order
        maxConcurrent: 1,
        continueOnError: true,
      }

      await act(async () => {
        await result.current.processBatch(config)
      })

      expect(onBatchProgress).toHaveBeenCalled()
    })

    it("should handle batch errors with continueOnError", async () => {
      const mockError = new Error("Item processing failed")
      mockProcessProject.mockResolvedValueOnce(createMockIntelligentContent()).mockRejectedValueOnce(mockError)

      const defaultConfig: PipelineConfig = {
        name: "Default",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }

      const { result } = renderHook(() => useContentPipeline({ config: defaultConfig }))

      const batch = [
        { id: "1", mediaFiles: ["/path/to/video1.mp4"] },
        { id: "2", mediaFiles: ["/path/to/video2.mp4"] },
      ]

      const config = {
        items: batch,
        parallel: false,
        maxConcurrent: 1,
        continueOnError: true,
      }

      await act(async () => {
        await result.current.processBatch(config)
      })

      expect(result.current.results).toHaveLength(1) // Only successful result
      expect(result.current.errors).toHaveLength(1)
      expect(result.current.isRunning).toBe(false)
    })

    it("should stop batch on error when continueOnError is false", async () => {
      const mockError = new Error("Item processing failed")
      mockProcessProject.mockRejectedValueOnce(mockError)

      const defaultConfig: PipelineConfig = {
        name: "Default",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }

      const { result } = renderHook(() => useContentPipeline({ config: defaultConfig }))

      const batch = [
        { id: "1", mediaFiles: ["/path/to/video1.mp4"] },
        { id: "2", mediaFiles: ["/path/to/video2.mp4"] },
      ]

      const config = {
        items: batch,
        parallel: false,
        maxConcurrent: 1,
        continueOnError: false,
      }

      let error: any
      try {
        await act(async () => {
          await result.current.processBatch(config)
        })
      } catch (e) {
        error = e
      }

      expect(error).toBeDefined()
      expect(error.message).toBe("Item processing failed")
      expect(mockProcessProject).toHaveBeenCalledTimes(1) // Should stop after first error
    })
  })

  describe("pipeline control", () => {
    it("should pause pipeline", async () => {
      const { result } = renderHook(() => useContentPipeline())

      // Start processing first to have something to pause
      const config = {
        name: "Test Pipeline",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }
      act(() => {
        void result.current.startPipeline([createMockMediaFile()], config)
      })

      await act(async () => {
        await result.current.pausePipeline()
      })

      expect(mockPausePipeline).toHaveBeenCalled()
      expect(result.current.isPaused).toBe(true)
    })

    it("should resume pipeline", async () => {
      const { result } = renderHook(() => useContentPipeline())

      // Create a delayed mock to keep pipeline running
      let resolveProcess: () => void
      const processPromise = new Promise<any>((resolve) => {
        resolveProcess = () => resolve(createMockIntelligentContent())
      })

      mockProcessProject.mockReturnValueOnce(processPromise)

      // Start processing
      const config = {
        name: "Test Pipeline",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }
      act(() => {
        void result.current.startPipeline([createMockMediaFile()], config)
      })

      // Pipeline should be running
      expect(result.current.isRunning).toBe(true)

      // First pause
      await act(async () => {
        await result.current.pausePipeline()
      })

      expect(result.current.isPaused).toBe(true)
      expect(result.current.isRunning).toBe(true) // Still running, just paused

      await act(async () => {
        await result.current.resumePipeline()
      })

      expect(mockResumePipeline).toHaveBeenCalled()
      expect(result.current.isPaused).toBe(false)

      // Complete the process
      await act(async () => {
        resolveProcess!()
        await processPromise
      })
    })

    it("should stop pipeline", async () => {
      const { result } = renderHook(() => useContentPipeline())

      // Start processing
      const config = {
        name: "Test Pipeline",
        steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
        outputs: [],
      }
      act(() => {
        void result.current.startPipeline([createMockMediaFile()], config)
      })

      await act(async () => {
        await result.current.stopPipeline()
      })

      expect(mockCancelPipeline).toHaveBeenCalled()
      expect(result.current.isRunning).toBe(false)
    })
  })

  describe("results management", () => {
    it("should clear results", async () => {
      const { result } = renderHook(() => useContentPipeline())

      // Process a file first
      await act(async () => {
        await result.current.startPipeline([createMockMediaFile()], {
          name: "Test Pipeline",
          steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
          outputs: [],
        })
      })

      expect(result.current.results).toHaveLength(1)

      act(() => {
        result.current.clearResults()
      })

      expect(result.current.results).toEqual([])
      expect(result.current.errors).toEqual([])
    })

    it("should export results as JSON", async () => {
      const { result } = renderHook(() => useContentPipeline())

      const intelligentContent = createMockIntelligentContent()
      mockProcessProject.mockResolvedValueOnce(intelligentContent)

      await act(async () => {
        await result.current.startPipeline([createMockMediaFile()], {
          name: "Test Pipeline",
          steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
          outputs: [],
        })
      })

      let blob: any
      await act(async () => {
        blob = await result.current.exportResults("json")
      })

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe("application/json")
    })

    it("should export results as CSV", async () => {
      const { result } = renderHook(() => useContentPipeline())

      await act(async () => {
        await result.current.startPipeline([createMockMediaFile()], {
          name: "Test Pipeline",
          steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
          outputs: [],
        })
      })

      let blob: any
      await act(async () => {
        blob = await result.current.exportResults("csv")
      })

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe("text/csv")
    })
  })

  describe("progress tracking", () => {
    it("should track progress updates", async () => {
      const onProgress = vi.fn()
      const mockProgress = createMockProgress()

      // Update mock to return progress
      vi.mocked(useAIIntelligence).mockReturnValue({
        ...mockAIIntelligenceReturn,
        progress: mockProgress,
      })

      const { result } = renderHook(() => useContentPipeline({ onProgress }))

      expect(result.current.progress).toEqual(mockProgress)
      expect(result.current.currentStep).toBe("Analyzing content")
    })

    it("should get step duration", async () => {
      const { result } = renderHook(() => useContentPipeline())

      // This would be populated during actual processing
      const duration = result.current.getStepDuration("Analysis")

      expect(duration).toBeNull() // No timing data yet
    })
  })

  describe("event handling", () => {
    it("should handle pipeline events", async () => {
      const onEvent = vi.fn()
      const { result } = renderHook(() => useContentPipeline({ onEvent }))

      const mediaFiles = [createMockMediaFile()]

      await act(async () => {
        await result.current.startPipeline(mediaFiles, {
          name: "Test Pipeline",
          steps: [{ id: "analyze", type: "analyze" as StepType, config: {} }],
          outputs: [],
        })
      })

      // Events would be emitted during processing
      expect(result.current.results).toHaveLength(1)
    })
  })
})
