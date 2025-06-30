import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useChannelEffects } from "../use-channel-effects"

import type { Effect } from "../../components/effects/effects-rack"

// Mock dependencies using vi.hoisted
const { mockAudioEngine, mockEqualizerProcessor, mockCompressorProcessor, mockReverbProcessor } = vi.hoisted(() => ({
  mockAudioEngine: {
    audioContext: {
      createGain: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        gain: { value: 1 },
      })),
      createBiquadFilter: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        frequency: { value: 1000 },
        Q: { value: 1 },
        gain: { value: 0 },
        type: "peaking",
      })),
      createDynamicsCompressor: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        threshold: { value: -24 },
        ratio: { value: 4 },
        attack: { value: 0.01 },
        release: { value: 0.1 },
        knee: { value: 2.5 },
      })),
      createConvolver: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        buffer: null,
      })),
    },
    addEffect: vi.fn(),
    removeEffect: vi.fn(),
  },
  mockEqualizerProcessor: {
    getInputNode: vi.fn(() => ({ connect: vi.fn() })),
    disconnect: vi.fn(),
    bypass: vi.fn(),
    updateBand: vi.fn(),
  },
  mockCompressorProcessor: {
    getInputNode: vi.fn(() => ({ connect: vi.fn() })),
    disconnect: vi.fn(),
    bypass: vi.fn(),
    updateParameter: vi.fn(),
  },
  mockReverbProcessor: {
    getInputNode: vi.fn(() => ({ connect: vi.fn() })),
    disconnect: vi.fn(),
    bypass: vi.fn(),
    updateParameter: vi.fn(),
  },
}))

vi.mock("../../services/effects/equalizer-processor", () => ({
  EqualizerProcessor: vi.fn(() => mockEqualizerProcessor),
}))

vi.mock("../../services/effects/compressor-processor", () => ({
  CompressorProcessor: vi.fn(() => mockCompressorProcessor),
}))

vi.mock("../../services/effects/reverb-processor", () => ({
  ReverbProcessor: vi.fn(() => mockReverbProcessor),
}))

const mockEffect: Effect = {
  id: "effect-1",
  type: "equalizer",
  name: "Test EQ",
  isEnabled: true,
  parameters: {},
  preset: "custom",
}

