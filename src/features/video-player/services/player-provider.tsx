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
  setPrerenderSettings: (settings: {
    prerenderEnabled?: boolean
    prerenderQuality?: number
    prerenderSegmentDuration?: number
    prerenderApplyEffects?: boolean
    prerenderAutoPrerender?: boolean
  }) => void
  setPreviewMedia: (media: MediaFile | null) => void
  setVideoSource: (source: "browser" | "timeline") => void
  // Новые методы для применения эффектов/фильтров/шаблонов
  applyEffect: (effect: { id: string; name: string; params: any }) => void
  applyFilter: (filter: { id: string; name: string; params: any }) => void
  applyTemplate: (template: { id: string; name: string }, files: MediaFile[]) => void
  clearEffects: () => void
  clearFilters: () => void
  clearTemplate: () => void
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
    setPrerenderSettings: (settings: {
      prerenderEnabled?: boolean
      prerenderQuality?: number
      prerenderSegmentDuration?: number
      prerenderApplyEffects?: boolean
      prerenderAutoPrerender?: boolean
    }) => send({ type: "setPrerenderSettings", ...settings }),
    setPreviewMedia: (media: MediaFile | null) => {
      console.log("[PlayerProvider] Setting preview media:", media?.name)
      send({ type: "setPreviewMedia", media })
      // Если передано видео, устанавливаем его как текущее
      if (media) {
        send({ type: "setVideo", video: media })
      }
    },
    setVideoSource: (source: "browser" | "timeline") => {
      console.log("[PlayerProvider] Setting video source:", source)
      send({ type: "setVideoSource", source })
    },
    // Новые методы для применения эффектов/фильтров/шаблонов
    applyEffect: (effect: { id: string; name: string; params: any }) => {
      console.log("[PlayerProvider] Applying effect:", effect.name)
      send({ type: "applyEffect", effect })
    },
    applyFilter: (filter: { id: string; name: string; params: any }) => {
      console.log("[PlayerProvider] Applying filter:", filter.name)
      send({ type: "applyFilter", filter })
    },
    applyTemplate: (template: { id: string; name: string }, files: MediaFile[]) => {
      console.log("[PlayerProvider] Applying template:", template.name, "with", files.length, "files")
      send({ type: "applyTemplate", template, files })
    },
    clearEffects: () => {
      console.log("[PlayerProvider] Clearing effects")
      send({ type: "clearEffects" })
    },
    clearFilters: () => {
      console.log("[PlayerProvider] Clearing filters")
      send({ type: "clearFilters" })
    },
    clearTemplate: () => {
      console.log("[PlayerProvider] Clearing template")
      send({ type: "clearTemplate" })
    },
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
