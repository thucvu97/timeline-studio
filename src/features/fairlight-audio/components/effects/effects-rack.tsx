import { useState } from "react"

import { ChevronDown, ChevronRight, GripVertical, Plus, Power, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { Compressor } from "./compressor"
import { Equalizer } from "./equalizer"
import { Reverb } from "./reverb"

export type EffectType = "equalizer" | "compressor" | "reverb"

export interface Effect {
  id: string
  type: EffectType
  enabled: boolean
  expanded: boolean
}

interface EffectsRackProps {
  channelId: string
  onEffectAdd?: (effect: Effect) => void
  onEffectRemove?: (effectId: string) => void
  onEffectToggle?: (effectId: string, enabled: boolean) => void
  onEffectParameterChange?: (effectId: string, param: string, value: number) => void
  className?: string
}

const AVAILABLE_EFFECTS: { type: EffectType; label: string }[] = [
  { type: "equalizer", label: "EQ" },
  { type: "compressor", label: "Compressor" },
  { type: "reverb", label: "Reverb" },
]

export function EffectsRack({
  channelId,
  onEffectAdd,
  onEffectRemove,
  onEffectToggle,
  onEffectParameterChange,
  className,
}: EffectsRackProps) {
  const [effects, setEffects] = useState<Effect[]>([])
  const [showAddMenu, setShowAddMenu] = useState(false)

  const addEffect = (type: EffectType) => {
    const newEffect: Effect = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      expanded: true,
    }

    setEffects([...effects, newEffect])
    onEffectAdd?.(newEffect)
    setShowAddMenu(false)
  }

  const removeEffect = (effectId: string) => {
    setEffects(effects.filter((e) => e.id !== effectId))
    onEffectRemove?.(effectId)
  }

  const toggleEffect = (effectId: string) => {
    setEffects(effects.map((e) => (e.id === effectId ? { ...e, enabled: !e.enabled } : e)))
    const effect = effects.find((e) => e.id === effectId)
    if (effect) {
      onEffectToggle?.(effectId, !effect.enabled)
    }
  }

  const toggleExpanded = (effectId: string) => {
    setEffects(effects.map((e) => (e.id === effectId ? { ...e, expanded: !e.expanded } : e)))
  }

  const renderEffect = (effect: Effect) => {
    const handleParameterChange = (param: string, value: number) => {
      onEffectParameterChange?.(effect.id, param, value)
    }

    const effectContent = () => {
      switch (effect.type) {
        case "equalizer":
          return (
            <Equalizer
              onBandChange={(index, band) => {
                handleParameterChange(`band-${index}`, band.gain)
              }}
            />
          )
        case "compressor":
          return <Compressor onParameterChange={handleParameterChange} />
        case "reverb":
          return <Reverb onParameterChange={handleParameterChange} />
        default:
          return null
      }
    }

    return (
      <div
        key={effect.id}
        className={cn("bg-zinc-800 rounded-lg overflow-hidden transition-opacity", !effect.enabled && "opacity-50")}
      >
        {/* Effect Header */}
        <div className="flex items-center gap-2 p-2 border-b border-zinc-700">
          <button className="cursor-move text-zinc-500 hover:text-zinc-300">
            <GripVertical className="w-4 h-4" />
          </button>

          <button onClick={() => toggleExpanded(effect.id)} className="text-zinc-400 hover:text-zinc-200">
            {effect.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <span className="text-sm font-medium text-zinc-300 flex-1">
            {AVAILABLE_EFFECTS.find((e) => e.type === effect.type)?.label}
          </span>

          <button
            onClick={() => toggleEffect(effect.id)}
            className={cn(
              "p-1 rounded transition-colors",
              effect.enabled ? "text-blue-400 hover:text-blue-300" : "text-zinc-600 hover:text-zinc-400",
            )}
          >
            <Power className="w-4 h-4" />
          </button>

          <button
            onClick={() => removeEffect(effect.id)}
            className="text-zinc-500 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Effect Content */}
        {effect.expanded && (
          <div className={cn("transition-all", !effect.enabled && "pointer-events-none")}>{effectContent()}</div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-zinc-400">Effects</h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Effect
          </button>

          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 py-1 z-20 min-w-[120px]">
                {AVAILABLE_EFFECTS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => addEffect(type)}
                    className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Effects List */}
      {effects.length === 0 ? (
        <div className="text-center py-8 text-zinc-600 text-sm">No effects added</div>
      ) : (
        <div className="space-y-2">{effects.map(renderEffect)}</div>
      )}
    </div>
  )
}
