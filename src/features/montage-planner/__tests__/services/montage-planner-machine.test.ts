/**
 * Tests for Smart Montage Planner XState machine
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { montagePlannerMachine } from "../../services/montage-planner-machine"
import { AnalysisPhase } from "../../types"
import { createMockFragments, mockFragment, mockMediaFile, mockMontagePlan } from "../test-utils"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("MontagePlannerMachine", () => {
  let actor: ReturnType<typeof createActor<typeof montagePlannerMachine>>

  beforeEach(() => {
    actor = createActor(montagePlannerMachine)
    vi.clearAllMocks()
  })

  it("should start in idle state", () => {
    actor.start()
    expect(actor.getSnapshot().value).toBe("idle")
    expect(actor.getSnapshot().context.videoIds).toHaveLength(0)
    expect(actor.getSnapshot().context.fragments).toHaveLength(0)
  })

  describe("Video Management", () => {
    it("should add video to context", () => {
      actor.start()
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.context.videoIds).toHaveLength(1)
      expect(snapshot.context.mediaFiles.get(mockMediaFile.id)).toEqual(mockMediaFile)
    })

    it("should remove video from context", () => {
      actor.start()
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      actor.send({ type: "REMOVE_VIDEO", videoId: mockMediaFile.id })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.context.videoIds).toHaveLength(0)
    })

    it("should not add duplicate videos", () => {
      actor.start()
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.context.videoIds).toHaveLength(1)
    })
  })

  describe("Analysis Flow", () => {
    it("should transition to analyzing state when starting analysis", () => {
      actor.start()
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      actor.send({ type: "START_ANALYSIS" })
      
      expect(actor.getSnapshot().value).toBe("analyzing")
    })

    it("should handle analysis complete event", () => {
      actor.start()
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      actor.send({ type: "START_ANALYSIS" })
      
      const fragments = createMockFragments(10)
      actor.send({ 
        type: "ANALYSIS_COMPLETE", 
        fragments,
        videoAnalysis: {},
        audioAnalysis: {},
      })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("idle")
      expect(snapshot.context.fragments).toHaveLength(10)
    })

    it("should handle analysis error", () => {
      actor.start()
      actor.send({ type: "START_ANALYSIS" })
      actor.send({ 
        type: "ANALYSIS_ERROR", 
        error: "Analysis failed" 
      })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("error")
      expect(snapshot.context.error).toBe("Analysis failed")
    })
  })

  describe("Plan Generation", () => {
    it("should transition to generating state", () => {
      actor.start()
      
      // Setup context with fragments
      const fragments = createMockFragments(10)
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      actor.send({ type: "START_ANALYSIS" })
      actor.send({ 
        type: "ANALYSIS_COMPLETE", 
        fragments,
        videoAnalysis: {},
        audioAnalysis: {},
      })
      
      // Start generation
      actor.send({ 
        type: "GENERATE_PLAN",
        preferences: {
          style: "Dynamic Action",
          targetDuration: 60,
          qualityThreshold: 70,
          styleParameters: {
            pacePreference: "fast",
            energyRange: [60, 100],
            cutFrequency: "fast",
            transitionStyle: "dynamic",
            emotionFocus: 80,
          },
          visualParameters: {
            colorGrading: "vibrant",
            contrastLevel: 80,
            saturationLevel: 90,
            stabilization: true,
            grainIntensity: 10,
          },
        },
      })
      
      expect(actor.getSnapshot().value).toBe("generating")
    })

    it("should store generated plan", () => {
      actor.start()
      
      // Setup and generate
      const fragments = createMockFragments(10)
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      actor.send({ type: "START_ANALYSIS" })
      actor.send({ 
        type: "ANALYSIS_COMPLETE", 
        fragments,
        videoAnalysis: {},
        audioAnalysis: {},
      })
      actor.send({ type: "GENERATE_PLAN", preferences: {} as any })
      
      // Complete generation
      actor.send({ 
        type: "GENERATION_COMPLETE",
        plan: mockMontagePlan,
      })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("ready")
      expect(snapshot.context.currentPlan).toEqual(mockMontagePlan)
      expect(snapshot.context.planHistory).toHaveLength(1)
    })
  })

  describe("Plan Optimization", () => {
    it("should optimize existing plan", () => {
      actor.start()
      
      // Setup with plan
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      const fragments = createMockFragments(10)
      actor.send({ type: "START_ANALYSIS" })
      actor.send({ 
        type: "ANALYSIS_COMPLETE", 
        fragments,
        videoAnalysis: {},
        audioAnalysis: {},
      })
      actor.send({ type: "GENERATE_PLAN", preferences: {} as any })
      actor.send({ 
        type: "GENERATION_COMPLETE",
        plan: mockMontagePlan,
      })
      
      // Start optimization
      actor.send({ type: "OPTIMIZE_PLAN" })
      expect(actor.getSnapshot().value).toBe("optimizing")
      
      // Complete optimization
      const optimizedPlan = {
        ...mockMontagePlan,
        qualityScore: 95,
        engagementScore: 92,
      }
      actor.send({ 
        type: "OPTIMIZATION_COMPLETE",
        plan: optimizedPlan,
      })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("ready")
      expect(snapshot.context.currentPlan?.qualityScore).toBe(95)
    })
  })

  describe("Plan Validation", () => {
    it("should validate plan", () => {
      actor.start()
      
      // Setup with plan
      actor.send({ type: "ADD_VIDEO", videoId: mockMediaFile.id, file: mockMediaFile })
      const fragments = createMockFragments(10)
      actor.send({ type: "START_ANALYSIS" })
      actor.send({ 
        type: "ANALYSIS_COMPLETE", 
        fragments,
        videoAnalysis: {},
        audioAnalysis: {},
      })
      actor.send({ type: "GENERATE_PLAN", preferences: {} as any })
      actor.send({ 
        type: "GENERATION_COMPLETE",
        plan: mockMontagePlan,
      })
      
      // Validate
      actor.send({ type: "VALIDATE_PLAN" })
      expect(actor.getSnapshot().value).toBe("validating")
      
      // Complete validation
      const validation = {
        isValid: true,
        issues: [],
        suggestions: ["Consider adding more variety"],
      }
      actor.send({ 
        type: "VALIDATION_COMPLETE",
        validation,
      })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("ready")
      expect(snapshot.context.validation).toEqual(validation)
    })
  })

  describe("Progress Updates", () => {
    it("should update analysis progress", () => {
      actor.start()
      
      // Simulate analyzing state by directly sending progress event
      actor.send({ 
        type: "ANALYSIS_PROGRESS",
        progress: {
          phase: AnalysisPhase.AnalyzingVideo,
          progress: 50,
          message: "Analyzing video quality...",
        },
      })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.context.progress.progress).toBe(50)
    })

    it("should update generation progress", () => {
      actor.start()
      actor.send({ 
        type: "ANALYSIS_PROGRESS",
        progress: {
          phase: AnalysisPhase.GeneratingPlan,
          progress: 75,
          message: "Creating sequences...",
        },
      })
      
      const snapshot = actor.getSnapshot()
      expect(snapshot.context.progress.progress).toBe(75)
      expect(snapshot.context.progress.phase).toBe(AnalysisPhase.GeneratingPlan)
    })
  })

  describe("Error Handling", () => {
    it("should handle errors and allow retry", () => {
      actor.start()
      actor.send({ type: "START_ANALYSIS" })
      actor.send({ 
        type: "ANALYSIS_ERROR", 
        error: "Network error" 
      })
      
      expect(actor.getSnapshot().value).toBe("error")
      expect(actor.getSnapshot().context.error).toBe("Network error")
      
      // Clear error
      actor.send({ type: "CLEAR_ERROR" })
      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.error).toBeNull()
    })
  })

  describe("Context Guards", () => {
    it("should not start analysis without videos", () => {
      actor.start()
      actor.send({ type: "START_ANALYSIS" })
      
      // Should remain in idle state
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should not generate plan without fragments", () => {
      actor.start()
      actor.send({ type: "GENERATE_PLAN", preferences: {} as any })
      
      // Should remain in idle state
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should not optimize without current plan", () => {
      actor.start()
      actor.send({ type: "OPTIMIZE_PLAN" })
      
      // Should remain in idle state
      expect(actor.getSnapshot().value).toBe("idle")
    })
  })
})