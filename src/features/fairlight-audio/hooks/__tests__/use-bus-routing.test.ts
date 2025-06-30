import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useBusRouting } from "../use-bus-routing"

// Mock dependencies using vi.hoisted
const { mockUseAudioEngine, mockAudioEngine, mockBusRouter } = vi.hoisted(() => ({
  mockUseAudioEngine: vi.fn(),
  mockAudioEngine: {
    audioContext: {
      createGain: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        gain: { value: 1 },
      })),
    },
  },
  mockBusRouter: {
    onRoutingChange: vi.fn(() => "callback-id"),
    removeRoutingCallback: vi.fn(),
    getRoutingMatrix: vi.fn(() => ({
      buses: new Map([
        ["bus1", { id: "bus1", name: "Main", type: "stereo" }],
        ["bus2", { id: "bus2", name: "Aux 1", type: "mono" }],
      ]),
      groups: new Map([["group1", { id: "group1", name: "Drums", channelIds: ["ch1", "ch2"], color: "#ff0000" }]]),
      sends: new Map([
        [
          "send1",
          { id: "send1", sourceChannelId: "ch1", destinationBusId: "bus2", level: 0.5, isPre: false, isEnabled: true },
        ],
      ]),
      channelBusAssignments: new Map([
        ["ch1", "bus1"],
        ["ch2", "bus1"],
      ]),
    })),
    createBus: vi.fn(),
    createGroup: vi.fn(),
    createSend: vi.fn(),
    assignChannelToBus: vi.fn(),
    updateSendLevel: vi.fn(),
    setBusMute: vi.fn(),
    setBusSolo: vi.fn(),
    setGroupMute: vi.fn(),
    setGroupSolo: vi.fn(),
    setGroupGain: vi.fn(),
    addChannelToGroup: vi.fn(),
    removeChannelFromGroup: vi.fn(),
    deleteBus: vi.fn(),
    deleteGroup: vi.fn(),
    connectChannel: vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn(), gain: { value: 1 } })),
    exportConfiguration: vi.fn(() => ({ version: "1.0", buses: [], groups: [], sends: [] })),
    importConfiguration: vi.fn(),
  },
}))

vi.mock("../use-audio-engine", () => ({
  useAudioEngine: mockUseAudioEngine,
}))

vi.mock("../../services/bus-router", () => ({
  BusRouter: vi.fn(() => mockBusRouter),
}))

