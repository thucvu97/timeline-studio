import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useChannelNoiseReduction, useNoiseReduction } from "../use-noise-reduction"

import type {
  AnalysisResult,
  NoiseProfile,
  NoiseReductionConfig,
} from "../../services/noise-reduction/noise-reduction-engine"

// Mock noise reduction engine using vi.hoisted
const { mockNoiseReductionEngine, MockNoiseReductionEngine } = vi.hoisted(() => {
  const mockNoiseReductionEngine = {
    createProcessor: vi.fn(),
    analyzeNoise: vi.fn(),
    analyzeAudio: vi.fn(),
    processFile: vi.fn(),
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }

  const MockNoiseReductionEngine = vi.fn(() => mockNoiseReductionEngine)

  return { mockNoiseReductionEngine, MockNoiseReductionEngine }
})

vi.mock("../../services/noise-reduction/noise-reduction-engine", () => ({
  NoiseReductionEngine: MockNoiseReductionEngine,
}))

// Mock audio data
const mockAudioContext = {
  createAnalyser: vi.fn(),
  createGain: vi.fn(),
  destination: {},
  sampleRate: 44100,
} as unknown as AudioContext

const mockAudioBuffer = {
  length: 44100,
  numberOfChannels: 2,
  sampleRate: 44100,
  duration: 1,
  getChannelData: vi.fn(),
} as unknown as AudioBuffer

const mockAudioNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
} as unknown as AudioNode

const mockNoiseProfile: NoiseProfile = {
  id: "profile-1",
  name: "Test Profile",
  spectrum: new Float32Array([0.1, 0.2, 0.3]),
  timestamp: Date.now(),
  sampleRate: 44100,
}

const mockAnalysisResult: AnalysisResult = {
  noiseLevel: 0.3,
  signalLevel: 0.7,
  snr: 7.4,
  recommendedReduction: 60,
  frequencyData: new Float32Array([0.1, 0.2, 0.3]),
}

const mockConfig: NoiseReductionConfig = {
  algorithm: "spectral",
  strength: 50,
  preserveVoice: true,
  attackTime: 10,
  releaseTime: 100,
  frequencySmoothing: 0.5,
  noiseFloor: -60,
  gateThreshold: -40,
}

