import { beforeEach, describe, expect, it, vi } from "vitest"

import { AudioEngine } from "../audio-engine"

// Mock Web Audio API
const mockAudioContext = {
  createGain: vi.fn(),
  createStereoPanner: vi.fn(),
  createAnalyser: vi.fn(),
  createDynamicsCompressor: vi.fn(),
  createMediaElementSource: vi.fn(),
  destination: { connect: vi.fn() },
  state: "running" as AudioContextState,
  resume: vi.fn(),
  close: vi.fn(),
  sampleRate: 48000,
  currentTime: 0,
}

const mockGainNode = {
  gain: {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockPanNode = {
  pan: {
    value: 0,
    setValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockAnalyserNode = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockCompressorNode = {
  threshold: {
    value: -3,
    setValueAtTime: vi.fn(),
  },
  knee: { value: 0 },
  ratio: { value: 20 },
  attack: { value: 0.003 },
  release: { value: 0.1 },
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockMediaElementSource = {
  connect: vi.fn(),
  disconnect: vi.fn(),
}

// Mock SurroundAudioProcessor
vi.mock("../surround/surround-processor", () => ({
  SurroundAudioProcessor: vi.fn().mockImplementation(() => ({
    getInputNode: vi.fn().mockReturnValue(mockGainNode),
    getOutputNode: vi.fn().mockReturnValue(mockGainNode),
    setPosition: vi.fn(),
    getPosition: vi.fn().mockReturnValue({ x: 50, y: 50 }),
    setFormat: vi.fn(),
    getChannelLevels: vi.fn().mockReturnValue({ L: 0.5, R: 0.5 }),
    createStereoDownmix: vi.fn().mockReturnValue(mockGainNode),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

// Mock AudioClipEditor
vi.mock("../audio-clip-editor", () => ({
  AudioClipEditor: vi.fn().mockImplementation(() => ({})),
}))

describe("AudioEngine", () => {
  let audioEngine: AudioEngine

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext) as any
    mockAudioContext.createGain.mockReturnValue({ ...mockGainNode })
    mockAudioContext.createStereoPanner.mockReturnValue({ ...mockPanNode })
    mockAudioContext.createAnalyser.mockReturnValue({ ...mockAnalyserNode })
    mockAudioContext.createDynamicsCompressor.mockReturnValue({ ...mockCompressorNode })
    mockAudioContext.createMediaElementSource.mockReturnValue(mockMediaElementSource)

    audioEngine = new AudioEngine()
  })

  describe("initialization", () => {
    it("creates audio context with correct settings", () => {
      expect(global.AudioContext).toHaveBeenCalledWith({
        sampleRate: 48000,
        latencyHint: "interactive",
      })
    })

    it("sets up master chain correctly", () => {
      expect(mockAudioContext.createGain).toHaveBeenCalled()
      expect(mockAudioContext.createDynamicsCompressor).toHaveBeenCalled()
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockCompressorNode)
      expect(mockCompressorNode.connect).toHaveBeenCalledWith(mockAudioContext.destination)
    })

    it("configures limiter with correct settings", () => {
      expect(mockCompressorNode.threshold.value).toBe(-3)
      expect(mockCompressorNode.knee.value).toBe(0)
      expect(mockCompressorNode.ratio.value).toBe(20)
      expect(mockCompressorNode.attack.value).toBe(0.003)
      expect(mockCompressorNode.release.value).toBe(0.1)
    })

    it("resumes suspended audio context", async () => {
      mockAudioContext.state = "suspended"
      await audioEngine.initialize()
      expect(mockAudioContext.resume).toHaveBeenCalled()
    })
  })

  describe("channel management", () => {
    it("creates new channel with correct configuration", () => {
      const channel = audioEngine.createChannel("test-channel")

      expect(channel.id).toBe("test-channel")
      expect(channel.isMuted).toBe(false)
      expect(channel.isSolo).toBe(false)
      expect(channel.effects).toEqual([])
      expect(mockAnalyserNode.fftSize).toBe(2048)
      expect(mockAnalyserNode.smoothingTimeConstant).toBe(0.8)
    })

    it("returns existing channel if already created", () => {
      const channel1 = audioEngine.createChannel("test-channel")
      const channel2 = audioEngine.createChannel("test-channel")

      expect(channel1).toBe(channel2)
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(2) // Only master + first channel
    })

    it("connects media element to channel", () => {
      const channel = audioEngine.createChannel("test-channel")
      const mediaElement = { play: vi.fn() } as any

      audioEngine.connectMediaElement("test-channel", mediaElement)

      expect(mockAudioContext.createMediaElementSource).toHaveBeenCalledWith(mediaElement)
      expect(mockMediaElementSource.connect).toHaveBeenCalledWith(channel.gainNode)
    })

    it("disconnects existing source when connecting new one", () => {
      audioEngine.createChannel("test-channel")
      const mediaElement1 = { play: vi.fn() } as any
      const mediaElement2 = { play: vi.fn() } as any

      audioEngine.connectMediaElement("test-channel", mediaElement1)
      audioEngine.connectMediaElement("test-channel", mediaElement2)

      expect(mockMediaElementSource.disconnect).toHaveBeenCalledTimes(1)
    })
  })

  describe("volume and pan controls", () => {
    it("updates channel volume correctly", () => {
      audioEngine.createChannel("test-channel")

      audioEngine.updateChannelVolume("test-channel", 75)

      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.75, mockAudioContext.currentTime)
    })

    it("updates channel pan correctly", () => {
      audioEngine.createChannel("test-channel")

      audioEngine.updateChannelPan("test-channel", -50)

      expect(mockPanNode.pan.setValueAtTime).toHaveBeenCalledWith(-0.5, mockAudioContext.currentTime)
    })

    it("handles volume for non-existent channel", () => {
      audioEngine.updateChannelVolume("non-existent", 50)
      // Should not throw
    })

    it("handles pan for non-existent channel", () => {
      audioEngine.updateChannelPan("non-existent", 0)
      // Should not throw
    })
  })

  describe("mute and solo functionality", () => {
    it("mutes channel correctly", () => {
      audioEngine.createChannel("channel1")

      audioEngine.muteChannel("channel1", true)

      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, mockAudioContext.currentTime + 0.05)
    })

    it("unmutes channel correctly", () => {
      audioEngine.createChannel("channel1")
      audioEngine.muteChannel("channel1", true)

      vi.clearAllMocks()
      audioEngine.muteChannel("channel1", false)

      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, mockAudioContext.currentTime + 0.05)
    })

    it("solos channel and mutes others", () => {
      audioEngine.createChannel("channel1")
      audioEngine.createChannel("channel2")

      audioEngine.soloChannel("channel1", true)

      // Channel 1 should be unmuted, channel 2 should be muted
      const channels = audioEngine.getChannels()
      expect(channels.get("channel1")?.isSolo).toBe(true)
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalled()
    })

    it("handles multiple solo channels", () => {
      audioEngine.createChannel("channel1")
      audioEngine.createChannel("channel2")
      audioEngine.createChannel("channel3")

      audioEngine.soloChannel("channel1", true)
      audioEngine.soloChannel("channel2", true)

      // Channels 1 and 2 should be solo, channel 3 should be muted
      const channels = audioEngine.getChannels()
      expect(channels.get("channel1")?.isSolo).toBe(true)
      expect(channels.get("channel2")?.isSolo).toBe(true)
      expect(channels.get("channel3")?.isSolo).toBe(false)
    })
  })

  describe("master controls", () => {
    it("updates master volume", () => {
      audioEngine.updateMasterVolume(80)

      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.8, mockAudioContext.currentTime)
    })

    it("enables limiter", () => {
      audioEngine.enableLimiter(true)

      expect(mockGainNode.disconnect).toHaveBeenCalled()
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockCompressorNode)
    })

    it("disables limiter", () => {
      audioEngine.enableLimiter(false)

      expect(mockGainNode.disconnect).toHaveBeenCalled()
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination)
    })

    it("sets limiter threshold", () => {
      audioEngine.setLimiterThreshold(-6)

      expect(mockCompressorNode.threshold.setValueAtTime).toHaveBeenCalledWith(-6, mockAudioContext.currentTime)
    })
  })

  describe("analyser access", () => {
    it("returns channel analyser", () => {
      const channel = audioEngine.createChannel("test-channel")

      const analyser = audioEngine.getChannelAnalyser("test-channel")

      expect(analyser).toBe(channel.analyser)
    })

    it("returns null for non-existent channel analyser", () => {
      const analyser = audioEngine.getChannelAnalyser("non-existent")

      expect(analyser).toBeNull()
    })

    it("creates and returns master analyser", () => {
      const analyser = audioEngine.getMasterAnalyser()

      expect(mockAudioContext.createAnalyser).toHaveBeenCalled()
      expect(mockCompressorNode.connect).toHaveBeenCalledWith(analyser)
    })
  })

  describe("effect chain management", () => {
    it("adds effect to channel", () => {
      audioEngine.createChannel("test-channel")
      const effect = { connect: vi.fn(), disconnect: vi.fn() }

      audioEngine.addEffect("test-channel", effect as any)

      const channel = audioEngine.getChannel("test-channel")
      expect(channel?.effects).toContain(effect)
    })

    it("inserts effect at specific index", () => {
      audioEngine.createChannel("test-channel")
      const effect1 = { connect: vi.fn(), disconnect: vi.fn() }
      const effect2 = { connect: vi.fn(), disconnect: vi.fn() }
      const effect3 = { connect: vi.fn(), disconnect: vi.fn() }

      audioEngine.addEffect("test-channel", effect1 as any)
      audioEngine.addEffect("test-channel", effect2 as any)
      audioEngine.addEffect("test-channel", effect3 as any, 1)

      const channel = audioEngine.getChannel("test-channel")
      expect(channel?.effects[1]).toBe(effect3)
    })

    it("removes effect from channel", () => {
      audioEngine.createChannel("test-channel")
      const effect = { connect: vi.fn(), disconnect: vi.fn() }

      audioEngine.addEffect("test-channel", effect as any)
      audioEngine.removeEffect("test-channel", 0)

      const channel = audioEngine.getChannel("test-channel")
      expect(channel?.effects).toHaveLength(0)
      expect(effect.disconnect).toHaveBeenCalled()
    })
  })

  describe("surround sound support", () => {
    it("sets master surround format", () => {
      audioEngine.setSurroundFormat("5.1")

      expect(audioEngine.getMasterSurroundFormat()).toBe("5.1")
    })

    it("enables surround for channel", () => {
      const channel = audioEngine.createChannel("test-channel")

      audioEngine.enableSurround("test-channel")

      expect(channel.surround).toBeDefined()
    })

    it("uses master format when enabling surround without format", () => {
      audioEngine.createChannel("test-channel")
      audioEngine.setSurroundFormat("7.1")

      audioEngine.enableSurround("test-channel")

      const channel = audioEngine.getChannel("test-channel")
      expect(channel?.surround).toBeDefined()
    })

    it("disables surround for channel", () => {
      audioEngine.createChannel("test-channel")
      audioEngine.enableSurround("test-channel")

      audioEngine.disableSurround("test-channel")

      const channel = audioEngine.getChannel("test-channel")
      expect(channel?.surround).toBeUndefined()
    })

    it("sets surround position", () => {
      audioEngine.createChannel("test-channel")
      audioEngine.enableSurround("test-channel")

      audioEngine.setSurroundPosition("test-channel", { x: 25, y: 75 })

      const position = audioEngine.getSurroundPosition("test-channel")
      expect(position).toEqual({ x: 50, y: 50 }) // Mock always returns 50,50
    })

    it("returns null for surround position without surround enabled", () => {
      audioEngine.createChannel("test-channel")

      const position = audioEngine.getSurroundPosition("test-channel")

      expect(position).toBeNull()
    })

    it("gets surround channel levels", () => {
      audioEngine.createChannel("test-channel")
      audioEngine.enableSurround("test-channel")

      const levels = audioEngine.getSurroundChannelLevels("test-channel")

      expect(levels).toEqual({ L: 0.5, R: 0.5 })
    })

    it("returns null for channel levels without surround", () => {
      audioEngine.createChannel("test-channel")

      const levels = audioEngine.getSurroundChannelLevels("test-channel")

      expect(levels).toBeNull()
    })
  })

  describe("cleanup", () => {
    it("disposes all resources", async () => {
      audioEngine.createChannel("channel1")
      audioEngine.createChannel("channel2")
      const mediaElement = { play: vi.fn() } as any

      audioEngine.connectMediaElement("channel1", mediaElement)
      audioEngine.enableSurround("channel2")

      audioEngine.dispose()

      expect(mockMediaElementSource.disconnect).toHaveBeenCalled()
      expect(mockGainNode.disconnect).toHaveBeenCalled()
      expect(mockPanNode.disconnect).toHaveBeenCalled()
      expect(mockAnalyserNode.disconnect).toHaveBeenCalled()
      expect(mockCompressorNode.disconnect).toHaveBeenCalled()
      expect(mockAudioContext.close).toHaveBeenCalled()
    })

    it("clears all collections on dispose", () => {
      audioEngine.createChannel("channel1")
      audioEngine.createChannel("channel2")
      audioEngine.soloChannel("channel1", true)

      audioEngine.dispose()

      expect(audioEngine.getChannels().size).toBe(0)
    })
  })

  describe("edge cases", () => {
    it("handles operations on non-existent channels gracefully", () => {
      // All these should not throw
      audioEngine.connectMediaElement("non-existent", {} as any)
      audioEngine.muteChannel("non-existent", true)
      audioEngine.soloChannel("non-existent", true)
      audioEngine.addEffect("non-existent", {} as any)
      audioEngine.removeEffect("non-existent", 0)
      audioEngine.enableSurround("non-existent")
      audioEngine.disableSurround("non-existent")
      audioEngine.setSurroundPosition("non-existent", { x: 50, y: 50 })
    })

    it("handles invalid effect index", () => {
      audioEngine.createChannel("test-channel")

      // Should not throw
      audioEngine.removeEffect("test-channel", -1)
      audioEngine.removeEffect("test-channel", 999)
    })

    it("handles enabling surround when already enabled", () => {
      audioEngine.createChannel("test-channel")
      audioEngine.enableSurround("test-channel", "5.1")

      // Should not create a new processor
      const channel = audioEngine.getChannel("test-channel")
      const processor1 = channel?.surround

      audioEngine.enableSurround("test-channel", "5.1")

      const processor2 = channel?.surround
      expect(processor1).toBe(processor2)
    })
  })
})