describe("useBusRouting", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock returns
    mockUseAudioEngine.mockReturnValue({
      engine: mockAudioEngine,
    })
  })

  describe("initialization", () => {
    it("initializes BusRouter when audio engine is available", () => {
      const { result } = renderHook(() => useBusRouting())

      // Should have created a router instance
      expect(result.current.router).toBe(mockBusRouter)
    })

    it("does not initialize BusRouter when audio engine is null", () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useBusRouting())

      // Should not have a router instance
      expect(result.current.router).toBeNull()
    })

    it("subscribes to routing changes", () => {
      renderHook(() => useBusRouting())

      expect(mockBusRouter.onRoutingChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it("provides initial routing state", () => {
      const { result } = renderHook(() => useBusRouting())

      expect(result.current.buses).toHaveLength(2)
      expect(result.current.groups).toHaveLength(1)
      expect(result.current.sends).toHaveLength(1)
      expect(result.current.channelAssignments.size).toBe(2)
    })

    it("provides router instance", () => {
      const { result } = renderHook(() => useBusRouting())

      expect(result.current.router).toBe(mockBusRouter)
    })

    it("cleans up routing callback on unmount", () => {
      const { unmount } = renderHook(() => useBusRouting())

      unmount()

      expect(mockBusRouter.removeRoutingCallback).toHaveBeenCalledWith("callback-id")
    })
  })

  describe("bus management", () => {
    it("creates a new bus", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.createBus("Reverb Send", "stereo")

      expect(mockBusRouter.createBus).toHaveBeenCalledWith(expect.stringMatching(/^bus_\d+$/), "Reverb Send", "stereo")
    })

    it("deletes a bus", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.deleteBus("bus1")

      expect(mockBusRouter.deleteBus).toHaveBeenCalledWith("bus1")
    })

    it("sets bus mute state", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.setBusMute("bus1", true)

      expect(mockBusRouter.setBusMute).toHaveBeenCalledWith("bus1", true)
    })

    it("sets bus solo state", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.setBusSolo("bus1", true)

      expect(mockBusRouter.setBusSolo).toHaveBeenCalledWith("bus1", true)
    })
  })

  describe("group management", () => {
    it("creates a new group", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.createGroup("Vocals", ["ch3", "ch4"], "#00ff00")

      expect(mockBusRouter.createGroup).toHaveBeenCalledWith(
        expect.stringMatching(/^group_\d+$/),
        "Vocals",
        ["ch3", "ch4"],
        "#00ff00",
      )
    })

    it("deletes a group", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.deleteGroup("group1")

      expect(mockBusRouter.deleteGroup).toHaveBeenCalledWith("group1")
    })

    it("sets group mute state", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.setGroupMute("group1", true)

      expect(mockBusRouter.setGroupMute).toHaveBeenCalledWith("group1", true)
    })

    it("sets group solo state", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.setGroupSolo("group1", true)

      expect(mockBusRouter.setGroupSolo).toHaveBeenCalledWith("group1", true)
    })

    it("sets group gain", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.setGroupGain("group1", 0.8)

      expect(mockBusRouter.setGroupGain).toHaveBeenCalledWith("group1", 0.8)
    })

    it("adds channel to group", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.addChannelToGroup("group1", "ch3")

      expect(mockBusRouter.addChannelToGroup).toHaveBeenCalledWith("group1", "ch3")
    })

    it("removes channel from group", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.removeChannelFromGroup("group1", "ch1")

      expect(mockBusRouter.removeChannelFromGroup).toHaveBeenCalledWith("group1", "ch1")
    })
  })

  describe("send management", () => {
    it("creates a new send", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.createSend("ch3", "bus2", 0.7, true)

      expect(mockBusRouter.createSend).toHaveBeenCalledWith(
        expect.stringMatching(/^send_ch3_bus2_\d+$/),
        "ch3",
        "bus2",
        0.7,
        true,
      )
    })

    it("creates a post-fader send by default", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.createSend("ch3", "bus2", 0.7)

      expect(mockBusRouter.createSend).toHaveBeenCalledWith(
        expect.stringMatching(/^send_ch3_bus2_\d+$/),
        "ch3",
        "bus2",
        0.7,
        false,
      )
    })

    it("updates send level", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.updateSendLevel("send1", 0.8)

      expect(mockBusRouter.updateSendLevel).toHaveBeenCalledWith("send1", 0.8)
    })

    it("deletes a send", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.deleteSend("send1")

      // Should get routing matrix and modify sends map
      expect(mockBusRouter.getRoutingMatrix).toHaveBeenCalled()
    })

    it("toggles send enabled state", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.toggleSendEnabled("send1", false)

      expect(mockBusRouter.getRoutingMatrix).toHaveBeenCalled()
    })

    it("toggles send pre/post state", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.toggleSendPre("send1", true)

      expect(mockBusRouter.getRoutingMatrix).toHaveBeenCalled()
    })
  })

  describe("channel routing", () => {
    it("assigns channel to bus", () => {
      const { result } = renderHook(() => useBusRouting())

      result.current.assignChannelToBus("ch3", "bus2")

      expect(mockBusRouter.assignChannelToBus).toHaveBeenCalledWith("ch3", "bus2")
    })

    it("connects channel to routing", () => {
      const { result } = renderHook(() => useBusRouting())

      const sourceNode = { connect: vi.fn(), disconnect: vi.fn() }
      const gainNode = result.current.connectChannel("ch3", sourceNode as any)

      expect(mockBusRouter.connectChannel).toHaveBeenCalledWith("ch3", sourceNode)
      expect(gainNode).toBeDefined()
    })

    it("returns null when connecting channel without router", () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useBusRouting())

      const sourceNode = { connect: vi.fn(), disconnect: vi.fn() }
      const gainNode = result.current.connectChannel("ch3", sourceNode as any)

      expect(gainNode).toBeNull()
    })
  })

  describe("data queries", () => {
    it("gets sends for a channel", () => {
      const { result } = renderHook(() => useBusRouting())

      const channelSends = result.current.getChannelSends("ch1")

      expect(channelSends).toHaveLength(1)
      expect(channelSends[0].sourceChannelId).toBe("ch1")
    })

    it("returns empty array for channel with no sends", () => {
      const { result } = renderHook(() => useBusRouting())

      const channelSends = result.current.getChannelSends("ch999")

      expect(channelSends).toHaveLength(0)
    })

    it("gets assigned bus for a channel", () => {
      const { result } = renderHook(() => useBusRouting())

      const channelBus = result.current.getChannelBus("ch1")

      expect(channelBus).toEqual({ id: "bus1", name: "Main", type: "stereo" })
    })

    it("returns null for channel with no bus assignment", () => {
      const { result } = renderHook(() => useBusRouting())

      const channelBus = result.current.getChannelBus("ch999")

      expect(channelBus).toBeNull()
    })

    it("returns null for channel assigned to non-existent bus", () => {
      // Mock a channel assigned to a bus that doesn't exist
      mockBusRouter.getRoutingMatrix.mockReturnValueOnce({
        buses: new Map([["bus1", { id: "bus1", name: "Main", type: "stereo" }]]),
        groups: new Map(),
        sends: new Map(),
        channelBusAssignments: new Map([["ch999", "non-existent-bus"]]),
      })

      const { result } = renderHook(() => useBusRouting())

      const channelBus = result.current.getChannelBus("ch999")

      expect(channelBus).toBeNull()
    })
  })

  describe("configuration", () => {
    it("exports routing configuration", () => {
      const { result } = renderHook(() => useBusRouting())

      const config = result.current.exportConfiguration()

      expect(mockBusRouter.exportConfiguration).toHaveBeenCalledOnce()
      expect(config).toEqual({ version: "1.0", buses: [], groups: [], sends: [] })
    })

    it("returns null when exporting without router", () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useBusRouting())

      const config = result.current.exportConfiguration()

      expect(config).toBeNull()
    })

    it("imports routing configuration", () => {
      const { result } = renderHook(() => useBusRouting())

      const config = { version: "1.0", buses: [], groups: [], sends: [] }
      result.current.importConfiguration(config)

      expect(mockBusRouter.importConfiguration).toHaveBeenCalledWith(config)
    })

    it("does nothing when importing without router", () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useBusRouting())

      const config = { version: "1.0", buses: [], groups: [], sends: [] }
      result.current.importConfiguration(config)

      expect(mockBusRouter.importConfiguration).not.toHaveBeenCalled()
    })
  })

  describe("function stability", () => {
    it("returns stable function references", () => {
      const { result, rerender } = renderHook(() => useBusRouting())

      const firstRender = result.current

      rerender()

      const secondRender = result.current

      // Functions should be the same reference (stable)
      expect(secondRender.createBus).toBe(firstRender.createBus)
      expect(secondRender.createGroup).toBe(firstRender.createGroup)
      expect(secondRender.createSend).toBe(firstRender.createSend)
      expect(secondRender.deleteBus).toBe(firstRender.deleteBus)
      expect(secondRender.deleteGroup).toBe(firstRender.deleteGroup)
      expect(secondRender.deleteSend).toBe(firstRender.deleteSend)
      expect(secondRender.assignChannelToBus).toBe(firstRender.assignChannelToBus)
      expect(secondRender.connectChannel).toBe(firstRender.connectChannel)
      expect(secondRender.getChannelSends).toBe(firstRender.getChannelSends)
      expect(secondRender.getChannelBus).toBe(firstRender.getChannelBus)
    })
  })

  describe("operation safeguards", () => {
    it("handles operations when router is not available", () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useBusRouting())

      // All operations should be safe to call
      result.current.createBus("Test", "stereo")
      result.current.createGroup("Test", [], "#000")
      result.current.createSend("ch1", "bus1", 0.5)
      result.current.updateSendLevel("send1", 0.8)
      result.current.setBusMute("bus1", true)
      result.current.setBusSolo("bus1", true)
      result.current.setGroupMute("group1", true)
      result.current.setGroupSolo("group1", true)
      result.current.setGroupGain("group1", 0.8)
      result.current.addChannelToGroup("group1", "ch1")
      result.current.removeChannelFromGroup("group1", "ch1")
      result.current.deleteBus("bus1")
      result.current.deleteGroup("group1")
      result.current.deleteSend("send1")
      result.current.toggleSendEnabled("send1", true)
      result.current.toggleSendPre("send1", true)
      result.current.assignChannelToBus("ch1", "bus1")

      // None of these should call the router methods
      expect(mockBusRouter.createBus).not.toHaveBeenCalled()
      expect(mockBusRouter.createGroup).not.toHaveBeenCalled()
      expect(mockBusRouter.createSend).not.toHaveBeenCalled()
    })
  })

  describe("state updates", () => {
    it.skip("updates state when routing changes", () => {
      const { result } = renderHook(() => useBusRouting())

      // Initial state should have 2 buses
      expect(result.current.buses).toHaveLength(2)

      // Get the callback that was registered
      const changeCallback = mockBusRouter.onRoutingChange.mock.calls[0][0]

      // Change the mock data for subsequent calls
      mockBusRouter.getRoutingMatrix.mockReturnValueOnce({
        buses: new Map([["bus3", { id: "bus3", name: "New Bus", type: "mono" }]]),
        groups: new Map(),
        sends: new Map(),
        channelBusAssignments: new Map(),
      })

      // Trigger the callback
      changeCallback()

      // State should be updated to show 1 bus
      expect(result.current.buses).toHaveLength(1)
      expect(result.current.buses[0].name).toBe("New Bus")
    })
  })

  describe("edge cases", () => {
    it("handles missing audio context gracefully", () => {
      mockUseAudioEngine.mockReturnValue({
        engine: { audioContext: null },
      })

      const { result } = renderHook(() => useBusRouting())

      // Router should not be initialized
      expect(result.current.router).toBeNull()
    })

    it("handles deletion of non-existent send", () => {
      const { result } = renderHook(() => useBusRouting())

      // Mock empty sends
      mockBusRouter.getRoutingMatrix.mockReturnValue({
        buses: new Map(),
        groups: new Map(),
        sends: new Map(),
        channelBusAssignments: new Map(),
      })

      // Should not throw
      result.current.deleteSend("non-existent")
    })
  })
})
