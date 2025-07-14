/**
 * Tests for use-timeline-persons hook
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useTimelinePersons } from "../../hooks/use-timeline-persons"
import { MockTimelineProvider } from "../test-providers"

// Mock timeline-machine
vi.mock("../../services/timeline-machine", () => ({
  timelineMachine: {},
}))

// Mock person identification
vi.mock("@/features/person-identification/hooks/use-person-identification", () => ({
  usePersonIdentification: vi.fn(() => ({
    persons: [
      {
        id: "person-1",
        name: "John Doe",
        photos: ["/photo1.jpg"],
        appearances: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "person-2",
        name: "Jane Smith",
        photos: ["/photo2.jpg"],
        appearances: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    detectFaces: vi.fn().mockResolvedValue([]),
    identifyPerson: vi.fn().mockResolvedValue(null),
    createPersonFromFace: vi.fn(),
    analyzeVideoForPersons: vi.fn().mockResolvedValue({
      detectedPersons: [],
      unknownFaces: [],
    }),
    error: null,
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
    send: vi.fn(),
  })),
}))

describe("useTimelinePersons", () => {
  it("should initialize without errors", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.state).toBeDefined()
    expect(result.current.state.isAnalyzing).toBe(false)
    expect(result.current.state.analysisProgress).toBe(0)
    expect(result.current.state.appearances).toEqual([])
    expect(result.current.state.error).toBeNull()
  })

  it("should have all required methods", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    expect(result.current.persons).toBeDefined()
    expect(result.current.getPersonsForClip).toBeDefined()
    expect(result.current.getAppearancesForClip).toBeDefined()
    expect(result.current.analyzeClipForPersons).toBeDefined()
    expect(result.current.analyzeTimelineForPersons).toBeDefined()
    expect(result.current.showPersonDetail).toBeDefined()
    expect(result.current.clearPersonsAnalysis).toBeDefined()
    expect(result.current.setEnablePersonDetection).toBeDefined()
    expect(result.current.setConfidenceThreshold).toBeDefined()
  })

  it("should return persons from person identification", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    expect(result.current.persons).toHaveLength(2)
    expect(result.current.persons[0].name).toBe("John Doe")
    expect(result.current.persons[1].name).toBe("Jane Smith")
  })

  it("should have default settings", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useTimelinePersons(), { wrapper })

    expect(result.current.enablePersonDetection).toBe(true)
    expect(result.current.confidenceThreshold).toBe(0.7)
  })
})
