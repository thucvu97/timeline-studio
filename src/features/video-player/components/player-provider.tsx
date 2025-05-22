import { createContext, useContext } from "react"

import { useMachine } from "@xstate/react"

import { MediaFile } from "@/types/media"

import { PlayerContextType as MachineContextType, playerMachine } from "./player-machine"

interface PlayerContextType extends MachineContextType {
  setVideo: (video: MediaFile) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setCurrentTime: (currentTime: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setIsSeeking: (isSeeking: boolean) => void
  setIsChangingCamera: (isChangingCamera: boolean) => void
  setIsRecording: (isRecording: boolean) => void
  setVideoLoading: (isLoading: boolean) => void
  setVideoReady: (isReady: boolean) => void
  setIsResizableMode: (isResizableMode: boolean) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

interface PlayerProviderProps {
  children: React.ReactNode
}

// Объявляем глобальный тип для window
declare global {
  interface Window {
    playerContext?: PlayerContextType
    videoElementCache?: Map<string, HTMLVideoElement>
  }
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [state, send] = useMachine(playerMachine)

  const contextValue = {
    ...state.context,
    setCurrentTime: (currentTime: number) => send({ type: "setCurrentTime", currentTime }),
    setIsPlaying: (isPlaying: boolean) => send({ type: "setIsPlaying", isPlaying }),
    setIsSeeking: (isSeeking: boolean) => send({ type: "setIsSeeking", isSeeking }),
    setIsChangingCamera: (isChangingCamera: boolean) => {
      console.log(`[PlayerProvider] setIsChangingCamera: ${isChangingCamera}`)
      send({ type: "setIsChangingCamera", isChangingCamera })
    },
    setIsRecording: (isRecording: boolean) => send({ type: "setIsRecording", isRecording }),
    setVideo: (video: MediaFile) => send({ type: "setVideo", video }),
    setDuration: (duration: number) => send({ type: "setDuration", duration }),
    setVolume: (volume: number) => send({ type: "setVolume", volume }),
    setVideoLoading: (isLoading: boolean) => send({ type: "setVideoLoading", isVideoLoading: isLoading }),
    setVideoReady: (isReady: boolean) => send({ type: "setVideoReady", isVideoReady: isReady }),
    setIsResizableMode: (isResizableMode: boolean) => send({ type: "setIsResizableMode", isResizableMode }),
  }

  // Сохраняем контекст плеера в глобальном объекте window
  // для доступа из других компонентов без использования React контекста
  if (typeof window !== "undefined") {
    window.playerContext = contextValue
  }

  return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerProvider")
  }
  return context
}
