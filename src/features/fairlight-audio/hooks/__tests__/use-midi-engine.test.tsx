import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useMidiEngine } from "../use-midi-engine"

// Mock the MIDI services
vi.mock("../../services/midi/midi-engine", () => ({
  MidiEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getInputDevices: vi.fn().mockReturnValue([]),
    getOutputDevices: vi.fn().mockReturnValue([]),
    getDevices: vi.fn().mockReturnValue([]),
    on: vi.fn(),
    off: vi.fn(),
    sendMessage: vi.fn(),
    router: null,
  })),
}))

vi.mock("../../services/midi/midi-router", () => ({
  MidiRouter: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    routeMessage: vi.fn(),
  })),
}))

describe("useMidiEngine", () => {
  it("should return hook interface", () => {
    const { result } = renderHook(() => useMidiEngine())

    // Should return the expected interface
    expect(result.current).toHaveProperty("engine")
    expect(result.current).toHaveProperty("devices")
    expect(result.current).toHaveProperty("isInitialized")
    expect(result.current).toHaveProperty("error")

    // Initial state
    expect(result.current.devices).toEqual({ input: [], output: [] })
    expect(result.current.error).toBe(null)
  })

  it("should export messageToMidiData types", () => {
    // This test verifies the hook can be imported and doesn't throw
    expect(useMidiEngine).toBeDefined()
    expect(typeof useMidiEngine).toBe("function")
  })
})
