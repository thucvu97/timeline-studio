import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MidiEngine, type MidiMapping, type MidiMessage } from "../midi-engine"

// Mock Web MIDI API
const mockMIDIInput = {
  id: "input-1",
  name: "Test Input",
  manufacturer: "Test Manufacturer",
  state: "connected",
  type: "input",
  onmidimessage: null,
}

const mockMIDIOutput = {
  id: "output-1",
  name: "Test Output",
  manufacturer: "Test Manufacturer",
  state: "connected",
  type: "output",
  send: vi.fn(),
}

const mockMIDIAccess = {
  inputs: new Map([["input-1", mockMIDIInput]]),
  outputs: new Map([["output-1", mockMIDIOutput]]),
  onstatechange: null,
}

// Mock navigator.requestMIDIAccess
Object.defineProperty(global.navigator, "requestMIDIAccess", {
  value: vi.fn(() => Promise.resolve(mockMIDIAccess)),
  writable: true,
})

describe("MidiEngine", () => {
  let midiEngine: MidiEngine

  beforeEach(() => {
    vi.clearAllMocks()
    midiEngine = new MidiEngine()
  })

  afterEach(() => {
    midiEngine.dispose()
  })

  describe("Static methods", () => {
    it("should check if MIDI is supported", () => {
      expect(MidiEngine.isSupported()).toBe(true)
    })

    it("should return false when MIDI is not supported", () => {
      // Mock navigator without requestMIDIAccess
      const mockNavigator = {} as Navigator

      // Temporarily replace navigator
      const originalNavigator = global.navigator
      global.navigator = mockNavigator

      expect(MidiEngine.isSupported()).toBe(false)

      // Restore navigator
      global.navigator = originalNavigator
    })
  })

  describe("Initialization", () => {
    it("should initialize successfully", async () => {
      const initPromise = new Promise((resolve) => {
        midiEngine.once("initialized", resolve)
      })

      await midiEngine.initialize()
      await initPromise

      expect(global.navigator.requestMIDIAccess).toHaveBeenCalledWith({ sysex: false })
    })

    it("should handle initialization without Web MIDI API", async () => {
      // Create a new engine for this test
      const testEngine = new MidiEngine()

      // Mock navigator without requestMIDIAccess
      const mockNavigator = {} as Navigator
      const originalNavigator = global.navigator
      global.navigator = mockNavigator

      const initPromise = new Promise((resolve) => {
        testEngine.once("initialized", resolve)
      })

      await testEngine.initialize()
      await initPromise

      // Restore navigator
      global.navigator = originalNavigator

      testEngine.dispose()
    })

    it("should not initialize twice", async () => {
      await midiEngine.initialize()
      await midiEngine.initialize()

      expect(global.navigator.requestMIDIAccess).toHaveBeenCalledTimes(1)
    })

    it("should handle initialization errors", async () => {
      vi.mocked(global.navigator.requestMIDIAccess).mockRejectedValueOnce(new Error("MIDI Error"))

      const initPromise = new Promise((resolve) => {
        midiEngine.once("initialized", resolve)
      })

      await midiEngine.initialize()
      await initPromise

      // Should still emit initialized even on error
      expect(initPromise).toBeDefined()
    })
  })

  describe("Device Management", () => {
    beforeEach(async () => {
      await midiEngine.initialize()
    })

    it("should get all devices", () => {
      const devices = midiEngine.getDevices()
      expect(devices).toHaveLength(2)
      expect(devices[0]).toMatchObject({
        id: "input-1",
        name: "Test Input",
        type: "input",
      })
    })

    it("should get input devices only", () => {
      const inputDevices = midiEngine.getInputDevices()
      expect(inputDevices).toHaveLength(1)
      expect(inputDevices[0].type).toBe("input")
    })

    it("should get output devices only", () => {
      const outputDevices = midiEngine.getOutputDevices()
      expect(outputDevices).toHaveLength(1)
      expect(outputDevices[0].type).toBe("output")
    })

    it("should handle device state changes", () => {
      const mockEvent = {
        port: {
          id: "new-device",
          name: "New Device",
          manufacturer: "Test",
          type: "input",
          state: "connected",
        },
      } as MIDIConnectionEvent

      const devicesChangedPromise = new Promise((resolve) => {
        midiEngine.once("devicesChanged", resolve)
      })

      // Simulate state change
      if (mockMIDIAccess.onstatechange) {
        mockMIDIAccess.onstatechange(mockEvent)
      }

      return devicesChangedPromise
    })
  })

  describe("MIDI Message Handling", () => {
    beforeEach(async () => {
      await midiEngine.initialize()
    })

    it("should parse Note On message", () => {
      const mockEvent = {
        data: new Uint8Array([0x90, 60, 127]), // Note On, Middle C, max velocity
        timeStamp: Date.now(),
      } as MIDIMessageEvent

      const messagePromise = new Promise<{ deviceId: string; message: MidiMessage }>((resolve) => {
        midiEngine.once("midiMessage", resolve)
      })

      // Simulate MIDI input
      if (mockMIDIInput.onmidimessage) {
        mockMIDIInput.onmidimessage(mockEvent)
      }

      return messagePromise.then(({ message }) => {
        expect(message.type).toBe("noteon")
        expect(message.channel).toBe(1)
        expect(message.data.note).toBe(60)
        expect(message.data.velocity).toBe(127)
      })
    })

    it("should parse Control Change message", () => {
      const mockEvent = {
        data: new Uint8Array([0xb0, 7, 100]), // CC, Volume, value 100
        timeStamp: Date.now(),
      } as MIDIMessageEvent

      const messagePromise = new Promise<{ deviceId: string; message: MidiMessage }>((resolve) => {
        midiEngine.once("midiMessage", resolve)
      })

      if (mockMIDIInput.onmidimessage) {
        mockMIDIInput.onmidimessage(mockEvent)
      }

      return messagePromise.then(({ message }) => {
        expect(message.type).toBe("cc")
        expect(message.channel).toBe(1)
        expect(message.data.controller).toBe(7)
        expect(message.data.value).toBe(100)
      })
    })

    it("should handle invalid MIDI messages", () => {
      const mockEvent = {
        data: new Uint8Array([]), // Empty data
        timeStamp: Date.now(),
      } as MIDIMessageEvent

      const messageHandler = vi.fn()
      midiEngine.on("midiMessage", messageHandler)

      if (mockMIDIInput.onmidimessage) {
        mockMIDIInput.onmidimessage(mockEvent)
      }

      expect(messageHandler).not.toHaveBeenCalled()
    })
  })

  describe("MIDI Mapping", () => {
    beforeEach(async () => {
      await midiEngine.initialize()
    })

    it("should add MIDI mapping", () => {
      const mapping = {
        deviceId: "input-1",
        messageType: "cc" as const,
        controller: 7,
        targetParameter: "channel.1.volume",
        min: 0,
        max: 1,
        curve: "linear" as const,
      }

      const mappingId = midiEngine.addMapping(mapping)
      expect(mappingId).toMatch(/^mapping_/)

      const mappings = midiEngine.getMappings()
      expect(mappings).toHaveLength(1)
      expect(mappings[0]).toMatchObject(mapping)
    })

    it("should remove MIDI mapping", () => {
      const mappingId = midiEngine.addMapping({
        deviceId: "input-1",
        messageType: "cc",
        targetParameter: "channel.1.volume",
        min: 0,
        max: 1,
        curve: "linear",
      })

      midiEngine.removeMapping(mappingId)
      expect(midiEngine.getMappings()).toHaveLength(0)
    })

    it("should update MIDI mapping", () => {
      const mappingId = midiEngine.addMapping({
        deviceId: "input-1",
        messageType: "cc",
        targetParameter: "channel.1.volume",
        min: 0,
        max: 1,
        curve: "linear",
      })

      midiEngine.updateMapping(mappingId, { max: 2 })

      const mapping = midiEngine.getMappings()[0]
      expect(mapping.max).toBe(2)
    })

    it("should process MIDI mapping", () => {
      const mappingId = midiEngine.addMapping({
        deviceId: "input-1",
        messageType: "cc",
        controller: 7,
        targetParameter: "channel.1.volume",
        min: 0,
        max: 1,
        curve: "linear",
      })

      const parameterChangePromise = new Promise((resolve) => {
        midiEngine.once("parameterChange", resolve)
      })

      // Simulate CC message that matches mapping
      const mockEvent = {
        data: new Uint8Array([0xb0, 7, 127]), // CC, controller 7, max value
        timeStamp: Date.now(),
      } as MIDIMessageEvent

      if (mockMIDIInput.onmidimessage) {
        mockMIDIInput.onmidimessage(mockEvent)
      }

      return parameterChangePromise.then((event: any) => {
        expect(event.parameter).toBe("channel.1.volume")
        expect(event.value).toBe(1) // Max value scaled to 1
        expect(event.mapping).toBe(mappingId)
      })
    })
  })

  describe("MIDI Learn", () => {
    beforeEach(async () => {
      await midiEngine.initialize()
    })

    it("should start and stop learning mode", () => {
      const callback = vi.fn()

      midiEngine.startLearning(callback)

      // Simulate MIDI message during learning
      const mockEvent = {
        data: new Uint8Array([0x90, 60, 127]),
        timeStamp: Date.now(),
      } as MIDIMessageEvent

      if (mockMIDIInput.onmidimessage) {
        mockMIDIInput.onmidimessage(mockEvent)
      }

      expect(callback).toHaveBeenCalled()

      midiEngine.stopLearning()
    })
  })

  describe("MIDI Output", () => {
    beforeEach(async () => {
      await midiEngine.initialize()
    })

    it("should send MIDI message to device", async () => {
      const message = [0x90, 60, 127] // Note On

      await midiEngine.sendMessage("output-1", message)

      expect(mockMIDIOutput.send).toHaveBeenCalledWith(message)
    })

    it("should handle invalid output device", async () => {
      const message = [0x90, 60, 127]

      await midiEngine.sendMessage("invalid-device", message)

      expect(mockMIDIOutput.send).not.toHaveBeenCalled()
    })

    it("should handle sending when MIDI not initialized", async () => {
      const engine = new MidiEngine()
      const message = [0x90, 60, 127]

      await engine.sendMessage("output-1", message)

      // Should not throw, just log warning
      expect(mockMIDIOutput.send).not.toHaveBeenCalled()
    })
  })

  describe("Component Integration", () => {
    it("should have clock and sequencer components", () => {
      expect(midiEngine.clock).toBeDefined()
      expect(midiEngine.sequencer).toBeDefined()
    })

    it("should handle clock MIDI out", () => {
      const message = [0xf8] // MIDI Clock

      midiEngine.clock.emit("midiOut", { message })

      // Should not throw
    })

    it("should handle sequencer MIDI out", () => {
      const message = [0x90, 60, 127]

      midiEngine.sequencer.emit("midiOut", { deviceId: "output-1", message })

      // Should not throw
    })
  })

  describe("MIDI File Handling", () => {
    beforeEach(async () => {
      await midiEngine.initialize()
    })

    it("should handle MIDI file import errors", async () => {
      const buffer = new ArrayBuffer(100) // Invalid MIDI file data

      // Should handle errors gracefully
      await expect(midiEngine.importMidiFile(buffer)).rejects.toThrow()
    })

    it("should export MIDI file", () => {
      const buffer = midiEngine.exportMidiFile()
      expect(buffer instanceof ArrayBuffer).toBe(true)
    })
  })

  describe("Cleanup", () => {
    it("should dispose properly", async () => {
      await midiEngine.initialize()

      midiEngine.dispose()

      expect(midiEngine.getDevices()).toHaveLength(0)
      expect(midiEngine.getMappings()).toHaveLength(0)
    })
  })

  describe("Message Type Conversion", () => {
    beforeEach(async () => {
      await midiEngine.initialize()
    })

    it("should handle different curve types", async () => {
      const mapping: MidiMapping = {
        id: "test",
        deviceId: "input-1",
        messageType: "cc",
        controller: 7,
        targetParameter: "test.param",
        min: 0,
        max: 100,
        curve: "exponential",
      }

      midiEngine.addMapping(mapping)

      const parameterChangePromise = new Promise((resolve) => {
        midiEngine.once("parameterChange", resolve)
      })

      const mockEvent = {
        data: new Uint8Array([0xb0, 7, 64]), // CC, controller 7, half value
        timeStamp: Date.now(),
      } as MIDIMessageEvent

      if (mockMIDIInput.onmidimessage) {
        mockMIDIInput.onmidimessage(mockEvent)
      }

      const event: any = await parameterChangePromise
      expect(event.parameter).toBe("test.param")
      // Exponential curve should give different result than linear
      expect(event.value).toBeLessThan(50)
    }, 5000)

    it("should handle pitch bend messages", async () => {
      const mockEvent = {
        data: new Uint8Array([0xe0, 0x00, 0x40]), // Pitch bend, center position
        timeStamp: Date.now(),
      } as MIDIMessageEvent

      const messagePromise = new Promise<{ deviceId: string; message: MidiMessage }>((resolve) => {
        midiEngine.once("midiMessage", resolve)
      })

      if (mockMIDIInput.onmidimessage) {
        mockMIDIInput.onmidimessage(mockEvent)
      }

      const { message } = await messagePromise
      expect(message.type).toBe("pitchbend")
      expect(message.data.value).toBe(8192) // Center position
    }, 5000)
  })
})
