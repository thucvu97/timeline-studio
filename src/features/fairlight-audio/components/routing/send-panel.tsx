import { useState } from "react"

import { Plus, RotateCcw, RotateCw, Volume2, VolumeX, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

import { AudioBus, ChannelSend } from "../../services/bus-router"

interface SendPanelProps {
  channelId: string
  sends: ChannelSend[]
  availableBuses: AudioBus[]
  onCreateSend: (destinationBusId: string, level: number, isPre: boolean) => void
  onUpdateSendLevel: (sendId: string, level: number) => void
  onToggleSendPre: (sendId: string, isPre: boolean) => void
  onToggleSendEnabled: (sendId: string, enabled: boolean) => void
  onDeleteSend: (sendId: string) => void
  className?: string
}

export function SendPanel({
  channelId,
  sends,
  availableBuses,
  onCreateSend,
  onUpdateSendLevel,
  onToggleSendPre,
  onToggleSendEnabled,
  onDeleteSend,
  className,
}: SendPanelProps) {
  const [newSendBusId, setNewSendBusId] = useState("")
  const [newSendLevel, setNewSendLevel] = useState(50)
  const [newSendIsPre, setNewSendIsPre] = useState(false)

  // Получаем доступные шины (исключаем master и уже используемые)
  const usedBusIds = sends.map((send) => send.destinationBusId)
  const availableForSend = availableBuses.filter((bus) => bus.id !== "master" && !usedBusIds.includes(bus.id))

  const handleCreateSend = () => {
    if (newSendBusId) {
      onCreateSend(newSendBusId, newSendLevel / 100, newSendIsPre)
      setNewSendBusId("")
      setNewSendLevel(50)
      setNewSendIsPre(false)
    }
  }

  const convertToDb = (level: number): string => {
    if (level === 0) return "-∞"
    const db = 20 * Math.log10(level)
    return `${db.toFixed(1)} dB`
  }

  return (
    <div className={cn("bg-zinc-900 border border-zinc-800 rounded p-3", className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-zinc-200">Sends - {channelId}</h4>
        <span className="text-xs text-zinc-500">{sends.length} active</span>
      </div>

      {/* Existing Sends */}
      <div className="space-y-3 mb-4">
        {sends.map((send) => {
          const bus = availableBuses.find((b) => b.id === send.destinationBusId)

          return (
            <div
              key={send.id}
              className={cn(
                "p-3 rounded bg-zinc-800 border-l-2",
                send.isEnabled ? "border-blue-500" : "border-zinc-600",
              )}
            >
              {/* Send Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">→ {bus?.name || send.destinationBusId}</span>
                  <span className="text-xs text-zinc-500">({bus?.type || "unknown"})</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Pre/Post Toggle */}
                  <Button
                    size="sm"
                    variant={send.isPre ? "default" : "secondary"}
                    onClick={() => onToggleSendPre(send.id, !send.isPre)}
                    className="h-6 px-2"
                    title={send.isPre ? "Pre-fader send" : "Post-fader send"}
                  >
                    {send.isPre ? <RotateCcw className="w-3 h-3" /> : <RotateCw className="w-3 h-3" />}
                  </Button>

                  {/* Enable/Disable Toggle */}
                  <Button
                    size="sm"
                    variant={send.isEnabled ? "default" : "secondary"}
                    onClick={() => onToggleSendEnabled(send.id, !send.isEnabled)}
                    className="h-6 w-6 p-0"
                    title={send.isEnabled ? "Enabled" : "Disabled"}
                  >
                    {send.isEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  </Button>

                  {/* Delete Send */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteSend(send.id)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    title="Delete send"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Send Level Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Level</span>
                  <span className="text-xs text-zinc-300">{convertToDb(send.level)}</span>
                </div>

                <Slider
                  value={[send.level * 100]}
                  onValueChange={([value]) => onUpdateSendLevel(send.id, value / 100)}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!send.isEnabled}
                  className={cn("w-full", !send.isEnabled && "opacity-50")}
                />

                <div className="flex justify-between text-xs text-zinc-500">
                  <span>-∞</span>
                  <span>0 dB</span>
                </div>
              </div>

              {/* Send Info */}
              <div className="mt-2 text-xs text-zinc-500">
                {send.isPre ? "Pre-fader" : "Post-fader"} •{send.isEnabled ? " Active" : " Disabled"}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add New Send */}
      {availableForSend.length > 0 && (
        <div className="border-t border-zinc-800 pt-3">
          <div className="text-sm font-medium text-zinc-300 mb-2">Add Send</div>

          <div className="space-y-2">
            {/* Bus Selection */}
            <Select value={newSendBusId} onValueChange={setNewSendBusId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select destination bus" />
              </SelectTrigger>
              <SelectContent>
                {availableForSend.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.name} ({bus.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Level and Pre/Post */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="text-xs text-zinc-400 mb-1">Level: {newSendLevel}%</div>
                <Slider
                  value={[newSendLevel]}
                  onValueChange={([value]) => setNewSendLevel(value)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <Button
                size="sm"
                variant={newSendIsPre ? "default" : "secondary"}
                onClick={() => setNewSendIsPre(!newSendIsPre)}
                className="h-8 px-3"
                title={newSendIsPre ? "Pre-fader" : "Post-fader"}
              >
                {newSendIsPre ? "PRE" : "POST"}
              </Button>
            </div>

            {/* Create Button */}
            <Button size="sm" onClick={handleCreateSend} disabled={!newSendBusId} className="w-full h-8">
              <Plus className="w-3 h-3 mr-1" />
              Add Send
            </Button>
          </div>
        </div>
      )}

      {/* No Available Buses */}
      {availableForSend.length === 0 && sends.length === 0 && (
        <div className="text-center py-4 text-zinc-500">
          <div className="text-sm">No buses available for sends</div>
          <div className="text-xs mt-1">Create additional buses first</div>
        </div>
      )}
    </div>
  )
}
