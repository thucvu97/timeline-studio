/**
 * Tests for Timeline Integration Service
 */

import { beforeEach, describe, expect, it } from "vitest"

import { MediaFile } from "@/features/media/types/media"
import { createTimelineProject } from "@/features/timeline/types"

import { applyPlanToTimeline, createMarkersFromPlan } from "../../services/timeline-integration-service"
import { EmotionalTone, MONTAGE_STYLES, MomentCategory, MontagePlan } from "../../types"

describe("TimelineIntegrationService", () => {
  let mockProject: any
  let mockMediaFiles: MediaFile[]
  let mockPlan: MontagePlan

  beforeEach(() => {
    // Create mock project
    mockProject = createTimelineProject({
      name: "Test Project",
      duration: 0,
      settings: {},
    })

    // Create mock media files
    mockMediaFiles = [
      {
        id: "video1",
        name: "video1.mp4",
        path: "/path/to/video1.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
        size: 1000000,
        type: "video",
        format: "mp4",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "audio1",
        name: "audio1.mp3",
        path: "/path/to/audio1.mp3",
        isVideo: false,
        isAudio: true,
        isImage: false,
        duration: 120,
        size: 500000,
        type: "audio",
        format: "mp3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Create mock montage plan
    mockPlan = {
      id: "plan1",
      name: "Test Montage",
      style: MONTAGE_STYLES.dynamicAction,
      totalDuration: 30,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      sequences: [
        {
          id: "seq1",
          type: "main" as any,
          duration: 30,
          purpose: "exposition" as any,
          energyLevel: 80,
          emotionalArc: {
            startEnergy: 70,
            peakPosition: 0.7,
            peakEnergy: 90,
            endEnergy: 80,
            variability: 60,
          },
          clips: [
            {
              fragmentId: "frag1",
              fragment: {
                id: "frag1",
                videoId: "video1",
                sourceFile: mockMediaFiles[0],
                startTime: 0,
                endTime: 10,
                duration: 10,
                score: {
                  timestamp: 5,
                  duration: 10,
                  scores: {
                    visual: 90,
                    technical: 80,
                    emotional: 85,
                    narrative: 75,
                    action: 95,
                    composition: 88,
                  },
                  totalScore: 85,
                  category: MomentCategory.Action,
                },
                objects: [],
                people: [],
                tags: [],
              },
              sequenceOrder: 0,
              role: "hero" as any,
              importance: 90,
              adjustments: {
                stabilization: true,
              },
              suggestions: [],
            },
          ],
          transitions: [],
        },
      ],
      pacing: {
        type: "variable" as any,
        averageCutDuration: 3,
        cutDurationRange: [1, 5],
        rhythmComplexity: 70,
      },
      qualityScore: 85,
      engagementScore: 90,
      coherenceScore: 80,
    } as MontagePlan
  })

  describe("applyPlanToTimeline", () => {
    it("should apply montage plan to timeline project", () => {
      const result = applyPlanToTimeline(mockPlan, mockProject, mockMediaFiles, {
        createNewSection: true,
        sectionName: "Montage Section",
        applyTransitions: true,
      })

      // Check that a new section was created
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].name).toBe("Montage Section")
      expect(result.sections[0].duration).toBe(30)

      // Check that tracks were created
      const section = result.sections[0]
      expect(section.tracks).toHaveLength(2) // Video and audio tracks

      const videoTrack = section.tracks.find((t) => t.type === "video")
      expect(videoTrack).toBeDefined()
      expect(videoTrack?.name).toBe("Montage Video")

      // Check that clips were added
      expect(videoTrack?.clips).toHaveLength(1)
      const clip = videoTrack?.clips?.[0]
      expect(clip?.startTime).toBe(0)
      expect(clip?.duration).toBe(10)
      // Note: fade in/out are not supported in the current ClipAdjustments type
    })

    it("should use existing tracks when configured", () => {
      // Add existing tracks to project
      mockProject.sections = [
        {
          id: "section1",
          name: "Existing Section",
          startTime: 0,
          duration: 100,
          tracks: [
            {
              id: "track1",
              name: "Video Track",
              type: "video",
              clips: [],
              order: 0,
            },
          ],
        },
      ]

      const result = applyPlanToTimeline(mockPlan, mockProject, mockMediaFiles, {
        createNewSection: false,
        useExistingTracks: true,
        targetVideoTrack: "track1",
      })

      // Should not create new section
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].name).toBe("Existing Section")

      // Should use existing track
      const videoTrack = result.sections[0].tracks[0]
      expect(videoTrack.id).toBe("track1")
      expect(videoTrack.clips).toHaveLength(1)
    })

    it("should apply time offset to clips", () => {
      const timeOffset = 10

      const result = applyPlanToTimeline(mockPlan, mockProject, mockMediaFiles, {
        timeOffset,
      })

      const section = result.sections[0]
      const videoTrack = section.tracks.find((t) => t.type === "video")
      const clip = videoTrack?.clips?.[0]

      expect(clip?.startTime).toBe(10) // Original start time + offset
    })

    it("should add stabilization effect when specified in adjustments", () => {
      const result = applyPlanToTimeline(mockPlan, mockProject, mockMediaFiles)

      const section = result.sections[0]
      const videoTrack = section.tracks.find((t) => t.type === "video")
      const clip = videoTrack?.clips?.[0]

      expect(clip?.appliedEffects).toHaveLength(1)
      expect(clip?.appliedEffects?.[0].effectId).toBe("stabilization")
      expect(clip?.appliedEffects?.[0].enabled).toBe(true)
    })

    it("should include montage metadata in clips", () => {
      const result = applyPlanToTimeline(mockPlan, mockProject, mockMediaFiles)

      const section = result.sections[0]
      const videoTrack = section.tracks.find((t) => t.type === "video")
      const clip = videoTrack?.clips?.[0]

      expect(clip?.metadata?.montageMetadata).toBeDefined()
      expect(clip?.metadata?.montageMetadata?.momentCategory).toBe(MomentCategory.Action)
      expect(clip?.metadata?.montageMetadata?.momentScore).toBe(85)
      expect(clip?.metadata?.montageMetadata?.emotionalTone).toBe(EmotionalTone.Energetic)
    })
  })

  describe("createMarkersFromPlan", () => {
    it("should create markers for montage plan", () => {
      const markers = createMarkersFromPlan(mockPlan)

      expect(markers).toHaveLength(3) // Start, key moment, end

      // Check start marker
      expect(markers[0].name).toContain("Start")
      expect(markers[0].time).toBe(0)
      expect(markers[0].type).toBe("section")

      // Check key moment marker (score > 80)
      expect(markers[1].name).toContain("Key Moment")
      expect(markers[1].time).toBe(0) // Clip start time
      expect(markers[1].type).toBe("note")

      // Check end marker
      expect(markers[2].name).toContain("End")
      expect(markers[2].time).toBe(30) // Total duration
      expect(markers[2].type).toBe("section")
    })

    it("should apply time offset to markers", () => {
      const timeOffset = 10
      const markers = createMarkersFromPlan(mockPlan, timeOffset)

      expect(markers[0].time).toBe(10) // Start + offset
      expect(markers[1].time).toBe(10) // Clip start + offset
      expect(markers[2].time).toBe(40) // End + offset
    })

    it("should only create moment markers for high-scoring moments", () => {
      // Add a low-scoring moment to the first sequence
      mockPlan.sequences[0].clips.push({
        fragmentId: "frag2",
        fragment: {
          id: "frag2",
          videoId: "video1",
          sourceFile: mockMediaFiles[0],
          startTime: 10,
          endTime: 20,
          duration: 10,
          score: {
            timestamp: 15,
            duration: 10,
            scores: {
              visual: 50,
              technical: 40,
              emotional: 45,
              narrative: 35,
              action: 30,
              composition: 42,
            },
            totalScore: 50, // Below 80 threshold
            category: MomentCategory.Drama,
          },
          objects: [],
          people: [],
          tags: [],
        },
        sequenceOrder: 1,
        role: "supporting" as any,
        importance: 50,
        adjustments: {},
        suggestions: [],
      })

      const markers = createMarkersFromPlan(mockPlan)

      // Should still have only 3 markers (start, 1 key moment, end)
      expect(markers).toHaveLength(3)
      const momentMarkers = markers.filter((m) => m.type === "note")
      expect(momentMarkers).toHaveLength(1)
    })
  })
})
