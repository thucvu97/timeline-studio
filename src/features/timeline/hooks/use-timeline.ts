/**
 * Timeline Hook V2
 *
 * Хук для использования нового timeline с backend интеграцией
 */

import { useContext } from "react"

import { TimelineContext, TimelineContextType } from "../services/timeline-provider"

export function useTimeline(): TimelineContextType {
  const context = useContext(TimelineContext)

  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider")
  }

  return context
}

// Экспорт типов для удобства
export type { TimelineContextType } from "../services/timeline-provider"

// Legacy export для обратной совместимости
export { useTimeline as useTimelineV2 }
export type { TimelineContextType as TimelineContextTypeV2 }