describe("useNoiseReduction", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock returns
    mockNoiseReductionEngine.createProcessor.mockReturnValue(mockAudioNode)
    mockNoiseReductionEngine.analyzeNoise.mockResolvedValue(mockNoiseProfile)
    mockNoiseReductionEngine.analyzeAudio.mockResolvedValue(mockAnalysisResult)
    mockNoiseReductionEngine.processFile.mockResolvedValue(mockAudioBuffer)
  })

  describe("initialization", () => {
    it("initializes with default values when disabled", () => {
      const { result } = renderHook(() => useNoiseReduction({ enabled: false }))

      expect(result.current.engine).toBe(null)
      expect(result.current.profiles).toEqual([])
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.analysisResult).toBe(null)
    })

    it("initializes with default values when no audio context", () => {
      const { result } = renderHook(() => useNoiseReduction({ enabled: true }))

      expect(result.current.engine).toBe(null)
      expect(result.current.profiles).toEqual([])
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.analysisResult).toBe(null)
    })

    it("initializes engine when enabled with audio context", () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      expect(MockNoiseReductionEngine).toHaveBeenCalledWith(mockAudioContext)
      expect(result.current.engine).toBe(mockNoiseReductionEngine)
    })

    it("sets up event listeners on initialization", () => {
      renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      expect(mockNoiseReductionEngine.on).toHaveBeenCalledWith("profileCreated", expect.any(Function))
      expect(mockNoiseReductionEngine.on).toHaveBeenCalledWith("processingStarted", expect.any(Function))
      expect(mockNoiseReductionEngine.on).toHaveBeenCalledWith("processingCompleted", expect.any(Function))
      expect(mockNoiseReductionEngine.on).toHaveBeenCalledWith("processingError", expect.any(Function))
    })

    it("disposes engine on unmount", () => {
      const { unmount } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      unmount()

      expect(mockNoiseReductionEngine.dispose).toHaveBeenCalledOnce()
    })
  })

  describe("event handling", () => {
    it("adds profile when profileCreated event is fired", () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      // Get the profileCreated event handler
      const profileCreatedHandler = mockNoiseReductionEngine.on.mock.calls.find(
        (call) => call[0] === "profileCreated",
      )?.[1]

      act(() => {
        profileCreatedHandler!(mockNoiseProfile)
      })

      expect(result.current.profiles).toContain(mockNoiseProfile)
    })

    it("sets processing state on processing events", () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      // Get event handlers
      const processingStartedHandler = mockNoiseReductionEngine.on.mock.calls.find(
        (call) => call[0] === "processingStarted",
      )?.[1]
      const processingCompletedHandler = mockNoiseReductionEngine.on.mock.calls.find(
        (call) => call[0] === "processingCompleted",
      )?.[1]

      act(() => {
        processingStartedHandler!()
      })

      expect(result.current.isProcessing).toBe(true)

      act(() => {
        processingCompletedHandler!()
      })

      expect(result.current.isProcessing).toBe(false)
    })

    it("handles processing errors", () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Get error handler
      const processingErrorHandler = mockNoiseReductionEngine.on.mock.calls.find(
        (call) => call[0] === "processingError",
      )?.[1]

      act(() => {
        processingErrorHandler!(new Error("Processing failed"))
      })

      expect(consoleSpy).toHaveBeenCalledWith("Noise reduction error:", expect.any(Error))
      expect(result.current.isProcessing).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe("createProcessor", () => {
    it("creates processor with engine", () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      let processor: AudioNode | null = null
      act(() => {
        processor = result.current.createProcessor(mockConfig)
      })

      expect(mockNoiseReductionEngine.createProcessor).toHaveBeenCalledWith(mockConfig)
      expect(processor).toBe(mockAudioNode)
    })

    it("returns null when no engine", () => {
      const { result } = renderHook(() => useNoiseReduction({ enabled: false }))

      let processor: AudioNode | null = null
      act(() => {
        processor = result.current.createProcessor(mockConfig)
      })

      expect(processor).toBe(null)
    })

    it("handles processor creation errors", () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockNoiseReductionEngine.createProcessor.mockImplementationOnce(() => {
        throw new Error("Processor creation failed")
      })

      let processor: AudioNode | null = null
      act(() => {
        processor = result.current.createProcessor(mockConfig)
      })

      expect(consoleSpy).toHaveBeenCalledWith("Failed to create noise processor:", expect.any(Error))
      expect(processor).toBe(null)

      consoleSpy.mockRestore()
    })
  })

  describe("analyzeNoise", () => {
    it("analyzes noise with engine", async () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      let profile: NoiseProfile | null = null
      await act(async () => {
        profile = await result.current.analyzeNoise(mockAudioBuffer)
      })

      expect(mockNoiseReductionEngine.analyzeNoise).toHaveBeenCalledWith(mockAudioBuffer)
      expect(profile).toBe(mockNoiseProfile)
    })

    it("throws error when no engine", async () => {
      const { result } = renderHook(() => useNoiseReduction({ enabled: false }))

      await expect(result.current.analyzeNoise(mockAudioBuffer)).rejects.toThrow(
        "Noise reduction engine not initialized",
      )
    })
  })

  describe("analyzeAudio", () => {
    it("analyzes audio and sets result", async () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      let analysisResult: AnalysisResult | null = null
      await act(async () => {
        analysisResult = await result.current.analyzeAudio(mockAudioBuffer)
      })

      expect(mockNoiseReductionEngine.analyzeAudio).toHaveBeenCalledWith(mockAudioBuffer)
      expect(analysisResult).toBe(mockAnalysisResult)
      expect(result.current.analysisResult).toBe(mockAnalysisResult)
    })

    it("throws error when no engine", async () => {
      const { result } = renderHook(() => useNoiseReduction({ enabled: false }))

      await expect(result.current.analyzeAudio(mockAudioBuffer)).rejects.toThrow(
        "Noise reduction engine not initialized",
      )
    })
  })

  describe("processFile", () => {
    it("processes file with engine", async () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      let processedBuffer: AudioBuffer | null = null
      await act(async () => {
        processedBuffer = await result.current.processFile(mockAudioBuffer, mockConfig, "profile-1")
      })

      expect(mockNoiseReductionEngine.processFile).toHaveBeenCalledWith(mockAudioBuffer, mockConfig, "profile-1")
      expect(processedBuffer).toBe(mockAudioBuffer)
    })

    it("processes file without profile", async () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      await act(async () => {
        await result.current.processFile(mockAudioBuffer, mockConfig)
      })

      expect(mockNoiseReductionEngine.processFile).toHaveBeenCalledWith(mockAudioBuffer, mockConfig, undefined)
    })

    it("throws error when no engine", async () => {
      const { result } = renderHook(() => useNoiseReduction({ enabled: false }))

      await expect(result.current.processFile(mockAudioBuffer, mockConfig)).rejects.toThrow(
        "Noise reduction engine not initialized",
      )
    })
  })

  describe("deleteProfile", () => {
    it("removes profile from list", () => {
      const { result } = renderHook(() => useNoiseReduction({ audioContext: mockAudioContext, enabled: true }))

      // Add a profile first
      const profileCreatedHandler = mockNoiseReductionEngine.on.mock.calls.find(
        (call) => call[0] === "profileCreated",
      )?.[1]

      act(() => {
        profileCreatedHandler!(mockNoiseProfile)
      })

      expect(result.current.profiles).toContain(mockNoiseProfile)

      // Delete the profile
      act(() => {
        result.current.deleteProfile("profile-1")
      })

      expect(result.current.profiles).not.toContain(mockNoiseProfile)
    })
  })

  describe("function stability", () => {
    it("returns stable function references", () => {
      const { result, rerender } = renderHook(() =>
        useNoiseReduction({ audioContext: mockAudioContext, enabled: true }),
      )

      const firstRender = result.current

      rerender()

      const secondRender = result.current

      // Functions should be the same reference (stable)
      expect(secondRender.createProcessor).toBe(firstRender.createProcessor)
      expect(secondRender.analyzeNoise).toBe(firstRender.analyzeNoise)
      expect(secondRender.analyzeAudio).toBe(firstRender.analyzeAudio)
      expect(secondRender.processFile).toBe(firstRender.processFile)
      expect(secondRender.deleteProfile).toBe(firstRender.deleteProfile)
    })
  })
})

