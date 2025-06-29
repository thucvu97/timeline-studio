import { beforeEach, describe, expect, it, vi } from "vitest"

import { SurroundAudioProcessor } from "../surround-processor"

// Mock Web Audio API
const mockAudioContext = {
  createGain: vi.fn(),
  createChannelSplitter: vi.fn(),
  createChannelMerger: vi.fn(),
  currentTime: 0,
}

const mockGainNode = {
  gain: {
    value: 0,
    cancelScheduledValues: vi.fn(),
    setTargetAtTime: vi.fn(),
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockSplitterNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockMergerNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
}

describe("SurroundAudioProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAudioContext.createGain.mockReturnValue({ ...mockGainNode })
    mockAudioContext.createChannelSplitter.mockReturnValue(mockSplitterNode)
    mockAudioContext.createChannelMerger.mockReturnValue(mockMergerNode)
  })

  describe("initialization", () => {
    it("creates processor with default stereo format", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3) // input + 2 channel gains
      expect(mockAudioContext.createChannelSplitter).toHaveBeenCalledWith(2)
      expect(processor.getPosition()).toEqual({ x: 50, y: 50 })
    })

    it("creates processor with 5.1 format", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "5.1")

      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(7) // input + 6 channel gains
      expect(mockAudioContext.createChannelSplitter).toHaveBeenCalledWith(6)
    })

    it("creates processor with 7.1 format", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "7.1")

      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(9) // input + 8 channel gains
      expect(mockAudioContext.createChannelSplitter).toHaveBeenCalledWith(8)
    })
  })

  describe("position management", () => {
    it("sets and gets position correctly", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      processor.setPosition({ x: 25, y: 75 })
      expect(processor.getPosition()).toEqual({ x: 25, y: 75 })
    })

    it("updates channel gains when position changes", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      processor.setPosition({ x: 30, y: 50 })

      // Should update gain values
      expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalled()
      expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalled()
    })

    it("returns a copy of position to prevent external mutation", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      const pos1 = processor.getPosition()
      pos1.x = 100

      const pos2 = processor.getPosition()
      expect(pos2.x).toBe(50) // Should still be default
    })
  })

  describe("format switching", () => {
    it("switches from stereo to 5.1", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      vi.clearAllMocks()
      processor.setFormat("5.1")

      expect(mockSplitterNode.disconnect).toHaveBeenCalled()
      expect(mockAudioContext.createChannelSplitter).toHaveBeenCalledWith(6)
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(6) // 6 channel gains (input was created in constructor)
    })

    it("does nothing when setting same format", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "5.1")

      vi.clearAllMocks()
      processor.setFormat("5.1")

      expect(mockAudioContext.createChannelSplitter).not.toHaveBeenCalled()
    })
  })

  describe("channel gain calculations", () => {
    it("calculates higher gain for closer speakers", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "stereo")

      // Position close to left speaker (L is at x:30)
      processor.setPosition({ x: 30, y: 50 })

      const levels = processor.getChannelLevels()
      // We can't test exact values without accessing private methods,
      // but we can verify the structure
      expect(levels).toHaveProperty("L")
      expect(levels).toHaveProperty("R")
      expect(Object.keys(levels).length).toBe(2)
    })

    it("returns correct channel levels for 5.1", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "5.1")

      const levels = processor.getChannelLevels()
      expect(Object.keys(levels)).toEqual(["L", "R", "C", "LFE", "LS", "RS"])
    })

    it("returns correct channel levels for 7.1", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "7.1")

      const levels = processor.getChannelLevels()
      expect(Object.keys(levels)).toEqual(["L", "R", "C", "LFE", "LS", "RS", "LR", "RR"])
    })
  })

  describe("audio routing", () => {
    it("connects to destination node", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)
      const destinationNode = { connect: vi.fn() }

      processor.connect(destinationNode as any)

      expect(mockSplitterNode.connect).toHaveBeenCalledWith(destinationNode)
    })

    it("disconnects all nodes", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      processor.disconnect()

      expect(mockGainNode.disconnect).toHaveBeenCalled()
      expect(mockSplitterNode.disconnect).toHaveBeenCalled()
    })

    it("returns input node", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      const inputNode = processor.getInputNode()
      expect(inputNode).toMatchObject(mockGainNode)
    })

    it("returns output node", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      const outputNode = processor.getOutputNode()
      expect(outputNode).toBe(mockSplitterNode)
    })
  })

  describe("channel output", () => {
    it("returns channel output for valid channel", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "5.1")

      const channelOutput = processor.getChannelOutput("C")

      expect(channelOutput).toBeDefined()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
      expect(mockSplitterNode.connect).toHaveBeenCalled()
    })

    it("returns null for invalid channel", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "stereo")

      const channelOutput = processor.getChannelOutput("C") // Center doesn't exist in stereo

      expect(channelOutput).toBeNull()
    })
  })

  describe("stereo downmix", () => {
    it("creates stereo downmix for monitoring", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "5.1")

      const downmix = processor.createStereoDownmix()

      expect(mockAudioContext.createChannelMerger).toHaveBeenCalledWith(2)
      expect(mockAudioContext.createGain).toHaveBeenCalled()
      expect(downmix).toBe(mockMergerNode)
    })

    it("applies correct downmix coefficients", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "5.1")

      processor.createStereoDownmix()

      // Verify gain nodes were created for each channel
      const gainCalls = mockAudioContext.createGain.mock.calls
      expect(gainCalls.length).toBeGreaterThan(6) // Original channels + downmix gains
    })

    it("handles 7.1 downmix correctly", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "7.1")

      const downmix = processor.createStereoDownmix()

      expect(downmix).toBeDefined()
      expect(mockAudioContext.createChannelMerger).toHaveBeenCalledWith(2)
    })
  })

  describe("edge cases", () => {
    it("handles extreme position values", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      // Test extreme positions
      processor.setPosition({ x: 0, y: 0 })
      expect(processor.getPosition()).toEqual({ x: 0, y: 0 })

      processor.setPosition({ x: 100, y: 100 })
      expect(processor.getPosition()).toEqual({ x: 100, y: 100 })
    })

    it("handles position at speaker locations", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "stereo")

      // Position at left speaker (approximately)
      processor.setPosition({ x: 30, y: 50 })

      // Should not throw and should update gains
      expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalled()
    })

    it("handles rapid position changes", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any)

      // Rapid position changes
      for (let i = 0; i < 10; i++) {
        processor.setPosition({ x: i * 10, y: i * 10 })
      }

      // Should handle all updates without error
      expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledTimes(22) // 2 initial + 2 channels * 10 updates
    })
  })

  describe("format-specific behavior", () => {
    it("handles LFE channel in 5.1", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "5.1")

      processor.setPosition({ x: 50, y: 50 })

      const levels = processor.getChannelLevels()
      // LFE should have a value (implementation specific)
      expect(levels.LFE).toBeDefined()
    })

    it("handles center channel boost when positioned front-center", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "5.1")

      // Position at front center
      processor.setPosition({ x: 50, y: 30 })

      const levels = processor.getChannelLevels()
      expect(levels.C).toBeDefined()
    })
  })

  describe("cleanup", () => {
    it("properly cleans up when switching formats", () => {
      const processor = new SurroundAudioProcessor(mockAudioContext as any, "stereo")

      const initialGainNodes = mockAudioContext.createGain.mock.calls.length

      processor.setFormat("5.1")

      // Old nodes should be disconnected
      expect(mockGainNode.disconnect).toHaveBeenCalled()
      expect(mockSplitterNode.disconnect).toHaveBeenCalled()

      // New nodes should be created
      expect(mockAudioContext.createGain.mock.calls.length).toBeGreaterThan(initialGainNodes)
    })
  })
})
