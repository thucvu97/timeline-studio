/**
 * Timeline AI Overlay - Простая заглушка
 */

import { cn } from "@/lib/utils"

interface TimelineAIOverlayProps {
  timelineWidth: number
  timelineDuration: number
  pixelsPerSecond: number
  className?: string
}

export function TimelineAIOverlay({
  timelineWidth,
  timelineDuration,
  pixelsPerSecond,
  className,
}: TimelineAIOverlayProps) {
  return (
    <div className={cn("absolute inset-x-0 h-8 pointer-events-none", className)}>
      {/* AI analysis overlay will be implemented here */}
    </div>
  )
}
