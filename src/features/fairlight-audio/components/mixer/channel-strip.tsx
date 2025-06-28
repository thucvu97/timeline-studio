import { useState } from "react"

import { Settings } from "lucide-react"

import { cn } from "@/lib/utils"

import { Fader } from "./fader"
import { LevelMeter } from "../meters/level-meter"

export interface ChannelStripProps {
  channelId: string
  name: string
  type: "mono" | "stereo" | "surround"
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  armed: boolean
  onVolumeChange: (value: number) => void
  onPanChange: (value: number) => void
  onMute: () => void
  onSolo: () => void
  onArm: () => void
  onSettings?: () => void
  audioContext?: AudioContext
  analyser?: AnalyserNode
  className?: string
}

export function ChannelStrip({
  name,
  type,
  volume,
  pan,
  muted,
  solo,
  armed,
  onVolumeChange,
  onPanChange,
  onMute,
  onSolo,
  onArm,
  onSettings,
  audioContext,
  analyser,
  className,
}: ChannelStripProps) {
  const [showEq, setShowEq] = useState(false)

  return (
    <div className={cn("flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg p-2 w-20", className)}>
      {/* Channel header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-300 truncate flex-1">{name}</span>
        <button onClick={onSettings} className="p-1 hover:bg-zinc-800 rounded transition-colors">
          <Settings className="h-3 w-3 text-zinc-500" />
        </button>
      </div>

      {/* Input type indicator */}
      <div className="flex items-center justify-center mb-2">
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded",
            type === "stereo" && "bg-blue-900 text-blue-300",
            type === "mono" && "bg-zinc-800 text-zinc-400",
            type === "surround" && "bg-purple-900 text-purple-300",
          )}
        >
          {type.toUpperCase()}
        </span>
      </div>

      {/* EQ Section (placeholder) */}
      <div className="h-16 bg-zinc-800 rounded mb-2 p-1">
        <button
          onClick={() => setShowEq(!showEq)}
          className="w-full h-full flex items-center justify-center text-xs text-zinc-500 hover:text-zinc-300"
        >
          EQ
        </button>
      </div>

      {/* Effects sends (placeholder) */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="h-6 bg-zinc-800 rounded text-[10px] text-zinc-500 flex items-center justify-center">Send 1</div>
        <div className="h-6 bg-zinc-800 rounded text-[10px] text-zinc-500 flex items-center justify-center">Send 2</div>
      </div>

      {/* Pan control */}
      <div className="mb-2">
        <div className="text-[10px] text-zinc-500 text-center mb-1">PAN</div>
        <div className="relative h-6 bg-zinc-800 rounded">
          <input
            type="range"
            min="-100"
            max="100"
            value={pan}
            onChange={(e) => onPanChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-400 rounded-full transition-all pointer-events-none"
            style={{ left: `${(pan + 100) / 2}%`, transform: "translateX(-50%) translateY(-50%)" }}
          />
        </div>
      </div>

      {/* Record arm button */}
      <button
        onClick={onArm}
        className={cn(
          "h-6 rounded mb-2 text-xs font-bold transition-colors",
          armed ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700",
        )}
      >
        R
      </button>

      {/* Fader section with level meter */}
      <div className="flex-1 flex justify-center gap-1">
        {audioContext && analyser && (
          <LevelMeter
            audioContext={audioContext}
            source={analyser}
            channels={type === "mono" ? 1 : 2}
            orientation="vertical"
            className="h-full"
          />
        )}
        <Fader
          value={volume}
          onChange={onVolumeChange}
          muted={muted}
          solo={solo}
          onMute={onMute}
          onSolo={onSolo}
          dbScale
        />
      </div>

      {/* Output routing (placeholder) */}
      <div className="mt-2 pt-2 border-t border-zinc-800">
        <select className="w-full text-[10px] bg-zinc-800 text-zinc-400 rounded px-1 py-0.5">
          <option>Main</option>
          <option>Bus 1</option>
          <option>Bus 2</option>
        </select>
      </div>
    </div>
  )
}
