/**
 * Тесты для хука use-timeline-markers
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMarker } from "../../types/markers"
import { useTimelineMarkers } from "../use-timeline-markers"

// Мокаем timeline context
const mockSend = vi.fn()
const mockSeek = vi.fn()

const mockProject = {
  id: "test-project",
  name: "Test Project",
  markers: [
    createMarker(10, "Opening Scene", "chapter", "Start of the opening scene"),
    createMarker(30, "Music Cue", "cue", "Background music starts"),
    createMarker(60, "Interview", "section", "Main interview segment"),
    createMarker(120, "B-Roll", "note", "Insert B-roll footage"),
  ],
}

const mockTimelineContext = {
  project: mockProject,
  send: mockSend,
  seek: mockSeek,
}

vi.mock("../use-timeline", () => ({
  useTimeline: () => mockTimelineContext,
}))

describe("useTimelineMarkers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Восстанавливаем оригинальный проект
    mockTimelineContext.project = mockProject
  })

  it("should return sorted markers from project", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    expect(result.current.markers).toHaveLength(4)
    expect(result.current.markers[0].time).toBe(10)
    expect(result.current.markers[1].time).toBe(30)
    expect(result.current.markers[2].time).toBe(60)
    expect(result.current.markers[3].time).toBe(120)
  })

  it("should return empty array when no markers exist", () => {
    mockTimelineContext.project = { ...mockProject, markers: [] }

    const { result } = renderHook(() => useTimelineMarkers())

    expect(result.current.markers).toHaveLength(0)
  })

  it("should add a new marker", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    act(() => {
      result.current.addMarker({
        time: 45,
        name: "Test Marker",
        type: "chapter",
        color: "#ff0000",
        description: "Test description",
      })
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "ADD_MARKER",
      marker: expect.objectContaining({
        time: 45,
        name: "Test Marker",
        type: "chapter",
        color: "#ff0000",
        description: "Test description",
      }),
    })
  })

  it("should update a marker", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    act(() => {
      result.current.updateMarker("marker-1", {
        name: "Updated Marker",
        color: "#00ff00",
      })
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_MARKER",
      markerId: "marker-1",
      updates: expect.objectContaining({
        name: "Updated Marker",
        color: "#00ff00",
        modifiedAt: expect.any(Date),
      }),
    })
  })

  it("should remove a marker", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    act(() => {
      result.current.removeMarker("marker-1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "REMOVE_MARKER",
      markerId: "marker-1",
    })
  })

  it("should navigate to marker", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    act(() => {
      result.current.goToMarker(result.current.markers[0].id)
    })

    expect(mockSeek).toHaveBeenCalledWith(10)
  })

  it("should get marker types", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    const types = result.current.getMarkerTypes()

    expect(types).toContain("chapter")
    expect(types).toContain("cue")
    expect(types).toContain("section")
    expect(types).toContain("note")
  })

  it("should get markers by type", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    const chapterMarkers = result.current.getMarkersByType("chapter")
    const cueMarkers = result.current.getMarkersByType("cue")

    expect(chapterMarkers).toHaveLength(1)
    expect(chapterMarkers[0].name).toBe("Opening Scene")

    expect(cueMarkers).toHaveLength(1)
    expect(cueMarkers[0].name).toBe("Music Cue")
  })

  it("should export markers as JSON", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    const jsonExport = result.current.exportMarkers("json")
    const parsed = JSON.parse(jsonExport)

    expect(parsed).toHaveProperty("markers")
    expect(parsed).toHaveProperty("exportedAt")
    expect(parsed.markers).toHaveLength(4)
    expect(parsed.markers[0]).toHaveProperty("id")
    expect(parsed.markers[0]).toHaveProperty("name")
    expect(parsed.markers[0]).toHaveProperty("time")
    expect(parsed.markers[0]).toHaveProperty("type")
  })

  it("should export markers as CSV", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    const csvExport = result.current.exportMarkers("csv")
    const lines = csvExport.split("\n")

    expect(lines[0]).toBe("Name,Type,Time,Color")
    expect(lines[1]).toContain("Opening Scene,chapter,10")
    expect(lines[2]).toContain("Music Cue,cue,30")
  })

  it("should export markers as EDL", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    const edlExport = result.current.exportMarkers("edl")

    expect(edlExport).toContain("* MARKERS")
    expect(edlExport).toContain("Opening Scene")
    expect(edlExport).toContain("Music Cue")
  })

  it("should export markers as SRT", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    const srtExport = result.current.exportMarkers("srt")

    expect(srtExport).toContain("1")
    expect(srtExport).toContain("00:00:10,000 --> 00:00:12,000")
    expect(srtExport).toContain("Opening Scene")
    expect(srtExport).toContain("2")
    expect(srtExport).toContain("00:00:30,000 --> 00:00:32,000")
    expect(srtExport).toContain("Music Cue")
  })

  it("should export markers as FCPXML", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    const fcpxmlExport = result.current.exportMarkers("fcpxml")

    expect(fcpxmlExport).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(fcpxmlExport).toContain('<fcpxml version="1.11">')
    expect(fcpxmlExport).toContain("Timeline Studio Project")
  })

  it("should handle markers with duration", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    act(() => {
      result.current.addMarker({
        time: 80,
        name: "Segment Marker",
        type: "section",
        color: "#0000ff",
        duration: 15,
      })
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "ADD_MARKER",
      marker: expect.objectContaining({
        time: 80,
        name: "Segment Marker",
        type: "section",
        duration: 15,
      }),
    })
  })

  it("should throw error for unsupported export format", () => {
    const { result } = renderHook(() => useTimelineMarkers())

    expect(() => {
      result.current.exportMarkers("unsupported" as any)
    }).toThrow("Unsupported export format: unsupported")
  })
})
