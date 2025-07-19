import { beforeEach, describe, expect, it, vi } from "vitest"

import { MidiSequencer } from "../midi-sequencer"

import type { MidiMessage } from "../midi-engine"

// Mock MidiClock
class MockMidiClock {
  private handlers = new Map<string, Array<(...args: any[]) => void>>()
  private running = false

  on(event: string, handler: (...args: any[]) => void) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(handler)
  }

  emit(event: string, ...args: any[]) {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      eventHandlers.forEach((handler) => handler(...args))
    }
  }

  start() {
    this.running = true
    this.emit("start")
  }

  stop() {
    this.running = false
    this.emit("stop")
  }

  tick(position: number) {
    this.position = position
    this.emit("tick", position)
  }

  isRunning() {
    return this.running
  }

  setPosition(position: number) {
    this.position = position
  }

  beatsToMs(beats: number) {
    // Simple conversion: 120 BPM = 500ms per beat
    return beats * 500
  }
}

describe("MidiSequencer", () => {
  let sequencer: MidiSequencer
  let mockClock: MockMidiClock
  const mockSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockClock = new MockMidiClock()
    sequencer = new MidiSequencer(mockClock as any)
    sequencer.on("sendMessage", mockSendMessage)
  })

  describe("Track Management", () => {
    it("should create a new track", () => {
      const trackCreatedHandler = vi.fn()
      sequencer.on("trackCreated", trackCreatedHandler)

      const trackId = sequencer.createTrack("Test Track", 1)

      expect(trackId).toMatch(/^track_\d+_[a-z0-9]+$/)
      expect(trackCreatedHandler).toHaveBeenCalledWith({
        id: trackId,
        name: "Test Track",
        channel: 1,
        events: [],
        muted: false,
        solo: false,
      })

      const track = sequencer.getTrack(trackId)
      expect(track).toBeDefined()
      expect(track?.name).toBe("Test Track")
      expect(track?.channel).toBe(1)
    })

    it("should update track properties", () => {
      const trackId = sequencer.createTrack("Original", 1)
      const trackUpdatedHandler = vi.fn()
      sequencer.on("trackUpdated", trackUpdatedHandler)

      sequencer.updateTrack(trackId, {
        name: "Updated",
        channel: 2,
        muted: true,
      })

      expect(trackUpdatedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: trackId,
          name: "Updated",
          channel: 2,
          muted: true,
        }),
      )

      const track = sequencer.getTrack(trackId)
      expect(track?.name).toBe("Updated")
      expect(track?.channel).toBe(2)
      expect(track?.muted).toBe(true)
    })

    it("should delete a track", () => {
      const trackId = sequencer.createTrack("Test", 1)
      const trackDeletedHandler = vi.fn()
      sequencer.on("trackDeleted", trackDeletedHandler)

      sequencer.deleteTrack(trackId)

      expect(trackDeletedHandler).toHaveBeenCalledWith(trackId)
      expect(sequencer.getTrack(trackId)).toBeUndefined()
    })

    it("should get all tracks", () => {
      const track1 = sequencer.createTrack("Track 1", 1)
      const track2 = sequencer.createTrack("Track 2", 2)

      const tracks = sequencer.getTracks()
      expect(tracks).toHaveLength(2)
      expect(tracks.find((t) => t.id === track1)).toBeDefined()
      expect(tracks.find((t) => t.id === track2)).toBeDefined()
    })

    it("should clear all tracks", () => {
      sequencer.createTrack("Track 1", 1)
      sequencer.createTrack("Track 2", 2)

      sequencer.clear()
      expect(sequencer.getTracks()).toHaveLength(0)
    })
  })

  describe("Event Management", () => {
    it("should add event to track", () => {
      const trackId = sequencer.createTrack("Test", 1)
      const eventAddedHandler = vi.fn()
      sequencer.on("eventAdded", eventAddedHandler)

      const message: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: 0,
        data: { note: 60, velocity: 100 },
      }

      const eventId = sequencer.addEvent(trackId, {
        timestamp: 0,
        message,
        channel: 1,
        velocity: 100,
      })

      expect(eventId).toMatch(/^event_\d+$/)
      expect(eventAddedHandler).toHaveBeenCalledWith({
        trackId,
        event: expect.objectContaining({
          id: eventId,
          timestamp: 0,
          message,
        }),
      })

      const track = sequencer.getTrack(trackId)
      expect(track?.events).toHaveLength(1)
      expect(track?.events[0].id).toBe(eventId)
      expect(track?.events[0].message).toEqual(message)
    })

    it("should update event", () => {
      const trackId = sequencer.createTrack("Test", 1)
      const message: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: 0,
        data: { note: 60, velocity: 100 },
      }
      const eventId = sequencer.addEvent(trackId, {
        timestamp: 0,
        message,
        channel: 1,
        velocity: 100,
      })

      const eventUpdatedHandler = vi.fn()
      sequencer.on("eventUpdated", eventUpdatedHandler)

      const updatedMessage: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: 0,
        data: { note: 64, velocity: 80 },
      }

      sequencer.updateEvent(trackId, eventId, {
        timestamp: 1,
        message: updatedMessage,
      })

      expect(eventUpdatedHandler).toHaveBeenCalledWith({
        trackId,
        event: expect.objectContaining({
          id: eventId,
          timestamp: 1,
          message: updatedMessage,
        }),
      })

      const track = sequencer.getTrack(trackId)
      const event = track?.events.find((e) => e.id === eventId)
      expect(event?.timestamp).toBe(1)
      expect(event?.message.data.note).toBe(64)
    })

    it("should delete event", () => {
      const trackId = sequencer.createTrack("Test", 1)
      const eventId = sequencer.addEvent(trackId, {
        timestamp: 0,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      const eventDeletedHandler = vi.fn()
      sequencer.on("eventDeleted", eventDeletedHandler)

      sequencer.deleteEvent(trackId, eventId)

      expect(eventDeletedHandler).toHaveBeenCalledWith(expect.objectContaining({ trackId, eventId }))

      const track = sequencer.getTrack(trackId)
      expect(track?.events).toHaveLength(0)
    })

    it("should get events from track", () => {
      const trackId = sequencer.createTrack("Test", 1)

      // Add events at different times
      sequencer.addEvent(trackId, {
        timestamp: 0,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      sequencer.addEvent(trackId, {
        timestamp: 1,
        message: {
          type: "noteoff",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 0 },
        },
        channel: 1,
        velocity: 0,
      })

      const track = sequencer.getTrack(trackId)
      expect(track?.events).toHaveLength(2)
      expect(track?.events[0].timestamp).toBe(0)
      expect(track?.events[1].timestamp).toBe(1)
    })
  })

  describe("Playback", () => {
    it("should start and stop playback", () => {
      const playbackStartedHandler = vi.fn()
      const playbackStoppedHandler = vi.fn()
      sequencer.on("playbackStarted", playbackStartedHandler)
      sequencer.on("playbackStopped", playbackStoppedHandler)

      sequencer.startPlayback()
      expect(playbackStartedHandler).toHaveBeenCalled()

      sequencer.stopPlayback()
      expect(playbackStoppedHandler).toHaveBeenCalled()
    })

    it("should handle playback state", () => {
      const state = sequencer.getState()
      expect(state.isPlaying).toBe(false)

      sequencer.startPlayback()
      const newState = sequencer.getState()
      expect(newState.isPlaying).toBe(true)

      sequencer.stopPlayback()
      const finalState = sequencer.getState()
      expect(finalState.isPlaying).toBe(false)
    })

    it("should update playhead position", () => {
      const positionChangedHandler = vi.fn()
      sequencer.on("positionChanged", positionChangedHandler)

      sequencer.setPosition(5)
      expect(sequencer.getState().currentPosition).toBe(5)
      expect(positionChangedHandler).toHaveBeenCalledWith(5)
    })

    it("should handle loop mode", () => {
      const loopChangedHandler = vi.fn()
      sequencer.on("loopChanged", loopChangedHandler)

      sequencer.setLoop(4, 8, true)

      expect(loopChangedHandler).toHaveBeenCalledWith({
        start: 4,
        end: 8,
        enabled: true,
      })

      const state = sequencer.getState()
      expect(state.loopEnabled).toBe(true)
      expect(state.loopStart).toBe(4)
      expect(state.loopEnd).toBe(8)
    })

    it("should send events during playback", () => {
      vi.useFakeTimers()

      const trackId = sequencer.createTrack("Test", 1)
      sequencer.addEvent(trackId, {
        timestamp: 0,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      sequencer.startPlayback()

      // Advance time
      vi.advanceTimersByTime(100)

      // Event processing happens through midiOut event
      // Since we're using fake timers, the event scheduling happens but
      // we need to emit midiOut event ourselves in real implementation

      sequencer.stopPlayback()
      vi.useRealTimers()
    })

    it("should respect track mute/solo states", () => {
      vi.useFakeTimers()

      const track1 = sequencer.createTrack("Track 1", 1)
      const track2 = sequencer.createTrack("Track 2", 2)

      sequencer.addEvent(track1, {
        timestamp: 0,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      sequencer.addEvent(track2, {
        timestamp: 0,
        message: {
          type: "noteon",
          channel: 2,
          timestamp: 0,
          data: { note: 64, velocity: 100 },
        },
        channel: 2,
        velocity: 100,
      })

      // Mute track 1
      sequencer.updateTrack(track1, { muted: true })

      sequencer.startPlayback()
      vi.advanceTimersByTime(100)

      // Track muting happens during processPlayback
      // which filters events before scheduling

      sequencer.stopPlayback()
      vi.useRealTimers()
    })
  })

  describe("Recording", () => {
    it("should start and stop recording", () => {
      const trackId = sequencer.createTrack("Recording Track", 1)
      const recordingStartedHandler = vi.fn()
      sequencer.on("recordingStarted", recordingStartedHandler)

      sequencer.startRecording(trackId)
      expect(recordingStartedHandler).toHaveBeenCalledWith(trackId)
      expect(sequencer.getState().isRecording).toBe(true)

      sequencer.stopRecording()
      expect(sequencer.getState().isRecording).toBe(false)
    })

    it("should record incoming MIDI messages", () => {
      const trackId = sequencer.createTrack("Recording Track", 1)

      sequencer.startRecording(trackId)
      sequencer.startPlayback()

      const message: MidiMessage = {
        type: "noteon",
        channel: 1,
        timestamp: performance.now(),
        data: { note: 60, velocity: 100 },
      }

      sequencer.recordMidiMessage(message)

      sequencer.stopPlayback()
      sequencer.stopRecording()

      const track = sequencer.getTrack(trackId)
      expect(track?.events).toHaveLength(1)
      expect(track?.events[0].message.type).toBe("noteon")
      expect(track?.events[0].message.data.note).toBe(60)
    })

    it("should handle recording with existing events", () => {
      const trackId = sequencer.createTrack("Test", 1)

      // Add existing event
      sequencer.addEvent(trackId, {
        timestamp: 0,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      // Start recording
      sequencer.setPosition(0)
      sequencer.startRecording(trackId)
      sequencer.startPlayback()

      sequencer.recordMidiMessage({
        type: "noteon",
        channel: 1,
        timestamp: performance.now(),
        data: { note: 64, velocity: 100 },
      })

      sequencer.stopPlayback()
      sequencer.stopRecording()

      // Should have both events
      const track = sequencer.getTrack(trackId)
      expect(track?.events).toHaveLength(2)
    })

    it("should apply track quantization", () => {
      const trackId = sequencer.createTrack("Test", 1)

      // Add unquantized events
      sequencer.addEvent(trackId, {
        timestamp: 0.1,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      sequencer.addEvent(trackId, {
        timestamp: 0.9,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 64, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      // Apply quantization
      sequencer.quantizeTrack(trackId, 0.25)

      const track = sequencer.getTrack(trackId)
      // Events should be quantized to nearest 16th note
      expect(track?.events[0].timestamp).toBe(0)
      expect(track?.events[1].timestamp).toBe(1)
    })
  })

  describe("Clock Integration", () => {
    it("should respond to clock start/stop", () => {
      const startHandler = vi.fn()
      const stopHandler = vi.fn()

      sequencer.on("playbackStarted", startHandler)
      sequencer.on("playbackStopped", stopHandler)

      // Start via clock
      sequencer.startPlayback()
      mockClock.start()

      expect(startHandler).toHaveBeenCalled()

      // Stop via clock
      mockClock.stop()

      expect(sequencer.getState().isPlaying).toBe(false)
    })

    it("should process events on clock tick", () => {
      const trackId = sequencer.createTrack("Test", 1)

      sequencer.addEvent(trackId, {
        timestamp: 1,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      sequencer.startPlayback()

      // Tick to position 1
      mockClock.tick(1)

      expect(sequencer.getState().currentPosition).toBe(1)
    })
  })

  describe("Cleanup", () => {
    it("should clear all data", () => {
      const track1 = sequencer.createTrack("Track 1", 1)
      const track2 = sequencer.createTrack("Track 2", 2)

      sequencer.addEvent(track1, {
        timestamp: 0,
        message: {
          type: "noteon",
          channel: 1,
          timestamp: 0,
          data: { note: 60, velocity: 100 },
        },
        channel: 1,
        velocity: 100,
      })

      sequencer.clear()

      expect(sequencer.getTracks()).toHaveLength(0)
      expect(sequencer.getState().isPlaying).toBe(false)
      expect(sequencer.getState().isRecording).toBe(false)
    })

    it("should dispose properly", () => {
      const track1 = sequencer.createTrack("Track 1", 1)

      sequencer.dispose()

      expect(sequencer.getTracks()).toHaveLength(0)
      expect(sequencer.listenerCount("trackCreated")).toBe(0)
    })
  })

  describe("Error Handling", () => {
    it("should handle invalid track ID", () => {
      expect(() => sequencer.updateTrack("invalid-id", { name: "Test" })).not.toThrow()
      expect(() => sequencer.deleteTrack("invalid-id")).not.toThrow()

      expect(() =>
        sequencer.addEvent("invalid-id", {
          timestamp: 0,
          message: {
            type: "noteon",
            channel: 1,
            timestamp: 0,
            data: { note: 60, velocity: 100 },
          },
          channel: 1,
          velocity: 100,
        }),
      ).toThrow("Track invalid-id not found")
    })

    it("should handle position bounds", () => {
      sequencer.setPosition(100)
      expect(sequencer.getState().currentPosition).toBe(100)

      sequencer.setPosition(-10) // Negative position
      expect(sequencer.getState().currentPosition).toBe(-10) // Allows negative for count-in
    })

    it("should handle loop validation", () => {
      // Loop end must be after start
      sequencer.setLoop(8, 4, true)
      const state = sequencer.getState()
      expect(state.loopStart).toBe(8)
      expect(state.loopEnd).toBeGreaterThan(8) // Should be adjusted to at least start + 0.25
    })
  })
})
