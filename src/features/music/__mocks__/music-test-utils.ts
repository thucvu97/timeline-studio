import { vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"
import { MusicResource } from "@/features/resources/types"

/**
 * Creates a mock MediaFile object for testing music features
 */
export function createMockMusicFile(overrides?: Partial<MediaFile>): MediaFile {
  return {
    id: "mock-music-1",
    name: "test-song.mp3",
    path: "/test/music/test-song.mp3",
    isVideo: false,
    isAudio: true,
    isImage: false,
    size: 5000000,
    duration: 180,
    startTime: 0,
    createdAt: "2025-01-01T00:00:00Z",
    isLoadingMetadata: false,
    probeData: {
      format: {
        duration: 180,
        size: 5000000,
        bit_rate: 320000,
        tags: {
          title: "Test Song",
          artist: "Test Artist",
          album: "Test Album",
          genre: "Test Genre",
          date: "2025",
        },
      },
      streams: [
        {
          index: 0,
          codec_type: "audio",
          codec_name: "mp3",
          channels: 2,
          sample_rate: 44100,
        },
      ],
    },
    ...overrides,
  }
}

/**
 * Creates multiple mock music files for testing
 */
export function createMockMusicFiles(count: number): MediaFile[] {
  return Array.from({ length: count }, (_, index) =>
    createMockMusicFile({
      id: `mock-music-${index + 1}`,
      name: `test-song-${index + 1}.mp3`,
      path: `/test/music/test-song-${index + 1}.mp3`,
      probeData: {
        format: {
          duration: 180 + index * 30,
          size: 5000000 + index * 1000000,
          bit_rate: 320000,
          tags: {
            title: `Test Song ${index + 1}`,
            artist: `Test Artist ${(index % 3) + 1}`,
            album: `Test Album ${(index % 2) + 1}`,
            genre: ["Rock", "Pop", "Jazz"][index % 3],
            date: `202${index % 5}`,
          },
        },
        streams: [
          {
            index: 0,
            codec_type: "audio",
            codec_name: "mp3",
            channels: 2,
            sample_rate: 44100,
          },
        ],
      },
    }),
  )
}

/**
 * Creates a mock MusicResource for testing
 */
export function createMockMusicResource(overrides?: Partial<MusicResource>): MusicResource {
  return {
    id: "resource-1",
    type: "music",
    name: "Test Music Resource",
    resourceId: "mock-music-1",
    file: createMockMusicFile(),
    ...overrides,
  }
}

/**
 * Mock audio context for testing audio playback
 */
export class MockAudioContext {
  state = "running"
  sampleRate = 44100
  currentTime = 0

  createMediaElementSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }))

  createAnalyser = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
  }))

  destination = {
    numberOfInputs: 1,
    numberOfOutputs: 0,
    channelCount: 2,
  }

  close = vi.fn()
  suspend = vi.fn()
  resume = vi.fn()
}

/**
 * Mock HTML audio element for testing
 */
export class MockHTMLAudioElement {
  src = ""
  currentTime = 0
  duration = 180
  paused = true
  volume = 1
  muted = false

  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()

  constructor(src?: string) {
    if (src) {
      this.src = src
    }
  }
}

/**
 * Helper to setup audio mocks globally
 */
export function setupAudioMocks() {
  // @ts-expect-error - Mocking global Audio constructor for tests
  global.Audio = MockHTMLAudioElement
  // @ts-expect-error - Mocking global AudioContext for tests
  global.AudioContext = MockAudioContext
  // @ts-expect-error - Mocking webkit prefixed AudioContext for tests
  global.webkitAudioContext = MockAudioContext
}

/**
 * Helper to cleanup audio mocks
 */
export function cleanupAudioMocks() {
  // @ts-expect-error - Removing mocked global Audio constructor
  global.Audio = undefined
  // @ts-expect-error - Removing mocked global AudioContext
  global.AudioContext = undefined
  // @ts-expect-error - Removing mocked webkit AudioContext
  global.webkitAudioContext = undefined
}
