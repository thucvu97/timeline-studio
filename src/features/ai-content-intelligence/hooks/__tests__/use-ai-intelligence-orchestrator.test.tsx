/**
 * Tests for useAIIntelligenceOrchestrator hook
 */

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAIIntelligence } from "../../services/ai-intelligence-provider"
import { AIIntelligenceOrchestrator } from "../../shared/services/ai-intelligence-orchestrator"
import { useAIIntelligenceOrchestrator } from "../use-ai-intelligence-orchestrator"
import { createMockActor, MockAIIntelligenceOrchestrator } from "./test-utils"

// First mock the modules before importing anything that uses them
vi.mock("../../shared/services/ai-intelligence-orchestrator", () => ({
  AIIntelligenceOrchestrator: vi.fn(),
}))

vi.mock("../../services/ai-intelligence-provider", () => ({
  useAIIntelligence: vi.fn(),
}))

describe("useAIIntelligenceOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up default mocks
    vi.mocked(AIIntelligenceOrchestrator).mockImplementation(
      (actor) => new MockAIIntelligenceOrchestrator(actor) as any,
    )
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: createMockActor(),
    })
  })

  it("should return orchestrator instance when actor is available", () => {
    const { result } = renderHook(() => useAIIntelligenceOrchestrator())

    expect(result.current).toBeDefined()
    expect(AIIntelligenceOrchestrator).toHaveBeenCalled()
  })

  it("should return null when actor is not available", () => {
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: null,
    })

    const { result } = renderHook(() => useAIIntelligenceOrchestrator())

    expect(result.current).toBeNull()
  })

  it("should return null when context is not available", () => {
    vi.mocked(useAIIntelligence).mockReturnValue(null as any)

    const { result } = renderHook(() => useAIIntelligenceOrchestrator())

    expect(result.current).toBeNull()
  })

  it("should memoize orchestrator instance", () => {
    const mockActor = createMockActor()
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: mockActor,
    })

    const { result, rerender } = renderHook(() => useAIIntelligenceOrchestrator())

    const firstInstance = result.current

    // Rerender with same actor
    rerender()

    const secondInstance = result.current

    expect(firstInstance).toBe(secondInstance)
    expect(AIIntelligenceOrchestrator).toHaveBeenCalledTimes(1)
  })

  it("should create new orchestrator when actor changes", () => {
    const firstActor = createMockActor()
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: firstActor,
    })

    const { result, rerender } = renderHook(() => useAIIntelligenceOrchestrator())

    const firstInstance = result.current

    // Change actor
    const secondActor = createMockActor()
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: secondActor,
    })

    rerender()

    const secondInstance = result.current

    expect(firstInstance).not.toBe(secondInstance)
    expect(AIIntelligenceOrchestrator).toHaveBeenCalledTimes(2)
    expect(AIIntelligenceOrchestrator).toHaveBeenCalledWith(firstActor)
    expect(AIIntelligenceOrchestrator).toHaveBeenCalledWith(secondActor)
  })

  it("should provide access to orchestrator methods", () => {
    const { result } = renderHook(() => useAIIntelligenceOrchestrator())

    const orchestrator = result.current

    expect(orchestrator).toBeDefined()
    expect(typeof orchestrator?.analyzeContent).toBe("function")
    expect(typeof orchestrator?.generateScript).toBe("function")
    expect(typeof orchestrator?.adaptForPlatforms).toBe("function")
    expect(typeof orchestrator?.processProject).toBe("function")
    expect(typeof orchestrator?.createPipelineControl).toBe("function")
  })

  it("should handle actor becoming null", () => {
    const mockActor = createMockActor()
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: mockActor,
    })

    const { result, rerender } = renderHook(() => useAIIntelligenceOrchestrator())

    expect(result.current).toBeDefined()
    expect(AIIntelligenceOrchestrator).toHaveBeenCalled()

    // Actor becomes null
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: null,
    })

    rerender()

    expect(result.current).toBeNull()
  })

  it("should handle context becoming unavailable", () => {
    const mockActor = createMockActor()
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: mockActor,
    })

    const { result, rerender } = renderHook(() => useAIIntelligenceOrchestrator())

    expect(result.current).toBeDefined()
    expect(AIIntelligenceOrchestrator).toHaveBeenCalled()

    // Context becomes null
    vi.mocked(useAIIntelligence).mockReturnValue(null as any)

    rerender()

    expect(result.current).toBeNull()
  })

  it("should pass actor to orchestrator constructor", () => {
    const mockActor = createMockActor()
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: mockActor,
    })

    renderHook(() => useAIIntelligenceOrchestrator())

    expect(AIIntelligenceOrchestrator).toHaveBeenCalledWith(mockActor)
  })

  it("should not create orchestrator multiple times for same actor", () => {
    const mockActor = createMockActor()
    vi.mocked(useAIIntelligence).mockReturnValue({
      actor: mockActor,
    })

    const { rerender } = renderHook(() => useAIIntelligenceOrchestrator())

    // Multiple rerenders with same actor
    rerender()
    rerender()
    rerender()

    expect(AIIntelligenceOrchestrator).toHaveBeenCalledTimes(1)
  })
})
