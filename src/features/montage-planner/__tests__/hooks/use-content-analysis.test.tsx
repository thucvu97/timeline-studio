/**
 * Tests for useContentAnalysis hook
 */

import type { ReactNode } from "react"

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useContentAnalysis } from "../../hooks/use-content-analysis"
import { MontagePlannerProvider } from "../../services/montage-planner-provider"
import { createMockFragments, mockAudioAnalysis, mockMediaFile, mockVideoAnalysis } from "../test-utils"


vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}))

describe("useContentAnalysis", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MontagePlannerProvider>{children}</MontagePlannerProvider>
  )

  it("should provide initial state", () => {
    const { result } = renderHook(() => useContentAnalysis(), { wrapper })

    expect(result.current.analyzedVideos).toHaveLength(0)
    expect(result.current.totalFragments).toBe(0)
    expect(result.current.averageQuality).toBe(0)
    expect(result.current.isAnalyzing).toBe(false)
  })

  it("should track analyzed videos", () => {
    const { result } = renderHook(() => useContentAnalysis(), { wrapper })

    act(() => {
      // Simulate adding video and completing analysis
      const { send } = result.current as any
      send({ type: "ADD_VIDEO", video: mockMediaFile })
      send({ 
        type: "ANALYSIS_COMPLETE",
        fragments: createMockFragments(5),
        videoAnalysis: { [mockMediaFile.id]: mockVideoAnalysis },
        audioAnalysis: { [mockMediaFile.id]: mockAudioAnalysis },
      })
    })

    expect(result.current.analyzedVideos).toHaveLength(1)
    expect(result.current.totalFragments).toBe(5)
  })

  it("should calculate average quality", () => {
    const { result } = renderHook(() => useContentAnalysis(), { wrapper })

    const fragments = createMockFragments(3)
    // Set specific scores for testing
    fragments[0].score.totalScore = 80
    fragments[1].score.totalScore = 90
    fragments[2].score.totalScore = 70

    act(() => {
      const { send } = result.current as any
      send({ type: "ADD_VIDEO", video: mockMediaFile })
      send({ 
        type: "ANALYSIS_COMPLETE",
        fragments,
        videoAnalysis: { [mockMediaFile.id]: mockVideoAnalysis },
        audioAnalysis: { [mockMediaFile.id]: mockAudioAnalysis },
      })
    })

    expect(result.current.averageQuality).toBe(80) // (80 + 90 + 70) / 3
  })

  it("should provide quality distribution", () => {
    const { result } = renderHook(() => useContentAnalysis(), { wrapper })

    const fragments = createMockFragments(10)
    // Set varied scores
    fragments.forEach((f, i) => {
      f.score.totalScore = 50 + (i * 5) // 50, 55, 60, 65, 70, 75, 80, 85, 90, 95
    })

    act(() => {
      const { send } = result.current as any
      send({ type: "ADD_VIDEO", video: mockMediaFile })
      send({ 
        type: "ANALYSIS_COMPLETE",
        fragments,
        videoAnalysis: { [mockMediaFile.id]: mockVideoAnalysis },
        audioAnalysis: { [mockMediaFile.id]: mockAudioAnalysis },
      })
    })

    const distribution = result.current.qualityDistribution
    expect(distribution.excellent).toBe(1) // 95
    expect(distribution.good).toBe(3) // 75, 80, 85
    expect(distribution.fair).toBe(4) // 60, 65, 70, 75
    expect(distribution.poor).toBe(2) // 50, 55
  })

  it("should provide fragment categories", () => {
    const { result } = renderHook(() => useContentAnalysis(), { wrapper })

    const fragments = createMockFragments(6)
    // Set different categories
    fragments[0].score.category = "action"
    fragments[1].score.category = "action"
    fragments[2].score.category = "drama"
    fragments[3].score.category = "comedy"
    fragments[4].score.category = "comedy"
    fragments[5].score.category = "comedy"

    act(() => {
      const { send } = result.current as any
      send({ type: "ADD_VIDEO", video: mockMediaFile })
      send({ 
        type: "ANALYSIS_COMPLETE",
        fragments,
        videoAnalysis: { [mockMediaFile.id]: mockVideoAnalysis },
        audioAnalysis: { [mockMediaFile.id]: mockAudioAnalysis },
      })
    })

    const categories = result.current.fragmentCategories
    expect(categories).toEqual({
      action: 2,
      drama: 1,
      comedy: 3,
    })
  })

  it("should handle empty analysis", () => {
    const { result } = renderHook(() => useContentAnalysis(), { wrapper })

    act(() => {
      const { send } = result.current as any
      send({ type: "ADD_VIDEO", video: mockMediaFile })
      send({ 
        type: "ANALYSIS_COMPLETE",
        fragments: [],
        videoAnalysis: {},
        audioAnalysis: {},
      })
    })

    expect(result.current.analyzedVideos).toHaveLength(1)
    expect(result.current.totalFragments).toBe(0)
    expect(result.current.averageQuality).toBe(0)
  })

  it("should track analysis state", () => {
    const { result } = renderHook(() => useContentAnalysis(), { wrapper })

    expect(result.current.isAnalyzing).toBe(false)

    act(() => {
      const { send } = result.current as any
      send({ type: "ADD_VIDEO", video: mockMediaFile })
      send({ type: "START_ANALYSIS" })
    })

    expect(result.current.isAnalyzing).toBe(true)

    act(() => {
      const { send } = result.current as any
      send({ 
        type: "ANALYSIS_COMPLETE",
        fragments: createMockFragments(5),
        videoAnalysis: {},
        audioAnalysis: {},
      })
    })

    expect(result.current.isAnalyzing).toBe(false)
  })

  it("should provide top moments", () => {
    const { result } = renderHook(() => useContentAnalysis(), { wrapper })

    const fragments = createMockFragments(10)
    // Set varied scores
    fragments.forEach((f, i) => {
      f.score.totalScore = Math.random() * 100
    })

    act(() => {
      const { send } = result.current as any
      send({ type: "ADD_VIDEO", video: mockMediaFile })
      send({ 
        type: "ANALYSIS_COMPLETE",
        fragments,
        videoAnalysis: { [mockMediaFile.id]: mockVideoAnalysis },
        audioAnalysis: { [mockMediaFile.id]: mockAudioAnalysis },
      })
    })

    const topMoments = result.current.topMoments
    expect(topMoments).toHaveLength(5) // Default top 5
    
    // Check that they're sorted by score
    for (let i = 1; i < topMoments.length; i++) {
      expect(topMoments[i-1].score.totalScore).toBeGreaterThanOrEqual(
        topMoments[i].score.totalScore
      )
    }
  })
})