import { MediaFile } from "@/features/media/types/media"

import { TimelineClip, TimelineTrack, TrackType } from "../types"

// Test data creation utilities

export const createMockMediaFile = (id = "media-1"): MediaFile => ({
  id,
  name: "test-video.mp4",
  path: "/path/to/test-video.mp4",
  duration: 100,
  size: 1000000,
  isVideo: true,
  createdAt: new Date().toISOString(),
})

export const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: "clip-1",
  name: "Test Clip",
  mediaId: "media-1",
  mediaFile: createMockMediaFile("media-1"),
  trackId: "track-1",
  startTime: 10,
  duration: 20,
  mediaStartTime: 5,
  mediaEndTime: 25,
  offset: 0,
  volume: 1,
  speed: 1,
  isReversed: false,
  opacity: 1,
  effects: [],
  filters: [],
  transitions: [],
  isSelected: false,
  isLocked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockTrack = (overrides: Partial<TimelineTrack> = {}): TimelineTrack => ({
  id: "track-1",
  type: TrackType.VIDEO,
  order: 0,
  height: 100,
  name: "Video Track 1",
  clips: [],
  isVisible: true,
  isLocked: false,
  isCollapsed: false,
  isMuted: false,
  volume: 1,
  parentId: undefined,
  children: [],
  ...overrides,
})

// Helper to create multiple clips
export const createMockClips = (count: number, overrides: Partial<TimelineClip> = {}): TimelineClip[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockClip({
      id: `clip-${i + 1}`,
      name: `Clip ${i + 1}`,
      startTime: i * 10,
      ...overrides,
    }),
  )
}

// Helper to create multiple tracks
export const createMockTracks = (count: number, type: TrackType = TrackType.VIDEO): TimelineTrack[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockTrack({
      id: `track-${i + 1}`,
      name: `${type} Track ${i + 1}`,
      type,
      order: i,
    }),
  )
}
