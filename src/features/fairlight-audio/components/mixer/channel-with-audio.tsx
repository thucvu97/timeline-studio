import { cn } from "@/lib/utils"

import { ChannelStrip, ChannelStripProps } from "./channel-strip"
import { useChannelAudio } from "../../hooks/use-channel-audio"
import { SimpleWaveform } from "../waveform/simple-waveform"

interface ChannelWithAudioProps extends ChannelStripProps {
  trackId?: string
}

export function ChannelWithAudio({ trackId, className, ...props }: ChannelWithAudioProps) {
  const { error, isLoading, audioElement } = useChannelAudio(props.channelId, trackId)

  // Show loading/error state in the channel name
  const displayName = isLoading ? `${props.name} (Loading...)` : error ? `${props.name} (!)` : props.name

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Waveform display above the channel strip */}
      {trackId && (
        <div className="mb-2 px-2">
          <SimpleWaveform audioElement={audioElement} height={40} className="w-full" />
        </div>
      )}

      <ChannelStrip {...props} name={displayName} />
    </div>
  )
}
