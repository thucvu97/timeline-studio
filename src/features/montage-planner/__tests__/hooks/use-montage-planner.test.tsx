/**
 * Tests for useMontagePlanner hook
 */

import type { ReactNode } from "react"

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMontagePlanner } from "../../hooks/use-montage-planner"
import { MontagePlannerProvider } from "../../services/montage-planner-provider"
import { createMockFragments, mockMediaFile, mockMontagePlan } from "../test-utils"


vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}))

describe("useMontagePlanner", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MontagePlannerProvider>{children}</MontagePlannerProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should provide initial state", () => {
    const { result } = renderHook(() => useMontagePlanner(), { wrapper })

    expect(result.current.videos).toHaveLength(0)
    expect(result.current.fragments).toHaveLength(0)
    expect(result.current.currentPlan).toBeNull()
    expect(result.current.isAnalyzing).toBe(false)
    expect(result.current.isGenerating).toBe(false)
    expect(result.current.isReady).toBe(false)
  })

  describe("Video Management", () => {
    it("should add video", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      act(() => {
        result.current.addVideo(mockMediaFile)
      })

      expect(result.current.videos).toHaveLength(1)
      expect(result.current.videos[0]).toEqual(mockMediaFile)
    })

    it("should remove video", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      act(() => {
        result.current.addVideo(mockMediaFile)
      })

      expect(result.current.videos).toHaveLength(1)

      act(() => {
        result.current.removeVideo(mockMediaFile.id)
      })

      expect(result.current.videos).toHaveLength(0)
    })

    it("should clear all videos", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      act(() => {
        result.current.addVideo(mockMediaFile)
        result.current.addVideo({ ...mockMediaFile, id: "file_2" })
      })

      expect(result.current.videos).toHaveLength(2)

      act(() => {
        result.current.clearVideos()
      })

      expect(result.current.videos).toHaveLength(0)
    })
  })

  describe("Analysis", () => {
    it("should start analysis", async () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      act(() => {
        result.current.addVideo(mockMediaFile)
      })

      act(() => {
        result.current.startAnalysis()
      })

      expect(result.current.isAnalyzing).toBe(true)
    })

    it("should handle analysis progress", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      act(() => {
        result.current.addVideo(mockMediaFile)
        result.current.startAnalysis()
      })

      expect(result.current.analysisProgress).toBe(0)

      // Simulate progress update
      act(() => {
        const { send } = result.current as any
        send({ 
          type: "UPDATE_PROGRESS",
          stage: "analysis",
          progress: 50,
          message: "Analyzing...",
        })
      })

      expect(result.current.analysisProgress).toBe(50)
    })
  })

  describe("Plan Generation", () => {
    it("should generate plan with preferences", async () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      // Setup
      act(() => {
        result.current.addVideo(mockMediaFile)
      })

      // Mock analysis complete
      act(() => {
        const { send } = result.current as any
        send({ 
          type: "ANALYSIS_COMPLETE",
          fragments: createMockFragments(10),
          videoAnalysis: {},
          audioAnalysis: {},
        })
      })

      // Generate plan
      act(() => {
        result.current.generatePlan({
          style: "Dynamic Action",
          targetDuration: 60,
        })
      })

      expect(result.current.isGenerating).toBe(true)
    })

    it("should handle plan generation completion", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      // Setup with fragments
      act(() => {
        result.current.addVideo(mockMediaFile)
        const { send } = result.current as any
        send({ 
          type: "ANALYSIS_COMPLETE",
          fragments: createMockFragments(10),
          videoAnalysis: {},
          audioAnalysis: {},
        })
      })

      // Start generation
      act(() => {
        result.current.generatePlan()
      })

      // Complete generation
      act(() => {
        const { send } = result.current as any
        send({ 
          type: "GENERATION_COMPLETE",
          plan: mockMontagePlan,
        })
      })

      expect(result.current.currentPlan).toEqual(mockMontagePlan)
      expect(result.current.isReady).toBe(true)
      expect(result.current.plans).toHaveLength(1)
    })
  })

  describe("Plan Operations", () => {
    it("should optimize plan", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      // Setup with plan
      act(() => {
        result.current.addVideo(mockMediaFile)
        const { send } = result.current as any
        send({ 
          type: "ANALYSIS_COMPLETE",
          fragments: createMockFragments(10),
          videoAnalysis: {},
          audioAnalysis: {},
        })
        send({ 
          type: "GENERATION_COMPLETE",
          plan: mockMontagePlan,
        })
      })

      act(() => {
        result.current.optimizePlan()
      })

      expect(result.current.isOptimizing).toBe(true)
    })

    it("should update plan", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      // Setup with plan
      act(() => {
        const { send } = result.current as any
        send({ 
          type: "GENERATION_COMPLETE",
          plan: mockMontagePlan,
        })
      })

      const updatedPlan = {
        ...mockMontagePlan,
        name: "Updated Plan",
      }

      act(() => {
        result.current.updatePlan(updatedPlan)
      })

      expect(result.current.currentPlan?.name).toBe("Updated Plan")
    })

    it("should delete plan", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      // Setup with plan
      act(() => {
        const { send } = result.current as any
        send({ 
          type: "GENERATION_COMPLETE",
          plan: mockMontagePlan,
        })
      })

      expect(result.current.plans).toHaveLength(1)

      act(() => {
        result.current.deletePlan(mockMontagePlan.id)
      })

      expect(result.current.plans).toHaveLength(0)
      expect(result.current.currentPlan).toBeNull()
    })

    it("should select plan", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      const plan1 = { ...mockMontagePlan, id: "plan_1" }
      const plan2 = { ...mockMontagePlan, id: "plan_2" }

      // Add multiple plans
      act(() => {
        const { send } = result.current as any
        send({ type: "GENERATION_COMPLETE", plan: plan1 })
        send({ type: "GENERATION_COMPLETE", plan: plan2 })
      })

      expect(result.current.currentPlan?.id).toBe("plan_2")

      act(() => {
        result.current.selectPlan("plan_1")
      })

      expect(result.current.currentPlan?.id).toBe("plan_1")
    })
  })

  describe("Statistics", () => {
    it("should calculate utilization rate", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      // Setup with fragments and plan
      const fragments = createMockFragments(10)
      act(() => {
        const { send } = result.current as any
        send({ 
          type: "ANALYSIS_COMPLETE",
          fragments,
          videoAnalysis: {},
          audioAnalysis: {},
        })
        
        // Plan using 5 fragments
        const plan = {
          ...mockMontagePlan,
          sequences: [{
            ...mockMontagePlan.sequences[0],
            clips: fragments.slice(0, 5).map((f, i) => ({
              id: `clip_${i}`,
              fragmentId: f.id,
              startTime: i * 5,
              duration: 5,
              inPoint: 0,
              outPoint: 5,
            })),
          }],
        }
        send({ type: "GENERATION_COMPLETE", plan })
      })

      expect(result.current.utilizationRate).toBe(50) // 5 used out of 10
    })

    it("should calculate plan duration", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      act(() => {
        const { send } = result.current as any
        send({ 
          type: "GENERATION_COMPLETE",
          plan: { ...mockMontagePlan, totalDuration: 120 },
        })
      })

      expect(result.current.planDuration).toBe(120)
    })

    it("should count fragments", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      const fragments = createMockFragments(15)
      act(() => {
        const { send } = result.current as any
        send({ 
          type: "ANALYSIS_COMPLETE",
          fragments,
          videoAnalysis: {},
          audioAnalysis: {},
        })
      })

      expect(result.current.fragmentCount).toBe(15)
    })
  })

  describe("Error Handling", () => {
    it("should handle errors", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      act(() => {
        const { send } = result.current as any
        send({ 
          type: "ANALYSIS_ERROR",
          error: "Test error",
        })
      })

      expect(result.current.error).toBe("Test error")
    })

    it("should clear errors", () => {
      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      act(() => {
        const { send } = result.current as any
        send({ 
          type: "ANALYSIS_ERROR",
          error: "Test error",
        })
      })

      expect(result.current.error).toBe("Test error")

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe("Timeline Integration", () => {
    it("should apply plan to timeline", async () => {
      const mockInvoke = vi.mocked((await import("@tauri-apps/api/core")).invoke)
      mockInvoke.mockResolvedValueOnce({ success: true })

      const { result } = renderHook(() => useMontagePlanner(), { wrapper })

      // Setup with plan
      act(() => {
        const { send } = result.current as any
        send({ 
          type: "GENERATION_COMPLETE",
          plan: mockMontagePlan,
        })
      })

      await act(async () => {
        return result.current.applyPlanToTimeline()
      })

      expect(mockInvoke).toHaveBeenCalledWith("apply_montage_plan", {
        plan: mockMontagePlan,
      })
    })
  })
})