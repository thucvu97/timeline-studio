import { useEffect } from "react"

import { useTimeline } from "@/features/timeline/hooks"
import type { TimelineTrack } from "@/features/timeline/types"

import type { AudioChannel, ChannelEffect } from "../types"

/**
 * Converts timeline effects to channel effects
 */
function convertTrackEffects(track: TimelineTrack): ChannelEffect[] {
  const effects: ChannelEffect[] = []

  // Check if track has effects property
  if (!track.trackEffects || !Array.isArray(track.trackEffects)) {
    return effects
  }

  // Convert each effect
  track.trackEffects.forEach((appliedEffect, index) => {
    // Map timeline effect types to audio effect types
    let effectType: "eq" | "compressor" | "reverb" | "delay" | "gate" | undefined

    // Check if we have effect details
    if (appliedEffect.effect) {
      switch (appliedEffect.effect.type) {
        case "equalizer":
        case "eq":
        case "audio-eq":
          effectType = "eq"
          break
        case "compressor":
        case "dynamics":
        case "audio-compressor":
          effectType = "compressor"
          break
        case "reverb":
        case "ambience":
        case "audio-reverb":
          effectType = "reverb"
          break
        case "delay":
        case "echo":
        case "audio-delay":
          effectType = "delay"
          break
        case "gate":
        case "noise-gate":
        case "audio-gate":
          effectType = "gate"
          break
        default:
          // Unknown effect type, effectType remains undefined
          break
      }
    }

    if (effectType) {
      effects.push({
        id: appliedEffect.id || `effect-${index}`,
        type: effectType,
        enabled: appliedEffect.enabled !== false,
        parameters: appliedEffect.settings || {},
      })
    }
  })

  return effects
}

/**
 * Converts timeline audio tracks to mixer channels
 */
export function convertTrackToChannel(track: TimelineTrack): AudioChannel | null {
  // Only process audio tracks
  const audioTypes = ["audio", "music", "voiceover", "sfx", "ambient"]
  if (!audioTypes.includes(track.type)) {
    return null
  }

  return {
    id: track.id,
    name: track.name,
    type: "stereo", // Default to stereo, could be enhanced later
    volume: track.volume * 100, // Convert 0-1 to 0-100
    pan: track.pan * 100, // Convert -1 to 1 to -100 to 100
    muted: track.isMuted,
    solo: track.isSolo,
    armed: false, // Recording armed state, not in timeline yet
    trackId: track.id,
    effects: convertTrackEffects(track),
    sends: [],
    eq: {
      enabled: false,
      bands: [],
    },
  }
}

/**
 * Hook to sync timeline audio tracks with mixer
 */
export function useTimelineMixerSync(onChannelsUpdate: (channels: AudioChannel[]) => void) {
  const timeline = useTimeline()

  useEffect(() => {
    if (!timeline.project) return

    // Get all audio tracks from all sections
    const audioChannels: AudioChannel[] = []

    timeline.project.sections.forEach((section) => {
      section.tracks.forEach((track) => {
        const channel = convertTrackToChannel(track)
        if (channel) {
          audioChannels.push(channel)
        }
      })
    })

    // Update mixer with timeline tracks
    onChannelsUpdate(audioChannels)
  }, [timeline.project, onChannelsUpdate])

  // Return functions to update timeline from mixer
  const updateTrackFromMixer = (channelId: string, updates: Partial<AudioChannel>) => {
    if (!timeline.project) return

    const timelineUpdates: Partial<TimelineTrack> = {}

    if (updates.volume !== undefined) {
      timelineUpdates.volume = updates.volume / 100 // Convert back to 0-1
    }
    if (updates.pan !== undefined) {
      timelineUpdates.pan = updates.pan / 100 // Convert back to -1 to 1
    }
    if (updates.muted !== undefined) {
      timelineUpdates.isMuted = updates.muted
    }
    if (updates.solo !== undefined) {
      timelineUpdates.isSolo = updates.solo
    }

    // Update timeline track
    timeline.updateTrack(channelId, timelineUpdates)
  }

  return {
    updateTrackFromMixer,
    project: timeline.project,
  }
}
