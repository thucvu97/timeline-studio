/**
 * Индикаторы примененных ресурсов на клипах
 */

import { Filter, Sparkles, Zap } from "lucide-react"
import { memo } from "react"

import { cn } from "@/lib/utils"

import type { TimelineClip } from "../../types"

interface ClipResourceIndicatorsProps {
  clip: TimelineClip
  className?: string
  showLabels?: boolean
}

export const ClipResourceIndicators = memo(function ClipResourceIndicators({
  clip,
  className,
  showLabels = false,
}: ClipResourceIndicatorsProps) {
  const hasEffects = clip.effects && clip.effects.length > 0
  const hasFilters = clip.filters && clip.filters.length > 0
  const hasTransitions = clip.transitions && clip.transitions.length > 0

  // Если нет ни одного ресурса, не отображаем индикаторы
  if (!hasEffects && !hasFilters && !hasTransitions) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Индикатор эффектов */}
      {hasEffects && (
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
            "bg-purple-500/20 text-purple-300 text-xs font-medium",
          )}
          title={`${clip.effects.length} эффект${clip.effects.length === 1 ? "" : clip.effects.length < 5 ? "а" : "ов"}`}
        >
          <Zap className="w-3 h-3" />
          {showLabels && <span>FX</span>}
          <span>{clip.effects.length}</span>
        </div>
      )}

      {/* Индикатор фильтров */}
      {hasFilters && (
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
            "bg-blue-500/20 text-blue-300 text-xs font-medium",
          )}
          title={`${clip.filters.length} фильтр${clip.filters.length === 1 ? "" : clip.filters.length < 5 ? "а" : "ов"}`}
        >
          <Filter className="w-3 h-3" />
          {showLabels && <span>FL</span>}
          <span>{clip.filters.length}</span>
        </div>
      )}

      {/* Индикатор переходов */}
      {hasTransitions && (
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
            "bg-green-500/20 text-green-300 text-xs font-medium",
          )}
          title={`${clip.transitions.length} переход${clip.transitions.length === 1 ? "" : clip.transitions.length < 5 ? "а" : "ов"}`}
        >
          <Sparkles className="w-3 h-3" />
          {showLabels && <span>TR</span>}
          <span>{clip.transitions.length}</span>
        </div>
      )}
    </div>
  )
})

// Компонент для отображения детальной информации о ресурсах
interface ClipResourceTooltipProps {
  clip: TimelineClip
}

export const ClipResourceTooltip = memo(function ClipResourceTooltip({ clip }: ClipResourceTooltipProps) {
  const hasAnyResources =
    (clip.effects && clip.effects.length > 0) ||
    (clip.filters && clip.filters.length > 0) ||
    (clip.transitions && clip.transitions.length > 0)

  if (!hasAnyResources) return null

  return (
    <div className="space-y-2">
      {/* Эффекты */}
      {clip.effects && clip.effects.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-purple-300 text-sm font-medium mb-1">
            <Zap className="w-3 h-3" />
            Эффекты ({clip.effects.length})
          </div>
          <div className="space-y-1 pl-4">
            {clip.effects.slice(0, 3).map((effect) => (
              <div key={effect.id} className="text-xs text-muted-foreground">
                • {effect.effectId} {!effect.enabled && "(отключен)"}
              </div>
            ))}
            {clip.effects.length > 3 && (
              <div className="text-xs text-muted-foreground">... и еще {clip.effects.length - 3}</div>
            )}
          </div>
        </div>
      )}

      {/* Фильтры */}
      {clip.filters && clip.filters.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-blue-300 text-sm font-medium mb-1">
            <Filter className="w-3 h-3" />
            Фильтры ({clip.filters.length})
          </div>
          <div className="space-y-1 pl-4">
            {clip.filters.slice(0, 3).map((filter) => (
              <div key={filter.id} className="text-xs text-muted-foreground">
                • {filter.filterId} {!filter.isEnabled && "(отключен)"}
              </div>
            ))}
            {clip.filters.length > 3 && (
              <div className="text-xs text-muted-foreground">... и еще {clip.filters.length - 3}</div>
            )}
          </div>
        </div>
      )}

      {/* Переходы */}
      {clip.transitions && clip.transitions.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-green-300 text-sm font-medium mb-1">
            <Sparkles className="w-3 h-3" />
            Переходы ({clip.transitions.length})
          </div>
          <div className="space-y-1 pl-4">
            {clip.transitions.slice(0, 3).map((transition) => (
              <div key={transition.id} className="text-xs text-muted-foreground">
                • {transition.transitionId} ({transition.type}) {!transition.isEnabled && "(отключен)"}
              </div>
            ))}
            {clip.transitions.length > 3 && (
              <div className="text-xs text-muted-foreground">... и еще {clip.transitions.length - 3}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
