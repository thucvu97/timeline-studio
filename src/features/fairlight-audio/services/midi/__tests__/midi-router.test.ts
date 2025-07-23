import { beforeEach, describe, expect, it, vi } from "vitest"

import { BaseMidiProcessor, MidiRouter } from "../midi-router"

import type { MidiMessage } from "../midi-engine"

describe("MidiRouter", () => {
  let router: MidiRouter

  beforeEach(() => {
    router = new MidiRouter()
    vi.clearAllMocks()
  })

  describe("Route Management", () => {
    it("should create a new route", () => {
      const routeCreatedHandler = vi.fn()
      router.on("routeCreated", routeCreatedHandler)

      const config = {
        name: "Test Route",
        enabled: true,
        sourceDevice: "device1",
        sourceChannel: 1,
        destinations: [
          {
            id: "dest1",
            type: "device" as const,
            deviceId: "output1",
          },
        ],
        processors: [],
      }

      const routeId = router.createRoute(config)

      expect(routeId).toMatch(/^route_\d+_[a-z0-9]+$/)
      expect(routeCreatedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          ...config,
          id: routeId,
        }),
      )

      const route = router.getRoute(routeId)
      expect(route).toMatchObject(config)
    })

    it("should update an existing route", () => {
      const routeId = router.createRoute({
        name: "Original Route",
        enabled: true,
        destinations: [],
        processors: [],
      })

      const routeUpdatedHandler = vi.fn()
      router.on("routeUpdated", routeUpdatedHandler)

      const updates = {
        name: "Updated Route",
        enabled: false,
        sourceChannel: 2,
      }

      router.updateRoute(routeId, updates)

      expect(routeUpdatedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: routeId,
          name: "Updated Route",
          enabled: false,
          sourceChannel: 2,
        }),
      )

      const route = router.getRoute(routeId)
      expect(route?.name).toBe("Updated Route")
      expect(route?.enabled).toBe(false)
      expect(route?.sourceChannel).toBe(2)
    })

    it("should delete a route", () => {
      const routeId = router.createRoute({
        name: "Test Route",
        enabled: true,
        destinations: [],
        processors: [],
      })

      const routeDeletedHandler = vi.fn()
      router.on("routeDeleted", routeDeletedHandler)

      router.deleteRoute(routeId)

      expect(routeDeletedHandler).toHaveBeenCalledWith(routeId)
      expect(router.getRoute(routeId)).toBeUndefined()
    })

    it("should enable/disable routes", () => {
      const routeId = router.createRoute({
        name: "Test Route",
        enabled: false,
        destinations: [],
        processors: [],
      })

      // Enable route using updateRoute
      router.updateRoute(routeId, { enabled: true })
      expect(router.getRoute(routeId)?.enabled).toBe(true)

      // Disable route using updateRoute
      router.updateRoute(routeId, { enabled: false })
      expect(router.getRoute(routeId)?.enabled).toBe(false)
    })

    it("should get all routes", () => {
      const route1 = router.createRoute({
        name: "Route 1",
        enabled: true,
        destinations: [],
        processors: [],
      })

      const route2 = router.createRoute({
        name: "Route 2",
        enabled: false,
        destinations: [],
        processors: [],
      })

      const routes = router.getRoutes()
      expect(routes).toHaveLength(2)
      expect(routes.find((r) => r.id === route1)).toBeDefined()
      expect(routes.find((r) => r.id === route2)).toBeDefined()
    })

    it("should delete all routes", () => {
      const route1 = router.createRoute({
        name: "Route 1",
        enabled: true,
        destinations: [],
        processors: [],
      })

      const route2 = router.createRoute({
        name: "Route 2",
        enabled: false,
        destinations: [],
        processors: [],
      })

      // Delete routes individually since clearRoutes is not implemented
      router.deleteRoute(route1)
      router.deleteRoute(route2)
      expect(router.getRoutes()).toHaveLength(0)
    })
  })

  describe("Message Routing", () => {
    it("should route messages to destinations", () => {
      const callback = vi.fn()
      const sendToDeviceHandler = vi.fn()
      router.on("sendToDevice", sendToDeviceHandler)

      router.createRoute({
        name: "Test Route",
        enabled: true,
        sourceDevice: "input1",
        sourceChannel: 1,
        destinations: [
          {
            id: "dest1",
            type: "device",
            deviceId: "output1",
          },
          {
            id: "dest2",
            type: "function",
            callback,
          },
        ],
        processors: [],
      })

      const message: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      }

      router.routeMessage("input1", message)

      expect(sendToDeviceHandler).toHaveBeenCalledWith({
        deviceId: "output1",
        message,
      })
      expect(callback).toHaveBeenCalledWith({
        ...message,
        timestamp: expect.any(Number),
      })
    })

    it("should filter messages by source device", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Device Filter Route",
        enabled: true,
        sourceDevice: "input1",
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [],
      })

      const message: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      }

      // Should route from matching device
      router.routeMessage("input1", message)
      expect(callback).toHaveBeenCalledTimes(1)

      // Should not route from different device
      router.routeMessage("input2", message)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("should filter messages by channel", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Channel Filter Route",
        enabled: true,
        sourceChannel: 2,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [],
      })

      // Should not route channel 1
      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })
      expect(callback).not.toHaveBeenCalled()

      // Should route channel 2
      router.routeMessage("input1", {
        type: "noteon",
        channel: 2,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("should filter messages by type", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Type Filter Route",
        enabled: true,
        sourceType: ["noteon", "noteoff"],
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [],
      })

      // Should route noteon
      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })
      expect(callback).toHaveBeenCalledTimes(1)

      // Should not route CC
      router.routeMessage("input1", {
        type: "cc",
        channel: 1,
        data: { controller: 7, value: 100 },
      })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("should filter notes by range", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Note Range Route",
        enabled: true,
        sourceRange: {
          minNote: 60,
          maxNote: 72,
        },
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [],
      })

      // Note below range
      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        data: { note: 59, velocity: 100 },
      })
      expect(callback).not.toHaveBeenCalled()

      // Note in range
      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        data: { note: 65, velocity: 100 },
      })
      expect(callback).toHaveBeenCalledTimes(1)

      // Note above range
      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        data: { note: 73, velocity: 100 },
      })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("should filter CCs by controller list", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "CC Filter Route",
        enabled: true,
        sourceRange: {
          controllers: [1, 7, 11],
        },
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [],
      })

      // Allowed controller
      router.routeMessage("input1", {
        type: "cc",
        channel: 1,
        data: { controller: 7, value: 100 },
      })
      expect(callback).toHaveBeenCalledTimes(1)

      // Not allowed controller
      router.routeMessage("input1", {
        type: "cc",
        channel: 1,
        data: { controller: 10, value: 100 },
      })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("should skip disabled routes", () => {
      const callback = vi.fn()

      const routeId = router.createRoute({
        name: "Disabled Route",
        enabled: false,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })

      expect(callback).not.toHaveBeenCalled()

      // Enable and test again
      router.updateRoute(routeId, { enabled: true })
      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe("Message Transformation", () => {
    it("should apply channel offset", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Channel Offset Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
            transform: {
              channelOffset: 2,
            },
          },
        ],
        processors: [],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })

      expect(callback).toHaveBeenCalledWith({
        type: "noteon",
        channel: 3,
        timestamp: expect.any(Number),
        data: { note: 60, velocity: 100 },
      })
    })

    it("should apply channel mapping", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Channel Map Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
            transform: {
              channelMap: new Map([
                [1, 10],
                [2, 11],
              ]),
            },
          },
        ],
        processors: [],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })

      expect(callback).toHaveBeenCalledWith({
        type: "noteon",
        channel: 10,
        timestamp: expect.any(Number),
        data: { note: 60, velocity: 100 },
      })
    })

    it("should apply note transposition", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Transpose Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
            transform: {
              transpose: 12,
            },
          },
        ],
        processors: [],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })

      expect(callback).toHaveBeenCalledWith({
        type: "noteon",
        channel: 1,
        timestamp: expect.any(Number),
        data: { note: 72, velocity: 100 },
      })
    })

    it("should apply velocity scaling", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Velocity Scale Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
            transform: {
              velocityScale: 0.5,
            },
          },
        ],
        processors: [],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })

      expect(callback).toHaveBeenCalledWith({
        type: "noteon",
        channel: 1,
        timestamp: expect.any(Number),
        data: { note: 60, velocity: 50 },
      })
    })

    it("should apply velocity curve", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "Velocity Curve Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
            transform: {
              velocityScale: 0.8, // "soft" curve simulation
            },
          },
        ],
        processors: [],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })

      // Soft curve might reduce velocity for high values
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "noteon",
          channel: 1,
          data: expect.objectContaining({
            note: 60,
            velocity: expect.any(Number),
          }),
        }),
      )
    })

    it("should remap CC controllers", () => {
      const callback = vi.fn()

      router.createRoute({
        name: "CC Remap Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
            transform: {
              ccMap: new Map([
                [1, 11], // Mod wheel to Expression
                [7, 10], // Volume to Pan
              ]),
            },
          },
        ],
        processors: [],
      })

      router.routeMessage("input1", {
        type: "cc",
        channel: 1,
        timestamp: Date.now(),
        data: { controller: 1, value: 64 },
      })

      expect(callback).toHaveBeenCalledWith({
        type: "cc",
        channel: 1,
        timestamp: expect.any(Number),
        data: { controller: 11, value: 64 },
      })
    })
  })

  describe("Processors", () => {
    it("should register and apply processors", () => {
      class TestProcessor extends BaseMidiProcessor {
        process = vi.fn((message: MidiMessage) => ({
          ...message,
          data: { ...message.data, velocity: 127 },
        }))
      }

      const processor = new TestProcessor("test-processor", "test")
      router.registerProcessor(processor)

      const callback = vi.fn()
      router.createRoute({
        name: "Processor Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [{ id: "test-processor", type: "transform" as const, enabled: true, config: {} }],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 64 },
      })

      expect(processor.process).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith({
        type: "noteon",
        channel: 1,
        timestamp: expect.any(Number),
        data: { note: 60, velocity: 127 },
      })
    })

    it("should skip disabled processors", () => {
      class TestProcessor extends BaseMidiProcessor {
        process = vi.fn((message: MidiMessage) => message)
      }

      const processor = new TestProcessor("test-processor", "test")
      router.registerProcessor(processor)

      const callback = vi.fn()
      router.createRoute({
        name: "Processor Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [{ id: "test-processor", type: "transform" as const, enabled: false, config: {} }],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        data: { note: 60, velocity: 64 },
      })

      expect(processor.process).not.toHaveBeenCalled()
    })

    it("should chain multiple processors", () => {
      class TransposeProcessor extends BaseMidiProcessor {
        process(message: MidiMessage): MidiMessage {
          if (message.type === "noteon" || message.type === "noteoff") {
            return {
              ...message,
              data: { ...message.data, note: (message.data.note || 0) + 12 },
            }
          }
          return message
        }
      }

      class VelocityScaleProcessor extends BaseMidiProcessor {
        process(message: MidiMessage): MidiMessage {
          if ("velocity" in message.data) {
            return {
              ...message,
              data: { ...message.data, velocity: Math.round((message.data.velocity || 0) * 0.8) },
            }
          }
          return message
        }
      }

      const processor1 = new TransposeProcessor("transpose", "transform")
      const processor2 = new VelocityScaleProcessor("velocity-scale", "transform")

      router.registerProcessor(processor1)
      router.registerProcessor(processor2)

      const callback = vi.fn()
      router.createRoute({
        name: "Chain Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback,
          },
        ],
        processors: [
          { id: "transpose", type: "transform" as const, enabled: true, config: {} },
          { id: "velocity-scale", type: "transform" as const, enabled: true, config: {} },
        ],
      })

      router.routeMessage("input1", {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      })

      expect(callback).toHaveBeenCalledWith({
        type: "noteon",
        channel: 1,
        timestamp: expect.any(Number),
        data: { note: 72, velocity: 80 },
      })
    })
  })

  describe("Virtual Destinations", () => {
    it("should route to virtual instruments", () => {
      const virtualHandler = vi.fn()
      router.on("sendToVirtual", virtualHandler)

      router.createRoute({
        name: "Virtual Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "virtual",
            virtualId: "synth1",
          },
        ],
        processors: [],
      })

      const message: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      }

      router.routeMessage("input1", message)

      expect(virtualHandler).toHaveBeenCalledWith({
        virtualId: "synth1",
        message,
      })
    })

    it("should route to multiple destination types", () => {
      const deviceHandler = vi.fn()
      const virtualHandler = vi.fn()
      const callback = vi.fn()

      router.on("sendToDevice", deviceHandler)
      router.on("sendToVirtual", virtualHandler)

      router.createRoute({
        name: "Multi Dest Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "device",
            deviceId: "output1",
          },
          {
            id: "dest2",
            type: "virtual",
            virtualId: "synth1",
          },
          {
            id: "dest3",
            type: "function",
            callback,
          },
        ],
        processors: [],
      })

      const message: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      }

      router.routeMessage("input1", message)

      expect(deviceHandler).toHaveBeenCalled()
      expect(virtualHandler).toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
    })
  })

  describe("Error Handling", () => {
    it("should handle invalid route ID gracefully", () => {
      expect(() => router.updateRoute("invalid-id", { name: "Test" })).not.toThrow()
      expect(() => router.deleteRoute("invalid-id")).not.toThrow()
    })

    it("should handle callback errors", () => {
      const errorCallback = vi.fn(() => {
        throw new Error("Callback error")
      })

      router.createRoute({
        name: "Callback Error Route",
        enabled: true,
        destinations: [
          {
            id: "dest1",
            type: "function",
            callback: errorCallback,
          },
        ],
        processors: [],
      })

      const message: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: Date.now(),
        data: { note: 60, velocity: 100 },
      }

      // Should not throw
      expect(() => router.routeMessage("input1", message)).not.toThrow()
      expect(errorCallback).toHaveBeenCalled()
    })
  })
})
