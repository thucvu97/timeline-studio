import { useState } from "react"

import { Circle, Hand, Lock, Play, Plus, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { AutomationLane, AutomationMode } from "../../services/automation-engine"

interface AutomationPanelProps {
  mode: AutomationMode
  isRecording: boolean
  lanes: AutomationLane[]
  onModeChange: (mode: AutomationMode) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onAddLane: (channelId: string, parameterId: string) => void
  onClearLane: (laneId: string) => void
  className?: string
}

export function AutomationPanel({
  mode,
  isRecording,
  lanes,
  onModeChange,
  onStartRecording,
  onStopRecording,
  onAddLane,
  onClearLane,
  className,
}: AutomationPanelProps) {
  const [selectedChannel, setSelectedChannel] = useState("")
  const [selectedParameter, setSelectedParameter] = useState("")

  const availableParameters = [
    { id: "volume", name: "Volume" },
    { id: "pan", name: "Pan" },
    { id: "eq.lowGain", name: "EQ Low" },
    { id: "eq.midGain", name: "EQ Mid" },
    { id: "eq.highGain", name: "EQ High" },
    { id: "compressor.threshold", name: "Comp Threshold" },
    { id: "compressor.ratio", name: "Comp Ratio" },
    { id: "reverb.wetLevel", name: "Reverb Wet" },
  ]

  const modeButtons = [
    {
      mode: "off" as const,
      icon: Square,
      label: "Off",
      description: "No automation",
    },
    {
      mode: "read" as const,
      icon: Play,
      label: "Read",
      description: "Read existing automation",
    },
    {
      mode: "write" as const,
      icon: Circle,
      label: "Write",
      description: "Overwrite automation while recording",
    },
    {
      mode: "touch" as const,
      icon: Hand,
      label: "Touch",
      description: "Write only when touching control",
    },
    {
      mode: "latch" as const,
      icon: Lock,
      label: "Latch",
      description: "Continue writing after release",
    },
  ]

  const uniqueChannels = Array.from(new Set(lanes.map((lane) => lane.channelId)))

  const handleAddLane = () => {
    if (selectedChannel && selectedParameter) {
      onAddLane(selectedChannel, selectedParameter)
      setSelectedParameter("")
    }
  }

  return (
    <div className={cn("bg-zinc-900 border-b border-zinc-800 p-3", className)}>
      <div className="flex items-center gap-4">
        {/* Automation Mode Buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-400 mr-2">Mode:</span>
          {modeButtons.map(({ mode: buttonMode, icon: Icon, label }) => (
            <Button
              key={buttonMode}
              size="sm"
              variant={mode === buttonMode ? "default" : "secondary"}
              onClick={() => onModeChange(buttonMode)}
              className={cn("h-8 px-2", mode === buttonMode && "bg-blue-600 hover:bg-blue-700")}
              title={modeButtons.find((b) => b.mode === buttonMode)?.description}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-2 ml-4">
          {isRecording ? (
            <Button size="sm" variant="destructive" onClick={onStopRecording} className="h-8">
              <Square className="w-3 h-3 mr-1 fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={onStartRecording}
              disabled={mode === "off" || mode === "read"}
              className="h-8 bg-red-600 hover:bg-red-700"
            >
              <Circle className="w-3 h-3 mr-1 fill-current" />
              Record
            </Button>
          )}
        </div>

        {/* Add Lane Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {uniqueChannels.map((channelId) => (
                <SelectItem key={channelId} value={channelId}>
                  {channelId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedParameter} onValueChange={setSelectedParameter}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Parameter" />
            </SelectTrigger>
            <SelectContent>
              {availableParameters.map((param) => (
                <SelectItem key={param.id} value={param.id}>
                  {param.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddLane}
            disabled={!selectedChannel || !selectedParameter}
            className="h-8 px-2"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
        <span>
          {lanes.length} automation lanes • Mode: {mode}
          {isRecording && " • Recording"}
        </span>

        {mode !== "off" && (
          <span>
            {mode === "read" && "Reading automation data"}
            {mode === "write" && "Will overwrite automation while recording"}
            {mode === "touch" && "Touch a control to start automation"}
            {mode === "latch" && "Touch a control to latch automation"}
          </span>
        )}
      </div>
    </div>
  )
}
