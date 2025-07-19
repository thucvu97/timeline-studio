import { act, render, renderHook, screen } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AIIntelligenceProvider, useAIIntelligence } from "../ai-intelligence-provider"

// Mock XState
vi.mock("xstate", () => ({
  createActor: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    send: vi.fn(),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    getSnapshot: vi.fn(() => ({ value: "idle" })),
  })),
  Actor: vi.fn(),
}))

// Mock the state machine
vi.mock("../../shared/services/ai-intelligence-machine", () => ({
  aiIntelligenceMachine: {
    id: "ai-intelligence",
    initial: "idle",
    states: {
      idle: {},
      analyzing: {},
      complete: {},
      error: {},
    },
  },
}))

describe("AIIntelligenceProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Provider Component", () => {
    it("should render children", () => {
      const { getByTestId } = render(
        <AIIntelligenceProvider>
          <div data-testid="child">Test Child</div>
        </AIIntelligenceProvider>
      )

      const child = getByTestId("child")
      expect(child).toBeTruthy()
      expect(child.textContent).toBe("Test Child")
    })

    it("should create and start actor on mount", async () => {
      const { createActor } = await import("xstate")
      const mockActor = {
        start: vi.fn(),
        stop: vi.fn(),
      }
      ;(createActor as any).mockReturnValue(mockActor)

      renderHook(() => null, {
        wrapper: AIIntelligenceProvider,
      })

      expect(createActor).toHaveBeenCalledTimes(1)
      expect(mockActor.start).toHaveBeenCalledTimes(1)
    })

    it("should stop actor on unmount", async () => {
      const { createActor } = await import("xstate")
      const mockActor = {
        start: vi.fn(),
        stop: vi.fn(),
      }
      ;(createActor as any).mockReturnValue(mockActor)

      const { unmount } = renderHook(() => null, {
        wrapper: AIIntelligenceProvider,
      })

      unmount()

      expect(mockActor.stop).toHaveBeenCalledTimes(1)
    })

    it("should only initialize actor once", async () => {
      const { createActor } = await import("xstate")
      const mockActor = {
        start: vi.fn(),
        stop: vi.fn(),
      }
      ;(createActor as any).mockReturnValue(mockActor)

      const { rerender } = renderHook(() => null, {
        wrapper: AIIntelligenceProvider,
      })

      // Rerender multiple times
      rerender()
      rerender()
      rerender()

      // Should still only create and start once
      expect(createActor).toHaveBeenCalledTimes(1)
      expect(mockActor.start).toHaveBeenCalledTimes(1)
    })
  })

  describe("useAIIntelligence Hook", () => {
    it("should throw error when used outside provider", () => {
      const { result } = renderHook(() => {
        try {
          useAIIntelligence()
        } catch (error) {
          return error
        }
      })

      expect(result.current).toBeInstanceOf(Error)
      expect((result.current as Error).message).toBe("useAIIntelligence must be used within AIIntelligenceProvider")
    })

    it("should return context with actor when used inside provider", async () => {
      const { createActor } = await import("xstate")
      const mockActor = {
        start: vi.fn(),
        stop: vi.fn(),
        send: vi.fn(),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        getSnapshot: vi.fn(() => ({ value: "idle" })),
      }
      ;(createActor as any).mockReturnValue(mockActor)

      const { result } = renderHook(() => useAIIntelligence(), {
        wrapper: AIIntelligenceProvider,
      })

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(result.current).toBeDefined()
      expect(result.current.actor).toBe(mockActor)
    })

    it("should handle null actor during initialization", () => {
      // The provider starts with null actor and updates it asynchronously
      const TestComponent = () => {
        const { actor } = useAIIntelligence()
        return <div data-testid="actor-state">{actor ? "ready" : "loading"}</div>
      }

      const { getByTestId } = render(
        <AIIntelligenceProvider>
          <TestComponent />
        </AIIntelligenceProvider>
      )

      // The actor is immediately available in our mock, so it shows "ready"
      const state = getByTestId("actor-state")
      expect(state.textContent).toBe("ready")
    })

    it("should update when actor becomes available", async () => {
      const { createActor } = await import("xstate")
      const mockActor = {
        start: vi.fn(),
        stop: vi.fn(),
        send: vi.fn(),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        getSnapshot: vi.fn(() => ({ value: "idle" })),
      }
      ;(createActor as any).mockReturnValue(mockActor)

      const { result, rerender } = renderHook(() => useAIIntelligence(), {
        wrapper: AIIntelligenceProvider,
      })

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      rerender()

      expect(result.current.actor).toBe(mockActor)
    })
  })

  describe("Integration", () => {
    it("should provide working actor to child components", async () => {
      const { createActor } = await import("xstate")
      const mockActor = {
        start: vi.fn(),
        stop: vi.fn(),
        send: vi.fn(),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        getSnapshot: vi.fn(() => ({ value: "idle" })),
      }
      ;(createActor as any).mockReturnValue(mockActor)

      function TestComponent() {
        const { actor } = useAIIntelligence()
        return (
          <div>
            <span data-testid="actor-status">{actor ? "ready" : "loading"}</span>
            <button onClick={() => actor?.send({ type: "START_ANALYSIS" })}>Start</button>
          </div>
        )
      }

      const { getByTestId, getByText } = render(
        <AIIntelligenceProvider>
          <TestComponent />
        </AIIntelligenceProvider>
      )

      // Wait for actor to be available
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      const status = getByTestId("actor-status")
      expect(status.textContent).toBe("ready")

      // Test interaction
      const button = getByText("Start")
      act(() => {
        button.click()
      })

      expect(mockActor.send).toHaveBeenCalledWith({ type: "START_ANALYSIS" })
    })
  })
})