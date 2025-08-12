/**
 * Компонент отображения статистики кеша эффектов
 */

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CacheStatsDisplayProps {
  stats: {
    entries: number
    sizeMB: number
    hitRate: number
  }
  className?: string
  compact?: boolean
}

export const CacheStatsDisplay = memo(function CacheStatsDisplay({
  stats,
  className,
  compact = false,
}: CacheStatsDisplayProps) {
  const hitRatePercent = Math.round(stats.hitRate * 100)
  const hitRateColor = hitRatePercent > 80 ? "text-green-500" : hitRatePercent > 50 ? "text-yellow-500" : "text-red-500"

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <span>Cache: {stats.entries}</span>
        <span>•</span>
        <span>{stats.sizeMB.toFixed(1)}MB</span>
        <span>•</span>
        <span className={hitRateColor}>{hitRatePercent}% hit</span>
      </div>
    )
  }

  return (
    <Card className={cn("p-4", className)}>
      <h3 className="text-sm font-medium mb-3">Cache Performance</h3>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Cached Frames</span>
            <span className="font-medium">{stats.entries}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Memory Usage</span>
            <span className="font-medium">{stats.sizeMB.toFixed(1)} MB</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Hit Rate</span>
            <span className={cn("font-medium", hitRateColor)}>{hitRatePercent}%</span>
          </div>
          <Progress value={hitRatePercent} className="h-2" />
          {hitRatePercent < 50 && (
            <p className="text-xs text-muted-foreground mt-1">Low hit rate - consider prefetching frames</p>
          )}
        </div>
      </div>
    </Card>
  )
})
