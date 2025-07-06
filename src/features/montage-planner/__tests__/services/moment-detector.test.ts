/**
 * Tests for MomentDetector service
 */

import { beforeEach, describe, expect, it } from "vitest"

import { MomentDetector } from "../../services/moment-detector"
import { MomentCategory } from "../../types"
import { mockAudioAnalysis, mockMomentScore, mockVideoAnalysis } from "../test-utils"

import type { AnalysisOptions, MomentScore } from "../../types"

describe("MomentDetector", () => {
  let detector: MomentDetector

  beforeEach(() => {
    detector = MomentDetector.getInstance()
  })

  describe("detectMoments", () => {
    it("should detect moments in video content", () => {
      const duration = 30
      const options: AnalysisOptions["momentDetection"] = {
        threshold: 0.7,
        minDuration: 1,
        categories: Object.values(MomentCategory),
      }

      const moments = detector.detectMoments(
        mockVideoAnalysis,
        mockAudioAnalysis,
        duration,
        options
      )

      expect(moments).toBeInstanceOf(Array)
      expect(moments.length).toBeGreaterThan(0)
      
      moments.forEach(moment => {
        expect(moment).toHaveProperty("timestamp")
        expect(moment).toHaveProperty("duration")
        expect(moment).toHaveProperty("category")
        expect(moment).toHaveProperty("scores")
        expect(moment).toHaveProperty("weight")
        expect(moment).toHaveProperty("rank")
        
        expect(moment.duration).toBeGreaterThanOrEqual(options.minDuration!)
        expect(moment.timestamp).toBeLessThan(duration)
      })
    })

    it("should filter moments by threshold", () => {
      const duration = 30
      const highThreshold: AnalysisOptions["momentDetection"] = {
        threshold: 0.9,
        minDuration: 1,
      }

      const highThresholdMoments = detector.detectMoments(
        mockVideoAnalysis,
        mockAudioAnalysis,
        duration,
        highThreshold
      )

      const lowThreshold: AnalysisOptions["momentDetection"] = {
        threshold: 0.5,
        minDuration: 1,
      }

      const lowThresholdMoments = detector.detectMoments(
        mockVideoAnalysis,
        mockAudioAnalysis,
        duration,
        lowThreshold
      )

      expect(lowThresholdMoments.length).toBeGreaterThanOrEqual(highThresholdMoments.length)
    })

    it("should respect minimum duration", () => {
      const duration = 30
      const options: AnalysisOptions["momentDetection"] = {
        threshold: 0.5,
        minDuration: 3,
      }

      const moments = detector.detectMoments(
        mockVideoAnalysis,
        mockAudioAnalysis,
        duration,
        options
      )

      moments.forEach(moment => {
        expect(moment.duration).toBeGreaterThanOrEqual(3)
      })
    })

    it("should filter by categories", () => {
      const duration = 30
      const options: AnalysisOptions["momentDetection"] = {
        threshold: 0.5,
        minDuration: 1,
        categories: [MomentCategory.Action, MomentCategory.Drama],
      }

      const moments = detector.detectMoments(
        mockVideoAnalysis,
        mockAudioAnalysis,
        duration,
        options
      )

      moments.forEach(moment => {
        expect([MomentCategory.Action, MomentCategory.Drama]).toContain(moment.category)
      })
    })
  })

  describe("scoreMoment", () => {
    it("should calculate comprehensive scores", () => {
      const timestamp = 10
      const duration = 2
      
      const score = detector.scoreMoment(
        mockVideoAnalysis,
        mockAudioAnalysis,
        timestamp,
        duration
      )

      expect(score.scores).toHaveProperty("visual")
      expect(score.scores).toHaveProperty("action")
      expect(score.scores).toHaveProperty("emotional")
      expect(score.scores).toHaveProperty("narrative")
      expect(score.scores).toHaveProperty("technical")

      Object.values(score.scores).forEach(s => {
        expect(s).toBeGreaterThanOrEqual(0)
        expect(s).toBeLessThanOrEqual(100)
      })
    })
  })

  describe("rankMoments", () => {
    it("should rank moments by total score", () => {
      const moments: MomentScore[] = [
        { ...mockMomentScore, scores: { ...mockMomentScore.scores, visual: 60 } },
        { ...mockMomentScore, scores: { ...mockMomentScore.scores, visual: 90 } },
        { ...mockMomentScore, scores: { ...mockMomentScore.scores, visual: 75 } },
      ]

      const ranked = detector.rankMoments(moments)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(2)
      expect(ranked[2].rank).toBe(3)
      
      // Check descending order by totalScore
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i-1].totalScore).toBeGreaterThanOrEqual(ranked[i].totalScore)
      }
    })
  })

  describe("groupByCategory", () => {
    it("should group moments by category", () => {
      const moments: MomentScore[] = [
        { ...mockMomentScore, category: MomentCategory.Action },
        { ...mockMomentScore, category: MomentCategory.Drama },
        { ...mockMomentScore, category: MomentCategory.Action },
        { ...mockMomentScore, category: MomentCategory.Comedy },
      ]

      const grouped = detector.groupByCategory(moments)

      expect(Object.keys(grouped)).toHaveLength(3)
      expect(grouped[MomentCategory.Action]).toHaveLength(2)
      expect(grouped[MomentCategory.Drama]).toHaveLength(1)
      expect(grouped[MomentCategory.Comedy]).toHaveLength(1)
    })
  })

  describe("optimizeMomentSelection", () => {
    it("should optimize moment selection", () => {
      const moments: MomentScore[] = Array.from({ length: 20 }, (_, i) => ({
        ...mockMomentScore,
        timestamp: i * 2,
        duration: 2,
        scores: {
          ...mockMomentScore.scores,
          visual: 50 + Math.random() * 50,
        },
      }))

      const targetDuration = 30
      const selected = detector.optimizeMomentSelection(moments, targetDuration)

      const totalDuration = selected.reduce((sum, m) => sum + m.duration, 0)
      expect(totalDuration).toBeLessThanOrEqual(targetDuration)
      
      // Check that selected moments don't overlap
      for (let i = 1; i < selected.length; i++) {
        const prevEnd = selected[i-1].timestamp + selected[i-1].duration
        const currStart = selected[i].timestamp
        expect(currStart).toBeGreaterThanOrEqual(prevEnd)
      }
    })

    it("should prioritize diversity when requested", () => {
      const moments: MomentScore[] = [
        // Many action moments with high scores
        ...Array.from({ length: 10 }, (_, i) => ({
          ...mockMomentScore,
          timestamp: i * 2,
          category: MomentCategory.Action,
          scores: { ...mockMomentScore.scores, visual: 90 },
        })),
        // Few emotion moments with lower scores
        ...Array.from({ length: 3 }, (_, i) => ({
          ...mockMomentScore,
          timestamp: 20 + i * 2,
          category: MomentCategory.Drama,
          scores: { ...mockMomentScore.scores, visual: 70 },
        })),
      ]

      const selected = detector.optimizeMomentSelection(moments, 20, {
        diversityWeight: 0.8,
      })

      const categories = new Set(selected.map(m => m.category))
      expect(categories.size).toBeGreaterThan(1) // Should include multiple categories
    })
  })

  describe("analyzeTemporalDistribution", () => {
    it("should analyze temporal distribution of moments", () => {
      const moments: MomentScore[] = [
        { ...mockMomentScore, timestamp: 0 },
        { ...mockMomentScore, timestamp: 5 },
        { ...mockMomentScore, timestamp: 10 },
        { ...mockMomentScore, timestamp: 25 },
        { ...mockMomentScore, timestamp: 30 },
      ]

      const distribution = detector.analyzeTemporalDistribution(moments, 30)

      expect(distribution).toHaveProperty("density")
      expect(distribution).toHaveProperty("gaps")
      expect(distribution).toHaveProperty("clusters")
      
      expect(distribution.gaps.length).toBeGreaterThan(0)
      expect(distribution.gaps[0]).toEqual({ start: 15, end: 25, duration: 10 })
    })
  })
})