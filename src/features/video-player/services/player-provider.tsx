import { createContext, useContext, useEffect } from "react"

import { useMachine } from "@xstate/react"

import { MediaFile } from "@/features/media/types/media"
import { useUserSettings } from "@/features/user-settings"

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
  // Получаем доступ к пользовательским настройкам
  const userSettings = useUserSettings()

  // Инициализируем машину состояний
  const [state, send] = useMachine(playerMachine)

  // Устанавливаем громкость из пользовательских настроек при монтировании
  useEffect(() => {
    if (userSettings.playerVolume >= 0) {
      console.log("[PlayerProvider] Initializing volume from user settings:", userSettings.playerVolume)
      send({ type: "setVolume", volume: userSettings.playerVolume })
    }
  }, [userSettings.playerVolume, send])

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
    setVolume: (volume: number) => {
      // Обновляем громкость в машине состояний
      send({ type: "setVolume", volume })

      // Обновляем громкость в пользовательских настройках
      userSettings.handlePlayerVolumeChange(volume)

      console.log("[PlayerProvider] Volume updated:", volume)
    },
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
