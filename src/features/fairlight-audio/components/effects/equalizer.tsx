import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface EQBand {
  frequency: number
  gain: number
  q: number
  type: BiquadFilterType
}

interface EqualizerProps {
  onBandChange?: (bandIndex: number, band: EQBand) => void
  className?: string
}

const DEFAULT_BANDS: EQBand[] = [
  { frequency: 60, gain: 0, q: 0.7, type: "highshelf" },
  { frequency: 150, gain: 0, q: 0.7, type: "peaking" },
  { frequency: 400, gain: 0, q: 0.7, type: "peaking" },
  { frequency: 1000, gain: 0, q: 0.7, type: "peaking" },
  { frequency: 3000, gain: 0, q: 0.7, type: "peaking" },
  { frequency: 8000, gain: 0, q: 0.7, type: "peaking" },
  { frequency: 12000, gain: 0, q: 0.7, type: "lowshelf" },
]

function formatFrequency(freq: number): string {
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)}k`
  }
  return `${freq}`
}

export function Equalizer({ onBandChange, className }: EqualizerProps) {
  const { t } = useTranslation()
  const [bands, setBands] = useState<EQBand[]>(DEFAULT_BANDS)
  const [selectedBand, setSelectedBand] = useState<number | null>(null)

  const handleGainChange = (bandIndex: number, gain: number) => {
    const newBands = [...bands]
    newBands[bandIndex] = { ...newBands[bandIndex], gain }
    setBands(newBands)
    onBandChange?.(bandIndex, newBands[bandIndex])
  }

  const handleFrequencyChange = (bandIndex: number, frequency: number) => {
    const newBands = [...bands]
    newBands[bandIndex] = { ...newBands[bandIndex], frequency }
    setBands(newBands)
    onBandChange?.(bandIndex, newBands[bandIndex])
  }

  const handleQChange = (bandIndex: number, q: number) => {
    const newBands = [...bands]
    newBands[bandIndex] = { ...newBands[bandIndex], q }
    setBands(newBands)
    onBandChange?.(bandIndex, newBands[bandIndex])
  }

  const resetBand = (bandIndex: number) => {
    const newBands = [...bands]
    newBands[bandIndex] = { ...DEFAULT_BANDS[bandIndex] }
    setBands(newBands)
    onBandChange?.(bandIndex, newBands[bandIndex])
  }

  const resetAll = () => {
    setBands([...DEFAULT_BANDS])
    DEFAULT_BANDS.forEach((band, index) => {
      onBandChange?.(index, band)
    })
  }

  return (
    <div className={cn("bg-zinc-900 rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-300">{t("fairlightAudio.effects.equalizer.title")}</h3>
        <button onClick={resetAll} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          {t("fairlightAudio.effects.equalizer.reset")}
        </button>
      </div>

      {/* EQ Display */}
      <div className="relative h-40 bg-zinc-950 rounded mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <g className="text-zinc-800">
            {/* Horizontal lines (gain) */}
            {[-12, -6, 0, 6, 12].map((db) => {
              const y = 50 - (db / 24) * 100
              return (
                <line
                  key={db}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeDasharray={db === 0 ? "0" : "2,2"}
                />
              )
            })}
            {/* Vertical lines (frequency) */}
            {[100, 1000, 10000].map((freq, i) => {
              const x = (i + 1) * 25
              return (
                <line
                  key={freq}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              )
            })}
          </g>

          {/* EQ curve */}
          <path d={generateEQCurve(bands)} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Band points */}
          {bands.map((band, index) => {
            const x = frequencyToX(band.frequency)
            const y = gainToY(band.gain)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={selectedBand === index ? "#60a5fa" : "#3b82f6"}
                className="cursor-pointer"
                onClick={() => setSelectedBand(index)}
              />
            )
          })}
        </svg>
      </div>

      {/* Band controls */}
      <div className="grid grid-cols-7 gap-2">
        {bands.map((band, index) => (
          <div key={index} className={cn("space-y-2 p-2 rounded", selectedBand === index && "bg-zinc-800")}>
            {/* Frequency label */}
            <div className="text-xs text-center text-zinc-400 cursor-pointer" onClick={() => setSelectedBand(index)}>
              {formatFrequency(band.frequency)}
            </div>

            {/* Gain slider */}
            <div className="h-24">
              <Slider
                orientation="vertical"
                value={[band.gain]}
                onValueChange={([value]) => handleGainChange(index, value)}
                min={-12}
                max={12}
                step={0.5}
                className="h-full"
              />
            </div>

            {/* Gain value */}
            <div className="text-xs text-center text-zinc-500">
              {band.gain > 0 ? "+" : ""}
              {band.gain.toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      {/* Selected band controls */}
      {selectedBand !== null && (
        <div className="mt-4 p-3 bg-zinc-800 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              {t("fairlightAudio.effects.equalizer.band")} {selectedBand + 1} -{" "}
              {formatFrequency(bands[selectedBand].frequency)}Hz
            </span>
            <button onClick={() => resetBand(selectedBand)} className="text-xs text-zinc-500 hover:text-zinc-300">
              {t("fairlightAudio.effects.equalizer.resetBand")}
            </button>
          </div>

          {/* Frequency control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-12">{t("fairlightAudio.effects.equalizer.frequency")}</span>
            <Slider
              value={[Math.log10(bands[selectedBand].frequency)]}
              onValueChange={([value]) => handleFrequencyChange(selectedBand, 10 ** value)}
              min={Math.log10(20)}
              max={Math.log10(20000)}
              step={0.01}
              className="flex-1"
            />
            <span className="text-xs text-zinc-400 w-12 text-right">
              {formatFrequency(bands[selectedBand].frequency)}
            </span>
          </div>

          {/* Q control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-12">{t("fairlightAudio.effects.equalizer.quality")}</span>
            <Slider
              value={[bands[selectedBand].q]}
              onValueChange={([value]) => handleQChange(selectedBand, value)}
              min={0.1}
              max={10}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-zinc-400 w-12 text-right">{bands[selectedBand].q.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions for visualization
function frequencyToX(freq: number): number {
  // Logarithmic scale from 20Hz to 20kHz
  const minLog = Math.log10(20)
  const maxLog = Math.log10(20000)
  const freqLog = Math.log10(freq)
  return ((freqLog - minLog) / (maxLog - minLog)) * 100
}

function gainToY(gain: number): number {
  // Linear scale from -12dB to +12dB
  return 50 - (gain / 24) * 100
}

function generateEQCurve(bands: EQBand[]): string {
  const points: string[] = []

  // Generate curve points
  for (let x = 0; x <= 100; x += 1) {
    const freq = 10 ** ((x / 100) * (Math.log10(20000) - Math.log10(20)) + Math.log10(20))
    let totalGain = 0

    // Sum contributions from all bands
    bands.forEach((band) => {
      const distance = Math.abs(Math.log10(freq) - Math.log10(band.frequency))
      const influence = Math.exp(-distance * distance * band.q * 2)
      totalGain += band.gain * influence
    })

    const y = gainToY(totalGain)
    points.push(`${x},${y}`)
  }

  return `M ${points.join(" L ")}`
}
