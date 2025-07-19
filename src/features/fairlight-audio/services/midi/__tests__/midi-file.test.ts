import { beforeEach, describe, expect, it } from "vitest"

import { MidiFile } from "../midi-file"

import type { MidiTrack } from "../midi-sequencer"

describe("MidiFile", () => {
  let midiFile: MidiFile

  beforeEach(() => {
    midiFile = new MidiFile()
  })

  describe("File Parsing", () => {
    it("should parse a valid MIDI file header", async () => {
      // Create a minimal MIDI file with header
      const header = new Uint8Array([
        0x4d,
        0x54,
        0x68,
        0x64, // MThd
        0x00,
        0x00,
        0x00,
        0x06, // Header length (6 bytes)
        0x00,
        0x01, // Format 1
        0x00,
        0x02, // 2 tracks
        0x01,
        0xe0, // 480 ticks per quarter note
      ])

      const buffer = header.buffer
      await midiFile.parse(buffer)

      // After parsing, we should be able to convert to sequencer tracks
      const tracks = midiFile.toSequencerTracks()
      expect(tracks).toBeDefined()
    })

    it("should throw error for invalid MIDI file", async () => {
      const invalidData = new Uint8Array([0x00, 0x00, 0x00, 0x00])

      await expect(midiFile.parse(invalidData.buffer)).rejects.toThrow()
    })

    it("should parse track data", async () => {
      // Create MIDI file with header and one track
      const data = new Uint8Array([
        // Header
        0x4d,
        0x54,
        0x68,
        0x64, // MThd
        0x00,
        0x00,
        0x00,
        0x06, // Header length
        0x00,
        0x01, // Format 1
        0x00,
        0x01, // 1 track
        0x00,
        0x60, // 96 ticks per quarter note
        // Track
        0x4d,
        0x54,
        0x72,
        0x6b, // MTrk
        0x00,
        0x00,
        0x00,
        0x04, // Track length (4 bytes)
        0x00,
        0xff,
        0x2f,
        0x00, // End of track event
      ])

      await midiFile.parse(data.buffer)

      const tracks = midiFile.toSequencerTracks()
      expect(tracks).toBeDefined()
      expect(Array.isArray(tracks)).toBe(true)
    })
  })

  describe("File Creation", () => {
    it("should create MIDI file from tracks", () => {
      const tracks: MidiTrack[] = [
        {
          id: "track1",
          name: "Track 1",
          channel: 1,
          events: [
            {
              id: "event1",
              timestamp: 0,
              message: {
                type: "noteon",
                channel: 1,
                timestamp: 0,
                data: { note: 60, velocity: 100 },
              },
              channel: 1,
              velocity: 100,
            },
            {
              id: "event2",
              timestamp: 1,
              message: {
                type: "noteoff",
                channel: 1,
                timestamp: 0,
                data: { note: 60, velocity: 0 },
              },
              channel: 1,
              velocity: 0,
            },
          ],
          muted: false,
          solo: false,
        },
      ]

      const buffer = MidiFile.fromSequencerTracks(tracks)

      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBeGreaterThan(0)

      // Verify header
      const view = new DataView(buffer)
      const headerType = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
      expect(headerType).toBe("MThd")
    })

    it("should handle tempo changes as meta events", () => {
      const tracks: MidiTrack[] = [
        {
          id: "track1",
          name: "Tempo Track",
          channel: 0,
          events: [
            {
              id: "event1",
              timestamp: 0,
              message: {
                type: "tempo" as any, // Custom event type
                channel: 0,
                timestamp: 0,
                data: { bpm: 120 },
              },
              channel: 0,
            },
          ],
          muted: false,
          solo: false,
        },
      ]

      const buffer = MidiFile.fromSequencerTracks(tracks)
      expect(buffer.byteLength).toBeGreaterThan(0)
    })
  })

  describe("Event Conversion", () => {
    it("should convert sequencer track to file track", () => {
      const track: MidiTrack = {
        id: "track1",
        name: "Test Track",
        channel: 1,
        events: [
          {
            id: "event1",
            timestamp: 0,
            message: {
              type: "noteon",
              channel: 1,
              timestamp: 0,
              data: { note: 60, velocity: 100 },
            },
            channel: 1,
            velocity: 100,
          },
        ],
        muted: false,
        solo: false,
      }

      const buffer = MidiFile.fromSequencerTracks([track], 480)

      // Parse it back
      const newFile = new MidiFile()
      return newFile.parse(buffer).then(() => {
        const convertedTracks = newFile.toSequencerTracks()
        expect(convertedTracks).toHaveLength(1)
        expect(convertedTracks[0].events).toHaveLength(1)
        expect(convertedTracks[0].events[0].message.type).toBe("noteon")
      })
    })

    it("should handle CC events", () => {
      const track: MidiTrack = {
        id: "track1",
        name: "CC Track",
        channel: 2,
        events: [
          {
            id: "event1",
            timestamp: 0,
            message: {
              type: "cc",
              channel: 2,
              timestamp: 0,
              data: { controller: 7, value: 127 },
            },
            channel: 2,
          },
        ],
        muted: false,
        solo: false,
      }

      const buffer = MidiFile.fromSequencerTracks([track])
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it("should handle program change events", () => {
      const track: MidiTrack = {
        id: "track1",
        name: "Program Track",
        channel: 1,
        events: [
          {
            id: "event1",
            timestamp: 0,
            message: {
              type: "programchange",
              channel: 1,
              timestamp: 0,
              data: { program: 24 },
            },
            channel: 1,
          },
        ],
        muted: false,
        solo: false,
      }

      const buffer = MidiFile.fromSequencerTracks([track])
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it("should handle pitch bend events", () => {
      const track: MidiTrack = {
        id: "track1",
        name: "Pitch Track",
        channel: 1,
        events: [
          {
            id: "event1",
            timestamp: 0,
            message: {
              type: "pitchbend",
              channel: 1,
              timestamp: 0,
              data: { value: 8192 }, // Center
            },
            channel: 1,
          },
        ],
        muted: false,
        solo: false,
      }

      const buffer = MidiFile.fromSequencerTracks([track])
      expect(buffer.byteLength).toBeGreaterThan(0)
    })
  })

  describe("Import/Export", () => {
    it("should export to standard MIDI file", () => {
      const tracks: MidiTrack[] = [
        {
          id: "track1",
          name: "Piano",
          channel: 1,
          events: [
            {
              id: "event1",
              timestamp: 0,
              message: {
                type: "programchange",
                channel: 1,
                timestamp: 0,
                data: { program: 0 },
              },
              channel: 1,
            },
            {
              id: "event2",
              timestamp: 0,
              message: {
                type: "noteon",
                channel: 1,
                timestamp: 0,
                data: { note: 60, velocity: 100 },
              },
              channel: 1,
              velocity: 100,
            },
            {
              id: "event3",
              timestamp: 0.5,
              message: {
                type: "noteon",
                channel: 1,
                timestamp: 0,
                data: { note: 64, velocity: 100 },
              },
              channel: 1,
              velocity: 100,
            },
            {
              id: "event4",
              timestamp: 1,
              message: {
                type: "noteoff",
                channel: 1,
                timestamp: 0,
                data: { note: 60, velocity: 0 },
              },
              channel: 1,
              velocity: 0,
            },
            {
              id: "event5",
              timestamp: 1,
              message: {
                type: "noteoff",
                channel: 1,
                timestamp: 0,
                data: { note: 64, velocity: 0 },
              },
              channel: 1,
              velocity: 0,
            },
          ],
          muted: false,
          solo: false,
        },
      ]

      const buffer = MidiFile.fromSequencerTracks(tracks, 480)
      expect(buffer.byteLength).toBeGreaterThan(14) // Header is 14 bytes
    })

    it("should round-trip parse and export", async () => {
      // Create original tracks
      const originalTracks: MidiTrack[] = [
        {
          id: "track1",
          name: "Test Track",
          channel: 1,
          events: [
            {
              id: "event1",
              timestamp: 0,
              message: {
                type: "noteon",
                channel: 1,
                timestamp: 0,
                data: { note: 72, velocity: 80 },
              },
              channel: 1,
              velocity: 80,
            },
            {
              id: "event2",
              timestamp: 2,
              message: {
                type: "noteoff",
                channel: 1,
                timestamp: 0,
                data: { note: 72, velocity: 0 },
              },
              channel: 1,
              velocity: 0,
            },
          ],
          muted: false,
          solo: false,
        },
      ]

      // Export to buffer
      const buffer = MidiFile.fromSequencerTracks(originalTracks)

      // Parse back
      const newMidiFile = new MidiFile()
      await newMidiFile.parse(buffer)

      // Check tracks
      const parsedTracks = newMidiFile.toSequencerTracks()
      expect(parsedTracks).toHaveLength(1)
      expect(parsedTracks[0].name).toBe("Test Track")
      expect(parsedTracks[0].events.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe("Multi-track Support", () => {
    it("should handle multiple tracks", () => {
      const tracks: MidiTrack[] = [
        {
          id: "track1",
          name: "Drums",
          channel: 10,
          events: [
            {
              id: "event1",
              timestamp: 0,
              message: {
                type: "noteon",
                channel: 10,
                timestamp: 0,
                data: { note: 36, velocity: 100 }, // Kick
              },
              channel: 10,
              velocity: 100,
            },
            {
              id: "event2",
              timestamp: 1,
              message: {
                type: "noteon",
                channel: 10,
                timestamp: 0,
                data: { note: 38, velocity: 100 }, // Snare
              },
              channel: 10,
              velocity: 100,
            },
          ],
          muted: false,
          solo: false,
        },
        {
          id: "track2",
          name: "Bass",
          channel: 2,
          events: [
            {
              id: "event3",
              timestamp: 0,
              message: {
                type: "noteon",
                channel: 2,
                timestamp: 0,
                data: { note: 36, velocity: 80 },
              },
              channel: 2,
              velocity: 80,
            },
            {
              id: "event4",
              timestamp: 2,
              message: {
                type: "noteoff",
                channel: 2,
                timestamp: 0,
                data: { note: 36, velocity: 0 },
              },
              channel: 2,
              velocity: 0,
            },
          ],
          muted: false,
          solo: false,
        },
      ]

      const buffer = MidiFile.fromSequencerTracks(tracks)

      // Verify track count in header
      const view = new DataView(buffer)
      const trackCount = view.getUint16(10) // Track count is at offset 10
      expect(trackCount).toBe(2)
    })

    it("should preserve track names", () => {
      const tracks: MidiTrack[] = [
        {
          id: "track1",
          name: "Lead Guitar",
          channel: 1,
          events: [],
          muted: false,
          solo: false,
        },
      ]

      const buffer = MidiFile.fromSequencerTracks(tracks)

      // Track name should be included in the file
      const str = new TextDecoder().decode(new Uint8Array(buffer))
      expect(str).toContain("Lead Guitar")
    })
  })

  describe("Error Handling", () => {
    it("should handle corrupted track data", async () => {
      const data = new Uint8Array([
        // Header
        0x4d,
        0x54,
        0x68,
        0x64, // MThd
        0x00,
        0x00,
        0x00,
        0x06, // Header length
        0x00,
        0x01, // Format 1
        0x00,
        0x01, // 1 track
        0x00,
        0x60, // 96 ticks per quarter note
        // Invalid track (wrong type)
        0x4d,
        0x54,
        0x00,
        0x00, // Should be MTrk
        0x00,
        0x00,
        0x00,
        0x04, // Track length
        0x00,
        0xff,
        0x2f,
        0x00, // End of track
      ])

      const newMidiFile = new MidiFile()
      await expect(newMidiFile.parse(data.buffer)).rejects.toThrow()
    })

    it("should handle empty tracks", () => {
      const tracks: MidiTrack[] = [
        {
          id: "track1",
          name: "Empty Track",
          channel: 1,
          events: [],
          muted: false,
          solo: false,
        },
      ]

      const buffer = MidiFile.fromSequencerTracks(tracks)

      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it("should skip unknown event types", () => {
      const tracks: MidiTrack[] = [
        {
          id: "track1",
          name: "Test Track",
          channel: 1,
          events: [
            {
              id: "event1",
              timestamp: 0,
              message: {
                type: "unknown" as any,
                channel: 1,
                timestamp: 0,
                data: {},
              },
              channel: 1,
            },
            {
              id: "event2",
              timestamp: 0,
              message: {
                type: "noteon",
                channel: 1,
                timestamp: 0,
                data: { note: 60, velocity: 100 },
              },
              channel: 1,
              velocity: 100,
            },
          ],
          muted: false,
          solo: false,
        },
      ]

      const buffer = MidiFile.fromSequencerTracks(tracks)
      expect(buffer).toBeInstanceOf(ArrayBuffer)

      // File should still be created even with unknown events
      expect(buffer.byteLength).toBeGreaterThan(0)
    })
  })
})
