/**
 * Simplified tests for use-timeline-ai-analysis hook
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useTimelineAIAnalysis } from "../../hooks/use-timeline-ai-analysis"
import { MockTimelineProvider } from "../test-providers"

// Mock timeline-machine
vi.mock("../../services/timeline-machine", () => ({
  timelineMachine: {},
}))

// Mock AI engines
vi.mock("@/features/ai-content-intelligence/engines/scene-analysis/services/scene-analysis-engine", () => ({
  SceneAnalysisEngine: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    process: vi.fn().mockResolvedValue({
      scenes: [],
      totalScenes: 0,
      averageSceneLength: 0,
      keyMoments: [],
    }),
  })),
}))

vi.mock("@/features/ai-content-intelligence/shared/services/ai-intelligence-orchestrator", () => ({
  AIIntelligenceOrchestrator: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    analyzeContent: vi.fn().mockResolvedValue({
      id: "analysis-1",
      mediaFile: {},
      insights: {},
      keyMoments: [],
      contentType: "video",
      timestamp: new Date().toISOString(),
    }),
  })),
}))

// Mock useTimeline
vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: vi.fn(() => ({
    project: {
      id: "project-1",
      name: "Test Project",
      sections: [],
      globalTracks: [],
    },
    uiState: {},
    send: vi.fn(),
  })),
}))

describe("useTimelineAIAnalysis Simple", () => {
  it("should initialize without errors", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.state).toBeDefined()
    expect(result.current.state.isAnalyzing).toBe(false)
  })

  it("should have all required methods", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelineAIAnalysis(), { wrapper })

    expect(result.current.analyzeClip).toBeDefined()
    expect(result.current.analyzeTimeline).toBeDefined()
    expect(result.current.clearAnalysis).toBeDefined()
    expect(result.current.applySuggestion).toBeDefined()
    expect(result.current.dismissSuggestion).toBeDefined()
    expect(result.current.generateMarkersFromAnalysis).toBeDefined()
    expect(result.current.findKeyMoments).toBeDefined()
    expect(result.current.setEnableAutoAnalysis).toBeDefined()
  })
})
