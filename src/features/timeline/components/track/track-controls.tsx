import { Eye, EyeOff, Lock, LockOpen, Volume2, VolumeX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Slider } from "@/components/ui/slider"
import { MediaTrack } from "@/features/media/types"

interface TrackControlsProps {
  track: MediaTrack
  isVisible?: boolean
  isLocked?: boolean
  trackVolume?: number

  trackVolumes?: Record<string, number>
  isMuted?: boolean
  setIsMuted?: (muted: boolean) => void
  volume?: number // Глобальная громкость трека
  setVolume?: (volume: number) => void
  isSolo?: boolean
  setIsSolo?: (trackId: string, solo: boolean) => void
  isHidden?: boolean

  setIsHidden?: (trackId: string, hidden: boolean) => void
  setIsLocked?: (trackId: string, locked: boolean) => void
  setTrackVolume?: (trackId: string, volume: number) => void
  onVisibilityChange?: (visible: boolean) => void
  onLockChange?: (locked: boolean) => void
  onVolumeChange?: (volume: number) => void
}

export function TrackControls({
  track,
  isVisible = true,
  isLocked = false,
  isMuted = false,
  volume = 100,
  setIsMuted = () => {},
  onVisibilityChange,
  onLockChange,
  onVolumeChange,
}: TrackControlsProps) {
  const { t } = useTranslation()

  const handleVisibilityToggle = (): void => {
    const newValue = !isVisible
    onVisibilityChange?.(newValue)
  }

  const handleLockToggle = (): void => {
    const newValue = !isLocked
    onLockChange?.(newValue)
  }

  const handleVolumeToggle = (): void => {
    const newValue = !isMuted
    setIsMuted(newValue)
    const newVolume = newValue ? 0 : volume
    onVolumeChange?.(newVolume)
  }

  const handleVolumeChange = (value: number[]): void => {
    const newVolume = value[0]
    onVolumeChange?.(newVolume)
  }

  // Определяем, является ли трек видео или аудио
  const isVideoTrack = track.videos?.some((video) =>
    video.probeData?.streams?.some((stream) => stream.codec_type === "video"),
  )

  return (
    <div className="flex w-[130px] items-center gap-2 border-r border-gray-800 bg-[#012325] px-2 py-1">
      <button
        onClick={handleVisibilityToggle}
        className="rounded p-1 hover:bg-gray-700"
        title={isVisible ? t("timeline.track.hideTrack") : t("timeline.track.showTrack")}
      >
        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      <button
        onClick={handleLockToggle}
        className="rounded p-1 hover:bg-gray-700"
        title={isLocked ? t("timeline.track.unlockTrack") : t("timeline.track.lockTrack")}
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
      </button>

      {!isVideoTrack && (
        <div className="flex flex-1 items-center gap-2">
          <button
            onClick={handleVolumeToggle}
            className="shrink-0 rounded p-1 hover:bg-gray-700"
            title={isMuted ? t("timeline.track.unmute") : t("timeline.track.mute")}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-gray-500" /> : <Volume2 className="h-4 w-4 text-gray-300" />}
          </button>
          <div className="flex min-w-[100px] flex-1 items-center gap-2">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full [&_[data-orientation=horizontal]]:h-0.5"
            />
            <span className="w-[30px] text-right text-xs text-gray-300">{isMuted ? 0 : volume}</span>
          </div>
        </div>
      )}

      <div className="shrink-0 truncate text-sm text-gray-300">
        {isVideoTrack
          ? t("timeline.track.videoTrack", { index: track.index })
          : t("timeline.track.audioTrack", { index: track.index })}
      </div>
    </div>
  )
}
