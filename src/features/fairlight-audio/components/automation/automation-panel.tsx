import { useState } from "react"

import { Circle, Hand, Lock, Play, Plus, Square } from "lucide-react"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  const [selectedChannel, setSelectedChannel] = useState("")
  const [selectedParameter, setSelectedParameter] = useState("")

  const availableParameters = [
    { id: "volume", name: t("fairlightAudio.automation.parameters.volume") },
    { id: "pan", name: t("fairlightAudio.automation.parameters.pan") },
    { id: "eq.lowGain", name: t("fairlightAudio.automation.parameters.eqLow") },
    { id: "eq.midGain", name: t("fairlightAudio.automation.parameters.eqMid") },
    { id: "eq.highGain", name: t("fairlightAudio.automation.parameters.eqHigh") },
    { id: "compressor.threshold", name: t("fairlightAudio.automation.parameters.compThreshold") },
    { id: "compressor.ratio", name: t("fairlightAudio.automation.parameters.compRatio") },
    { id: "reverb.wetLevel", name: t("fairlightAudio.automation.parameters.reverbWet") },
  ]

  const modeButtons = [
    {
      mode: "off" as const,
      icon: Square,
      label: t("fairlightAudio.automation.modes.off.name"),
      description: t("fairlightAudio.automation.modes.off.description"),
    },
    {
      mode: "read" as const,
      icon: Play,
      label: t("fairlightAudio.automation.modes.read.name"),
      description: t("fairlightAudio.automation.modes.read.description"),
    },
    {
      mode: "write" as const,
      icon: Circle,
      label: t("fairlightAudio.automation.modes.write.name"),
      description: t("fairlightAudio.automation.modes.write.description"),
    },
    {
      mode: "touch" as const,
      icon: Hand,
      label: t("fairlightAudio.automation.modes.touch.name"),
      description: t("fairlightAudio.automation.modes.touch.description"),
    },
    {
      mode: "latch" as const,
      icon: Lock,
      label: t("fairlightAudio.automation.modes.latch.name"),
      description: t("fairlightAudio.automation.modes.latch.description"),
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
          <span className="text-xs text-zinc-400 mr-2">{t("fairlightAudio.automation.controls.mode")}</span>
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
              {t("fairlightAudio.automation.controls.stop")}
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
              {t("fairlightAudio.automation.controls.record")}
            </Button>
          )}
        </div>

        {/* Add Lane Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder={t("fairlightAudio.automation.controls.channel")} />
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
              <SelectValue placeholder={t("fairlightAudio.automation.controls.parameter")} />
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
          {t("fairlightAudio.automation.status.lanes", { count: lanes.length })} •{" "}
          {t("fairlightAudio.automation.status.mode", { mode })}
          {isRecording && ` • ${t("fairlightAudio.automation.status.recording")}`}
        </span>

        {mode !== "off" && (
          <span>
            {mode === "read" && t("fairlightAudio.automation.status.reading")}
            {mode === "write" && t("fairlightAudio.automation.status.willOverwrite")}
            {mode === "touch" && t("fairlightAudio.automation.status.touchToStart")}
            {mode === "latch" && t("fairlightAudio.automation.status.touchToLatch")}
          </span>
        )}
      </div>
    </div>
  )
}
