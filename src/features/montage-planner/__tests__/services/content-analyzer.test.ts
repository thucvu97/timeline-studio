/**
 * Tests for ContentAnalyzer service
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { ContentAnalyzer } from "../../services/content-analyzer"
import { mockAnalyzedContent, mockAudioAnalysis, mockMediaFile, mockMomentScore, mockVideoAnalysis } from "../test-utils"

import type { AnalysisOptions, AnalyzedContent } from "../../types"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("ContentAnalyzer", () => {
  let analyzer: ContentAnalyzer

  beforeEach(() => {
    analyzer = ContentAnalyzer.getInstance()
    vi.clearAllMocks()
  })

  describe("analyzeVideo", () => {
    it("should analyze video content", async () => {
      const options: AnalysisOptions["videoAnalysis"] = {
        enableSceneDetection: true,
        enableObjectDetection: true,
        enableFaceDetection: true,
      }

      const result = await analyzer.analyzeVideo("video_1", mockMediaFile, options)

      expect(result).toHaveProperty("quality")
      expect(result).toHaveProperty("content")
      expect(result).toHaveProperty("motion")
      expect(result.quality.resolution).toEqual({ width: 1920, height: 1080 })
      expect(result.quality.frameRate).toBe(30)
    })
  })

  describe("extractFragments", () => {
    it("should extract fragments from analyzed content", () => {
      const momentScores = [
        { ...mockMomentScore, timestamp: 0, duration: 5 },
        { ...mockMomentScore, timestamp: 5, duration: 5 },
        { ...mockMomentScore, timestamp: 10, duration: 10 },
      ]

      const fragments = analyzer.extractFragments(
        "video_1",
        mockMediaFile,
        mockVideoAnalysis,
        mockAudioAnalysis,
        momentScores
      )

      expect(fragments).toHaveLength(3)
      expect(fragments[0].startTime).toBe(0)
      expect(fragments[0].endTime).toBe(5)
      expect(fragments[0].duration).toBe(5)
      expect(fragments[0].objects).toContain("car")
      expect(fragments[0].objects).toContain("person")
    })
  })

  describe("calculateQualityScore", () => {
    it("should calculate combined quality score", () => {
      const score = analyzer.calculateQualityScore(mockVideoAnalysis, mockAudioAnalysis)

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe("analyzeAudio", () => {
    it("should analyze audio content", async () => {
      const options: AnalysisOptions["audioAnalysis"] = {
        enableSpeechDetection: true,
        enableMusicAnalysis: true,
      }

      const result = await analyzer.analyzeAudio("video_1", mockMediaFile, options)

      expect(result).toHaveProperty("quality")
      expect(result).toHaveProperty("content")
      expect(result).toHaveProperty("music")
      expect(result.quality.sampleRate).toBe(48000)
      expect(result.quality.bitDepth).toBe(16)
    })

    it("should return empty analysis for files without audio", async () => {
      const fileWithoutAudio = { ...mockMediaFile, hasAudio: false }
      const result = await analyzer.analyzeAudio("video_1", fileWithoutAudio, {})

      expect(result.quality.sampleRate).toBe(0)
      expect(result.quality.clarity).toBe(0)
      expect(result.content.speechPresence).toBe(0)
    })
  })
})