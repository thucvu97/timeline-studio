import { describe, expect, it } from "vitest"

import { SpeedKeyframe } from "../../types/speed-ramping"
import {
  applySpeedRamping,
  calculateAdjustedDuration,
  calculateSpeedCurve,
  interpolateSpeed,
} from "../speed-ramping-utils"

describe("speed-ramping-utils", () => {
  describe("interpolateSpeed", () => {
    it("should return 1.0 for empty keyframes", () => {
      const speed = interpolateSpeed([], 0.5)
      expect(speed).toBe(1.0)
    })

    it("should return single keyframe value when only one keyframe", () => {
      const keyframes: SpeedKeyframe[] = [{ id: "1", time: 0, value: 2.0, interpolation: "linear" }]
      expect(interpolateSpeed(keyframes, 0)).toBe(2.0)
      expect(interpolateSpeed(keyframes, 1)).toBe(2.0)
      expect(interpolateSpeed(keyframes, 0.5)).toBe(2.0)
    })

    it("should return first keyframe value when time is before first keyframe", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0.5, value: 2.0, interpolation: "linear" },
        { id: "2", time: 1.0, value: 3.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, 0)).toBe(2.0)
      expect(interpolateSpeed(keyframes, 0.25)).toBe(2.0)
    })

    it("should return last keyframe value when time is after last keyframe", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 2.0, interpolation: "linear" },
        { id: "2", time: 0.5, value: 3.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, 1)).toBe(3.0)
      expect(interpolateSpeed(keyframes, 0.75)).toBe(3.0)
    })

    it("should interpolate linearly between keyframes", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "linear" },
        { id: "2", time: 1, value: 2.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, 0)).toBe(1.0)
      expect(interpolateSpeed(keyframes, 0.5)).toBe(1.5)
      expect(interpolateSpeed(keyframes, 1)).toBe(2.0)
    })

    it("should handle unsorted keyframes", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "2", time: 1, value: 2.0, interpolation: "linear" },
        { id: "1", time: 0, value: 1.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, 0.5)).toBe(1.5)
    })

    it("should handle multiple keyframes", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "linear" },
        { id: "2", time: 0.5, value: 2.0, interpolation: "linear" },
        { id: "3", time: 1, value: 1.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, 0.25)).toBe(1.5)
      expect(interpolateSpeed(keyframes, 0.75)).toBe(1.5)
    })

    it("should handle zero time difference between keyframes", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0.5, value: 1.0, interpolation: "linear" },
        { id: "2", time: 0.5, value: 2.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, 0.5)).toBe(1.0)
    })

    describe("interpolation types", () => {
      it("should apply ease interpolation", () => {
        const keyframes: SpeedKeyframe[] = [
          { id: "1", time: 0, value: 1.0, interpolation: "ease" },
          { id: "2", time: 1, value: 2.0, interpolation: "linear" },
        ]
        const speed25 = interpolateSpeed(keyframes, 0.25)
        const speed75 = interpolateSpeed(keyframes, 0.75)

        // At t=0.25, ease should be slower than linear (1.25)
        expect(speed25).toBeLessThan(1.25)
        // At t=0.75, ease should be faster than linear (1.75)
        expect(speed75).toBeGreaterThan(1.75)

        // Both should be within valid range
        expect(speed25).toBeGreaterThan(1.0)
        expect(speed25).toBeLessThan(2.0)
        expect(speed75).toBeGreaterThan(1.0)
        expect(speed75).toBeLessThan(2.0)
      })

      it("should apply ease-in interpolation", () => {
        const keyframes: SpeedKeyframe[] = [
          { id: "1", time: 0, value: 1.0, interpolation: "ease-in" },
          { id: "2", time: 1, value: 2.0, interpolation: "linear" },
        ]
        const speed = interpolateSpeed(keyframes, 0.5)
        expect(speed).toBeLessThan(1.5) // Slower than linear at midpoint
      })

      it("should apply ease-out interpolation", () => {
        const keyframes: SpeedKeyframe[] = [
          { id: "1", time: 0, value: 1.0, interpolation: "ease-out" },
          { id: "2", time: 1, value: 2.0, interpolation: "linear" },
        ]
        const speed = interpolateSpeed(keyframes, 0.5)
        expect(speed).toBeGreaterThan(1.5) // Faster than linear at midpoint
      })

      it("should apply ease-in-out interpolation", () => {
        const keyframes: SpeedKeyframe[] = [
          { id: "1", time: 0, value: 1.0, interpolation: "ease-in-out" },
          { id: "2", time: 1, value: 2.0, interpolation: "linear" },
        ]
        const speed = interpolateSpeed(keyframes, 0.5)
        expect(speed).toBeCloseTo(1.5, 1) // Close to linear at midpoint
      })

      it("should apply hold interpolation", () => {
        const keyframes: SpeedKeyframe[] = [
          { id: "1", time: 0, value: 1.0, interpolation: "hold" },
          { id: "2", time: 1, value: 2.0, interpolation: "linear" },
        ]
        expect(interpolateSpeed(keyframes, 0)).toBe(1.0)
        expect(interpolateSpeed(keyframes, 0.5)).toBe(1.0)
        expect(interpolateSpeed(keyframes, 0.99)).toBe(1.0)
      })

      it("should apply bezier interpolation", () => {
        const keyframes: SpeedKeyframe[] = [
          { id: "1", time: 0, value: 1.0, interpolation: "bezier" },
          { id: "2", time: 1, value: 2.0, interpolation: "linear" },
        ]
        const speed = interpolateSpeed(keyframes, 0.5)
        expect(speed).toBeGreaterThan(1.0)
        expect(speed).toBeLessThan(2.0)
      })

      it("should handle unknown interpolation type as linear", () => {
        const keyframes: SpeedKeyframe[] = [
          { id: "1", time: 0, value: 1.0, interpolation: "unknown" as any },
          { id: "2", time: 1, value: 2.0, interpolation: "linear" },
        ]
        expect(interpolateSpeed(keyframes, 0.5)).toBe(1.5)
      })
    })
  })

  describe("calculateAdjustedDuration", () => {
    it("should return original duration for empty keyframes", () => {
      const duration = calculateAdjustedDuration(10, [])
      expect(duration).toBe(10)
    })

    it("should calculate adjusted duration for constant speed", () => {
      const keyframes: SpeedKeyframe[] = [{ id: "1", time: 0, value: 2.0, interpolation: "linear" }]
      const duration = calculateAdjustedDuration(10, keyframes)
      expect(duration).toBeCloseTo(5, 1) // 2x speed = half duration
    })

    it("should calculate adjusted duration for slow motion", () => {
      const keyframes: SpeedKeyframe[] = [{ id: "1", time: 0, value: 0.5, interpolation: "linear" }]
      const duration = calculateAdjustedDuration(10, keyframes)
      expect(duration).toBeCloseTo(20, 1) // 0.5x speed = double duration
    })

    it("should calculate adjusted duration for variable speed", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "linear" },
        { id: "2", time: 5, value: 2.0, interpolation: "linear" },
        { id: "3", time: 10, value: 1.0, interpolation: "linear" },
      ]
      const duration = calculateAdjustedDuration(10, keyframes)
      expect(duration).toBeLessThan(10) // Average speed > 1
      expect(duration).toBeGreaterThan(5) // Not all at 2x speed
    })

    it("should handle freeze frame (speed = 0)", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "linear" },
        { id: "2", time: 5, value: 0.0001, interpolation: "hold" }, // Near zero to avoid division by zero
        { id: "3", time: 10, value: 1.0, interpolation: "linear" },
      ]
      const duration = calculateAdjustedDuration(10, keyframes)
      expect(duration).toBeGreaterThan(100) // Very long due to near-zero speed
    })
  })

  describe("calculateSpeedCurve", () => {
    it("should generate curve points for empty keyframes", () => {
      const curve = calculateSpeedCurve([], 10)
      expect(curve).toHaveLength(101) // Default resolution + 1
      expect(curve[0]).toEqual({ time: 0, speed: 1.0 })
      expect(curve[100]).toEqual({ time: 10, speed: 1.0 })
    })

    it("should generate curve with custom resolution", () => {
      const curve = calculateSpeedCurve([], 10, 10)
      expect(curve).toHaveLength(11)
    })

    it("should generate curve for single keyframe", () => {
      const keyframes: SpeedKeyframe[] = [{ id: "1", time: 0, value: 2.0, interpolation: "linear" }]
      const curve = calculateSpeedCurve(keyframes, 10, 10)
      expect(curve).toHaveLength(11)
      curve.forEach((point) => {
        expect(point.speed).toBe(2.0)
      })
    })

    it("should generate curve for linear interpolation", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "linear" },
        { id: "2", time: 10, value: 2.0, interpolation: "linear" },
      ]
      const curve = calculateSpeedCurve(keyframes, 10, 10)
      expect(curve[0]).toEqual({ time: 0, speed: 1.0 })
      expect(curve[5]).toEqual({ time: 5, speed: 1.5 })
      expect(curve[10]).toEqual({ time: 10, speed: 2.0 })
    })

    it("should generate curve for complex keyframes", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "ease-in" },
        { id: "2", time: 5, value: 3.0, interpolation: "ease-out" },
        { id: "3", time: 10, value: 1.0, interpolation: "linear" },
      ]
      const curve = calculateSpeedCurve(keyframes, 10, 20)
      expect(curve).toHaveLength(21)

      // Check that curve has variation
      const speeds = curve.map((p) => p.speed)
      const minSpeed = Math.min(...speeds)
      const maxSpeed = Math.max(...speeds)
      expect(minSpeed).toBeCloseTo(1.0, 1)
      expect(maxSpeed).toBeCloseTo(3.0, 1)
    })

    it("should handle high resolution curves", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "bezier" },
        { id: "2", time: 10, value: 2.0, interpolation: "linear" },
      ]
      const curve = calculateSpeedCurve(keyframes, 10, 1000)
      expect(curve).toHaveLength(1001)

      // Check smoothness - adjacent points should be close
      for (let i = 1; i < curve.length; i++) {
        const diff = Math.abs(curve[i].speed - curve[i - 1].speed)
        expect(diff).toBeLessThan(0.01)
      }
    })
  })

  describe("applySpeedRamping (legacy)", () => {
    it("should return null", () => {
      expect(applySpeedRamping()).toBeNull()
    })
  })

  describe("edge cases", () => {
    it("should handle negative time values", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "linear" },
        { id: "2", time: 1, value: 2.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, -1)).toBe(1.0)
    })

    it("should handle very large time values", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 1.0, interpolation: "linear" },
        { id: "2", time: 1, value: 2.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, 1000)).toBe(2.0)
    })

    it("should handle extreme speed values", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0, value: 0.001, interpolation: "linear" },
        { id: "2", time: 1, value: 100, interpolation: "linear" },
      ]
      const speed = interpolateSpeed(keyframes, 0.5)
      expect(speed).toBeGreaterThan(0)
      expect(speed).toBeLessThan(101)
    })

    it("should handle duplicate keyframe times correctly", () => {
      const keyframes: SpeedKeyframe[] = [
        { id: "1", time: 0.5, value: 1.0, interpolation: "linear" },
        { id: "2", time: 0.5, value: 2.0, interpolation: "linear" },
        { id: "3", time: 0.5, value: 3.0, interpolation: "linear" },
      ]
      expect(interpolateSpeed(keyframes, 0.5)).toBe(1.0) // First keyframe wins
    })
  })
})
