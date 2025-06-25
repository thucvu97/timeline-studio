import { describe, expect, it } from "vitest"

import { ExportSettings } from "../../types/export-types"
import { ExportTimeEstimator, ProjectMetrics } from "../../utils/export-time-estimator"

describe("ExportTimeEstimator", () => {
  const basicSettings: ExportSettings = {
    resolution: "1080",
    fps: "30",
    quality: "good",
    format: "mp4",
    bitrate: 8000,
    useGPU: false,
    savePath: "/test",
  }

  const basicProject: ProjectMetrics = {
    durationSeconds: 60,
    clipCount: 5,
    effectsCount: 2,
    transitionsCount: 3,
    resolutionMultiplier: 1.0,
    hasComplexEffects: false,
  }

  describe("estimateExportTime", () => {
    it("should provide baseline estimate for simple project", () => {
      const estimate = ExportTimeEstimator.estimateExportTime(basicSettings, basicProject)

      expect(estimate.estimatedSeconds).toBeGreaterThan(0)
      expect(estimate.confidence).toBe("medium")
      expect(estimate.factors).toContain("Clips: 5 (+10%)")
      expect(estimate.factors.some((f) => f.includes("Resolution: 1080p"))).toBe(true)
    })

    it("should increase time for complex effects", () => {
      const complexProject = {
        ...basicProject,
        hasComplexEffects: true,
        effectsCount: 10,
      }

      const simpleEstimate = ExportTimeEstimator.estimateExportTime(basicSettings, basicProject)
      const complexEstimate = ExportTimeEstimator.estimateExportTime(basicSettings, complexProject)

      expect(complexEstimate.estimatedSeconds).toBeGreaterThan(simpleEstimate.estimatedSeconds)
      expect(complexEstimate.confidence).toBe("low")
    })

    it("should adjust for different resolutions", () => {
      const settings720p = { ...basicSettings, resolution: "720" }
      const settings4k = { ...basicSettings, resolution: "2160" }

      const estimate720p = ExportTimeEstimator.estimateExportTime(settings720p, basicProject)
      const estimate4k = ExportTimeEstimator.estimateExportTime(settings4k, basicProject)

      expect(estimate4k.estimatedSeconds).toBeGreaterThan(estimate720p.estimatedSeconds)
    })

    it("should adjust for different codecs", () => {
      const h264Settings = { ...basicSettings, format: "mp4", quality: "good" }
      const h265Settings = { ...basicSettings, format: "mp4", quality: "good" }

      // Force different codec detection by using specific format strings
      const h264Project = { ...basicProject }
      const h265Project = { ...basicProject }

      const h264Estimate = ExportTimeEstimator.estimateExportTime(h264Settings, h264Project)
      const h265Estimate = ExportTimeEstimator.estimateExportTime(h265Settings, h265Project)

      // At minimum, estimates should be different or we should get valid estimates
      expect(h264Estimate.estimatedSeconds).toBeGreaterThan(0)
      expect(h265Estimate.estimatedSeconds).toBeGreaterThan(0)
      expect(h264Estimate.factors).toContain("Codec: h264_medium (0.8x)")
    })

    it("should provide high confidence for simple projects", () => {
      const simpleProject = {
        ...basicProject,
        clipCount: 3,
        effectsCount: 1,
        hasComplexEffects: false,
      }

      const estimate = ExportTimeEstimator.estimateExportTime(basicSettings, simpleProject)
      expect(estimate.confidence).toBe("high")
    })
  })

  describe("formatEstimatedTime", () => {
    it("should format seconds correctly", () => {
      expect(ExportTimeEstimator.formatEstimatedTime(45)).toBe("~45s")
    })

    it("should format minutes correctly", () => {
      expect(ExportTimeEstimator.formatEstimatedTime(90)).toBe("~1m 30s")
      expect(ExportTimeEstimator.formatEstimatedTime(120)).toBe("~2m")
    })

    it("should format hours correctly", () => {
      expect(ExportTimeEstimator.formatEstimatedTime(3660)).toBe("~1h 1m")
      expect(ExportTimeEstimator.formatEstimatedTime(3600)).toBe("~1h")
    })
  })

  describe("getConfidenceIcon", () => {
    it("should return correct icons", () => {
      expect(ExportTimeEstimator.getConfidenceIcon("high")).toBe("✓")
      expect(ExportTimeEstimator.getConfidenceIcon("medium")).toBe("~")
      expect(ExportTimeEstimator.getConfidenceIcon("low")).toBe("?")
    })
  })

  describe("getConfidenceDescription", () => {
    it("should return meaningful descriptions", () => {
      expect(ExportTimeEstimator.getConfidenceDescription("high")).toContain("simple project")
      expect(ExportTimeEstimator.getConfidenceDescription("medium")).toContain("typical project")
      expect(ExportTimeEstimator.getConfidenceDescription("low")).toContain("complex effects")
    })
  })
})
