import { useCallback, useEffect, useRef, useState } from "react"

import { useTimeline } from "@/features/timeline/hooks"

import { useAudioEngine } from "./use-audio-engine"
import { AudioFileManager } from "../services/audio-file-manager"

export function useChannelAudio(channelId: string, trackId?: string) {
  const timeline = useTimeline()
  const fileManagerRef = useRef(new AudioFileManager())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const { connectMediaElement, isInitialized } = useAudioEngine()

  // Find audio clips for this track
  const getAudioClipsForTrack = useCallback(() => {
    if (!timeline.project || !trackId) return []

    const clips: Array<{ id: string; mediaId: string; startTime: number }> = []

    timeline.project.sections.forEach((section) => {
      section.tracks.forEach((track) => {
        if (track.id === trackId) {
          track.clips.forEach((clip) => {
            if (clip.mediaId) {
              clips.push({
                id: clip.id,
                mediaId: clip.mediaId,
                startTime: clip.startTime,
              })
            }
          })
        }
      })
    })

    return clips
  }, [timeline.project, trackId])

  // Load audio file for the first clip (simplified for now)
  useEffect(() => {
    if (!trackId || !isInitialized) return

    const loadAudio = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const clips = getAudioClipsForTrack()
        console.log(`[AudioLoader] Found ${clips.length} clips for track ${trackId}`)

        if (clips.length === 0) {
          setAudioElement(null)
          return
        }

        // For now, just load the first clip
        // TODO: Handle multiple clips and timeline positioning
        const firstClip = clips[0]
        console.log(`[AudioLoader] Loading clip ${firstClip.id} with media ${firstClip.mediaId}`)

        // Get media file path from project resources
        const mediaFile = timeline.project?.resources?.media?.find((m) => m.id === firstClip.mediaId)
        if (!mediaFile) {
          console.error(`[AudioLoader] Media file ${firstClip.mediaId} not found in project resources`)
          throw new Error(`Media file ${firstClip.mediaId} not found`)
        }

        // Check if it's actually an audio file
        if (!mediaFile.isAudio) {
          console.warn(`[AudioLoader] Media file ${firstClip.mediaId} is not marked as audio`)
        }

        console.log(`[AudioLoader] Loading audio from: ${mediaFile.path}`)

        // Load audio file
        const audioFile = await fileManagerRef.current.loadAudioFile(firstClip.mediaId, mediaFile.path)

        if (audioFile.element) {
          setAudioElement(audioFile.element)

          // Connect to audio engine
          connectMediaElement(channelId, audioFile.element)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audio")
        setAudioElement(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadAudio()

    // Cleanup
    return () => {
      if (trackId) {
        fileManagerRef.current.unloadAll()
      }
    }
  }, [trackId, channelId, isInitialized, connectMediaElement, getAudioClipsForTrack, timeline.project])

  // Playback control
  const play = useCallback(() => {
    if (audioElement && timeline.isPlaying) {
      audioElement.currentTime = timeline.currentTime
      void audioElement.play()
    }
  }, [audioElement, timeline.isPlaying, timeline.currentTime])

  const pause = useCallback(() => {
    if (audioElement) {
      audioElement.pause()
    }
  }, [audioElement])

  const seek = useCallback(
    (time: number) => {
      if (audioElement) {
        audioElement.currentTime = time
      }
    },
    [audioElement],
  )

  // Sync with timeline playback
  useEffect(() => {
    if (timeline.isPlaying) {
      play()
    } else {
      pause()
    }
  }, [timeline.isPlaying, play, pause])

  // Sync with timeline seek
  useEffect(() => {
    seek(timeline.currentTime)
  }, [timeline.currentTime, seek])

  return {
    isLoading,
    error,
    audioElement,
    play,
    pause,
    seek,
  }
}
