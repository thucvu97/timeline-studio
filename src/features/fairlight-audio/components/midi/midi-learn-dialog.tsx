import { useEffect, useState } from "react"

import { Loader2, Music } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useMidi } from "../../hooks/use-midi"
import { MidiDevice, MidiMessage } from "../../services/midi/midi-engine"

interface MidiLearnDialogProps {
  open: boolean
  onClose: () => void
  devices: MidiDevice[]
  onComplete: (deviceId: string, message: MidiMessage, targetParameter: string) => void
}

const PARAMETER_OPTIONS = [
  { value: "channel.1.volume", label: "Channel 1 - Volume" },
  { value: "channel.1.pan", label: "Channel 1 - Pan" },
  { value: "channel.2.volume", label: "Channel 2 - Volume" },
  { value: "channel.2.pan", label: "Channel 2 - Pan" },
  { value: "channel.3.volume", label: "Channel 3 - Volume" },
  { value: "channel.3.pan", label: "Channel 3 - Pan" },
  { value: "channel.4.volume", label: "Channel 4 - Volume" },
  { value: "channel.4.pan", label: "Channel 4 - Pan" },
  { value: "master.volume", label: "Master - Volume" },
  { value: "master.limiter.threshold", label: "Master - Limiter Threshold" },
]

export function MidiLearnDialog({ open, onClose, devices, onComplete }: MidiLearnDialogProps) {
  const { startLearning } = useMidi()
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [targetParameter, setTargetParameter] = useState<string>("")
  const [isListening, setIsListening] = useState(false)
  const [receivedMessage, setReceivedMessage] = useState<MidiMessage | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedDevice("")
      setTargetParameter("")
      setIsListening(false)
      setReceivedMessage(null)
    }
  }, [open])

  useEffect(() => {
    if (isListening) {
      const stopLearning = startLearning((message) => {
        setReceivedMessage(message)
        setIsListening(false)
      })

      return stopLearning
    }
  }, [isListening, startLearning])

  const handleStartListening = () => {
    if (selectedDevice && targetParameter) {
      setIsListening(true)
      setReceivedMessage(null)
    }
  }

  const handleComplete = () => {
    if (selectedDevice && targetParameter && receivedMessage) {
      onComplete(selectedDevice, receivedMessage, targetParameter)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>MIDI Learn</DialogTitle>
          <DialogDescription>Select a device and parameter, then move a control on your MIDI device</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Device Selection */}
          <div>
            <Label htmlFor="midi-device" className="text-xs text-zinc-400">
              MIDI Device
            </Label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger id="midi-device" className="mt-1">
                <SelectValue placeholder="Select MIDI device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parameter Selection */}
          <div>
            <Label htmlFor="target-parameter" className="text-xs text-zinc-400">
              Target Parameter
            </Label>
            <Select value={targetParameter} onValueChange={setTargetParameter}>
              <SelectTrigger id="target-parameter" className="mt-1">
                <SelectValue placeholder="Select parameter to control" />
              </SelectTrigger>
              <SelectContent>
                {PARAMETER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* MIDI Learn Status */}
          <div className="p-8 border border-zinc-800 rounded-lg bg-zinc-900/50">
            <div className="text-center space-y-2">
              {isListening ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                  <p className="text-sm font-medium">Listening for MIDI input...</p>
                  <p className="text-xs text-zinc-500">Move a control on your MIDI device</p>
                </>
              ) : receivedMessage ? (
                <>
                  <Music className="w-8 h-8 mx-auto text-green-500" />
                  <p className="text-sm font-medium text-green-400">MIDI signal received!</p>
                  <div className="text-xs text-zinc-400 space-y-1 mt-2">
                    <p>Type: {receivedMessage.type.toUpperCase()}</p>
                    {receivedMessage.data.controller !== undefined && (
                      <p>Controller: CC{receivedMessage.data.controller}</p>
                    )}
                    <p>Channel: {receivedMessage.channel}</p>
                  </div>
                </>
              ) : (
                <>
                  <Music className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-sm text-zinc-400">Ready to learn</p>
                  <p className="text-xs text-zinc-500">Select device and parameter, then click &quot;Start Listening&quot;</p>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!receivedMessage ? (
            <Button onClick={handleStartListening} disabled={!selectedDevice || !targetParameter || isListening}>
              {isListening ? "Listening..." : "Start Listening"}
            </Button>
          ) : (
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
              Save Mapping
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
