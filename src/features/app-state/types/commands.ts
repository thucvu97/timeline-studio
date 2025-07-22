/**
 * Command types that match the Rust backend commands
 */

import { MediaType, ProjectSettings, TrackType } from "./unified-project"

// Base command types
export type ProjectCommand =
  // Project commands
  | { type: "CreateProject"; params: { name: string; settings: ProjectSettings } }
  | { type: "OpenProject"; params: { path: string } }
  | { type: "SaveProject"; params: { path?: string } }
  | { type: "CloseProject"; params: Record<string, never> }

  // Timeline commands
  | { type: "AddTrack"; params: { name: string; trackType: TrackType; index?: number } }
  | { type: "DeleteTrack"; params: { trackId: string } }
  | { type: "UpdateTrack"; params: { trackId: string; updates: TrackUpdates } }

  // Clip commands
  | { type: "AddClip"; params: { trackId: string; mediaId: string; time: number } }
  | { type: "MoveClip"; params: { clipId: string; trackId: string; time: number } }
  | { type: "TrimClip"; params: { clipId: string; start: number; end: number } }
  | { type: "DeleteClip"; params: { clipId: string } }
  | { type: "UpdateClip"; params: { clipId: string; updates: ClipUpdates } }

  // Media pool commands
  | { type: "AddMedia"; params: { path: string; mediaType: MediaType } }
  | { type: "RemoveMedia"; params: { mediaId: string } }
  | { type: "UpdateMedia"; params: { mediaId: string; updates: MediaUpdates } }

  // Playback commands
  | { type: "Play"; params: Record<string, never> }
  | { type: "Pause"; params: Record<string, never> }
  | { type: "Stop"; params: Record<string, never> }
  | { type: "Seek"; params: { time: number } }
  | { type: "SetPlaybackRate"; params: { rate: number } }

  // Player commands
  | { type: "PlayerSetMedia"; params: { mediaId: string; startTime?: number } }
  | { type: "PlayerSetVolume"; params: { volume: number } }
  | { type: "PlayerSelectClip"; params: { clipId: string } }
  | { type: "PlayerClearSelection"; params: Record<string, never> }
  | { type: "PlayerSetSource"; params: { source: "browser" | "timeline" } }
  | { type: "PlayerApplyEffect"; params: { effectId: string; params: Record<string, any> } }
  | { type: "PlayerApplyFilter"; params: { filterId: string; params: Record<string, any> } }
  | { type: "PlayerApplyTemplate"; params: { templateId: string; mediaIds: string[] } }
  | { type: "PlayerClearEffects"; params: Record<string, never> }
  | { type: "PlayerClearFilters"; params: Record<string, never> }
  | { type: "PlayerClearTemplate"; params: Record<string, never> }

  // Selection commands
  | { type: "SelectClips"; params: { clipIds: string[]; addToSelection: boolean } }
  | { type: "SelectTracks"; params: { trackIds: string[]; addToSelection: boolean } }
  | { type: "ClearSelection"; params: Record<string, never> }

// Update structures
export interface TrackUpdates {
  name?: string
  enabled?: boolean
  locked?: boolean
  volume?: number
  height?: number
}

export interface ClipUpdates {
  name?: string
  playbackRate?: number
  volume?: number
  enabled?: boolean
}

export interface MediaUpdates {
  name?: string
}

// Command result
export interface CommandResult {
  success: boolean
  error?: string
  data?: any
}
