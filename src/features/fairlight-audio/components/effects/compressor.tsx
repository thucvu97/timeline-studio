import { useState } from "react"

import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface CompressorProps {
  onParameterChange?: (param: keyof CompressorSettings, value: number) => void
  className?: string
}

export interface CompressorSettings {
  threshold: number // -60 to 0 dB
  ratio: number // 1:1 to 20:1
  attack: number // 0 to 100 ms
  release: number // 0 to 1000 ms
  knee: number // 0 to 40 dB
  makeup: number // 0 to 30 dB
}

const DEFAULT_SETTINGS: CompressorSettings = {
  threshold: -24,
  ratio: 4,
  attack: 10,
  release: 100,
  knee: 2.5,
  makeup: 0,
}

export function Compressor({ onParameterChange, className }: CompressorProps) {
  const [settings, setSettings] = useState<CompressorSettings>(DEFAULT_SETTINGS)
  const [gainReduction] = useState(0) // TODO: connect to actual gain reduction from processor

  const handleParameterChange = (param: keyof CompressorSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [param]: value }))
    onParameterChange?.(param, value)
  }

  const reset = () => {
    setSettings(DEFAULT_SETTINGS)
    Object.entries(DEFAULT_SETTINGS).forEach(([param, value]) => {
      onParameterChange?.(param as keyof CompressorSettings, value)
    })
  }

  const formatRatio = (ratio: number) => {
    if (ratio >= 20) return "∞:1"
    return `${ratio}:1`
  }

  return (
    <div className={cn("bg-zinc-900 rounded-lg p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">Compressor</h3>
        <button onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          Reset
        </button>
      </div>

      {/* Visual Display */}
      <div className="relative h-32 bg-zinc-950 rounded">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid */}
          <g className="text-zinc-800">
            {/* Horizontal lines (output) */}
            {[0, -10, -20, -30, -40, -50, -60].map((db) => {
              const y = ((60 + db) / 60) * 100
              return (
                <line
                  key={db}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeDasharray={db === 0 ? "0" : "1,1"}
                />
              )
            })}
            {/* Vertical lines (input) */}
            {[0, -10, -20, -30, -40, -50, -60].map((db) => {
              const x = ((60 + db) / 60) * 100
              return (
                <line
                  key={db}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeDasharray={db === 0 ? "0" : "1,1"}
                />
              )
            })}
          </g>

          {/* Unity gain line */}
          <line x1="0" y1="100" x2="100" y2="0" stroke="#52525b" strokeWidth="1" strokeDasharray="2,2" />

          {/* Compression curve */}
          <path d={generateCompressionCurve(settings)} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Threshold line */}
          <line
            x1={((60 + settings.threshold) / 60) * 100}
            y1="0"
            x2={((60 + settings.threshold) / 60) * 100}
            y2="100"
            stroke="#ef4444"
            strokeWidth="1"
          />
        </svg>

        {/* Gain reduction meter */}
        <div className="absolute right-2 top-2 bottom-2 w-2 bg-zinc-800 rounded">
          <div
            className="absolute bottom-0 left-0 right-0 bg-orange-500 rounded transition-all duration-75"
            style={{ height: `${(gainReduction / 30) * 100}%` }}
          />
        </div>

        {/* GR label */}
        <div className="absolute right-1 bottom-1 text-xs text-zinc-500">GR</div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Threshold */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Threshold</span>
            <span className="text-zinc-500">{settings.threshold.toFixed(1)} dB</span>
          </div>
          <Slider
            value={[settings.threshold]}
            onValueChange={([value]) => handleParameterChange("threshold", value)}
            min={-60}
            max={0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Ratio */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Ratio</span>
            <span className="text-zinc-500">{formatRatio(settings.ratio)}</span>
          </div>
          <Slider
            value={[settings.ratio]}
            onValueChange={([value]) => handleParameterChange("ratio", value)}
            min={1}
            max={20}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Attack */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Attack</span>
            <span className="text-zinc-500">{settings.attack.toFixed(1)} ms</span>
          </div>
          <Slider
            value={[settings.attack]}
            onValueChange={([value]) => handleParameterChange("attack", value)}
            min={0}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Release */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Release</span>
            <span className="text-zinc-500">{settings.release.toFixed(0)} ms</span>
          </div>
          <Slider
            value={[settings.release]}
            onValueChange={([value]) => handleParameterChange("release", value)}
            min={0}
            max={1000}
            step={1}
            className="w-full"
          />
        </div>

        {/* Knee */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Knee</span>
            <span className="text-zinc-500">{settings.knee.toFixed(1)} dB</span>
          </div>
          <Slider
            value={[settings.knee]}
            onValueChange={([value]) => handleParameterChange("knee", value)}
            min={0}
            max={40}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Makeup Gain */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Makeup</span>
            <span className="text-zinc-500">{settings.makeup.toFixed(1)} dB</span>
          </div>
          <Slider
            value={[settings.makeup]}
            onValueChange={([value]) => handleParameterChange("makeup", value)}
            min={0}
            max={30}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        <button
          onClick={() => applyPreset("gentle")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          Gentle
        </button>
        <button
          onClick={() => applyPreset("vocal")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          Vocal
        </button>
        <button
          onClick={() => applyPreset("drums")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          Drums
        </button>
        <button
          onClick={() => applyPreset("master")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          Master
        </button>
      </div>
    </div>
  )

  function applyPreset(preset: string) {
    let newSettings: CompressorSettings

    switch (preset) {
      case "gentle":
        newSettings = {
          threshold: -20,
          ratio: 2,
          attack: 10,
          release: 100,
          knee: 10,
          makeup: 2,
        }
        break
      case "vocal":
        newSettings = {
          threshold: -15,
          ratio: 3,
          attack: 5,
          release: 50,
          knee: 5,
          makeup: 3,
        }
        break
      case "drums":
        newSettings = {
          threshold: -10,
          ratio: 6,
          attack: 1,
          release: 100,
          knee: 0,
          makeup: 5,
        }
        break
      case "master":
        newSettings = {
          threshold: -12,
          ratio: 2.5,
          attack: 30,
          release: 300,
          knee: 20,
          makeup: 1,
        }
        break
      default:
        newSettings = DEFAULT_SETTINGS
    }

    setSettings(newSettings)
    Object.entries(newSettings).forEach(([param, value]) => {
      onParameterChange?.(param as keyof CompressorSettings, value)
    })
  }
}

function generateCompressionCurve(settings: CompressorSettings): string {
  const points: string[] = []
  const { threshold, ratio, knee, makeup } = settings

  for (let inputDb = -60; inputDb <= 0; inputDb += 1) {
    let outputDb: number

    if (inputDb < threshold - knee / 2) {
      // Below knee - no compression
      outputDb = inputDb
    } else if (inputDb > threshold + knee / 2) {
      // Above knee - full compression
      const excess = inputDb - threshold
      outputDb = threshold + excess / ratio
    } else {
      // In knee - smooth transition
      const kneeProgress = (inputDb - (threshold - knee / 2)) / knee
      const compressionAmount = kneeProgress * kneeProgress
      const excess = inputDb - threshold
      outputDb = inputDb - excess * compressionAmount * (1 - 1 / ratio)
    }

    // Apply makeup gain
    outputDb += makeup

    // Convert to coordinates
    const x = ((60 + inputDb) / 60) * 100
    const y = ((60 - outputDb) / 60) * 100

    points.push(`${x},${Math.max(0, Math.min(100, y))}`)
  }

  return `M ${points.join(" L ")}`
}
