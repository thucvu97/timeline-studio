import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { type ClockSync, MidiClock } from "../midi-clock"

// Mock performance.now
const mockPerformanceNow = vi.fn(() => Date.now())
Object.defineProperty(global, "performance", {
  value: {
    now: mockPerformanceNow,
  },
})

describe("MidiClock", () => {
  let midiClock: MidiClock

  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformanceNow.mockReturnValue(1000) // Start at 1000ms
    midiClock = new MidiClock()
  })

  afterEach(() => {
    midiClock.dispose()
    vi.clearAllTimers()
  })

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const state = midiClock.getState()

      expect(state.isRunning).toBe(false)
      expect(state.bpm).toBe(120)
      expect(state.position).toBe(0)
      expect(state.ppqn).toBe(24)
    })

    it("should initialize with internal sync mode", () => {
      const syncMode = midiClock.getSyncMode()

      expect(syncMode.type).toBe("internal")
      expect(syncMode.source).toBeUndefined()
    })
  })

  describe("Transport Control", () => {
    it("should start transport", () => {
      const startHandler = vi.fn()
      const midiOutHandler = vi.fn()

      midiClock.on("start", startHandler)
      midiClock.on("midiOut", midiOutHandler)

      midiClock.start()

      expect(midiClock.isRunning()).toBe(true)
      expect(midiClock.getPosition()).toBe(0)
      expect(startHandler).toHaveBeenCalled()
      expect(midiOutHandler).toHaveBeenCalledWith({
        message: [0xfa], // MIDI Start
        timestamp: 1000,
      })
    })

    it("should not start if already running", () => {
      const startHandler = vi.fn()
      midiClock.on("start", startHandler)

      midiClock.start()
      midiClock.start() // Second call should be ignored

      expect(startHandler).toHaveBeenCalledTimes(1)
    })

    it("should continue transport", () => {
      const continueHandler = vi.fn()
      const midiOutHandler = vi.fn()

      midiClock.on("continue", continueHandler)
      midiClock.on("midiOut", midiOutHandler)

      // Set some position first
      midiClock.setPosition(2.5)
      midiClock.continue()

      expect(midiClock.isRunning()).toBe(true)
      expect(midiClock.getPosition()).toBe(2.5) // Position should be preserved
      expect(continueHandler).toHaveBeenCalled()
      expect(midiOutHandler).toHaveBeenCalledWith({
        message: [0xfb], // MIDI Continue
        timestamp: 1000,
      })
    })

    it("should not continue if already running", () => {
      const continueHandler = vi.fn()
      midiClock.on("continue", continueHandler)

      midiClock.start()
      midiClock.continue() // Should be ignored

      expect(continueHandler).not.toHaveBeenCalled()
    })

    it("should stop transport", () => {
      const stopHandler = vi.fn()
      const midiOutHandler = vi.fn()

      midiClock.on("stop", stopHandler)
      midiClock.on("midiOut", midiOutHandler)

      midiClock.start()
      midiClock.stop()

      expect(midiClock.isRunning()).toBe(false)
      expect(stopHandler).toHaveBeenCalled()
      expect(midiOutHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: [0xfc], // MIDI Stop
        }),
      )
    })

    it("should not stop if not running", () => {
      const stopHandler = vi.fn()
      midiClock.on("stop", stopHandler)

      midiClock.stop() // Should be ignored

      expect(stopHandler).not.toHaveBeenCalled()
    })
  })

  describe("BPM Management", () => {
    it("should set BPM", () => {
      const bpmChangeHandler = vi.fn()
      midiClock.on("bpmChange", bpmChangeHandler)

      midiClock.setBPM(140)

      expect(midiClock.getBPM()).toBe(140)
      expect(bpmChangeHandler).toHaveBeenCalledWith(140)
    })

    it("should clamp BPM to valid range", () => {
      midiClock.setBPM(10) // Too low
      expect(midiClock.getBPM()).toBe(20)

      midiClock.setBPM(1500) // Too high
      expect(midiClock.getBPM()).toBe(999)
    })

    it("should not allow BPM changes in external sync mode", () => {
      midiClock.setSyncMode({ type: "external", source: "test-device" })

      const bpmChangeHandler = vi.fn()
      midiClock.on("bpmChange", bpmChangeHandler)

      midiClock.setBPM(140)

      expect(midiClock.getBPM()).toBe(120) // Should remain unchanged
      expect(bpmChangeHandler).not.toHaveBeenCalled()
    })
  })

  describe("Position Management", () => {
    it("should set position", () => {
      const positionChangeHandler = vi.fn()
      const midiOutHandler = vi.fn()

      midiClock.on("positionChange", positionChangeHandler)
      midiClock.on("midiOut", midiOutHandler)

      midiClock.setPosition(4.5)

      expect(midiClock.getPosition()).toBe(4.5)
      expect(positionChangeHandler).toHaveBeenCalledWith(4.5)

      // Should send Song Position Pointer
      const sixteenths = Math.floor(4.5 * 16) // 72
      expect(midiOutHandler).toHaveBeenCalledWith({
        message: [0xf2, 72 & 0x7f, (72 >> 7) & 0x7f],
        timestamp: 1000,
      })
    })

    it("should not allow negative positions", () => {
      midiClock.setPosition(-2)
      expect(midiClock.getPosition()).toBe(0)
    })
  })

  describe("Sync Mode Management", () => {
    it("should set internal sync mode", () => {
      const syncModeChangeHandler = vi.fn()
      midiClock.on("syncModeChange", syncModeChangeHandler)

      const newSync: ClockSync = { type: "internal" }
      midiClock.setSyncMode(newSync)

      expect(midiClock.getSyncMode()).toEqual(newSync)
      expect(syncModeChangeHandler).toHaveBeenCalledWith("internal")
    })

    it("should set external sync mode", () => {
      const syncModeChangeHandler = vi.fn()
      midiClock.on("syncModeChange", syncModeChangeHandler)

      const newSync: ClockSync = { type: "external", source: "test-device" }
      midiClock.setSyncMode(newSync)

      expect(midiClock.getSyncMode()).toEqual(newSync)
      expect(syncModeChangeHandler).toHaveBeenCalledWith("external", "test-device")
    })

    it("should stop when changing sync mode", () => {
      const stopHandler = vi.fn()

      midiClock.on("stop", stopHandler)

      midiClock.start()
      expect(midiClock.isRunning()).toBe(true)

      // Change to external sync (should stop)
      midiClock.setSyncMode({ type: "external", source: "test" })
      expect(stopHandler).toHaveBeenCalled()
      expect(midiClock.isRunning()).toBe(false)
    })
  })

  describe("MIDI Message Handling", () => {
    it("should handle MIDI clock ticks in external mode", () => {
      midiClock.setSyncMode({ type: "external", source: "test" })

      const tickHandler = vi.fn()
      midiClock.on("tick", tickHandler)

      midiClock.handleMidiMessage([0xf8]) // MIDI Clock

      expect(tickHandler).toHaveBeenCalled()
    })

    it("should ignore MIDI clock ticks in internal mode", () => {
      const tickHandler = vi.fn()
      midiClock.on("tick", tickHandler)

      midiClock.handleMidiMessage([0xf8]) // MIDI Clock

      expect(tickHandler).not.toHaveBeenCalled()
    })

    it("should handle MIDI Start in external mode", () => {
      midiClock.setSyncMode({ type: "external", source: "test" })

      const startHandler = vi.fn()
      midiClock.on("start", startHandler)

      midiClock.handleMidiMessage([0xfa]) // MIDI Start

      expect(midiClock.isRunning()).toBe(true)
      expect(midiClock.getPosition()).toBe(0)
      expect(startHandler).toHaveBeenCalled()
    })

    it("should handle MIDI Continue in external mode", () => {
      midiClock.setSyncMode({ type: "external", source: "test" })
      midiClock.setPosition(2.5)

      const continueHandler = vi.fn()
      midiClock.on("continue", continueHandler)

      midiClock.handleMidiMessage([0xfb]) // MIDI Continue

      expect(midiClock.isRunning()).toBe(true)
      expect(midiClock.getPosition()).toBe(2.5) // Position preserved
      expect(continueHandler).toHaveBeenCalled()
    })

    it("should handle MIDI Stop in external mode", () => {
      midiClock.setSyncMode({ type: "external", source: "test" })
      midiClock.handleMidiMessage([0xfa]) // Start first

      const stopHandler = vi.fn()
      midiClock.on("stop", stopHandler)

      midiClock.handleMidiMessage([0xfc]) // MIDI Stop

      expect(midiClock.isRunning()).toBe(false)
      expect(stopHandler).toHaveBeenCalled()
    })

    it("should handle Song Position Pointer", () => {
      const positionChangeHandler = vi.fn()
      midiClock.on("positionChange", positionChangeHandler)

      // Song Position Pointer: 32 sixteenths = 2 beats
      midiClock.handleMidiMessage([0xf2, 32, 0])

      expect(midiClock.getPosition()).toBe(2)
      expect(positionChangeHandler).toHaveBeenCalledWith(2)
    })

    it("should ignore invalid MIDI messages", () => {
      const tickHandler = vi.fn()
      midiClock.on("tick", tickHandler)

      midiClock.handleMidiMessage([]) // Empty message
      midiClock.handleMidiMessage([0x90, 60, 127]) // Note On (not real-time)

      expect(tickHandler).not.toHaveBeenCalled()
    })

    it("should ignore external sync messages in internal mode", () => {
      const startHandler = vi.fn()
      const stopHandler = vi.fn()

      midiClock.on("start", startHandler)
      midiClock.on("stop", stopHandler)

      midiClock.handleMidiMessage([0xfa]) // MIDI Start
      midiClock.handleMidiMessage([0xfc]) // MIDI Stop

      expect(startHandler).not.toHaveBeenCalled()
      expect(stopHandler).not.toHaveBeenCalled()
      expect(midiClock.isRunning()).toBe(false)
    })
  })

  describe("Time Conversion", () => {
    it("should convert beats to milliseconds", () => {
      midiClock.setBPM(120) // 1 beat = 500ms

      expect(midiClock.beatsToMs(1)).toBe(500)
      expect(midiClock.beatsToMs(2)).toBe(1000)
      expect(midiClock.beatsToMs(0.5)).toBe(250)
    })

    it("should convert milliseconds to beats", () => {
      midiClock.setBPM(120) // 1 beat = 500ms

      expect(midiClock.msToBeats(500)).toBe(1)
      expect(midiClock.msToBeats(1000)).toBe(2)
      expect(midiClock.msToBeats(250)).toBe(0.5)
    })

    it("should handle different BPM values in conversion", () => {
      midiClock.setBPM(60) // 1 beat = 1000ms

      expect(midiClock.beatsToMs(1)).toBe(1000)
      expect(midiClock.msToBeats(1000)).toBe(1)

      midiClock.setBPM(240) // 1 beat = 250ms

      expect(midiClock.beatsToMs(1)).toBe(250)
      expect(midiClock.msToBeats(250)).toBe(1)
    })
  })

  describe("Internal Clock", () => {
    it("should start internal clock when started", () => {
      const midiOutHandler = vi.fn()
      midiClock.on("midiOut", midiOutHandler)

      midiClock.start()

      // Should send start message
      expect(midiOutHandler).toHaveBeenCalledWith({
        message: [0xfa], // MIDI Start
        timestamp: 1000,
      })

      expect(midiClock.isRunning()).toBe(true)
    })

    it("should stop internal clock when stopped", () => {
      const midiOutHandler = vi.fn()
      midiClock.on("midiOut", midiOutHandler)

      midiClock.start()
      midiOutHandler.mockClear()

      midiClock.stop()

      // Should send stop message
      expect(midiOutHandler).toHaveBeenCalledWith({
        message: [0xfc], // MIDI Stop
        timestamp: 1000,
      })

      expect(midiClock.isRunning()).toBe(false)
    })
  })

  describe("External Clock Tempo Tracking", () => {
    beforeEach(() => {
      midiClock.setSyncMode({ type: "external", source: "test" })
    })

    it("should calculate BPM from external clock", () => {
      const bpmChangeHandler = vi.fn()
      midiClock.on("bpmChange", bpmChangeHandler)

      let time = 1000
      mockPerformanceNow.mockImplementation(() => time)

      // Send 24 clock ticks (1 beat) over 500ms = 120 BPM
      for (let i = 0; i < 24; i++) {
        midiClock.handleMidiMessage([0xf8])
        time += 500 / 23 // Spread ticks evenly
        mockPerformanceNow.mockReturnValue(time)
      }

      expect(bpmChangeHandler).toHaveBeenCalled()
      // BPM should be close to 120 (with smoothing)
      const lastCall = bpmChangeHandler.mock.calls[bpmChangeHandler.mock.calls.length - 1]
      expect(lastCall[0]).toBeCloseTo(120, 0)
    })
  })

  describe("Cleanup", () => {
    it("should dispose properly", () => {
      midiClock.start()
      expect(midiClock.isRunning()).toBe(true)

      midiClock.dispose()

      expect(midiClock.isRunning()).toBe(false)
      expect(midiClock.listenerCount("tick")).toBe(0)
    })
  })
})
