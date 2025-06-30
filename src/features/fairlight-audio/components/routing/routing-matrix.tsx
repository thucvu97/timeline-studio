import { useState } from "react"

import { Minus, Plus, Radio, Settings, Users, Volume2, VolumeX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

import { AudioBus, ChannelGroup, ChannelSend } from "../../services/bus-router"

interface RoutingMatrixProps {
  buses: AudioBus[]
  groups: ChannelGroup[]
  sends: ChannelSend[]
  channelIds: string[]
  onCreateBus: (name: string, type: AudioBus["type"]) => void
  onCreateGroup: (name: string, channelIds: string[], color: string) => void
  onCreateSend: (sourceChannelId: string, destinationBusId: string, level: number) => void
  onAssignChannelToBus: (channelId: string, busId: string) => void
  onUpdateSendLevel: (sendId: string, level: number) => void
  onSetBusMute: (busId: string, muted: boolean) => void
  onSetBusSolo: (busId: string, solo: boolean) => void
  onSetGroupMute: (groupId: string, muted: boolean) => void
  onSetGroupSolo: (groupId: string, solo: boolean) => void
  onDeleteBus: (busId: string) => void
  onDeleteGroup: (groupId: string) => void
}

export function RoutingMatrix({
  buses,
  groups,
  sends,
  channelIds,
  onCreateBus,
  onCreateGroup,
  onCreateSend,
  onAssignChannelToBus,
  onUpdateSendLevel,
  onSetBusMute,
  onSetBusSolo,
  onSetGroupMute,
  onSetGroupSolo,
  onDeleteBus,
  onDeleteGroup,
}: RoutingMatrixProps) {
  const { t } = useTranslation()
  const [newBusName, setNewBusName] = useState("")
  const [newBusType, setNewBusType] = useState<AudioBus["type"]>("stereo")
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [showSends, setShowSends] = useState(false)

  const handleCreateBus = () => {
    if (newBusName.trim()) {
      onCreateBus(newBusName.trim(), newBusType)
      setNewBusName("")
    }
  }

  const handleCreateGroup = () => {
    if (newGroupName.trim() && selectedChannels.length > 0) {
      onCreateGroup(newGroupName.trim(), selectedChannels, "#3b82f6")
      setNewGroupName("")
      setSelectedChannels([])
    }
  }

  const getChannelSends = (channelId: string) => {
    return sends.filter((send) => send.sourceChannelId === channelId)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">{t("fairlightAudio.routingMatrix.title")}</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={showSends ? "default" : "secondary"} onClick={() => setShowSends(!showSends)}>
              <Radio className="w-4 h-4 mr-1" />
              {t("fairlightAudio.routingMatrix.sendsButton")}
            </Button>
            <Button size="sm" variant="secondary">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Buses and Groups */}
        <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          {/* Buses Section */}
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">{t("fairlightAudio.routingMatrix.audioBuses")}</h3>

            {/* Create Bus */}
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t("fairlightAudio.routingMatrix.busName")}
                  value={newBusName}
                  onChange={(e) => setNewBusName(e.target.value)}
                  className="h-8"
                />
                <Select value={newBusType} onValueChange={(v) => setNewBusType(v as AudioBus["type"])}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stereo">{t("fairlightAudio.routingMatrix.types.stereo")}</SelectItem>
                    <SelectItem value="mono">{t("fairlightAudio.routingMatrix.types.mono")}</SelectItem>
                    <SelectItem value="surround">{t("fairlightAudio.routingMatrix.types.surround")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleCreateBus} className="h-8 px-2">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Bus List */}
            <div className="space-y-1">
              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded",
                    "bg-zinc-800 hover:bg-zinc-700 transition-colors",
                  )}
                >
                  <div className="flex-1">
                    <div className="text-sm text-zinc-200">{bus.name}</div>
                    <div className="text-xs text-zinc-500">{bus.type}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={bus.isSolo ? "default" : "secondary"}
                      onClick={() => onSetBusSolo(bus.id, !bus.isSolo)}
                      className="h-6 w-6 p-0 bg-yellow-600 hover:bg-yellow-700"
                    >
                      S
                    </Button>
                    <Button
                      size="sm"
                      variant={bus.isMuted ? "destructive" : "secondary"}
                      onClick={() => onSetBusMute(bus.id, !bus.isMuted)}
                      className="h-6 w-6 p-0"
                    >
                      {bus.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </Button>
                    {bus.id !== "master" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteBus(bus.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groups Section */}
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">
              {t("fairlightAudio.routingMatrix.channelGroups")}
            </h3>

            {/* Create Group */}
            <div className="space-y-2 mb-4">
              <Input
                placeholder={t("fairlightAudio.routingMatrix.groupName")}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="h-8"
              />

              <div className="space-y-1">
                <div className="text-xs text-zinc-500">{t("fairlightAudio.routingMatrix.selectChannels")}</div>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {channelIds.map((channelId) => (
                    <label key={channelId} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(channelId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChannels([...selectedChannels, channelId])
                          } else {
                            setSelectedChannels(selectedChannels.filter((id) => id !== channelId))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-zinc-300">{channelId}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedChannels.length === 0}
                className="w-full h-8"
              >
                <Users className="w-3 h-3 mr-1" />
                {t("fairlightAudio.routingMatrix.createGroup")}
              </Button>
            </div>

            {/* Group List */}
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-3 rounded bg-zinc-800 border-l-4"
                  style={{ borderLeftColor: group.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-zinc-200">{group.name}</div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={group.isSolo ? "default" : "secondary"}
                        onClick={() => onSetGroupSolo(group.id, !group.isSolo)}
                        className="h-6 w-6 p-0 bg-yellow-600 hover:bg-yellow-700"
                      >
                        S
                      </Button>
                      <Button
                        size="sm"
                        variant={group.isMuted ? "destructive" : "secondary"}
                        onClick={() => onSetGroupMute(group.id, !group.isMuted)}
                        className="h-6 w-6 p-0"
                      >
                        {group.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteGroup(group.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 mb-2">Channels: {group.channelIds.join(", ")}</div>

                  <div className="text-xs text-zinc-500">Bus: {group.busId}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Routing Matrix */}
        <div className="flex-1 overflow-auto">
          {showSends ? (
            /* Sends Matrix */
            <div className="p-4">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">
                {t("fairlightAudio.routingMatrix.sendMatrix")}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2 text-zinc-400 border-b border-zinc-800">
                        {t("fairlightAudio.routingMatrix.channel")}
                      </th>
                      {buses
                        .filter((bus) => bus.id !== "master")
                        .map((bus) => (
                          <th key={bus.id} className="text-center p-2 text-zinc-400 border-b border-zinc-800 min-w-24">
                            {bus.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {channelIds.map((channelId) => (
                      <tr key={channelId} className="border-b border-zinc-800/50">
                        <td className="p-2 text-zinc-300 font-medium">{channelId}</td>
                        {buses
                          .filter((bus) => bus.id !== "master")
                          .map((bus) => {
                            const existingSend = sends.find(
                              (send) => send.sourceChannelId === channelId && send.destinationBusId === bus.id,
                            )

                            return (
                              <td key={bus.id} className="p-2 text-center">
                                {existingSend ? (
                                  <div className="space-y-1">
                                    <Slider
                                      value={[existingSend.level * 100]}
                                      onValueChange={([value]) => onUpdateSendLevel(existingSend.id, value / 100)}
                                      min={0}
                                      max={100}
                                      step={1}
                                      className="w-16 mx-auto"
                                    />
                                    <div className="text-xs text-zinc-500">{Math.round(existingSend.level * 100)}%</div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onCreateSend(channelId, bus.id, 0.5)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                )}
                              </td>
                            )
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Channel Assignment Matrix */
            <div className="p-4">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">
                {t("fairlightAudio.routingMatrix.channelBusAssignment")}
              </h3>

              <div className="grid gap-3">
                {channelIds.map((channelId) => (
                  <div key={channelId} className="flex items-center gap-4 p-3 bg-zinc-800 rounded">
                    <div className="w-32 text-zinc-300 font-medium">{channelId}</div>
                    <div className="flex-1">
                      <Select onValueChange={(busId) => onAssignChannelToBus(channelId, busId)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder={t("fairlightAudio.routingMatrix.selectBus")} />
                        </SelectTrigger>
                        <SelectContent>
                          {buses.map((bus) => (
                            <SelectItem key={bus.id} value={bus.id}>
                              {bus.name} ({bus.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-zinc-500">
                      {t("fairlightAudio.routingMatrix.sendsCount")} {getChannelSends(channelId).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
