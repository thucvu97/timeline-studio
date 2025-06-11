// Simple faker-like utilities for tests
const testUtils = {
  string: {
    uuid: () => `test-id-${Math.random().toString(36).substring(2, 11)}`,
  },
  system: {
    fileName: () => `test-file-${Math.random().toString(36).substring(2, 8)}`,
    filePath: () => `/test/path/file-${Math.random().toString(36).substring(2, 8)}`,
  },
  number: {
    int: (options: { min: number; max: number }) =>
      Math.floor(Math.random() * (options.max - options.min + 1)) + options.min,
    float: (options: { min: number; max: number }) => Math.random() * (options.max - options.min) + options.min,
  },
  date: {
    past: () => new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    recent: () => new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  },
  commerce: {
    productName: () => `Test Product ${Math.random().toString(36).substring(2, 8)}`,
  },
  lorem: {
    word: () => ["test", "sample", "demo", "example"][Math.floor(Math.random() * 4)],
    words: (count: number) => Array.from({ length: count }, () => testUtils.lorem.word()).join(" "),
  },
}

// Basic test data factories with minimal typing
export const factories = {
  mediaFile: (overrides: any = {}): any => ({
    id: testUtils.string.uuid(),
    name: `${testUtils.system.fileName()}.mp4`,
    path: testUtils.system.filePath(),
    duration: testUtils.number.int({ min: 1, max: 300 }),
    size: testUtils.number.int({ min: 1000000, max: 100000000 }),
    width: 1920,
    height: 1080,
    createdAt: testUtils.date.past().toISOString(),
    ...overrides,
  }),

  audioFile: (overrides: any = {}): any =>
    factories.mediaFile({
      name: `${testUtils.system.fileName()}.mp3`,
      width: undefined,
      height: undefined,
      ...overrides,
    }),

  imageFile: (overrides: any = {}): any =>
    factories.mediaFile({
      name: `${testUtils.system.fileName()}.jpg`,
      duration: undefined,
      ...overrides,
    }),

  timelineProject: (overrides: any = {}): any => ({
    id: testUtils.string.uuid(),
    name: testUtils.commerce.productName(),
    duration: 0,
    sections: [],
    globalTracks: [],
    settings: {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      aspectRatio: "16:9",
      sampleRate: 48000,
      channels: 2,
    },
    createdAt: testUtils.date.past(),
    updatedAt: testUtils.date.recent(),
    ...overrides,
  }),

  timelineTrack: (overrides: any = {}): any => ({
    id: testUtils.string.uuid(),
    name: testUtils.lorem.word(),
    type: "video",
    order: testUtils.number.int({ min: 0, max: 10 }),
    clips: [],
    isLocked: false,
    isMuted: false,
    isHidden: false,
    height: 60,
    volume: 1,
    ...overrides,
  }),

  timelineClip: (overrides: any = {}): any => ({
    id: testUtils.string.uuid(),
    trackId: testUtils.string.uuid(),
    mediaId: testUtils.string.uuid(),
    name: testUtils.lorem.word(),
    startTime: 0,
    duration: 10,
    mediaStartTime: 0,
    mediaEndTime: 10,
    volume: 1,
    speed: 1,
    opacity: 1,
    isSelected: false,
    isLocked: false,
    effects: [],
    filters: [],
    transitions: [],
    createdAt: testUtils.date.past(),
    updatedAt: testUtils.date.recent(),
    ...overrides,
  }),

  timelineSection: (overrides: any = {}): any => ({
    id: testUtils.string.uuid(),
    name: testUtils.lorem.words(2),
    index: 0,
    startTime: 0,
    endTime: 30,
    duration: 30,
    tracks: [],
    isCollapsed: false,
    ...overrides,
  }),
}

// Preset scenarios for common test cases
export const scenarios = {
  populatedTimeline: (): any => {
    const videoTrack = factories.timelineTrack({ type: "video", order: 0, name: "Video Track 1" })
    const audioTrack = factories.timelineTrack({ type: "audio", order: 1, name: "Audio Track 1" })

    const videoClips = Array.from({ length: 3 }, (_, i) =>
      factories.timelineClip({
        trackId: videoTrack.id,
        startTime: i * 10,
        duration: 10,
        mediaId: testUtils.string.uuid(),
      }),
    )

    videoTrack.clips = videoClips

    return factories.timelineProject({
      globalTracks: [videoTrack, audioTrack],
      duration: 30,
    })
  },

  mediaLibrary: (count = 10) => {
    const videoFiles = Array.from({ length: Math.floor(count * 0.6) }, () => factories.mediaFile())
    const audioFiles = Array.from({ length: Math.floor(count * 0.3) }, () => factories.audioFile())
    const imageFiles = Array.from({ length: Math.floor(count * 0.1) }, () => factories.imageFile())

    return [...videoFiles, ...audioFiles, ...imageFiles]
  },

  emptyProject: (): any =>
    factories.timelineProject({
      globalTracks: [
        factories.timelineTrack({ type: "video", order: 0 }),
        factories.timelineTrack({ type: "audio", order: 1 }),
      ],
    }),
}

// Helper functions for creating related entities
export const helpers = {
  createMediaWithClip: (mediaOverrides = {}, clipOverrides = {}) => {
    const media = factories.mediaFile(mediaOverrides)
    const clip = factories.timelineClip({
      mediaId: media.id,
      duration: media.duration || 10,
      mediaEndTime: media.duration || 10,
      ...clipOverrides,
    })
    return { media, clip }
  },

  createTrackWithClips: (trackOverrides = {}, clipCount = 3) => {
    const track = factories.timelineTrack(trackOverrides)
    const clips = Array.from({ length: clipCount }, (_, i) =>
      factories.timelineClip({
        trackId: track.id,
        startTime: i * 10,
        duration: 10,
      }),
    )
    track.clips = clips
    return track
  },
}