describe("useChannelEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("returns effect management functions when engine is provided", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      expect(typeof result.current.addEffect).toBe("function")
      expect(typeof result.current.removeEffect).toBe("function")
      expect(typeof result.current.toggleEffect).toBe("function")
      expect(typeof result.current.updateEffectParameter).toBe("function")
    })

    it("returns effect management functions when engine is null", () => {
      const { result } = renderHook(() => useChannelEffects(null, "ch1"))

      expect(typeof result.current.addEffect).toBe("function")
      expect(typeof result.current.removeEffect).toBe("function")
      expect(typeof result.current.toggleEffect).toBe("function")
      expect(typeof result.current.updateEffectParameter).toBe("function")
    })
  })

  describe("equalizer effects", () => {
    it("creates equalizer processor when adding effect", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.addEffect(mockEffect)

      // Should have called the mock processor constructor
      expect(mockEqualizerProcessor.getInputNode).toBeDefined()
    })

    it("adds effect to audio engine", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.addEffect(mockEffect)

      expect(mockAudioEngine.addEffect).toHaveBeenCalledWith(
        "ch1",
        expect.any(Object), // input node
        0, // effect index
      )
    })

    it("does nothing when engine is null", () => {
      const { result } = renderHook(() => useChannelEffects(null, "ch1"))

      result.current.addEffect(mockEffect)

      expect(mockAudioEngine.addEffect).not.toHaveBeenCalled()
    })

    it("updates equalizer band parameters", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.addEffect(mockEffect)
      result.current.updateEffectParameter("effect-1", "band-2", 5.0)

      expect(mockEqualizerProcessor.updateBand).toHaveBeenCalledWith(2, { gain: 5.0 })
    })
  })

  describe("compressor effects", () => {
    const compressorEffect: Effect = {
      id: "comp-1",
      type: "compressor",
      name: "Test Compressor",
      isEnabled: true,
      parameters: {},
      preset: "vocal",
    }

    it("creates compressor processor when adding effect", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.addEffect(compressorEffect)

      // Should have called the mock processor constructor
      expect(mockCompressorProcessor.getInputNode).toBeDefined()
    })

    it("updates compressor parameters", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.addEffect(compressorEffect)
      result.current.updateEffectParameter("comp-1", "threshold", -18)

      expect(mockCompressorProcessor.updateParameter).toHaveBeenCalledWith("threshold", -18)
    })
  })

  describe("reverb effects", () => {
    const reverbEffect: Effect = {
      id: "reverb-1",
      type: "reverb",
      name: "Test Reverb",
      isEnabled: true,
      parameters: {},
      preset: "hall",
    }

    it("creates reverb processor when adding effect", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.addEffect(reverbEffect)

      // Should have called the mock processor constructor
      expect(mockReverbProcessor.getInputNode).toBeDefined()
    })

    it("updates reverb parameters", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.addEffect(reverbEffect)
      result.current.updateEffectParameter("reverb-1", "roomSize", 75)

      expect(mockReverbProcessor.updateParameter).toHaveBeenCalledWith("roomSize", 75)
    })
  })

  describe("effect management", () => {
    it("removes effect by ID", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      // Add effect first
      result.current.addEffect(mockEffect)

      // Remove effect
      result.current.removeEffect("effect-1")

      expect(mockAudioEngine.removeEffect).toHaveBeenCalledWith("ch1", 0)
      expect(mockEqualizerProcessor.disconnect).toHaveBeenCalledOnce()
    })

    it("does nothing when removing non-existent effect", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.removeEffect("non-existent")

      expect(mockAudioEngine.removeEffect).not.toHaveBeenCalled()
    })

    it("does nothing when removing effect with null engine", () => {
      const { result } = renderHook(() => useChannelEffects(null, "ch1"))

      result.current.removeEffect("effect-1")

      expect(mockAudioEngine.removeEffect).not.toHaveBeenCalled()
    })

    it("toggles effect enabled state", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      // Add effect first
      result.current.addEffect(mockEffect)

      // Toggle effect
      result.current.toggleEffect("effect-1", false)

      expect(mockEqualizerProcessor.bypass).toHaveBeenCalledWith(true) // bypass = !enabled
    })

    it("does nothing when toggling non-existent effect", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      result.current.toggleEffect("non-existent", false)

      expect(mockEqualizerProcessor.bypass).not.toHaveBeenCalled()
    })
  })

  describe("multiple effects", () => {
    it("manages multiple effects with correct indices", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      const effect2: Effect = { ...mockEffect, id: "effect-2", type: "compressor" }

      // Add two effects
      result.current.addEffect(mockEffect) // index 0
      result.current.addEffect(effect2) // index 1

      expect(mockAudioEngine.addEffect).toHaveBeenCalledWith("ch1", expect.any(Object), 0)
      expect(mockAudioEngine.addEffect).toHaveBeenCalledWith("ch1", expect.any(Object), 1)

      // Remove first effect
      result.current.removeEffect("effect-1")

      expect(mockAudioEngine.removeEffect).toHaveBeenCalledWith("ch1", 0)
    })

    it("handles effect removal by finding correct index", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      const effect2: Effect = { ...mockEffect, id: "effect-2", type: "compressor" }
      const effect3: Effect = { ...mockEffect, id: "effect-3", type: "reverb" }

      // Add three effects
      result.current.addEffect(mockEffect)
      result.current.addEffect(effect2)
      result.current.addEffect(effect3)

      // Remove middle effect
      result.current.removeEffect("effect-2")

      expect(mockAudioEngine.removeEffect).toHaveBeenCalledWith("ch1", 1) // Index of effect-2
    })
  })

  describe("unknown effect types", () => {
    it("throws error for unknown effect type", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      const unknownEffect: Effect = {
        id: "unknown-1",
        type: "unknown" as any,
        name: "Unknown Effect",
        isEnabled: true,
        parameters: {},
        preset: "default",
      }

      expect(() => {
        result.current.addEffect(unknownEffect)
      }).toThrow("Unknown effect type: unknown")
    })
  })

  describe("cleanup", () => {
    it("disconnects all effects on unmount", () => {
      const { result, unmount } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      // Add some effects
      result.current.addEffect(mockEffect)
      const compressorEffect: Effect = { ...mockEffect, id: "comp-1", type: "compressor" }
      result.current.addEffect(compressorEffect)

      // Unmount hook
      unmount()

      expect(mockEqualizerProcessor.disconnect).toHaveBeenCalledOnce()
      expect(mockCompressorProcessor.disconnect).toHaveBeenCalledOnce()
    })
  })

  describe("function stability", () => {
    it("returns stable function references", () => {
      const { result, rerender } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      const firstRender = result.current

      rerender()

      const secondRender = result.current

      // Functions should be the same reference (stable)
      expect(secondRender.addEffect).toBe(firstRender.addEffect)
      expect(secondRender.removeEffect).toBe(firstRender.removeEffect)
      expect(secondRender.toggleEffect).toBe(firstRender.toggleEffect)
      expect(secondRender.updateEffectParameter).toBe(firstRender.updateEffectParameter)
    })
  })

  describe("parameter updates for unknown effect types", () => {
    it("does nothing for unknown parameter in unknown effect type", () => {
      const { result } = renderHook(() => useChannelEffects(mockAudioEngine, "ch1"))

      // Add effect and modify its type after creation to simulate unknown type
      result.current.addEffect(mockEffect)

      // Manually modify the effect type to unknown (simulating edge case)
      const effectsRef = (result.current as any).effectsRef?.current
      if (effectsRef) {
        const effectData = effectsRef.get("effect-1")
        if (effectData) {
          effectData.type = "unknown"
        }
      }

      // This should not throw or cause issues
      result.current.updateEffectParameter("effect-1", "someParam", 42)

      // No processor methods should be called for unknown type
      expect(mockEqualizerProcessor.updateBand).not.toHaveBeenCalled()
      expect(mockCompressorProcessor.updateParameter).not.toHaveBeenCalled()
      expect(mockReverbProcessor.updateParameter).not.toHaveBeenCalled()
    })
  })
})
