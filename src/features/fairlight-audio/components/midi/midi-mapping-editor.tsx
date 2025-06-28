import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

import { MidiMapping } from "../../services/midi/midi-engine"

interface MidiMappingEditorProps {
  mapping: MidiMapping
  onSave: (updates: Partial<MidiMapping>) => void
  onClose: () => void
}

export function MidiMappingEditor({ mapping, onSave, onClose }: MidiMappingEditorProps) {
  const [min, setMin] = useState(mapping.min)
  const [max, setMax] = useState(mapping.max)
  const [curve, setCurve] = useState(mapping.curve)

  const handleSave = () => {
    onSave({
      min,
      max,
      curve,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit MIDI Mapping</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mapping Info */}
          <div className="p-3 bg-zinc-900/50 rounded-lg space-y-1">
            <p className="text-sm font-medium text-zinc-100">{mapping.targetParameter}</p>
            <p className="text-xs text-zinc-500">
              {mapping.messageType.toUpperCase()}
              {mapping.controller !== undefined && ` CC${mapping.controller}`}
              {mapping.channel && ` CH${mapping.channel}`}
            </p>
          </div>

          {/* Min Value */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Minimum Value</Label>
              <span className="text-xs text-zinc-500">{min.toFixed(2)}</span>
            </div>
            <Slider value={[min]} onValueChange={([v]) => setMin(v)} min={0} max={1} step={0.01} className="w-full" />
          </div>

          {/* Max Value */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Maximum Value</Label>
              <span className="text-xs text-zinc-500">{max.toFixed(2)}</span>
            </div>
            <Slider value={[max]} onValueChange={([v]) => setMax(v)} min={0} max={1} step={0.01} className="w-full" />
          </div>

          {/* Curve Type */}
          <div>
            <Label htmlFor="curve-type" className="text-xs text-zinc-400">
              Response Curve
            </Label>
            <Select value={curve} onValueChange={(v) => setCurve(v as typeof curve)}>
              <SelectTrigger id="curve-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
                <SelectItem value="logarithmic">Logarithmic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Curve Preview */}
          <div className="p-4 bg-zinc-900/50 rounded-lg">
            <div className="relative h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Grid */}
                <g className="stroke-zinc-800" strokeWidth="0.5">
                  <line x1="0" y1="50" x2="100" y2="50" />
                  <line x1="50" y1="0" x2="50" y2="100" />
                </g>

                {/* Curve */}
                <path d={generateCurvePath(curve, min, max)} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="2" />

                {/* Min/Max indicators */}
                <circle cx="0" cy={100 - min * 100} r="3" fill="rgb(59, 130, 246)" />
                <circle cx="100" cy={100 - max * 100} r="3" fill="rgb(59, 130, 246)" />
              </svg>
            </div>
            <p className="text-xs text-zinc-500 text-center mt-2">Response Curve Preview</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function generateCurvePath(curve: string, min: number, max: number): string {
  const points: string[] = []
  const steps = 50

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100
    const t = i / steps
    let y: number

    switch (curve) {
      case "exponential":
        y = min + (max - min) * (t * t)
        break
      case "logarithmic":
        y = min + ((max - min) * Math.log(t + 1)) / Math.log(2)
        break
      default: // linear
        y = min + (max - min) * t
    }

    points.push(`${x},${100 - y * 100}`)
  }

  return `M ${points.join(" L ")}`
}
