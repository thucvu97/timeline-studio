/**
 * Tests for useAIOrchestrator hook
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAIIntelligence } from "../../services/ai-intelligence-provider"
import { AIIntelligenceOrchestrator } from "../../shared/services/ai-intelligence-orchestrator"
import { useAIOrchestrator } from "../use-ai-orchestrator"
import { MockAIIntelligenceOrchestrator, createMockActor } from "./test-utils"

// First mock the modules before importing anything that uses them
vi.mock("../../shared/services/ai-intelligence-orchestrator", () => ({
  AIIntelligenceOrchestrator: vi.fn(),
}))

vi.mock("../../services/ai-intelligence-provider", () => ({
  useAIIntelligence: vi.fn(),
}))

// Mock engines
const mockSceneAnalyzer = {
  name: "SceneAnalyzer",
  version: "1.0.0",
  description: "Mock scene analyzer",
  initialize: vi.fn(),
  process: vi.fn(),
  isReady: vi.fn(() => true),
  getCapabilities: vi.fn(() => ({
    supportsStreaming: false,
    supportsBatch: true,
    supportedFormats: ["mp4", "avi"],
    requiredResources: {
      minRAM: 512,
      recommendedRAM: 1024,
      requiresGPU: false,
    },
  })),
}

const mockScriptGenerator = {
  name: "ScriptGenerator",
  version: "1.0.0",
  description: "Mock script generator",
  initialize: vi.fn(),
  process: vi.fn(),
  isReady: vi.fn(() => true),
  getCapabilities: vi.fn(() => ({
    supportsStreaming: true,
    supportsBatch: false,
    supportedFormats: ["json"],
    requiredResources: {
      minRAM: 256,
      recommendedRAM: 512,
      requiresGPU: false,
    },
  })),
}

describe("useAIOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up default mocks
    vi.mocked(AIIntelligenceOrchestrator).mockImplementation(() => {
      const mockInstance = new MockAIIntelligenceOrchestrator(createMockActor())
      return Object.assign(mockInstance, { initialize: vi.fn() }) as any
    })
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: createMockActor(),
    })
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAIOrchestrator())

    expect(result.current.isInitialized).toBe(false)
    expect(result.current.isInitializing).toBe(false)
    expect(result.current.initError).toBeNull()
    expect(result.current.initialize).toBeDefined()
    expect(result.current.getOrchestrator).toBeDefined()
    expect(result.current.setEngine).toBeDefined()
  })

  it("should get orchestrator instance", () => {
    const { result } = renderHook(() => useAIOrchestrator())

    const orchestrator = result.current.getOrchestrator()

    expect(orchestrator).toBeDefined()
    expect(AIIntelligenceOrchestrator).toHaveBeenCalled()
  })

  describe("initialization", () => {
    it("should initialize orchestrator", async () => {
      const { result } = renderHook(() => useAIOrchestrator())

      await act(async () => {
        await result.current.initialize()
      })

      expect(result.current.isInitialized).toBe(true)
      expect(result.current.isInitializing).toBe(false)
    })

    it("should handle initialization errors", async () => {
      const mockError = new Error("Initialization failed")

      vi.mocked(AIIntelligenceOrchestrator).mockImplementationOnce(
        () =>
          ({
            initialize: vi.fn().mockRejectedValueOnce(mockError),
          }) as any,
      )

      const { result } = renderHook(() => useAIOrchestrator())

      await act(async () => {
        await expect(result.current.initialize()).rejects.toThrow("Initialization failed")
      })

      expect(result.current.isInitialized).toBe(false)
      expect(result.current.initError).toEqual(mockError)
    })

    it("should not re-initialize if already initialized", async () => {
      const mockInitialize = vi.fn()
      vi.mocked(AIIntelligenceOrchestrator).mockImplementation(() => {
        const mockInstance = new MockAIIntelligenceOrchestrator(createMockActor())
        return Object.assign(mockInstance, { initialize: mockInitialize }) as any
      })

      const { result } = renderHook(() => useAIOrchestrator())

      // First initialization
      await act(async () => {
        await result.current.initialize()
      })

      expect(mockInitialize).toHaveBeenCalledTimes(1)

      // Try to initialize again
      await act(async () => {
        await result.current.initialize()
      })

      // Should not call initialize again
      expect(mockInitialize).toHaveBeenCalledTimes(1)
    })

    it("should initialize with custom engines", async () => {
      const mockInitialize = vi.fn()
      vi.mocked(AIIntelligenceOrchestrator).mockImplementation(() => {
        const mockInstance = new MockAIIntelligenceOrchestrator(createMockActor())
        return Object.assign(mockInstance, {
          initialize: mockInitialize,
        }) as any
      })

      const engines = {
        sceneAnalyzer: mockSceneAnalyzer as any,
        scriptGenerator: mockScriptGenerator as any,
      }

      const { result } = renderHook(() => useAIOrchestrator({ engines }))

      await act(async () => {
        await result.current.initialize()
      })

      expect(mockInitialize).toHaveBeenCalledWith(engines)
    })
  })

  describe("engine management", () => {
    it("should set engine dynamically", async () => {
      const mockInitialize = vi.fn()
      vi.mocked(AIIntelligenceOrchestrator).mockImplementation(() => {
        const mockInstance = new MockAIIntelligenceOrchestrator(createMockActor())
        return Object.assign(mockInstance, {
          initialize: mockInitialize,
        }) as any
      })

      const { result } = renderHook(() => useAIOrchestrator())

      // Initialize first
      await act(async () => {
        await result.current.initialize()
      })

      expect(mockInitialize).toHaveBeenCalledTimes(1)

      // Set a new engine
      await act(async () => {
        await result.current.setEngine("sceneAnalyzer", mockSceneAnalyzer as any)
      })

      // Should call initialize again with the new engine
      expect(mockInitialize).toHaveBeenCalledTimes(2)
      expect(mockInitialize).toHaveBeenLastCalledWith({
        sceneAnalyzer: mockSceneAnalyzer,
      })
    })

    it("should update engine reference before initialization", async () => {
      const mockInitialize = vi.fn()
      vi.mocked(AIIntelligenceOrchestrator).mockImplementation(() => {
        const mockInstance = new MockAIIntelligenceOrchestrator(createMockActor())
        return Object.assign(mockInstance, {
          initialize: mockInitialize,
        }) as any
      })

      const { result } = renderHook(() => useAIOrchestrator())

      // Set engine before initialization
      await act(async () => {
        await result.current.setEngine("scriptGenerator", mockScriptGenerator as any)
      })

      // Initialize should be called with the set engine
      await act(async () => {
        await result.current.initialize()
      })

      expect(mockInitialize).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptGenerator: mockScriptGenerator,
        }),
      )
    })
  })

  describe("error handling", () => {
    it("should throw error when getting orchestrator without provider", () => {
      vi.mocked(useAIIntelligence).mockReturnValueOnce(null)

      const { result } = renderHook(() => useAIOrchestrator())

      expect(() => result.current.getOrchestrator()).toThrow("AIIntelligenceOrchestrator not initialized")
    })

    it("should throw error when getting orchestrator with null actor", () => {
      vi.mocked(useAIIntelligence).mockReturnValueOnce({
        actor: null,
      })

      const { result } = renderHook(() => useAIOrchestrator())

      expect(() => result.current.getOrchestrator()).toThrow("AIIntelligenceOrchestrator not initialized")
    })
  })

  describe("state management", () => {
    it("should track initialization state", async () => {
      let resolveInit: () => void
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })

      vi.mocked(AIIntelligenceOrchestrator).mockImplementation(() => {
        const mockInstance = new MockAIIntelligenceOrchestrator(createMockActor())
        return Object.assign(mockInstance, {
          initialize: vi.fn(() => initPromise),
        }) as any
      })

      const { result } = renderHook(() => useAIOrchestrator())

      expect(result.current.isInitializing).toBe(false)

      // Start initialization
      act(() => {
        void result.current.initialize()
      })

      expect(result.current.isInitializing).toBe(true)

      // Resolve initialization
      await act(async () => {
        resolveInit!()
        await initPromise
      })

      expect(result.current.isInitializing).toBe(false)
      expect(result.current.isInitialized).toBe(true)
    })
  })
})
