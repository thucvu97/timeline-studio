/**
 * Event types that match the Rust backend events
 */

// Event data structures
export interface ClipData {
  id: string
  mediaId: string
  name: string
  timelineIn: number
  timelineOut: number
  sourceIn: number
  sourceOut: number
}

export interface ClipChanges {
  name?: string
  playbackRate?: number
  volume?: number
  effects?: string[]
}

export interface TrackData {
  id: string
  name: string
  trackType: string
  index: number
}

export interface TrackChanges {
  name?: string
  enabled?: boolean
  locked?: boolean
  volume?: number
  height?: number
}

export interface MediaData {
  id: string
  path: string
  name: string
  mediaType: string
  duration?: number
}

export interface MediaChanges {
  name?: string
  thumbnail?: string
}

// Event types
export type ProjectEvent =
  // Project lifecycle events
  | { type: 'ProjectCreated'; payload: { projectId: string; name: string } }
  | { type: 'ProjectOpened'; payload: { projectId: string; path: string } }
  | { type: 'ProjectSaved'; payload: { projectId: string; path: string } }
  | { type: 'ProjectClosed'; payload: { projectId: string } }
  
  // Timeline events
  | { type: 'ClipAdded'; payload: { trackId: string; clip: ClipData } }
  | { type: 'ClipMoved'; payload: { clipId: string; newTrackId: string; newTime: number } }
  | { type: 'ClipTrimmed'; payload: { clipId: string; newIn: number; newOut: number } }
  | { type: 'ClipDeleted'; payload: { clipId: string; trackId: string } }
  | { type: 'ClipUpdated'; payload: { clipId: string; changes: ClipChanges } }
  
  // Track events
  | { type: 'TrackAdded'; payload: { track: TrackData } }
  | { type: 'TrackDeleted'; payload: { trackId: string } }
  | { type: 'TrackUpdated'; payload: { trackId: string; changes: TrackChanges } }
  
  // Media pool events
  | { type: 'MediaAdded'; payload: { media: MediaData } }
  | { type: 'MediaRemoved'; payload: { mediaId: string } }
  | { type: 'MediaUpdated'; payload: { mediaId: string; changes: MediaChanges } }
  
  // Playback events
  | { type: 'PlaybackStarted'; payload: { time: number } }
  | { type: 'PlaybackStopped'; payload: { time: number } }
  | { type: 'PlaybackSeeked'; payload: { time: number } }
  | { type: 'PlaybackRateChanged'; payload: { rate: number } }
  
  // UI events (for synchronization)
  | { type: 'SelectionChanged'; payload: { selectedClips: string[]; selectedTracks: string[] } }
  | { type: 'TimelineZoomChanged'; payload: { zoom: number } }
  | { type: 'TimelineScrollChanged'; payload: { scroll: number } }
  
  // State events
  | { type: 'ProjectDirtyStateChanged'; payload: { isDirty: boolean } }
  | { type: 'StateRestored'; payload: { version: number } }

// Event metadata
export interface EventMetadata {
  id: string
  timestamp: string // ISO datetime
  source: string
  version: number
}

// Complete event envelope
export interface EventEnvelope {
  metadata: EventMetadata
  event: ProjectEvent
}