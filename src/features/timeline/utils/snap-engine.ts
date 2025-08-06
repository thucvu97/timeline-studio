import type { TimelineClip, TimelineProject, TimelineTrack } from "../types"
import type { SnapPoint } from "../types/edit-modes"

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
  snapToGuides: boolean
  snapToBeats: boolean
  gridInterval: number // in seconds
}

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  enabled: true,
  threshold: 10,
  snapToGrid: true,
  snapToClips: true,
  snapToMarkers: true,
  snapToPlayhead: true,
  snapToGuides: true,
  snapToBeats: false, // Disabled by default as it requires audio analysis
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

  // Find the clip's track to get its order
  const clipTrack = tracks.find((t) => t.id === clip.trackId)
  const clipTrackOrder = clipTrack?.order ?? 0

  tracks.forEach((track) => {
    track.clips.forEach((otherClip) => {
      if (otherClip.id === clip.id) return

      // Check if clips are on nearby tracks (for magnetic behavior)
      const trackDistance = Math.abs(track.order - clipTrackOrder)
      const magnetStrength = trackDistance === 0 ? 1.0 : trackDistance === 1 ? 0.8 : 0.6

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

      // Add snap to clip center (new snap point)
      const clipCenter = otherClip.startTime + otherClip.duration / 2
      snapPoints.push({
        position: clipCenter * timeScale,
        type: "clip",
        strength: magnetStrength * 0.7, // Slightly weaker than edges
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

/**
 * Generate snap points for timeline guides (thirds, quarters, custom guides)
 */
export interface TimelineGuide {
  id: string
  position: number // in seconds
  type: "thirds" | "quarters" | "custom"
  color?: string
}

export function generateGuideSnapPoints(
  projectDuration: number,
  guides: TimelineGuide[],
  timeScale: number,
  includeThirds = true,
  includeQuarters = true,
): SnapPoint[] {
  const snapPoints: SnapPoint[] = []

  // Add thirds
  if (includeThirds) {
    const thirdDuration = projectDuration / 3
    for (let i = 1; i <= 2; i++) {
      snapPoints.push({
        position: thirdDuration * i * timeScale,
        type: "guide",
        strength: 0.7,
      })
    }
  }

  // Add quarters
  if (includeQuarters) {
    const quarterDuration = projectDuration / 4
    for (let i = 1; i <= 3; i++) {
      snapPoints.push({
        position: quarterDuration * i * timeScale,
        type: "guide",
        strength: 0.6,
      })
    }
  }

  // Add custom guides
  guides.forEach((guide) => {
    snapPoints.push({
      position: guide.position * timeScale,
      type: "guide",
      strength: 0.9,
    })
  })

  return snapPoints
}

/**
 * Enhanced magnetic alignment for group operations
 * Supports multiple clips moving together
 */
export interface GroupMagneticAlignment {
  targetTrack: TimelineTrack | null
  targetTime: number
  offsetPerClip: Map<string, number> // clip id -> time offset
  strength: number
}

export function findGroupMagneticAlignment(
  clips: TimelineClip[],
  tracks: TimelineTrack[],
  draggedClipId: string,
  currentTime: number,
  currentTrackIndex: number,
  timeScale: number,
  config: SnapConfig = DEFAULT_SNAP_CONFIG,
): GroupMagneticAlignment {
  if (!config.enabled || !config.snapToClips || clips.length === 0) {
    return {
      targetTrack: tracks[currentTrackIndex] || null,
      targetTime: currentTime,
      offsetPerClip: new Map(),
      strength: 0,
    }
  }

  // Find the dragged clip
  const draggedClip = clips.find((c) => c.id === draggedClipId)
  if (!draggedClip) {
    return {
      targetTrack: tracks[currentTrackIndex] || null,
      targetTime: currentTime,
      offsetPerClip: new Map(),
      strength: 0,
    }
  }

  // Calculate relative positions of all clips to the dragged one
  const clipOffsets = new Map<string, number>()
  clips.forEach((clip) => {
    clipOffsets.set(clip.id, clip.startTime - draggedClip.startTime)
  })

  let bestAlignment: GroupMagneticAlignment = {
    targetTrack: tracks[currentTrackIndex] || null,
    targetTime: currentTime,
    offsetPerClip: clipOffsets,
    strength: 0,
  }

  // Check for alignment opportunities
  const nearbyTracks = tracks.filter((_, index) => Math.abs(index - currentTrackIndex) <= 2)

  nearbyTracks.forEach((track) => {
    // Get all clips on this track except the ones we're moving
    const targetClips = track.clips.filter((c) => !clips.some((mc) => mc.id === c.id))

    // Check each moving clip for alignment
    clips.forEach((movingClip) => {
      const clipOffset = clipOffsets.get(movingClip.id) ?? 0
      const clipTime = currentTime + clipOffset

      targetClips.forEach((targetClip) => {
        // Check alignment with target clip edges
        const alignmentPoints = [
          { time: targetClip.startTime, type: "start" },
          { time: targetClip.startTime + targetClip.duration, type: "end" },
          { time: targetClip.startTime + targetClip.duration / 2, type: "center" },
        ]

        alignmentPoints.forEach((point) => {
          const timeDiff = Math.abs(clipTime - point.time)

          if (timeDiff < config.threshold / timeScale) {
            const strength = 1 - (timeDiff * timeScale) / config.threshold

            if (strength > bestAlignment.strength) {
              // Calculate new position that would align this clip
              const alignedDraggedTime = currentTime - (clipTime - point.time)

              // Update all clip offsets
              const newOffsets = new Map<string, number>()
              clips.forEach((clip) => {
                const offset = clipOffsets.get(clip.id) ?? 0
                newOffsets.set(clip.id, offset)
              })

              bestAlignment = {
                targetTrack: track,
                targetTime: alignedDraggedTime,
                offsetPerClip: newOffsets,
                strength,
              }
            }
          }
        })
      })
    })
  })

  return bestAlignment
}

/**
 * Find rhythm-based snap points for music synchronization
 * This is a placeholder for future beat detection integration
 */
export function findRhythmSnapPoints(
  audioAnalysis: {
    bpm?: number
    beats?: number[]
    measures?: number[]
  },
  timeScale: number,
  startTime = 0,
  endTime = Number.POSITIVE_INFINITY,
): SnapPoint[] {
  const snapPoints: SnapPoint[] = []

  // If we have beat positions, use them
  if (audioAnalysis.beats) {
    audioAnalysis.beats
      .filter((beat) => beat >= startTime && beat <= endTime)
      .forEach((beat) => {
        snapPoints.push({
          position: beat * timeScale,
          type: "beat",
          strength: 0.8,
        })
      })
  }

  // If we have measure positions, use them with higher strength
  if (audioAnalysis.measures) {
    audioAnalysis.measures
      .filter((measure) => measure >= startTime && measure <= endTime)
      .forEach((measure) => {
        snapPoints.push({
          position: measure * timeScale,
          type: "measure",
          strength: 1.0,
        })
      })
  }

  // If we only have BPM, generate beat positions
  if (audioAnalysis.bpm && !audioAnalysis.beats) {
    const beatInterval = 60 / audioAnalysis.bpm
    let beatTime = Math.ceil(startTime / beatInterval) * beatInterval

    while (beatTime <= endTime) {
      snapPoints.push({
        position: beatTime * timeScale,
        type: "beat",
        strength: 0.7,
      })
      beatTime += beatInterval
    }
  }

  return snapPoints
}
