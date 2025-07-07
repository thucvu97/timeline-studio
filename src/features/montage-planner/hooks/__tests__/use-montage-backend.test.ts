/**
 * Tests for useMontageBackend hook - integration with Tauri backend commands
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useMontageBackend } from "../use-montage-backend"

describe("useMontageBackend", () => {
  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useMontageBackend())

    expect(result.current.isAnalyzing).toBe(false)
    expect(result.current.isGenerating).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.progress).toBe(0)
  })

  it("should provide all 6 required backend commands", () => {
    const { result } = renderHook(() => useMontageBackend())

    // Verify all 6 Tauri commands are available as functions
    expect(typeof result.current.analyzeVideoComposition).toBe("function")
    expect(typeof result.current.detectKeyMoments).toBe("function")
    expect(typeof result.current.generateMontagePlan).toBe("function")
    expect(typeof result.current.analyzeVideoQuality).toBe("function")
    expect(typeof result.current.analyzeFrameQuality).toBe("function")
    expect(typeof result.current.analyzeAudioContent).toBe("function")
  })

  it("should provide state management properties", () => {
    const { result } = renderHook(() => useMontageBackend())

    // Verify state properties are available
    expect(typeof result.current.isAnalyzing).toBe("boolean")
    expect(typeof result.current.isGenerating).toBe("boolean")
    expect(typeof result.current.progress).toBe("number")
    expect(result.current.error === null || typeof result.current.error === "string").toBe(true)
  })

  it("should have correct function signatures for video analysis commands", () => {
    const { result } = renderHook(() => useMontageBackend())

    // Test function signatures (without executing)
    expect(result.current.analyzeVideoComposition.length).toBe(2) // videoPath, processorId (options is optional)
    expect(result.current.analyzeVideoQuality.length).toBe(1) // videoPath
    expect(result.current.analyzeFrameQuality.length).toBe(2) // videoPath, timestamp
    expect(result.current.analyzeAudioContent.length).toBe(1) // audioPath
  })

  it("should have correct function signatures for analysis and generation commands", () => {
    const { result } = renderHook(() => useMontageBackend())

    // Test function signatures (without executing)
    expect(result.current.detectKeyMoments.length).toBe(2) // detections, qualityScores
    expect(result.current.generateMontagePlan.length).toBe(3) // moments, config, sourceFiles
  })

  describe("integration readiness verification", () => {
    it("should be ready for integration with UI components", () => {
      const { result } = renderHook(() => useMontageBackend())

      // Verify the hook returns all required properties for UI integration
      const hookResult = result.current

      // Commands
      expect(hookResult).toHaveProperty("analyzeVideoComposition")
      expect(hookResult).toHaveProperty("detectKeyMoments")
      expect(hookResult).toHaveProperty("generateMontagePlan")
      expect(hookResult).toHaveProperty("analyzeVideoQuality")
      expect(hookResult).toHaveProperty("analyzeFrameQuality")
      expect(hookResult).toHaveProperty("analyzeAudioContent")

      // State
      expect(hookResult).toHaveProperty("isAnalyzing")
      expect(hookResult).toHaveProperty("isGenerating")
      expect(hookResult).toHaveProperty("error")
      expect(hookResult).toHaveProperty("progress")

      // All commands should be functions
      const commands = [
        "analyzeVideoComposition",
        "detectKeyMoments",
        "generateMontagePlan",
        "analyzeVideoQuality",
        "analyzeFrameQuality",
        "analyzeAudioContent",
      ]

      commands.forEach((command) => {
        expect(typeof hookResult[command as keyof typeof hookResult]).toBe("function")
      })
    })

    it("should handle TypeScript types correctly", () => {
      const { result } = renderHook(() => useMontageBackend())

      // This test verifies that TypeScript types are working correctly
      // by checking that the hook result matches the expected interface structure
      const hookResult = result.current

      // State types
      expect(typeof hookResult.isAnalyzing).toBe("boolean")
      expect(typeof hookResult.isGenerating).toBe("boolean")
      expect(typeof hookResult.progress).toBe("number")
      expect(hookResult.error === null || typeof hookResult.error === "string").toBe(true)

      // Progress should be within valid range
      expect(hookResult.progress).toBeGreaterThanOrEqual(0)
      expect(hookResult.progress).toBeLessThanOrEqual(100)
    })
  })
})
