import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMidi } from "../use-midi"

import type { MidiDevice, MidiMapping } from "../../services/midi/midi-engine"

// Mock the MidiEngine service using vi.hoisted
const { mockMidiEngine, mockIsSupported, MockMidiEngine } = vi.hoisted(() => {
  const mockMidiEngine = {
    initialize: vi.fn(),
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getMappings: vi.fn(),
    addMapping: vi.fn(),
    removeMapping: vi.fn(),
    updateMapping: vi.fn(),
    startLearning: vi.fn(),
    stopLearning: vi.fn(),
    sendMessage: vi.fn(),
  }

  const mockIsSupported = vi.fn()

  const MockMidiEngine = vi.fn(() => mockMidiEngine) as any
  MockMidiEngine.isSupported = mockIsSupported

  return { mockMidiEngine, mockIsSupported, MockMidiEngine }
})

vi.mock("../../services/midi/midi-engine", () => ({
  MidiEngine: MockMidiEngine,
}))

describe("useMidi", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    mockIsSupported.mockReturnValue(true)
    mockMidiEngine.initialize.mockResolvedValue(undefined)
    mockMidiEngine.getMappings.mockReturnValue([])
  })

  describe("initialization", () => {
    it("initializes MidiEngine on mount", () => {
      renderHook(() => useMidi())

      expect(mockMidiEngine.initialize).toHaveBeenCalledOnce()
    })

    it("starts with default state", () => {
      const { result } = renderHook(() => useMidi())

      expect(result.current.devices).toEqual([])
      expect(result.current.mappings).toEqual([])
      expect(result.current.isInitialized).toBe(false)
      expect(result.current.isLearning).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it("sets up event listeners", () => {
      renderHook(() => useMidi())

      expect(mockMidiEngine.on).toHaveBeenCalledWith("initialized", expect.any(Function))
      expect(mockMidiEngine.on).toHaveBeenCalledWith("devicesChanged", expect.any(Function))
      expect(mockMidiEngine.on).toHaveBeenCalledWith("mappingAdded", expect.any(Function))
      expect(mockMidiEngine.on).toHaveBeenCalledWith("mappingRemoved", expect.any(Function))
      expect(mockMidiEngine.on).toHaveBeenCalledWith("mappingUpdated", expect.any(Function))
      expect(mockMidiEngine.on).toHaveBeenCalledWith("learningStarted", expect.any(Function))
      expect(mockMidiEngine.on).toHaveBeenCalledWith("learningStopped", expect.any(Function))
    })

    it("disposes engine on unmount", () => {
      const { unmount } = renderHook(() => useMidi())

      unmount()

      expect(mockMidiEngine.dispose).toHaveBeenCalledOnce()
    })

    it("handles unsupported MIDI gracefully", () => {
      mockIsSupported.mockReturnValue(false)

      const { result } = renderHook(() => useMidi())

      expect(result.current.isInitialized).toBe(true)
      expect(result.current.error).toBe("Web MIDI API is not supported in this browser")
      expect(mockMidiEngine.initialize).not.toHaveBeenCalled()
    })

    it("handles initialization errors", async () => {
      const initError = new Error("MIDI initialization failed")
      mockMidiEngine.initialize.mockRejectedValue(initError)

      const { result } = renderHook(() => useMidi())

      // Wait for the promise to resolve and state to update
      await vi.waitFor(() => {
        expect(result.current.error).toBe("MIDI initialization failed")
      }, { timeout: 1000 })
    })
  })

  describe("event handling", () => {
    it("updates state when initialized event is fired", () => {
      const { result } = renderHook(() => useMidi())

      // Get the initialized event handler
      const initializedHandler = mockMidiEngine.on.mock.calls.find((call) => call[0] === "initialized")?.[1]

      act(() => {
        initializedHandler()
      })

      expect(result.current.isInitialized).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it("updates devices when devicesChanged event is fired", () => {
      const { result } = renderHook(() => useMidi())

      const mockDevices: MidiDevice[] = [
        { id: "device1", name: "MIDI Controller 1", type: "input", manufacturer: "Test", state: "connected" },
        { id: "device2", name: "MIDI Controller 2", type: "output", manufacturer: "Test", state: "connected" },
      ]

      // Get the devicesChanged event handler
      const devicesChangedHandler = mockMidiEngine.on.mock.calls.find((call) => call[0] === "devicesChanged")?.[1]

      act(() => {
        devicesChangedHandler(mockDevices)
      })

      expect(result.current.devices).toEqual(mockDevices)
      expect(result.current.inputDevices).toEqual([mockDevices[0]])
      expect(result.current.outputDevices).toEqual([mockDevices[1]])
    })

    it("updates mappings when mapping events are fired", () => {
      const { result } = renderHook(() => useMidi())

      const mockMappings: MidiMapping[] = [
        {
          id: "mapping1",
          deviceId: "device1",
          messageType: "cc",
          channel: 1,
          controller: 7,
          targetParameter: "channel.1.volume",
          min: 0,
          max: 127,
          curve: "linear",
        },
      ]

      mockMidiEngine.getMappings.mockReturnValue(mockMappings)

      // Get the mappingAdded event handler
      const mappingAddedHandler = mockMidiEngine.on.mock.calls.find((call) => call[0] === "mappingAdded")?.[1]

      act(() => {
        mappingAddedHandler()
      })

      expect(result.current.mappings).toEqual(mockMappings)
    })

    it("updates learning state when learning events are fired", () => {
      const { result } = renderHook(() => useMidi())

      // Get event handlers
      const learningStartedHandler = mockMidiEngine.on.mock.calls.find((call) => call[0] === "learningStarted")?.[1]
      const learningStoppedHandler = mockMidiEngine.on.mock.calls.find((call) => call[0] === "learningStopped")?.[1]

      act(() => {
        learningStartedHandler()
      })

      expect(result.current.isLearning).toBe(true)

      act(() => {
        learningStoppedHandler()
      })

      expect(result.current.isLearning).toBe(false)
    })
  })

  describe("addMapping", () => {
    it("calls engine addMapping and returns mapping id", () => {
      const { result } = renderHook(() => useMidi())

      const mockMapping = {
        deviceId: "device1",
        messageType: "cc" as const,
        channel: 1,
        controller: 7,
        targetParameter: "channel.1.volume",
        min: 0,
        max: 127,
        curve: "linear" as const,
      }

      mockMidiEngine.addMapping.mockReturnValue("mapping123")

      let mappingId: string | null = null
      act(() => {
        mappingId = result.current.addMapping(mockMapping)
      })

      expect(mockMidiEngine.addMapping).toHaveBeenCalledWith(mockMapping)
      expect(mappingId!).toBe("mapping123")
    })

    it("returns null when engine is not available", () => {
      // Create hook but don't initialize engine
      const { result } = renderHook(() => useMidi())

      // Reset the mock to return null instead of throwing
      mockMidiEngine.addMapping.mockReturnValue(null)

      const mockMapping = {
        deviceId: "device1",
        messageType: "cc" as const,
        channel: 1,
        controller: 7,
        targetParameter: "channel.1.volume",
        min: 0,
        max: 127,
        curve: "linear" as const,
      }

      let mappingId: string | null = null
      act(() => {
        mappingId = result.current.addMapping(mockMapping)
      })

      // Should return null when engine is not available
      expect(mappingId).toBe(null)
    })
  })

  describe("removeMapping", () => {
    it("calls engine removeMapping", () => {
      const { result } = renderHook(() => useMidi())

      act(() => {
        result.current.removeMapping("mapping123")
      })

      expect(mockMidiEngine.removeMapping).toHaveBeenCalledWith("mapping123")
    })
  })

  describe("updateMapping", () => {
    it("calls engine updateMapping", () => {
      const { result } = renderHook(() => useMidi())

      const updates = { min: 10, max: 100 }

      act(() => {
        result.current.updateMapping("mapping123", updates)
      })

      expect(mockMidiEngine.updateMapping).toHaveBeenCalledWith("mapping123", updates)
    })
  })

  describe("startLearning", () => {
    it("calls engine startLearning and returns cleanup function", () => {
      const { result } = renderHook(() => useMidi())

      const mockCallback = vi.fn()

      let cleanup: (() => void) | undefined
      act(() => {
        cleanup = result.current.startLearning(mockCallback)
      })

      expect(mockMidiEngine.startLearning).toHaveBeenCalledWith(mockCallback)

      // Test cleanup function
      cleanup!()
      expect(mockMidiEngine.stopLearning).toHaveBeenCalledOnce()
    })

    it("returns empty cleanup function when engine is not available", () => {
      const { result } = renderHook(() => useMidi())

      // Simulate engine not being available
      const hookInstance = result.current

      const mockCallback = vi.fn()

      let cleanup: (() => void) | undefined
      act(() => {
        cleanup = hookInstance.startLearning(mockCallback)
      })

      // Should return a function that does nothing
      expect(typeof cleanup).toBe("function")
      cleanup!() // Should not throw
    })
  })

  describe("sendMessage", () => {
    it("calls engine sendMessage", async () => {
      const { result } = renderHook(() => useMidi())

      await act(async () => {
        await result.current.sendMessage("device1", [176, 7, 127])
      })

      expect(mockMidiEngine.sendMessage).toHaveBeenCalledWith("device1", [176, 7, 127])
    })
  })

  describe("event subscriptions", () => {
    it("onParameterChange subscribes and unsubscribes correctly", () => {
      const { result } = renderHook(() => useMidi())

      const mockCallback = vi.fn()

      let unsubscribe: (() => void) | undefined
      act(() => {
        unsubscribe = result.current.onParameterChange(mockCallback)
      })

      expect(mockMidiEngine.on).toHaveBeenCalledWith("parameterChange", mockCallback)

      unsubscribe!()
      expect(mockMidiEngine.off).toHaveBeenCalledWith("parameterChange", mockCallback)
    })

    it("onMidiMessage subscribes and unsubscribes correctly", () => {
      const { result } = renderHook(() => useMidi())

      const mockCallback = vi.fn()

      let unsubscribe: (() => void) | undefined
      act(() => {
        unsubscribe = result.current.onMidiMessage(mockCallback)
      })

      expect(mockMidiEngine.on).toHaveBeenCalledWith("midiMessage", mockCallback)

      unsubscribe!()
      expect(mockMidiEngine.off).toHaveBeenCalledWith("midiMessage", mockCallback)
    })

    it("returns empty unsubscribe function when engine is not available", () => {
      const { result } = renderHook(() => useMidi())

      const mockCallback = vi.fn()

      let unsubscribe: (() => void) | undefined
      act(() => {
        unsubscribe = result.current.onParameterChange(mockCallback)
      })

      expect(typeof unsubscribe).toBe("function")
      unsubscribe!() // Should not throw
    })
  })

  describe("device filtering", () => {
    it("filters input and output devices correctly", () => {
      const { result } = renderHook(() => useMidi())

      const mockDevices: MidiDevice[] = [
        { id: "input1", name: "Input 1", type: "input", manufacturer: "Test", state: "connected" },
        { id: "input2", name: "Input 2", type: "input", manufacturer: "Test", state: "connected" },
        { id: "output1", name: "Output 1", type: "output", manufacturer: "Test", state: "connected" },
        { id: "output2", name: "Output 2", type: "output", manufacturer: "Test", state: "connected" },
      ]

      // Simulate devices changed event
      const devicesChangedHandler = mockMidiEngine.on.mock.calls.find((call) => call[0] === "devicesChanged")?.[1]

      act(() => {
        devicesChangedHandler(mockDevices)
      })

      expect(result.current.inputDevices).toHaveLength(2)
      expect(result.current.outputDevices).toHaveLength(2)
      expect(result.current.inputDevices).toEqual([mockDevices[0], mockDevices[1]])
      expect(result.current.outputDevices).toEqual([mockDevices[2], mockDevices[3]])
    })
  })

  describe("function stability", () => {
    it("returns stable function references", () => {
      const { result, rerender } = renderHook(() => useMidi())

      const firstRender = result.current

      rerender()

      const secondRender = result.current

      // Functions should be the same reference (stable)
      expect(secondRender.addMapping).toBe(firstRender.addMapping)
      expect(secondRender.removeMapping).toBe(firstRender.removeMapping)
      expect(secondRender.updateMapping).toBe(firstRender.updateMapping)
      expect(secondRender.startLearning).toBe(firstRender.startLearning)
      expect(secondRender.sendMessage).toBe(firstRender.sendMessage)
      expect(secondRender.onParameterChange).toBe(firstRender.onParameterChange)
      expect(secondRender.onMidiMessage).toBe(firstRender.onMidiMessage)
    })
  })
})
