/**
 * MIDI Router View Component
 * Visual interface for creating and managing MIDI routes
 */

import { useCallback, useEffect, useState } from "react"

import { ArrowRight, Filter, GitBranch, Keyboard, Music, Plus, Settings, Shuffle, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useMidiEngine } from "../../hooks/use-midi-engine"

import type { MidiDestination, MidiRoute } from "../../services/midi/midi-router"

interface RouteItemProps {
  route: MidiRoute
  onUpdate: (updates: Partial<MidiRoute>) => void
  onDelete: () => void
  devices: Array<{ id: string; name: string }>
}

function RouteItem({ route, onUpdate, onDelete, devices }: RouteItemProps) {
  const getRouteIcon = () => {
    if (route.processors.some((p) => p.type === "split")) return <GitBranch className="w-4 h-4" />
    if (route.processors.some((p) => p.type === "filter")) return <Filter className="w-4 h-4" />
    if (route.processors.some((p) => p.type === "transform")) return <Shuffle className="w-4 h-4" />
    return <ArrowRight className="w-4 h-4" />
  }

  const getSourceLabel = () => {
    const parts = []
    if (route.sourceDevice) {
      const device = devices.find((d) => d.id === route.sourceDevice)
      parts.push(device?.name || route.sourceDevice)
    } else {
      parts.push("Any Device")
    }

    if (route.sourceChannel) {
      parts.push(`Ch ${route.sourceChannel}`)
    }

    if (route.sourceType?.length) {
      parts.push(`[${route.sourceType.join(", ")}]`)
    }

    return parts.join(" → ")
  }

  const getDestinationLabel = (dest: MidiDestination) => {
    switch (dest.type) {
      case "device":
        const device = devices.find((d) => d.id === dest.deviceId)
        return device?.name || dest.deviceId || "Unknown"
      case "channel":
        return `Channel ${dest.targetChannel}`
      case "virtual":
        return `Virtual: ${dest.virtualId}`
      case "function":
        return "Function Callback"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch
            checked={route.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
            aria-label="Enable route"
          />
          <div className="flex items-center gap-2">
            {getRouteIcon()}
            <span className="font-medium">{route.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={route.enabled ? "default" : "secondary"}>{route.enabled ? "Active" : "Inactive"}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit Route</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">From:</span>
          <span>{getSourceLabel()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">To:</span>
          <div className="flex flex-wrap gap-2">
            {route.destinations.map((dest, idx) => (
              <Badge key={idx} variant="outline">
                {getDestinationLabel(dest)}
              </Badge>
            ))}
          </div>
        </div>
        {route.processors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Processors:</span>
            <div className="flex gap-1">
              {route.processors.map((proc, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {proc.type}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function MidiRouterView() {
  const { engine, devices } = useMidiEngine()
  const [routes, setRoutes] = useState<MidiRoute[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  useEffect(() => {
    if (!engine?.router) return

    const updateRoutes = () => {
      if (engine.router) {
        setRoutes(engine.router.getRoutes())
      }
    }

    // Initial load
    updateRoutes()

    // Listen for changes
    engine.router.on("routeCreated", updateRoutes)
    engine.router.on("routeUpdated", updateRoutes)
    engine.router.on("routeDeleted", updateRoutes)
    engine.router.on("routesReordered", updateRoutes)

    return () => {
      engine.router?.off("routeCreated", updateRoutes)
      engine.router?.off("routeUpdated", updateRoutes)
      engine.router?.off("routeDeleted", updateRoutes)
      engine.router?.off("routesReordered", updateRoutes)
    }
  }, [engine])

  const handleCreatePreset = useCallback(() => {
    if (!engine?.router || !selectedPreset) return

    switch (selectedPreset) {
      case "keyboard-split":
        engine.router.createKeyboardSplitRoute(
          60, // Middle C
          devices.output[0]?.id || "",
          devices.output[0]?.id || "",
          1,
          2,
        )
        break

      case "channel-filter":
        engine.router.createChannelFilterRoute(1, devices.output[0]?.id || "")
        break

      case "cc-remap":
        engine.router.createCCRemapRoute(
          1, // Mod wheel
          11, // Expression
          devices.output[0]?.id,
        )
        break
      default:
        console.warn("Unknown preset:", selectedPreset)
        break
    }

    setSelectedPreset("")
  }, [engine, devices, selectedPreset])

  const handleUpdateRoute = useCallback(
    (routeId: string, updates: Partial<MidiRoute>) => {
      engine?.router?.updateRoute(routeId, updates)
    },
    [engine],
  )

  const handleDeleteRoute = useCallback(
    (routeId: string) => {
      engine?.router?.deleteRoute(routeId)
    },
    [engine],
  )

  if (!engine) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MIDI Router</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">MIDI engine not initialized</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          MIDI Router
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Create from preset..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keyboard-split">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  <span>Keyboard Split</span>
                </div>
              </SelectItem>
              <SelectItem value="channel-filter">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Channel Filter</span>
                </div>
              </SelectItem>
              <SelectItem value="cc-remap">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4" />
                  <span>CC Remap</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreatePreset} disabled={!selectedPreset} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="routes" className="h-full">
          <TabsList className="w-full justify-start rounded-none border-b">
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="matrix">Matrix View</TabsTrigger>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="p-4">
            <ScrollArea className="h-[400px]">
              {routes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No MIDI routes configured</p>
                  <p className="text-sm mt-1">Create a route using the preset menu above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {routes.map((route) => (
                    <RouteItem
                      key={route.id}
                      route={route}
                      onUpdate={(updates) => handleUpdateRoute(route.id, updates)}
                      onDelete={() => handleDeleteRoute(route.id)}
                      devices={[...devices.input, ...devices.output]}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="matrix" className="p-4">
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Matrix view coming soon</p>
              <p className="text-sm mt-1">Visual routing matrix for complex setups</p>
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="p-4">
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Route monitor coming soon</p>
              <p className="text-sm mt-1">Real-time visualization of MIDI flow</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
