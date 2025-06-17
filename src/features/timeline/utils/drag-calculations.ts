/**
 * Utilities for drag and drop position calculations
 */

import { MediaFile } from "@/features/media/types/media"

import { TrackType } from "../types"

/**
 * Calculate timeline position from mouse coordinates
 */
export function calculateTimelinePosition(
  mouseX: number,
  containerRect: DOMRect,
  scrollLeft: number,
  timeScale: number,
): number {
  // Get relative position within the container
  const relativeX = mouseX - containerRect.left + scrollLeft
  
  // Convert pixels to time using the time scale
  const timePosition = Math.max(0, relativeX / timeScale)
  
  return timePosition
}

/**
 * Snap position to grid if snap mode is enabled
 */
export function snapToGrid(
  position: number,
  snapMode: "none" | "grid" | "clips" | "markers",
  gridInterval = 1, // seconds
): number {
  if (snapMode === "none") {
    return position
  }
  
  if (snapMode === "grid") {
    return Math.round(position / gridInterval) * gridInterval
  }
  
  // For now, only implement grid snapping
  // TODO: Implement clip and marker snapping
  return position
}

/**
 * Check if a media file can be dropped on a track type
 */
export function canDropOnTrack(mediaFile: MediaFile, trackType: TrackType): boolean {
  // Video files can go on video tracks
  if (mediaFile.isVideo && trackType === "video") {
    return true
  }
  
  // Audio files can go on audio tracks
  if (mediaFile.isAudio && (trackType === "audio" || trackType === "music")) {
    return true
  }
  
  // Image files can go on video tracks (as static images)
  if (mediaFile.isImage && trackType === "video") {
    return true
  }
  
  return false
}

/**
 * Get the appropriate track type for a media file
 */
export function getTrackTypeForMediaFile(mediaFile: MediaFile): TrackType {
  if (mediaFile.isVideo) {
    return "video"
  }
  
  if (mediaFile.isAudio) {
    return "audio"
  }
  
  if (mediaFile.isImage) {
    return "video" // Images are displayed on video tracks
  }
  
  // Check metadata if available
  if (mediaFile.probeData?.streams) {
    const hasVideo = mediaFile.probeData.streams.some((stream) => stream.codec_type === "video")
    const hasAudio = mediaFile.probeData.streams.some((stream) => stream.codec_type === "audio")
    
    if (hasVideo) return "video"
    if (hasAudio) return "audio"
  }
  
  // Default to video track
  return "video"
}

/**
 * Find insertion point avoiding overlaps with existing clips
 */
export function findInsertionPoint(
  targetTime: number,
  trackId: string,
  clipDuration: number,
  // TODO: Add clips parameter when we have access to track clips
): number {
  // For now, just return the target time
  // TODO: Implement overlap detection and automatic positioning
  return Math.max(0, targetTime)
}