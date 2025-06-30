import { useState } from "react"

import { LayoutGrid, Radio, Settings, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { MixerConsole } from "./mixer-console"
import { useBusRouting } from "../../hooks/use-bus-routing"
import { useMixerState } from "../../hooks/use-mixer-state"
import { GroupStrip } from "../routing/group-strip"
import { RoutingMatrix } from "../routing/routing-matrix"
import { SendPanel } from "../routing/send-panel"

interface MixerWithRoutingProps {
  className?: string
}

export function MixerWithRouting({ className }: MixerWithRoutingProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("mixer")
  const [selectedChannelForSends, setSelectedChannelForSends] = useState<string | null>(null)

  const {
    buses,
    groups,
    sends,
    createBus,
    createGroup,
    createSend,
    deleteBus,
    deleteGroup,
    deleteSend,
    assignChannelToBus,
    updateSendLevel,
    setBusMute,
    setBusSolo,
    setGroupMute,
    setGroupSolo,
    setGroupGain,
    toggleSendEnabled,
    toggleSendPre,
    getChannelSends,
  } = useBusRouting()

  const { channels } = useMixerState()
  const channelIds = channels.map((ch) => ch.id)

  const handleGroupGainChange = (groupId: string, value: number) => {
    // Convert 0-100 to 0-2 gain range
    const gain = (value / 100) * 2
    setGroupGain(groupId, gain)
  }

  return (
    <div className={`flex flex-col h-full bg-zinc-950 ${className}`}>
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-900 border-b border-zinc-800">
          <TabsTrigger value="mixer" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            {t("fairlightAudio.mixerWithRouting.tabs.mixer")}
          </TabsTrigger>
          <TabsTrigger value="routing" className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            {t("fairlightAudio.mixerWithRouting.tabs.routing")}
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t("fairlightAudio.mixerWithRouting.tabs.groups")}
          </TabsTrigger>
          <TabsTrigger value="sends" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t("fairlightAudio.mixerWithRouting.tabs.sends")}
          </TabsTrigger>
        </TabsList>

        {/* Mixer View */}
        <TabsContent value="mixer" className="flex-1 m-0">
          <div className="flex h-full">
            {/* Main Mixer */}
            <div className="flex-1">
              <MixerConsole />
            </div>

            {/* Group Strips */}
            {groups.length > 0 && (
              <div className="w-auto bg-zinc-800 border-l border-zinc-700 p-2">
                <div className="text-xs text-zinc-400 mb-2 text-center">
                  {t("fairlightAudio.mixerWithRouting.groups.title")}
                </div>
                <div className="flex gap-2">
                  {groups.map((group) => (
                    <GroupStrip
                      key={group.id}
                      group={group}
                      value={(group.gain / 2) * 100} // Convert 0-2 to 0-100
                      onGainChange={(value) => handleGroupGainChange(group.id, value)}
                      onMute={() => setGroupMute(group.id, !group.isMuted)}
                      onSolo={() => setGroupSolo(group.id, !group.isSolo)}
                      onDelete={() => deleteGroup(group.id)}
                      onEditChannels={() => {
                        setActiveTab("routing")
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Routing Matrix View */}
        <TabsContent value="routing" className="flex-1 m-0">
          <RoutingMatrix
            buses={buses}
            groups={groups}
            sends={sends}
            channelIds={channelIds}
            onCreateBus={createBus}
            onCreateGroup={createGroup}
            onCreateSend={createSend}
            onAssignChannelToBus={assignChannelToBus}
            onUpdateSendLevel={updateSendLevel}
            onSetBusMute={setBusMute}
            onSetBusSolo={setBusSolo}
            onSetGroupMute={setGroupMute}
            onSetGroupSolo={setGroupSolo}
            onDeleteBus={deleteBus}
            onDeleteGroup={deleteGroup}
          />
        </TabsContent>

        {/* Groups Management View */}
        <TabsContent value="groups" className="flex-1 m-0 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-200">
                {t("fairlightAudio.mixerWithRouting.groups.channelGroups")}
              </h2>
              <Button onClick={() => setActiveTab("routing")} variant="secondary">
                {t("fairlightAudio.mixerWithRouting.groups.manageGroups")}
              </Button>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div className="text-lg mb-2">{t("fairlightAudio.mixerWithRouting.groups.noGroupsCreated")}</div>
                <div className="text-sm">{t("fairlightAudio.mixerWithRouting.groups.noGroupsDescription")}</div>
                <Button className="mt-4" onClick={() => setActiveTab("routing")}>
                  {t("fairlightAudio.mixerWithRouting.groups.createGroup")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-4 bg-zinc-800 rounded-lg border-l-4"
                    style={{ borderLeftColor: group.color }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-zinc-200">{group.name}</h3>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={group.isSolo ? "default" : "secondary"}
                          onClick={() => setGroupSolo(group.id, !group.isSolo)}
                          className="h-6 w-6 p-0 bg-yellow-600 hover:bg-yellow-700"
                        >
                          S
                        </Button>
                        <Button
                          size="sm"
                          variant={group.isMuted ? "destructive" : "secondary"}
                          onClick={() => setGroupMute(group.id, !group.isMuted)}
                          className="h-6 w-6 p-0"
                        >
                          M
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-zinc-400">
                        {t("fairlightAudio.mixerWithRouting.groups.channels")} {group.channelIds.length}
                      </div>
                      <div className="text-xs text-zinc-500">{group.channelIds.join(", ")}</div>
                      <div className="text-xs text-zinc-500">
                        {t("fairlightAudio.mixerWithRouting.groups.bus")} {group.busId.replace("_bus", "")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Sends Management View */}
        <TabsContent value="sends" className="flex-1 m-0 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-200">
                {t("fairlightAudio.mixerWithRouting.sends.title")}
              </h2>
              {selectedChannelForSends && (
                <Button variant="ghost" onClick={() => setSelectedChannelForSends(null)}>
                  {t("fairlightAudio.mixerWithRouting.sends.closePanel")}
                </Button>
              )}
            </div>

            <div className="flex gap-4">
              {/* Channel List */}
              <div className="w-48 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-300">
                  {t("fairlightAudio.mixerWithRouting.sends.channels")}
                </h3>
                {channelIds.map((channelId) => {
                  const channelSends = getChannelSends(channelId)

                  return (
                    <Button
                      key={channelId}
                      variant={selectedChannelForSends === channelId ? "default" : "secondary"}
                      className="w-full justify-between h-auto p-3"
                      onClick={() => setSelectedChannelForSends(channelId)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{channelId}</div>
                        <div className="text-xs opacity-70">
                          {channelSends.length} {t("fairlightAudio.mixerWithRouting.sends.sends")}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>

              {/* Send Panel */}
              <div className="flex-1">
                {selectedChannelForSends ? (
                  <SendPanel
                    channelId={selectedChannelForSends}
                    sends={getChannelSends(selectedChannelForSends)}
                    availableBuses={buses}
                    onCreateSend={(busId, level, isPre) => createSend(selectedChannelForSends, busId, level, isPre)}
                    onUpdateSendLevel={updateSendLevel}
                    onToggleSendPre={toggleSendPre}
                    onToggleSendEnabled={toggleSendEnabled}
                    onDeleteSend={deleteSend}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-zinc-500">
                    <div className="text-center">
                      <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <div>{t("fairlightAudio.mixerWithRouting.sends.selectChannel")}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
