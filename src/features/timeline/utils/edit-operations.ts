import { TimelineClip, TimelineTrack } from "../types"
import { DEFAULT_EDIT_CONSTRAINTS, EditConstraints } from "../types/edit-modes"

/**
 * Check if two clips overlap in time
 */
export function clipsOverlap(clip1: TimelineClip, clip2: TimelineClip): boolean {
  return clip1.startTime < clip2.startTime + clip2.duration && clip1.startTime + clip1.duration > clip2.startTime
}

/**
 * Find potential collision points for a clip move/resize operation
 */
export function findCollisions(
  clip: TimelineClip,
  otherClips: TimelineClip[],
  constraints: EditConstraints = DEFAULT_EDIT_CONSTRAINTS,
): TimelineClip[] {
  if (constraints.allowOverlap) return []

  return otherClips.filter((other) => other.id !== clip.id && clipsOverlap(clip, other))
}

/**
 * Calculate valid trim bounds for a clip
 */
export function getClipTrimBounds(
  clip: TimelineClip,
  edge: "start" | "end",
  track: TimelineTrack,
  constraints: EditConstraints = DEFAULT_EDIT_CONSTRAINTS,
): { min: number; max: number } {
  const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)
  const clipIndex = sortedClips.findIndex((c) => c.id === clip.id)

  if (edge === "start") {
    // Minimum is constrained by previous clip or 0
    const prevClip = clipIndex > 0 ? sortedClips[clipIndex - 1] : null
    const min = prevClip && !constraints.allowOverlap ? prevClip.startTime + prevClip.duration : 0

    // Maximum is constrained by minimum clip duration
    const max = clip.startTime + clip.duration - constraints.minClipDuration

    return { min, max }
  }
  // Minimum is constrained by minimum clip duration
  const min = clip.startTime + constraints.minClipDuration

  // Maximum is constrained by next clip or infinity
  const nextClip = clipIndex < sortedClips.length - 1 ? sortedClips[clipIndex + 1] : null
  const max = nextClip && !constraints.allowOverlap ? nextClip.startTime : Number.POSITIVE_INFINITY

  return { min, max }
}

/**
 * Find clips that would be affected by a ripple edit
 */
export function findRippleAffectedClips(
  editClip: TimelineClip,
  track: TimelineTrack,
  rippleTime: number,
): TimelineClip[] {
  return track.clips.filter((clip) => {
    return clip.id !== editClip.id && clip.startTime >= rippleTime
  })
}

/**
 * Calculate the time delta for a roll edit between two clips
 */
export function calculateRollDelta(
  clip1: TimelineClip,
  clip2: TimelineClip,
  targetTime: number,
  constraints: EditConstraints = DEFAULT_EDIT_CONSTRAINTS,
): number | null {
  // Clips must be adjacent for roll edit
  if (Math.abs(clip1.startTime + clip1.duration - clip2.startTime) > 0.001) {
    return null
  }

  const editPoint = clip2.startTime
  const delta = targetTime - editPoint

  // Check constraints
  const newClip1Duration = clip1.duration + delta
  const newClip2Duration = clip2.duration - delta

  if (newClip1Duration < constraints.minClipDuration || newClip2Duration < constraints.minClipDuration) {
    return null
  }

  return delta
}

/**
 * Calculate slip bounds for a clip (how far content can be slipped)
 */
export function getSlipBounds(clip: TimelineClip): { min: number; max: number } {
  // Assume media duration is available on the clip
  const mediaDuration = clip.mediaDuration || clip.duration

  // Min slip: negative of current offset
  const min = -clip.offset

  // Max slip: media duration minus current visible portion
  const max = mediaDuration - clip.offset - clip.duration

  return { min, max }
}

/**
 * Find adjacent clips for slide edit
 */
export function findSlideAdjacentClips(
  clip: TimelineClip,
  track: TimelineTrack,
): { prev: TimelineClip | null; next: TimelineClip | null } {
  const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)
  const clipIndex = sortedClips.findIndex((c) => c.id === clip.id)

  return {
    prev: clipIndex > 0 ? sortedClips[clipIndex - 1] : null,
    next: clipIndex < sortedClips.length - 1 ? sortedClips[clipIndex + 1] : null,
  }
}

/**
 * Calculate valid slide bounds for a clip
 */
export function getSlideBounds(
  clip: TimelineClip,
  track: TimelineTrack,
  constraints: EditConstraints = DEFAULT_EDIT_CONSTRAINTS,
): { min: number; max: number } {
  const { prev, next } = findSlideAdjacentClips(clip, track)

  // Min is constrained by previous clip
  const min = prev ? prev.startTime + constraints.minClipDuration - clip.startTime : -clip.startTime

  // Max is constrained by next clip
  const max = next
    ? next.startTime + next.duration - constraints.minClipDuration - (clip.startTime + clip.duration)
    : Number.POSITIVE_INFINITY

  return { min, max }
}

/**
 * Sort clips by start time
 */
export function sortClipsByTime(clips: TimelineClip[]): TimelineClip[] {
  return [...clips].sort((a, b) => a.startTime - b.startTime)
}

/**
 * Get clips in a time range
 */
export function getClipsInRange(clips: TimelineClip[], startTime: number, endTime: number): TimelineClip[] {
  return clips.filter((clip) => {
    const clipEnd = clip.startTime + clip.duration
    return clip.startTime < endTime && clipEnd > startTime
  })
}

/**
 * Validate an edit operation
 */
export interface EditValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface EditParams {
  clipId: string
  delta: number
  edge?: "start" | "end"
  targetTrackId?: string
  adjacentClipId?: string
}

export function validateEdit(
  operation: string,
  params: EditParams,
  track: TimelineTrack,
  constraints: EditConstraints = DEFAULT_EDIT_CONSTRAINTS,
): EditValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Common validations
  if (!track) {
    errors.push("Track not found")
    return { valid: false, errors, warnings }
  }

  switch (operation) {
    case "trim":
      const trimClip = track.clips.find((c) => c.id === params.clipId)
      if (!trimClip) {
        errors.push("Clip not found")
      } else {
        const newDuration =
          params.edge === "start" ? trimClip.duration - params.delta : trimClip.duration + params.delta

        if (newDuration < constraints.minClipDuration) {
          errors.push(`Clip duration would be less than minimum (${constraints.minClipDuration} frames)`)
        }

        // Check for overlaps
        const testClip = {
          ...trimClip,
          startTime: params.edge === "start" ? trimClip.startTime + params.delta : trimClip.startTime,
          duration: newDuration,
        }

        const collisions = findCollisions(testClip, track.clips, constraints)
        if (collisions.length > 0) {
          errors.push(`Operation would cause overlap with ${collisions.length} clip(s)`)
        }
      }
      break

    case "ripple":
      // Ripple validation
      const rippleClip = track.clips.find((c) => c.id === params.clipId)
      if (!rippleClip) {
        errors.push("Clip not found")
      } else {
        const affectedClips = findRippleAffectedClips(rippleClip, track, rippleClip.startTime + rippleClip.duration)

        if (affectedClips.length > 0) {
          warnings.push(`Ripple will affect ${affectedClips.length} downstream clips`)
        }
      }
      break

    // Add more operation validations as needed
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
