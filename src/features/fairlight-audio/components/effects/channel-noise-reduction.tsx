/**
 * Channel-specific Noise Reduction Component
 * Simplified UI for channel strip integration
 */

import { useCallback, useState } from "react"

import { Mic, MicOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import type { NoiseReductionConfig } from "../../services/noise-reduction/noise-reduction-engine"

interface ChannelNoiseReductionProps {
  channelId: string
  enabled: boolean
  strength: number
  onToggle: (enabled: boolean) => void
  onStrengthChange: (strength: number) => void
  onOpenAdvanced?: () => void
}

export function ChannelNoiseReduction({
  channelId,
  enabled,
  strength,
  onToggle,
  onStrengthChange,
  onOpenAdvanced,
}: ChannelNoiseReductionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="px-2 py-1 border-t border-zinc-800">
      <div className="flex items-center justify-between">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={`h-6 px-2 ${enabled ? "text-green-400" : "text-zinc-500"}`}>
              {enabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
              <span className="ml-1 text-xs">NR</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Noise Reduction</Label>
                <Switch checked={enabled} onCheckedChange={onToggle} aria-label="Enable noise reduction" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Strength</Label>
                  <span className="text-xs text-muted-foreground">{strength}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[strength]}
                  onValueChange={([value]) => onStrengthChange(value)}
                  disabled={!enabled}
                  className="w-full"
                />
              </div>

              {onOpenAdvanced && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    setIsOpen(false)
                    onOpenAdvanced()
                  }}
                >
                  Advanced Settings
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <span className="text-xs text-zinc-500">{enabled && `${strength}%`}</span>
      </div>
    </div>
  )
}

/**
 * Inline Noise Reduction Strip
 * For integration into channel strips
 */
interface NoiseReductionStripProps {
  enabled: boolean
  config: NoiseReductionConfig
  onToggle: (enabled: boolean) => void
  onConfigChange: (config: NoiseReductionConfig) => void
}

export function NoiseReductionStrip({ enabled, config, onToggle, onConfigChange }: NoiseReductionStripProps) {
  const handleStrengthChange = useCallback(
    (strength: number) => {
      onConfigChange({
        ...config,
        strength,
      })
    },
    [config, onConfigChange],
  )

  const handlePreserveVoiceToggle = useCallback(
    (preserveVoice: boolean) => {
      onConfigChange({
        ...config,
        preserveVoice,
      })
    },
    [config, onConfigChange],
  )

  return (
    <div className="bg-zinc-900/50 rounded p-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${enabled ? "text-green-400" : "text-zinc-500"}`}
            onClick={() => onToggle(!enabled)}
          >
            {enabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
          </Button>
          <Label className="text-xs">Noise Reduction</Label>
        </div>
        <span className="text-xs text-zinc-500">{config.algorithm === "ai" ? "AI" : config.algorithm}</span>
      </div>

      {enabled && (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Strength</Label>
              <span className="text-xs text-zinc-500">{config.strength}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[config.strength]}
              onValueChange={([value]) => handleStrengthChange(value)}
              className="h-1"
            />
          </div>

          {(config.algorithm === "ai" || config.algorithm === "adaptive") && (
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Voice</Label>
              <Switch checked={config.preserveVoice} onCheckedChange={handlePreserveVoiceToggle} className="h-4 w-7" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
