import { useContext } from "react"

import { TimelineContext, TimelineContextType } from "../services/timeline-provider"

export function useTimeline(): TimelineContextType {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider")
  }
  return context
}
