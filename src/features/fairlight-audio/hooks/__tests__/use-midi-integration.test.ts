import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMidiIntegration } from "../use-midi-integration"

// Mock dependencies using vi.hoisted
const { mockUseMidi, mockUseMixerState, mockOnParameterChange } = vi.hoisted(() => ({
  mockUseMidi: vi.fn(),
  mockUseMixerState: vi.fn(),
  mockOnParameterChange: vi.fn(),
}))

vi.mock("./use-midi", () => ({
  useMidi: mockUseMidi,
}))

vi.mock("./use-mixer-state", () => ({
  useMixerState: mockUseMixerState,
}))

// Mock mixer state functions
const mockSetChannelVolume = vi.fn()
const mockSetChannelPan = vi.fn()
const mockSetMasterVolume = vi.fn()
const mockSetMasterLimiterThreshold = vi.fn()

describe.skip("useMidiIntegration", () => {
  let lastCallback: any = null

  beforeEach(() => {
    vi.clearAllMocks()
    lastCallback = null

    // Setup default mock returns
    mockUseMidi.mockReturnValue({
      onParameterChange: mockOnParameterChange,
    })

    mockUseMixerState.mockReturnValue({
      setChannelVolume: mockSetChannelVolume,
      setChannelPan: mockSetChannelPan,
      setMasterVolume: mockSetMasterVolume,
      setMasterLimiterThreshold: mockSetMasterLimiterThreshold,
    })

    // Default implementation returns unsubscribe function
    mockOnParameterChange.mockImplementation((callback: any) => {
      // Store the callback for testing
      lastCallback = callback
      return vi.fn() // Return unsubscribe function
    })
  })

  describe("initialization", () => {
    it("subscribes to MIDI parameter changes", () => {
      renderHook(() => useMidiIntegration())

      expect(mockOnParameterChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it("returns unsubscribe function on unmount", () => {
      const mockUnsubscribe = vi.fn()
      mockOnParameterChange.mockReturnValue(mockUnsubscribe)

      const { unmount } = renderHook(() => useMidiIntegration())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledOnce()
    })
  })

  describe("channel parameter handling", () => {
    it("sets channel volume from MIDI", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "channel.1.volume",
        value: 0.8,
        mapping: "test-mapping",
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(0, 0.8) // 0-based index
    })

    it("sets channel volume for different channels", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      // Channel 3 (1-based) should become index 2 (0-based)
      callback({
        parameter: "channel.3.volume",
        value: 0.6,
        mapping: "test-mapping",
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(2, 0.6)
    })

    it("sets channel pan from MIDI", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "channel.1.pan",
        value: 0.75, // Should convert to 0.5 (right)
        mapping: "test-mapping",
      })

      expect(mockSetChannelPan).toHaveBeenCalledWith(0, 0.5)
    })

    it("converts pan values correctly", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      // Test center pan
      callback({
        parameter: "channel.1.pan",
        value: 0.5, // Should convert to 0.0 (center)
        mapping: "test-mapping",
      })

      expect(mockSetChannelPan).toHaveBeenCalledWith(0, 0.0)

      // Test full left pan
      callback({
        parameter: "channel.1.pan",
        value: 0.0, // Should convert to -1.0 (left)
        mapping: "test-mapping",
      })

      expect(mockSetChannelPan).toHaveBeenCalledWith(0, -1.0)

      // Test full right pan
      callback({
        parameter: "channel.1.pan",
        value: 1.0, // Should convert to 1.0 (right)
        mapping: "test-mapping",
      })

      expect(mockSetChannelPan).toHaveBeenCalledWith(0, 1.0)
    })

    it("ignores invalid channel numbers", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "channel.invalid.volume",
        value: 0.8,
        mapping: "test-mapping",
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
    })

    it("ignores unknown channel parameters", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "channel.1.unknown",
        value: 0.8,
        mapping: "test-mapping",
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
      expect(mockSetChannelPan).not.toHaveBeenCalled()
    })
  })

  describe("master parameter handling", () => {
    it("sets master volume from MIDI", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "master.volume",
        value: 0.9,
        mapping: "test-mapping",
      })

      expect(mockSetMasterVolume).toHaveBeenCalledWith(0.9)
    })

    it("sets master limiter threshold from MIDI", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "master.limiter.threshold",
        value: 0.5, // Should convert to -10 dB (-20 + 0.5 * 20)
        mapping: "test-mapping",
      })

      expect(mockSetMasterLimiterThreshold).toHaveBeenCalledWith(-10)
    })

    it("converts limiter threshold values correctly", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      // Test minimum threshold (0 -> -20 dB)
      callback({
        parameter: "master.limiter.threshold",
        value: 0.0,
        mapping: "test-mapping",
      })

      expect(mockSetMasterLimiterThreshold).toHaveBeenCalledWith(-20)

      // Test maximum threshold (1 -> 0 dB)
      callback({
        parameter: "master.limiter.threshold",
        value: 1.0,
        mapping: "test-mapping",
      })

      expect(mockSetMasterLimiterThreshold).toHaveBeenCalledWith(0)

      // Test mid-range threshold (0.25 -> -15 dB)
      callback({
        parameter: "master.limiter.threshold",
        value: 0.25,
        mapping: "test-mapping",
      })

      expect(mockSetMasterLimiterThreshold).toHaveBeenCalledWith(-15)
    })

    it("ignores unknown master parameters", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "master.unknown",
        value: 0.8,
        mapping: "test-mapping",
      })

      expect(mockSetMasterVolume).not.toHaveBeenCalled()
      expect(mockSetMasterLimiterThreshold).not.toHaveBeenCalled()
    })
  })

  describe("parameter parsing", () => {
    it("ignores parameters with insufficient parts", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "invalid",
        value: 0.8,
        mapping: "test-mapping",
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
      expect(mockSetChannelPan).not.toHaveBeenCalled()
      expect(mockSetMasterVolume).not.toHaveBeenCalled()
      expect(mockSetMasterLimiterThreshold).not.toHaveBeenCalled()
    })

    it("ignores unknown target types", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "unknown.parameter.value",
        value: 0.8,
        mapping: "test-mapping",
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
      expect(mockSetChannelPan).not.toHaveBeenCalled()
      expect(mockSetMasterVolume).not.toHaveBeenCalled()
      expect(mockSetMasterLimiterThreshold).not.toHaveBeenCalled()
    })

    it("handles complex master parameter paths", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "master.effects.reverb.gain",
        value: 0.8,
        mapping: "test-mapping",
      })

      // Should ignore unknown nested parameters
      expect(mockSetMasterVolume).not.toHaveBeenCalled()
      expect(mockSetMasterLimiterThreshold).not.toHaveBeenCalled()
    })
  })

  describe("edge cases", () => {
    it("handles multiple rapid parameter changes", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      // Rapid fire multiple changes
      for (let i = 0; i < 10; i++) {
        callback({
          parameter: "channel.1.volume",
          value: i / 10,
          mapping: "test-mapping",
        })
      }

      expect(mockSetChannelVolume).toHaveBeenCalledTimes(10)
      expect(mockSetChannelVolume).toHaveBeenLastCalledWith(0, 0.9)
    })

    it("handles channel parameter with insufficient parts", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "channel.1", // Missing parameter name
        value: 0.8,
        mapping: "test-mapping",
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
      expect(mockSetChannelPan).not.toHaveBeenCalled()
    })

    it("handles zero-based channel number edge case", () => {
      renderHook(() => useMidiIntegration())

      const callback = lastCallback

      callback({
        parameter: "channel.0.volume", // Channel 0 becomes -1 (invalid)
        value: 0.8,
        mapping: "test-mapping",
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(-1, 0.8) // Should still call with -1
    })
  })

  describe("effect cleanup", () => {
    it("subscribes and unsubscribes correctly on dependency changes", () => {
      const mockUnsubscribe1 = vi.fn()
      const mockUnsubscribe2 = vi.fn()

      mockOnParameterChange.mockReturnValueOnce(mockUnsubscribe1).mockReturnValueOnce(mockUnsubscribe2)

      const { rerender } = renderHook(() => useMidiIntegration())

      expect(mockOnParameterChange).toHaveBeenCalledTimes(1)

      // Simulate dependency change by re-rendering
      rerender()

      expect(mockUnsubscribe1).toHaveBeenCalledOnce()
      expect(mockOnParameterChange).toHaveBeenCalledTimes(2)
    })
  })
})