describe("useChannelNoiseReduction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("initializes with default config", () => {
    const { result } = renderHook(() => useChannelNoiseReduction("ch1", mockAudioContext))

    expect(result.current.config).toEqual({
      algorithm: "spectral",
      strength: 50,
      preserveVoice: true,
      attackTime: 10,
      releaseTime: 100,
      frequencySmoothing: 0.5,
      noiseFloor: -60,
      gateThreshold: -40,
    })
  })

  it("creates processor when engine and config are available", async () => {
    const { result } = renderHook(() => useChannelNoiseReduction("ch1", mockAudioContext))

    await waitFor(() => {
      expect(result.current.engine).toBe(mockNoiseReductionEngine)
    })

    await waitFor(() => {
      expect(result.current.processor).toBe(mockAudioNode)
    })
  })

  it("updates processor when config changes", async () => {
    const { result } = renderHook(() => useChannelNoiseReduction("ch1", mockAudioContext))

    await waitFor(() => {
      expect(result.current.engine).toBe(mockNoiseReductionEngine)
    })

    // Change config
    act(() => {
      result.current.setConfig({
        ...result.current.config,
        strength: 75,
      })
    })

    expect(result.current.config.strength).toBe(75)
    expect(mockNoiseReductionEngine.createProcessor).toHaveBeenCalledWith(expect.objectContaining({ strength: 75 }))
  })

  it("inherits all noise reduction functionality", () => {
    const { result } = renderHook(() => useChannelNoiseReduction("ch1", mockAudioContext))

    // Should have all useNoiseReduction functions
    expect(typeof result.current.createProcessor).toBe("function")
    expect(typeof result.current.analyzeNoise).toBe("function")
    expect(typeof result.current.analyzeAudio).toBe("function")
    expect(typeof result.current.processFile).toBe("function")
    expect(typeof result.current.deleteProfile).toBe("function")

    // Plus channel-specific additions
    expect(typeof result.current.setConfig).toBe("function")
    expect(result.current.config).toBeDefined()
    expect(result.current.processor).toBeDefined()
  })
})
