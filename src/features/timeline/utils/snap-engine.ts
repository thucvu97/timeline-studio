import { TimelineClip, TimelineProject, TimelineTrack } from "../types"
import { SnapPoint } from "../types/edit-modes"

/**
 * Configuration for snap behavior
 */
export interface SnapConfig {
  enabled: boolean
  threshold: number // in pixels
  snapToGrid: boolean
  snapToClips: boolean
  snapToMarkers: boolean
  snapToPlayhead: boolean
  gridInterval: number // in seconds
}

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  enabled: true,
  threshold: 10,
  snapToGrid: true,
  snapToClips: true,
  snapToMarkers: true,
  snapToPlayhead: true,
  gridInterval: 1.0, // 1 second grid
}

/**
 * Generate snap points from grid
 */
function generateGridSnapPoints(viewStart: number, viewEnd: number, interval: number, timeScale: number): SnapPoint[] {
  const snapPoints: SnapPoint[] = []
  const start = Math.floor(viewStart / interval) * interval

  for (let time = start; time <= viewEnd; time += interval) {
    snapPoints.push({
      position: time * timeScale,
      type: "grid",
      strength: 0.5,
    })
  }

  return snapPoints
}

/**
 * Generate snap points from clips
 */
function generateClipSnapPoints(tracks: TimelineTrack[], excludeClipId: string | null, timeScale: number): SnapPoint[] {
  const snapPoints: SnapPoint[] = []

  tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      if (clip.id === excludeClipId) return

      // Snap to clip start
      snapPoints.push({
        position: clip.startTime * timeScale,
        type: "clip-start",
        strength: 1.0,
      })

      // Snap to clip end
      snapPoints.push({
        position: (clip.startTime + clip.duration) * timeScale,
        type: "clip-end",
        strength: 1.0,
      })
    })
  })

  return snapPoints
}

/**
 * Generate snap points from markers
 */
function generateMarkerSnapPoints(markers: Array<{ time: number }>, timeScale: number): SnapPoint[] {
  return markers.map((marker) => ({
    position: marker.time * timeScale,
    type: "marker",
    strength: 0.8,
  }))
}

/**
 * Find all snap points for a given context
 */
export function findSnapPoints(
  project: TimelineProject,
  viewStart: number,
  viewEnd: number,
  timeScale: number,
  playheadTime: number,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
  excludeClipId: string | null = null,
): SnapPoint[] {
  const snapPoints: SnapPoint[] = []

  if (!config.enabled) return snapPoints

  // Grid snap points
  if (config.snapToGrid) {
    snapPoints.push(...generateGridSnapPoints(viewStart, viewEnd, config.gridInterval, timeScale))
  }

  // Clip snap points
  if (config.snapToClips) {
    const allTracks = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]
    snapPoints.push(...generateClipSnapPoints(allTracks, excludeClipId, timeScale))
  }

  // Marker snap points
  if (config.snapToMarkers && project.markers) {
    snapPoints.push(...generateMarkerSnapPoints(project.markers, timeScale))
  }

  // Playhead snap point
  if (config.snapToPlayhead) {
    snapPoints.push({
      position: playheadTime * timeScale,
      type: "playhead",
      strength: 0.9,
    })
  }

  return snapPoints
}

/**
 * Find the closest snap point to a position
 */
export function findClosestSnapPoint(position: number, snapPoints: SnapPoint[], threshold: number): SnapPoint | null {
  let closest: SnapPoint | null = null
  let closestDistance = threshold

  for (const snapPoint of snapPoints) {
    const distance = Math.abs(position - snapPoint.position)

    // Apply strength to threshold
    const effectiveThreshold = threshold * (1 + snapPoint.strength)

    if (distance < effectiveThreshold && distance < closestDistance) {
      closest = snapPoint
      closestDistance = distance
    }
  }

  return closest
}

/**
 * Apply snapping to a position
 */
export function snapPosition(
  position: number,
  snapPoints: SnapPoint[],
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
): { position: number; snapped: boolean; snapPoint: SnapPoint | null } {
  if (!config.enabled) {
    return { position, snapped: false, snapPoint: null }
  }

  const snapPoint = findClosestSnapPoint(position, snapPoints, config.threshold)

  if (snapPoint) {
    return {
      position: snapPoint.position,
      snapped: true,
      snapPoint,
    }
  }

  return { position, snapped: false, snapPoint: null }
}

/**
 * Snap a time value considering pixel threshold
 */
export function snapTime(
  time: number,
  snapPoints: SnapPoint[],
  timeScale: number,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
): { time: number; snapped: boolean; snapPoint: SnapPoint | null } {
  const pixelPosition = time * timeScale
  const result = snapPosition(pixelPosition, snapPoints, config)

  return {
    time: result.position / timeScale,
    snapped: result.snapped,
    snapPoint: result.snapPoint,
  }
}

/**
 * Get snap points for clip edges during editing
 */
export function getClipEdgeSnapPoints(
  clip: TimelineClip,
  edge: "start" | "end",
  tracks: TimelineTrack[],
  timeScale: number,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
): SnapPoint[] {
  const snapPoints: SnapPoint[] = []

  if (!config.enabled || !config.snapToClips) return snapPoints

  // Get the position we're dragging
  const dragPosition = edge === "start" ? clip.startTime : clip.startTime + clip.duration

  tracks.forEach((track) => {
    track.clips.forEach((otherClip) => {
      if (otherClip.id === clip.id) return

      // Check if clips are on nearby tracks (for magnetic behavior)
      const trackDistance = Math.abs((track.order - clip.trackId) as any) // TODO: fix type
      const magnetStrength = trackDistance === 0 ? 1.0 : 0.8

      // Snap to other clip edges
      snapPoints.push({
        position: otherClip.startTime * timeScale,
        type: "clip-start",
        strength: magnetStrength,
      })

      snapPoints.push({
        position: (otherClip.startTime + otherClip.duration) * timeScale,
        type: "clip-end",
        strength: magnetStrength,
      })
    })
  })

  return snapPoints
}

/**
 * Calculate magnetic alignment for multi-track operations
 */
export interface MagneticAlignment {
  targetTrack: TimelineTrack | null
  targetTime: number
  strength: number
}

export function findMagneticAlignment(
  sourceClip: TimelineClip,
  tracks: TimelineTrack[],
  currentTime: number,
  currentTrackIndex: number,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
): MagneticAlignment {
  if (!config.enabled || !config.snapToClips) {
    return {
      targetTrack: tracks[currentTrackIndex] || null,
      targetTime: currentTime,
      strength: 0,
    }
  }

  let bestAlignment: MagneticAlignment = {
    targetTrack: tracks[currentTrackIndex] || null,
    targetTime: currentTime,
    strength: 0,
  }

  // Check nearby tracks for magnetic alignment
  const nearbyTracks = tracks.filter((_, index) => Math.abs(index - currentTrackIndex) <= 1)

  nearbyTracks.forEach((track, _index) => {
    const snapPoints = generateClipSnapPoints([track], sourceClip.id, 1)

    // Check alignment with track clips
    snapPoints.forEach((snapPoint) => {
      const timeDiff = Math.abs(currentTime - snapPoint.position)

      if (timeDiff < config.threshold) {
        const strength = 1 - timeDiff / config.threshold

        if (strength > bestAlignment.strength) {
          bestAlignment = {
            targetTrack: track,
            targetTime: snapPoint.position,
            strength,
          }
        }
      }
    })
  })

  return bestAlignment
}
