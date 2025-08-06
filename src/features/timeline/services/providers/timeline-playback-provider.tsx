/**
 * Timeline Playback Provider
 * Управление воспроизведением: play, pause, stop, seek, playback rate
 */

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { useTimelineProject } from "./timeline-project-provider"
import type { TimelinePlaybackContextType } from "./types"

const TimelinePlaybackContext = createContext<TimelinePlaybackContextType | null>(null)

interface TimelinePlaybackProviderProps {
  children: ReactNode
}

export function TimelinePlaybackProvider({ children }: TimelinePlaybackProviderProps) {
  const { backend, project } = useTimelineProject()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackRate, setPlaybackRateState] = useState(1)

  // Sync with backend playback state
  useEffect(() => {
    if (backend.projectState?.playback_state) {
      const playbackState = backend.projectState.playback_state
      setIsPlaying(playbackState.is_playing)
      setCurrentTime(playbackState.current_time)
      setPlaybackRateState(playbackState.playback_rate || 1)
    }
  }, [backend.projectState])

  // Playback controls
  const play = useCallback(async () => {
    await backend.executeCommand({ type: "Play" })
  }, [backend])

  const pause = useCallback(async () => {
    await backend.executeCommand({ type: "Pause" })
  }, [backend])

  const stop = useCallback(async () => {
    await backend.executeCommand({ type: "Stop" })
  }, [backend])

  const seek = useCallback(
    async (time: number) => {
      await backend.executeCommand({
        type: "Seek",
        params: { time },
      })
    },
    [backend],
  )

  const setPlaybackRate = useCallback(
    async (rate: number) => {
      await backend.executeCommand({
        type: "SetPlaybackRate",
        params: { rate },
      })
    },
    [backend],
  )

  const contextValue: TimelinePlaybackContextType = useMemo(
    () => ({
      // State
      isPlaying,
      currentTime,
      playbackRate,
      duration: project?.duration || 0,

      // Actions
      play,
      pause,
      stop,
      seek,
      setPlaybackRate,
    }),
    [isPlaying, currentTime, playbackRate, project?.duration, play, pause, stop, seek, setPlaybackRate],
  )

  return <TimelinePlaybackContext.Provider value={contextValue}>{children}</TimelinePlaybackContext.Provider>
}

export function useTimelinePlayback() {
  const context = useContext(TimelinePlaybackContext)
  if (!context) {
    throw new Error("useTimelinePlayback must be used within a TimelinePlaybackProvider")
  }
  return context
}
